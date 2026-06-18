// ============================================================================
// Galerie Apanage — VITRINE / Processus & prix (public, ~statique).
// Explique le tunnel (7 étapes), le principe de prix et le human-in-the-loop.
// ============================================================================

import Link from 'next/link';
import { STATUT_META, STATUTS_TUNNEL } from '@/domain/statut';

export default function ProcessusPage() {
  return (
    <>
      <header className="topbar">
        <div className="brand">Galerie <span>Apanage</span></div>
        <nav className="nav">
          <Link href="/">← Vitrine</Link>
          <Link href="/vitrine/collection">La collection</Link>
          <Link href="/login" className="btn btn-primary">Accès client / commissaire</Link>
        </nav>
      </header>

      <main className="container stack">
        <section className="card stack">
          <h1 style={{ margin: 0 }}>Le processus, étape par étape</h1>
          <p className="muted">
            Chaque demande devient un <strong>Dossier d’acquisition</strong> qui progresse dans un tunnel à 7 étapes.
            L’intelligence artificielle accélère la production ; le <strong>commissaire</strong> valide chaque étape à
            enjeu (human-in-the-loop).
          </p>
          <ol className="stack" style={{ paddingLeft: 18 }}>
            {STATUTS_TUNNEL.map((s) => (
              <li key={s}>
                <strong>{STATUT_META[s].label}</strong>
                <span className="muted"> — {STATUT_META[s].description}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="card stack">
          <h2 style={{ margin: 0 }}>Le principe de prix</h2>
          <ul className="stack" style={{ paddingLeft: 18 }}>
            <li>
              <strong>Honoraires / commission</strong> — la galerie est rémunérée par des honoraires (commission
              d’acquisition) ajoutés au coût d’achat du véhicule.
            </li>
            <li>
              <strong>Acompte 30 % / solde 70 %</strong> — à la validation du devis, un acompte de 30 % est appelé
              (placé sous séquestre), le solde de 70 % étant réglé avant la livraison.
            </li>
            <li>
              <strong>TVA sur marge</strong> — pour les véhicules d’occasion éligibles, la TVA s’applique sur la marge
              et non sur le prix total.
            </li>
            <li>
              <strong>Volet import refacturé</strong> — lorsque le véhicule est importé, les frais de transport et de
              douane sont refacturés au client au coût réel, ligne par ligne dans le devis.
            </li>
          </ul>
          <p className="muted small">
            Le détail chiffré figure dans le devis du dossier et dans nos conditions générales de vente.
          </p>
        </section>

        <section className="card stack">
          <h2 style={{ margin: 0 }}>Human-in-the-loop : le commissaire valide</h2>
          <p className="muted">
            Aucune étape à enjeu n’est automatique. Le commissaire valide explicitement le cahier des charges, la
            sélection des propositions, le lancement de l’acquisition, le devis et la remise finale. Le client, lui,
            valide la proposition de son choix depuis son portail. Chaque validation est tracée (journal d’audit).
          </p>
        </section>
      </main>

      <footer className="container muted small">
        <Link href="/mentions">Mentions légales &amp; CGV</Link> · Galerie Apanage — France &amp; UE
      </footer>
    </>
  );
}
