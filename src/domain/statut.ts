// ============================================================================
// Galerie Apanage — Machine à états du Dossier (cf. specs §3)
// ----------------------------------------------------------------------------
// UN SEUL champ `statut` pilote tout (Kanban commissaire, frise client, notifs).
// Ce module est la source de vérité CÔTÉ TS ; il DOIT rester aligné sur la
// fonction SQL `dossier_transition_autorisee` (migration 20260618120005).
//
// Human-in-the-loop : aucune transition automatique sur les étapes à enjeu.
// On marque explicitement quelles transitions exigent une validation commissaire
// ou une action client, et on expose des gardes réutilisables par l'API/UI.
// ============================================================================

import { DossierStatut } from './types';

/** Acteur autorisé à déclencher une transition. */
export type Acteur = 'COMMISSAIRE' | 'CLIENT' | 'SYSTEME';

export interface TransitionDef {
  from: DossierStatut;
  to: DossierStatut;
  /** Qui peut déclencher cette transition. */
  acteur: Acteur;
  /** True = étape à enjeu : validation humaine explicite obligatoire (HITL). */
  hitl: boolean;
  /** Libellé de l'action (boutons UI + journal d'audit). */
  action: string;
}

// --- Métadonnées d'affichage (Kanban, frise, badges) ------------------------

export const STATUT_META: Record<
  DossierStatut,
  { ordre: number; label: string; description: string; couleurToken: string }
> = {
  BRIEF: {
    ordre: 1,
    label: 'Brief',
    description: 'Intake conversationnel + audio → trame cahier des charges',
    couleurToken: 'statut-brief',
  },
  REPERAGE: {
    ordre: 2,
    label: 'Repérage',
    description: 'Scrap + collage de liens + ajout manuel',
    couleurToken: 'statut-reperage',
  },
  PROPOSITIONS: {
    ordre: 3,
    label: 'Propositions',
    description: 'Annonces publiées vers le portail client',
    couleurToken: 'statut-propositions',
  },
  VALIDATION: {
    ordre: 4,
    label: 'Validation',
    description: 'Le client valide une proposition',
    couleurToken: 'statut-validation',
  },
  ACQUISITION: {
    ordre: 5,
    label: 'Acquisition',
    description: 'Simulation marge + devis validé',
    couleurToken: 'statut-acquisition',
  },
  PAIEMENT: {
    ordre: 6,
    label: 'Paiement',
    description: 'Échéancier : acompte (séquestre) puis solde',
    couleurToken: 'statut-paiement',
  },
  LIVRAISON: {
    ordre: 7,
    label: 'Livraison',
    description: 'Documents générés + remise',
    couleurToken: 'statut-livraison',
  },
  CLOS: {
    ordre: 8,
    label: 'Clos',
    description: 'Dossier clôturé',
    couleurToken: 'statut-clos',
  },
};

// --- Table des transitions (1:1 avec dossier_transition_autorisee en SQL) ----
// Chaque transition « avant » à enjeu porte hitl=true. Les retours arrière et
// la clôture sont permis au commissaire (corrections), sans être des jalons.

