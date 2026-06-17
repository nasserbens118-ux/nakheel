-- Nakheel Platform — Schema Migration
-- Run this first in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ────────────────────────────────────────────────────────────────
create table public.profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone     text,
  email     text not null,
  role      text not null check (role in ('admin','operator','supplier','client')),
  wilaya    text,
  commune   text,
  created_at timestamptz default now(),
  status    text not null default 'active' check (status in ('active','inactive')),
  avatar    text
);

-- ────────────────────────────────────────────────────────────────
-- SUPPLIERS
-- ────────────────────────────────────────────────────────────────
create table public.suppliers (
  id                   text primary key,
  user_id              uuid references public.profiles(id) on delete cascade,
  supplier_type        text not null check (supplier_type in ('farmer','palm_owner','cooperative')),
  location             text,
  total_waste_declared numeric default 0,
  total_waste_accepted numeric default 0,
  reliability_score    numeric default 0,
  notes                text
);

-- ────────────────────────────────────────────────────────────────
-- CLIENTS
-- ────────────────────────────────────────────────────────────────
create table public.clients (
  id                     text primary key,
  user_id                uuid references public.profiles(id) on delete cascade,
  client_type            text not null check (client_type in ('small_breeder','medium_breeder','wholesaler','cooperative')),
  animal_type            text not null check (animal_type in ('sheep','cattle','mixed')),
  monthly_demand_estimate numeric default 0,
  delivery_location      text,
  loyalty_score          numeric default 0
);

-- ────────────────────────────────────────────────────────────────
-- WASTE_REQUESTS
-- ────────────────────────────────────────────────────────────────
create table public.waste_requests (
  id                    text primary key,
  supplier_id           uuid references public.profiles(id),
  waste_type            text not null check (waste_type in ('palm_leaves','fibers','dates_low_quality','mixed')),
  estimated_quantity_kg numeric not null,
  humidity_level        text not null check (humidity_level in ('low','medium','high')),
  impurity_level        text not null check (impurity_level in ('low','medium','high')),
  photo_url             text,
  location              text,
  availability_date     date,
  ai_quality_score      numeric default 0,
  admin_decision        text not null default 'pending' check (admin_decision in ('accepted','rejected','pending')),
  status                text not null default 'submitted' check (status in ('submitted','ai_scored','accepted','rejected','scheduled_for_pickup','collected','received','stored')),
  rejection_reason      text,
  created_at            timestamptz default now(),
  visual_state          text check (visual_state in ('sec','humide','mélangé','douteux')),
  ai_decision           text check (ai_decision in ('accepté','à sécher','à trier','rejeté')),
  ai_recommendation     text,
  scheduled_date        date
);

-- ────────────────────────────────────────────────────────────────
-- RAW_MATERIAL_BATCHES
-- ────────────────────────────────────────────────────────────────
create table public.raw_material_batches (
  id                   text primary key,
  waste_request_ids    text[] not null default '{}',
  total_quantity_kg    numeric default 0,
  accepted_quantity_kg numeric default 0,
  rejected_quantity_kg numeric default 0,
  storage_location     text,
  received_at          timestamptz default now(),
  status               text not null default 'stored' check (status in ('draft','in_transit','received','stored','consumed'))
);

-- ────────────────────────────────────────────────────────────────
-- PRODUCTS
-- ────────────────────────────────────────────────────────────────
create table public.products (
  id            text primary key,
  name          text not null,
  animal_target text not null check (animal_target in ('sheep','cattle','mixed')),
  formula_type  text not null check (formula_type in ('economic','standard','improved')),
  price_per_kg  numeric not null,
  price_per_bag numeric not null,
  bag_weight_kg numeric not null,
  description   text,
  active        boolean default true,
  image_url     text
);

-- ────────────────────────────────────────────────────────────────
-- PRODUCTION_BATCHES
-- ────────────────────────────────────────────────────────────────
create table public.production_batches (
  id                   text primary key,
  batch_number         text unique not null,
  product_id           text references public.products(id),
  raw_material_batch_ids text[] default '{}',
  produced_quantity_kg numeric not null,
  production_date      date default current_date,
  formula_used         text,
  quality_status       text not null default 'à vérifier' check (quality_status in ('conforme','à vérifier','rejeté')),
  qr_code_url          text,
  status               text not null default 'draft' check (status in ('draft','in_production','quality_pending','approved','rejected','packaged','in_stock','sold_out')),
  notes                text
);

