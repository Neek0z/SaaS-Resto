-- =============================================================
-- Maison Sévère · Settings persistés
-- - Coordonnées (type, adresse, téléphone, email, SIRET, TVA, description)
-- - Horaires d'ouverture (jsonb : 7 jours × déjeuner/dîner)
-- - Moyens de paiement & taux (jsonb : toggles + service/TVA)
-- =============================================================

alter table public.restaurants
  add column if not exists business_type   text,
  add column if not exists address_line    text,
  add column if not exists address_zip     text,
  add column if not exists address_city    text,
  add column if not exists phone           text,
  add column if not exists contact_email   text,
  add column if not exists siret           text,
  add column if not exists vat_number      text,
  add column if not exists description     text,
  add column if not exists hours           jsonb not null default '{}'::jsonb,
  add column if not exists payment         jsonb not null default '{}'::jsonb;

-- -------------------------------------------------------------
-- updated_at touch trigger (créé en 010)
-- -------------------------------------------------------------
drop trigger if exists trg_restaurants_updated_at on public.restaurants;
create trigger trg_restaurants_updated_at
  before update on public.restaurants
  for each row execute function public.touch_updated_at();
