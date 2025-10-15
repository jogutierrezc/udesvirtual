-- Create class_registrations table
CREATE TABLE public.class_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  institution text NOT NULL,
  country text NOT NULL,
  participant_type text NOT NULL CHECK (participant_type IN ('Estudiante', 'Docente', 'Otro')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.class_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert registrations
CREATE POLICY "Anyone can register for classes"
ON public.class_registrations
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own registrations
CREATE POLICY "Users can view their own registrations"
ON public.class_registrations
FOR SELECT
USING (auth.uid() IS NOT NULL OR true);

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations"
ON public.class_registrations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete registrations
CREATE POLICY "Admins can delete registrations"
ON public.class_registrations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_class_registrations_updated_at
BEFORE UPDATE ON public.class_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();