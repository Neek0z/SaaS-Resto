-- =============================================================
-- Maison Sévère · Auto-crédit fidélité sur commande servie
-- - Ajoute orders.loyalty_customer_id (nullable, FK)
-- - Trigger : quand orders.status passe à 'served' ET un client
--   fidélité est associé, crédite des points dans
--   loyalty_transactions et met à jour loyalty_customers.
-- - Idempotent : ne re-crédite pas si une tx 'earn' existe déjà
--   pour ce order_id × customer_id.
-- - Tier recalc : bronze / silver / gold selon thresholds config.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Colonne sur orders
-- -------------------------------------------------------------
alter table public.orders
  add column if not exists loyalty_customer_id uuid
    references public.loyalty_customers(id) on delete set null;

create index if not exists idx_orders_loyalty_customer
  on public.orders(loyalty_customer_id)
  where loyalty_customer_id is not null;

-- -------------------------------------------------------------
-- 2. Helper de calcul de tier
-- -------------------------------------------------------------
create or replace function public.loyalty_compute_tier(
  p_points int,
  p_threshold_silver int,
  p_threshold_gold int
)
returns loyalty_tier
language sql
immutable
as $$
  select case
    when p_points >= p_threshold_gold   then 'gold'::loyalty_tier
    when p_points >= p_threshold_silver then 'silver'::loyalty_tier
    else 'bronze'::loyalty_tier
  end;
$$;

-- -------------------------------------------------------------
-- 3. Trigger d'auto-crédit
--    Conditions de déclenchement :
--      - status passe à 'served' (et n'y était pas avant)
--      - loyalty_customer_id n'est pas null
--      - aucune transaction earn déjà rattachée à cet order
-- -------------------------------------------------------------
create or replace function public.credit_loyalty_on_served()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.loyalty_config%rowtype;
  pts int;
  new_points int;
  new_tier loyalty_tier;
begin
  -- Seulement à la transition vers 'served'
  if new.status is distinct from 'served' then
    return new;
  end if;
  if old.status = 'served' then
    return new;
  end if;
  if new.loyalty_customer_id is null then
    return new;
  end if;

  -- Idempotence : un earn existe déjà pour cet order ?
  if exists (
    select 1 from public.loyalty_transactions t
    where t.order_id = new.id
      and t.customer_id = new.loyalty_customer_id
      and t.type = 'earn'
  ) then
    return new;
  end if;

  -- Charge la config du restaurant
  select * into cfg from public.loyalty_config
  where restaurant_id = new.restaurant_id;

  if not found or cfg.active is false then
    return new;
  end if;

  -- Calcul points (1 € = points_per_euro pts, arrondi inférieur)
  pts := floor(new.total * cfg.points_per_euro)::int;
  if pts <= 0 then
    return new;
  end if;

  -- Insert la transaction earn
  insert into public.loyalty_transactions (
    restaurant_id, customer_id, type, points, description, order_id
  ) values (
    new.restaurant_id,
    new.loyalty_customer_id,
    'earn',
    pts,
    'Commande ' || new.display_id,
    new.id
  );

  -- Met à jour le client : points + dépense + visite + tier
  update public.loyalty_customers c
    set points       = c.points + pts,
        total_spent  = c.total_spent + new.total,
        visit_count  = c.visit_count + 1,
        last_visit   = now(),
        tier         = public.loyalty_compute_tier(
                         c.points + pts,
                         cfg.threshold_silver,
                         cfg.threshold_gold
                       )
    where c.id = new.loyalty_customer_id;

  return new;
end;
$$;

drop trigger if exists trg_orders_loyalty_credit on public.orders;
create trigger trg_orders_loyalty_credit
  after update of status on public.orders
  for each row
  execute function public.credit_loyalty_on_served();

-- -------------------------------------------------------------
-- 4. Couverture du cas "création directe en 'served'"
--    (rare mais possible — ex: import historique, encaissement
--    rapide avec status set d'emblée). Trigger AFTER INSERT.
-- -------------------------------------------------------------
create or replace function public.credit_loyalty_on_insert_served()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.loyalty_config%rowtype;
  pts int;
begin
  if new.status is distinct from 'served' then
    return new;
  end if;
  if new.loyalty_customer_id is null then
    return new;
  end if;
  if exists (
    select 1 from public.loyalty_transactions t
    where t.order_id = new.id
      and t.customer_id = new.loyalty_customer_id
      and t.type = 'earn'
  ) then
    return new;
  end if;

  select * into cfg from public.loyalty_config
  where restaurant_id = new.restaurant_id;
  if not found or cfg.active is false then
    return new;
  end if;

  pts := floor(new.total * cfg.points_per_euro)::int;
  if pts <= 0 then
    return new;
  end if;

  insert into public.loyalty_transactions (
    restaurant_id, customer_id, type, points, description, order_id
  ) values (
    new.restaurant_id, new.loyalty_customer_id,
    'earn', pts, 'Commande ' || new.display_id, new.id
  );

  update public.loyalty_customers c
    set points      = c.points + pts,
        total_spent = c.total_spent + new.total,
        visit_count = c.visit_count + 1,
        last_visit  = now(),
        tier        = public.loyalty_compute_tier(
                        c.points + pts,
                        cfg.threshold_silver,
                        cfg.threshold_gold
                      )
    where c.id = new.loyalty_customer_id;

  return new;
end;
$$;

drop trigger if exists trg_orders_loyalty_credit_insert on public.orders;
create trigger trg_orders_loyalty_credit_insert
  after insert on public.orders
  for each row
  execute function public.credit_loyalty_on_insert_served();
