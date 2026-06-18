-- ============================================================================
-- Galerie Apanage — INSTALLATION SUPABASE (script unique, projet NEUF)
-- ----------------------------------------------------------------------------
-- À coller tel quel dans : Supabase → SQL Editor → New query → Run.
-- Contient les 8 migrations dans l'ordre (enums, tables, finance, index,
-- machine à états + audit, RLS + séquestre, storage, seed).
-- À exécuter UNE SEULE FOIS sur un projet vide. Région UE conseillée (RGPD).
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════════
-- ║ 20260618120001_enums.sql
-- ╚══════════════════════════════════════════════════════════════════════════
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


-- ╔══════════════════════════════════════════════════════════════════════════
-- ║ 20260618120002_core_tables.sql
-- ╚══════════════════════════════════════════════════════════════════════════
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


-- ╔══════════════════════════════════════════════════════════════════════════
-- ║ 20260618120003_finance_tables.sql
-- ╚══════════════════════════════════════════════════════════════════════════
-- ============================================================================
-- Galerie Apanage — 03 MODULE FINANCIER (cf. specs §4.4)
-- 3 comptes : courant pro / séquestre (fonds clients cloisonnés) / décaissement.
-- Flux : Devis -> Échéancier -> Acompte -> Solde -> Règlement -> décaissement -> honoraires.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- COMPTE BANCAIRE — dont le SÉQUESTRE : fonds clients JAMAIS mélangés à
-- l'exploitation. Le cloisonnement est renforcé par la RLS (migration 06) :
-- écritures réservées au service_role (prestataire de paiement agréé).
-- ---------------------------------------------------------------------------
create table compte_bancaire (
  id          uuid primary key default gen_random_uuid(),
  type        compte_type not null,
  libelle     text not null,
  iban        text,
  solde       numeric(14,2) not null default 0,
  devise      text not null default 'EUR',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ÉCHÉANCE — acompte / solde, rattachée au Dossier (et au Devis).
-- ---------------------------------------------------------------------------
create table echeance (
  id            uuid primary key default gen_random_uuid(),
  dossier_id    uuid not null references dossier(id) on delete cascade,
  devis_id      uuid references devis(id) on delete set null,
  type          echeance_type not null,
  montant       numeric(12,2) not null,
  date_echeance date,
  date_reelle   date,
  compte_id     uuid references compte_bancaire(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- PAIEMENT — encaissement / décaissement / commission, lié à un compte.
-- ---------------------------------------------------------------------------
create table paiement (
  id                uuid primary key default gen_random_uuid(),
  dossier_id        uuid not null references dossier(id) on delete cascade,
  echeance_id       uuid references echeance(id) on delete set null,
  type              paiement_type not null,
  statut            paiement_statut not null default 'EN_ATTENTE',
  montant           numeric(12,2) not null,
  compte_id         uuid references compte_bancaire(id) on delete set null,
  date_prevue       date,
  date_reelle       date,
  reference_externe text,                          -- id côté prestataire (Lemonway…)
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- MOUVEMENT — flux financier pour le rapprochement bancaire.
-- ---------------------------------------------------------------------------
create table mouvement (
  id           uuid primary key default gen_random_uuid(),
  compte_id    uuid not null references compte_bancaire(id) on delete cascade,
  dossier_id   uuid references dossier(id) on delete set null,
  paiement_id  uuid references paiement(id) on delete set null,
  montant      numeric(14,2) not null,             -- signé : + crédit / - débit
  sens         text not null,                      -- CREDIT | DEBIT
  libelle      text,
  rapproche    boolean not null default false,     -- rapprochement bancaire
  horodatage   timestamptz not null default now()
);


-- ╔══════════════════════════════════════════════════════════════════════════
-- ║ 20260618120004_indexes.sql
-- ╚══════════════════════════════════════════════════════════════════════════
-- ============================================================================
-- Galerie Apanage — 04 INDEX
-- Optimise les accès par Dossier (objet pivot) et par statut (Kanban / pilotage).
-- ============================================================================

create index idx_dossier_statut       on dossier(statut);
create index idx_dossier_client       on dossier(client_id);
create index idx_dossier_commissaire  on dossier(commissaire_id);

create index idx_client_auth          on client(auth_user_id);

create index idx_reperage_dossier     on reperage(dossier_id);
create index idx_reperage_statut      on reperage(statut);

create index idx_proposition_dossier  on proposition(dossier_id);

create index idx_publication_statut   on publication(statut);
create index idx_publication_dossier  on publication(dossier_id);
create index idx_publication_prop     on publication(proposition_id);

create index idx_devis_dossier        on devis(dossier_id);

create index idx_echeance_dossier     on echeance(dossier_id);

create index idx_paiement_dossier     on paiement(dossier_id);
create index idx_paiement_compte      on paiement(compte_id);

create index idx_mouvement_compte     on mouvement(compte_id);
create index idx_mouvement_dossier    on mouvement(dossier_id);

create index idx_document_dossier     on document(dossier_id);

create index idx_message_dossier      on message(dossier_id);

create index idx_journal_dossier      on journal(dossier_id);

create index idx_trame_type           on trame(type) where actif;


-- ╔══════════════════════════════════════════════════════════════════════════
-- ║ 20260618120005_state_machine.sql
-- ╚══════════════════════════════════════════════════════════════════════════
-- ============================================================================
-- Galerie Apanage — 05 MACHINE À ÉTATS DU DOSSIER (cf. specs §3)
-- Un seul champ `statut`. Transitions contrôlées + journalisation immuable.
-- Règle : aucune transition automatique sur les étapes à enjeu (1->2, 2->3, 4->5)
-- sans action explicite du commissaire (garde appliquée côté domaine + API).
-- Ici on garantit la cohérence DB et la traçabilité (human-in-the-loop).
-- ============================================================================

-- Transitions autorisées dans le cycle de vie du Dossier.
create or replace function dossier_transition_autorisee(ancien dossier_statut, nouveau dossier_statut)
returns boolean
language plpgsql
immutable
as $$
declare
  transitions jsonb := '{
    "BRIEF":        ["REPERAGE","CLOS"],
    "REPERAGE":     ["PROPOSITIONS","BRIEF","CLOS"],
    "PROPOSITIONS": ["VALIDATION","REPERAGE","CLOS"],
    "VALIDATION":   ["ACQUISITION","PROPOSITIONS","CLOS"],
    "ACQUISITION":  ["PAIEMENT","VALIDATION","CLOS"],
    "PAIEMENT":     ["LIVRAISON","ACQUISITION","CLOS"],
    "LIVRAISON":    ["CLOS","PAIEMENT"],
    "CLOS":         []
  }'::jsonb;
begin
  if ancien = nouveau then
    return true;
  end if;
  return (transitions -> ancien::text) @> to_jsonb(nouveau::text);
end;
$$;

-- Garde + audit : valide la transition et journalise tout changement de statut.
-- SECURITY DEFINER pour pouvoir écrire dans `journal` malgré la RLS.
create or replace function dossier_statut_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if TG_OP = 'UPDATE' and new.statut is distinct from old.statut then
    if not dossier_transition_autorisee(old.statut, new.statut) then
      raise exception 'Transition de statut interdite : % -> %', old.statut, new.statut
        using errcode = 'check_violation';
    end if;

    insert into journal(dossier_id, acteur_id, acteur_type, action, details)
    values (
      new.id,
      auth.uid(),
      'SYSTEME',
      'TRANSITION_STATUT',
      jsonb_build_object('de', old.statut, 'vers', new.statut)
    );
  end if;
  return new;
end;
$$;

create trigger trg_dossier_statut_guard
  before update on dossier
  for each row execute function dossier_statut_guard();


-- ╔══════════════════════════════════════════════════════════════════════════
-- ║ 20260618120006_rls.sql
-- ╚══════════════════════════════════════════════════════════════════════════
-- ============================================================================
-- Galerie Apanage — 06 RLS (Row Level Security)
-- Cloisonne client / commissaire ET la logique de SÉQUESTRE (fonds clients).
--   - anon          : lecture seule des propositions PUBLIÉES (vitrine).
--   - client        : voit UNIQUEMENT son Dossier (suivi, propositions publiées,
--                     devis validés, échéances, paiements, documents, messages).
--   - commissaire   : accès complet au pilotage ; lecture seule de la finance.
--   - service_role  : bypass RLS — seul habilité à ÉCRIRE la finance (séquestre).
-- ============================================================================

-- --------------------------------------------------------------------------
-- Helpers de rôle (SECURITY DEFINER pour lire app_user/client sous RLS)
-- --------------------------------------------------------------------------
create or replace function is_commissaire()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from app_user where id = auth.uid());
$$;

create or replace function current_client_id()
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select id from client where auth_user_id = auth.uid() limit 1;
$$;

-- Le Dossier appartient-il au client connecté ?
create or replace function dossier_du_client(d uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from dossier
    where id = d and client_id = current_client_id()
  );
$$;

-- --------------------------------------------------------------------------
-- Activation RLS sur toutes les tables
-- --------------------------------------------------------------------------
alter table app_user        enable row level security;
alter table client          enable row level security;
alter table dossier         enable row level security;
alter table trame           enable row level security;
alter table reperage        enable row level security;
alter table proposition     enable row level security;
alter table publication     enable row level security;
alter table devis           enable row level security;
alter table document        enable row level security;
alter table message         enable row level security;
alter table source_scrap    enable row level security;
alter table parametre       enable row level security;
alter table journal         enable row level security;
alter table compte_bancaire enable row level security;
alter table echeance        enable row level security;
alter table paiement        enable row level security;
alter table mouvement       enable row level security;

-- --------------------------------------------------------------------------
-- app_user : commissaires/admins lisent ; chacun lit sa propre ligne
-- --------------------------------------------------------------------------
create policy app_user_self_read on app_user
  for select to authenticated using (id = auth.uid() or is_commissaire());

-- --------------------------------------------------------------------------
-- client : commissaire accès complet ; client lit sa fiche
-- --------------------------------------------------------------------------
create policy client_commissaire_all on client
  for all to authenticated using (is_commissaire()) with check (is_commissaire());
create policy client_self_read on client
  for select to authenticated using (auth_user_id = auth.uid());

-- --------------------------------------------------------------------------
-- dossier : commissaire accès complet ; client lit ses dossiers
-- --------------------------------------------------------------------------
create policy dossier_commissaire_all on dossier
  for all to authenticated using (is_commissaire()) with check (is_commissaire());
create policy dossier_client_read on dossier
  for select to authenticated using (client_id = current_client_id());

-- --------------------------------------------------------------------------
-- trame (Base DA) : commissaire/admin uniquement
-- --------------------------------------------------------------------------
create policy trame_commissaire_all on trame
  for all to authenticated using (is_commissaire()) with check (is_commissaire());

-- --------------------------------------------------------------------------
-- reperage : commissaire uniquement (le client ne voit pas le repérage brut)
-- --------------------------------------------------------------------------
create policy reperage_commissaire_all on reperage
  for all to authenticated using (is_commissaire()) with check (is_commissaire());

-- --------------------------------------------------------------------------
-- proposition : commissaire complet ; client lit celles de SON dossier qui
-- sont PUBLIÉES ; anon lit les propositions publiées (vitrine).
-- --------------------------------------------------------------------------
create policy proposition_commissaire_all on proposition
  for all to authenticated using (is_commissaire()) with check (is_commissaire());
create policy proposition_client_read on proposition
  for select to authenticated using (
    dossier_du_client(dossier_id)
    and exists (
      select 1 from publication p
      where p.proposition_id = proposition.id and p.statut = 'PUBLIEE'
    )
  );
create policy proposition_public_read on proposition
  for select to anon using (
    exists (
      select 1 from publication p
      where p.proposition_id = proposition.id and p.statut = 'PUBLIEE'
    )
  );

-- --------------------------------------------------------------------------
-- publication : commissaire complet ; lecture publique des PUBLIÉES (vitrine)
-- --------------------------------------------------------------------------
create policy publication_commissaire_all on publication
  for all to authenticated using (is_commissaire()) with check (is_commissaire());
create policy publication_public_read on publication
  for select to anon, authenticated using (statut = 'PUBLIEE');

-- --------------------------------------------------------------------------
-- devis : commissaire complet ; client lit ses devis VALIDÉS
-- --------------------------------------------------------------------------
create policy devis_commissaire_all on devis
  for all to authenticated using (is_commissaire()) with check (is_commissaire());
create policy devis_client_read on devis
  for select to authenticated using (
    dossier_du_client(dossier_id) and statut = 'VALIDE'
  );

-- --------------------------------------------------------------------------
-- document : commissaire complet ; client lit les documents de son dossier
-- --------------------------------------------------------------------------
create policy document_commissaire_all on document
  for all to authenticated using (is_commissaire()) with check (is_commissaire());
create policy document_client_read on document
  for select to authenticated using (dossier_du_client(dossier_id));

-- --------------------------------------------------------------------------
-- message : commissaire complet ; client lit + écrit sur SON dossier
-- --------------------------------------------------------------------------
create policy message_commissaire_all on message
  for all to authenticated using (is_commissaire()) with check (is_commissaire());
create policy message_client_read on message
  for select to authenticated using (dossier_du_client(dossier_id));
create policy message_client_write on message
  for insert to authenticated with check (
    dossier_du_client(dossier_id) and auteur = 'CLIENT'
  );

-- --------------------------------------------------------------------------
-- source_scrap / parametre / journal : commissaire/admin uniquement
-- --------------------------------------------------------------------------
create policy source_scrap_commissaire_all on source_scrap
  for all to authenticated using (is_commissaire()) with check (is_commissaire());
create policy parametre_commissaire_all on parametre
  for all to authenticated using (is_commissaire()) with check (is_commissaire());
create policy journal_commissaire_read on journal
  for select to authenticated using (is_commissaire());

-- ==========================================================================
-- FINANCE — SÉQUESTRE CLOISONNÉ
-- Aucune visibilité client. Commissaire : LECTURE SEULE (pilotage).
-- Écritures (encaissement, décaissement, commission, mouvements) : service_role
-- uniquement, qui bypass la RLS => garantit que les fonds clients ne sont
-- jamais mélangés à l'exploitation via une écriture applicative directe.
-- ==========================================================================
create policy compte_commissaire_read on compte_bancaire
  for select to authenticated using (is_commissaire());

create policy echeance_commissaire_read on echeance
  for select to authenticated using (is_commissaire());
create policy echeance_client_read on echeance
  for select to authenticated using (dossier_du_client(dossier_id));

create policy paiement_commissaire_read on paiement
  for select to authenticated using (is_commissaire());
create policy paiement_client_read on paiement
  for select to authenticated using (dossier_du_client(dossier_id));

create policy mouvement_commissaire_read on mouvement
  for select to authenticated using (is_commissaire());

-- NB : pas de policy INSERT/UPDATE/DELETE sur compte_bancaire / mouvement, et
-- pas de policy d'écriture commissaire sur echeance / paiement => ces écritures
-- passent par le service_role (couche services serveur), jamais par le client
-- ni par une session commissaire navigateur. Cloisonnement séquestre garanti.


-- ╔══════════════════════════════════════════════════════════════════════════
-- ║ 20260618120007_storage.sql
-- ╚══════════════════════════════════════════════════════════════════════════
-- ============================================================================
-- Galerie Apanage — 07 STORAGE (buckets)
--   photos    : public  (visuels produit / vitrine)
--   assets3d  : public  (scènes GLB / aperçus immersifs)
--   documents : privé   (PDF devis, remise, certificats — URLs signées serveur)
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('photos',    'photos',    true),
  ('assets3d',  'assets3d',  true),
  ('documents', 'documents', false)
on conflict (id) do nothing;

-- Lecture publique des buckets publics (vitrine / portail)
create policy "storage_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('photos','assets3d'));

-- Commissaires : écriture/gestion sur tous les buckets
create policy "storage_commissaire_write"
  on storage.objects for all
  to authenticated
  using (is_commissaire())
  with check (is_commissaire());

-- Documents privés : lecture réservée aux commissaires ;
-- les clients y accèdent via des URLs signées générées côté serveur.
create policy "storage_documents_commissaire_read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents' and is_commissaire());


-- ╔══════════════════════════════════════════════════════════════════════════
-- ║ 20260618120008_seed.sql
-- ╚══════════════════════════════════════════════════════════════════════════
-- ============================================================================
-- Galerie Apanage — 08 SEED (données de démarrage, idempotent)
-- Base DA (trames), whitelist scrap, 3 comptes, réglages, + données démo Kanban.
-- N'insère AUCUN compte auth (créés au 1er magic-link). commissaire_id reste null.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Base DA : une trame par type de génération IA (versionnées)
-- --------------------------------------------------------------------------
insert into trame (type, nom, contenu, version) values
  ('CAHIER_DES_CHARGES', 'Trame Cahier des charges v1',
   'À partir du brief client et de la transcription d''appel, rédige un cahier des charges structuré : besoin, usage, budget, critères techniques (marque, modèle, millésime, kilométrage, état), contraintes (éligibilité ≤ 10 ans, sourcing). Ton sobre, premium.', 1),
  ('RAPPORT_COMMISSAIRE', 'Trame Rapport technique commissaire v1',
   'Rédige un rapport technique interne à partir de la fiche d''inspection : points forts, réserves, cohérence prix/marché FR+UE, recommandation d''acquisition.', 1),
  ('RAPPORT_CLIENT', 'Trame Rapport technique client v1',
   'Rédige un rapport technique destiné au client, pédagogique et rassurant, à partir de l''inspection : état général, historique, provenance, valeur.', 1),
  ('ANNONCE', 'Trame Rédaction d''annonce v1',
   'Rédige l''annonce de la proposition retenue : titre accrocheur sobre, description premium, points clés, provenance. Style galerie d''art.', 1),
  ('PHOTO', 'Trame / Prompt photo produit v1',
   'Prompt de retouche/mise en scène produit : éclairage studio, fond neutre, mise en valeur des lignes, rendu éditorial luxe.', 1),
  ('DEVIS', 'Trame Devis v1',
   'Génère le devis à partir de la simulation de frais : prix d''achat, transport, import/douane (quitus, certificat), honoraires/commission, régime TVA applicable. Total TTC, échéancier acompte/solde.', 1)
on conflict do nothing;

-- --------------------------------------------------------------------------
-- Whitelist des sources de scrap autorisées (conformité §8 specs)
-- --------------------------------------------------------------------------
insert into source_scrap (nom, url_base, domaine, actif) values
  ('Saisie manuelle / lien direct', '', 'manuel', true),
  ('Catawiki',  'https://www.catawiki.com',  'catawiki.com',  true),
  ('Collecting Cars', 'https://collectingcars.com', 'collectingcars.com', true)
on conflict do nothing;

-- --------------------------------------------------------------------------
-- Module financier : 3 comptes cloisonnés
-- --------------------------------------------------------------------------
insert into compte_bancaire (type, libelle, devise) values
  ('COURANT_PRO',  'Compte courant pro (exploitation)', 'EUR'),
  ('SEQUESTRE',    'Compte séquestre / de tiers (fonds clients)', 'EUR'),
  ('DECAISSEMENT', 'Compte de décaissement (vendeurs/fournisseurs)', 'EUR')
on conflict do nothing;

-- --------------------------------------------------------------------------
-- Réglages (paramètres manuels)
-- --------------------------------------------------------------------------
insert into parametre (cle, valeur) values
  ('commission',        '{"mode":"manuel","taux_indicatif":0.10}'::jsonb),
  ('eligibilite_age',   '{"age_max_annees":10}'::jsonb),
  ('perimetre_sourcing','{"origine":["Japon","Coree"],"destination":"France","option":"UE"}'::jsonb),
  ('langues',           '{"actives":["FR","EN"]}'::jsonb),
  ('tva',               '{"regime_defaut":"TVA_MARGE"}'::jsonb)
on conflict (cle) do nothing;

-- --------------------------------------------------------------------------
-- Données démo (Kanban) — clients + dossiers répartis sur les statuts.
-- UUID fixes pour idempotence.
-- --------------------------------------------------------------------------
insert into client (id, nom, email, telephone, langue) values
  ('11111111-1111-1111-1111-111111111111', 'M. Lefèvre',  'lefevre@example.com',  '+33600000001', 'FR'),
  ('22222222-2222-2222-2222-222222222222', 'Mrs. Tanaka', 'tanaka@example.com',   '+81900000002', 'EN')
on conflict (id) do nothing;

insert into dossier (id, reference, statut, client_id, vehicule_marque, vehicule_modele, montant_estime, marge_estimee, prochaine_action) values
  ('aaaaaaa1-0000-0000-0000-000000000001', 'GA-2026-0001', 'BRIEF',        '11111111-1111-1111-1111-111111111111', 'Porsche', '911 (993) Turbo', 220000, 22000, 'Valider le cahier des charges'),
  ('aaaaaaa2-0000-0000-0000-000000000002', 'GA-2026-0002', 'REPERAGE',     '22222222-2222-2222-2222-222222222222', 'Nissan',  'Skyline GT-R R34', 180000, 18000, 'Sélectionner les repérages'),
  ('aaaaaaa3-0000-0000-0000-000000000003', 'GA-2026-0003', 'PROPOSITIONS', '11111111-1111-1111-1111-111111111111', 'Toyota',  'Supra A80', 95000, 12000, 'Attente validation client'),
  ('aaaaaaa4-0000-0000-0000-000000000004', 'GA-2026-0004', 'ACQUISITION',  '22222222-2222-2222-2222-222222222222', 'Honda',   'NSX (NA1)', 130000, 15000, 'Valider le devis')
on conflict (id) do nothing;


-- ============================================================================
-- POST-CONNEXION (à exécuter APRÈS ta 1re connexion magic-link)
-- ----------------------------------------------------------------------------
-- La RLS donne accès selon le rôle. Un nouvel utilisateur magic-link a une ligne
-- dans auth.users mais PAS dans app_user/client => il ne voit rien tant qu'on ne
-- le rattache pas. Connecte-toi une fois via /login, puis exécute :

-- 1) Te déclarer COMMISSAIRE (remplace l'e-mail) :
-- insert into app_user (id, email, nom, role)
-- select id, email, 'Commissaire', 'COMMISSAIRE'
--   from auth.users where email = 'TON_EMAIL@exemple.fr'
-- on conflict (id) do nothing;

-- 2) (Optionnel) Rattacher un CLIENT de démo à un compte e-mail pour tester le
--    Portail (le client ne verra alors QUE ses dossiers) :
-- update client
--    set auth_user_id = (select id from auth.users where email = 'CLIENT_EMAIL@exemple.fr')
--  where email = 'lefevre@example.com';

-- 3) Configuration Auth (Dashboard → Authentication → URL Configuration) :
--    Site URL           = https://TON-DOMAINE.vercel.app
--    Redirect URLs (add)= https://TON-DOMAINE.vercel.app/auth/callback
--                         http://localhost:3000/auth/callback
-- ============================================================================
