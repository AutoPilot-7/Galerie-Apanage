// ============================================================================
// Galerie Apanage — Callback magic-link : échange le code contre une session.
// ============================================================================

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Destination explicite (ex. lien profond protégé) : on la respecte telle quelle.
  const explicitNext = searchParams.get('next');

  if (code && env.supabase.configured) {
    const supabase = (await createClient()) as unknown as SupabaseClient<Database>;
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (explicitNext) return NextResponse.redirect(`${origin}${explicitNext}`);

      // Pas de destination forcée : on aiguille selon le rôle dans app_user.
      // Commissaire / Admin → Cockpit ; sinon → Portail client.
      let destination = '/portail';
      const userId = data.user?.id;
      if (userId) {
        const { data: profil } = await supabase
          .from('app_user')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (profil?.role === 'COMMISSAIRE' || profil?.role === 'ADMIN') {
          destination = '/cockpit';
        }
      }
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=callback`);
}
