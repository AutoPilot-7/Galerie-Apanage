// ============================================================================
// Galerie Apanage — Client Supabase ADMIN (service_role) — SERVEUR UNIQUEMENT
// ----------------------------------------------------------------------------
// ⚠ BYPASS RLS. Réservé aux opérations privilégiées qui DOIVENT contourner la
// RLS de façon contrôlée : écritures du module financier / SÉQUESTRE (les
// policies SQL n'autorisent AUCUNE écriture finance via session navigateur —
// cf. migration 06), décaissements, jobs serveur, provisioning.
//
// NE JAMAIS importer ce module dans du code client. La clé service_role n'est
// lue que côté serveur. Si elle est absente → renvoie null (mode mock).
// ============================================================================

import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import type { Database } from './database.types';

/** Retourne un client service_role, ou null si non configuré (mode mock). */
export function createAdminClient() {
  if (!env.supabase.configured || !env.supabase.hasServiceRole) return null;
  return createSupabaseClient<Database>(env.supabase.url!, env.supabase.serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
