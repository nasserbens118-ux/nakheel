-- Nakheel Platform — Seed Data
-- Run AFTER migrations 001, 002, 003
-- NOTE: Demo users must first be created via Supabase Auth (Dashboard > Authentication > Users)
-- with the emails below, then their UUIDs used as the 'id' values in profiles.
-- Alternatively, use the signUp() flow from the app and the trigger will auto-create profiles.

-- Products (no auth dependency)
insert into public.products (id, name, animal_target, formula_type, price_per_kg, price_per_bag, bag_weight_kg, description, active, image_url) values
  ('PROD-001', 'Aliment ovins économique',   'sheep',  'economic', 45, 1125, 25, 'Formule équilibrée à base de broyat de palmes séchées et noyaux de dattes.', true, 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=600&q=80'),
  ('PROD-002', 'Aliment ovins standard',     'sheep',  'improved', 62, 1550, 25, 'Enrichi en dattes déclassées à haute valeur énergétique.', true, 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=600&q=80'),
  ('PROD-003', 'Aliment bovins standard',    'cattle', 'economic', 42, 1680, 40, 'Ration optimisée en fibres végétales de palmier et noyaux moulus.', true, 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80'),
  ('PROD-004', 'Aliment mixte amélioré',     'cattle', 'improved', 58, 2320, 40, 'Concentré hautement énergétique à base de dattes broyées.', true, 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80')
on conflict (id) do nothing;

-- After creating auth users and getting their UUIDs, run:
-- insert into public.profiles (id, full_name, phone, email, role, wilaya, commune) values
--   ('<admin-uuid>',    'Dr. Karim Merabet',  '+213 550 11 22 33', 'admin@nakheel.com',          'admin',    'Alger',   'El Biar'),
--   ('<operator-uuid>', 'Tariq Benouad',       '+213 661 44 55 66', 'operator@nakheel.com',        'operator', 'Biskra',  'Tolga'),
--   ('<supp1-uuid>',   'Ahmed Belkacem',       '+213 550 12 34 56', 'ahmed.biskra@gmail.com',      'supplier', 'Biskra',  'Tolga'),
--   ('<client1-uuid>', 'Yacine Touati',         '+213 661 98 76 54', 'yacine.touati@outlook.com',   'client',   'M''Sila', 'Sidi Aïssa');
--
-- Then insert suppliers/clients with those UUIDs as user_id.
