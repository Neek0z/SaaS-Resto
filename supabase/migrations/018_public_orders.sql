-- =============================================================
-- Maison Sévère · Commandes en ligne via QR public
-- - RPC publique : create_public_order(slug, table_label, items, name, note)
-- - Validation server-side : table active, items disponibles
-- - Total recalculé côté serveur (jamais le client)
-- - status='pending', channel='salle', source dans la note
-- =============================================================

-- -------------------------------------------------------------
-- RPC : création d'une commande depuis le QR public
-- p_items : jsonb array of { item_id: uuid, quantity: int }
-- -------------------------------------------------------------
create or replace function public.create_public_order(
  p_slug text,
  p_table_label text,
  p_items jsonb,
  p_name text,
  p_note text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resto_id uuid;
  v_table_active boolean;
  v_total numeric(10,2) := 0;
  v_lines text[] := '{}';
  v_display_id text;
  v_id uuid;
  v_seq int;
  v_item record;
  v_qty int;
  v_price numeric(10,2);
  v_name text;
  v_note text;
  v_count int := 0;
begin
  -- Validation slug + resto
  select id into v_resto_id
  from public.restaurants
  where slug = p_slug
  limit 1;

  if v_resto_id is null then
    raise exception 'Restaurant introuvable.' using errcode = '22023';
  end if;

  -- Validation table active
  if p_table_label is null or length(trim(p_table_label)) = 0 then
    raise exception 'Table requise.' using errcode = '22023';
  end if;

  select active into v_table_active
  from public.restaurant_tables
  where restaurant_id = v_resto_id
    and label = p_table_label
  limit 1;

  if v_table_active is null then
    raise exception 'Table introuvable.' using errcode = '22023';
  end if;
  if v_table_active = false then
    raise exception 'Cette table n''est plus active.' using errcode = '22023';
  end if;

  -- Validation items
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Panier vide.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Trop d''articles.' using errcode = '22023';
  end if;

  -- Boucle sur les lignes : on lit name + price serveur (jamais le client)
  for v_item in
    select
      (elem->>'item_id')::uuid as item_id,
      coalesce((elem->>'quantity')::int, 1) as quantity
    from jsonb_array_elements(p_items) as elem
  loop
    v_qty := v_item.quantity;
    if v_qty < 1 or v_qty > 30 then
      raise exception 'Quantité invalide.' using errcode = '22023';
    end if;

    select i.name, i.price into v_name, v_price
    from public.digital_menu_items i
    where i.id = v_item.item_id
      and i.restaurant_id = v_resto_id
      and i.available = true
    limit 1;

    if v_name is null then
      raise exception 'Plat indisponible ou introuvable.' using errcode = '22023';
    end if;

    v_total := v_total + (v_price * v_qty);
    v_lines := array_append(
      v_lines,
      v_qty::text || '× ' || v_name
    );
    v_count := v_count + v_qty;
  end loop;

  -- display_id : ORD-YYYYMMDD-NNN par tenant/jour
  select count(*) + 1 into v_seq
  from public.orders
  where restaurant_id = v_resto_id
    and created_at::date = current_date;
  v_display_id := 'WEB-' || to_char(now(), 'YYMMDD') || '-' || lpad(v_seq::text, 3, '0');

  -- Note : on préfixe avec le nom du client si fourni
  v_note := nullif(trim(p_note), '');
  if length(coalesce(p_name, '')) > 0 then
    v_note := 'Client : ' || trim(p_name)
      || case when v_note is not null then E'\n' || v_note else '' end;
  end if;

  insert into public.orders (
    restaurant_id, display_id, table_label, covers, items, total,
    status, channel, waiter, priority, note
  ) values (
    v_resto_id, v_display_id, p_table_label, greatest(v_count, 1), v_lines, v_total,
    'pending', 'salle', '', 'normal', v_note
  )
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'display_id', v_display_id,
    'total', v_total,
    'status', 'pending'
  );
end;
$$;

grant execute on function public.create_public_order(
  text, text, jsonb, text, text
) to anon, authenticated;
