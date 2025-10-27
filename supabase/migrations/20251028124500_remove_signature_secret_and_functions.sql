-- Migration: remove secret column and related RPCs for signature_profiles
-- This migration drops the `secret` column and removes the helper
-- functions `create_signature_profile` and `rotate_signature_secret`.

-- Drop the secret column (if present)
ALTER TABLE IF EXISTS public.signature_profiles DROP COLUMN IF EXISTS secret;

-- Drop helper functions if they exist. Using CASCADE to remove dependent grants safely.
DROP FUNCTION IF EXISTS public.create_signature_profile(text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.rotate_signature_secret(uuid) CASCADE;

-- Notes:
-- After running this migration, any client or server code that relied on
-- the RPCs or the secret column must be updated to use a simpler direct
-- insert flow. See repository changes in the admin UI which remove RPC usage.
