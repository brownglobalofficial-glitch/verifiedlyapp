-- Manual, one-at-a-time PVC Verifiedly Tap Card fulfillment.
-- Customer-approved print fields are snapshotted after Stripe confirms payment.

alter table public.verifiedly_tap_card_orders
  add column if not exists printed_name text,
  add column if not exists printed_title text,
  add column if not exists printed_handle text,
  add column if not exists template_version text not null default 'verifiedly-pvc-v1',
  add column if not exists preview_approved_at timestamptz,
  add column if not exists admin_notes text,
  add column if not exists submitted_at timestamptz,
  add column if not exists production_started_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz;

create or replace function public.verifiedly_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.verifiedly_is_admin() from public;
grant execute on function public.verifiedly_is_admin() to authenticated;

drop policy if exists "Admins can read all tap cards" on public.verifiedly_tap_cards;
create policy "Admins can read all tap cards"
on public.verifiedly_tap_cards for select
to authenticated
using (public.verifiedly_is_admin());

drop policy if exists "Admins can read all tap card orders" on public.verifiedly_tap_card_orders;
create policy "Admins can read all tap card orders"
on public.verifiedly_tap_card_orders for select
to authenticated
using (public.verifiedly_is_admin());

-- Replace the original service-role recording function with a version that
-- permanently stores the exact customer-approved print copy.
drop function if exists public.record_verifiedly_tap_card_order(
  uuid, text, text, integer, text, text, text, text, jsonb
);

create or replace function public.record_verifiedly_tap_card_order(
  p_user_id uuid,
  p_material text,
  p_order_source text,
  p_amount_cents integer,
  p_currency text,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_shipping_name text,
  p_shipping_address jsonb,
  p_printed_name text,
  p_printed_title text,
  p_printed_handle text,
  p_template_version text,
  p_preview_approved_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_order uuid;
  v_card_id uuid;
  v_order_id uuid;
  v_source text := p_order_source;
  v_credit boolean := false;
begin
  select id into v_existing_order
  from public.verifiedly_tap_card_orders
  where stripe_checkout_session_id = p_checkout_session_id;

  if found then
    return jsonb_build_object('order_id', v_existing_order, 'duplicate', true);
  end if;

  if p_material <> 'pvc' then
    raise exception 'Only PVC Tap Cards are available in the initial program';
  end if;
  if length(trim(coalesce(p_printed_name, ''))) < 2 or length(trim(p_printed_name)) > 40 then
    raise exception 'Printed name is invalid';
  end if;
  if length(trim(coalesce(p_printed_title, ''))) < 2 or length(trim(p_printed_title)) > 60 then
    raise exception 'Printed title is invalid';
  end if;
  if length(trim(coalesce(p_printed_handle, ''))) < 2 or length(trim(p_printed_handle)) > 40 then
    raise exception 'Printed handle is invalid';
  end if;
  if p_preview_approved_at is null then
    raise exception 'Card preview approval is required';
  end if;

  if p_order_source = 'annual_included' then
    select annual_card_credit_available into v_credit
    from public.verifiedly_billing
    where user_id = p_user_id
    for update;

    if coalesce(v_credit, false) then
      update public.verifiedly_billing
        set annual_card_credit_available = false,
            updated_at = now()
      where user_id = p_user_id;
    else
      v_source := 'manual_review_credit_conflict';
    end if;
  end if;

  insert into public.verifiedly_tap_cards(user_id, material, status)
  values (
    p_user_id,
    'pvc',
    case when v_source = 'manual_review_credit_conflict' then 'manual_review' else 'ordered' end
  )
  returning id into v_card_id;

  insert into public.verifiedly_tap_card_orders(
    user_id,
    card_id,
    material,
    order_source,
    status,
    amount_cents,
    currency,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    shipping_name,
    shipping_address,
    printed_name,
    printed_title,
    printed_handle,
    template_version,
    preview_approved_at
  ) values (
    p_user_id,
    v_card_id,
    'pvc',
    v_source,
    case when v_source = 'manual_review_credit_conflict' then 'manual_review' else 'paid' end,
    greatest(p_amount_cents, 0),
    coalesce(nullif(lower(p_currency), ''), 'usd'),
    p_checkout_session_id,
    p_payment_intent_id,
    nullif(trim(p_shipping_name), ''),
    coalesce(p_shipping_address, '{}'::jsonb),
    trim(p_printed_name),
    trim(p_printed_title),
    lower(trim(p_printed_handle)),
    coalesce(nullif(trim(p_template_version), ''), 'verifiedly-pvc-v1'),
    p_preview_approved_at
  ) returning id into v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'card_id', v_card_id,
    'order_source', v_source,
    'duplicate', false
  );
end;
$$;

revoke all on function public.record_verifiedly_tap_card_order(
  uuid, text, text, integer, text, text, text, text, jsonb, text, text, text, text, timestamptz
) from public;
grant execute on function public.record_verifiedly_tap_card_order(
  uuid, text, text, integer, text, text, text, text, jsonb, text, text, text, text, timestamptz
) to service_role;

create or replace function public.admin_update_verifiedly_tap_card_order(
  p_order_id uuid,
  p_status text,
  p_fulfillment_provider text default null,
  p_fulfillment_order_id text default null,
  p_tracking_number text default null,
  p_tracking_url text default null,
  p_admin_notes text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card_id uuid;
  v_card_status text;
begin
  if not public.verifiedly_is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_status not in ('paid', 'manual_review', 'submitted', 'production', 'shipped', 'delivered', 'canceled', 'refunded') then
    raise exception 'Unsupported order status';
  end if;

  select card_id into v_card_id
  from public.verifiedly_tap_card_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  update public.verifiedly_tap_card_orders
  set status = p_status,
      fulfillment_provider = nullif(trim(coalesce(p_fulfillment_provider, '')), ''),
      fulfillment_order_id = nullif(trim(coalesce(p_fulfillment_order_id, '')), ''),
      tracking_number = nullif(trim(coalesce(p_tracking_number, '')), ''),
      tracking_url = nullif(trim(coalesce(p_tracking_url, '')), ''),
      admin_notes = nullif(trim(coalesce(p_admin_notes, '')), ''),
      submitted_at = case when p_status = 'submitted' then coalesce(submitted_at, now()) else submitted_at end,
      production_started_at = case when p_status = 'production' then coalesce(production_started_at, now()) else production_started_at end,
      shipped_at = case when p_status = 'shipped' then coalesce(shipped_at, now()) else shipped_at end,
      delivered_at = case when p_status = 'delivered' then coalesce(delivered_at, now()) else delivered_at end
  where id = p_order_id;

  v_card_status := case p_status
    when 'manual_review' then 'manual_review'
    when 'production' then 'production'
    when 'shipped' then 'shipped'
    when 'delivered' then 'delivered'
    when 'canceled' then 'canceled'
    when 'refunded' then 'canceled'
    else 'ordered'
  end;

  update public.verifiedly_tap_cards
  set status = v_card_status,
      manufacturer = nullif(trim(coalesce(p_fulfillment_provider, '')), ''),
      manufacturer_order_id = nullif(trim(coalesce(p_fulfillment_order_id, '')), ''),
      tracking_number = nullif(trim(coalesce(p_tracking_number, '')), ''),
      tracking_url = nullif(trim(coalesce(p_tracking_url, '')), '')
  where id = v_card_id;

  return p_status;
end;
$$;

revoke all on function public.admin_update_verifiedly_tap_card_order(uuid, text, text, text, text, text, text) from public;
grant execute on function public.admin_update_verifiedly_tap_card_order(uuid, text, text, text, text, text, text) to authenticated;
