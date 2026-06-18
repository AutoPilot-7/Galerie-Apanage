// ============================================================================
// Galerie Apanage — MockDataSource : store mémoire seedé (cf. seed SQL §08)
// ----------------------------------------------------------------------------
// Permet de dérouler TOUS les écrans et flux SANS aucune clé. Les données vivent
// le temps du process serveur (réinitialisées au redémarrage — OK en dev/preview).
// La garde de transition (HITL) réutilise la machine à états du domaine.
// ============================================================================

import { assertTransition, Acteur } from '@/domain/statut';
import {
  AppUser,
  Client,
  CompteBancaire,
  Devis,
  DocumentGenere,
  Dossier,
  DossierStatut,
  Echeance,
  JournalEntry,
  Message,
  Mouvement,
  Paiement,
  Parametre,
  Proposition,
  Publication,
  Reperage,
  SourceScrap,
  Trame,
} from '@/domain/types';
import { DataSource, DossierAvecClient, DossierComplet, KpisPilotage, PropositionPubliee } from './types';

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

// --- Données seed (alignées sur 20260618120008_seed.sql) --------------------

interface Store {
  users: AppUser[];
  clients: Client[];
  dossiers: Dossier[];
  trames: Trame[];
  reperages: Reperage[];
  propositions: Proposition[];
  publications: Publication[];
  devis: Devis[];
  echeances: Echeance[];
  paiements: Paiement[];
  comptes: CompteBancaire[];
  mouvements: Mouvement[];
  documents: DocumentGenere[];
  messages: Message[];
  sources: SourceScrap[];
  parametres: Parametre[];
  journal: JournalEntry[];
}

