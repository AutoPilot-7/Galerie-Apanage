// ============================================================================
// Galerie Apanage — COCKPIT / Bibliothèque DA. Édition des trames (versionnées).
// Référentiel central qui alimente toutes les générations IA.
// ============================================================================

import { getData } from '@/data';
import { mettreAJourTrameAction } from '@/app/actions';
import { EmptyState } from '@/components/ui';
import { SubmitButton } from '@/components/forms';

export const dynamic = 'force-dynamic';

export default async function BibliothequePage() {
  const trames = await getData().listTrames();

  return (
    <main className="container stack">
      <h1 style={{ margin: 0 }}>Bibliothèque DA</h1>
      <p className="muted">
        Référentiel central des trames/prompts qui alimente toutes les générations IA. Versionnées.
      </p>

      {trames.length === 0 ? (
        <EmptyState>Aucune trame disponible.</EmptyState>
      ) : (
        <div className="stack">
          {trames.map((t) => (
            <div key={t.id} className="card stack">
              <div className="between">
                <h3 style={{ margin: 0 }}>{t.nom}</h3>
                <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <span className="badge">{t.type}</span>
                  <span className="muted small">v{t.version}</span>
                </div>
              </div>
              <form action={mettreAJourTrameAction} className="stack">
                <input type="hidden" name="trameId" value={t.id} />
                <textarea name="contenu" className="textarea" defaultValue={t.contenu} />
                <SubmitButton variant="primary">Enregistrer la trame</SubmitButton>
              </form>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
