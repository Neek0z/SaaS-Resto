-- =============================================================
-- Maison Sévère · Système de rôles utilisateurs
-- Étend l'enum app_role et fournit des helpers pour RLS / RoleGate.
-- Hiérarchie : employee < manager < owner < developer
-- =============================================================

-- -------------------------------------------------------------
-- Étendre l'enum existant ('owner','manager','staff')
-- staff devient employee (renommé), on ajoute employee + developer
-- -------------------------------------------------------------
do $$ begin
  alter type app_role rename value 'staff' to 'employee';
exception
  when undefined_object then null;
  when invalid_parameter_value then null;
end $$;

do $$ begin
  alter type app_role add value if not exists 'employee';
exception when others then null; end $$;

do $$ begin
  alter type app_role add value if not exists 'developer';
exception when others then null; end $$;

-- -------------------------------------------------------------
-- Helper : rang d'un rôle (employee=1, manager=2, owner=3, developer=4)
-- -------------------------------------------------------------
-- NB : on compare via r::text plutôt que via les littéraux enum, sinon
-- Postgres refuse d'utiliser 'developer' tant qu'il n'a pas été commité
-- (ALTER TYPE ADD VALUE doit être visible avant d'être référencé).
create or replace function public.role_rank(r app_role)
returns int
language sql
immutable
as $$
  select case r::text
    when 'employee'  then 1
    when 'manager'   then 2
    when 'owner'     then 3
    when 'developer' then 4
    else 0
  end
$$;

-- -------------------------------------------------------------
-- Helper : rôle de l'utilisateur courant (lit app_users.role)
-- security definer pour traverser RLS sur app_users
-- -------------------------------------------------------------
create or replace function public.current_user_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.app_users where id = auth.uid()
$$;

-- -------------------------------------------------------------
-- Helper : current_user_role >= min_role
-- -------------------------------------------------------------
create or replace function public.has_role_at_least(min_role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.role_rank(public.current_user_role()) >= public.role_rank(min_role),
    false
  )
$$;

-- -------------------------------------------------------------
-- Default : nouveaux app_users non-owner sont 'employee'
-- (Le trigger handle_new_user crée l'owner du restaurant à l'inscription
--  et continue d'utiliser 'owner' explicitement.)
-- -------------------------------------------------------------
alter table public.app_users alter column role set default 'employee';

-- -------------------------------------------------------------
-- RLS : seul un owner+ peut modifier app_users.role / supprimer un membre
-- (en remplacement de la policy générique "owner met à jour")
-- -------------------------------------------------------------
drop policy if exists "app_users: owner met à jour" on public.app_users;
drop policy if exists "app_users: owner gère équipe" on public.app_users;
drop policy if exists "app_users: owner supprime"   on public.app_users;
drop policy if exists "app_users: owner insère"     on public.app_users;

create policy "app_users: owner gère équipe"
  on public.app_users for update
  using (
    restaurant_id = public.current_restaurant_id()
    and public.has_role_at_least('owner')
  )
  with check (
    restaurant_id = public.current_restaurant_id()
    and public.has_role_at_least('owner')
  );

create policy "app_users: owner insère"
  on public.app_users for insert
  with check (
    restaurant_id = public.current_restaurant_id()
    and public.has_role_at_least('owner')
  );

create policy "app_users: owner supprime"
  on public.app_users for delete
  using (
    restaurant_id = public.current_restaurant_id()
    and public.has_role_at_least('owner')
    and id <> auth.uid() -- un owner ne peut pas se supprimer lui-même
  );

-- -------------------------------------------------------------
-- handle_new_user : reconnaît les invitations
-- Si raw_user_meta_data contient restaurant_id (utilisateur invité
-- via l'edge function invite-user), on attache au resto existant
-- avec le rôle invité ; sinon on crée un nouveau restaurant + owner.
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invited_resto uuid;
  invited_role  app_role;
  new_resto_id  uuid;
  resto_name    text;
begin
  invited_resto := (new.raw_user_meta_data ->> 'restaurant_id')::uuid;
  invited_role  := nullif(new.raw_user_meta_data ->> 'invited_role', '')::app_role;

  if invited_resto is not null then
    -- Cas invitation : la ligne app_users existe peut-être déjà (créée
    -- en upsert par l'edge function). On la garantit.
    insert into public.app_users (id, restaurant_id, email, role)
    values (new.id, invited_resto, new.email, coalesce(invited_role, 'employee'))
    on conflict (id) do update
      set restaurant_id = excluded.restaurant_id,
          email         = excluded.email,
          role          = excluded.role;
  else
    -- Cas inscription standard : nouveau restaurant + profil owner.
    resto_name := coalesce(
      nullif(new.raw_user_meta_data ->> 'restaurant_name', ''),
      'Mon restaurant'
    );
    insert into public.restaurants (name, plan)
    values (resto_name, 'essentiel')
    returning id into new_resto_id;

    insert into public.app_users (id, restaurant_id, email, role)
    values (new.id, new_resto_id, new.email, 'owner');
  end if;

  return new;
end;
$$;

-- -------------------------------------------------------------
-- RLS commandes : un employee peut UPDATE uniquement orders.status
-- (le RLS au niveau colonne n'existe pas en PG ; on contraint via une
--  policy de ligne qui interdit la modification d'autres colonnes via
--  un déclencheur BEFORE UPDATE.)
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
       or new.amount      is distinct from old.amount
       or new.created_at  is distinct from old.created_at then
      raise exception 'Un employé ne peut modifier que le statut de la commande.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_employee_status_only_trg on public.orders;
create trigger orders_employee_status_only_trg
  before update on public.orders
  for each row execute function public.orders_employee_status_only();
