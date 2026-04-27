-- =============================================================
-- AUDIT — vérifie que la base correspond aux migrations 001→019
-- À coller dans le SQL editor Supabase. Read-only, ne modifie rien.
-- Tout sort en une seule requête : trie par section pour scanner.
-- Résultat attendu : aucune ligne avec kind='MISSING' ou 'UNEXPECTED'.
-- =============================================================

with
expected_tables(name) as (
  values
    ('alerts'),('app_users'),('campaign_recipients'),('campaigns'),
    ('customers'),('digital_menu_categories'),('digital_menu_config'),
    ('digital_menu_items'),('events'),('kpis_daily'),('loyalty_config'),
    ('loyalty_customers'),('loyalty_rewards'),('loyalty_transactions'),
    ('menu_items'),('orders'),('reservations'),('restaurant_tables'),
    ('restaurants'),('review_sources'),('reviews'),('team_members'),
    ('team_shifts')
),
actual_tables as (
  select table_name as name
  from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE'
),
expected_enums(name) as (
  values
    ('alert_level'),('app_role'),('campaign_status'),('campaign_type'),
    ('customer_source'),('event_applies_to'),('event_discount_type'),
    ('event_type'),('loyalty_tier'),('order_channel'),('order_priority'),
    ('order_status'),('plan_tier'),('recipient_status'),
    ('reservation_status'),('review_source'),('stock_level'),
    ('table_zone'),('team_kind'),('team_status')
),
actual_enums as (
  select t.typname as name
  from pg_type t
  join pg_namespace n on n.oid = t.typnamespace
  where t.typtype = 'e' and n.nspname = 'public'
),
expected_funcs(name) as (
  values
    ('create_public_loyalty_signup'),('create_public_order'),
    ('create_public_reservation'),('current_app_role'),
    ('current_restaurant_id'),('current_user_role'),
    ('get_public_menu'),('get_public_reservation_info'),
    ('handle_new_user'),('has_role_at_least'),('is_staff'),
    ('orders_employee_status_only'),('role_rank'),('slugify'),
    ('touch_updated_at')
),
actual_funcs as (
  select distinct p.proname as name
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
)

-- 1) Tables manquantes
select '1.tables' as section, 'MISSING' as kind, e.name, '' as detail
from expected_tables e left join actual_tables a using (name)
where a.name is null

union all
-- 2) Tables inattendues (= résidus de l'autre projet)
select '1.tables', 'UNEXPECTED', a.name, ''
from actual_tables a left join expected_tables e using (name)
where e.name is null

union all
-- 3) Enums manquants
select '2.enums', 'MISSING', e.name, ''
from expected_enums e left join actual_enums a using (name)
where a.name is null

union all
-- 4) Enums inattendus
select '2.enums', 'UNEXPECTED', a.name, ''
from actual_enums a left join expected_enums e using (name)
where e.name is null

union all
-- 5) Fonctions manquantes
select '3.functions', 'MISSING', e.name, ''
from expected_funcs e left join actual_funcs a using (name)
where a.name is null

union all
-- 6) Fonctions inattendues
select '3.functions', 'UNEXPECTED', a.name, ''
from actual_funcs a left join expected_funcs e using (name)
where e.name is null

union all
-- 7) Tables sans RLS activée
select '4.rls_off', 'CHECK', c.relname,
       'rls_enabled=false' as detail
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = false

union all
-- 8) Tables tenant sans aucune policy
select '5.no_policy', 'CHECK', t.tablename, 'aucune policy'
from (
  select tablename
  from pg_tables
  where schemaname = 'public'
  except
  select tablename from pg_policies where schemaname = 'public'
) t

order by section, kind, name;
