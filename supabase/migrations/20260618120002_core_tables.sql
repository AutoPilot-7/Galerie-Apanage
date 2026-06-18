-- ============================================================================
-- Galerie Apanage — 02 TABLES MÉTIER (cf. specs §2 & §5)
-- Objet pivot : DOSSIER. Le tunnel Demande -> Constat -> Acquisition = champ statut.
-- ============================================================================

-- Helper : met à jour automatiquement updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Utilisateurs internes : commissaires / admins (liés à auth.users)
-- ---------------------------------------------------------------------------
create table app_user (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  nom         text,
  role        user_role not null default 'COMMISSAIRE',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Clients (acheteurs). Accès portail par magic-link => auth_user_id.
-- ---------------------------------------------------------------------------
create table client (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid references auth.users(id) on delete set null,
  nom           text not null,
  email         text not null,
  telephone     text,
  langue        langue not null default 'FR',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_client_updated before update on client
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- DOSSIER — objet pivot. 1 par demande client. Le statut matérialise le tunnel.
-- ---------------------------------------------------------------------------
create sequence dossier_ref_seq start 1;

create table dossier (
  id                 uuid primary key default gen_random_uuid(),
  reference          text not null unique
                       default ('GA-' || to_char(now(),'YYYY') || '-' ||
                                lpad(nextval('dossier_ref_seq')::text, 4, '0')),
  statut             dossier_statut not null default 'BRIEF',
  client_id          uuid not null references client(id) on delete restrict,
  commissaire_id     uuid references app_user(id) on delete set null,
  vehicule_marque    text,
  vehicule_modele    text,
  vehicule_criteres  jsonb not null default '{}'::jsonb,   -- critères du cahier des charges
  cahier_des_charges text,
  montant_estime     numeric(12,2),
  marge_estimee      numeric(12,2),
  marge_reelle       numeric(12,2),
  prochaine_action   text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger trg_dossier_updated before update on dossier
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- TRAME (Base DA) — référentiel central des trames/prompts, versionnées.
-- Alimente TOUTES les générations IA (CDC, rapports, annonce, photo, devis).
-- ---------------------------------------------------------------------------
create table trame (
  id          uuid primary key default gen_random_uuid(),
  type        trame_type not null,
  nom         text not null,
  contenu     text not null,                    -- template / prompt
  version     int not null default 1,
  actif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_trame_updated before update on trame
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- REPÉRAGE (Constat) — scrap / lien / manuel, rattaché au Dossier.
-- ---------------------------------------------------------------------------
create table reperage (
  id                  uuid primary key default gen_random_uuid(),
  dossier_id          uuid not null references dossier(id) on delete cascade,
  source              reperage_source not null default 'LIEN',
  statut              reperage_statut not null default 'BRUT',
  lien                text,
  annonce_data        jsonb not null default '{}'::jsonb,
  provenance_origine  text,                      -- origine de l'annonce
  provenance_date     timestamptz,
  rapport_commissaire text,
  rapport_client      text,
  selectionne         boolean not null default false,  -- ✋ sélection commissaire
  en_ligne            boolean not null default true,   -- suppression auto si hors-ligne
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_reperage_updated before update on reperage
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- PROPOSITION / ANNONCE — issue d'un repérage retenu.
-- ---------------------------------------------------------------------------
create table proposition (
  id                  uuid primary key default gen_random_uuid(),
  dossier_id          uuid not null references dossier(id) on delete cascade,
  reperage_id         uuid references reperage(id) on delete set null,
  titre               text,
  description         text,
  photos              jsonb not null default '[]'::jsonb,
  scene_3d_url        text,
  fiche_inspection    jsonb not null default '{}'::jsonb,
  dossier_provenance  jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_proposition_updated before update on proposition
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- PUBLICATION — état de publication d'une proposition (vitrine / portail).
-- ---------------------------------------------------------------------------
create table publication (
  id              uuid primary key default gen_random_uuid(),
  proposition_id  uuid not null references proposition(id) on delete cascade,
  dossier_id      uuid not null references dossier(id) on delete cascade,
  statut          publication_statut not null default 'BROUILLON',
  publie_at       timestamptz,
  depublie_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_publication_updated before update on publication
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- DEVIS — frais détaillés + marge simulée vs réelle. ✋ validation commissaire.
-- ---------------------------------------------------------------------------
create table devis (
  id            uuid primary key default gen_random_uuid(),
  dossier_id    uuid not null references dossier(id) on delete cascade,
  statut        devis_statut not null default 'BROUILLON',
  lignes        jsonb not null default '[]'::jsonb,  -- achat, transport, import/douane, honoraires
  montant_total numeric(12,2),
  marge_simulee numeric(12,2),
  marge_reelle  numeric(12,2),
  tva_regime    text default 'TVA_MARGE',            -- TVA_MARGE | TVA_CLASSIQUE
  valide_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_devis_updated before update on devis
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- DOCUMENT — généré depuis une trame (papeterie, remise, certificat import…).
-- ---------------------------------------------------------------------------
create table document (
  id          uuid primary key default gen_random_uuid(),
  dossier_id  uuid not null references dossier(id) on delete cascade,
  type        document_type not null,
  trame_id    uuid references trame(id) on delete set null,
  fichier_url text,
  donnees     jsonb not null default '{}'::jsonb,
  genere_at   timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- MESSAGE — dialogue client <-> commissaire, rattaché au Dossier.
-- ---------------------------------------------------------------------------
create table message (
  id          uuid primary key default gen_random_uuid(),
  dossier_id  uuid not null references dossier(id) on delete cascade,
  auteur      auteur_message not null,
  auteur_id   uuid,                              -- app_user.id ou client.id
  contenu     text not null,
  lu          boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SOURCE_SCRAP — whitelist des sites autorisés pour le repérage (conformité).
-- ---------------------------------------------------------------------------
create table source_scrap (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  url_base    text not null,
  domaine     text,
  actif       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- PARAMETRE — réglages manuels (commission, éligibilité, sourcing, langues…).
-- ---------------------------------------------------------------------------
create table parametre (
  id          uuid primary key default gen_random_uuid(),
  cle         text not null unique,
  valeur      jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references app_user(id) on delete set null
);
create trigger trg_parametre_updated before update on parametre
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- JOURNAL — audit IMMUABLE des validations commissaire (traçabilité HITL).
-- ---------------------------------------------------------------------------
create table journal (
  id          uuid primary key default gen_random_uuid(),
  dossier_id  uuid references dossier(id) on delete set null,
  acteur_id   uuid,
  acteur_type text,                              -- COMMISSAIRE | CLIENT | SYSTEME
  action      text not null,
  details     jsonb not null default '{}'::jsonb,
  horodatage  timestamptz not null default now()
);
