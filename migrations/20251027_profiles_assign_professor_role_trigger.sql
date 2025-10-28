-- Migration: trigger to auto-assign 'professor' role when profiles.udes_vinculo = 'udes_profesor'
-- This creates a function and trigger that inserts into user_roles when a profile indicates professor vínculo.

BEGIN;

-- Create function to assign role
CREATE OR REPLACE FUNCTION public.assign_professor_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only act when the vínculo is set to 'udes_profesor'
  IF NEW.udes_vinculo = 'udes_profesor' THEN
    -- Insert role if it does not already exist
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = NEW.id AND ur.role = 'professor'
    ) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'professor');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on profiles after insert or update
DROP TRIGGER IF EXISTS trg_assign_professor_role ON public.profiles;
CREATE TRIGGER trg_assign_professor_role
AFTER INSERT OR UPDATE OF udes_vinculo ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_professor_role();

COMMIT;
