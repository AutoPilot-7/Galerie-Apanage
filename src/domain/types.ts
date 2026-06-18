// ============================================================================
// Galerie Apanage — Types de domaine (miroir EXACT des enums SQL, cf. specs §5)
// ----------------------------------------------------------------------------
// Source de vérité du modèle = migrations Supabase. Ici on expose des unions de
// littéraux + des constantes ergonomiques pour l'UI et la couche de services.
// Les types « row » bruts viennent de src/lib/supabase/database.types.ts
// (générés par `npm run db:types`). La couche data (src/data) mappe ces rows
// vers les types de domaine ci-dessous afin que l'UI ne dépende jamais du SQL.
// ============================================================================

// --- Enums (1:1 avec 20260618120001_enums.sql) -----------------------------

export const DOSSIER_STATUTS = [
  'BRIEF',
  'REPERAGE',
  'PROPOSITIONS',
  'VALIDATION',
  'ACQUISITION',
  'PAIEMENT',
  'LIVRAISON',
  'CLOS',
] as const;
export type DossierStatut = (typeof DOSSIER_STATUTS)[number];

export type ReperageSource = 'SCRAP' | 'LIEN' | 'MANUEL';
export type ReperageStatut = 'BRUT' | 'RETENU' | 'REJETE';
export type DevisStatut = 'BROUILLON' | 'VALIDE';
export type EcheanceType = 'ACOMPTE' | 'SOLDE';
export type PaiementType = 'ACOMPTE' | 'SOLDE' | 'DECAISSEMENT_VENDEUR' | 'COMMISSION';
export type PaiementStatut = 'EN_ATTENTE' | 'RECU' | 'DECAISSE';
export type CompteType = 'COURANT_PRO' | 'SEQUESTRE' | 'DECAISSEMENT';
export type DocumentType =
  | 'DEVIS'
  | 'DOCUMENT_REMISE'
  | 'LETTRE_REMISE'
  | 'CERTIFICAT_IMPORT'
  | 'CARTE_VISITE'
  | 'CARTON_INVITATION'
  | 'ENVELOPPE';
export type TrameType =
  | 'CAHIER_DES_CHARGES'
  | 'RAPPORT_COMMISSAIRE'
  | 'RAPPORT_CLIENT'
  | 'ANNONCE'
  | 'PHOTO'
  | 'DEVIS';
export type AuteurMessage = 'CLIENT' | 'COMMISSAIRE';
export type UserRole = 'COMMISSAIRE' | 'ADMIN';
export type Langue = 'FR' | 'EN';
export type PublicationStatut = 'BROUILLON' | 'PUBLIEE' | 'DEPUBLIEE';

// --- Entités de domaine (clés + relations, cf. specs §2 & §5) ---------------

export interface Client {
  id: string;
  authUserId: string | null;
  nom: string;
  email: string;
  telephone: string | null;
  langue: Langue;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  id: string;
  email: string;
  nom: string | null;
  role: UserRole;
  createdAt: string;
}

/** Objet pivot. Le tunnel Demande → Constat → Acquisition = le champ `statut`. */
export interface Dossier {
  id: string;
  reference: string;
  statut: DossierStatut;
  clientId: string;
  commissaireId: string | null;
  vehiculeMarque: string | null;
  vehiculeModele: string | null;
  vehiculeCriteres: Record<string, unknown>;
  cahierDesCharges: string | null;
  montantEstime: number | null;
  margeEstimee: number | null;
  margeReelle: number | null;
  prochaineAction: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Trame {
  id: string;
  type: TrameType;
  nom: string;
  contenu: string;
  version: number;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reperage {
  id: string;
  dossierId: string;
  source: ReperageSource;
  statut: ReperageStatut;
  lien: string | null;
  annonceData: Record<string, unknown>;
  provenanceOrigine: string | null;
  provenanceDate: string | null;
  rapportCommissaire: string | null;
  rapportClient: string | null;
  selectionne: boolean;
  enLigne: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Proposition {
  id: string;
  dossierId: string;
  reperageId: string | null;
  titre: string | null;
  description: string | null;
  photos: string[];
  scene3dUrl: string | null;
  ficheInspection: Record<string, unknown>;
  dossierProvenance: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Publication {
  id: string;
  propositionId: string;
  dossierId: string;
  statut: PublicationStatut;
  publieAt: string | null;
  depublieAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DevisLigne {
  libelle: string;
  categorie: 'ACHAT' | 'TRANSPORT' | 'IMPORT_DOUANE' | 'HONORAIRES' | 'AUTRE';
  montant: number;
}

export interface Devis {
  id: string;
  dossierId: string;
  statut: DevisStatut;
  lignes: DevisLigne[];
  montantTotal: number | null;
  margeSimulee: number | null;
  margeReelle: number | null;
  tvaRegime: string | null;
  valideAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompteBancaire {
  id: string;
  type: CompteType;
  libelle: string;
  iban: string | null;
  solde: number;
  devise: string;
  createdAt: string;
}

export interface Echeance {
  id: string;
  dossierId: string;
  devisId: string | null;
  type: EcheanceType;
  montant: number;
  dateEcheance: string | null;
  dateReelle: string | null;
  compteId: string | null;
  createdAt: string;
}

export interface Paiement {
  id: string;
  dossierId: string;
  echeanceId: string | null;
  type: PaiementType;
  statut: PaiementStatut;
  montant: number;
  compteId: string | null;
  datePrevue: string | null;
  dateReelle: string | null;
  referenceExterne: string | null;
  createdAt: string;
}

export interface Mouvement {
  id: string;
  compteId: string;
  dossierId: string | null;
  paiementId: string | null;
  montant: number;
  sens: 'CREDIT' | 'DEBIT';
  libelle: string | null;
  rapproche: boolean;
  horodatage: string;
}

export interface DocumentGenere {
  id: string;
  dossierId: string;
  type: DocumentType;
  trameId: string | null;
  fichierUrl: string | null;
  donnees: Record<string, unknown>;
  genereAt: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  dossierId: string;
  auteur: AuteurMessage;
  auteurId: string | null;
  contenu: string;
  lu: boolean;
  createdAt: string;
}

export interface SourceScrap {
  id: string;
  nom: string;
  urlBase: string;
  domaine: string | null;
  actif: boolean;
  createdAt: string;
}

export interface Parametre {
  id: string;
  cle: string;
  valeur: Record<string, unknown>;
  updatedAt: string;
  updatedBy: string | null;
}

/** Audit immuable des validations commissaire (traçabilité human-in-the-loop). */
export interface JournalEntry {
  id: string;
  dossierId: string | null;
  acteurId: string | null;
  acteurType: 'COMMISSAIRE' | 'CLIENT' | 'SYSTEME' | null;
  action: string;
  details: Record<string, unknown>;
  horodatage: string;
}
