import React, { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { useToast } from '../../components/Toast';
import { isSupabaseAvailable } from '../../services/supabaseClient';
import { Product } from '../../services/db';

export const ManagePrices: React.FC = () => {
  const { products } = useNakheel();
  const { language } = useLanguage();
  const { toast } = useToast();
  const ar = language === 'ar';

  // Local editable copy
  const [edited, setEdited] = useState<Record<string, { pricePerKg: string; pricePerBag: string }>>(() =>
    Object.fromEntries(products.map(p => [p.id, { pricePerKg: String(p.pricePerKg), pricePerBag: String(p.pricePerBag) }]))
  );
  const [saving, setSaving] = useState<string | null>(null);

  const handleChange = (id: string, field: 'pricePerKg' | 'pricePerBag', value: string) => {
    setEdited(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = async (product: Product) => {
    const kg = Number(edited[product.id]?.pricePerKg);
    const bag = Number(edited[product.id]?.pricePerBag);
    if (!kg || kg <= 0 || !bag || bag <= 0) {
      toast(ar ? 'الأسعار يجب أن تكون أكبر من الصفر' : 'Les prix doivent être supérieurs à 0', 'warning');
      return;
    }
    setSaving(product.id);
    try {
      if (isSupabaseAvailable) {
        const { supabase: sb } = await import('../../services/supabaseClient');
        const { error } = await sb!.from('products').update({ price_per_kg: kg, price_per_bag: bag }).eq('id', product.id);
        if (error) throw error;
      } else {
        const { NakheelDB } = await import('../../services/db');
        const prods = NakheelDB.getProducts().map(p =>
          p.id === product.id ? { ...p, pricePerKg: kg, pricePerBag: bag } : p
        );
        NakheelDB.saveProducts(prods);
        window.dispatchEvent(new CustomEvent('nakheel-db-update', { detail: { table: 'products' } }));
      }
      toast(`${product.name} — ${ar ? 'تم تحديث السعر ✓' : 'prix mis à jour ✓'}`, 'success');
    } catch {
      toast(ar ? 'خطأ أثناء الحفظ' : 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleReset = (product: Product) => {
    setEdited(prev => ({ ...prev, [product.id]: { pricePerKg: String(product.pricePerKg), pricePerBag: String(product.pricePerBag) } }));
  };

  const ANIMAL_ICON: Record<string, string> = { sheep: '🐑', cattle: '🐄', mixed: '🐾' };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
          💰 {ar ? 'إدارة أسعار الأعلاف' : 'Gestion des Prix Aliments'}
        </h2>
        <p style={{ color: 'gray', fontSize: '0.85rem' }}>
          {ar ? 'يُطبَّق التغيير فورياً على الكتالوج والطلبيات الجديدة.' : 'Les modifications s\'appliquent immédiatement au catalogue et aux nouvelles commandes.'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {products.map(p => {
          const e = edited[p.id] ?? { pricePerKg: String(p.pricePerKg), pricePerBag: String(p.pricePerBag) };
          const dirty = e.pricePerKg !== String(p.pricePerKg) || e.pricePerBag !== String(p.pricePerBag);

          return (
            <div key={p.id} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              {/* Product info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 200px', minWidth: 0 }}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                    {ANIMAL_ICON[p.animalTarget] ?? '🌿'}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', color: 'var(--primary)', fontSize: '0.9rem' }}>{p.name}</strong>
                  <span style={{ fontSize: '0.72rem', color: 'gray' }}>{p.bagWeightKg} kg/sac · {p.formulaType}</span>
                  {dirty && <span style={{ display: 'block', fontSize: '0.68rem', color: '#e67e22', fontWeight: 700 }}>● {ar ? 'تعديل غير محفوظ' : 'Modifié non sauvegardé'}</span>}
                </div>
              </div>

              {/* Price inputs */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'gray', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>
                    {ar ? 'سعر الكيلوغرام (د.ج)' : 'Prix / kg (DA)'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input
                      type="number" min="1" step="1"
                      className="form-input"
                      value={e.pricePerKg}
                      onChange={ev => handleChange(p.id, 'pricePerKg', ev.target.value)}
                      style={{ width: '90px', marginBottom: 0 }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'gray', fontWeight: 600 }}>DA/kg</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: 'gray', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>
                    {ar ? 'سعر الكيس (د.ج)' : 'Prix / sac (DA)'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input
                      type="number" min="1" step="1"
                      className="form-input"
                      value={e.pricePerBag}
                      onChange={ev => handleChange(p.id, 'pricePerBag', ev.target.value)}
                      style={{ width: '100px', marginBottom: 0 }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'gray', fontWeight: 600 }}>DA/sac</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignSelf: 'flex-end' }}>
                  {dirty && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleReset(p)} title={ar ? 'إلغاء التعديل' : 'Annuler'}>
                      <RotateCcw size={13} />
                    </button>
                  )}
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={saving === p.id || !dirty}
                    onClick={() => handleSave(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: dirty ? 1 : 0.5 }}
                  >
                    <Save size={13} /> {saving === p.id ? '...' : (ar ? 'حفظ' : 'Enregistrer')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: '1rem', marginTop: '1.5rem', background: 'var(--primary-light)', border: 'none' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--primary)', margin: 0 }}>
          💡 {ar
            ? 'تأكد من تحديث سعر الكيس ليتوافق مع سعر الكيلوغرام × وزن الكيس. مثال: 62 د.ج/كغ × 25 كغ = 1550 د.ج/كيس.'
            : 'Assurez-vous que le prix/sac reste cohérent avec le prix/kg × le poids du sac. Exemple : 62 DA/kg × 25 kg = 1 550 DA/sac.'}
        </p>
      </div>
    </div>
  );
};
