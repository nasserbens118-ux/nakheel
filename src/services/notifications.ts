// Nakheel — Browser Notification Service (free, no external API)

export type NotifType = 'collection' | 'order' | 'quality' | 'complaint' | 'payment';

interface NakheelNotif {
  title: string;
  body: string;
  type: NotifType;
  icon?: string;
}

const ICON = '/favicon.ico';

async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function show(notif: NakheelNotif) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification(notif.title, {
    body:    notif.body,
    icon:    notif.icon ?? ICON,
    badge:   ICON,
    tag:     notif.type,
    silent:  false,
  });
  setTimeout(() => n.close(), 8000);
}

// Call once on app init to warm up permission
export async function initNotifications(): Promise<void> {
  await requestPermission();
}

// ─── Typed helpers ─────────────────────────────────────────────────────────

export async function notifyCollectionScheduled(supplierName: string, date: string, language: 'fr' | 'ar' = 'fr'): Promise<void> {
  if (!(await requestPermission())) return;
  show({
    type:  'collection',
    title: language === 'ar' ? '🚚 تأكيد موعد الجمع — نخيل' : '🚚 Collecte programmée — Nakheel',
    body:  language === 'ar'
      ? `موعد جمع مخلفات ${supplierName} مؤكد بتاريخ ${date}.`
      : `La collecte des déchets de ${supplierName} est confirmée pour le ${date}.`,
  });
}

export async function notifyOrderStatusChanged(orderRef: string, newStatus: string, language: 'fr' | 'ar' = 'fr'): Promise<void> {
  if (!(await requestPermission())) return;
  const labels: Record<string, { fr: string; ar: string }> = {
    confirmed:        { fr: 'confirmée',         ar: 'تم تأكيد الطلبية' },
    stock_reserved:   { fr: 'stock réservé',     ar: 'تم حجز المخزون' },
    preparing:        { fr: 'en préparation',    ar: 'قيد التجهيز' },
    out_for_delivery: { fr: 'en cours de livraison', ar: 'في الطريق إليك' },
    delivered:        { fr: 'livrée ✅',         ar: 'تم التسليم ✅' },
    cancelled:        { fr: 'annulée',           ar: 'ملغاة' },
  };
  const label = labels[newStatus];
  show({
    type:  'order',
    title: language === 'ar' ? `📦 طلبية ${orderRef}` : `📦 Commande ${orderRef}`,
    body:  language === 'ar'
      ? `${label?.ar ?? newStatus}`
      : `Statut mis à jour : ${label?.fr ?? newStatus}.`,
  });
}

export async function notifyQualityResult(batchNumber: string, decision: 'conforme' | 'rejeté' | 'à vérifier', language: 'fr' | 'ar' = 'fr'): Promise<void> {
  if (!(await requestPermission())) return;
  const icon = decision === 'conforme' ? '✅' : decision === 'rejeté' ? '❌' : '⚠️';
  show({
    type:  'quality',
    title: language === 'ar' ? `${icon} نتيجة مراقبة الجودة — ${batchNumber}` : `${icon} Contrôle qualité — ${batchNumber}`,
    body:  language === 'ar'
      ? `قرار التحليل: ${decision === 'conforme' ? 'مطابق للمعايير' : decision === 'rejeté' ? 'مرفوض' : 'قيد المراجعة'}`
      : `Décision : ${decision}. Consultez le tableau de bord opérateur.`,
  });
}

export async function notifyPaymentConfirmed(orderRef: string, amount: number, language: 'fr' | 'ar' = 'fr'): Promise<void> {
  if (!(await requestPermission())) return;
  show({
    type:  'payment',
    title: language === 'ar' ? `💰 تأكيد الدفع — ${orderRef}` : `💰 Paiement confirmé — ${orderRef}`,
    body:  language === 'ar'
      ? `تم استلام مبلغ ${amount.toLocaleString()} دج.`
      : `Règlement de ${amount.toLocaleString()} DA reçu et validé.`,
  });
}

export async function notifyComplaintReceived(clientName: string, language: 'fr' | 'ar' = 'fr'): Promise<void> {
  if (!(await requestPermission())) return;
  show({
    type:  'complaint',
    title: language === 'ar' ? '📬 شكوى جديدة — نخيل' : '📬 Nouvelle réclamation — Nakheel',
    body:  language === 'ar'
      ? `${clientName} أرسل شكوى جديدة تتطلب المتابعة.`
      : `${clientName} a soumis une réclamation. Veuillez la traiter.`,
  });
}
