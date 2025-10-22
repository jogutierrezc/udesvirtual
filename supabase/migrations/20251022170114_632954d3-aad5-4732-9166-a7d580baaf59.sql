-- Actualizar tabla profiles con los campos adicionales requeridos
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_international_student BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_other_university BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private_student BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS university_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Colombia';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Crear tabla de cursos MOOC
CREATE TABLE IF NOT EXISTS public.mooc_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  profession TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  objective TEXT NOT NULL,
  description TEXT NOT NULL,
  course_image_url TEXT,
  intro_video_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status request_status DEFAULT 'pending'::request_status,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de lecciones
CREATE TABLE IF NOT EXISTS public.mooc_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.mooc_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_hours INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  content TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de colaboradores/profesores de cursos
CREATE TABLE IF NOT EXISTS public.mooc_course_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.mooc_courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(course_id, teacher_id)
);

-- Crear tabla de inscripciones a cursos
CREATE TABLE IF NOT EXISTS public.mooc_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.mooc_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  UNIQUE(course_id, user_id)
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.mooc_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mooc_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mooc_course_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mooc_enrollments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para mooc_courses
CREATE POLICY "Anyone can view approved courses"
  ON public.mooc_courses FOR SELECT
  USING (status = 'approved'::request_status OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins and professors can create courses"
  ON public.mooc_courses FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'professor'::app_role));

CREATE POLICY "Admins can update courses"
  ON public.mooc_courses FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creators and admins can delete courses"
  ON public.mooc_courses FOR DELETE
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para mooc_lessons
CREATE POLICY "Anyone can view lessons of approved courses"
  ON public.mooc_lessons FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.mooc_courses
    WHERE id = mooc_lessons.course_id
    AND (status = 'approved'::request_status OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Admins and course creators can manage lessons"
  ON public.mooc_lessons FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.mooc_courses WHERE id = mooc_lessons.course_id AND created_by = auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.mooc_courses WHERE id = mooc_lessons.course_id AND created_by = auth.uid())
  );

-- Políticas RLS para mooc_course_teachers
CREATE POLICY "Anyone can view course teachers"
  ON public.mooc_course_teachers FOR SELECT
  USING (true);

CREATE POLICY "Admins and course creators can manage teachers"
  ON public.mooc_course_teachers FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.mooc_courses WHERE id = mooc_course_teachers.course_id AND created_by = auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.mooc_courses WHERE id = mooc_course_teachers.course_id AND created_by = auth.uid())
  );

-- Políticas RLS para mooc_enrollments
CREATE POLICY "Users can view their own enrollments"
  ON public.mooc_enrollments FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can enroll in courses"
  ON public.mooc_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON public.mooc_enrollments FOR UPDATE
  USING (user_id = auth.uid());

-- Función para calcular duración total del curso
CREATE OR REPLACE FUNCTION public.calculate_course_duration(course_id_param UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(duration_hours), 0)::INTEGER
  FROM public.mooc_lessons
  WHERE course_id = course_id_param;
$$;

-- Triggers para updated_at
CREATE TRIGGER update_mooc_courses_updated_at
  BEFORE UPDATE ON public.mooc_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mooc_lessons_updated_at
  BEFORE UPDATE ON public.mooc_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-aprobar contenido creado por admins
CREATE TRIGGER auto_approve_admin_mooc_courses
  BEFORE INSERT ON public.mooc_courses
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_admin_content();