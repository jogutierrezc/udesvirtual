-- Migration: create mooc_activities and mooc_activity_submissions tables for actividades/tareas

-- Table: mooc_activities
create table if not exists mooc_activities (
  id uuid default gen_random_uuid() primary key,
  course_id uuid not null references mooc_courses(id) on delete cascade,
  lesson_id uuid references mooc_lessons(id) on delete set null,
  title text not null,
  description text,
  instructions text,
  due_date date,
  submission_types text[], -- ['file','video','link']
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_mooc_activities_course_id on mooc_activities(course_id);
create index if not exists idx_mooc_activities_lesson_id on mooc_activities(lesson_id);

-- Table: mooc_activity_submissions
create table if not exists mooc_activity_submissions (
  id uuid default gen_random_uuid() primary key,
  activity_id uuid not null references mooc_activities(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  file_url text,
  video_url text,
  link_url text,
  observation text,
  submitted_at timestamptz default now(),
  evaluated boolean default false,
  grade numeric,
  feedback text,
  evaluated_at timestamptz,
  evaluated_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_activity_submissions_activity_id on mooc_activity_submissions(activity_id);
create index if not exists idx_activity_submissions_student_id on mooc_activity_submissions(student_id);
