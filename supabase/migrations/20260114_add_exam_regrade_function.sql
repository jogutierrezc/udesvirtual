-- Migration: Add function to regrade all exam attempts
-- Drop existing function completely
drop function if exists public.regrade_exam(bigint) cascade;
drop function if exists public.regrade_exam(uuid) cascade;

-- Function that actually recalculates scores
create or replace function public.regrade_exam(p_exam_id bigint)
returns table (
  attempt_id text,
  student_id text,
  old_score text,
  new_score text,
  old_passed text,
  new_passed text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  for rec in 
    select id, user_id, score_numeric, passed
    from public.mooc_exam_attempts
    where exam_id = p_exam_id and submitted_at is not null
  loop
    perform compute_exam_score(rec.id);
    
    return query
    select 
      rec.id::text,
      rec.user_id::text,
      rec.score_numeric::text,
      (select score_numeric from public.mooc_exam_attempts where id = rec.id)::text,
      rec.passed::text,
      (select passed from public.mooc_exam_attempts where id = rec.id)::text;
  end loop;
end;
$$;

grant execute on function public.regrade_exam(bigint) to authenticated;

