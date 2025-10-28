-- Migration: create tables to capture researcher profile data (qualifications, languages, areas, research lines,
-- recognitions and publications) and add RLS policies so only profile owners can write.
-- NOTE: Run this with Supabase service_role (or via SQL editor) because it creates policies and references auth.

BEGIN;

-- academic qualifications
CREATE TABLE IF NOT EXISTS public.academic_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level text NOT NULL, -- e.g., Pregrado, Especialización, Maestría, Doctorado
  institution text,
  program text,
  campus text,
  start_year integer,
  end_year integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- areas of actuation (tags)
CREATE TABLE IF NOT EXISTS public.areas_of_actuation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- research lines (tags)
CREATE TABLE IF NOT EXISTS public.research_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- languages with simple proficiency flags
CREATE TABLE IF NOT EXISTS public.languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language text NOT NULL,
  speaks boolean DEFAULT false,
  writes boolean DEFAULT false,
  reads boolean DEFAULT false,
  understands boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- recognitions
CREATE TABLE IF NOT EXISTS public.recognitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  year integer,
  month integer, -- 1-12 (only month+year requested)
  created_at timestamptz DEFAULT now()
);

-- publications
CREATE TABLE IF NOT EXISTS public.publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text, -- e.g., Libro, Texto no cientifico, Documento de trabajo, Libro de formación, Artículo
  title text NOT NULL,
  year integer,
  issn_isbn text,
  page text,
  has_link boolean DEFAULT false,
  link text,
  keywords text[], -- array of keyword tags
  areas text[], -- array of area tags
  created_at timestamptz DEFAULT now()
);

-- Enable RLS and policies: only the profile owner (auth.uid = profile_id) may insert/update/delete.
-- Anyone may SELECT rows where the associated profile has public_profile = true (so public profiles show research data).

-- Helper: enable RLS for each table and create policies
DO $$
DECLARE
  tbl text;
  sql text;
  tables text[] := ARRAY[
    'academic_qualifications',
    'areas_of_actuation',
    'research_lines',
    'languages',
    'recognitions',
    'publications'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    sql := format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE sql;

    -- SELECT policy: allow when the referenced profile is public OR when the requester is the owner
    sql := format($f$
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = '%1$s_select_public_or_owner') THEN
          EXECUTE 'CREATE POLICY %1$s_select_public_or_owner ON public.%1$s FOR SELECT USING (
            (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.%1$s.profile_id AND p.public_profile = true))
            OR (auth.uid() IS NOT NULL AND auth.uid() = public.%1$s.profile_id)
          );';
        END IF;
      END;
      $$;
    $f$, tbl);
    EXECUTE sql;

    -- INSERT policy: allow only owner (auth.uid = profile_id)
    sql := format($f$
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = '%1$s_insert_owner') THEN
          EXECUTE 'CREATE POLICY %1$s_insert_owner ON public.%1$s FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = profile_id);';
        END IF;
      END;
      $$;
    $f$, tbl);
    EXECUTE sql;

    -- UPDATE policy: allow only owner
    sql := format($f$
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = '%1$s_update_owner') THEN
          EXECUTE 'CREATE POLICY %1$s_update_owner ON public.%1$s FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = profile_id) WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = profile_id);';
        END IF;
      END;
      $$;
    $f$, tbl);
    EXECUTE sql;

    -- DELETE policy: allow only owner
    sql := format($f$
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = '%1$s_delete_owner') THEN
          EXECUTE 'CREATE POLICY %1$s_delete_owner ON public.%1$s FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = profile_id);';
        END IF;
      END;
      $$;
    $f$, tbl);
    EXECUTE sql;
  END LOOP;
END; $$;

COMMIT;

-- IMPORTANT:
-- * Run with service_role or via Supabase SQL editor.
-- * If your DB doesn't expose gen_random_uuid(), create the pgcrypto extension or replace defaults with uuid_generate_v4().
