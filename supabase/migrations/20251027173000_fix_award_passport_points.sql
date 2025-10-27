-- Fix: guard against missing passport activity when awarding points for MOOC completion
-- This function replaces the previous award_passport_points_for_mooc_completion
-- It checks that the referenced passport_activity exists before attempting insert

CREATE OR REPLACE FUNCTION public.award_passport_points_for_mooc_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id uuid;
  v_points integer;
  v_activity_exists boolean := false;
  v_user_id uuid;
  v_already_awarded boolean := false;
BEGIN
  -- Only proceed when enrollment is marked completed (INSERT or UPDATE)
  IF (TG_OP = 'UPDATE') THEN
    IF NOT (NEW.completed IS DISTINCT FROM OLD.completed AND NEW.completed = true) THEN
      RETURN NEW;
    END IF;
  ELSIF (TG_OP = 'INSERT') THEN
    IF NOT (NEW.completed = true) THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Get course passport integration
  SELECT passport_activity_id, passport_points
  INTO v_activity_id, v_points
  FROM public.mooc_courses
  WHERE id = NEW.course_id;

  IF v_activity_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.passport_activities WHERE id = v_activity_id) INTO v_activity_exists;
  END IF;

  IF v_activity_id IS NOT NULL AND v_activity_exists AND v_points IS NOT NULL AND v_points > 0 THEN
    -- Resolve user_id from the enrollment row (do NOT reference NEW.student_id)
    SELECT user_id INTO v_user_id
    FROM public.mooc_enrollments
    WHERE id = NEW.id
    LIMIT 1;

    IF v_user_id IS NULL THEN
      RAISE NOTICE 'award_passport_points_for_mooc_completion: no user_id found for enrollment %', NEW.id;
      RETURN NEW;
    END IF;

    -- Prevent duplicate awards for same enrollment/activity/source
    SELECT EXISTS(
      SELECT 1 FROM public.passport_points_ledger
      WHERE activity_id = v_activity_id
        AND related_type = 'mooc_enrollment'
        AND related_id = NEW.id
        AND source = 'mooc_auto'
    ) INTO v_already_awarded;

    IF NOT v_already_awarded THEN
      INSERT INTO public.passport_points_ledger (
        user_id,
        points,
        pathway_type,
        activity_id,
        reason,
        source,
        related_type,
        related_id,
        metadata
      ) VALUES (
        v_user_id,
        v_points,
        'conocimiento',
        v_activity_id,
        'Curso MOOC completado',
        'mooc_auto',
        'mooc_enrollment',
        NEW.id,
        jsonb_build_object(
          'course_id', NEW.course_id,
          'completion_date', NEW.updated_at,
          -- Don't reference NEW.final_score directly (may not exist); read from table if present
          'final_score', (
            SELECT final_score FROM public.mooc_enrollments WHERE id = NEW.id
          )
        )
      );

      RAISE NOTICE 'Awarded % points to user % for completing MOOC course', v_points, v_user_id;
    ELSE
      RAISE NOTICE 'award_passport_points_for_mooc_completion: points already awarded for enrollment % (activity %)', NEW.id, v_activity_id;
    END IF;
  ELSE
    IF v_activity_id IS NOT NULL AND NOT v_activity_exists THEN
      RAISE NOTICE 'award_passport_points_for_mooc_completion: passport_activity_id % not found, skipping points award for enrollment %', v_activity_id, NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger to ensure the function is used
DROP TRIGGER IF EXISTS trigger_award_mooc_passport_points ON public.mooc_enrollments;
-- Fire after INSERT OR UPDATE so the function runs when enrollments are created or updated
CREATE TRIGGER trigger_award_mooc_passport_points
  AFTER INSERT OR UPDATE ON public.mooc_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.award_passport_points_for_mooc_completion();
