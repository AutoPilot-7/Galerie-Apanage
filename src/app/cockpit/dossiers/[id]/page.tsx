// ============================================================================
// Galerie Apanage — FICHE DOSSIER (8 sections, cf. §4.2). Tout se pilote ici.
// L'IA propose / le commissaire valide (human-in-the-loop, gardes ✋ explicites).
// ============================================================================

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getData } from '@/data';
import { DocumentType } from '@/domain/types';
import { STATUT_META, transitionsDepuis } from '@/domain/statut';
import { EmptyState, FriseStatut, HitlNotice, Money, SectionTitle, StatutBadge } from '@/components/ui';
import { SubmitButton } from '@/components/forms';
import {
  ajouterLienAction, ajouterManuelAction, changerStatutAction, confirmerRemiseAction,
  decaisserVendeurAction, encaisserAction, enregistrerBriefAction, envoyerMessageAction,
  genererCdcAction, genererDocumentAction, genererRapportsAction, lancerAcquisitionAction,
  lancerScrapAction, libererCommissionAction, publierPropositionsAction, selectionnerReperageAction,
  setPublicationAction, simulerDevisAction, toggleEnLigneAction, transcrireAudioAction, validerCdcAction,
  validerDevisAction,
} from '@/app/actions';

export const dynamic = 'force-dynamic';

const DOC_TYPES: DocumentType[] = ['DEVIS', 'DOCUMENT_REMISE', 'LETTRE_REMISE', 'CERTIFICAT_IMPORT', 'CARTE_VISITE', 'CARTON_INVITATION', 'ENVELOPPE'];
const dt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('fr-FR') : '—');

