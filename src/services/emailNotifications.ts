// Transactional email service via Resend (https://resend.com — 100 emails/day free)
// Falls back silently if RESEND_API_KEY is not configured.

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-blocking: email failure must never crash the app
  }
}

const PRIMARY = '#2E5A44';

function baseTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px">
        <tr><td style="background:${PRIMARY};padding:24px 32px;text-align:center">
          <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:1px">🌴 NAKHEEL</span>
          <p style="color:#c8ddd4;font-size:12px;margin:4px 0 0">Oasis Alimentaire — Filière Durable</p>
        </td></tr>
        <tr><td style="padding:32px">
          <h2 style="color:${PRIMARY};margin:0 0 16px;font-size:18px">${title}</h2>
          ${body}
          <hr style="border:none;border-top:1px solid #e8e8e8;margin:28px 0">
          <p style="color:#999;font-size:11px;margin:0">
            Cet email a été envoyé automatiquement par la plateforme GourFeed.<br>
            Ne pas répondre directement à cet email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function emailOrderConfirmed(
  to: string,
  clientName: string,
  orderId: string,
  totalAmount: number,
  language: 'fr' | 'ar' = 'fr'
): Promise<void> {
  const subject = language === 'ar'
    ? `نخيل — تأكيد طلبيتك رقم ${orderId}`
    : `GourFeed — Confirmation de votre commande ${orderId}`;

  const body = `
    <p style="color:#444;font-size:15px">Bonjour <strong>${clientName}</strong>,</p>
    <p style="color:#444;font-size:15px">
      Votre commande <strong style="color:${PRIMARY}">${orderId}</strong> a été confirmée avec succès.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fbf9;border:1px solid #d0e8da;border-radius:6px;padding:16px;margin:16px 0">
      <tr><td style="color:#666;font-size:14px">Référence commande :</td><td style="font-weight:700;color:${PRIMARY}">${orderId}</td></tr>
      <tr><td style="color:#666;font-size:14px;padding-top:8px">Montant total :</td><td style="font-weight:700;color:${PRIMARY};padding-top:8px">${totalAmount.toLocaleString('fr-DZ')} DA</td></tr>
    </table>
    <p style="color:#444;font-size:14px">
      Votre commande est en cours de préparation. Vous recevrez une notification dès expédition.
    </p>`;

  await sendEmail({ to, subject, html: baseTemplate(subject, body) });
}

export async function emailCollectionScheduled(
  to: string,
  supplierName: string,
  scheduledDate: string,
  wilaya: string,
  language: 'fr' | 'ar' = 'fr'
): Promise<void> {
  const subject = language === 'ar'
    ? `نخيل — تأكيد موعد جمع النفايات بتاريخ ${scheduledDate}`
    : `GourFeed — Collecte programmée le ${scheduledDate}`;

  const body = `
    <p style="color:#444;font-size:15px">Bonjour <strong>${supplierName}</strong>,</p>
    <p style="color:#444;font-size:15px">
      Une collecte de déchets palmiers a été programmée depuis votre exploitation.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fbf9;border:1px solid #d0e8da;border-radius:6px;padding:16px;margin:16px 0">
      <tr><td style="color:#666;font-size:14px">Date de collecte :</td><td style="font-weight:700;color:${PRIMARY}">${scheduledDate}</td></tr>
      <tr><td style="color:#666;font-size:14px;padding-top:8px">Wilaya :</td><td style="font-weight:700;padding-top:8px">${wilaya}</td></tr>
    </table>
    <p style="color:#444;font-size:14px">
      Merci de préparer les déchets secs et triés. L'équipe logistique GourFeed sera sur place à l'heure convenue.
    </p>`;

  await sendEmail({ to, subject, html: baseTemplate(subject, body) });
}

export async function emailPaymentConfirmed(
  to: string,
  clientName: string,
  orderId: string,
  amount: number,
  paymentRef: string,
  language: 'fr' | 'ar' = 'fr'
): Promise<void> {
  const subject = language === 'ar'
    ? `نخيل — تأكيد استلام الدفع للطلبية ${orderId}`
    : `GourFeed — Paiement reçu pour la commande ${orderId}`;

  const body = `
    <p style="color:#444;font-size:15px">Bonjour <strong>${clientName}</strong>,</p>
    <p style="color:#444;font-size:15px">
      Nous avons bien reçu votre règlement pour la commande <strong style="color:${PRIMARY}">${orderId}</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fbf9;border:1px solid #d0e8da;border-radius:6px;padding:16px;margin:16px 0">
      <tr><td style="color:#666;font-size:14px">Montant reçu :</td><td style="font-weight:700;color:${PRIMARY}">${amount.toLocaleString('fr-DZ')} DA</td></tr>
      <tr><td style="color:#666;font-size:14px;padding-top:8px">Référence virement :</td><td style="font-weight:700;padding-top:8px">${paymentRef}</td></tr>
    </table>
    <p style="color:#444;font-size:14px">
      Votre livraison sera expédiée dans les plus brefs délais. Merci de votre confiance.
    </p>`;

  await sendEmail({ to, subject, html: baseTemplate(subject, body) });
}

export async function emailQualityResult(
  to: string,
  supplierName: string,
  batchNumber: string,
  decision: string,
  score: number,
  language: 'fr' | 'ar' = 'fr'
): Promise<void> {
  const approved = decision === 'accepté';
  const subject = language === 'ar'
    ? `نخيل — نتيجة فحص الجودة للدفعة ${batchNumber}`
    : `GourFeed — Résultat qualité Lot ${batchNumber}`;

  const statusColor = approved ? '#27ae60' : '#e74c3c';
  const statusLabel = approved ? '✅ Accepté' : `⚠️ ${decision}`;

  const body = `
    <p style="color:#444;font-size:15px">Bonjour <strong>${supplierName}</strong>,</p>
    <p style="color:#444;font-size:15px">
      L'analyse qualité du lot <strong style="color:${PRIMARY}">${batchNumber}</strong> est disponible.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fbf9;border:1px solid #d0e8da;border-radius:6px;padding:16px;margin:16px 0">
      <tr><td style="color:#666;font-size:14px">Décision qualité :</td><td style="font-weight:700;color:${statusColor}">${statusLabel}</td></tr>
      <tr><td style="color:#666;font-size:14px;padding-top:8px">Score qualité :</td><td style="font-weight:700;padding-top:8px">${score}/100</td></tr>
    </table>
    <p style="color:#444;font-size:14px">
      ${approved
        ? 'Vos déchets palmiers ont passé le contrôle qualité avec succès. Merci pour la qualité de votre collecte.'
        : 'Des ajustements sont nécessaires. L\'équipe technique GourFeed vous contactera pour les détails.'}
    </p>`;

  await sendEmail({ to, subject, html: baseTemplate(subject, body) });
}