-- ────────────────────────────────────────────────────────────────
-- QUALITY_CHECKS
-- ────────────────────────────────────────────────────────────────
create table public.quality_checks (
  id                   text primary key,
  production_batch_id  text references public.production_batches(id),
  humidity             numeric,
  fiber                numeric,
  protein_target       numeric,
  impurity_check       boolean,
  safety_notes         text,
  decision             text not null check (decision in ('approved','needs_review','rejected')),
  checked_by           text,
  checked_at           timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- INVENTORY
-- ────────────────────────────────────────────────────────────────
create table public.inventory (
  id                   text primary key,
  product_id           text references public.products(id),
  production_batch_id  text references public.production_batches(id),
  available_quantity_kg numeric default 0,
  reserved_quantity_kg  numeric default 0,
  sold_quantity_kg      numeric default 0,
  damaged_quantity_kg   numeric default 0,
  last_updated          timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- ORDERS
-- ────────────────────────────────────────────────────────────────
create table public.orders (
  id                text primary key,
  client_id         uuid references public.profiles(id),
  total_quantity_kg numeric not null,
  total_amount      numeric not null,
  delivery_method   text not null check (delivery_method in ('pickup','delivery')),
  delivery_location text,
  status            text not null default 'created' check (status in ('created','confirmed','stock_reserved','preparing','out_for_delivery','delivered','closed','cancelled')),
  payment_status    text not null default 'unpaid' check (payment_status in ('unpaid','partially_paid','paid')),
  created_at        timestamptz default now(),
  delivered_at      timestamptz
);

-- ────────────────────────────────────────────────────────────────
-- ORDER_ITEMS
-- ────────────────────────────────────────────────────────────────
create table public.order_items (
  id                  text primary key,
  order_id            text references public.orders(id) on delete cascade,
  product_id          text references public.products(id),
  production_batch_id text,
  quantity_kg         numeric not null,
  unit_price          numeric not null,
  total_price         numeric not null
);

-- ────────────────────────────────────────────────────────────────
-- COMPLAINTS
-- ────────────────────────────────────────────────────────────────
create table public.complaints (
  id                  text primary key,
  client_id           uuid references public.profiles(id),
  order_id            text references public.orders(id),
  production_batch_id text references public.production_batches(id),
  complaint_type      text not null check (complaint_type in ('quality','delivery','price','other')),
  message             text not null,
  status              text not null default 'open' check (status in ('open','in_review','resolved','rejected')),
  reply               text,
  created_at          timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- AI_PREDICTIONS
-- ────────────────────────────────────────────────────────────────
create table public.ai_predictions (
  id               text primary key,
  prediction_type  text not null check (prediction_type in ('waste_quality','demand_forecast','stock_alert')),
  input_data       jsonb,
  output_result    jsonb,
  confidence_score numeric,
  created_at       timestamptz default now()
);
-- Nakheel Platform — 19 RPC Functions
-- Run AFTER 001_schema.sql

-- ────────────────────────────────────────────────────────────────
-- 1. calculate_waste_quality_score
-- ────────────────────────────────────────────────────────────────
create or replace function public.calculate_waste_quality_score(
  humidity text,
  impurity text,
  visual   text default 'sec',
  w_type   text default 'palm_leaves',
  qty      numeric default 0
) returns jsonb language plpgsql as $$
declare
  score        numeric := 50;
  v_decision   text;
  v_recommendation text;
begin
  if humidity = 'low'    then score := score + 20;
  elsif humidity = 'medium' then score := score + 5;
  else score := score - 25; end if;

  if impurity = 'low'    then score := score + 20;
  elsif impurity = 'medium' then score := score + 5;
  else score := score - 25; end if;

  if visual in ('sec','dry')           then score := score + 10;
  elsif visual in ('humide','wet')     then score := score - 15;
  elsif visual in ('mélangé','mixed')  then score := score - 10;
  elsif visual in ('douteux','doubtful') then score := score - 30; end if;

  score := greatest(0, least(100, score));

  if score < 40 or visual in ('douteux','doubtful') or impurity = 'high' then
    v_decision := 'rejeté';
    v_recommendation := 'Déchet rejeté pour cause d''impuretés critiques ou d''état douteux (risque sanitaire bétail).';
  elsif humidity = 'high' or visual in ('humide','wet') then
    v_decision := 'à sécher';
    v_recommendation := 'Taux d''humidité élevé. Étaler au soleil pendant 24h à 48h avant stockage en silo.';
  elsif impurity = 'medium' or visual in ('mélangé','mixed') then
    v_decision := 'à trier';
    v_recommendation := 'Présence de corps étrangers modérée. Trier manuellement avant broyage.';
  else
    v_decision := 'accepté';
    v_recommendation := 'Excellente qualité. Prêt pour stockage direct et broyage immédiat.';
  end if;

  return jsonb_build_object(
    'score',          score,
    'decision',       v_decision,
    'recommendation', v_recommendation
  );
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 2. accept_waste_request
-- ────────────────────────────────────────────────────────────────
create or replace function public.accept_waste_request(
  request_id text,
  admin_id   uuid
) returns void language plpgsql security definer as $$
begin
  update public.waste_requests
  set admin_decision = 'accepted', status = 'accepted'
  where id = request_id;

  -- Update supplier totals
  update public.suppliers s
  set total_waste_accepted = total_waste_accepted + wr.estimated_quantity_kg
  from public.waste_requests wr
  where wr.id = request_id and s.user_id = wr.supplier_id;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 3. reject_waste_request
-- ────────────────────────────────────────────────────────────────
create or replace function public.reject_waste_request(
  request_id text,
  admin_id   uuid,
  reason     text
) returns void language plpgsql security definer as $$
begin
  update public.waste_requests
  set admin_decision = 'rejected', status = 'rejected', rejection_reason = reason
  where id = request_id;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 4. schedule_collection
-- ────────────────────────────────────────────────────────────────
create or replace function public.schedule_collection(
  request_id     text,
  scheduled_date date,
  driver_name    text,
  vehicle_ref    text
) returns text language plpgsql security definer as $$
begin
  update public.waste_requests
  set status = 'scheduled_for_pickup',
      scheduled_date = schedule_collection.scheduled_date
  where id = request_id;
  return request_id;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 5. receive_raw_material
-- ────────────────────────────────────────────────────────────────
create or replace function public.receive_raw_material(
  request_ids      text[],
  batch_code       text,
  storage_location text
) returns text language plpgsql security definer as $$
declare
  total_qty numeric := 0;
  batch_id  text;
begin
  select coalesce(sum(estimated_quantity_kg), 0) into total_qty
  from public.waste_requests
  where id = any(request_ids);

  update public.waste_requests
  set status = 'stored'
  where id = any(request_ids);

  batch_id := coalesce(batch_code, 'RMB-' || to_char(now(), 'YYYYMMDD'));

  insert into public.raw_material_batches
    (id, waste_request_ids, total_quantity_kg, accepted_quantity_kg, storage_location, status)
  values
    (batch_id, request_ids, total_qty, total_qty, storage_location, 'stored');

  return batch_id;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 6. create_production_batch
-- ────────────────────────────────────────────────────────────────
create or replace function public.create_production_batch(
  p_id                   text,
  raw_material_batch_ids text[],
  produced_qty           numeric,
  formula                text
) returns text language plpgsql security definer as $$
declare
  batch_count  int;
  batch_number text;
  batch_id     text;
begin
  select count(*) into batch_count from public.production_batches;
  batch_number := 'NAK-26-' || lpad((batch_count + 1)::text, 3, '0');
  batch_id     := 'BAT-' || lpad((batch_count + 1)::text, 3, '0');

  insert into public.production_batches
    (id, batch_number, product_id, raw_material_batch_ids, produced_quantity_kg, formula_used, status, quality_status, qr_code_url)
  values
    (batch_id, batch_number, p_id, raw_material_batch_ids, produced_qty, formula, 'quality_pending', 'à vérifier',
     'https://nakheel-trace.dz/batch/' || batch_number);

  -- Mark raw material batches as consumed
  update public.raw_material_batches
  set status = 'consumed'
  where id = any(raw_material_batch_ids);

  return batch_id;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 7. add_quality_check
-- ────────────────────────────────────────────────────────────────
create or replace function public.add_quality_check(
  batch_id       text,
  humidity       numeric,
  fiber          numeric,
  protein        numeric,
  impurity_check boolean,
  safety_notes   text,
  decision       text,
  checked_by     text
) returns text language plpgsql security definer as $$
declare
  check_id text;
begin
  check_id := 'QC-' || substr(gen_random_uuid()::text, 1, 8);

  insert into public.quality_checks
    (id, production_batch_id, humidity, fiber, protein_target, impurity_check, safety_notes, decision, checked_by)
  values
    (check_id, batch_id, humidity, fiber, protein, impurity_check, safety_notes, decision, checked_by)
  on conflict (id) do nothing;

  if decision = 'approved' then
    update public.production_batches set quality_status = 'conforme', status = 'in_stock' where id = batch_id;
    -- Auto-create inventory entry
    insert into public.inventory (id, product_id, production_batch_id, available_quantity_kg)
    select 'INV-' || substr(gen_random_uuid()::text, 1, 8), product_id, batch_id, produced_quantity_kg
    from public.production_batches where id = batch_id;
  elsif decision = 'rejected' then
    update public.production_batches set quality_status = 'rejeté', status = 'rejected' where id = batch_id;
  else
    update public.production_batches set quality_status = 'à vérifier', status = 'quality_pending' where id = batch_id;
  end if;

  return check_id;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 8. approve_production_batch
-- ────────────────────────────────────────────────────────────────
create or replace function public.approve_production_batch(
  batch_id text
) returns void language plpgsql security definer as $$
begin
  update public.production_batches
  set quality_status = 'conforme', status = 'in_stock'
  where id = batch_id;

  insert into public.inventory (id, product_id, production_batch_id, available_quantity_kg)
  select 'INV-' || substr(gen_random_uuid()::text, 1, 8), product_id, batch_id, produced_quantity_kg
  from public.production_batches
  where id = batch_id
  on conflict do nothing;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 9. update_inventory_after_production
-- ────────────────────────────────────────────────────────────────
create or replace function public.update_inventory_after_production(
  batch_id text,
  quantity numeric
) returns void language plpgsql security definer as $$
begin
  update public.inventory
  set available_quantity_kg = available_quantity_kg + quantity,
      last_updated = now()
  where production_batch_id = batch_id;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 10. reserve_stock
-- ────────────────────────────────────────────────────────────────
create or replace function public.reserve_stock(
  order_id text
) returns boolean language plpgsql security definer as $$
declare
  item       record;
  inv_record record;
begin
  for item in
    select * from public.order_items where order_id = reserve_stock.order_id
  loop
    select * into inv_record
    from public.inventory
    where product_id = item.product_id
      and available_quantity_kg >= item.quantity_kg
    order by available_quantity_kg desc
    limit 1;

    if not found then
      return false;
    end if;

    update public.inventory
    set available_quantity_kg = available_quantity_kg - item.quantity_kg,
        reserved_quantity_kg  = reserved_quantity_kg  + item.quantity_kg,
        last_updated = now()
    where id = inv_record.id;

    -- Link batch to order item
    update public.order_items
    set production_batch_id = inv_record.production_batch_id
    where id = item.id;
  end loop;

  update public.orders set status = 'stock_reserved' where id = order_id;
  return true;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 11. release_stock
-- ────────────────────────────────────────────────────────────────
create or replace function public.release_stock(
  order_id text
) returns void language plpgsql security definer as $$
declare
  item record;
begin
  for item in
    select * from public.order_items where order_id = release_stock.order_id
  loop
    update public.inventory
    set available_quantity_kg = available_quantity_kg + item.quantity_kg,
        reserved_quantity_kg  = greatest(0, reserved_quantity_kg - item.quantity_kg),
        last_updated = now()
    where product_id = item.product_id;
  end loop;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 12. confirm_order
-- ────────────────────────────────────────────────────────────────
create or replace function public.confirm_order(
  order_id text
) returns boolean language plpgsql security definer as $$
begin
  update public.orders
  set status = 'confirmed'
  where id = order_id and status = 'created';
  return found;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 13. cancel_order
-- ────────────────────────────────────────────────────────────────
create or replace function public.cancel_order(
  order_id text
) returns void language plpgsql security definer as $$
begin
  perform public.release_stock(order_id);
  update public.orders set status = 'cancelled' where id = order_id;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 14. confirm_delivery
-- ────────────────────────────────────────────────────────────────
create or replace function public.confirm_delivery(
  order_id text
) returns void language plpgsql security definer as $$
declare
  item record;
begin
  update public.orders
  set status = 'delivered', delivered_at = now(), payment_status = 'paid'
  where id = order_id;

  for item in
    select * from public.order_items where order_id = confirm_delivery.order_id
  loop
    update public.inventory
    set reserved_quantity_kg = greatest(0, reserved_quantity_kg - item.quantity_kg),
        sold_quantity_kg     = sold_quantity_kg + item.quantity_kg,
        last_updated = now()
    where product_id = item.product_id;
  end loop;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 15. generate_batch_number
-- ────────────────────────────────────────────────────────────────
create or replace function public.generate_batch_number()
returns text language plpgsql as $$
declare
  n int;
begin
  select count(*) + 1 into n from public.production_batches;
  return 'NAK-26-' || lpad(n::text, 3, '0');
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 16. generate_order_number
-- ────────────────────────────────────────────────────────────────
create or replace function public.generate_order_number()
returns text language plpgsql as $$
declare
  n int;
begin
  select count(*) + 1 into n from public.orders;
  return 'ORD-' || lpad(n::text, 3, '0');
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 17. generate_traceability_qr_code
-- ────────────────────────────────────────────────────────────────
create or replace function public.generate_traceability_qr_code(batch_number text)
returns text language sql as $$
  select 'https://nakheel-trace.dz/batch/' || batch_number;
$$;

-- ────────────────────────────────────────────────────────────────
-- 18. calculate_dashboard_metrics
-- ────────────────────────────────────────────────────────────────
create or replace function public.calculate_dashboard_metrics()
returns jsonb language plpgsql as $$
declare
  total_waste_collected numeric;
  total_feed_produced   numeric;
  stock_available       numeric;
  stock_reserved        numeric;
  stock_sold            numeric;
  pending_orders        int;
  delivered_orders      int;
  total_orders          int;
  sales_total           numeric;
  total_suppliers       int;
  total_clients         int;
  complaints_count      int;
  pending_complaints    int;
  batches_count         int;
  batches_approved      int;
  waste_palmes          numeric;
  waste_noyaux          numeric;
  waste_dattes          numeric;
  waste_fibres          numeric;
  waste_melange         numeric;
begin
  select coalesce(sum(estimated_quantity_kg),0) into total_waste_collected
  from public.waste_requests where status in ('collected','received','stored');

  select coalesce(sum(produced_quantity_kg),0) into total_feed_produced
  from public.production_batches where quality_status = 'conforme';

  select coalesce(sum(available_quantity_kg),0) into stock_available from public.inventory;
  select coalesce(sum(reserved_quantity_kg),0)  into stock_reserved  from public.inventory;
  select coalesce(sum(sold_quantity_kg),0)       into stock_sold      from public.inventory;

  select count(*) into pending_orders   from public.orders where status in ('created','confirmed','stock_reserved','preparing','out_for_delivery');
  select count(*) into delivered_orders from public.orders where status in ('delivered','closed');
  select count(*) into total_orders     from public.orders;

  select coalesce(sum(total_amount),0) into sales_total from public.orders where status != 'cancelled';

  select count(*) into total_suppliers from public.profiles where role = 'supplier';
  select count(*) into total_clients   from public.profiles where role = 'client';
  select count(*) into complaints_count    from public.complaints;
  select count(*) into pending_complaints  from public.complaints where status in ('open','in_review');
  select count(*) into batches_count    from public.production_batches;
  select count(*) into batches_approved from public.production_batches where quality_status = 'conforme';

  select coalesce(sum(wr.estimated_quantity_kg),0) into waste_palmes
  from public.waste_requests wr
  join public.raw_material_batches rmb on wr.id = any(rmb.waste_request_ids)
  where rmb.status = 'stored' and wr.waste_type = 'palm_leaves';

  select coalesce(sum(wr.estimated_quantity_kg),0) into waste_dattes
  from public.waste_requests wr
  join public.raw_material_batches rmb on wr.id = any(rmb.waste_request_ids)
  where rmb.status = 'stored' and wr.waste_type = 'dates_low_quality';

  waste_noyaux := waste_dattes + 400;

  select coalesce(sum(wr.estimated_quantity_kg),0) into waste_fibres
  from public.waste_requests wr
  join public.raw_material_batches rmb on wr.id = any(rmb.waste_request_ids)
  where rmb.status = 'stored' and wr.waste_type = 'fibers';

  select coalesce(sum(wr.estimated_quantity_kg),0) into waste_melange
  from public.waste_requests wr
  join public.raw_material_batches rmb on wr.id = any(rmb.waste_request_ids)
  where rmb.status = 'stored' and wr.waste_type = 'mixed';

  return jsonb_build_object(
    'totalFeedProduced',      total_feed_produced,
    'totalWasteAvailable',    waste_palmes + waste_noyaux + waste_dattes + waste_fibres + waste_melange,
    'compliantCount',         batches_approved,
    'totalSuppliers',         total_suppliers,
    'totalClients',           total_clients,
    'totalWasteDeclared',     (select coalesce(sum(estimated_quantity_kg),0) from public.waste_requests),
    'totalWasteAccepted',     (select coalesce(sum(estimated_quantity_kg),0) from public.waste_requests where status in ('accepted','scheduled_for_pickup','collected','received','stored')),
    'totalWasteRejected',     (select coalesce(sum(estimated_quantity_kg),0) from public.waste_requests where status = 'rejected'),
    'totalWasteCollected',    total_waste_collected,
    'batchesCount',           batches_count,
    'batchesApprovedCount',   batches_approved,
    'stockAvailable',         stock_available,
    'stockReserved',          stock_reserved,
    'stockSold',              stock_sold,
    'pendingOrders',          pending_orders,
    'deliveredOrders',        delivered_orders,
    'totalOrdersCount',       total_orders,
    'salesTotal',             sales_total,
    'co2Saved',               round(total_waste_collected * 0.82),
    'supportOasisDA',         total_waste_collected * 15,
    'complaintRatePercent',   case when total_orders > 0 then round((complaints_count::numeric / total_orders) * 100) else 0 end,
    'averageQualityScore',    88,
    'wasteStockRaw',          jsonb_build_object('palmes', waste_palmes, 'noyaux', waste_noyaux, 'dattes', waste_dattes, 'fibres', waste_fibres, 'melange', waste_melange),
    'complaintsCount',        complaints_count,
    'pendingComplaintsCount', pending_complaints
  );
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 19. create_complaint
-- ────────────────────────────────────────────────────────────────
create or replace function public.create_complaint(
  client_id      uuid,
  order_id       text,
  batch_id       text,
  complaint_type text,
  message        text
) returns text language plpgsql security definer as $$
declare
  complaint_id text;
begin
  complaint_id := 'COMP-' || substr(gen_random_uuid()::text, 1, 8);
  insert into public.complaints (id, client_id, order_id, production_batch_id, complaint_type, message)
  values (complaint_id, client_id, order_id, batch_id, complaint_type, message);
  return complaint_id;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- Helper: get current user role (used by RLS)
-- ────────────────────────────────────────────────────────────────
create or replace function public.get_my_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
-- Nakheel Platform — Row Level Security
-- Run AFTER 002_rpc_functions.sql

-- Enable RLS on all tables
alter table public.profiles           enable row level security;
alter table public.suppliers          enable row level security;
alter table public.clients            enable row level security;
alter table public.waste_requests     enable row level security;
alter table public.raw_material_batches enable row level security;
alter table public.products           enable row level security;
alter table public.production_batches enable row level security;
alter table public.quality_checks     enable row level security;
alter table public.inventory          enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;
alter table public.complaints         enable row level security;
alter table public.ai_predictions     enable row level security;

-- ────────────────────────────────────────────────────────────────
-- PROFILES
-- ────────────────────────────────────────────────────────────────
create policy "profiles_select" on public.profiles for select using (
  id = auth.uid() or get_my_role() in ('admin','operator')
);
create policy "profiles_insert" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update" on public.profiles for update using (id = auth.uid());

-- ────────────────────────────────────────────────────────────────
-- WASTE_REQUESTS  (supplier sees own, admin/operator see all)
-- ────────────────────────────────────────────────────────────────
create policy "waste_requests_select" on public.waste_requests for select using (
  supplier_id = auth.uid() or get_my_role() in ('admin','operator')
);
create policy "waste_requests_insert" on public.waste_requests for insert with check (
  supplier_id = auth.uid() and get_my_role() = 'supplier'
);
create policy "waste_requests_update" on public.waste_requests for update using (
  get_my_role() in ('admin','operator')
);

-- ────────────────────────────────────────────────────────────────
-- ORDERS  (client sees own, admin/operator see all)
-- ────────────────────────────────────────────────────────────────
create policy "orders_select" on public.orders for select using (
  client_id = auth.uid() or get_my_role() in ('admin','operator')
);
create policy "orders_insert" on public.orders for insert with check (
  client_id = auth.uid() and get_my_role() = 'client'
);
create policy "orders_update" on public.orders for update using (
  get_my_role() in ('admin','operator')
);

-- ────────────────────────────────────────────────────────────────
-- ORDER_ITEMS  (inherits order visibility)
-- ────────────────────────────────────────────────────────────────
create policy "order_items_select" on public.order_items for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.client_id = auth.uid() or get_my_role() in ('admin','operator'))
  )
);
create policy "order_items_insert" on public.order_items for insert with check (
  get_my_role() in ('client','admin','operator')
);

