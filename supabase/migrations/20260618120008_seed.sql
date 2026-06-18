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
