DROP POLICY IF EXISTS "Anyone can view approved courses" ON public.mooc_courses;
CREATE POLICY "Approved courses or assigned professors can view courses"
  ON public.mooc_courses FOR SELECT
  USING (
    status = 'approved'::request_status
    OR created_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.mooc_course_teachers teacher_link
      WHERE teacher_link.course_id = mooc_courses.id
        AND teacher_link.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins and creators can update courses" ON public.mooc_courses;
CREATE POLICY "Admins creators and assigned professors can update courses"
  ON public.mooc_courses FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.mooc_course_teachers teacher_link
      WHERE teacher_link.course_id = mooc_courses.id
        AND teacher_link.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.mooc_course_teachers teacher_link
      WHERE teacher_link.course_id = mooc_courses.id
        AND teacher_link.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can view lessons of approved courses" ON public.mooc_lessons;
CREATE POLICY "Approved courses or assigned professors can view lessons"
  ON public.mooc_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.mooc_courses course_row
      WHERE course_row.id = mooc_lessons.course_id
        AND (
          course_row.status = 'approved'::request_status
          OR course_row.created_by = auth.uid()
          OR has_role(auth.uid(), 'admin'::app_role)
          OR EXISTS (
            SELECT 1
            FROM public.mooc_course_teachers teacher_link
            WHERE teacher_link.course_id = course_row.id
              AND teacher_link.teacher_id = auth.uid()
          )
        )
    )
  );