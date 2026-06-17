import React, { useState } from 'react';
import { ShoppingBag, MapPin, Truck, QrCode, ClipboardList } from 'lucide-react';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { User } from '../../services/db';
import { usePagination, Pagination } from '../../components/Pagination';

interface ClientOrdersProps {
  user: User;
  onTraceBatch: (batchId: string) => void;
  onNavigate: (page: string) => void;
}

export const ClientOrders: React.FC<ClientOrdersProps> = ({ user, onTraceBatch, onNavigate }) => {
  const { orders, products, cancelOrder } = useNakheel();
  const { t, language } = useLanguage();
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const clientOrders = orders.filter(o => o.clientId === user.id);
  const PAGE_SIZE = 5;
  const { paged: pagedOrders, page, totalPages, setPage, total } = usePagination(clientOrders, PAGE_SIZE);

  const getProductName = (productId: string): string => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return 'Aliment Nakheel';
    
    // Translate standard product names if matching
    if (language === 'ar') {
      if (p.id === 'PROD-001') return 'علف خروف واحاتي اقتصادي';
      if (p.id === 'PROD-002') return 'علف تسمين العجول المطور';
    }
    return p.name;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'created': return 'badge-pending';
      case 'confirmed': return 'badge-approved';
      case 'stock_reserved': return 'badge-approved';
      case 'preparing': return 'badge-scheduled';
      case 'out_for_delivery': return 'badge-scheduled';
      case 'delivered': return 'badge-completed';
      case 'closed': return 'badge-completed';
      case 'cancelled': return 'badge-rejected';
      default: return '';
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>{t('client.orders_title')}</h2>
          <p style={{ color: 'gray', fontSize: '0.9rem' }}>{t('client.orders_desc')}</p>
        </div>
      </div>

      {clientOrders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'gray' }}>
          <ShoppingBag size={44} style={{ color: 'var(--neutral-border)', margin: '0 auto 0.75rem auto', display: 'block' }} />
          {language === 'ar' ? 'لم تقم بإجراء أي طلبيات شراء بعد.' : "Vous n'avez pas encore passé d'achat."}
          <button 
            onClick={() => onNavigate('client-catalog')} 
            className="btn btn-primary btn-sm" 
            style={{ display: 'block', margin: '1.25rem auto 0 auto' }}
          >
            {language === 'ar' ? 'تصفح دليل الأعلاف' : 'Découvrir le Catalogue'}
          </button>
        </div>
      ) : (
        <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {pagedOrders.map(o => {
            const firstBatchId = o.orderItems.find(item => item.productionBatchId !== '')?.productionBatchId;
            return (
              <div key={o.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--neutral-border)', paddingBottom: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'gray', fontWeight: 700 }}>
                      {language === 'ar' ? `رقم الطلبية : ${o.id}` : `RÉFERENCE COMPTE : ${o.id}`}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                      <span className={`badge ${getStatusStyle(o.status)}`}>
                        {t(`status.${o.status}`)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'gray' }}>
                        {language === 'ar' ? 'بتاريخ' : 'Commandé le'} {o.createdAt}
                      </span>
                      {o.status === 'created' && (
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirmCancelId === o.id) {
                              await cancelOrder(o.id);
                              setConfirmCancelId(null);
                            } else {
                              setConfirmCancelId(o.id);
                            }
                          }}
                          className={`btn ${confirmCancelId === o.id ? 'btn-danger' : 'btn-secondary'} btn-sm`}
                          style={{ 
                            padding: '0.15rem 0.45rem', 
                            fontSize: '0.65rem', 
                            border: 'none', 
                            marginInlineStart: '0.5rem',
                            backgroundColor: confirmCancelId === o.id ? 'var(--status-rejected)' : 'var(--neutral-dark)',
                            color: 'white'
                          }}
                        >
                          {confirmCancelId === o.id ? (language === 'ar' ? 'تأكيد الإلغاء ؟' : 'Confirmer ?') : t('supplier.btn_cancel')}
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: language === 'ar' ? 'left' : 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'gray' }}>{t('client.cart_total')}</span>
                    <div className="numeric" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', direction: 'ltr' }}>
                      {o.totalAmount.toLocaleString()} DA
                    </div>
                  </div>
                </div>

                {/* Items listing */}
                <div className="grid grid-2" style={{ gap: '1.25rem', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                      {language === 'ar' ? 'الأعلاف المطلوبة :' : 'Articles commandés :'}
                    </h4>
                    {o.orderItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.85rem', borderBottom: '1px dashed var(--neutral-border)' }}>
                        <span style={{ fontWeight: 600 }}>{getProductName(item.productId)}</span>
                        <span className="numeric" style={{ direction: 'ltr' }}>
                          {item.quantityKg.toLocaleString()} kg • <span style={{ color: 'gray' }}>({item.unitPrice} DA/kg)</span>
                        </span>
                      </div>
                    ))}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.85rem', fontSize: '0.8rem', color: 'gray' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={12} /> {language === 'ar' ? 'الوجهة / المزرعة :' : 'Destination :'} {o.deliveryLocation}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Truck size={12} /> {language === 'ar' ? 'طريقة الاستلام :' : 'Acheminement :'} {o.deliveryMethod === 'delivery' ? t('client.cart_delivery_home') : t('client.cart_delivery_pickup')}
                      </span>
                    </div>
                  </div>

                  {/* Sourcing/Traceability Link */}
                  <div style={{ 
                    backgroundColor: 'var(--neutral-light)', 
                    border: '1px solid var(--neutral-border)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '0.85rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.85rem' 
                  }}>
                    {firstBatchId ? (
                      <>
                        <div 
                          onClick={() => onTraceBatch(firstBatchId)}
                          style={{ 
                            width: '64px', height: '64px', backgroundColor: 'white', border: '2px solid var(--primary)', 
                            borderRadius: 'var(--radius-sm)', padding: '0.2rem', cursor: 'pointer', position: 'relative',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title={language === 'ar' ? 'تحقق من التتبع' : 'Vérifier la traçabilité'}
                        >
                          <QrCode size={52} style={{ color: 'var(--neutral-dark)' }} />
                          <div style={{ 
                            position: 'absolute', bottom: '-4px', right: '-4px', backgroundColor: 'var(--accent)', 
                            color: 'white', borderRadius: '50%', width: '15px', height: '15px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' 
                          }}>✓</div>
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.65rem', color: 'gray', textTransform: 'uppercase', fontWeight: 700 }}>
                            {language === 'ar' ? 'جودة نخيل' : 'Nakheel Qualité'}
                          </span>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', margin: '0.1rem 0' }}>
                            {language === 'ar' ? 'الدفعة المرتبطة :' : 'Lot lié :'} {firstBatchId}
                          </h4>
                          <p style={{ fontSize: '0.75rem', color: 'gray', marginBottom: '0.35rem' }}>
                            {language === 'ar' ? 'اضغط على الرمز لتتبع مصدر المواد من الواحات.' : 'Cliquez sur le QR pour remonter aux oasis d\'origine.'}
                          </p>
                          <button 
                            onClick={() => onTraceBatch(firstBatchId)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            <ClipboardList size={11} /> {language === 'ar' ? 'بطاقة الجودة' : 'Fiche Qualité'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ 
                          width: '64px', height: '64px', backgroundColor: '#e8e8e8', border: '1px dashed gray', 
                          borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'gray'
                        }}>
                          <QrCode size={36} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.65rem', color: 'gray', textTransform: 'uppercase', fontWeight: 700 }}>{language === 'ar' ? 'التتبع عبر QR' : 'Traçabilité'}</span>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', margin: '0.1rem 0' }}>{language === 'ar' ? 'جاري ربط الدفعة' : 'Attribution en cours'}</h4>
                          <p style={{ fontSize: '0.75rem', color: 'gray' }}>{language === 'ar' ? 'سيتم ربط الدفعة وتنشيط الرمز فور تحضير الطلبية بالشحن.' : 'Le lot physique sera lié dès préparation de la livraison.'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

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
