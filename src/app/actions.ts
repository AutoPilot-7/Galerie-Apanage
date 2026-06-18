'use server';

// ============================================================================
// Galerie Apanage — SERVER ACTIONS : câblage des flux inter-modules (cf. §3/§4)
// ----------------------------------------------------------------------------
// Chaque action fait avancer le DOSSIER (objet pivot). Les gardes
// human-in-the-loop (✋) sont marquées et journalisées. La couche IA est appelée
// via getServices() (mock par défaut) ; la donnée via getData() (mock ou Supabase).
// Aucune transition « à enjeu » n'est automatique : elle exige une action
// explicite (bouton commissaire, ou validation client pour 3→4).
// ============================================================================

import { revalidatePath } from 'next/cache';
import { getData } from '@/data';
import { getServices } from '@/services';
import { simulerDevis } from '@/domain/devis';
import { DocumentType } from '@/domain/types';

function str(fd: FormData, k: string): string {
  return String(fd.get(k) ?? '').trim();
}
function num(fd: FormData, k: string): number | undefined {
  const v = str(fd, k);
  if (v === '') return undefined;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}
function refresh(dossierId?: string) {
  revalidatePath('/cockpit');
  revalidatePath('/cockpit/pilotage');
  revalidatePath('/cockpit/galerie');
  revalidatePath('/');
  if (dossierId) {
    revalidatePath(`/cockpit/dossiers/${dossierId}`);
    revalidatePath('/portail');
  }
}

// ===========================================================================
// CRÉATION DOSSIER
// ===========================================================================
export async function creerDossierAction(fd: FormData) {
  const data = getData();
  let clientId = str(fd, 'clientId');
  if (!clientId) {
    const c = await data.createClient({ nom: str(fd, 'clientNom') || 'Nouveau client', email: str(fd, 'clientEmail') || 'client@example.com', langue: (str(fd, 'langue') as 'FR' | 'EN') || 'FR' });
    clientId = c.id;
  }
  const d = await data.createDossier({
    clientId,
    vehiculeMarque: str(fd, 'vehiculeMarque') || undefined,
    vehiculeModele: str(fd, 'vehiculeModele') || undefined,
    montantEstime: num(fd, 'montantEstime'),
    margeEstimee: num(fd, 'margeEstimee'),
  });
  await data.addJournal({ dossierId: d.id, acteurType: 'COMMISSAIRE', action: 'CREATION_DOSSIER', details: { reference: d.reference } });
  refresh(d.id);
}

// ===========================================================================
// 1. BRIEF  — intake (LLM) + audio (ASR) → trame CDC → ✋ validation commissaire
// ===========================================================================
export async function enregistrerBriefAction(fd: FormData) {
  const data = getData();
  const id = str(fd, 'dossierId');
  await data.updateDossier(id, {
    vehiculeMarque: str(fd, 'vehiculeMarque') || null,
    vehiculeModele: str(fd, 'vehiculeModele') || null,
    cahierDesCharges: str(fd, 'cahierDesCharges') || null,
    montantEstime: num(fd, 'montantEstime') ?? null,
  });
  refresh(id);
}

export async function transcrireAudioAction(fd: FormData) {
  const data = getData();
  const services = getServices();
  const id = str(fd, 'dossierId');
  const { texte } = await services.asr.transcribe({ audioUrl: str(fd, 'audioUrl') || 'mock://appel.m4a' });
  const dossier = await data.getDossier(id);
  const cdc = `${dossier?.cahierDesCharges ?? ''}\n\n[Transcription d'appel]\n${texte}`.trim();
  await data.updateDossier(id, { cahierDesCharges: cdc });
  await data.addJournal({ dossierId: id, acteurType: 'SYSTEME', action: 'TRANSCRIPTION_AUDIO' });
  refresh(id);
}

export async function genererCdcAction(fd: FormData) {
  const data = getData();
  const services = getServices();
  const id = str(fd, 'dossierId');
  const dossier = await data.getDossier(id);
  const trame = (await data.listTrames('CAHIER_DES_CHARGES'))[0];
  const { texte } = await services.llm.generateFromTrame({
    trameType: 'CAHIER_DES_CHARGES',
    trameContenu: trame?.contenu ?? '',
    contexte: {
      vehicule: `${dossier?.vehiculeMarque ?? ''} ${dossier?.vehiculeModele ?? ''}`.trim(),
      notes: dossier?.cahierDesCharges ?? '',
      criteres: dossier?.vehiculeCriteres ?? {},
      client: dossier?.client?.nom,
    },
  });
  await data.updateDossier(id, { cahierDesCharges: texte });
  await data.addJournal({ dossierId: id, acteurType: 'SYSTEME', action: 'GENERATION_CDC' });
  refresh(id);
}

