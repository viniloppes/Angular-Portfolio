create table public.portfolio_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 1 and 80),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ativo smallint not null default 1 check (ativo in (0, 1))
);

alter table public.portfolio_cases
  add column category_id uuid,
  add column ativo smallint not null default 1 check (ativo in (0, 1));

insert into public.portfolio_categories (name)
select distinct btrim(category)
from public.portfolio_cases
where btrim(category) <> ''
on conflict (name) do nothing;

update public.portfolio_cases as cases
set category_id = categories.id
from public.portfolio_categories as categories
where btrim(cases.category) = categories.name
  and cases.category_id is null;

do $$
begin
  if exists (
    select 1 from public.portfolio_cases
    where category_id is null
  ) then
    raise exception 'Every portfolio case must map to a category before the migration can finish.';
  end if;
end
$$;

alter table public.portfolio_cases
  alter column category_id set not null,
  add constraint portfolio_cases_category_id_fkey
    foreign key (category_id) references public.portfolio_categories (id);

create index portfolio_cases_category_id_idx
  on public.portfolio_cases (category_id);

create or replace function public.set_portfolio_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger portfolio_categories_set_updated_at
before update on public.portfolio_categories
for each row execute function public.set_portfolio_updated_at();

create trigger portfolio_cases_set_updated_at
before update on public.portfolio_cases
for each row execute function public.set_portfolio_updated_at();
