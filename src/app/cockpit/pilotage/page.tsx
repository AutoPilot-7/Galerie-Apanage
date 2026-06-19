// ============================================================================
// Galerie Apanage — COCKPIT / Pilotage. Module financier + KPI.
// Lecture seule : les écritures séquestre passent par le service_role (RLS).
// ============================================================================

import { getData } from '@/data';
import { DOSSIER_STATUTS } from '@/domain/types';
import type { DossierStatut } from '@/domain/types';
import { EmptyState, Money, StatutBadge } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function PilotagePage() {
  const k = await getData().kpis();
  const comptes = await getData().listComptes();
  const mvts = await getData().listMouvements();

  return (
    <div className="stack">
      <div className="cockpit-page-header">
        <h1 className="cockpit-page-title">Pilotage</h1>
        <p className="cockpit-page-sub">Finance · KPI · Mouvements</p>
      </div>

      {/* Bloc KPI */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="card kpi-card">
          <p className="kpi-label">Total dossiers</p>
          <p className="kpi-value">{k.totalDossiers}</p>
        </div>
        <div className="card kpi-card">
          <p className="kpi-label">Encours estimé</p>
          <p className="kpi-value"><Money value={k.encoursEstime} /></p>
        </div>
        <div className="card kpi-card">
          <p className="kpi-label">Marge simulée totale</p>
          <p className="kpi-value"><Money value={k.margeSimuleeTotale} /></p>
        </div>
        <div className="card kpi-card">
          <p className="kpi-label">Marge réelle totale</p>
          <p className="kpi-value"><Money value={k.margeReelleTotale} /></p>
        </div>
      </div>

      {/* Dossiers par statut */}
      <section className="card stack">
        <h2 style={{ margin: 0 }}>Dossiers par statut</h2>
        <div className="row">
          {DOSSIER_STATUTS.map((s: DossierStatut) => (
            <div key={s} className="row" style={{ gap: 6, alignItems: 'center' }}>
              <StatutBadge statut={s} />
              <strong>{k.parStatut[s]}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* Comptes */}
      <section className="card stack">
        <h2 style={{ margin: 0 }}>Comptes</h2>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Libellé</th>
              <th className="right">Solde</th>
            </tr>
          </thead>
          <tbody>
            {comptes.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="mono small">{c.type}</span>
                  {c.type === 'SEQUESTRE' && (
                    <div className="small" style={{ color: 'var(--gold)' }}>
                      ⚠ fonds clients cloisonnés, jamais mélangés à l’exploitation
                    </div>
                  )}
                </td>
                <td>{c.libelle}</td>
                <td className="right"><Money value={c.solde} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Échéances à venir */}
      <section className="card stack">
        <h2 style={{ margin: 0 }}>Échéances à venir</h2>
        {k.echeancesAVenir.length === 0 ? (
          <EmptyState>Aucune échéance à venir.</EmptyState>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th className="right">Montant</th>
                <th>Échéance</th>
              </tr>
            </thead>
            <tbody>
              {k.echeancesAVenir.map((e) => (
                <tr key={e.id}>
                  <td>{e.type}</td>
                  <td className="right"><Money value={e.montant} /></td>
                  <td className="muted">{e.dateEcheance ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Mouvements (rapprochement bancaire) */}
      <section className="card stack">
        <h2 style={{ margin: 0 }}>Mouvements (rapprochement bancaire)</h2>
        {mvts.length === 0 ? (
          <EmptyState>Aucun mouvement enregistré.</EmptyState>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Horodatage</th>
                <th>Libellé</th>
                <th className="right">Montant</th>
                <th>Sens</th>
                <th>Rapproché</th>
              </tr>
            </thead>
            <tbody>
              {mvts.map((m) => (
                <tr key={m.id}>
                  <td className="muted small">{m.horodatage}</td>
                  <td>{m.libelle ?? '—'}</td>
                  <td className="right"><Money value={m.montant} /></td>
                  <td>{m.sens}</td>
                  <td>{m.rapproche ? 'Oui' : 'Non'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="muted small">Écritures séquestre via service_role (cloisonnement RLS).</p>
    </div>
  );
}
