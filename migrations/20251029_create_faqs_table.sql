-- Create enum for FAQ types
DO $$ BEGIN
  CREATE TYPE public.faq_type AS ENUM ('catalogo','mooc','estudiantes','profesores','becas_movilidad');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create table faqs
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type public.faq_type NOT NULL,
  content text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_on_faqs ON public.faqs;
CREATE TRIGGER set_updated_at_on_faqs
BEFORE UPDATE ON public.faqs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Public can read only published FAQs
DROP POLICY IF EXISTS faqs_public_read ON public.faqs;
CREATE POLICY faqs_public_read ON public.faqs
FOR SELECT USING (status = 'published');

-- Authenticated users can read published too
DROP POLICY IF EXISTS faqs_auth_read ON public.faqs;
CREATE POLICY faqs_auth_read ON public.faqs
FOR SELECT TO authenticated USING (status = 'published');

-- Admin full access
DROP POLICY IF EXISTS faqs_admin_all ON public.faqs;
CREATE POLICY faqs_admin_all ON public.faqs
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- Storage bucket for FAQ assets
-- Create bucket if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'faq-assets') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('faq-assets', 'faq-assets', true);
  END IF;
EXCEPTION WHEN others THEN NULL; END $$;

-- Storage policies for bucket 'faq-assets'
-- Allow public read
DO $$ BEGIN
  CREATE POLICY "Public read faq-assets" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'faq-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow admin write
DO $$ BEGIN
  CREATE POLICY "Admin write faq-assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'faq-assets' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin update faq-assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'faq-assets' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  )
  WITH CHECK (
    bucket_id = 'faq-assets' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin delete faq-assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'faq-assets' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
