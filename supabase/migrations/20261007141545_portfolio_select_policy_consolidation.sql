drop policy if exists portfolio_categories_public_read on public.portfolio_categories;
drop policy if exists portfolio_categories_admin_read on public.portfolio_categories;
create policy portfolio_categories_select
on public.portfolio_categories
for select
to anon, authenticated
using (
  ativo = 1
  or (select auth.uid()) = '829615e0-72aa-4ba3-9d99-96d25391dfc4'::uuid
);

drop policy if exists portfolio_cases_public_read on public.portfolio_cases;
drop policy if exists portfolio_cases_admin_read on public.portfolio_cases;
create policy portfolio_cases_select
on public.portfolio_cases
for select
to anon, authenticated
using (
  (
    ativo = 1
    and exists (
      select 1
      from public.portfolio_categories
      where id = portfolio_cases.category_id
        and ativo = 1
    )
  )
  or (select auth.uid()) = '829615e0-72aa-4ba3-9d99-96d25391dfc4'::uuid
);
