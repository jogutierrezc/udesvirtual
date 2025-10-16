-- Add UDES professor information to course_offerings table
ALTER TABLE public.course_offerings
ADD COLUMN udes_professor_name text,
ADD COLUMN udes_professor_program text,
ADD COLUMN udes_professor_phone text,
ADD COLUMN udes_professor_email text;

-- Drop existing RLS policies for classes
DROP POLICY IF EXISTS "Professors can create classes" ON public.classes;
DROP POLICY IF EXISTS "Creators and admins can delete classes" ON public.classes;

-- Create new policies for classes allowing admin full control
CREATE POLICY "Admins and professors can create classes" 
ON public.classes 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'professor'::app_role) AND auth.uid() = created_by)
);

CREATE POLICY "Creators and admins can delete classes" 
ON public.classes 
FOR DELETE 
USING (
  auth.uid() = created_by OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Drop existing RLS policies for course_offerings
DROP POLICY IF EXISTS "Professors can create offerings" ON public.course_offerings;
DROP POLICY IF EXISTS "Creators and admins can delete offerings" ON public.course_offerings;

-- Create new policies for course_offerings allowing admin full control
CREATE POLICY "Admins and professors can create offerings" 
ON public.course_offerings 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'professor'::app_role) AND auth.uid() = created_by)
);

CREATE POLICY "Creators and admins can delete offerings" 
ON public.course_offerings 
FOR DELETE 
USING (
  auth.uid() = created_by OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Drop existing RLS policies for teachers
DROP POLICY IF EXISTS "Professors can create teacher profiles" ON public.teachers;
DROP POLICY IF EXISTS "Creators and admins can delete teacher profiles" ON public.teachers;

-- Create new policies for teachers allowing admin full control
CREATE POLICY "Admins and professors can create teacher profiles" 
ON public.teachers 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'professor'::app_role) AND auth.uid() = user_id)
);

CREATE POLICY "Creators and admins can delete teacher profiles" 
ON public.teachers 
FOR DELETE 
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create function to auto-approve content created by admins
CREATE OR REPLACE FUNCTION public.auto_approve_admin_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(NEW.created_by, 'admin'::app_role) THEN
    NEW.status = 'approved'::request_status;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for classes
CREATE TRIGGER auto_approve_admin_classes
BEFORE INSERT ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_admin_content();

-- Create trigger for course_offerings
CREATE TRIGGER auto_approve_admin_offerings
BEFORE INSERT ON public.course_offerings
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_admin_content();

-- Create function to auto-approve teachers created by admins
CREATE OR REPLACE FUNCTION public.auto_approve_admin_teachers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.status = 'approved'::request_status;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for teachers
CREATE TRIGGER auto_approve_admin_teacher_profiles
BEFORE INSERT ON public.teachers
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_admin_teachers();