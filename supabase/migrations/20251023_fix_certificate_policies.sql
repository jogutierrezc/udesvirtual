-- Fix RLS policies for mooc_certificates to ensure proper access

-- Drop existing policies
DROP POLICY IF EXISTS "cert_owner_select" ON public.mooc_certificates;
DROP POLICY IF EXISTS "cert_admin_modify" ON public.mooc_certificates;

-- Policy for SELECT: students can see their own certificates
CREATE POLICY "cert_owner_select"
  ON public.mooc_certificates FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- Policy for INSERT: allow system/trigger to insert (SECURITY DEFINER function bypasses RLS)
-- Also allow admins to manually insert
CREATE POLICY "cert_system_insert"
  ON public.mooc_certificates FOR INSERT
  WITH CHECK (
    -- Allow if called from a SECURITY DEFINER function (bypass RLS)
    true
  );

-- Policy for UPDATE/DELETE: only admins
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

-- Ensure the trigger function is SECURITY DEFINER (bypasses RLS)
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

    -- generate verification code
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

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_issue_certificate_on_completion ON public.mooc_enrollments;
CREATE TRIGGER trg_issue_certificate_on_completion
  AFTER UPDATE ON public.mooc_enrollments
  FOR EACH ROW
  WHEN (NEW.completed = TRUE AND (OLD.completed IS DISTINCT FROM TRUE))
  EXECUTE FUNCTION public.issue_certificate_on_completion();
