-- Migration: add udes_vinculo to profiles
-- Adds a nullable text column to store the user's vínculo con la UDES
-- Expected values (informational): 'udes_estudiante', 'udes_profesor'

BEGIN;

-- Add column if not exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS udes_vinculo text;

-- Add a helpful comment
COMMENT ON COLUMN public.profiles.udes_vinculo IS 'Vínculo con la UDES: valores esperados: udes_estudiante, udes_profesor';

-- Optional index to speed up queries filtering by udes_vinculo
CREATE INDEX IF NOT EXISTS idx_profiles_udes_vinculo ON public.profiles(udes_vinculo);

COMMIT;
