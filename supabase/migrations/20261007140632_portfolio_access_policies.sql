alter table public.portfolio_categories enable row level security;
alter table public.portfolio_cases enable row level security;

revoke all on public.portfolio_categories from anon, authenticated;
revoke all on public.portfolio_cases from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.portfolio_categories to anon;
grant select, insert, update on public.portfolio_categories to authenticated;
grant select on public.portfolio_cases to anon;
grant select, insert, update on public.portfolio_cases to authenticated;

drop policy if exists portfolio_categories_public_read on public.portfolio_categories;
create policy portfolio_categories_public_read
on public.portfolio_categories
for select
to anon, authenticated
using (ativo = 1);

drop policy if exists portfolio_categories_admin_read on public.portfolio_categories;
create policy portfolio_categories_admin_read
on public.portfolio_categories
for select
to authenticated
using ((select auth.uid()) = '829615e0-72aa-4ba3-9d99-96d25391dfc4'::uuid);

drop policy if exists portfolio_categories_admin_insert on public.portfolio_categories;
create policy portfolio_categories_admin_insert
on public.portfolio_categories
for insert
to authenticated
with check ((select auth.uid()) = '829615e0-72aa-4ba3-9d99-96d25391dfc4'::uuid);

drop policy if exists portfolio_categories_admin_update on public.portfolio_categories;
create policy portfolio_categories_admin_update
on public.portfolio_categories
for update
to authenticated
using ((select auth.uid()) = '829615e0-72aa-4ba3-9d99-96d25391dfc4'::uuid)
with check ((select auth.uid()) = '829615e0-72aa-4ba3-9d99-96d25391dfc4'::uuid);

drop policy if exists portfolio_cases_public_read on public.portfolio_cases;
create policy portfolio_cases_public_read
on public.portfolio_cases
for select
to anon, authenticated
using (
  ativo = 1
  and exists (
    select 1
    from public.portfolio_categories
    where id = portfolio_cases.category_id
      and ativo = 1
  )
);

drop policy if exists portfolio_cases_admin_read on public.portfolio_cases;
create policy portfolio_cases_admin_read
on public.portfolio_cases
for select
to authenticated
using ((select auth.uid()) = '829615e0-72aa-4ba3-9d99-96d25391dfc4'::uuid);

drop policy if exists portfolio_cases_admin_insert on public.portfolio_cases;
create policy portfolio_cases_admin_insert
on public.portfolio_cases
for insert
to authenticated
with check ((select auth.uid()) = '829615e0-72aa-4ba3-9d99-96d25391dfc4'::uuid);

drop policy if exists portfolio_cases_admin_update on public.portfolio_cases;
create policy portfolio_cases_admin_update
on public.portfolio_cases
for update
to authenticated
using ((select auth.uid()) = '829615e0-72aa-4ba3-9d99-96d25391dfc4'::uuid)
with check ((select auth.uid()) = '829615e0-72aa-4ba3-9d99-96d25391dfc4'::uuid);

create or replace function public.require_active_portfolio_category()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  category_active smallint;
begin
  select ativo into category_active
  from public.portfolio_categories
  where id = new.category_id
  for share;

  if category_active is distinct from 1 then
    raise exception using
      errcode = '23514',
      message = 'A categoria do case precisa estar ativa.';
  end if;

  return new;
end;
$$;

drop trigger if exists portfolio_cases_require_active_category on public.portfolio_cases;
create trigger portfolio_cases_require_active_category
before insert or update of category_id, ativo
on public.portfolio_cases
for each row
when (new.ativo = 1)
execute function public.require_active_portfolio_category();

create or replace function public.prevent_category_deactivation_with_active_cases()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.ativo = 1 and new.ativo = 0
    and exists (
      select 1
      from public.portfolio_cases
      where category_id = old.id and ativo = 1
    )
  then
    raise exception using
      errcode = '23514',
      message = 'Reatribua ou desative os cases ativos antes de desativar esta categoria.';
  end if;

  return new;
end;
$$;

drop trigger if exists portfolio_categories_prevent_emptying on public.portfolio_categories;
create trigger portfolio_categories_prevent_emptying
before update of ativo
on public.portfolio_categories
for each row
when (old.ativo = 1 and new.ativo = 0)
execute function public.prevent_category_deactivation_with_active_cases();
