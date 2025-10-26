-- Create table to link activities to specific routes
-- This allows each route to have its own set of activities

CREATE TABLE IF NOT EXISTS public.passport_route_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.passport_routes(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.passport_activities(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure unique activity per route
  CONSTRAINT unique_route_activity UNIQUE(route_id, activity_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_passport_route_activities_route ON public.passport_route_activities(route_id);
CREATE INDEX IF NOT EXISTS idx_passport_route_activities_activity ON public.passport_route_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_passport_route_activities_order ON public.passport_route_activities(route_id, order_index);

-- Enable RLS
ALTER TABLE public.passport_route_activities ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view route-activity links for active routes
CREATE POLICY passport_route_activities_read_active
  ON public.passport_route_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.passport_routes pr
      WHERE pr.id = route_id AND pr.active = true
    )
  );

-- Admins can manage all route-activity links
CREATE POLICY passport_route_activities_admin_all
  ON public.passport_route_activities
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Function to get activities for a specific route
CREATE OR REPLACE FUNCTION get_route_activities(p_route_id UUID)
RETURNS TABLE (
  activity_id UUID,
  activity_name TEXT,
  activity_description TEXT,
  activity_type TEXT,
  points_awarded INTEGER,
  pathway_type TEXT,
  complexity_level TEXT,
  formative_value TEXT,
  order_index INTEGER,
  required BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.id,
    pa.name,
    pa.description,
    pa.activity_type,
    pa.points_awarded,
    pa.pathway_type,
    pa.complexity_level,
    pa.formative_value,
    pra.order_index,
    pra.required
  FROM public.passport_route_activities pra
  JOIN public.passport_activities pa ON pra.activity_id = pa.id
  WHERE pra.route_id = p_route_id
    AND pra.active = true
    AND pa.active = true
  ORDER BY pra.order_index ASC, pa.points_awarded ASC;
END;
$$;

-- Function to add activity to route
CREATE OR REPLACE FUNCTION add_activity_to_route(
  p_route_id UUID,
  p_activity_id UUID,
  p_order_index INTEGER DEFAULT 0,
  p_required BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_link_id UUID;
BEGIN
  -- Check if route exists and is active
  IF NOT EXISTS(
    SELECT 1 FROM public.passport_routes
    WHERE id = p_route_id AND active = true
  ) THEN
    RAISE EXCEPTION 'Route does not exist or is not active';
  END IF;

  -- Check if activity exists and is active
  IF NOT EXISTS(
    SELECT 1 FROM public.passport_activities
    WHERE id = p_activity_id AND active = true
  ) THEN
    RAISE EXCEPTION 'Activity does not exist or is not active';
  END IF;

  -- Insert or update the link
  INSERT INTO public.passport_route_activities (
    route_id,
    activity_id,
    order_index,
    required
  ) VALUES (
    p_route_id,
    p_activity_id,
    p_order_index,
    p_required
  )
  ON CONFLICT (route_id, activity_id)
  DO UPDATE SET
    order_index = EXCLUDED.order_index,
    required = EXCLUDED.required,
    updated_at = NOW()
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$;

-- Seed some route-activity relationships for existing routes
-- First, get the route IDs
DO $$
DECLARE
  conocimiento_route_id UUID;
  descubrimiento_route_id UUID;
  impacto_route_id UUID;
BEGIN
  -- Get route IDs
  SELECT id INTO conocimiento_route_id FROM public.passport_routes WHERE pathway_type = 'conocimiento' LIMIT 1;
  SELECT id INTO descubrimiento_route_id FROM public.passport_routes WHERE pathway_type = 'descubrimiento' LIMIT 1;
  SELECT id INTO impacto_route_id FROM public.passport_routes WHERE pathway_type = 'impacto_social' LIMIT 1;

  -- Add activities to Conocimiento route
  IF conocimiento_route_id IS NOT NULL THEN
    -- Semillero de Investigación
    PERFORM add_activity_to_route(conocimiento_route_id,
      (SELECT id FROM public.passport_activities WHERE name = 'Semillero de Investigación' LIMIT 1), 1, true);
    -- Clase Espejo
    PERFORM add_activity_to_route(conocimiento_route_id,
      (SELECT id FROM public.passport_activities WHERE name = 'Clase Espejo' LIMIT 1), 2, false);
    -- MOOC Certificado
    PERFORM add_activity_to_route(conocimiento_route_id,
      (SELECT id FROM public.passport_activities WHERE name = 'MOOC Certificado' LIMIT 1), 3, false);
  END IF;

  -- Add activities to Descubrimiento route
  IF descubrimiento_route_id IS NOT NULL THEN
    -- COIL Internacional
    PERFORM add_activity_to_route(descubrimiento_route_id,
      (SELECT id FROM public.passport_activities WHERE name = 'COIL Internacional' LIMIT 1), 1, true);
    -- Intercambio Académico
    PERFORM add_activity_to_route(descubrimiento_route_id,
      (SELECT id FROM public.passport_activities WHERE name = 'Intercambio Académico' LIMIT 1), 2, true);
    -- Evento Cultural Internacional
    PERFORM add_activity_to_route(descubrimiento_route_id,
      (SELECT id FROM public.passport_activities WHERE name = 'Evento Cultural Internacional' LIMIT 1), 3, false);
  END IF;

  -- Add activities to Impacto Social route
  IF impacto_route_id IS NOT NULL THEN
    -- Proyecto Comunitario
    PERFORM add_activity_to_route(impacto_route_id,
      (SELECT id FROM public.passport_activities WHERE name = 'Proyecto Comunitario' LIMIT 1), 1, true);
    -- Voluntariado Social
    PERFORM add_activity_to_route(impacto_route_id,
      (SELECT id FROM public.passport_activities WHERE name = 'Voluntariado Social' LIMIT 1), 2, false);
  END IF;
END $$;