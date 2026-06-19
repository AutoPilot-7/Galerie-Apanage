import Link from 'next/link';
import { SubmitButton } from '@/components/forms';
import { seDeconnecterAction } from '@/app/auth/actions';

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
        <div className="row" style={{ alignItems: 'center', gap: 12 }}>
          <Link href="/" className="small muted">Vitrine ↗</Link>
          <form action={seDeconnecterAction}>
            <SubmitButton>Déconnexion</SubmitButton>
          </form>
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
