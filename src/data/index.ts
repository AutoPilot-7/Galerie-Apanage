// ============================================================================
// Galerie Apanage — Sélecteur de DataSource (cf. specs §3 & §10)
// ----------------------------------------------------------------------------
// Règle d'or : sans clé Supabase → MockDataSource (store mémoire seedé) ; dès
// que Supabase est configuré → SupabaseDataSource (Postgres + RLS). Les écrans
// et Server Actions n'utilisent QUE getData() : aucun couplage au backend.
// ============================================================================

import 'server-only';
import { env } from '@/lib/env';
import type { DataSource } from './types';
import { MockDataSource } from './mock-store';
import { SupabaseDataSource } from './supabase-source';

let mock: MockDataSource | null = null;

export function getData(): DataSource {
  if (env.supabase.configured) return new SupabaseDataSource();
  if (!mock) mock = new MockDataSource();
  return mock;
}

export type { DataSource } from './types';
export type { DossierAvecClient, DossierComplet, KpisPilotage, PropositionPubliee } from './types';
