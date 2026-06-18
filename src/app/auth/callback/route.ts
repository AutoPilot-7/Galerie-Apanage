// ============================================================================
// Galerie Apanage — Callback magic-link : échange le code contre une session.
// ============================================================================

import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/portail';

  if (code && env.supabase.configured) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=callback`);
}