export async function validerCdcAction(fd: FormData) {
  // ✋ HITL : le commissaire valide le cahier des charges → lance le repérage.
  const data = getData();
  const id = str(fd, 'dossierId');
  await data.transitionDossier(id, 'REPERAGE', 'COMMISSAIRE', 'Cahier des charges validé');
  await data.updateDossier(id, { prochaineAction: 'Repérer & sélectionner des annonces' });
  refresh(id);
}

// ===========================================================================
// 2. REPÉRAGE — scrap / lien / manuel → rapports → ✋ sélection → publication
// ===========================================================================
export async function ajouterLienAction(fd: FormData) {
  const data = getData();
  const services = getServices();
  const id = str(fd, 'dossierId');
  const lien = str(fd, 'lien');
  const annonce = await services.scraper.extract({ url: lien });
  await data.createReperage({
    dossierId: id,
    source: 'LIEN',
    lien,
    annonceData: { titre: annonce.titre, prix: annonce.prix, marque: annonce.marque, modele: annonce.modele, annee: annonce.annee, km: annonce.kilometrage, photos: annonce.photos },
    provenanceOrigine: annonce.provenanceOrigine,
  });
  refresh(id);
}

export async function ajouterManuelAction(fd: FormData) {
  const data = getData();
  const id = str(fd, 'dossierId');
  await data.createReperage({
    dossierId: id,
    source: 'MANUEL',
    lien: str(fd, 'lien') || undefined,
    annonceData: { titre: str(fd, 'titre'), prix: num(fd, 'prix') ?? null },
    provenanceOrigine: str(fd, 'provenance') || 'Saisie manuelle',
  });
  refresh(id);
}

export async function lancerScrapAction(fd: FormData) {
  const data = getData();
  const services = getServices();
  const id = str(fd, 'dossierId');
  const dossier = await data.getDossier(id);
  const sources = (await data.listSources()).filter((s) => s.actif && s.domaine !== 'manuel').map((s) => s.urlBase);
  const annonces = await services.scraper.search({ sources, criteres: { marque: dossier?.vehiculeMarque, modele: dossier?.vehiculeModele } });
  for (const a of annonces) {
    await data.createReperage({ dossierId: id, source: 'SCRAP', lien: a.url, annonceData: { titre: a.titre, prix: a.prix }, provenanceOrigine: a.provenanceOrigine });
  }
  await data.addJournal({ dossierId: id, acteurType: 'SYSTEME', action: 'SCRAP', details: { trouves: annonces.length } });
  refresh(id);
}

export async function genererRapportsAction(fd: FormData) {
  const data = getData();
  const services = getServices();
  const id = str(fd, 'dossierId');
  const reperageId = str(fd, 'reperageId');
  const trCom = (await data.listTrames('RAPPORT_COMMISSAIRE'))[0];
  const trCli = (await data.listTrames('RAPPORT_CLIENT'))[0];
  const dossier = await data.getDossier(id);
  const rep = dossier?.reperages.find((r) => r.id === reperageId);
  const ctx = { vehicule: `${dossier?.vehiculeMarque ?? ''} ${dossier?.vehiculeModele ?? ''}`, annonce: rep?.annonceData, provenance: rep?.provenanceOrigine };
  const [rc, rcl] = await Promise.all([
    services.llm.generateFromTrame({ trameType: 'RAPPORT_COMMISSAIRE', trameContenu: trCom?.contenu ?? '', contexte: ctx }),
    services.llm.generateFromTrame({ trameType: 'RAPPORT_CLIENT', trameContenu: trCli?.contenu ?? '', contexte: ctx }),
  ]);
  await data.updateReperage(reperageId, { rapportCommissaire: rc.texte, rapportClient: rcl.texte });
  refresh(id);
}

export async function selectionnerReperageAction(fd: FormData) {
  // ✋ HITL : sélection commissaire des repérages retenus.
  const data = getData();
  const id = str(fd, 'dossierId');
  await data.setReperageSelection(str(fd, 'reperageId'), str(fd, 'selectionne') === '1');
  refresh(id);
}

export async function toggleEnLigneAction(fd: FormData) {
  const data = getData();
  const id = str(fd, 'dossierId');
  await data.setReperageEnLigne(str(fd, 'reperageId'), str(fd, 'enLigne') === '1');
  refresh(id);
}

