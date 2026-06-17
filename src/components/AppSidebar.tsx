import React, { useEffect, useState } from 'react';
import { User } from '../services/db';
import { isSupabaseAvailable } from '../services/supabaseClient';

interface AppSidebarProps {
  user: User;
  currentTab: string;
  onNavigate: (tab: string) => void;
  getRoleBadgeLabel: (role?: string) => string;
  t: (key: string) => string;
  language?: string;
}

export function AppSidebar({ user, currentTab, onNavigate, getRoleBadgeLabel, t, language = 'fr' }: AppSidebarProps) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user.role !== 'admin') return;
    const load = async () => {
      try {
        if (isSupabaseAvailable) {
          const { supabase: sb } = await import('../services/supabaseClient');
          const { count } = await sb!.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending');
          setPendingCount(count ?? 0);
        } else {
          const { NakheelDB } = await import('../services/db');
          setPendingCount(NakheelDB.getUsers().filter(u => u.status === 'pending').length);
        }
      } catch { /* non-blocking */ }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user.role]);

  return (
    <aside className="sidebar animate-fade-in">
      <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--neutral-border)', paddingBottom: '0.75rem', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.4rem auto', fontSize: '1.1rem', fontWeight: 800 }}>
          {user.fullName.charAt(0)}
        </div>
        <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--primary)' }}>{user.fullName}</strong>
        <span style={{ fontSize: '0.65rem', color: 'gray', textTransform: 'uppercase', fontWeight: 700 }}>{getRoleBadgeLabel(user.role)}</span>
      </div>

      <ul className="sidebar-menu">
        {user.role === 'supplier' && (
          <>
            <li className={`sidebar-item ${currentTab === 'supplier-dash' ? 'active' : ''}`} onClick={() => onNavigate('supplier-dash')}>
              📊 {t('sidebar.dashboard')}
            </li>
            <li className={`sidebar-item ${currentTab === 'supplier-declare' ? 'active' : ''}`} onClick={() => onNavigate('supplier-declare')}>
              🌴 {t('sidebar.declare_waste')}
            </li>
            <li className={`sidebar-item ${currentTab === 'supplier-list' ? 'active' : ''}`} onClick={() => onNavigate('supplier-list')}>
              🚛 {t('sidebar.track_pickup')}
            </li>
          </>
        )}

        {user.role === 'client' && (
          <>
            <li className={`sidebar-item ${currentTab === 'client-catalog' ? 'active' : ''}`} onClick={() => onNavigate('client-catalog')}>
              🌾 {t('sidebar.product_catalog')}
            </li>
            <li className={`sidebar-item ${currentTab === 'client-orders' ? 'active' : ''}`} onClick={() => onNavigate('client-orders')}>
              📦 {t('sidebar.my_orders')}
            </li>
            <li className={`sidebar-item ${currentTab === 'client-feedback' ? 'active' : ''}`} onClick={() => onNavigate('client-feedback')}>
              ⭐ {t('sidebar.feedback')}
            </li>
            <li className={`sidebar-item ${currentTab === 'traceability' ? 'active' : ''}`} onClick={() => onNavigate('traceability')}>
              🔍 {t('sidebar.qr_trace')}
            </li>
          </>
        )}

        {user.role === 'operator' && (
          <>
            <li className={`sidebar-item ${currentTab === 'operator-dash' ? 'active' : ''}`} onClick={() => onNavigate('operator-dash')}>
              🏭 {t('sidebar.fabrication')}
            </li>
            <li className={`sidebar-item ${currentTab === 'traceability' ? 'active' : ''}`} onClick={() => onNavigate('traceability')}>
              🔍 {t('sidebar.qr_trace')}
            </li>
            <li
              className={`sidebar-item ${currentTab === 'operator-subscription' ? 'active' : ''}`}
              onClick={() => onNavigate('operator-subscription')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span>💳 {t('sidebar.subscription')}</span>
              {user.subscriptionPlan === 'pro' ? (
                <span style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: '999px', fontSize: '0.62rem', padding: '1px 7px', fontWeight: 700 }}>PRO</span>
              ) : (
                <span style={{ background: '#fff3e0', color: '#e65100', borderRadius: '999px', fontSize: '0.62rem', padding: '1px 7px', fontWeight: 700 }}>FREE</span>
              )}
            </li>
          </>
        )}

        {user.role === 'admin' && (
          <>
            <li className={`sidebar-item ${currentTab === 'admin-dash' ? 'active' : ''}`} onClick={() => onNavigate('admin-dash')}>
              📊 {t('sidebar.dashboard')}
            </li>
            <li className={`sidebar-item ${currentTab === 'admin-waste' ? 'active' : ''}`} onClick={() => onNavigate('admin-waste')}>
              📥 {t('sidebar.admin_waste')}
            </li>
            <li className={`sidebar-item ${currentTab === 'admin-batches' ? 'active' : ''}`} onClick={() => onNavigate('admin-batches')}>
              🧱 {t('sidebar.admin_batches')}
            </li>
            <li className={`sidebar-item ${currentTab === 'admin-orders' ? 'active' : ''}`} onClick={() => onNavigate('admin-orders')}>
              📦 {t('sidebar.admin_orders')}
            </li>
            <li className={`sidebar-item ${currentTab === 'admin-complaints' ? 'active' : ''}`} onClick={() => onNavigate('admin-complaints')}>
              💬 {t('sidebar.admin_complaints')}
            </li>
            <li className={`sidebar-item ${currentTab === 'admin-ai' ? 'active' : ''}`} onClick={() => onNavigate('admin-ai')}>
              🔮 {t('sidebar.admin_ai')}
            </li>
            <li className={`sidebar-item ${currentTab === 'admin-prices' ? 'active' : ''}`} onClick={() => onNavigate('admin-prices')}>
              💰 {t('sidebar.admin_prices')}
            </li>
            <li className={`sidebar-item ${currentTab === 'admin-subscriptions' ? 'active' : ''}`} onClick={() => onNavigate('admin-subscriptions')}>
              💳 {t('sidebar.admin_subscriptions')}
            </li>
            <li className={`sidebar-item ${currentTab === 'admin-calendar' ? 'active' : ''}`} onClick={() => onNavigate('admin-calendar')}>
              📅 {language === 'ar' ? 'تقويم الجمع' : 'Calendrier Collecte'}
            </li>
            <li
              className={`sidebar-item ${currentTab === 'admin-pending' ? 'active' : ''}`}
              onClick={() => onNavigate('admin-pending')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span>🔔 {t('sidebar.admin_pending')}</span>
              {pendingCount > 0 && (
                <span style={{ background: '#e74c3c', color: 'white', borderRadius: '999px', fontSize: '0.65rem', padding: '0.1rem 0.45rem', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                  {pendingCount}
                </span>
              )}
            </li>
            <li
              className={`sidebar-item ${currentTab === 'tests' ? 'active' : ''}`}
              onClick={() => onNavigate('tests')}
              style={{ borderTop: '1px solid var(--neutral-border)', marginTop: '1.25rem', paddingTop: '0.75rem', fontWeight: 'bold', color: 'var(--accent)' }}
            >
              🧪 {t('nav.demo_center')}
            </li>
          </>
        )}
        <li
          className={`sidebar-item ${currentTab === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('profile')}
          style={{ borderTop: '1px solid var(--neutral-border)', marginTop: '1rem', paddingTop: '0.75rem' }}
        >
          👤 {t('sidebar.my_profile')}
        </li>
      </ul>
    </aside>
  );
}
