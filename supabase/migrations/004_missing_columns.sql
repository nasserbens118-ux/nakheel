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
