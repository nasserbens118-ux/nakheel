import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { useToast } from '../../components/Toast';
import { isSupabaseAvailable } from '../../services/supabaseClient';
import { User, SUBSCRIPTION_PRICE_DA, COMMISSION_RATE, SubscriptionPlan } from '../../services/db';

export const ManageSubscriptions: React.FC = () => {
  const { users, orders } = useNakheel();
  const { language } = useLanguage();
  const { toast } = useToast();
  const ar = language === 'ar';

  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    setLocalUsers(users.filter(u => u.role === 'operator'));
  }, [users]);

  const operators = localUsers;

  // Revenue stats
  const totalCommissions = useMemo(() =>
    orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.commissionAmount ?? Math.round(o.totalAmount * COMMISSION_RATE)), 0),
    [orders]
  );

  const proCount = operators.filter(u => u.subscriptionPlan === 'pro').length;
  const subRevenue = proCount * SUBSCRIPTION_PRICE_DA;

  const handleTogglePlan = async (op: User) => {
    const newPlan: SubscriptionPlan = op.subscriptionPlan === 'pro' ? 'free' : 'pro';
    const expiry = newPlan === 'pro' ? (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString(); })() : undefined;
    setLoading(op.id);
    try {
      if (isSupabaseAvailable) {
        const { supabase: sb } = await import('../../services/supabaseClient');
        const { error } = await sb!.from('profiles').update({
          subscription_plan: newPlan,
          subscription_expiry: expiry ?? null,
        }).eq('id', op.id);
        if (error) throw error;
      } else {
        const { NakheelDB } = await import('../../services/db');
        const all = NakheelDB.getUsers().map(u =>
          u.id === op.id ? { ...u, subscriptionPlan: newPlan, subscriptionExpiry: expiry } : u
        );
        NakheelDB.saveUsers(all);
      }
      setLocalUsers(prev => prev.map(u =>
        u.id === op.id ? { ...u, subscriptionPlan: newPlan, subscriptionExpiry: expiry } : u
      ));
      toast(`${op.fullName} → ${newPlan.toUpperCase()} ✓`, 'success');
    } catch {
      toast(ar ? 'خطأ' : 'Erreur', 'error');
    } finally {
      setLoading(null);
    }
  };

  const fmtDA = (n: number) => n.toLocaleString('fr-DZ') + ' DA';

  const expiryLabel = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(ar ? 'ar-DZ' : 'fr-DZ', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
          💳 {ar ? 'إدارة الاشتراكات والإيرادات' : 'Abonnements & Revenus'}
        </h2>
        <p style={{ color: 'gray', fontSize: '0.85rem' }}>
          {ar ? 'إدارة خطط المشغلين ومراقبة إيرادات المنصة.' : 'Gérez les plans opérateurs et surveillez les revenus de la plateforme.'}
        </p>
      </div>

      {/* Revenue KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'gray', marginBottom: '4px' }}>{ar ? 'إيرادات العمولات' : 'Revenus commissions'}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>{fmtDA(totalCommissions)}</div>
          <div style={{ fontSize: '0.7rem', color: 'gray' }}>4% × commandes livrées</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'gray', marginBottom: '4px' }}>{ar ? 'إيرادات الاشتراكات' : 'Revenus abonnements'}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--secondary)' }}>{fmtDA(subRevenue)}</div>
          <div style={{ fontSize: '0.7rem', color: 'gray' }}>{proCount} × {fmtDA(SUBSCRIPTION_PRICE_DA)}</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'gray', marginBottom: '4px' }}>{ar ? 'إجمالي الإيرادات' : 'Total revenus plateforme'}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e67e22' }}>{fmtDA(totalCommissions + subRevenue)}</div>
          <div style={{ fontSize: '0.7rem', color: 'gray' }}>{ar ? 'هذا الشهر' : 'Ce mois'}</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'gray', marginBottom: '4px' }}>{ar ? 'مشغلون Pro' : 'Opérateurs Pro'}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{proCount} / {operators.length}</div>
          <div style={{ fontSize: '0.7rem', color: 'gray' }}>{operators.length > 0 ? Math.round(proCount / operators.length * 100) : 0}% de conversion</div>
        </div>
      </div>

      {/* Operators table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--neutral-border)', fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
          {ar ? 'قائمة المشغلين' : 'Liste des opérateurs'} ({operators.length})
        </div>
        {operators.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'gray' }}>
            {ar ? 'لا يوجد مشغلون بعد' : 'Aucun opérateur enregistré'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--neutral-light)' }}>
                  <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 600, color: 'gray' }}>{ar ? 'المشغل' : 'Opérateur'}</th>
                  <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 600, color: 'gray' }}>{ar ? 'الخطة' : 'Plan'}</th>
                  <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 600, color: 'gray' }}>{ar ? 'تاريخ الانتهاء' : 'Expiration'}</th>
                  <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 600, color: 'gray' }}>{ar ? 'الولاية' : 'Wilaya'}</th>
                  <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontWeight: 600, color: 'gray' }}>{ar ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {operators.map(op => {
                  const isPro = op.subscriptionPlan === 'pro';
                  const isExpired = op.subscriptionExpiry ? new Date(op.subscriptionExpiry) < new Date() : false;
                  return (
                    <tr key={op.id} style={{ borderBottom: '1px solid var(--neutral-border)' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600 }}>{op.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'gray' }}>{op.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {op.subscriptionPlan === 'pending_payment' ? (
                          <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: '#fff8e1', color: '#e65100' }}>
                            ⏳ {ar ? 'في انتظار الدفع' : 'Paiement en attente'}
                          </span>
                        ) : (
                          <span style={{
                            padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                            background: isPro && !isExpired ? '#e8f5e9' : '#f5f5f5',
                            color: isPro && !isExpired ? '#2e7d32' : '#888',
                          }}>
                            {isPro && !isExpired ? '⭐ Pro' : isExpired ? (ar ? 'منتهي الصلاحية' : 'Expiré') : (ar ? 'مجاني' : 'Gratuit')}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: isExpired ? '#e74c3c' : 'inherit' }}>
                        {expiryLabel(op.subscriptionExpiry)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'gray' }}>{op.wilaya || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button
                          className={`btn btn-sm ${isPro && !isExpired ? 'btn-secondary' : 'btn-primary'}`}
                          disabled={loading === op.id}
                          onClick={() => handleTogglePlan(op)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                        >
                          {loading === op.id ? <RefreshCw size={12} className="animate-spin" /> :
                            isPro && !isExpired
                              ? <><XCircle size={12} /> {ar ? 'تعطيل Pro' : 'Désactiver Pro'}</>
                              : <><CheckCircle size={12} /> {ar ? 'تفعيل Pro' : 'Activer Pro'}</>
                          }
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Commission rate info */}
      <div className="card" style={{ padding: '1rem', marginTop: '1rem', background: 'var(--primary-light)', border: 'none' }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--primary)' }}>
          💡 {ar
            ? 'العمولة (4%) تُحسب تلقائياً على كل طلبية. الاشتراك Pro (15 000 د.ج/شهر) يُفعَّل يدوياً من هذه الصفحة بعد تأكيد الدفع.'
            : 'La commission (4%) est calculée automatiquement sur chaque commande. L\'abonnement Pro (15 000 DA/mois) s\'active manuellement ici après confirmation du paiement.'}
        </p>
      </div>
    </div>
  );
};
