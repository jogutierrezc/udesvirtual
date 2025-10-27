-- Migration: Añadir soporte de firma electrónica y QR para certificados
-- Crea tabla de settings, columnas en mooc_certificates y funciones para generar/verificar códigos

-- Requerir extensión pgcrypto para HMAC
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla singleton con configuración de certificados
CREATE TABLE IF NOT EXISTS public.certificate_settings (
  id serial PRIMARY KEY,
  signature_enabled boolean NOT NULL DEFAULT false,
  signature_bucket text NOT NULL DEFAULT 'certificate-signatures',
  qr_base_url text NOT NULL DEFAULT 'https://tu-dominio/verify-cert',
  secret text NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insertar fila por defecto si no existe (no especificamos "id" para respetar el tipo presente en la tabla)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.certificate_settings) THEN
    INSERT INTO public.certificate_settings (signature_enabled, signature_bucket, qr_base_url, secret, updated_at)
    VALUES (false, 'certificate-signatures', 'https://tu-dominio/verify-cert', NULL, now());
  END IF;
END$$;

-- Añadir columnas a la tabla de certificados (si no existen)
ALTER TABLE public.mooc_certificates
  ADD COLUMN IF NOT EXISTS signature_code text,
  ADD COLUMN IF NOT EXISTS signature_filename text,
  ADD COLUMN IF NOT EXISTS qr_link text,
  ADD COLUMN IF NOT EXISTS signature_applied boolean NOT NULL DEFAULT false;

-- Crear bucket para almacenar imágenes/firmas de certificados
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificate-signatures', 'certificate-signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas: lectura pública del bucket (ajusta según necesidades)
DROP POLICY IF EXISTS "certificate_signatures_public_read" ON storage.objects;
CREATE POLICY "certificate_signatures_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificate-signatures');

-- Función para generar código de firma (HMAC) para un certificado y almacenarlo
CREATE OR REPLACE FUNCTION public.generate_cert_signature(cert_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  s_secret text;
  c_row RECORD;
  code text;
BEGIN
  SELECT * INTO c_row FROM public.mooc_certificates WHERE id = cert_uuid LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Certificate not found';
  END IF;

  SELECT secret INTO s_secret FROM public.certificate_settings WHERE id = 1 LIMIT 1;
  IF s_secret IS NULL THEN
    RAISE EXCEPTION 'Certificate secret not configured';
  END IF;

  -- Deterministic HMAC over certificate id and issued_at
  code := encode(hmac(c_row.id::text || '|' || coalesce(c_row.issued_at::text, ''), s_secret, 'sha256'), 'hex');

  UPDATE public.mooc_certificates SET signature_code = code WHERE id = cert_uuid;

  RETURN code;
END;
$$;

-- Función para verificar código (devuelve row con certificate + match boolean)
CREATE OR REPLACE FUNCTION public.verify_cert_signature(cert_uuid uuid, provided_code text)
RETURNS TABLE(valid boolean, cert_id uuid)
LANGUAGE plpgsql
AS $$
DECLARE
  s_secret text;
  expected text;
  c_row RECORD;
BEGIN
  SELECT * INTO c_row FROM public.mooc_certificates WHERE id = cert_uuid LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid;
    RETURN;
  END IF;

  SELECT secret INTO s_secret FROM public.certificate_settings WHERE id = 1 LIMIT 1;
  IF s_secret IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid;
    RETURN;
  END IF;

  expected := encode(hmac(c_row.id::text || '|' || coalesce(c_row.issued_at::text, ''), s_secret, 'sha256'), 'hex');

  IF expected = provided_code THEN
    RETURN QUERY SELECT true, c_row.id;
  ELSE
    RETURN QUERY SELECT false, c_row.id;
  END IF;
END;
$$;

-- Otorgar permisos de ejecución a anon (ajusta según política de seguridad de la app)
GRANT EXECUTE ON FUNCTION public.generate_cert_signature(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cert_signature(uuid, text) TO anon, authenticated;
