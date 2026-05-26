-- Allow assigned professors to view and manage course sections for courses they are assigned to.
-- This ensures that assigned professors can edit the content structure of their assigned MOOC courses.

DROP POLICY IF EXISTS "sections_select_accessible_courses" ON public.mooc_course_sections;
CREATE POLICY "Approved courses or assigned professors can view sections"
  ON public.mooc_course_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.mooc_courses course_row
      WHERE course_row.id = mooc_course_sections.course_id
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

DROP POLICY IF EXISTS "sections_manage_owner_admin" ON public.mooc_course_sections;
CREATE POLICY "Admins, creators and assigned professors can manage sections"
  ON public.mooc_course_sections FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.mooc_courses course_row
      WHERE course_row.id = mooc_course_sections.course_id
        AND (
          course_row.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.mooc_course_teachers teacher_link
            WHERE teacher_link.course_id = course_row.id
              AND teacher_link.teacher_id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.mooc_courses course_row
      WHERE course_row.id = mooc_course_sections.course_id
        AND (
          course_row.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.mooc_course_teachers teacher_link
            WHERE teacher_link.course_id = course_row.id
              AND teacher_link.teacher_id = auth.uid()
          )
        )
    )
  );
