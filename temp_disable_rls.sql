-- ============================================
-- SOLUCIÓN TEMPORAL: DESHABILITAR RLS PARA TESTING
-- ============================================

-- Deshabilitar RLS temporalmente para probar
ALTER TABLE public.hero_carousel DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'hero_carousel' AND schemaname = 'public';

-- ============================================
-- PARA RESTAURAR RLS DESPUÉS (ejecutar después de probar):
-- ============================================

-- ALTER TABLE public.hero_carousel ENABLE ROW LEVEL SECURITY;

-- -- Recrear políticas si es necesario
-- DROP POLICY IF EXISTS "hero_carousel_public_select" ON public.hero_carousel;
-- CREATE POLICY "hero_carousel_public_select"
--   ON public.hero_carousel FOR SELECT
--   USING (true);

-- DROP POLICY IF EXISTS "hero_carousel_admin_insert" ON public.hero_carousel;
-- CREATE POLICY "hero_carousel_admin_insert"
--   ON public.hero_carousel FOR INSERT
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM user_roles
--       WHERE user_id = auth.uid()
--       AND role = 'admin'
--     )
--   );

-- DROP POLICY IF EXISTS "hero_carousel_admin_update" ON public.hero_carousel;
-- CREATE POLICY "hero_carousel_admin_update"
--   ON public.hero_carousel FOR UPDATE
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_roles
--       WHERE user_id = auth.uid()
--       AND role = 'admin'
--     )
--   );

-- DROP POLICY IF EXISTS "hero_carousel_admin_delete" ON public.hero_carousel;
-- CREATE POLICY "hero_carousel_admin_delete"
--   ON public.hero_carousel FOR DELETE
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_roles
--       WHERE user_id = auth.uid()
--       AND role = 'admin'
--     )
--   );