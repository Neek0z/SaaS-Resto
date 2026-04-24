-- =============================================================
-- Maison Sévère · Schéma initial
-- Généré pour Supabase (Postgres 15+)
-- -------------------------------------------------------------
-- Contient : extensions, types enum, tables métier, seed cohérent
-- avec les mocks front, politiques RLS par rôle (owner/staff/public)
-- et index utiles.
-- =============================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- ENUMS
-- -------------------------------------------------------------
do $$ begin create type order_status as enum ('pending','preparing','served','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type order_channel as enum ('salle','cc','delivery'); exception when duplicate_object then null; end $$;
do $$ begin create type order_priority as enum ('high','normal'); exception when duplicate_object then null; end $$;
do $$ begin create type reservation_status as enum ('seated','confirmed','noshow'); exception when duplicate_object then null; end $$;
do $$ begin create type stock_level as enum ('ok','low','out'); exception when duplicate_object then null; end $$;
do $$ begin create type review_source as enum ('Google','TripAdvisor','TheFork'); exception when duplicate_object then null; end $$;
do $$ begin create type team_status as enum ('service','break','late'); exception when duplicate_object then null; end $$;
do $$ begin create type team_kind as enum ('service','kitchen','bar','late'); exception when duplicate_object then null; end $$;
do $$ begin create type alert_level as enum ('high','warn','info'); exception when duplicate_object then null; end $$;
do $$ begin create type loyalty_tier as enum ('bronze','silver','gold','platine'); exception when duplicate_object then null; end $$;
do $$ begin create type app_role as enum ('owner','manager','staff'); exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------
-- Helper : appartenance au personnel via JWT custom claim
-- Attendu dans le JWT : "role" ∈ {owner, manager, staff}
-- -------------------------------------------------------------
create or replace function public.current_app_role()
returns app_role
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    'staff'
  )::app_role
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select auth.uid() is not null
$$;

-- =============================================================
-- TABLES
-- =============================================================

-- --------- Commandes ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  display_id text not null unique,
  table_label text not null,
  covers int not null default 1,
  items text[] not null default '{}',
  total numeric(10,2) not null default 0,
  status order_status not null default 'pending',
  created_at timestamptz not null default now(),
  channel order_channel not null default 'salle',
  waiter text,
  priority order_priority not null default 'normal',
  pickup_time text
);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_channel on public.orders(channel);
create index if not exists idx_orders_created on public.orders(created_at desc);

-- --------- Réservations ----------
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_date date not null default current_date,
  reservation_time text not null,
  name text not null,
  covers int not null default 2,
  table_label text not null,
  status reservation_status not null default 'confirmed',
  note text
);
create index if not exists idx_resa_date on public.reservations(reservation_date);
create index if not exists idx_resa_status on public.reservations(status);

-- --------- Menu ----------
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  sold int not null default 0,
  stock stock_level not null default 'ok',
  margin numeric(5,2) not null default 0,
  trend numeric(6,2) not null default 0
);
create index if not exists idx_menu_category on public.menu_items(category);
create index if not exists idx_menu_stock on public.menu_items(stock);

-- --------- Avis ----------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  source review_source not null,
  author text not null,
  rating numeric(3,1) not null,
  scale int not null default 5,
  created_at timestamptz not null default now(),
  time_label text,
  text text not null,
  replied boolean not null default false
);
create index if not exists idx_reviews_source on public.reviews(source);
create index if not exists idx_reviews_replied on public.reviews(replied);

create table if not exists public.review_sources (
  source review_source primary key,
  rating numeric(3,1) not null,
  count int not null default 0,
  delta numeric(4,2) not null default 0,
  scale int not null default 5
);

-- --------- Équipe ----------
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  status team_status not null default 'service',
  avatar text not null,
  hours text not null,
  start_at numeric(4,2) not null,
  end_at numeric(4,2) not null,
  kind team_kind not null,
  break_start numeric(4,2),
  break_end numeric(4,2)
);

-- --------- Alertes ----------
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  text text not null,
  level alert_level not null default 'info',
  created_at timestamptz not null default now()
);
create index if not exists idx_alerts_level on public.alerts(level);
create index if not exists idx_alerts_created on public.alerts(created_at desc);

