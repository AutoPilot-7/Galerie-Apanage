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
