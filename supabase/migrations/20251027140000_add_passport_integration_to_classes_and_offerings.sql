-- Add Passport UDES integration fields to classes and course_offerings tables
-- Allow professors to configure classes and offerings as Passport activities

-- Add Passport fields to classes table
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS is_passport_activity BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS passport_pathway TEXT CHECK (passport_pathway IN ('conocimiento', 'descubrimiento', 'impacto_social', 'multiple')),
ADD COLUMN IF NOT EXISTS passport_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passport_complexity TEXT DEFAULT 'basico' CHECK (passport_complexity IN ('basico', 'intermedio', 'avanzado'));

-- Add Passport fields to course_offerings table
ALTER TABLE public.course_offerings
ADD COLUMN IF NOT EXISTS is_passport_activity BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS passport_pathway TEXT CHECK (passport_pathway IN ('conocimiento', 'descubrimiento', 'impacto_social', 'multiple')),
ADD COLUMN IF NOT EXISTS passport_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passport_complexity TEXT DEFAULT 'basico' CHECK (passport_complexity IN ('basico', 'intermedio', 'avanzado'));

-- Add comments to explain the fields
COMMENT ON COLUMN public.classes.is_passport_activity IS 'Indicates if this class is part of the Passport UDES program';
COMMENT ON COLUMN public.classes.passport_pathway IS 'The pathway this class contributes to (conocimiento, descubrimiento, impacto_social, multiple)';
COMMENT ON COLUMN public.classes.passport_points IS 'Points awarded for attending this class in the Passport program';
COMMENT ON COLUMN public.classes.passport_complexity IS 'Complexity level of the class (basico, intermedio, avanzado)';

COMMENT ON COLUMN public.course_offerings.is_passport_activity IS 'Indicates if this offering is part of the Passport UDES program';
COMMENT ON COLUMN public.course_offerings.passport_pathway IS 'The pathway this offering contributes to (conocimiento, descubrimiento, impacto_social, multiple)';
COMMENT ON COLUMN public.course_offerings.passport_points IS 'Points awarded for this offering in the Passport program';
COMMENT ON COLUMN public.course_offerings.passport_complexity IS 'Complexity level of the offering (basico, intermedio, avanzado)';

-- Create function to automatically award points when student attends a Passport class
CREATE OR REPLACE FUNCTION public.award_passport_points_for_class_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  class_record RECORD;
  user_profile_id UUID;
BEGIN
  -- Only process if attendance is being marked as present/attended
  IF NEW.attendance_status = 'present' AND (OLD.attendance_status IS NULL OR OLD.attendance_status != 'present') THEN
    -- Get class details
    SELECT c.is_passport_activity, c.passport_pathway, c.passport_points
    INTO class_record
    FROM public.classes c
    WHERE c.id = NEW.class_id;

    -- Only award points if this is a Passport activity
    IF class_record.is_passport_activity = true AND class_record.passport_points > 0 THEN
      -- Get user's profile ID
      SELECT id INTO user_profile_id
      FROM public.profiles
      WHERE id = NEW.user_id;

      -- Insert points into passport ledger
      INSERT INTO public.passport_points_ledger (
        user_id,
        points,
        pathway_type,
        activity_id,
        reason,
        source
      ) VALUES (
        user_profile_id,
        class_record.passport_points,
        class_record.passport_pathway,
        NEW.class_id,
        'Asistencia a clase espejo: ' || (SELECT title FROM public.classes WHERE id = NEW.class_id),
        'class_attendance'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to automatically award points on class attendance
-- Note: This assumes there's a class_attendance table. If not, this trigger will be created when that table exists.
-- For now, we'll create it as a placeholder and it will be activated when the attendance system is implemented.

-- You can uncomment this when the class_attendance table is created:
-- DROP TRIGGER IF EXISTS trigger_award_passport_points_class ON public.class_attendance;
-- CREATE TRIGGER trigger_award_passport_points_class
--   AFTER UPDATE ON public.class_attendance
--   FOR EACH ROW
--   EXECUTE FUNCTION public.award_passport_points_for_class_attendance();