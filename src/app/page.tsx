// ============================================================================
// Galerie Apanage — VITRINE (accueil public). Fenêtre publique sur la base.
// ============================================================================

import Link from 'next/link';
import { getData } from '@/data';

export const dynamic = 'force-dynamic';

export default async function VitrinePage() {
  const publications = await getData().listPublications();

  return (
    <>
      <header className="topbar">
        <div className="brand">Galerie <span>Apanage</span></div>
        <nav className="nav">
          <Link href="/">Vitrine</Link>
          <Link href="/vitrine/collection">La collection</Link>
          <Link href="/vitrine/processus">Processus &amp; prix</Link>
          <Link href="/login" className="btn btn-primary">Accès client / commissaire</Link>
        </nav>
      </header>

      <main className="container stack">
        <section className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>L’acquisition automobile, pensée comme une galerie d’art</h1>
          <p className="muted" style={{ maxWidth: 680, margin: '0 auto' }}>
            Chaque demande devient un <strong>Dossier d’acquisition</strong> piloté de bout en bout : brief, repérage,
            propositions, acquisition, livraison. L’IA accélère, le commissaire valide à chaque étape à enjeu.
          </p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
            <Link href="/login" className="btn btn-gold">Démarrer une demande</Link>
            <Link href="/vitrine/collection" className="btn">Voir la collection</Link>
          </div>
        </section>

        <section className="stack">
          <div className="between">
            <h2>La collection</h2>
            <Link href="/vitrine/collection" className="small">Tout voir →</Link>
          </div>
          {publications.length === 0 ? (
            <p className="muted">Aucune pièce publiée pour le moment.</p>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {publications.slice(0, 6).map((p) => (
                <article key={p.id} className="card">
                  {p.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photos[0]} alt={p.titre ?? ''} style={{ width: '100%', borderRadius: 8, marginBottom: 8 }} />
                  ) : null}
                  <h3 style={{ margin: 0 }}>{p.titre ?? 'Pièce de collection'}</h3>
                  <p className="muted small">{(p.description ?? '').slice(0, 120)}</p>
                  <span className="small mono">{p.dossierReference}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="container muted small">
        <Link href="/mentions">Mentions légales &amp; CGV</Link> · Galerie Apanage — France &amp; UE
      </footer>
    </>
  );
}
