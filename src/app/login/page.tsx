// ============================================================================
// Galerie Apanage — Login (magic-link). Connexion par lien e-mail sans mot de
// passe (Portail client + Cockpit). En mode mock : accès direct dev.
// ============================================================================

import Link from 'next/link';
import { env } from '@/lib/env';
import { SubmitButton } from '@/components/forms';
import { envoyerMagicLinkAction } from './actions';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string; next?: string }> }) {
  const sp = await searchParams;
  const configured = env.supabase.configured;

  return (
    <main className="container" style={{ maxWidth: 480 }}>
      <Link href="/" className="small">← Retour à la vitrine</Link>
      <div className="card stack" style={{ marginTop: 12 }}>
        <h1 style={{ margin: 0 }}>Accès à votre espace</h1>
        <p className="muted small">Connexion par lien e-mail, sans mot de passe.</p>

        {configured ? (
          <form action={envoyerMagicLinkAction} className="stack">
            <div>
              <label htmlFor="email">Adresse e-mail</label>
              <input id="email" name="email" type="email" required className="input" placeholder="vous@exemple.fr" />
            </div>
            <SubmitButton variant="primary">Recevoir mon lien de connexion</SubmitButton>
            {sp.sent && <p className="hitl">Lien envoyé ✓ Consultez votre boîte e-mail.</p>}
            {sp.error && <p className="small" style={{ color: 'var(--danger)' }}>Erreur : {sp.error}</p>}
          </form>
        ) : (
          <div className="stack">
            <div className="hitl">
              <strong>Mode mock (sans clé)</strong> — l’authentification Supabase n’est pas configurée.
              Accès direct pour explorer le squelette :
            </div>
            <div className="row">
              <Link href="/cockpit" className="btn btn-primary">Entrer comme commissaire</Link>
              <Link href="/portail" className="btn">Entrer comme client</Link>
            </div>
            <p className="muted small">
              Pour activer le magic-link : renseignez <span className="mono">NEXT_PUBLIC_SUPABASE_URL</span> et{' '}
              <span className="mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
