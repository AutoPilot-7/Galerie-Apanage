'use server';

// ============================================================================
// Galerie Apanage — Auth magic-link (sans mot de passe), cf. specs §5/§6
// ----------------------------------------------------------------------------
// Supabase Auth envoie l'OTP par e-mail. En mode mock (sans clé) cette action
// n'est pas utilisée : la page Login propose un accès direct dev.
// ============================================================================

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/** Détecte l'origine publique depuis les en-têtes de la requête entrante.
 *  Évite de dépendre de NEXT_PUBLIC_SITE_URL qui peut valoir localhost. */
async function getSiteOrigin(): Promise<string> {
  const hdrs = await headers();
  // Vercel injecte x-forwarded-host + x-forwarded-proto en production.
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

export async function envoyerMagicLinkAction(fd: FormData) {
  const email = String(fd.get('email') ?? '').trim();
  if (!email) redirect('/login?error=email');
  const supabase = await createClient();
  const origin = await getSiteOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    // On vise la racine du site (autorisée d'office car = Site URL Supabase).
    // Le middleware réachemine le ?code= vers /auth/callback pour l'échange.
    email,
    options: { emailRedirectTo: origin },
  });
  redirect(error ? `/login?error=${encodeURIComponent(error.message)}` : '/login?sent=1');
}
