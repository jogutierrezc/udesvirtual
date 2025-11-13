-- =====================================================
-- SCRIPT: Insertar plantilla de certificado de ejemplo
-- Ejecutar DESPUÉS de aplicar la migración
-- =====================================================

-- Insertar una plantilla global de ejemplo
INSERT INTO public.certificate_templates (
    is_global,
    template_html,
    signer_name,
    signer_title,
    active
) VALUES (
    true, -- plantilla global
    '<div class="certificate-content" style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
        <h1 style="color: #052c4e; font-size: 36px; margin-bottom: 20px;">Certificado de Finalización</h1>
        <p style="font-size: 18px; color: #666; margin-bottom: 30px;">Este certificado es otorgado a:</p>
        <h2 style="color: #2c3e50; font-size: 42px; margin: 30px 0; font-weight: bold;">{{student_name}}</h2>
        <p style="font-size: 16px; color: #666; margin-bottom: 10px;">{{student_email}}</p>
        <p style="font-size: 16px; color: #666; margin-bottom: 40px;">{{student_city}}</p>
        <p style="font-size: 20px; color: #333; margin-bottom: 15px;">Por completar exitosamente el curso:</p>
        <h3 style="color: #052c4e; font-size: 28px; margin: 20px 0; font-weight: 600;">{{course_title}}</h3>
        <div style="margin: 40px 0;">
            <p style="font-size: 16px; color: #666;">Horas académicas: <strong>{{hours}}</strong></p>
            <p style="font-size: 16px; color: #666; margin-top: 10px;">Fecha de emisión: <strong>{{issued_date}}</strong></p>
            <p style="font-size: 14px; color: #999; margin-top: 10px; font-family: monospace;">Código de verificación: <strong>{{verification_code}}</strong></p>
        </div>
    </div>',
    'Dra. Mónica Beltrán',
    'Directora General de MOOC UDES',
    true -- activa
)
ON CONFLICT DO NOTHING;

-- Verificar que se insertó correctamente
SELECT 
    id,
    is_global,
    active,
    signer_name,
    signer_title,
    created_at
FROM public.certificate_templates
WHERE is_global = true
ORDER BY created_at DESC
LIMIT 1;
