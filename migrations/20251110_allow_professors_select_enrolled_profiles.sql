-- Allow professors to view basic profile info (name, email, city, department) of students enrolled
-- in courses they created.
-- Rationale: MisEstudiantes page needs to list enrolled learners; current RLS only lets admins read profiles.
-- Safe scope: restrict to courses where created_by = auth.uid() and enrollment ties the student to that course.

-- Drop existing policy if present (CREATE POLICY does not support IF NOT EXISTS on most PG versions)
DROP POLICY IF EXISTS "Professors can read enrolled student profiles" ON public.profiles;

-- Allow professors to select profiles of students enrolled in their own courses
CREATE POLICY "Professors can read enrolled student profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    exists (
      select 1
      from public.mooc_enrollments e
      join public.mooc_courses c on c.id = e.course_id
      where e.user_id = profiles.id
        and c.created_by = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Optionally: create a limited view if we want to further restrict columns (not done here).
-- Ensure no leakage beyond enrolled students.
