import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

const COLORS: Record<ToastType, string> = {
  success: '#27ae60',
  error:   '#e74c3c',
  warning: '#e67e22',
  info:    '#2E5A44',
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  useEffect(() => {
    const t = setTimeout(onRemove, 4000);
    return () => clearTimeout(t);
  }, [onRemove]);

  return (
    <div
      onClick={onRemove}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        background: '#fff', border: `2px solid ${COLORS[toast.type]}`,
        borderRadius: '8px', padding: '0.75rem 1rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        cursor: 'pointer', minWidth: '280px', maxWidth: '400px',
        animation: 'toast-in 0.25s ease',
      }}
    >
      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{ICONS[toast.type]}</span>
      <span style={{ fontSize: '0.9rem', color: '#333', flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: '0.6rem',
        zIndex: 99999, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onRemove={() => remove(t.id)} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
