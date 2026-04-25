-- =============================================================
-- Maison Sévère · Vérification + ré-application idempotente
--   migrations 010 → 014
-- =============================================================
-- Sûr à exécuter même si tout est déjà en place :
--  • toutes les colonnes / index / triggers utilisent IF NOT EXISTS
--  • toutes les policies / triggers sont dropés avant recréation
-- À la fin : un rapport SELECT te montre l'état final.
-- =============================================================


-- =============================================================
-- 010 · Réservations multi-tenant
-- =============================================================
alter table public.reservations
  add column if not exists restaurant_id    uuid references public.restaurants(id) on delete cascade,
  add column if not exists phone            text,
  add column if not exists email            text,
  add column if not exists duration_minutes int  not null default 90,
  add column if not exists source           text not null default 'manual',
  add column if not exists created_at       timestamptz not null default now(),
  add column if not exists updated_at       timestamptz not null default now();

do $$
declare default_resto uuid;
begin
  select id into default_resto from public.restaurants order by created_at asc limit 1;
  if default_resto is null then
    delete from public.reservations where restaurant_id is null;
  else
    update public.reservations set restaurant_id = default_resto where restaurant_id is null;
  end if;
end $$;

alter table public.reservations alter column restaurant_id set not null;
alter table public.reservations alter column restaurant_id set default public.current_restaurant_id();

create index if not exists idx_resa_restaurant      on public.reservations(restaurant_id);
create index if not exists idx_resa_restaurant_date on public.reservations(restaurant_id, reservation_date);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists trg_reservations_touch on public.reservations;
create trigger trg_reservations_touch
  before update on public.reservations
  for each row execute function public.touch_updated_at();

drop policy if exists reservations_staff_read     on public.reservations;
drop policy if exists reservations_manager_write  on public.reservations;
drop policy if exists "reservations: tenant lit"        on public.reservations;
drop policy if exists "reservations: tenant écrit"      on public.reservations;
drop policy if exists "reservations: tenant insère"     on public.reservations;
drop policy if exists "reservations: tenant met à jour" on public.reservations;
drop policy if exists "reservations: tenant supprime"   on public.reservations;

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


-- =============================================================
-- 011 · Commandes multi-tenant
-- =============================================================
alter table public.orders
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade,
  add column if not exists note          text,
  add column if not exists updated_at    timestamptz not null default now();

do $$
declare default_resto uuid;
begin
  select id into default_resto from public.restaurants order by created_at asc limit 1;
  if default_resto is null then
    delete from public.orders where restaurant_id is null;
  else
    update public.orders set restaurant_id = default_resto where restaurant_id is null;
  end if;
end $$;

alter table public.orders alter column restaurant_id set not null;
alter table public.orders alter column restaurant_id set default public.current_restaurant_id();

create index if not exists idx_orders_restaurant         on public.orders(restaurant_id);
create index if not exists idx_orders_restaurant_created on public.orders(restaurant_id, created_at desc);

do $$
declare con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.orders'::regclass and contype = 'u'
  loop
    execute format('alter table public.orders drop constraint %I', con.conname);
  end loop;
end $$;

create unique index if not exists ux_orders_restaurant_display
  on public.orders(restaurant_id, display_id);

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch
  before update on public.orders
  for each row execute function public.touch_updated_at();

create or replace function public.orders_employee_status_only()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.current_user_role() = 'employee' then
    if new.display_id   is distinct from old.display_id
       or new.table_label is distinct from old.table_label
       or new.covers      is distinct from old.covers
       or new.items       is distinct from old.items
       or new.priority    is distinct from old.priority
       or new.channel     is distinct from old.channel
       or new.total       is distinct from old.total
       or new.created_at  is distinct from old.created_at then
      raise exception 'Un employé ne peut modifier que le statut de la commande.';
    end if;
  end if;
  return new;
end; $$;

drop policy if exists orders_staff_read     on public.orders;
drop policy if exists orders_manager_write  on public.orders;
drop policy if exists "orders: tenant lit"        on public.orders;
drop policy if exists "orders: tenant insère"     on public.orders;
drop policy if exists "orders: tenant met à jour" on public.orders;
drop policy if exists "orders: tenant supprime"   on public.orders;

create policy "orders: tenant lit"
  on public.orders for select
  using (restaurant_id = public.current_restaurant_id());
create policy "orders: tenant insère"
  on public.orders for insert
  with check (
    restaurant_id = public.current_restaurant_id()
    and public.has_role_at_least('manager')
  );
create policy "orders: tenant met à jour"
  on public.orders for update
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());
create policy "orders: tenant supprime"
  on public.orders for delete
  using (
    restaurant_id = public.current_restaurant_id()
    and public.has_role_at_least('manager')
  );


-- =============================================================
-- 012 · Settings du restaurant (contact + horaires + paiement)
-- =============================================================
alter table public.restaurants
  add column if not exists business_type   text,
  add column if not exists address_line    text,
  add column if not exists address_zip     text,
  add column if not exists address_city    text,
  add column if not exists phone           text,
  add column if not exists contact_email   text,
  add column if not exists siret           text,
  add column if not exists vat_number      text,
  add column if not exists description     text,
  add column if not exists hours           jsonb not null default '{}'::jsonb,
  add column if not exists payment         jsonb not null default '{}'::jsonb,
  add column if not exists updated_at      timestamptz not null default now();

drop trigger if exists trg_restaurants_updated_at on public.restaurants;
create trigger trg_restaurants_updated_at
  before update on public.restaurants
  for each row execute function public.touch_updated_at();


