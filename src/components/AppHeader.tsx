import React from 'react';
import { Leaf, LogOut, Sparkles } from 'lucide-react';
import { User } from '../services/db';
import { Language } from './LanguageContext';
import { NotificationCenter } from './NotificationCenter';

interface AppHeaderProps {
  user: User | null;
  currentTab: string;
  language: Language;
  onNavigate: (tab: string) => void;
  onShowDemo: () => void;
  onLogout: () => void;
  onSetLanguage: (lang: Language) => void;
  getRoleBadgeLabel: (role?: string) => string;
  t: (key: string) => string;
}

export function AppHeader({
  user, currentTab, language,
  onNavigate, onShowDemo, onLogout, onSetLanguage,
  getRoleBadgeLabel, t,
}: AppHeaderProps) {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <div className="logo-container" onClick={() => onNavigate('home')}>
          <Leaf className="logo-icon" size={24} style={{ transform: 'rotate(-10deg)', fill: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>GourFeed</span>
        </div>

        <div className="nav-links">
          {user?.role === 'admin' && (
            <button
              onClick={() => onNavigate('tests')}
              className="btn btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                border: currentTab === 'tests' ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.3)',
                backgroundColor: currentTab === 'tests' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: 'white',
              }}
            >
              🧪 {t('nav.demo_center')}
            </button>
          )}

          <button
            onClick={onShowDemo}
            className="btn btn-accent btn-sm animate-pulse"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--accent)', color: 'white', border: 'none' }}
          >
            <Sparkles size={14} /> {t('nav.demo_mode')}
          </button>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
            <button
              onClick={() => onSetLanguage('fr')}
              style={{ background: 'none', border: 'none', color: language === 'fr' ? 'var(--accent)' : 'rgba(255,255,255,0.8)', fontWeight: language === 'fr' ? '800' : '500', cursor: 'pointer', fontSize: '0.78rem', padding: '0 0.15rem' }}
            >
              Français
            </button>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>|</span>
            <button
              onClick={() => onSetLanguage('ar')}
              style={{ background: 'none', border: 'none', color: language === 'ar' ? 'var(--accent)' : 'rgba(255,255,255,0.8)', fontWeight: language === 'ar' ? '800' : '500', cursor: 'pointer', fontSize: '0.78rem', padding: '0 0.15rem' }}
            >
              العربية
            </button>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <NotificationCenter userRole={user.role} language={language} />
              <span className="role-tag" style={{
                backgroundColor: user.role === 'admin' ? 'var(--accent)' : user.role === 'operator' ? 'var(--secondary)' : 'rgba(255, 255, 255, 0.12)',
              }}>
                {getRoleBadgeLabel(user.role)}
              </span>
              <span className="nav-username" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.fullName}</span>
              <button onClick={onLogout} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.6rem', color: 'white', borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'transparent' }}>
                <LogOut size={13} /> {t('nav.logout')}
              </button>
            </div>
          ) : (
            currentTab !== 'auth' && (
              <button onClick={() => onNavigate('auth')} className="btn btn-accent btn-sm">
                {t('nav.login_demo')}
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
