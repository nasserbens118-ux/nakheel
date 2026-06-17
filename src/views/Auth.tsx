import React, { useState } from 'react';
import { User, LogIn, UserPlus, Info, CheckCircle, Shield, Briefcase, Award, Wrench } from 'lucide-react';
import { NakheelDB, UserRole, Supplier, Client } from '../services/db';
import { useLanguage } from '../components/LanguageContext';
import { isSupabaseAvailable } from '../services/supabaseClient';

// Demo credentials never stored in localStorage or the user DB
const DEMO_CREDENTIALS: Record<string, string> = {
  'admin@nakheel.com': 'admin123',
  'operator@nakheel.com': 'operator123',
  'ahmed.biskra@gmail.com': 'ahmed123',
  'yacine.touati@outlook.com': 'yacine123',
};

// Registered users store a hashed token (email+password digest) instead of the plaintext password
async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}


interface AuthProps {
  onLoginSuccess: (user: any) => void;
}

// 10 key Algerian Wilayas for the project
const ALGERIAN_WILAYAS = [
  { id: 'Biskra', fr: 'Biskra (بسكرة)', ar: 'بسكرة' },
  { id: 'El Oued', fr: 'El Oued (الوادي)', ar: 'الوادي' },
  { id: 'Ouargla', fr: 'Ouargla (ورقلة)', ar: 'ورقلة' },
  { id: 'Touggourt', fr: 'Touggourt (تقرت)', ar: 'تقرت' },
  { id: 'Adrar', fr: 'Adrar (أدرار)', ar: 'أدرار' },
  { id: 'Ghardaia', fr: 'Ghardaïa (غرداية)', ar: 'غرداية' },
  { id: 'Tamanrasset', fr: 'Tamanrasset (تمنراست)', ar: 'تمنراست' },
  { id: 'El Meniaa', fr: 'El Meniaa (المنيعة)', ar: 'المنيعة' },
  { id: 'Ouled Djellal', fr: 'Ouled Djellal (أولاد جلال)', ar: 'أولاد جلال' },
  { id: 'Setif', fr: 'Sétif - Incubateur Universitaire (سطيف)', ar: 'سطيف (الحاضنة الجامعية)' }
];

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const { t, language } = useLanguage();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register Form States
  const [regRole, setRegRole] = useState<UserRole>('supplier');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFarmName, setRegFarmName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  
  // Algerian location states
  const [regWilaya, setRegWilaya] = useState('Biskra');
  const [regCommune, setRegCommune] = useState('');
  
  // Supplier activity type (فلاح، مالك نخيل، تعاونية)
  const [regSupplierType, setRegSupplierType] = useState('farmer'); // farmer | palm_owner | cooperative
  
  // Client activity type (مربي، تاجر أعلاف)
  const [regClientType, setRegClientType] = useState('medium_breeder'); // small_breeder | medium_breeder | wholesaler
  const [regAnimalType, setRegAnimalType] = useState('Ovins');
  
  const [regSuccess, setRegSuccess] = useState('');
  const [regError, setRegError] = useState('');

  const handleDemoLogin = (role: UserRole) => {
    const users = NakheelDB.getUsers();
    let email = '';
    if (role === 'admin') email = 'admin@nakheel.com';
    else if (role === 'operator') email = 'operator@nakheel.com';
    else if (role === 'supplier') email = 'ahmed.biskra@gmail.com';
    else if (role === 'client') email = 'yacine.touati@outlook.com';

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      onLoginSuccess(user);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotStatus('loading');
    try {
      const { supabase: sb } = await import('../services/supabaseClient');
      if (!sb) throw new Error('demo');
      const { error } = await sb.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) throw error;
      setForgotStatus('sent');
    } catch {
      setForgotStatus('error');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');


    if (!loginEmail || !loginPassword) {
      setLoginError(t('auth.error_fill_all'));
      return;
    }

    setLoginLoading(true);
    try {
      const normalised = loginEmail.trim().toLowerCase();

      // ── Demo credentials always bypass Supabase ─────────────
      if (DEMO_CREDENTIALS[normalised] !== undefined) {
        if (DEMO_CREDENTIALS[normalised] === loginPassword) {
          const users = NakheelDB.getUsers();
          const user = users.find(u => u.email.toLowerCase() === normalised);
          if (user) { onLoginSuccess(user); return; }
        }
        setLoginError(t('auth.error_login_invalid'));
        return;
      }

      if (isSupabaseAvailable) {
        // ── Supabase Auth path ──────────────────────────────
        try {
          const { signIn } = await import('../services/supabaseDB');
          const user = await signIn(normalised, loginPassword);
          onLoginSuccess(user);
        } catch {
          setLoginError(t('auth.error_login_invalid'));
        }
        return;
      }

      // ── localStorage (demo) path — registered users ─────────
      const users = NakheelDB.getUsers();
      const user = users.find(u => u.email.toLowerCase() === normalised);

      if (!user) {
        setLoginError(t('auth.error_login_invalid'));
        return;
      }

      const storedHash = NakheelDB.getPasswordHash(normalised);
      if (storedHash) {
        const inputHash = await hashPassword(loginPassword);
        if (inputHash === storedHash) {
          onLoginSuccess(user);
        } else {
          setLoginError(t('auth.error_login_invalid'));
        }
      } else {
        setLoginError(t('auth.error_login_invalid'));
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    const needsLocation = regRole !== 'operator';
    if (!regName || !regEmail || !regPassword || (needsLocation && (!regCommune || !regPhone))) {
      setRegError(t('auth.error_fill_all'));
      return;
    }

    // Algerian Mobile Validation Regex (+213 or 0 followed by 5/6/7 and 8 digits)
    const dzPhoneRegex = /^(?:\+213|0)[567]\d{8}$/;
    if (needsLocation && !dzPhoneRegex.test(regPhone.replace(/\s+/g, ''))) {
      setRegError(language === 'ar' 
        ? 'يرجى إدخال رقم هاتف جزائري صحيح (مثال: 0550123456 أو 213661123456+)'
        : 'Veuillez saisir un numéro de téléphone algérien valide (ex: 0550123456 ou +213661123456).'
      );
      return;
    }

    const users = NakheelDB.getUsers();
    if (users.some(u => u.email.toLowerCase() === regEmail.trim().toLowerCase())) {
      setRegError(t('auth.error_email_used'));
      return;
    }

    const newUserId = `usr-${regRole}-${Date.now()}`;
    const selectedWilayaObj = ALGERIAN_WILAYAS.find(w => w.id === regWilaya);
    const wilayaLabel = selectedWilayaObj ? (language === 'ar' ? selectedWilayaObj.ar : selectedWilayaObj.fr) : regWilaya;

    const newUser = {
      id: newUserId,
      fullName: regName,
      phone: regPhone,
      email: regEmail.trim(),
      role: regRole,
      wilaya: regWilaya,
      commune: regCommune,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'pending' as const,
    };

    const formattedLocation = `${regCommune}, ${wilayaLabel}`;

    if (isSupabaseAvailable) {
      // ── Supabase registration path ──────────────────────
      try {
        const { signUp } = await import('../services/supabaseDB');
        await signUp(regEmail.trim(), regPassword, {
          fullName: regName,
          phone: regPhone,
          role: regRole,
          wilaya: regWilaya,
          commune: regCommune,
        });
        setRegSuccess(t('auth.success_register'));
        setTimeout(() => { setLoginEmail(regEmail); setLoginPassword(''); setIsLoginTab(true); setRegSuccess(''); }, 1500);
      } catch (err: any) {
        setRegError(err?.message || t('auth.error_fill_all'));
      }
      return;
    }

    // ── localStorage (demo) registration path ───────────
    const passwordHash = await hashPassword(regPassword);
    NakheelDB.savePasswordHash(regEmail.trim().toLowerCase(), passwordHash);
    NakheelDB.saveUsers([...users, newUser]);

    if (regRole === 'supplier') {
      const newSupplier: Supplier = {
        id: `sup-${Date.now()}`,
        userId: newUserId,
        supplierType: regSupplierType as any,
        location: formattedLocation,
        totalWasteDeclared: 0,
        totalWasteAccepted: 0,
        reliabilityScore: 100,
        notes: regFarmName || 'Exploitation Oasienne'
      };
      const suppliers = NakheelDB.getSuppliers();
      suppliers.push(newSupplier);
      NakheelDB.saveSuppliers(suppliers);
    } else if (regRole === 'client') {
      const newClient: Client = {
        id: `cli-${Date.now()}`,
        userId: newUserId,
        clientType: regClientType as any,
        animalType: regAnimalType === 'Ovins' ? 'sheep' : regAnimalType === 'Bovins' ? 'cattle' : 'mixed',
        monthlyDemandEstimate: 1000,
        deliveryLocation: formattedLocation,
        loyaltyScore: 100
      };
      const clients = NakheelDB.getClients();
      clients.push(newClient);
      NakheelDB.saveClients(clients);
    }

    setRegSuccess(t('auth.success_register'));
    
    setTimeout(() => {
      setLoginEmail(regEmail);
      setLoginPassword('');
      setIsLoginTab(true);
      setRegSuccess('');
    }, 1500);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '3rem 1.25rem', maxWidth: '1000px' }}>
      <div className="grid grid-2" style={{ gap: '2.5rem', alignItems: 'start' }}>
        
        {/* Left Side: Project Presentation Panel */}
        <div>
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, var(--primary) 0%, hsl(145, 63%, 12%) 100%)',
            color: 'white',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            padding: '2rem'
          }}>
            <h2 style={{ color: 'white', fontSize: '1.6rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'var(--font-display)' }}>
              🌴 {t('auth.title')}
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {t('auth.presentation')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.5rem', borderRadius: '8px' }}>
                  <Award size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h4 style={{ color: 'white', margin: '0 0 0.15rem 0', fontSize: '0.88rem', fontWeight: 700 }}>{t('auth.feature_ai')}</h4>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>{t('auth.feature_ai_sub')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.5rem', borderRadius: '8px' }}>
                  <Shield size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h4 style={{ color: 'white', margin: '0 0 0.15rem 0', fontSize: '0.88rem', fontWeight: 700 }}>{t('auth.feature_trace')}</h4>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>{t('auth.feature_trace_sub')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.5rem', borderRadius: '8px' }}>
                  <Briefcase size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h4 style={{ color: 'white', margin: '0 0 0.15rem 0', fontSize: '0.88rem', fontWeight: 700 }}>{t('auth.feature_env')}</h4>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>{t('auth.feature_env_sub')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ borderLeft: language === 'ar' ? 'none' : '4px solid var(--secondary)', borderRight: language === 'ar' ? '4px solid var(--secondary)' : 'none', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
              <Info size={18} style={{ color: 'var(--secondary)' }} /> {t('auth.how_to_test')}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'gray', lineHeight: '1.5', margin: 0 }}>
              {t('auth.how_to_test_sub')}
            </p>
          </div>
        </div>

        {/* Right Side: Authentication Card */}
        <div className="card" style={{ padding: '2rem' }}>
          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '2px solid var(--neutral-border)', 
            marginBottom: '2rem'
          }}>
            <button
              onClick={() => { setIsLoginTab(true); setLoginError(''); setRegError(''); }}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'none',
                border: 'none',
                borderBottom: isLoginTab ? '3px solid var(--primary)' : 'none',
                color: isLoginTab ? 'var(--primary)' : 'gray',
                fontWeight: isLoginTab ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '1.05rem'
              }}
            >
              <LogIn size={18} /> {t('auth.tab_login')}
            </button>
            <button
              onClick={() => { setIsLoginTab(false); setLoginError(''); setRegError(''); }}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'none',
                border: 'none',
                borderBottom: !isLoginTab ? '3px solid var(--primary)' : 'none',
                color: !isLoginTab ? 'var(--primary)' : 'gray',
                fontWeight: !isLoginTab ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '1.05rem'
              }}
            >
              <UserPlus size={18} /> {t('auth.tab_register')}
            </button>
          </div>

          {/* LOGIN FORM */}
          {isLoginTab ? (
            <form onSubmit={handleLoginSubmit}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{t('auth.login_sub')}</h3>
              
              {loginError && (
                <div style={{ 
                  backgroundColor: 'var(--status-rejected-light)', 
                  color: 'var(--status-rejected)', 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  border: '1px solid rgba(231, 76, 60, 0.2)'
                }}>
                  {loginError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{t('auth.email')}</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="exemple@nakheel.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">{t('auth.password')}</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                {isSupabaseAvailable && (
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setForgotEmail(loginEmail); setForgotStatus('idle'); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.78rem', marginTop: '0.35rem', padding: 0, textDecoration: 'underline' }}
                  >
                    {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Mot de passe oublié ?'}
                  </button>
                )}
              </div>

              {/* Forgot password modal */}
              {showForgot && (
                <div style={{ background: 'var(--neutral-light)', border: '1px solid var(--neutral-border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
                  {forgotStatus === 'sent' ? (
                    <p style={{ color: 'var(--status-approved)', fontSize: '0.85rem', margin: 0 }}>
                      ✅ {language === 'ar' ? 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.' : 'Lien de réinitialisation envoyé à votre email.'}
                    </p>
                  ) : (
                    <form onSubmit={handleForgotPassword} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="email"
                        className="form-input"
                        placeholder={language === 'ar' ? 'بريدك الإلكتروني' : 'Votre email'}
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        style={{ flex: 1, marginBottom: 0 }}
                      />
                      <button type="submit" className="btn btn-primary btn-sm" disabled={forgotStatus === 'loading'}>
                        {forgotStatus === 'loading' ? '...' : (language === 'ar' ? 'إرسال' : 'Envoyer')}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForgot(false)}>✕</button>
                    </form>
                  )}
                  {forgotStatus === 'error' && (
                    <p style={{ color: 'var(--status-rejected)', fontSize: '0.8rem', marginTop: '0.4rem', marginBottom: 0 }}>
                      {language === 'ar' ? 'حدث خطأ، تحقق من البريد الإلكتروني.' : 'Erreur — vérifiez l\'adresse email.'}
                    </p>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '1.5rem', border: '1px solid var(--neutral-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', backgroundColor: '#faf9f5' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                  💡 {t('auth.demo_accounts')}
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setLoginEmail('admin@nakheel.com');
                      setLoginPassword('admin123');
                      setLoginError('');
                    }}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.68rem', textTransform: 'none', padding: '0.35rem 0.5rem', justifyContent: 'flex-start', gap: '0.2rem', color: 'var(--neutral-dark)', border: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    👑 {t('auth.role_admin_btn')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setLoginEmail('operator@nakheel.com');
                      setLoginPassword('operator123');
                      setLoginError('');
                    }}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.68rem', textTransform: 'none', padding: '0.35rem 0.5rem', justifyContent: 'flex-start', gap: '0.2rem', color: 'var(--neutral-dark)', border: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    🏭 {t('auth.role_operator_btn')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setLoginEmail('ahmed.biskra@gmail.com');
                      setLoginPassword('ahmed123');
                      setLoginError('');
                    }}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.68rem', textTransform: 'none', padding: '0.35rem 0.5rem', justifyContent: 'flex-start', gap: '0.2rem', color: 'var(--neutral-dark)', border: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    🌴 {t('auth.role_supplier_btn')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setLoginEmail('yacine.touati@outlook.com');
                      setLoginPassword('yacine123');
                      setLoginError('');
                    }}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.68rem', textTransform: 'none', padding: '0.35rem 0.5rem', justifyContent: 'flex-start', gap: '0.2rem', color: 'var(--neutral-dark)', border: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    🌾 {t('auth.role_client_btn')}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                {t('auth.login_btn')}
              </button>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{t('auth.register_sub')}</h3>

              {regError && (
                <div style={{ 
                  backgroundColor: 'var(--status-rejected-light)', 
                  color: 'var(--status-rejected)', 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem'
                }}>
                  {regError}
                </div>
              )}

              {regSuccess && (
                <div style={{ 
                  backgroundColor: 'var(--status-approved-light)', 
                  color: 'var(--status-approved)', 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle size={16} /> {regSuccess}
                </div>
              )}

              {/* Role Selection */}
              <div className="form-group">
                <label className="form-label">{t('auth.register_role')}</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <label style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0.5rem',
                    border: `2px solid ${regRole === 'supplier' ? 'var(--primary)' : 'var(--neutral-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: regRole === 'supplier' ? 'var(--primary-light)' : 'white',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    minWidth: '120px'
                  }}>
                    <input 
                      type="radio" 
                      name="regRole" 
                      checked={regRole === 'supplier'} 
                      onChange={() => setRegRole('supplier')} 
                      style={{ marginBottom: '0.25rem' }}
                    />
                    <strong style={{ color: 'var(--primary)' }}>{t('auth.register_role_supplier')}</strong>
                    <span style={{ fontSize: '0.65rem', color: 'gray' }}>{t('auth.register_role_supplier_sub')}</span>
                  </label>

                  <label style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0.5rem',
                    border: `2px solid ${regRole === 'operator' ? 'var(--primary)' : 'var(--neutral-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: regRole === 'operator' ? 'var(--primary-light)' : 'white',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    minWidth: '120px'
                  }}>
                    <input 
                      type="radio" 
                      name="regRole" 
                      checked={regRole === 'operator'} 
                      onChange={() => setRegRole('operator')} 
                      style={{ marginBottom: '0.25rem' }}
                    />
                    <strong style={{ color: 'var(--primary)' }}>{t('auth.register_role_operator')}</strong>
                    <span style={{ fontSize: '0.65rem', color: 'gray' }}>{t('auth.register_role_operator_sub')}</span>
                  </label>
                  
                  <label style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0.5rem',
                    border: `2px solid ${regRole === 'client' ? 'var(--primary)' : 'var(--neutral-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: regRole === 'client' ? 'var(--primary-light)' : 'white',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    minWidth: '120px'
                  }}>
                    <input 
                      type="radio" 
                      name="regRole" 
                      checked={regRole === 'client'} 
                      onChange={() => setRegRole('client')} 
                      style={{ marginBottom: '0.25rem' }}
                    />
                    <strong style={{ color: 'var(--primary)' }}>{t('auth.register_role_client')}</strong>
                    <span style={{ fontSize: '0.65rem', color: 'gray' }}>{t('auth.register_role_client_sub')}</span>
                  </label>
                </div>
              </div>

              {/* Common Fields */}
              <div className="form-group">
                <label className="form-label">{t('auth.fullName')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={language === 'ar' ? 'مثال: محمد بلقاسم' : 'Ex: Mourad Bouaza'} 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>

              <div className="grid grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('auth.email')}</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="exemple@gmail.com" 
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('auth.password')}</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </div>
              </div>

              {regRole !== 'operator' && (
                <>
                  <div className="grid grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">{t('auth.farmName')}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder={language === 'ar' ? 'مثال: واحة الغرفة' : 'Ex: Oasis El Ghorfa'} 
                        value={regFarmName}
                        onChange={(e) => setRegFarmName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('auth.phone')}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ex: 0550123456" 
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Algerian Wilaya & Commune Selection */}
                  <div className="grid grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">{t('auth.wilaya')}</label>
                      <select 
                        className="form-input"
                        value={regWilaya}
                        onChange={(e) => setRegWilaya(e.target.value)}
                      >
                        {ALGERIAN_WILAYAS.map(w => (
                          <option key={w.id} value={w.id}>
                            {language === 'ar' ? w.ar : w.fr}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('auth.commune')}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder={language === 'ar' ? 'أدخل البلدية' : 'Ex: Tolga ou Guemar'} 
                        value={regCommune}
                        onChange={(e) => setRegCommune(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Supplier Specific Fields: User Type adapt (فلاح، مالك نخيل، تعاونية) */}
              {regRole === 'supplier' && (
                <div className="form-group">
                  <label className="form-label">{t('auth.supplier_type')}</label>
                  <select 
                    className="form-input"
                    value={regSupplierType}
                    onChange={(e) => setRegSupplierType(e.target.value)}
                  >
                    <option value="farmer">{t('auth.supplier_type_farmer')}</option>
                    <option value="palm_owner">{t('auth.supplier_type_owner')}</option>
                    <option value="cooperative">{t('auth.supplier_type_coop')}</option>
                    <option value="trader">{t('auth.supplier_type_trader')}</option>
                  </select>
                </div>
              )}

              {/* Client Specific Fields: (مربي، تاجر أعلاف) */}
              {regRole === 'client' && (
                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t('auth.client_animal_type')}</label>
                    <select 
                      className="form-input"
                      value={regAnimalType}
                      onChange={(e) => setRegAnimalType(e.target.value)}
                    >
                      <option value="Ovins">{t('auth.client_animal_sheep')}</option>
                      <option value="Bovins">{t('auth.client_animal_cattle')}</option>
                      <option value="Camélidés">{t('auth.client_animal_camel')}</option>
                      <option value="Mélange">{t('auth.client_animal_mixed')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('auth.supplier_type')}</label>
                    <select 
                      className="form-input"
                      value={regClientType}
                      onChange={(e) => setRegClientType(e.target.value)}
                    >
                      <option value="medium_breeder">{language === 'ar' ? 'مربي مواشي' : 'Moyen Éleveur'}</option>
                      <option value="wholesaler">{language === 'ar' ? 'تاجر أعلاف' : 'Vendeur / Distributeur d\'aliments'}</option>
                    </select>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '1rem' }}>
                {t('auth.register_btn')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
