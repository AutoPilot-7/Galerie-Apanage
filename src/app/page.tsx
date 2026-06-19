// ============================================================================
// Galerie Apanage — VITRINE (accueil public)
// Présentation uniquement — logique et données inchangées.
// ============================================================================

import Link from 'next/link';
import { getData } from '@/data';

export const dynamic = 'force-dynamic';

export default async function VitrinePage() {
  const publications = await getData().listPublications();

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        <header className="hero-header">
          <div className="brand">Galerie <span>Apanage</span></div>
          <nav className="nav">
            <Link href="/">Vitrine</Link>
            <Link href="/vitrine/collection">La collection</Link>
            <Link href="/vitrine/processus">Processus &amp; prix</Link>
            <Link href="/login" className="btn btn-primary">Accès client</Link>
          </nav>
        </header>

        <div className="hero-inner">
          {/* Bloc éditorial */}
          <div className="hero-content">
            <p className="hero-eyebrow">Acquisition automobile d&apos;exception</p>
            <h1 className="hero-title">
              L&apos;acquisition automobile,<br />
              <em>pensée comme</em><br />
              une galerie d&apos;art.
            </h1>
            <div className="hero-divider" aria-hidden="true" />
            <p className="hero-body">
              Chaque demande devient un dossier piloté de bout en bout.<br />
              L&apos;IA accélère. Le commissaire valide. Vous choisissez.
            </p>
            <div className="hero-actions">
              <Link href="/login" className="btn btn-primary">Démarrer une demande</Link>
              <Link href="/vitrine/collection" className="btn btn-ghost">Voir la collection</Link>
            </div>
          </div>

          {/* Slot 3D — React Three Fiber remplacera ce div à l'étape 2 */}
          <div className="hero-stage" aria-hidden="true">
            <div className="hero-stage-glow" />
          </div>
        </div>

        <div className="hero-scroll-hint" aria-hidden="true">
          <span>Défiler</span>
          <svg width="1" height="48" viewBox="0 0 1 48" fill="none">
            <line x1="0.5" y1="0" x2="0.5" y2="48" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
      </section>

      {/* ── COLLECTION ───────────────────────────────────────────────────── */}
      <main
        className="container"
        style={{ paddingTop: 'var(--space-20)', paddingBottom: 'var(--space-24)' }}
      >
        <div className="between" style={{ marginBottom: 'var(--space-10)' }}>
          <div>
            <h2 className="section-heading">La collection</h2>
            <p className="section-subline">Pièces sélectionnées par notre commissaire</p>
          </div>
          <Link href="/vitrine/collection" className="link-arrow">
            Tout voir →
          </Link>
        </div>

        {publications.length === 0 ? (
          <p className="muted">Aucune pièce publiée pour le moment.</p>
        ) : (
          <div className="vitrine-grid">
            {publications.slice(0, 6).map((p) => (
              <article key={p.id} className="vitrine-card">
                <div className="vitrine-card-image">
                  {p.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photos[0]} alt={p.titre ?? ''} />
                  ) : (
                    <div className="vitrine-card-placeholder" />
                  )}
                </div>
                <div className="vitrine-card-body">
                  <h3 className="vitrine-card-title">{p.titre ?? 'Pièce de collection'}</h3>
                  {p.description && (
                    <p className="vitrine-card-desc">
                      {p.description.slice(0, 100)}
                    </p>
                  )}
                  <span className="vitrine-card-ref mono">{p.dossierReference}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="vitrine-footer container muted small">
        <Link href="/mentions">Mentions légales &amp; CGV</Link>
        {' · '}
        Galerie Apanage — France &amp; UE
      </footer>
    </>
  );
}
