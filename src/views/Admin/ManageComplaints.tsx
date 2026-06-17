import React, { useState } from 'react';
import { MessageSquare, CornerDownRight } from 'lucide-react';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { ComplaintType, ComplaintStatus } from '../../services/db';

export const ManageComplaints: React.FC = () => {
  const { users, complaints, replyToComplaint } = useNakheel();
  const { language } = useLanguage();
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = async (id: string) => {
    if (!replyText.trim()) return;
    await replyToComplaint(id, replyText.trim());
    setActiveReplyId(null);
    setReplyText('');
  };

  const getClientName = (clientId: string) => {
    const u = users.find(usr => usr.id === clientId);
    return u ? u.fullName : (language === 'ar' ? 'مربي مواشي' : 'Éleveur client');
  };

  const getComplaintTypeLabel = (type: ComplaintType) => {
    if (language === 'ar') {
      if (type === 'quality') return 'جودة العلف';
      if (type === 'delivery') return 'الخدمات اللوجستية والتوصيل';
      if (type === 'price') return 'التسعير وتكلفة الشراء';
      return 'سبب آخر';
    }
    const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = {
      quality: 'Qualité de l’Aliment',
      delivery: 'Logistique & Livraison',
      price: 'Tarification',
      other: 'Autre motif'
    };
    return COMPLAINT_TYPE_LABELS[type] || type;
  };

  const getComplaintStatusLabel = (status: ComplaintStatus) => {
    if (language === 'ar') {
      if (status === 'open') return 'مفتوح';
      if (status === 'in_review') return 'قيد المراجعة';
      if (status === 'resolved') return 'تم الحل';
      return 'مرفوض';
    }
    const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
      open: 'Ouvert',
      in_review: 'En examen',
      resolved: 'Résolu / Traité',
      rejected: 'Classé sans suite'
    };
    return COMPLAINT_STATUS_LABELS[status] || status;
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
          {language === 'ar' ? 'إدارة ومتابعة الشكاوى' : 'Gestion des Réclamations'}
        </h2>
        <p style={{ color: 'gray', fontSize: '0.9rem' }}>
          {language === 'ar' 
            ? 'راجع شكاوى وآراء مربي المواشي وقدم الردود والحلول التقنية المناسبة' 
            : "Consultez les retours d'évaluation des éleveurs clients et formulez les réponses qualité"}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {complaints.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'gray' }}>
            {language === 'ar' ? 'لا توجد أي شكاوى أو آراء من الزبائن حالياً.' : 'Aucun avis ou réclamation client.'}
          </div>
        ) : (
          complaints.map(c => (
            <div key={c.id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: 'gray', fontWeight: 700 }}>{c.id}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                      👤 {language === 'ar' ? 'المربي :' : 'Éleveur :'} {getClientName(c.clientId)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'gray' }}>
                      • {language === 'ar' ? 'رقم الطلب :' : 'Commande Réf:'} {c.orderId}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginTop: '0.15rem' }}>
                    {language === 'ar' ? 'السبب :' : 'Motif :'} {getComplaintTypeLabel(c.complaintType)}
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge badge-${c.status === 'resolved' ? 'completed' : c.status === 'open' ? 'pending' : 'scheduled'}`} style={{ fontSize: '0.65rem' }}>
                    {getComplaintStatusLabel(c.status)}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--neutral-dark)', marginBottom: '1rem', backgroundColor: 'var(--neutral-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                "{c.message}"
              </p>

              {/* Reply state section */}
              {c.reply ? (
                <div style={{ 
                  marginInlineStart: '1.5rem', 
                  backgroundColor: 'var(--primary-light)', 
                  borderLeft: language === 'ar' ? 'none' : '3px solid var(--primary)',
                  borderRight: language === 'ar' ? '3px solid var(--primary)' : 'none',
                  padding: '0.75rem 1rem', 
                  borderRadius: language === 'ar' ? 'var(--radius-md) 0 0 var(--radius-md)' : '0 var(--radius-md) var(--radius-md) 0',
                  fontSize: '0.825rem'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CornerDownRight size={13} style={{ transform: language === 'ar' ? 'scaleX(-1)' : 'none' }} /> {language === 'ar' ? 'الرد المرسل من طرف الدعم التقني للمنصة :' : 'Réponse envoyée par le Support Technique :'}
                  </div>
                  {c.reply}
                </div>
              ) : (
                <div>
                  {activeReplyId === c.id ? (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <textarea
                        className="form-input"
                        placeholder={language === 'ar' ? 'اكتب ردك الرسمي والمقترحات الموجهة للمربي...' : "Rédigez votre réponse officielle à l'éleveur..."}
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
                        <button
                          onClick={() => handleSendReply(c.id)}
                          className="btn btn-primary btn-sm"
                        >
                          {language === 'ar' ? 'إرسال الرد' : 'Envoyer la réponse'}
                        </button>
                        <button
                          onClick={() => { setActiveReplyId(null); setReplyText(''); }}
                          className="btn btn-secondary btn-sm"
                        >
                          {language === 'ar' ? 'إلغاء' : 'Annuler'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveReplyId(c.id);
                        setReplyText('');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <MessageSquare size={12} /> {language === 'ar' ? 'الرد على الشكوى' : 'Répondre à la réclamation'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