export default async function FicheDossier({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getData().getDossier(id);
  if (!d) notFound();

  const Hidden = ({ extra }: { extra?: Record<string, string> }) => (
    <>
      <input type="hidden" name="dossierId" value={d.id} />
      {extra && Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
    </>
  );

  return (
    <div className="stack">
      <Link href="/cockpit" className="small">← Pipeline</Link>

      {/* En-tête */}
      <section className="card stack">
        <div className="between">
          <div>
            <h1 style={{ margin: 0 }}>{d.reference} <StatutBadge statut={d.statut} /></h1>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              {d.client.nom} · {d.client.email} · {d.vehiculeMarque} {d.vehiculeModele}
            </p>
          </div>
          <div className="right small">
            <div>Estimé <Money value={d.montantEstime} /></div>
            <div>Marge sim. <Money value={d.margeEstimee} /> · réelle <Money value={d.margeReelle} /></div>
          </div>
        </div>
        <FriseStatut statut={d.statut} />
        {d.prochaineAction && <div className="hitl"><strong>Prochaine action</strong> — {d.prochaineAction}</div>}
      </section>

      {/* 1. BRIEF */}
      <section className="card stack">
        <SectionTitle n={1} title="Brief" hint="intake (LLM) + audio (ASR) → trame cahier des charges" />
        <form action={enregistrerBriefAction} className="stack">
          <Hidden />
          <div className="row">
            <div style={{ flex: 1 }}><label>Marque</label><input name="vehiculeMarque" className="input" defaultValue={d.vehiculeMarque ?? ''} /></div>
            <div style={{ flex: 1 }}><label>Modèle</label><input name="vehiculeModele" className="input" defaultValue={d.vehiculeModele ?? ''} /></div>
            <div style={{ width: 160 }}><label>Budget estimé</label><input name="montantEstime" className="input" defaultValue={d.montantEstime ?? ''} /></div>
          </div>
          <div>
            <label>Cahier des charges (l’IA propose, le commissaire ajuste)</label>
            <textarea name="cahierDesCharges" className="textarea" defaultValue={d.cahierDesCharges ?? ''} style={{ minHeight: 140 }} />
          </div>
          <div className="row">
            <SubmitButton>Enregistrer le brief</SubmitButton>
          </div>
        </form>
        <div className="row">
          <form action={genererCdcAction}><Hidden /><SubmitButton variant="gold">⟳ Générer le cahier des charges (IA)</SubmitButton></form>
          <form action={transcrireAudioAction} className="row" style={{ gap: 6 }}>
            <Hidden />
            <input name="audioUrl" className="input" placeholder="URL audio d’appel (optionnel)" style={{ width: 240 }} />
            <SubmitButton>＋ Injecter / transcrire l’appel (ASR)</SubmitButton>
          </form>
        </div>
        {d.statut === 'BRIEF' && (
          <>
            <HitlNotice>le commissaire valide le cahier des charges, ce qui <strong>lance le repérage</strong>.</HitlNotice>
            <form action={validerCdcAction}><Hidden /><SubmitButton variant="primary" confirm="Valider le cahier des charges et lancer le repérage ?">✋ Valider &amp; lancer le repérage</SubmitButton></form>
          </>
        )}
      </section>

      {/* 2. REPÉRAGES */}
      <section className="card stack">
        <SectionTitle n={2} title="Repérages" hint="scrap (whitelist) + collage de lien + manuel" />
        <div className="row">
          <form action={ajouterLienAction} className="row" style={{ gap: 6, flex: 1 }}>
            <Hidden />
            <input name="lien" className="input" placeholder="Coller un lien d’annonce (canal prioritaire)" style={{ flex: 1 }} required />
            <SubmitButton>＋ Lien</SubmitButton>
          </form>
          <form action={lancerScrapAction}><Hidden /><SubmitButton variant="gold">⟳ Lancer le scrap (sources autorisées)</SubmitButton></form>
        </div>
        <details>
          <summary className="small" style={{ cursor: 'pointer' }}>＋ Ajout manuel</summary>
          <form action={ajouterManuelAction} className="row" style={{ gap: 6, marginTop: 8 }}>
            <Hidden />
            <input name="titre" className="input" placeholder="Titre / véhicule" />
            <input name="prix" className="input" placeholder="Prix" style={{ width: 120 }} />
            <input name="provenance" className="input" placeholder="Provenance" />
            <SubmitButton>Ajouter</SubmitButton>
          </form>
        </details>

        {d.reperages.length === 0 ? <EmptyState>Aucun repérage pour l’instant.</EmptyState> : (
          <table>
            <thead><tr><th>Annonce</th><th>Source</th><th>Provenance</th><th>En ligne</th><th>Rapports</th><th>Sélection ✋</th></tr></thead>
            <tbody>
              {d.reperages.map((r) => {
                const a = r.annonceData as { titre?: string; prix?: number };
                return (
                  <tr key={r.id}>
                    <td>{a.titre ?? r.lien ?? '—'}{a.prix ? <> · <Money value={a.prix} /></> : null}{r.lien && <div className="small"><a href={r.lien} target="_blank" rel="noreferrer">lien ↗</a></div>}</td>
                    <td><span className="badge">{r.source}</span></td>
                    <td className="small">{r.provenanceOrigine ?? '—'}</td>
                    <td>
                      <form action={toggleEnLigneAction}><Hidden extra={{ reperageId: r.id, enLigne: r.enLigne ? '0' : '1' }} /><SubmitButton>{r.enLigne ? 'Oui' : 'Hors-ligne'}</SubmitButton></form>
                    </td>
                    <td>
                      {r.rapportCommissaire ? <span className="small">✓ générés</span> : (
                        <form action={genererRapportsAction}><Hidden extra={{ reperageId: r.id }} /><SubmitButton>⟳ IA</SubmitButton></form>
                      )}
                    </td>
                    <td>
                      <form action={selectionnerReperageAction}><Hidden extra={{ reperageId: r.id, selectionne: r.selectionne ? '0' : '1' }} /><SubmitButton variant={r.selectionne ? 'gold' : 'default'}>{r.selectionne ? '★ Retenu' : 'Retenir'}</SubmitButton></form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {d.statut === 'REPERAGE' && (
          <>
            <HitlNotice>le commissaire sélectionne les repérages puis <strong>publie les propositions</strong> vers le portail client.</HitlNotice>
            <form action={publierPropositionsAction}><Hidden /><SubmitButton variant="primary" confirm="Publier les repérages retenus comme propositions ?">✋ Publier les propositions retenues</SubmitButton></form>
          </>
        )}
      </section>

      {/* 3. PROPOSITIONS */}
      <section className="card stack">
        <SectionTitle n={3} title="Propositions" hint="annonce (LLM) + photo + scène 3D → portail client" />
        {d.propositions.length === 0 ? <EmptyState>Aucune proposition composée.</EmptyState> : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))' }}>
            {d.propositions.map((p) => {
              const pub = d.publications.find((x) => x.propositionId === p.id);
              const publiee = pub?.statut === 'PUBLIEE';
              return (
                <article key={p.id} className="card">
                  {p.photos[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photos[0]} alt={p.titre ?? ''} style={{ width: '100%', borderRadius: 8, marginBottom: 6 }} />
                  )}
                  <strong>{p.titre}</strong>
                  <p className="small muted">{(p.description ?? '').slice(0, 120)}</p>
                  <div className="between">
                    <span className="badge">{pub?.statut ?? 'BROUILLON'}</span>
                    <form action={setPublicationAction}><Hidden extra={{ propositionId: p.id, publiee: publiee ? '0' : '1' }} /><SubmitButton>{publiee ? 'Dépublier' : 'Publier'}</SubmitButton></form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {d.statut === 'PROPOSITIONS' && <p className="muted small">En attente de validation d’une proposition par le client (depuis son portail).</p>}
      </section>

      {/* 4. DEVIS */}
      <section className="card stack">
        <SectionTitle n={4} title="Devis" hint="simulation frais & marge (FR puis UE) → ✋ validation commissaire" />
        {d.statut === 'VALIDATION' && (
          <>
            <HitlNotice>le client a validé une proposition : le commissaire <strong>lance l’acquisition</strong>.</HitlNotice>
            <form action={lancerAcquisitionAction}><Hidden /><SubmitButton variant="primary">✋ Lancer l’acquisition</SubmitButton></form>
          </>
        )}
        <form action={simulerDevisAction} className="row" style={{ alignItems: 'flex-end', gap: 8 }}>
          <Hidden />
          <div><label>Prix d’achat</label><input name="prixAchat" className="input" placeholder="120000" style={{ width: 120 }} /></div>
          <div><label>Transport</label><input name="transport" className="input" placeholder="auto" style={{ width: 100 }} /></div>
          <div><label>Import/douane</label><input name="importDouane" className="input" placeholder="auto" style={{ width: 110 }} /></div>
          <div><label>Commission</label><input name="commissionTaux" className="input" placeholder="0.10" style={{ width: 90 }} /></div>
          <SubmitButton variant="gold">⟳ Simuler le devis</SubmitButton>
        </form>
        {d.devis.length === 0 ? <EmptyState>Aucun devis simulé.</EmptyState> : d.devis.map((dv) => (
          <div key={dv.id} className="card" style={{ background: 'var(--surface-2)' }}>
            <div className="between">
              <strong>Devis <span className="badge">{dv.statut}</span> · {dv.tvaRegime}</strong>
              <span>Total <Money value={dv.montantTotal} /> · marge <Money value={dv.margeSimulee} /></span>
            </div>
            <table>
              <tbody>{dv.lignes.map((l, i) => (<tr key={i}><td>{l.libelle}</td><td className="small muted">{l.categorie}</td><td className="right"><Money value={l.montant} /></td></tr>))}</tbody>
            </table>
            {dv.statut === 'BROUILLON' && d.statut === 'ACQUISITION' && (
              <>
                <HitlNotice>validation du devis par le commissaire → ouvre l’échéancier (acompte/solde).</HitlNotice>
                <form action={validerDevisAction}><Hidden extra={{ devisId: dv.id }} /><SubmitButton variant="primary" confirm="Valider ce devis et générer l’échéancier ?">✋ Valider le devis</SubmitButton></form>
              </>
            )}
          </div>
        ))}
      </section>

      {/* 5. PAIEMENT */}
      <section className="card stack">
        <SectionTitle n={5} title="Paiement" hint="acompte (séquestre) → solde → décaissement → commission" />
        {d.echeances.length === 0 ? <EmptyState>Échéancier généré à la validation du devis.</EmptyState> : (
          <table>
            <thead><tr><th>Type</th><th>Montant</th><th>Échéance</th><th>Réglée</th><th>Encaisser (→ séquestre)</th></tr></thead>
            <tbody>
              {d.echeances.map((e) => (
                <tr key={e.id}>
                  <td><span className="badge">{e.type}</span></td>
                  <td><Money value={e.montant} /></td>
                  <td className="small">{e.dateEcheance ?? '—'}</td>
                  <td>{e.dateReelle ? '✓' : '—'}</td>
                  <td>{!e.dateReelle && (
                    <form action={encaisserAction}><Hidden extra={{ echeanceId: e.id, type: e.type, montant: String(e.montant) }} /><SubmitButton variant="primary">Encaisser {e.type}</SubmitButton></form>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {(d.statut === 'PAIEMENT' || d.statut === 'LIVRAISON') && (
          <div className="row">
            <form action={decaisserVendeurAction} className="row" style={{ gap: 6 }}><Hidden /><input name="montant" className="input" placeholder="Montant vendeur" style={{ width: 140 }} /><SubmitButton>Décaisser vendeur</SubmitButton></form>
            <form action={libererCommissionAction} className="row" style={{ gap: 6 }}><Hidden /><input name="montant" className="input" placeholder="Commission" style={{ width: 120 }} /><SubmitButton>Libérer la commission</SubmitButton></form>
          </div>
        )}
        <p className="muted small">⚠ Fonds clients cloisonnés (séquestre) — écritures via service_role en mode réel.</p>
      </section>

      {/* 6. DOCUMENTS */}
      <section className="card stack">
        <SectionTitle n={6} title="Documents" hint="génération 1-clic depuis les trames (papeterie, remise, certificat)" />
        <div className="row">
          {DOC_TYPES.map((t) => (
            <form key={t} action={genererDocumentAction}><Hidden extra={{ type: t }} /><SubmitButton>＋ {t}</SubmitButton></form>
          ))}
        </div>
        {d.documents.length === 0 ? <EmptyState>Aucun document généré.</EmptyState> : (
          <table>
            <thead><tr><th>Type</th><th>Généré</th><th>Fichier</th></tr></thead>
            <tbody>{d.documents.map((doc) => (<tr key={doc.id}><td><span className="badge">{doc.type}</span></td><td className="small">{dt(doc.genereAt)}</td><td className="small mono">{doc.fichierUrl}</td></tr>))}</tbody>
          </table>
        )}
        {d.statut === 'LIVRAISON' && (
          <>
            <HitlNotice>une fois les documents prêts et la remise effectuée, le commissaire <strong>clôture</strong> le dossier.</HitlNotice>
            <form action={confirmerRemiseAction}><Hidden /><SubmitButton variant="primary" confirm="Confirmer la remise et clôturer le dossier ?">✋ Confirmer la remise &amp; clôturer</SubmitButton></form>
          </>
        )}
      </section>

      {/* 7. MESSAGERIE */}
      <section className="card stack">
        <SectionTitle n={7} title="Messagerie" hint="fil de discussion avec le client" />
        <div className="stack" style={{ gap: 6 }}>
          {d.messages.length === 0 ? <EmptyState>Aucun message.</EmptyState> : d.messages.map((m) => (
            <div key={m.id} className="small" style={{ padding: '6px 10px', borderRadius: 6, background: m.auteur === 'COMMISSAIRE' ? 'var(--surface-2)' : '#eef4f0' }}>
              <strong>{m.auteur}</strong> · <span className="muted">{dt(m.createdAt)}</span><br />{m.contenu}
            </div>
          ))}
        </div>
        <form action={envoyerMessageAction} className="row" style={{ gap: 6 }}>
          <Hidden extra={{ auteur: 'COMMISSAIRE' }} />
          <input name="contenu" className="input" placeholder="Message au client…" style={{ flex: 1 }} required />
          <SubmitButton variant="primary">Envoyer</SubmitButton>
        </form>
      </section>

      {/* 8. STATUT & JOURNAL */}
      <section className="card stack">
        <SectionTitle n={8} title="Statut & journal" hint="état courant + audit immuable des validations (HITL)" />
        <div className="row" style={{ alignItems: 'center' }}>
          <StatutBadge statut={d.statut} />
          <span className="muted small">Transitions autorisées :</span>
          {transitionsDepuis(d.statut).filter((t) => t.to !== d.statut).map((t) => (
            <form key={t.to} action={changerStatutAction}>
              <Hidden extra={{ to: t.to }} />
              <SubmitButton>{STATUT_META[t.to].label}{t.hitl ? ' ✋' : ''}</SubmitButton>
            </form>
          ))}
        </div>
        {d.journal.length === 0 ? <EmptyState>Aucune entrée de journal.</EmptyState> : (
          <table>
            <thead><tr><th>Horodatage</th><th>Acteur</th><th>Action</th><th>Détails</th></tr></thead>
            <tbody>
              {[...d.journal].reverse().map((j) => (
                <tr key={j.id}><td className="small">{dt(j.horodatage)}</td><td className="small">{j.acteurType}</td><td className="small">{j.action}</td><td className="small mono">{JSON.stringify(j.details)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
