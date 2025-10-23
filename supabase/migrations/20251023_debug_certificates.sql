-- Script de diagnóstico y generación manual de certificados

-- 1. Verificar tabla mooc_certificates
SELECT 'Checking if mooc_certificates table exists...' as step;
SELECT COUNT(*) as certificate_count FROM mooc_certificates;

-- 2. Verificar cursos completados
SELECT 'Checking completed enrollments...' as step;
SELECT 
  e.id,
  e.user_id,
  e.course_id,
  c.title as course_title,
  e.completed,
  e.progress
FROM mooc_enrollments e
JOIN mooc_courses c ON c.id = e.course_id
WHERE e.completed = true;

-- 3. Verificar certificados existentes
SELECT 'Checking existing certificates...' as step;
SELECT 
  cert.id,
  cert.user_id,
  cert.course_id,
  c.title as course_title,
  cert.hours,
  cert.verification_code,
  cert.issued_at
FROM mooc_certificates cert
JOIN mooc_courses c ON c.id = cert.course_id;

-- 4. Generar certificados faltantes para cursos completados
SELECT 'Generating missing certificates...' as step;

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
  );

-- 5. Verificar certificados después de la inserción
SELECT 'Final certificate count...' as step;
SELECT 
  cert.id,
  p.full_name,
  c.title as course_title,
  cert.hours,
  cert.verification_code,
  cert.issued_at
FROM mooc_certificates cert
JOIN mooc_courses c ON c.id = cert.course_id
JOIN profiles p ON p.id = cert.user_id
ORDER BY cert.issued_at DESC;