function seed(): Store {
  const t = now();
  const clients: Client[] = [
    { id: '11111111-1111-1111-1111-111111111111', authUserId: null, nom: 'M. Lefèvre', email: 'lefevre@example.com', telephone: '+33600000001', langue: 'FR', createdAt: t, updatedAt: t },
    { id: '22222222-2222-2222-2222-222222222222', authUserId: null, nom: 'Mrs. Tanaka', email: 'tanaka@example.com', telephone: '+81900000002', langue: 'EN', createdAt: t, updatedAt: t },
  ];

  const baseDossier = (over: Partial<Dossier>): Dossier => ({
    id: uid(),
    reference: 'GA-2026-XXXX',
    statut: 'BRIEF',
    clientId: clients[0].id,
    commissaireId: null,
    vehiculeMarque: null,
    vehiculeModele: null,
    vehiculeCriteres: {},
    cahierDesCharges: null,
    montantEstime: null,
    margeEstimee: null,
    margeReelle: null,
    prochaineAction: null,
    createdAt: t,
    updatedAt: t,
    ...over,
  });

  const dossiers: Dossier[] = [
    baseDossier({ id: 'aaaaaaa1-0000-0000-0000-000000000001', reference: 'GA-2026-0001', statut: 'BRIEF', clientId: clients[0].id, vehiculeMarque: 'Porsche', vehiculeModele: '911 (993) Turbo', montantEstime: 220000, margeEstimee: 22000, prochaineAction: 'Valider le cahier des charges' }),
    baseDossier({ id: 'aaaaaaa2-0000-0000-0000-000000000002', reference: 'GA-2026-0002', statut: 'REPERAGE', clientId: clients[1].id, vehiculeMarque: 'Nissan', vehiculeModele: 'Skyline GT-R R34', montantEstime: 180000, margeEstimee: 18000, prochaineAction: 'Sélectionner les repérages' }),
    baseDossier({ id: 'aaaaaaa3-0000-0000-0000-000000000003', reference: 'GA-2026-0003', statut: 'PROPOSITIONS', clientId: clients[0].id, vehiculeMarque: 'Toyota', vehiculeModele: 'Supra A80', montantEstime: 95000, margeEstimee: 12000, prochaineAction: 'Attente validation client' }),
    baseDossier({ id: 'aaaaaaa4-0000-0000-0000-000000000004', reference: 'GA-2026-0004', statut: 'ACQUISITION', clientId: clients[1].id, vehiculeMarque: 'Honda', vehiculeModele: 'NSX (NA1)', montantEstime: 130000, margeEstimee: 15000, prochaineAction: 'Valider le devis' }),
  ];

  const trame = (type: Trame['type'], nom: string, contenu: string): Trame => ({ id: uid(), type, nom, contenu, version: 1, actif: true, createdAt: t, updatedAt: t });
  const trames: Trame[] = [
    trame('CAHIER_DES_CHARGES', 'Trame Cahier des charges v1', "À partir du brief client et de la transcription d'appel, rédige un cahier des charges structuré : besoin, usage, budget, critères techniques, contraintes (éligibilité ≤ 10 ans, sourcing). Ton sobre, premium."),
    trame('RAPPORT_COMMISSAIRE', 'Trame Rapport technique commissaire v1', "Rédige un rapport technique interne à partir de la fiche d'inspection : points forts, réserves, cohérence prix/marché FR+UE, recommandation."),
    trame('RAPPORT_CLIENT', 'Trame Rapport technique client v1', "Rédige un rapport technique client, pédagogique et rassurant, à partir de l'inspection : état général, historique, provenance, valeur."),
    trame('ANNONCE', "Trame Rédaction d'annonce v1", "Rédige l'annonce de la proposition retenue : titre sobre, description premium, points clés, provenance. Style galerie d'art."),
    trame('PHOTO', 'Trame / Prompt photo produit v1', 'Prompt de mise en scène produit : éclairage studio, fond neutre, rendu éditorial luxe.'),
    trame('DEVIS', 'Trame Devis v1', "Génère le devis : prix d'achat, transport, import/douane, honoraires/commission, régime TVA. Total TTC, échéancier acompte/solde."),
  ];

  const comptes: CompteBancaire[] = [
    { id: uid(), type: 'COURANT_PRO', libelle: 'Compte courant pro (exploitation)', iban: null, solde: 0, devise: 'EUR', createdAt: t },
    { id: uid(), type: 'SEQUESTRE', libelle: 'Compte séquestre / de tiers (fonds clients)', iban: null, solde: 0, devise: 'EUR', createdAt: t },
    { id: uid(), type: 'DECAISSEMENT', libelle: 'Compte de décaissement (vendeurs/fournisseurs)', iban: null, solde: 0, devise: 'EUR', createdAt: t },
  ];

  const sources: SourceScrap[] = [
    { id: uid(), nom: 'Saisie manuelle / lien direct', urlBase: '', domaine: 'manuel', actif: true, createdAt: t },
    { id: uid(), nom: 'Catawiki', urlBase: 'https://www.catawiki.com', domaine: 'catawiki.com', actif: true, createdAt: t },
    { id: uid(), nom: 'Collecting Cars', urlBase: 'https://collectingcars.com', domaine: 'collectingcars.com', actif: true, createdAt: t },
  ];

  const parametres: Parametre[] = [
    { id: uid(), cle: 'commission', valeur: { mode: 'manuel', taux_indicatif: 0.1 }, updatedAt: t, updatedBy: null },
    { id: uid(), cle: 'eligibilite_age', valeur: { age_max_annees: 10 }, updatedAt: t, updatedBy: null },
    { id: uid(), cle: 'perimetre_sourcing', valeur: { origine: ['Japon', 'Coree'], destination: 'France', option: 'UE' }, updatedAt: t, updatedBy: null },
    { id: uid(), cle: 'langues', valeur: { actives: ['FR', 'EN'] }, updatedAt: t, updatedBy: null },
    { id: uid(), cle: 'tva', valeur: { regime_defaut: 'TVA_MARGE' }, updatedAt: t, updatedBy: null },
  ];

  // Données pour démontrer les flux : repérages (dossier REPERAGE) + propositions/publication (dossier PROPOSITIONS)
  const d2 = dossiers[1];
  const d3 = dossiers[2];
  const reperages: Reperage[] = [
    { id: uid(), dossierId: d2.id, source: 'LIEN', statut: 'BRUT', lien: 'https://collectingcars.com/annonce/r34-1', annonceData: { titre: 'Skyline GT-R R34 V-Spec', prix: 185000 }, provenanceOrigine: 'Japon', provenanceDate: t, rapportCommissaire: null, rapportClient: null, selectionne: false, enLigne: true, createdAt: t, updatedAt: t },
    { id: uid(), dossierId: d2.id, source: 'SCRAP', statut: 'BRUT', lien: 'https://www.catawiki.com/annonce/r34-2', annonceData: { titre: 'Skyline GT-R R34', prix: 172000 }, provenanceOrigine: 'Japon (auction)', provenanceDate: t, rapportCommissaire: null, rapportClient: null, selectionne: false, enLigne: true, createdAt: t, updatedAt: t },
  ];

  const prop: Proposition = { id: uid(), dossierId: d3.id, reperageId: null, titre: 'Toyota Supra A80 — Twin Turbo', description: 'Exemplaire de collection, provenance saine.', photos: [], scene3dUrl: null, ficheInspection: {}, dossierProvenance: {}, createdAt: t, updatedAt: t };
  const propositions: Proposition[] = [prop];
  const publications: Publication[] = [
    { id: uid(), propositionId: prop.id, dossierId: d3.id, statut: 'PUBLIEE', publieAt: t, depublieAt: null, createdAt: t, updatedAt: t },
  ];

  return {
    users: [],
    clients,
    dossiers,
    trames,
    reperages,
    propositions,
    publications,
    devis: [],
    echeances: [],
    paiements: [],
    comptes,
    mouvements: [],
    documents: [],
    messages: [
      { id: uid(), dossierId: d3.id, auteur: 'COMMISSAIRE', auteurId: null, contenu: 'Bonjour, votre proposition est en ligne dans le portail.', lu: true, createdAt: t },
    ],
    sources,
    parametres,
    journal: [],
  };
}