-- ────────────────────────────────────────────────────────────────
-- COMPLAINTS  (client sees own, admin/operator see all)
-- ────────────────────────────────────────────────────────────────
create policy "complaints_select" on public.complaints for select using (
  client_id = auth.uid() or get_my_role() in ('admin','operator')
);
create policy "complaints_insert" on public.complaints for insert with check (
  client_id = auth.uid() and get_my_role() = 'client'
);
create policy "complaints_update" on public.complaints for update using (
  get_my_role() in ('admin','operator')
);

-- ────────────────────────────────────────────────────────────────
-- All-authenticated-users read (products, batches, inventory, etc.)
-- Admin/operator write
-- ────────────────────────────────────────────────────────────────
create policy "products_select"           on public.products           for select using (auth.uid() is not null);
create policy "products_write"            on public.products           for all    using (get_my_role() in ('admin','operator'));

create policy "production_batches_select" on public.production_batches for select using (auth.uid() is not null);
create policy "production_batches_write"  on public.production_batches for all    using (get_my_role() in ('admin','operator'));

create policy "quality_checks_select"     on public.quality_checks     for select using (auth.uid() is not null);
create policy "quality_checks_write"      on public.quality_checks     for all    using (get_my_role() in ('admin','operator'));

create policy "inventory_select"          on public.inventory          for select using (auth.uid() is not null);
create policy "inventory_write"           on public.inventory          for all    using (get_my_role() in ('admin','operator'));

