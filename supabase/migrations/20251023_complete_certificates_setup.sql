-- Complete certificate system migration
-- This migration sets up the entire certificate infrastructure

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Create mooc_certificates table
CREATE TABLE IF NOT EXISTS public.mooc_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.mooc_courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hours integer NOT NULL DEFAULT 0,
  verification_code text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  md5_hash text,
  UNIQUE(course_id, user_id)
);

-- Step 3: Enable RLS
ALTER TABLE public.mooc_certificates ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if any
DROP POLICY IF EXISTS "cert_owner_select" ON public.mooc_certificates;
DROP POLICY IF EXISTS "cert_system_insert" ON public.mooc_certificates;
DROP POLICY IF EXISTS "cert_admin_modify" ON public.mooc_certificates;
DROP POLICY IF EXISTS "cert_admin_delete" ON public.mooc_certificates;

-- Step 5: Create RLS policies
-- Students can view their own certificates
CREATE POLICY "cert_owner_select"
  ON public.mooc_certificates FOR SELECT
  USING (auth.uid() = user_id);

-- Allow system to insert certificates (SECURITY DEFINER function bypasses RLS)
CREATE POLICY "cert_system_insert"
  ON public.mooc_certificates FOR INSERT
  WITH CHECK (true);

-- Only admins can update/delete
CREATE POLICY "cert_admin_modify"
  ON public.mooc_certificates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "cert_admin_delete"
  ON public.mooc_certificates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Step 6: Create trigger function
CREATE OR REPLACE FUNCTION public.issue_certificate_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    FROM mooc_lessons
    WHERE course_id = NEW.course_id;

    -- generate verification code using gen_random_uuid
    vcode := 'CERT-' || to_char(now(), 'YYYY') || '-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 10));

    -- md5 hash of user, course, issued_at
    md5val := md5(NEW.user_id::text || '-' || NEW.course_id::text || '-' || now()::text);

    -- insert if not exists
    INSERT INTO mooc_certificates (course_id, user_id, hours, verification_code, issued_at, md5_hash)
    VALUES (NEW.course_id, NEW.user_id, hours_total, vcode, now(), md5val)
    ON CONFLICT (course_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Certificate issued for user % course %', NEW.user_id, NEW.course_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 7: Create trigger
DROP TRIGGER IF EXISTS trg_issue_certificate_on_completion ON public.mooc_enrollments;
CREATE TRIGGER trg_issue_certificate_on_completion
  AFTER UPDATE ON public.mooc_enrollments
  FOR EACH ROW
  WHEN (NEW.completed = TRUE AND (OLD.completed IS DISTINCT FROM TRUE))
  EXECUTE FUNCTION public.issue_certificate_on_completion();

-- Step 8: Backfill certificates for already completed courses
INSERT INTO mooc_certificates (course_id, user_id, hours, verification_code, issued_at, md5_hash)
SELECT 
  e.course_id,
  e.user_id,
  COALESCE((
    SELECT SUM(duration_hours) 
    FROM mooc_lessons 
    WHERE course_id = e.course_id
  ), 0) as hours,
  'CERT-' || to_char(now(), 'YYYY') || '-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 10)) as verification_code,
  now() as issued_at,
  md5(e.user_id::text || '-' || e.course_id::text || '-' || now()::text) as md5_hash
FROM mooc_enrollments e
WHERE e.completed = true
  AND NOT EXISTS (
    SELECT 1 FROM mooc_certificates cert 
    WHERE cert.course_id = e.course_id 
    AND cert.user_id = e.user_id
  )
ON CONFLICT (course_id, user_id) DO NOTHING;
