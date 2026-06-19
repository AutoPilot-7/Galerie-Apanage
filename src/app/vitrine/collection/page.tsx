// ============================================================================
// Galerie Apanage — VITRINE / La collection (public). Grille des pièces publiées.
// ============================================================================

import Link from 'next/link';
import { getData } from '@/data';
import { EmptyState, LogoMark } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function CollectionPage() {
  const pubs = await getData().listPublications();

  return (
    <>
      <header className="vitrine-topbar">
        <div className="brand">
          <LogoMark size={18} light />
          Galerie <span>Apanage</span>
        </div>
        <nav className="nav">
          <Link href="/">← Vitrine</Link>
          <Link href="/vitrine/processus">Processus &amp; prix</Link>
          <Link href="/login" className="btn btn-primary">Accès client</Link>
        </nav>
      </header>

      <div className="collection-banner">
        <p className="collection-eyebrow">L&apos;accrochage</p>
        <h1 className="collection-title">La collection</h1>
        <p className="collection-count">
          {pubs.length} pièce{pubs.length !== 1 ? 's' : ''} publiée{pubs.length !== 1 ? 's' : ''} · Sur acquisition
        </p>
      </div>

      <main
        className="container"
        style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-24)' }}
      >
        {pubs.length === 0 ? (
          <EmptyState>Aucune pièce publiée pour le moment.</EmptyState>
        ) : (
          <div className="vitrine-grid">
            {pubs.map((p, i) => (
              <article key={p.id} className="collection-article">
                <div className="collection-article-img">
                  {p.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photos[0]} alt={p.titre ?? ''} />
                  ) : (
                    <div className="collection-article-placeholder">
                      <svg width="28" height="35" viewBox="0 0 90 112" aria-hidden="true" style={{ color: 'var(--color-greige)' }}>
                        <rect x="12" y="6" width="66" height="100" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                        <text x="45" y="74" fontFamily="Marcellus,serif" fontSize="56" fill="currentColor" textAnchor="middle">A</text>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="collection-article-body">
                  <p className="collection-article-key">
                    Pièce N° {String(i + 1).padStart(2, '0')} · Sur acquisition
                  </p>
                  <h3 className="collection-article-title">{p.titre ?? 'Pièce de collection'}</h3>
                  {p.description && (
                    <p className="collection-article-desc">{p.description.slice(0, 160)}</p>
                  )}
                  <span className="collection-article-ref">{p.dossierReference}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="vitrine-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LogoMark size={16} />
          <span>Galerie Apanage — Tokyo · Séoul</span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/vitrine/processus">Processus &amp; prix</Link>
          <Link href="/mentions">Mentions légales</Link>
        </div>
      </footer>
    </>
  );
}
