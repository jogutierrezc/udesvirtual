-- Migration: allow anonymous inserts into offering_requests
-- This migration updates the INSERT policy to permit submissions without authentication

-- Drop previous insert policy (if exists)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.offering_requests;

-- Create new policy that allows anyone (including anon) to insert rows
CREATE POLICY "Allow anonymous insert" ON public.offering_requests
  FOR INSERT
  USING (true)
  WITH CHECK (true);

-- Note: SELECT/UPDATE/DELETE policies remain as defined in the original migration.
-- If you want anonymous users to also be able to read their own submissions you would
-- need a mechanism (e.g., a token) or store a client-generated id to match; current
-- setup keeps SELECT restricted to owners (created_by = auth.uid()) and admins.
