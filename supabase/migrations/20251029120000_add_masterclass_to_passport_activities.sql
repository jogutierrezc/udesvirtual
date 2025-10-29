-- Migration: Add Master Class to Passport Activities Catalog
-- Adds 'Master Class' as an eligible activity for Passport points

insert into public.passport_activities (name, description, activity_type, points_awarded, pathway_type, complexity_level, formative_value, active)
values
  ('Master Class Internacional', 'Participación en clase magistral con universidad aliada o experto internacional', 'masterclass', 60, 'descubrimiento', 'intermedio', 'Intercambio académico y cultural de alto nivel', true)
on conflict (name) do nothing;
