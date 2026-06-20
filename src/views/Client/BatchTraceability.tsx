import React, { useState, useEffect } from 'react';
import { QrCode, ShieldCheck, MapPin, Calendar, Award, RefreshCw, Leaf, HeartHandshake, Printer } from 'lucide-react';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';

interface BatchTraceabilityProps {
  initialBatchId?: string | null;
  onNavigate: (page: string) => void;
}

export const BatchTraceability: React.FC<BatchTraceabilityProps> = ({ initialBatchId, onNavigate }) => {
  const { batches, qualityChecks, wasteRequests, rawMaterialBatches, products, users } = useNakheel();
  const { t, language } = useLanguage();
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(initialBatchId || null);

  useEffect(() => {
    setSelectedBatchId(initialBatchId || null);
  }, [initialBatchId]);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  
  // Find current batch & linked data
  const currentBatch = batches.find(b => b.id === selectedBatchId || b.batchNumber === selectedBatchId);
  const qualityCheck = qualityChecks.find(q => q.productionBatchId === currentBatch?.id);
  
  // Find waste request details used in this batch
  const linkedWasteRequests = wasteRequests.filter(w => {
    if (!currentBatch) return false;
    const rmBatches = rawMaterialBatches.filter(rm => currentBatch.rawMaterialBatchIds.includes(rm.id));
    const linkedRequestIds = rmBatches.flatMap(rm => rm.wasteRequestIds);
    return linkedRequestIds.includes(w.id);
  });

  const product = products.find(p => p.id === currentBatch?.productId);

  const getSupplierName = (supplierUserId: string): string => {
    const u = users.find(usr => usr.id === supplierUserId);
    return u ? u.fullName : (language === 'ar' ? 'مورد واحاتي' : 'Producteur Oasien');
  };

  const getWasteTypeLabel = (type: string) => {
    switch (type) {
      case 'palm_leaves': return language === 'ar' ? 'سعف النخيل الجاف' : 'Palmes sèches';
      case 'fibers': return language === 'ar' ? 'ألياف النخيل' : 'Fibres de palmier';
      case 'dates_low_quality': return language === 'ar' ? 'تمور منخفضة القيمة / نوى' : 'Dattes de faible valeur / noyaux';
      case 'mixed': return language === 'ar' ? 'مزيج من المخلفات الواحاتية' : 'Mélange de déchets oasiens';
      default: return type;
    }
  };

  const getTraceabilityOrigins = (): string => {
    if (!currentBatch) return language === 'ar' ? 'منطقة الواحات بالجزائر' : 'Zone oasienne Algérie';
    
    const wilayas = linkedWasteRequests.map(w => {
      const supplierUser = users.find(u => u.id === w.supplierId);
      return supplierUser ? supplierUser.wilaya : w.location.split(',').pop()?.trim();
    }).filter(Boolean);

    const uniqueWilayas = Array.from(new Set(wilayas));
    if (uniqueWilayas.length > 0) {
      return uniqueWilayas.map(w => {
        if (w === 'Biskra') return language === 'ar' ? 'بسكرة' : 'Biskra';
        if (w === 'El Oued') return language === 'ar' ? 'الوادي' : 'El Oued';
        if (w === 'Ouargla') return language === 'ar' ? 'ورقلة' : 'Ouargla';
        if (w === 'Adrar') return language === 'ar' ? 'أدرار' : 'Adrar';
        if (w === 'Ghardaia') return language === 'ar' ? 'غرداية' : 'Ghardaïa';
        return w;
      }).join(', ');
    }
    return language === 'ar' ? 'مناطق بسكرة والوادي' : 'Région de Biskra & El Oued';
  };

  const simulateScan = (batchId: string) => {
    setIsScanning(true);
    setScanStatus(language === 'ar' ? 'محاذاة مستشعر رمز QR...' : 'Alignement du capteur QR...');
    
    setTimeout(() => {
      setScanStatus(language === 'ar' ? 'قراءة بيانات الدفعة الفيزيائية...' : 'Lecture du lot physique...');
    }, 800);

    setTimeout(() => {
      setScanStatus(language === 'ar' ? 'تم التحقق من توقيع تتبع نخيل المعتمد !' : 'Signature de traçabilité GourFeed vérifiée !');
    }, 1600);

    setTimeout(() => {
      setIsScanning(false);
      setSelectedBatchId(batchId);
    }, 2200);
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'conforme': return t('status.approved');
      case 'rejeté': return t('status.rejected');
      case 'à vérifier': return language === 'ar' ? 'قيد المراجعة' : 'À vérifier (en cours)';
      default: return status;
    }
  };

  // Calculations for lot-specific impact
  const lotQty = currentBatch?.producedQuantityKg || 0;
  const lotCo2Saved = Math.round(lotQty * 0.82);
  const lotSupportPaid = lotQty * 15;

  const getFormulaLabel = (type: string) => {
    if (type === 'economic') return language === 'ar' ? 'اقتصادية' : 'Économique';
    if (type === 'standard') return language === 'ar' ? 'معيارية' : 'Standard';
    return language === 'ar' ? 'محسنة' : 'Améliorée';
  };

  const localizedProductName = product ? (
    language === 'ar' && product.id === 'PROD-001' ? 'علف خروف واحاتي اقتصادي' :
    language === 'ar' && product.id === 'PROD-002' ? 'علف تسمين العجول المطور' :
    product.name
  ) : '';

  return (
    <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      
      {/* SCANNER SIMULATION PANEL */}
      {!selectedBatchId || isScanning ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{language === 'ar' ? 'مسح كيس العلف المستلم' : "Scanner un Sac d'Aliment"}</h2>
          <p style={{ color: 'gray', maxWidth: '500px', margin: '0 auto 2rem auto', fontSize: '0.95rem' }}>
            {language === 'ar' ? 'قم بتقريب رمز QR المطبوع على كيس علف نخيل من عدسة هاتفك الذكي أو قم بمحاكاة المسح من الأزرار بالأسفل.' : 'Approchez l\'étiquette QR imprimée sur le sac GourFeed de l\'objectif de votre smartphone ou simulez la lecture ci-dessous.'}
          </p>

          {isScanning ? (
            <div style={{
              width: '260px', height: '260px', margin: '0 auto', 
              border: '3px solid var(--accent)', borderRadius: 'var(--radius-md)',
              position: 'relative', overflow: 'hidden', display: 'flex', 
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.03)'
            }}>
              {/* Scan green line animation */}
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '4px',
                backgroundColor: 'var(--secondary)',
                boxShadow: '0 0 8px var(--secondary)',
                animation: 'scanLine 1.5s infinite ease-in-out'
              }} />
              
              <QrCode size={140} style={{ color: '#eaeaea' }} />
              
              <div style={{ 
                position: 'absolute', bottom: '15px', left: '10px', right: '10px',
                backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.35rem',
                borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600
              }}>
                {scanStatus}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ margin: '0 auto 2.5rem auto', display: 'inline-block' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('https://nakheel-trace.dz/scan')}&color=2E5A44&bgcolor=ffffff`}
                  alt="QR Code GourFeed"
                  width={180}
                  height={180}
                  style={{ borderRadius: 'var(--radius-md)', border: '2px solid var(--neutral-border)', display: 'block' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>

              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>{language === 'ar' ? 'محاكي مسح الرمز QR :' : 'Simulateur de Scan QR :'}</h3>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {batches.map(b => (
                  <button
                    key={b.id}
                    onClick={() => simulateScan(b.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.85rem' }}
                  >
                    {language === 'ar' ? `مسح الدفعة ${b.batchNumber} (${b.qualityStatus === 'conforme' ? 'جاهز' : 'قيد التحضير'})` : `Scanner Lot ${b.batchNumber} (${b.qualityStatus === 'conforme' ? 'Prêt' : 'En prod'})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <style>{`
            @keyframes scanLine {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
          `}</style>
        </div>
      ) : !currentBatch ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h2 style={{ color: 'var(--status-rejected)', marginBottom: '1rem' }}>{t('client.trace_not_found')}</h2>
          <p style={{ color: 'gray', marginBottom: '1.5rem' }}>{language === 'ar' ? 'رمز QR الممسوح غير مسجل في شبكة تتبع نخيل اللامركزية.' : 'Le QR code scanné n\'est pas répertorié dans la traçabilité décentralisée GourFeed.'}</p>
          <button onClick={() => setSelectedBatchId(null)} className="btn btn-primary btn-sm">
            {language === 'ar' ? 'إعادة المحاولة' : 'Réessayer de scanner'}
          </button>
        </div>
      ) : (
        /* DETAILED BATCH TRACEABILITY PAGE */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header Card */}
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, var(--primary) 0%, hsl(152, 32%, 18%) 100%)',
            color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '1.5rem', padding: '2rem'
          }}>
            <div>
              <span style={{ 
                color: 'var(--accent)', fontWeight: 700, fontSize: '0.8rem', 
                textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' 
              }}>
                <ShieldCheck size={14} /> {language === 'ar' ? 'التتبع اللامركزي ومطابقة الجودة نخيل' : 'Traçabilité Décentralisée & Qualité GourFeed'}
              </span>
              <h2 style={{ color: 'white', fontSize: '1.8rem', margin: '0.25rem 0 0.5rem 0' }}>
                {t('client.trace_batch_info')} {currentBatch.batchNumber}
              </h2>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} /> {t('client.trace_prod_date')} : {currentBatch.productionDate}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Award size={14} /> {t('client.trace_qty')} : {currentBatch.producedQuantityKg.toLocaleString()} kg</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.print()}
                className="btn btn-secondary btn-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'rgba(255,255,255,0.3)', gap: '0.25rem' }}
              >
                <Printer size={12} /> {language === 'ar' ? 'طباعة PDF' : 'Imprimer / PDF'}
              </button>
              <button
                onClick={() => setSelectedBatchId(null)}
                className="btn btn-secondary btn-sm"
                style={{ backgroundColor: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.3)', gap: '0.25rem' }}
              >
                <RefreshCw size={12} /> {language === 'ar' ? 'مسح رمز آخر' : 'Réinitialiser'}
              </button>
            </div>
          </div>

          {/* Product and general Sourcing Details */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '1.25rem' }}>
              {t('client.trace_batch_info')}
            </h3>
            
            <div className="grid grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <strong style={{ fontSize: '0.8rem', color: 'gray', display: 'block' }}>{t('client.trace_product')} / {t('client.trace_formula')}</strong>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>
                  {product ? `${localizedProductName} (${getFormulaLabel(product.formulaType)})` : 'Aliment oasien'}
                </span>
              </div>
              
              <div>
                <strong style={{ fontSize: '0.8rem', color: 'gray', display: 'block' }}>{language === 'ar' ? 'بلد المنشأ العام للنفايات (الولايات)' : 'Origine Générale des Résidus (Wilayas)'}</strong>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>
                  {getTraceabilityOrigins()}
                </span>
              </div>
            </div>

            <div style={{ 
              backgroundColor: 'var(--neutral-light)', padding: '0.85rem', borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem', borderInlineStart: '3px solid var(--accent)' 
            }}>
              <strong>{language === 'ar' ? '💡 نصائح الاستخدام :' : '💡 Conseils d\'utilisation :'}</strong>
              <p style={{ marginTop: '0.25rem', color: 'var(--neutral-dark)' }}>
                {language === 'ar' 
                  ? 'يُحفظ في الكيس الأصلي بعيداً عن الرطوبة. بالنسبة للمجترات (الأغنام/الأبقار)، قم بإدخال هذا العلف تدريجياً لاستبدال العلف المعتاد على مدار فترة تكيف تتراوح من 5 إلى 7 أيام.'
                  : 'Conserver dans un sac d\'origine à l\'abri de l\'humidité. Pour les ruminants (moutons/bovins), introduire progressivement cet aliment en remplaçant la ration habituelle sur une période d\'adaptation de 5 à 7 jours.'}
              </p>
            </div>
          </div>

          {/* Sourcing Timeline */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} style={{ color: 'var(--secondary)' }} /> {t('client.trace_flow_title')}
            </h3>
            
            {linkedWasteRequests.length === 0 ? (
              <p style={{ color: 'gray', fontSize: '0.9rem' }}>{t('client.trace_flow_desc')}</p>
            ) : (
              <div style={{ 
                display: 'flex', flexDirection: 'column', gap: '1rem', 
                borderInlineStart: '3px solid var(--primary-light)', 
                paddingInlineStart: '1.5rem', 
                marginInlineStart: '0.5rem' 
              }}>
                {linkedWasteRequests.map((w, idx) => (
                  <div key={w.id} style={{ position: 'relative' }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: language === 'ar' ? 'auto' : '-29px', 
                      right: language === 'ar' ? '-29px' : 'auto', 
                      top: '2px', 
                      backgroundColor: 'var(--primary)', color: 'white', 
                      width: '12px', height: '12px', borderRadius: '50%', border: '4px solid white' 
                    }} />
                    
                    <div style={{ fontSize: '0.75rem', color: 'gray', fontWeight: 700 }}>
                      {language === 'ar' ? `المادة الخام الأولى ${idx + 1} • الدفعة ${w.id}` : `MATIÈRE PREMIÈRE ${idx + 1} • TRANSITION ${w.id}`}
                    </div>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--primary)', textTransform: 'capitalize', margin: '0.15rem 0' }}>
                      {getWasteTypeLabel(w.wasteType)} — <strong style={{ color: 'var(--accent)' }}>{w.estimatedQuantityKg.toLocaleString()} kg</strong>
                    </h4>
                    
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--neutral-dark)', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                      <span>{t('client.trace_flow_supplier')} <strong>{getSupplierName(w.supplierId)}</strong> ({w.location})</span>
                      <span>{t('client.trace_flow_date')} {w.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quality check report */}
          <div className="card" style={{ border: '2px solid var(--neutral-border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)',
              color: 'rgba(46, 90, 68, 0.04)', fontSize: '4rem', fontWeight: 900, pointerEvents: 'none',
              fontFamily: 'var(--font-display)', textAlign: 'center', width: '100%'
            }}>
              {language === 'ar' ? 'مراقبة الجودة منصة نخيل' : 'CONTROLE QUALITE NAKHEEL'}
            </div>

            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--neutral-border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} style={{ color: 'var(--accent)' }} /> {t('client.trace_qa_bulletin')}
              </h3>
              
              <span className={`badge badge-${currentBatch.qualityStatus === 'conforme' ? 'approved' : 'rejected'}`} style={{ fontSize: '0.85rem' }}>
                {getStatusLabel(currentBatch.qualityStatus)}
              </span>
            </div>

            {qualityCheck ? (
              <div>
                <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                  <div style={{ backgroundColor: 'var(--neutral-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'gray' }}>{t('client.trace_qa_humidity')}</span>
                    <div className="numeric" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', margin: '0.2rem 0', direction: 'ltr' }}>{qualityCheck.humidity}%</div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 600 }}>{language === 'ar' ? 'الهدف: < 12%' : 'Cible: < 12%'}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--neutral-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'gray' }}>{language === 'ar' ? 'نسبة البروتين' : "Taux de Protéines"}</span>
                    <div className="numeric" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', margin: '0.2rem 0', direction: 'ltr' }}>{qualityCheck.proteinTarget}%</div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 600 }}>{language === 'ar' ? 'الهدف: > 11%' : 'Cible: > 11%'}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--neutral-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'gray' }}>{t('client.trace_qa_fiber')}</span>
                    <div className="numeric" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', margin: '0.25rem 0', direction: 'ltr' }}>{qualityCheck.fiber}%</div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 600 }}>{language === 'ar' ? 'الهدف: > 14%' : 'Cible: > 14%'}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--neutral-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'gray' }}>{t('client.trace_qa_impurities')}</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: qualityCheck.impurityCheck ? 'var(--primary)' : 'var(--status-rejected)', margin: '0.4rem 0' }}>
                      {qualityCheck.impurityCheck ? (language === 'ar' ? 'مطابق (خالٍ)' : 'Conforme') : (language === 'ar' ? 'بحاجة لفرز' : 'À trier')}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 600 }}>{language === 'ar' ? 'خالٍ من الشوائب' : 'Cible: Sans débris'}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--neutral-dark)', borderTop: '1px dashed var(--neutral-border)', paddingTop: '0.85rem' }}>
                  <p><strong>{t('client.trace_qa_notes')} :</strong> {qualityCheck.safetyNotes}</p>
                  <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.8rem', color: 'gray', flexWrap: 'wrap' }}>
                    <span>{language === 'ar' ? 'المحلل المخبري :' : 'Analyste :'} <strong>{qualityCheck.checkedBy}</strong></span>
                    <span>{t('client.trace_qa_tested_on')} {qualityCheck.checkedAt}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'gray', fontSize: '0.9rem' }}>
                {language === 'ar' ? 'تقرير التحليل الكيميائي والفيزيائي قيد الصدور...' : 'Fiche qualité en attente d\'évaluation physico-chimique.'}
              </div>
            )}
          </div>

          {/* Eco impact */}
          <div className="grid grid-2" style={{ gap: '1.5rem' }}>
            <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.65rem', borderRadius: '50%', color: 'var(--primary)' }}>
                <Leaf size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{language === 'ar' ? 'بصمة الكربون المتفاداة' : 'Empreinte Carbone Évitée'}</h4>
                <div className="numeric" style={{ fontSize: '1.3rem', fontWeight: 800, direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>{lotCo2Saved.toLocaleString()} kg CO₂</div>
                <p style={{ fontSize: '0.75rem', color: 'gray' }}>{language === 'ar' ? 'انبعاثات حرق عشوائي تم تفاديها' : 'Émissions de brûlage oasien évitées.'}</p>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ backgroundColor: 'var(--accent-light)', padding: '0.65rem', borderRadius: '50%', color: 'var(--accent)' }}>
                <HeartHandshake size={22} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{language === 'ar' ? 'الدعم الاقتصادي لمزارعي الواحات' : 'Soutien Économique Oasien'}</h4>
                <div className="numeric" style={{ fontSize: '1.3rem', fontWeight: 800, direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>{lotSupportPaid.toLocaleString()} DA</div>
                <p style={{ fontSize: '0.75rem', color: 'gray' }}>{language === 'ar' ? 'مداخيل تم تسليمها مباشرة للفلاحين' : 'Revenus versés directement aux palmeraies.'}</p>
              </div>
            </div>
          </div>

          {/* Real QR Code for this batch */}
          <div className="card no-print" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '1rem' }}>
              {language === 'ar' ? 'رمز QR الخاص بهذه الدفعة' : 'QR Code de traçabilité du lot'}
            </h4>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent('https://nakheel-trace.dz/batch/' + currentBatch.batchNumber)}&color=2E5A44&bgcolor=ffffff`}
              alt={`QR ${currentBatch.batchNumber}`}
              width={160}
              height={160}
              style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-border)', display: 'block', margin: '0 auto 0.5rem auto' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'gray', fontFamily: 'monospace' }}>nakheel-trace.dz/batch/{currentBatch.batchNumber}</p>
          </div>

          {/* Advisory Legal Disclaimer */}
          <div style={{
            textAlign: 'center', color: 'gray', fontSize: '0.75rem', padding: '0.5rem',
            borderTop: '1px solid var(--neutral-border)', marginTop: '0.5rem', fontStyle: 'italic'
          }}>
            ⚠️ {language === 'ar' ? 'معلومات توضيحية فنية — التقرير النهائي يخضع لقرار المختبر' : 'Informations indicatives — validation finale soumise au contrôle qualité'}
          </div>

          <style>{`
            @media print {
              body > *:not(#root) { display: none !important; }
              nav, header, aside, .no-print, button { display: none !important; }
              .card { box-shadow: none !important; border: 1px solid #ccc !important; break-inside: avoid; }
              @page { margin: 1cm; }
            }
          `}</style>

        </div>
      )}
    </div>
  );
};
