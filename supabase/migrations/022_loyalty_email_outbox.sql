-- =============================================================
-- Maison Sévère · Notifications email fidélité (transactionnelles)
-- - Table loyalty_email_outbox : queue d'emails à envoyer
-- - Triggers serveur :
--     welcome         (insert loyalty_customer avec email)
--     tier_up         (update loyalty_customer si tier monte)
--     reward_redeemed (insert loyalty_transactions type='redeem')
-- - L'edge function process-loyalty-emails draine la queue et
--   appelle Resend.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Table outbox
-- -------------------------------------------------------------
create table if not exists public.loyalty_email_outbox (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid references public.loyalty_customers(id) on delete cascade,
  to_email text not null,
  type text not null check (type in ('welcome','tier_up','reward_redeemed')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempts int not null default 0,
  last_error text,
  resend_id text,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_loyalty_outbox_pending
  on public.loyalty_email_outbox(restaurant_id, scheduled_for)
  where status = 'pending';

create index if not exists idx_loyalty_outbox_customer
  on public.loyalty_email_outbox(customer_id);

-- RLS : lecture par les staff du restaurant uniquement
alter table public.loyalty_email_outbox enable row level security;

drop policy if exists "loyalty_outbox: staff read" on public.loyalty_email_outbox;
create policy "loyalty_outbox: staff read"
  on public.loyalty_email_outbox for select
  using (restaurant_id = public.current_restaurant_id());

-- -------------------------------------------------------------
-- 2. Helper d'enqueue
-- -------------------------------------------------------------
create or replace function public.enqueue_loyalty_email(
  p_restaurant_id uuid,
  p_customer_id uuid,
  p_to_email text,
  p_type text,
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_to_email is null or p_to_email = '' then
    return null;
  end if;
  insert into public.loyalty_email_outbox (
    restaurant_id, customer_id, to_email, type, payload
  ) values (
    p_restaurant_id, p_customer_id, p_to_email, p_type, p_payload
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- -------------------------------------------------------------
-- 3. Trigger : welcome (insert loyalty_customer)
-- -------------------------------------------------------------
create or replace function public.on_loyalty_customer_welcome()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resto record;
  v_cfg public.loyalty_config%rowtype;
begin
  if new.email is null or new.email = '' then
    return new;
  end if;

  select id, name, slug into v_resto
  from public.restaurants where id = new.restaurant_id;

  select * into v_cfg from public.loyalty_config
  where restaurant_id = new.restaurant_id;

  perform public.enqueue_loyalty_email(
    new.restaurant_id,
    new.id,
    new.email,
    'welcome',
    jsonb_build_object(
      'customer_name', new.name,
      'restaurant_name', v_resto.name,
      'restaurant_slug', v_resto.slug,
      'program_name', coalesce(v_cfg.program_name, 'Programme fidélité'),
      'welcome_message', v_cfg.welcome_message,
      'points_per_euro', coalesce(v_cfg.points_per_euro, 10),
      'threshold_silver', coalesce(v_cfg.threshold_silver, 500),
      'threshold_gold', coalesce(v_cfg.threshold_gold, 1500)
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_loyalty_welcome on public.loyalty_customers;
create trigger trg_loyalty_welcome
  after insert on public.loyalty_customers
  for each row execute function public.on_loyalty_customer_welcome();

-- -------------------------------------------------------------
-- 4. Trigger : tier_up (update loyalty_customer si tier monte)
-- -------------------------------------------------------------
create or replace function public.tier_rank(t loyalty_tier)
returns int
language sql immutable as $$
  select case t
    when 'bronze' then 1
    when 'silver' then 2
    when 'gold' then 3
    when 'platine' then 4
    else 0
  end;
$$;

create or replace function public.on_loyalty_customer_tier_up()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resto record;
begin
  if new.tier is null or old.tier is null then
    return new;
  end if;
  if public.tier_rank(new.tier) <= public.tier_rank(old.tier) then
    return new;
  end if;
  if new.email is null or new.email = '' then
    return new;
  end if;

  select id, name, slug into v_resto
  from public.restaurants where id = new.restaurant_id;

  perform public.enqueue_loyalty_email(
    new.restaurant_id,
    new.id,
    new.email,
    'tier_up',
    jsonb_build_object(
      'customer_name', new.name,
      'restaurant_name', v_resto.name,
      'restaurant_slug', v_resto.slug,
      'old_tier', old.tier,
      'new_tier', new.tier,
      'points', new.points
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_loyalty_tier_up on public.loyalty_customers;
create trigger trg_loyalty_tier_up
  after update of tier on public.loyalty_customers
  for each row execute function public.on_loyalty_customer_tier_up();

-- -------------------------------------------------------------
-- 5. Trigger : reward_redeemed (insert loyalty_transactions type=redeem)
-- -------------------------------------------------------------
create or replace function public.on_loyalty_reward_redeemed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cust public.loyalty_customers%rowtype;
  v_resto record;
begin
  if new.type <> 'redeem' then
    return new;
  end if;

  select * into v_cust from public.loyalty_customers where id = new.customer_id;
  if v_cust.email is null or v_cust.email = '' then
    return new;
  end if;

  select id, name, slug into v_resto
  from public.restaurants where id = new.restaurant_id;

  perform public.enqueue_loyalty_email(
    new.restaurant_id,
    new.customer_id,
    v_cust.email,
    'reward_redeemed',
    jsonb_build_object(
      'customer_name', v_cust.name,
      'restaurant_name', v_resto.name,
      'restaurant_slug', v_resto.slug,
      'reward_label', new.description,
      'points_used', abs(new.points),
      'remaining_points', v_cust.points
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_loyalty_reward_redeemed on public.loyalty_transactions;
create trigger trg_loyalty_reward_redeemed
  after insert on public.loyalty_transactions
  for each row execute function public.on_loyalty_reward_redeemed();

-- -------------------------------------------------------------
-- 6. RPC pour drainer la queue (appelée par l'edge function)
--    Réservé au service_role : pas de grant à anon/authenticated.
--    L'edge function utilise la service key donc bypass RLS.
-- -------------------------------------------------------------
create or replace function public.claim_pending_loyalty_emails(
  p_restaurant_id uuid default null,
  p_limit int default 50
)
returns setof public.loyalty_email_outbox
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.loyalty_email_outbox
  set status = 'sending', attempts = attempts + 1
  where id in (
    select id from public.loyalty_email_outbox
    where status = 'pending'
      and scheduled_for <= now()
      and (p_restaurant_id is null or restaurant_id = p_restaurant_id)
    order by scheduled_for asc
    limit p_limit
    for update skip locked
  )
  returning *;
end;
$$;
