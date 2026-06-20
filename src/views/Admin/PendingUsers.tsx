import React, { useEffect, useState } from 'react';
import { UserCheck, UserX, Clock } from 'lucide-react';
import { useLanguage } from '../../components/LanguageContext';
import { useToast } from '../../components/Toast';
import { isSupabaseAvailable } from '../../services/supabaseClient';
import { User } from '../../services/db';

export const PendingUsers: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const ar = language === 'ar';
  const [pending, setPending] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    setLoading(true);
    try {
      if (isSupabaseAvailable) {
        const { supabase: sb } = await import('../../services/supabaseClient');
        const { data } = await sb!.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false });
        setPending((data ?? []).map((p: any) => ({
          id: p.id, fullName: p.full_name, email: p.email,
          phone: p.phone ?? '', role: p.role, wilaya: p.wilaya ?? '',
          commune: p.commune ?? '', createdAt: p.created_at?.split('T')[0] ?? '',
          status: p.status,
        })));
      } else {
        const { NakheelDB } = await import('../../services/db');
        setPending(NakheelDB.getUsers().filter(u => u.status === 'pending'));
      }
    } catch {
      toast(ar ? 'خطأ في تحميل القائمة' : 'Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user: User) => {
    setProcessing(user.id);
    try {
      if (isSupabaseAvailable) {
        const { supabase: sb } = await import('../../services/supabaseClient');
        await sb!.from('profiles').update({ status: 'active' }).eq('id', user.id);
        // Send approval email
        const { emailCollectionScheduled } = await import('../../services/emailNotifications');
        void fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            subject: 'Votre compte GourFeed a été approuvé ✅',
            html: `<p>Bonjour <strong>${user.fullName}</strong>,</p>
              <p>Votre compte a été <strong>approuvé</strong> par l'équipe GourFeed. Vous pouvez maintenant vous connecter et accéder à votre espace.</p>
              <p>Bienvenue sur la plateforme ! 🌴</p>`,
          }),
        }).catch(() => null);
      } else {
        const { NakheelDB } = await import('../../services/db');
        const users = NakheelDB.getUsers().map(u => u.id === user.id ? { ...u, status: 'active' as const } : u);
        NakheelDB.saveUsers(users);
      }
      setPending(p => p.filter(u => u.id !== user.id));
      toast(`${user.fullName} ${ar ? 'تم تفعيله ✅' : 'approuvé ✅'}`, 'success');
    } catch {
      toast(ar ? 'خطأ أثناء التفعيل' : 'Erreur lors de l\'approbation', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (user: User) => {
    setProcessing(user.id);
    try {
      if (isSupabaseAvailable) {
        const { supabase: sb } = await import('../../services/supabaseClient');
        await sb!.from('profiles').update({ status: 'inactive' }).eq('id', user.id);
        void fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            subject: 'Votre demande GourFeed',
            html: `<p>Bonjour <strong>${user.fullName}</strong>,</p>
              <p>Nous avons examiné votre demande d'accès à la plateforme GourFeed. Malheureusement, nous ne pouvons pas l'accepter à ce stade. Contactez-nous pour plus d'informations.</p>`,
          }),
        }).catch(() => null);
      } else {
        const { NakheelDB } = await import('../../services/db');
        const users = NakheelDB.getUsers().map(u => u.id === user.id ? { ...u, status: 'inactive' as const } : u);
        NakheelDB.saveUsers(users);
      }
      setPending(p => p.filter(u => u.id !== user.id));
      toast(`${user.fullName} ${ar ? 'تم رفضه' : 'rejeté'}`, 'warning');
    } catch {
      toast(ar ? 'خطأ أثناء الرفض' : 'Erreur lors du rejet', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const ROLE_LABEL: Record<string, string> = {
    supplier: ar ? 'منتج واحاتي' : 'Producteur Oasien',
    client:   ar ? 'مربّي' : 'Éleveur',
    operator: ar ? 'مشغّل' : 'Opérateur',
    admin:    ar ? 'مدير' : 'Administrateur',
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={22} />
          {ar ? 'طلبات الانضمام المعلّقة' : 'Demandes d\'accès en attente'}
          {pending.length > 0 && (
            <span style={{ background: '#e74c3c', color: 'white', borderRadius: '999px', fontSize: '0.72rem', padding: '0.1rem 0.5rem', fontWeight: 700 }}>
              {pending.length}
            </span>
          )}
        </h2>
        <button className="btn btn-secondary btn-sm" onClick={loadPending} disabled={loading}>
          🔄 {ar ? 'تحديث' : 'Actualiser'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'gray' }}>
          {ar ? 'جارٍ التحميل...' : 'Chargement...'}
        </div>
      ) : pending.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'gray' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
          {ar ? 'لا توجد طلبات معلّقة حالياً' : 'Aucune demande en attente'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pending.map(u => (
            <div key={u.id} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 800, flexShrink: 0,
                }}>
                  {u.fullName.charAt(0)}
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--primary)' }}>{u.fullName}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'gray' }}>{u.email}</span>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>{ROLE_LABEL[u.role] ?? u.role}</span>
                    {u.wilaya && <span style={{ fontSize: '0.72rem', color: 'gray' }}>📍 {u.wilaya}</span>}
                    {u.phone && <span style={{ fontSize: '0.72rem', color: 'gray' }}>📞 {u.phone}</span>}
                    <span style={{ fontSize: '0.72rem', color: 'gray' }}>🗓 {u.createdAt}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={processing === u.id}
                  onClick={() => handleApprove(u)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <UserCheck size={14} /> {ar ? 'تفعيل' : 'Approuver'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={processing === u.id}
                  onClick={() => handleReject(u)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#e74c3c', borderColor: '#e74c3c' }}
                >
                  <UserX size={14} /> {ar ? 'رفض' : 'Rejeter'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
