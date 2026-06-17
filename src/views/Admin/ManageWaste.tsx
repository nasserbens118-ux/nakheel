import React, { useState } from 'react';
import { MapPin, Truck, Award, Download } from 'lucide-react';
import { exportWasteRequests } from '../../services/exportCsv';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { WasteRequest, WasteStatus, HumidityLevel, ImpurityLevel, evaluateWasteQualityAI } from '../../services/db';
import { usePagination, Pagination } from '../../components/Pagination';

export const ManageWaste: React.FC = () => {
  const { users, wasteRequests, updateWasteRequestStatus, evaluateWasteQuality } = useNakheel();
  const { t, language } = useLanguage();

  // ── Filtres avancés ──────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterWilaya, setFilterWilaya] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredRequests = wasteRequests.filter(r => {
    const supplier = users.find(u => u.id === r.supplierId);
    const wilaya = supplier?.wilaya ?? r.location ?? '';
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterType && r.wasteType !== filterType) return false;
    if (filterWilaya && !wilaya.toLowerCase().includes(filterWilaya.toLowerCase())) return false;
    if (filterDateFrom && r.createdAt < filterDateFrom) return false;
    if (filterDateTo && r.createdAt > filterDateTo) return false;
    return true;
  });

  const activeFilters = [filterStatus, filterType, filterWilaya, filterDateFrom, filterDateTo].filter(Boolean).length;

  const PAGE_SIZE = 10;
  const { paged: pagedWaste, page, totalPages, setPage, total } = usePagination(filteredRequests, PAGE_SIZE);
  
  // Evaluation Modal States
  const [selectedWasteEval, setSelectedWasteEval] = useState<WasteRequest | null>(null);
  const [humidityInput, setHumidityInput] = useState<HumidityLevel>('low');
  const [impurityInput, setImpurityInput] = useState<ImpurityLevel>('low');
  const [visualStateInput, setVisualStateInput] = useState<'sec' | 'humide' | 'mélangé' | 'douteux'>('sec');

  // Pickup Scheduling States
  const [selectedPickup, setSelectedPickup] = useState<WasteRequest | null>(null);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);

  const handleStatusChange = async (id: string, status: WasteStatus, date?: string) => {
    await updateWasteRequestStatus(id, status, date);
  };

  const getSupplierName = (supplierId: string) => {
    const u = users.find(usr => usr.id === supplierId);
    return u ? u.fullName : (language === 'ar' ? 'مورد واحاتي' : 'Fournisseur oasien');
  };

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

  const translateAIRecommendation = (rec: string) => {
    if (language === 'ar') {
      if (rec.includes("Excellente qualité")) return "جودة ممتازة. جاهز للتخزين المباشر والطحن الفوري.";
      if (rec.includes("Taux d'humidité élevé")) return "رطوبة عالية. نشر المادة في الشمس لمدة 24 إلى 48 ساعة قبل التخزين في الصومعة.";
      if (rec.includes("Taux d'humidité moyen")) return "رطوبة متوسطة مكتشفة. يوصى بتجفيفها لمدة 24 ساعة في الشمس قبل المعالجة.";
      if (rec.includes("corps étrangers") || rec.includes("Trier")) return "وجود أجسام غريبة معتدلة. الفرز يدوياً قبل الطحن.";
      if (rec.includes("rejeté") || rec.includes("impuretés critiques")) return "مادة مرفوضة بسبب شوائب حرجة أو حالة مشكوك فيها (خطر صحي للماشية).";
      if (rec.includes("broyage fin") || rec.includes("fibres et palmes")) return "الألياف والسعف تتطلب طحناً ناعماً مسبقاً ومراقبة دقيقة للرطوبة.";
      if (rec.includes("Dattes déclassées")) return "تمور مصنفة بإمكانات طاقوية عالية لصياغة الأعلاف.";
    }
    return rec;
  };

  const previewResult = evaluateWasteQualityAI(
    selectedWasteEval?.wasteType || 'palm_leaves',
    humidityInput,
    impurityInput,
    visualStateInput,
    selectedWasteEval?.estimatedQuantityKg || 0
  );
  const currentScorePreview = previewResult.score;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
            {language === 'ar' ? 'إدارة النفايات وعمليات الجمع' : 'Gestion des Déchets et Collectes'}
          </h2>
          <p style={{ color: 'gray', fontSize: '0.9rem' }}>
            {language === 'ar'
              ? 'افحص المواد الواحاتية المستلمة، قيم الخصائص الفيزيائية والكيميائية وتابع العمليات اللوجستية.'
              : 'Inspectez les matières oasiennes reçues, évaluez les critères physico-chimiques et suivez les flux logistiques.'}
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          onClick={() => exportWasteRequests(wasteRequests)}
        >
          <Download size={14} /> {language === 'ar' ? 'تصدير CSV' : 'Exporter CSV'}
        </button>
        <button
          className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowFilters(f => !f)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', position: 'relative' }}
        >
          🔍 {language === 'ar' ? 'فلترة' : 'Filtrer'}
          {activeFilters > 0 && (
            <span style={{ background: '#e74c3c', color: 'white', borderRadius: '999px', fontSize: '0.62rem', padding: '0 4px', minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* ── Filtre panel ─────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.72rem', color: 'gray', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>
              {language === 'ar' ? 'الحالة' : 'Statut'}
            </label>
            <select className="form-input" style={{ marginBottom: 0, minWidth: '130px' }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">{language === 'ar' ? 'الكل' : 'Tous'}</option>
              <option value="submitted">{language === 'ar' ? 'مصرح' : 'Déclaré'}</option>
              <option value="ai_scored">{language === 'ar' ? 'مُقيَّم' : 'Évalué'}</option>
              <option value="accepted">{language === 'ar' ? 'مقبول' : 'Accepté'}</option>
              <option value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejeté'}</option>
              <option value="scheduled_for_pickup">{language === 'ar' ? 'مبرمج للجمع' : 'Programmé'}</option>
              <option value="collected">{language === 'ar' ? 'تم الجمع' : 'Collecté'}</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', color: 'gray', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>
              {language === 'ar' ? 'نوع المادة' : 'Type matière'}
            </label>
            <select className="form-input" style={{ marginBottom: 0, minWidth: '140px' }} value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
              <option value="">{language === 'ar' ? 'الكل' : 'Tous'}</option>
              <option value="palm_leaves">{language === 'ar' ? 'سعف النخيل' : 'Palmes sèches'}</option>
              <option value="fibers">{language === 'ar' ? 'ألياف واحاتية' : 'Fibres oasiennes'}</option>
              <option value="dates_low_quality">{language === 'ar' ? 'تمور منخفضة' : 'Dattes déclassées'}</option>
              <option value="mixed">{language === 'ar' ? 'مزيج' : 'Mélange'}</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', color: 'gray', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>
              {language === 'ar' ? 'الولاية' : 'Wilaya'}
            </label>
            <input className="form-input" placeholder={language === 'ar' ? 'بسكرة...' : 'Biskra...'} style={{ marginBottom: 0, width: '110px' }} value={filterWilaya} onChange={e => { setFilterWilaya(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', color: 'gray', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>
              {language === 'ar' ? 'من تاريخ' : 'Du'}
            </label>
            <input type="date" className="form-input" style={{ marginBottom: 0 }} value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', color: 'gray', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>
              {language === 'ar' ? 'إلى تاريخ' : 'Au'}
            </label>
            <input type="date" className="form-input" style={{ marginBottom: 0 }} value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1); }} />
          </div>
          {activeFilters > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setFilterStatus(''); setFilterType(''); setFilterWilaya(''); setFilterDateFrom(''); setFilterDateTo(''); setPage(1); }}>
              ✕ {language === 'ar' ? 'مسح الفلاتر' : 'Réinitialiser'}
            </button>
          )}
          {activeFilters > 0 && (
            <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
              {filteredRequests.length} / {wasteRequests.length} {language === 'ar' ? 'نتيجة' : 'résultats'}
            </span>
          )}
        </div>
      )}

      <div className="table-container">
        {filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'gray' }}>
            {activeFilters > 0
              ? (language === 'ar' ? 'لا توجد نتائج للفلاتر المحددة.' : 'Aucun résultat pour ces filtres.')
              : (language === 'ar' ? 'لا توجد أي تصريحات مخلفات مسجلة.' : 'Aucune déclaration de résidus enregistrée.')}
          </div>
        ) : (
          <>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>{language === 'ar' ? 'الفلاح المورد' : 'Producteur oasien'}</th>
                <th>{language === 'ar' ? 'المادة الخام' : 'Matière brute'}</th>
                <th>{language === 'ar' ? 'الكمية الخام' : 'Quantité brute'}</th>
                <th>{language === 'ar' ? 'الواحة / الولاية' : 'Oasis / Wilaya'}</th>
                <th>{language === 'ar' ? 'حالة الطلب' : 'Statut Métier'}</th>
                <th>{language === 'ar' ? 'تقييم الجودة' : 'Score de Qualité'}</th>
                <th>{language === 'ar' ? 'الإجراءات اللوجستية' : 'Actions Logistiques'}</th>
              </tr>
            </thead>
            <tbody>
              {pagedWaste.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, fontSize: '0.75rem' }}>{r.id}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{getSupplierName(r.supplierId)}</div>
                  </td>
                  <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                    {r.wasteType === 'palm_leaves' && '🌴 '}
                    {r.wasteType === 'fibers' && '🪢 '}
                    {r.wasteType === 'dates_low_quality' && '🫘 '}
                    {r.wasteType === 'mixed' && '🔄 '}
                    {getWasteLabel(r.wasteType)}
                  </td>
                  <td className="numeric" style={{ fontWeight: 850, direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>
                    {r.estimatedQuantityKg.toLocaleString()} kg
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem' }}>
                      <MapPin size={11} style={{ color: 'gray' }} /> {r.location}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${
                      r.status === 'submitted' ? 'pending' :
                      r.status === 'ai_scored' ? 'pending' :
                      r.status === 'rejected' ? 'rejected' :
                      r.status === 'accepted' ? 'approved' :
                      r.status === 'scheduled_for_pickup' ? 'scheduled' :
                      r.status === 'collected' ? 'scheduled' :
                      r.status === 'received' ? 'completed' : 'approved'
                    }`} style={{ fontSize: '0.65rem' }}>
                      {t(`status.${r.status}`)}
                    </span>
                    {(r as any).scheduledDate && r.status !== 'stored' && r.status !== 'received' && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.15rem', fontWeight: 700 }}>
                        {language === 'ar' ? 'تاريخ الجمع :' : 'Briefing :'} {(r as any).scheduledDate}
                      </div>
                    )}
                  </td>
                  <td>
                    {r.aiQualityScore > 0 ? (
                      <div className="numeric" style={{ fontSize: '0.8rem', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{r.aiQualityScore}/100</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'gray', fontStyle: 'italic' }}>{language === 'ar' ? 'قيد الانتظار' : 'En attente'}</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {r.status === 'submitted' && (
                        <button
                          onClick={() => {
                            setSelectedWasteEval(r);
                            setHumidityInput('low');
                            setImpurityInput('low');
                            setVisualStateInput('sec');
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          {language === 'ar' ? 'تقييم الجودة' : 'Évaluer Qualité'}
                        </button>
                      )}

                      {r.status === 'ai_scored' && (
                        <>
                          <button
                            onClick={() => {
                              if (r.aiQualityScore < 50) {
                                handleStatusChange(r.id, 'rejected');
                              } else {
                                handleStatusChange(r.id, 'accepted');
                              }
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            {language === 'ar' 
                              ? `تأكيد (${r.aiQualityScore >= 50 ? 'قبول' : 'رفض'})` 
                              : `Confirmer (${r.aiQualityScore >= 50 ? 'Accepter' : 'Rejeter'})`}
                          </button>
                          <button
                            onClick={() => handleStatusChange(r.id, 'rejected')}
                            className="btn btn-danger btn-sm"
                          >
                            {language === 'ar' ? 'رفض' : 'Refuser'}
                          </button>
                        </>
                      )}

                      {r.status === 'accepted' && (
                        <button
                          onClick={() => setSelectedPickup(r)}
                          className="btn btn-primary btn-sm"
                        >
                          <Truck size={12} /> {language === 'ar' ? 'جدولة الجمع' : 'Planifier Collecte'}
                        </button>
                      )}

                      {r.status === 'scheduled_for_pickup' && (
                        <button
                          onClick={() => handleStatusChange(r.id, 'collected')}
                          className="btn btn-accent btn-sm"
                        >
                          {language === 'ar' ? 'تحديد كتم الجمع' : 'Marquer Collecté'}
                        </button>
                      )}

                      {r.status === 'collected' && (
                        <button
                          onClick={() => handleStatusChange(r.id, 'received')}
                          className="btn btn-primary btn-sm"
                        >
                          {language === 'ar' ? 'استلام' : 'Réceptionner'}
                        </button>
                      )}

                      {r.status === 'received' && (
                        <button
                          onClick={() => handleStatusChange(r.id, 'stored')}
                          className="btn btn-accent btn-sm"
                        >
                          {language === 'ar' ? 'تخزين في الصومعة' : 'Placer en Silo'}
                        </button>
                      )}

                      {r.status === 'stored' && (
                        <span style={{ fontSize: '0.75rem', color: 'green', fontWeight: 700 }}>
                          ✓ {language === 'ar' ? '✓ جاهز للتصنيع' : '✓ Prêt pour fabrication'}
                        </span>
                      )}

                      {r.status === 'rejected' && (
                        <span style={{ fontSize: '0.75rem', color: 'red', fontWeight: 700 }}>
                          {language === 'ar' ? 'مادة مرفوضة' : 'Matière rejetée'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} language={language} />
          </>
        )}
      </div>

      {/* INSPECTION QUALITY FORM MODAL */}
      {selectedWasteEval && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '480px', width: '100%', background: 'white' }}>
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.15rem' }}>
              <Award size={18} style={{ color: 'var(--accent)' }} /> {language === 'ar' ? 'فحص الجودة :' : 'Inspection Qualité :'} {selectedWasteEval.id}
            </h3>

            <div className="form-group">
              <label className="form-label">{language === 'ar' ? 'المادة الخام' : 'Matière brute'}</label>
              <input type="text" className="form-input" value={getWasteLabel(selectedWasteEval.wasteType)} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'ar' ? 'نسبة الرطوبة التقديرية' : "Taux d'Humidité Estimé"}</label>
              <select 
                className="form-input"
                value={humidityInput}
                onChange={(e) => setHumidityInput(e.target.value as HumidityLevel)}
              >
                <option value="low">{language === 'ar' ? 'منخفض (جاف، مثالي)' : 'Faible (Sec, Optimal)'}</option>
                <option value="medium">{language === 'ar' ? 'متوسط (رطب)' : 'Moyen (Humide)'}</option>
                <option value="high">{language === 'ar' ? 'مرتفع (رطب جداً)' : 'Élevé (Douteux)'}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'ar' ? 'الحالة البصرية المعاينة' : 'État Visuel Constaté'}</label>
              <select 
                className="form-input"
                value={visualStateInput}
                onChange={(e) => setVisualStateInput(e.target.value as any)}
              >
                <option value="sec">{language === 'ar' ? 'جاف (سليم ونظيف)' : 'Sec (Sain & propre)'}</option>
                <option value="humide">{language === 'ar' ? 'رطب (خطر التعفن)' : 'Humide (Risque de moisissures)'}</option>
                <option value="mélangé">{language === 'ar' ? 'مزيج (وجود بقايا نباتية)' : 'Mélangé (Présence débris végétaux)'}</option>
                <option value="douteux">{language === 'ar' ? 'مشبوه (رائحة أو لون مشبوه)' : 'Douteux (Odeur ou couleur suspecte)'}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'ar' ? 'وجود شوائب (أجسام غريبة، رمال)' : "Présence d'Impuretés (corps étrangers, sable)"}</label>
              <select 
                className="form-input"
                value={impurityInput}
                onChange={(e) => setImpurityInput(e.target.value as ImpurityLevel)}
              >
                <option value="low">{language === 'ar' ? 'منخفض (نظيف)' : 'Faible (Propre)'}</option>
                <option value="medium">{language === 'ar' ? 'متوسط (وجود معتدل)' : 'Moyen (Présence modérée)'}</option>
                <option value="high">{language === 'ar' ? 'مرتفع (حرج)' : 'Élevé (Critique)'}</option>
              </select>
            </div>

            {/* Score Live Preview */}
            <div style={{
              backgroundColor: 'var(--neutral-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem', borderLeft: language === 'ar' ? 'none' : '4px solid var(--accent)', 
              borderRight: language === 'ar' ? '4px solid var(--accent)' : 'none', fontSize: '0.85rem'
            }}>
              <strong style={{ color: 'var(--primary)' }}>
                {language === 'ar' ? 'تقييم الجودة التقديري :' : 'Score qualité estimé :'} <span className="numeric">{currentScorePreview}/100</span>
              </strong>
              <div style={{ fontSize: '0.75rem', color: 'gray', marginTop: '0.2rem' }}>
                {language === 'ar' ? 'التوصية :' : 'Recommandation :'} <strong>{language === 'ar' ? (previewResult.decision === 'accepté' ? 'مقبول' : 'مرفوض') : previewResult.decision.toUpperCase()}</strong> - {translateAIRecommendation(previewResult.recommendation)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={async () => {
                  await evaluateWasteQuality(selectedWasteEval.id, humidityInput, impurityInput, visualStateInput);
                  setSelectedWasteEval(null);
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {language === 'ar' ? 'حساب وتأكيد' : 'Calculer & Valider'}
              </button>
              <button
                onClick={() => setSelectedWasteEval(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE COLLECTION MODAL */}
      {selectedPickup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '420px', width: '100%', background: 'white' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.15rem' }}>
              <Truck size={18} style={{ color: 'var(--accent)' }} /> {language === 'ar' ? 'جدولة عملية الجمع نخيل' : 'Planifier la Collecte Nakheel'}
            </h3>
            
            <p style={{ fontSize: '0.85rem', color: 'gray', marginBottom: '1.25rem' }}>
              {language === 'ar' ? 'برمجة النقل لـ :' : 'Planification du transport pour'} <strong>{getWasteLabel(selectedPickup.wasteType)} (<span className="numeric">{selectedPickup.estimatedQuantityKg.toLocaleString()} kg</span>)</strong>.
            </p>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">{language === 'ar' ? 'تاريخ الجمع المبرمج' : 'Date prévue du ramassage'}</label>
              <input
                type="date"
                className="form-input"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  handleStatusChange(selectedPickup.id, 'scheduled_for_pickup', scheduledDate);
                  setSelectedPickup(null);
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {language === 'ar' ? 'تأكيد' : 'Confirmer'}
              </button>
              <button
                onClick={() => setSelectedPickup(null)}
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
