create table public.portfolio_cases (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  description text not null check (char_length(description) between 1 and 10000),
  category text not null check (char_length(category) between 1 and 80),
  thumbnail_path text not null,
  youtube_url text,
  game_url text,
  project_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portfolio_cases enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.portfolio_cases to anon, authenticated;

create policy "Portfolio cases are public"
on public.portfolio_cases
for select
to anon, authenticated
using (true);
