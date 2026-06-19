// ============================================================================
// Galerie Apanage — Login (magic-link). Connexion par lien e-mail sans mot de
// passe (Portail client + Cockpit). En mode mock : accès direct dev.
// ============================================================================

import Link from ‘next/link’;
import { env } from ‘@/lib/env’;
import { SubmitButton } from ‘@/components/forms’;
import { connexionDirecteAction } from ‘./actions’;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string; next?: string }> }) {
  const sp = await searchParams;
  const configured = env.supabase.configured;

  return (
    <main className="container" style={{ maxWidth: 480 }}>
      <Link href="/" className="small">← Retour à la vitrine</Link>
      <div className="card stack" style={{ marginTop: 12 }}>
        <h1 style={{ margin: 0 }}>Accès à votre espace</h1>

        {configured ? (
          <div className="stack">
            <form action={connexionDirecteAction}>
              <input type="hidden" name="role" value="commissaire" />
              <SubmitButton variant="primary">Entrer comme commissaire</SubmitButton>
            </form>
            <form action={connexionDirecteAction}>
              <input type="hidden" name="role" value="client" />
              <input type="hidden" name="email" value="client@galerie-apanage.fr" />
              <SubmitButton>Entrer comme client</SubmitButton>
            </form>
            {sp.error && <p className="small" style={{ color: ‘var(--danger)’ }}>Erreur : {sp.error}</p>}
          </div>
        ) : (
          <div className="stack">
            <div className="hitl">
              <strong>Mode mock (sans clé)</strong> — Supabase non configuré. Accès direct :
            </div>
            <div className="row">
              <Link href="/cockpit" className="btn btn-primary">Entrer comme commissaire</Link>
              <Link href="/portail" className="btn">Entrer comme client</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
