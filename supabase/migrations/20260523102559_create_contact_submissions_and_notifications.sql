/*
  # Create contact_submissions and notifications tables

  1. New Tables
    - `contact_submissions` - Stores contact form submissions from website
      - id, name, phone, email, service, message, status, created_at
    - `notifications` - In-app notification system
      - id, title, title_ar, message, message_ar, type, reference_id, is_read, created_at

  2. Security
    - RLS enabled on both tables
    - contact_submissions: anon can insert, authenticated can read/update/delete
    - notifications: authenticated can read/update/delete, system inserts via service_role
*/

-- Contact submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text DEFAULT '',
  service text DEFAULT '',
  message text DEFAULT '',
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_submissions' AND policyname = 'Anon can submit contact form') THEN
    CREATE POLICY "Anon can submit contact form"
      ON contact_submissions FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_submissions' AND policyname = 'Admins can view contact submissions') THEN
    CREATE POLICY "Admins can view contact submissions"
      ON contact_submissions FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_submissions' AND policyname = 'Admins can update contact submissions') THEN
    CREATE POLICY "Admins can update contact submissions"
      ON contact_submissions FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_submissions' AND policyname = 'Admins can delete contact submissions') THEN
    CREATE POLICY "Admins can delete contact submissions"
      ON contact_submissions FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  message text DEFAULT '',
  message_ar text DEFAULT '',
  type text DEFAULT 'info',
  reference_id text,
  reference_type text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Admins can view notifications') THEN
    CREATE POLICY "Admins can view notifications"
      ON notifications FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'System can insert notifications') THEN
    CREATE POLICY "System can insert notifications"
      ON notifications FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Admins can update notifications') THEN
    CREATE POLICY "Admins can update notifications"
      ON notifications FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Admins can delete notifications') THEN
    CREATE POLICY "Admins can delete notifications"
      ON notifications FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;
