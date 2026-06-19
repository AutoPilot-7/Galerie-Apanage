// ============================================================================
// Galerie Apanage — COCKPIT / Galerie. Publier / dépublier les propositions.
// ============================================================================

import { getData } from '@/data';
import { setPublicationAction } from '@/app/actions';
import { EmptyState } from '@/components/ui';
import { SubmitButton } from '@/components/forms';

export const dynamic = 'force-dynamic';

export default async function CockpitGaleriePage() {
  const pubs = await getData().listPublications();

  return (
    <div className="stack">
      <div className="cockpit-page-header">
        <h1 className="cockpit-page-title">Galerie</h1>
        <p className="cockpit-page-sub">Publier · Dépublier les propositions</p>
      </div>

      {pubs.length === 0 ? (
        <EmptyState>Aucune proposition publiée.</EmptyState>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Dossier</th>
                <th>Statut publication</th>
                <th className="right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pubs.map((p) => (
                <tr key={p.id}>
                  <td>{p.titre ?? 'Pièce de collection'}</td>
                  <td className="mono small">{p.dossierReference}</td>
                  <td>
                    <span className="badge">{p.publication.statut}</span>
                  </td>
                  <td className="right">
                    <form action={setPublicationAction}>
                      <input type="hidden" name="propositionId" value={p.id} />
                      <input type="hidden" name="dossierId" value={p.dossierId} />
                      <input type="hidden" name="publiee" value="0" />
                      <SubmitButton confirm="Dépublier cette proposition ?">Dépublier</SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