export async function publierPropositionsAction(fd: FormData) {
  // ✋ HITL : le commissaire publie les propositions retenues (2 → 3).
  const data = getData();
  const services = getServices();
  const id = str(fd, 'dossierId');
  const dossier = await data.getDossier(id);
  if (!dossier) return;
  const retenus = dossier.reperages.filter((r) => r.selectionne || r.statut === 'RETENU');
  if (retenus.length === 0) throw new Error('Sélectionnez au moins un repérage avant de publier.');
  const trAnnonce = (await data.listTrames('ANNONCE'))[0];
  for (const r of retenus) {
    const { texte } = await services.llm.generateFromTrame({
      trameType: 'ANNONCE',
      trameContenu: trAnnonce?.contenu ?? '',
      contexte: { vehicule: `${dossier.vehiculeMarque ?? ''} ${dossier.vehiculeModele ?? ''}`, annonce: r.annonceData, provenance: r.provenanceOrigine },
    });
    const photo = await services.image.generate({ prompt: `${dossier.vehiculeMarque} ${dossier.vehiculeModele} editorial luxe` });
    const scene = await services.threed.generateScene({ photos: [photo.url], label: dossier.vehiculeModele ?? undefined });
    const prop = await data.createProposition({
      dossierId: id,
      reperageId: r.id,
      titre: `${dossier.vehiculeMarque ?? ''} ${dossier.vehiculeModele ?? ''}`.trim(),
      description: texte,
      photos: [photo.url],
      scene3dUrl: scene.previewUrl,
    });
    await data.setPublication(prop.id, id, true);
  }
  await data.transitionDossier(id, 'PROPOSITIONS', 'COMMISSAIRE', 'Propositions publiées');
  await data.updateDossier(id, { prochaineAction: 'Attente validation client' });
  refresh(id);
}

export async function setPublicationAction(fd: FormData) {
  const data = getData();
  const id = str(fd, 'dossierId');
  await data.setPublication(str(fd, 'propositionId'), id, str(fd, 'publiee') === '1');
  refresh(id);
}

// ===========================================================================
// 3 → 4. VALIDATION — le CLIENT valide une proposition (depuis le portail)
// ===========================================================================
export async function validerPropositionClientAction(fd: FormData) {
  // ✋ HITL côté CLIENT : ferme la boucle portail → acquisition.
  const data = getData();
  const id = str(fd, 'dossierId');
  await data.transitionDossier(id, 'VALIDATION', 'CLIENT', 'Proposition validée par le client');
  await data.updateDossier(id, { prochaineAction: 'Lancer l’acquisition' });
  await data.addJournal({ dossierId: id, acteurType: 'CLIENT', action: 'VALIDATION_PROPOSITION', details: { propositionId: str(fd, 'propositionId') } });
  refresh(id);
}

// ===========================================================================
// 4 → 5. ACQUISITION — ✋ lancement + simulation marge + devis + ✋ validation
// ===========================================================================
export async function lancerAcquisitionAction(fd: FormData) {
  // ✋ HITL : le commissaire lance l'acquisition (4 → 5).
  const data = getData();
  const id = str(fd, 'dossierId');
  await data.transitionDossier(id, 'ACQUISITION', 'COMMISSAIRE', 'Acquisition lancée');
  await data.updateDossier(id, { prochaineAction: 'Simuler & valider le devis' });
  refresh(id);
}

export async function simulerDevisAction(fd: FormData) {
  const data = getData();
  const id = str(fd, 'dossierId');
  const params = await data.listParametres();
  const tauxParam = params.find((p) => p.cle === 'commission')?.valeur as { taux_indicatif?: number } | undefined;
  const sim = simulerDevis({
    prixAchat: num(fd, 'prixAchat') ?? 0,
    transport: num(fd, 'transport'),
    importDouane: num(fd, 'importDouane'),
    commissionTaux: num(fd, 'commissionTaux') ?? tauxParam?.taux_indicatif,
  });
  await data.createDevis({ dossierId: id, lignes: sim.lignes, margeSimulee: sim.margeSimulee, tvaRegime: sim.tvaRegime });
  await data.updateDossier(id, { margeEstimee: sim.margeSimulee });
  await data.addJournal({ dossierId: id, acteurType: 'SYSTEME', action: 'SIMULATION_DEVIS', details: { total: sim.montantTotal } });
  refresh(id);
}

export async function validerDevisAction(fd: FormData) {
  // ✋ HITL : validation du devis par le commissaire → ouvre l'échéancier (5 → 6).
  const data = getData();
  const id = str(fd, 'dossierId');
  const devisId = str(fd, 'devisId');
  const dv = await data.validateDevis(devisId);
  const total = dv.montantTotal ?? 0;
  await data.createEcheance({ dossierId: id, devisId, type: 'ACOMPTE', montant: Math.round(total * 0.3) });
  await data.createEcheance({ dossierId: id, devisId, type: 'SOLDE', montant: Math.round(total * 0.7) });
  await data.transitionDossier(id, 'PAIEMENT', 'COMMISSAIRE', 'Devis validé');
  await data.updateDossier(id, { prochaineAction: 'Encaisser l’acompte (séquestre)' });
  refresh(id);
}