// Singleton mémoire (persiste sur la durée du process serveur).
const g = globalThis as unknown as { __apanageStore?: Store };
function store(): Store {
  if (!g.__apanageStore) g.__apanageStore = seed();
  return g.__apanageStore;
}

function withClient(d: Dossier, s: Store): DossierAvecClient {
  const client = s.clients.find((c) => c.id === d.clientId)!;
  return { ...d, client };
}

export class MockDataSource implements DataSource {
  readonly mode = 'mock' as const;

  async listDossiers(): Promise<DossierAvecClient[]> {
    const s = store();
    return s.dossiers.map((d) => withClient(d, s));
  }

  async getDossier(id: string): Promise<DossierComplet | null> {
    const s = store();
    const d = s.dossiers.find((x) => x.id === id);
    if (!d) return null;
    return {
      ...withClient(d, s),
      reperages: s.reperages.filter((r) => r.dossierId === id),
      propositions: s.propositions.filter((p) => p.dossierId === id),
      publications: s.publications.filter((p) => p.dossierId === id),
      devis: s.devis.filter((x) => x.dossierId === id),
      echeances: s.echeances.filter((x) => x.dossierId === id),
      paiements: s.paiements.filter((x) => x.dossierId === id),
      documents: s.documents.filter((x) => x.dossierId === id),
      messages: s.messages.filter((x) => x.dossierId === id),
      journal: s.journal.filter((x) => x.dossierId === id),
    };
  }

  async getDossierByReference(ref: string): Promise<DossierComplet | null> {
    const s = store();
    const d = s.dossiers.find((x) => x.reference === ref);
    return d ? this.getDossier(d.id) : null;
  }

  async createDossier(input: {
    clientId: string;
    vehiculeMarque?: string;
    vehiculeModele?: string;
    cahierDesCharges?: string;
    montantEstime?: number;
    margeEstimee?: number;
  }): Promise<Dossier> {
    const s = store();
    const seq = s.dossiers.length + 1;
    const d: Dossier = {
      id: uid(),
      reference: `GA-2026-${String(seq).padStart(4, '0')}`,
      statut: 'BRIEF',
      clientId: input.clientId,
      commissaireId: null,
      vehiculeMarque: input.vehiculeMarque ?? null,
      vehiculeModele: input.vehiculeModele ?? null,
      vehiculeCriteres: {},
      cahierDesCharges: input.cahierDesCharges ?? null,
      montantEstime: input.montantEstime ?? null,
      margeEstimee: input.margeEstimee ?? null,
      margeReelle: null,
      prochaineAction: 'Compléter le brief & valider le cahier des charges',
      createdAt: now(),
      updatedAt: now(),
    };
    s.dossiers.push(d);
    return d;
  }

