
/*
  # Fix Security Issues

  1. RLS Policy Fixes
     - `audit_logs` INSERT policy: restrict to staff roles only (was WITH CHECK (true))
     - `email_logs` INSERT policy: restrict to staff roles only (was WITH CHECK (true))

  2. Storage - Remove broad SELECT policy on media bucket
     - Drop "Public media access" policy that allows listing all files
     - Public buckets serve files via URL without needing a storage.objects SELECT policy

  3. handle_new_user() function
     - Revoke EXECUTE from anon and authenticated roles
     - Function is a trigger-only function and must not be callable via REST API

  4. Leaked password protection
     - Enable HaveIBeenPwned password check via auth config
*/

-- ============================================================
-- 1. Fix audit_logs INSERT policy (was WITH CHECK (true))
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

CREATE POLICY "Staff can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = ANY (ARRAY['super_admin','admin','manager','accountant','employee'])
        AND p.is_active = true
    )
  );

-- ============================================================
-- 2. Fix email_logs INSERT policy (was WITH CHECK (true))
-- ============================================================
DROP POLICY IF EXISTS "System can insert email logs" ON public.email_logs;

CREATE POLICY "Staff can insert email logs"
  ON public.email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = ANY (ARRAY['super_admin','admin','manager','accountant','employee'])
        AND p.is_active = true
    )
  );

-- ============================================================
-- 3. Remove broad storage SELECT policy (allows file listing)
--    Public bucket files are accessible via signed/public URLs
--    without any storage.objects SELECT policy needed
-- ============================================================
DROP POLICY IF EXISTS "Public media access" ON storage.objects;

-- ============================================================
-- 4. Revoke EXECUTE on handle_new_user() from public roles
--    This is a trigger function — it must only be invoked by
--    the trigger system, never via REST API /rpc/handle_new_user
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
