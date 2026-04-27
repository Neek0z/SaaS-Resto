-- =============================================================
-- Maison Sévère · Compte client fidélité (auth Supabase OTP)
-- - Ajoute loyalty_customers.auth_user_id (FK vers auth.users)
-- - Adapte handle_new_user pour distinguer staff vs loyalty
--   (account_type = 'loyalty' → ne pas créer de restaurant)
-- - RPCs (security definer) pour le client connecté :
--     link_or_create_my_loyalty_account(slug, name, phone)
--     get_my_loyalty_account(slug)
--     redeem_my_loyalty_reward(slug, reward_id)
-- - RLS : lecture par le client de son propre dossier
-- =============================================================

-- -------------------------------------------------------------
-- 1. Colonne auth_user_id sur loyalty_customers
-- -------------------------------------------------------------
alter table public.loyalty_customers
  add column if not exists auth_user_id uuid
    references auth.users(id) on delete set null;

-- Un même compte auth ne peut être lié qu'à un seul dossier fidélité
-- par restaurant (mais peut en avoir un par restaurant différent).
create unique index if not exists uniq_loyalty_cust_auth_per_resto
  on public.loyalty_customers(restaurant_id, auth_user_id)
  where auth_user_id is not null;

-- -------------------------------------------------------------
-- 2. handle_new_user — ignore les comptes "loyalty"
--    (raw_user_meta_data.account_type = 'loyalty')
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
  account_type text;
begin
  account_type := lower(coalesce(
    new.raw_user_meta_data ->> 'account_type', 'staff'
  ));

  -- Compte client fidélité : pas de restaurant à créer.
  -- La liaison se fait à la première connexion via
  -- public.link_or_create_my_loyalty_account(slug, …).
  if account_type = 'loyalty' then
    return new;
  end if;

  -- Compte staff (owner) : flux historique inchangé.
  resto_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'restaurant_name', ''),
    'Mon restaurant'
  );

  insert into public.restaurants (name, plan)
  values (resto_name, 'essentiel')
  returning id into new_restaurant_id;

  insert into public.app_users (id, restaurant_id, email, role)
  values (new.id, new_restaurant_id, new.email, 'owner');

  insert into public.loyalty_config (restaurant_id, program_name, welcome_message)
  values (
    new_restaurant_id,
    'Club ' || resto_name,
    'Bienvenue dans notre programme fidélité !'
  );

  insert into public.loyalty_rewards (restaurant_id, name, description, points_cost) values
    (new_restaurant_id, 'Café offert',         'Un café au comptoir ou en salle.',           100),
    (new_restaurant_id, 'Dessert offert',      'Un dessert de votre choix sur la carte.',    300),
    (new_restaurant_id, '-10% sur l''addition','10% de réduction sur la note totale.',       500),
    (new_restaurant_id, 'Repas offert',        'Un menu complet pour une personne.',        1500);

  return new;
end;
$$;

