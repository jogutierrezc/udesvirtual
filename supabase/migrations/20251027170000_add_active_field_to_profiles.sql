-- Add active field to profiles table for admin management

-- Add active field to profiles table
ALTER TABLE public.profiles
ADD COLUMN active BOOLEAN DEFAULT TRUE;

-- Update existing profiles to be active by default
UPDATE public.profiles SET active = TRUE WHERE active IS NULL;

-- Add policy for admins to update UDES student profiles
CREATE POLICY "Admins can update UDES student profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND email LIKE '%@%.udes.edu.co'
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND email LIKE '%@%.udes.edu.co'
  );

-- Add comment to the active field
COMMENT ON COLUMN public.profiles.active IS 'Whether the student profile is active/enabled. Can be disabled by admins.';