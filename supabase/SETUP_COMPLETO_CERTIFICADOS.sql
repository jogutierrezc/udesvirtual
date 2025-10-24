-- ============================================
-- SCRIPT COMPLETO DE CONFIGURACIÓN DE SUPABASE
-- Sistema de Certificados MOOC
-- ============================================
-- Este script configura toda la infraestructura necesaria desde cero
-- Ejecutar en Supabase SQL Editor en orden

-- ============================================
-- PASO 1: EXTENSIONES REQUERIDAS
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PASO 2: TIPOS ENUM
-- ============================================

-- Tipo para estados de solicitudes/cursos
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('student', 'professor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- PASO 3: FUNCIONES DE UTILIDAD
-- ============================================

-- La función has_role ya existe en el sistema, la utilizamos tal como está
-- No necesitamos recrearla porque ya está siendo usada por otras políticas RLS

-- ============================================
-- PASO 4: TABLA DE CERTIFICADOS
-- ============================================

CREATE TABLE IF NOT EXISTS public.mooc_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.mooc_courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hours integer NOT NULL DEFAULT 0,
  verification_code text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  md5_hash text,
  CONSTRAINT unique_user_course_cert UNIQUE(course_id, user_id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.mooc_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON public.mooc_certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON public.mooc_certificates(verification_code);

-- ============================================
-- PASO 5: POLÍTICAS RLS PARA CERTIFICADOS
-- ============================================

ALTER TABLE public.mooc_certificates ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "cert_owner_select" ON public.mooc_certificates;
DROP POLICY IF EXISTS "cert_system_insert" ON public.mooc_certificates;
DROP POLICY IF EXISTS "cert_admin_modify" ON public.mooc_certificates;
DROP POLICY IF EXISTS "cert_admin_delete" ON public.mooc_certificates;

-- Política SELECT: Los estudiantes pueden ver sus propios certificados
CREATE POLICY "cert_owner_select"
  ON public.mooc_certificates FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política INSERT: Permitir al sistema insertar (función SECURITY DEFINER)
CREATE POLICY "cert_system_insert"
  ON public.mooc_certificates FOR INSERT
  WITH CHECK (true);

-- Política UPDATE: Solo administradores
CREATE POLICY "cert_admin_modify"
  ON public.mooc_certificates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política DELETE: Solo administradores
CREATE POLICY "cert_admin_delete"
  ON public.mooc_certificates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- PASO 6: FUNCIÓN PARA EMITIR CERTIFICADOS
-- ============================================

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
  -- Solo proceder cuando el curso se marca como completado
  IF (TG_OP = 'UPDATE' AND NEW.completed = TRUE AND (OLD.completed IS DISTINCT FROM TRUE)) THEN
    
    -- Calcular horas totales del curso
    SELECT COALESCE(SUM(duration_hours), 0) INTO hours_total
    FROM mooc_lessons
    WHERE course_id = NEW.course_id;

    -- Generar código de verificación único
    vcode := 'CERT-' || 
             to_char(now(), 'YYYY') || '-' || 
             upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 10));

    -- Generar hash MD5 para verificación
    md5val := md5(NEW.user_id::text || '-' || NEW.course_id::text || '-' || now()::text);

    -- Insertar certificado (si no existe)
    INSERT INTO mooc_certificates (
      course_id, 
      user_id, 
      hours, 
      verification_code, 
      issued_at, 
      md5_hash
    )
    VALUES (
      NEW.course_id, 
      NEW.user_id, 
      hours_total, 
      vcode, 
      now(), 
      md5val
    )
    ON CONFLICT (course_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Certificado emitido para usuario % en curso %', NEW.user_id, NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- PASO 7: TRIGGER PARA EMITIR CERTIFICADOS
-- ============================================

DROP TRIGGER IF EXISTS trg_issue_certificate_on_completion ON public.mooc_enrollments;

CREATE TRIGGER trg_issue_certificate_on_completion
  AFTER UPDATE ON public.mooc_enrollments
  FOR EACH ROW
  WHEN (NEW.completed = TRUE AND (OLD.completed IS DISTINCT FROM TRUE))
  EXECUTE FUNCTION public.issue_certificate_on_completion();

-- ============================================
-- PASO 8: BACKFILL - GENERAR CERTIFICADOS EXISTENTES
-- ============================================
-- Este paso genera certificados para todos los cursos ya completados

INSERT INTO mooc_certificates (
  course_id, 
  user_id, 
  hours, 
  verification_code, 
  issued_at, 
  md5_hash
)
SELECT 
  e.course_id,
  e.user_id,
  COALESCE((
    SELECT SUM(duration_hours) 
    FROM mooc_lessons 
    WHERE course_id = e.course_id
  ), 0) as hours,
  'CERT-' || 
    to_char(now(), 'YYYY') || '-' || 
    upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 10)) as verification_code,
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

-- ============================================
-- PASO 9: POLÍTICAS RLS ADICIONALES (SI ES NECESARIO)
-- ============================================

-- Asegurar que mooc_enrollments permita SELECT para el progreso
DROP POLICY IF EXISTS "enrollments_select_policy" ON public.mooc_enrollments;
CREATE POLICY "enrollments_select_policy"
  ON public.mooc_enrollments FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'professor')
    )
  );

-- ============================================
-- PASO 10: VERIFICACIÓN
-- ============================================

-- Verificar que todo está configurado correctamente
DO $$
DECLARE
  cert_count integer;
  enrollment_count integer;
BEGIN
  -- Contar certificados
  SELECT COUNT(*) INTO cert_count FROM mooc_certificates;
  
  -- Contar inscripciones completadas
  SELECT COUNT(*) INTO enrollment_count 
  FROM mooc_enrollments 
  WHERE completed = true;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN DEL SISTEMA DE CERTIFICADOS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Certificados emitidos: %', cert_count;
  RAISE NOTICE 'Cursos completados: %', enrollment_count;
  RAISE NOTICE '========================================';
  
  IF cert_count < enrollment_count THEN
    RAISE WARNING 'Hay cursos completados sin certificados. Ejecuta el backfill.';
  ELSE
    RAISE NOTICE 'Sistema de certificados configurado correctamente!';
  END IF;
END $$;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- El sistema de certificados está ahora completamente configurado.
-- Los certificados se emitirán automáticamente cuando un estudiante
-- complete un curso (mooc_enrollments.completed = true).
