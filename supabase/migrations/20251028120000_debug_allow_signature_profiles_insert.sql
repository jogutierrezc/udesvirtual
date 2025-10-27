-- Debug migration: temporarily allow authenticated inserts into signature_profiles
-- Run this in Supabase SQL editor if you want to quickly test client-side inserts.
-- IMPORTANT: This is intended for debugging. Remove or tighten policies after verification.

ALTER TABLE IF EXISTS public.signature_profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to SELECT (optional)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'debug_select_authenticated' AND schemaname = 'public' AND tablename = 'signature_profiles'
  ) THEN
    CREATE POLICY debug_select_authenticated ON public.signature_profiles
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Allow any authenticated user to INSERT for debugging (WITH CHECK ensures created_by may be anything)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'debug_allow_insert' AND schemaname = 'public' AND tablename = 'signature_profiles'
  ) THEN
    CREATE POLICY debug_allow_insert ON public.signature_profiles
      FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- NOTE: After debugging, remove these policies and create a proper policy such as
-- WITH CHECK (created_by = auth.uid()) or an admin-only policy.
