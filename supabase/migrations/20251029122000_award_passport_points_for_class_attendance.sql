-- Migration: Trigger to auto-award passport points for attendance in eligible classes
-- Awards points for 'clase_espejo', 'coil', and 'masterclass' when attendance is registered

-- Assumes a table public.class_attendance with fields: id, class_id, user_id, attended (boolean)
-- and that public.classes has class_type and passport_points fields

CREATE OR REPLACE FUNCTION public.award_passport_points_for_class_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_class_type TEXT;
  v_points INTEGER;
  v_user_id UUID;
  v_class_id UUID;
  v_already_awarded BOOLEAN := FALSE;
BEGIN
  -- Only award when attendance flips to true
  IF (TG_OP = 'UPDATE') THEN
    IF NOT (NEW.attended IS DISTINCT FROM OLD.attended AND NEW.attended = TRUE) THEN
      RETURN NEW;
    END IF;
  ELSIF (TG_OP = 'INSERT') THEN
    IF NOT (NEW.attended = TRUE) THEN
      RETURN NEW;
    END IF;
  END IF;

  v_class_id := NEW.class_id;
  v_user_id := NEW.user_id;

  SELECT class_type, passport_points INTO v_class_type, v_points
  FROM public.classes WHERE id = v_class_id;

  IF v_class_type NOT IN ('mirror', 'coil', 'masterclass') OR v_points IS NULL OR v_points <= 0 THEN
    RETURN NEW;
  END IF;

  -- Prevent duplicate awards
  SELECT EXISTS(
    SELECT 1 FROM public.passport_points_ledger
    WHERE user_id = v_user_id
      AND related_type = 'class_attendance'
      AND related_id = NEW.id
      AND source = 'class_auto'
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
      NULL,
      NULL,
      'Asistencia a clase tipo ' || v_class_type,
      'class_auto',
      'class_attendance',
      NEW.id,
      jsonb_build_object('class_id', v_class_id, 'attendance_date', now())
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on class_attendance
DROP TRIGGER IF EXISTS trigger_award_class_passport_points ON public.class_attendance;
CREATE TRIGGER trigger_award_class_passport_points
  AFTER INSERT OR UPDATE ON public.class_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.award_passport_points_for_class_attendance();
