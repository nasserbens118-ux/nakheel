import React, { useState } from 'react';
import { Calendar, MapPin, Truck, HelpCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { useToast } from '../../components/Toast';
import { User, WasteType, NakheelDB } from '../../services/db';
import { usePagination, Pagination } from '../../components/Pagination';

interface SupplierWasteListProps {
  user: User;
}

export const SupplierWasteList: React.FC<SupplierWasteListProps> = ({ user }) => {
  const { wasteRequests } = useNakheel();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'scheduled' | 'collected'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const allWaste = wasteRequests.filter(w => w.supplierId === user.id);

  const filteredWaste = allWaste.filter(w => {
    if (filter === 'pending') return w.status === 'submitted' || w.status === 'ai_scored';
    if (filter === 'scheduled') return w.status === 'accepted' || w.status === 'scheduled_for_pickup';
    if (filter === 'collected') return ['collected', 'received', 'stored'].includes(w.status);
    return true;
  });

  const PAGE_SIZE = 5;
  const { paged: pagedWaste, page, totalPages, setPage, total } = usePagination(filteredWaste, PAGE_SIZE);

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      const list = wasteRequests.filter(w => w.id !== id);
      NakheelDB.saveWasteRequests(list);
      setConfirmDeleteId(null);
      
      // Dispatch update event
      window.dispatchEvent(new CustomEvent('nakheel-db-update'));
      toast(t('supplier.toast_cancelled'), 'success');
    } else {
      setConfirmDeleteId(id);
    }
  };

  const getStatusTimelineStep = (status: string) => {
    if (status === 'rejected') return -1;
    if (status === 'submitted' || status === 'ai_scored') return 0;
    if (status === 'accepted') return 1;
    if (status === 'scheduled_for_pickup') return 2;
    if (['collected', 'received', 'stored'].includes(status)) return 3;
    return 0;
  };

  const WASTE_LABELS: Record<WasteType, string> = {
    palm_leaves: language === 'ar' ? 'سعف النخيل الجاف' : 'Palmes sèches',
    fibers: language === 'ar' ? 'ألياف النخيل' : 'Fibres oasiennes',
    dates_low_quality: language === 'ar' ? 'تمور منخفضة الجودة' : 'Dattes déclassées',
    mixed: language === 'ar' ? 'مزيج واحاتي' : 'Mélange oasien'
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
          {language === 'ar' ? 'سجل تصريحات مخلفات النخيل' : 'Vos Déclarations de Déchets'}
        </h2>
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--neutral-white)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-border)' }}>
          {(['all', 'pending', 'scheduled', 'collected'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              style={{
                padding: '0.35rem 0.75rem',
                border: 'none',
                background: filter === opt ? 'var(--primary)' : 'none',
                color: filter === opt ? 'white' : 'gray',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}
            >
              {opt === 'all' && (language === 'ar' ? 'الكل' : 'Tous')}
              {opt === 'pending' && (language === 'ar' ? 'في الانتظار' : 'En Attente')}
              {opt === 'scheduled' && (language === 'ar' ? 'المبرمجة' : 'Programmés')}
              {opt === 'collected' && (language === 'ar' ? 'تم الجمع' : 'Collectés')}
            </button>
          ))}
        </div>
      </div>

      {filteredWaste.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'gray' }}>
          {language === 'ar' ? 'لا توجد تصريحات في هذه الفئة حالياً.' : 'Aucune déclaration soumise pour cette catégorie.'}
        </div>
      ) : (
        <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {pagedWaste.map((w) => {
            const step = getStatusTimelineStep(w.status);
            return (
              <div key={w.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {w.photoUrl ? (
                      <img 
                        src={w.photoUrl} 
                        alt="Déchet" 
                        style={{ width: '75px', height: '75px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ width: '75px', height: '75px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        🌴
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'gray', fontWeight: 700 }}>{w.id}</span>
                        <span className={`badge badge-${
                          (w.status === 'submitted' || w.status === 'ai_scored') ? 'pending' :
                          w.status === 'rejected' ? 'rejected' :
                          ['collected', 'received', 'stored'].includes(w.status) ? 'completed' :
                          w.status === 'accepted' ? 'approved' : 'scheduled'
                        }`} style={{ fontSize: '0.65rem' }}>
                          {t(`status.${w.status}`)}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', textTransform: 'capitalize', margin: '0.1rem 0' }}>
                        {WASTE_LABELS[w.wasteType]} — <strong style={{ color: 'var(--accent)' }}>{w.estimatedQuantityKg.toLocaleString()} kg</strong>
                      </h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.3rem', fontSize: '0.8rem', color: 'gray' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={12} /> {w.location}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={12} /> {language === 'ar' ? 'متاح للجمع بدءاً من :' : 'Disponible à partir du :'} {w.availabilityDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    {/* Cancel button for pending items */}
                    {(w.status === 'submitted' || w.status === 'ai_scored') && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(w.id);
                        }}
                        className={`btn ${confirmDeleteId === w.id ? 'btn-danger' : 'btn-secondary'} btn-sm`}
                        style={{ 
                          padding: '0.25rem 0.5rem', 
                          fontSize: '0.75rem', 
                          border: 'none',
                          backgroundColor: confirmDeleteId === w.id ? 'var(--status-rejected)' : 'var(--neutral-dark)',
                          color: 'white'
                        }}
                      >
                        {confirmDeleteId === w.id ? (language === 'ar' ? 'تأكيد الإلغاء ؟' : 'Confirmer ?') : (language === 'ar' ? 'إلغاء' : 'Annuler')}
                      </button>
                    )}

                    {/* Scheduled date banner */}
                    {(w.status === 'scheduled_for_pickup' || w.status === 'accepted') && (w as any).scheduledDate && (
                      <div style={{ 
                        backgroundColor: 'var(--status-scheduled-light)', 
                        border: '1px solid rgba(52, 152, 219, 0.15)',
                        padding: '0.4rem 0.85rem', 
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--status-scheduled)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}>
                        <Truck size={14} />
                        <span>
                          {language === 'ar' ? (
                            <span>شاحنة الجمع مبرمجة في <strong>{(w as any).scheduledDate}</strong></span>
                          ) : (
                            <span>Camion programmé pour le <strong>{(w as any).scheduledDate}</strong></span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stepper Timeline */}
                {step !== -1 ? (
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: '1.25rem', padding: '0 0.5rem' }}>
                    
                    {/* Step 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                      <div style={{ 
                        width: '22px', height: '22px', borderRadius: '50%', 
                        backgroundColor: step >= 0 ? 'var(--primary)' : 'var(--neutral-border)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 'bold', zIndex: 2
                      }}>✓</div>
                      <span style={{ fontSize: '0.7rem', fontWeight: step === 0 ? 700 : 500, marginTop: '0.25rem', color: step === 0 ? 'var(--primary)' : 'gray' }}>
                        {language === 'ar' ? 'مصرح به' : 'Déclaré'}
                      </span>
                      <div style={{ 
                        position: 'absolute', top: '11px', 
                        left: language === 'ar' ? 'auto' : '50%',
                        right: language === 'ar' ? '50%' : 'auto',
                        width: '100%', height: '2px', 
                        backgroundColor: step >= 1 ? 'var(--primary)' : 'var(--neutral-border)',
                        zIndex: 1
                      }} />
                    </div>

                    {/* Step 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                      <div style={{ 
                        width: '22px', height: '22px', borderRadius: '50%', 
                        backgroundColor: step >= 1 ? 'var(--primary)' : 'var(--neutral-border)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 'bold', zIndex: 2
                      }}>{step >= 1 ? '✓' : '2'}</div>
                      <span style={{ fontSize: '0.7rem', fontWeight: step === 1 ? 700 : 500, marginTop: '0.25rem', color: step === 1 ? 'var(--primary)' : 'gray' }}>
                        {language === 'ar' ? 'مقبول' : 'Accepté'}
                      </span>
                      <div style={{ 
                        position: 'absolute', top: '11px', 
                        left: language === 'ar' ? 'auto' : '50%',
                        right: language === 'ar' ? '50%' : 'auto',
                        width: '100%', height: '2px', 
                        backgroundColor: step >= 2 ? 'var(--primary)' : 'var(--neutral-border)',
                        zIndex: 1
                      }} />
                    </div>

                    {/* Step 3 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                      <div style={{ 
                        width: '22px', height: '22px', borderRadius: '50%', 
                        backgroundColor: step >= 2 ? 'var(--primary)' : 'var(--neutral-border)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 'bold', zIndex: 2
                      }}>{step >= 2 ? '✓' : '3'}</div>
                      <span style={{ fontSize: '0.7rem', fontWeight: step === 2 ? 700 : 500, marginTop: '0.25rem', color: step === 2 ? 'var(--primary)' : 'gray' }}>
                        {language === 'ar' ? 'مبرمج للجمع' : 'Programmé'}
                      </span>
                      <div style={{ 
                        position: 'absolute', top: '11px', 
                        left: language === 'ar' ? 'auto' : '50%',
                        right: language === 'ar' ? '50%' : 'auto',
                        width: '100%', height: '2px', 
                        backgroundColor: step >= 3 ? 'var(--primary)' : 'var(--neutral-border)',
                        zIndex: 1
                      }} />
                    </div>

                    {/* Step 4 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                      <div style={{ 
                        width: '22px', height: '22px', borderRadius: '50%', 
                        backgroundColor: step >= 3 ? 'var(--primary)' : 'var(--neutral-border)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 'bold', zIndex: 2
                      }}>{step >= 3 ? '✓' : '4'}</div>
                      <span style={{ fontSize: '0.7rem', fontWeight: step === 3 ? 700 : 500, marginTop: '0.25rem', color: step === 3 ? 'var(--primary)' : 'gray' }}>
                        {language === 'ar' ? 'تم الجمع' : 'Collecté'}
                      </span>
                    </div>

                  </div>
                ) : (
                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.6rem', 
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--status-rejected-light)', 
                    color: 'var(--status-rejected)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <XCircle size={14} />
                    <span>
                      {language === 'ar' 
                        ? 'تم رفض هذا التصريح من طرف مسؤول الجودة.' 
                        : "Cette déclaration a été refusée par l'administrateur qualité."}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} language={language} />
        </>
      )}
    </div>
  );
};
