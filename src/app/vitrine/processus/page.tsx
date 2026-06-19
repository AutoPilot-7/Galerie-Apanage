// ============================================================================
// Galerie Apanage — VITRINE / Processus & prix (public, ~statique).
// Les 7 actes de l'acquisition, avec indicateurs HITL et grille de prix.
// ============================================================================

import Link from 'next/link';
import { STATUT_META, STATUTS_TUNNEL, TRANSITIONS } from '@/domain/statut';
import { LogoMark } from '@/components/ui';

const hitlStatuts = new Set(TRANSITIONS.filter((t) => t.hitl).map((t) => t.from));

export default function ProcessusPage() {
  return (
    <>
      <header className="vitrine-topbar">
        <div className="brand">
          <LogoMark size={18} light />
          Galerie <span>Apanage</span>
        </div>
        <nav className="nav">
          <Link href="/">← Vitrine</Link>
          <Link href="/vitrine/collection">La collection</Link>
          <Link href="/login" className="btn btn-primary">Accès client</Link>
        </nav>
      </header>

      <div className="processus-banner">
        <p className="processus-eyebrow">Processus &amp; prix</p>
        <h1 className="processus-title">
          Les 7 actes<br />de l&apos;acquisition
        </h1>
        <p className="processus-subtitle">
          Chaque demande devient un <strong>dossier d&apos;acquisition</strong> qui progresse dans un tunnel structuré.
          L&apos;intelligence artificielle accélère la production ; le commissaire valide chaque étape à enjeu.
        </p>
      </div>

      <main className="container">

        {/* ── Tunnel des actes ─────────────────────────────────────────────── */}
        <div className="actes-wrap">
          <div className="actes-spine" aria-hidden="true" />
          {STATUTS_TUNNEL.map((s, i) => (
            <div key={s} className={`acte-row${hitlStatuts.has(s) ? ' hitl' : ''}`}>
              <div className="acte-marker">
                <div className="acte-bullet">{String(i + 1).padStart(2, '0')}</div>
              </div>
              <div className="acte-content">
                <p className="acte-eyebrow">Acte {String(i + 1).padStart(2, '0')}</p>
                <h3 className="acte-heading">{STATUT_META[s].label}</h3>
                <p className="acte-body-text">{STATUT_META[s].description}</p>
                {hitlStatuts.has(s) && (
                  <p className="acte-hitl-tag">✋ Validation humaine requise</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Principe de prix ─────────────────────────────────────────────── */}
        <section style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--hair)', paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
          <p className="section-subline" style={{ marginBottom: 'var(--space-4)' }}>Transparence</p>
          <h2 className="section-heading">Le principe de prix</h2>
          <div className="prix-grid" style={{ marginTop: 'var(--space-8)' }}>
            <div className="prix-item">
              <p className="prix-item-num">01 — Honoraires</p>
              <h4 className="prix-item-title">Commission d&apos;acquisition</h4>
              <p className="prix-item-desc">La galerie est rémunérée par des honoraires ajoutés au coût d&apos;achat du véhicule.</p>
            </div>
            <div className="prix-item">
              <p className="prix-item-num">02 — Échéancier</p>
              <h4 className="prix-item-title">Acompte 30 % · Solde 70 %</h4>
              <p className="prix-item-desc">À la validation du devis, un acompte de 30 % est appelé sous séquestre. Le solde est réglé avant la livraison.</p>
            </div>
            <div className="prix-item">
              <p className="prix-item-num">03 — Régime fiscal</p>
              <h4 className="prix-item-title">TVA sur marge</h4>
              <p className="prix-item-desc">Pour les véhicules d&apos;occasion éligibles, la TVA s&apos;applique sur la marge et non sur le prix total.</p>
            </div>
            <div className="prix-item">
              <p className="prix-item-num">04 — Import</p>
              <h4 className="prix-item-title">Frais refacturés au coût réel</h4>
              <p className="prix-item-desc">Transport, douane et homologation sont détaillés ligne par ligne dans le devis, sans majoration.</p>
            </div>
          </div>
        </section>

        {/* ── HITL ─────────────────────────────────────────────────────────── */}
        <section style={{ borderTop: '1px solid var(--hair)', paddingTop: 'var(--space-10)', paddingBottom: 'var(--space-16)' }}>
          <div className="hitl" style={{ maxWidth: 640 }}>
            <strong>Human-in-the-loop</strong> — Aucune étape à enjeu n&apos;est automatique.
            Le commissaire valide explicitement le cahier des charges, la sélection des propositions,
            le lancement de l&apos;acquisition, le devis et la remise finale.
            Chaque validation est tracée dans le journal d&apos;audit.
          </div>
        </section>

      </main>

      <footer className="vitrine-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LogoMark size={16} />
          <span>Galerie Apanage — Tokyo · Séoul</span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/">Vitrine</Link>
          <Link href="/mentions">Mentions légales</Link>
        </div>
      </footer>
    </>
  );
}