-- -------------------------------------------------------------
-- 3. RPC : lier (ou créer) le dossier fidélité du client connecté
--    Appelée à la 1re visite de /fidelite/:slug/compte après OTP.
--    Logique :
--      - cherche un loyalty_customer par auth_user_id
--      - sinon par email = auth.users.email (insensible casse)
--      - sinon en crée un nouveau (points = 0)
--      - assigne auth_user_id et met à jour name/phone si fournis
-- -------------------------------------------------------------
create or replace function public.link_or_create_my_loyalty_account(
  p_slug text,
  p_name text default null,
  p_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_resto_id uuid;
  v_customer_id uuid;
  v_clean_name text := nullif(trim(coalesce(p_name, '')), '');
  v_clean_phone text := nullif(trim(coalesce(p_phone, '')), '');
begin
  if v_uid is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is null then
    raise exception 'Email du compte introuvable.';
  end if;

  select id into v_resto_id from public.restaurants where slug = p_slug limit 1;
  if v_resto_id is null then
    raise exception 'Restaurant introuvable.';
  end if;

  -- 1) Déjà lié ?
  select id into v_customer_id
  from public.loyalty_customers
  where restaurant_id = v_resto_id and auth_user_id = v_uid
  limit 1;

  -- 2) Sinon, match par email (sans rattachement préalable)
  if v_customer_id is null then
    select id into v_customer_id
    from public.loyalty_customers
    where restaurant_id = v_resto_id
      and lower(email) = lower(v_email)
      and auth_user_id is null
    limit 1;
  end if;

  -- 3) Sinon, créer
  if v_customer_id is null then
    insert into public.loyalty_customers (
      restaurant_id, name, email, phone, auth_user_id
    ) values (
      v_resto_id,
      coalesce(v_clean_name, split_part(v_email, '@', 1)),
      v_email,
      v_clean_phone,
      v_uid
    )
    returning id into v_customer_id;
  else
    -- Lie + complète les champs manquants si fournis
    update public.loyalty_customers
    set
      auth_user_id = v_uid,
      email = coalesce(email, v_email),
      name = case
        when v_clean_name is not null and (name is null or name = '' or name = split_part(v_email, '@', 1))
          then v_clean_name
        else name
      end,
      phone = coalesce(phone, v_clean_phone)
    where id = v_customer_id;
  end if;

  return jsonb_build_object('id', v_customer_id, 'restaurant_id', v_resto_id);
end;
$$;

grant execute on function public.link_or_create_my_loyalty_account(text, text, text)
  to authenticated;

