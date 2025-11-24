-- Permitir a los profesores leer las lecciones de sus propios cursos
CREATE POLICY "professors_read_own_course_lessons" ON mooc_lessons
FOR SELECT
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
);

-- Permitir a los profesores actualizar las lecciones de sus propios cursos
CREATE POLICY "professors_update_own_course_lessons" ON mooc_lessons
FOR UPDATE
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
);

-- Permitir a los profesores insertar lecciones en sus propios cursos
CREATE POLICY "professors_insert_own_course_lessons" ON mooc_lessons
FOR INSERT
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

-- Permitir a los profesores eliminar lecciones de sus propios cursos
CREATE POLICY "professors_delete_own_course_lessons" ON mooc_lessons
FOR DELETE
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
);
