-- Recrear todas las funciones con search_path explícito

-- 1. Función auto_approve_admin_content
CREATE OR REPLACE FUNCTION public.auto_approve_admin_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF public.has_role(NEW.created_by, 'admin'::public.app_role) THEN
    NEW.status = 'approved'::public.request_status;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Función auto_approve_admin_teachers
CREATE OR REPLACE FUNCTION public.auto_approve_admin_teachers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    NEW.status = 'approved'::public.request_status;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Función update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. Función handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  -- Assign default student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student'::public.app_role);
  
  RETURN NEW;
END;
$$;

-- 5. Función calculate_course_duration (ya tiene search_path pero lo recreamos para consistencia)
CREATE OR REPLACE FUNCTION public.calculate_course_duration(course_id_param UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(SUM(duration_hours), 0)::INTEGER
  FROM public.mooc_lessons
  WHERE course_id = course_id_param;
$$;