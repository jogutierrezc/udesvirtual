-- Migration: add public_profile boolean to profiles, backfill for existing professors, and tighten RLS policy
-- Adds a column `public_profile` (default false), sets it true for existing udes_profesor rows,
-- and replaces the permissive SELECT policy with one that requires public_profile = true.

BEGIN;

-- Add column if missing
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS public_profile boolean DEFAULT false;

-- Backfill: mark existing professor vínculos as public (you can change this later per user preference)
UPDATE public.profiles
SET public_profile = true
WHERE udes_vinculo = 'udes_profesor';

-- Create index to speed up queries
CREATE INDEX IF NOT EXISTS idx_profiles_public_profile ON public.profiles(public_profile);

-- Replace existing permissive policy (if exists) with tightened one
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'public_profiles_select_professors' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    EXECUTE 'DROP POLICY public_profiles_select_professors ON public.profiles';
  END IF;

  -- Create the new policy that requires both professor vínculo and public_profile = true
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'public_profiles_select_professors' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY public_profiles_select_professors
      ON public.profiles
      FOR SELECT
      USING (udes_vinculo = 'udes_profesor' AND public_profile = true);
  END IF;
END; $$;

COMMIT;

-- Note: after this migration, clients should include `public_profile=eq.true` in client-side filters
-- for efficiency, although the RLS policy enforces the restriction server-side as well.
