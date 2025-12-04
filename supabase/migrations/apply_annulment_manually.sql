-- Script para aplicar manualmente la migración de campos de anulación
-- Ejecuta esto directamente en Supabase SQL Editor si las columnas no existen

-- Verificar si las columnas existen
DO $$ 
BEGIN
    -- Agregar is_annulled si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mooc_exam_attempts' 
        AND column_name = 'is_annulled'
    ) THEN
        ALTER TABLE mooc_exam_attempts 
        ADD COLUMN is_annulled boolean DEFAULT false;
        
        RAISE NOTICE 'Columna is_annulled agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna is_annulled ya existe';
    END IF;

    -- Agregar annulment_reason si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mooc_exam_attempts' 
        AND column_name = 'annulment_reason'
    ) THEN
        ALTER TABLE mooc_exam_attempts 
        ADD COLUMN annulment_reason text;
        
        RAISE NOTICE 'Columna annulment_reason agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna annulment_reason ya existe';
    END IF;
END $$;

-- Agregar comentarios
COMMENT ON COLUMN mooc_exam_attempts.is_annulled IS 'Indica si el intento de examen fue anulado (ej: por plagio)';
COMMENT ON COLUMN mooc_exam_attempts.annulment_reason IS 'Razón de la anulación (ej: "Plagio detectado", "Falla técnica")';

-- Verificar que las columnas se crearon
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mooc_exam_attempts' 
AND column_name IN ('is_annulled', 'annulment_reason')
ORDER BY column_name;
