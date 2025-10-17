-- Create COIL proposals table
CREATE TABLE public.coil_proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL,
  status request_status DEFAULT 'pending'::request_status,
  
  -- Professor information
  full_name text NOT NULL,
  email text NOT NULL,
  academic_program text NOT NULL,
  
  -- Course information
  course_name text NOT NULL,
  academic_semester text NOT NULL,
  external_capacity integer NOT NULL,
  
  -- COIL specifics
  project_topics text NOT NULL,
  languages text[] NOT NULL DEFAULT '{}',
  sustainable_development_goals text[] NOT NULL DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.coil_proposals ENABLE ROW LEVEL SECURITY;

-- Create policies for coil_proposals
CREATE POLICY "Admins and professors can create COIL proposals" 
ON public.coil_proposals 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'professor'::app_role) AND auth.uid() = created_by)
);

CREATE POLICY "Anyone can view approved COIL proposals" 
ON public.coil_proposals 
FOR SELECT 
USING (
  status = 'approved'::request_status OR 
  auth.uid() = created_by OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update COIL proposals" 
ON public.coil_proposals 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creators and admins can delete COIL proposals" 
ON public.coil_proposals 
FOR DELETE 
USING (
  auth.uid() = created_by OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create trigger for auto-approval when created by admin
CREATE TRIGGER auto_approve_admin_coil
BEFORE INSERT ON public.coil_proposals
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_admin_content();

-- Create trigger for updated_at
CREATE TRIGGER update_coil_proposals_updated_at
BEFORE UPDATE ON public.coil_proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();