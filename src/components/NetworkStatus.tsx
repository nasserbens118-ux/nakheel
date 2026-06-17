import React, { useState, useEffect } from 'react';

export function NetworkStatus() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => {
      setOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline && !showReconnected) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: offline ? '#c0392b' : '#27ae60',
      color: 'white', textAlign: 'center',
      padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
      transition: 'background 0.3s',
    }}>
      {offline ? (
        <>
          <span>⚠️</span>
          <span>Connexion internet perdue — les modifications seront enregistrées dès le retour du réseau.</span>
        </>
      ) : (
        <>
          <span>✅</span>
          <span>Connexion rétablie</span>
        </>
      )}
    </div>
  );
}
