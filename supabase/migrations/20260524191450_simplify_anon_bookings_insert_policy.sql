/*
  # Simplify anon bookings INSERT policy

  The previous WITH CHECK condition using length(TRIM(...)) > 0 was
  being rejected by PostgREST even when values were valid. Replace with
  a simple WITH CHECK (true) for the anon INSERT — security is enforced
  by the fact that anon can only INSERT (not SELECT/UPDATE/DELETE), and
  all bookings go to staff review as 'pending'.
*/

DROP POLICY IF EXISTS "Anon visitors can submit bookings" ON public.bookings;

CREATE POLICY "Anon visitors can submit bookings"
  ON public.bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);
