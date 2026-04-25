-- =============================================================
-- Maison Sévère · Menu numérique public
-- - slug + logo_url sur restaurants
-- - bucket 'restaurant-assets' pour logos & assets de marque
-- - fonction get_public_menu(slug) pour lecture anonyme contrôlée
-- =============================================================

-- -------------------------------------------------------------
-- Colonnes restaurants
-- -------------------------------------------------------------
alter table public.restaurants
  add column if not exists slug text,
  add column if not exists logo_url text;

-- Slugify minimal (ASCII lowercase, espaces & non-alphanum -> tiret)
create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'),
      '-+', '-', 'g'
    )
  )
$$;

-- -------------------------------------------------------------
-- Backfill : génère un slug pour les restos existants sans slug
-- (suffixe court basé sur l'id si collision)
-- -------------------------------------------------------------
do $$
declare
  r record;
  base text;
  candidate text;
  attempt int;
begin
  for r in select id, name from public.restaurants where slug is null or slug = '' loop
    base := nullif(public.slugify(r.name), '');
    if base is null then base := 'resto'; end if;
    candidate := base;
    attempt := 0;
    while exists (select 1 from public.restaurants where slug = candidate) loop
      attempt := attempt + 1;
      candidate := base || '-' || substr(replace(r.id::text, '-', ''), 1, 4 + attempt);
    end loop;
    update public.restaurants set slug = candidate where id = r.id;
  end loop;
end $$;

-- Une fois backfilled, on peut imposer NOT NULL + UNIQUE.
alter table public.restaurants
  alter column slug set not null;

create unique index if not exists ux_restaurants_slug on public.restaurants(slug);

-- -------------------------------------------------------------
-- handle_new_user : génère le slug à la création du resto
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invited_resto uuid;
  invited_role  app_role;
  new_resto_id  uuid;
  resto_name    text;
  base_slug     text;
  candidate     text;
  attempt       int := 0;
begin
  invited_resto := (new.raw_user_meta_data ->> 'restaurant_id')::uuid;
  invited_role  := nullif(new.raw_user_meta_data ->> 'invited_role', '')::app_role;

  if invited_resto is not null then
    insert into public.app_users (id, restaurant_id, email, role)
    values (new.id, invited_resto, new.email, coalesce(invited_role, 'employee'))
    on conflict (id) do update
      set restaurant_id = excluded.restaurant_id,
          email         = excluded.email,
          role          = excluded.role;
  else
    resto_name := coalesce(
      nullif(new.raw_user_meta_data ->> 'restaurant_name', ''),
      'Mon restaurant'
    );

    base_slug := nullif(public.slugify(resto_name), '');
    if base_slug is null then base_slug := 'resto'; end if;
    candidate := base_slug;
    while exists (select 1 from public.restaurants where slug = candidate) loop
      attempt := attempt + 1;
      candidate := base_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4 + attempt);
    end loop;

    insert into public.restaurants (name, plan, slug)
    values (resto_name, 'essentiel', candidate)
    returning id into new_resto_id;

    insert into public.app_users (id, restaurant_id, email, role)
    values (new.id, new_resto_id, new.email, 'owner');
  end if;

  return new;
end;
$$;

-- -------------------------------------------------------------
-- Fonction publique : retourne le menu d'un resto par slug
-- security definer pour bypasser les RLS, expose uniquement les
-- colonnes safe (pas de plan, pas de billing, pas d'email).
-- -------------------------------------------------------------
create or replace function public.get_public_menu(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with resto as (
    select id, name, logo_url, slug
    from public.restaurants
    where slug = p_slug
    limit 1
  ),
  cats as (
    select c.id, c.name, c.position
    from public.digital_menu_categories c
    join resto r on r.id = c.restaurant_id
    where c.active = true
    order by c.position
  ),
  items as (
    select
      i.id, i.category_id, i.name, i.description, i.price, i.photo_url,
      i.available, i.tags, i.allergenes, i.badge, i.position
    from public.digital_menu_items i
    join resto r on r.id = i.restaurant_id
    order by i.position
  )
  select case
    when not exists (select 1 from resto) then null
    else jsonb_build_object(
      'restaurant', (
        select jsonb_build_object(
          'id', id, 'name', name, 'logo_url', logo_url, 'slug', slug
        ) from resto
      ),
      'categories', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'position', c.position,
          'items', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', i.id,
              'name', i.name,
              'description', i.description,
              'price', i.price,
              'photo_url', i.photo_url,
              'available', i.available,
              'tags', i.tags,
              'allergenes', i.allergenes,
              'badge', i.badge,
              'position', i.position
            ) order by i.position)
            from items i
            where i.category_id = c.id
          ), '[]'::jsonb)
        ) order by c.position)
        from cats c
      ), '[]'::jsonb)
    )
  end
$$;

grant execute on function public.get_public_menu(text) to anon, authenticated;

-- -------------------------------------------------------------
-- Storage : bucket 'restaurant-assets' (public en lecture, écriture auth)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-assets',
  'restaurant-assets',
  true,
  3145728, -- 3 Mo
  array['image/jpeg','image/png','image/webp','image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "restaurant-assets public read"   on storage.objects;
drop policy if exists "restaurant-assets auth insert"   on storage.objects;
drop policy if exists "restaurant-assets auth update"   on storage.objects;
drop policy if exists "restaurant-assets auth delete"   on storage.objects;

create policy "restaurant-assets public read"
  on storage.objects for select
  using (bucket_id = 'restaurant-assets');

create policy "restaurant-assets auth insert"
  on storage.objects for insert
  with check (bucket_id = 'restaurant-assets' and auth.uid() is not null);

create policy "restaurant-assets auth update"
  on storage.objects for update
  using (bucket_id = 'restaurant-assets' and auth.uid() is not null);

create policy "restaurant-assets auth delete"
  on storage.objects for delete
  using (bucket_id = 'restaurant-assets' and auth.uid() is not null);
