// ============================================================================
// Galerie Apanage — VITRINE / La collection (public). Grille des pièces publiées.
// ============================================================================

import Link from 'next/link';
import { getData } from '@/data';
import { EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function CollectionPage() {
  const pubs = await getData().listPublications();

  return (
    <>
      <header className="topbar">
        <div className="brand">Galerie <span>Apanage</span></div>
        <nav className="nav">
          <Link href="/">← Vitrine</Link>
          <Link href="/login" className="btn btn-primary">Accès client / commissaire</Link>
        </nav>
      </header>

      <main className="container stack">
        <div className="between">
          <h1 style={{ margin: 0 }}>La collection</h1>
          <span className="muted small">{pubs.length} pièce(s) publiée(s)</span>
        </div>

        {pubs.length === 0 ? (
          <EmptyState>Aucune pièce publiée pour le moment.</EmptyState>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {pubs.map((p) => (
              <article key={p.id} className="card stack" style={{ gap: 8 }}>
                {p.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photos[0]} alt={p.titre ?? ''} style={{ width: '100%', borderRadius: 8 }} />
                ) : null}
                <h3 style={{ margin: 0 }}>{p.titre ?? 'Pièce de collection'}</h3>
                <p className="muted small">{(p.description ?? '').slice(0, 160)}</p>
                <span className="small mono">{p.dossierReference}</span>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="container muted small">
        <Link href="/mentions">Mentions légales &amp; CGV</Link> · Galerie Apanage — France &amp; UE
      </footer>
    </>
  );
}
