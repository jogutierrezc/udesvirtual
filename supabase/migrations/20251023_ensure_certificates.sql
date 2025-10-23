-- Verificar si la tabla mooc_certificates existe y crearla si no
DO $$
BEGIN
    -- Verificar si la tabla existe
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mooc_certificates') THEN
        -- Crear tabla si no existe
        CREATE TABLE public.mooc_certificates (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          course_id uuid NOT NULL REFERENCES public.mooc_courses(id) ON DELETE CASCADE,
          user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          hours integer NOT NULL DEFAULT 0,
          verification_code text NOT NULL,
          issued_at timestamptz NOT NULL DEFAULT now(),
          md5_hash text,
          UNIQUE(course_id, user_id)
        );
        
        ALTER TABLE public.mooc_certificates ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Table mooc_certificates created successfully';
    ELSE
        RAISE NOTICE 'Table mooc_certificates already exists';
    END IF;
END $$;

-- Verificar y crear políticas RLS
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "cert_owner_select" ON public.mooc_certificates;
    DROP POLICY IF EXISTS "cert_admin_modify" ON public.mooc_certificates;
    
    -- Create policies
    CREATE POLICY "cert_owner_select"
      ON public.mooc_certificates FOR SELECT
      USING (
        auth.uid() = user_id
        OR has_role(auth.uid(), 'admin'::app_role)
        OR EXISTS (
          SELECT 1 FROM public.mooc_courses c
          WHERE c.id = mooc_certificates.course_id AND c.created_by = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.mooc_course_teachers t
          WHERE t.course_id = mooc_certificates.course_id AND t.teacher_id = auth.uid()
        )
      );
    
    CREATE POLICY "cert_admin_modify"
      ON public.mooc_certificates FOR ALL
      USING (has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
      
    RAISE NOTICE 'Policies created successfully';
END $$;

-- Recrear la función y trigger
CREATE OR REPLACE FUNCTION public.issue_certificate_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  hours_total integer;
  vcode text;
  md5val text;
BEGIN
  -- Only proceed when completion flips to true
  IF (TG_OP = 'UPDATE' AND NEW.completed = TRUE AND (OLD.completed IS DISTINCT FROM TRUE)) THEN
    -- compute total hours from lessons of the course
    SELECT COALESCE(SUM(duration_hours),0) INTO hours_total
    FROM public.mooc_lessons
    WHERE course_id = NEW.course_id;

    -- generate verification code
    vcode := 'CERT-' || to_char(now(), 'YYYY') || '-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 10));

    -- md5 hash of user, course, issued_at
    md5val := md5(NEW.user_id::text || '-' || NEW.course_id::text || '-' || now()::text);

    -- insert if not exists
    INSERT INTO public.mooc_certificates (course_id, user_id, hours, verification_code, issued_at, md5_hash)
    VALUES (NEW.course_id, NEW.user_id, hours_total, vcode, now(), md5val)
    ON CONFLICT (course_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Certificate issued for user % course %', NEW.user_id, NEW.course_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_issue_certificate_on_completion ON public.mooc_enrollments;
CREATE TRIGGER trg_issue_certificate_on_completion
  AFTER UPDATE ON public.mooc_enrollments
  FOR EACH ROW
  WHEN (NEW.completed = TRUE AND (OLD.completed IS DISTINCT FROM TRUE))
  EXECUTE FUNCTION public.issue_certificate_on_completion();

RAISE NOTICE 'Trigger created successfully';