-- --------- Menu numérique (conf unique) ----------
create table if not exists public.digital_menu_config (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  published boolean not null default false,
  scans_today int not null default 0,
  scans_week int not null default 0,
  scans_delta numeric(5,2) not null default 0,
  avg_time text,
  conversion numeric(5,2) not null default 0,
  languages text[] not null default '{}',
  theme text not null default 'dark',
  categories jsonb not null default '[]'::jsonb
);

-- --------- Fidélité ----------
create table if not exists public.loyalty_customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar text,
  email text unique,
  tier loyalty_tier not null default 'bronze',
  points int not null default 0,
  visits int not null default 0,
  spent numeric(10,2) not null default 0,
  last_visit text,
  favorite text
);
create index if not exists idx_loyalty_tier on public.loyalty_customers(tier);

create table if not exists public.loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cost int not null,
  description text,
  claimed int not null default 0,
  active boolean not null default true
);

-- --------- KPIs journaliers (snapshot) ----------
create table if not exists public.kpis_daily (
  snapshot_date date primary key default current_date,
  revenue_today numeric(10,2),
  revenue_today_delta numeric(5,2),
  revenue_week numeric(10,2),
  revenue_week_delta numeric(5,2),
  revenue_month numeric(12,2),
  revenue_month_delta numeric(5,2),
  covers int,
  covers_delta numeric(5,2),
  covers_goal int,
  avg_ticket numeric(8,2),
  avg_ticket_delta numeric(5,2),
  occupancy numeric(5,2),
  occupancy_delta numeric(5,2),
  tables_occupied int,
  tables_total int
);

-- =============================================================
-- SEED
-- =============================================================

-- Commandes
insert into public.orders (display_id, table_label, covers, items, total, status, channel, waiter, priority, pickup_time, created_at) values
  ('T-12','Table 12',4,'{"Tartare de bœuf","Sole meunière","Côte de porc","Salade César"}',168,'preparing','salle','Léa','high',null, now() - interval '4 min'),
  ('T-07','Table 7',2,'{"Velouté de panais","Risotto champignons"}',58,'pending','salle','Karim','normal',null, now() - interval '1 min'),
  ('CC-284','Click & Collect',1,'{"Menu du jour ×2","Tarte citron"}',39,'preparing','cc','—','normal','20:45', now() - interval '8 min'),
  ('T-03','Table 3',3,'{"Entrecôte ×2","Poulet rôti","Crème brûlée"}',127,'served','salle','Léa','normal',null, now() - interval '2 min'),
  ('LV-912','Livraison · Deliveroo',1,'{"Burger Sévère","Frites maison"}',24,'pending','delivery','—','high',null, now() - interval '30 sec'),
  ('T-15','Table 15',2,'{"Plateau fruits de mer"}',89,'preparing','salle','Ines','normal',null, now() - interval '12 min'),
  ('T-09','Table 9',6,'{"Menu dégustation ×6"}',468,'preparing','salle','Karim','high',null, now() - interval '18 min'),
  ('T-02','Table 2',2,'{"Magret de canard","Soupe de poisson"}',72,'cancelled','salle','Léa','normal',null, now() - interval '6 min')
on conflict (display_id) do nothing;

-- Réservations
insert into public.reservations (reservation_date, reservation_time, name, covers, table_label, status, note) values
  (current_date,'19:00','Mme Laurent',2,'T4','seated','Anniversaire'),
  (current_date,'19:15','M. Alvarez',4,'T12','seated',''),
  (current_date,'19:30','Famille Cohen',5,'T9','seated','1 enfant'),
  (current_date,'19:45','M. Nakamura',2,'T7','confirmed','Allergie arachide'),
  (current_date,'20:00','Mme Dubois',3,'T15','confirmed','Végétarien'),
  (current_date,'20:00','Groupe Renault',8,'T20','confirmed','Repas d''affaires'),
  (current_date,'20:15','M. Bianchi',2,'T5','confirmed',''),
  (current_date,'20:30','Mme Okafor',4,'T18','confirmed','Proche fenêtre'),
  (current_date,'20:45','M. Traoré',2,'T3','confirmed',''),
  (current_date,'21:00','Mme Weiss',3,'T11','confirmed',''),
  (current_date,'21:15','M. Peretti',2,'T6','noshow','No-show hier')
