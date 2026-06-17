// Edge Function: stock-alert
// Schedule: every day at 18:00 UTC via Supabase CRON
// Déclencher : supabase functions deploy stock-alert --schedule "0 18 * * *"
//
// Logique :
//   1. Agrège le stock disponible par produit depuis inventory
//   2. Si un produit < seuil (500 kg par défaut), envoie un email à l'admin

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_EMAIL     = Deno.env.get('ADMIN_EMAIL') ?? 'bounouni@gmail.com';
const STOCK_THRESHOLD = Number(Deno.env.get('STOCK_THRESHOLD') ?? 500); // kg

interface InventoryRow { product_id: string; available_quantity_kg: number }
interface ProductRow   { id: string; name: string }

Deno.serve(async (_req) => {
  const db = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Agréger le stock par produit
  const { data: inventory, error: invErr } = await db
    .from('inventory')
    .select('product_id, available_quantity_kg');

  if (invErr) return new Response(JSON.stringify({ error: invErr.message }), { status: 500 });

  const stockByProduct: Record<string, number> = {};
  for (const row of (inventory ?? []) as InventoryRow[]) {
    stockByProduct[row.product_id] = (stockByProduct[row.product_id] ?? 0) + row.available_quantity_kg;
  }

  // 2. Filtrer les produits sous le seuil
  const lowStockIds = Object.entries(stockByProduct)
    .filter(([, qty]) => qty < STOCK_THRESHOLD)
    .map(([id]) => id);

  if (lowStockIds.length === 0) {
    return new Response(JSON.stringify({ message: 'Tous les stocks sont suffisants' }), { status: 200 });
  }

  // 3. Récupérer les noms des produits
  const { data: products } = await db
    .from('products')
    .select('id, name')
    .in('id', lowStockIds);

  const productNames: Record<string, string> = {};
  for (const p of (products ?? []) as ProductRow[]) productNames[p.id] = p.name;

  // 4. Construire le tableau HTML pour l'email
  const rows = lowStockIds.map(id => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${productNames[id] ?? id}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;color:#e74c3c;font-weight:bold">
        ${stockByProduct[id].toLocaleString('fr-DZ')} kg
      </td>
      <td style="padding:8px;border-bottom:1px solid #eee;color:gray">${STOCK_THRESHOLD} kg</td>
    </tr>
  `).join('');

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Nakheel Alertes <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: `⚠️ Alerte stock bas — ${lowStockIds.length} produit(s) sous le seuil`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto">
          <h2 style="color:#2E5A44">🌴 Nakheel — Alerte stock bas</h2>
          <p>${lowStockIds.length} produit(s) sont sous le seuil de <strong>${STOCK_THRESHOLD} kg</strong> :</p>
          <table style="width:100%;border-collapse:collapse;margin-top:12px">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="padding:8px;text-align:left">Produit</th>
                <th style="padding:8px;text-align:left">Stock actuel</th>
                <th style="padding:8px;text-align:left">Seuil</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <a href="https://nakheel.app/admin/batches"
             style="display:inline-block;background:#2E5A44;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;margin-top:20px">
            Créer un nouveau lot de production
          </a>
          <p style="color:gray;font-size:12px;margin-top:24px">Nakheel — Rapport automatique du ${new Date().toLocaleDateString('fr-DZ')}</p>
        </div>
      `,
    }),
  });

  return new Response(
    JSON.stringify({ message: `Alerte envoyée pour ${lowStockIds.length} produit(s)`, lowStockIds }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
