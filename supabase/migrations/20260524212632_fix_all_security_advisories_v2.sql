/*
  # Fix All Security Advisories (v2)

  Targeted fixes — only drops/creates what is necessary after
  checking existing policy state.

  Sections:
  1. Drop all user_metadata policies (11 tables)
  2. Replace always-true / overly-permissive policies
  3. Fix function search_path
  4. Revoke public EXECUTE on SECURITY DEFINER functions
  5. Add invoice_sequences policies
*/

-- ============================================================
-- 1. DROP user_metadata POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow admins to read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow admins full control over all comments" ON public.comments;
DROP POLICY IF EXISTS "Allow admins to delete or archive messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow admins full control over contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Allow admins full control over contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow admins full control over customers" ON public.customers;
DROP POLICY IF EXISTS "Allow admins full control over email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Allow admins full control over faqs" ON public.faqs;
DROP POLICY IF EXISTS "Allow admins full control over gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Allow admins full control over likes" ON public.likes;
DROP POLICY IF EXISTS "Allow admins full control over marquee messages" ON public.marquee_messages;

-- ============================================================
-- 2a. REPLACE ALWAYS-TRUE POLICIES — analytics
-- ============================================================
DROP POLICY IF EXISTS "Allow public anonymous inserts for tracking" ON public.analytics;
-- "Anyone can insert analytics with valid event" already exists with event_type check

-- ============================================================
-- 2b. REPLACE ALWAYS-TRUE POLICIES — audit_logs
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated users to insert audit logs" ON public.audit_logs;
-- "Staff can insert audit logs" already exists with profiles check

-- Add missing audit_logs SELECT policy (was only the now-dropped user_metadata one)
CREATE POLICY "Staff can read audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = ANY(ARRAY['super_admin','admin','manager'])
      AND p.is_active = true
  ));

-- ============================================================
-- 2c. REPLACE ALWAYS-TRUE POLICIES — blogs
-- ============================================================
DROP POLICY IF EXISTS "Allow admin operations" ON public.blogs;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blogs' AND policyname='Staff can insert blogs') THEN
    EXECUTE $p$CREATE POLICY "Staff can insert blogs"
      ON public.blogs FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = ANY(ARRAY['super_admin','admin','manager'])
          AND p.is_active = true
      ))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blogs' AND policyname='Staff can update blogs') THEN
    EXECUTE $p$CREATE POLICY "Staff can update blogs"
      ON public.blogs FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = ANY(ARRAY['super_admin','admin','manager'])
          AND p.is_active = true
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = ANY(ARRAY['super_admin','admin','manager'])
          AND p.is_active = true
      ))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blogs' AND policyname='Staff can delete blogs') THEN
    EXECUTE $p$CREATE POLICY "Staff can delete blogs"
      ON public.blogs FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = ANY(ARRAY['super_admin','admin','manager'])
          AND p.is_active = true
      ))$p$;
  END IF;
END $$;

-- ============================================================
-- 2d. REPLACE ALWAYS-TRUE POLICIES — bookings INSERT
-- ============================================================
DROP POLICY IF EXISTS "Anon visitors can submit bookings" ON public.bookings;
CREATE POLICY "Anon visitors can submit bookings"
  ON public.bookings FOR INSERT TO anon
  WITH CHECK (
    length(COALESCE(booking_number, '')) > 0
    AND length(COALESCE(customer_name, '')) > 0
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "Authenticated users can submit bookings" ON public.bookings;
CREATE POLICY "Authenticated users can submit bookings"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (
    length(COALESCE(booking_number, '')) > 0
    AND length(COALESCE(customer_name, '')) > 0
    AND status = 'pending'
  );

-- ============================================================
-- 2e. REPLACE ALWAYS-TRUE POLICIES — contact_messages
-- ============================================================
-- Drop always-true insert (proper one with validation exists)
DROP POLICY IF EXISTS "Allow public inserts" ON public.contact_messages;
-- Drop always-true SELECT for all authenticated
DROP POLICY IF EXISTS "Authenticated users can read contact messages" ON public.contact_messages;

-- ============================================================
-- 2f. REPLACE ALWAYS-TRUE POLICIES — contact_submissions
-- ============================================================
DROP POLICY IF EXISTS "Admin All Contact" ON public.contact_submissions;
DROP POLICY IF EXISTS "Public Inserts Contact" ON public.contact_submissions;

-- Replace USING(true) SELECT with staff check
DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;
-- "Staff can view contact submissions" already added in prior session — check and add if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contact_submissions' AND policyname='Staff can view contact submissions') THEN
    EXECUTE $p$CREATE POLICY "Staff can view contact submissions"
      ON public.contact_submissions FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = ANY(ARRAY['super_admin','admin','manager','employee'])
          AND p.is_active = true
      ))$p$;
  END IF;
