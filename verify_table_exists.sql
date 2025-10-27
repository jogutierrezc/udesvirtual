-- ============================================
-- VERIFICACIÓN COMPLETA DE LA TABLA HERO_CAROUSEL
-- ============================================

-- 1. Verificar que la tabla existe físicamente
SELECT
  schemaname,
  tablename,
  tableowner,
  tablespace,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity
FROM pg_tables
WHERE tablename = 'hero_carousel';

-- 2. Verificar columnas de la tabla
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'hero_carousel' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar si hay datos en la tabla
SELECT COUNT(*) as total_slides FROM public.hero_carousel;

-- 4. Verificar índices
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'hero_carousel';

-- 5. Verificar triggers
SELECT
  event_object_schema,
  event_object_table,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'hero_carousel';

-- 6. Intentar una consulta simple
SELECT id, title, active FROM public.hero_carousel LIMIT 5;

-- 7. Verificar permisos de la tabla
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'hero_carousel' AND table_schema = 'public';