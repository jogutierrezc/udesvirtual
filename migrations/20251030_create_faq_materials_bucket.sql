-- Create storage bucket for FAQ complementary materials
-- Bucket: faq-materials (public read, authenticated write)

-- Create bucket if not exists
insert into storage.buckets (id, name, public)
values ('faq-materials', 'faq-materials', true)
on conflict (id) do nothing;

-- Policies for storage.objects specific to faq-materials
-- Note: PostgreSQL doesn't support CREATE POLICY IF NOT EXISTS.
-- Use DROP POLICY IF EXISTS + CREATE POLICY for idempotency.

drop policy if exists "Public read for faq-materials" on storage.objects;
create policy "Public read for faq-materials"
  on storage.objects for select
  to public
  using (bucket_id = 'faq-materials');

drop policy if exists "Authenticated upload to faq-materials" on storage.objects;
create policy "Authenticated upload to faq-materials"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'faq-materials');

drop policy if exists "Authenticated update for faq-materials" on storage.objects;
create policy "Authenticated update for faq-materials"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'faq-materials')
  with check (bucket_id = 'faq-materials');

drop policy if exists "Authenticated delete for faq-materials" on storage.objects;
create policy "Authenticated delete for faq-materials"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'faq-materials');
