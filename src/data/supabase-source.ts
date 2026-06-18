// ============================================================================
// Galerie Apanage — SupabaseDataSource : Postgres + RLS (cf. specs §2, §4, §5)
// ----------------------------------------------------------------------------
// Implémentation réelle du contrat `DataSource`. Lit/écrit via le client
// Supabase serveur (session navigateur → RLS). Les ÉCRITURES finance / séquestre
// (échéances, comptes, paiements, mouvements) passent par le client service_role
// (`createAdminClient`) car la RLS interdit ces écritures en session navigateur.
//
// L'UI ne consomme QUE des types de domaine (camelCase) : ce module mappe les
// lignes SQL (snake_case) vers le domaine, et inversement pour les inserts.
// Les transitions de statut réutilisent la garde HITL du domaine ; le trigger
// SQL journalise la transition (on n'insère PAS de doublon dans `journal`).
// ============================================================================

import 'server-only';

import { assertTransition, Acteur } from '@/domain/statut';
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
  ReperageStatut,
  SourceScrap,
  Trame,
  TrameType,
} from '@/domain/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database, Json, Tables, TablesUpdate } from '@/lib/supabase/database.types';
import {
  DataSource,
  DossierAvecClient,
  DossierComplet,
  KpisPilotage,
  PropositionPubliee,
} from './types';

// --- Helpers de conversion --------------------------------------------------

/** Coerce un `numeric`/`number` SQL (parfois renvoyé en string) vers number. */
function num(v: number | string | null | undefined, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  return Number(v);
}

/** Coerce un `numeric` SQL nullable → number | null. */
function numOrNull(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return Number(v);
}

/** jsonb objet → Record<string, unknown> (sécurise les valeurs scalaires/null). */
function asRecord(v: Json | null | undefined): Record<string, unknown> {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

/** jsonb array de strings → string[] (champ `photos`). */
function asStringArray(v: Json | null | undefined): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === 'string');
  }
  return [];
}

/** jsonb `lignes` du devis → DevisLigne[]. */
function asDevisLignes(v: Json | null | undefined): DevisLigne[] {
  if (!Array.isArray(v)) return [];
  return v.map((l) => {
    const o = asRecord(l as Json);
    return {
      libelle: String(o.libelle ?? ''),
      categorie: (o.categorie ?? 'AUTRE') as DevisLigne['categorie'],
      montant: num(o.montant as number | string | null | undefined),
    };
  });
}

// ============================================================================
// Mappers row (snake_case) → domaine (camelCase)
// ============================================================================

