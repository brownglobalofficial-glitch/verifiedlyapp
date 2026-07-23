-- Verifiedly Pro, non-payment NFC tap cards, and support workflows.
-- The physical card only opens a public Verifiedly profile. It is not a
-- payment card, government ID, or standalone proof of identity.

alter table public.verifiedly_billing
  add column if not exists pro_subscription_id text,
  add column if not exists pro_status text not null default 'inactive',
  add column if not exists pro_interval text,
  add column if not exists pro_current_period_end timestamptz,
  add column if not exists pro_cancel_at_period_end boolean not null default false,
  add column if not exists pro_started_at timestamptz,
  add column if not exists annual_card_credit_available boolean not null default false,
  add column if not exists annual_card_credit_granted_at timestamptz;

create table if not exists public.verifiedly_tap_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  public_token text not null unique default lower(encode(gen_random_bytes(12), 'hex')),
  card_serial text not null unique default ('VLY-' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 12))),
  material text not null default 'pvc',
  status text not null default 'ordered',
  tap_count bigint not null default 0,
  last_tapped_at timestamptz,
  activated_at timestamptz,
  disabled_at timestamptz,
  manufacturer text,
  manufacturer_order_id text,
  tracking_number text,
  tracking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verifiedly_tap_cards_material_check check (material in ('pvc', 'metal')),
  constraint verifiedly_tap_cards_status_check check (status in ('ordered', 'manual_review', 'production', 'shipped', 'delivered', 'active', 'lost', 'disabled', 'replaced', 'canceled'))
);

create table if not exists public.verifiedly_tap_card_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.verifiedly_tap_cards(id) on delete cascade,
  material text not null,
  order_source text not null,
  status text not null default 'paid',
  amount_cents integer not null default 0,
  currency text not null default 'usd',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  shipping_name text,
  shipping_address jsonb,
  fulfillment_provider text,
  fulfillment_order_id text,
  tracking_number text,
  tracking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verifiedly_tap_card_orders_material_check check (material in ('pvc', 'metal')),
  constraint verifiedly_tap_card_orders_status_check check (status in ('awaiting_payment', 'paid', 'manual_review', 'submitted', 'production', 'shipped', 'delivered', 'canceled', 'refunded'))
);

create table if not exists public.verifiedly_support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'general',
  subject text not null,
  message text not null,
  priority text not null default 'standard',
  status text not null default 'open',
  admin_response text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verifiedly_support_priority_check check (priority in ('standard', 'priority')),
  constraint verifiedly_support_status_check check (status in ('open', 'in_progress', 'waiting_on_user', 'resolved', 'closed'))
);

create index if not exists verifiedly_tap_cards_user_id_idx on public.verifiedly_tap_cards(user_id);
create index if not exists verifiedly_tap_card_orders_user_id_idx on public.verifiedly_tap_card_orders(user_id);
create index if not exists verifiedly_support_tickets_user_id_idx on public.verifiedly_support_tickets(user_id);

create or replace function public.verifiedly_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists verifiedly_tap_cards_set_updated_at on public.verifiedly_tap_cards;
create trigger verifiedly_tap_cards_set_updated_at
before update on public.verifiedly_tap_cards
for each row execute function public.verifiedly_set_updated_at();

drop trigger if exists verifiedly_tap_card_orders_set_updated_at on public.verifiedly_tap_card_orders;
create trigger verifiedly_tap_card_orders_set_updated_at
before update on public.verifiedly_tap_card_orders
for each row execute function public.verifiedly_set_updated_at();

drop trigger if exists verifiedly_support_tickets_set_updated_at on public.verifiedly_support_tickets;
create trigger verifiedly_support_tickets_set_updated_at
before update on public.verifiedly_support_tickets
for each row execute function public.verifiedly_set_updated_at();

alter table public.verifiedly_tap_cards enable row level security;
alter table public.verifiedly_tap_card_orders enable row level security;
alter table public.verifiedly_support_tickets enable row level security;

