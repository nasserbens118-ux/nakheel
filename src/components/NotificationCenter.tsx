import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell } from 'lucide-react';

export interface AppNotification {
  id: string;
  type: 'waste' | 'order' | 'quality' | 'complaint' | 'system';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  role?: string; // which role this notification targets
}

const STORAGE_KEY = 'nakheel_notifications';

export function loadNotifications(): AppNotification[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}

export function saveNotifications(notifs: AppNotification[]) {
  // Keep last 50 only
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(-50)));
}

export function pushNotification(notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) {
  const notifs = loadNotifications();
  const newNotif: AppNotification = {
    ...notif,
    id: `notif-${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  saveNotifications([...notifs, newNotif]);
  window.dispatchEvent(new Event('nakheel-notification'));
}

// ─── NotificationCenter Component ────────────────────────────────────────────

interface Props {
  userRole?: string;
  language?: string;
}

export function NotificationCenter({ userRole, language = 'fr' }: Props) {
  const ar = language === 'ar';
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(() => {
    const all = loadNotifications();
    // Filter to relevant role + last 20
    const relevant = all
      .filter(n => !n.role || n.role === userRole)
      .slice(-20)
      .reverse();
    setNotifs(relevant);
  }, [userRole]);

  useEffect(() => {
    reload();
    window.addEventListener('nakheel-notification', reload);
    window.addEventListener('nakheel-db-update', reload);
    const interval = setInterval(reload, 15000);
    return () => {
      window.removeEventListener('nakheel-notification', reload);
      window.removeEventListener('nakheel-db-update', reload);
      clearInterval(interval);
    };
  }, [reload]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unread = notifs.filter(n => !n.read).length;

  const markAllRead = () => {
    const all = loadNotifications().map(n => ({ ...n, read: true }));
    saveNotifications(all);
    reload();
  };

  const markRead = (id: string) => {
    const all = loadNotifications().map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(all);
    reload();
  };

  const clearAll = () => {
    saveNotifications([]);
    reload();
  };

  const ICONS: Record<string, string> = {
    waste: '🌴', order: '📦', quality: '🔬', complaint: '💬', system: '⚙️',
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return ar ? 'الآن' : 'À l\'instant';
    if (mins < 60) return ar ? `منذ ${mins} د` : `Il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return ar ? `منذ ${hrs} س` : `Il y a ${hrs}h`;
    return ar ? `منذ ${Math.floor(hrs / 24)} ي` : `Il y a ${Math.floor(hrs / 24)}j`;
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) markAllRead(); }}
        style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: '0.35rem', color: 'var(--primary)',
          display: 'flex', alignItems: 'center',
        }}
        title={ar ? 'الإشعارات' : 'Notifications'}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#e74c3c', color: 'white',
            borderRadius: '999px', fontSize: '0.6rem',
            padding: '0 4px', minWidth: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, lineHeight: 1,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)',
          [ar ? 'left' : 'right']: 0,
          width: '320px', maxHeight: '420px',
          background: 'white', borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: '1px solid var(--neutral-border)',
          zIndex: 1500, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--neutral-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
              {ar ? 'الإشعارات' : 'Notifications'}
              {notifs.length > 0 && <span style={{ marginInlineStart: '0.35rem', color: 'gray', fontWeight: 400 }}>({notifs.length})</span>}
            </strong>
            {notifs.length > 0 && (
              <button onClick={clearAll} style={{ background: 'none', border: 'none', fontSize: '0.72rem', color: 'gray', cursor: 'pointer' }}>
                {ar ? 'مسح الكل' : 'Tout effacer'}
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'gray', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔔</div>
                {ar ? 'لا توجد إشعارات' : 'Aucune notification'}
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--neutral-light)',
                    cursor: 'pointer', display: 'flex', gap: '0.65rem',
                    background: n.read ? 'transparent' : 'rgba(46,90,68,0.04)',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}>{ICONS[n.type] ?? '🔔'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</strong>
                      {!n.read && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#555', margin: '0.15rem 0 0.2rem', lineHeight: 1.4 }}>{n.body}</p>
                    <span style={{ fontSize: '0.67rem', color: '#aaa' }}>{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
