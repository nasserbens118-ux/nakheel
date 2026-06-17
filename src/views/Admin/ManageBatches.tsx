import React, { useState } from 'react';
import { QrCode, PlusCircle, CheckCircle, AlertTriangle, FileText, Download, Award } from 'lucide-react';
import { exportProductionBatches } from '../../services/exportCsv';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { useToast } from '../../components/Toast';
import { ProductionBatch, QualityDecision, CERTIFICATION_PRICE_DA } from '../../services/db';
import { usePagination, Pagination } from '../../components/Pagination';
import { pushNotification } from '../../components/NotificationCenter';

export const ManageBatches: React.FC = () => {
  const { batches, rawMaterialBatches, qualityChecks, products, createBatch, saveQualityCheck } = useNakheel();
  const PAGE_SIZE = 9;
  const { paged: pagedBatches, page, totalPages, setPage, total } = usePagination(batches, PAGE_SIZE);
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  // Stored raw material batches
  const storedRawBatches = rawMaterialBatches.filter(rb => rb.status === 'stored');
  
  // Selection for new batch
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRawBatchIds, setSelectedRawBatchIds] = useState<string[]>([]);
  const [batchQuantity, setBatchQuantity] = useState('2000');
  const [targetProductId, setTargetProductId] = useState(products[0]?.id || 'PROD-001');
  const [formulaUsed, setFormulaUsed] = useState('F-Mouton-Améliorée-V2');

  // Quality check modal
  const [showQCModal, setShowQCModal] = useState<ProductionBatch | null>(null);
  const [moisture, setMoisture] = useState('11.5');
  const [protein, setProtein] = useState('12.5');
  const [fiber, setFiber] = useState('15.0');
  const [impurityCheck, setImpurityCheck] = useState<boolean>(true);
  const [qcStatusChoice, setQcStatusChoice] = useState<QualityDecision>('approved');
  const [qcNotes, setQcNotes] = useState('Ration conforme aux exigences.');
  
  // QR display
  const [activeQRCode, setActiveQRCode] = useState<string | null>(null);

  // Certification requests — persisted in localStorage so they survive page reloads
  const [certRequested, setCertRequested] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nakheel_cert_requested');
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const handleRequestCertification = (b: ProductionBatch) => {
    setCertRequested(prev => {
      const next = new Set([...prev, b.id]);
      localStorage.setItem('nakheel_cert_requested', JSON.stringify([...next]));
      return next;
    });
    pushNotification({
      type: 'quality',
      title: language === 'ar' ? 'طلب شهادة جودة' : 'Demande de certification qualité',
      body: `${language === 'ar' ? 'الدفعة' : 'Lot'} ${b.batchNumber} — ${CERTIFICATION_PRICE_DA.toLocaleString()} DA`,
      role: 'admin',
    });
    toast(
      language === 'ar'
        ? `طلب شهادة الجودة مُرسَل للمسؤول — ${CERTIFICATION_PRICE_DA.toLocaleString()} د.ج`
        : `Demande de certification envoyée à l'admin — ${CERTIFICATION_PRICE_DA.toLocaleString()} DA`,
      'success'
    );
  };

  const handleToggleWasteSelection = (id: string) => {
    if (selectedRawBatchIds.includes(id)) {
      setSelectedRawBatchIds(selectedRawBatchIds.filter(x => x !== id));
    } else {
      setSelectedRawBatchIds([...selectedRawBatchIds, id]);
    }
  };

  const handleCreateBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRawBatchIds.length === 0) {
      toast(language === 'ar' ? 'يرجى تحديد دفعة مادة أولية واحدة على الأقل.' : 'Veuillez sélectionner au moins un lot de matière première oasien.', 'warning');
      return;
    }
    const qty = Number(batchQuantity);
    if (!batchQuantity.trim() || isNaN(qty) || qty <= 0) {
      toast(language === 'ar' ? 'يرجى إدخال كمية إنتاج صحيحة.' : 'Veuillez entrer une quantité de production valide.', 'warning');
      return;
    }
    await createBatch(selectedRawBatchIds, qty, targetProductId, formulaUsed);
    setSelectedRawBatchIds([]);
    setShowCreateModal(false);
  };

  const handleSaveQualityCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showQCModal) return;
    const mNum = Number(moisture);
    const pNum = Number(protein);
    const fNum = Number(fiber);
    if (isNaN(mNum) || isNaN(pNum) || isNaN(fNum)) {
      toast(language === 'ar' ? 'يرجى إدخال مؤشرات كيميائية رقمية صحيحة.' : 'Veuillez renseigner des paramètres chimiques numériques valides.', 'warning');
      return;
    }
    await saveQualityCheck(showQCModal.id, mNum, fNum, pNum, impurityCheck, qcNotes, qcStatusChoice);
    setShowQCModal(null);
  };

  const getProductName = (prodId: string) => {
    const p = products.find(prod => prod.id === prodId);
    if (!p) return language === 'ar' ? 'تركيبة واحاتية' : 'Formule oasienne';
    if (language === 'ar') {
      if (p.id === 'PROD-001') return 'علف خروف واحاتي اقتصادي';
      if (p.id === 'PROD-002') return 'علف تسمين العجول المطور';
    }
    return p.name;
  };

  const getStatusLabel = (status: string) => {
    return t(`status.${status}`);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
            {language === 'ar' ? 'دفعات الإنتاج ومراقبة الجودة' : 'Lots de Production et Contrôle Qualité'}
          </h2>
          <p style={{ color: 'gray', fontSize: '0.9rem' }}>
            {language === 'ar' 
              ? 'اجمع مخلفات الواحات المخزنة، حدد بطاقات الجودة وتابع مسار التتبع' 
              : 'Combinez les déchets oasiens stockés, attribuez les fiches qualité et suivez la traçabilité'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => exportProductionBatches(batches)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Download size={14} /> {language === 'ar' ? 'تصدير CSV' : 'Exporter CSV'}
          </button>
          <button
            onClick={() => {
              setShowCreateModal(true);
              if (products.length > 0) setTargetProductId(products[0].id);
            }}
            className="btn btn-primary"
          >
            <PlusCircle size={18} /> {language === 'ar' ? 'إنشاء دفعة إنتاج جديدة' : 'Créer un Lot de Production'}
          </button>
        </div>
      </div>

      {/* Grid Batches */}
      <div className="grid grid-2 grid-3" style={{ gap: '1.5rem' }}>
        {pagedBatches.map(b => {
          const qc = qualityChecks.find(q => q.productionBatchId === b.id);
          return (
            <div key={b.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'gray', fontWeight: 700 }}>{b.batchNumber}</span>
                  <span className={`badge badge-${
                    b.status === 'draft' ? 'pending' :
                    b.status === 'in_production' ? 'scheduled' :
                    b.status === 'quality_pending' ? 'pending' :
                    b.status === 'approved' || b.status === 'in_stock' ? 'approved' : 'rejected'
                  }`} style={{ fontSize: '0.65rem' }}>
                    {getStatusLabel(b.status)}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                  {getProductName(b.productId)}
                </h3>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {language === 'ar' ? 'الكمية :' : 'Quantité :'} <span className="numeric">{b.producedQuantityKg.toLocaleString()} kg</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'gray', marginBottom: '0.75rem' }}>
                  {language === 'ar' ? 'أنشئ في' : 'Créé le'} {b.productionDate}
                </p>
                
                <div style={{ fontSize: '0.8rem', marginBottom: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--neutral-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-border)' }}>
                  <strong>{language === 'ar' ? 'التركيبة :' : 'Formule :'} </strong>
                  <span>{b.formulaUsed}</span>
                </div>

                <div style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                  <strong>{language === 'ar' ? 'مصدر المواد :' : 'Source de matières :'} </strong>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{b.rawMaterialBatchIds.join(', ')}</span>
                </div>
              </div>

              <div>
                {/* QC Status Check */}
                {b.qualityStatus === 'conforme' ? (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.4rem', 
                    fontSize: '0.75rem', color: 'var(--status-approved)', 
                    backgroundColor: 'var(--status-approved-light)', 
                    padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem', border: '1px solid rgba(46,204,113,0.1)'
                  }}>
                    <CheckCircle size={14} />
                    <span>{language === 'ar' ? 'مطابق للمواصفات (موقع ومصادق)' : 'Conforme (Signé et validé)'}</span>
                  </div>
                ) : b.qualityStatus === 'rejeté' ? (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.4rem', 
                    fontSize: '0.75rem', color: 'var(--status-rejected)', 
                    backgroundColor: 'var(--status-rejected-light)', 
                    padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem', border: '1px solid rgba(192,57,43,0.1)'
                  }}>
                    <AlertTriangle size={14} />
                    <span>{language === 'ar' ? 'مرفوض لعدم المطابقة' : 'Rejeté pour non-conformité'}</span>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.4rem', 
                    fontSize: '0.75rem', color: 'var(--status-pending)', 
                    backgroundColor: 'var(--status-pending-light)', 
                    padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem', border: '1px solid rgba(230,126,34,0.1)'
                  }}>
                    <AlertTriangle size={14} />
                    <span>{language === 'ar' ? 'في انتظار التحليل المخبري' : "En attente d'analyse labo"}</span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {b.qualityStatus === 'à vérifier' ? (
                    <button 
                      onClick={() => {
                        setShowQCModal(b);
                        setMoisture('11.5');
                        setProtein('12.5');
                        setFiber('15.0');
                        setImpurityCheck(true);
                        setQcStatusChoice('approved');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, fontSize: '0.75rem' }}
                    >
                      <FileText size={12} /> {language === 'ar' ? 'تقييم الجودة' : 'Évaluer Qualité'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setShowQCModal(b);
                        if (qc) {
                          setMoisture(qc.humidity.toString());
                          setProtein(qc.proteinTarget.toString());
                          setFiber(qc.fiber.toString());
                          setImpurityCheck(qc.impurityCheck);
                          setQcNotes(qc.safetyNotes);
                          setQcStatusChoice(qc.decision);
                        }
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, fontSize: '0.75rem' }}
                    >
                      <FileText size={12} /> {language === 'ar' ? 'عرض التحليل' : 'Voir Analyse'}
                    </button>
                  )}
                  {b.qualityStatus === 'conforme' && (
                    <button
                      onClick={() => setActiveQRCode(b.batchNumber)}
                      className="btn btn-accent btn-sm"
                      style={{ padding: '0.35rem 0.6rem' }}
                      title={language === 'ar' ? 'توليد رمز QR' : 'Générer QR Code'}
                    >
                      <QrCode size={14} />
                    </button>
                  )}
                  {b.qualityStatus === 'conforme' && (
                    <button
                      onClick={() => handleRequestCertification(b)}
                      disabled={certRequested.has(b.id)}
                      className="btn btn-sm"
                      style={{
                        padding: '0.35rem 0.6rem',
                        background: certRequested.has(b.id) ? '#e8f5e9' : '#fff8e1',
                        border: `1px solid ${certRequested.has(b.id) ? '#a5d6a7' : '#ffe082'}`,
                        color: certRequested.has(b.id) ? '#2e7d32' : '#e65100',
                        fontSize: '0.7rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '3px',
                      }}
                      title={`${language === 'ar' ? 'شهادة الجودة' : 'Certification qualité'} — ${CERTIFICATION_PRICE_DA.toLocaleString()} DA`}
                    >
                      <Award size={12} />
                      {certRequested.has(b.id)
                        ? (language === 'ar' ? 'مُرسَل ✓' : 'Demandée ✓')
                        : (language === 'ar' ? `${CERTIFICATION_PRICE_DA.toLocaleString()} د.ج` : `${CERTIFICATION_PRICE_DA.toLocaleString()} DA`)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} language={language} />

      {/* CREATE BATCH MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'white' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--neutral-border)', paddingBottom: '0.5rem', fontSize: '1.15rem' }}>
              {language === 'ar' ? 'إنشاء دفعة إنتاج جديدة' : 'Créer un Lot de Production'}
            </h3>

            <form onSubmit={handleCreateBatchSubmit}>
              {/* List of raw material batches */}
              <div className="form-group">
                <label className="form-label">
                  {language === 'ar' ? 'اختر دفعات المواد الأولية المخزنة (RMB) :' : 'Sélectionner les lots de matières premières stockées (RMB) :'}
                </label>
                <div style={{ 
                  maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--neutral-border)',
                  borderRadius: 'var(--radius-md)', padding: '0.5rem', backgroundColor: 'var(--neutral-light)'
                }}>
                  {storedRawBatches.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'gray', padding: '1rem', textAlign: 'center' }}>
                      {language === 'ar' ? 'لا توجد دفعات مواد أولية متوفرة في الصوامع.' : 'Aucune matière première stockée (stored) disponible en silo.'}
                    </p>
                  ) : (
                    storedRawBatches.map(rb => (
                      <label 
                        key={rb.id} 
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem', 
                          borderBottom: '1px solid var(--neutral-border)', cursor: 'pointer', fontSize: '0.85rem' 
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRawBatchIds.includes(rb.id)}
                          onChange={() => handleToggleWasteSelection(rb.id)}
                        />
                        <span style={{ fontWeight: 700 }}>{rb.id}</span>
                        <span className="numeric" style={{ color: 'var(--accent)', fontWeight: 800, marginInlineStart: '0.25rem' }}>({rb.totalQuantityKg.toLocaleString()} kg)</span>
                        <span style={{ color: 'gray', fontSize: '0.75rem', marginInlineStart: '0.25rem' }}>— {rb.storageLocation}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Product selection */}
              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'نوع العلف المستهدف' : "Type d'Aliment Cible"}</label>
                <select 
                  className="form-input"
                  value={targetProductId}
                  onChange={(e) => setTargetProductId(e.target.value)}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{getProductName(p.id)}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'الكمية المنتجة من العلف (كغ)' : "Quantité d'aliment produite (kg)"}</label>
                <input
                  type="number"
                  className="form-input"
                  value={batchQuantity}
                  onChange={(e) => setBatchQuantity(e.target.value)}
                  placeholder="Ex: 2000"
                />
              </div>

              {/* Formula */}
              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'التركيبة المستخدمة' : 'Formule utilisée'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: F-Mouton-Améliorée-V2"
                  value={formulaUsed}
                  onChange={(e) => setFormulaUsed(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={selectedRawBatchIds.length === 0}>
                  {language === 'ar' ? 'إنشاء الدفعة' : 'Créer le Lot'}
                </button>
                <button type="button" onClick={() => { setShowCreateModal(false); setSelectedRawBatchIds([]); }} className="btn btn-secondary" style={{ flex: 1 }}>
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUALITY CHECK MODAL */}
      {showQCModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '620px', width: '100%', maxHeight: '95vh', overflowY: 'auto', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--neutral-border)', paddingBottom: '0.5rem' }}>
              <h3 style={{ color: 'var(--primary)', fontSize: '1.15rem' }}>
                {language === 'ar' ? 'تقرير المختبر والجودة : دفعة' : 'Bulletin Qualité Labo : Lot'} {showQCModal.batchNumber}
              </h3>
              <button onClick={() => setShowQCModal(null)} style={{ border: 'none', background: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '0.5rem 0' }}>
              <form onSubmit={handleSaveQualityCheckSubmit}>
                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'ar' ? 'نسبة الرطوبة (%)' : "Taux d'Humidité (%)"}</label>
                    <input
                      type="number" step="0.1" className="form-input" value={moisture}
                      onChange={(e) => setMoisture(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'ar' ? 'نسبة البروتينات Mesurée (%)' : 'Taux de Protéines mesurées (%)'}</label>
                    <input
                      type="number" step="0.1" className="form-input" value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'ar' ? 'الألياف Mesurée (%)' : 'Fibres mesurées (%)'}</label>
                    <input
                      type="number" step="0.1" className="form-input" value={fiber}
                      onChange={(e) => setFiber(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'ar' ? 'فحص الشوائب والأجسام الغريبة' : 'Vérification Impuretés'}</label>
                    <select className="form-input" value={String(impurityCheck)} onChange={(e) => setImpurityCheck(e.target.value === 'true')}>
                      <option value="true">{language === 'ar' ? 'نظيف / مطابق' : 'Propre / Conforme'}</option>
                      <option value="false">{language === 'ar' ? 'وجود رمال أو شوائب' : 'Présence de sable/débris'}</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ar' ? 'قرار مطابقة الجودة' : 'Décision de Conformité Qualité'}</label>
                  <select 
                    className="form-input" 
                    value={qcStatusChoice} 
                    onChange={(e) => setQcStatusChoice(e.target.value as any)}
                    disabled={showQCModal.qualityStatus !== 'à vérifier'}
                  >
                    <option value="approved">{language === 'ar' ? 'مقبول / مطابق (تحرير للبيع)' : 'Accepté / Conforme (Libérer pour vente)'}</option>
                    <option value="needs_review">{language === 'ar' ? 'تحت المراجعة / فرز' : 'À Trier / Revoir'}</option>
                    <option value="rejected">{language === 'ar' ? 'مرفوض (غير مطابق)' : 'Rejeté (Non-conforme)'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ar' ? 'ملاحظات السلامة الكيميائية والفيزيائية' : 'Notes de sécurité physico-chimique'}</label>
                  <textarea
                    rows={2} className="form-input" value={qcNotes}
                    onChange={(e) => setQcNotes(e.target.value)}
                    disabled={showQCModal.qualityStatus !== 'à vérifier'}
                  />
                </div>

                <button 
                  type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}
                  disabled={showQCModal.qualityStatus !== 'à vérifier'}
                >
                  {showQCModal.qualityStatus !== 'à vérifier' ? (language === 'ar' ? 'تم تسجيل التقرير' : 'Bulletin Enregistré') : (language === 'ar' ? 'تأكيد وحفظ' : 'Valider & Enregistrer')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR Code overlay modal */}
      {activeQRCode && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '340px', width: '100%', textAlign: 'center', background: 'white', padding: '2rem' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.15rem' }}>
              {language === 'ar' ? 'رمز QR للتتبع' : 'QR Code de Traçabilité'}
            </h3>
            
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('https://nakheel-trace.dz/batch/' + activeQRCode)}&color=2E5A44&bgcolor=ffffff`}
              alt={`QR ${activeQRCode}`}
              width={200} height={200}
              style={{ display: 'block', margin: '0 auto 1rem auto', borderRadius: 'var(--radius-sm)', border: '3px solid var(--primary)' }}
            />
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.2rem', fontSize: '0.95rem' }}>
              {language === 'ar' ? 'كيس علف نخيل' : "Sac d'Aliment Nakheel"}
            </h4>
            <code style={{ fontSize: '0.7rem', color: 'gray', display: 'block', marginBottom: '1.25rem' }}>
              nakheel-trace.dz/batch/{activeQRCode}
            </code>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent('https://nakheel-trace.dz/batch/' + activeQRCode)}&color=2E5A44&bgcolor=ffffff`}
                download={`etiquette-${activeQRCode}.png`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ textDecoration: 'none', textAlign: 'center' }}
              >
                {language === 'ar' ? 'تحميل الملصق PNG' : 'Télécharger Étiquette PNG'}
              </a>
              <button onClick={() => { window.print(); }} className="btn btn-secondary">
                {language === 'ar' ? 'طباعة' : 'Imprimer'}
              </button>
              <button onClick={() => setActiveQRCode(null)} className="btn btn-secondary">
                {language === 'ar' ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
