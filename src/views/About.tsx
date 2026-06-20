import React from 'react';
import { Leaf, Target, Users, TrendingUp, MapPin, Mail, Phone, Award, ArrowRight } from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';

interface Props {
  onNavigate: (tab: string) => void;
}

export const About: React.FC<Props> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const stats = [
    { value: '15 t', label: ar ? 'مخلفات محتملة/السنة 1' : 'Déchets valorisables / An 1', sub: ar ? '15 فلاح × 1 000 كغ' : '15 agriculteurs × 1 000 kg' },
    { value: '11,7 t', label: ar ? 'علف حيواني واحاتي' : 'Aliment oasien produit', sub: ar ? 'بمعدل تحويل 78%' : 'Taux de transformation 78 %' },
    { value: '12,3 t', label: ar ? 'CO₂ مُوفَّر' : 'CO₂ économisé', sub: ar ? '0,82 كغ/كغ مخلفات' : '0,82 kg CO₂ / kg déchet' },
    { value: '270 000 DA', label: ar ? 'دخل مباشر للفلاحين' : 'Revenus directs agriculteurs', sub: ar ? '18 د.ج/كغ × 15 000 كغ' : '18 DA/kg × 15 000 kg' },
  ];

  const steps = ar ? [
    { icon: '🌴', title: 'التصريح بالمخلفات', desc: 'يُصرِّح الفلاح الواحاتي بكميات السعف والألياف والتمور المنخفضة الجودة عبر التطبيق.' },
    { icon: '🚛', title: 'الجمع المبرمج', desc: 'يُنظِّم مشغل المركز جدول الجمع ويتواصل مع الفلاح لتحديد الموعد المناسب.' },
    { icon: '⚙️', title: 'التحويل والمعالجة', desc: 'تُطحن المخلفات وتُجفَّف وتُخلط لإنتاج علف حيواني مُتوازن غذائياً.' },
    { icon: '📦', title: 'التسليم والتتبع', desc: 'يُسلَّم العلف للمربين مع رمز QR يتيح تتبع المنشأ حتى الحقل الأصلي.' },
  ] : [
    { icon: '🌴', title: 'Déclaration des déchets', desc: 'L\'agriculteur oasien signale ses quantités de palmes, fibres ou dattes déclassées via l\'application.' },
    { icon: '🚛', title: 'Collecte planifiée', desc: 'L\'opérateur de centre organise la tournée de collecte et confirme la date avec le producteur.' },
    { icon: '⚙️', title: 'Transformation', desc: 'Les résidus sont broyés, séchés et mélangés pour produire un aliment nutritionnellement équilibré.' },
    { icon: '📦', title: 'Livraison traçable', desc: 'L\'éleveur reçoit l\'aliment avec un QR Code permettant de remonter jusqu\'au champ d\'origine.' },
  ];

  const values = ar ? [
    { icon: <Leaf size={22} />, title: 'اقتصاد دائري', desc: 'لا نفايات، كل مخلف يُحوَّل إلى قيمة مضافة.' },
    { icon: <Users size={22} />, title: 'تشارك عادل', desc: 'الفلاحون يتقاضون ثمناً عادلاً مباشرةً عند الجمع.' },
    { icon: <Award size={22} />, title: 'جودة مضمونة', desc: 'كل دفعة خاضعة لتقييم الجودة قبل التسليم.' },
    { icon: <TrendingUp size={22} />, title: 'قابلية التوسع', desc: 'نموذج قابل للنقل إلى كل الواحات الجزائرية.' },
  ] : [
    { icon: <Leaf size={22} />, title: 'Économie circulaire', desc: 'Zéro déchet : chaque résidu devient une ressource à valeur ajoutée.' },
    { icon: <Users size={22} />, title: 'Équité agricole', desc: 'Les producteurs oasiens sont rémunérés directement et équitablement.' },
    { icon: <Award size={22} />, title: 'Qualité garantie', desc: 'Chaque lot est contrôlé avant livraison pour assurer la conformité.' },
    { icon: <TrendingUp size={22} />, title: 'Scalabilité', desc: 'Modèle réplicable dans toutes les oasis algériennes.' },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '860px', margin: '0 auto' }}>

      {/* Hero mission */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #1a3d2b 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '3rem 2rem',
        color: 'white',
        textAlign: 'center',
        marginBottom: '2.5rem',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌴</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>
          {ar ? 'نخيل — الاقتصاد الدائري للواحات الجزائرية' : 'GourFeed — L\'Économie Circulaire des Oasis Algériennes'}
        </h1>
        <p style={{ fontSize: '1.05rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 1.5rem' }}>
          {ar
            ? 'نحوِّل مخلفات النخيل التي تُحرق أو تُهمل في الواحات إلى علف حيواني متوازن، ونُعيد توزيع القيمة على الفلاحين والمربين.'
            : 'Nous transformons les résidus de palmier — brûlés ou abandonnés dans les oasis — en aliment animal équilibré, et redistribuons la valeur aux agriculteurs et éleveurs.'}
        </p>
        <button
          onClick={() => onNavigate('auth')}
          className="btn"
          style={{ background: 'var(--accent)', color: 'white', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', padding: '0.75rem 1.75rem' }}
        >
          {ar ? 'ابدأ التجربة التفاعلية' : 'Essayer la démo interactive'}
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Problem */}
      <div className="card" style={{ marginBottom: '2rem', borderLeft: ar ? 'none' : '4px solid var(--accent)', borderRight: ar ? '4px solid var(--accent)' : 'none' }}>
        <h2 style={{ color: 'var(--primary)', fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} /> {ar ? 'المشكلة التي نحلها' : 'Le problème que nous résolvons'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div>
            <p style={{ color: 'var(--neutral-dark)', lineHeight: 1.7, fontSize: '0.9rem' }}>
              {ar
                ? 'تُنتج واحات جنوب الجزائر (بسكرة، الوادي، ورقلة، غرداية، أدرار) آلاف الأطنان من مخلفات النخيل سنوياً: سعف جاف، ألياف، تمور منخفضة الجودة، نوى. معظمها يُحرق أو يُترك يتعفن، مُتسبِّباً في انبعاثات CO₂ وتلوُّث للتربة.'
                : 'Les oasis du Sud algérien (Biskra, El Oued, Ouargla, Ghardaïa, Adrar) génèrent des milliers de tonnes de résidus de palmier chaque année : palmes sèches, fibres, dattes déclassées, noyaux. La majorité est brûlée ou laissée à pourrir, générant du CO₂ et polluant les sols.'}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--neutral-dark)', lineHeight: 1.7, fontSize: '0.9rem' }}>
              {ar
                ? 'في نفس الوقت، يعاني مربو المواشي في المناطق المجاورة من نقص العلف وارتفاع أسعاره. يغيب التواصل بين الطرفين، ولا توجد سلسلة إمداد منظَّمة تربط الفلاح بالمربي.'
                : 'Dans le même temps, les éleveurs des régions voisines souffrent d\'un manque d\'aliment et de prix élevés. La chaîne d\'approvisionnement entre producteur et éleveur est absente. GourFeed crée ce maillon manquant.'}
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--primary)', fontSize: '1.25rem', marginBottom: '1.25rem', textAlign: 'center' }}>
          {ar ? 'كيف يعمل نخيل ؟' : 'Comment fonctionne GourFeed ?'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {steps.map((s, i) => (
            <div key={i} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>{i + 1}. {s.title}</div>
                <div style={{ fontSize: '0.83rem', color: 'gray', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Year 1 projections */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--primary)', fontSize: '1.25rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          {ar ? 'الأثر المتوقع — السنة الأولى' : 'Impact projeté — Année 1'}
        </h2>
        <p style={{ color: 'gray', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1.25rem' }}>
          {ar ? '* تقديرات موثقة — لا بيانات تشغيلية حقيقية بعد' : '* Projections documentées — aucune donnée opérationnelle réelle à ce stade'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {stats.map((s, i) => (
            <div key={i} className="card" style={{ textAlign: 'center', borderTop: '3px solid var(--primary)' }}>
              <div className="numeric" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', direction: 'ltr' }}>{s.value}</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'gray', marginTop: '2px' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--primary)', fontSize: '1.25rem', marginBottom: '1.25rem', textAlign: 'center' }}>
          {ar ? 'قيمنا الجوهرية' : 'Nos valeurs'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {values.map((v, i) => (
            <div key={i} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }}>{v.icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>{v.title}</div>
                <div style={{ fontSize: '0.83rem', color: 'gray', lineHeight: 1.6 }}>{v.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Business model */}
      <div className="card" style={{ marginBottom: '2rem', background: 'var(--primary-light)', border: '1px solid var(--primary-light)' }}>
        <h2 style={{ color: 'var(--primary)', fontSize: '1.15rem', marginBottom: '1rem' }}>
          💡 {ar ? 'نموذج الإيرادات' : 'Modèle économique'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.88rem' }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
              {ar ? 'اشتراك Pro — 15 000 د.ج/شهر' : 'Abonnement Pro — 15 000 DA/mois'}
            </div>
            <div style={{ color: 'gray', lineHeight: 1.6 }}>
              {ar
                ? 'مشغلو المراكز يدفعون اشتراكاً شهرياً للوصول إلى كامل مميزات المنصة: أحزمة غير محدودة، لوحة تحليلية، تصدير بيانات.'
                : 'Les opérateurs de centre paient un abonnement mensuel pour accéder à toutes les fonctionnalités : lots illimités, tableau analytique, export données.'}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
              {ar ? 'عمولة 4% على الطلبيات المُكتملة' : 'Commission 4 % sur chaque commande livrée'}
            </div>
            <div style={{ color: 'gray', lineHeight: 1.6 }}>
              {ar
                ? 'نخيل تتقاضى 4% من قيمة كل طلبية علف مُوصَّلة. نخيل تكسب عندما يكسب الجميع.'
                : 'GourFeed prélève 4 % du montant de chaque commande livrée. GourFeed gagne quand tout le monde gagne.'}
            </div>
          </div>
        </div>
      </div>

      {/* Geographic reach */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--primary)', fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={18} /> {ar ? 'المناطق المستهدفة — المرحلة الأولى' : 'Zones cibles — Phase 1'}
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['Biskra (Tolga / Ouled Djellal)', 'El Oued (Guemar / Reguiba)', 'Ouargla (Hassi Messaoud)', 'Ghardaïa (Metlili)', 'Adrar (Timimoun)'].map(w => (
            <span key={w} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
              📍 {w}
            </span>
          ))}
        </div>
        <p style={{ color: 'gray', fontSize: '0.8rem', marginTop: '0.75rem' }}>
          {ar
            ? 'المرحلة الثانية: توسع إلى تمنراست، الأغواط، وولايات الشريط الصحراوي الجزائري.'
            : 'Phase 2 : extension à Tamanrasset, Laghouat, et l\'ensemble du chapelet oasien algérien.'}
        </p>
      </div>

      {/* Contact */}
      <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #f8fdf9, white)' }}>
        <h2 style={{ color: 'var(--primary)', fontSize: '1.15rem', marginBottom: '0.5rem' }}>
          {ar ? 'تواصل معنا' : 'Nous contacter'}
        </h2>
        <p style={{ color: 'gray', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          {ar ? 'مستثمرون، شركاء، فلاحون — نرحب بكم.' : 'Investisseurs, partenaires, agriculteurs — bienvenue.'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', fontSize: '0.88rem' }}>
          <a href="mailto:contact@nakheel.dz" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontWeight: 600 }}>
            <Mail size={16} /> contact@nakheel.dz
          </a>
          <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <Phone size={16} /> +213 (0) 7XX XX XX XX
          </span>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '1rem' }}>
          {ar ? 'نخيل — شركة ناشئة جزائرية، 2025' : 'GourFeed — Startup algérienne, 2025'} • Biskra, Algérie
        </p>
      </div>

    </div>
  );
};
