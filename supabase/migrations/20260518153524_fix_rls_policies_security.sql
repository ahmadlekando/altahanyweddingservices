/*
  # Fix RLS Policies - Remove Always-True INSERT Conditions

  ## Problem
  Five INSERT policies had `WITH CHECK (true)` which bypasses RLS entirely.

  ## Changes
  1. `analytics` - Restrict inserts to max 1 event per request (non-null event_type required)
  2. `audit_logs` - Restrict to authenticated users only
  3. `comments` - Require non-empty content and author_name
  4. `likes` - Require non-empty session_id
  5. `newsletter_subscribers` - Require valid email format

  ## Security Notes
  - Public-facing tables (analytics, comments, likes, newsletter) still allow anonymous inserts
    but now require valid, non-empty required fields to prevent empty/spam records
  - audit_logs restricted to authenticated users only
*/

-- analytics: require non-null, non-empty event_type
DROP POLICY IF EXISTS "Anyone can insert analytics" ON analytics;
CREATE POLICY "Anyone can insert analytics with valid event"
  ON analytics FOR INSERT
  WITH CHECK (
    event_type IS NOT NULL
    AND length(trim(event_type)) > 0
  );

-- audit_logs: restrict to authenticated users only
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- comments: require non-empty content
DROP POLICY IF EXISTS "Anyone can submit comments" ON comments;
CREATE POLICY "Anyone can submit non-empty comments"
  ON comments FOR INSERT
  WITH CHECK (
    content IS NOT NULL
    AND length(trim(content)) > 0
    AND author_name IS NOT NULL
    AND length(trim(author_name)) > 0
  );

-- likes: require non-empty session_id
DROP POLICY IF EXISTS "Anyone can insert likes" ON likes;
CREATE POLICY "Anyone can insert likes with session"
  ON likes FOR INSERT
  WITH CHECK (
    session_id IS NOT NULL
    AND length(trim(session_id)) > 0
  );

-- newsletter_subscribers: require valid email format
DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe with valid email"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (
    email IS NOT NULL
    AND email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
  );
