insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-covers',
  'portfolio-covers',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy portfolio_covers_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-covers');

create policy portfolio_covers_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-covers'
  and (select auth.uid()) = '829615e0-72aa-4ba3-9d99-96d25391dfc4'::uuid
);

create policy portfolio_covers_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-covers'
  and (select auth.uid()) = '829615e0-72aa-4ba3-9d99-96d25391dfc4'::uuid
)
with check (
  bucket_id = 'portfolio-covers'
  and (select auth.uid()) = '829615e0-72aa-4ba3-9d99-96d25391dfc4'::uuid
);
