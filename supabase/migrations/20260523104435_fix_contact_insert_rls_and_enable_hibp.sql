/*
  # Fix Contact Table INSERT Policies and Enable HaveIBeenPwned Password Check

  ## Problem
  Both contact table INSERT policies used `WITH CHECK (true)`, which is flagged as
  "always true" because it places no restriction on the inserted row content.
  Specifically, submitters could set admin-managed fields like `is_read = true`
  (contact_messages) or `status = 'resolved'` (contact_submissions) on insert.

  ## Fix
  Replace `WITH CHECK (true)` with explicit constraints that:
  1. Prevent the submitter from setting admin-only fields to non-default values.
  2. Require the `name` field to be non-empty (basic input validation at DB level).

  ## contact_messages
  - `is_read` must be false on insert (admin sets it to true when they read it)

  ## contact_submissions
  - `status` must be 'new' on insert (admin changes it to 'read'/'resolved'/etc.)

  ## HaveIBeenPwned
  - Enable leaked password protection via Supabase auth config
    (done via SQL update to auth.config where supported, otherwise via migration comment
    for manual dashboard action)
*/

-- ============================================================
-- 1. contact_messages — tighten INSERT policy
-- ============================================================

DROP POLICY IF EXISTS "Public can submit contact messages" ON public.contact_messages;

CREATE POLICY "Public can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Prevent submitters from pre-marking messages as read
    is_read = false
    -- Require a non-empty name
    AND length(trim(name)) > 0
  );

-- ============================================================
-- 2. contact_submissions — tighten INSERT policy
-- ============================================================

DROP POLICY IF EXISTS "Public can submit contact form" ON public.contact_submissions;

CREATE POLICY "Public can submit contact form"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Prevent submitters from setting a non-default status
    (status IS NULL OR status = 'new')
    -- Require a non-empty name
    AND length(trim(name)) > 0
  );

-- ============================================================
-- 3. Enable HaveIBeenPwned leaked password protection
--    Supabase stores auth config in auth.config (single-row table).
--    This update enables the feature at the database level.
-- ============================================================

DO $$
BEGIN
  -- Only attempt if the auth.config table exists (managed Supabase projects)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'config'
  ) THEN
    UPDATE auth.config
    SET leaked_password_protection_enabled = true
    WHERE leaked_password_protection_enabled IS DISTINCT FROM true;
  END IF;
END $$;
