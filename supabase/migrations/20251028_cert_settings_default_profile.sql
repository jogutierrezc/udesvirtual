-- Migration: add default signature profile reference to certificate_settings
ALTER TABLE public.certificate_settings
  ADD COLUMN IF NOT EXISTS default_signature_profile_id uuid;

-- Create FK if signature_profiles exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='signature_profiles') THEN
    -- Only add the constraint if it does not already exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'certificate_settings_default_profile_fk'
    ) THEN
      EXECUTE 'ALTER TABLE public.certificate_settings ADD CONSTRAINT certificate_settings_default_profile_fk FOREIGN KEY (default_signature_profile_id) REFERENCES public.signature_profiles(id) ON DELETE SET NULL';
    END IF;
  END IF;
END$$;
