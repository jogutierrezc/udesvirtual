-- Permitir a los profesores ver las inscripciones de sus propios cursos
CREATE POLICY "professors_view_own_course_enrollments" ON mooc_enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM mooc_courses
    WHERE mooc_courses.id = mooc_enrollments.course_id
    AND mooc_courses.created_by = auth.uid()
  )
);

-- Permitir a los profesores actualizar las inscripciones de sus propios cursos (para retirar/bloquear)
CREATE POLICY "professors_update_own_course_enrollments" ON mooc_enrollments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM mooc_courses
    WHERE mooc_courses.id = mooc_enrollments.course_id
    AND mooc_courses.created_by = auth.uid()
  )
);
