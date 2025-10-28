-- Migration: backfill profiles.avatar_url from auth.users.user_metadata and create trigger to keep in sync
-- Populates profiles.avatar_url for existing rows from auth.users.user_metadata->>'avatar_url'
-- and creates a trigger on auth.users to update profiles.avatar_url on future changes.

BEGIN;

-- Backfill existing profiles where avatar_url is missing
-- Ensure the column exists before attempting to update it
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

UPDATE public.profiles p
SET avatar_url = u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE p.id = u.id
  AND (p.avatar_url IS NULL OR p.avatar_url = '')
  AND (u.raw_user_meta_data->>'avatar_url') IS NOT NULL;

-- Create a function that updates profiles.avatar_url when auth.users.raw_user_meta_data changes
CREATE OR REPLACE FUNCTION public.sync_profiles_avatar_url_from_auth()
RETURNS trigger AS $$
BEGIN
  -- If a profile row exists for this user, update its avatar_url. Keep it simple and idempotent.
  UPDATE public.profiles
  SET avatar_url = NEW.raw_user_meta_data->>'avatar_url'
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to call the function after insert or when raw_user_meta_data changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'auth_users_sync_profiles_avatar'
  ) THEN
  CREATE TRIGGER auth_users_sync_profiles_avatar
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profiles_avatar_url_from_auth();
  END IF;
END; $$;

COMMIT;

-- NOTES:
-- 1) This migration should be run with the Supabase service_role (or via the Supabase SQL editor) because it
--    interacts with the `auth.users` table and creates triggers on it.
-- 2) If you prefer not to create a trigger on `auth.users`, you can omit the function/trigger section and only run
--    the UPDATE above to perform a one-time backfill.
-- 3) After running this, public profile pages can read `profiles.avatar_url` (subject to your RLS policies).
