-- Create function to get activities for a specific route
CREATE OR REPLACE FUNCTION get_route_activities(p_route_id UUID, p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  points_required INTEGER,
  pathway_type TEXT,
  order_index INTEGER,
  is_completed BOOLEAN,
  completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.id,
    pa.title,
    pa.description,
    pa.points_required,
    pa.pathway_type::TEXT,
    pra.order_index,
    CASE WHEN pac.id IS NOT NULL THEN true ELSE false END as is_completed,
    pac.completed_at
  FROM passport_route_activities pra
  JOIN passport_activities pa ON pra.activity_id = pa.id
  LEFT JOIN passport_activity_completions pac ON pac.activity_id = pa.id AND pac.user_id = p_user_id
  WHERE pra.route_id = p_route_id
  ORDER BY pra.order_index;
END;
$$;

-- Create function to complete an activity
CREATE OR REPLACE FUNCTION complete_activity(p_activity_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update completion record
  INSERT INTO passport_activity_completions (activity_id, user_id, completed_at)
  VALUES (p_activity_id, p_user_id, NOW())
  ON CONFLICT (activity_id, user_id)
  DO UPDATE SET completed_at = NOW();

  -- Update user points
  -- This will trigger any point calculation logic if needed
END;
$$;

-- Create function to add activity to route
CREATE OR REPLACE FUNCTION add_activity_to_route(p_route_id UUID, p_activity_id UUID, p_order_index INTEGER DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_order INTEGER;
BEGIN
  -- If no order_index provided, get the next available
  IF p_order_index IS NULL THEN
    SELECT COALESCE(MAX(order_index), 0) + 1
    INTO next_order
    FROM passport_route_activities
    WHERE route_id = p_route_id;
  ELSE
    next_order := p_order_index;
  END IF;

  -- Insert the relationship
  INSERT INTO passport_route_activities (route_id, activity_id, order_index)
  VALUES (p_route_id, p_activity_id, next_order)
  ON CONFLICT (route_id, activity_id)
  DO UPDATE SET order_index = next_order;
END;
$$;