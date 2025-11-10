-- Add course sections and section assignment for lessons
-- Date: 2025-11-10

-- 1) Create sections table
CREATE TABLE IF NOT EXISTS public.mooc_course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.mooc_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index to quickly fetch sections by course
CREATE INDEX IF NOT EXISTS idx_mooc_course_sections_course ON public.mooc_course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_mooc_course_sections_order ON public.mooc_course_sections(course_id, order_index);

-- 2) Add section_id column to lessons
ALTER TABLE public.mooc_lessons ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.mooc_course_sections(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_mooc_lessons_section ON public.mooc_lessons(section_id);

-- 3) Enable RLS on sections table (if not already)
ALTER TABLE public.mooc_course_sections ENABLE ROW LEVEL SECURITY;

-- 4) Policies for sections (similar approach to lessons)
DROP POLICY IF EXISTS "sections_select_accessible_courses" ON public.mooc_course_sections;
CREATE POLICY "sections_select_accessible_courses" ON public.mooc_course_sections FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.mooc_courses c
    WHERE c.id = mooc_course_sections.course_id
      AND (c.status = 'approved'::request_status OR c.created_by = auth.uid() OR has_role(auth.uid(),'admin'::app_role))
  )
);

DROP POLICY IF EXISTS "sections_manage_owner_admin" ON public.mooc_course_sections;
CREATE POLICY "sections_manage_owner_admin" ON public.mooc_course_sections FOR ALL USING (
  has_role(auth.uid(),'admin'::app_role) OR EXISTS (
    SELECT 1 FROM public.mooc_courses c WHERE c.id = mooc_course_sections.course_id AND c.created_by = auth.uid()
  )
) WITH CHECK (
  has_role(auth.uid(),'admin'::app_role) OR EXISTS (
    SELECT 1 FROM public.mooc_courses c WHERE c.id = mooc_course_sections.course_id AND c.created_by = auth.uid()
  )
);

-- 5) Comment metadata
COMMENT ON TABLE public.mooc_course_sections IS 'Hierarchical organizational sections for grouping lessons inside a MOOC course';
COMMENT ON COLUMN public.mooc_lessons.section_id IS 'Optional reference to a course section for grouping';
