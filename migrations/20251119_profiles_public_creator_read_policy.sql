-- Enable limited public read access to `profiles` for course creators
-- This policy allows SELECT on profiles only when the profile id is referenced
-- as `created_by` in an approved row in `mooc_courses`.
-- Run this in Supabase SQL editor or via a privileged DB connection.

-- WARNING: Review before running in production.

-- Enable RLS on profiles (no-op if already enabled)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: allow read for profiles that are referenced by approved courses
-- Drop existing policy if present (CREATE POLICY doesn't support IF NOT EXISTS)
DROP POLICY IF EXISTS "Allow read creator profiles for public courses" ON public.profiles;

CREATE POLICY "Allow read creator profiles for public courses"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.mooc_courses mc
    WHERE mc.created_by = public.profiles.id
      AND mc.status = 'approved'
  )
);

-- Note: this policy keeps other profiles protected by RLS.
-- If you also want authenticated users to read any profile, create an
-- additional policy scoped to the 'authenticated' role (see README). 
