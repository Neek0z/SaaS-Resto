-- =============================================================
-- SEED_PIZZBELLA — Données d'exemple pour Pizz'Bella
-- =============================================================
-- ÉTAPE 1 : récupère ton id en exécutant :
--   select id, name from public.restaurants;
--
-- ÉTAPE 2 : remplace toutes les occurrences de
--   __PUT_RESTAURANT_ID_HERE__ par ton UUID (find/replace).
--
-- Contenu : 5 catégories + 16 plats, 5 membres équipe,
-- 4 réservations du jour, 6 commandes (mix en cours / servies),
-- 4 avis, 5 clients CRM, 3 fidèles, 3 récompenses, config fidélité.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Menu : catégories
-- -------------------------------------------------------------
insert into public.digital_menu_categories (restaurant_id, name, position) values
  ('__PUT_RESTAURANT_ID_HERE__', 'Antipasti', 0),
  ('__PUT_RESTAURANT_ID_HERE__', 'Pizzas',    1),
  ('__PUT_RESTAURANT_ID_HERE__', 'Pâtes',     2),
  ('__PUT_RESTAURANT_ID_HERE__', 'Desserts',  3),
  ('__PUT_RESTAURANT_ID_HERE__', 'Boissons',  4);

-- -------------------------------------------------------------
-- 2. Menu : plats (category_id récupéré par sous-requête)
-- -------------------------------------------------------------
insert into public.digital_menu_items
  (restaurant_id, category_id, name, description, price, tags, allergenes, badge, tva_rate, position)
values
  -- Antipasti
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Antipasti'),
   'Bruschetta',           'Pain grillé, tomates fraîches, basilic, ail',                  8.50,  '{"végétarien"}',     '{"gluten"}',                          'fait maison',         10, 0),
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Antipasti'),
   'Burrata des Pouilles', 'Burrata crémeuse, huile d''olive, tomates cerises',            12.00, '{"végétarien"}',     '{"lait"}',                            'suggestion du chef',  10, 1),
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Antipasti'),
   'Carpaccio de bœuf',    'Bœuf cru, parmesan, roquette, copeaux de truffe',              13.50, '{}',                 '{"lait"}',                            null,                  10, 2),
  -- Pizzas
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Pizzas'),
   'Margherita',           'Tomate, mozzarella di bufala, basilic frais',                  11.00, '{"végétarien"}',     '{"gluten","lait"}',                   'populaire',           10, 0),
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Pizzas'),
   'Quatre fromages',      'Mozzarella, gorgonzola, parmesan, scamorza',                   13.50, '{"végétarien"}',     '{"gluten","lait"}',                   null,                  10, 1),
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Pizzas'),
   'Diavola',              'Tomate, mozzarella, salami piquant, oignon rouge',             13.00, '{"épicé"}',          '{"gluten","lait"}',                   null,                  10, 2),
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Pizzas'),
   'Reine',                'Tomate, mozzarella, jambon, champignons',                      12.50, '{}',                 '{"gluten","lait"}',                   null,                  10, 3),
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Pizzas'),
   'Calzone',              'Pizza repliée, jambon, mozzarella, ricotta, œuf',              13.00, '{}',                 '{"gluten","lait","oeufs"}',           'fait maison',         10, 4),
  -- Pâtes
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Pâtes'),
   'Spaghetti carbonara',  'Œuf, guanciale, pecorino, poivre noir',                        14.00, '{}',                 '{"gluten","lait","oeufs"}',           null,                  10, 0),
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Pâtes'),
   'Bolognese',            'Spaghetti, sauce bolognaise mijotée 4h, parmesan',             13.50, '{}',                 '{"gluten","lait"}',                   null,                  10, 1),
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Pâtes'),
   'Lasagnes maison',      'Pâtes fraîches, bœuf, béchamel, parmesan',                     14.50, '{}',                 '{"gluten","lait","oeufs"}',           'suggestion du chef',  10, 2),
  -- Desserts
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Desserts'),
   'Tiramisu',             'Mascarpone, café, biscuits cuillère, cacao',                   7.00,  '{"végétarien"}',     '{"gluten","lait","oeufs"}',           'populaire',           10, 0),
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Desserts'),
   'Panna cotta',          'Crème vanillée, coulis de fruits rouges',                      6.50,  '{"végétarien","sans gluten"}', '{"lait"}',                  null,                  10, 1),
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Desserts'),
   'Cannolis siciliens',   'Pâte croustillante, ricotta, pépites de chocolat',             7.50,  '{"végétarien"}',     '{"gluten","lait"}',                   null,                  10, 2),
  -- Boissons
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Boissons'),
   'Chianti Classico',     'Vin rouge toscan, verre 12 cl',                                7.00,  '{}',                 '{"sulfites"}',                        null,                  20, 0),
  ('__PUT_RESTAURANT_ID_HERE__', (select id from public.digital_menu_categories where restaurant_id='__PUT_RESTAURANT_ID_HERE__' and name='Boissons'),
   'Limonade artisanale',  'Citron pressé, eau pétillante, sucre de canne',                4.50,  '{"végétarien","vegan"}', '{}',                              null,                  10, 1);

