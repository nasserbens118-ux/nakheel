import React from 'react';
import { Leaf, Sprout, ShieldCheck, ArrowRight, TrendingUp, Globe, Recycle, CheckCircle, XCircle, Star, Building2, Phone, Smartphone, Download, Wifi } from 'lucide-react';
import { SUBSCRIPTION_PRICE_DA } from '../services/db';
import { useLanguage } from '../components/LanguageContext';

interface HomeProps {
  onNavigate: (page: string) => void;
}

// Projections Année 1 — hypothèses documentées
// Base : 15 agriculteurs oasiens, ~1 000 kg déchets collectables/an/agriculteur
// Taux de transformation : 78% | Prix achat : 18 DA/kg | CO₂ : 0,82 kg/kg évité
const YEAR1_PROJECTIONS = {
  totalWasteCollected: 15000,   // 15 agriculteurs × 1 000 kg
  totalFeedProduced:   11700,   // 15 000 × 78%
  co2Saved:            12300,   // 15 000 × 0,82
  supportOasisDA:      270000,  // 15 000 × 18 DA/kg
};

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();

  const formatNumber = (num: number, unit: string) => {
    return `${num.toLocaleString()} ${unit}`;
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '5rem 0 4rem 0',
        background: 'linear-gradient(135deg, hsl(145, 63%, 12%) 0%, hsl(145, 63%, 24%) 100%)',
        color: 'white',
        overflow: 'hidden',
        borderBottom: '6px solid var(--accent)'
      }}>
        {/* Background decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(230,126,34,0.1) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(46,204,113,0.1) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1.5rem',
              color: 'var(--accent)'
            }}>
              <Recycle size={14} /> {t('home.tag')}
            </span>
            <h1 style={{
              color: 'white',
              fontSize: '2.8rem',
              marginBottom: '1.5rem',
              fontFamily: 'var(--font-display)',
              lineHeight: '1.15',
              fontWeight: 800
            }}>
              {t('home.slogan')}
            </h1>
            <p style={{
              fontSize: '1.15rem',
              color: 'rgba(255, 255, 255, 0.85)',
              marginBottom: '2.5rem',
              fontWeight: 400,
              lineHeight: '1.6'
            }}>
              {t('home.description')}
            </p>
            <div className="hero-buttons" style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => onNavigate('auth')}
                className="btn btn-accent"
                style={{ padding: '0.9rem 2rem', fontSize: '1.05rem', gap: '0.5rem' }}
              >
                {t('home.login')} {language === 'ar' ? <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} /> : <ArrowRight size={18} />}
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-demo-drawer'));
                }}
                className="btn btn-secondary"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  padding: '0.9rem 2rem',
                  fontSize: '1.05rem'
                }}
              >
                {t('home.interactive_demo')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Impact Metrics Counters */}
      <section style={{ padding: '3rem 0', backgroundColor: 'white', borderBottom: '1px solid var(--neutral-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
              Projections Année 1
            </h2>
            <p style={{ color: 'gray' }}>Estimations basées sur 15 agriculteurs oasiens, ~1 000 kg collectables/an/agriculteur, taux de transformation 78%</p>
            <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.25rem' }}>
              * Projections modèle — aucune donnée opérationnelle réelle à ce stade
            </p>
          </div>
          
          <div className="stats-grid grid grid-2 grid-4" style={{ gap: '1.5rem' }}>
            <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem', borderLeft: language === 'ar' ? 'none' : '4px solid var(--secondary)', borderRight: language === 'ar' ? '4px solid var(--secondary)' : 'none' }}>
              <div style={{ color: 'var(--secondary)', display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', marginBottom: '1rem' }}>
                <Leaf size={24} />
              </div>
              <h3 className="numeric" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', margin: '0.25rem 0' }}>
                {formatNumber(YEAR1_PROJECTIONS.totalWasteCollected, 'kg')}
              </h3>
              <p style={{ color: 'var(--neutral-dark)', fontWeight: 600, fontSize: '0.9rem' }}>{t('home.metric_waste')}</p>
              <span style={{ fontSize: '0.8rem', color: 'gray' }}>{t('home.metric_waste_sub')}</span>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem', borderLeft: language === 'ar' ? 'none' : '4px solid var(--accent)', borderRight: language === 'ar' ? '4px solid var(--accent)' : 'none' }}>
              <div style={{ color: 'var(--accent)', display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'var(--accent-light)', marginBottom: '1rem' }}>
                <Sprout size={24} />
              </div>
              <h3 className="numeric" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', margin: '0.25rem 0' }}>
                {formatNumber(YEAR1_PROJECTIONS.totalFeedProduced, 'kg')}
              </h3>
              <p style={{ color: 'var(--neutral-dark)', fontWeight: 600, fontSize: '0.9rem' }}>{t('home.metric_feed')}</p>
              <span style={{ fontSize: '0.8rem', color: 'gray' }}>{t('home.metric_feed_sub')}</span>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem', borderLeft: language === 'ar' ? 'none' : '4px solid #3498db', borderRight: language === 'ar' ? '4px solid #3498db' : 'none' }}>
              <div style={{ color: '#3498db', display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: '#ebf5fb', marginBottom: '1rem' }}>
                <Globe size={24} />
              </div>
              <h3 className="numeric" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', margin: '0.25rem 0' }}>
                {formatNumber(YEAR1_PROJECTIONS.co2Saved, 'kg')}
              </h3>
              <p style={{ color: 'var(--neutral-dark)', fontWeight: 600, fontSize: '0.9rem' }}>{t('home.metric_co2')}</p>
              <span style={{ fontSize: '0.8rem', color: 'gray' }}>{t('home.metric_co2_sub')}</span>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem', borderLeft: language === 'ar' ? 'none' : '4px solid #9b59b6', borderRight: language === 'ar' ? '4px solid #9b59b6' : 'none' }}>
              <div style={{ color: '#9b59b6', display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: '#f5eef8', marginBottom: '1rem' }}>
                <TrendingUp size={24} />
              </div>
              <h3 className="numeric" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', margin: '0.25rem 0' }}>
                {formatNumber(YEAR1_PROJECTIONS.supportOasisDA, 'DA')}
              </h3>
              <p style={{ color: 'var(--neutral-dark)', fontWeight: 600, fontSize: '0.9rem' }}>{t('home.metric_revenues')}</p>
              <span style={{ fontSize: '0.8rem', color: 'gray' }}>{t('home.metric_revenues_sub')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Circular Economy Flow Section */}
      <section id="impact-section" style={{ padding: '5rem 0', backgroundColor: 'var(--neutral-light)' }}>
        <div className="container">
          <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.2rem', color: 'var(--primary)', marginBottom: '1rem' }}>
              {t('home.cycle_title')}
            </h2>
            <p style={{ color: 'gray', fontSize: '1.05rem' }}>
              {t('home.cycle_desc')}
            </p>
          </div>

          <div className="grid grid-2 grid-4" style={{ gap: '1.5rem' }}>
            <div className="card" style={{ position: 'relative', overflow: 'hidden', borderTop: '4px solid var(--primary)' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Recycle size={20} /> {t('home.card_circular')}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--neutral-dark)' }}>
                {t('home.card_circular_desc')}
              </p>
            </div>

            <div className="card" style={{ position: 'relative', overflow: 'hidden', borderTop: '4px solid var(--secondary)' }}>
              <div style={{ color: 'var(--secondary)', marginBottom: '0.75rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sprout size={20} /> {t('home.card_nutrition')}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--neutral-dark)' }}>
                {t('home.card_nutrition_desc')}
              </p>
            </div>

            <div className="card" style={{ position: 'relative', overflow: 'hidden', borderTop: '4px solid var(--accent)' }}>
              <div style={{ color: 'var(--accent)', marginBottom: '0.75rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} /> {t('home.card_traceability')}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--neutral-dark)' }}>
                {t('home.card_traceability_desc')}
              </p>
            </div>

            <div className="card" style={{ position: 'relative', overflow: 'hidden', borderTop: '4px solid #3498db' }}>
              <div style={{ color: '#3498db', marginBottom: '0.75rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} /> {t('home.card_ai')}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--neutral-dark)' }}>
                {t('home.card_ai_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ padding: '5rem 0', background: 'white', borderBottom: '1px solid var(--neutral-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700, padding: '4px 14px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              {language === 'ar' ? 'الأسعار' : 'Tarifs'}
            </span>
            <h2 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
              {language === 'ar' ? 'نموذج اقتصادي شفاف' : 'Un modèle économique transparent'}
            </h2>
            <p style={{ color: 'gray', fontSize: '1rem', maxWidth: '560px', margin: '0 auto' }}>
              {language === 'ar'
                ? 'ابدأ مجاناً، طوّر نشاطك مع Pro، أو تواصل معنا للحلول المؤسسية.'
                : 'Démarrez gratuitement, évoluez avec Pro, ou contactez-nous pour les solutions entreprises.'}
            </p>
          </div>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', maxWidth: '960px', margin: '0 auto' }}>

            {/* FREE */}
            <div className="card" style={{ padding: '2rem', border: '1px solid var(--neutral-border)', position: 'relative' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ margin: '0 0 4px', color: 'var(--text)', fontSize: '1.1rem' }}>{language === 'ar' ? 'مجاني' : 'Gratuit'}</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'gray' }}>{language === 'ar' ? 'للمنتجين الصغار' : 'Pour démarrer'}</p>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.25rem' }}>0 DA</div>
              <div style={{ fontSize: '0.8rem', color: 'gray', marginBottom: '1.5rem' }}>{language === 'ar' ? '/شهر' : '/mois'}</div>
              {[
                language === 'ar' ? 'إعلان المخلفات وجمعها' : 'Déclaration & collecte des déchets',
                language === 'ar' ? 'إدارة الطلبيات الأساسية' : 'Gestion des commandes basique',
                language === 'ar' ? 'تتبع 5 أحزمة/شهر' : '5 lots tracés / mois',
                language === 'ar' ? 'رمز QR للتتبع' : 'QR code traçabilité',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <CheckCircle size={14} color="#27ae60" style={{ flexShrink: 0 }} /> {f}
                </div>
              ))}
              {[
                language === 'ar' ? 'لوحة تحليلية متقدمة' : 'Dashboard analytique avancé',
                language === 'ar' ? 'تصدير البيانات' : 'Export données CSV/PDF',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.82rem', color: '#bbb' }}>
                  <XCircle size={14} color="#ddd" style={{ flexShrink: 0 }} /> {f}
                </div>
              ))}
              <button onClick={() => onNavigate('auth')} className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }}>
                {language === 'ar' ? 'ابدأ مجاناً' : 'Commencer gratuitement'}
              </button>
            </div>

            {/* PRO */}
            <div className="card" style={{ padding: '2rem', border: '2px solid var(--primary)', position: 'relative', background: 'var(--primary-light)' }}>
              <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '3px 14px', borderRadius: '999px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                ⭐ {language === 'ar' ? 'الأكثر شعبية' : 'Le plus populaire'}
              </span>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ margin: '0 0 4px', color: 'var(--primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Pro <Star size={14} color="var(--accent)" style={{ verticalAlign: '-2px' }} />
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'gray' }}>{language === 'ar' ? 'للمشغلين النشيطين' : 'Pour les opérateurs actifs'}</p>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                {SUBSCRIPTION_PRICE_DA.toLocaleString('fr-DZ')} DA
              </div>
              <div style={{ fontSize: '0.8rem', color: 'gray', marginBottom: '1.5rem' }}>{language === 'ar' ? '/شهر — يُجدَّد شهرياً' : '/mois · renouvelable'}</div>
              {[
                language === 'ar' ? 'كل مميزات المجاني' : 'Tout le plan Gratuit',
                language === 'ar' ? 'أحزمة غير محدودة' : 'Lots illimités',
                language === 'ar' ? 'لوحة تحليلية متقدمة' : 'Dashboard analytique avancé',
                language === 'ar' ? 'تصدير البيانات CSV/PDF' : 'Export données CSV / PDF',
                language === 'ar' ? 'شهادة الجودة (سعر مخفض)' : 'Certification qualité (tarif réduit)',
                language === 'ar' ? 'دعم ذو أولوية' : 'Support prioritaire',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <CheckCircle size={14} color="#27ae60" style={{ flexShrink: 0 }} /> {f}
                </div>
              ))}
              <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', background: 'rgba(46,90,68,0.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                💰 {language === 'ar' ? 'عمولة 4% على كل طلبية مكتملة' : 'Commission 4% sur chaque commande finalisée'}
              </div>
              <button onClick={() => onNavigate('auth')} className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }}>
                {language === 'ar' ? 'الترقية إلى Pro' : 'Passer au Pro'}
              </button>
            </div>

            {/* ENTREPRISE */}
            <div className="card" style={{ padding: '2rem', border: '1px solid var(--neutral-border)', position: 'relative' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ margin: '0 0 4px', color: 'var(--text)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={16} color="var(--accent)" /> {language === 'ar' ? 'مؤسسي' : 'Entreprise'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'gray' }}>{language === 'ar' ? 'للتعاونيات والولايات' : 'Coopératives & wilayas'}</p>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.25rem' }}>
                {language === 'ar' ? 'حسب الطلب' : 'Sur devis'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'gray', marginBottom: '1.5rem' }}>{language === 'ar' ? 'تخصيص كامل' : 'Personnalisé'}</div>
              {[
                language === 'ar' ? 'كل مميزات Pro' : 'Tout le plan Pro',
                language === 'ar' ? 'تكامل مع أنظمة الولاية / MADR' : 'Intégration Wilaya / MADR',
                language === 'ar' ? 'مشغلون ومنتجون غير محدودون' : 'Opérateurs & fournisseurs illimités',
                language === 'ar' ? 'API مخصص' : 'API dédié',
                language === 'ar' ? 'تدريب وإعداد مخصص' : 'Formation & onboarding dédié',
                language === 'ar' ? 'عقد SLA مضمون' : 'Contrat SLA garanti',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <CheckCircle size={14} color="#27ae60" style={{ flexShrink: 0 }} /> {f}
                </div>
              ))}
              <a href="mailto:contact@nakheel.dz" className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}>
                <Phone size={14} /> {language === 'ar' ? 'تواصل معنا' : 'Nous contacter'}
              </a>
            </div>
          </div>

          {/* Commission note */}
          <div style={{ textAlign: 'center', marginTop: '2.5rem', padding: '1rem 1.5rem', background: 'var(--neutral-light)', borderRadius: 'var(--radius-md)', maxWidth: '680px', margin: '2.5rem auto 0' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'gray' }}>
              💡 <strong style={{ color: 'var(--primary)' }}>{language === 'ar' ? 'كيف يربح نخيل ؟' : 'Comment GourFeed génère des revenus ?'}</strong>{' '}
              {language === 'ar'
                ? 'اشتراك شهري Pro (15,000 د.ج) + عمولة 4% على كل طلبية مكتملة. نخيل يربح عندما تربح أنت.'
                : 'Abonnement Pro mensuel (15 000 DA) + commission 4% sur chaque commande finalisée. GourFeed gagne quand vous gagnez.'}
            </p>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section style={{ padding: '5rem 0', background: 'linear-gradient(135deg, hsl(145,63%,12%) 0%, hsl(145,63%,20%) 100%)', color: 'white' }}>
        <div className="container">
          <div className="mobile-section-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center', maxWidth: '960px', margin: '0 auto' }}>

            {/* Left: text */}
            <div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.35rem 1rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: '1.25rem' }}>
                <Smartphone size={13} /> {language === 'ar' ? 'تطبيق أندرويد' : 'Application Android'}
              </span>
              <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
                {language === 'ar' ? 'نخيل في جيبك' : 'GourFeed dans votre poche'}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.65, marginBottom: '2rem' }}>
                {language === 'ar'
                  ? 'أدر طلباتك، تابع جمع المخلفات، واستلم التنبيهات أينما كنت. تطبيق أندرويد مجاني ويعمل بدون إنترنت.'
                  : 'Gérez vos demandes, suivez vos collectes et recevez des notifications où que vous soyez. Application Android gratuite, fonctionne hors ligne.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {[
                  language === 'ar' ? 'جميع أدوار المنصة (فلاح، مشتري، مشغل)' : 'Tous les rôles (Fournisseur, Client, Opérateur)',
                  language === 'ar' ? 'إشعارات فورية للطلبيات' : 'Notifications push en temps réel',
                  language === 'ar' ? 'يعمل على Android 8 وما فوق' : 'Compatible Android 8+',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)' }}>
                    <CheckCircle size={15} color="#4ade80" style={{ flexShrink: 0 }} /> {item}
                  </div>
                ))}
              </div>

              <a
                href="https://github.com/nasserbens118-ux/nakheel/releases/download/v1.0.0-android/app-debug.apk"
                download
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  background: 'var(--accent)', color: 'white',
                  padding: '0.9rem 1.75rem', borderRadius: 'var(--radius-md)',
                  fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(161,98,7,0.4)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
              >
                <Download size={18} />
                {language === 'ar' ? 'تحميل APK — مجاني' : 'Télécharger l\'APK — Gratuit'}
              </a>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.6rem' }}>
                {language === 'ar' ? 'الإصدار 1.0.0 · 6.1 MB · يتطلب تفعيل "مصادر غير معروفة"' : 'v1.0.0 · 6.1 MB · Nécessite "Sources inconnues"'}
              </p>
            </div>

            {/* Right: phone mockup */}
            <div className="phone-mockup" style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '220px', height: '420px',
                background: 'rgba(255,255,255,0.06)',
                border: '2px solid rgba(255,255,255,0.15)',
                borderRadius: '36px',
                padding: '12px',
                boxShadow: '0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                position: 'relative',
              }}>
                {/* Notch */}
                <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '999px', margin: '0 auto 12px' }} />
                {/* Screen */}
                <div style={{ background: 'hsl(145,63%,8%)', borderRadius: '24px', height: 'calc(100% - 30px)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
                  {/* App bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Leaf size={14} color="white" />
                    </div>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>GourFeed</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Wifi size={10} color="rgba(255,255,255,0.4)" />
                    </div>
                  </div>
                  {/* Stat cards */}
                  {[
                    { label: language === 'ar' ? 'الطلبيات النشطة' : 'Demandes actives', value: '3', color: '#4ade80' },
                    { label: language === 'ar' ? 'كمية مجموعة' : 'Quantité collectée', value: '1 200 kg', color: 'var(--accent)' },
                    { label: language === 'ar' ? 'الرصيد' : 'Solde', value: '21 600 DA', color: '#60a5fa' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', marginBottom: '3px' }}>{s.label}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                  {/* Notification pill */}
                  <div style={{ marginTop: 'auto', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '10px', padding: '8px 10px', fontSize: '0.6rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={10} /> {language === 'ar' ? 'تم قبول طلبك ✓' : 'Demande acceptée ✓'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Role CTA Demo Section */}
      <section style={{ padding: '4rem 0', background: 'white' }}>
        <div className="container">
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, var(--primary-light) 0%, rgba(255, 255, 255, 0.9) 100%)',
            border: '2px dashed var(--secondary)',
            padding: '2.5rem',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center'
          }}>
            <h2 style={{ color: 'var(--primary)', fontSize: '1.8rem', marginBottom: '1rem' }}>
              {t('home.demo_title')}
            </h2>
            <p style={{ color: 'var(--neutral-dark)', maxWidth: '650px', margin: '0 auto 2rem auto', fontSize: '1rem' }}>
              {t('home.demo_desc')}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => onNavigate('auth')} className="btn btn-primary">
                {t('home.demo_button')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
