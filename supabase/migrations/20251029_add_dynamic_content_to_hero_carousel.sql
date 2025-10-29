-- ============================================
-- Agregar soporte para contenido dinámico en hero_carousel
-- ============================================
-- Permite mostrar cursos MOOC, COIL, clases espejo dinámicamente en el carrusel

-- Agregar columnas para contenido dinámico
ALTER TABLE public.hero_carousel
ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'static' CHECK (content_type IN ('static', 'mooc', 'coil', 'clase_espejo', 'masterclass')),
ADD COLUMN IF NOT EXISTS content_id uuid;

-- Comentarios
COMMENT ON COLUMN public.hero_carousel.content_type IS 'Tipo de contenido: static (manual), mooc, coil, clase_espejo, masterclass';
COMMENT ON COLUMN public.hero_carousel.content_id IS 'ID del contenido referenciado (course_id para mooc, proposal_id para coil, class_id para clases)';

-- Modificar image_url para que sea nullable (cuando es contenido dinámico, se usa la imagen del curso)
ALTER TABLE public.hero_carousel
ALTER COLUMN image_url DROP NOT NULL;

-- Si content_type es 'static', image_url debe estar presente
-- Si content_type es dinámico (mooc, coil, etc.), content_id debe estar presente
-- Esto se validará en el nivel de aplicación para mayor flexibilidad
