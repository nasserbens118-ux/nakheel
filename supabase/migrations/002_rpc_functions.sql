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
