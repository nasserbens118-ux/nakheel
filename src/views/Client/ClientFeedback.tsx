import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { User } from '../../services/db';

interface ClientFeedbackProps {
  user: User;
}

export const ClientFeedback: React.FC<ClientFeedbackProps> = ({ user }) => {
  const { orders, complaints, products, submitComplaint } = useNakheel();
  const { t, language } = useLanguage();
  const clientOrders = orders.filter(o => o.clientId === user.id);
  const clientComplaints = complaints.filter(c => c.clientId === user.id);
  
  const [orderId, setOrderId] = useState(clientOrders[0]?.id || '');
  const [complaintType, setComplaintType] = useState<'quality' | 'delivery' | 'price' | 'other'>('quality');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!orderId && clientOrders.length > 0) {
      setOrderId(clientOrders[0].id);
    }
  }, [clientOrders, orderId]);

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const getProductName = (productId: string): string => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return 'Aliment';
    if (language === 'ar') {
      if (p.id === 'PROD-001') return 'علف خروف واحاتي اقتصادي';
      if (p.id === 'PROD-002') return 'علف خروف معياري محسّن';
      if (p.id === 'PROD-003') return 'علف أبقار معياري';
      if (p.id === 'PROD-004') return 'علف مختلط محسّن';
    }
    return p.name;
  };

  const getComplaintTypeLabel = (type: string) => {
    switch(type) {
      case 'quality': return t('client.field_complaint_quality');
      case 'delivery': return t('client.field_complaint_delivery');
      case 'price': return t('client.field_complaint_price');
      case 'other': return t('client.field_complaint_other');
      default: return type;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!message.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال نص الملاحظة بالتفصيل.' : 'Veuillez renseigner le message détaillé de votre retour.');
      return;
    }

    if (clientOrders.length === 0) {
      setError(language === 'ar' ? 'يجب أن تملك طلبية واحدة على الأقل لإرسال رأي أو شكوى.' : 'Vous devez posséder au moins une commande pour soumettre un avis.');
      return;
    }

    const selectedOrderId = orderId || clientOrders[0]?.id;
    const selectedOrder = orders.find(o => o.id === selectedOrderId);
    const productionBatchId = selectedOrder?.orderItems[0]?.productionBatchId || '';

    await submitComplaint(
      user.id,
      selectedOrderId,
      productionBatchId,
      complaintType,
      message.trim()
    );

    setSuccess(true);
    setMessage('');

    setTimeout(() => {
      setSuccess(false);
    }, 2000);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: 0 }}>
      <div className="grid grid-2" style={{ gap: '2rem', alignItems: 'start' }}>
        
        {/* Left column: Submit review */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary)', borderBottom: '1px solid var(--neutral-border)', paddingBottom: '0.5rem', fontSize: '1.15rem' }}>
            {language === 'ar' ? 'تقييم دفعة / الإبلاغ عن شكوى' : 'Évaluer un lot / Signaler une réclamation'}
          </h3>

          {success ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <CheckCircle size={44} style={{ color: 'var(--status-approved)', marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
              <h4 style={{ color: 'var(--primary)' }}>{t('client.feedback_success')}</h4>
              <p style={{ color: 'gray', fontSize: '0.85rem' }}>{t('client.feedback_success_desc')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ 
                  backgroundColor: 'var(--status-rejected-light)', color: 'var(--status-rejected)', 
                  padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem',
                  border: '1px solid rgba(192, 57, 43, 0.15)'
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Order reference */}
              {clientOrders.length > 0 ? (
                <div className="form-group">
                  <label className="form-label">{t('client.field_order')}</label>
                  <select
                    className="form-input"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  >
                    {clientOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        {language === 'ar' ? `طلبية رقم ${o.id}` : `Commande ${o.id}`} ({o.createdAt}) — {getProductName(o.orderItems[0]?.productId)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'gray', marginBottom: '1rem' }}>
                  {language === 'ar' ? 'لا توجد أي طلبيات لإرسال شكوى حولها.' : 'Aucune commande disponible pour réclamation.'}
                </div>
              )}

              {/* Complaint Type selection */}
              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'نوع الملاحظة / الشكوى' : 'Motif du retour / Type'}</label>
                <select
                  className="form-input"
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value as any)}
                >
                  <option value="quality">{language === 'ar' ? 'جودة الأعلاف / التركيبة' : 'Qualité de l\'aliment / composition'}</option>
                  <option value="delivery">{language === 'ar' ? 'التوصيل واللوجستيك' : 'Livraison / Dépôt de retrait'}</option>
                  <option value="price">{language === 'ar' ? 'السعر أو الدفع' : 'Tarif / Mode de paiement'}</option>
                  <option value="other">{language === 'ar' ? 'اقتراح أو ملاحظة أخرى' : 'Autre demande / suggestion'}</option>
                </select>
              </div>

              {/* Message */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">{t('client.field_description')}</label>
                <textarea
                  rows={5}
                  className="form-input"
                  placeholder={t('client.field_description_placeholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={clientOrders.length === 0}>
                <Send size={14} style={{ transform: language === 'ar' ? 'scaleX(-1)' : 'none' }} /> {t('client.btn_send_feedback')}
              </button>
            </form>
          )}
        </div>

        {/* Right column: Past reviews list */}
        <div>
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary)', fontSize: '1.15rem' }}>
            {language === 'ar' ? 'سجل آرائي وشكاوى الجودة' : 'Vos retours et réclamations'}
          </h3>
          
          {clientComplaints.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem', color: 'gray' }}>
              {language === 'ar' ? 'لم تقم بتقديم أي ملاحظة سابقاً.' : "Vous n'avez soumis aucun retour."}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {clientComplaints.map(c => (
                <div key={c.id} className="card" style={{ padding: '1rem 1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.4rem' }}>
                    <div>
                      <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
                        {getComplaintTypeLabel(c.complaintType)}
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: 'gray' }}>
                        {language === 'ar' ? `الطلب: ${c.orderId}` : `Réf: ${c.orderId}`} {c.productionBatchId ? `• ${language === 'ar' ? 'الدفعة' : 'Lot'}: ${c.productionBatchId}` : ''} • {language === 'ar' ? 'أرسل في' : 'Soumis le'} {c.createdAt}
                      </div>
                    </div>
                    
                    <span className={`badge badge-${c.status === 'resolved' ? 'approved' : c.status === 'rejected' ? 'rejected' : 'pending'}`} style={{ fontSize: '0.65rem' }}>
                      {t(`status.${c.status}`)}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--neutral-dark)', marginBottom: '0.75rem', whiteSpace: 'pre-line' }}>
                    "{c.message}"
                  </p>

                  {/* Admin Reply */}
                  {c.reply ? (
                    <div style={{ 
                      backgroundColor: 'var(--primary-light)', 
                      borderInlineStart: '2.5px solid var(--primary)', 
                      padding: '0.65rem', 
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      color: 'var(--neutral-dark)'
                    }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <MessageSquare size={11} /> {language === 'ar' ? 'رد إدارة نخيل :' : 'Réponse GourFeed :'}
                      </div>
                      {c.reply}
                    </div>
                  ) : (
                    c.status !== 'rejected' && (
                      <div style={{ 
                        backgroundColor: 'var(--status-pending-light)', 
                        padding: '0.4rem', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: '0.75rem', 
                        color: 'var(--status-pending)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        fontWeight: 600
                      }}>
                        <AlertTriangle size={11} />
                        {language === 'ar' ? 'قيد الدراسة الفنية والمخبرية من فريق الجودة' : 'En cours d\'étude par le service technique'}
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
