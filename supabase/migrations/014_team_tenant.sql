-- =============================================================
-- Maison Sévère · Équipe multi-tenant
-- - Ajoute restaurant_id, created_at, updated_at
-- - Backfill + NOT NULL + index
-- - RLS tenant-aware (remplace policies globales 001_init)
-- - Trigger updated_at
-- =============================================================

alter table public.team_members
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade,
  add column if not exists created_at    timestamptz not null default now(),
  add column if not exists updated_at    timestamptz not null default now();

-- -------------------------------------------------------------
-- Backfill : assigne les membres orphelins au premier restaurant
-- (ou supprime si aucun restaurant n'existe)
-- -------------------------------------------------------------
do $$
declare
  fallback_id uuid;
begin
  select id into fallback_id from public.restaurants order by created_at limit 1;
  if fallback_id is null then
    delete from public.team_members where restaurant_id is null;
  else
    update public.team_members
       set restaurant_id = fallback_id
     where restaurant_id is null;
  end if;
end $$;

alter table public.team_members
  alter column restaurant_id set not null;

alter table public.team_members
  alter column restaurant_id set default public.current_restaurant_id();

create index if not exists idx_team_restaurant_name
  on public.team_members(restaurant_id, name);

-- -------------------------------------------------------------
-- Trigger updated_at (touch_updated_at créé en 010)
-- -------------------------------------------------------------
drop trigger if exists trg_team_updated_at on public.team_members;
create trigger trg_team_updated_at
  before update on public.team_members
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- RLS tenant-aware : on remplace les policies globales du 001
-- -------------------------------------------------------------
drop policy if exists team_members_staff_read    on public.team_members;
drop policy if exists team_members_manager_write on public.team_members;

create policy team_members_tenant_read on public.team_members
  for select
  using (restaurant_id = public.current_restaurant_id());

create policy team_members_tenant_insert on public.team_members
  for insert
  with check (
    restaurant_id = public.current_restaurant_id()
    and public.current_app_role() in ('owner','manager')
  );

create policy team_members_tenant_update on public.team_members
  for update
  using (
    restaurant_id = public.current_restaurant_id()
    and public.current_app_role() in ('owner','manager')
  )
  with check (restaurant_id = public.current_restaurant_id());

create policy team_members_tenant_delete on public.team_members
  for delete
  using (
    restaurant_id = public.current_restaurant_id()
    and public.current_app_role() in ('owner','manager')
  );
