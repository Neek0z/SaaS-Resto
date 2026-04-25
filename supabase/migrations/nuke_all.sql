-- =============================================================
-- NUKE_ALL — Vide TOUTES les données et tous les restaurants.
-- =============================================================
-- À utiliser quand tu veux repartir de zéro :
--   1. Exécute ce script dans le SQL Editor Supabase.
--   2. Va dans Authentication → Users du dashboard Supabase.
--   3. Supprime ton compte (les liens app_users sont déjà cascades).
--   4. Recrée un compte via la page d'inscription de l'app.
--      Le trigger d'onboarding recrée un restaurant vierge.
--
-- ATTENTION : ceci détruit TOUTES les données de TOUS les
-- restaurants du projet. À n'utiliser que sur un projet de dev.
-- =============================================================

truncate
  public.campaign_recipients,
  public.campaigns,
  public.customers,
  public.reviews,
  public.review_sources,
  public.orders,
  public.reservations,
  public.team_members,
  public.digital_menu_items,
  public.digital_menu_categories,
  public.digital_menu_config,
  public.menu_items,
  public.loyalty_transactions,
  public.loyalty_customers,
  public.loyalty_rewards,
  public.loyalty_config,
  public.events,
  public.alerts,
  public.kpis_daily,
  public.app_users,
  public.restaurants
restart identity cascade;

-- =============================================================
-- Vérification : tout doit être à 0
-- =============================================================
select 'restaurants'             as tbl, count(*) from public.restaurants
union all select 'app_users',             count(*) from public.app_users
union all select 'orders',                count(*) from public.orders
union all select 'reservations',          count(*) from public.reservations
union all select 'reviews',               count(*) from public.reviews
union all select 'team_members',          count(*) from public.team_members
union all select 'digital_menu_items',    count(*) from public.digital_menu_items
union all select 'digital_menu_categories',count(*) from public.digital_menu_categories
union all select 'menu_items',            count(*) from public.menu_items
union all select 'customers',             count(*) from public.customers
union all select 'campaigns',             count(*) from public.campaigns
union all select 'loyalty_customers',     count(*) from public.loyalty_customers
union all select 'events',                count(*) from public.events
union all select 'alerts',                count(*) from public.alerts
union all select 'kpis_daily',            count(*) from public.kpis_daily
order by tbl;
