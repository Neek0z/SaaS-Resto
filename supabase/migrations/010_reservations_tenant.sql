-- =============================================================
-- Maison Sévère · Réservations multi-tenant
-- - Ajoute restaurant_id + colonnes utiles (phone, email, durée, source)
-- - Backfill puis NOT NULL
-- - Remplace les RLS génériques par des policies tenant-aware
-- - Trigger updated_at
-- =============================================================

-- -------------------------------------------------------------
-- Nouvelles colonnes
-- -------------------------------------------------------------
alter table public.reservations
  add column if not exists restaurant_id    uuid references public.restaurants(id) on delete cascade,
  add column if not exists phone            text,
  add column if not exists email            text,
  add column if not exists duration_minutes int  not null default 90,
  add column if not exists source           text not null default 'manual',
  add column if not exists created_at       timestamptz not null default now(),
  add column if not exists updated_at       timestamptz not null default now();

-- -------------------------------------------------------------
-- Backfill : on rattache les lignes orphelines au premier resto.
-- Si aucun resto n'existe, les lignes sont supprimées (seed démo).
-- -------------------------------------------------------------
do $$
declare
  default_resto uuid;
begin
  select id into default_resto from public.restaurants order by created_at asc limit 1;

  if default_resto is null then
    delete from public.reservations where restaurant_id is null;
  else
    update public.reservations
      set restaurant_id = default_resto
      where restaurant_id is null;
  end if;
end $$;

alter table public.reservations
  alter column restaurant_id set not null;

create index if not exists idx_resa_restaurant      on public.reservations(restaurant_id);
create index if not exists idx_resa_restaurant_date on public.reservations(restaurant_id, reservation_date);

-- -------------------------------------------------------------
-- Default restaurant_id = current_restaurant_id() pour les inserts
-- côté client (évite de devoir injecter explicitement).
-- -------------------------------------------------------------
alter table public.reservations
  alter column restaurant_id set default public.current_restaurant_id();

-- -------------------------------------------------------------
-- Trigger updated_at
-- -------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_reservations_touch on public.reservations;
create trigger trg_reservations_touch
  before update on public.reservations
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- RLS : remplace les policies génériques par tenant-aware
-- -------------------------------------------------------------
drop policy if exists reservations_staff_read     on public.reservations;
drop policy if exists reservations_manager_write  on public.reservations;
drop policy if exists "reservations: tenant lit"     on public.reservations;
drop policy if exists "reservations: tenant écrit"   on public.reservations;
drop policy if exists "reservations: tenant insère"  on public.reservations;
drop policy if exists "reservations: tenant met à jour" on public.reservations;
drop policy if exists "reservations: tenant supprime" on public.reservations;

create policy "reservations: tenant lit"
  on public.reservations for select
  using (restaurant_id = public.current_restaurant_id());

create policy "reservations: tenant insère"
  on public.reservations for insert
  with check (restaurant_id = public.current_restaurant_id());

create policy "reservations: tenant met à jour"
  on public.reservations for update
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());

create policy "reservations: tenant supprime"
  on public.reservations for delete
  using (restaurant_id = public.current_restaurant_id());
