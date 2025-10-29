-- ============================================
-- Agregar campo button_text a hero_carousel
-- ============================================
-- Permite configurar el texto del botón del carrusel desde el admin

-- Agregar columna button_text
ALTER TABLE public.hero_carousel
ADD COLUMN IF NOT EXISTS button_text text DEFAULT 'Explorar cursos';

-- Comentario
COMMENT ON COLUMN public.hero_carousel.button_text IS 'Texto personalizado para el botón del slide (por defecto: "Explorar cursos")';

-- Actualizar slides existentes con el valor por defecto si es necesario
UPDATE public.hero_carousel
SET button_text = 'Explorar cursos'
WHERE button_text IS NULL;