-- -------------------------------------------------------------
-- 4. RPC : récupère mon dossier fidélité (client + tx + rewards)
-- -------------------------------------------------------------
create or replace function public.get_my_loyalty_account(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_resto record;
  v_cust public.loyalty_customers%rowtype;
  v_cfg public.loyalty_config%rowtype;
  v_tx jsonb;
  v_rewards jsonb;
begin
  if v_uid is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  select id, name, slug, logo_url
  into v_resto
  from public.restaurants
  where slug = p_slug
  limit 1;

  if v_resto.id is null then
    raise exception 'Restaurant introuvable.';
  end if;

  select * into v_cust
  from public.loyalty_customers
  where restaurant_id = v_resto.id and auth_user_id = v_uid
  limit 1;

  if v_cust.id is null then
    return jsonb_build_object(
      'restaurant', jsonb_build_object(
        'id', v_resto.id,
        'name', v_resto.name,
        'slug', v_resto.slug,
        'logo_url', v_resto.logo_url
      ),
      'customer', null,
      'transactions', '[]'::jsonb,
      'rewards', '[]'::jsonb,
      'config', null
    );
  end if;

  select * into v_cfg
  from public.loyalty_config
  where restaurant_id = v_resto.id;

  select coalesce(jsonb_agg(t order by t.created_at desc), '[]'::jsonb)
  into v_tx
  from (
    select id, type, points, description, order_id, created_at
    from public.loyalty_transactions
    where customer_id = v_cust.id
    order by created_at desc
    limit 50
  ) t;

  select coalesce(jsonb_agg(r order by r.points_cost asc), '[]'::jsonb)
  into v_rewards
  from (
    select id, name, description, points_cost
    from public.loyalty_rewards
    where restaurant_id = v_resto.id and active = true
    order by points_cost asc
  ) r;

  return jsonb_build_object(
    'restaurant', jsonb_build_object(
      'id', v_resto.id,
      'name', v_resto.name,
      'slug', v_resto.slug,
      'logo_url', v_resto.logo_url
    ),
    'customer', jsonb_build_object(
      'id', v_cust.id,
      'name', v_cust.name,
      'email', v_cust.email,
      'phone', v_cust.phone,
      'points', v_cust.points,
      'total_spent', v_cust.total_spent,
      'visit_count', v_cust.visit_count,
      'last_visit', v_cust.last_visit,
      'tier', v_cust.tier,
      'created_at', v_cust.created_at
    ),
    'transactions', v_tx,
    'rewards', v_rewards,
    'config', case when v_cfg.restaurant_id is null then null else jsonb_build_object(
      'program_name', v_cfg.program_name,
      'welcome_message', v_cfg.welcome_message,
      'points_per_euro', v_cfg.points_per_euro,
      'threshold_silver', v_cfg.threshold_silver,
      'threshold_gold', v_cfg.threshold_gold
    ) end
  );
end;
$$;

grant execute on function public.get_my_loyalty_account(text) to authenticated;

-- -------------------------------------------------------------
-- 5. RPC : réclamer une récompense
--    - Vérifie ownership et solde
--    - Insère une transaction 'redeem' (points négatifs)
--    - Décrémente loyalty_customers.points et incrémente
--      loyalty_rewards.claimed_count
--    - Recalcule le tier
-- -------------------------------------------------------------
create or replace function public.redeem_my_loyalty_reward(
  p_slug text,
  p_reward_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_resto_id uuid;
  v_cust public.loyalty_customers%rowtype;
  v_reward public.loyalty_rewards%rowtype;
  v_cfg public.loyalty_config%rowtype;
  v_new_points int;
  v_new_tier loyalty_tier;
  v_tx_id uuid;
begin
  if v_uid is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  select id into v_resto_id from public.restaurants where slug = p_slug limit 1;
  if v_resto_id is null then
    raise exception 'Restaurant introuvable.';
  end if;

  select * into v_cust
  from public.loyalty_customers
  where restaurant_id = v_resto_id and auth_user_id = v_uid
  for update;

  if v_cust.id is null then
    raise exception 'Compte fidélité non lié pour ce restaurant.';
  end if;

  select * into v_reward
  from public.loyalty_rewards
  where id = p_reward_id and restaurant_id = v_resto_id and active = true;

  if v_reward.id is null then
    raise exception 'Récompense introuvable ou désactivée.';
  end if;

  if v_cust.points < v_reward.points_cost then
    raise exception 'Solde de points insuffisant (% < %).',
      v_cust.points, v_reward.points_cost;
  end if;

  select * into v_cfg from public.loyalty_config where restaurant_id = v_resto_id;

  v_new_points := v_cust.points - v_reward.points_cost;
  v_new_tier := public.loyalty_compute_tier(
    v_new_points,
    coalesce(v_cfg.threshold_silver, 500),
    coalesce(v_cfg.threshold_gold, 1500)
  );

  insert into public.loyalty_transactions (
    restaurant_id, customer_id, type, points, description, order_id
  ) values (
    v_resto_id, v_cust.id, 'redeem', -v_reward.points_cost,
    'Récompense : ' || v_reward.name, null
  )
  returning id into v_tx_id;

  update public.loyalty_customers
    set points = v_new_points, tier = v_new_tier
    where id = v_cust.id;

  update public.loyalty_rewards
    set claimed_count = claimed_count + 1
    where id = v_reward.id;

  return jsonb_build_object(
    'transaction_id', v_tx_id,
    'new_points', v_new_points,
    'new_tier', v_new_tier
  );
end;
$$;

grant execute on function public.redeem_my_loyalty_reward(text, uuid) to authenticated;

-- -------------------------------------------------------------
-- 6. RLS : lecture par le client de son propre dossier
--    (les RPC ci-dessus utilisent security definer donc bypassent
--     déjà RLS, mais on permet aussi la lecture directe au cas où
--     la page voudrait s'abonner aux changements en realtime.)
-- -------------------------------------------------------------
drop policy if exists "loyalty_cust: client lit le sien" on public.loyalty_customers;
create policy "loyalty_cust: client lit le sien"
  on public.loyalty_customers for select
  using (auth_user_id = auth.uid());

drop policy if exists "loyalty_tx: client lit les siennes" on public.loyalty_transactions;
create policy "loyalty_tx: client lit les siennes"
  on public.loyalty_transactions for select
  using (
    exists (
      select 1 from public.loyalty_customers c
      where c.id = customer_id and c.auth_user_id = auth.uid()
    )
  );
