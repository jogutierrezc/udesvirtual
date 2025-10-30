-- Create public bucket for FAQ assets and set RLS policies
-- Safe to run multiple times; uses IF NOT EXISTS guards.

-- 1) Create bucket (public)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'faq-assets') THEN
    -- Fallback approach compatible across versions: insert directly
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('faq-assets', 'faq-assets', true);
  END IF;
END $$;

-- 2) Policies on storage.objects for bucket 'faq-assets'
-- Public read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Public read faq-assets' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public read faq-assets" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'faq-assets');
  END IF;
END $$;

-- Admin write (insert)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Admin write faq-assets' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Admin write faq-assets" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'faq-assets' AND EXISTS (
        SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
      )
    );
  END IF;
END $$;

-- Admin update
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Admin update faq-assets' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Admin update faq-assets" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = 'faq-assets' AND EXISTS (
        SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
      )
    )
    WITH CHECK (
      bucket_id = 'faq-assets' AND EXISTS (
        SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
      )
    );
  END IF;
END $$;

-- Admin delete
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Admin delete faq-assets' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Admin delete faq-assets" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'faq-assets' AND EXISTS (
        SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
      )
    );
  END IF;
END $$;
