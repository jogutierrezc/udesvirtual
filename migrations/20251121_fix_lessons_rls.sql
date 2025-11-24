-- Primero, eliminar políticas existentes que puedan estar en conflicto
DROP POLICY IF EXISTS "professors_read_own_course_lessons" ON mooc_lessons;
DROP POLICY IF EXISTS "professors_update_own_course_lessons" ON mooc_lessons;
DROP POLICY IF EXISTS "professors_insert_own_course_lessons" ON mooc_lessons;
DROP POLICY IF EXISTS "professors_delete_own_course_lessons" ON mooc_lessons;

-- Verificar si RLS está habilitado
ALTER TABLE mooc_lessons ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan leer lecciones de cursos aprobados (estudiantes)
CREATE POLICY "public_read_approved_course_lessons" ON mooc_lessons
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM mooc_courses
    WHERE mooc_courses.id = mooc_lessons.course_id
    AND mooc_courses.status = 'approved'
  )
);

-- Permitir a los profesores y admins gestionar lecciones de sus cursos
CREATE POLICY "professors_manage_own_course_lessons" ON mooc_lessons
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM mooc_courses
    WHERE mooc_courses.id = mooc_lessons.course_id
    AND mooc_courses.created_by = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM mooc_courses
    WHERE mooc_courses.id = mooc_lessons.course_id
    AND mooc_courses.created_by = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
