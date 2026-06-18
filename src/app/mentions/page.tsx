// ============================================================================
// Galerie Apanage — Mentions légales & CGV (public, statique).
// Placeholders RGPD / légal « À compléter ». À faire valider par un pro.
// ============================================================================

import Link from 'next/link';

export default function MentionsPage() {
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
        <h1 style={{ margin: 0 }}>Mentions légales &amp; CGV</h1>

        <div className="hitl">
          <strong>⚠ À faire valider par un professionnel</strong> — les points relatifs aux fonds clients
          (séquestre), au régime de TVA (sur marge / import) et à la douane doivent être revus par un avocat et un
          expert-comptable avant mise en ligne. Le texte ci-dessous n’est constitué que de placeholders.
        </div>

        <section className="card stack">
          <h2 style={{ margin: 0 }}>Éditeur du site</h2>
          <ul className="stack" style={{ paddingLeft: 18 }}>
            <li>Raison sociale : <span className="muted">À compléter</span></li>
            <li>Forme juridique &amp; capital social : <span className="muted">À compléter</span></li>
            <li>Siège social : <span className="muted">À compléter</span></li>
            <li>RCS / SIREN : <span className="muted">À compléter</span></li>
            <li>N° TVA intracommunautaire : <span className="muted">À compléter</span></li>
            <li>Directeur de la publication : <span className="muted">À compléter</span></li>
          </ul>
        </section>

        <section className="card stack">
          <h2 style={{ margin: 0 }}>Hébergeur</h2>
          <ul className="stack" style={{ paddingLeft: 18 }}>
            <li>Adresse : <span className="muted">À compléter</span></li>
            <li>Contact : <span className="muted">À compléter</span></li>
          </ul>
        </section>

        <section className="card stack">
          <h2 style={{ margin: 0 }}>Conditions générales de vente (CGV)</h2>
          <ul className="stack" style={{ paddingLeft: 18 }}>
            <li>Prix, acompte (30 %) &amp; solde (70 %) : <span className="muted">À compléter</span></li>
            <li>Délais d’acquisition et de livraison : <span className="muted">À compléter</span></li>
            <li>Droit de rétractation &amp; garanties : <span className="muted">À compléter</span></li>
            <li>Droit applicable &amp; règlement des litiges : <span className="muted">À compléter</span></li>
          </ul>
        </section>

        <section className="card stack">
          <h2 style={{ margin: 0 }}>Données personnelles (RGPD)</h2>
          <ul className="stack" style={{ paddingLeft: 18 }}>
            <li>Responsable de traitement : <span className="muted">À compléter</span></li>
            <li>Contact DPO : <span className="muted">À compléter</span></li>
            <li>Cookies &amp; traceurs : <span className="muted">À compléter</span></li>
            <li>Durées de conservation : <span className="muted">À compléter</span></li>
          </ul>
        </section>
      </main>

      <footer className="container muted small">
        Galerie Apanage — France &amp; UE
      </footer>
    </>
  );
}
