-- Add is_published column to mooc_course_sections
-- Date: 2025-12-15

ALTER TABLE public.mooc_course_sections 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.mooc_course_sections.is_published IS 'Visibility status of the section. If false, lessons in this section are hidden from students.';
