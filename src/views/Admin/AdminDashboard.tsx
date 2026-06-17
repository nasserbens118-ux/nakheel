import React, { useMemo } from 'react';
import { Leaf, Award, BarChart2, AlertCircle, TrendingUp, Package, ShieldAlert, DollarSign, Users, Percent } from 'lucide-react';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { BarChart, HBarChart, FunnelChart, buildMonthlyData } from '../../components/Charts';
import { SUBSCRIPTION_PRICE_DA } from '../../services/db';

interface AdminDashboardProps {
  onSubTabChange: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSubTabChange }) => {
  const { wasteRequests, orders, complaints, products, metrics, inventory, users } = useNakheel();
  const { language } = useLanguage();

  // ── Chart data ────────────────────────────────────────────────────────────
  const monthlyWaste = useMemo(() =>
    buildMonthlyData(wasteRequests, it => (it as any).estimatedQuantityKg ?? 0, 6),
    [wasteRequests]);

  const monthlyRevenue = useMemo(() =>
    buildMonthlyData(orders, it => (it as any).totalAmount ?? 0, 6),
    [orders]);

  const topWilayas = useMemo(() => {
    const counts: Record<string, number> = {};
    wasteRequests.forEach(r => {
      const supplier = users.find(u => u.id === r.supplierId);
      const wilaya = supplier?.wilaya ?? r.location?.split(',')[0] ?? 'Autre';
      counts[wilaya] = (counts[wilaya] ?? 0) + r.estimatedQuantityKg;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [wasteRequests, users]);

  const funnelSteps = useMemo(() => [
    { label: language === 'ar' ? 'مصرّح به' : 'Déclarés', value: wasteRequests.length },
    { label: language === 'ar' ? 'مقبول' : 'Acceptés', value: wasteRequests.filter(r => ['accepted','scheduled_for_pickup','collected','received','stored'].includes(r.status)).length },
    { label: language === 'ar' ? 'مجموع' : 'Collectés', value: wasteRequests.filter(r => ['collected','received','stored'].includes(r.status)).length },
    { label: language === 'ar' ? 'مُحوَّل' : 'Transformés', value: orders.filter(o => o.status !== 'cancelled').length },
  ], [wasteRequests, orders, language]);

  const getProductStock = (productId: string): number => {
    return inventory
      .filter(i => i.productId === productId)
      .reduce((sum, i) => sum + i.availableQuantityKg, 0);
  };

  const getWasteLabel = (type: string) => {
    if (language === 'ar') {
      if (type === 'palm_leaves') return 'سعف جاف';
      if (type === 'fibers') return 'ألياف واحاتية';
      if (type === 'dates_low_quality') return 'تمور منخفضة الجودة';
      return 'مزيج واحاتي';
    }
    const WASTE_LABELS: Record<string, string> = {
      palm_leaves: 'Palmes sèches',
      fibers: 'Fibres oasiennes',
      dates_low_quality: 'Dattes déclassées',
      mixed: 'Mélange oasien'
    };
    return WASTE_LABELS[type] || type;
  };

  const getProductName = (prodId: string, defaultName: string) => {
    if (language === 'ar') {
      if (prodId === 'PROD-001') return 'علف خروف واحاتي اقتصادي';
      if (prodId === 'PROD-002') return 'علف خروف معياري محسّن';
      if (prodId === 'PROD-003') return 'علف أبقار معياري';
      if (prodId === 'PROD-004') return 'علف مختلط محسّن';
    }
    return defaultName;
  };

  const pendingWasteCount = wasteRequests.filter(w => w.status === 'submitted' || w.status === 'ai_scored').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'created' || o.status === 'confirmed' || o.status === 'preparing').length;
  const pendingComplaintsCount = complaints.filter(c => c.status === 'open' || c.status === 'in_review').length;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)' }}>
          {language === 'ar' ? 'لوحة المراقبة والتحكم نخيل' : 'Console de Supervision Nakheel'}
        </h2>
        <p style={{ color: 'gray', fontSize: '0.9rem' }}>
          {language === 'ar' ? 'متابعة اللوجستيات، الإنتاج ومطابقة الجودة للشركة الناشئة' : 'Suivi logistique, production et conformité qualité de la startup'}
        </p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-2 grid-4" style={{ gap: '1.25rem', marginBottom: '2.5rem' }}>
        
        {/* STAT 1: Déchets disponibles */}
        <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid var(--secondary)', borderRight: language === 'ar' ? '4px solid var(--secondary)' : 'none' }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', color: 'gray', fontSize: '0.8rem', fontWeight: 700 }}>
            <span>{language === 'ar' ? 'المخلفات المتوفرة' : 'DÉCHETS DISPONIBLES'}</span>
            <Leaf size={16} style={{ color: 'var(--secondary)' }} />
          </div>
          <h3 className="numeric" style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>
            {metrics.totalWasteAvailable.toLocaleString()} kg
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>
            📦 <span className="numeric" style={{ direction: 'ltr' }}>{metrics.totalWasteCollected.toLocaleString()} kg</span> {language === 'ar' ? 'مجمعة' : 'collectés'}
          </p>
        </div>

        {/* STAT 2: Chiffre d'Affaires */}
        <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid var(--accent)', borderRight: language === 'ar' ? '4px solid var(--accent)' : 'none' }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', color: 'gray', fontSize: '0.8rem', fontWeight: 700 }}>
            <span>{language === 'ar' ? 'المداخيل المفوترة' : 'REVENU FACTURÉ'}</span>
            <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="numeric" style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>
            {metrics.salesTotal.toLocaleString()} DA
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'gray' }}>
            <span className="numeric">{metrics.totalOrdersCount}</span> {language === 'ar' ? 'طلبات إجمالية' : 'commandes totales'}
          </p>
        </div>

        {/* STAT 3: Lots conformes */}
        <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid #3498db', borderRight: language === 'ar' ? '4px solid #3498db' : 'none' }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', color: 'gray', fontSize: '0.8rem', fontWeight: 700 }}>
            <span>{language === 'ar' ? 'الدفعات المطابقة' : 'LOTS CONFORMES'}</span>
            <Award size={16} style={{ color: '#3498db' }} />
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0', display: 'flex', gap: '0.25rem', alignItems: 'baseline', justifyContent: language === 'ar' ? 'flex-start' : 'flex-start' }}>
            <span className="numeric" style={{ direction: 'ltr' }}>{metrics.compliantCount}</span> 
            <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>{language === 'ar' ? 'دفعة' : 'lots'}</span>
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--status-approved)', fontWeight: 600 }}>
            ✓ {language === 'ar' ? 'بطاقات جودة المختبر المصادق عليها' : 'Fiches qualité labo validées'}
          </p>
        </div>

        {/* STAT 4: Taux de réclamation */}
        <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid #e74c3c', borderRight: language === 'ar' ? '4px solid #e74c3c' : 'none' }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', color: 'gray', fontSize: '0.8rem', fontWeight: 700 }}>
            <span>{language === 'ar' ? 'معدل الشكاوى' : 'TAUX RÉCLAMATIONS'}</span>
            <ShieldAlert size={16} style={{ color: '#e74c3c' }} />
          </div>
          <h3 className="numeric" style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>
            {metrics.complaintRatePercent}%
          </h3>
          <p style={{ fontSize: '0.75rem', color: metrics.pendingComplaintsCount > 0 ? '#e74c3c' : 'gray', fontWeight: 600 }}>
            ⚠️ <span className="numeric">{metrics.pendingComplaintsCount}</span> {language === 'ar' ? 'قيد المعالجة' : 'en attente'}
          </p>
        </div>

      </div>

      {/* ── Revenus Nakheel ──────────────────────────────────────────────── */}
      {(() => {
        const completedOrders = orders.filter(o => o.status === 'delivered' || (o.status as string) === 'shipped');
        const totalCommissions = completedOrders.reduce((sum, o) => sum + (o.commissionAmount ?? o.totalAmount * 0.04), 0);
        const proUsersCount = users.filter(u => u.subscriptionPlan === 'pro').length;
        const totalSubscriptions = proUsersCount * SUBSCRIPTION_PRICE_DA;
        const totalNakheel = totalCommissions + totalSubscriptions;
        return (
          <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', borderLeft: language === 'ar' ? 'none' : '4px solid #8e44ad', borderRight: language === 'ar' ? '4px solid #8e44ad' : 'none', background: 'linear-gradient(to right, rgba(142,68,173,0.04), transparent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <DollarSign size={16} color="#8e44ad" />
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#8e44ad', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {language === 'ar' ? 'إيرادات نخيل (النموذج الاقتصادي)' : 'Revenus Nakheel — Modèle Économique'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'gray', fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Percent size={11} /> {language === 'ar' ? 'عمولات المعاملات (4%)' : 'Commissions transactions (4%)'}
                </div>
                <div className="numeric" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8e44ad' }}>
                  {Math.round(totalCommissions).toLocaleString('fr-DZ')} DA
                </div>
                <div style={{ fontSize: '0.72rem', color: 'gray' }}>
                  {language === 'ar' ? `على ${completedOrders.length} طلبية مكتملة` : `sur ${completedOrders.length} commande(s) livrée(s)`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'gray', fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={11} /> {language === 'ar' ? 'اشتراكات Pro الشهرية' : 'Abonnements Pro mensuels'}
                </div>
                <div className="numeric" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8e44ad' }}>
                  {totalSubscriptions.toLocaleString('fr-DZ')} DA
                </div>
                <div style={{ fontSize: '0.72rem', color: 'gray' }}>
                  {language === 'ar' ? `${proUsersCount} مشغل Pro × ${SUBSCRIPTION_PRICE_DA.toLocaleString()} د.ج` : `${proUsersCount} opérateur(s) Pro × ${SUBSCRIPTION_PRICE_DA.toLocaleString()} DA`}
                </div>
              </div>
              <div style={{ borderLeft: language === 'ar' ? 'none' : '2px solid #e8d5f5', borderRight: language === 'ar' ? '2px solid #e8d5f5' : 'none', paddingLeft: language === 'ar' ? '0' : '1rem', paddingRight: language === 'ar' ? '1rem' : '0' }}>
                <div style={{ fontSize: '0.72rem', color: 'gray', fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={11} /> {language === 'ar' ? 'الإيراد الإجمالي للمنصة' : 'Revenu total plateforme'}
                </div>
                <div className="numeric" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6c3483' }}>
                  {Math.round(totalNakheel).toLocaleString('fr-DZ')} DA
                </div>
                <div style={{ fontSize: '0.72rem', color: '#8e44ad', fontWeight: 600 }}>
                  {language === 'ar' ? 'إيراد نخيل هذا الشهر' : 'Revenu Nakheel ce mois'}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Analytics Charts ─────────────────────────────────────────────── */}
      <div className="grid grid-2" style={{ gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <BarChart
            data={monthlyWaste}
            unit=" kg"
            title={language === 'ar' ? 'المخلفات المصرّح بها (كغ/شهر)' : 'Déchets déclarés (kg/mois)'}
            color="var(--secondary)"
            language={language}
          />
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <BarChart
            data={monthlyRevenue}
            unit=" DA"
            title={language === 'ar' ? 'الإيرادات الشهرية (د.ج)' : 'Revenus mensuels (DA)'}
            color="var(--accent)"
            language={language}
          />
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <FunnelChart
            steps={funnelSteps}
            title={language === 'ar' ? 'قمع التحويل' : 'Entonnoir de conversion'}
          />
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <HBarChart
            data={topWilayas}
            unit=" kg"
            title={language === 'ar' ? 'أكثر الولايات إنتاجاً' : 'Top wilayas productrices'}
            color="var(--primary)"
          />
        </div>
      </div>

      {/* Action alerts panel */}
      {(pendingWasteCount > 0 || pendingOrdersCount > 0 || pendingComplaintsCount > 0) && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #fdf9f2 0%, #faf3e8 100%)', 
          border: '1px solid #e5d9c3',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} style={{ color: 'var(--accent)' }} />
            <div>
              <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>
                {language === 'ar' ? 'إجراءات بانتظار المعالجة :' : 'Actions en attente de traitement :'}
              </strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--neutral-dark)', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                {pendingWasteCount > 0 && <span onClick={() => onSubTabChange('waste')} style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>📥 {pendingWasteCount} {language === 'ar' ? 'جمع مخلفات' : 'collectes déchets'}</span>}
                {pendingOrdersCount > 0 && <span onClick={() => onSubTabChange('orders')} style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>📦 {pendingOrdersCount} {language === 'ar' ? 'طلبيات للتأكيد' : 'commandes à valider'}</span>}
                {pendingComplaintsCount > 0 && <span onClick={() => onSubTabChange('complaints')} style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>💬 {pendingComplaintsCount} {language === 'ar' ? 'آراء/شكاوى' : 'avis/réclamations'}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: SVG chart and Stocks */}
      <div className="grid grid-2" style={{ gap: '2rem', alignItems: 'stretch' }}>
        
        {/* SVG Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              <BarChart2 size={18} /> {language === 'ar' ? 'السجل الشهري لعمليات الجمع (بالطن)' : 'Historique Mensuel de Collecte (Tonnes)'}
            </h3>
            
            <svg viewBox="0 0 400 180" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              <line x1="40" y1="20" x2="380" y2="20" stroke="#f2efe9" strokeWidth="1" />
              <line x1="40" y1="60" x2="380" y2="60" stroke="#f2efe9" strokeWidth="1" />
              <line x1="40" y1="100" x2="380" y2="100" stroke="#f2efe9" strokeWidth="1" />
              <line x1="40" y1="140" x2="380" y2="140" stroke="#d5d0c4" strokeWidth="1" />

              <text x="30" y="24" fill="gray" fontSize="10" textAnchor="end">3.0t</text>
              <text x="30" y="64" fill="gray" fontSize="10" textAnchor="end">2.0t</text>
              <text x="30" y="104" fill="gray" fontSize="10" textAnchor="end">1.0t</text>
              <text x="30" y="144" fill="gray" fontSize="10" textAnchor="end">0</text>

              <rect x="70" y="108" width="30" height="32" fill="var(--primary)" rx="2" style={{ opacity: 0.65 }} />
              <rect x="130" y="92" width="30" height="48" fill="var(--primary)" rx="2" style={{ opacity: 0.75 }} />
              <rect x="190" y="56" width="30" height="84" fill="var(--primary)" rx="2" style={{ opacity: 0.85 }} />
              <rect x="250" y="28" width="30" height="112" fill="var(--primary)" rx="2" style={{ opacity: 0.95 }} />
              <rect x="310" y="12" width="30" height="128" fill="var(--accent)" rx="2" />

              <text x="85" y="160" fill="gray" fontSize="10" textAnchor="middle">{language === 'ar' ? 'جانفي' : 'Jan'}</text>
              <text x="145" y="160" fill="gray" fontSize="10" textAnchor="middle">{language === 'ar' ? 'فيفري' : 'Fév'}</text>
              <text x="205" y="160" fill="gray" fontSize="10" textAnchor="middle">{language === 'ar' ? 'مارس' : 'Mar'}</text>
              <text x="265" y="160" fill="gray" fontSize="10" textAnchor="middle">{language === 'ar' ? 'أفريل' : 'Avr'}</text>
              <text x="325" y="160" fill="gray" fontSize="10" textAnchor="middle">{language === 'ar' ? 'ماي (جاري)' : 'Mai (En cours)'}</text>
            </svg>
          </div>
          
          <div style={{ fontSize: '0.8rem', color: 'gray', marginTop: '1rem', borderTop: '1px solid var(--neutral-border)', paddingTop: '0.5rem' }}>
            💡 {language === 'ar' ? 'اللوجستيات: زادت عمليات الجمع المحسنة بنسبة 35% هذا الثلاثي.' : 'Logistique : La collecte optimisée a augmenté de 35% ce trimestre.'}
          </div>
        </div>

        {/* Real-time Inventory Stocks */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <Package size={18} /> {language === 'ar' ? 'المخزون الفعلي في المستودع المركزي' : 'Stocks Physiques en Dépôt Central'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Raw Waste Stocks */}
            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'gray', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>
                {language === 'ar' ? 'المواد الأولية الواحاتية المتوفرة' : 'Matières premières oasiennes disponibles'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(metrics.wasteStockRaw).map(([name, qty]) => (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span>{getWasteLabel(name)}</span>
                      <span className="numeric" style={{ direction: 'ltr' }}>{(qty as number).toLocaleString()} kg</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--neutral-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.min(100, ((qty as number) / 4000) * 100)}%`, 
                        height: '100%', 
                        backgroundColor: (qty as number) < 500 ? 'var(--status-rejected)' : 'var(--secondary)' 
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Finished Feed Bag Stocks */}
            <div style={{ borderTop: '1px dashed var(--neutral-border)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'gray', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>
                {language === 'ar' ? 'الأعلاف المعبأة الجاهزة للبيع' : 'Aliments ensachés prêts à la vente'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {products.map(p => {
                  const pStock = getProductStock(p.id);
                  return (
                    <div key={p.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span>{getProductName(p.id, p.name)}</span>
                        <span className="numeric" style={{ direction: 'ltr' }}>{pStock.toLocaleString()} kg</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--neutral-border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${Math.min(100, (pStock / 8000) * 100)}%`, 
                          height: '100%', 
                          backgroundColor: pStock < 1000 ? 'var(--status-pending)' : 'var(--primary)' 
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
