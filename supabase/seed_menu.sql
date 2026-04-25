-- =============================================================
-- Maison Sévère · Seed de démo pour la carte
-- À exécuter APRÈS 003_menu.sql
-- Utilise le premier restaurant trouvé (ton compte owner)
-- =============================================================

do $$
declare
  v_restaurant_id uuid;
  v_entrees   uuid;
  v_plats     uuid;
  v_desserts  uuid;
  v_boissons  uuid;
  v_vins      uuid;
begin
  -- Restaurant cible : le premier créé (adapte si besoin)
  select id into v_restaurant_id
  from public.restaurants
  order by created_at asc
  limit 1;

  if v_restaurant_id is null then
    raise exception 'Aucun restaurant trouvé. Crée d''abord un compte owner.';
  end if;

  -- Nettoyage éventuel du seed précédent pour ce restaurant
  delete from public.digital_menu_items      where restaurant_id = v_restaurant_id;
  delete from public.digital_menu_categories where restaurant_id = v_restaurant_id;

  -- ---------------------------------------------------------
  -- Catégories
  -- ---------------------------------------------------------
  insert into public.digital_menu_categories (restaurant_id, name, position, active)
  values (v_restaurant_id, 'Entrées',  0, true) returning id into v_entrees;

  insert into public.digital_menu_categories (restaurant_id, name, position, active)
  values (v_restaurant_id, 'Plats',    1, true) returning id into v_plats;

  insert into public.digital_menu_categories (restaurant_id, name, position, active)
  values (v_restaurant_id, 'Desserts', 2, true) returning id into v_desserts;

  insert into public.digital_menu_categories (restaurant_id, name, position, active)
  values (v_restaurant_id, 'Boissons', 3, true) returning id into v_boissons;

  insert into public.digital_menu_categories (restaurant_id, name, position, active)
  values (v_restaurant_id, 'Vins & Cocktails', 4, true) returning id into v_vins;

  -- ---------------------------------------------------------
  -- Plats — Entrées
  -- ---------------------------------------------------------
  insert into public.digital_menu_items
    (restaurant_id, category_id, name, description, price, tva_rate, available, tags, allergenes, badge, position)
  values
    (v_restaurant_id, v_entrees, 'Œuf parfait, crème de cèpes',
     'Œuf basse température 63°, émulsion de cèpes, noisettes torréfiées, huile de truffe.',
     14.00, 10.00, true,
     array['signature','vegetarien'],
     array['oeuf','fruits_coque','lait'],
     'Signature', 0),

    (v_restaurant_id, v_entrees, 'Tartare de bœuf au couteau',
     'Charolais coupé au couteau, câpres, échalote, jaune d''œuf, pain grillé au levain.',
     16.50, 10.00, true,
     array['classique'],
     array['oeuf','gluten','moutarde'],
     null, 1),

    (v_restaurant_id, v_entrees, 'Velouté de potimarron',
     'Potimarron rôti, lait de coco, graines de courge, huile de sésame.',
     11.00, 10.00, true,
     array['vegan','sans_gluten'],
     array['sesame'],
     null, 2),

    (v_restaurant_id, v_entrees, 'Burrata des Pouilles',
     'Burrata crémeuse, tomates anciennes, pesto de roquette, focaccia maison.',
     15.00, 10.00, false,
     array['vegetarien','saison'],
     array['lait','gluten','fruits_coque'],
     'Saison', 3);

  -- ---------------------------------------------------------
  -- Plats — Plats
  -- ---------------------------------------------------------
  insert into public.digital_menu_items
    (restaurant_id, category_id, name, description, price, tva_rate, available, tags, allergenes, badge, position)
  values
    (v_restaurant_id, v_plats, 'Entrecôte Black Angus 300g',
     'Entrecôte maturée 30 jours, frites maison au gras de bœuf, beurre maître d''hôtel.',
     32.00, 10.00, true,
     array['signature','classique'],
     array['lait'],
     'Signature', 0),

    (v_restaurant_id, v_plats, 'Cabillaud rôti, beurre blanc',
     'Pavé de cabillaud, légumes glacés, beurre blanc au yuzu, riz vénéré.',
     28.00, 10.00, true,
     array['saison'],
     array['poisson','lait','soja'],
     null, 1),

    (v_restaurant_id, v_plats, 'Risotto aux champignons',
     'Risotto carnaroli, girolles et shiitakes, parmesan 24 mois, huile de persil.',
     24.00, 10.00, true,
     array['vegetarien','sans_gluten'],
     array['lait','sulfites'],
     null, 2),

    (v_restaurant_id, v_plats, 'Burger de la maison',
     'Bœuf Black Angus 180g, cheddar affiné, oignons confits, bun brioché, frites.',
     22.00, 10.00, true,
     array['classique'],
     array['gluten','lait','oeuf','moutarde','sesame'],
     null, 3),

    (v_restaurant_id, v_plats, 'Magret de canard laqué',
     'Magret rosé, sauce hoisin maison, purée de patate douce, pak choï.',
     27.00, 10.00, true,
     array['saison'],
     array['soja','gluten','sesame'],
     'Nouveau', 4),

    (v_restaurant_id, v_plats, 'Buddha bowl du chef',
     'Quinoa, avocat, edamame, carottes rôties, tofu fumé, sauce cacahuète.',
     19.00, 10.00, true,
     array['vegan','sans_gluten'],
     array['soja','arachides','sesame'],
     null, 5);

  -- ---------------------------------------------------------
  -- Plats — Desserts
  -- ---------------------------------------------------------
  insert into public.digital_menu_items
    (restaurant_id, category_id, name, description, price, tva_rate, available, tags, allergenes, badge, position)
  values
    (v_restaurant_id, v_desserts, 'Paris-Brest revisité',
     'Pâte à choux craquelin, praliné noisette maison, glace vanille bourbon.',
     12.00, 10.00, true,
     array['signature','classique'],
     array['gluten','oeuf','lait','fruits_coque'],
     'Signature', 0),

    (v_restaurant_id, v_desserts, 'Tarte au citron meringuée',
     'Sablé breton, crème de citron de Menton, meringue italienne torchée.',
     10.00, 10.00, true,
     array['classique'],
     array['gluten','oeuf','lait'],
     null, 1),

    (v_restaurant_id, v_desserts, 'Mi-cuit chocolat grand cru',
     'Chocolat noir 70%, cœur coulant, glace caramel beurre salé.',
     11.00, 10.00, true,
     array[]::text[],
     array['gluten','oeuf','lait','soja'],
     null, 2),

    (v_restaurant_id, v_desserts, 'Sorbet plein fruit',
     'Framboise, mangue ou citron vert. 3 boules, sablé sans gluten.',
     9.00, 10.00, true,
     array['vegan','sans_gluten','saison'],
     array[]::text[],
     null, 3);

  -- ---------------------------------------------------------
  -- Plats — Boissons
  -- ---------------------------------------------------------
  insert into public.digital_menu_items
    (restaurant_id, category_id, name, description, price, tva_rate, available, tags, allergenes, badge, position)
  values
    (v_restaurant_id, v_boissons, 'Eau plate Évian 75cl',
     null, 5.50, 10.00, true,
     array[]::text[], array[]::text[], null, 0),

    (v_restaurant_id, v_boissons, 'Eau pétillante Badoit 75cl',
     null, 5.50, 10.00, true,
     array[]::text[], array[]::text[], null, 1),

    (v_restaurant_id, v_boissons, 'Limonade artisanale',
     'Limonade de Lorraine, bouteille 33cl.',
     5.00, 10.00, true,
     array[]::text[], array[]::text[], null, 2),

    (v_restaurant_id, v_boissons, 'Café filtre de spécialité',
     'Torréfaction Belleville, origine Éthiopie.',
     3.50, 10.00, true,
     array['signature'], array[]::text[], null, 3),

    (v_restaurant_id, v_boissons, 'Thé Palais des Thés',
     'Grand Jasmin Chun Feng, Earl Grey impérial, ou rooibos vanille.',
     4.50, 10.00, true,
     array[]::text[], array[]::text[], null, 4);

  -- ---------------------------------------------------------
  -- Plats — Vins & Cocktails (TVA 20%)
  -- ---------------------------------------------------------
  insert into public.digital_menu_items
    (restaurant_id, category_id, name, description, price, tva_rate, available, tags, allergenes, badge, position)
  values
    (v_restaurant_id, v_vins, 'Verre de Côtes-du-Rhône',
     'Domaine La Manarine, 2022.',
     7.00, 20.00, true,
     array[]::text[], array['sulfites'], null, 0),

    (v_restaurant_id, v_vins, 'Verre de Sancerre blanc',
     'Domaine Vacheron, 2023.',
     9.00, 20.00, true,
     array[]::text[], array['sulfites'], null, 1),

    (v_restaurant_id, v_vins, 'Spritz maison',
     'Aperol, prosecco, soda, orange sanguine.',
     11.00, 20.00, true,
     array['signature'], array['sulfites'], 'Signature', 2),

    (v_restaurant_id, v_vins, 'Old Fashioned',
     'Bourbon Bulleit, sucre de canne, angostura, zeste d''orange.',
     13.00, 20.00, false,
     array['classique'], array[]::text[], null, 3),

    (v_restaurant_id, v_vins, 'Mocktail fraise-basilic',
     'Fraises fraîches, basilic, citron vert, eau pétillante.',
     8.00, 20.00, true,
     array['vegan','sans_gluten'], array[]::text[], 'Nouveau', 4);

  raise notice 'Seed terminé pour restaurant %', v_restaurant_id;
end $$;