// ===========================================================================
// 6. PAIEMENT — encaissement séquestre → solde → décaissement → commission
// ===========================================================================
export async function encaisserAction(fd: FormData) {
  const data = getData();
  const services = getServices();
  const id = str(fd, 'dossierId');
  const echeanceId = str(fd, 'echeanceId');
  const type = str(fd, 'type') as 'ACOMPTE' | 'SOLDE';
  const montant = num(fd, 'montant') ?? 0;
  // Encaissement vers le séquestre (wallet ségrégué) via le service de paiement.
  await services.payment.createEscrowPayment({ montant, dossierRef: id, type });
  await data.enregistrerEncaissement({ dossierId: id, echeanceId, type, montant, compteType: 'SEQUESTRE' });
  if (type === 'SOLDE') {
    // Solde encaissé → passage en livraison (déclenché par la finance).
    await data.transitionDossier(id, 'LIVRAISON', 'SYSTEME', 'Solde encaissé');
    await data.updateDossier(id, { prochaineAction: 'Générer les documents & remettre' });
  }
  refresh(id);
}

export async function decaisserVendeurAction(fd: FormData) {
  const data = getData();
  const services = getServices();
  const id = str(fd, 'dossierId');
  const montant = num(fd, 'montant') ?? 0;
  await services.payment.releaseToVendor({ montant, dossierRef: id });
  await data.enregistrerEncaissement({ dossierId: id, type: 'DECAISSEMENT_VENDEUR', montant, compteType: 'DECAISSEMENT' });
  refresh(id);
}

export async function libererCommissionAction(fd: FormData) {
  const data = getData();
  const services = getServices();
  const id = str(fd, 'dossierId');
  const montant = num(fd, 'montant') ?? 0;
  await services.payment.releaseCommission({ montant, dossierRef: id });
  await data.enregistrerEncaissement({ dossierId: id, type: 'COMMISSION', montant, compteType: 'COURANT_PRO' });
  refresh(id);
}

// ===========================================================================
// 7. LIVRAISON — documents (papeterie) → remise → ✋ clôture
// ===========================================================================
export async function genererDocumentAction(fd: FormData) {
  const data = getData();
  const services = getServices();
  const id = str(fd, 'dossierId');
  const type = str(fd, 'type') as DocumentType;
  const dossier = await data.getDossier(id);
  // Génération mockée : un placeholder est « stocké » (Canva/PDF réel plus tard).
  const up = await services.storage.upload({ bucket: 'documents', path: `${id}/${type}-${Date.now()}.txt`, data: `Document ${type} — ${dossier?.reference}`, contentType: 'text/plain' });
  await data.createDocument({ dossierId: id, type, fichierUrl: up.url, donnees: { reference: dossier?.reference, vehicule: `${dossier?.vehiculeMarque ?? ''} ${dossier?.vehiculeModele ?? ''}` } });
  await data.addJournal({ dossierId: id, acteurType: 'COMMISSAIRE', action: 'GENERATION_DOCUMENT', details: { type } });
  refresh(id);
}

export async function confirmerRemiseAction(fd: FormData) {
  // ✋ HITL : remise confirmée → clôture du dossier (7 → fin).
  const data = getData();
  const id = str(fd, 'dossierId');
  await data.transitionDossier(id, 'CLOS', 'COMMISSAIRE', 'Remise confirmée, dossier clôturé');
  await data.updateDossier(id, { prochaineAction: null });
  refresh(id);
}

// ===========================================================================
// MESSAGERIE (client ↔ commissaire)
// ===========================================================================
export async function envoyerMessageAction(fd: FormData) {
  const data = getData();
  const id = str(fd, 'dossierId');
  const auteur = (str(fd, 'auteur') as 'CLIENT' | 'COMMISSAIRE') || 'COMMISSAIRE';
  const contenu = str(fd, 'contenu');
  if (contenu) await data.createMessage({ dossierId: id, auteur, contenu });
  refresh(id);
}

// ===========================================================================
// KANBAN — changement de statut au drag (garde-fou commissaire)
// ===========================================================================
export async function changerStatutAction(fd: FormData) {
  const data = getData();
  const id = str(fd, 'dossierId');
  const to = str(fd, 'to') as Parameters<typeof data.transitionDossier>[1];
  await data.transitionDossier(id, to, 'COMMISSAIRE', 'Changement de statut (Pipeline)');
  refresh(id);
}

// ===========================================================================
// BIBLIOTHÈQUE DA — édition d'une trame (versionnée)
// ===========================================================================
export async function mettreAJourTrameAction(fd: FormData) {
  const data = getData();
  await data.updateTrame(str(fd, 'trameId'), { contenu: str(fd, 'contenu') });
  revalidatePath('/cockpit/bibliotheque');
}
