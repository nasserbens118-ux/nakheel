import React, { useState } from 'react';
import { CheckCircle, XCircle, CreditCard, Star, Copy, Clock } from 'lucide-react';
import { useLanguage } from '../../components/LanguageContext';
import { useToast } from '../../components/Toast';
import { isSupabaseAvailable } from '../../services/supabaseClient';
import { SUBSCRIPTION_PRICE_DA, SubscriptionPlan } from '../../services/db';
import { User } from '../../services/db';

interface Props {
  user: User;
  onUserUpdate: (u: User) => void;
}

const FEATURES: { key: string; free: boolean; pro: boolean; fr: string; ar: string }[] = [
  { key: 'declare', free: true, pro: true, fr: 'Collecte et transformation', ar: 'الجمع والتحويل' },
  { key: 'orders', free: true, pro: true, fr: 'Gestion des commandes', ar: 'إدارة الطلبيات' },
  { key: 'batches', free: true, pro: true, fr: 'Traçabilité des lots (5/mois)', ar: 'تتبع الأحزمة (5/شهر)' },
  { key: 'batches_unlimited', free: false, pro: true, fr: 'Lots illimités', ar: 'أحزمة غير محدودة' },
  { key: 'dashboard', free: false, pro: true, fr: 'Dashboard analytique avancé', ar: 'لوحة تحليلية متقدمة' },
  { key: 'export', free: false, pro: true, fr: 'Export données (CSV / PDF)', ar: 'تصدير البيانات' },
  { key: 'certification', free: false, pro: true, fr: 'Certification qualité (tarif réduit)', ar: 'شهادة الجودة (بسعر مخفض)' },
  { key: 'support', free: false, pro: true, fr: 'Support prioritaire', ar: 'دعم ذو أولوية' },
];

