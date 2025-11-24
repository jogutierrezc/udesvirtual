-- Fix user_roles RLS to prevent unauthorized errors
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;
CREATE POLICY "Users can read own roles" ON user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Fix mooc_activities RLS
ALTER TABLE mooc_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professors can manage course activities" ON mooc_activities;
CREATE POLICY "Professors can manage course activities" ON mooc_activities
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM mooc_lessons
    JOIN mooc_courses ON mooc_courses.id = mooc_lessons.course_id
    WHERE mooc_lessons.id = mooc_activities.lesson_id
    AND (
      mooc_courses.created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM mooc_lessons
    JOIN mooc_courses ON mooc_courses.id = mooc_lessons.course_id
    WHERE mooc_lessons.id = mooc_activities.lesson_id
    AND (
      mooc_courses.created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  )
);

DROP POLICY IF EXISTS "Students can view activities" ON mooc_activities;
CREATE POLICY "Students can view activities" ON mooc_activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM mooc_lessons
    JOIN mooc_courses ON mooc_courses.id = mooc_lessons.course_id
    WHERE mooc_lessons.id = mooc_activities.lesson_id
    AND mooc_courses.status = 'approved'
  )
);
