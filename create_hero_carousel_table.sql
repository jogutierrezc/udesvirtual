-- ============================================
-- CREAR TABLA HERO_CAROUSEL COMPLETA CON SOPORTE PARA VIDEOS
-- ============================================
-- Ejecutar este script en el SQL Editor de Supabase

-- Crear tabla hero_carousel con todos los campos necesarios
CREATE TABLE IF NOT EXISTS public.hero_carousel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  video_url text,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  link_url text,
  order_index integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_hero_carousel_active ON public.hero_carousel(active);
CREATE INDEX IF NOT EXISTS idx_hero_carousel_order ON public.hero_carousel(order_index);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.hero_carousel ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "hero_carousel_public_select" ON public.hero_carousel;
DROP POLICY IF EXISTS "hero_carousel_admin_insert" ON public.hero_carousel;
DROP POLICY IF EXISTS "hero_carousel_admin_update" ON public.hero_carousel;
DROP POLICY IF EXISTS "hero_carousel_admin_delete" ON public.hero_carousel;

-- Política SELECT: Cualquiera puede ver las imágenes activas del carrusel
CREATE POLICY "hero_carousel_public_select"
  ON public.hero_carousel FOR SELECT
  USING (true);

-- Política INSERT: Solo administradores pueden agregar imágenes
CREATE POLICY "hero_carousel_admin_insert"
  ON public.hero_carousel FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Política UPDATE: Solo administradores pueden actualizar imágenes
CREATE POLICY "hero_carousel_admin_update"
  ON public.hero_carousel FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Política DELETE: Solo administradores pueden eliminar imágenes
CREATE POLICY "hero_carousel_admin_delete"
  ON public.hero_carousel FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_hero_carousel_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trg_update_hero_carousel_updated_at ON public.hero_carousel;
CREATE TRIGGER trg_update_hero_carousel_updated_at
  BEFORE UPDATE ON public.hero_carousel
  FOR EACH ROW
  EXECUTE FUNCTION update_hero_carousel_updated_at();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Crear bucket para imágenes del carrusel (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('carousel-images', 'carousel-images', true)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para videos del carrusel (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('carousel-videos', 'carousel-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para imágenes: Cualquiera puede ver, solo admins pueden subir/actualizar/eliminar
DROP POLICY IF EXISTS "carousel_images_public_read" ON storage.objects;
CREATE POLICY "carousel_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'carousel-images');

DROP POLICY IF EXISTS "carousel_images_admin_insert" ON storage.objects;
CREATE POLICY "carousel_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'carousel-images'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "carousel_images_admin_update" ON storage.objects;
CREATE POLICY "carousel_images_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'carousel-images'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "carousel_images_admin_delete" ON storage.objects;
CREATE POLICY "carousel_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'carousel-images'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

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

-- ============================================
-- DATOS INICIALES DE EJEMPLO
-- ============================================

-- Insertar algunas imágenes de ejemplo (opcional)
INSERT INTO public.hero_carousel (title, description, image_url, link_url, order_index, active, media_type)
VALUES
  (
    'Bienvenido a UdesVirtual',
    'Explora nuestra plataforma de cursos MOOC de alta calidad',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&h=720&fit=crop',
    '/catalog',
    1,
    true,
    'image'
  ),
  (
    'Aprende a tu ritmo',
    'Cursos flexibles diseñados para tu éxito profesional',
    'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1920&h=720&fit=crop',
    '/catalog',
    2,
    true,
    'image'
  ),
  (
    'Certificados verificables',
    'Obtén certificados al completar tus cursos',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920&h=720&fit=crop',
    '/catalog',
    3,
    true,
    'image'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE public.hero_carousel IS 'Tabla para gestionar las imágenes y videos del carrusel principal de la página de inicio';
COMMENT ON COLUMN public.hero_carousel.title IS 'Título que se muestra en el slide del carrusel';
COMMENT ON COLUMN public.hero_carousel.description IS 'Descripción o subtítulo que se muestra en el slide';
COMMENT ON COLUMN public.hero_carousel.image_url IS 'URL de la imagen (requerida para slides de imagen)';
COMMENT ON COLUMN public.hero_carousel.video_url IS 'URL del video (opcional, para slides de video)';
COMMENT ON COLUMN public.hero_carousel.media_type IS 'Tipo de medio: image o video';
COMMENT ON COLUMN public.hero_carousel.link_url IS 'URL a la que redirige al hacer clic en el slide';
COMMENT ON COLUMN public.hero_carousel.order_index IS 'Orden en el que aparece el slide en el carrusel (menor = primero)';
COMMENT ON COLUMN public.hero_carousel.active IS 'Si el slide está activo y debe mostrarse en el carrusel';