-- PRIPER initial schema and RLS policies
-- This migration creates tables: user_profiles, job_entries, analysis_results
-- and sets up secure Row Level Security (RLS) so each user can only access their own data.

-- Extensions (gen_random_uuid is available by default on Supabase via pgcrypto)
create extension if not exists pgcrypto;

-- 1) user_profiles
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age integer,
  region text,
  job_status text not null default '없음' check (job_status in ('없음','준비중','운영중')),
  purpose text not null check (purpose in ('자기 분석','브랜드 설계','커뮤니티 매칭')),
  created_at timestamptz not null default now()
);

-- 2) job_entries
create table if not exists public.job_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  job_name text not null,
  definition text,
  first_memory text,
  category text not null check (category in ('happy','pain','neutral')),
  reason text,
  has_experience boolean not null default false,
  experience_note text,
  created_at timestamptz not null default now()
);

create index if not exists job_entries_user_id_idx on public.job_entries(user_id);
create index if not exists job_entries_category_idx on public.job_entries(category);

-- 3) analysis_results
create table if not exists public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  prime_perspective text,
  happy_keywords text[] not null default '{}',
  pain_keywords text[] not null default '{}',
  analysis_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analysis_results_user_id_idx on public.analysis_results(user_id);

-- Enable RLS
alter table public.user_profiles enable row level security;
alter table public.job_entries enable row level security;
alter table public.analysis_results enable row level security;

-- Policies: user can manage only their own rows
-- user_profiles
create policy if not exists "Users can select own profile" on public.user_profiles
  for select using (id = auth.uid());

create policy if not exists "Users can insert own profile" on public.user_profiles
  for insert with check (id = auth.uid());

create policy if not exists "Users can update own profile" on public.user_profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy if not exists "Users can delete own profile" on public.user_profiles
  for delete using (id = auth.uid());

-- job_entries
create policy if not exists "Users can select own job_entries" on public.job_entries
  for select using (user_id = auth.uid());

create policy if not exists "Users can insert own job_entries" on public.job_entries
  for insert with check (user_id = auth.uid());

create policy if not exists "Users can update own job_entries" on public.job_entries
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy if not exists "Users can delete own job_entries" on public.job_entries
  for delete using (user_id = auth.uid());

-- analysis_results
create policy if not exists "Users can select own analysis_results" on public.analysis_results
  for select using (user_id = auth.uid());

create policy if not exists "Users can insert own analysis_results" on public.analysis_results
  for insert with check (user_id = auth.uid());

create policy if not exists "Users can update own analysis_results" on public.analysis_results
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy if not exists "Users can delete own analysis_results" on public.analysis_results
  for delete using (user_id = auth.uid());
