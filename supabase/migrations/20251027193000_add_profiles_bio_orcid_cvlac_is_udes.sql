-- Migration: Add bio, orcid_link, cvlac_link and is_udes to profiles
-- Created: 2025-10-27 19:30:00

BEGIN;

-- Añadir columna de biografía (texto)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text;

-- Añadir link ORCID
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS orcid_link text;

-- Añadir link CvLAC
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cvlac_link text;

-- Añadir flag is_udes (boolean) con valor por defecto false
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_udes boolean DEFAULT false;

COMMIT;