-- =============================================================
-- 013 · Reviews multi-tenant + reply
-- =============================================================
alter table public.reviews
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade,
  add column if not exists reply_text    text,
  add column if not exists replied_at    timestamptz,
  add column if not exists updated_at    timestamptz not null default now();

do $$
declare fallback_id uuid;
begin
  select id into fallback_id from public.restaurants order by created_at limit 1;
  if fallback_id is null then
    delete from public.reviews where restaurant_id is null;
  else
    update public.reviews set restaurant_id = fallback_id where restaurant_id is null;
  end if;
end $$;

alter table public.reviews alter column restaurant_id set not null;
alter table public.reviews alter column restaurant_id set default public.current_restaurant_id();

create index if not exists idx_reviews_restaurant_created
  on public.reviews(restaurant_id, created_at desc);

update public.reviews
   set replied_at = coalesce(replied_at, created_at)
 where replied = true and replied_at is null;

drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at
  before update on public.reviews
  for each row execute function public.touch_updated_at();

drop policy if exists reviews_staff_read    on public.reviews;
drop policy if exists reviews_manager_write on public.reviews;
drop policy if exists reviews_tenant_read   on public.reviews;
drop policy if exists reviews_tenant_insert on public.reviews;
drop policy if exists reviews_tenant_update on public.reviews;
drop policy if exists reviews_tenant_delete on public.reviews;

create policy reviews_tenant_read on public.reviews
  for select using (restaurant_id = public.current_restaurant_id());
create policy reviews_tenant_insert on public.reviews
  for insert with check (
    restaurant_id = public.current_restaurant_id()
    and public.current_app_role() in ('owner','manager')
  );
create policy reviews_tenant_update on public.reviews
  for update
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());
create policy reviews_tenant_delete on public.reviews
  for delete using (
    restaurant_id = public.current_restaurant_id()
    and public.current_app_role() in ('owner','manager')
  );


-- =============================================================
-- 014 · Équipe multi-tenant
-- =============================================================
alter table public.team_members
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade,
  add column if not exists created_at    timestamptz not null default now(),
  add column if not exists updated_at    timestamptz not null default now();

do $$
declare fallback_id uuid;
begin
  select id into fallback_id from public.restaurants order by created_at limit 1;
  if fallback_id is null then
    delete from public.team_members where restaurant_id is null;
  else
    update public.team_members set restaurant_id = fallback_id where restaurant_id is null;
  end if;
end $$;

alter table public.team_members alter column restaurant_id set not null;
alter table public.team_members alter column restaurant_id set default public.current_restaurant_id();

create index if not exists idx_team_restaurant_name
  on public.team_members(restaurant_id, name);

drop trigger if exists trg_team_updated_at on public.team_members;
create trigger trg_team_updated_at
  before update on public.team_members
  for each row execute function public.touch_updated_at();

drop policy if exists team_members_staff_read    on public.team_members;
drop policy if exists team_members_manager_write on public.team_members;
drop policy if exists team_members_tenant_read   on public.team_members;
drop policy if exists team_members_tenant_insert on public.team_members;
drop policy if exists team_members_tenant_update on public.team_members;
drop policy if exists team_members_tenant_delete on public.team_members;

create policy team_members_tenant_read on public.team_members
  for select using (restaurant_id = public.current_restaurant_id());
create policy team_members_tenant_insert on public.team_members
  for insert with check (
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
  for delete using (
    restaurant_id = public.current_restaurant_id()
    and public.current_app_role() in ('owner','manager')
  );


-- =============================================================
-- ✅ Rapport de vérification
-- =============================================================
-- Colonnes ajoutées : on attend 26 lignes (8+3+12+4+3 - les déjà existantes)
select '── COLONNES ──' as section;
select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'reservations'  and column_name in ('restaurant_id','phone','email','duration_minutes','source','created_at','updated_at'))
 or (table_name = 'orders'        and column_name in ('restaurant_id','note','updated_at'))
 or (table_name = 'restaurants'   and column_name in ('business_type','address_line','address_zip','address_city','phone','contact_email','siret','vat_number','description','hours','payment','updated_at'))
 or (table_name = 'reviews'       and column_name in ('restaurant_id','reply_text','replied_at','updated_at'))
 or (table_name = 'team_members'  and column_name in ('restaurant_id','created_at','updated_at'))
  )
order by table_name, column_name;

-- Policies tenant : on attend 17 lignes (4 resa + 4 orders + 4 reviews + 4 team + 1 vide pour restaurants si pas de policy ajoutée)
select '── POLICIES TENANT ──' as section;
select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('reservations','orders','reviews','team_members')
  and (policyname ilike '%tenant%' or policyname ilike '%tenant_%')
order by tablename, cmd;

-- Triggers updated_at : on attend 5 lignes (resa, orders, restaurants, reviews, team)
select '── TRIGGERS updated_at ──' as section;
select
  event_object_table as table_name,
  trigger_name
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name in (
    'trg_reservations_touch',
    'trg_orders_touch',
    'trg_restaurants_updated_at',
    'trg_reviews_updated_at',
    'trg_team_updated_at'
  )
order by event_object_table;

-- Index : on attend 6 lignes
select '── INDEX TENANT ──' as section;
select
  schemaname,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'idx_resa_restaurant',
    'idx_resa_restaurant_date',
    'idx_orders_restaurant',
    'idx_orders_restaurant_created',
    'ux_orders_restaurant_display',
    'idx_reviews_restaurant_created',
    'idx_team_restaurant_name'
  )
order by tablename, indexname;

select '✅ Si tu vois 26 colonnes + 16 policies + 5 triggers + 7 index, tout est OK.' as final_check;
