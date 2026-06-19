// ============================================================================
// Galerie Apanage — Portail client : vue d'UN dossier, réduite à 4 blocs (§5).
// 1) Suivi  2) Propositions (+ ✋ validation client)  3) Messagerie  4) Paiement & documents
// ============================================================================

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getData } from '@/data';
import { FriseStatut, Money, StatutBadge, EmptyState, SectionTitle } from '@/components/ui';
import { SubmitButton } from '@/components/forms';
import { envoyerMessageAction, validerPropositionClientAction } from '@/app/actions';

export const dynamic = 'force-dynamic';
const dt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('fr-FR') : '—');

export default async function PortailDossier({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getData().getDossier(id);
  if (!d) notFound();

  const publiees = d.propositions.filter((p) => d.publications.some((x) => x.propositionId === p.id && x.statut === 'PUBLIEE'));
  const devisValide = d.devis.find((dv) => dv.statut === 'VALIDE');

  return (
    <div className="stack">
      <Link href="/portail" className="small">← Mes dossiers</Link>

      {/* 1. SUIVI */}
      <section className="card stack">
        <div className="between">
          <h1 style={{ margin: 0 }}>{d.vehiculeMarque} {d.vehiculeModele}</h1>
          <StatutBadge statut={d.statut} />
        </div>
        <FriseStatut statut={d.statut} />
        {d.prochaineAction && <p className="muted small">Prochaine étape : {d.prochaineAction}</p>}
        <span className="small mono muted">{d.reference}</span>
      </section>

      {/* 2. PROPOSITIONS */}
      <section className="card stack">
        <SectionTitle title="Propositions" hint="les pièces sélectionnées pour vous" />
        {publiees.length === 0 ? <EmptyState>Aucune proposition publiée pour l’instant.</EmptyState> : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))' }}>
            {publiees.map((p) => (
              <article key={p.id} className="card stack">
                {p.photos[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photos[0]} alt={p.titre ?? ''} style={{ width: '100%', borderRadius: 8 }} />
                )}
                <strong>{p.titre}</strong>
                <p className="small muted">{p.description}</p>
                {d.statut === 'PROPOSITIONS' && (
                  <form action={validerPropositionClientAction}>
                    <input type="hidden" name="dossierId" value={d.id} />
                    <input type="hidden" name="propositionId" value={p.id} />
                    <SubmitButton variant="primary" confirm="Valider cette proposition ? Votre commissaire lancera l’acquisition.">✋ Valider la proposition</SubmitButton>
                  </form>
                )}
              </article>
            ))}
          </div>
        )}
        {d.statut === 'VALIDATION' && <div className="hitl">Proposition validée ✓ Votre commissaire prépare l’acquisition.</div>}
      </section>

      {/* 3. MESSAGERIE */}
      <section className="card stack">
        <SectionTitle title="Messagerie" hint="échangez avec votre commissaire" />
        <div className="stack" style={{ gap: 6 }}>
          {d.messages.length === 0 ? <EmptyState>Aucun message.</EmptyState> : d.messages.map((m) => (
            <div key={m.id} className={`msg-bubble ${m.auteur === 'CLIENT' ? 'msg-bubble-self' : 'msg-bubble-other'}`}>
              <span className="msg-meta">{m.auteur === 'CLIENT' ? 'Vous' : 'Commissaire'} · {dt(m.createdAt)}</span>
              <span>{m.contenu}</span>
            </div>
          ))}
        </div>
        <form action={envoyerMessageAction} className="row" style={{ gap: 6 }}>
          <input type="hidden" name="dossierId" value={d.id} />
          <input type="hidden" name="auteur" value="CLIENT" />
          <input name="contenu" className="input" placeholder="Votre message…" style={{ flex: 1 }} required />
          <SubmitButton variant="primary">Envoyer</SubmitButton>
        </form>
      </section>

      {/* 4. PAIEMENT & DOCUMENTS */}
      <section className="card stack">
        <SectionTitle title="Paiement & documents" hint="échéancier, factures, provenance, certificats" />
        {devisValide ? (
          <div className="small">Devis validé — total <Money value={devisValide.montantTotal} /> ({devisValide.tvaRegime})</div>
        ) : <EmptyState>Le devis vous sera transmis après validation de votre proposition.</EmptyState>}

        {d.echeances.length > 0 && (
          <table>
            <thead><tr><th>Échéance</th><th>Montant</th><th>Statut</th></tr></thead>
            <tbody>{d.echeances.map((e) => (<tr key={e.id}><td><span className="badge">{e.type}</span></td><td><Money value={e.montant} /></td><td>{e.dateReelle ? '✓ réglée' : 'à régler'}</td></tr>))}</tbody>
          </table>
        )}

        <SectionTitle title="Mes documents" />
        {d.documents.length === 0 ? <EmptyState>Aucun document disponible.</EmptyState> : (
          <ul className="small">{d.documents.map((doc) => (<li key={doc.id}><span className="badge">{doc.type}</span> — <span className="mono">{doc.fichierUrl}</span></li>))}</ul>
        )}
      </section>
    </div>
  );
}
