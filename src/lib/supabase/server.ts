// ============================================================================
// Galerie Apanage — Client Supabase CÔTÉ SERVEUR (Server Components / Actions)
// ----------------------------------------------------------------------------
// Lit/écrit les cookies de session (magic-link) ; soumis à la RLS via la session
// de l'utilisateur. À utiliser dans les Server Components, Server Actions et
// Route Handlers. En mode mock (Supabase non configuré) il n'est jamais appelé.
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import type { Database } from './database.types';

export async function createClient() {
  if (!env.supabase.configured) {
    throw new Error('Supabase non configuré : utilisez la couche data (mock store) en mode sans clé.');
  }
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabase.url!, env.supabase.anonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component : ignoré (le middleware rafraîchit la session).
        }
      },
    },
  });
}