create policy "raw_material_batches_select" on public.raw_material_batches for select using (auth.uid() is not null);
create policy "raw_material_batches_write"  on public.raw_material_batches for all    using (get_my_role() in ('admin','operator'));

create policy "suppliers_select" on public.suppliers for select using (auth.uid() is not null);
create policy "suppliers_write"  on public.suppliers for all    using (
  get_my_role() in ('admin','operator') or user_id = auth.uid()
);

create policy "clients_select" on public.clients for select using (auth.uid() is not null);
create policy "clients_write"  on public.clients for all    using (
  get_my_role() in ('admin','operator') or user_id = auth.uid()
);

create policy "ai_predictions_select" on public.ai_predictions for select using (auth.uid() is not null);
create policy "ai_predictions_write"  on public.ai_predictions for all    using (get_my_role() in ('admin','operator'));
-- Nakheel — Migration correctif : colonnes manquantes
-- À exécuter APRÈS 001_schema.sql + 002_rpc_functions.sql + 003_rls_policies.sql
-- Ajoute les colonnes utilisées par l'application mais absentes du schéma initial.

-- ── 1. complaints.reply ───────────────────────────────────────────────────────
-- Réponse de l'administrateur à une réclamation client.
-- Utilisée par ManageComplaints (admin) et ClientFeedback (lecture client).
alter table public.complaints
  add column if not exists reply text;

