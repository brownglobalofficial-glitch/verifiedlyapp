import { createClient } from 'npm:@supabase/supabase-js@2.57.2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Sends a Tap Card status email to the order owner via send-transactional-email.
// verify_jwt = true (Supabase gateway checks caller session). We additionally
// require the caller to have the admin role in user_roles.

type Stage = 'paid' | 'shipped' | 'delivered' | 'activated'

const j = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return j({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return j({ error: 'Server not configured' }, 500)

  const authHeader = req.headers.get('Authorization') || ''
  const jwt = authHeader.replace(/^Bearer\s+/i, '')
  if (!jwt) return j({ error: 'Missing auth' }, 401)

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // Identify caller
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt)
  if (userErr || !userData?.user) return j({ error: 'Invalid session' }, 401)

  // Admin gate
  const { data: roles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .eq('role', 'admin')
    .limit(1)
  if (!roles?.length) return j({ error: 'Forbidden' }, 403)

  let body: any = {}
  try { body = await req.json() } catch { return j({ error: 'Invalid JSON' }, 400) }
  const orderId: string | undefined = body.order_id
  const stage: Stage | undefined = body.stage
  if (!orderId || !stage) return j({ error: 'order_id and stage required' }, 400)
  if (!['paid', 'shipped', 'delivered', 'activated'].includes(stage)) {
    return j({ error: 'Invalid stage' }, 400)
  }

  // Load order + card + owner
  const { data: order, error: oErr } = await admin
    .from('verifiedly_tap_card_orders')
    .select('id, user_id, card_id, printed_name, tracking_number, tracking_url')
    .eq('id', orderId)
    .maybeSingle()
  if (oErr || !order) return j({ error: 'Order not found' }, 404)

  const [{ data: card }, { data: profile }, { data: authUser }] = await Promise.all([
    admin.from('verifiedly_tap_cards').select('card_serial, public_token').eq('id', order.card_id).maybeSingle(),
    admin.from('profiles').select('username, display_name').eq('id', order.user_id).maybeSingle(),
    admin.auth.admin.getUserById(order.user_id),
  ])
  const recipient = authUser?.user?.email
  if (!recipient) return j({ error: 'Recipient email not found' }, 422)

  const profileUrl = profile?.username ? `https://verifiedly.app/${profile.username}` : 'https://verifiedly.app'

  const templateData = {
    recipient,
    recipientName: order.printed_name || profile?.display_name || '',
    stage,
    orderId: order.id,
    cardSerial: card?.card_serial || null,
    trackingNumber: order.tracking_number || null,
    trackingUrl: order.tracking_url || null,
    profileUrl,
  }

  const { data: sendResult, error: sendErr } = await admin.functions.invoke('send-transactional-email', {
    body: {
      templateName: 'tap-order-status',
      recipientEmail: recipient,
      idempotencyKey: `tap-order-${orderId}-${stage}`,
      templateData,
    },
  })
  if (sendErr) {
    console.error('[notify-tap-order-status] send error', sendErr)
    return j({ error: sendErr.message || 'Failed to send email' }, 500)
  }
  return j({ ok: true, result: sendResult })
})