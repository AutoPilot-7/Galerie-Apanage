import Link from 'next/link';
import { SubmitButton } from '@/components/forms';
import { seDeconnecterAction } from '@/app/auth/actions';

export default function PortailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <Link href="/portail" className="brand">Galerie <span>Apanage</span> · Mon espace</Link>
        <div className="row small" style={{ alignItems: 'center', gap: 12 }}>
          <Link href="/vitrine/collection" className="muted">La collection ↗</Link>
          <form action={seDeconnecterAction}>
            <SubmitButton>Déconnexion</SubmitButton>
          </form>
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
