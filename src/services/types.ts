// ============================================================================
// Galerie Apanage — Couche de services : INTERFACES COMMUNES (cf. specs §6)
// ----------------------------------------------------------------------------
// Un connecteur par tâche, interface commune, interchangeable & mockable.
// Tant qu'une clé manque → implémentation mock (placeholders déterministes).
// Les implémentations réelles sont des branchements progressifs (TODO marqués).
// Tous les services sont conçus pour tourner CÔTÉ SERVEUR (Edge Functions /
// Server Actions) afin que les clés ne soient jamais exposées au client.
// ============================================================================

import { TrameType } from '@/domain/types';

/** Métadonnée commune : chaque service sait dire s'il est mock ou réel. */
export interface ServiceMeta {
  readonly name: string;
  readonly mode: 'mock' | 'real';
  readonly provider: string;
}

// --- 1. LLM : intake + génération de texte ----------------------------------
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
export interface LLMService extends ServiceMeta {
  /** Intake conversationnel (questions IA, réponses manuelles). */
  chat(input: { messages: ChatMessage[]; system?: string }): Promise<{ reply: string }>;
  /** Génération d'un artefact texte à partir d'une trame DA + contexte Dossier. */
  generateFromTrame(input: {
    trameType: TrameType;
    trameContenu: string;
    contexte: Record<string, unknown>;
  }): Promise<{ texte: string }>;
}

// --- 2. ASR : transcription + diarisation FR --------------------------------
export interface TranscriptSegment {
  speaker: string;
  text: string;
  start: number; // secondes
  end: number;
}
export interface ASRService extends ServiceMeta {
  transcribe(input: { audioUrl?: string; audioBase64?: string }): Promise<{
    texte: string;
    segments: TranscriptSegment[];
  }>;
}

// --- 3. Image : génération / retouche de visuels produit --------------------
export interface ImageService extends ServiceMeta {
  generate(input: { prompt: string; ratio?: '1:1' | '16:9' | '4:3' }): Promise<{ url: string }>;
  retouch(input: { sourceUrl: string; prompt: string }): Promise<{ url: string }>;
}

// --- 4. Scraper : extraction d'annonces (whitelist) -------------------------
export interface AnnonceExtraite {
  url: string;
  titre: string;
  prix: number | null;
  devise: string | null;
  marque: string | null;
  modele: string | null;
  annee: number | null;
  kilometrage: number | null;
  photos: string[];
  provenanceOrigine: string;
  brut: Record<string, unknown>;
}
export interface ScraperService extends ServiceMeta {
  /** Extrait une annonce depuis un lien collé (canal prioritaire & sûr). */
  extract(input: { url: string }): Promise<AnnonceExtraite>;
  /** Recherche structurée sur des sources whitelistées (complément encadré). */
  search(input: {
    sources: string[];
    criteres: Record<string, unknown>;
  }): Promise<AnnonceExtraite[]>;
}

// --- 5. 3D : pipeline Gaussian Splatting / scènes GLB -----------------------
export interface ThreeDService extends ServiceMeta {
  generateScene(input: { photos: string[]; label?: string }): Promise<{
    glbUrl: string;
    previewUrl: string;
  }>;
}

// --- 6. Banking : open banking (rapprochement) ------------------------------
export interface BankTransaction {
  id: string;
  date: string;
  montant: number; // signé : + crédit / - débit
  libelle: string;
  contrepartie: string | null;
}
export interface BankingService extends ServiceMeta {
  listTransactions(input: { compteRef: string; since?: string }): Promise<BankTransaction[]>;
}

// --- 7. Payment / Séquestre : encaissement, décaissement, wallets ségrégués -
export interface PaymentIntent {
  id: string;
  statut: 'CREE' | 'EN_ATTENTE' | 'RECU' | 'DECAISSE' | 'ECHEC';
  montant: number;
  checkoutUrl?: string;
  reference: string;
}
export interface PaymentService extends ServiceMeta {
  /** Encaisse vers le séquestre (wallet ségrégué) — fonds clients cloisonnés. */
  createEscrowPayment(input: {
    montant: number;
    dossierRef: string;
    type: 'ACOMPTE' | 'SOLDE';
  }): Promise<PaymentIntent>;
  /** Décaissement depuis le séquestre vers le vendeur. */
  releaseToVendor(input: { montant: number; dossierRef: string; iban?: string }): Promise<PaymentIntent>;
  /** Libère les honoraires/commission vers le compte d'exploitation. */
  releaseCommission(input: { montant: number; dossierRef: string }): Promise<PaymentIntent>;
  getStatus(id: string): Promise<PaymentIntent>;
}

// --- 8. Email : magic-link + notifications ----------------------------------
export interface EmailService extends ServiceMeta {
  /** Magic-link (NB : Supabase Auth le gère nativement ; utile pour relais/relance). */
  sendMagicLink(input: { email: string; redirectTo: string }): Promise<{ sent: boolean }>;
  sendNotification(input: { to: string; sujet: string; corps: string }): Promise<{ sent: boolean }>;
}

// --- 9. Storage : photos / PDF / assets 3D ----------------------------------
export interface StorageService extends ServiceMeta {
  upload(input: {
    bucket: 'photos' | 'assets3d' | 'documents';
    path: string;
    data: ArrayBuffer | Uint8Array | string;
    contentType?: string;
  }): Promise<{ url: string }>;
  getSignedUrl(input: {
    bucket: 'photos' | 'assets3d' | 'documents';
    path: string;
    expiresIn?: number;
  }): Promise<{ url: string }>;
}

/** Agrégat de tous les services (injecté côté serveur). */
export interface Services {
  llm: LLMService;
  asr: ASRService;
  image: ImageService;
  scraper: ScraperService;
  threed: ThreeDService;
  banking: BankingService;
  payment: PaymentService;
  email: EmailService;
  storage: StorageService;
}