export const TRANSITIONS: TransitionDef[] = [
  // 1 → 2 : ✋ le commissaire valide le cahier des charges (lance le repérage)
  { from: 'BRIEF', to: 'REPERAGE', acteur: 'COMMISSAIRE', hitl: true, action: 'Valider le cahier des charges & lancer le repérage' },
  { from: 'BRIEF', to: 'CLOS', acteur: 'COMMISSAIRE', hitl: false, action: 'Clôturer le dossier' },

  // 2 → 3 : ✋ le commissaire sélectionne les repérages & publie les annonces
  { from: 'REPERAGE', to: 'PROPOSITIONS', acteur: 'COMMISSAIRE', hitl: true, action: 'Publier les propositions retenues' },
  { from: 'REPERAGE', to: 'BRIEF', acteur: 'COMMISSAIRE', hitl: false, action: 'Revenir au brief' },
  { from: 'REPERAGE', to: 'CLOS', acteur: 'COMMISSAIRE', hitl: false, action: 'Clôturer le dossier' },

  // 3 → 4 : le CLIENT valide une proposition depuis le portail (ferme la boucle)
  { from: 'PROPOSITIONS', to: 'VALIDATION', acteur: 'CLIENT', hitl: true, action: 'Valider la proposition' },
  { from: 'PROPOSITIONS', to: 'REPERAGE', acteur: 'COMMISSAIRE', hitl: false, action: 'Relancer le repérage' },
  { from: 'PROPOSITIONS', to: 'CLOS', acteur: 'COMMISSAIRE', hitl: false, action: 'Clôturer le dossier' },

  // 4 → 5 : ✋ le commissaire lance l'acquisition (après validation client)
  { from: 'VALIDATION', to: 'ACQUISITION', acteur: 'COMMISSAIRE', hitl: true, action: 'Lancer l’acquisition' },
  { from: 'VALIDATION', to: 'PROPOSITIONS', acteur: 'COMMISSAIRE', hitl: false, action: 'Revenir aux propositions' },
  { from: 'VALIDATION', to: 'CLOS', acteur: 'COMMISSAIRE', hitl: false, action: 'Clôturer le dossier' },

  // 5 → 6 : ✋ le commissaire valide le devis (passe en paiement)
  { from: 'ACQUISITION', to: 'PAIEMENT', acteur: 'COMMISSAIRE', hitl: true, action: 'Valider le devis & ouvrir l’échéancier' },
  { from: 'ACQUISITION', to: 'VALIDATION', acteur: 'COMMISSAIRE', hitl: false, action: 'Revenir à la validation' },
  { from: 'ACQUISITION', to: 'CLOS', acteur: 'COMMISSAIRE', hitl: false, action: 'Clôturer le dossier' },

  // 6 → 7 : solde encaissé (déclenché par la finance / service de paiement)
  { from: 'PAIEMENT', to: 'LIVRAISON', acteur: 'SYSTEME', hitl: false, action: 'Solde encaissé → livraison' },
  { from: 'PAIEMENT', to: 'ACQUISITION', acteur: 'COMMISSAIRE', hitl: false, action: 'Revenir à l’acquisition' },

  // 7 → fin : remise + clôture
  { from: 'LIVRAISON', to: 'CLOS', acteur: 'COMMISSAIRE', hitl: true, action: 'Confirmer la remise & clôturer' },
  { from: 'LIVRAISON', to: 'PAIEMENT', acteur: 'COMMISSAIRE', hitl: false, action: 'Revenir au paiement' },
];

// --- API de la machine à états ----------------------------------------------

/** Transitions sortantes possibles depuis un statut. */
export function transitionsDepuis(statut: DossierStatut): TransitionDef[] {
  return TRANSITIONS.filter((t) => t.from === statut);
}

/** Une transition from→to est-elle autorisée ? (idempotent : from===to ok) */
export function transitionAutorisee(from: DossierStatut, to: DossierStatut): boolean {
  if (from === to) return true;
  return TRANSITIONS.some((t) => t.from === from && t.to === to);
}

/** Récupère la définition d'une transition, ou null si interdite. */
export function getTransition(from: DossierStatut, to: DossierStatut): TransitionDef | null {
  return TRANSITIONS.find((t) => t.from === from && t.to === to) ?? null;
}

/**
 * Garde human-in-the-loop : valide qu'un acteur a le droit d'effectuer la
 * transition. Lève une erreur explicite sinon. Utilisée par l'API/Server Actions
 * AVANT d'écrire en base (la DB applique en plus sa propre garde + audit).
 */
export class TransitionInterdite extends Error {
  constructor(
    public from: DossierStatut,
    public to: DossierStatut,
    public raison: string,
  ) {
    super(`Transition ${from} → ${to} refusée : ${raison}`);
    this.name = 'TransitionInterdite';
  }
}

export function assertTransition(
  from: DossierStatut,
  to: DossierStatut,
  acteur: Acteur,
): TransitionDef {
  const def = getTransition(from, to);
  if (!def) {
    throw new TransitionInterdite(from, to, 'transition inexistante dans la machine à états');
  }
  // Le commissaire (et le système) peuvent agir au nom du process ; un CLIENT ne
  // peut déclencher QUE les transitions qui lui sont explicitement réservées.
  if (def.acteur === 'CLIENT' && acteur !== 'CLIENT' && acteur !== 'COMMISSAIRE') {
    throw new TransitionInterdite(from, to, 'réservée au client');
  }
  if (def.acteur === 'COMMISSAIRE' && acteur === 'CLIENT') {
    throw new TransitionInterdite(from, to, 'réservée au commissaire (human-in-the-loop)');
  }
  return def;
}

/** Liste ordonnée des statuts du tunnel (hors CLOS) pour la frise client. */
export const STATUTS_TUNNEL: DossierStatut[] = DOSSIER_STATUTS_TUNNEL();
function DOSSIER_STATUTS_TUNNEL(): DossierStatut[] {
  return (Object.keys(STATUT_META) as DossierStatut[])
    .filter((s) => s !== 'CLOS')
    .sort((a, b) => STATUT_META[a].ordre - STATUT_META[b].ordre);
}
