// ============================================================================
// Galerie Apanage — Couche data : CONTRAT UNIQUE (cf. specs §2, §4, §5)
// ----------------------------------------------------------------------------
// Une seule interface `DataSource`, deux implémentations interchangeables :
//   - MockDataSource     : store mémoire seedé (démarrage SANS clé).
//   - SupabaseDataSource  : Postgres + RLS (quand Supabase est configuré).
// L'UI ne consomme QUE des types de domaine (src/domain/types), jamais le SQL.
// Les transitions de statut passent par transitionDossier (garde HITL + audit).
// ============================================================================

import { Acteur } from '@/domain/statut';
import {
  AppUser,
  Client,
  CompteBancaire,
  CompteType,
  Devis,
  DevisLigne,
  DocumentGenere,
  Dossier,
  DossierStatut,
  DocumentType,
  Echeance,
  EcheanceType,
  JournalEntry,
  Message,
  Mouvement,
  Paiement,
  PaiementType,
  Parametre,
  Proposition,
  Publication,
  Reperage,
  ReperageSource,
  SourceScrap,
  Trame,
  TrameType,
} from '@/domain/types';

// --- Types de vue (agrégats lus par les écrans) -----------------------------

export type DossierAvecClient = Dossier & { client: Client };

export interface DossierComplet extends DossierAvecClient {
  reperages: Reperage[];
  propositions: Proposition[];
  publications: Publication[];
  devis: Devis[];
  echeances: Echeance[];
  paiements: Paiement[];
  documents: DocumentGenere[];
  messages: Message[];
  journal: JournalEntry[];
}

export type PropositionPubliee = Proposition & {
  publication: Publication;
  dossierReference: string;
};

export interface KpisPilotage {
  parStatut: Record<DossierStatut, number>;
  totalDossiers: number;
  encoursEstime: number; // somme des montants estimés (dossiers actifs)
  margeSimuleeTotale: number;
  margeReelleTotale: number;
  echeancesAVenir: Echeance[];
  soldesComptes: CompteBancaire[];
}

// --- Contrat DataSource -----------------------------------------------------

export interface DataSource {
  readonly mode: 'mock' | 'supabase';

  // Dossiers (objet pivot)
  listDossiers(): Promise<DossierAvecClient[]>;
  getDossier(id: string): Promise<DossierComplet | null>;
  getDossierByReference(ref: string): Promise<DossierComplet | null>;
  createDossier(input: {
    clientId: string;
    vehiculeMarque?: string;
    vehiculeModele?: string;
    cahierDesCharges?: string;
    montantEstime?: number;
    margeEstimee?: number;
  }): Promise<Dossier>;
  updateDossier(
    id: string,
    patch: Partial<
      Pick<
        Dossier,
        | 'vehiculeMarque'
        | 'vehiculeModele'
        | 'vehiculeCriteres'
        | 'cahierDesCharges'
        | 'montantEstime'
        | 'margeEstimee'
        | 'margeReelle'
        | 'prochaineAction'
        | 'commissaireId'
      >
    >,
  ): Promise<Dossier>;
  /** Transition de statut avec garde HITL + journalisation (human-in-the-loop). */
  transitionDossier(id: string, to: DossierStatut, acteur: Acteur, note?: string): Promise<Dossier>;

  // Repérages (Constat)
  createReperage(input: {
    dossierId: string;
    source: ReperageSource;
    lien?: string;
    annonceData?: Record<string, unknown>;
    provenanceOrigine?: string;
    rapportCommissaire?: string;
    rapportClient?: string;
  }): Promise<Reperage>;
  setReperageSelection(id: string, selectionne: boolean): Promise<Reperage>;
  setReperageEnLigne(id: string, enLigne: boolean): Promise<Reperage>;
  updateReperage(
    id: string,
    patch: Partial<
      Pick<Reperage, 'rapportCommissaire' | 'rapportClient' | 'statut' | 'annonceData' | 'provenanceOrigine'>
    >,
  ): Promise<Reperage>;

  // Propositions / Publications
  createProposition(input: {
    dossierId: string;
    reperageId?: string;
    titre?: string;
    description?: string;
    photos?: string[];
    scene3dUrl?: string;
  }): Promise<Proposition>;
  setPublication(propositionId: string, dossierId: string, publiee: boolean): Promise<Publication>;
  listPublications(): Promise<PropositionPubliee[]>;

  // Devis (Acquisition)
  createDevis(input: {
    dossierId: string;
    lignes: DevisLigne[];
    margeSimulee?: number;
    tvaRegime?: string;
  }): Promise<Devis>;
  validateDevis(id: string): Promise<Devis>;

  // Échéancier & finance (lecture ; écritures finance via service_role)
  createEcheance(input: {
    dossierId: string;
    devisId?: string;
    type: EcheanceType;
    montant: number;
    dateEcheance?: string;
  }): Promise<Echeance>;
  listComptes(): Promise<CompteBancaire[]>;
  listMouvements(): Promise<Mouvement[]>;
  listPaiements(dossierId?: string): Promise<Paiement[]>;
  /** Écriture SÉQUESTRE (fonds clients) : crée paiement RECU + mouvement + maj solde.
   *  En mode Supabase, passe par le service_role (la RLS interdit ces écritures
   *  en session navigateur — cloisonnement garanti, cf. migration 06). */
  enregistrerEncaissement(input: {
    dossierId: string;
    echeanceId?: string;
    type: PaiementType;
    montant: number;
    compteType: CompteType;
  }): Promise<Paiement>;

  // Documents (papeterie)
  createDocument(input: {
    dossierId: string;
    type: DocumentType;
    trameId?: string;
    fichierUrl?: string;
    donnees?: Record<string, unknown>;
  }): Promise<DocumentGenere>;

  // Messagerie
  createMessage(input: {
    dossierId: string;
    auteur: 'CLIENT' | 'COMMISSAIRE';
    contenu: string;
    auteurId?: string;
  }): Promise<Message>;

  // Base DA / réglages
  listTrames(type?: TrameType): Promise<Trame[]>;
  updateTrame(id: string, patch: Partial<Pick<Trame, 'contenu' | 'nom' | 'actif'>>): Promise<Trame>;
  listSources(): Promise<SourceScrap[]>;
  listParametres(): Promise<Parametre[]>;
  listUsers(): Promise<AppUser[]>;

  // Journal / audit (traçabilité HITL des validations non-transition)
  addJournal(input: {
    dossierId?: string;
    acteurType: 'COMMISSAIRE' | 'CLIENT' | 'SYSTEME';
    action: string;
    details?: Record<string, unknown>;
  }): Promise<JournalEntry>;

  // Pilotage
  kpis(): Promise<KpisPilotage>;

  // Clients
  listClients(): Promise<Client[]>;
  createClient(input: { nom: string; email: string; telephone?: string; langue?: 'FR' | 'EN' }): Promise<Client>;
}
