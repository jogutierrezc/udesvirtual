-- Migration: create mooc_readings and student_reading_progress tables

-- Table: mooc_readings
create table if not exists mooc_readings (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid not null references mooc_lessons(id) on delete cascade,
  title text not null,
  content text, -- HTML content stored inline
  storage_path text, -- optional storage path for uploaded file
  file_name text,
  type text not null default 'inline', -- 'inline' or 'file'
  sort_order integer default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_mooc_readings_lesson_id on mooc_readings(lesson_id);

-- Table: student_reading_progress
create table if not exists student_reading_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reading_id uuid not null references mooc_readings(id) on delete cascade,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, reading_id)
);

create index if not exists idx_student_reading_user on student_reading_progress(user_id);

-- Create storage bucket for reading files
insert into storage.buckets (id, name, public)
values ('mooc-readings', 'mooc-readings', true)
on conflict (id) do nothing;

-- Policies for storage.objects specific to mooc-readings
drop policy if exists "Public read for mooc-readings" on storage.objects;
create policy "Public read for mooc-readings"
  on storage.objects for select
  to public
  using (bucket_id = 'mooc-readings');

drop policy if exists "Authenticated upload to mooc-readings" on storage.objects;
create policy "Authenticated upload to mooc-readings"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'mooc-readings');

drop policy if exists "Authenticated update for mooc-readings" on storage.objects;
create policy "Authenticated update for mooc-readings"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'mooc-readings')
  with check (bucket_id = 'mooc-readings');

drop policy if exists "Authenticated delete for mooc-readings" on storage.objects;
create policy "Authenticated delete for mooc-readings"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'mooc-readings');
