-- Backfill missing profiles.full_name and email from auth.users
-- Run this from Supabase SQL editor (recommended) or via psql with a privileged DB user.

-- WARNING: review and backup before running in production.

WITH creators AS (
  SELECT DISTINCT created_by
  FROM mooc_courses
  WHERE created_by IS NOT NULL
), missing AS (
  SELECT c.created_by AS id
  FROM creators c
  LEFT JOIN profiles p ON p.id = c.created_by
  WHERE p.id IS NULL
)
INSERT INTO profiles (id, full_name, email, updated_at)
SELECT
  u.id,
  COALESCE(
    -- Prefer values from raw_user_meta_data (common in Supabase), then email as fallback
    (u.raw_user_meta_data->> 'full_name'),
    (u.raw_user_meta_data->> 'name'),
    u.email
  ) AS full_name,
  u.email,
  now()
FROM auth.users u
JOIN missing m ON m.id = u.id;

-- If you prefer to update existing profiles that have empty full_name, use the following instead:
-- UPDATE profiles p
-- SET full_name = COALESCE(u.user_metadata->> 'full_name', u.user_metadata->> 'name', u.raw_user_meta_data->> 'full_name', u.raw_user_meta_data->> 'name', u.email),
--     updated_at = now()
-- FROM auth.users u
-- WHERE p.id = u.id AND (p.full_name IS NULL OR p.full_name = '');
