/*
  # Fix Notifications INSERT RLS and Contact Submissions SELECT Policy

  ## Problem 1: Notifications INSERT policy too restrictive
  The existing "System can insert notifications" policy requires staff role OR
  auth.uid() = user_id. Website visitors (anon/customer) insert with user_id = null,
  which fails both conditions — notifications from booking and contact forms are
  silently dropped.

  ## Fix 1: Allow any authenticated or anonymous caller to INSERT notifications
  where user_id IS NULL (system-generated events). Staff inserts with their own
  user_id remain allowed by the existing condition.

  ## Problem 2: contact_submissions SELECT policy used USING (true)
  This allowed anyone to read all contact submissions — a data exposure issue.

  ## Fix 2: Scope contact_submissions SELECT to staff roles only.

  ## Changes
  - DROP old notifications INSERT policy
  - CREATE new policy that allows: staff inserts (any), OR anon/customer inserts
    with user_id = NULL (website-triggered events)
  - DROP contact_submissions always-true SELECT policy if it exists
  - CREATE staff-only SELECT policy for contact_submissions
*/

-- Fix notifications INSERT: allow website-triggered inserts (user_id IS NULL) from any caller,
-- while still allowing staff to insert notifications for any user_id.
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "Staff or system can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (
    -- Staff members can insert any notification
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin', 'manager', 'accountant', 'employee')
    )
    OR
    -- System/website events: no user_id attribution (booking/contact form submissions)
    user_id IS NULL
  );

-- Fix contact_submissions SELECT: was USING (true), scope to staff only
DROP POLICY IF EXISTS "Public can view contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Anyone can read contact_submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Staff can view contact submissions" ON contact_submissions;

CREATE POLICY "Staff can view contact submissions"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin', 'manager', 'accountant', 'employee')
    )
  );
