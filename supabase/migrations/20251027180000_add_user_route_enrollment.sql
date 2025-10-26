-- Create user-route enrollment table
-- This allows students to enroll in specific pathways/routes

CREATE TABLE IF NOT EXISTS public.passport_user_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.passport_routes(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  target_completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure unique enrollment per user-route combination
  CONSTRAINT unique_user_route_enrollment UNIQUE(user_id, route_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_passport_user_routes_user ON public.passport_user_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_passport_user_routes_route ON public.passport_user_routes(route_id);
CREATE INDEX IF NOT EXISTS idx_passport_user_routes_status ON public.passport_user_routes(status);

-- Enable RLS
ALTER TABLE public.passport_user_routes ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own route enrollments
CREATE POLICY passport_user_routes_read_own
  ON public.passport_user_routes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can enroll themselves in routes (with business logic validation)
CREATE POLICY passport_user_routes_insert_own
  ON public.passport_user_routes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own enrollments
CREATE POLICY passport_user_routes_update_own
  ON public.passport_user_routes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can manage all enrollments
CREATE POLICY passport_user_routes_admin_all
  ON public.passport_user_routes
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Function to enroll user in a route with validation
CREATE OR REPLACE FUNCTION enroll_user_in_route(
  p_user_id UUID,
  p_route_id UUID,
  p_target_completion_date DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment_id UUID;
  v_route_exists BOOLEAN;
BEGIN
  -- Check if route exists and is active
  SELECT EXISTS(
    SELECT 1 FROM public.passport_routes
    WHERE id = p_route_id AND active = true
  ) INTO v_route_exists;

  IF NOT v_route_exists THEN
    RAISE EXCEPTION 'Route does not exist or is not active';
  END IF;

  -- Check if user is already enrolled
  IF EXISTS(
    SELECT 1 FROM public.passport_user_routes
    WHERE user_id = p_user_id AND route_id = p_route_id
  ) THEN
    RAISE EXCEPTION 'User is already enrolled in this route';
  END IF;

  -- Insert enrollment
  INSERT INTO public.passport_user_routes (
    user_id,
    route_id,
    target_completion_date,
    notes
  ) VALUES (
    p_user_id,
    p_route_id,
    p_target_completion_date,
    p_notes
  ) RETURNING id INTO v_enrollment_id;

  RETURN v_enrollment_id;
END;
$$;

-- Function to get user's enrolled routes
CREATE OR REPLACE FUNCTION get_user_enrolled_routes(p_user_id UUID)
RETURNS TABLE (
  route_id UUID,
  route_name TEXT,
  route_description TEXT,
  pathway_type TEXT,
  enrollment_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  target_completion_date DATE,
  current_points BIGINT,
  total_points_required INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    pr.name,
    pr.description,
    pr.pathway_type,
    pur.enrollment_date,
    pur.status,
    pur.target_completion_date,
    COALESCE(SUM(CASE WHEN ppl.pathway_type = pr.pathway_type THEN ppl.points ELSE 0 END), 0)::BIGINT as current_points,
    200 as total_points_required -- This could be configurable per route
  FROM public.passport_user_routes pur
  JOIN public.passport_routes pr ON pur.route_id = pr.id
  LEFT JOIN public.passport_points_ledger ppl ON ppl.user_id = pur.user_id
  WHERE pur.user_id = p_user_id
    AND pur.status = 'active'
  GROUP BY pr.id, pr.name, pr.description, pr.pathway_type, pur.enrollment_date, pur.status, pur.target_completion_date
  ORDER BY pur.enrollment_date DESC;
END;
$$;