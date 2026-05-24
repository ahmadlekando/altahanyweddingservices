/*
  # Fix Bookings Anonymous INSERT Policy

  ## Problem
  The existing "Allow public inserts" policy for bookings uses WITH CHECK (true) but
  is assigned to the PUBLIC pseudo-role. When Supabase executes anon-key requests, 
  the session role is explicitly 'anon'. The policy needs to be explicitly granted 
  to the 'anon' role to work reliably.

  ## Fix
  Drop the ambiguous public policy and recreate it explicitly targeting the anon role.
  This allows the website booking form (unauthenticated visitors) to submit bookings.

  ## Security
  The WITH CHECK constraint ensures only valid booking data can be inserted:
  - booking_number must be non-empty
  - customer_name must be non-empty  
  - status must be 'pending' (visitors can't create confirmed/completed bookings)
*/

DROP POLICY IF EXISTS "Allow public inserts" ON bookings;

CREATE POLICY "Anon visitors can submit bookings"
  ON bookings
  FOR INSERT
  TO anon
  WITH CHECK (
    length(trim(booking_number)) > 0
    AND length(trim(customer_name)) > 0
    AND status = 'pending'
  );
