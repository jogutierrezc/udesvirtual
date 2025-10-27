-- ============================================
-- SCRIPT DE PRUEBA PARA VERIFICAR ACCESO A HERO_CAROUSEL
-- ============================================

-- 1. Verificar que la tabla existe
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_name = 'hero_carousel' AND table_schema = 'public';

-- 2. Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'hero_carousel' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'hero_carousel';

-- 4. Verificar que hay datos de ejemplo
SELECT id, title, media_type, active, order_index
FROM public.hero_carousel
ORDER BY order_index;

-- 5. Verificar permisos del usuario actual (ejecutar como admin)
-- SELECT auth.uid() as current_user_id;

-- 6. Verificar si el usuario es admin
-- SELECT ur.role
-- FROM user_roles ur
-- WHERE ur.user_id = auth.uid();