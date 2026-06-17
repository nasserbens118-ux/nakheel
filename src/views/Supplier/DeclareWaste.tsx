import React, { useState, useRef } from 'react';
import { Camera, MapPin, Send, CheckCircle, Loader, Upload, X, Locate } from 'lucide-react';
import { useNakheel } from '../../components/NakheelContext';
import { useLanguage } from '../../components/LanguageContext';
import { User, NakheelDB, WasteType } from '../../services/db';
import { isSupabaseAvailable, supabase } from '../../services/supabaseClient';

interface DeclareWasteProps {
  user: User;
  onSuccess: () => void;
}

export const DeclareWaste: React.FC<DeclareWasteProps> = ({ user, onSuccess }) => {
  const { addWasteRequest } = useNakheel();
  const { t, language } = useLanguage();
  const profile = NakheelDB.getSuppliers().find(s => s.userId === user.id);

  const [wasteType, setWasteType] = useState<WasteType>('palm_leaves');
  const [quantity, setQuantity]   = useState('');

  const defaultLocation = user.commune && user.wilaya ? `${user.commune}, ${user.wilaya}` : profile?.location || '';
  const [location, setLocation]   = useState(defaultLocation);
  const [availabilityDate, setAvailabilityDate] = useState(new Date().toISOString().split('T')[0]);

  // Photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile]       = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Geolocation
  const [geoLoading, setGeoLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const WASTE_LABELS: Record<WasteType, string> = {
    palm_leaves:       language === 'ar' ? 'سعف النخيل الجاف' : 'Palmes sèches',
    fibers:            language === 'ar' ? 'ألياف النخيل'     : 'Fibres oasiennes',
    dates_low_quality: language === 'ar' ? 'تمور منخفضة الجودة' : 'Dattes déclassées',
    mixed:             language === 'ar' ? 'مزيج واحاتي'      : 'Mélange oasien',
  };

  // ── File upload handler ───────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(language === 'ar' ? 'الملف يجب أن يكون صورة (JPG, PNG, WEBP)' : 'Le fichier doit être une image (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(language === 'ar' ? 'حجم الصورة يجب أن يكون أقل من 5 ميغابايت' : 'La photo ne doit pas dépasser 5 Mo.');
      return;
    }

    setPhotoFile(file);
    setError('');

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload to Supabase Storage (if configured), else keep base64
  const uploadPhoto = async (): Promise<string | undefined> => {
    if (!photoFile) return undefined;

    if (isSupabaseAvailable && supabase) {
      const ext  = photoFile.name.split('.').pop();
      const path = `waste-photos/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      setUploadProgress(10);

      const { data, error: upErr } = await supabase.storage
        .from('nakheel-uploads')
        .upload(path, photoFile, { cacheControl: '3600', upsert: false });

      setUploadProgress(80);
      if (upErr) {
        // Fallback to base64 if bucket not configured yet
        console.warn('[Nakheel] Supabase Storage upload failed, storing base64:', upErr.message);
        return photoPreview ?? undefined;
      }

      const { data: urlData } = supabase.storage.from('nakheel-uploads').getPublicUrl(data.path);
      setUploadProgress(100);
      return urlData.publicUrl;
    }

    // Demo mode: return base64 preview
    return photoPreview ?? undefined;
  };

  // ── Geolocation ──────────────────────────────────────────────────────────

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError(language === 'ar' ? 'المتصفح لا يدعم تحديد الموقع الجغرافي' : 'Géolocalisation non supportée par ce navigateur.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Nominatim — OpenStreetMap (free, no auth)
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`,
            { headers: { 'User-Agent': 'NakheelApp/1.0' } }
          );
          const data = await res.json();
          const addr = data.address ?? {};
          const commune = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
          const wilaya  = addr.state || addr.region || '';
          setLocation(`${commune}${wilaya ? ', ' + wilaya : ''}`.trim() || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } catch {
          setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        setError(language === 'ar' ? 'تعذّر الحصول على الموقع. يرجى السماح بالوصول.' : 'Géolocalisation refusée. Autorisez l\'accès à votre position.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const qty = Number(quantity);
    if (!quantity.trim() || isNaN(qty) || qty <= 0) { setError(t('supplier.error_qty'));  return; }
    if (!location.trim())                            { setError(t('supplier.error_loc'));  return; }
    if (!availabilityDate)                           { setError(t('supplier.error_date')); return; }

    setSubmitting(true);
    try {
      const photoUrl = await uploadPhoto();
      await addWasteRequest(wasteType, qty, location.trim(), availabilityDate, photoUrl, user.id);
      setSuccess(true);
      setTimeout(() => onSuccess(), 1500);
    } catch (err: any) {
      setError(err?.message || (language === 'ar' ? 'حدث خطأ أثناء الإرسال' : 'Une erreur est survenue lors de l\'envoi.'));
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '750px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.25rem', color: 'var(--primary)', borderBottom: '1px solid var(--neutral-border)', paddingBottom: '0.5rem' }}>
        {t('supplier.declare_title')}
      </h2>

      {success ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <CheckCircle size={56} style={{ color: 'var(--status-approved)', display: 'block', margin: '0 auto 1.25rem auto' }} />
          <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{t('supplier.declare_success')}</h3>
          <p style={{ color: 'gray', fontSize: '0.9rem' }}>{t('supplier.declare_success_desc')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ backgroundColor: 'var(--status-rejected-light)', color: 'var(--status-rejected)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1.25rem', border: '1px solid rgba(192,57,43,0.15)' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Waste Type Selector */}
          <div className="form-group">
            <label className="form-label">{t('supplier.field_residu')}</label>
            <div className="grid grid-2 grid-4" style={{ gap: '0.75rem' }}>
              {(['palm_leaves', 'fibers', 'dates_low_quality', 'mixed'] as WasteType[]).map((type) => (
                <div
                  key={type}
                  onClick={() => setWasteType(type)}
                  style={{
                    padding: '1rem 0.5rem', textAlign: 'center', cursor: 'pointer',
                    border: `2px solid ${wasteType === type ? 'var(--primary)' : 'var(--neutral-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: wasteType === type ? 'var(--primary-light)' : 'var(--neutral-white)',
                    transition: 'all 0.15s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '90px',
                  }}
                >
                  <span style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>
                    {type === 'palm_leaves' && '🌴'}
                    {type === 'fibers' && '🪢'}
                    {type === 'dates_low_quality' && '🫘'}
                    {type === 'mixed' && '🔄'}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)' }}>
                    {WASTE_LABELS[type]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: '1rem' }}>
            {/* Quantity */}
            <div className="form-group">
              <label className="form-label">{t('supplier.field_qty')}</label>
              <input type="number" className="form-input" placeholder="Ex: 800" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              <span style={{ fontSize: '0.75rem', color: 'gray' }}>{t('supplier.field_qty_sub')}</span>
            </div>

            {/* Availability date */}
            <div className="form-group">
              <label className="form-label">{t('supplier.field_date')}</label>
              <input type="date" className="form-input" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} />
            </div>
          </div>

          {/* Location + GPS */}
          <div className="form-group">
            <label className="form-label">{t('supplier.field_address')}</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'ar' ? 'الولاية، البلدية، اسم المزرعة...' : 'Wilaya, Commune, Nom du champ...'}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              {/* GPS button — Nominatim/OpenStreetMap (free) */}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0 0.75rem', minWidth: '44px', position: 'relative' }}
                onClick={handleGeolocate}
                disabled={geoLoading}
                title={language === 'ar' ? 'تحديد الموقع GPS' : 'Utiliser ma position GPS'}
              >
                {geoLoading ? <Loader size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Locate size={16} />}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0 0.75rem' }}
                onClick={() => setLocation(defaultLocation)}
                title={language === 'ar' ? 'الموقع الافتراضي' : 'Adresse par défaut'}
              >
                <MapPin size={16} />
              </button>
            </div>
            {geoLoading && (
              <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                {language === 'ar' ? 'جارٍ تحديد الموقع عبر OpenStreetMap...' : 'Localisation en cours via OpenStreetMap...'}
              </p>
            )}
          </div>

          {/* Real photo upload */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">{t('supplier.field_photo')}</label>
            <div style={{ border: '2px dashed var(--neutral-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--neutral-light)' }}>
              {photoPreview ? (
                <div>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={photoPreview}
                      alt="Aperçu"
                      style={{ maxWidth: '100%', maxHeight: '160px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', marginBottom: '0.5rem', display: 'block' }}
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: 'white', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'gray', marginBottom: '0.5rem' }}>{photoFile?.name}</p>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div style={{ width: '100%', backgroundColor: 'var(--neutral-border)', borderRadius: '4px', height: '4px', marginBottom: '0.5rem' }}>
                      <div style={{ width: `${uploadProgress}%`, backgroundColor: 'var(--secondary)', height: '4px', borderRadius: '4px', transition: 'width 0.3s' }} />
                    </div>
                  )}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-sm">
                    {language === 'ar' ? 'تغيير الصورة' : 'Changer la photo'}
                  </button>
                </div>
              ) : (
                <div>
                  <Camera size={32} style={{ color: 'gray', display: 'block', margin: '0 auto 0.5rem auto' }} />
                  <p style={{ fontSize: '0.8rem', color: 'gray', marginBottom: '0.75rem' }}>
                    {language === 'ar' ? 'أضف صورة للكومة قبل الإرسال (اختياري)' : 'Joignez une photo du tas de déchets (optionnel)'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.35rem', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <Upload size={14} /> {language === 'ar' ? 'اختر صورة' : 'Choisir une photo'}
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={submitting}>
            {submitting
              ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {language === 'ar' ? 'جارٍ الإرسال...' : 'Envoi en cours...'}</>
              : <><Send size={16} style={{ transform: language === 'ar' ? 'scaleX(-1)' : 'none' }} /> {t('supplier.btn_submit_decl')}</>
            }
          </button>
        </form>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
