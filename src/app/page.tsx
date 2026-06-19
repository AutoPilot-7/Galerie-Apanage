// ============================================================================
// Galerie Apanage — VITRINE (accueil public)
// Présentation uniquement — logique et données inchangées.
// ============================================================================

import Link from 'next/link';
import { getData } from '@/data';

export const dynamic = 'force-dynamic';

// Logo mark — A encadré, cartel prune — SVG inline pour éviter une image externe
function LogoMark({ size = 22, light = false }: { size?: number; light?: boolean }) {
  const h = Math.round(size * 1.25);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 90 112"
      aria-hidden="true"
      style={{ color: light ? 'var(--color-platre)' : 'var(--color-encre)', flexShrink: 0 }}
    >
      <rect x="12" y="6" width="66" height="100" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <text x="45" y="74" fontFamily="Marcellus,serif" fontSize="56" fill="currentColor" textAnchor="middle">A</text>
      <rect x="34" y="84" width="22" height="2.6" fill={light ? 'var(--color-prune-soft)' : 'var(--color-prune)'} />
    </svg>
  );
}

export default async function VitrinePage() {
  const publications = await getData().listPublications();

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="hero">

        <header className="hero-header">
          <div className="brand">
            <LogoMark size={20} light />
            Galerie <span>Apanage</span>
          </div>
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
            <p className="hero-eyebrow">Sur invitation</p>

            <div className="hero-lockup">
              <span className="hero-galerie">Galerie</span>
              <h1 className="hero-title">
                Apanage<br />
                <em>Tokyo · Séoul</em>
              </h1>
            </div>

            <div className="hero-divider" aria-hidden="true" />

            <p className="hero-body">
              L&apos;acquisition automobile, pensée comme une galerie d&apos;art.
              Chaque dossier est piloté de bout en bout : repérage, acquisition,
              traversée, remise. Le commissaire valide à chaque étape à enjeu.
            </p>

            <div className="hero-actions">
              <Link href="/login" className="btn btn-primary">Démarrer une demande</Link>
              <Link href="/vitrine/collection" className="btn btn-ghost">La collection →</Link>
            </div>

            <p className="hero-tagline">
              Le privilège de <em>l&apos;exception</em>
            </p>
          </div>

          {/* Slot 3D — React Three Fiber remplace ce div à l'étape 2 */}
          <div className="hero-stage" aria-hidden="true">
            <div className="hero-stage-grid" />
            <div className="hero-stage-glow" />
          </div>

        </div>

        <div className="hero-scroll-hint" aria-hidden="true">
          <svg width="1" height="48" viewBox="0 0 1 48" fill="none">
            <line x1="0.5" y1="0" x2="0.5" y2="48" stroke="currentColor" strokeWidth="1" />
          </svg>
          <span>Défiler</span>
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
            <p className="section-subline">L&apos;accrochage — pièces sur acquisition</p>
          </div>
          <Link href="/vitrine/collection" className="link-arrow">
            Tout voir →
          </Link>
        </div>

        {publications.length === 0 ? (
          <p style={{ color: 'var(--color-ink-45)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
            Aucune pièce publiée pour le moment.
          </p>
        ) : (
          <div className="vitrine-grid">
            {publications.slice(0, 6).map((p, i) => (
              <article key={p.id} className="vitrine-card">
                <div className="vitrine-card-image">
                  {p.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photos[0]} alt={p.titre ?? ''} />
                  ) : (
                    <div className="vitrine-card-placeholder">
                      {/* Logo mark comme placeholder élégant */}
                      <svg width="28" height="35" viewBox="0 0 90 112" aria-hidden="true" style={{ color: 'var(--color-greige)' }}>
                        <rect x="12" y="6" width="66" height="100" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                        <text x="45" y="74" fontFamily="Marcellus,serif" fontSize="56" fill="currentColor" textAnchor="middle">A</text>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="vitrine-card-body">
                  <p className="vitrine-card-key">
                    Pièce N° {String(i + 1).padStart(2, '0')} · Sur acquisition
                  </p>
                  <h3 className="vitrine-card-title">{p.titre ?? 'Pièce de collection'}</h3>
                  {p.description && (
                    <p className="vitrine-card-desc">
                      {p.description.slice(0, 110)}
                    </p>
                  )}
                  <span className="vitrine-card-ref">{p.dossierReference}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
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
