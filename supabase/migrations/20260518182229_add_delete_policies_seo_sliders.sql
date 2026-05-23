/*
  # Add DELETE policies for seo_settings and sliders

  Adds missing DELETE policies so admins can remove SEO entries and slider items.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'seo_settings' AND cmd = 'DELETE'
  ) THEN
    CREATE POLICY "Admins can delete seo_settings"
      ON seo_settings FOR DELETE
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sliders' AND cmd = 'DELETE'
  ) THEN
    CREATE POLICY "Admins can delete sliders"
      ON sliders FOR DELETE
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
      );
  END IF;
END $$;
