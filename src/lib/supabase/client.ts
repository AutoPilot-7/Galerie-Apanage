// ============================================================================
// Galerie Apanage — Client Supabase CÔTÉ NAVIGATEUR (composants client)
// ----------------------------------------------------------------------------
// Utilise la anon key (publique) + RLS. N'est instancié que si Supabase est
// configuré ; sinon l'app s'appuie sur le mock store mémoire (cf. src/data).
// ============================================================================

'use client';

import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import type { Database } from './database.types';

export function createClient() {
  if (!env.supabase.configured) {
    throw new Error(
      'Supabase non configuré : NEXT_PUBLIC_SUPABASE_URL / ANON_KEY absents. ' +
        'En mode mock, n’appelez pas createClient() — utilisez la couche data (src/data).',
    );
  }
  return createBrowserClient<Database>(env.supabase.url!, env.supabase.anonKey!);
}