END $$;

-- ============================================================
-- 2g. REPLACE ALWAYS-TRUE POLICIES — newsletter_subscribers
-- ============================================================
DROP POLICY IF EXISTS "Allow public to subscribe" ON public.newsletter_subscribers;
-- "Anyone can subscribe with valid email" already exists with email regex check

-- ============================================================
-- 2h. REPLACE ALWAYS-TRUE POLICIES — notifications
-- ============================================================
DROP POLICY IF EXISTS "Admin All Notifications" ON public.notifications;
-- Existing policies: Staff can view all notifications, Staff can update any notification,
-- Staff can delete notifications, Staff or system can insert notifications — all valid

-- ============================================================
-- 2i. REPLACE ALWAYS-TRUE POLICIES — settings
-- ============================================================
DROP POLICY IF EXISTS "Allow admin all operations on settings" ON public.settings;
-- Existing policies already cover staff SELECT/INSERT/UPDATE — verify DELETE exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='settings' AND policyname='Staff can delete settings') THEN
    EXECUTE $p$CREATE POLICY "Staff can delete settings"
      ON public.settings FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = ANY(ARRAY['super_admin','admin'])
          AND p.is_active = true
      ))$p$;
  END IF;
END $$;

-- ============================================================
-- 3. FIX MUTABLE search_path ON FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_contact_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (title, title_ar, message, message_ar, type, is_read)
  VALUES (
    'New Contact Message',
    'رسالة تواصل جديدة',
    'Message received from ' || COALESCE(NEW.name, 'Visitor'),
    'تم استلام رسالة من: ' || COALESCE(NEW.name, 'زائر'),
    'contact',
    false
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_contact_notification failed: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_next_invoice_number(prefix text DEFAULT 'INV')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_seq integer;
  result text;
BEGIN
  INSERT INTO public.invoice_sequences (prefix, last_number)
  VALUES (prefix, 1)
  ON CONFLICT (prefix)
  DO UPDATE SET last_number = invoice_sequences.last_number + 1
  RETURNING last_number INTO next_seq;

  result := prefix || '-' || LPAD(next_seq::text, 4, '0');
  RETURN result;
END;
$$;

-- ============================================================
-- 4. REVOKE PUBLIC EXECUTE ON SECURITY DEFINER FUNCTIONS
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_booking_notification() FROM anon, authenticated;

-- Only authenticated needs EXECUTE on get_next_invoice_number (staff invoicing)
REVOKE EXECUTE ON FUNCTION public.get_next_invoice_number(text) FROM anon;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'rls_auto_enable'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated';
  END IF;
END $$;

-- ============================================================
-- 5. invoice_sequences — add policies (RLS enabled, no policies)
-- ============================================================

CREATE POLICY "Staff can view invoice sequences"
  ON public.invoice_sequences FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = ANY(ARRAY['super_admin','admin','manager','accountant'])
      AND p.is_active = true
  ));

CREATE POLICY "Service role can manage invoice sequences"
  ON public.invoice_sequences FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 6. ADD missing staff policies for tables that lost user_metadata ones
-- ============================================================