on conflict do nothing;

-- Menu
insert into public.menu_items (name, category, sold, stock, margin, trend) values
  ('Entrecôte grillée, sauce béarnaise','Plat',38,'ok',68,12),
  ('Tartare de bœuf au couteau','Entrée',31,'ok',72,8),
  ('Sole meunière','Plat',24,'low',61,-4),
  ('Burger Sévère','Plat',22,'ok',74,18),
  ('Crème brûlée à la fève tonka','Dessert',41,'ok',81,22),
  ('Plateau de fruits de mer','Plat',9,'out',54,0),
  ('Velouté de panais, huile de noisette','Entrée',18,'ok',77,6)
on conflict do nothing;

-- Sources avis
insert into public.review_sources (source, rating, count, delta, scale) values
  ('Google',4.6,1284,0.1,5),
  ('TripAdvisor',4.4,872,0.0,5),
  ('TheFork',9.2,451,0.3,10)
on conflict (source) do update set
  rating = excluded.rating,
  count = excluded.count,
  delta = excluded.delta,
  scale = excluded.scale;

-- Avis
insert into public.reviews (source, author, rating, scale, time_label, text, replied, created_at) values
  ('Google','Camille R.',5,5,'il y a 2h','Service impeccable, la sole est un régal. On reviendra pour l''anniversaire de maman.', false, now() - interval '2 hours'),
  ('TheFork','Marco P.',4,5,'il y a 5h','Cadre chaleureux, cuisine maîtrisée. Un poil bruyant à 21h mais c''est le charme d''une vraie brasserie.', true, now() - interval '5 hours'),
  ('TripAdvisor','Sophie L.',2,5,'hier','Attente longue à l''entrée malgré la réservation. Le tartare manquait de caractère ce soir-là.', false, now() - interval '1 day'),
  ('Google','Jean-Marc V.',5,5,'hier','Entrecôte parfaite, béarnaise divine. Karim aux petits soins.', true, now() - interval '1 day'),
  ('TheFork','Chloé D.',5,5,'il y a 2 j','Plateau de fruits de mer incroyable, accueil charmant. Le menu du chef surprend à chaque plat.', true, now() - interval '2 days'),
  ('Google','Antoine B.',3,5,'il y a 3 j','Cuisine correcte mais addition un peu salée pour ce qui est proposé. Le dessert sauve le repas.', false, now() - interval '3 days'),
  ('TripAdvisor','Elena M.',4,5,'il y a 4 j','Très bon moment, le risotto aux champignons était remarquable. Petit bémol sur le service un peu lent en début de soirée.', true, now() - interval '4 days'),
  ('Google','Philippe T.',1,5,'il y a 5 j','Déception complète. Plat froid, serveur pressé, réservation oubliée à l''arrivée. Je ne reviendrai pas.', false, now() - interval '5 days'),
  ('TheFork','Sarah K.',5,5,'il y a 6 j','Parfait pour un dîner d''affaires. Cadre sobre, cuisine inventive, sommelier de bon conseil.', true, now() - interval '6 days'),
  ('Google','Thomas L.',4,5,'la semaine dernière','Très bonne brasserie, carte bien pensée. La crème brûlée à la fève tonka est à tomber.', true, now() - interval '8 days')
on conflict do nothing;

-- Équipe
insert into public.team_members (name, role, status, avatar, hours, start_at, end_at, kind, break_start, break_end) values
  ('Léa Moreau','Cheffe de rang','service','LM','17:00–00:00',17,24,'service',null,null),
  ('Karim Bensaïd','Chef de rang','service','KB','17:00–00:00',17,24,'service',19,19.5),
  ('Ines Nguyen','Runner','service','IN','18:00–23:00',18,23,'service',null,null),
  ('Théo Laurent','Sous-chef','service','TL','15:00–00:00',15,24,'kitchen',17,18),
  ('Marta Silva','Commis','break','MS','16:00–23:00',16,23,'kitchen',19.5,20.25),
  ('Yann Gauthier','Bar','service','YG','18:00–02:00',18,26,'bar',null,null),
  ('Sofia Rossi','Accueil','late','SR','18:30→',18.75,24,'late',null,null)
