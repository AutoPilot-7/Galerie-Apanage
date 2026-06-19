// ============================================================================
// Galerie Apanage — PIPELINE (Kanban des Dossiers par statut), écran d'accueil
// du Cockpit (cf. §4.1). 1 colonne = 1 statut ; 1 carte = 1 Dossier.
// Déplacement = changement de statut, avec garde-fou (transitions autorisées).
// ============================================================================

import Link from 'next/link';
import { getData } from '@/data';
import { DOSSIER_STATUTS } from '@/domain/types';
import { STATUT_META, transitionsDepuis } from '@/domain/statut';
import { Money, StatutBadge } from '@/components/ui';
import { SubmitButton } from '@/components/forms';
import { changerStatutAction, creerDossierAction } from '@/app/actions';

export const dynamic = 'force-dynamic';

function ageJours(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export default async function PipelinePage() {
  const [dossiers, clients] = await Promise.all([getData().listDossiers(), getData().listClients()]);

  return (
    <div className="stack">
      <div className="cockpit-page-header between" style={{ alignItems: 'flex-end' }}>
        <div>
          <h1 className="cockpit-page-title">Pipeline</h1>
          <p className="cockpit-page-sub">Kanban des dossiers · tunnel de statuts</p>
        </div>
        <span className="muted small">{dossiers.length} dossiers</span>
      </div>

      {/* Création d'un dossier (objet pivot) */}
      <details className="card">
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>+ Nouveau dossier d’acquisition</summary>
        <form action={creerDossierAction} className="row" style={{ marginTop: 12, alignItems: 'flex-end' }}>
          <div style={{ minWidth: 200 }}>
            <label htmlFor="clientId">Client</label>
            <select id="clientId" name="clientId" className="select">
              <option value="">— Nouveau client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nom} ({c.email})</option>
              ))}
            </select>
          </div>
          <div><label>Nom (si nouveau)</label><input name="clientNom" className="input" placeholder="M. Dupont" /></div>
          <div><label>E-mail (si nouveau)</label><input name="clientEmail" className="input" placeholder="client@ex.fr" /></div>
          <div><label>Marque</label><input name="vehiculeMarque" className="input" placeholder="Porsche" /></div>
          <div><label>Modèle</label><input name="vehiculeModele" className="input" placeholder="911 (993)" /></div>
          <div><label>Budget estimé</label><input name="montantEstime" className="input" inputMode="numeric" placeholder="120000" /></div>
          <SubmitButton variant="primary">Créer</SubmitButton>
        </form>
      </details>

      {/* Kanban */}
      <div className="kanban-wrap">
        {DOSSIER_STATUTS.map((statut) => {
          const colonne = dossiers.filter((d) => d.statut === statut);
          return (
            <section key={statut} className="kanban-col">
              <div className="kanban-header between">
                <StatutBadge statut={statut} />
                <span className="kanban-count muted small">{colonne.length}</span>
              </div>
              <p className="muted small" style={{ margin: 0 }}>{STATUT_META[statut].description}</p>

              {colonne.map((d) => {
                const sorties = transitionsDepuis(d.statut).filter((t) => t.to !== d.statut);
                return (
                  <article key={d.id} className="card stack" style={{ gap: 8 }}>
                    <div className="between">
                      <Link href={`/cockpit/dossiers/${d.id}`} style={{ fontWeight: 600 }}>{d.reference}</Link>
                      <span className="small muted">{ageJours(d.createdAt)} j</span>
                    </div>
                    <div className="small">{d.client.nom}</div>
                    <div className="small muted">{d.vehiculeMarque} {d.vehiculeModele}</div>
                    <div className="small">
                      <Money value={d.montantEstime} /> · marge <Money value={d.margeEstimee} />
                    </div>
                    {d.prochaineAction && <div className="small" style={{ color: 'var(--accent)' }}>→ {d.prochaineAction}</div>}

                    {sorties.length > 0 && (
                      <form action={changerStatutAction} className="row" style={{ gap: 6, alignItems: 'center' }}>
                        <input type="hidden" name="dossierId" value={d.id} />
                        <select name="to" className="select" style={{ fontSize: 12, padding: '4px 6px' }}>
                          {sorties.map((t) => (
                            <option key={t.to} value={t.to}>{STATUT_META[t.to].label}{t.hitl ? ' ✋' : ''}</option>
                          ))}
                        </select>
                        <SubmitButton>Déplacer</SubmitButton>
                      </form>
                    )}
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
      <p className="muted small">✋ = transition à enjeu (validation requise). Le glisser-déposer viendra plus tard ; ici, déplacement par menu (même garde-fou).</p>
    </div>
  );
}
