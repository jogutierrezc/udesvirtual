-- Migration: Añadir columna signature_profile_id a mooc_certificates
ALTER TABLE public.mooc_certificates
  ADD COLUMN IF NOT EXISTS signature_profile_id uuid;

-- Crear FK si la tabla signature_profiles existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'signature_profiles') THEN
    BEGIN
      ALTER TABLE public.mooc_certificates
        ADD CONSTRAINT IF NOT EXISTS mooc_certificates_signature_profile_fk
        FOREIGN KEY (signature_profile_id) REFERENCES public.signature_profiles(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      -- ignore
    END;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_mooc_certificates_signature_profile ON public.mooc_certificates(signature_profile_id);
