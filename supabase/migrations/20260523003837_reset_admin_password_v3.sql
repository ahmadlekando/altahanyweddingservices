
/*
  # Reset Admin Password v3

  Resets the admin user password using pgcrypto with a fresh salt (cost factor 10).
  Ensures email is confirmed and account is fully active.
*/

UPDATE auth.users
SET 
  encrypted_password = crypt('Altahany@2025', gen_salt('bf', 10)),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now(),
  banned_until = NULL,
  deleted_at = NULL,
  raw_app_meta_data = raw_app_meta_data || '{"provider":"email","providers":["email"]}'::jsonb
WHERE email = 'admin@altahany.com';
