import React from 'react';
import { Leaf, Sprout, ShieldCheck, ArrowRight, TrendingUp, Globe, Recycle, CheckCircle, XCircle, Star, Building2, Phone } from 'lucide-react';
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
            <div style={{
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
          
          <div className="grid grid-2 grid-4" style={{ gap: '1.5rem' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', maxWidth: '960px', margin: '0 auto' }}>

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
              💡 <strong style={{ color: 'var(--primary)' }}>{language === 'ar' ? 'كيف يربح نخيل ؟' : 'Comment Nakheel génère des revenus ?'}</strong>{' '}
              {language === 'ar'
                ? 'اشتراك شهري Pro (15,000 د.ج) + عمولة 4% على كل طلبية مكتملة. نخيل يربح عندما تربح أنت.'
                : 'Abonnement Pro mensuel (15 000 DA) + commission 4% sur chaque commande finalisée. Nakheel gagne quand vous gagnez.'}
            </p>
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
