// ============================================================================
// Galerie Apanage — Portail client : « Mes dossiers ».
// En mode réel, la RLS scope automatiquement les dossiers au client connecté.
// En mode mock (sans auth), un sélecteur de client permet de démontrer la vue.
// ============================================================================

import Link from 'next/link';
import { getData } from '@/data';
import { env } from '@/lib/env';
import { FriseStatut, StatutBadge } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function PortailPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const sp = await searchParams;
  const [dossiers, clients] = await Promise.all([getData().listDossiers(), getData().listClients()]);

  // Mock : on filtre par client choisi (défaut : premier). Réel : déjà filtré par RLS.
  const mock = !env.supabase.configured;
  const clientId = sp.client ?? (mock ? clients[0]?.id : undefined);
  const visibles = mock && clientId ? dossiers.filter((d) => d.clientId === clientId) : dossiers;

  return (
    <div className="stack">
      <div className="between" style={{ alignItems: 'flex-end', marginBottom: 'var(--space-2)' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-45)', margin: '0 0 var(--space-1)' }}>Espace client</p>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 'var(--text-3xl)', color: 'var(--color-encre)', letterSpacing: '0.02em' }}>Mes dossiers</h1>
        </div>
        {mock && (
          <form className="row small" style={{ alignItems: 'center', gap: 6 }}>
            <span className="muted">Démo — vue client :</span>
            <select name="client" className="select" defaultValue={clientId} style={{ width: 220 }}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <button className="btn" type="submit">Voir</button>
          </form>
        )}
      </div>

      {visibles.length === 0 ? (
        <p className="muted">Aucun dossier pour le moment. Votre commissaire ouvrira votre dossier après votre prise de contact.</p>
      ) : (
        <div className="stack">
          {visibles.map((d) => (
            <Link key={d.id} href={`/portail/dossiers/${d.id}`} className="card portail-dossier-card">
              <div className="between portail-dossier-head">
                <div>
                  <p className="portail-dossier-ref">{d.reference}</p>
                  <span className="portail-dossier-title">{d.vehiculeMarque} {d.vehiculeModele}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <StatutBadge statut={d.statut} />
                  <span className="portail-dossier-arrow">→</span>
                </div>
              </div>
              <FriseStatut statut={d.statut} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
