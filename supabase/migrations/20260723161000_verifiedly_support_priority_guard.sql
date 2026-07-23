-- Users cannot self-assign priority support or write administrative fields.

alter table public.verifiedly_support_tickets
  add constraint verifiedly_support_subject_length_check
    check (char_length(trim(subject)) between 1 and 120),
  add constraint verifiedly_support_message_length_check
    check (char_length(trim(message)) between 1 and 4000),
  add constraint verifiedly_support_category_check
    check (category in ('account', 'verification', 'subscription', 'oauth', 'tap_card', 'privacy', 'general'));

create or replace function public.enforce_verifiedly_support_ticket_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_pro boolean := false;
begin
  if auth.uid() is not null and new.user_id <> auth.uid() then
    raise exception 'A support ticket can only be created for the signed-in account';
  end if;

  select (
    coalesce(b.pro_status in ('active', 'trialing'), false)
    or coalesce(p.is_pro, false)
    or p.comp_tier in ('pro', 'elite')
  ) into v_is_pro
  from public.profiles p
  left join public.verifiedly_billing b on b.user_id = p.id
  where p.id = new.user_id;

  new.priority := case when coalesce(v_is_pro, false) then 'priority' else 'standard' end;
  new.status := 'open';
  new.admin_response := null;
  new.responded_at := null;
  new.subject := trim(new.subject);
  new.message := trim(new.message);
  return new;
end;
$$;

drop trigger if exists verifiedly_support_ticket_insert_guard on public.verifiedly_support_tickets;
create trigger verifiedly_support_ticket_insert_guard
before insert on public.verifiedly_support_tickets
for each row execute function public.enforce_verifiedly_support_ticket_insert();