  async updateDossier(id: string, patch: Partial<Dossier>): Promise<Dossier> {
    const s = store();
    const d = s.dossiers.find((x) => x.id === id);
    if (!d) throw new Error('Dossier introuvable');
    Object.assign(d, patch, { updatedAt: now() });
    return d;
  }

  async transitionDossier(id: string, to: DossierStatut, acteur: Acteur, note?: string): Promise<Dossier> {
    const s = store();
    const d = s.dossiers.find((x) => x.id === id);
    if (!d) throw new Error('Dossier introuvable');
    const def = assertTransition(d.statut, to, acteur); // garde HITL (lève si interdit)
    const de = d.statut;
    d.statut = to;
    d.updatedAt = now();
    s.journal.push({
      id: uid(),
      dossierId: id,
      acteurId: null,
      acteurType: acteur,
      action: 'TRANSITION_STATUT',
      details: { de, vers: to, transition: def.action, note: note ?? null },
      horodatage: now(),
    });
    return d;
  }

  async createReperage(input: {
    dossierId: string;
    source: Reperage['source'];
    lien?: string;
    annonceData?: Record<string, unknown>;
    provenanceOrigine?: string;
    rapportCommissaire?: string;
    rapportClient?: string;
  }): Promise<Reperage> {
    const s = store();
    const r: Reperage = {
      id: uid(),
      dossierId: input.dossierId,
      source: input.source,
      statut: 'BRUT',
      lien: input.lien ?? null,
      annonceData: input.annonceData ?? {},
      provenanceOrigine: input.provenanceOrigine ?? null,
      provenanceDate: now(),
      rapportCommissaire: input.rapportCommissaire ?? null,
      rapportClient: input.rapportClient ?? null,
      selectionne: false,
      enLigne: true,
      createdAt: now(),
      updatedAt: now(),
    };
    s.reperages.push(r);
    return r;
  }

  async setReperageSelection(id: string, selectionne: boolean): Promise<Reperage> {
    const s = store();
    const r = s.reperages.find((x) => x.id === id);
    if (!r) throw new Error('Repérage introuvable');
    r.selectionne = selectionne;
    r.statut = selectionne ? 'RETENU' : 'BRUT';
    r.updatedAt = now();
    return r;
  }

  async setReperageEnLigne(id: string, enLigne: boolean): Promise<Reperage> {
    const s = store();
    const r = s.reperages.find((x) => x.id === id);
    if (!r) throw new Error('Repérage introuvable');
    r.enLigne = enLigne;
    r.updatedAt = now();
    return r;
  }

  async updateReperage(id: string, patch: Partial<Reperage>): Promise<Reperage> {
    const s = store();
    const r = s.reperages.find((x) => x.id === id);
    if (!r) throw new Error('Repérage introuvable');
    Object.assign(r, patch, { updatedAt: now() });
    return r;
  }

  async createProposition(input: {
    dossierId: string;
    reperageId?: string;
    titre?: string;
    description?: string;
    photos?: string[];
    scene3dUrl?: string;
  }): Promise<Proposition> {
    const s = store();
    const p: Proposition = {
      id: uid(),
      dossierId: input.dossierId,
      reperageId: input.reperageId ?? null,
      titre: input.titre ?? null,
      description: input.description ?? null,
      photos: input.photos ?? [],
      scene3dUrl: input.scene3dUrl ?? null,
      ficheInspection: {},
      dossierProvenance: {},
      createdAt: now(),
      updatedAt: now(),
    };
    s.propositions.push(p);
    return p;
  }

  async setPublication(propositionId: string, dossierId: string, publiee: boolean): Promise<Publication> {
    const s = store();
    let pub = s.publications.find((p) => p.propositionId === propositionId);
    if (!pub) {
      pub = { id: uid(), propositionId, dossierId, statut: 'BROUILLON', publieAt: null, depublieAt: null, createdAt: now(), updatedAt: now() };
      s.publications.push(pub);
    }
    pub.statut = publiee ? 'PUBLIEE' : 'DEPUBLIEE';
    pub.publieAt = publiee ? now() : pub.publieAt;
    pub.depublieAt = publiee ? null : now();
    pub.updatedAt = now();
    return pub;
  }

