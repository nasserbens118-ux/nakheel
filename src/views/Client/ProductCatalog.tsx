import React, { useState } from 'react';
import { ShoppingBag, CheckCircle } from 'lucide-react';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { User, Product, COMMISSION_RATE } from '../../services/db';

interface ProductCatalogProps {
  user: User;
  onOrderSuccess: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ user, onOrderSuccess }) => {
  const { products, createOrder, inventory } = useNakheel();
  const { t, language } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState('1000'); // Default 1 ton
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('delivery');
  
  // Default delivery location simulation based on user settings
  const defaultAddress = user.commune && user.wilaya ? `${user.commune}, ${user.wilaya}` : 'Sidi Aïssa, Wilaya de M\'Sila';
  const [deliveryAddress, setDeliveryAddress] = useState(defaultAddress);
  
  const [categoryFilter, setCategoryFilter] = useState<'tous' | 'ovins' | 'bovins'>('tous');
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const getProductStock = (productId: string): number => {
    return inventory
      .filter(i => i.productId === productId)
      .reduce((sum, i) => sum + i.availableQuantityKg, 0);
  };

  const getNutritionalInfo = (formula: string, target: string) => {
    if (target === 'sheep') {
      return formula === 'improved' 
        ? { protein: '16%', energy: '0.95 UFV' } 
        : { protein: '13%', energy: '0.85 UFV' };
    } else {
      return formula === 'improved' 
        ? { protein: '17%', energy: '0.98 UFV' } 
        : { protein: '14%', energy: '0.82 UFV' };
    }
  };

  const filteredProducts = products.filter(p => {
    if (categoryFilter === 'tous') return true;
    if (categoryFilter === 'ovins') return p.animalTarget === 'sheep';
    if (categoryFilter === 'bovins') return p.animalTarget === 'cattle';
    return true;
  });

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedProduct) return;

    const qty = Number(orderQuantity);
    const availableStock = getProductStock(selectedProduct.id);

    if (!orderQuantity.trim() || isNaN(qty) || qty <= 0) {
      setError(language === 'ar' ? 'يرجى إدخال كمية علف صحيحة (أكبر من 0 كغ).' : 'Veuillez entrer une quantité d’aliment valide (supérieure à 0 kg).');
      return;
    }

    if (qty > availableStock) {
      setError(language === 'ar' 
        ? `الكمية المطلوبة غير متوفرة. المخزون الحالي: ${availableStock.toLocaleString()} كغ.` 
        : `Quantité demandée indisponible. Stock d'ensachage actuel : ${availableStock.toLocaleString()} kg.`
      );
      return;
    }

    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال عنوان التوصيل الدقيق الخاص بك.' : 'Veuillez renseigner votre adresse de livraison exacte.');
      return;
    }

    const totalAmount = qty * selectedProduct.pricePerKg;
    const commissionAmount = Math.round(totalAmount * COMMISSION_RATE);

    // Call context creation method with new signature
    await createOrder(
      user.id,
      [{
        productId: selectedProduct.id,
        quantityKg: qty
      }],
      deliveryType,
      deliveryType === 'delivery' ? deliveryAddress.trim() : 'Dépôt Central Nakheel (Tolga)',
      commissionAmount
    );

    setSuccess(true);

    setTimeout(() => {
      setSuccess(false);
      setSelectedProduct(null);
      onOrderSuccess(); // Redirect to orders list
    }, 1500);
  };

  const getFormulaLabel = (type: string) => {
    if (type === 'economic') return language === 'ar' ? 'اقتصادية' : 'Économique';
    if (type === 'standard') return language === 'ar' ? 'معيارية' : 'Standard';
    return language === 'ar' ? 'محسنة' : 'Améliorée';
  };

  const getAnimalTargetLabel = (target: string) => {
    if (target === 'sheep') return language === 'ar' ? 'أغنام' : 'Ovins';
    if (target === 'cattle') return language === 'ar' ? 'أبقار' : 'Bovins';
    return language === 'ar' ? 'مختلط' : 'Mixte';
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>{t('client.catalog_title')}</h2>
          <p style={{ color: 'gray', fontSize: '0.9rem' }}>{t('client.catalog_desc')}</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--neutral-white)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-border)' }}>
          {(['tous', 'ovins', 'bovins'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '0.35rem 0.75rem',
                border: 'none',
                background: categoryFilter === cat ? 'var(--primary)' : 'none',
                color: categoryFilter === cat ? 'white' : 'gray',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}
            >
              {cat === 'tous' && (language === 'ar' ? 'كل الأعلاف' : 'Tous les aliments')}
              {cat === 'ovins' && (language === 'ar' ? 'أعلاف الأغنام' : 'Ovins')}
              {cat === 'bovins' && (language === 'ar' ? 'أعلاف الأبقار' : 'Bovins')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Products */}
      <div className="grid grid-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        {filteredProducts.map(p => {
          const availableStock = getProductStock(p.id);
          const nut = getNutritionalInfo(p.formulaType, p.animalTarget);
          
          // Localization translations override
          const AR_PRODUCT_NAMES: Record<string, string> = {
            'PROD-001': 'علف خروف واحاتي اقتصادي',
            'PROD-002': 'علف خروف معياري محسّن',
            'PROD-003': 'علف أبقار معياري',
            'PROD-004': 'علف مختلط محسّن',
          };
          const localizedName = language === 'ar' && AR_PRODUCT_NAMES[p.id]
            ? AR_PRODUCT_NAMES[p.id]
            : p.name;
          
          const localizedDesc = language === 'ar' && p.id === 'PROD-001'
            ? 'تركيبة متوازنة مصنوعة من سعف النخيل المطحون والتمر منخفض الجودة، مصممة خصيصاً للقطعان في المناطق السهبية والجنوبية.'
            : language === 'ar' && p.id === 'PROD-002'
            ? 'تركيبة غنية بالبروتينات والنيتروجين، مضاف إليها نوى التمر المسحوق كمصدر رئيسي للطاقة لتسريع عملية التسمين.'
            : p.description;

          return (
            <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden' }}>
              <img 
                src={p.imageUrl} 
                alt={localizedName} 
                style={{ width: '100%', height: '180px', objectFit: 'cover' }} 
              />
              
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className={`badge badge-${p.formulaType === 'improved' ? 'approved' : 'pending'}`} style={{ fontSize: '0.65rem' }}>
                      {language === 'ar' ? 'تركيبة' : 'Formule'} {getFormulaLabel(p.formulaType)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'gray', fontWeight: 600 }}>
                      {t('client.prod_target')} {getAnimalTargetLabel(p.animalTarget)}
                    </span>
                  </div>
                  
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>{localizedName}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'gray', marginBottom: '1rem', minHeight: '55px' }}>{localizedDesc}</p>
                  
                  {/* Nutritional stats */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    backgroundColor: 'var(--primary-light)', 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: 'var(--radius-sm)', 
                    marginBottom: '1rem',
                    fontSize: '0.8rem' 
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.75rem' }}>{language === 'ar' ? 'بروتين' : 'Protéines'}</div>
                      <div style={{ fontWeight: 700 }}>{nut.protein}</div>
                    </div>
                    <div style={{ flex: 1, borderLeft: language === 'ar' ? 'none' : '1px solid rgba(46, 90, 68, 0.1)', borderRight: language === 'ar' ? '1px solid rgba(46, 90, 68, 0.1)' : 'none', paddingLeft: language === 'ar' ? '0' : '0.5rem', paddingRight: language === 'ar' ? '0.5rem' : '0' }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.75rem' }}>{language === 'ar' ? 'طاقة' : 'Énergie'}</div>
                      <div style={{ fontWeight: 700 }}>{nut.energy}</div>
                    </div>
                    <div style={{ flex: 1, borderLeft: language === 'ar' ? 'none' : '1px solid rgba(46, 90, 68, 0.1)', borderRight: language === 'ar' ? '1px solid rgba(46, 90, 68, 0.1)' : 'none', paddingLeft: language === 'ar' ? '0' : '0.5rem', paddingRight: language === 'ar' ? '0.5rem' : '0' }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.75rem' }}>{language === 'ar' ? 'المخزون' : 'Stock'}</div>
                      <div style={{ fontWeight: 700, color: availableStock < 1000 ? 'var(--status-rejected)' : 'inherit' }}>
                        {availableStock.toLocaleString()} kg
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'gray' }}>{t('client.prod_price')}</span>
                      <div className="numeric" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>
                        {p.pricePerKg} DA / kg
                      </div>
                    </div>
                    <div className="numeric" style={{ fontSize: '0.8rem', color: 'gray', fontWeight: 600, direction: 'ltr' }}>
                      ~{(p.pricePerKg * 1000).toLocaleString()} DA / t
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedProduct(p)}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={availableStock <= 0}
                  >
                    <ShoppingBag size={16} /> {availableStock <= 0 ? (language === 'ar' ? 'نفد المخزون' : 'Rupture de Stock') : t('client.btn_add_cart')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Modal */}
      {selectedProduct && (() => {
        const availableStock = getProductStock(selectedProduct.id);
        const localizedName = language === 'ar' && selectedProduct.id === 'PROD-001' 
          ? 'علف خروف واحاتي اقتصادي' 
          : language === 'ar' && selectedProduct.id === 'PROD-002'
          ? 'علف تسمين العجول المطور' 
          : selectedProduct.name;
        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '1rem'
          }}>
            <div className="card animate-fade-in" style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'white' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--neutral-border)', paddingBottom: '0.5rem' }}>
                {language === 'ar' ? 'تأكيد طلبية الأعلاف' : "Valider la commande d'aliments"}
              </h3>

              {success ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <CheckCircle size={48} style={{ color: 'var(--status-approved)', marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
                  <h4 style={{ color: 'var(--primary)' }}>{t('client.order_success')}</h4>
                  <p style={{ color: 'gray', fontSize: '0.9rem' }}>{t('client.order_success_desc')}</p>
                </div>
              ) : (
                <form onSubmit={handlePlaceOrder}>
                  {error && (
                    <div style={{ 
                      backgroundColor: 'var(--status-rejected-light)', color: 'var(--status-rejected)', 
                      padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem',
                      border: '1px solid rgba(192, 57, 43, 0.15)'
                    }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', backgroundColor: 'var(--neutral-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                    <img src={selectedProduct.imageUrl} alt="" style={{ width: '55px', height: '55px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                    <div>
                      <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{localizedName}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'gray' }}>{t('client.prod_price')} {selectedProduct.pricePerKg} DA/kg</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>{language === 'ar' ? 'المخزون المتوفر :' : 'Stock disponible :'} {availableStock.toLocaleString()} kg</div>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="form-group">
                    <label className="form-label">{language === 'ar' ? 'الكمية المطلوبة بالكيلوغرام (كغ)' : 'Tonnage / Quantité commandée (kg)'}</label>
                    <input
                      type="number"
                      className="form-input"
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(e.target.value)}
                      min="1"
                      max={availableStock}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'gray' }}>{language === 'ar' ? 'تنويه: 1000 كغ يعادل 1 طن من العلف' : 'Note: 1000 kg équivaut à 1 tonne d’aliment'}</span>
                  </div>

                  {/* Delivery Type */}
                  <div className="form-group">
                    <label className="form-label">{t('client.cart_delivery_method')}</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('pickup')}
                        style={{
                          flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${deliveryType === 'pickup' ? 'var(--primary)' : 'var(--neutral-border)'}`,
                          backgroundColor: deliveryType === 'pickup' ? 'var(--primary-light)' : 'white',
                          color: deliveryType === 'pickup' ? 'var(--primary)' : 'gray',
                          fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                        }}
                      >
                        {language === 'ar' ? 'استلام من المستودع (طولقة)' : 'Retrait dépôt (Tolga)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('delivery')}
                        style={{
                          flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${deliveryType === 'delivery' ? 'var(--primary)' : 'var(--neutral-border)'}`,
                          backgroundColor: deliveryType === 'delivery' ? 'var(--primary-light)' : 'white',
                          color: deliveryType === 'delivery' ? 'var(--primary)' : 'gray',
                          fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                        }}
                      >
                        {language === 'ar' ? 'التوصيل للمزرعة' : 'Livraison à la ferme'}
                      </button>
                    </div>
                  </div>

                  {/* Address */}
                  {deliveryType === 'delivery' && (
                    <div className="form-group">
                      <label className="form-label">{t('client.cart_delivery_address')}</label>
                      <input
                        type="text"
                        className="form-input"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder={language === 'ar' ? 'الولاية، البلدية، اسم المزرعة...' : 'Wilaya, Commune, Lieu exact...'}
                      />
                    </div>
                  )}

                  {/* Total Cost */}
                  {(() => {
                    const total = Number(orderQuantity) * selectedProduct.pricePerKg || 0;
                    const commission = Math.round(total * COMMISSION_RATE);
                    return (
                      <div style={{
                        backgroundColor: 'var(--neutral-light)', padding: '0.75rem 0.85rem', borderRadius: 'var(--radius-md)',
                        marginBottom: '1.5rem', border: '1px solid var(--neutral-border)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{t('client.cart_total')}</strong>
                          <span className="numeric" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)', direction: 'ltr' }}>
                            {total.toLocaleString()} DA
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'gray' }}>
                            {language === 'ar' ? 'عمولة المنصة (4%)' : 'Commission plateforme (4%)'}
                          </span>
                          <span className="numeric" style={{ fontSize: '0.72rem', color: '#27ae60', fontWeight: 600, direction: 'ltr' }}>
                            +{commission.toLocaleString()} DA
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                    >
                      {language === 'ar' ? 'تأكيد الشراء' : 'Confirmer l’Achat'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedProduct(null)}
                      style={{ flex: 1 }}
                    >
                      {language === 'ar' ? 'إلغاء' : 'Annuler'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
