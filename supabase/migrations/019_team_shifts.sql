-- =============================================================
-- Maison Sévère · Shifts par jour pour l'équipe
-- - Sépare l'identité (team_members) des shifts (team_shifts)
-- - Un shift = un membre × un jour, avec horaires/pause/statut
-- - Backfill : crée le shift d'aujourd'hui pour chaque membre
--   à partir de ses anciennes valeurs sur team_members.
-- - Les colonnes start_at/end_at/break_start/break_end/status/hours
--   restent sur team_members en tant que "template" pour
--   pré-remplir les nouveaux shifts (rétrocompat des inserts seed).
-- =============================================================

create table if not exists public.team_shifts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.restaurants(id) on delete cascade
    default public.current_restaurant_id(),
  member_id uuid not null
    references public.team_members(id) on delete cascade,
  shift_date date not null,
  start_at numeric(4,2) not null,
  end_at numeric(4,2) not null,
  break_start numeric(4,2),
  break_end numeric(4,2),
  status team_status not null default 'service',
  hours text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, member_id, shift_date)
);

create index if not exists idx_team_shifts_date_resto
  on public.team_shifts(restaurant_id, shift_date);
create index if not exists idx_team_shifts_member_date
  on public.team_shifts(member_id, shift_date);

drop trigger if exists trg_team_shifts_touch on public.team_shifts;
create trigger trg_team_shifts_touch
  before update on public.team_shifts
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- Backfill : un shift "aujourd'hui" par membre, hérité de ses
-- valeurs courantes. on conflict do nothing pour pouvoir relancer.
-- -------------------------------------------------------------
insert into public.team_shifts (
  restaurant_id, member_id, shift_date,
  start_at, end_at, break_start, break_end, status, hours
)
select
  m.restaurant_id, m.id, current_date,
  m.start_at, m.end_at, m.break_start, m.break_end, m.status, m.hours
from public.team_members m
on conflict (restaurant_id, member_id, shift_date) do nothing;

-- -------------------------------------------------------------
-- RLS tenant-aware
-- -------------------------------------------------------------
alter table public.team_shifts enable row level security;

drop policy if exists team_shifts_tenant_read   on public.team_shifts;
drop policy if exists team_shifts_tenant_insert on public.team_shifts;
drop policy if exists team_shifts_tenant_update on public.team_shifts;
drop policy if exists team_shifts_tenant_delete on public.team_shifts;

create policy team_shifts_tenant_read on public.team_shifts
  for select
  using (restaurant_id = public.current_restaurant_id());

create policy team_shifts_tenant_insert on public.team_shifts
  for insert
  with check (
    restaurant_id = public.current_restaurant_id()
    and public.current_app_role() in ('owner','manager')
  );

create policy team_shifts_tenant_update on public.team_shifts
  for update
  using (
    restaurant_id = public.current_restaurant_id()
    and public.current_app_role() in ('owner','manager')
  )
  with check (restaurant_id = public.current_restaurant_id());

create policy team_shifts_tenant_delete on public.team_shifts
  for delete
  using (
    restaurant_id = public.current_restaurant_id()
    and public.current_app_role() in ('owner','manager')
  );