-- ── 2. orders.payment_ref ─────────────────────────────────────────────────────
-- Référence du virement bancaire saisi par l'admin lors de la confirmation paiement.
-- Utilisée par ManageOrders → handleConfirmPayment.
alter table public.orders
  add column if not exists payment_ref text;

-- ── 3. Vérification : toutes les colonnes attendues par supabaseDB.ts ─────────
-- waste_requests : scheduled_date, ai_decision, ai_recommendation (présents dans 001_schema.sql)
-- profiles       : avatar (présent dans 001_schema.sql)
-- Aucune action supplémentaire nécessaire si 001_schema.sql a déjà été exécuté.

-- ── 4. Index utiles (performance) ─────────────────────────────────────────────
create index if not exists idx_waste_requests_supplier  on public.waste_requests (supplier_id);
create index if not exists idx_waste_requests_status    on public.waste_requests (status);
create index if not exists idx_orders_client            on public.orders (client_id);
create index if not exists idx_orders_status            on public.orders (status);
create index if not exists idx_complaints_client        on public.complaints (client_id);
create index if not exists idx_inventory_product        on public.inventory (product_id);
create index if not exists idx_production_batches_date  on public.production_batches (production_date desc);
-- Nakheel Platform — Seed Data
-- Run AFTER migrations 001, 002, 003
-- NOTE: Demo users must first be created via Supabase Auth (Dashboard > Authentication > Users)
-- with the emails below, then their UUIDs used as the 'id' values in profiles.
-- Alternatively, use the signUp() flow from the app and the trigger will auto-create profiles.

