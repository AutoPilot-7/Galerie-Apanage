// Tests a minima — machine à états du Dossier (doit refléter la garde SQL).
import { describe, it, expect } from 'vitest';
import { assertTransition, transitionAutorisee, transitionsDepuis, TRANSITIONS, TransitionInterdite } from './statut';
import { DOSSIER_STATUTS } from './types';

describe('transitions (miroir de dossier_transition_autorisee SQL)', () => {
  it('autorise les avancées du tunnel', () => {
    expect(transitionAutorisee('BRIEF', 'REPERAGE')).toBe(true);
    expect(transitionAutorisee('REPERAGE', 'PROPOSITIONS')).toBe(true);
    expect(transitionAutorisee('PROPOSITIONS', 'VALIDATION')).toBe(true);
    expect(transitionAutorisee('VALIDATION', 'ACQUISITION')).toBe(true);
    expect(transitionAutorisee('ACQUISITION', 'PAIEMENT')).toBe(true);
    expect(transitionAutorisee('PAIEMENT', 'LIVRAISON')).toBe(true);
    expect(transitionAutorisee('LIVRAISON', 'CLOS')).toBe(true);
  });
  it('refuse les sauts d’étape', () => {
    expect(transitionAutorisee('BRIEF', 'ACQUISITION')).toBe(false);
    expect(transitionAutorisee('BRIEF', 'PAIEMENT')).toBe(false);
    expect(transitionAutorisee('CLOS', 'BRIEF')).toBe(false);
  });
  it('idempotent (from === to)', () => {
    expect(transitionAutorisee('BRIEF', 'BRIEF')).toBe(true);
  });
  it('toutes les transitions pointent vers des statuts connus', () => {
    for (const t of TRANSITIONS) {
      expect(DOSSIER_STATUTS).toContain(t.from);
      expect(DOSSIER_STATUTS).toContain(t.to);
    }
  });
});

describe('gardes human-in-the-loop', () => {
  it('1→2 est réservé au commissaire (le client ne peut pas)', () => {
    expect(() => assertTransition('BRIEF', 'REPERAGE', 'CLIENT')).toThrow(TransitionInterdite);
    expect(assertTransition('BRIEF', 'REPERAGE', 'COMMISSAIRE').hitl).toBe(true);
  });
  it('3→4 (validation) est déclenchable par le client', () => {
    const def = assertTransition('PROPOSITIONS', 'VALIDATION', 'CLIENT');
    expect(def.acteur).toBe('CLIENT');
    expect(def.hitl).toBe(true);
  });
  it('4→5 (lancement acquisition) est réservé au commissaire', () => {
    expect(() => assertTransition('VALIDATION', 'ACQUISITION', 'CLIENT')).toThrow(TransitionInterdite);
    expect(assertTransition('VALIDATION', 'ACQUISITION', 'COMMISSAIRE').hitl).toBe(true);
  });
  it('refuse une transition inexistante', () => {
    expect(() => assertTransition('BRIEF', 'CLOS', 'COMMISSAIRE')).not.toThrow(); // BRIEF→CLOS existe
    expect(() => assertTransition('BRIEF', 'LIVRAISON', 'COMMISSAIRE')).toThrow(TransitionInterdite);
  });
  it('expose les sorties depuis un statut', () => {
    const tos = transitionsDepuis('BRIEF').map((t) => t.to);
    expect(tos).toContain('REPERAGE');
    expect(tos).toContain('CLOS');
  });
});
