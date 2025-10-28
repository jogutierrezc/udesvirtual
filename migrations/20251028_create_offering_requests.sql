-- Migration: create offering_requests table and RLS policies

CREATE TABLE IF NOT EXISTS public.offering_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  offering_id uuid NOT NULL REFERENCES public.course_offerings(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  country text NOT NULL,
  department text,
  university_representing text NOT NULL,
  institutional_email text NOT NULL,
  proposal_type text NOT NULL,
  message text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  read boolean DEFAULT false
);

-- Enable Row Level Security and policies
ALTER TABLE public.offering_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert (frontend should set created_by to auth.uid())
CREATE POLICY "Allow authenticated insert" ON public.offering_requests
  FOR INSERT
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow owners to select their requests
CREATE POLICY "Allow owners select" ON public.offering_requests
  FOR SELECT
  USING (created_by = auth.uid());

-- Allow admins to select all requests (depends on user_roles table)
CREATE POLICY "Allow admins select" ON public.offering_requests
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Allow admins to update (e.g., mark as read)
CREATE POLICY "Allow admins update" ON public.offering_requests
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Allow admins to delete
CREATE POLICY "Allow admins delete" ON public.offering_requests
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Index to speed up counts/queries by offering_id
CREATE INDEX IF NOT EXISTS offering_requests_offering_id_idx ON public.offering_requests (offering_id);
