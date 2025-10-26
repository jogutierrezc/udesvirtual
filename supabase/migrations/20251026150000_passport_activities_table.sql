-- Add passport_activities table and update schema for v2

-- ACTIVITIES CATALOG
create table if not exists public.passport_activities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  activity_type text not null check (activity_type in ('coil', 'intercambio', 'semillero', 'clase_espejo', 'mooc', 'evento', 'proyecto', 'voluntariado')),
  points_awarded integer not null default 30,
  pathway_type text check (pathway_type in ('conocimiento', 'descubrimiento', 'impacto_social')),
  complexity_level text check (complexity_level in ('basico', 'intermedio', 'avanzado')),
  formative_value text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_passport_activities_type on public.passport_activities(activity_type);
create index if not exists idx_passport_activities_pathway on public.passport_activities(pathway_type);

-- ACADEMIC PROFILE
create table if not exists public.passport_academic_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  credits_approved integer not null default 0,
  english_level text,
  cumulative_gpa numeric(3,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_user_profile unique(user_id)
);

create index if not exists idx_passport_academic_profile_user on public.passport_academic_profile(user_id);

-- Update passport_routes to add pathway_type
alter table public.passport_routes 
  add column if not exists pathway_type text check (pathway_type in ('conocimiento', 'descubrimiento', 'impacto_social'));

-- Update passport_badges to add enhanced fields
alter table public.passport_badges 
  add column if not exists badge_type text check (badge_type in ('conocimiento', 'descubrimiento', 'impacto_social', 'ciudadano_global')),
  add column if not exists credits_required integer,
  add column if not exists english_level_required text,
  add column if not exists pathway_completion_required text[];

-- Update passport_points_ledger to add pathway and activity tracking
alter table public.passport_points_ledger 
  add column if not exists pathway_type text check (pathway_type in ('conocimiento', 'descubrimiento', 'impacto_social')),
  add column if not exists activity_id uuid references public.passport_activities(id) on delete set null;

-- RLS for new tables
alter table public.passport_activities enable row level security;
alter table public.passport_academic_profile enable row level security;

-- Drop existing policies if they exist
drop policy if exists passport_activities_admin_all on public.passport_activities;
drop policy if exists passport_activities_read_all on public.passport_activities;
drop policy if exists passport_academic_profile_admin_all on public.passport_academic_profile;
drop policy if exists passport_academic_profile_read_own on public.passport_academic_profile;

-- Policies for activities
create policy passport_activities_admin_all
  on public.passport_activities
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy passport_activities_read_all
  on public.passport_activities
  for select
  to authenticated
  using (active = true);

-- Policies for academic profile
create policy passport_academic_profile_admin_all
  on public.passport_academic_profile
  for all to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy passport_academic_profile_read_own
  on public.passport_academic_profile
  for select to authenticated
  using (user_id = auth.uid());

-- Seed 3 pathways
insert into public.passport_routes (name, description, pathway_type, active)
values 
  ('Sendero de Conocimiento', 'Actividades académicas y formativas para el desarrollo del conocimiento', 'conocimiento', true),
  ('Sendero de Descubrimiento', 'Experiencias internacionales y culturales para descubrir nuevas perspectivas', 'descubrimiento', true),
  ('Sendero de Impacto Social', 'Proyectos comunitarios y de responsabilidad social', 'impacto_social', true)
on conflict (name) do nothing;

-- Seed sample activities
insert into public.passport_activities (name, description, activity_type, points_awarded, pathway_type, complexity_level, formative_value, active)
values
  ('COIL Internacional', 'Proyecto colaborativo con universidad extranjera', 'coil', 200, 'descubrimiento', 'avanzado', 'Alto valor formativo por colaboración internacional', true),
  ('Intercambio Académico', 'Semestre académico en universidad aliada', 'intercambio', 200, 'descubrimiento', 'avanzado', 'Inmersión cultural completa', true),
  ('Semillero de Investigación', 'Participación activa en grupo de investigación', 'semillero', 150, 'conocimiento', 'intermedio', 'Desarrollo de competencias investigativas', true),
  ('Clase Espejo', 'Clase sincrónica con universidad internacional', 'clase_espejo', 100, 'conocimiento', 'basico', 'Intercambio académico virtual', true),
  ('MOOC Certificado', 'Curso masivo abierto en línea con certificación', 'mooc', 50, 'conocimiento', 'basico', 'Aprendizaje autónomo en plataformas digitales', true),
  ('Evento Cultural Internacional', 'Asistencia a evento de intercambio cultural', 'evento', 30, 'descubrimiento', 'basico', 'Apertura a nuevas culturas', true),
  ('Proyecto Comunitario', 'Desarrollo de proyecto de impacto social', 'proyecto', 150, 'impacto_social', 'intermedio', 'Aplicación práctica con beneficio comunitario', true),
  ('Voluntariado Social', 'Actividad de voluntariado con comunidad vulnerable', 'voluntariado', 100, 'impacto_social', 'intermedio', 'Servicio y responsabilidad social', true)
on conflict do nothing;

-- Seed badges with requirements
insert into public.passport_badges (name, description, badge_type, points_required, credits_required, english_level_required, pathway_completion_required, color, active)
values
  ('Explorador del Conocimiento', 'Completaste actividades formativas en el sendero de conocimiento', 'conocimiento', 200, null, null, array['conocimiento'], '#3B82F6', true),
  ('Viajero Global', 'Participaste en experiencias internacionales de descubrimiento', 'descubrimiento', 200, null, null, array['descubrimiento'], '#10B981', true),
  ('Agente de Cambio', 'Generaste impacto social a través de proyectos comunitarios', 'impacto_social', 200, null, null, array['impacto_social'], '#F59E0B', true),
  ('Ciudadano Global UDES', 'Completaste los 3 senderos con excelencia académica', 'ciudadano_global', 800, 120, 'B2', array['conocimiento', 'descubrimiento', 'impacto_social'], '#8B5CF6', true)
on conflict (name) do nothing;
