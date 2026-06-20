import React, { useState } from 'react';
import { Truck, ShieldCheck, Package, CheckCircle, CreditCard, Download } from 'lucide-react';
import { exportOrders } from '../../services/exportCsv';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { NakheelDB, Order, OrderStatus } from '../../services/db';
import { isSupabaseAvailable } from '../../services/supabaseClient';
import { emailPaymentConfirmed } from '../../services/emailNotifications';
import { useToast } from '../../components/Toast';
import { usePagination, Pagination } from '../../components/Pagination';

export const ManageOrders: React.FC = () => {
  const { users, orders, batches, products, confirmOrder, cancelOrder, deliverOrder, updateOrderStatus } = useNakheel();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const PAGE_SIZE = 10;
  const { paged: pagedOrders, page, totalPages, setPage, total } = usePagination(orders, PAGE_SIZE);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [targetBatchId, setTargetBatchId] = useState('');
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Only approved/packaged/in_stock batches can be linked for quality safety
  const availableBatches = batches.filter(b => b.status === 'in_stock' || b.qualityStatus === 'conforme');

  const getStatusLabel = (status: OrderStatus) => {
    return t(`status.${status}`);
  };

  const handleConfirm = async (id: string) => {
    const success = await confirmOrder(id);
    if (!success) {
      toast(language === 'ar'
        ? "خطأ في التأكيد: المخزون المادي المتوفر غير كافٍ لهذه التركيبة من العلف!"
        : "Erreur de confirmation : Stock physique disponible insuffisant pour cette formule d'aliment !",
        'error'
      );
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentOrder || !paymentRef.trim()) return;
    setPaymentSubmitting(true);
    const ref = paymentRef.trim();
    const orderId = paymentOrder.id;
    const amount = paymentOrder.totalAmount;

    if (isSupabaseAvailable) {
      // Supabase: persist via RPC / upsert
      const { supabase: sb } = await import('../../services/supabaseClient');
      await sb!.from('orders').update({ payment_status: 'paid', payment_ref: ref }).eq('id', orderId);
    } else {
      // Demo: use NakheelDB so the correct key and event are used
      const orders_ = NakheelDB.getOrders();
      const idx = orders_.findIndex((o: Order) => o.id === orderId);
      if (idx >= 0) {
        (orders_[idx] as any).paymentStatus = 'paid';
        (orders_[idx] as any).paymentRef = ref;
        NakheelDB.saveOrders(orders_);
      }
    }

    // Email confirmation to client
    const clientUser = users.find(u => u.id === paymentOrder.clientId);
    if (clientUser?.email) {
      emailPaymentConfirmed(clientUser.email, clientUser.fullName, orderId, amount, ref).catch(() => null);
    }

    setPaymentSubmitting(false);
    setPaymentOrder(null);
    setPaymentRef('');
  };

  const getClientName = (clientId: string) => {
    const u = users.find(usr => usr.id === clientId);
    return u ? u.fullName : (language === 'ar' ? 'مربي مواشي' : 'Éleveur client');
  };

  const getProductName = (prodId: string) => {
    const p = products.find(prod => prod.id === prodId);
    if (!p) return language === 'ar' ? 'علف واحاتي' : 'Aliment oasien';
    if (language === 'ar') {
      if (p.id === 'PROD-001') return 'علف خروف واحاتي اقتصادي';
      if (p.id === 'PROD-002') return 'علف تسمين العجول المطور';
    }
    return p.name;
  };

  const getLinkedBatchNumber = (order: Order) => {
    const bId = order.orderItems[0]?.productionBatchId;
    if (!bId) return null;
    const b = batches.find(x => x.id === bId || x.batchNumber === bId);
    return b ? b.batchNumber : bId;
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
            {language === 'ar' ? 'إدارة طلبيات الزبائن' : 'Gestion des Commandes Clients'}
          </h2>
          <p style={{ color: 'gray', fontSize: '0.9rem' }}>
            {language === 'ar'
              ? 'أكد الطلبيات، واحجز مخزون الأعلاف المطابقة للمعايير وتابع عملية الشحن والتوصيل.'
              : "Confirmez les commandes, réservez les stocks d'aliments conformes et supervisez la logistique de livraison."}
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          onClick={() => exportOrders(orders)}
        >
          <Download size={14} /> {language === 'ar' ? 'تصدير CSV' : 'Exporter CSV'}
        </button>
      </div>

      <div className="table-container">
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'gray' }}>
            {language === 'ar' ? 'لا توجد أي طلبيات مسجلة.' : 'Aucune commande enregistrée.'}
          </div>
        ) : (
          <>
          <table>
            <thead>
              <tr>
                <th>{language === 'ar' ? 'الرقم' : 'Réf'}</th>
                <th>{language === 'ar' ? 'المشتري' : 'Acheteur'}</th>
                <th>{language === 'ar' ? 'الأعلاف المطلوبة' : 'Aliments commandés'}</th>
                <th>{language === 'ar' ? 'المبلغ' : 'Montant'}</th>
                <th>{language === 'ar' ? 'طريقة الاستلام / العنوان' : 'Mode / Adresse'}</th>
                <th>{language === 'ar' ? 'الدفعة المرتبطة بالتتبع' : 'Lot Traçable lié'}</th>
                <th>{language === 'ar' ? 'حالة الطلب' : 'Statut Métier'}</th>
                <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map(o => {
                const batchNum = getLinkedBatchNumber(o);
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{o.id}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{getClientName(o.clientId)}</div>
                    </td>
                    <td>
                      {o.orderItems.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem' }}>
                          • <strong>{getProductName(item.productId)}</strong> ({item.quantityKg.toLocaleString()} kg)
                        </div>
                      ))}
                    </td>
                    <td className="numeric" style={{ fontWeight: 800, color: 'var(--accent)', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>
                      {o.totalAmount.toLocaleString()} DA
                      <div style={{ fontSize: '0.68rem', color: '#27ae60', fontWeight: 600 }}>
                        +{(o.commissionAmount ?? Math.round(o.totalAmount * 0.04)).toLocaleString()} DA commission
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                        {o.deliveryMethod === 'pickup' 
                          ? (language === 'ar' ? 'استلام من المستودع' : 'Retrait Dépôt') 
                          : (language === 'ar' ? 'توصيل للمزرعة' : 'Livraison GourFeed')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'gray' }}>📍 {o.deliveryLocation}</div>
                    </td>
                    <td>
                      {batchNum ? (
                        <span style={{ 
                          fontSize: '0.75rem', color: 'var(--primary)', 
                          backgroundColor: 'var(--primary-light)', 
                          padding: '0.2rem 0.5rem', borderRadius: '4px',
                          fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' 
                        }}>
                          <ShieldCheck size={12} /> {batchNum}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'gray', fontStyle: 'italic' }}>
                          {language === 'ar' ? 'غير مرتبط' : 'Non lié'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${
                        o.status === 'created' ? 'pending' :
                        o.status === 'confirmed' || o.status === 'stock_reserved' ? 'approved' :
                        o.status === 'preparing' || o.status === 'out_for_delivery' ? 'scheduled' :
                        o.status === 'delivered' || o.status === 'closed' ? 'completed' : 'rejected'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {getStatusLabel(o.status)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {o.status === 'created' && (
                          <>
                            <button
                              onClick={() => handleConfirm(o.id)}
                              className="btn btn-primary btn-sm"
                            >
                              {language === 'ar' ? 'تأكيد' : 'Confirmer'}
                            </button>
                            <button
                              onClick={async () => { await cancelOrder(o.id); }}
                              className="btn btn-danger btn-sm"
                            >
                              {language === 'ar' ? 'إلغاء' : 'Annuler'}
                            </button>
                          </>
                        )}

                        {o.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedOrder(o);
                                if (availableBatches.length > 0) {
                                  setTargetBatchId(availableBatches[0].id);
                                }
                              }}
                              className="btn btn-accent btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            >
                              <Package size={12} /> {language === 'ar' ? 'ربط الدفعة' : 'Lier Lot'}
                            </button>
                            <button
                              onClick={async () => { await cancelOrder(o.id); }}
                              className="btn btn-danger btn-sm"
                            >
                              {language === 'ar' ? 'إلغاء' : 'Annuler'}
                            </button>
                          </>
                        )}

                        {o.status === 'preparing' && (
                          <button
                            onClick={async () => { await updateOrderStatus(o.id, 'out_for_delivery'); }}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            <Truck size={12} /> {language === 'ar' ? 'شحن' : 'Expédier'}
                          </button>
                        )}

                        {o.status === 'out_for_delivery' && (
                          <button
                            onClick={async () => { await deliverOrder(o.id); }}
                            className="btn btn-accent btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            <CheckCircle size={12} /> {language === 'ar' ? 'تأكيد التوصيل' : 'Confirmer Livraison'}
                          </button>
                        )}

                        {o.status === 'delivered' && (
                          <>
                            {(o as any).paymentStatus !== 'paid' && (
                              <button
                                onClick={() => { setPaymentOrder(o); setPaymentRef(''); }}
                                className="btn btn-accent btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                              >
                                <CreditCard size={12} /> {language === 'ar' ? 'تأكيد الدفع' : 'Paiement'}
                              </button>
                            )}
                            {(o as any).paymentStatus === 'paid' && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 700 }}>
                                ✅ {language === 'ar' ? 'مدفوعة' : 'Payée'}
                              </span>
                            )}
                            <button
                              onClick={async () => { await updateOrderStatus(o.id, 'closed'); }}
                              className="btn btn-secondary btn-sm"
                            >
                              {language === 'ar' ? 'إغلاق' : 'Clôturer'}
                            </button>
                          </>
                        )}

                        {o.status === 'closed' && (
                          <span style={{ fontSize: '0.75rem', color: 'gray', fontWeight: 700 }}>
                            {language === 'ar' ? 'مغلقة' : 'Clôturée'}
                          </span>
                        )}

                        {o.status === 'cancelled' && (
                          <span style={{ fontSize: '0.75rem', color: 'gray', fontStyle: 'italic' }}>
                            {language === 'ar' ? 'ملغاة' : 'Annulée'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} language={language} />
          </>
        )}
      </div>

      {/* PAYMENT CONFIRMATION MODAL */}
      {paymentOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '420px', width: '100%', background: 'white' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.1rem' }}>
              <CreditCard size={18} style={{ color: 'var(--accent)' }} />
              {language === 'ar' ? 'تأكيد الدفع عبر تحويل بنكي' : 'Confirmation de Paiement par Virement'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'gray', marginBottom: '1.25rem' }}>
              {language === 'ar'
                ? `الطلبية ${paymentOrder.id} — المبلغ المستحق: `
                : `Commande ${paymentOrder.id} — Montant dû : `}
              <strong style={{ color: 'var(--accent)' }}>{paymentOrder.totalAmount.toLocaleString()} DA</strong>
            </p>
            <div style={{ backgroundColor: 'var(--neutral-light)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginBottom: '1.25rem', fontSize: '0.8rem', borderInlineStart: '3px solid var(--accent)' }}>
              <strong>{language === 'ar' ? 'معلومات الحساب البنكي لنخيل :' : 'Coordonnées bancaires GourFeed :'}</strong>
              <div style={{ marginTop: '0.35rem', lineHeight: 1.7 }}>
                <div>CPA — Agence Biskra 001</div>
                <div>RIB : <span style={{ fontFamily: 'monospace' }}>007 00100 0000123456 97</span></div>
                <div>{language === 'ar' ? 'المستفيد: مؤسسة نخيل للأعلاف الواحاتية' : 'Bénéficiaire : SPA GourFeed Aliments'}</div>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">
                {language === 'ar' ? 'رقم الإيصال / مرجع التحويل البنكي' : 'N° de virement / référence reçu bancaire'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'ar' ? 'مثال: VIR-2026-00847' : 'Ex: VIR-2026-00847'}
                value={paymentRef}
                onChange={e => setPaymentRef(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleConfirmPayment}
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={!paymentRef.trim() || paymentSubmitting}
              >
                {paymentSubmitting
                  ? (language === 'ar' ? 'جارٍ التسجيل...' : 'Enregistrement...')
                  : (language === 'ar' ? 'تأكيد الدفع' : 'Valider le paiement')}
              </button>
              <button onClick={() => setPaymentOrder(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN BATCH MODAL */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '440px', width: '100%', background: 'white' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.15rem' }}>
              <Package size={18} style={{ color: 'var(--accent)' }} /> {language === 'ar' ? 'ربط دفعة مطابقة للمعايير' : 'Lier un Lot Conforme'}
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'gray', marginBottom: '1.25rem' }}>
              {language === 'ar' ? 'اختر الدفعة المطابقة لربطها بأكياس الطلبية :' : 'Sélectionnez le lot conforme à attribuer aux sacs de la commande'} <strong>{selectedOrder.id}</strong> :
            </p>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">{language === 'ar' ? 'الدفعات المعتمدة في المستودع' : 'Lots certifiés en dépôt'}</label>
              
              {availableBatches.length === 0 ? (
                <div style={{ color: 'var(--status-rejected)', fontSize: '0.85rem' }}>
                  {language === 'ar' ? '⚠️ لا توجد أي دفعة إنتاج معتمدة ومطابقة. يرجى تسجيل تحاليل المختبر أولاً.' : "⚠️ Aucun lot de production certifié conforme. Veuillez d'abord valider des analyses labo."}
                </div>
              ) : (
                <select
                  className="form-input"
                  value={targetBatchId}
                  onChange={(e) => setTargetBatchId(e.target.value)}
                >
                  {availableBatches.map(b => (
                    <option key={b.id} value={b.id}>
                      Lot {b.batchNumber} ({getProductName(b.productId)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={async () => {
                  await updateOrderStatus(selectedOrder.id, 'preparing', targetBatchId);
                  setSelectedOrder(null);
                  setTargetBatchId('');
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={availableBatches.length === 0 || !targetBatchId}
              >
                {language === 'ar' ? 'ربط الدفعة وبدء التحضير' : 'Lier le Lot & Préparer'}
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
