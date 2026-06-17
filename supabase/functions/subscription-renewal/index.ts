// Edge Function: subscription-renewal
// Schedule: every day at 02:00 UTC via Supabase CRON
// Déclencher : supabase functions deploy subscription-renewal --schedule "0 2 * * *"
//
// Logique :
//   1. Cherche tous les profils Pro dont subscription_expiry < now()
//   2. Les repasse à 'free'
//   3. Envoie un email de notification via Resend

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (_req) => {
  const db = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Trouver les abonnements Pro expirés
  const { data: expired, error } = await db
    .from('profiles')
    .select('id, full_name, email, subscription_expiry')
    .eq('subscription_plan', 'pro')
    .lt('subscription_expiry', new Date().toISOString());

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!expired || expired.length === 0) {
    return new Response(JSON.stringify({ message: 'Aucun abonnement expiré', count: 0 }), { status: 200 });
  }

  const ids = expired.map((p: { id: string }) => p.id);

  // 2. Repasser à 'free'
  const { error: updateErr } = await db
    .from('profiles')
    .update({ subscription_plan: 'free', subscription_expiry: null })
    .in('id', ids);

  if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 });

  // 3. Envoyer un email de notification à chaque opérateur
  const emailPromises = expired.map((p: { full_name: string; email: string }) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Nakheel <onboarding@resend.dev>',
        to: [p.email],
        subject: 'Votre abonnement Pro Nakheel a expiré',
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto">
            <h2 style="color:#2E5A44">🌴 Nakheel — Abonnement expiré</h2>
            <p>Bonjour <strong>${p.full_name}</strong>,</p>
            <p>Votre abonnement <strong>Pro</strong> est arrivé à échéance. Votre compte est repassé au plan <strong>Gratuit</strong>.</p>
            <p>Pour renouveler et continuer à bénéficier des fonctionnalités avancées (lots illimités, export, support prioritaire), connectez-vous et rendez-vous dans <strong>Mon Abonnement</strong>.</p>
            <a href="https://nakheel.app/operator/subscription"
               style="display:inline-block;background:#2E5A44;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;margin-top:12px">
              Renouveler mon abonnement
            </a>
            <p style="color:gray;font-size:12px;margin-top:24px">Nakheel — Économie circulaire oasienne · Algérie</p>
          </div>
        `,
      }),
    })
  );

  await Promise.allSettled(emailPromises);

  return new Response(
    JSON.stringify({ message: `${ids.length} abonnement(s) expiré(s) traité(s)`, ids }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