-- contracts — new policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contracts' AND policyname='Staff can view contracts') THEN
    EXECUTE $p$CREATE POLICY "Staff can view contracts"
      ON public.contracts FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager','accountant']) AND p.is_active = true))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contracts' AND policyname='Staff can insert contracts') THEN
    EXECUTE $p$CREATE POLICY "Staff can insert contracts"
      ON public.contracts FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contracts' AND policyname='Staff can update contracts') THEN
    EXECUTE $p$CREATE POLICY "Staff can update contracts"
      ON public.contracts FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contracts' AND policyname='Staff can delete contracts') THEN
    EXECUTE $p$CREATE POLICY "Staff can delete contracts"
      ON public.contracts FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
END $$;

-- customers — add missing write policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='customers' AND policyname='Staff can insert customers') THEN
    EXECUTE $p$CREATE POLICY "Staff can insert customers"
      ON public.customers FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager','employee']) AND p.is_active = true))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='customers' AND policyname='Staff can update customers') THEN
    EXECUTE $p$CREATE POLICY "Staff can update customers"
      ON public.customers FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager','employee']) AND p.is_active = true))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager','employee']) AND p.is_active = true))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='customers' AND policyname='Staff can delete customers') THEN
    EXECUTE $p$CREATE POLICY "Staff can delete customers"
      ON public.customers FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
END $$;

-- email_logs — add missing policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_logs' AND policyname='Staff can view email logs') THEN
    EXECUTE $p$CREATE POLICY "Staff can view email logs"
      ON public.email_logs FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_logs' AND policyname='Staff can delete email logs') THEN
    EXECUTE $p$CREATE POLICY "Staff can delete email logs"
      ON public.email_logs FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin']) AND p.is_active = true))$p$;
  END IF;
END $$;

-- faqs — add missing write policies (SELECT already public-readable)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='faqs' AND policyname='Staff can insert faqs') THEN
    EXECUTE $p$CREATE POLICY "Staff can insert faqs"
      ON public.faqs FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='faqs' AND policyname='Staff can update faqs') THEN
    EXECUTE $p$CREATE POLICY "Staff can update faqs"
      ON public.faqs FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='faqs' AND policyname='Staff can delete faqs') THEN
    EXECUTE $p$CREATE POLICY "Staff can delete faqs"
      ON public.faqs FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
END $$;

-- gallery_items — add missing write policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gallery_items' AND policyname='Staff can insert gallery items') THEN
    EXECUTE $p$CREATE POLICY "Staff can insert gallery items"
      ON public.gallery_items FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gallery_items' AND policyname='Staff can update gallery items') THEN
    EXECUTE $p$CREATE POLICY "Staff can update gallery items"
      ON public.gallery_items FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gallery_items' AND policyname='Staff can delete gallery items') THEN
    EXECUTE $p$CREATE POLICY "Staff can delete gallery items"
      ON public.gallery_items FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
END $$;

-- likes — add missing admin policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='likes' AND policyname='Staff can view likes') THEN
    EXECUTE $p$CREATE POLICY "Staff can view likes"
      ON public.likes FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='likes' AND policyname='Staff can delete likes') THEN
    EXECUTE $p$CREATE POLICY "Staff can delete likes"
      ON public.likes FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
END $$;

-- marquee_messages — add missing write policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='marquee_messages' AND policyname='Staff can insert marquee messages') THEN
    EXECUTE $p$CREATE POLICY "Staff can insert marquee messages"
      ON public.marquee_messages FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='marquee_messages' AND policyname='Staff can update marquee messages') THEN
    EXECUTE $p$CREATE POLICY "Staff can update marquee messages"
      ON public.marquee_messages FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='marquee_messages' AND policyname='Staff can delete marquee messages') THEN
    EXECUTE $p$CREATE POLICY "Staff can delete marquee messages"
      ON public.marquee_messages FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['super_admin','admin','manager']) AND p.is_active = true))$p$;
  END IF;
END $$;
