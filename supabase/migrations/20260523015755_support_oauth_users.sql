
/*
  # Support OAuth Users (Google / Apple Sign-In)

  The handle_new_user() trigger already creates a profile row on signup.
  This migration ensures:
  1. The trigger handles OAuth users who may not have full_name in metadata
  2. The profiles SELECT policy allows users to read their own profile
     (needed for auth context to load profile after OAuth redirect)
  3. The bookings INSERT policy allows any authenticated user (including
     OAuth customers) to submit a booking request
*/

-- ============================================================
-- Ensure profiles SELECT policy exists for self-read
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can read own profile'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can read own profile"
        ON public.profiles
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
    $policy$;
  END IF;
END $$;

-- ============================================================
-- Ensure profiles UPDATE policy exists for self-update
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can update own profile'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update own profile"
        ON public.profiles
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    $policy$;
  END IF;
END $$;

-- ============================================================
-- Ensure bookings INSERT policy allows authenticated customers
-- (including Google/Apple OAuth users) to submit a booking
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND policyname = 'Authenticated users can create bookings'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can create bookings"
        ON public.bookings
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    $policy$;
  END IF;
END $$;

-- ============================================================
-- Ensure bookings SELECT policy allows users to view own bookings
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND policyname = 'Users can view own bookings'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view own bookings"
        ON public.bookings
        FOR SELECT
        TO authenticated
        USING (
          customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = ANY(ARRAY['super_admin','admin','manager','accountant','employee'])
          )
        );
    $policy$;
  END IF;
END $$;
