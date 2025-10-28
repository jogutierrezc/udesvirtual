-- Migration: allow public SELECT on profiles for users with udes_vinculo = 'udes_profesor'
-- This policy makes professor profiles publicly readable while keeping other profiles private.

BEGIN;

-- Ensure RLS is enabled (should already be) and then create a permissive SELECT policy
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'public_profiles_select_professors' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY public_profiles_select_professors
      ON public.profiles
      FOR SELECT
      USING (udes_vinculo = 'udes_profesor');
  END IF;
END; $$;

COMMIT;

-- NOTE: Applying this migration will make any profile row with udes_vinculo = 'udes_profesor' publicly readable by the anon API key.
-- Consider adding stricter checks (e.g., a 'public_profile' boolean) if you want granular control.
