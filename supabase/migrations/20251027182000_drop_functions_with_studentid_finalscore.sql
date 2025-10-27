-- Migration: Drop any functions whose source references `student_id` or `final_score`
-- WARNING: This script will DROP functions (CASCADE) that contain those substrings in their definition.
-- Review the function list before applying in production. Consider taking a DB backup or reviewing each function body.

-- This block searches pg_proc function definitions for the tokens and drops matching functions.
DO $$
DECLARE
  r RECORD;
  v_func_identity TEXT;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name,
      p.proname   AS func_name,
      pg_get_function_identity_arguments(p.oid) AS func_args,
      p.prosrc AS prosrc
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosrc ILIKE '%student_id%'
  OR p.prosrc ILIKE '%final_score%'
  LOOP
    v_func_identity := format('%I.%I(%s)', r.schema_name, r.func_name, r.func_args);
    RAISE NOTICE 'Found function referencing student_id/final_score: %', v_func_identity;
    -- Drop the function and any dependent objects. This is destructive; use caution.
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', r.schema_name, r.func_name, r.func_args);
    RAISE NOTICE 'Dropped %', v_func_identity;
  END LOOP;
END
$$;

-- End of migration
