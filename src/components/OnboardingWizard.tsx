import React, { useState } from 'react';
import { User } from '../services/db';
import { useLanguage } from './LanguageContext';

interface Props {
  user: User;
  onComplete: () => void;
}

const STEPS_SUPPLIER = [
  { icon: '🌴', key: 'welcome' },
  { icon: '📋', key: 'profile' },
  { icon: '🚛', key: 'first_action' },
];
const STEPS_CLIENT = [
  { icon: '🌾', key: 'welcome' },
  { icon: '🐑', key: 'herd' },
  { icon: '📦', key: 'first_action' },
];
const STEPS_OTHER = [
  { icon: '📊', key: 'welcome' },
  { icon: '✅', key: 'ready' },
];

export function OnboardingWizard({ user, onComplete }: Props) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [step, setStep] = useState(0);

  const steps =
    user.role === 'supplier' ? STEPS_SUPPLIER :
    user.role === 'client'   ? STEPS_CLIENT   : STEPS_OTHER;

  const total = steps.length;
  const current = steps[step];

  const next = () => { if (step < total - 1) setStep(s => s + 1); else complete(); };
  const complete = () => {
    localStorage.setItem(`nakheel_onboarded_${user.id}`, '1');
    onComplete();
  };

  const firstName = user.fullName.split(' ')[0];

  const renderContent = () => {
    const key = current.key;
    const role = user.role;

    // ── Supplier steps ──────────────────────────────────────────
    if (role === 'supplier') {
      if (key === 'welcome') return (
        <Content
          ar={ar}
          title={ar ? `أهلاً بك يا ${firstName} 👋` : `Bienvenue, ${firstName} ! 👋`}
          body={ar
            ? 'أنت الآن منتجاً واحاتياً شريكاً في منصة نخيل. ستتمكن من تصريح مخلفاتك وتتبع عمليات الجمع والحصول على تعويض عادل.'
            : 'Vous rejoignez la plateforme GourFeed en tant que Producteur Oasien. Vous allez pouvoir déclarer vos résidus de palmier, suivre les collectes et recevoir une rémunération équitable.'
          }
          tip={ar ? '💡 كل كيلوغرام مُجمع = 15 د.ج في حسابك' : '💡 Chaque kg collecté = 15 DA crédité sur votre compte'}
        />
      );
      if (key === 'profile') return (
        <Content
          ar={ar}
          title={ar ? 'ملفك الشخصي' : 'Votre profil'}
          body={ar
            ? `لقد أنشأنا حسابك بنجاح في ولاية ${user.wilaya || '—'}. تأكد أن رقم هاتفك وبلديتك صحيحان حتى يتمكن السائق من الوصول إليك.`
            : `Votre compte a été créé dans la wilaya de ${user.wilaya || '—'}. Vérifiez que votre téléphone et commune sont corrects pour que le chauffeur puisse vous localiser.`
          }
          tip={ar ? '📍 يمكنك تعديل معلوماتك في أي وقت من قسم "ملفي الشخصي"' : '📍 Modifiez vos infos à tout moment depuis "Mon Profil"'}
        />
      );
      if (key === 'first_action') return (
        <Content
          ar={ar}
          title={ar ? 'ابدأ أول تصريح 🌴' : 'Faites votre première déclaration 🌴'}
          body={ar
            ? 'انقر على "التصريح بالمخلفات" في القائمة الجانبية، أدخل كمية السعف أو الألياف المتاحة، وأرفق صورة. سيتم تقييم جودة المادة فور الاستلام.'
            : 'Cliquez sur "Déclarer Déchet" dans le menu, indiquez la quantité de palmes ou fibres disponibles et joignez une photo. La qualité sera évaluée à réception.'
          }
          tip={ar ? '✅ بعد الموافقة سيتصل بك المشغّل لتحديد موعد الجمع' : '✅ Après acceptation, l\'opérateur vous contacte pour planifier la collecte'}
        />
      );
    }

    // ── Client steps ──────────────────────────────────────────
    if (role === 'client') {
      if (key === 'welcome') return (
        <Content
          ar={ar}
          title={ar ? `أهلاً بك يا ${firstName} 👋` : `Bienvenue, ${firstName} ! 👋`}
          body={ar
            ? 'أنت الآن مربّياً شريكاً في منصة نخيل. اطلب أعلافك المصنوعة من نفايات النخيل الجزائري مباشرة عبر المنصة مع ضمان التتبع الكامل.'
            : 'Vous rejoignez GourFeed en tant qu\'Éleveur Partenaire. Commandez vos aliments fabriqués à partir de résidus de palmier algérien, avec traçabilité complète par QR code.'
          }
          tip={ar ? '💡 كل طلب مرتبط برقم دفعة إنتاج قابل للتتبع عبر رمز QR' : '💡 Chaque commande est liée à un lot de production traçable par QR code'}
        />
      );
      if (key === 'herd') return (
        <Content
          ar={ar}
          title={ar ? 'قطيعك وحاجياتك' : 'Votre troupeau & besoins'}
          body={ar
            ? 'تقدّم المنصة نوعين من الأعلاف: أعلاف الأغنام (25 كغ/كيس) وأعلاف الأبقار (40 كغ/كيس). اختر الصيغة المناسبة لتركيبة قطيعك.'
            : 'La plateforme propose deux gammes : aliments ovins (sacs 25 kg) et aliments bovins (sacs 40 kg). Choisissez la formule adaptée à la composition de votre troupeau.'
          }
          tip={ar ? '📦 الحد الأدنى للطلب: 200 كغ — التوصيل لجميع الولايات' : '📦 Commande minimum : 200 kg — Livraison sur toutes les wilayas'}
        />
      );
      if (key === 'first_action') return (
        <Content
          ar={ar}
          title={ar ? 'اطلب أول دفعة 📦' : 'Passez votre première commande 📦'}
          body={ar
            ? 'انتقل إلى "دليل الأعلاف"، اختر المنتج المناسب لقطيعك، حدد الكمية وأسلوب الاستلام (توصيل أو استلام مباشر).'
            : 'Rendez-vous dans "Catalogue Aliments", choisissez le produit adapté à votre troupeau, précisez la quantité et le mode de réception (livraison ou retrait).'
          }
          tip={ar ? '🔍 بعد التسليم يمكنك مسح رمز QR لمعرفة مصدر الأعلاف بالضبط' : '🔍 Après livraison, scannez le QR code pour connaître l\'origine exacte de l\'aliment'}
        />
      );
    }

    // ── Admin / Operator steps ──────────────────────────────────
    if (key === 'welcome') return (
      <Content
        ar={ar}
        title={ar ? `أهلاً بك يا ${firstName} 👋` : `Bienvenue, ${firstName} ! 👋`}
        body={ar
          ? `لقد انضممت إلى منصة نخيل بصفة ${user.role === 'admin' ? 'مدير' : 'مشغّل'}. يمكنك إدارة جميع عمليات المنصة من لوحة التحكم.`
          : `Vous rejoignez GourFeed en tant que ${user.role === 'admin' ? 'Administrateur' : 'Opérateur'}. Gérez toutes les opérations de la plateforme depuis votre tableau de bord.`
        }
        tip={ar ? '📊 ابدأ بمراجعة لوحة التحكم لمتابعة حالة المنصة' : '📊 Commencez par le tableau de bord pour surveiller l\'état de la plateforme'}
      />
    );
    return (
      <Content
        ar={ar}
        title={ar ? 'أنت جاهز ✅' : 'Vous êtes prêt ✅'}
        body={ar ? 'استكشف المنصة وابدأ العمل.' : 'Explorez la plateforme et commencez à travailler.'}
        tip=""
      />
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.55)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: 'white', borderRadius: 'var(--radius-lg)',
        maxWidth: '480px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>
        {/* Progress bar */}
        <div style={{ height: '4px', background: 'var(--neutral-border)' }}>
          <div style={{
            height: '100%', background: 'var(--primary)',
            width: `${((step + 1) / total) * 100}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {steps.map((_, i) => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: i <= step ? 'var(--primary)' : 'var(--neutral-border)',
                  transition: 'background 0.2s',
                }} />
              ))}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'gray' }}>
              {ar ? `${step + 1} / ${total}` : `${step + 1} / ${total}`}
            </span>
          </div>

          {/* Icon */}
          <div style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>
            {current.icon}
          </div>

          {renderContent()}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', justifyContent: 'flex-end' }}>
            {step > 0 && (
              <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>
                {ar ? '→ السابق' : '← Précédent'}
              </button>
            )}
            <button className="btn btn-primary" onClick={next} style={{ minWidth: '120px' }}>
              {step < total - 1
                ? (ar ? 'التالي ←' : 'Suivant →')
                : (ar ? 'ابدأ الآن 🚀' : 'Commencer 🚀')}
            </button>
          </div>

          {/* Skip */}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button onClick={complete} style={{
              background: 'none', border: 'none', color: 'gray',
              fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline',
            }}>
              {ar ? 'تخطي هذه الخطوات' : 'Passer l\'introduction'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Content({ title, body, tip, ar }: { title: string; body: string; tip: string; ar: boolean }) {
  return (
    <div style={{ textAlign: ar ? 'right' : 'left' }}>
      <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>{title}</h3>
      <p style={{ color: '#444', lineHeight: 1.6, fontSize: '0.9rem', marginBottom: tip ? '1rem' : 0 }}>{body}</p>
      {tip && (
        <div style={{
          background: 'var(--primary-light)', border: '1px solid rgba(46,90,68,0.15)',
          borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem',
          fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 500,
        }}>
          {tip}
        </div>
      )}
    </div>
  );
}
