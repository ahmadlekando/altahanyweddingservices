/*
  # Fix authenticated user booking INSERT policy

  The "Customers can create their own bookings" policy requires
  customer_email to exactly match the user's profile email. This fails
  when users fill a different email in the form field.

  Replace with a simple policy: any authenticated user can insert a booking.
  Staff review handles validation. The booking is linked via customer_email
  for tracking purposes, not for RLS enforcement.
*/

DROP POLICY IF EXISTS "Customers can create their own bookings" ON public.bookings;

CREATE POLICY "Authenticated users can submit bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
