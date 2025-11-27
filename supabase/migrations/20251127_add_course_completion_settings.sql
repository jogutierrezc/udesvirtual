-- Add completion settings to mooc_courses
ALTER TABLE mooc_courses
ADD COLUMN IF NOT EXISTS completion_criteria text DEFAULT 'all_lessons',
ADD COLUMN IF NOT EXISTS virtual_session_date timestamptz;

-- Add availability dates to mooc_course_sections
ALTER TABLE mooc_course_sections
ADD COLUMN IF NOT EXISTS available_from timestamptz,
ADD COLUMN IF NOT EXISTS available_until timestamptz;
