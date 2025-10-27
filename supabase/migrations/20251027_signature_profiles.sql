-- Migration: Crear perfiles de firma autorizados y funciones de gestión

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla para almacenar metadatos de firmas autorizadas
CREATE TABLE IF NOT EXISTS public.signature_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  filename text NOT NULL,
  secret text NOT NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

-- Función para crear un perfil de firma y generar secreto seguro
CREATE OR REPLACE FUNCTION public.create_signature_profile(p_name text, p_filename text, p_created_by uuid)
RETURNS TABLE(id uuid, name text, filename text, secret text, created_by uuid, created_at timestamptz, active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  s_secret text;
BEGIN
  s_secret := encode(gen_random_bytes(32), 'hex');
  INSERT INTO public.signature_profiles (name, filename, secret, created_by)
  VALUES (p_name, p_filename, s_secret, p_created_by)
  RETURNING signature_profiles.id, signature_profiles.name, signature_profiles.filename, signature_profiles.secret, signature_profiles.created_by, signature_profiles.created_at, signature_profiles.active
  INTO id, name, filename, secret, created_by, created_at, active;

  RETURN NEXT;
END;
$$;

-- Función para rotar/regenearar secreto
CREATE OR REPLACE FUNCTION public.rotate_signature_secret(p_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_secret text;
BEGIN
  new_secret := encode(gen_random_bytes(32), 'hex');
  UPDATE public.signature_profiles SET secret = new_secret WHERE id = p_profile_id;
  RETURN new_secret;
END;
$$;

-- Permisos: permitir ejecución a usuarios autenticados (ajustar en prod)
GRANT EXECUTE ON FUNCTION public.create_signature_profile(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_signature_secret(uuid) TO authenticated;
