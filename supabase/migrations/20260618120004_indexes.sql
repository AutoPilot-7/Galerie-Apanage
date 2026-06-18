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
