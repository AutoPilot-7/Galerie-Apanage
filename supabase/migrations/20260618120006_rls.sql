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
