// ============================================================================
// Galerie Apanage — /api/health : état des services (mock/réel) + data source.
// Utile pour vérifier qu'on tourne « zéro clé » ou pour diagnostiquer un branchement.
// ============================================================================

import { NextResponse } from 'next/server';
import { getData } from '@/data';
import { servicesStatus } from '@/services';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    dataSource: getData().mode,
    supabase: env.supabase.configured ? 'configuré' : 'mock (mémoire)',
    forceMock: env.forceMock,
    services: servicesStatus(),
    horodatage: new Date().toISOString(),
  });
}
