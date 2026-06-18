// ============================================================================
// Galerie Apanage — Cockpit commissaire : shell + navigation (5 entrées, cf. §4)
// Pipeline · Galerie · Pilotage · Bibliothèque DA · Réglages.
// ============================================================================

import Link from 'next/link';

export default function CockpitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <div className="row" style={{ alignItems: 'center', gap: 20 }}>
          <Link href="/cockpit" className="brand">Galerie <span>Apanage</span> · Cockpit</Link>
          <nav className="nav">
            <Link href="/cockpit">Pipeline</Link>
            <Link href="/cockpit/galerie">Galerie</Link>
            <Link href="/cockpit/pilotage">Pilotage</Link>
            <Link href="/cockpit/bibliotheque">Bibliothèque DA</Link>
            <Link href="/cockpit/reglages">Réglages</Link>
          </nav>
        </div>
        <Link href="/" className="small muted">Vitrine ↗</Link>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
