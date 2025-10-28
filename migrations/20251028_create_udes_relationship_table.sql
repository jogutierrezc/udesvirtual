-- Migration: create udes_relationships table
-- Adds a table to store a user's relation with UDES (program, campus, vinculation type)
-- Once created the record should not be editable by the user (RLS will prevent updates)

CREATE TABLE IF NOT EXISTS public.udes_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program text NOT NULL,
  campus text NOT NULL,
  vinculation_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.udes_relationships ENABLE ROW LEVEL SECURITY;

-- Allow SELECT when the related profile is public or the requester is the profile owner
CREATE POLICY "public_select_when_profile_public_or_owner" ON public.udes_relationships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_id AND (p.public_profile IS TRUE OR auth.uid() = p.id)
    )
  );

-- Allow insert if authenticated user is the profile owner or an admin
CREATE POLICY "insert_by_owner_or_admin" ON public.udes_relationships
  FOR INSERT WITH CHECK (
    auth.uid() = profile_id OR
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- Disallow updates by regular users. Allow updates only by admins (so users cannot modify once created)
CREATE POLICY "update_by_admin_only" ON public.udes_relationships
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- Allow deletes only by admins
CREATE POLICY "delete_by_admin_only" ON public.udes_relationships
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- Grant minimal privileges to authenticated (select controlled by RLS)
REVOKE ALL ON public.udes_relationships FROM public;
