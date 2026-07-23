-- Keep the standard OpenID Connect profile claims aligned with the user's
-- official Verifiedly profile. Product-specific and sensitive fields are never
-- copied into auth metadata.

create or replace function public.sync_verifiedly_oidc_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
  set raw_user_meta_data =
    (
      coalesce(raw_user_meta_data, '{}'::jsonb)
      - 'username'
      - 'preferred_username'
      - 'display_name'
      - 'full_name'
      - 'name'
      - 'avatar_url'
      - 'picture'
      - 'account_type'
    )
    || jsonb_strip_nulls(jsonb_build_object(
      'username', new.username,
      'preferred_username', new.username,
      'display_name', new.display_name,
      'full_name', new.display_name,
      'name', new.display_name,
      'avatar_url', new.avatar_url,
      'picture', new.avatar_url,
      'account_type', new.account_type
    ))
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists profiles_sync_verifiedly_oidc_metadata on public.profiles;

create trigger profiles_sync_verifiedly_oidc_metadata
after insert or update of username, display_name, avatar_url, account_type
on public.profiles
for each row
execute function public.sync_verifiedly_oidc_metadata();

-- Backfill existing profiles so returning users receive current profile claims
-- the next time an OAuth/OIDC token is issued.
update auth.users as users
set raw_user_meta_data =
  (
    coalesce(users.raw_user_meta_data, '{}'::jsonb)
    - 'username'
    - 'preferred_username'
    - 'display_name'
    - 'full_name'
    - 'name'
    - 'avatar_url'
    - 'picture'
    - 'account_type'
  )
  || jsonb_strip_nulls(jsonb_build_object(
    'username', profiles.username,
    'preferred_username', profiles.username,
    'display_name', profiles.display_name,
    'full_name', profiles.display_name,
    'name', profiles.display_name,
    'avatar_url', profiles.avatar_url,
    'picture', profiles.avatar_url,
    'account_type', profiles.account_type
  ))
from public.profiles as profiles
where users.id = profiles.id;
