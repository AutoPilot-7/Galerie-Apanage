// ============================================================================
// Galerie Apanage — COCKPIT / Réglages. Accès, sources de scrap (whitelist),
// modèles/connecteurs IA. Lecture seule (paramètres, sources, utilisateurs).
// ============================================================================

import { getData } from '@/data';
import { EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ReglagesPage() {
  const params = await getData().listParametres();
  const sources = await getData().listSources();
  const users = await getData().listUsers();

  return (
    <main className="container stack">
      <h1 style={{ margin: 0 }}>Réglages</h1>
      <p className="muted">Réglages : accès, sources de scrap (whitelist), modèles/connecteurs IA.</p>

      {/* Paramètres */}
      <section className="card stack">
        <h2 style={{ margin: 0 }}>Paramètres</h2>
        <table>
          <thead>
            <tr>
              <th>Clé</th>
              <th>Valeur</th>
            </tr>
          </thead>
          <tbody>
            {params.map((p) => (
              <tr key={p.id}>
                <td>{p.cle}</td>
                <td><span className="mono">{JSON.stringify(p.valeur)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Sources de scrap autorisées (whitelist) */}
      <section className="card stack">
        <h2 style={{ margin: 0 }}>Sources de scrap autorisées (whitelist)</h2>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Domaine</th>
              <th>Actif</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id}>
                <td>{s.nom}</td>
                <td className="mono small">{s.domaine ?? '—'}</td>
                <td>{s.actif ? 'Oui' : 'Non'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Utilisateurs */}
      <section className="card stack">
        <h2 style={{ margin: 0 }}>Utilisateurs</h2>
        {users.length === 0 ? (
          <EmptyState>Les comptes commissaires sont créés au 1er magic-link.</EmptyState>
        ) : (
          <table>
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Nom</th>
                <th>Rôle</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.nom ?? '—'}</td>
                  <td><span className="badge">{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
