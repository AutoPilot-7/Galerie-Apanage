'use server';

// ============================================================================
// Galerie Apanage — Auth magic-link (sans mot de passe), cf. specs §5/§6
// ----------------------------------------------------------------------------
// Supabase Auth envoie l'OTP par e-mail. En mode mock (sans clé) cette action
// n'est pas utilisée : la page Login propose un accès direct dev.
// ============================================================================

import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export async function envoyerMagicLinkAction(fd: FormData) {
  const email = String(fd.get('email') ?? '').trim();
  if (!email) redirect('/login?error=email');
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    // On vise la racine du site (= Site URL, toujours autorisée par Supabase
    // sans avoir à gérer la liste blanche Redirect URLs). Le middleware
    // réachemine ensuite le `?code=` vers /auth/callback pour l'échange.
    email,
    options: { emailRedirectTo: env.site.url },
  });
  redirect(error ? `/login?error=${encodeURIComponent(error.message)}` : '/login?sent=1');
}
