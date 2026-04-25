-- =============================================================
-- Maison Sévère · Commandes multi-tenant
-- - Ajoute restaurant_id + note + updated_at
-- - Backfill puis NOT NULL
-- - display_id : unique par tenant (au lieu de global)
-- - Remplace les RLS génériques par des policies tenant-aware
-- - Corrige le trigger orders_employee_status_only (colonne total au lieu de amount)
-- - Trigger updated_at
-- =============================================================

-- -------------------------------------------------------------
-- Nouvelles colonnes
-- -------------------------------------------------------------
alter table public.orders
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade,
  add column if not exists note          text,
  add column if not exists updated_at    timestamptz not null default now();

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
    delete from public.orders where restaurant_id is null;
  else
    update public.orders
      set restaurant_id = default_resto
      where restaurant_id is null;
  end if;
end $$;

alter table public.orders
  alter column restaurant_id set not null;

create index if not exists idx_orders_restaurant         on public.orders(restaurant_id);
create index if not exists idx_orders_restaurant_created on public.orders(restaurant_id, created_at desc);

-- -------------------------------------------------------------
-- Default restaurant_id = current_restaurant_id() pour les inserts
-- côté client (évite de devoir l'injecter explicitement).
-- -------------------------------------------------------------
alter table public.orders
  alter column restaurant_id set default public.current_restaurant_id();

-- -------------------------------------------------------------
-- display_id : passe d'unique global → unique par tenant
-- -------------------------------------------------------------
do $$
declare
  con record;
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

-- -------------------------------------------------------------
-- Trigger updated_at (réutilise la fonction touch_updated_at de 010)
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

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- Corrige le trigger orders_employee_status_only
-- (colonne s'appelle "total", pas "amount")
-- -------------------------------------------------------------
create or replace function public.orders_employee_status_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
end;
$$;

-- -------------------------------------------------------------
-- RLS : remplace les policies génériques par tenant-aware
-- -------------------------------------------------------------
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
