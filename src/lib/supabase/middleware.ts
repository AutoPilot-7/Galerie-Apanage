// ============================================================================
// Galerie Apanage — Rafraîchissement de session (utilisé par middleware.ts)
// ----------------------------------------------------------------------------
// Rafraîchit le cookie de session magic-link à chaque requête et protège les
// espaces privés (Cockpit commissaire, Portail client). En mode mock (Supabase
// non configuré), laisse tout passer : le squelette reste navigable sans clé.
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import type { Database } from './database.types';

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  // Mode mock : pas d'auth, navigation libre (zéro clé requise).
  if (!env.supabase.configured) return response;

  const supabase = createServerClient<Database>(env.supabase.url!, env.supabase.anonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // IMPORTANT : ne rien exécuter entre createServerClient et getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const estProtege = path.startsWith('/cockpit') || path.startsWith('/portail');

  if (estProtege && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  return response;
}
