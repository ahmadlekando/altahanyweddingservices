/*
  # Clean Up Stale Legacy RLS Policies on invoices, invoice_items, bookings

  ## Problem
  Several policies check `auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'`.
  Roles in this project are stored in the `profiles` table — NOT in JWT user_metadata.
  These policies never fire (always evaluate false) but add confusion and overhead.

  The correct profiles-based policies already exist alongside them. Removing dead ones only.

  ## Also removes
  - "Allow admin full access" on bookings: uses `auth.role() = 'authenticated'` — 
    this is too broad and conflicts with proper staff-scoped policies.
  - "Allow public inserts" and "Public Inserts Bookings": duplicate permissive INSERT 
    policies with WITH CHECK (true) — already covered by the scoped policies.

  ## What remains (correct policies)
  - invoices: Staff can insert/update/delete/select/view (profiles-based)
  - invoice_items: Staff can insert/update/delete/select (profiles-based)
  - bookings: Staff can insert/update/delete/select + customers own + public insert
*/

-- invoices: remove stale jwt-role policies
DROP POLICY IF EXISTS "Allow admins full control over invoices" ON invoices;

-- invoice_items: remove stale jwt-role policies
DROP POLICY IF EXISTS "Allow admins full control over invoice items" ON invoice_items;

-- bookings: remove stale jwt-role policies and overly-broad policies
DROP POLICY IF EXISTS "Admin All Bookings" ON bookings;
DROP POLICY IF EXISTS "Allow admin full access" ON bookings;
DROP POLICY IF EXISTS "Allow authenticated admins to read and manage bookings" ON bookings;
-- Remove duplicate public insert (keep only one)
DROP POLICY IF EXISTS "Public Inserts Bookings" ON bookings;
