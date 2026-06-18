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
