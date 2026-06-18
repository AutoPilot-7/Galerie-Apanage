// ============================================================================
// Galerie Apanage — Portail client : shell. Vue filtrée du Dossier (4 blocs).
// Connexion par lien e-mail sans mot de passe (RLS scope les données au client).
// ============================================================================

import Link from 'next/link';

export default function PortailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <Link href="/portail" className="brand">Galerie <span>Apanage</span> · Mon espace</Link>
        <div className="row small">
          <Link href="/vitrine/collection" className="muted">La collection ↗</Link>
          <Link href="/login" className="muted">Se déconnecter</Link>
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
