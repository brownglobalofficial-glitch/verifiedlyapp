
-- Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id uuid;
  v_existing uuid;
BEGIN
  SELECT id INTO v_existing FROM auth.users WHERE email = 'support@verifiedly.app';

  IF v_existing IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'support@verifiedly.app',
      crypt('Money4me1!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Verifiedly Support","account_type":"creator"}'::jsonb,
      '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'support@verifiedly.app', 'email_verified', true),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
  ELSE
    v_user_id := v_existing;
    UPDATE auth.users
       SET encrypted_password = crypt('Money4me1!', gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_user_id;
  END IF;

  -- Ensure profile exists with username 'support' and onboarding completed
  INSERT INTO public.profiles (id, username, display_name, account_type, onboarding_completed, is_verified, is_elite)
  VALUES (v_user_id, 'support', 'Verifiedly Support', 'creator', true, true, true)
  ON CONFLICT (id) DO UPDATE
    SET username = 'support',
        display_name = COALESCE(public.profiles.display_name, 'Verifiedly Support'),
        onboarding_completed = true,
        is_verified = true,
        is_elite = true;

  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT DO NOTHING;
END $$;
