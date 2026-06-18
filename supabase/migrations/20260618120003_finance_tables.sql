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
