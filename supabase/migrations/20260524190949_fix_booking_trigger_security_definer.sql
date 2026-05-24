/*
  # Fix handle_new_booking_notification Trigger Function

  ## Root Cause
  The AFTER INSERT trigger on bookings calls handle_new_booking_notification().
  This function inserts into the notifications table. However:
  - notifications has RLS enabled with staff-only INSERT policies
  - When an anon user submits a booking, the trigger fires under the anon role
  - The anon role fails the notifications RLS check
  - Postgres rolls back the entire transaction — including the booking insert
  - Result: booking silently fails with RLS error 42501

  ## Fix
  Recreate the function as SECURITY DEFINER so it executes with the privileges
  of the function owner (postgres superuser), bypassing RLS on the notifications
  table. This is the standard Postgres pattern for trigger side-effects that need
  to write to protected tables regardless of the calling user's role.

  ## Security Note
  SECURITY DEFINER is safe here because:
  1. The function only inserts a fixed notification record
  2. It uses COALESCE with NEW.customer_name — no user-controlled SQL injection risk
  3. The function is not callable directly by anon users (triggers only)
*/

CREATE OR REPLACE FUNCTION public.handle_new_booking_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (title, title_ar, message, message_ar, type, is_read)
  VALUES (
    'New Wedding Booking',
    'حجز زفاف جديد',
    'New booking received from ' || COALESCE(NEW.customer_name, 'Client'),
    'تم استلام طلب حجز جديد باسم العميل: ' || COALESCE(NEW.customer_name, 'عميل'),
    'booking',
    false
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never let a notification failure roll back the booking
    RAISE WARNING 'handle_new_booking_notification failed: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;
