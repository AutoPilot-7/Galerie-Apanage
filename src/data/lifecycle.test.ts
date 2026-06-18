// Tests a minima — cycle de vie complet d'un Dossier via le MockDataSource.
// Vérifie le tunnel BRIEF → … → CLOS, la garde HITL et la journalisation.
import { describe, it, expect } from 'vitest';
import { MockDataSource } from './mock-store';
import { TransitionInterdite } from '@/domain/statut';

describe('cycle de vie du Dossier (mock)', () => {
  it('déroule le tunnel complet avec audit', async () => {
    const data = new MockDataSource();
    const client = await data.createClient({ nom: 'Test', email: 't@ex.fr' });
    const d = await data.createDossier({ clientId: client.id, vehiculeMarque: 'Mazda', vehiculeModele: 'RX-7' });
    expect(d.statut).toBe('BRIEF');
    expect(d.reference).toMatch(/^GA-\d{4}-\d{4}$/);

    await data.transitionDossier(d.id, 'REPERAGE', 'COMMISSAIRE');
    await data.transitionDossier(d.id, 'PROPOSITIONS', 'COMMISSAIRE');
    await data.transitionDossier(d.id, 'VALIDATION', 'CLIENT'); // validation client
    await data.transitionDossier(d.id, 'ACQUISITION', 'COMMISSAIRE');
    await data.transitionDossier(d.id, 'PAIEMENT', 'COMMISSAIRE');
    await data.transitionDossier(d.id, 'LIVRAISON', 'SYSTEME'); // solde encaissé
    const fin = await data.transitionDossier(d.id, 'CLOS', 'COMMISSAIRE');
    expect(fin.statut).toBe('CLOS');

    const complet = await data.getDossier(d.id);
    expect(complet?.journal.filter((j) => j.action === 'TRANSITION_STATUT').length).toBe(7);
  });

  it('bloque une transition interdite (garde HITL)', async () => {
    const data = new MockDataSource();
    const client = await data.createClient({ nom: 'Test2', email: 't2@ex.fr' });
    const d = await data.createDossier({ clientId: client.id });
    // Le client ne peut pas valider le cahier des charges (réservé commissaire).
    await expect(data.transitionDossier(d.id, 'REPERAGE', 'CLIENT')).rejects.toBeInstanceOf(TransitionInterdite);
    // Saut d'étape interdit.
    await expect(data.transitionDossier(d.id, 'PAIEMENT', 'COMMISSAIRE')).rejects.toBeInstanceOf(TransitionInterdite);
  });

  it('enregistre un encaissement séquestre et met à jour le solde', async () => {
    const data = new MockDataSource();
    const client = await data.createClient({ nom: 'Test3', email: 't3@ex.fr' });
    const d = await data.createDossier({ clientId: client.id });
    const p = await data.enregistrerEncaissement({ dossierId: d.id, type: 'ACOMPTE', montant: 30000, compteType: 'SEQUESTRE' });
    expect(p.statut).toBe('RECU');
    const comptes = await data.listComptes();
    const sequestre = comptes.find((c) => c.type === 'SEQUESTRE');
    expect(Number(sequestre?.solde)).toBeGreaterThanOrEqual(30000);
  });
});
