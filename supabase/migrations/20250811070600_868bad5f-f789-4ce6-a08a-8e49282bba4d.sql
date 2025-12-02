-- Re-run: create brand_strategies without FK to analysis_results (table not present)
create table if not exists public.brand_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  analysis_result_id uuid null,
  brand_direction jsonb not null default '{}'::jsonb,
  content_strategy jsonb not null default '{}'::jsonb,
  target_audience jsonb not null default '{}'::jsonb,
  brand_names text[] not null default '{}',
  selected_brand_name text null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_brand_strategies_user_id on public.brand_strategies(user_id);
create index if not exists idx_brand_strategies_created_at on public.brand_strategies(created_at desc);
create index if not exists idx_brand_strategies_analysis_result_id on public.brand_strategies(analysis_result_id);

-- Enable RLS
alter table public.brand_strategies enable row level security;

-- Idempotent policy recreation
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'brand_strategies' and policyname = 'Users can view their own brand strategies') then
    drop policy "Users can view their own brand strategies" on public.brand_strategies;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'brand_strategies' and policyname = 'Users can insert their own brand strategies') then
    drop policy "Users can insert their own brand strategies" on public.brand_strategies;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'brand_strategies' and policyname = 'Users can update their own brand strategies') then
    drop policy "Users can update their own brand strategies" on public.brand_strategies;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'brand_strategies' and policyname = 'Users can delete their own brand strategies') then
    drop policy "Users can delete their own brand strategies" on public.brand_strategies;
  end if;
end$$;

create policy "Users can view their own brand strategies"
  on public.brand_strategies
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own brand strategies"
  on public.brand_strategies
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own brand strategies"
  on public.brand_strategies
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own brand strategies"
  on public.brand_strategies
  for delete
  using (auth.uid() = user_id);
