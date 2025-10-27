-- ============================================
-- VERIFICAR PERMISOS DE ADMIN Y RLS
-- ============================================

-- 1. Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'hero_carousel' AND schemaname = 'public';

-- 2. Verificar políticas RLS detalladas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'hero_carousel'
ORDER BY cmd;

-- 3. Verificar si el usuario actual es admin (descomenta y ejecuta)
-- SELECT
--   auth.uid() as current_user_id,
--   ur.role as user_role
-- FROM user_roles ur
-- WHERE ur.user_id = auth.uid();

-- 4. Verificar que existe la tabla user_roles
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'user_roles' AND table_schema = 'public';

-- 5. Verificar estructura de user_roles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles' AND table_schema = 'public';

-- 6. PRUEBA TEMPORAL: Deshabilitar RLS (descomenta solo si quieres probar)
-- ALTER TABLE public.hero_carousel DISABLE ROW LEVEL SECURITY;

-- 7. PRUEBA TEMPORAL: Política abierta para testing (descomenta solo si quieres probar)
-- DROP POLICY IF EXISTS "hero_carousel_temp_open" ON public.hero_carousel;
-- CREATE POLICY "hero_carousel_temp_open"
--   ON public.hero_carousel FOR ALL
--   USING (true)
--   WITH CHECK (true);