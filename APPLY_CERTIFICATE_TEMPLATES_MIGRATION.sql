    -- =====================================================
    -- MIGRACIÓN: Crear tabla certificate_templates
    -- Ejecutar esto en el SQL Editor de Supabase
    -- =====================================================

    -- 1. Crear la tabla de plantillas de certificado
    CREATE TABLE IF NOT EXISTS public.certificate_templates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id uuid REFERENCES mooc_courses(id) ON DELETE CASCADE,
        is_global boolean NOT NULL DEFAULT false,
        template_html text NOT NULL,
        signature_profile_id uuid REFERENCES signature_profiles(id),
        signer_name text NOT NULL,
        signer_title text NOT NULL,
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
    );

    -- 2. Crear índices únicos para asegurar solo una plantilla activa
    CREATE UNIQUE INDEX IF NOT EXISTS unique_active_template_per_course 
        ON public.certificate_templates(course_id, active) 
        WHERE active = true AND course_id IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS unique_active_global_template 
        ON public.certificate_templates(is_global, active) 
        WHERE active = true AND is_global = true;

    -- 3. Habilitar RLS (Row Level Security)
    ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

    -- 4. Crear políticas de seguridad
    -- Cualquiera puede leer plantillas activas
    CREATE POLICY "Cualquiera puede leer plantillas activas"
        ON public.certificate_templates
        FOR SELECT
        USING (active = true);

    -- Solo admins pueden insertar plantillas
    CREATE POLICY "Solo admins pueden insertar plantillas"
        ON public.certificate_templates
        FOR INSERT
        WITH CHECK (public.has_role(auth.uid(), 'admin'));

    -- Solo admins pueden actualizar plantillas
    CREATE POLICY "Solo admins pueden actualizar plantillas"
        ON public.certificate_templates
        FOR UPDATE
        USING (public.has_role(auth.uid(), 'admin'));

    -- Solo admins pueden eliminar plantillas
    CREATE POLICY "Solo admins pueden eliminar plantillas"
        ON public.certificate_templates
        FOR DELETE
        USING (public.has_role(auth.uid(), 'admin'));

    -- 5. Verificar que la tabla se creó correctamente
    SELECT 
        'Tabla certificate_templates creada exitosamente' as mensaje,
        COUNT(*) as total_plantillas
    FROM public.certificate_templates;
