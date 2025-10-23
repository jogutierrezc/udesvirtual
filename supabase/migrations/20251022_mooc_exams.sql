-- MOOC Exams schema: exams, questions, options, attempts, answers
-- Grading scale 0-5, attachable to course (and optional lesson), with RLS and triggers

begin;

-- 1) Exams table
create table if not exists public.mooc_exams (
  id bigserial primary key,
  course_id bigint not null references public.mooc_courses(id) on delete cascade,
  -- Optional: attach to a specific lesson; nullable for course-level exams
  lesson_id bigint references public.mooc_lessons(id) on delete set null,
  title text not null,
  description text,
  order_index integer default 0,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  max_score numeric(4,2) not null default 5.00,
  passing_score numeric(4,2) not null default 3.00, -- threshold on 0..5 scale
  time_limit_minutes integer, -- null => no limit
  attempts_allowed integer not null default 1,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mooc_exams_course on public.mooc_exams(course_id);
create index if not exists idx_mooc_exams_lesson on public.mooc_exams(lesson_id);

-- 2) Questions
create table if not exists public.mooc_exam_questions (
  id bigserial primary key,
  exam_id bigint not null references public.mooc_exams(id) on delete cascade,
  type text not null check (type in ('single_choice','multiple_choice','true_false','short_text')),
  prompt text not null,
  order_index integer default 0,
  points numeric(6,2) not null default 1.00,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mooc_exam_questions_exam on public.mooc_exam_questions(exam_id);

-- 3) Options (for choice questions)
create table if not exists public.mooc_exam_options (
  id bigserial primary key,
  question_id bigint not null references public.mooc_exam_questions(id) on delete cascade,
  text text not null,
  is_correct boolean not null default false,
  order_index integer default 0
);

create index if not exists idx_mooc_exam_options_question on public.mooc_exam_options(question_id);

-- 4) Attempts
create table if not exists public.mooc_exam_attempts (
  id bigserial primary key,
  exam_id bigint not null references public.mooc_exams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_number integer not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score_percent numeric(6,3), -- 0..100
  score_numeric numeric(4,2), -- 0..5
  passed boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, user_id, attempt_number)
);

create index if not exists idx_mooc_exam_attempts_exam on public.mooc_exam_attempts(exam_id);
create index if not exists idx_mooc_exam_attempts_user on public.mooc_exam_attempts(user_id);