-- Products (no auth dependency)
insert into public.products (id, name, animal_target, formula_type, price_per_kg, price_per_bag, bag_weight_kg, description, active, image_url) values
  ('PROD-001', 'Aliment ovins économique',   'sheep',  'economic', 45, 1125, 25, 'Formule équilibrée à base de broyat de palmes séchées et noyaux de dattes.', true, 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=600&q=80'),
  ('PROD-002', 'Aliment ovins standard',     'sheep',  'improved', 62, 1550, 25, 'Enrichi en dattes déclassées à haute valeur énergétique.', true, 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80'),
  ('PROD-003', 'Aliment bovins standard',    'cattle', 'economic', 42, 1680, 40, 'Ration optimisée en fibres végétales de palmier et noyaux moulus.', true, 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80'),
  ('PROD-004', 'Aliment mixte amélioré',     'cattle', 'improved', 58, 2320, 40, 'Concentré hautement énergétique à base de dattes broyées.', true, 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80')
on conflict (id) do nothing;

-- After creating auth users and getting their UUIDs, run:
-- insert into public.profiles (id, full_name, phone, email, role, wilaya, commune) values
--   ('<admin-uuid>',    'Dr. Karim Merabet',  '+213 550 11 22 33', 'admin@nakheel.com',          'admin',    'Alger',   'El Biar'),
--   ('<operator-uuid>', 'Tariq Benouad',       '+213 661 44 55 66', 'operator@nakheel.com',        'operator', 'Biskra',  'Tolga'),
--   ('<supp1-uuid>',   'Ahmed Belkacem',       '+213 550 12 34 56', 'ahmed.biskra@gmail.com',      'supplier', 'Biskra',  'Tolga'),
--   ('<client1-uuid>', 'Yacine Touati',         '+213 661 98 76 54', 'yacine.touati@outlook.com',   'client',   'M''Sila', 'Sidi Aïssa');
--
-- Then insert suppliers/clients with those UUIDs as user_id.
