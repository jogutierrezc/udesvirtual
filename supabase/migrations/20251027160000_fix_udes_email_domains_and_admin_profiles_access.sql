-- Fix UDES email domain filtering and admin access to profiles

-- Update is_udes_email function to accept all UDES domains, not just @mail.udes.edu.co
CREATE OR REPLACE FUNCTION is_udes_email(user_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;

  -- Check for any UDES domain (mail.udes.edu.co, valledupar.udes.edu.co, etc.)
  RETURN user_email LIKE '%@%.udes.edu.co';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy for admins to read UDES student profiles
CREATE POLICY "Admins can read UDES student profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND email LIKE '%@%.udes.edu.co'
  );

COMMENT ON FUNCTION is_udes_email IS 'Verifica si un usuario tiene correo institucional de cualquier dominio UDES (*.udes.edu.co)';