function mapClient(r: Tables<'client'>): Client {
  return {
    id: r.id,
    authUserId: r.auth_user_id,
    nom: r.nom,
    email: r.email,
    telephone: r.telephone,
    langue: r.langue,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapAppUser(r: Tables<'app_user'>): AppUser {
  return {
    id: r.id,
    email: r.email,
    nom: r.nom,
    role: r.role,
    createdAt: r.created_at,
  };
}

function mapDossier(r: Tables<'dossier'>): Dossier {
  return {
    id: r.id,
    reference: r.reference,
    statut: r.statut,
    clientId: r.client_id,
    commissaireId: r.commissaire_id,
    vehiculeMarque: r.vehicule_marque,
    vehiculeModele: r.vehicule_modele,
    vehiculeCriteres: asRecord(r.vehicule_criteres),
    cahierDesCharges: r.cahier_des_charges,
    montantEstime: numOrNull(r.montant_estime),
    margeEstimee: numOrNull(r.marge_estimee),
    margeReelle: numOrNull(r.marge_reelle),
    prochaineAction: r.prochaine_action,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapTrame(r: Tables<'trame'>): Trame {
  return {
    id: r.id,
    type: r.type,
    nom: r.nom,
    contenu: r.contenu,
    version: num(r.version),
    actif: r.actif,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapReperage(r: Tables<'reperage'>): Reperage {
  return {
    id: r.id,
    dossierId: r.dossier_id,
    source: r.source,
    statut: r.statut,
    lien: r.lien,
    annonceData: asRecord(r.annonce_data),
    provenanceOrigine: r.provenance_origine,
    provenanceDate: r.provenance_date,
    rapportCommissaire: r.rapport_commissaire,
    rapportClient: r.rapport_client,
    selectionne: r.selectionne,
    enLigne: r.en_ligne,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapProposition(r: Tables<'proposition'>): Proposition {
  return {
    id: r.id,
    dossierId: r.dossier_id,
    reperageId: r.reperage_id,
    titre: r.titre,
    description: r.description,
    photos: asStringArray(r.photos),
    scene3dUrl: r.scene_3d_url,
    ficheInspection: asRecord(r.fiche_inspection),
    dossierProvenance: asRecord(r.dossier_provenance),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapPublication(r: Tables<'publication'>): Publication {
  return {
    id: r.id,
    propositionId: r.proposition_id,
    dossierId: r.dossier_id,
    statut: r.statut,
    publieAt: r.publie_at,
    depublieAt: r.depublie_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapDevis(r: Tables<'devis'>): Devis {
  return {
    id: r.id,
    dossierId: r.dossier_id,
    statut: r.statut,
    lignes: asDevisLignes(r.lignes),
    montantTotal: numOrNull(r.montant_total),
    margeSimulee: numOrNull(r.marge_simulee),
    margeReelle: numOrNull(r.marge_reelle),
    tvaRegime: r.tva_regime,
    valideAt: r.valide_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapCompte(r: Tables<'compte_bancaire'>): CompteBancaire {
  return {
    id: r.id,
    type: r.type,
    libelle: r.libelle,
    iban: r.iban,
    solde: num(r.solde),
    devise: r.devise,
    createdAt: r.created_at,
  };
}

function mapEcheance(r: Tables<'echeance'>): Echeance {
  return {
    id: r.id,
    dossierId: r.dossier_id,
    devisId: r.devis_id,
    type: r.type,
    montant: num(r.montant),
    dateEcheance: r.date_echeance,
    dateReelle: r.date_reelle,
    compteId: r.compte_id,
    createdAt: r.created_at,
  };
}

function mapPaiement(r: Tables<'paiement'>): Paiement {
  return {
    id: r.id,
    dossierId: r.dossier_id,
    echeanceId: r.echeance_id,
    type: r.type,
    statut: r.statut,
    montant: num(r.montant),
    compteId: r.compte_id,
    datePrevue: r.date_prevue,
    dateReelle: r.date_reelle,
    referenceExterne: r.reference_externe,
    createdAt: r.created_at,
  };
}

function mapMouvement(r: Tables<'mouvement'>): Mouvement {
  return {
    id: r.id,
    compteId: r.compte_id,
    dossierId: r.dossier_id,
    paiementId: r.paiement_id,
    montant: num(r.montant),
    sens: r.sens as Mouvement['sens'],
    libelle: r.libelle,
    rapproche: r.rapproche,
    horodatage: r.horodatage,
  };
}

function mapDocument(r: Tables<'document'>): DocumentGenere {
  return {
    id: r.id,
    dossierId: r.dossier_id,
    type: r.type,
    trameId: r.trame_id,
    fichierUrl: r.fichier_url,
    donnees: asRecord(r.donnees),
    genereAt: r.genere_at,
    createdAt: r.created_at,
  };
}

function mapMessage(r: Tables<'message'>): Message {
  return {
    id: r.id,
    dossierId: r.dossier_id,
    auteur: r.auteur,
    auteurId: r.auteur_id,
    contenu: r.contenu,
    lu: r.lu,
    createdAt: r.created_at,
  };
}

function mapSource(r: Tables<'source_scrap'>): SourceScrap {
  return {
    id: r.id,
    nom: r.nom,
    urlBase: r.url_base,
    domaine: r.domaine,
    actif: r.actif,
    createdAt: r.created_at,
  };
}

function mapParametre(r: Tables<'parametre'>): Parametre {
  return {
    id: r.id,
    cle: r.cle,
    valeur: asRecord(r.valeur),
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
  };
}

function mapJournal(r: Tables<'journal'>): JournalEntry {
  return {
    id: r.id,
    dossierId: r.dossier_id,
    acteurId: r.acteur_id,
    acteurType: r.acteur_type as JournalEntry['acteurType'],
    action: r.action,
    details: asRecord(r.details),
    horodatage: r.horodatage,
  };
}

// ============================================================================
// SupabaseDataSource
// ============================================================================

export class SupabaseDataSource implements DataSource {
  readonly mode = 'supabase' as const;

  /**
   * Client RLS (session navigateur) pour la grande majorité des opérations.
   *
   * Note typage : `@supabase/ssr` embarque une génération de types postgrest plus
   * ancienne que `@supabase/supabase-js`, ce qui fait dégénérer en `never` les
   * inserts/updates et les `select(<colonnes>)` projetés. On réaligne donc le type
   * statique sur le `SupabaseClient<Database>` courant (l'objet runtime est, lui,
   * bien un SupabaseClient) afin d'obtenir une inférence correcte sous strict.
   */
  private async db(): Promise<SupabaseClient<Database>> {
    return (await createClient()) as unknown as SupabaseClient<Database>;
  }

  /** Client service_role pour les écritures finance / séquestre (bypass RLS). */
  private admin() {
    const client = createAdminClient();
    if (!client) {
      throw new Error('service_role requis pour les écritures finance (séquestre)');
    }
    return client;
  }

  // --- Dossiers -------------------------------------------------------------

  async listDossiers(): Promise<DossierAvecClient[]> {
    const db = await this.db();
    const { data, error } = await db
      .from('dossier')
      .select('*, client:client(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => {
      const { client, ...dossier } = row as Tables<'dossier'> & { client: Tables<'client'> };
      return { ...mapDossier(dossier), client: mapClient(client) };
    });
  }

  async getDossier(id: string): Promise<DossierComplet | null> {
    const db = await this.db();
    const { data: dossierRow, error: dossierError } = await db
      .from('dossier')
      .select('*, client:client(*)')
      .eq('id', id)
      .maybeSingle();
    if (dossierError) throw dossierError;
    if (!dossierRow) return null;

    const { client, ...dossier } = dossierRow as Tables<'dossier'> & { client: Tables<'client'> };

    const [
      reperages,
      propositions,
      publications,
      devis,
      echeances,
      paiements,
      documents,
      messages,
      journal,
    ] = await Promise.all([
      db.from('reperage').select('*').eq('dossier_id', id),
      db.from('proposition').select('*').eq('dossier_id', id),
      db.from('publication').select('*').eq('dossier_id', id),
      db.from('devis').select('*').eq('dossier_id', id),
      db.from('echeance').select('*').eq('dossier_id', id),
      db.from('paiement').select('*').eq('dossier_id', id),
      db.from('document').select('*').eq('dossier_id', id),
      db.from('message').select('*').eq('dossier_id', id),
      db.from('journal').select('*').eq('dossier_id', id),
    ]);

    for (const res of [
      reperages,
      propositions,
      publications,
      devis,
      echeances,
      paiements,
      documents,
      messages,
      journal,
    ]) {
      if (res.error) throw res.error;
    }

    return {
      ...mapDossier(dossier),
      client: mapClient(client),
      reperages: (reperages.data ?? []).map(mapReperage),
      propositions: (propositions.data ?? []).map(mapProposition),
      publications: (publications.data ?? []).map(mapPublication),
      devis: (devis.data ?? []).map(mapDevis),
      echeances: (echeances.data ?? []).map(mapEcheance),
      paiements: (paiements.data ?? []).map(mapPaiement),
      documents: (documents.data ?? []).map(mapDocument),
      messages: (messages.data ?? []).map(mapMessage),
      journal: (journal.data ?? []).map(mapJournal),
    };
  }

  async getDossierByReference(ref: string): Promise<DossierComplet | null> {
    const db = await this.db();
    const { data, error } = await db
      .from('dossier')
      .select('id')
      .eq('reference', ref)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return this.getDossier(data.id);
  }

  async createDossier(input: {
    clientId: string;
    vehiculeMarque?: string;
    vehiculeModele?: string;
    cahierDesCharges?: string;
    montantEstime?: number;
    margeEstimee?: number;
  }): Promise<Dossier> {
    const db = await this.db();
    // `reference` est auto-générée par défaut SQL : ne pas l'envoyer.
    const { data, error } = await db
      .from('dossier')
      .insert({
        client_id: input.clientId,
        vehicule_marque: input.vehiculeMarque ?? null,
        vehicule_modele: input.vehiculeModele ?? null,
        cahier_des_charges: input.cahierDesCharges ?? null,
        montant_estime: input.montantEstime ?? null,
        marge_estimee: input.margeEstimee ?? null,
        prochaine_action: 'Compléter le brief & valider le cahier des charges',
      })
      .select()
      .single();
    if (error) throw error;
    return mapDossier(data);
  }

  async updateDossier(
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
  ): Promise<Dossier> {
    const db = await this.db();
    const update: TablesUpdate<'dossier'> = {};
    if ('vehiculeMarque' in patch) update.vehicule_marque = patch.vehiculeMarque ?? null;
    if ('vehiculeModele' in patch) update.vehicule_modele = patch.vehiculeModele ?? null;
    if ('vehiculeCriteres' in patch) update.vehicule_criteres = patch.vehiculeCriteres as Json;
    if ('cahierDesCharges' in patch) update.cahier_des_charges = patch.cahierDesCharges ?? null;
    if ('montantEstime' in patch) update.montant_estime = patch.montantEstime ?? null;
    if ('margeEstimee' in patch) update.marge_estimee = patch.margeEstimee ?? null;
    if ('margeReelle' in patch) update.marge_reelle = patch.margeReelle ?? null;
    if ('prochaineAction' in patch) update.prochaine_action = patch.prochaineAction ?? null;
    if ('commissaireId' in patch) update.commissaire_id = patch.commissaireId ?? null;

    const { data, error } = await db
      .from('dossier')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapDossier(data);
  }

  async transitionDossier(
    id: string,
    to: DossierStatut,
    acteur: Acteur,
    _note?: string,
  ): Promise<Dossier> {
    const db = await this.db();
    // 1. Lire le statut courant.
    const { data: current, error: readError } = await db
      .from('dossier')
      .select('statut')
      .eq('id', id)
      .single();
    if (readError) throw readError;

    // 2. Garde HITL (laisse remonter l'erreur si transition interdite).
    assertTransition(current.statut, to, acteur);

    // 3. Update du seul champ `statut` : le trigger SQL journalise la transition
    //    (on n'insère PAS de doublon dans `journal`).
    const { data, error } = await db
      .from('dossier')
      .update({ statut: to })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapDossier(data);
  }

  // --- Repérages ------------------------------------------------------------

  async createReperage(input: {
    dossierId: string;
    source: ReperageSource;
    lien?: string;
    annonceData?: Record<string, unknown>;
    provenanceOrigine?: string;
    rapportCommissaire?: string;
    rapportClient?: string;
  }): Promise<Reperage> {
    const db = await this.db();
    const { data, error } = await db
      .from('reperage')
      .insert({
        dossier_id: input.dossierId,
        source: input.source,
        statut: 'BRUT',
        lien: input.lien ?? null,
        annonce_data: (input.annonceData ?? {}) as Json,
        provenance_origine: input.provenanceOrigine ?? null,
        provenance_date: new Date().toISOString(),
        rapport_commissaire: input.rapportCommissaire ?? null,
        rapport_client: input.rapportClient ?? null,
        selectionne: false,
        en_ligne: true,
      })
      .select()
      .single();
    if (error) throw error;
    return mapReperage(data);
  }

  async setReperageSelection(id: string, selectionne: boolean): Promise<Reperage> {
    const db = await this.db();
    const { data, error } = await db
      .from('reperage')
      .update({ selectionne, statut: selectionne ? 'RETENU' : 'BRUT' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapReperage(data);
  }

  async setReperageEnLigne(id: string, enLigne: boolean): Promise<Reperage> {
    const db = await this.db();
    const { data, error } = await db
      .from('reperage')
      .update({ en_ligne: enLigne })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapReperage(data);
  }

  async updateReperage(
    id: string,
    patch: Partial<
      Pick<
        Reperage,
        'rapportCommissaire' | 'rapportClient' | 'statut' | 'annonceData' | 'provenanceOrigine'
      >
    >,
  ): Promise<Reperage> {
    const db = await this.db();
    const update: TablesUpdate<'reperage'> = {};
    if ('rapportCommissaire' in patch) update.rapport_commissaire = patch.rapportCommissaire ?? null;
    if ('rapportClient' in patch) update.rapport_client = patch.rapportClient ?? null;
    if ('statut' in patch) update.statut = patch.statut as ReperageStatut;
    if ('annonceData' in patch) update.annonce_data = patch.annonceData as Json;
    if ('provenanceOrigine' in patch) update.provenance_origine = patch.provenanceOrigine ?? null;

    const { data, error } = await db
      .from('reperage')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapReperage(data);
  }

  // --- Propositions / Publications -----------------------------------------

  async createProposition(input: {
    dossierId: string;
    reperageId?: string;
    titre?: string;
    description?: string;
    photos?: string[];
    scene3dUrl?: string;
  }): Promise<Proposition> {
    const db = await this.db();
    const { data, error } = await db
      .from('proposition')
      .insert({
        dossier_id: input.dossierId,
        reperage_id: input.reperageId ?? null,
        titre: input.titre ?? null,
        description: input.description ?? null,
        photos: (input.photos ?? []) as Json,
        scene_3d_url: input.scene3dUrl ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapProposition(data);
  }

  async setPublication(
    propositionId: string,
    dossierId: string,
    publiee: boolean,
  ): Promise<Publication> {
    const db = await this.db();
    const nowIso = new Date().toISOString();

    // Upsert logique : récupérer la publication existante (sinon créer).
    const { data: existing, error: findError } = await db
      .from('publication')
      .select('*')
      .eq('proposition_id', propositionId)
      .maybeSingle();
    if (findError) throw findError;

    if (!existing) {
      const { data, error } = await db
        .from('publication')
        .insert({
          proposition_id: propositionId,
          dossier_id: dossierId,
          statut: publiee ? 'PUBLIEE' : 'DEPUBLIEE',
          publie_at: publiee ? nowIso : null,
          depublie_at: publiee ? null : nowIso,
        })
        .select()
        .single();
      if (error) throw error;
      return mapPublication(data);
    }

    const { data, error } = await db
      .from('publication')
      .update({
        statut: publiee ? 'PUBLIEE' : 'DEPUBLIEE',
        publie_at: publiee ? nowIso : existing.publie_at,
        depublie_at: publiee ? null : nowIso,
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return mapPublication(data);
  }

  async listPublications(): Promise<PropositionPubliee[]> {
    const db = await this.db();
    const { data, error } = await db
      .from('publication')
      .select('*, proposition:proposition(*), dossier:dossier(reference)')
      .eq('statut', 'PUBLIEE');
    if (error) throw error;

    return (data ?? [])
      .map((row) => {
        const typed = row as Tables<'publication'> & {
          proposition: Tables<'proposition'> | null;
          dossier: { reference: string } | null;
        };
        if (!typed.proposition) return null;
        const { proposition, dossier, ...publication } = typed;
        return {
          ...mapProposition(proposition),
          publication: mapPublication(publication),
          dossierReference: dossier?.reference ?? '',
        };
      })
      .filter((x): x is PropositionPubliee => x !== null);
  }

  // --- Devis ----------------------------------------------------------------

  async createDevis(input: {
    dossierId: string;
    lignes: DevisLigne[];
    margeSimulee?: number;
    tvaRegime?: string;
  }): Promise<Devis> {
    const db = await this.db();
    const montantTotal = input.lignes.reduce((acc, l) => acc + l.montant, 0);
    const { data, error } = await db
      .from('devis')
      .insert({
        dossier_id: input.dossierId,
        statut: 'BROUILLON',
        lignes: input.lignes as unknown as Json,
        montant_total: montantTotal,
        marge_simulee: input.margeSimulee ?? null,
        tva_regime: input.tvaRegime ?? 'TVA_MARGE',
      })
      .select()
      .single();
    if (error) throw error;
    return mapDevis(data);
  }

  async validateDevis(id: string): Promise<Devis> {
    const db = await this.db();
    const { data, error } = await db
      .from('devis')
      .update({ statut: 'VALIDE', valide_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapDevis(data);
  }

  // --- Échéancier & finance -------------------------------------------------

  async createEcheance(input: {
    dossierId: string;
    devisId?: string;
    type: EcheanceType;
    montant: number;
    dateEcheance?: string;
  }): Promise<Echeance> {
    // Écriture finance / séquestre → service_role (la RLS interdit en session navigateur).
    const admin = this.admin();
    // Rattache au compte séquestre par défaut (cohérent avec le mock store).
    const { data: sequestre, error: compteError } = await admin
      .from('compte_bancaire')
      .select('id')
      .eq('type', 'SEQUESTRE')
      .maybeSingle();
    if (compteError) throw compteError;

    const { data, error } = await admin
      .from('echeance')
      .insert({
        dossier_id: input.dossierId,
        devis_id: input.devisId ?? null,
        type: input.type,
        montant: input.montant,
        date_echeance: input.dateEcheance ?? null,
        compte_id: sequestre?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapEcheance(data);
  }

  async listComptes(): Promise<CompteBancaire[]> {
    const db = await this.db();
    const { data, error } = await db.from('compte_bancaire').select('*');
    if (error) throw error;
    return (data ?? []).map(mapCompte);
  }

  async listMouvements(): Promise<Mouvement[]> {
    const db = await this.db();
    const { data, error } = await db
      .from('mouvement')
      .select('*')
      .order('horodatage', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapMouvement);
  }

  async listPaiements(dossierId?: string): Promise<Paiement[]> {
    const db = await this.db();
    let query = db.from('paiement').select('*');
    if (dossierId) query = query.eq('dossier_id', dossierId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapPaiement);
  }

  async enregistrerEncaissement(input: {
    dossierId: string;
    echeanceId?: string;
    type: PaiementType;
    montant: number;
    compteType: CompteType;
  }): Promise<Paiement> {
    // Écriture SÉQUESTRE (fonds clients) → service_role : crée le paiement,
    // le mouvement, met à jour le solde du compte, et solde l'échéance.
    const admin = this.admin();

    // Compte ciblé par son type (séquestre, décaissement, courant…).
    const { data: compte, error: compteError } = await admin
      .from('compte_bancaire')
      .select('*')
      .eq('type', input.compteType)
      .maybeSingle();
    if (compteError) throw compteError;

    const statut =
      input.type === 'DECAISSEMENT_VENDEUR' || input.type === 'COMMISSION' ? 'DECAISSE' : 'RECU';

    const { data: paiement, error: paiementError } = await admin
      .from('paiement')
      .insert({
        dossier_id: input.dossierId,
        echeance_id: input.echeanceId ?? null,
        type: input.type,
        statut,
        montant: input.montant,
        compte_id: compte?.id ?? null,
        date_reelle: new Date().toISOString(),
        reference_externe: `mock_${Math.random().toString(36).slice(2, 8)}`,
      })
      .select()
      .single();
    if (paiementError) throw paiementError;

    // Mouvement + mise à jour du solde (sens selon type).
    const sens: Mouvement['sens'] = statut === 'DECAISSE' ? 'DEBIT' : 'CREDIT';
    const signe = sens === 'CREDIT' ? 1 : -1;

    const { error: mouvementError } = await admin.from('mouvement').insert({
      compte_id: compte?.id ?? '',
      dossier_id: input.dossierId,
      paiement_id: paiement.id,
      montant: signe * input.montant,
      sens,
      libelle: `${input.type} (séquestre/${input.compteType})`,
      rapproche: false,
    });
    if (mouvementError) throw mouvementError;

    if (compte) {
      const { error: soldeError } = await admin
        .from('compte_bancaire')
        .update({ solde: num(compte.solde) + signe * input.montant })
        .eq('id', compte.id);
      if (soldeError) throw soldeError;
    }

    // Marque l'échéance comme réglée.
    if (input.echeanceId) {
      const { error: echeanceError } = await admin
        .from('echeance')
        .update({ date_reelle: new Date().toISOString() })
        .eq('id', input.echeanceId);
      if (echeanceError) throw echeanceError;
    }

    return mapPaiement(paiement);
  }

  // --- Documents ------------------------------------------------------------

  async createDocument(input: {
    dossierId: string;
    type: DocumentType;
    trameId?: string;
    fichierUrl?: string;
    donnees?: Record<string, unknown>;
  }): Promise<DocumentGenere> {
    const db = await this.db();
    const { data, error } = await db
      .from('document')
      .insert({
        dossier_id: input.dossierId,
        type: input.type,
        trame_id: input.trameId ?? null,
        fichier_url: input.fichierUrl ?? null,
        donnees: (input.donnees ?? {}) as Json,
        genere_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return mapDocument(data);
  }

  // --- Messagerie -----------------------------------------------------------

  async createMessage(input: {
    dossierId: string;
    auteur: 'CLIENT' | 'COMMISSAIRE';
    contenu: string;
    auteurId?: string;
  }): Promise<Message> {
    const db = await this.db();
    const { data, error } = await db
      .from('message')
      .insert({
        dossier_id: input.dossierId,
        auteur: input.auteur,
        auteur_id: input.auteurId ?? null,
        contenu: input.contenu,
        lu: false,
      })
      .select()
      .single();
    if (error) throw error;
    return mapMessage(data);
  }

  // --- Base DA / réglages ---------------------------------------------------

  async listTrames(type?: TrameType): Promise<Trame[]> {
    const db = await this.db();
    let query = db.from('trame').select('*');
    if (type) query = query.eq('type', type);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapTrame);
  }

  async updateTrame(
    id: string,
    patch: Partial<Pick<Trame, 'contenu' | 'nom' | 'actif'>>,
  ): Promise<Trame> {
    const db = await this.db();
    const update: TablesUpdate<'trame'> = {};
    if ('contenu' in patch) update.contenu = patch.contenu;
    if ('nom' in patch) update.nom = patch.nom;
    if ('actif' in patch) update.actif = patch.actif;

    const { data, error } = await db
      .from('trame')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapTrame(data);
  }

  async listSources(): Promise<SourceScrap[]> {
    const db = await this.db();
    const { data, error } = await db.from('source_scrap').select('*');
    if (error) throw error;
    return (data ?? []).map(mapSource);
  }

  async listParametres(): Promise<Parametre[]> {
    const db = await this.db();
    const { data, error } = await db.from('parametre').select('*');
    if (error) throw error;
    return (data ?? []).map(mapParametre);
  }

  async listUsers(): Promise<AppUser[]> {
    const db = await this.db();
    const { data, error } = await db.from('app_user').select('*');
    if (error) throw error;
    return (data ?? []).map(mapAppUser);
  }

  // --- Journal / audit ------------------------------------------------------

  async addJournal(input: {
    dossierId?: string;
    acteurType: 'COMMISSAIRE' | 'CLIENT' | 'SYSTEME';
    action: string;
    details?: Record<string, unknown>;
  }): Promise<JournalEntry> {
    const db = await this.db();
    const { data, error } = await db
      .from('journal')
      .insert({
        dossier_id: input.dossierId ?? null,
        acteur_type: input.acteurType,
        action: input.action,
        details: (input.details ?? {}) as Json,
      })
      .select()
      .single();
    if (error) throw error;
    return mapJournal(data);
  }

  // --- Pilotage -------------------------------------------------------------

  async kpis(): Promise<KpisPilotage> {
    const db = await this.db();
    const [dossiersRes, echeancesRes, comptesRes] = await Promise.all([
      db
        .from('dossier')
        .select('statut, montant_estime, marge_estimee, marge_reelle'),
      db.from('echeance').select('*').is('date_reelle', null),
      db.from('compte_bancaire').select('*'),
    ]);
    if (dossiersRes.error) throw dossiersRes.error;
    if (echeancesRes.error) throw echeancesRes.error;
    if (comptesRes.error) throw comptesRes.error;

    const dossiers = dossiersRes.data ?? [];
    const parStatut = Object.fromEntries(
      (
        [
          'BRIEF',
          'REPERAGE',
          'PROPOSITIONS',
          'VALIDATION',
          'ACQUISITION',
          'PAIEMENT',
          'LIVRAISON',
          'CLOS',
        ] as DossierStatut[]
      ).map((st) => [st, dossiers.filter((d) => d.statut === st).length]),
    ) as Record<DossierStatut, number>;

    const actifs = dossiers.filter((d) => d.statut !== 'CLOS');

    return {
      parStatut,
      totalDossiers: dossiers.length,
      encoursEstime: actifs.reduce((a, d) => a + num(d.montant_estime), 0),
      margeSimuleeTotale: actifs.reduce((a, d) => a + num(d.marge_estimee), 0),
      margeReelleTotale: dossiers.reduce((a, d) => a + num(d.marge_reelle), 0),
      echeancesAVenir: (echeancesRes.data ?? []).map(mapEcheance),
      soldesComptes: (comptesRes.data ?? []).map(mapCompte),
    };
  }

  // --- Clients --------------------------------------------------------------

  async listClients(): Promise<Client[]> {
    const db = await this.db();
    const { data, error } = await db.from('client').select('*');
    if (error) throw error;
    return (data ?? []).map(mapClient);
  }

  async createClient(input: {
    nom: string;
    email: string;
    telephone?: string;
    langue?: 'FR' | 'EN';
  }): Promise<Client> {
    const db = await this.db();
    const { data, error } = await db
      .from('client')
      .insert({
        nom: input.nom,
        email: input.email,
        telephone: input.telephone ?? null,
        langue: input.langue ?? 'FR',
      })
      .select()
      .single();
    if (error) throw error;
    return mapClient(data);
  }
}
