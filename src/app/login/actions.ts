'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Email commissaire autorisé pour la connexion directe (sans e-mail).
const COMMISSAIRE_EMAIL = 'antoninrondeau3@gmail.com';

export async function connexionDirecteAction(fd: FormData) {
  const role = String(fd.get('role') ?? 'client');
  const email = role === 'commissaire' ? COMMISSAIRE_EMAIL : String(fd.get('email') ?? '').trim();
  if (!email) redirect('/login?error=email');

  const admin = createAdminClient();
  if (!admin) redirect('/login?error=config');

  // Génère un lien magique côté serveur (aucun e-mail envoyé).
  const { data, error: genError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (genError || !data?.properties?.hashed_token) {
    redirect(`/login?error=${encodeURIComponent(genError?.message ?? 'link')}`);
  }

  // Échange immédiat du token côté serveur → pose le cookie de session.
  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: 'email',
  });
  if (verifyError) redirect(`/login?error=${encodeURIComponent(verifyError.message)}`);

  redirect(role === 'commissaire' ? '/cockpit' : '/portail');
}
