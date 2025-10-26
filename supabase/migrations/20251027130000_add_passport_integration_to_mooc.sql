-- Add Passport UDES integration fields to mooc_courses table
-- Allow professors to configure MOOC courses as Passport activities

ALTER TABLE public.mooc_courses
ADD COLUMN IF NOT EXISTS is_passport_activity BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS passport_pathway TEXT CHECK (passport_pathway IN ('conocimiento', 'descubrimiento', 'impacto_social', 'multiple')),
ADD COLUMN IF NOT EXISTS passport_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passport_complexity TEXT DEFAULT 'basico' CHECK (passport_complexity IN ('basico', 'intermedio', 'avanzado'));

-- Add comment to explain the fields
COMMENT ON COLUMN public.mooc_courses.is_passport_activity IS 'Indicates if this MOOC course is part of the Passport UDES program';
COMMENT ON COLUMN public.mooc_courses.passport_pathway IS 'The pathway this course contributes to (conocimiento, descubrimiento, impacto_social, multiple)';
COMMENT ON COLUMN public.mooc_courses.passport_points IS 'Points awarded for completing this course in the Passport program';
COMMENT ON COLUMN public.mooc_courses.passport_complexity IS 'Complexity level of the course (basico, intermedio, avanzado)';

-- Create function to automatically award points when student completes a Passport MOOC course
CREATE OR REPLACE FUNCTION public.award_passport_points_for_mooc_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_record RECORD;
  user_profile_id UUID;
BEGIN
  -- Only process if enrollment is being marked as completed
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    -- Get course details
    SELECT is_passport_activity, passport_pathway, passport_points
    INTO course_record
    FROM public.mooc_courses
    WHERE id = NEW.course_id;

    -- Only award points if this is a Passport activity
    IF course_record.is_passport_activity = true AND course_record.passport_points > 0 THEN
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
        course_record.passport_points,
        course_record.passport_pathway,
        NEW.course_id,
        'Completación de curso MOOC: ' || (SELECT title FROM public.mooc_courses WHERE id = NEW.course_id),
        'mooc_completion'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to automatically award points on MOOC completion
DROP TRIGGER IF EXISTS trigger_award_passport_points_mooc ON public.mooc_enrollments;
CREATE TRIGGER trigger_award_passport_points_mooc
  AFTER UPDATE ON public.mooc_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.award_passport_points_for_mooc_completion();