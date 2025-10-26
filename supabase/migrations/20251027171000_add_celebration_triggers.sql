-- Function to handle real-time celebrations when points are awarded
CREATE OR REPLACE FUNCTION handle_points_celebration()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the points award for debugging
  RAISE LOG 'Points awarded: user_id=%, points=%, pathway_type=%', NEW.user_id, NEW.points, NEW.pathway_type;

  -- You can add additional logic here if needed
  -- For example, sending notifications, updating caches, etc.

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle real-time celebrations when badges are awarded
CREATE OR REPLACE FUNCTION handle_badges_celebration()
RETURNS TRIGGER AS $$
DECLARE
  badge_name TEXT;
  badge_color TEXT;
BEGIN
  -- Get badge details
  SELECT name, color INTO badge_name, badge_color
  FROM passport_badges
  WHERE id = NEW.badge_id;

  -- Log the badge award for debugging
  RAISE LOG 'Badge awarded: user_id=%, badge_id=%, badge_name=%', NEW.user_id, NEW.badge_id, badge_name;

  -- You can add additional logic here if needed
  -- For example, sending notifications, updating caches, etc.

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for real-time celebrations
DROP TRIGGER IF EXISTS trigger_points_celebration ON passport_points_ledger;
CREATE TRIGGER trigger_points_celebration
  AFTER INSERT ON passport_points_ledger
  FOR EACH ROW
  EXECUTE FUNCTION handle_points_celebration();

DROP TRIGGER IF EXISTS trigger_badges_celebration ON passport_user_badges;
CREATE TRIGGER trigger_badges_celebration
  AFTER INSERT ON passport_user_badges
  FOR EACH ROW
  EXECUTE FUNCTION handle_badges_celebration();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_points_celebration() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_badges_celebration() TO authenticated;