  async listPublications(): Promise<PropositionPubliee[]> {
    const s = store();
    return s.publications
      .filter((p) => p.statut === 'PUBLIEE')
      .map((pub) => {
        const prop = s.propositions.find((x) => x.id === pub.propositionId)!;
        const dossier = s.dossiers.find((d) => d.id === pub.dossierId)!;
        return { ...prop, publication: pub, dossierReference: dossier?.reference ?? '' };
      })
      .filter((x) => !!x.id);
  }

  async createDevis(input: {
    dossierId: string;
    lignes: Devis['lignes'];
    margeSimulee?: number;
    tvaRegime?: string;
  }): Promise<Devis> {
    const s = store();
    const montantTotal = input.lignes.reduce((acc, l) => acc + l.montant, 0);
    const dv: Devis = {
      id: uid(),
      dossierId: input.dossierId,
      statut: 'BROUILLON',
      lignes: input.lignes,
      montantTotal,
      margeSimulee: input.margeSimulee ?? null,
      margeReelle: null,
      tvaRegime: input.tvaRegime ?? 'TVA_MARGE',
      valideAt: null,
      createdAt: now(),
      updatedAt: now(),
    };
    s.devis.push(dv);
    return dv;
  }

  async validateDevis(id: string): Promise<Devis> {
    const s = store();
    const dv = s.devis.find((x) => x.id === id);
    if (!dv) throw new Error('Devis introuvable');
    dv.statut = 'VALIDE';
    dv.valideAt = now();
    dv.updatedAt = now();
    return dv;
  }

  async createEcheance(input: {
    dossierId: string;
    devisId?: string;
    type: Echeance['type'];
    montant: number;
    dateEcheance?: string;
  }): Promise<Echeance> {
    const s = store();
    const sequestre = s.comptes.find((c) => c.type === 'SEQUESTRE');
    const e: Echeance = {
      id: uid(),
      dossierId: input.dossierId,
      devisId: input.devisId ?? null,
      type: input.type,
      montant: input.montant,
      dateEcheance: input.dateEcheance ?? null,
      dateReelle: null,
      compteId: sequestre?.id ?? null,
      createdAt: now(),
    };
    s.echeances.push(e);
    return e;
  }

  async listComptes(): Promise<CompteBancaire[]> {
    return store().comptes;
  }
  async listMouvements(): Promise<Mouvement[]> {
    return store().mouvements;
  }
  async listPaiements(dossierId?: string): Promise<Paiement[]> {
    const s = store();
    return dossierId ? s.paiements.filter((p) => p.dossierId === dossierId) : s.paiements;
  }

