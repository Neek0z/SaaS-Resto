-- =============================================================
-- Maison Sévère · Permissions par rôle (paramétrables par owner)
-- Stocke uniquement les deltas vs baseline (défini en code).
-- Forme : { "manager": { "nav.equipe": false, "action.edit_menu": true } }
-- =============================================================

alter table public.restaurants
  add column if not exists role_permissions jsonb not null default '{}'::jsonb;

-- -------------------------------------------------------------
-- RLS : seul un owner+ peut modifier role_permissions
-- (la policy update existante sur restaurants gère déjà ça via
--  current_user_role >= owner si on a appliqué 007. On la rejoue
--  ici de façon idempotente au cas où.)
-- -------------------------------------------------------------
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'restaurants'
      and policyname = 'restaurants: owner met à jour'
  ) then
    create policy "restaurants: owner met à jour"
      on public.restaurants for update
      using (
        id = public.current_restaurant_id()
        and public.has_role_at_least('owner')
      )
      with check (
        id = public.current_restaurant_id()
        and public.has_role_at_least('owner')
      );
  end if;
end $$;
