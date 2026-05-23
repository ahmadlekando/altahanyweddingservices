/*
  # Reset Admin Password
  Sets admin@altahany.com password to Altahany@2025
*/
UPDATE auth.users
SET
  encrypted_password = crypt('Altahany@2025', gen_salt('bf')),
  updated_at = now()
WHERE email = 'admin@altahany.com';
