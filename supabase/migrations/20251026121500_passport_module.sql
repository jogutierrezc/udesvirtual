-- Passport Module Schema v2
-- Three pathways system: Conocimiento, Descubrimiento, Impacto Social
-- Activity catalog with points, badges with academic requirements

-- Ensure pgcrypto or uuid-ossp is available depending on environment; using gen_random_uuid()
-- (Supabase default has pgcrypto)

-- SETTINGS
create table if not exists public.passport_settings (
  id uuid primary key default gen_random_uuid(),
  min_points_for_badge integer not null default 100,
  min_credits_for_global_citizen integer not null default 120,
  min_english_level text not null default 'B1',
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ROUTES (Senderos: Conocimiento, Descubrimiento, Impacto Social)
create table if not exists public.passport_routes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  pathway_type text not null check (pathway_type in ('conocimiento', 'descubrimiento', 'impacto_social')),
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ROUTE STEPS
create table if not exists public.passport_route_steps (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.passport_routes(id) on delete cascade,
  order_index int not null,
  title text not null,
  description text,
  points_required int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_step_per_route unique(route_id, order_index)
);

create index if not exists idx_passport_route_steps_route on public.passport_route_steps(route_id);

-- ACTIVITY CATALOG (Catálogo de Actividades Elegibles)
create table if not exists public.passport_activities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  activity_type text not null check (activity_type in ('coil', 'intercambio', 'semillero', 'clase_espejo', 'mooc', 'evento', 'proyecto', 'otro')),
  points_awarded integer not null default 0,
  pathway_type text check (pathway_type in ('conocimiento', 'descubrimiento', 'impacto_social', 'multiple')),
  complexity_level text check (complexity_level in ('basico', 'intermedio', 'avanzado')),
  formative_value text,
  active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_passport_activities_type on public.passport_activities(activity_type);
create index if not exists idx_passport_activities_pathway on public.passport_activities(pathway_type);

-- BADGES (Insignias: Conocimiento, Descubrimiento, Impacto Social, Ciudadano Global)
create table if not exists public.passport_badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon_url text,
  color text,
  badge_type text not null check (badge_type in ('conocimiento', 'descubrimiento', 'impacto_social', 'ciudadano_global')),
  points_required integer not null default 0,
  credits_required integer default 0,
  english_level_required text,
  pathway_completion_required text[],
  key_activities_required jsonb default '[]',
  criteria jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RECOGNITIONS (Reconocimientos)
create table if not exists public.passport_recognitions (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  description text,
  icon_url text,
  color text,
  criteria jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- POINTS LEDGER (Gamificación con tracking de actividad)
create table if not exists public.passport_points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null,
  pathway_type text check (pathway_type in ('conocimiento', 'descubrimiento', 'impacto_social')),
  activity_id uuid references public.passport_activities(id) on delete set null,
  reason text,
  source text,
  related_type text,
  related_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_passport_points_user on public.passport_points_ledger(user_id);
create index if not exists idx_passport_points_created_at on public.passport_points_ledger(created_at desc);

-- USER BADGES
create table if not exists public.passport_user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.passport_badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  evidence_url text,
  metadata jsonb not null default '{}',
  constraint unique_user_badge unique(user_id, badge_id)
);

create index if not exists idx_passport_user_badges_user on public.passport_user_badges(user_id);

-- USER RECOGNITIONS
create table if not exists public.passport_user_recognitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recognition_id uuid not null references public.passport_recognitions(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  metadata jsonb not null default '{}',
  constraint unique_user_recognition unique(user_id, recognition_id)
);

create index if not exists idx_passport_user_recognitions_user on public.passport_user_recognitions(user_id);

-- ACADEMIC CRITERIA (Criterios Académicos del Estudiante)
create table if not exists public.passport_academic_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  credits_approved integer not null default 0,
  english_level text,
  last_english_test_date timestamptz,
  cumulative_gpa numeric(3,2),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_passport_academic_profile_user on public.passport_academic_profile(user_id);

-- RLS
alter table public.passport_settings enable row level security;
alter table public.passport_routes enable row level security;
alter table public.passport_route_steps enable row level security;
alter table public.passport_activities enable row level security;
alter table public.passport_badges enable row level security;
alter table public.passport_recognitions enable row level security;
alter table public.passport_points_ledger enable row level security;
alter table public.passport_user_badges enable row level security;
alter table public.passport_user_recognitions enable row level security;
alter table public.passport_academic_profile enable row level security;

-- Drop existing policies if they exist (for re-run safety)
drop policy if exists passport_settings_admin_all on public.passport_settings;
drop policy if exists passport_routes_admin_all on public.passport_routes;
drop policy if exists passport_route_steps_admin_all on public.passport_route_steps;
drop policy if exists passport_activities_admin_all on public.passport_activities;
drop policy if exists passport_activities_read_all on public.passport_activities;
drop policy if exists passport_badges_admin_all on public.passport_badges;
drop policy if exists passport_badges_read_all on public.passport_badges;
drop policy if exists passport_recognitions_admin_all on public.passport_recognitions;
drop policy if exists passport_points_admin_all on public.passport_points_ledger;
drop policy if exists passport_points_user_read_own on public.passport_points_ledger;
drop policy if exists passport_user_badges_admin_all on public.passport_user_badges;
drop policy if exists passport_user_badges_read_own on public.passport_user_badges;
drop policy if exists passport_user_recognitions_admin_all on public.passport_user_recognitions;
drop policy if exists passport_user_recognitions_read_own on public.passport_user_recognitions;
drop policy if exists passport_academic_admin_all on public.passport_academic_profile;
drop policy if exists passport_academic_read_own on public.passport_academic_profile;

-- Policies: Admin full access for config tables
create policy passport_settings_admin_all
  on public.passport_settings
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy passport_routes_admin_all
  on public.passport_routes
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy passport_route_steps_admin_all
  on public.passport_route_steps
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy passport_badges_admin_all
  on public.passport_badges
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy passport_recognitions_admin_all
  on public.passport_recognitions
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- Activities: Admin manages, all can read active ones
create policy passport_activities_admin_all
  on public.passport_activities
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy passport_activities_read_all
  on public.passport_activities
  for select to authenticated
  using (active = true);

-- Badges: Admin manages, all can read active ones
create policy passport_badges_admin_all
  on public.passport_badges
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy passport_badges_read_all
  on public.passport_badges
  for select to authenticated
  using (active = true);

-- Policies: Points and awards
-- Ledger: admins can manage, users can read their own
create policy passport_points_admin_all
  on public.passport_points_ledger
  for all to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy passport_points_user_read_own
  on public.passport_points_ledger
  for select to authenticated
  using (user_id = auth.uid());

-- User badges
create policy passport_user_badges_admin_all
  on public.passport_user_badges
  for all to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy passport_user_badges_read_own
  on public.passport_user_badges
  for select to authenticated
  using (user_id = auth.uid());

-- User recognitions
create policy passport_user_recognitions_admin_all
  on public.passport_user_recognitions
  for all to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy passport_user_recognitions_read_own
  on public.passport_user_recognitions
  for select to authenticated
  using (user_id = auth.uid());

-- Academic Profile: Admin can manage all, users can read/update their own
create policy passport_academic_admin_all
  on public.passport_academic_profile
  for all to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy passport_academic_read_own
  on public.passport_academic_profile
  for select to authenticated
  using (user_id = auth.uid());

create policy passport_academic_update_own
  on public.passport_academic_profile
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Seed initial data
-- Three pathways
insert into public.passport_routes (name, description, pathway_type, active)
values 
  ('Sendero de Conocimiento', 'Actividades académicas y formativas para profundizar el conocimiento', 'conocimiento', true),
  ('Sendero de Descubrimiento', 'Experiencias internacionales y culturales para ampliar horizontes', 'descubrimiento', true),
  ('Sendero de Impacto Social', 'Proyectos comunitarios y sociales para generar transformación', 'impacto_social', true)
on conflict (name) do nothing;

-- Sample activities catalog
insert into public.passport_activities (name, description, activity_type, points_awarded, pathway_type, complexity_level, formative_value, active)
values
  ('Proyecto COIL', 'Collaborative Online International Learning con universidad aliada', 'coil', 100, 'descubrimiento', 'avanzado', 'Desarrollo de competencias interculturales y colaboración internacional', true),
  ('Intercambio Académico', 'Semestre completo en universidad internacional', 'intercambio', 200, 'descubrimiento', 'avanzado', 'Inmersión cultural y académica completa', true),
  ('Semillero de Investigación', 'Participación activa en grupo de investigación', 'semillero', 150, 'conocimiento', 'avanzado', 'Desarrollo de pensamiento crítico y habilidades investigativas', true),
  ('Clase Espejo Internacional', 'Participación en clase con universidad aliada', 'clase_espejo', 50, 'descubrimiento', 'intermedio', 'Intercambio académico y cultural virtual', true),
  ('Curso MOOC Certificado', 'Completar curso masivo abierto en línea', 'mooc', 30, 'conocimiento', 'basico', 'Actualización y aprendizaje continuo', true),
  ('Evento Internacional', 'Asistencia a congreso, simposio o conferencia internacional', 'evento', 40, 'conocimiento', 'intermedio', 'Networking y actualización académica', true),
  ('Proyecto Social Comunitario', 'Liderazgo o participación en proyecto de impacto social', 'proyecto', 120, 'impacto_social', 'avanzado', 'Responsabilidad social y liderazgo comunitario', true),
  ('Voluntariado Internacional', 'Servicio voluntario en contexto internacional', 'proyecto', 80, 'impacto_social', 'intermedio', 'Solidaridad global y trabajo en comunidad', true)
on conflict (name) do nothing;

-- Four main badges
insert into public.passport_badges (name, description, badge_type, points_required, credits_required, english_level_required, pathway_completion_required, active, color)
values
  ('Insignia de Conocimiento', 'Completa el Sendero de Conocimiento y demuestra excelencia académica', 'conocimiento', 300, 0, null, ARRAY['conocimiento'], true, '#3B82F6'),
  ('Insignia de Descubrimiento', 'Completa el Sendero de Descubrimiento y amplía tus horizontes internacionales', 'descubrimiento', 300, 0, null, ARRAY['descubrimiento'], true, '#10B981'),
  ('Insignia de Impacto Social', 'Completa el Sendero de Impacto Social y genera transformación comunitaria', 'impacto_social', 200, 0, null, ARRAY['impacto_social'], true, '#F59E0B'),
  ('Insignia Ciudadano Global', 'Máximo reconocimiento: completa los 3 senderos y cumple requisitos académicos', 'ciudadano_global', 800, 120, 'B2', ARRAY['conocimiento', 'descubrimiento', 'impacto_social'], true, '#8B5CF6')
on conflict (name) do nothing;
