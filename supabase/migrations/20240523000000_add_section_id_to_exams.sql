-- Add section_id to mooc_exams table
ALTER TABLE mooc_exams 
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES mooc_course_sections(id) ON DELETE SET NULL;
