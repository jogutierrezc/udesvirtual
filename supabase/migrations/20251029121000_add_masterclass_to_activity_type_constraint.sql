-- Migration: Add 'masterclass' to activity_type constraint in passport_activities
-- Allows 'masterclass' as a valid activity_type

ALTER TABLE public.passport_activities
  DROP CONSTRAINT IF EXISTS passport_activities_activity_type_check;

ALTER TABLE public.passport_activities
  ADD CONSTRAINT passport_activities_activity_type_check
    CHECK (activity_type IN ('coil', 'intercambio', 'semillero', 'clase_espejo', 'mooc', 'evento', 'proyecto', 'masterclass', 'otro'));
