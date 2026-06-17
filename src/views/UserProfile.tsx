import React, { useState } from 'react';
import { User } from '../services/db';
import { useLanguage } from '../components/LanguageContext';
import { useToast } from '../components/Toast';
import { isSupabaseAvailable } from '../services/supabaseClient';

const WILAYAS = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
  'Constantine','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla','Oran','El Bayadh',
  'Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt',
  'El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma',
  'Aïn Témouchent','Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar',
  'Ouled Djellal','Béni Abbès','In Salah','In Guezzam','Touggourt','Djanet',
  'El M\'Ghair','El Menia',
];

interface UserProfileProps {
  user: User;
  onUserUpdate: (updated: User) => void;
}

export function UserProfile({ user, onUserUpdate }: UserProfileProps) {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone]       = useState(user.phone ?? '');
  const [wilaya, setWilaya]     = useState(user.wilaya ?? '');
  const [commune, setCommune]   = useState((user as any).commune ?? '');
  const [saving, setSaving]     = useState(false);

  const ar = language === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast(ar ? 'الاسم الكامل مطلوب' : 'Le nom complet est requis', 'warning');
      return;
    }
    setSaving(true);
    try {
      const updated: User = { ...user, fullName: fullName.trim(), phone: phone.trim(), wilaya, ...(commune ? { commune } : {}) } as User;

      if (isSupabaseAvailable) {
        const { supabase: sb } = await import('../services/supabaseClient');
        const { error } = await sb!.from('profiles').update({
          full_name: updated.fullName,
          phone: updated.phone,
          wilaya: updated.wilaya,
          commune: commune.trim() || null,
        }).eq('id', user.id);
        if (error) throw error;
      } else {
        // Demo mode: persist in NakheelDB so other components stay in sync
        const { NakheelDB: DB } = await import('../services/db');
        const allUsers = DB.getUsers();
        const idx = allUsers.findIndex(u => u.id === user.id);
        if (idx >= 0) { allUsers[idx] = updated; DB.saveUsers(allUsers); }
      }

      // Always update localStorage session
      localStorage.setItem('nakheel_user_session', JSON.stringify(updated));
      onUserUpdate(updated);
      toast(ar ? 'تم حفظ الملف الشخصي ✓' : 'Profil enregistré ✓', 'success');
    } catch {
      toast(ar ? 'خطأ أثناء الحفظ' : 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const ROLE_LABELS: Record<string, string> = {
    admin:    ar ? 'مدير' : 'Administrateur',
    operator: ar ? 'مشغّل' : 'Opérateur',
    supplier: ar ? 'منتج واحاتي' : 'Producteur Oasien',
    client:   ar ? 'مربّي' : 'Éleveur',
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '520px' }}>
      <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1.5rem' }}>
        {ar ? '👤 ملفي الشخصي' : '👤 Mon Profil'}
      </h2>

      {/* Read-only info */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Row label={ar ? 'البريد الإلكتروني' : 'Email'} value={user.email} />
        <Row label={ar ? 'الدور' : 'Rôle'} value={ROLE_LABELS[user.role] ?? user.role} />
        <Row label={ar ? 'تاريخ الانضمام' : 'Membre depuis'} value={user.createdAt ?? '—'} />
      </div>

      {/* Editable form */}
      <form className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={handleSubmit}>
        <div>
          <label className="form-label">{ar ? 'الاسم الكامل *' : 'Nom complet *'}</label>
          <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>

        <div>
          <label className="form-label">{ar ? 'رقم الهاتف' : 'Téléphone'}</label>
          <input className="form-input" type="tel" placeholder="+213 5XX XX XX XX" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        <div>
          <label className="form-label">{ar ? 'الولاية' : 'Wilaya'}</label>
          <select className="form-input" value={wilaya} onChange={e => setWilaya(e.target.value)}>
            <option value="">{ar ? '— اختر الولاية —' : '— Choisir la wilaya —'}</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        <div>
          <label className="form-label">{ar ? 'البلدية' : 'Commune'}</label>
          <input className="form-input" placeholder={ar ? 'مثال: تولقة' : 'Ex: Tolga'} value={commune} onChange={e => setCommune(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
          {saving ? (ar ? 'جارٍ الحفظ...' : 'Enregistrement...') : (ar ? 'حفظ التغييرات' : 'Enregistrer les modifications')}
        </button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
      <span style={{ color: 'gray', minWidth: '130px' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{value}</span>
    </div>
  );
}
