-- Migration: definitive RLS policies for signature_profiles
-- Enables row level security and creates granular policies:
--  - SELECT: authenticated users
--  - INSERT: only when created_by = auth.uid() (creator-only)
--  - UPDATE/DELETE: allowed to owner or admins (user_roles.role = 'admin')

ALTER TABLE IF EXISTS public.signature_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT for authenticated users
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'signature_profiles_select_authenticated' AND schemaname = 'public' AND tablename = 'signature_profiles'
  ) THEN
    CREATE POLICY signature_profiles_select_authenticated ON public.signature_profiles
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- INSERT only when created_by matches auth.uid()
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'signature_profiles_insert_owner' AND schemaname = 'public' AND tablename = 'signature_profiles'
  ) THEN
    CREATE POLICY signature_profiles_insert_owner ON public.signature_profiles
      FOR INSERT
      WITH CHECK (created_by = auth.uid());
  END IF;
END $$;

-- UPDATE allowed to owner OR admin
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'signature_profiles_update_owner_or_admin' AND schemaname = 'public' AND tablename = 'signature_profiles'
  ) THEN
    CREATE POLICY signature_profiles_update_owner_or_admin ON public.signature_profiles
      FOR UPDATE
      USING (
        created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
      )
      WITH CHECK (
        created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
      );
  END IF;
END $$;

-- DELETE allowed to owner OR admin
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'signature_profiles_delete_owner_or_admin' AND schemaname = 'public' AND tablename = 'signature_profiles'
  ) THEN
    CREATE POLICY signature_profiles_delete_owner_or_admin ON public.signature_profiles
      FOR DELETE
      USING (
        created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
      );
  END IF;
END $$;

-- Notes:
-- - This migration assumes you have a `user_roles` table with (user_id, role) rows where admins are marked with role = 'admin'.
-- - After applying, remove any temporary debug policies (debug_allow_insert/debug_select_authenticated) if present.