-- -------------------------------------------------------------
-- 3. Équipe (5 membres pour le service du soir)
-- -------------------------------------------------------------
insert into public.team_members
  (restaurant_id, name, role, status, avatar, hours, start_at, end_at, kind, break_start, break_end)
values
  ('__PUT_RESTAURANT_ID_HERE__', 'Léa Conti',      'Manager salle',    'service', 'LC', '17:00–00:00', 17,    24,   'service', null, null),
  ('__PUT_RESTAURANT_ID_HERE__', 'Marco Russo',    'Chef pizzaiolo',   'service', 'MR', '16:00–00:00', 16,    24,   'kitchen', 19,   19.5),
  ('__PUT_RESTAURANT_ID_HERE__', 'Sofia Lombardi', 'Chef de rang',     'service', 'SL', '18:00–01:00', 18,    25,   'service', null, null),
  ('__PUT_RESTAURANT_ID_HERE__', 'Théo Bianchi',   'Commis de cuisine','break',   'TB', '17:00–00:00', 17,    24,   'kitchen', 20,   20.5),
  ('__PUT_RESTAURANT_ID_HERE__', 'Karim Aziz',     'Plonge',           'late',    'KA', '18:00–01:00', 18,    25,   'late',    null, null);

-- -------------------------------------------------------------
-- 4. Réservations du jour
-- -------------------------------------------------------------
insert into public.reservations
  (restaurant_id, reservation_date, reservation_time, name, covers, table_label, status, note, phone, email, duration_minutes, source)
values
  ('__PUT_RESTAURANT_ID_HERE__', current_date, '19:00', 'M. Dupont',    2, 'T2',  'confirmed', 'Anniversaire',                        '0612345678', 'dupont@mail.com',    90, 'manual'),
  ('__PUT_RESTAURANT_ID_HERE__', current_date, '19:30', 'Famille Rossi', 5, 'T8',  'confirmed', 'Allergie aux fruits de mer',          '0623456789', 'rossi@mail.com',     120, 'manual'),
  ('__PUT_RESTAURANT_ID_HERE__', current_date, '20:00', 'Mme Lefèvre',  4, 'T12', 'seated',    null,                                  '0634567890', null,                  90, 'manual'),
  ('__PUT_RESTAURANT_ID_HERE__', current_date, '20:30', 'M. Bensaïd',   2, 'T5',  'confirmed', null,                                  '0645678901', 'bensaid@mail.com',    90, 'manual');

-- -------------------------------------------------------------
-- 5. Commandes (mix en cours / servies)
-- -------------------------------------------------------------
insert into public.orders
  (restaurant_id, display_id, table_label, covers, items, total, status, channel, waiter, priority, pickup_time, note, created_at)
values
  ('__PUT_RESTAURANT_ID_HERE__', 'PB-001', 'T12', 4, '{"Margherita","Diavola","Bruschetta","Tiramisu","Tiramisu","Chianti Classico","Chianti Classico"}', 71.50,  'preparing', 'salle',    'Léa',   'high',   null, 'Sans oignon sur la Diavola', now() - interval '8 minutes'),
  ('__PUT_RESTAURANT_ID_HERE__', 'PB-002', 'T2',  2, '{"Burrata des Pouilles","Quatre fromages","Panna cotta"}',                                          33.00,  'pending',   'salle',    'Sofia', 'normal', null, null,                          now() - interval '3 minutes'),
  ('__PUT_RESTAURANT_ID_HERE__', 'PB-003', 'T5',  2, '{"Spaghetti carbonara","Bolognese","Limonade artisanale","Limonade artisanale"}',                   36.50,  'preparing', 'salle',    'Léa',   'normal', null, null,                          now() - interval '12 minutes'),
  ('__PUT_RESTAURANT_ID_HERE__', 'PB-004', 'CC',  1, '{"Margherita","Tiramisu"}',                                                                         18.00,  'pending',   'cc',       'Sofia', 'normal', '20:45', 'Click & collect',           now() - interval '2 minutes'),
  ('__PUT_RESTAURANT_ID_HERE__', 'PB-005', 'T8',  5, '{"Carpaccio de bœuf","Reine","Reine","Lasagnes maison","Calzone","Cannolis siciliens","Tiramisu"}', 78.50,  'served',    'salle',    'Léa',   'normal', null, null,                          now() - interval '45 minutes'),
  ('__PUT_RESTAURANT_ID_HERE__', 'PB-006', 'DEL', 2, '{"Margherita","Margherita","Limonade artisanale"}',                                                 26.50,  'served',    'delivery', 'Sofia', 'normal', null, 'Livraison Deliveroo',         now() - interval '1 hour 20 minutes');

-- -------------------------------------------------------------
-- 6. Avis clients
-- -------------------------------------------------------------
insert into public.reviews
  (restaurant_id, source, author, rating, scale, time_label, text, replied, created_at)
