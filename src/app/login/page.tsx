import Link from 'next/link';
import { env } from '@/lib/env';
import { SubmitButton } from '@/components/forms';
import { connexionDirecteAction } from './actions';
import { LogoMark } from '@/components/ui';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string; next?: string }> }) {
  const sp = await searchParams;
  const configured = env.supabase.configured;

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <LogoMark size={36} light />
        <p className="login-brand-name">Galerie <span>Apanage</span></p>
        <p className="login-brand-tagline">Le privilège de l&apos;exception</p>
      </div>

      <div className="login-card">
        <h1 className="login-title">Accès à votre espace</h1>

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
            {sp.error && (
              <p className="small" style={{ color: 'var(--danger)' }}>Erreur : {sp.error}</p>
            )}
          </div>
        ) : (
          <div className="stack">
            <div className="hitl">
              <strong>Mode mock (sans clé)</strong> — Supabase non configuré. Accès direct :
            </div>
            <div className="row">
              <Link href="/cockpit" className="btn btn-primary">Commissaire</Link>
              <Link href="/portail" className="btn">Client</Link>
            </div>
          </div>
        )}
      </div>

      <Link href="/" className="login-back">← Retour à la vitrine</Link>
    </div>
  );
}
