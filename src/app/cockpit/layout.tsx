import Link from 'next/link';
import { SubmitButton } from '@/components/forms';
import { seDeconnecterAction } from '@/app/auth/actions';
import { LogoMark } from '@/components/ui';
import { NavLinks } from '@/components/nav';

export default function CockpitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <div className="row" style={{ alignItems: 'center', gap: 20 }}>
          <Link href="/cockpit" className="brand">
            <LogoMark size={18} />
            Galerie <span>Apanage</span> · Cockpit
          </Link>
          <nav className="nav">
            <NavLinks items={[
              { href: '/cockpit', label: 'Pipeline', exact: true },
              { href: '/cockpit/galerie', label: 'Galerie' },
              { href: '/cockpit/pilotage', label: 'Pilotage' },
              { href: '/cockpit/bibliotheque', label: 'Bibliothèque DA' },
              { href: '/cockpit/reglages', label: 'Réglages' },
            ]} />
          </nav>
        </div>
        <div className="row" style={{ alignItems: 'center', gap: 12 }}>
          <Link href="/" className="small muted">Vitrine ↗</Link>
          <form action={seDeconnecterAction}>
            <SubmitButton>Déconnexion</SubmitButton>
          </form>
        </div>
      </header>
      <main className="container" style={{ paddingTop: 'var(--space-10)', paddingBottom: 'var(--space-20)' }}>
        {children}
      </main>
    </>
  );
}
