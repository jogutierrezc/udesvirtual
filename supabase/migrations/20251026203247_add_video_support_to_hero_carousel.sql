-- ============================================
-- AGREGAR SOPORTE PARA VIDEOS EN EL CARRUSEL HERO
-- ============================================

-- Agregar columna video_url a la tabla hero_carousel
ALTER TABLE public.hero_carousel
ADD COLUMN IF NOT EXISTS video_url text;

-- Agregar columna media_type para distinguir entre imagen y video
ALTER TABLE public.hero_carousel
ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video'));

-- Actualizar comentario de la tabla
COMMENT ON COLUMN public.hero_carousel.video_url IS 'URL del video (opcional, si se especifica se muestra video en lugar de imagen)';
COMMENT ON COLUMN public.hero_carousel.media_type IS 'Tipo de medio: image o video';

-- ============================================
-- STORAGE BUCKET PARA VIDEOS
-- ============================================

-- Crear bucket para videos del carrusel (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('carousel-videos', 'carousel-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para videos: Cualquiera puede ver, solo admins pueden subir/actualizar/eliminar
DROP POLICY IF EXISTS "carousel_videos_public_read" ON storage.objects;
CREATE POLICY "carousel_videos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'carousel-videos');

DROP POLICY IF EXISTS "carousel_videos_admin_insert" ON storage.objects;
CREATE POLICY "carousel_videos_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'carousel-videos'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "carousel_videos_admin_update" ON storage.objects;
CREATE POLICY "carousel_videos_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'carousel-videos'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "carousel_videos_admin_delete" ON storage.objects;
CREATE POLICY "carousel_videos_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'carousel-videos'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );