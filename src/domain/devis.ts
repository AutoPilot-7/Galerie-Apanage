// ============================================================================
// Galerie Apanage — Simulation frais & marge (moteur de calcul pur, cf. §4)
// ----------------------------------------------------------------------------
// Marché FR puis UE. Régime TVA sur marge (occasion) par défaut ; volet import
// (quitus + certificat + douane) refacturé au client. ⚠ Les règles fiscales
// fines sont à faire valider par un professionnel — ici : ossature de calcul.
// ============================================================================

import { DevisLigne } from './types';

export interface SimulationInput {
  prixAchat: number;
  transport?: number;
  importDouane?: number;
  /** Taux de commission (ex. 0.10). Réglage manuel au cas par cas (Paramètres). */
  commissionTaux?: number;
  tvaRegime?: 'TVA_MARGE' | 'TVA_CLASSIQUE';
}

export interface SimulationResult {
  lignes: DevisLigne[];
  montantTotal: number;
  honoraires: number;
  margeSimulee: number;
  tvaRegime: 'TVA_MARGE' | 'TVA_CLASSIQUE';
}

export function simulerDevis(input: SimulationInput): SimulationResult {
  const prixAchat = Math.max(0, input.prixAchat || 0);
  const transport = Math.max(0, input.transport ?? Math.round(prixAchat * 0.04));
  const importDouane = Math.max(0, input.importDouane ?? Math.round(prixAchat * 0.06));
  const taux = input.commissionTaux ?? 0.1;
  const honoraires = Math.round(prixAchat * taux);
  const tvaRegime = input.tvaRegime ?? 'TVA_MARGE';

  const lignes: DevisLigne[] = [
    { libelle: "Prix d'achat du véhicule", categorie: 'ACHAT', montant: prixAchat },
    { libelle: 'Transport & logistique', categorie: 'TRANSPORT', montant: transport },
    { libelle: 'Import / douane (quitus, certificat)', categorie: 'IMPORT_DOUANE', montant: importDouane },
    { libelle: 'Honoraires / commission Galerie Apanage', categorie: 'HONORAIRES', montant: honoraires },
  ];

  const montantTotal = lignes.reduce((a, l) => a + l.montant, 0);
  // Marge simulée = honoraires (la marge réelle sera constatée à la clôture).
  const margeSimulee = honoraires;

  return { lignes, montantTotal, honoraires, margeSimulee, tvaRegime };
}
