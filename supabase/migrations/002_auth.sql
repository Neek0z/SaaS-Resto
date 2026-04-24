-- =============================================================
-- Maison Sévère · Auth & Multi-tenant
-- Ajoute : enum plan, tables restaurants + app_users,
--         trigger d'onboarding (sign up → restaurant + profile),
--         RLS par restaurant.
-- =============================================================

-- -------------------------------------------------------------
-- ENUM plan
-- -------------------------------------------------------------
do $$ begin
  create type plan_tier as enum ('essentiel','pro','multi');
exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------
-- Table restaurants (tenant)
-- -------------------------------------------------------------
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan plan_tier not null default 'essentiel',
  billing_cycle text not null default 'monthly', -- 'monthly' | 'yearly'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_restaurants_plan on public.restaurants(plan);

-- -------------------------------------------------------------
-- Table app_users (profile lié à auth.users)
-- -------------------------------------------------------------
create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  email text not null,
  role app_role not null default 'owner',
  created_at timestamptz not null default now()
);

create index if not exists idx_app_users_restaurant on public.app_users(restaurant_id);

-- -------------------------------------------------------------
-- Helper : restaurant_id de l'utilisateur courant
-- -------------------------------------------------------------
create or replace function public.current_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select restaurant_id from public.app_users where id = auth.uid()
$$;

-- -------------------------------------------------------------
-- Trigger : à la création d'un auth.users, créer restaurant + profile
-- Le nom du restaurant vient du raw_user_meta_data.restaurant_name
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_restaurant_id uuid;
  resto_name text;
begin
  resto_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'restaurant_name', ''),
    'Mon restaurant'
  );

  insert into public.restaurants (name, plan)
  values (resto_name, 'essentiel')
  returning id into new_restaurant_id;

  insert into public.app_users (id, restaurant_id, email, role)
  values (new.id, new_restaurant_id, new.email, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
alter table public.restaurants enable row level security;
alter table public.app_users   enable row level security;

drop policy if exists "restaurants: membre lit son resto"  on public.restaurants;
drop policy if exists "restaurants: owner met à jour"      on public.restaurants;
drop policy if exists "app_users: lit son profil"          on public.app_users;
drop policy if exists "app_users: lit collègues du resto"  on public.app_users;
drop policy if exists "app_users: owner met à jour"        on public.app_users;

create policy "restaurants: membre lit son resto"
  on public.restaurants for select
  using (id = public.current_restaurant_id());

create policy "restaurants: owner met à jour"
  on public.restaurants for update
  using (id = public.current_restaurant_id());

create policy "app_users: lit son profil"
  on public.app_users for select
  using (id = auth.uid());

create policy "app_users: lit collègues du resto"
  on public.app_users for select
  using (restaurant_id = public.current_restaurant_id());

create policy "app_users: owner met à jour"
  on public.app_users for update
  using (restaurant_id = public.current_restaurant_id());
