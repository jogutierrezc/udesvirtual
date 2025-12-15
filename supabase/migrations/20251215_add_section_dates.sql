-- Add availability dates to mooc_course_sections
-- Date: 2025-12-15

ALTER TABLE public.mooc_course_sections 
ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ;

COMMENT ON COLUMN public.mooc_course_sections.available_from IS 'Date and time when the section becomes available to students.';
COMMENT ON COLUMN public.mooc_course_sections.available_until IS 'Date and time when the section stops being available to students.';
