-- Nakheel — Migration 005 : colonnes modèle économique
-- Ajoute : commission, certification, abonnements opérateur

-- ── 1. orders : commission et certification ───────────────────────────────────
alter table public.orders
  add column if not exists commission_amount       numeric(12,2),
  add column if not exists certification_requested boolean not null default false;

-- ── 2. profiles : abonnement opérateur ───────────────────────────────────────
alter table public.profiles
  add column if not exists subscription_plan    text not null default 'free'
    check (subscription_plan in ('free', 'pro', 'pending_payment')),
  add column if not exists subscription_expiry  timestamptz;

-- ── 3. Index utiles ───────────────────────────────────────────────────────────
create index if not exists idx_profiles_subscription on public.profiles (subscription_plan);
create index if not exists idx_orders_certification  on public.orders (certification_requested) where certification_requested = true;
