import React from 'react';
import { Leaf, DollarSign, Calendar, AlertCircle, PlusCircle, ArrowRight } from 'lucide-react';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { User, NakheelDB, WasteType } from '../../services/db';

interface SupplierDashboardProps {
  user: User;
  onSubTabChange: (tab: string) => void;
}

export const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ user, onSubTabChange }) => {
  const { wasteRequests } = useNakheel();
  const { t, language } = useLanguage();
  const allWaste = wasteRequests.filter(w => w.supplierId === user.id);
  const profile = NakheelDB.getSuppliers().find(s => s.userId === user.id);

  const totalQtyDeclared = allWaste.reduce((sum, w) => sum + w.estimatedQuantityKg, 0);
  const collectedWaste = allWaste.filter(w => ['collected', 'received', 'stored'].includes(w.status));
  const totalQtyCollected = collectedWaste.reduce((sum, w) => sum + w.estimatedQuantityKg, 0);
  
  const earnings = totalQtyCollected * 18;
  const co2Saved = Math.round(totalQtyCollected * 0.82);

  const scheduledCount = allWaste.filter(w => w.status === 'scheduled_for_pickup' || w.status === 'accepted').length;
  const completionRate = allWaste.length > 0 
    ? Math.round((totalQtyCollected / totalQtyDeclared) * 100) 
    : 0;

  const WASTE_LABELS: Record<WasteType, string> = {
    palm_leaves: language === 'ar' ? 'سعف النخيل الجاف' : 'Palmes sèches',
    fibers: language === 'ar' ? 'ألياف النخيل' : 'Fibres oasiennes',
    dates_low_quality: language === 'ar' ? 'تمور منخفضة الجودة' : 'Dattes déclassées',
    mixed: language === 'ar' ? 'مزيج واحاتي' : 'Mélange oasien'
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)' }}>
            {language === 'ar' ? `مرحباً، ${user.fullName} !` : `Saha, ${user.fullName} !`}
          </h2>
          <p style={{ color: 'gray', fontSize: '0.9rem' }}>
            {profile?.notes || (language === 'ar' ? 'مستثمرة واحاتية' : 'Exploitation Oasienne')} — 📍 {profile?.location}
          </p>
        </div>
        <button 
          onClick={() => onSubTabChange('declare')}
          className="btn btn-accent"
        >
          <PlusCircle size={18} /> {t('supplier.action_new_decl')}
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-2 grid-4" style={{ gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid var(--secondary)', borderRight: language === 'ar' ? '4px solid var(--secondary)' : 'none' }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', color: 'gray', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>{language === 'ar' ? 'إجمالي المصرح به' : 'DÉCLARÉ TOTAL'}</span>
            <Leaf size={16} style={{ color: 'var(--secondary)' }} />
          </div>
          <h3 className="numeric" style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0' }}>{totalQtyDeclared.toLocaleString()} kg</h3>
          <p style={{ fontSize: '0.75rem', color: 'gray' }}>{language === 'ar' ? 'مخلفات خام مصرح بها' : 'Matière première brute déclarée'}</p>
        </div>

        <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid var(--accent)', borderRight: language === 'ar' ? '4px solid var(--accent)' : 'none' }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', color: 'gray', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>{language === 'ar' ? 'مداخيل مستحقة' : 'REVENUS DÉPOSÉS'}</span>
            <DollarSign size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="numeric" style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0' }}>{earnings.toLocaleString()} DA</h3>
          <p style={{ fontSize: '0.75rem', color: 'gray' }}>{language === 'ar' ? 'على أساس 18 د.ج / كغ مجمع' : 'Sur base de 18 DA / kg collecté'}</p>
        </div>

        <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid #3498db', borderRight: language === 'ar' ? '4px solid #3498db' : 'none' }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', color: 'gray', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>{language === 'ar' ? 'عمليات جمع مبرمجة' : 'TRANSPORT PRÉVU'}</span>
            <Calendar size={16} style={{ color: '#3498db' }} />
          </div>
          <h3 className="numeric" style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0' }}>{scheduledCount}</h3>
          <p style={{ fontSize: '0.75rem', color: 'gray' }}>{language === 'ar' ? 'في انتظار الجمع' : 'En attente ou programmés'}</p>
        </div>

        <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid #1abc9c', borderRight: language === 'ar' ? '4px solid #1abc9c' : 'none' }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', color: 'gray', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>{language === 'ar' ? 'أثر الكربون' : 'IMPACT CO₂'}</span>
            <Leaf size={16} style={{ color: '#1abc9c' }} />
          </div>
          <h3 className="numeric" style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0' }}>{co2Saved.toLocaleString()} kg</h3>
          <p style={{ fontSize: '0.75rem', color: 'gray' }}>{language === 'ar' ? 'تم تفاديها بالتثمين الواحاتي' : 'Évités par recyclage oasien'}</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: '2rem', alignItems: 'stretch' }}>
        
        {/* Left Side: Completion progress */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', textAlign: 'center', fontSize: '1.1rem' }}>
            {language === 'ar' ? 'معدل تقدم التجميع' : 'Progression Logistique'}
          </h3>
          
          <div className="circular-progress" style={{ '--progress': completionRate } as React.CSSProperties}>
            {completionRate}%
          </div>
          
          <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--neutral-dark)', textAlign: 'center', maxWidth: '300px' }}>
            {language === 'ar' ? (
              <span>تم جمع <strong>{totalQtyCollected.toLocaleString()} كغ</strong> من أصل <strong>{totalQtyDeclared.toLocaleString()} كغ</strong> مصرح بها.</span>
            ) : (
              <span><strong>{totalQtyCollected.toLocaleString()} kg</strong> collectés sur <strong>{totalQtyDeclared.toLocaleString()} kg</strong>.</span>
            )}
          </p>
        </div>

        {/* Right Side: Last Activity */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', fontSize: '1.1rem' }}>
              {language === 'ar' ? 'أحدث الأنشطة والتصريحات' : 'Historique Récent'}
            </h3>
            
            {allWaste.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'gray' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 0.5rem auto', display: 'block', color: 'gray' }} />
                {t('supplier.no_declarations')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {allWaste.slice(0, 3).map(w => (
                  <div key={w.id} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid var(--neutral-border)' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{WASTE_LABELS[w.wasteType]}</span>
                      <div style={{ fontSize: '0.75rem', color: 'gray' }}>
                        {w.estimatedQuantityKg} kg • {language === 'ar' ? 'أرسل في' : 'Soumis le'} {w.createdAt}
                      </div>
                    </div>
                    <div>
                      <span className={`badge badge-${
                        (w.status === 'submitted' || w.status === 'ai_scored') ? 'pending' :
                        w.status === 'rejected' ? 'rejected' :
                        ['collected', 'received', 'stored'].includes(w.status) ? 'completed' :
                        w.status === 'accepted' ? 'approved' : 'scheduled'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {t(`status.${w.status}`)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {allWaste.length > 0 && (
            <button 
              onClick={() => onSubTabChange('list')}
              className="btn btn-secondary btn-sm" 
              style={{ width: '100%', marginTop: '1.5rem', gap: '0.25rem' }}
            >
              {language === 'ar' ? 'عرض السجل الكامل' : "Voir l'historique complet"}{' '}
              <ArrowRight size={14} style={{ transform: language === 'ar' ? 'scaleX(-1)' : 'none' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
