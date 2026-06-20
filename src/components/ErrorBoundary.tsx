import React from 'react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[GourFeed] Erreur non gérée:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--neutral-light)', padding: '2rem',
      }}>
        <div style={{
          maxWidth: '480px', background: 'white', borderRadius: 'var(--radius-lg)',
          padding: '2.5rem', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌴</div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Une erreur s'est produite</h2>
          <p style={{ color: 'gray', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Quelque chose d'inattendu s'est passé. Rechargez la page pour continuer.
          </p>
          {this.state.error && (
            <details style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <summary style={{ cursor: 'pointer', color: 'gray', fontSize: '0.8rem' }}>Détails techniques</summary>
              <pre style={{ fontSize: '0.72rem', color: '#c0392b', background: '#fdf2f2', padding: '0.75rem', borderRadius: '6px', overflow: 'auto', marginTop: '0.5rem' }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            🔄 Recharger la page
          </button>
        </div>
      </div>
    );
  }
}
