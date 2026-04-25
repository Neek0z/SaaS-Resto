-- =============================================================
-- Maison Sévère · Reviews multi-tenant + reply
-- - Ajoute restaurant_id, reply_text, replied_at, updated_at
-- - Backfill + NOT NULL + index
-- - RLS tenant-aware (remplace policies globales 001_init)
-- - Trigger updated_at
-- =============================================================

alter table public.reviews
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade,
  add column if not exists reply_text    text,
  add column if not exists replied_at    timestamptz,
  add column if not exists updated_at    timestamptz not null default now();

-- -------------------------------------------------------------
-- Backfill : assigne les avis orphelins au premier restaurant
-- (ou supprime si aucun restaurant n'existe)
-- -------------------------------------------------------------
do $$
declare
  fallback_id uuid;
begin
  select id into fallback_id from public.restaurants order by created_at limit 1;
  if fallback_id is null then
    delete from public.reviews where restaurant_id is null;
  else
    update public.reviews
       set restaurant_id = fallback_id
     where restaurant_id is null;
  end if;
end $$;

alter table public.reviews
  alter column restaurant_id set not null;

alter table public.reviews
  alter column restaurant_id set default public.current_restaurant_id();

create index if not exists idx_reviews_restaurant_created
  on public.reviews(restaurant_id, created_at desc);

-- -------------------------------------------------------------
-- Garde la cohérence replied / replied_at
-- -------------------------------------------------------------
update public.reviews
   set replied_at = coalesce(replied_at, created_at)
 where replied = true and replied_at is null;

-- -------------------------------------------------------------
-- Trigger updated_at (touch_updated_at créé en 010)
-- -------------------------------------------------------------
drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at
  before update on public.reviews
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- RLS tenant-aware : on remplace les policies globales du 001
-- -------------------------------------------------------------
drop policy if exists reviews_staff_read    on public.reviews;
drop policy if exists reviews_manager_write on public.reviews;

create policy reviews_tenant_read on public.reviews
  for select
  using (restaurant_id = public.current_restaurant_id());

create policy reviews_tenant_insert on public.reviews
  for insert
  with check (
    restaurant_id = public.current_restaurant_id()
    and public.current_app_role() in ('owner','manager')
  );

create policy reviews_tenant_update on public.reviews
  for update
  using (restaurant_id = public.current_restaurant_id())
  with check (restaurant_id = public.current_restaurant_id());

create policy reviews_tenant_delete on public.reviews
  for delete
  using (
    restaurant_id = public.current_restaurant_id()
    and public.current_app_role() in ('owner','manager')
  );
