-- =============================================================
-- Maison Sévère · Programme de fidélité (multi-tenant)
-- Refonte des tables loyalty_* pour intégrer restaurant_id,
-- ajoute loyalty_transactions + loyalty_config, RLS par tenant.
-- =============================================================

-- -------------------------------------------------------------
-- Drop des anciennes tables (étaient pré-multi-tenant, mockées).
-- -------------------------------------------------------------
drop table if exists public.loyalty_customers cascade;
drop table if exists public.loyalty_rewards   cascade;

-- L'enum loyalty_tier existe déjà (bronze/silver/gold/platine).

-- -------------------------------------------------------------
-- loyalty_customers
-- -------------------------------------------------------------
create table public.loyalty_customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  points int not null default 0,
  total_spent numeric(10,2) not null default 0,
  visit_count int not null default 0,
  last_visit timestamptz,
  tier loyalty_tier not null default 'bronze',
  created_at timestamptz not null default now()
);
create index idx_loyalty_cust_restaurant on public.loyalty_customers(restaurant_id);
create unique index uniq_loyalty_cust_email
  on public.loyalty_customers(restaurant_id, email)
  where email is not null;

-- -------------------------------------------------------------
-- loyalty_rewards
-- -------------------------------------------------------------
create table public.loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  points_cost int not null check (points_cost >= 0),
  active boolean not null default true,
  claimed_count int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_loyalty_rew_restaurant on public.loyalty_rewards(restaurant_id);

-- -------------------------------------------------------------
-- loyalty_transactions
-- -------------------------------------------------------------
create table public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid not null references public.loyalty_customers(id) on delete cascade,
  type text not null check (type in ('earn','redeem')),
  points int not null,
  description text,
  order_id uuid,
  created_at timestamptz not null default now()
);
create index idx_loyalty_tx_restaurant on public.loyalty_transactions(restaurant_id);
create index idx_loyalty_tx_customer   on public.loyalty_transactions(customer_id, created_at desc);

-- -------------------------------------------------------------
-- loyalty_config (1 ligne par restaurant)
-- -------------------------------------------------------------
create table public.loyalty_config (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  active boolean not null default true,
  program_name text not null default 'Programme fidélité',
  welcome_message text,
  points_per_euro numeric(6,2) not null default 10,
  threshold_silver int not null default 500,
  threshold_gold int not null default 1500,
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Trigger updated_at sur loyalty_config
-- -------------------------------------------------------------
drop trigger if exists trg_loyalty_config_touch on public.loyalty_config;
create trigger trg_loyalty_config_touch before update on public.loyalty_config
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- RLS : restreint au restaurant courant
-- -------------------------------------------------------------
alter table public.loyalty_customers    enable row level security;
alter table public.loyalty_rewards      enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.loyalty_config       enable row level security;

drop policy if exists "loyalty_cust: read"  on public.loyalty_customers;
drop policy if exists "loyalty_cust: write" on public.loyalty_customers;
drop policy if exists "loyalty_rew: read"   on public.loyalty_rewards;
drop policy if exists "loyalty_rew: write"  on public.loyalty_rewards;
drop policy if exists "loyalty_tx: read"    on public.loyalty_transactions;
drop policy if exists "loyalty_tx: write"   on public.loyalty_transactions;
drop policy if exists "loyalty_cfg: read"   on public.loyalty_config;
drop policy if exists "loyalty_cfg: write"  on public.loyalty_config;

create policy "loyalty_cust: read"
  on public.loyalty_customers for select
  using (restaurant_id = public.current_restaurant_id());
create policy "loyalty_cust: write"
  on public.loyalty_customers for all
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());

create policy "loyalty_rew: read"
  on public.loyalty_rewards for select
  using (restaurant_id = public.current_restaurant_id());
create policy "loyalty_rew: write"
  on public.loyalty_rewards for all
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());

create policy "loyalty_tx: read"
  on public.loyalty_transactions for select
  using (restaurant_id = public.current_restaurant_id());
create policy "loyalty_tx: write"
  on public.loyalty_transactions for all
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());

create policy "loyalty_cfg: read"
  on public.loyalty_config for select
  using (restaurant_id = public.current_restaurant_id());
create policy "loyalty_cfg: write"
  on public.loyalty_config for all
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());

-- -------------------------------------------------------------
-- handle_new_user : seed config + récompenses suggérées
-- (ré-écrit pour conserver la création du restaurant + app_users)
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

  -- Configuration fidélité par défaut
  insert into public.loyalty_config (restaurant_id, program_name, welcome_message)
  values (
    new_restaurant_id,
    'Club ' || resto_name,
    'Bienvenue dans notre programme fidélité !'
  );

  -- Récompenses suggérées
  insert into public.loyalty_rewards (restaurant_id, name, description, points_cost) values
    (new_restaurant_id, 'Café offert',         'Un café au comptoir ou en salle.',           100),
    (new_restaurant_id, 'Dessert offert',      'Un dessert de votre choix sur la carte.',    300),
    (new_restaurant_id, '-10% sur l''addition','10% de réduction sur la note totale.',       500),
    (new_restaurant_id, 'Repas offert',        'Un menu complet pour une personne.',        1500);

  return new;
end;
$$;

-- -------------------------------------------------------------
-- Pour les restaurants existants (créés avant cette migration),
-- seed config + récompenses si manquants.
-- -------------------------------------------------------------
insert into public.loyalty_config (restaurant_id, program_name, welcome_message)
select r.id, 'Club ' || r.name, 'Bienvenue dans notre programme fidélité !'
from public.restaurants r
where not exists (select 1 from public.loyalty_config c where c.restaurant_id = r.id);

insert into public.loyalty_rewards (restaurant_id, name, description, points_cost)
select r.id, x.name, x.description, x.points_cost
from public.restaurants r
cross join (
  values
    ('Café offert',          'Un café au comptoir ou en salle.',           100),
    ('Dessert offert',       'Un dessert de votre choix sur la carte.',    300),
    ('-10% sur l''addition', '10% de réduction sur la note totale.',       500),
    ('Repas offert',         'Un menu complet pour une personne.',        1500)
) as x(name, description, points_cost)
where not exists (
  select 1 from public.loyalty_rewards lr
  where lr.restaurant_id = r.id
);
