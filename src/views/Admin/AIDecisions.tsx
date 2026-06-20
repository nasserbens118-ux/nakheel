import React, { useState } from 'react';
import { Cpu, Activity, Compass, Award, AlertCircle, TrendingUp, Package, Brain, CheckCircle } from 'lucide-react';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { 
  predictDemandAI, evaluateStockAlertsAI, getProductionRecommendationsAI, 
  evaluateWasteQualityAI, WasteType, HumidityLevel, ImpurityLevel
} from '../../services/db';
import { NakheelAIService, OptimizedRecipeResult, RegionForecast } from '../../services/ai';

export const AIDecisions: React.FC = () => {
  const { wasteRequests, orders, inventory, products, metrics, clients, batches } = useNakheel();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'optimizer' | 'forecasts'>('dashboard');

  const rawStock = metrics.wasteStockRaw;

  // Recipe optimizer states (for Tab 2)
  const [targetCategory, setTargetCategory] = useState<'ovins' | 'bovins'>('ovins');
  const [formulaType, setFormulaType] = useState<'économique' | 'améliorée'>('améliorée');
  const [optimizerResult, setOptimizerResult] = useState<OptimizedRecipeResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const regionForecasts: RegionForecast[] = NakheelAIService.getRegionForecasts();

  // Run AI Heuristics
  const demandForecasts = predictDemandAI(orders, inventory, products, 'été', clients);
  const stockAlerts = evaluateStockAlertsAI(inventory, orders, products);
  const productionRecommendations = getProductionRecommendationsAI(inventory, orders, products, metrics, batches);

  // Cards summary calculations
  const ratedWastes = wasteRequests.filter(w => w.aiQualityScore > 0);
  const avgQualityScore = ratedWastes.length > 0 
    ? Math.round(ratedWastes.reduce((sum, w) => sum + w.aiQualityScore, 0) / ratedWastes.length)
    : 78;

  const criticalStockCount = stockAlerts.filter(a => a.status === 'production urgente recommandée').length;

  const priorityRec = [...productionRecommendations].sort((a, b) => b.priority - a.priority)[0];
  const recommendedProduct = products.find(p => p.id === priorityRec?.productId);

  const handleRunOptimizer = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const result = NakheelAIService.optimizeRecipe({
        targetCategory,
        formulaType,
        availableStocks: {
          palmes: rawStock.palmes,
          noyaux: rawStock.noyaux,
          dattes: rawStock.dattes,
          fibres: rawStock.fibres,
        }
      });
      setOptimizerResult(result);
      setIsCalculating(false);
    }, 1200);
  };

  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };

  const getWasteLabel = (type: string) => {
    if (language === 'ar') {
      if (type === 'palm_leaves' || type === 'palmes') return 'سعف جاف';
      if (type === 'fibers' || type === 'fibres') return 'ألياف واحاتية';
      if (type === 'dates_low_quality' || type === 'dattes') return 'تمور منخفضة الجودة';
      return 'مزيج واحاتي / نوى';
    }
    const WASTE_LABELS: Record<string, string> = {
      palm_leaves: 'Palmes sèches',
      palmes: 'Palmes sèches',
      fibers: 'Fibres oasiennes',
      fibres: 'Fibres oasiennes',
      dates_low_quality: 'Dattes déclassées',
      dattes: 'Dattes déclassées',
      noyaux: 'Noyaux de dattes',
      mixed: 'Mélange oasien'
    };
    return WASTE_LABELS[type] || type;
  };

  const getProductName = (prodId: string, defaultName: string) => {
    if (language === 'ar') {
      if (prodId === 'PROD-001') return 'علف خروف واحاتي اقتصادي';
      if (prodId === 'PROD-002') return 'علف خروف معياري محسّن';
      if (prodId === 'PROD-003') return 'علف أبقار معياري';
      if (prodId === 'PROD-004') return 'علف مختلط محسّن';
    }
    return defaultName;
  };

  const translateRecommendation = (rec: string) => {
    if (language === 'ar') {
      if (rec.includes("Taux de sucre élevé")) {
        return "نسبة سكر عالية من التمور. يرجى إدخال العلف تدريجياً لتفادي خطر حموضة الكرش لدى المواشي.";
      }
      if (rec.includes("Haute teneur en palmes")) {
        return "نسبة عالية من السعف المطحون. تأكد من الطحن الدقيق (2-3 مم كحد أقصى) لتسهيل الهضم ومنع الماشية من فرز العلف.";
      }
      if (rec.includes("Alerte Stock : Le niveau de dattes")) {
        return "تنبيه المخزون: مستوى التمور منخفض. يرجى تكثيف عمليات الجمع في بسكرة أو استبدالها جزئياً بالدبس.";
      }
      if (rec.includes("Formule optimisée en azote")) {
        const pctMatch = rec.match(/\d+%/);
        const protMatch = rec.match(/\d+\.?\d*%/g);
        const pct = pctMatch ? pctMatch[0] : '5%';
        const prot = protMatch && protMatch.length > 1 ? protMatch[1] : '12%';
        return `تركيبة محسنة بالنيتروجين غير البروتيني عبر الإضافات الواحاتية (${pct}) للوصول لنسبة بروتين مستهدفة قدرها ${prot}.`;
      }
    }
    return rec;
  };

  const getWilayaName = (w: string) => {
    if (language === 'ar') {
      if (w.includes('Biskra')) return 'بسكرة (طولقة / الوطاية)';
      if (w.includes('El Oued')) return 'الوادي (قمار / الرقيبة)';
      if (w.includes('Ouargla')) return 'ورقلة (حاسي مسعود)';
      if (w.includes('Ghardaïa')) return 'غرداية (متليلي)';
      if (w.includes('Adrar')) return 'أدرار (تيميمون)';
    }
    return w;
  };

  const getSourcingName = (s: string) => {
    if (language === 'ar') {
      if (s.includes('Dattes déclassées & Noyaux')) return 'تمور منخفضة الجودة ونوى';
      if (s.includes('Palmes de taille & Dattes')) return 'سعف التقليم وتمور';
      if (s.includes('Fibres et palmes')) return 'ألياف وسعف';
      if (s.includes('Mélange oasien')) return 'مزيج واحاتي';
      if (s.includes('Dattes de faible valeur')) return 'تمور منخفضة القيمة (تقازة)';
    }
    return s;
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu style={{ color: 'var(--accent)' }} /> {language === 'ar' ? 'نظام دعم القرار نخيل' : "Système d'Aide à la Décision GourFeed"}
        </h2>
        <p style={{ color: 'gray', fontSize: '0.9rem' }}>
          {language === 'ar' ? 'متابعة الجودة التنبؤية، توقعات المبيعات والجدولة الآلية للإنتاج' : "Supervision prédictive de la qualité, prévisions de vente et planification automatisée de la production"}
        </p>
      </div>

      {/* Tabs navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem', 
        borderBottom: '1px solid var(--neutral-border)',
        paddingBottom: '0.5rem',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: activeTab === 'dashboard' ? 'var(--primary-light)' : 'none',
            color: activeTab === 'dashboard' ? 'var(--primary)' : 'gray',
            fontWeight: 700,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          {language === 'ar' ? '🔮 لوحة التحكم' : '🔮 Tableau de Bord'}
        </button>
        <button
          onClick={() => setActiveTab('optimizer')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: activeTab === 'optimizer' ? 'var(--primary-light)' : 'none',
            color: activeTab === 'optimizer' ? 'var(--primary)' : 'gray',
            fontWeight: 700,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          {language === 'ar' ? '🌾 محسن تركيبات الأعلاف' : '🌾 Optimiseur de Recette'}
        </button>
        <button
          onClick={() => setActiveTab('forecasts')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: activeTab === 'forecasts' ? 'var(--primary-light)' : 'none',
            color: activeTab === 'forecasts' ? 'var(--primary)' : 'gray',
            fontWeight: 700,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          {language === 'ar' ? '🗺️ تقدير gisements الواحات' : '🗺️ Gisements Oasiens Est.'}
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Grid Stats */}
          <div className="grid grid-2 grid-4" style={{ gap: '1.25rem' }}>
            
            {/* CARD 1: Quality average */}
            <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid var(--primary)', borderRight: language === 'ar' ? '4px solid var(--primary)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'gray', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>{language === 'ar' ? 'معدل درجة الجودة' : 'SCORE QUALITÉ MOYEN'}</span>
                <Award size={16} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="numeric" style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--primary)', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>
                {avgQualityScore}/100
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'gray' }}>
                {language === 'ar' ? `بناءً على ${ratedWastes.length} دفعات تم تحليلها.` : `Basé sur ${ratedWastes.length} lots analysés.`}
              </p>
            </div>

            {/* CARD 2: Forecasted demand */}
            <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid var(--accent)', borderRight: language === 'ar' ? '4px solid var(--accent)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'gray', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>{language === 'ar' ? 'الطلب المتوقع' : 'DEMANDE PRÉVUE'}</span>
                <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--accent)' }}>
                {language === 'ar' ? 'متوسط إلى مرتفع' : 'Moyenne à Élevée'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'gray' }}>
                {language === 'ar' ? 'تأثير موسم الصيف نشط (+15%).' : "Effet saisonnier d'été actif (+15%)."}
              </p>
            </div>

            {/* CARD 3: Critical stock alerts */}
            <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid var(--status-rejected)', borderRight: language === 'ar' ? '4px solid var(--status-rejected)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'gray', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>{language === 'ar' ? 'المخنز الحرج' : 'STOCK CRITIQUE'}</span>
                <AlertCircle size={16} style={{ color: 'var(--status-rejected)' }} />
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--status-rejected)' }}>
                <span className="numeric">{criticalStockCount}</span> {language === 'ar' ? 'منتج(ات)' : 'Produit(s)'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'gray' }}>
                {language === 'ar' ? 'مستويات غير كافية أو منتهية.' : 'Niveaux insuffisants ou épuisés.'}
              </p>
            </div>

            {/* CARD 4: Priority recommended production */}
            <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid var(--secondary)', borderRight: language === 'ar' ? '4px solid var(--secondary)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'gray', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>{language === 'ar' ? 'أولوية الإنتاج' : 'PRIORITÉ PRODUCTION'}</span>
                <Package size={16} style={{ color: 'var(--secondary)' }} />
              </div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0.4rem 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--primary)' }}>
                {recommendedProduct ? getProductName(recommendedProduct.id, recommendedProduct.name) : (language === 'ar' ? 'لا يوجد' : 'Aucun')}
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'gray' }}>
                {language === 'ar' ? 'الحجم الموصى به :' : 'Volume conseillé :'} <span className="numeric">{priorityRec ? priorityRec.recommendedQtyKg : 0} kg</span>
              </p>
            </div>

          </div>

          {/* Detailed module panels */}
          <div className="grid grid-2" style={{ gap: '2rem', alignItems: 'start', gridTemplateColumns: '1fr' }}>
            
            {/* MODULE 1: Waste quality scoring history */}
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                {language === 'ar' ? '1. تقييم جودة المخلفات المستلمة' : '1. Diagnostic Qualité des Résidus Reçus'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'gray', marginBottom: '1.25rem' }}>
                {language === 'ar' 
                  ? 'قواعد التقييم: رطوبة منخفضة + شوائب منخفضة = تقييم مرتفع. رطوبة عالية = يحتاج تجفيف. شوائب متوسطة = يحتاج فرز.'
                  : 'Règles de scoring : humidité basse + impuretés basses = score élevé. Humidité élevée = à sécher. Impuretés moyennes = à trier.'}
              </p>
              
              <div className="table-container" style={{ margin: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>{language === 'ar' ? 'رقم المخلفات' : 'ID Déchet'}</th>
                      <th>{language === 'ar' ? 'المادة' : 'Matière'}</th>
                      <th>{language === 'ar' ? 'الوزن' : 'Poids'}</th>
                      <th>{language === 'ar' ? 'درجة الجودة' : 'Score Qualité'}</th>
                      <th>{language === 'ar' ? 'القرار المقترح' : 'Décision Suggérée'}</th>
                      <th>{language === 'ar' ? 'التوصية التشغيلية' : 'Recommandation Opérationnelle'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteRequests.slice(0, 4).map(w => (
                      <tr key={w.id}>
                        <td style={{ fontWeight: 700, fontSize: '0.75rem' }}>{w.id}</td>
                        <td>{getWasteLabel(w.wasteType)}</td>
                        <td className="numeric" style={{ direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>
                          {w.estimatedQuantityKg.toLocaleString()} kg
                        </td>
                        <td className="numeric" style={{ fontWeight: 800, color: 'var(--primary)', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>
                          {w.aiQualityScore > 0 ? `${w.aiQualityScore}/100` : (language === 'ar' ? 'قيد الانتظار' : 'En attente')}
                        </td>
                        <td>
                          {w.aiQualityScore > 0 ? (
                            <span className={`badge badge-${
                              w.aiDecision === 'accepté' ? 'approved' : 
                              w.aiDecision === 'rejeté' ? 'rejected' : 'pending'
                            }`} style={{ fontSize: '0.65rem' }}>
                              {language === 'ar' ? (w.aiDecision === 'accepté' ? 'مقبول' : w.aiDecision === 'rejeté' ? 'مرفوض' : 'معلق') : (w.aiDecision || 'à sécher')}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'gray', fontStyle: 'italic' }}>{language === 'ar' ? 'قيد الانتظار' : 'En attente'}</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--neutral-dark)' }}>
                          {language === 'ar' ? (w.aiQualityScore > 0 ? 'طحن ناعم ومراقبة التخزين.' : 'في انتظار الفحص') : (w.aiRecommendation || 'Attente inspection')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODULE 2 & 3: Demand forecasting & Stock Alerts */}
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                {language === 'ar' ? '2 و 3. توقعات الطلب وفحص المخزون' : '2 & 3. Prévisions de Demande & Diagnostic des Stocks'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'gray', marginBottom: '1.25rem' }}>
                {language === 'ar' 
                  ? 'نموذج استقرائي يربط حجم الطلبيات، والمخزون الحالي للأعلاف، والمؤشرات الموسمية.' 
                  : 'Modèle d\'extrapolations croisant les volumes de commandes, les stocks ensachés actuels et les coefficients saisonniers.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {demandForecasts.map(f => {
                  const p = getProductById(f.productId);
                  const alert = stockAlerts.find(a => a.productId === f.productId);
                  
                  return (
                    <div key={f.productId} style={{ 
                      backgroundColor: 'var(--neutral-light)', 
                      padding: '1rem', 
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--neutral-border)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{p ? getProductName(p.id, p.name) : 'Aliment'}</strong>
                        
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <span className={`badge badge-${f.demandLevel === 'élevée' ? 'eleve' : f.demandLevel === 'moyenne' ? 'moyen' : 'faible'}`} style={{ fontSize: '0.6rem' }}>
                            {language === 'ar' ? 'الطلب :' : 'Demande :'} {language === 'ar' ? (f.demandLevel === 'élevée' ? 'مرتفع' : f.demandLevel === 'moyenne' ? 'متوسط' : 'منخفض') : f.demandLevel}
                          </span>
                          
                          <span className={`badge badge-${
                            alert?.status === 'stock suffisant' ? 'faible' : 
                            alert?.status === 'risque de rupture' ? 'moyen' : 'critique'
                          }`} style={{ fontSize: '0.6rem' }}>
                            {language === 'ar' ? (alert?.status === 'stock suffisant' ? 'مخزون كافٍ' : alert?.status === 'risque de rupture' ? 'خطر النفاد' : 'إنتاج عاجل') : (alert?.status === 'stock suffisant' ? 'Stock OK' : alert?.status === 'risque de rupture' ? 'Risque Rupture' : 'Urgence Production')}
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.8rem', color: 'var(--neutral-dark)', marginBottom: '0.5rem' }}>
                        {language === 'ar' ? (f.productId === 'PROD-001' ? 'الطلب الموسمي مرتفع على أعلاف الأغنام بسبب اقتراب عيد الأضحى.' : 'مستوى مخزون أعلاف التسمين منخفض جداً لتلبية احتياجات المربين.') : f.explanation}
                      </p>
                      
                      <div style={{ fontSize: '0.75rem', color: 'gray', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span>{language === 'ar' ? 'مدة الإنتاج المتوقعة :' : 'Délai moyen de production :'} <strong>{language === 'ar' ? '24 ساعة' : '24 heures'}</strong></span>
                        <span>{language === 'ar' ? 'الكمية المقترح إنتاجها :' : 'Qté suggérée à produire :'} <strong className="numeric" style={{ direction: 'ltr' }}>{f.recommendedProductionKg.toLocaleString()} kg</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MODULE 4: Production scheduling recommendation */}
            <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid var(--secondary)', borderRight: language === 'ar' ? '4px solid var(--secondary)' : 'none' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                {language === 'ar' ? '4. توصيات جدولة حملة الإنتاج' : '4. Recommandation Planifiée de Campagne de Production'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'gray', marginBottom: '1.25rem' }}>
                {language === 'ar' 
                  ? 'يقوم النظام بتحليل الطلبات المعلقة، والمخزون الحالي، ووفرة المواد الأولية في الصوامع.'
                  : "Le système analyse les commandes en attente, le stock existant et la disponibilité des résidus broyés en silos."}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {productionRecommendations.map(rec => {
                  const p = getProductById(rec.productId);
                  return (
                    <div key={rec.productId} style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      alignItems: 'start', 
                      paddingBottom: '1rem', 
                      borderBottom: '1px dashed var(--neutral-border)',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ 
                        backgroundColor: rec.priority >= 4 ? 'var(--status-rejected-light)' : rec.priority >= 3 ? 'var(--status-pending-light)' : 'var(--primary-light)',
                        color: rec.priority >= 4 ? 'var(--status-rejected)' : rec.priority >= 3 ? 'var(--status-pending)' : 'var(--primary)',
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 'bold',
                        minWidth: '55px',
                        textAlign: 'center'
                      }}>
                        {language === 'ar' ? 'أولوية' : 'Prio'} {rec.priority}
                      </div>

                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0 }}>{p ? getProductName(p.id, p.name) : 'Aliment'}</h4>
                        <p style={{ color: 'gray', margin: '0.2rem 0' }}>
                          {language === 'ar' 
                            ? (rec.productId === 'PROD-001' ? 'عجز في المخزون المقدر بـ 0 كغ. الطلبات المعلقة النشطة تبلغ 200 كغ.' : 'مخزون الأبقار يقترب من النفاد. هناك طلبات شراء متوقعة بقيمة عالية.') 
                            : rec.justification}
                        </p>
                        <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.8rem' }}>
                          {language === 'ar' ? 'الكمية المقترحة للإنتاج :' : 'Lancement suggéré :'} <span className="numeric" style={{ direction: 'ltr' }}>{rec.recommendedQtyKg.toLocaleString()} kg</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* MVP Disclaimer Notice */}
          <div style={{ 
            backgroundColor: 'var(--status-pending-light)', 
            border: '1px solid rgba(212, 175, 55, 0.15)', 
            padding: '1.25rem', 
            borderRadius: 'var(--radius-md)', 
            fontSize: '0.85rem', 
            color: 'var(--primary)',
            display: 'flex', 
            alignItems: 'start', 
            gap: '0.75rem',
            lineHeight: '1.4'
          }}>
            <AlertCircle size={20} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>{language === 'ar' ? 'معلومات هامة - العرض التفاعلي :' : 'Important Information - Interactive Demo :'}</strong><br />
              {language === 'ar' 
                ? '«نسخة MVP: النتائج هي مساعد رقمي لدعم القرار بناءً على قواعد مبسطة. سيتم تحسين النماذج بعد جمع البيانات الحقيقية: الصور، الرطوبة، التحاليل، الطلبات، وآراء الزبائن.»'
                : '”Version MVP : les résultats sont des aides à la décision basées sur des règles simples. Les modèles seront améliorés après collecte de données réelles : images, humidité, analyses, commandes et retours clients.”'}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'optimizer' && (
        <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid var(--accent)', borderRight: language === 'ar' ? '4px solid var(--accent)' : 'none' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--primary)' }}>
            {language === 'ar' ? '🌾 محسن تركيبات الأعلاف التكيفي' : '🌾 Formulateur de Ration Adaptatif'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'gray', marginBottom: '1.25rem' }}>
            {language === 'ar' 
              ? 'يقوم النظام بتحليل مخزونك الخام في الوقت الفعلي لتحقيق التوازن الغذائي بأفضل تكلفة.'
              : "Le système analyse vos stocks bruts en temps réel pour équilibrer la ration au meilleur coût nutritionnel."}
          </p>

          <div className="grid grid-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{language === 'ar' ? 'نوع المواشي المستهدفة' : 'Espèce Cible'}</label>
              <select 
                className="form-input"
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value as any)}
              >
                <option value="ovins">{language === 'ar' ? 'أغنام (كباش / خراف)' : 'Ovins (Mouton / Agneau)'}</option>
                <option value="bovins">{language === 'ar' ? 'أبقار (عجول / بقرات)' : 'Bovins (Vache / Veau)'}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'ar' ? 'نوع التركيبة' : 'Type de Formule'}</label>
              <select 
                className="form-input"
                value={formulaType}
                onChange={(e) => setFormulaType(e.target.value as any)}
              >
                <option value="économique">{language === 'ar' ? 'اقتصادية (عليقة معيارية)' : 'Économique (Ration standard)'}</option>
                <option value="améliorée">{language === 'ar' ? 'محسنة (تسمين واحاتي)' : 'Améliorée (Engraissement oasien)'}</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--neutral-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'gray', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
              {language === 'ar' ? 'المخزون الحالي المتاح فحصاً :' : 'Stocks Actuels analysés :'}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
              <span className="badge badge-approved" style={{ backgroundColor: 'white', border: '1px solid var(--neutral-border)' }}>🌴 {language === 'ar' ? 'سعف:' : 'Palmes:'} <span className="numeric">{rawStock.palmes.toLocaleString()} kg</span></span>
              <span className="badge badge-approved" style={{ backgroundColor: 'white', border: '1px solid var(--neutral-border)' }}>🪵 {language === 'ar' ? 'نوى:' : 'Noyaux:'} <span className="numeric">{rawStock.noyaux.toLocaleString()} kg</span></span>
              <span className="badge badge-approved" style={{ backgroundColor: 'white', border: '1px solid var(--neutral-border)' }}>🫘 {language === 'ar' ? 'تمور:' : 'Dattes:'} <span className="numeric">{rawStock.dattes.toLocaleString()} kg</span></span>
              <span className="badge badge-approved" style={{ backgroundColor: 'white', border: '1px solid var(--neutral-border)' }}>🪢 {language === 'ar' ? 'ألياف:' : 'Fibres:'} <span className="numeric">{rawStock.fibres.toLocaleString()} kg</span></span>
            </div>
          </div>

          <button 
            onClick={handleRunOptimizer} 
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem' }}
            disabled={isCalculating}
          >
            {isCalculating ? (language === 'ar' ? 'جاري حساب التركيبة الغذائية...' : 'Calcul de la formulation...') : (language === 'ar' ? 'تشغيل حساب التركيبة المحسنة' : 'Lancer la formulation optimisée')}
          </button>

          {optimizerResult && (
            <div className="card animate-fade-in" style={{ 
              marginTop: '1.5rem',
              background: 'linear-gradient(135deg, white 0%, var(--primary-light) 100%)',
              border: '1px solid var(--primary-light)'
            }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                {language === 'ar' ? '📊 وصفة العلف الموصى بها' : '📊 Recette Recommandée'}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                {Object.entries(optimizerResult.composition).map(([name, pct]) => (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span>{getWasteLabel(name)}</span>
                      <span className="numeric">{pct}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${pct}%`, 
                        height: '100%', 
                        backgroundColor: name === 'additifs' ? 'var(--accent)' : 'var(--primary)' 
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-4" style={{ gap: '0.75rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: 'white', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(18, 43, 27, 0.08)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'gray' }}>{language === 'ar' ? 'بروتينات' : 'Protéines'}</span>
                  <div className="numeric" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{optimizerResult.nutritionalAnalysis.proteinRate}%</div>
                </div>
                <div style={{ backgroundColor: 'white', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(18, 43, 27, 0.08)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'gray' }}>{language === 'ar' ? 'طاقة' : 'Énergie'}</span>
                  <div className="numeric" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{optimizerResult.nutritionalAnalysis.energyValue} UFL</div>
                </div>
                <div style={{ backgroundColor: 'white', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(18, 43, 27, 0.08)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'gray' }}>{language === 'ar' ? 'ألياف' : 'Fibres'}</span>
                  <div className="numeric" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{optimizerResult.nutritionalAnalysis.fiberRate}%</div>
                </div>
                <div style={{ backgroundColor: 'white', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(18, 43, 27, 0.08)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'gray' }}>{language === 'ar' ? 'التكلفة/كغ' : 'Coût/kg'}</span>
                  <div className="numeric" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)', direction: 'ltr' }}>{optimizerResult.estimatedCostPerKg} DA</div>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(18, 43, 27, 0.08)', fontSize: '0.8rem' }}>
                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>{language === 'ar' ? 'توصيات تقنية :' : 'Conseils techniques :'}</strong>
                <ul style={{ paddingInlineStart: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {optimizerResult.aiRecommendations.map((rec, idx) => (
                    <li key={idx} style={{ color: rec.includes('Stock') ? 'var(--status-rejected)' : 'inherit' }}>
                      {translateRecommendation(rec)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'forecasts' && (
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Compass size={18} style={{ color: 'var(--primary)' }} /> {language === 'ar' ? 'توقعات gisements مخلفات النخيل حسب الولايات' : 'Prévisions de Gisements Régionaux'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'gray', marginBottom: '1.5rem' }}>
            {language === 'ar' 
              ? 'تقدير حجم مخلفات النخيل الخام المبرمجة للجمع والتدوير خلال الـ 3 أشهر القادمة في ولايات الجنوب الجزائري.' 
              : 'Estimation du tonnage mensuel brut disponible à la collecte sur les 3 prochains mois dans les Wilayas du Sud.'}
          </p>

          <div className="table-container" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'الولاية (المنطقة)' : 'Wilaya (Région)'}</th>
                  <th>{language === 'ar' ? 'المخزون الحالي التقديري' : 'Stock Actuel Est.'}</th>
                  <th>{language === 'ar' ? 'توقعات 3 أشهر' : 'Prévision 3 mois'}</th>
                  <th>{language === 'ar' ? 'نوع المخلفات الأغلب' : 'Gisement Majoritaire'}</th>
                  <th>{language === 'ar' ? 'المخاطر اللوجستية' : 'Risque Logistique'}</th>
                </tr>
              </thead>
              <tbody>
                {regionForecasts.map((f, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700 }}>{getWilayaName(f.wilaya)}</td>
                    <td className="numeric" style={{ direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>{f.currentAvailableEstimate} tonnes</td>
                    <td className="numeric" style={{ fontWeight: 800, color: 'var(--primary)', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>{f.forecastNext3Months} tonnes</td>
                    <td>{getSourcingName(f.mainWasteType)}</td>
                    <td>
                      <span className={`badge badge-${
                        f.logisticalRisk === 'Faible' ? 'approved' :
                        f.logisticalRisk === 'Moyen' ? 'pending' : 'rejected'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {language === 'ar' ? (f.logisticalRisk === 'Faible' ? 'منخفض' : f.logisticalRisk === 'Moyen' ? 'متوسط' : 'مرتفع') : f.logisticalRisk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ 
            marginTop: '1.25rem', backgroundColor: 'var(--primary-light)', border: '1px solid var(--neutral-border)', 
            padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <Activity size={16} />
            <span>
              <strong>{language === 'ar' ? 'ملاحظة لوجستية :' : 'Note logistique :'}</strong> {language === 'ar' 
                ? 'سترتفع الكميات في بسكرة والوادي بشكل كبير في أكتوبر ونوفمبر خلال موسم تقليم النخيل وفرز تمور الحصاد.' 
                : 'Les volumes à Biskra et El Oued augmenteront fortement en Octobre-Novembre lors de la saison de taille des palmiers et du tri des dattes de récolte.'}
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
