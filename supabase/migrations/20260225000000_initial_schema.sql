-- ============================================================
-- Astrologer Database Schema
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. astrologer_profiles - User profile + subscription tracking
-- ============================================================
create table public.astrologer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  stripe_customer_id text,
  subscription_status text not null default 'free'
    check (subscription_status in ('free', 'trialing', 'active', 'past_due', 'canceled')),
  subscription_plan text
    check (subscription_plan in ('monthly', 'annual')),
  trial_ends_at timestamptz,
  subscription_expires_at timestamptz,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_astrologer_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.astrologer_profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_astrologer_user();

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger astrologer_profiles_updated_at
  before update on public.astrologer_profiles
  for each row execute function public.update_updated_at();

-- RLS
alter table public.astrologer_profiles enable row level security;

create policy "Users can view own profile"
  on public.astrologer_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.astrologer_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- 2. saved_charts - Persisted chart data
-- ============================================================
create table public.saved_charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.astrologer_profiles(id) on delete cascade,
  name text not null,
  chart_type text not null default 'natal'
    check (chart_type in ('natal', 'synastry')),
  person_a_name text,
  person_a_date text not null,
  person_a_time text not null default '12:00',
  person_a_location text,
  person_a_lat double precision not null,
  person_a_lng double precision not null,
  person_a_chart jsonb not null,
  person_b_name text,
  person_b_date text,
  person_b_time text,
  person_b_location text,
  person_b_lat double precision,
  person_b_lng double precision,
  person_b_chart jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_saved_charts_user_id on public.saved_charts(user_id);
create index idx_saved_charts_created_at on public.saved_charts(created_at desc);

create trigger saved_charts_updated_at
  before update on public.saved_charts
  for each row execute function public.update_updated_at();

-- RLS
alter table public.saved_charts enable row level security;

create policy "Users can view own charts"
  on public.saved_charts for select
  using (auth.uid() = user_id);

create policy "Users can insert own charts"
  on public.saved_charts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own charts"
  on public.saved_charts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own charts"
  on public.saved_charts for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 3. Realtime for subscription updates
-- ============================================================
alter publication supabase_realtime add table public.astrologer_profiles;

-- ============================================================
-- 4. Helper: check active subscription
-- ============================================================
create or replace function public.has_active_subscription(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_status text;
  v_trial_ends timestamptz;
  v_expires timestamptz;
begin
  select subscription_status, trial_ends_at, subscription_expires_at
  into v_status, v_trial_ends, v_expires
  from public.astrologer_profiles
  where id = p_user_id;

  if v_status = 'active' then
    return coalesce(v_expires > now(), true);
  end if;

  if v_status = 'trialing' then
    return coalesce(v_trial_ends > now(), false);
  end if;

  return false;
end;
$$;
