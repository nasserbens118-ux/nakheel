import React, { useState } from 'react';
import { Truck, Layers, Award, Database, QrCode, PlusCircle, CheckCircle, AlertTriangle, FileText, MapPin, Lock, Star } from 'lucide-react';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { useToast } from '../../components/Toast';
import { ProductionBatch, WasteRequest, Product, RawMaterialBatch, HumidityLevel, ImpurityLevel, QualityDecision, User } from '../../services/db';

interface OperatorDashboardProps {
  user?: User | null;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ user }) => {
  const isPro = user?.subscriptionPlan === 'pro';
  const {
    users, wasteRequests, rawMaterialBatches, batches, products, qualityChecks, inventory,
    updateWasteRequestStatus, evaluateWasteQuality, createBatch, saveQualityCheck, updateBatchStatus
  } = useNakheel();

  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'matiere' | 'lots' | 'qualite' | 'stocks'>('matiere');

  // --- RAW MATERIALS STATES ---
  const [selectedWasteEval, setSelectedWasteEval] = useState<WasteRequest | null>(null);
  const [humidityInput, setHumidityInput] = useState<HumidityLevel>('low');
  const [impurityInput, setImpurityInput] = useState<ImpurityLevel>('low');
  const [visualStateInput, setVisualStateInput] = useState<'sec' | 'humide' | 'mélangé' | 'douteux'>('sec');
  
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPickup, setSelectedPickup] = useState<WasteRequest | null>(null);

  // --- BATCH CREATION STATES ---
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [selectedRawBatches, setSelectedRawBatches] = useState<string[]>([]);
  const [batchQty, setBatchQty] = useState('1000');
  const [targetProductId, setTargetProductId] = useState(products[0]?.id || 'PROD-001');
  const [formulaUsed, setFormulaUsed] = useState('F-Mouton-Améliorée-V2');

  // --- QA EVALUATION STATES ---
  const [selectedBatchQA, setSelectedBatchQA] = useState<ProductionBatch | null>(null);
  const [qaMoisture, setQaMoisture] = useState('11.5');
  const [qaProtein, setQaProtein] = useState('12.5');
  const [qaFiber, setQaFiber] = useState('14.8');
  const [qaImpuritiesCheck, setQaImpuritiesCheck] = useState<boolean>(true);
  const [qaStatusChoice, setQaStatusChoice] = useState<QualityDecision>('approved');
  const [qaNotes, setQaNotes] = useState('Le lot de production présente un profil biochimique optimal.');

  // Driver / Vehicle for pickup scheduling
  const [driverName, setDriverName]   = useState('Chauffeur Nakheel');
  const [vehicleRef, setVehicleRef]   = useState('16-TKC-09');

  // --- QR MODAL ---
  const [activeQR, setActiveQR] = useState<string | null>(null);

  const incomingWastes = wasteRequests.filter(w => w.status !== 'rejected');

  const getWasteLabel = (type: string) => {
    if (language === 'ar') {
      if (type === 'palm_leaves') return 'سعف جاف';
      if (type === 'fibers') return 'ألياف واحاتية';
      if (type === 'dates_low_quality') return 'تمور منخفضة الجودة';
      return 'مزيج واحاتي';
    }
    const WASTE_LABELS: Record<string, string> = {
      palm_leaves: 'Palmes sèches',
      fibers: 'Fibres oasiennes',
      dates_low_quality: 'Dattes déclassées',
      mixed: 'Mélange oasien'
    };
    return WASTE_LABELS[type] || type;
  };

  const handleToggleRawBatchSelection = (id: string) => {
    if (selectedRawBatches.includes(id)) {
      setSelectedRawBatches(selectedRawBatches.filter(x => x !== id));
    } else {
      setSelectedRawBatches([...selectedRawBatches, id]);
    }
  };

  const handleCreateBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRawBatches.length === 0) {
      toast(language === 'ar' ? 'يرجى تحديد دفعة واحدة على الأقل من المواد الأولية المخزنة.' : 'Veuillez sélectionner au moins un lot de matière première oasienne stocké.', 'warning');
      return;
    }
    const qty = Number(batchQty);
    if (isNaN(qty) || qty <= 0) {
      toast(language === 'ar' ? 'يرجى إدخال كمية صحيحة.' : 'Veuillez entrer une quantité valide.', 'warning');
      return;
    }
    await createBatch(selectedRawBatches, qty, targetProductId, formulaUsed);
    setSelectedRawBatches([]);
    setShowCreateBatch(false);
  };

  const handleQASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchQA) return;
    await saveQualityCheck(
      selectedBatchQA.id,
      Number(qaMoisture),
      Number(qaFiber),
      Number(qaProtein),
      qaImpuritiesCheck,
      qaNotes,
      qaStatusChoice
    );
    setSelectedBatchQA(null);
  };

  const getSupplierName = (supplierId: string) => {
    const u = users.find(usr => usr.id === supplierId);
    return u ? u.fullName : (language === 'ar' ? 'مورد واحاتي' : 'Fournisseur oasien');
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

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--neutral-border)', paddingBottom: '1rem' }}>
        <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers style={{ color: 'var(--accent)' }} /> {language === 'ar' ? 'فضاء مشغل الإنتاج والمختبر' : 'Espace Opérateur de Production'}
        </h2>
        <p style={{ color: 'gray', fontSize: '0.9rem' }}>
          {language === 'ar' 
            ? 'قم بالتصريح بدفعات المواد الأولية المعالجة، أطلق دورات تصنيع الأعلاف وأدخل نتائج التحاليل الكيميائية المخبرية.' 
            : 'Gérez le cycle de fabrication : réception des matières oasiennes, formulation, analyses laboratoire et suivi des stocks.'}
        </p>
      </div>

      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveSubTab('matiere')}
          className={`btn ${activeSubTab === 'matiere' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          <Truck size={16} /> {language === 'ar' ? '1. المخزن والاستلام' : '1. Dépôt & Réceptions'}
        </button>
        <button 
          onClick={() => setActiveSubTab('lots')}
          className={`btn ${activeSubTab === 'lots' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          <Layers size={16} /> {language === 'ar' ? '2. الدفعات والإنتاج' : '2. Lots & Production'}
        </button>
        <button 
          onClick={() => setActiveSubTab('qualite')}
          className={`btn ${activeSubTab === 'qualite' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          <Award size={16} /> {language === 'ar' ? '3. تحاليل المختبر والجودة' : '3. Analyses Labo Quality'}
        </button>
        <button 
          onClick={() => setActiveSubTab('stocks')}
          className={`btn ${activeSubTab === 'stocks' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          <Database size={16} /> {language === 'ar' ? '4. مخزون الأعلاف' : '4. Stocks Aliments'}
        </button>
      </div>

      {/* TABS CONTENT */}

      {/* TAB 1: RAW MATERIALS */}
      {activeSubTab === 'matiere' && (
        <div className="card animate-fade-in">
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{language === 'ar' ? '📥 تدفق استلام المخلفات' : '📥 Flux de Réception des Résidus'}</h3>
          <p style={{ color: 'gray', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {language === 'ar' 
              ? 'تابع تفريغ وتخزين المواد الأولية في الصوامع. تقييم الجودة إجباري قبل التخزين.' 
              : "Suivez le déchargement et la mise en silo des matières premières. L'évaluation qualité est obligatoire avant stockage."}
          </p>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{language === 'ar' ? 'المنتج' : 'Producteur'}</th>
                  <th>{language === 'ar' ? 'المادة' : 'Matière'}</th>
                  <th>{language === 'ar' ? 'الكمية' : 'Quantité'}</th>
                  <th>{language === 'ar' ? 'المصدر' : 'Provenance'}</th>
                  <th>{language === 'ar' ? 'الحالة' : 'Statut'}</th>
                  <th>{language === 'ar' ? 'جودة' : 'Qualité'}</th>
                  <th>{language === 'ar' ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {incomingWastes.map(w => (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 700 }}>{w.id}</td>
                    <td>{getSupplierName(w.supplierId)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{getWasteLabel(w.wasteType)}</td>
                    <td className="numeric" style={{ fontWeight: 800, direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>
                      {w.estimatedQuantityKg.toLocaleString()} kg
                    </td>
                    <td><MapPin size={12} style={{ display: 'inline', marginInlineEnd: '0.2rem' }} /> {w.location}</td>
                    <td>
                      <span className={`badge badge-${
                        w.status === 'submitted' ? 'pending' :
                        w.status === 'ai_scored' ? 'pending' :
                        w.status === 'accepted' ? 'approved' :
                        w.status === 'scheduled_for_pickup' ? 'scheduled' :
                        w.status === 'collected' ? 'scheduled' :
                        w.status === 'received' ? 'completed' : 'approved'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {t(`status.${w.status}`)}
                      </span>
                    </td>
                    <td>
                      {w.aiQualityScore > 0 ? (
                        <span className="numeric" style={{ fontWeight: 700, color: 'var(--primary)', direction: 'ltr' }}>
                          Score: {w.aiQualityScore}/100
                        </span>
                      ) : (
                        <span style={{ color: 'gray', fontStyle: 'italic' }}>{language === 'ar' ? 'لم يتم تقييمه' : 'Non évalué'}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {w.status === 'submitted' && (
                          <button 
                            onClick={() => {
                              setSelectedWasteEval(w);
                              setHumidityInput('low');
                              setImpurityInput('low');
                              setVisualStateInput('sec');
                            }}
                            className="btn btn-secondary btn-sm"
                          >
                            {language === 'ar' ? 'تقييم الجودة' : 'Évaluer Qualité'}
                          </button>
                        )}
                        {w.status === 'ai_scored' && (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              onClick={async () => {
                                if (w.aiQualityScore < 50) {
                                  await updateWasteRequestStatus(w.id, 'rejected');
                                } else {
                                  await updateWasteRequestStatus(w.id, 'accepted');
                                }
                              }}
                              className="btn btn-primary btn-sm"
                            >
                              {language === 'ar' ? `تأكيد (${w.aiQualityScore >= 50 ? 'قبول' : 'رفض'})` : `Confirmer (${w.aiQualityScore >= 50 ? 'Accepter' : 'Rejeter'})`}
                            </button>
                            <button
                              onClick={async () => { await updateWasteRequestStatus(w.id, 'rejected'); }}
                              className="btn btn-danger btn-sm"
                            >
                              {language === 'ar' ? 'رفض' : 'Rejeter'}
                            </button>
                          </div>
                        )}
                        {w.status === 'accepted' && (
                          <button 
                            onClick={() => setSelectedPickup(w)}
                            className="btn btn-primary btn-sm"
                          >
                            {language === 'ar' ? 'جدولة الشاحنة' : 'Planifier Camion'}
                          </button>
                        )}
                        {w.status === 'scheduled_for_pickup' && (
                          <button 
                            onClick={async () => { await updateWasteRequestStatus(w.id, 'collected'); }}
                            className="btn btn-accent btn-sm"
                          >
                            {language === 'ar' ? 'تحديد كتم الجمع' : 'Marquer Collecté'}
                          </button>
                        )}
                        {w.status === 'collected' && (
                          <button 
                            onClick={async () => { await updateWasteRequestStatus(w.id, 'received'); }}
                            className="btn btn-primary btn-sm"
                          >
                            {language === 'ar' ? 'استلام' : 'Réceptionner'}
                          </button>
                        )}
                        {w.status === 'received' && (
                          <button 
                            onClick={async () => { await updateWasteRequestStatus(w.id, 'stored'); }}
                            className="btn btn-accent btn-sm"
                          >
                            {language === 'ar' ? 'تخزين في الصومعة' : 'Stocker en Silo'}
                          </button>
                        )}
                        {w.status === 'stored' && (
                          <span style={{ color: 'green', fontWeight: 700 }}>✓ {language === 'ar' ? 'في الصومعة' : 'Silo RMB'}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BATCH PRODUCTION */}
      {activeSubTab === 'lots' && (
        <div className="card animate-fade-in" style={{ position: 'relative' }}>
          {!isPro && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(2px)', zIndex: 10, borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem', textAlign: 'center' }}>
              <Lock size={32} color="#8e44ad" />
              <h3 style={{ color: 'var(--primary)', margin: 0 }}>
                {language === 'ar' ? 'الدفعات غير المحدودة — Pro فقط' : 'Lots illimités — Plan Pro uniquement'}
              </h3>
              <p style={{ color: 'gray', fontSize: '0.88rem', maxWidth: '360px', margin: 0 }}>
                {language === 'ar'
                  ? 'بالخطة المجانية يمكنك إنشاء 5 دفعات فقط في الشهر. قم بالترقية إلى Pro للحصول على دفعات غير محدودة ولوحة تحليلية متقدمة.'
                  : 'Avec le plan Gratuit, vous êtes limité à 5 lots par mois. Passez au plan Pro pour des lots illimités et un dashboard analytique avancé.'}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['Lots illimités', 'Dashboard analytique', 'Export CSV/PDF', 'Support prioritaire'].map(f => (
                  <span key={f} style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '999px', fontWeight: 600 }}>
                    <Star size={10} style={{ verticalAlign: '-1px', marginRight: '3px' }} />{f}
                  </span>
                ))}
              </div>
              <button
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.5rem' }}
                onClick={() => window.dispatchEvent(new CustomEvent('nakheel-navigate', { detail: 'subscription' }))}
              >
                <Star size={14} />
                {language === 'ar' ? 'الترقية إلى Pro — 15,000 د.ج/شهر' : 'Passer au Pro — 15 000 DA/mois'}
              </button>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ color: 'var(--primary)' }}>{language === 'ar' ? '🧱 تصنيع دفعات الأعلاف' : "🧱 Fabrication de Lots d'Aliments"}</h3>
              <p style={{ color: 'gray', fontSize: '0.85rem' }}>
                {language === 'ar'
                  ? 'اجمع دفعات المواد الأولية المخزنة (RMB) لبدء دورة الخلط.'
                  : 'Regroupez des lots de matières premières stockées (RMB) pour lancer un cycle de mélange.'}
              </p>
            </div>
            <button 
              onClick={() => setShowCreateBatch(true)}
              className="btn btn-primary btn-sm"
            >
              <PlusCircle size={16} /> {language === 'ar' ? 'إطلاق دفعة' : 'Lancer un Lot'}
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'رقم الدفعة' : 'N° Lot'}</th>
                  <th>{language === 'ar' ? 'المنتج المستهدف' : 'Produit Cible'}</th>
                  <th>{language === 'ar' ? 'التركيبة المستخدمة' : 'Formule utilisée'}</th>
                  <th>{language === 'ar' ? 'الكمية (كغ)' : 'Quantité (kg)'}</th>
                  <th>{language === 'ar' ? 'مصدر المادة' : 'Source Matière'}</th>
                  <th>{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th>{language === 'ar' ? 'حالة الإنتاج' : 'Statut Production'}</th>
                  <th>{language === 'ar' ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700 }}>{b.batchNumber}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{getProductName(b.productId)}</td>
                    <td>{b.formulaUsed}</td>
                    <td className="numeric" style={{ fontWeight: 800, direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>
                      {b.producedQuantityKg.toLocaleString()} kg
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{b.rawMaterialBatchIds.join(', ')}</td>
                    <td>{b.productionDate}</td>
                    <td>
                      <span className={`badge badge-${
                        b.status === 'draft' ? 'pending' :
                        b.status === 'in_production' ? 'scheduled' :
                        b.status === 'quality_pending' ? 'pending' :
                        b.status === 'approved' || b.status === 'in_stock' ? 'approved' : 'rejected'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {t(`status.${b.status}`)}
                      </span>
                    </td>
                    <td>
                      {b.status === 'draft' && (
                        <button 
                          onClick={async () => { await updateBatchStatus(b.id, 'in_production'); }}
                          className="btn btn-primary btn-sm"
                        >
                          {language === 'ar' ? 'بدء الطحن' : 'Démarrer Broyage'}
                        </button>
                      )}
                      {b.status === 'in_production' && (
                        <button 
                          onClick={async () => { await updateBatchStatus(b.id, 'quality_pending'); }}
                          className="btn btn-accent btn-sm"
                        >
                          {language === 'ar' ? 'أخذ عينة للمختber' : 'Échantillonner Labo'}
                        </button>
                      )}
                      {b.status === 'quality_pending' && (
                        <span style={{ color: 'orange', fontWeight: 600 }}>{language === 'ar' ? 'قيد الفحص المخبري' : 'En test labo'}</span>
                      )}
                      {(b.status === 'approved' || b.status === 'in_stock') && (
                        <span style={{ color: 'green', fontWeight: 700 }}>{language === 'ar' ? 'مطابق للمواصفات' : 'Conforme'}</span>
                      )}
                      {b.status === 'rejected' && (
                        <span style={{ color: 'red', fontWeight: 700 }}>{language === 'ar' ? 'مرفوض' : 'Rejeté'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: QUALITY CHECKS */}
      {activeSubTab === 'qualite' && (
        <div className="card animate-fade-in">
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{language === 'ar' ? '🧪 تحاليل المختبر وشهادات الجودة' : '🧪 Analyses Labo & Signatures de Qualité'}</h3>
          <p style={{ color: 'gray', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {language === 'ar' 
              ? 'املأ التقارير الفيزيائية والكيميائية لتحرير دفعات الأعلاف نحو مخزن البيع.' 
              : "Remplissez les rapports physico-chimiques pour libérer les lots vers l'entrepôt de vente."}
          </p>

          <div className="grid grid-2 grid-3" style={{ gap: '1.25rem' }}>
            {batches.map(b => {
              const check = qualityChecks.find(c => c.productionBatchId === b.id);
              return (
                <div key={b.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'gray' }}>{b.batchNumber}</strong>
                      <span className={`badge badge-${b.qualityStatus === 'conforme' ? 'approved' : b.qualityStatus === 'rejeté' ? 'rejected' : 'pending'}`}>
                        {language === 'ar' ? (b.qualityStatus === 'conforme' ? 'مطابق' : b.qualityStatus === 'rejeté' ? 'مرفوض' : 'معلق') : b.qualityStatus}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1rem', color: 'var(--primary)' }}>{getProductName(b.productId)}</h4>
                    <span className="numeric" style={{ fontSize: '0.75rem', color: 'gray', display: 'block', marginBottom: '0.75rem', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>
                      {language === 'ar' ? `الكمية : ${b.producedQuantityKg.toLocaleString()} كغ` : `Quantité : ${b.producedQuantityKg.toLocaleString()} kg`}
                    </span>
                    
                    {check ? (
                      <div style={{ backgroundColor: 'var(--neutral-light)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                        <div>{language === 'ar' ? 'الرطوبة Mesurée :' : 'Humidité Mesurée :'} <strong className="numeric" style={{ direction: 'ltr' }}>{check.humidity}%</strong></div>
                        <div>{language === 'ar' ? 'البروتينات Mesurée :' : 'Protéines Mesurée :'} <strong className="numeric" style={{ direction: 'ltr' }}>{check.proteinTarget}%</strong></div>
                        <div>{language === 'ar' ? 'الشوائب :' : 'Impuretés :'} <strong>{check.impurityCheck ? (language === 'ar' ? 'نظيف' : 'Propre') : (language === 'ar' ? 'موجودة' : 'Présentes')}</strong></div>
                        <div style={{ fontStyle: 'italic', marginTop: '0.25rem' }}>"{check.safetyNotes}"</div>
                      </div>
                    ) : (
                      <div style={{ padding: '0.5rem', border: '1px dashed var(--neutral-border)', borderRadius: '4px', fontSize: '0.75rem', color: 'orange', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <AlertTriangle size={12} /> {language === 'ar' ? 'جاهز للتحليل المخبري' : 'Prêt pour analyse labo'}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    {!check ? (
                      <button 
                        onClick={() => {
                          setSelectedBatchQA(b);
                          setQaMoisture('11.5');
                          setQaFiber('14.8');
                          setQaProtein('12.5');
                          setQaImpuritiesCheck(true);
                          setQaStatusChoice('approved');
                          setQaNotes('Le lot de production présente un profil biochimique optimal.');
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%' }}
                        disabled={b.status !== 'quality_pending'}
                      >
                        {language === 'ar' ? 'إنشاء تقرير المختبر' : 'Créer Bulletin Labo'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => setActiveQR(b.batchNumber)}
                        className="btn btn-accent btn-sm"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                      >
                        <QrCode size={13} /> {language === 'ar' ? 'عرض رمز QR للتتبع' : 'Voir QR Code Traçabilité'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: FINISHED STOCKS */}
      {activeSubTab === 'stocks' && (
        <div className="card animate-fade-in">
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{language === 'ar' ? '📦 تتبع مخزون المنتجات النهائية' : '📦 Suivi des Stocks Finis'}</h3>
          <p style={{ color: 'gray', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {language === 'ar' 
              ? 'شاهد أكياس الأعلاف المتوفرة، والكميات المحجوزة لطلبات المربين، والكميات المباعة.' 
              : "Visualisez les sacs d'aliments disponibles, les quantités réservées aux commandes éleveurs et les volumes vendus."}
          </p>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'اسم المنتج' : 'Nom du Produit'}</th>
                  <th>{language === 'ar' ? 'المواشي المستهدفة' : 'Cible Animal'}</th>
                  <th>{language === 'ar' ? 'نوع التركيبة' : 'Type Formule'}</th>
                  <th>{language === 'ar' ? 'وزن الكيس' : 'Poids Sac'}</th>
                  <th>{language === 'ar' ? 'المخزون الفعلي (كغ)' : 'Stock Physique (kg)'}</th>
                  <th>{language === 'ar' ? 'الكمية المحجوزة (كغ)' : 'Quantité Réservée (kg)'}</th>
                  <th>{language === 'ar' ? 'الكمية المباعة (كغ)' : 'Quantité Vendue (kg)'}</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const prodInv = inventory.filter(i => i.productId === p.id);
                  const totalAvail = prodInv.reduce((sum, i) => sum + i.availableQuantityKg, 0);
                  const totalReserved = prodInv.reduce((sum, i) => sum + i.reservedQuantityKg, 0);
                  const totalSold = prodInv.reduce((sum, i) => sum + i.soldQuantityKg, 0);
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{getProductName(p.id)}</td>
                      <td>
                        {p.animalTarget === 'sheep' ? (language === 'ar' ? 'أغنام' : 'Ovins') : (language === 'ar' ? 'أبقار' : 'Bovins')}
                      </td>
                      <td>
                        {p.formulaType === 'economic' 
                          ? (language === 'ar' ? 'اقتصادية' : 'Économique') 
                          : p.formulaType === 'standard'
                          ? (language === 'ar' ? 'معيارية' : 'Standard')
                          : (language === 'ar' ? 'محسنة' : 'Améliorée')}
                      </td>
                      <td className="numeric" style={{ fontWeight: 700, direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>{p.bagWeightKg} kg</td>
                      <td className="numeric" style={{ fontWeight: 800, color: 'green', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>{totalAvail.toLocaleString()} kg</td>
                      <td className="numeric" style={{ fontWeight: 700, color: 'orange', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>{totalReserved.toLocaleString()} kg</td>
                      <td className="numeric" style={{ fontWeight: 700, color: 'var(--accent)', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>{totalSold.toLocaleString()} kg</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- OVERLAY MODALS --- */}

      {/* MODAL 1: RAW WASTE EVALUATION */}
      {selectedWasteEval && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '500px', width: '100%', background: 'white' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{language === 'ar' ? 'فحص وتصنيف المادة الأولية' : "Inspection & Classification Matière"}</h3>
            
            <div className="form-group">
              <label className="form-label">{language === 'ar' ? 'مستوى الرطوبة التقديري' : "Niveau d'humidité estimé"}</label>
              <select 
                className="form-input"
                value={humidityInput}
                onChange={(e) => setHumidityInput(e.target.value as HumidityLevel)}
              >
                <option value="low">{language === 'ar' ? 'منخفض / جاف (مثالي)' : 'Faible / Sec (Optimal)'}</option>
                <option value="medium">{language === 'ar' ? 'متوسط / رطب' : 'Moyen / Humide'}</option>
                <option value="high">{language === 'ar' ? 'مرتفع / رطب جداً (خطر)' : 'Élevé / Très humide (Risque)'}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'ar' ? 'وجود شوائب أو أجسام غريبة' : "Présence d'impuretés ou corps étrangers"}</label>
              <select 
                className="form-input"
                value={impurityInput}
                onChange={(e) => setImpurityInput(e.target.value as ImpurityLevel)}
              >
                <option value="low">{language === 'ar' ? 'منخفض / نظيف (مطابق)' : 'Faible / Propre (Conforme)'}</option>
                <option value="medium">{language === 'ar' ? 'متوسط / بعض الشوائب' : 'Moyen / Quelques débris'}</option>
                <option value="high">{language === 'ar' ? 'مرتفع / شوائب كثيرة' : 'Élevé / Mélange de détritus'}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'ar' ? 'الحالة البصرية للمادة' : 'État visuel de la matière'}</label>
              <select className="form-input" value={visualStateInput} onChange={(e) => setVisualStateInput(e.target.value as typeof visualStateInput)}>
                <option value="sec">{language === 'ar' ? 'جاف / نظيف' : 'Sec / Propre'}</option>
                <option value="humide">{language === 'ar' ? 'رطب' : 'Humide'}</option>
                <option value="mélangé">{language === 'ar' ? 'مختلط' : 'Mélangé'}</option>
                <option value="douteux">{language === 'ar' ? 'مشكوك فيه' : 'Douteux'}</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button
                onClick={async () => {
                  await evaluateWasteQuality(selectedWasteEval.id, humidityInput, impurityInput, visualStateInput);
                  setSelectedWasteEval(null);
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {language === 'ar' ? 'حفظ تقييم الجودة' : 'Sauvegarder Évaluation Qualité'}
              </button>
              <button onClick={() => setSelectedWasteEval(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PLAN PICKUP DATE */}
      {selectedPickup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '420px', width: '100%', background: 'white' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{language === 'ar' ? 'جدولة عملية جمع المخلفات' : 'Programmer la tournée de Collecte'}</h3>
            <div className="form-group">
              <label className="form-label">{language === 'ar' ? 'التاريخ المبرمج للشاحنة' : "Date prévue du camion"}</label>
              <input
                type="date" className="form-input"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="grid grid-2" style={{ gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'اسم السائق' : 'Nom du chauffeur'}</label>
                <input type="text" className="form-input" value={driverName} onChange={e => setDriverName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'مرجع المركبة' : 'Immatriculation véhicule'}</label>
                <input type="text" className="form-input" placeholder="16-TKC-09" value={vehicleRef} onChange={e => setVehicleRef(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={async () => {
                  await updateWasteRequestStatus(selectedPickup.id, 'scheduled_for_pickup', scheduledDate, driverName || undefined, vehicleRef || undefined);
                  setSelectedPickup(null);
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {language === 'ar' ? 'تأكيد اللوجستيات' : 'Confirmer Logistique'}
              </button>
              <button onClick={() => setSelectedPickup(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE BATCH */}
      {showCreateBatch && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'white' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{language === 'ar' ? 'إنشاء دفعة إنتاج جديدة' : 'Créer un Lot de Production'}</h3>
            
            <form onSubmit={handleCreateBatchSubmit}>
              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'المواد الأولية المخزنة والمتوفرة في الصوامع (RMB) :' : 'Matières premières stockées disponibles en Silo (RMB) :'}</label>
                <div style={{ 
                  maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--neutral-border)',
                  borderRadius: '4px', padding: '0.5rem', backgroundColor: 'var(--neutral-light)'
                }}>
                  {rawMaterialBatches.filter(rb => rb.status === 'stored').length === 0 ? (
                    <div style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'gray' }}>
                      {language === 'ar' ? 'لا توجد دفعات مواد أولية متوفرة في الصوامع.' : 'Aucun lot de matière oasienne disponible en silo.'}
                    </div>
                  ) : (
                    rawMaterialBatches.filter(rb => rb.status === 'stored').map(rb => (
                      <label key={rb.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox"
                          checked={selectedRawBatches.includes(rb.id)}
                          onChange={() => handleToggleRawBatchSelection(rb.id)}
                        />
                        <span className="numeric" style={{ fontWeight: 700, direction: 'ltr' }}>{rb.id} ({rb.totalQuantityKg.toLocaleString()} kg)</span>
                        <span style={{ color: 'gray', marginInlineStart: '0.25rem' }}>— {rb.storageLocation}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'المنتج النهائي المستهدف' : "Produit d'Aliment Cible"}</label>
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

              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'الكمية المراد تصنيعها (كغ)' : 'Quantité à fabriquer (kg)'}</label>
                <input 
                  type="number" className="form-input"
                  value={batchQty}
                  onChange={(e) => setBatchQty(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'التركيبة المستخدمة' : 'Formule utilisée'}</label>
                <input 
                  type="text" className="form-input" placeholder="Ex: F-Mouton-Améliorée-V2"
                  value={formulaUsed}
                  onChange={(e) => setFormulaUsed(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={selectedRawBatches.length === 0}>
                  {language === 'ar' ? 'إطلاق الإنتاج' : 'Lancer la production'}
                </button>
                <button type="button" onClick={() => { setShowCreateBatch(false); setSelectedRawBatches([]); }} className="btn btn-secondary" style={{ flex: 1 }}>
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QA LAB REPORT MODAL --- */}
      {selectedBatchQA && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '550px', width: '100%', background: 'white' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{language === 'ar' ? 'تسجيل تقرير التحليل المخبري' : "Enregistrer le Bulletin d'Analyse Labo"}</h3>
            
            <form onSubmit={handleQASubmit}>
              <div className="grid grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{language === 'ar' ? 'الرطوبة Mesurée (%)' : 'Humidité mesurée (%)'}</label>
                  <input type="number" step="0.1" className="form-input" value={qaMoisture} onChange={(e) => setQaMoisture(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{language === 'ar' ? 'البروتينات Mesurée (%)' : 'Protéines mesurées (%)'}</label>
                  <input type="number" step="0.1" className="form-input" value={qaProtein} onChange={(e) => setQaProtein(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{language === 'ar' ? 'الألياف Mesurée (%)' : 'Fibres mesurées (%)'}</label>
                  <input type="number" step="0.1" className="form-input" value={qaFiber} onChange={(e) => setQaFiber(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{language === 'ar' ? 'فحص الشوائب والأجسام الغريبة' : 'Vérification Impuretés'}</label>
                  <select className="form-input" value={String(qaImpuritiesCheck)} onChange={(e) => setQaImpuritiesCheck(e.target.value === 'true')}>
                    <option value="true">{language === 'ar' ? 'نظيف / مطابق' : 'Propre / Conforme'}</option>
                    <option value="false">{language === 'ar' ? 'شوائب واحاتية موجودة' : 'Débris oasiens présents'}</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'قرار الجودة النهائي' : 'Décision Qualité Finale'}</label>
                <select className="form-input" value={qaStatusChoice} onChange={(e) => setQaStatusChoice(e.target.value as QualityDecision)}>
                  <option value="approved">{language === 'ar' ? 'مقبول / مطابق (تحرير المخزون للبيع)' : 'Accepté / Conforme (Libération du stock)'}</option>
                  <option value="needs_review">{language === 'ar' ? 'تحت المراجعة / إعادة الفحص' : 'À Trier / Revoir'}</option>
                  <option value="rejected">{language === 'ar' ? 'مرفوض (إتلاف الدفعة)' : 'Rejeté (Mise au rebut)'}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'ملاحظات السلامة الكيميائية والفيزيائية' : 'Notes de sécurité physico-chimique'}</label>
                <textarea rows={2} className="form-input" value={qaNotes} onChange={(e) => setQaNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{language === 'ar' ? 'تسجيل التحليل' : "Enregistrer l'Analyse"}</button>
                <button type="button" onClick={() => setSelectedBatchQA(null)} className="btn btn-secondary" style={{ flex: 1 }}>{language === 'ar' ? 'إلغاء' : 'Annuler'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: QR CODE VIEW */}
      {activeQR && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '340px', width: '100%', textAlign: 'center', background: 'white', padding: '2rem' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{language === 'ar' ? 'رمز QR النشط للتتبع' : 'QR Code de Traçabilité Actif'}</h3>
            
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('https://nakheel-trace.dz/batch/' + activeQR)}&color=2E5A44&bgcolor=ffffff`}
              alt={`QR ${activeQR}`}
              width={200} height={200}
              style={{ display: 'block', margin: '0 auto 1.25rem auto', borderRadius: 'var(--radius-sm)', border: '3px solid var(--primary)' }}
            />

            <h4 style={{ color: 'var(--primary)', marginBottom: '0.2rem' }}>{language === 'ar' ? `الدفعة ${activeQR}` : `Lot ${activeQR}`}</h4>
            <code style={{ fontSize: '0.7rem', color: 'gray', display: 'block', marginBottom: '1.25rem' }}>
              nakheel-trace.dz/batch/{activeQR}
            </code>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent('https://nakheel-trace.dz/batch/' + activeQR)}&color=2E5A44&bgcolor=ffffff`}
                download={`QR-${activeQR}.png`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ textDecoration: 'none', textAlign: 'center' }}
              >
                {language === 'ar' ? 'تحميل رمز QR (PNG)' : 'Télécharger QR Code (PNG)'}
              </a>
              <button onClick={() => setActiveQR(null)} className="btn btn-secondary">
                {language === 'ar' ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
