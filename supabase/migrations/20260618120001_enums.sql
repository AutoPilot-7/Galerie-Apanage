-- ============================================================================
-- Galerie Apanage — 01 ENUMS (cf. specs §5)
-- Tous les types énumérés du domaine. Source de vérité du modèle de données.
-- ============================================================================

create type dossier_statut as enum (
  'BRIEF','REPERAGE','PROPOSITIONS','VALIDATION','ACQUISITION','PAIEMENT','LIVRAISON','CLOS'
);

create type reperage_source as enum ('SCRAP','LIEN','MANUEL');
create type reperage_statut as enum ('BRUT','RETENU','REJETE');

create type devis_statut as enum ('BROUILLON','VALIDE');

create type echeance_type as enum ('ACOMPTE','SOLDE');

create type paiement_type as enum ('ACOMPTE','SOLDE','DECAISSEMENT_VENDEUR','COMMISSION');
create type paiement_statut as enum ('EN_ATTENTE','RECU','DECAISSE');

create type compte_type as enum ('COURANT_PRO','SEQUESTRE','DECAISSEMENT');

create type document_type as enum (
  'DEVIS','DOCUMENT_REMISE','LETTRE_REMISE','CERTIFICAT_IMPORT',
  'CARTE_VISITE','CARTON_INVITATION','ENVELOPPE'
);

create type trame_type as enum (
  'CAHIER_DES_CHARGES','RAPPORT_COMMISSAIRE','RAPPORT_CLIENT','ANNONCE','PHOTO','DEVIS'
);

create type auteur_message as enum ('CLIENT','COMMISSAIRE');

create type user_role as enum ('COMMISSAIRE','ADMIN');

create type langue as enum ('FR','EN');

create type publication_statut as enum ('BROUILLON','PUBLIEE','DEPUBLIEE');
