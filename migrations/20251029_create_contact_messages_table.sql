-- Migration: create contact_messages table
-- Stores messages sent from external users to a professor's public profile

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  university_representing text NOT NULL,
  reason text NOT NULL,
  reason_other text,
  country text NOT NULL,
  department text,
  message text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  read boolean NOT NULL DEFAULT false
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for the recipient (profile owner) or admins
CREATE POLICY "select_by_recipient_or_admin" ON public.contact_messages
  FOR SELECT USING (
    auth.uid() = profile_id OR
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- Allow anyone to INSERT (we accept anonymous contact submissions). Keep created_by null when anonymous.
CREATE POLICY "insert_public" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

-- Allow updates/deletes only by admins
CREATE POLICY "update_by_admin_only" ON public.contact_messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

CREATE POLICY "delete_by_admin_only" ON public.contact_messages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

REVOKE ALL ON public.contact_messages FROM public;
