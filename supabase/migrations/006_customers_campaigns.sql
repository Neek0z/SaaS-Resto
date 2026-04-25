-- =============================================================
-- Maison Sévère · CRM clients & Campagnes email (multi-tenant)
-- Tables : customers, campaigns, campaign_recipients
-- =============================================================

-- -------------------------------------------------------------
-- ENUMs
-- -------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'customer_source') then
    create type customer_source as enum ('manual', 'reservation', 'fidelite', 'qrcode');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'campaign_type') then
    create type campaign_type as enum ('promotion', 'evenement', 'fidelite', 'newsletter');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'campaign_status') then
    create type campaign_status as enum ('draft', 'scheduled', 'sent', 'failed');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'recipient_status') then
    create type recipient_status as enum ('pending', 'sent', 'opened', 'clicked', 'bounced', 'failed');
  end if;
end $$;

-- -------------------------------------------------------------
-- customers (CRM, distinct de loyalty_customers)
-- -------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  source customer_source not null default 'manual',
  tags text[] not null default '{}',
  visit_count int not null default 0,
  total_spent numeric(10,2) not null default 0,
  last_visit timestamptz,
  opted_in_email boolean not null default true,
  opted_in_sms boolean not null default false,
  notes text,
  loyalty_customer_id uuid references public.loyalty_customers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_restaurant on public.customers(restaurant_id);
create index if not exists idx_customers_email      on public.customers(restaurant_id, email);
create index if not exists idx_customers_source     on public.customers(restaurant_id, source);
create index if not exists idx_customers_optin      on public.customers(restaurant_id, opted_in_email);
create unique index if not exists uniq_customers_email
  on public.customers(restaurant_id, email)
  where email is not null;

drop trigger if exists trg_customers_touch on public.customers;
create trigger trg_customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- campaigns
-- -------------------------------------------------------------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  type campaign_type not null default 'newsletter',
  subject text not null,
  sender_name text,
  reply_to text,
  content jsonb not null default '{}',
  template_id text,
  segment jsonb not null default '{}',
  status campaign_status not null default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count int not null default 0,
  open_count int not null default 0,
  click_count int not null default 0,
  bounce_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaigns_restaurant on public.campaigns(restaurant_id);
create index if not exists idx_campaigns_status     on public.campaigns(restaurant_id, status);
create index if not exists idx_campaigns_sent_at    on public.campaigns(sent_at desc);

drop trigger if exists trg_campaigns_touch on public.campaigns;
create trigger trg_campaigns_touch before update on public.campaigns
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- campaign_recipients
-- -------------------------------------------------------------
create table if not exists public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  email text not null,
  status recipient_status not null default 'pending',
  error text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  resend_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_recipients_campaign on public.campaign_recipients(campaign_id);
create index if not exists idx_recipients_customer on public.campaign_recipients(customer_id);
create index if not exists idx_recipients_status   on public.campaign_recipients(campaign_id, status);

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
alter table public.customers           enable row level security;
alter table public.campaigns           enable row level security;
alter table public.campaign_recipients enable row level security;

drop policy if exists "customers: read"  on public.customers;
drop policy if exists "customers: write" on public.customers;
drop policy if exists "campaigns: read"  on public.campaigns;
drop policy if exists "campaigns: write" on public.campaigns;
drop policy if exists "recipients: read"  on public.campaign_recipients;
drop policy if exists "recipients: write" on public.campaign_recipients;

create policy "customers: read"
  on public.customers for select
  using (restaurant_id = public.current_restaurant_id());

create policy "customers: write"
  on public.customers for all
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());

create policy "campaigns: read"
  on public.campaigns for select
  using (restaurant_id = public.current_restaurant_id());

create policy "campaigns: write"
  on public.campaigns for all
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());

-- Les recipients héritent de la restriction via leur campaign.
create policy "recipients: read"
  on public.campaign_recipients for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_recipients.campaign_id
        and c.restaurant_id = public.current_restaurant_id()
    )
  );

create policy "recipients: write"
  on public.campaign_recipients for all
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_recipients.campaign_id
        and c.restaurant_id = public.current_restaurant_id()
    )
  )
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_recipients.campaign_id
        and c.restaurant_id = public.current_restaurant_id()
    )
  );
