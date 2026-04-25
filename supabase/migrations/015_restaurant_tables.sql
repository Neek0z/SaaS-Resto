-- =============================================================
-- Maison Sévère · Tables du restaurant (multi-tenant)
-- - Stocke chaque table physique : libellé, capacité, zone
-- - Utilisé par QR codes (1 QR par table) + Réservations (assignation)
-- =============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'table_zone') then
    create type public.table_zone as enum ('inside', 'terrace', 'bar', 'private');
  end if;
end $$;

create table if not exists public.restaurant_tables (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  label         text not null,
  capacity      int  not null default 2 check (capacity between 1 and 30),
  zone          public.table_zone not null default 'inside',
  display_order int  not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (restaurant_id, label)
);

create index if not exists idx_restaurant_tables_resto on public.restaurant_tables(restaurant_id);

alter table public.restaurant_tables
  alter column restaurant_id set default public.current_restaurant_id();

drop trigger if exists trg_restaurant_tables_touch on public.restaurant_tables;
create trigger trg_restaurant_tables_touch
  before update on public.restaurant_tables
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- RLS tenant-aware
-- -------------------------------------------------------------
alter table public.restaurant_tables enable row level security;

drop policy if exists "restaurant_tables: tenant lit" on public.restaurant_tables;
drop policy if exists "restaurant_tables: tenant insère" on public.restaurant_tables;
drop policy if exists "restaurant_tables: tenant met à jour" on public.restaurant_tables;
drop policy if exists "restaurant_tables: tenant supprime" on public.restaurant_tables;

create policy "restaurant_tables: tenant lit"
  on public.restaurant_tables for select
  using (restaurant_id = public.current_restaurant_id());

create policy "restaurant_tables: tenant insère"
  on public.restaurant_tables for insert
  with check (restaurant_id = public.current_restaurant_id());

create policy "restaurant_tables: tenant met à jour"
  on public.restaurant_tables for update
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());

create policy "restaurant_tables: tenant supprime"
  on public.restaurant_tables for delete
  using (restaurant_id = public.current_restaurant_id());

-- -------------------------------------------------------------
-- Lecture publique (pour la résa publique via QR)
-- N'expose que id, label, capacity, zone — pas de restaurant_id direct.
-- -------------------------------------------------------------
create policy "restaurant_tables: lecture anonyme"
  on public.restaurant_tables for select
  to anon
  using (active = true);
