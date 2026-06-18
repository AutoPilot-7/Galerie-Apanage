// ============================================================================
// Galerie Apanage — Types TypeScript de la base Supabase
//
// PLACEHOLDER FIDÈLE AUX MIGRATIONS.
// Ce fichier reproduit EXACTEMENT le schéma défini dans
// `supabase/migrations/` (enums, tables, colonnes, nullabilité, defaults,
// foreign keys et fonctions). Il imite la sortie de
// `supabase gen types typescript` afin que le code TypeScript compile dès
// maintenant, avant que le projet Supabase ne soit lié.
//
// Une fois le projet Supabase lié, régénérez-le automatiquement via :
//     npm run db:types
// (alias de `supabase gen types typescript --linked > src/lib/supabase/database.types.ts`)
//
// Ne pas éditer ce fichier à la main une fois la génération automatique en place.
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      app_user: {
        Row: {
          id: string;
          email: string;
          nom: string | null;
          role: Database["public"]["Enums"]["user_role"];
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nom?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nom?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "app_user_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      client: {
        Row: {
          id: string;
          auth_user_id: string | null;
          nom: string;
          email: string;
          telephone: string | null;
          langue: Database["public"]["Enums"]["langue"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          nom: string;
          email: string;
          telephone?: string | null;
          langue?: Database["public"]["Enums"]["langue"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          nom?: string;
          email?: string;
          telephone?: string | null;
          langue?: Database["public"]["Enums"]["langue"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_auth_user_id_fkey";
            columns: ["auth_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      dossier: {
        Row: {
          id: string;
          reference: string;
          statut: Database["public"]["Enums"]["dossier_statut"];
          client_id: string;
          commissaire_id: string | null;
          vehicule_marque: string | null;
          vehicule_modele: string | null;
          vehicule_criteres: Json;
          cahier_des_charges: string | null;
          montant_estime: number | null;
          marge_estimee: number | null;
          marge_reelle: number | null;
          prochaine_action: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference?: string;
          statut?: Database["public"]["Enums"]["dossier_statut"];
          client_id: string;
          commissaire_id?: string | null;
          vehicule_marque?: string | null;
          vehicule_modele?: string | null;
          vehicule_criteres?: Json;
          cahier_des_charges?: string | null;
          montant_estime?: number | null;
          marge_estimee?: number | null;
          marge_reelle?: number | null;
          prochaine_action?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference?: string;
          statut?: Database["public"]["Enums"]["dossier_statut"];
          client_id?: string;
          commissaire_id?: string | null;
          vehicule_marque?: string | null;
          vehicule_modele?: string | null;
          vehicule_criteres?: Json;
          cahier_des_charges?: string | null;
          montant_estime?: number | null;
          marge_estimee?: number | null;
          marge_reelle?: number | null;
          prochaine_action?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dossier_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "client";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dossier_commissaire_id_fkey";
            columns: ["commissaire_id"];
            isOneToOne: false;
            referencedRelation: "app_user";
            referencedColumns: ["id"];
          },
        ];
      };
      trame: {
        Row: {
          id: string;
          type: Database["public"]["Enums"]["trame_type"];
          nom: string;
          contenu: string;
          version: number;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: Database["public"]["Enums"]["trame_type"];
          nom: string;
          contenu: string;
          version?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: Database["public"]["Enums"]["trame_type"];
          nom?: string;
          contenu?: string;
          version?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reperage: {
        Row: {
          id: string;
          dossier_id: string;
          source: Database["public"]["Enums"]["reperage_source"];
          statut: Database["public"]["Enums"]["reperage_statut"];
          lien: string | null;
          annonce_data: Json;
          provenance_origine: string | null;
          provenance_date: string | null;
          rapport_commissaire: string | null;
          rapport_client: string | null;
          selectionne: boolean;
          en_ligne: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dossier_id: string;
          source?: Database["public"]["Enums"]["reperage_source"];
          statut?: Database["public"]["Enums"]["reperage_statut"];
          lien?: string | null;
          annonce_data?: Json;
          provenance_origine?: string | null;
          provenance_date?: string | null;
          rapport_commissaire?: string | null;
          rapport_client?: string | null;
          selectionne?: boolean;
          en_ligne?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dossier_id?: string;
          source?: Database["public"]["Enums"]["reperage_source"];
          statut?: Database["public"]["Enums"]["reperage_statut"];
          lien?: string | null;
          annonce_data?: Json;
          provenance_origine?: string | null;
          provenance_date?: string | null;
          rapport_commissaire?: string | null;
          rapport_client?: string | null;
          selectionne?: boolean;
          en_ligne?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reperage_dossier_id_fkey";
            columns: ["dossier_id"];
            isOneToOne: false;
            referencedRelation: "dossier";
            referencedColumns: ["id"];
          },
        ];
      };
      proposition: {
        Row: {
          id: string;
          dossier_id: string;
          reperage_id: string | null;
          titre: string | null;
          description: string | null;
          photos: Json;
          scene_3d_url: string | null;
          fiche_inspection: Json;
          dossier_provenance: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dossier_id: string;
          reperage_id?: string | null;
          titre?: string | null;
          description?: string | null;
          photos?: Json;
          scene_3d_url?: string | null;
          fiche_inspection?: Json;
          dossier_provenance?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dossier_id?: string;
          reperage_id?: string | null;
          titre?: string | null;
          description?: string | null;
          photos?: Json;
          scene_3d_url?: string | null;
          fiche_inspection?: Json;
          dossier_provenance?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "proposition_dossier_id_fkey";
            columns: ["dossier_id"];
            isOneToOne: false;
            referencedRelation: "dossier";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposition_reperage_id_fkey";
            columns: ["reperage_id"];
            isOneToOne: false;
            referencedRelation: "reperage";
            referencedColumns: ["id"];
          },
        ];
      };
      publication: {
        Row: {
          id: string;
          proposition_id: string;
          dossier_id: string;
          statut: Database["public"]["Enums"]["publication_statut"];
          publie_at: string | null;
          depublie_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          proposition_id: string;
          dossier_id: string;
          statut?: Database["public"]["Enums"]["publication_statut"];
          publie_at?: string | null;
          depublie_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          proposition_id?: string;
          dossier_id?: string;
          statut?: Database["public"]["Enums"]["publication_statut"];
          publie_at?: string | null;
          depublie_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "publication_proposition_id_fkey";
            columns: ["proposition_id"];
            isOneToOne: false;
            referencedRelation: "proposition";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "publication_dossier_id_fkey";
            columns: ["dossier_id"];
            isOneToOne: false;
            referencedRelation: "dossier";
            referencedColumns: ["id"];
          },
        ];
      };
      devis: {
        Row: {
          id: string;
          dossier_id: string;
          statut: Database["public"]["Enums"]["devis_statut"];
          lignes: Json;
          montant_total: number | null;
          marge_simulee: number | null;
          marge_reelle: number | null;
          tva_regime: string | null;
          valide_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dossier_id: string;
          statut?: Database["public"]["Enums"]["devis_statut"];
          lignes?: Json;
          montant_total?: number | null;
          marge_simulee?: number | null;
          marge_reelle?: number | null;
          tva_regime?: string | null;
          valide_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dossier_id?: string;
          statut?: Database["public"]["Enums"]["devis_statut"];
          lignes?: Json;
          montant_total?: number | null;
          marge_simulee?: number | null;
          marge_reelle?: number | null;
          tva_regime?: string | null;
          valide_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "devis_dossier_id_fkey";
            columns: ["dossier_id"];
            isOneToOne: false;
            referencedRelation: "dossier";
            referencedColumns: ["id"];
          },
        ];
      };
      document: {
        Row: {
          id: string;
          dossier_id: string;
          type: Database["public"]["Enums"]["document_type"];
          trame_id: string | null;
          fichier_url: string | null;
          donnees: Json;
          genere_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dossier_id: string;
          type: Database["public"]["Enums"]["document_type"];
          trame_id?: string | null;
          fichier_url?: string | null;
          donnees?: Json;
          genere_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          dossier_id?: string;
          type?: Database["public"]["Enums"]["document_type"];
          trame_id?: string | null;
          fichier_url?: string | null;
          donnees?: Json;
          genere_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_dossier_id_fkey";
            columns: ["dossier_id"];
            isOneToOne: false;
            referencedRelation: "dossier";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_trame_id_fkey";
            columns: ["trame_id"];
            isOneToOne: false;
            referencedRelation: "trame";
            referencedColumns: ["id"];
          },
        ];
      };
      message: {
        Row: {
          id: string;
          dossier_id: string;
          auteur: Database["public"]["Enums"]["auteur_message"];
          auteur_id: string | null;
          contenu: string;
          lu: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          dossier_id: string;
          auteur: Database["public"]["Enums"]["auteur_message"];
          auteur_id?: string | null;
          contenu: string;
          lu?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          dossier_id?: string;
          auteur?: Database["public"]["Enums"]["auteur_message"];
          auteur_id?: string | null;
          contenu?: string;
          lu?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_dossier_id_fkey";
            columns: ["dossier_id"];
            isOneToOne: false;
            referencedRelation: "dossier";
            referencedColumns: ["id"];
          },
        ];
      };
      source_scrap: {
        Row: {
          id: string;
          nom: string;
          url_base: string;
          domaine: string | null;
          actif: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          url_base: string;
          domaine?: string | null;
          actif?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          url_base?: string;
          domaine?: string | null;
          actif?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      parametre: {
        Row: {
          id: string;
          cle: string;
          valeur: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          cle: string;
          valeur?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          cle?: string;
          valeur?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "parametre_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "app_user";
            referencedColumns: ["id"];
          },
        ];
      };
      journal: {
        Row: {
          id: string;
          dossier_id: string | null;
          acteur_id: string | null;
          acteur_type: string | null;
          action: string;
          details: Json;
          horodatage: string;
        };
        Insert: {
          id?: string;
          dossier_id?: string | null;
          acteur_id?: string | null;
          acteur_type?: string | null;
          action: string;
          details?: Json;
          horodatage?: string;
        };
        Update: {
          id?: string;
          dossier_id?: string | null;
          acteur_id?: string | null;
          acteur_type?: string | null;
          action?: string;
          details?: Json;
          horodatage?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journal_dossier_id_fkey";
            columns: ["dossier_id"];
            isOneToOne: false;
            referencedRelation: "dossier";
            referencedColumns: ["id"];
          },
        ];
      };
      compte_bancaire: {
        Row: {
          id: string;
          type: Database["public"]["Enums"]["compte_type"];
          libelle: string;
          iban: string | null;
          solde: number;
          devise: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: Database["public"]["Enums"]["compte_type"];
          libelle: string;
          iban?: string | null;
          solde?: number;
          devise?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: Database["public"]["Enums"]["compte_type"];
          libelle?: string;
          iban?: string | null;
          solde?: number;
          devise?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      echeance: {
        Row: {
          id: string;
          dossier_id: string;
          devis_id: string | null;
          type: Database["public"]["Enums"]["echeance_type"];
          montant: number;
          date_echeance: string | null;
          date_reelle: string | null;
          compte_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dossier_id: string;
          devis_id?: string | null;
          type: Database["public"]["Enums"]["echeance_type"];
          montant: number;
          date_echeance?: string | null;
          date_reelle?: string | null;
          compte_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          dossier_id?: string;
          devis_id?: string | null;
          type?: Database["public"]["Enums"]["echeance_type"];
          montant?: number;
          date_echeance?: string | null;
          date_reelle?: string | null;
          compte_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "echeance_dossier_id_fkey";
            columns: ["dossier_id"];
            isOneToOne: false;
            referencedRelation: "dossier";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "echeance_devis_id_fkey";
            columns: ["devis_id"];
            isOneToOne: false;
            referencedRelation: "devis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "echeance_compte_id_fkey";
            columns: ["compte_id"];
            isOneToOne: false;
            referencedRelation: "compte_bancaire";
            referencedColumns: ["id"];
          },
        ];
      };
      paiement: {
        Row: {
          id: string;
          dossier_id: string;
          echeance_id: string | null;
          type: Database["public"]["Enums"]["paiement_type"];
          statut: Database["public"]["Enums"]["paiement_statut"];
          montant: number;
          compte_id: string | null;
          date_prevue: string | null;
          date_reelle: string | null;
          reference_externe: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dossier_id: string;
          echeance_id?: string | null;
          type: Database["public"]["Enums"]["paiement_type"];
          statut?: Database["public"]["Enums"]["paiement_statut"];
          montant: number;
          compte_id?: string | null;
          date_prevue?: string | null;
          date_reelle?: string | null;
          reference_externe?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          dossier_id?: string;
          echeance_id?: string | null;
          type?: Database["public"]["Enums"]["paiement_type"];
          statut?: Database["public"]["Enums"]["paiement_statut"];
          montant?: number;
          compte_id?: string | null;
          date_prevue?: string | null;
          date_reelle?: string | null;
          reference_externe?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "paiement_dossier_id_fkey";
            columns: ["dossier_id"];
            isOneToOne: false;
            referencedRelation: "dossier";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "paiement_echeance_id_fkey";
            columns: ["echeance_id"];
            isOneToOne: false;
            referencedRelation: "echeance";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "paiement_compte_id_fkey";
            columns: ["compte_id"];
            isOneToOne: false;
            referencedRelation: "compte_bancaire";
            referencedColumns: ["id"];
          },
        ];
      };
      mouvement: {
        Row: {
          id: string;
          compte_id: string;
          dossier_id: string | null;
          paiement_id: string | null;
          montant: number;
          sens: string;
          libelle: string | null;
          rapproche: boolean;
          horodatage: string;
        };
        Insert: {
          id?: string;
          compte_id: string;
          dossier_id?: string | null;
          paiement_id?: string | null;
          montant: number;
          sens: string;
          libelle?: string | null;
          rapproche?: boolean;
          horodatage?: string;
        };
        Update: {
          id?: string;
          compte_id?: string;
          dossier_id?: string | null;
          paiement_id?: string | null;
          montant?: number;
          sens?: string;
          libelle?: string | null;
          rapproche?: boolean;
          horodatage?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mouvement_compte_id_fkey";
            columns: ["compte_id"];
            isOneToOne: false;
            referencedRelation: "compte_bancaire";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mouvement_dossier_id_fkey";
            columns: ["dossier_id"];
            isOneToOne: false;
            referencedRelation: "dossier";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mouvement_paiement_id_fkey";
            columns: ["paiement_id"];
            isOneToOne: false;
            referencedRelation: "paiement";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      dossier_transition_autorisee: {
        Args: {
          ancien: Database["public"]["Enums"]["dossier_statut"];
          nouveau: Database["public"]["Enums"]["dossier_statut"];
        };
        Returns: boolean;
      };
      dossier_statut_guard: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      is_commissaire: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      current_client_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      dossier_du_client: {
        Args: { d: string };
        Returns: boolean;
      };
    };
    Enums: {
      dossier_statut:
        | "BRIEF"
        | "REPERAGE"
        | "PROPOSITIONS"
        | "VALIDATION"
        | "ACQUISITION"
        | "PAIEMENT"
        | "LIVRAISON"
        | "CLOS";
      reperage_source: "SCRAP" | "LIEN" | "MANUEL";
      reperage_statut: "BRUT" | "RETENU" | "REJETE";
      devis_statut: "BROUILLON" | "VALIDE";
      echeance_type: "ACOMPTE" | "SOLDE";
      paiement_type: "ACOMPTE" | "SOLDE" | "DECAISSEMENT_VENDEUR" | "COMMISSION";
      paiement_statut: "EN_ATTENTE" | "RECU" | "DECAISSE";
      compte_type: "COURANT_PRO" | "SEQUESTRE" | "DECAISSEMENT";
      document_type:
        | "DEVIS"
        | "DOCUMENT_REMISE"
        | "LETTRE_REMISE"
        | "CERTIFICAT_IMPORT"
        | "CARTE_VISITE"
        | "CARTON_INVITATION"
        | "ENVELOPPE";
      trame_type:
        | "CAHIER_DES_CHARGES"
        | "RAPPORT_COMMISSAIRE"
        | "RAPPORT_CLIENT"
        | "ANNONCE"
        | "PHOTO"
        | "DEVIS";
      auteur_message: "CLIENT" | "COMMISSAIRE";
      user_role: "COMMISSAIRE" | "ADMIN";
      langue: "FR" | "EN";
      publication_statut: "BROUILLON" | "PUBLIEE" | "DEPUBLIEE";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ============================================================================
// Helpers génériques (standard supabase-gen)
// ============================================================================

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
