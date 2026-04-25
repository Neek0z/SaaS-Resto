-- =============================================================
-- Maison Sévère · Réservations publiques via QR code
-- - Ajoute le statut `pending` (en attente de validation staff)
-- - RPC publique : get_public_reservation_info(slug)
-- - RPC publique : create_public_reservation(...)
-- =============================================================

-- -------------------------------------------------------------
-- 1. Ajout du statut `pending`
-- -------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'reservation_status' and e.enumlabel = 'pending'
  ) then
    alter type public.reservation_status add value 'pending';
  end if;
end $$;

-- -------------------------------------------------------------
-- 2. RPC : infos publiques pour la page de résa
--    Retourne resto + tables disponibles (label/capacity/zone) + horaires
-- -------------------------------------------------------------
create or replace function public.get_public_reservation_info(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with resto as (
    select id, name, logo_url, slug, hours
    from public.restaurants
    where slug = p_slug
    limit 1
  )
  select case
    when not exists (select 1 from resto) then null
    else jsonb_build_object(
      'restaurant', (
        select jsonb_build_object(
          'id', id,
          'name', name,
          'logo_url', logo_url,
          'slug', slug,
          'hours', coalesce(hours, '{}'::jsonb)
        ) from resto
      ),
      'tables', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', t.id,
          'label', t.label,
          'capacity', t.capacity,
          'zone', t.zone
        ) order by t.display_order, t.label)
        from public.restaurant_tables t
        join resto r on r.id = t.restaurant_id
        where t.active = true
      ), '[]'::jsonb)
    )
  end
$$;

grant execute on function public.get_public_reservation_info(text) to anon, authenticated;

-- -------------------------------------------------------------
-- 3. RPC : création d'une résa depuis le QR public
--    - status = 'pending' (le staff valide ensuite côté app)
--    - source = 'qr_public'
--    - rate-limit minimal : 1 résa max par téléphone/jour/resto
-- -------------------------------------------------------------
create or replace function public.create_public_reservation(
  p_slug text,
  p_name text,
  p_phone text,
  p_email text,
  p_date date,
  p_time text,
  p_covers int,
  p_table_label text,
  p_note text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resto_id uuid;
  v_table_label text;
  v_covers int;
  v_existing int;
  v_id uuid;
begin
  -- Validation minimale
  if length(coalesce(p_name, '')) < 2 then
    raise exception 'Nom invalide.' using errcode = '22023';
  end if;
  if length(coalesce(p_phone, '')) < 6 then
    raise exception 'Téléphone invalide.' using errcode = '22023';
  end if;
  v_covers := coalesce(p_covers, 0);
  if v_covers < 1 or v_covers > 20 then
    raise exception 'Couverts invalides.' using errcode = '22023';
  end if;
  if p_date is null or p_date < current_date then
    raise exception 'Date invalide.' using errcode = '22023';
  end if;
  if p_time is null or p_time !~ '^\d{2}:\d{2}$' then
    raise exception 'Heure invalide.' using errcode = '22023';
  end if;

  -- Resto
  select id into v_resto_id
  from public.restaurants
  where slug = p_slug
  limit 1;

  if v_resto_id is null then
    raise exception 'Restaurant introuvable.' using errcode = '22023';
  end if;

  -- Anti-spam : 1 résa max par téléphone / jour / resto
  select count(*) into v_existing
  from public.reservations
  where restaurant_id = v_resto_id
    and phone = p_phone
    and reservation_date = p_date;

  if v_existing >= 1 then
    raise exception 'Vous avez déjà une réservation pour ce jour.' using errcode = '23P01';
  end if;

  -- Table : si fournie, on vérifie qu'elle existe et a la capacité.
  -- Sinon on en pioche une libre avec capacité suffisante.
  if p_table_label is not null and length(trim(p_table_label)) > 0 then
    select label into v_table_label
    from public.restaurant_tables
    where restaurant_id = v_resto_id
      and label = p_table_label
      and active = true
      and capacity >= v_covers
    limit 1;
  end if;

  if v_table_label is null then
    select label into v_table_label
    from public.restaurant_tables
    where restaurant_id = v_resto_id
      and active = true
      and capacity >= v_covers
      and label not in (
        select table_label
        from public.reservations
        where restaurant_id = v_resto_id
          and reservation_date = p_date
          and reservation_time = p_time
          and status <> 'noshow'
      )
    order by capacity asc, display_order asc
    limit 1;
  end if;

  if v_table_label is null then
    raise exception 'Aucune table disponible pour ce créneau.' using errcode = '53000';
  end if;

  -- Insert
  insert into public.reservations (
    restaurant_id, name, phone, email,
    reservation_date, reservation_time, covers,
    table_label, note, status, source
  ) values (
    v_resto_id, p_name, p_phone, nullif(p_email, ''),
    p_date, p_time, v_covers,
    v_table_label, nullif(p_note, ''), 'pending', 'qr_public'
  )
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'table_label', v_table_label,
    'status', 'pending'
  );
end;
$$;

grant execute on function public.create_public_reservation(
  text, text, text, text, date, text, int, text, text
) to anon, authenticated;
