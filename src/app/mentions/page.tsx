// ============================================================================
// Galerie Apanage — Mentions légales & CGV (public, statique).
// Placeholders RGPD / légal « À compléter ». À faire valider par un pro.
// ============================================================================

import Link from 'next/link';
import { LogoMark } from '@/components/ui';

export default function MentionsPage() {
  return (
    <>
      <header className="vitrine-topbar">
        <div className="brand">
          <LogoMark size={18} light />
          Galerie <span>Apanage</span>
        </div>
        <nav className="nav">
          <Link href="/">← Vitrine</Link>
          <Link href="/login" className="btn btn-primary">Accès client</Link>
        </nav>
      </header>

      <main className="container stack" style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-24)' }}>
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-45)', margin: '0 0 var(--space-2)' }}>Légal</p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 'var(--text-3xl)', color: 'var(--color-encre)', margin: 0 }}>Mentions légales &amp; CGV</h1>
        </div>

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

      <footer className="vitrine-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LogoMark size={16} />
          <span>Galerie Apanage — Tokyo · Séoul</span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/">Vitrine</Link>
          <Link href="/vitrine/processus">Processus &amp; prix</Link>
        </div>
      </footer>
    </>
  );
}
