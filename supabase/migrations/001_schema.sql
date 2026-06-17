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