on conflict do nothing;

-- Alertes
insert into public.alerts (type, text, level, created_at) values
  ('stock','Sole en rupture dans ~45 min au rythme actuel','warn', now() - interval '2 min'),
  ('rh','Sofia en retard de 15 min — accueil non tenu','high', now() - interval '9 min'),
  ('review','Nouvel avis 2★ sur TripAdvisor à traiter','warn', now() - interval '16 min'),
  ('resa','Table 20 — groupe de 8, prévenir la cuisine à 19:45','info', now() - interval '23 min')
on conflict do nothing;

-- Menu numérique
insert into public.digital_menu_config (url, published, scans_today, scans_week, scans_delta, avg_time, conversion, languages, theme, categories) values
  ('menu.maison-severe.fr', true, 127, 842, 18.4, '3 min 24', 62, '{FR,EN,IT}', 'dark',
   '[
      {"id":"entrees","name":"Entrées","items":[
        {"name":"Tartare de bœuf au couteau","price":18,"description":"Câpres, échalote, jaune d''œuf bio","tag":"signature"},
        {"name":"Velouté de panais, huile de noisette","price":14,"description":"Panais de plein champ, crème légère"},
        {"name":"Burrata des Pouilles, tomates anciennes","price":16,"description":"Basilic, huile d''olive Ligurie"}
      ]},
      {"id":"plats","name":"Plats","items":[
        {"name":"Entrecôte grillée, sauce béarnaise","price":32,"description":"Pommes grenaille, salade d''herbes","tag":"signature"},
        {"name":"Sole meunière","price":36,"description":"Beurre noisette, citron confit","tag":"limité"},
        {"name":"Burger Sévère","price":22,"description":"Bœuf Black Angus, cheddar affiné, oignons confits"},
        {"name":"Risotto champignons & truffe","price":28,"description":"Carnaroli, parmesan 24 mois"},
        {"name":"Plateau fruits de mer (2 pers.)","price":68,"description":"Huîtres, bulots, crevettes, tourteau","tag":"rupture"}
      ]},
      {"id":"desserts","name":"Desserts","items":[
        {"name":"Crème brûlée à la fève tonka","price":9,"description":"Vanille Bourbon, sucre Muscovado","tag":"signature"},
        {"name":"Tarte au citron meringuée","price":9,"description":"Pâte sablée, citron de Menton"},
        {"name":"Moelleux chocolat, glace noisette","price":10,"description":"Chocolat 70%, piémont"}
      ]}
   ]'::jsonb)
on conflict do nothing;

-- Fidélité
insert into public.loyalty_customers (name, avatar, email, tier, points, visits, spent, last_visit, favorite) values
  ('Camille Rousseau','CR','camille.r@mail.com','platine',4820,42,3840,'Hier','Entrecôte béarnaise'),
  ('Jean-Marc Vidal','JV','jm.vidal@mail.com','gold',2140,18,1720,'Il y a 3 j','Plateau fruits de mer'),
  ('Sophie Laurent','SL','sophie.l@mail.com','silver',890,9,620,'Il y a 1 sem.','Sole meunière'),
  ('Marco Peretti','MP','m.peretti@mail.com','gold',1680,14,1240,'Hier','Burger Sévère'),
  ('Chloé Durand','CD','chloe.d@mail.com','platine',5410,51,4210,'Aujourd''hui','Menu dégustation'),
  ('Antoine Bernard','AB','a.bernard@mail.com','bronze',320,4,280,'Il y a 2 sem.','Tartare de bœuf'),
  ('Elena Martinez','EM','elena.m@mail.com','silver',1120,11,840,'Il y a 4 j','Risotto champignons'),
  ('Philippe Toussaint','PT','p.toussaint@mail.com','gold',1920,16,1540,'Il y a 5 j','Crème brûlée')
on conflict (email) do nothing;

insert into public.loyalty_rewards (name, cost, description, claimed, active) values
  ('Apéritif offert',200,'Coupe de champagne ou cocktail signature',118,true),
  ('Dessert maison offert',350,'Au choix dans la sélection du chef',87,true),
  ('-15% sur l''addition',500,'Valable en semaine hors boissons',42,true),
  ('Menu dégustation · duo',1500,'Menu 5 temps pour deux personnes',19,true),
  ('Soirée privatisée',4000,'Salle à l''étage jusqu''à 12 couverts',3,true)