-- 5) Answers (stores selected choice(s) or text)
create table if not exists public.mooc_exam_answers (
  id bigserial primary key,
  attempt_id bigint not null references public.mooc_exam_attempts(id) on delete cascade,
  question_id bigint not null references public.mooc_exam_questions(id) on delete cascade,
  selected_option_id bigint references public.mooc_exam_options(id) on delete set null,
  selected_option_ids bigint[] not null default '{}', -- for multiple_choice
  text_answer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists idx_mooc_exam_answers_attempt on public.mooc_exam_answers(attempt_id);
create index if not exists idx_mooc_exam_answers_question on public.mooc_exam_answers(question_id);

-- Updated timestamps
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;$$;

create trigger trg_mooc_exams_updated
before update on public.mooc_exams
for each row execute function public.set_updated_at();

create trigger trg_mooc_exam_questions_updated
before update on public.mooc_exam_questions
for each row execute function public.set_updated_at();

create trigger trg_mooc_exam_attempts_updated
before update on public.mooc_exam_attempts
for each row execute function public.set_updated_at();

create trigger trg_mooc_exam_answers_updated
before update on public.mooc_exam_answers
for each row execute function public.set_updated_at();

-- Enforce attempt limits
create or replace function public.ensure_attempt_limit()
returns trigger language plpgsql as $$
declare
  allowed integer;
  current_count integer;
  next_number integer;
begin
  select attempts_allowed into allowed from public.mooc_exams where id = new.exam_id;
  if allowed is null then allowed := 1; end if;

  select count(*) into current_count from public.mooc_exam_attempts
  where exam_id = new.exam_id and user_id = new.user_id;

  if current_count >= allowed then
    raise exception 'Attempt limit (%) reached for exam %', allowed, new.exam_id;
  end if;

  next_number := coalesce((
    select max(attempt_number) from public.mooc_exam_attempts
    where exam_id = new.exam_id and user_id = new.user_id
  ), 0) + 1;

  new.attempt_number := next_number;
  return new;
end;$$;

create trigger trg_attempt_limit
before insert on public.mooc_exam_attempts
for each row execute function public.ensure_attempt_limit();

-- Compute score on submit (0..5) and pass/fail
create or replace function public.compute_exam_score(p_attempt_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_exam_id bigint;
  v_total_points numeric(12,4);
  v_awarded_points numeric(12,4);
  v_passing numeric(4,2);
  v_percent numeric(6,3);
  v_score numeric(4,2);
begin
  select a.exam_id into v_exam_id from public.mooc_exam_attempts a where a.id = p_attempt_id;
  if v_exam_id is null then return; end if;

  -- total points
  select coalesce(sum(q.points),0) into v_total_points
  from public.mooc_exam_questions q
  where q.exam_id = v_exam_id;

  -- awarded points: sum points for correct answers
  select coalesce(sum(points),0) into v_awarded_points from (
    select q.points as points
    from public.mooc_exam_answers ans
    join public.mooc_exam_questions q on q.id = ans.question_id
    left join public.mooc_exam_options o on o.id = ans.selected_option_id
    where ans.attempt_id = p_attempt_id
      and (
        (q.type in ('single_choice','true_false') and o.is_correct = true)
        or (
          q.type = 'multiple_choice'
          and (
            select array_agg(id order by id) from public.mooc_exam_options
            where question_id = q.id and is_correct = true
          ) = (select coalesce(array_agg(x order by x), '{}') from unnest(ans.selected_option_ids) as x)
        )
      )
  ) s;

  v_percent := case when v_total_points > 0 then round((v_awarded_points / v_total_points) * 100.0, 3) else 0 end;
  v_score := case when v_total_points > 0 then round((v_awarded_points / v_total_points) * 5.0, 2) else 0 end;

  select passing_score into v_passing from public.mooc_exams where id = v_exam_id;

  update public.mooc_exam_attempts
  set score_percent = v_percent,
      score_numeric = v_score,
      passed = (v_score >= v_passing),
      updated_at = now()
  where id = p_attempt_id;
end;$$;

create or replace function public.compute_exam_score_on_submit()
returns trigger language plpgsql as $$
begin
  -- compute when submitted_at is set from null to not null
  if (tg_op = 'UPDATE' and new.submitted_at is not null and old.submitted_at is null)
     or (tg_op = 'INSERT' and new.submitted_at is not null) then
    perform public.compute_exam_score(new.id);
  end if;
  return new;
end;$$;

create trigger trg_compute_score_on_submit
after insert or update of submitted_at on public.mooc_exam_attempts
for each row execute function public.compute_exam_score_on_submit();

-- RLS
alter table public.mooc_exams enable row level security;
alter table public.mooc_exam_questions enable row level security;
alter table public.mooc_exam_options enable row level security;
alter table public.mooc_exam_attempts enable row level security;
alter table public.mooc_exam_answers enable row level security;

-- Helper predicates
create or replace view public.v_current_user_roles as
select user_id, role from public.user_roles where user_id = auth.uid();

-- Exams policies
create policy "exams_select_creator_or_published_enrolled" on public.mooc_exams
for select to authenticated using (
  -- creator or admin can view
  created_by = auth.uid()
  or exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
  or (
    status = 'published' and exists (
      select 1 from public.mooc_enrollments e where e.user_id = auth.uid() and e.course_id = mooc_exams.course_id
    )
  )
);

create policy "exams_insert_creator_or_admin" on public.mooc_exams
for insert to authenticated with check (
  -- must be the course creator or admin
  exists (
    select 1 from public.mooc_courses c where c.id = course_id and c.created_by = auth.uid()
  )
  or exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
);

create policy "exams_update_delete_owner_or_admin" on public.mooc_exams
for all to authenticated using (
  created_by = auth.uid() or exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
) with check (
  created_by = auth.uid() or exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
);

-- Questions policies
create policy "questions_select_visible" on public.mooc_exam_questions
for select to authenticated using (
  exists (
    select 1 from public.mooc_exams ex where ex.id = exam_id and (
      ex.created_by = auth.uid() or exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
      or (ex.status = 'published' and exists (
        select 1 from public.mooc_enrollments e where e.user_id = auth.uid() and e.course_id = ex.course_id
      ))
    )
  )
);

create policy "questions_cud_owner_or_admin" on public.mooc_exam_questions
for all to authenticated using (
  exists (
    select 1 from public.mooc_exams ex where ex.id = exam_id and (
      ex.created_by = auth.uid() or exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
    )
  )
) with check (
  exists (
    select 1 from public.mooc_exams ex where ex.id = exam_id and (
      ex.created_by = auth.uid() or exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
    )
  )
);

-- Options policies
create policy "options_select_visible" on public.mooc_exam_options
for select to authenticated using (
  exists (
    select 1 from public.mooc_exam_questions q
    join public.mooc_exams ex on ex.id = q.exam_id
    where q.id = question_id and (
      ex.created_by = auth.uid() or exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
      or (ex.status = 'published' and exists (
        select 1 from public.mooc_enrollments e where e.user_id = auth.uid() and e.course_id = ex.course_id
      ))
    )
  )
);

create policy "options_cud_owner_or_admin" on public.mooc_exam_options
for all to authenticated using (
  exists (
    select 1 from public.mooc_exam_questions q
    join public.mooc_exams ex on ex.id = q.exam_id
    where q.id = question_id and (
      ex.created_by = auth.uid() or exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
    )
  )
) with check (
  exists (
    select 1 from public.mooc_exam_questions q
    join public.mooc_exams ex on ex.id = q.exam_id
    where q.id = question_id and (
      ex.created_by = auth.uid() or exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
    )
  )
);

-- Attempts policies
create policy "attempts_select_owner_or_instructor" on public.mooc_exam_attempts
for select to authenticated using (
  user_id = auth.uid() or exists (
    select 1 from public.mooc_exams ex
    join public.mooc_courses c on c.id = ex.course_id
    where ex.id = exam_id and (c.created_by = auth.uid() or exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'))
  )
);

create policy "attempts_insert_enrolled_published" on public.mooc_exam_attempts
for insert to authenticated with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.mooc_exams ex
    join public.mooc_enrollments e on e.course_id = ex.course_id and e.user_id = auth.uid()
    where ex.id = exam_id and ex.status = 'published'
  )
);

create policy "attempts_update_owner_before_submit" on public.mooc_exam_attempts
for update to authenticated using (
  user_id = auth.uid() and submitted_at is null
) with check (
  user_id = auth.uid()
);

-- Answers policies
create policy "answers_select_owner_or_instructor" on public.mooc_exam_answers
for select to authenticated using (
  exists (
    select 1 from public.mooc_exam_attempts a
    join public.mooc_exams ex on ex.id = a.exam_id
    join public.mooc_courses c on c.id = ex.course_id
    where a.id = attempt_id and (
      a.user_id = auth.uid() or c.created_by = auth.uid() or exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
    )
  )
);

create policy "answers_insert_owner_before_submit" on public.mooc_exam_answers
for insert to authenticated with check (
  exists (
    select 1 from public.mooc_exam_attempts a
    where a.id = attempt_id and a.user_id = auth.uid() and a.submitted_at is null
  )
);

create policy "answers_update_owner_before_submit" on public.mooc_exam_answers
for update to authenticated using (
  exists (
    select 1 from public.mooc_exam_attempts a
    where a.id = attempt_id and a.user_id = auth.uid() and a.submitted_at is null
  )
) with check (
  exists (
    select 1 from public.mooc_exam_attempts a
    where a.id = attempt_id and a.user_id = auth.uid()
  )
);

commit;
