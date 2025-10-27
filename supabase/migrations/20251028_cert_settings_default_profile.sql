-- Migration: add default signature profile reference to certificate_settings
ALTER TABLE public.certificate_settings
  ADD COLUMN IF NOT EXISTS default_signature_profile_id uuid;

-- Create FK if signature_profiles exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='signature_profiles') THEN
    BEGIN
      ALTER TABLE public.certificate_settings
        ADD CONSTRAINT IF NOT EXISTS certificate_settings_default_profile_fk
        FOREIGN KEY (default_signature_profile_id) REFERENCES public.signature_profiles(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      -- ignore
    END;
  END IF;
END$$;
