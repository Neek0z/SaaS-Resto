-- =============================================================
-- Maison Sévère · Menu persistant
-- Tables normalisées digital_menu_categories + digital_menu_items
-- Storage bucket 'menu-photos' (public en lecture)
-- =============================================================

-- -------------------------------------------------------------
-- Catégories
-- -------------------------------------------------------------
create table if not exists public.digital_menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  position int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_cat_restaurant on public.digital_menu_categories(restaurant_id);
create index if not exists idx_cat_position   on public.digital_menu_categories(restaurant_id, position);

-- -------------------------------------------------------------
-- Plats
-- -------------------------------------------------------------
create table if not exists public.digital_menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.digital_menu_categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  photo_url text,
  available boolean not null default true,
  tags text[] not null default '{}',
  allergenes text[] not null default '{}',
  badge text,
  tva_rate numeric(4,2) not null default 10.00,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_item_restaurant on public.digital_menu_items(restaurant_id);
create index if not exists idx_item_category   on public.digital_menu_items(category_id, position);
create index if not exists idx_item_available  on public.digital_menu_items(available);

-- -------------------------------------------------------------
-- Triggers updated_at
-- -------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_cat_touch on public.digital_menu_categories;
create trigger trg_cat_touch before update on public.digital_menu_categories
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_item_touch on public.digital_menu_items;
create trigger trg_item_touch before update on public.digital_menu_items
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- RLS : restreint au restaurant courant
-- -------------------------------------------------------------
alter table public.digital_menu_categories enable row level security;
alter table public.digital_menu_items      enable row level security;

drop policy if exists "menu_cat: read"   on public.digital_menu_categories;
drop policy if exists "menu_cat: write"  on public.digital_menu_categories;
drop policy if exists "menu_item: read"  on public.digital_menu_items;
drop policy if exists "menu_item: write" on public.digital_menu_items;

create policy "menu_cat: read"
  on public.digital_menu_categories for select
  using (restaurant_id = public.current_restaurant_id());

create policy "menu_cat: write"
  on public.digital_menu_categories for all
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());

create policy "menu_item: read"
  on public.digital_menu_items for select
  using (restaurant_id = public.current_restaurant_id());

create policy "menu_item: write"
  on public.digital_menu_items for all
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());

-- -------------------------------------------------------------
-- Storage : bucket 'menu-photos' (public en lecture)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-photos',
  'menu-photos',
  true,
  5242880, -- 5 Mo
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Policies (lecture publique, écriture authentifiée)
drop policy if exists "menu-photos public read"   on storage.objects;
drop policy if exists "menu-photos auth insert"   on storage.objects;
drop policy if exists "menu-photos auth update"   on storage.objects;
drop policy if exists "menu-photos auth delete"   on storage.objects;

create policy "menu-photos public read"
  on storage.objects for select
  using (bucket_id = 'menu-photos');

create policy "menu-photos auth insert"
  on storage.objects for insert
  with check (bucket_id = 'menu-photos' and auth.uid() is not null);

create policy "menu-photos auth update"
  on storage.objects for update
  using (bucket_id = 'menu-photos' and auth.uid() is not null);

create policy "menu-photos auth delete"
  on storage.objects for delete
  using (bucket_id = 'menu-photos' and auth.uid() is not null);
