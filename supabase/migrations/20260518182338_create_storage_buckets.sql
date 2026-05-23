/*
  # Create Supabase Storage Buckets

  1. Creates the main media storage bucket (public)
  2. Adds storage RLS policies for authenticated staff uploads
  3. Adds DELETE policy for media table
*/

-- Create media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can read public media
CREATE POLICY "Public media access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');

-- Authenticated users (staff) can upload
CREATE POLICY "Staff can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'manager', 'accountant', 'employee')
    )
  );

-- Staff can update their uploads
CREATE POLICY "Staff can update media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'manager', 'accountant', 'employee')
    )
  );

-- Staff can delete media
CREATE POLICY "Staff can delete media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- Add DELETE policy for media table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'media' AND cmd = 'DELETE'
  ) THEN
    CREATE POLICY "Staff can delete media records"
      ON media FOR DELETE
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
      );
  END IF;
END $$;
