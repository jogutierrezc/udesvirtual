-- Migration: create mooc_categories table and add category_id to mooc_courses
-- Run this with your DB migration tool or in Supabase SQL editor.

BEGIN;

-- Create categories table
CREATE TABLE IF NOT EXISTS mooc_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE,
  image_url text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add category_id column to mooc_courses (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mooc_courses' AND column_name='category_id'
  ) THEN
    ALTER TABLE mooc_courses ADD COLUMN category_id uuid REFERENCES mooc_categories(id) ON DELETE SET NULL;
  END IF;
END$$;

COMMIT;
