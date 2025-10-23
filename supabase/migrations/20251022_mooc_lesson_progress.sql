-- Crear tabla para rastrear el progreso de lecciones individuales
CREATE TABLE IF NOT EXISTS mooc_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES mooc_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON mooc_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON mooc_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON mooc_lesson_progress(completed);

-- RLS Policies
ALTER TABLE mooc_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver su propio progreso
CREATE POLICY "Users can view own lesson progress"
  ON mooc_lesson_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden insertar su propio progreso
CREATE POLICY "Users can insert own lesson progress"
  ON mooc_lesson_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar su propio progreso
CREATE POLICY "Users can update own lesson progress"
  ON mooc_lesson_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Función para actualizar el progreso del curso automáticamente
CREATE OR REPLACE FUNCTION update_course_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
  new_progress INTEGER;
  course_id_var UUID;
BEGIN
  -- Obtener el course_id de la lección
  SELECT ml.course_id INTO course_id_var
  FROM mooc_lessons ml
  WHERE ml.id = NEW.lesson_id;

  -- Contar lecciones totales del curso
  SELECT COUNT(*) INTO total_lessons
  FROM mooc_lessons
  WHERE mooc_lessons.course_id = course_id_var;

  -- Contar lecciones completadas por el usuario
  SELECT COUNT(*) INTO completed_lessons
  FROM mooc_lesson_progress mlp
  JOIN mooc_lessons ml ON mlp.lesson_id = ml.id
  WHERE ml.course_id = course_id_var
    AND mlp.user_id = NEW.user_id
    AND mlp.completed = TRUE;

  -- Calcular progreso en porcentaje
  IF total_lessons > 0 THEN
    new_progress := ROUND((completed_lessons::NUMERIC / total_lessons::NUMERIC) * 100);
  ELSE
    new_progress := 0;
  END IF;

  -- Actualizar el progreso en mooc_enrollments
  UPDATE mooc_enrollments
  SET 
    progress = new_progress,
    completed = (new_progress = 100),
    updated_at = NOW()
  WHERE user_id = NEW.user_id
    AND course_id = course_id_var;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar progreso cuando se completa una lección
DROP TRIGGER IF EXISTS trigger_update_course_progress ON mooc_lesson_progress;
CREATE TRIGGER trigger_update_course_progress
  AFTER INSERT OR UPDATE ON mooc_lesson_progress
  FOR EACH ROW
  WHEN (NEW.completed = TRUE)
  EXECUTE FUNCTION update_course_progress();

-- Agregar columna updated_at a mooc_enrollments si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mooc_enrollments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE mooc_enrollments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;
