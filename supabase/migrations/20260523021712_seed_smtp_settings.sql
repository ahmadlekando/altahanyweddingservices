/*
  # Seed correct SMTP settings

  Updates/inserts the correct SMTP configuration for Altahany:
  - SMTP host: smtp.hostinger.com
  - SMTP port: 465 (SSL)
  - SMTP email: info@altahany.com
  - SMTP password: Altahany@20004@
*/

INSERT INTO settings (key, value, type, description)
VALUES
  ('smtp_host', 'smtp.hostinger.com', 'string', 'SMTP server hostname'),
  ('smtp_port', '465', 'string', 'SMTP server port'),
  ('smtp_email', 'info@altahany.com', 'string', 'SMTP sender email address'),
  ('smtp_password', 'Altahany@20004@', 'string', 'SMTP sender password')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
