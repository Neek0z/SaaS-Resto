-- =============================================================
-- Maison Sévère · Événements & Promotions (multi-tenant)
-- Création de la table events avec RLS par tenant.
-- =============================================================

-- -------------------------------------------------------------
-- Type énuméré pour le type d'événement
-- -------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_type') then
    create type event_type as enum (
      'reduction',
      'happy_hour',
      'menu_special',
      'double_points',
      'offre_libre'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_discount_type') then
    create type event_discount_type as enum ('percent', 'amount');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_applies_to') then
    create type event_applies_to as enum ('all', 'category', 'item');
  end if;
end $$;

-- -------------------------------------------------------------
-- events
-- -------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  title text not null,
  description text,
  type event_type not null,
  discount_type event_discount_type,
  discount_value numeric(10,2),
  loyalty_bonus numeric(4,2),
  applies_to event_applies_to not null default 'all',
  applies_to_id uuid,
  days_of_week int[] not null default '{}',
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  display_on_carte boolean not null default true,
  color text not null default '#e8733a',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_restaurant on public.events(restaurant_id);
create index if not exists idx_events_active     on public.events(restaurant_id, active);
create index if not exists idx_events_dates      on public.events(start_date, end_date);

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
alter table public.events enable row level security;

drop policy if exists "events: read"  on public.events;
drop policy if exists "events: write" on public.events;

create policy "events: read"
  on public.events for select
  using (restaurant_id = public.current_restaurant_id());

create policy "events: write"
  on public.events for all
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());
