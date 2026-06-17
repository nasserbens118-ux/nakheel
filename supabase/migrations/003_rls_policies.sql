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
