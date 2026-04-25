-- =============================================================
-- Maison Sévère · Inscription publique au programme fidélité
-- - RPC publique : create_public_loyalty_signup(slug, name, email, phone, opted_in)
-- - Anti-spam : 1 inscription par email/téléphone/resto
-- =============================================================

create or replace function public.create_public_loyalty_signup(
  p_slug text,
  p_name text,
  p_email text,
  p_phone text,
  p_opted_in_email boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resto_id uuid;
  v_customer_id uuid;
  v_existing_id uuid;
  v_clean_email text := nullif(trim(coalesce(p_email, '')), '');
  v_clean_phone text := nullif(trim(coalesce(p_phone, '')), '');
  v_clean_name  text := trim(coalesce(p_name, ''));
begin
  -- Validation
  if length(v_clean_name) < 2 then
    raise exception 'Le nom est obligatoire (min. 2 caractères).';
  end if;
  if v_clean_email is null and v_clean_phone is null then
    raise exception 'Email ou téléphone obligatoire.';
  end if;
  if v_clean_email is not null and v_clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Email invalide.';
  end if;

  -- Résolution du restaurant via slug
  select id into v_resto_id
  from public.restaurants
  where slug = p_slug
  limit 1;

  if v_resto_id is null then
    raise exception 'Restaurant introuvable.';
  end if;

  -- Déjà inscrit ?
  select id into v_existing_id
  from public.customers
  where restaurant_id = v_resto_id
    and (
      (v_clean_email is not null and lower(email) = lower(v_clean_email))
      or (v_clean_phone is not null and phone = v_clean_phone)
    )
  limit 1;

  if v_existing_id is not null then
    -- Met à jour les opt-ins / nom si nécessaire (ne crée pas de doublon)
    update public.customers
    set
      name = case when length(v_clean_name) >= 2 then v_clean_name else name end,
      email = coalesce(v_clean_email, email),
      phone = coalesce(v_clean_phone, phone),
      opted_in_email = greatest(opted_in_email::int, p_opted_in_email::int)::boolean,
      source = case when source = 'manual' then 'fidelite' else source end,
      updated_at = now()
    where id = v_existing_id;
    return jsonb_build_object('id', v_existing_id, 'status', 'updated');
  end if;

  insert into public.customers (
    restaurant_id, name, email, phone, source, opted_in_email, opted_in_sms
  ) values (
    v_resto_id, v_clean_name, v_clean_email, v_clean_phone,
    'fidelite', coalesce(p_opted_in_email, true), false
  )
  returning id into v_customer_id;

  return jsonb_build_object('id', v_customer_id, 'status', 'created');
end;
$$;

grant execute on function public.create_public_loyalty_signup(text, text, text, text, boolean)
  to anon, authenticated;
