-- Create certificate_settings table
CREATE TABLE IF NOT EXISTS public.certificate_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_name TEXT,
  signature_title TEXT,
  qr_base_url TEXT,
  verification_url TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  default_signature_profile_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.certificate_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage certificate settings"
ON public.certificate_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view certificate settings"
ON public.certificate_settings FOR SELECT
USING (true);

-- Create signature_profiles table
CREATE TABLE IF NOT EXISTS public.signature_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.signature_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage signature profiles"
ON public.signature_profiles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view signature profiles"
ON public.signature_profiles FOR SELECT
USING (true);

-- Add signature fields to mooc_certificates
ALTER TABLE public.mooc_certificates 
ADD COLUMN IF NOT EXISTS signature_code TEXT,
ADD COLUMN IF NOT EXISTS signature_filename TEXT;

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id),
  recipient_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
ON public.contact_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
ON public.contact_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update read status"
ON public.contact_messages FOR UPDATE
USING (auth.uid() = recipient_id);

-- Create publications table
CREATE TABLE IF NOT EXISTS public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  year INTEGER,
  journal TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their publications"
ON public.publications FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view publications"
ON public.publications FOR SELECT
USING (true);

-- Create academic_qualifications table
CREATE TABLE IF NOT EXISTS public.academic_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  degree TEXT NOT NULL,
  institution TEXT NOT NULL,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.academic_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their qualifications"
ON public.academic_qualifications FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view qualifications"
ON public.academic_qualifications FOR SELECT
USING (true);

-- Create udes_relationships table
CREATE TABLE IF NOT EXISTS public.udes_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  relationship_type TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.udes_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their relationships"
ON public.udes_relationships FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create passport tables
CREATE TABLE IF NOT EXISTS public.passport_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.passport_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.passport_routes(id),
  name TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.passport_points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  activity_id UUID REFERENCES public.passport_activities(id),
  points INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.passport_activity_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  activity_id UUID REFERENCES public.passport_activities(id) NOT NULL,
  route_id UUID REFERENCES public.passport_routes(id),
  status request_status DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.passport_route_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.passport_routes(id) NOT NULL,
  activity_id UUID REFERENCES public.passport_activities(id) NOT NULL,
  order_index INTEGER DEFAULT 0
);

-- Enable RLS on passport tables
ALTER TABLE public.passport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_activity_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_route_activities ENABLE ROW LEVEL SECURITY;

-- Passport RLS policies
CREATE POLICY "Anyone can view routes"
ON public.passport_routes FOR SELECT USING (true);

CREATE POLICY "Admins can manage routes"
ON public.passport_routes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view activities"
ON public.passport_activities FOR SELECT USING (true);

CREATE POLICY "Admins can manage activities"
ON public.passport_activities FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their points"
ON public.passport_points_ledger FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can add points"
ON public.passport_points_ledger FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their requests"
ON public.passport_activity_requests FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create requests"
ON public.passport_activity_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view route activities"
ON public.passport_route_activities FOR SELECT USING (true);

-- Create RPC functions referenced in code
CREATE OR REPLACE FUNCTION get_route_activities(p_route_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  points INTEGER
)
LANGUAGE sql
STABLE
AS $$
  SELECT a.id, a.name, a.description, a.points
  FROM passport_activities a
  JOIN passport_route_activities ra ON ra.activity_id = a.id
  WHERE ra.route_id = p_route_id
  ORDER BY ra.order_index;
$$;

CREATE OR REPLACE FUNCTION approve_activity_request(p_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_activity_id UUID;
  v_points INTEGER;
BEGIN
  SELECT user_id, activity_id INTO v_user_id, v_activity_id
  FROM passport_activity_requests
  WHERE id = p_request_id;
  
  SELECT points INTO v_points
  FROM passport_activities
  WHERE id = v_activity_id;
  
  UPDATE passport_activity_requests
  SET status = 'approved'
  WHERE id = p_request_id;
  
  INSERT INTO passport_points_ledger (user_id, activity_id, points)
  VALUES (v_user_id, v_activity_id, v_points);
END;
$$;

CREATE OR REPLACE FUNCTION reject_activity_request(p_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE passport_activity_requests
  SET status = 'rejected'
  WHERE id = p_request_id;
END;
$$;