  async enregistrerEncaissement(input: {
    dossierId: string;
    echeanceId?: string;
    type: Paiement['type'];
    montant: number;
    compteType: CompteBancaire['type'];
  }): Promise<Paiement> {
    const s = store();
    const compte = s.comptes.find((c) => c.type === input.compteType);
    const p: Paiement = {
      id: uid(),
      dossierId: input.dossierId,
      echeanceId: input.echeanceId ?? null,
      type: input.type,
      statut: input.type === 'DECAISSEMENT_VENDEUR' || input.type === 'COMMISSION' ? 'DECAISSE' : 'RECU',
      montant: input.montant,
      compteId: compte?.id ?? null,
      datePrevue: null,
      dateReelle: now(),
      referenceExterne: `mock_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now(),
    };
    s.paiements.push(p);
    // Mouvement + maj solde (sens selon type)
    const sens: Mouvement['sens'] = p.statut === 'DECAISSE' ? 'DEBIT' : 'CREDIT';
    const signe = sens === 'CREDIT' ? 1 : -1;
    if (compte) compte.solde = Number(compte.solde) + signe * input.montant;
    s.mouvements.push({
      id: uid(),
      compteId: compte?.id ?? '',
      dossierId: input.dossierId,
      paiementId: p.id,
      montant: signe * input.montant,
      sens,
      libelle: `${input.type} (séquestre/${input.compteType})`,
      rapproche: false,
      horodatage: now(),
    });
    // Marque l'échéance comme réglée
    if (input.echeanceId) {
      const e = s.echeances.find((x) => x.id === input.echeanceId);
      if (e) e.dateReelle = now();
    }
    return p;
  }

  async createDocument(input: {
    dossierId: string;
    type: DocumentGenere['type'];
    trameId?: string;
    fichierUrl?: string;
    donnees?: Record<string, unknown>;
  }): Promise<DocumentGenere> {
    const s = store();
    const doc: DocumentGenere = {
      id: uid(),
      dossierId: input.dossierId,
      type: input.type,
      trameId: input.trameId ?? null,
      fichierUrl: input.fichierUrl ?? null,
      donnees: input.donnees ?? {},
      genereAt: now(),
      createdAt: now(),
    };
    s.documents.push(doc);
    return doc;
  }

  async createMessage(input: {
    dossierId: string;
    auteur: 'CLIENT' | 'COMMISSAIRE';
    contenu: string;
    auteurId?: string;
  }): Promise<Message> {
    const s = store();
    const m: Message = {
      id: uid(),
      dossierId: input.dossierId,
      auteur: input.auteur,
      auteurId: input.auteurId ?? null,
      contenu: input.contenu,
      lu: false,
      createdAt: now(),
    };
    s.messages.push(m);
    return m;
  }

  async listTrames(type?: Trame['type']): Promise<Trame[]> {
    const s = store();
    return type ? s.trames.filter((t) => t.type === type) : s.trames;
  }
  async updateTrame(id: string, patch: Partial<Trame>): Promise<Trame> {
    const s = store();
    const t = s.trames.find((x) => x.id === id);
    if (!t) throw new Error('Trame introuvable');
    Object.assign(t, patch, { updatedAt: now() });
    return t;
  }
  async listSources(): Promise<SourceScrap[]> {
    return store().sources;
  }
  async listParametres(): Promise<Parametre[]> {
    return store().parametres;
  }
  async listUsers(): Promise<AppUser[]> {
    return store().users;
  }

  async addJournal(input: {
    dossierId?: string;
    acteurType: 'COMMISSAIRE' | 'CLIENT' | 'SYSTEME';
    action: string;
    details?: Record<string, unknown>;
  }): Promise<JournalEntry> {
    const s = store();
    const j: JournalEntry = {
      id: uid(),
      dossierId: input.dossierId ?? null,
      acteurId: null,
      acteurType: input.acteurType,
      action: input.action,
      details: input.details ?? {},
      horodatage: now(),
    };
    s.journal.push(j);
    return j;
  }

  async kpis(): Promise<KpisPilotage> {
    const s = store();
    const parStatut = Object.fromEntries(
      (['BRIEF', 'REPERAGE', 'PROPOSITIONS', 'VALIDATION', 'ACQUISITION', 'PAIEMENT', 'LIVRAISON', 'CLOS'] as DossierStatut[]).map(
        (st) => [st, s.dossiers.filter((d) => d.statut === st).length],
      ),
    ) as Record<DossierStatut, number>;
    const actifs = s.dossiers.filter((d) => d.statut !== 'CLOS');
    return {
      parStatut,
      totalDossiers: s.dossiers.length,
      encoursEstime: actifs.reduce((a, d) => a + (d.montantEstime ?? 0), 0),
      margeSimuleeTotale: actifs.reduce((a, d) => a + (d.margeEstimee ?? 0), 0),
      margeReelleTotale: s.dossiers.reduce((a, d) => a + (d.margeReelle ?? 0), 0),
      echeancesAVenir: s.echeances.filter((e) => !e.dateReelle),
      soldesComptes: s.comptes,
    };
  }

  async listClients(): Promise<Client[]> {
    return store().clients;
  }
  async createClient(input: { nom: string; email: string; telephone?: string; langue?: 'FR' | 'EN' }): Promise<Client> {
    const s = store();
    const c: Client = {
      id: uid(),
      authUserId: null,
      nom: input.nom,
      email: input.email,
      telephone: input.telephone ?? null,
      langue: input.langue ?? 'FR',
      createdAt: now(),
      updatedAt: now(),
    };
    s.clients.push(c);
    return c;
  }
}
