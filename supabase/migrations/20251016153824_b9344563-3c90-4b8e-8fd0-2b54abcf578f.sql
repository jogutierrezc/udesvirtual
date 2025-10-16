-- Create course offerings table for proposing classes
CREATE TABLE public.course_offerings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  offering_type TEXT NOT NULL CHECK (offering_type IN ('exchange', 'programada')),
  knowledge_area TEXT[] NOT NULL DEFAULT '{}',
  profession TEXT NOT NULL,
  allied_professor TEXT,
  allied_institution TEXT,
  capacity INTEGER NOT NULL,
  hours INTEGER NOT NULL,
  campus TEXT NOT NULL,
  status request_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_offerings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_offerings
CREATE POLICY "Anyone can view approved offerings"
  ON public.course_offerings
  FOR SELECT
  USING (
    status = 'approved' OR 
    auth.uid() = created_by OR 
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Professors can create offerings"
  ON public.course_offerings
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'professor') AND 
    auth.uid() = created_by
  );

CREATE POLICY "Creators and admins can delete offerings"
  ON public.course_offerings
  FOR DELETE
  USING (
    auth.uid() = created_by OR 
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update offerings"
  ON public.course_offerings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Add allied_institution to classes table
ALTER TABLE public.classes
ADD COLUMN allied_institution TEXT;

-- Change knowledge_area to array in classes table
ALTER TABLE public.classes
ALTER COLUMN knowledge_area TYPE TEXT[] USING ARRAY[knowledge_area];

ALTER TABLE public.classes
ALTER COLUMN knowledge_area SET DEFAULT '{}';

-- Change interests to better default in teachers table
ALTER TABLE public.teachers
ALTER COLUMN interests SET DEFAULT '{}';

-- Add trigger for updated_at on course_offerings
CREATE TRIGGER update_course_offerings_updated_at
  BEFORE UPDATE ON public.course_offerings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();