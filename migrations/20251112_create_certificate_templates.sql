-- Migration: Crear tabla de plantillas de certificado personalizables
CREATE TABLE IF NOT EXISTS public.certificate_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid REFERENCES mooc_courses(id) ON DELETE CASCADE,
    is_global boolean NOT NULL DEFAULT false, -- true: plantilla general, false: específica de curso
    template_html text NOT NULL, -- HTML o texto con placeholders
    signature_profile_id uuid REFERENCES signature_profiles(id),
    signer_name text NOT NULL,
    signer_title text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Solo puede haber una plantilla activa por curso o una global activa
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_template_per_course ON public.certificate_templates(course_id, active) WHERE active = true AND course_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_global_template ON public.certificate_templates(is_global, active) WHERE active = true AND is_global = true;
