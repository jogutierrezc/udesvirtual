-- Create table for activity completion requests
CREATE TABLE IF NOT EXISTS public.passport_activity_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.passport_activities(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.passport_routes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  evidence_url TEXT,
  evidence_description TEXT,
  admin_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure unique pending request per user-activity
  CONSTRAINT unique_pending_request UNIQUE(user_id, activity_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_passport_activity_requests_user ON public.passport_activity_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_passport_activity_requests_activity ON public.passport_activity_requests(activity_id);
CREATE INDEX IF NOT EXISTS idx_passport_activity_requests_route ON public.passport_activity_requests(route_id);
CREATE INDEX IF NOT EXISTS idx_passport_activity_requests_status ON public.passport_activity_requests(status);
CREATE INDEX IF NOT EXISTS idx_passport_activity_requests_requested_at ON public.passport_activity_requests(requested_at);

-- Enable RLS
ALTER TABLE public.passport_activity_requests ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own requests
CREATE POLICY passport_activity_requests_read_own
  ON public.passport_activity_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own requests
CREATE POLICY passport_activity_requests_insert_own
  ON public.passport_activity_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Admins can manage all requests
CREATE POLICY passport_activity_requests_admin_all
  ON public.passport_activity_requests
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Function to approve activity request
CREATE OR REPLACE FUNCTION approve_activity_request(p_request_id UUID, p_admin_id UUID, p_admin_notes TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_activity_id UUID;
  v_route_id UUID;
  v_activity_name TEXT;
  v_points_awarded INTEGER;
  v_pathway_type TEXT;
  v_activity_type TEXT;
BEGIN
  -- Get request details
  SELECT user_id, activity_id, route_id INTO v_user_id, v_activity_id, v_route_id
  FROM public.passport_activity_requests
  WHERE id = p_request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending';
  END IF;

  -- Get activity details
  SELECT name, points_awarded, pathway_type, activity_type
  INTO v_activity_name, v_points_awarded, v_pathway_type, v_activity_type
  FROM public.passport_activities
  WHERE id = v_activity_id;

  -- Update request status
  UPDATE public.passport_activity_requests
  SET status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = p_admin_id,
      admin_notes = p_admin_notes,
      updated_at = NOW()
  WHERE id = p_request_id;

  -- Insert completion record
  INSERT INTO public.passport_activity_completions (user_id, activity_id, completed_at)
  VALUES (v_user_id, v_activity_id, NOW())
  ON CONFLICT (user_id, activity_id) DO NOTHING;

  -- Insert points ledger entry
  INSERT INTO public.passport_points_ledger (
    user_id,
    points,
    pathway_type,
    activity_id,
    reason
  ) VALUES (
    v_user_id,
    v_points_awarded,
    v_pathway_type,
    v_activity_id,
    'Completada: ' || v_activity_name
  );

END;
$$;

-- Function to reject activity request
CREATE OR REPLACE FUNCTION reject_activity_request(p_request_id UUID, p_admin_id UUID, p_admin_notes TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.passport_activity_requests
  SET status = 'rejected',
      reviewed_at = NOW(),
      reviewed_by = p_admin_id,
      admin_notes = p_admin_notes,
      updated_at = NOW()
  WHERE id = p_request_id AND status = 'pending';
END;
$$;