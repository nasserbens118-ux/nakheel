import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: 'linear-gradient(135deg, #1a3d2b 0%, #2E5A44 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#ffffff', padding: '2rem' }}>
          <div style={{ fontSize: '5rem', marginBottom: '0.5rem' }}>🌴</div>
          <h1 style={{ fontSize: '5rem', fontWeight: 900, margin: '0', letterSpacing: '-2px', opacity: 0.9 }}>404</h1>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.5rem 0 1rem', color: '#a8d5b8' }}>
            Page introuvable
          </h2>
          <p style={{ color: '#c8ddd4', fontSize: '1rem', marginBottom: '2rem', maxWidth: '360px', margin: '0 auto 2rem' }}>
            Cette page n'existe pas ou a été déplacée.
            <br />
            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>الصفحة غير موجودة أو تم نقلها</span>
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              background: '#ffffff',
              color: '#2E5A44',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
            }}
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </body>
    </html>
  );
}