drop policy if exists "Users can read their tap cards" on public.verifiedly_tap_cards;
create policy "Users can read their tap cards"
on public.verifiedly_tap_cards for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their tap card orders" on public.verifiedly_tap_card_orders;
create policy "Users can read their tap card orders"
on public.verifiedly_tap_card_orders for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their support tickets" on public.verifiedly_support_tickets;
create policy "Users can read their support tickets"
on public.verifiedly_support_tickets for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create support tickets" on public.verifiedly_support_tickets;
create policy "Users can create support tickets"
on public.verifiedly_support_tickets for insert
to authenticated
with check (auth.uid() = user_id);

-- Public resolver used by /t/:token. It returns only public routing data and
-- stores an aggregate count, not an IP address or a raw device fingerprint.
create or replace function public.resolve_verifiedly_tap_card(
  p_token text,
  p_source text default 'unknown'
)
returns table (
  profile_username text,
  profile_display_name text,
  card_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card public.verifiedly_tap_cards%rowtype;
  v_username text;
  v_display_name text;
begin
  select * into v_card
  from public.verifiedly_tap_cards
  where public_token = lower(trim(p_token))
  limit 1;

  if not found then
    return query select null::text, null::text, 'not_found'::text;
    return;
  end if;

  select username, display_name
    into v_username, v_display_name
  from public.profiles
  where id = v_card.user_id;

  if v_card.status = 'active' then
    update public.verifiedly_tap_cards
      set tap_count = tap_count + 1,
          last_tapped_at = now()
    where id = v_card.id;
  end if;

  return query select v_username, v_display_name, v_card.status;
end;
$$;

revoke all on function public.resolve_verifiedly_tap_card(text, text) from public;
grant execute on function public.resolve_verifiedly_tap_card(text, text) to anon, authenticated;

create or replace function public.manage_verifiedly_tap_card(
  p_card_id uuid,
  p_action text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select status into v_status
  from public.verifiedly_tap_cards
  where id = p_card_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Card not found';
  end if;

  if p_action = 'activate' then
    if v_status not in ('ordered', 'production', 'shipped', 'delivered', 'disabled') then
      raise exception 'This card cannot be activated from its current status';
    end if;
    update public.verifiedly_tap_cards
      set status = 'active', activated_at = coalesce(activated_at, now()), disabled_at = null
    where id = p_card_id;
    return 'active';
  elsif p_action = 'lost' then
    update public.verifiedly_tap_cards
      set status = 'lost', disabled_at = now()
    where id = p_card_id;
    return 'lost';
  elsif p_action = 'disable' then
    update public.verifiedly_tap_cards
      set status = 'disabled', disabled_at = now()
    where id = p_card_id;
    return 'disabled';
  else
    raise exception 'Unsupported card action';
  end if;
end;
$$;

revoke all on function public.manage_verifiedly_tap_card(uuid, text) from public;
grant execute on function public.manage_verifiedly_tap_card(uuid, text) to authenticated;

-- Called only by the Stripe webhook through the service role. It creates the
-- order and card atomically and consumes an annual-plan card credit once.
create or replace function public.record_verifiedly_tap_card_order(
  p_user_id uuid,
  p_material text,
  p_order_source text,
  p_amount_cents integer,
  p_currency text,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_shipping_name text,
  p_shipping_address jsonb
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

  if p_material not in ('pvc', 'metal') then
    raise exception 'Unsupported card material';
  end if;

  if p_order_source in ('annual_included', 'annual_metal_upgrade') then
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
    p_material,
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
    shipping_address
  ) values (
    p_user_id,
    v_card_id,
    p_material,
    v_source,
    case when v_source = 'manual_review_credit_conflict' then 'manual_review' else 'paid' end,
    greatest(p_amount_cents, 0),
    coalesce(nullif(lower(p_currency), ''), 'usd'),
    p_checkout_session_id,
    p_payment_intent_id,
    nullif(trim(p_shipping_name), ''),
    p_shipping_address
  ) returning id into v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'card_id', v_card_id,
    'order_source', v_source,
    'duplicate', false
  );
end;
$$;

revoke all on function public.record_verifiedly_tap_card_order(uuid, text, text, integer, text, text, text, text, jsonb) from public;
grant execute on function public.record_verifiedly_tap_card_order(uuid, text, text, integer, text, text, text, text, jsonb) to service_role;
