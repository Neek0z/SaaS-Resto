-- =============================================================
-- WIPE_DEMO_DATA — Vide les données de démo pour 1 restaurant
-- =============================================================
-- ÉTAPE 1 : récupère ton id en exécutant ceci :
--   select id, name from public.restaurants;
--
-- ÉTAPE 2 : copie l'id reçu et remplace toutes les occurrences de
--   __PUT_RESTAURANT_ID_HERE__ ci-dessous (find/replace),
--   puis exécute tout le bloc.
--
-- NOTE : la table `menu_items` du seed initial n'a pas de tenant
-- (legacy). Les VRAIES tables menu utilisées par l'app sont
-- digital_menu_items / digital_menu_categories.
-- =============================================================

-- CRM : enfants avant parents (FK)
delete from public.campaign_recipients
  where campaign_id in (
    select id from public.campaigns
    where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
  );
delete from public.campaigns         where restaurant_id = '__PUT_RESTAURANT_ID_HERE__';
delete from public.customers         where restaurant_id = '__PUT_RESTAURANT_ID_HERE__';

-- Historique métier
delete from public.reviews           where restaurant_id = '__PUT_RESTAURANT_ID_HERE__';
delete from public.orders            where restaurant_id = '__PUT_RESTAURANT_ID_HERE__';
delete from public.reservations      where restaurant_id = '__PUT_RESTAURANT_ID_HERE__';

-- Équipe
delete from public.team_members      where restaurant_id = '__PUT_RESTAURANT_ID_HERE__';

-- Vrai menu (tenant-aware) : items avant categories
delete from public.digital_menu_items      where restaurant_id = '__PUT_RESTAURANT_ID_HERE__';
delete from public.digital_menu_categories where restaurant_id = '__PUT_RESTAURANT_ID_HERE__';

-- Fidélité
delete from public.loyalty_customers where restaurant_id = '__PUT_RESTAURANT_ID_HERE__';
delete from public.loyalty_rewards   where restaurant_id = '__PUT_RESTAURANT_ID_HERE__';

-- Tables seed sans tenant : on vide tout
delete from public.digital_menu_config;
delete from public.menu_items;
delete from public.review_sources;
delete from public.alerts;
delete from public.kpis_daily;

-- =============================================================
-- Vérification (devrait afficher 0 partout)
-- =============================================================
select 'orders'                  as tbl, count(*) from public.orders                  where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'reservations',         count(*) from public.reservations            where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'reviews',              count(*) from public.reviews                 where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'team_members',         count(*) from public.team_members            where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'digital_menu_items',   count(*) from public.digital_menu_items      where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'digital_menu_categories', count(*) from public.digital_menu_categories where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'loyalty_customers',    count(*) from public.loyalty_customers       where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'loyalty_rewards',      count(*) from public.loyalty_rewards         where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'customers',            count(*) from public.customers               where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'campaigns',            count(*) from public.campaigns               where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'digital_menu_config',  count(*) from public.digital_menu_config
union all select 'menu_items (legacy)',  count(*) from public.menu_items
union all select 'review_sources',       count(*) from public.review_sources
union all select 'alerts',               count(*) from public.alerts
union all select 'kpis_daily',           count(*) from public.kpis_daily
order by tbl;