export const SubscriptionPage: React.FC<Props> = ({ user, onUserUpdate }) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const ar = language === 'ar';
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(false);

  const plan: SubscriptionPlan = user.subscriptionPlan ?? 'free';
  const isPro = plan === 'pro';

  const expiryLabel = () => {
    if (!user.subscriptionExpiry) return null;
    const d = new Date(user.subscriptionExpiry);
    return d.toLocaleDateString(ar ? 'ar-DZ' : 'fr-DZ', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const CCP_NUMBER = '0097-4500-2881-47';
  const BARIDIMOB_NUMBER = '00799999001234567';

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      // Mark as pending_payment — admin will confirm manually in ManageSubscriptions
      if (isSupabaseAvailable) {
        const { supabase: sb } = await import('../../services/supabaseClient');
        const { error } = await sb!.from('profiles').update({
          subscription_plan: 'pending_payment',
        }).eq('id', user.id);
        if (error) throw error;
      } else {
        const { NakheelDB } = await import('../../services/db');
        const users = NakheelDB.getUsers().map(u =>
          u.id === user.id ? { ...u, subscriptionPlan: 'pending_payment' as SubscriptionPlan } : u
        );
        NakheelDB.saveUsers(users);
      }
      setPendingPayment(true);
      setShowPaymentModal(false);
      toast(ar ? 'تم إرسال طلبك — سيتم التفعيل بعد تأكيد الدفع ✓' : 'Demande envoyée — activation après confirmation du paiement ✓', 'success');
    } catch {
      toast(ar ? 'خطأ' : 'Erreur', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(ar ? 'إلغاء الاشتراك Pro؟' : 'Résilier l\'abonnement Pro ?')) return;
    setLoading(true);
    try {
      if (isSupabaseAvailable) {
        const { supabase: sb } = await import('../../services/supabaseClient');
        const { error } = await sb!.from('profiles').update({
          subscription_plan: 'free',
          subscription_expiry: null,
        }).eq('id', user.id);
        if (error) throw error;
      } else {
        const { NakheelDB } = await import('../../services/db');
        const users = NakheelDB.getUsers().map(u =>
          u.id === user.id ? { ...u, subscriptionPlan: 'free' as SubscriptionPlan, subscriptionExpiry: undefined } : u
        );
        NakheelDB.saveUsers(users);
      }
      const updated: User = { ...user, subscriptionPlan: 'free', subscriptionExpiry: undefined };
      onUserUpdate(updated);
      toast(ar ? 'تم إلغاء الاشتراك' : 'Abonnement résilié', 'success');
    } catch {
      toast(ar ? 'خطأ' : 'Erreur', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
          💳 {ar ? 'إدارة الاشتراك' : 'Mon Abonnement'}
        </h2>
        <p style={{ color: 'gray', fontSize: '0.85rem' }}>
          {ar ? 'اختر الخطة المناسبة لنشاطك.' : 'Choisissez le plan adapté à votre activité.'}
        </p>
      </div>

      {/* Current status banner */}
      {isPro && (
        <div style={{ background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)', border: '1px solid #a5d6a7', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span style={{ fontWeight: 700, color: '#2e7d32', fontSize: '1rem' }}>
              <Star size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
              {ar ? 'أنت على خطة Pro' : 'Vous êtes sur le plan Pro'}
            </span>
            {expiryLabel() && (
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#388e3c' }}>
                {ar ? `تنتهي في ${expiryLabel()}` : `Expire le ${expiryLabel()}`}
              </p>
            )}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleCancel} disabled={loading} style={{ fontSize: '0.78rem' }}>
            {ar ? 'إلغاء الاشتراك' : 'Résilier'}
          </button>
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Free */}
        <div className="card" style={{ padding: '1.25rem', border: !isPro ? '2px solid var(--primary)' : '1px solid var(--neutral-border)', position: 'relative' }}>
          {!isPro && (
            <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', fontSize: '0.68rem', padding: '2px 10px', borderRadius: '999px', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {ar ? 'خطتك الحالية' : 'Plan actuel'}
            </span>
          )}
          <h3 style={{ margin: '0 0 4px', color: 'var(--primary)' }}>{ar ? 'مجاني' : 'Gratuit'}</h3>
          <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'gray' }}>{ar ? 'للبدء والاستكشاف' : 'Pour démarrer'}</p>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>0 DA<span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'gray' }}>{ar ? '/شهر' : '/mois'}</span></div>
          <div style={{ fontSize: '0.8rem', color: 'gray' }}>{ar ? 'يشمل:' : 'Comprend :'}</div>
          {FEATURES.filter(f => f.free).map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.8rem' }}>
              <CheckCircle size={13} color="#27ae60" style={{ flexShrink: 0 }} />
              {ar ? f.ar : f.fr}
            </div>
          ))}
          {FEATURES.filter(f => !f.free).map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.8rem', color: '#bbb' }}>
              <XCircle size={13} color="#ddd" style={{ flexShrink: 0 }} />
              {ar ? f.ar : f.fr}
            </div>
          ))}
        </div>

        {/* Pro */}
        <div className="card" style={{ padding: '1.25rem', border: isPro ? '2px solid var(--primary)' : '1px solid var(--neutral-border)', position: 'relative', background: isPro ? 'rgba(46,90,68,0.03)' : undefined }}>
          {isPro && (
            <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', fontSize: '0.68rem', padding: '2px 10px', borderRadius: '999px', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {ar ? 'خطتك الحالية' : 'Plan actuel'}
            </span>
          )}
          <h3 style={{ margin: '0 0 4px', color: 'var(--primary)' }}>Pro <Star size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /></h3>
          <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'gray' }}>{ar ? 'للمشغلين النشيطين' : 'Pour les opérateurs actifs'}</p>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '16px' }}>
            {SUBSCRIPTION_PRICE_DA.toLocaleString('fr-DZ')} DA
            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'gray' }}>{ar ? '/شهر' : '/mois'}</span>
          </div>
          {FEATURES.map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.8rem' }}>
              <CheckCircle size={13} color="#27ae60" style={{ flexShrink: 0 }} />
              {ar ? f.ar : f.fr}
            </div>
          ))}
          {!isPro && !pendingPayment && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={() => setShowPaymentModal(true)}
              disabled={loading}
            >
              <CreditCard size={15} />
              {ar ? 'الترقية إلى Pro' : 'Passer au Pro'}
            </button>
          )}
          {pendingPayment && (
            <div style={{ marginTop: '1.25rem', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 'var(--radius-sm)', padding: '0.65rem', fontSize: '0.78rem', color: '#e65100', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} />
              {ar ? 'في انتظار تأكيد الدفع من المسؤول' : 'En attente de confirmation admin'}
            </div>
          )}
        </div>
      </div>

      {/* Commission info */}
      <div className="card" style={{ padding: '1rem', background: 'var(--primary-light)', border: 'none' }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--primary)' }}>
          💡 <strong>{ar ? 'العمولة :' : 'Commission :'}</strong>{' '}
          {ar
            ? 'تُطبَّق عمولة 4% تلقائياً على كل طلبية مُكتملة. تظهر في تفاصيل كل طلبية.'
            : 'Une commission de 4% est appliquée automatiquement sur chaque commande finalisée. Elle apparaît dans le détail de chaque commande.'}
        </p>
      </div>

      {/* Payment modal */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '440px', width: '100%', background: 'white', padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
              💳 {ar ? 'تفاصيل الدفع — Pro' : 'Instructions de paiement — Pro'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'gray', marginBottom: '1.25rem' }}>
              {ar
                ? 'أرسل المبلغ على أحد الحسابات أدناه، ثم انقر "تأكيد التحويل". سيقوم المسؤول بتفعيل اشتراكك خلال 24 ساعة.'
                : 'Envoyez le montant sur l\'un des comptes ci-dessous, puis cliquez "Confirmer le virement". L\'admin activera votre abonnement sous 24h.'}
            </p>

            <div style={{ background: '#f9f9f9', border: '1px solid var(--neutral-border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'gray', marginBottom: '4px', fontWeight: 600 }}>
                {ar ? 'المبلغ المطلوب' : 'Montant à payer'}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                {SUBSCRIPTION_PRICE_DA.toLocaleString()} DA
              </div>
              <div style={{ fontSize: '0.72rem', color: 'gray', marginTop: '2px' }}>
                {ar ? 'اشتراك شهري — يُجدَّد كل شهر' : 'Abonnement mensuel renouvelable'}
              </div>
            </div>

            {[
              { label: ar ? 'حساب CCP (بريد الجزائر)' : 'CCP (Algérie Poste)', value: CCP_NUMBER, icon: '🏦' },
              { label: 'BaridiMob', value: BARIDIMOB_NUMBER, icon: '📱' },
            ].map(acc => (
              <div key={acc.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', border: '1px solid var(--neutral-border)', borderRadius: 'var(--radius-sm)', marginBottom: '0.6rem', background: 'white' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'gray', marginBottom: '2px' }}>{acc.icon} {acc.label}</div>
                  <code style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>{acc.value}</code>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(acc.value); toast(ar ? 'تم النسخ ✓' : 'Copié ✓', 'success'); }}
                  style={{ background: 'none', border: '1px solid var(--neutral-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'gray' }}
                >
                  <Copy size={12} /> {ar ? 'نسخ' : 'Copier'}
                </button>
              </div>
            ))}

            <p style={{ fontSize: '0.75rem', color: '#e67e22', margin: '0.75rem 0 1.25rem', fontWeight: 600 }}>
              ⚠️ {ar
                ? 'أضف اسمك الكامل وبريدك الإلكتروني في خانة ملاحظات التحويل.'
                : 'Mentionnez votre nom complet et email dans la note du virement.'}
            </p>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={handleConfirmPayment}
                disabled={loading}
              >
                <CheckCircle size={14} />
                {loading ? '...' : (ar ? 'تأكيد التحويل' : 'Confirmer le virement')}
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPaymentModal(false)}>
                {ar ? 'إلغاء' : 'Annuler'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
