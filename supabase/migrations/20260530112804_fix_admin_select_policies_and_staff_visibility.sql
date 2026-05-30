/*
  # Fix Admin SELECT Policies — Staff Visibility

  ## Problem
  Several tables are missing SELECT policies for authenticated staff, causing:
  - gallery_items: admin can INSERT but load() returns 0 rows (no staff SELECT policy)
  - sliders: admin can only see is_active=true items (can't manage inactive sliders)
  - media: admin can only see is_public=true items (can't manage private media)

  ## Changes
  1. gallery_items — add SELECT policy for staff to view ALL items (not just public ones)
  2. sliders — add SELECT policy for staff to view ALL sliders (not just active ones)
  3. media — add SELECT policy for staff to view ALL media records (not just public ones)

  ## Security
  - Existing public SELECT policies remain untouched (website visitors keep their access)
  - New staff policies require authenticated + profiles lookup (role + is_active check)
*/

-- gallery_items: staff must be able to read all items (public + non-public)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gallery_items'
      AND policyname = 'Staff can view all gallery items'
  ) THEN
    CREATE POLICY "Staff can view all gallery items"
      ON public.gallery_items FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role = ANY(ARRAY['super_admin','admin','manager','employee'])
            AND p.is_active = true
        )
      );
  END IF;
END $$;

-- sliders: staff must be able to read ALL sliders (active + inactive) for management
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sliders'
      AND policyname = 'Staff can view all sliders'
  ) THEN
    CREATE POLICY "Staff can view all sliders"
      ON public.sliders FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role = ANY(ARRAY['super_admin','admin','manager'])
            AND p.is_active = true
        )
      );
  END IF;
END $$;

-- media: staff must be able to read ALL media records (public + private) for management
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'media'
      AND policyname = 'Staff can view all media records'
  ) THEN
    CREATE POLICY "Staff can view all media records"
      ON public.media FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role = ANY(ARRAY['super_admin','admin','manager','employee'])
            AND p.is_active = true
        )
      );
  END IF;
END $$;
