// ============================================================================
// Galerie Apanage — Middleware racine (rafraîchit la session magic-link)
// ============================================================================

import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Exécute sur toutes les routes sauf assets statiques & images.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|placeholder|.*\\.(?:svg|png|jpg|jpeg|gif|webp|glb)$).*)'],
};