values
  ('__PUT_RESTAURANT_ID_HERE__', 'Google',      'Camille R.',   5,   5,  'il y a 2h',  'Pizza napolitaine parfaite, pâte légère et croustillante. La burrata est à tomber.', false, now() - interval '2 hours'),
  ('__PUT_RESTAURANT_ID_HERE__', 'TheFork',     'Antoine M.',   8,   10, 'il y a 1j',  'Très bonne adresse italienne. Service un peu lent à 21h mais la cuisine vaut l''attente.', true,  now() - interval '1 day'),
  ('__PUT_RESTAURANT_ID_HERE__', 'TripAdvisor', 'Sophie L.',    4,   5,  'il y a 3j',  'Cadre chaleureux, plats généreux. On reviendra avec plaisir.',                              false, now() - interval '3 days'),
  ('__PUT_RESTAURANT_ID_HERE__', 'Google',      'Marc D.',      3,   5,  'il y a 5j',  'Pizza correcte mais carbonara un peu trop salée à mon goût.',                               false, now() - interval '5 days');

-- -------------------------------------------------------------
-- 7. CRM : clients
-- -------------------------------------------------------------
insert into public.customers
  (restaurant_id, name, email, phone, source, tags, visit_count, total_spent, last_visit, opted_in_email, opted_in_sms, notes)
values
  ('__PUT_RESTAURANT_ID_HERE__', 'Camille Rousseau', 'camille.r@mail.com',  '0611111111', 'reservation', '{"vip","habitué"}',         12, 480.00, now() - interval '2 days',  true,  false, 'Préfère table près de la fenêtre'),
  ('__PUT_RESTAURANT_ID_HERE__', 'Antoine Mercier',  'antoine.m@mail.com',  '0622222222', 'reservation', '{"habitué"}',               8,  320.00, now() - interval '1 week',  true,  true,  null),
  ('__PUT_RESTAURANT_ID_HERE__', 'Sophie Laurent',   'sophie.l@mail.com',   '0633333333', 'manual',      '{"famille"}',               5,  185.00, now() - interval '2 weeks', true,  false, null),
  ('__PUT_RESTAURANT_ID_HERE__', 'Marc Dubois',      'marc.d@mail.com',     '0644444444', 'qrcode',      '{}',                        2,  75.00,  now() - interval '5 days',  true,  false, null),
  ('__PUT_RESTAURANT_ID_HERE__', 'Julia Bianchi',    'julia.b@mail.com',    '0655555555', 'fidelite',    '{"nouveau"}',               1,  42.00,  now() - interval '1 day',   false, false, 'Première visite');

-- -------------------------------------------------------------
-- 8. Fidélité : config + clients fidèles + récompenses
-- -------------------------------------------------------------
insert into public.loyalty_config (restaurant_id, active, program_name, welcome_message, points_per_euro, threshold_silver, threshold_gold)
values ('__PUT_RESTAURANT_ID_HERE__', true, 'Pizz''Bella Rewards', 'Bienvenue chez Pizz''Bella ! Cumulez des points à chaque visite.', 10, 500, 1500)
on conflict (restaurant_id) do nothing;

insert into public.loyalty_customers
  (restaurant_id, name, email, phone, points, total_spent, visit_count, last_visit, tier)
values
  ('__PUT_RESTAURANT_ID_HERE__', 'Camille Rousseau', 'camille.r@mail.com', '0611111111', 4800, 480.00, 12, now() - interval '2 days',  'platine'),
  ('__PUT_RESTAURANT_ID_HERE__', 'Antoine Mercier',  'antoine.m@mail.com', '0622222222', 3200, 320.00, 8,  now() - interval '1 week',  'gold'),
  ('__PUT_RESTAURANT_ID_HERE__', 'Sophie Laurent',   'sophie.l@mail.com',  '0633333333', 1850, 185.00, 5,  now() - interval '2 weeks', 'silver');

insert into public.loyalty_rewards
  (restaurant_id, name, description, points_cost, active, claimed_count)
values
  ('__PUT_RESTAURANT_ID_HERE__', 'Verre de Chianti offert',  'Un verre de Chianti Classico offert à votre prochaine visite', 200,  true, 24),
  ('__PUT_RESTAURANT_ID_HERE__', 'Tiramisu maison offert',   'Notre tiramisu signature offert',                              350,  true, 18),
  ('__PUT_RESTAURANT_ID_HERE__', 'Pizza Margherita offerte', 'Une pizza Margherita offerte (valable midi & soir)',           1200, true, 6);

-- =============================================================
-- Vérification
-- =============================================================
select 'digital_menu_categories' as tbl, count(*) from public.digital_menu_categories where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'digital_menu_items',         count(*) from public.digital_menu_items      where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'team_members',               count(*) from public.team_members            where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'reservations',               count(*) from public.reservations            where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'orders',                     count(*) from public.orders                  where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'reviews',                    count(*) from public.reviews                 where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'customers',                  count(*) from public.customers               where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'loyalty_customers',          count(*) from public.loyalty_customers       where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'loyalty_rewards',            count(*) from public.loyalty_rewards         where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
union all select 'loyalty_config',             count(*) from public.loyalty_config          where restaurant_id = '__PUT_RESTAURANT_ID_HERE__'
order by tbl;