on conflict do nothing;

-- KPI du jour
insert into public.kpis_daily (snapshot_date, revenue_today, revenue_today_delta, revenue_week, revenue_week_delta, revenue_month, revenue_month_delta, covers, covers_delta, covers_goal, avg_ticket, avg_ticket_delta, occupancy, occupancy_delta, tables_occupied, tables_total)
values (current_date, 4287, 12.4, 26840, 8.1, 108420, -2.3, 142, 9.2, 160, 42.6, 3.1, 78, 14, 22, 28)
on conflict (snapshot_date) do update set
  revenue_today = excluded.revenue_today,
  revenue_today_delta = excluded.revenue_today_delta,
  revenue_week = excluded.revenue_week,
  revenue_week_delta = excluded.revenue_week_delta,
  revenue_month = excluded.revenue_month,
  revenue_month_delta = excluded.revenue_month_delta,
  covers = excluded.covers,
  covers_delta = excluded.covers_delta,
  covers_goal = excluded.covers_goal,
  avg_ticket = excluded.avg_ticket,
  avg_ticket_delta = excluded.avg_ticket_delta,
  occupancy = excluded.occupancy,
  occupancy_delta = excluded.occupancy_delta,
  tables_occupied = excluded.tables_occupied,
  tables_total = excluded.tables_total;

-- =============================================================
-- ROW LEVEL SECURITY
-- -------------------------------------------------------------
-- Règle générale :
--   - Menu numérique publié et review_sources : lecture publique
--   - Tout le reste : lecture réservée aux utilisateurs authentifiés
--   - Écriture : réservée à 'owner' et 'manager' (custom claim "role")
-- =============================================================

alter table public.orders              enable row level security;
alter table public.reservations        enable row level security;
alter table public.menu_items          enable row level security;
alter table public.reviews             enable row level security;
alter table public.review_sources      enable row level security;
alter table public.team_members        enable row level security;
alter table public.alerts              enable row level security;
alter table public.digital_menu_config enable row level security;
alter table public.loyalty_customers   enable row level security;
alter table public.loyalty_rewards     enable row level security;
alter table public.kpis_daily          enable row level security;

-- Lecture authentifiée / écriture manager+
do $$
declare t text;
begin
  foreach t in array array[
    'orders','reservations','menu_items','reviews','team_members',
    'alerts','loyalty_customers','loyalty_rewards','kpis_daily'
  ] loop
    execute format('drop policy if exists %I_staff_read on public.%I', t, t);
    execute format('drop policy if exists %I_manager_write on public.%I', t, t);
    execute format('create policy %I_staff_read on public.%I for select using (auth.uid() is not null)', t, t);
    execute format(
      'create policy %I_manager_write on public.%I for all using (public.current_app_role() in (''owner'',''manager'')) with check (public.current_app_role() in (''owner'',''manager''))',
      t, t
    );
  end loop;
end $$;

-- Menu numérique & sources d'avis : lecture publique, écriture manager+
drop policy if exists digital_menu_public_read on public.digital_menu_config;
create policy digital_menu_public_read on public.digital_menu_config
  for select using (published = true);

drop policy if exists digital_menu_staff_read on public.digital_menu_config;
create policy digital_menu_staff_read on public.digital_menu_config
  for select using (auth.uid() is not null);

drop policy if exists digital_menu_manager_write on public.digital_menu_config;
create policy digital_menu_manager_write on public.digital_menu_config
  for all using (public.current_app_role() in ('owner','manager'))
  with check (public.current_app_role() in ('owner','manager'));

drop policy if exists review_sources_public_read on public.review_sources;
create policy review_sources_public_read on public.review_sources
  for select using (true);

drop policy if exists review_sources_manager_write on public.review_sources;
create policy review_sources_manager_write on public.review_sources
  for all using (public.current_app_role() in ('owner','manager'))
  with check (public.current_app_role() in ('owner','manager'));

-- =============================================================
-- Fin du script
-- =============================================================
