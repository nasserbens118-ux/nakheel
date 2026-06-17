// Edge Function: commission-report
// Schedule: 1er de chaque mois à 06:00 UTC
// Déclencher : supabase functions deploy commission-report --schedule "0 6 1 * *"
//
// Logique :
//   1. Agrège les commandes livrées du mois précédent
//   2. Calcule commissions + revenus abonnements Pro
//   3. Envoie un rapport email à l'admin

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_EMAIL    = Deno.env.get('ADMIN_EMAIL') ?? 'bounouni@gmail.com';
const SUB_PRICE      = 15000; // DA/mois

interface OrderRow { total_amount: number; commission_amount: number | null }

Deno.serve(async (_req) => {
  const db = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Période : mois précédent
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end   = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthLabel = start.toLocaleDateString('fr-DZ', { month: 'long', year: 'numeric' });

  // 1. Commandes livrées du mois précédent
  const { data: orders, error: ordErr } = await db
    .from('orders')
    .select('total_amount, commission_amount')
    .eq('status', 'delivered')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString());

  if (ordErr) return new Response(JSON.stringify({ error: ordErr.message }), { status: 500 });

  const rows = (orders ?? []) as OrderRow[];
  const totalGMV        = rows.reduce((s, o) => s + o.total_amount, 0);
  const totalCommission = rows.reduce((s, o) => s + (o.commission_amount ?? Math.round(o.total_amount * 0.04)), 0);
  const orderCount      = rows.length;

  // 2. Abonnements Pro actifs ce mois
  const { count: proCount } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_plan', 'pro');

  const subRevenue = (proCount ?? 0) * SUB_PRICE;

  // 3. Demandes de certification ce mois
  const { count: certCount } = await db
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('certification_requested', true)
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString());

  const certRevenue = (certCount ?? 0) * 8000;

  const totalRevenue = totalCommission + subRevenue + certRevenue;

  const fmt = (n: number) => n.toLocaleString('fr-DZ') + ' DA';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Nakheel Rapports <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: `📊 Rapport mensuel Nakheel — ${monthLabel}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto">
          <h2 style="color:#2E5A44">🌴 Nakheel — Rapport mensuel</h2>
          <p style="color:gray">${monthLabel}</p>

          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr style="background:#f9f9f9">
              <td style="padding:12px;border-bottom:1px solid #eee">📦 Commandes livrées</td>
              <td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;text-align:right">${orderCount}</td>
            </tr>
            <tr>
              <td style="padding:12px;border-bottom:1px solid #eee">💰 Volume total (GMV)</td>
              <td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;text-align:right">${fmt(totalGMV)}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:12px;border-bottom:1px solid #eee">🔢 Revenus commissions (4%)</td>
              <td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;text-align:right;color:#27ae60">${fmt(totalCommission)}</td>
            </tr>
            <tr>
              <td style="padding:12px;border-bottom:1px solid #eee">⭐ Abonnements Pro (${proCount ?? 0} × 15 000 DA)</td>
              <td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;text-align:right;color:#27ae60">${fmt(subRevenue)}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:12px;border-bottom:1px solid #eee">🏅 Certifications qualité (${certCount ?? 0} × 8 000 DA)</td>
              <td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;text-align:right;color:#27ae60">${fmt(certRevenue)}</td>
            </tr>
            <tr style="background:#e8f5e9">
              <td style="padding:14px;font-weight:bold;font-size:16px">🏆 Total revenus Nakheel</td>
              <td style="padding:14px;font-weight:bold;font-size:16px;text-align:right;color:#2E5A44">${fmt(totalRevenue)}</td>
            </tr>
          </table>

          <a href="https://nakheel.app/admin/dashboard"
             style="display:inline-block;background:#2E5A44;color:white;padding:10px 24px;border-radius:6px;text-decoration:none">
            Voir le dashboard complet
          </a>
          <p style="color:gray;font-size:12px;margin-top:24px">Rapport généré automatiquement le ${now.toLocaleDateString('fr-DZ')} · Nakheel</p>
        </div>
      `,
    }),
  });

  return new Response(
    JSON.stringify({ monthLabel, orderCount, totalGMV, totalCommission, subRevenue, certRevenue, totalRevenue }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
