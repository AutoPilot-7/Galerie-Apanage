// ============================================================================
// Galerie Apanage — Implémentations MOCK des services (cf. specs §6 & §10)
// ----------------------------------------------------------------------------
// Placeholders déterministes : permettent de dérouler TOUS les flux de bout en
// bout sans une seule clé. Aucune dépendance réseau. Chaque mock renvoie des
// données plausibles + marque clairement [MOCK] dans ses sorties.
// ============================================================================

import {
  ASRService,
  AnnonceExtraite,
  BankTransaction,
  BankingService,
  ChatMessage,
  EmailService,
  ImageService,
  LLMService,
  PaymentIntent,
  PaymentService,
  ScraperService,
  StorageService,
  ThreeDService,
} from './types';

/** Petit SVG en data-URI : visuel placeholder autonome (zéro réseau). */
function svgPlaceholder(label: string, bg = '#1f2421'): string {
  const safe = label.replace(/[<>&]/g, '').slice(0, 40);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400">
    <rect width="100%" height="100%" fill="${bg}"/>
    <text x="50%" y="48%" fill="#c9a24b" font-family="serif" font-size="22"
      text-anchor="middle">Galerie Apanage</text>
    <text x="50%" y="58%" fill="#e7e9ee" font-family="sans-serif" font-size="14"
      text-anchor="middle">[MOCK] ${safe}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// --- 1. LLM -----------------------------------------------------------------
export class MockLLMService implements LLMService {
  readonly name = 'LLMService';
  readonly mode = 'mock' as const;
  readonly provider = 'mock';

  async chat({ messages }: { messages: ChatMessage[]; system?: string }) {
    const dernier = [...messages].reverse().find((m) => m.role === 'user');
    // Intake conversationnel simulé : pose la « prochaine » question utile.
    const questions = [
      'Quel usage prévoyez-vous (collection, conduite plaisir, investissement) ?',
      'Avez-vous un budget cible et une marge de négociation ?',
      'Une provenance ou un millésime particulier vous tient à cœur ?',
      'Des critères techniques rédhibitoires (kilométrage, boîte, état) ?',
    ];
    const n = messages.filter((m) => m.role === 'assistant').length;
    const suite = questions[n] ?? 'Merci, j’ai de quoi rédiger une première trame de cahier des charges.';
    return {
      reply: `[MOCK] Bien noté${dernier ? ` : « ${dernier.content.slice(0, 80)} »` : ''}. ${suite}`,
    };
  }

  async generateFromTrame({
    trameType,
    contexte,
  }: {
    trameType: string;
    trameContenu: string;
    contexte: Record<string, unknown>;
  }) {
    const ctx = JSON.stringify(contexte);
    return {
      texte:
        `[MOCK · ${trameType}]\n\n` +
        `Document généré à partir de la trame DA et du contexte du Dossier.\n` +
        `Contexte pris en compte : ${ctx.slice(0, 240)}\n\n` +
        `— Rédaction premium, ton galerie d’art. (Remplacer par Mistral en branchant la clé.)`,
    };
  }
}

// --- 2. ASR -----------------------------------------------------------------
export class MockASRService implements ASRService {
  readonly name = 'ASRService';
  readonly mode = 'mock' as const;
  readonly provider = 'mock';

  async transcribe() {
    const segments = [
      { speaker: 'Commissaire', text: 'Bonjour, vous recherchez un modèle en particulier ?', start: 0, end: 4 },
      { speaker: 'Client', text: 'Oui, une youngtimer japonaise, plutôt collection.', start: 4, end: 8 },
      { speaker: 'Commissaire', text: 'Un budget en tête ?', start: 8, end: 10 },
      { speaker: 'Client', text: 'Autour de 120 000 €, provenance saine impérative.', start: 10, end: 14 },
    ];
    return {
      texte: '[MOCK] Transcription FR diarisée :\n' + segments.map((s) => `${s.speaker} : ${s.text}`).join('\n'),
      segments,
    };
  }
}

// --- 3. Image ---------------------------------------------------------------
export class MockImageService implements ImageService {
  readonly name = 'ImageService';
  readonly mode = 'mock' as const;
  readonly provider = 'mock';

  async generate({ prompt }: { prompt: string }) {
    return { url: svgPlaceholder(prompt) };
  }
  async retouch({ prompt }: { sourceUrl: string; prompt: string }) {
    return { url: svgPlaceholder('retouche · ' + prompt) };
  }
}

// --- 4. Scraper -------------------------------------------------------------
export class MockScraperService implements ScraperService {
  readonly name = 'ScraperService';
  readonly mode = 'mock' as const;
  readonly provider = 'mock';

  private fake(url: string, i = 0): AnnonceExtraite {
    const modeles = ['Skyline GT-R R34', 'Supra A80', 'NSX NA1', 'RX-7 FD'];
    return {
      url,
      titre: `[MOCK] ${modeles[i % modeles.length]}`,
      prix: 95000 + i * 15000,
      devise: 'EUR',
      marque: ['Nissan', 'Toyota', 'Honda', 'Mazda'][i % 4],
      modele: modeles[i % modeles.length],
      annee: 1994 + i,
      kilometrage: 45000 + i * 8000,
      photos: [svgPlaceholder('annonce ' + (i + 1))],
      provenanceOrigine: 'Japon (auction sheet)',
      brut: { source: 'mock', note: 'extraction simulée' },
    };
  }
  async extract({ url }: { url: string }) {
    return this.fake(url);
  }
  async search({ sources }: { sources: string[]; criteres: Record<string, unknown> }) {
    const base = sources[0] ?? 'https://mock.source';
    return [0, 1, 2].map((i) => this.fake(`${base}/annonce/${i + 1}`, i));
  }
}

// --- 5. 3D ------------------------------------------------------------------
export class MockThreeDService implements ThreeDService {
  readonly name = 'ThreeDService';
  readonly mode = 'mock' as const;
  readonly provider = 'mock';

  async generateScene({ label }: { photos: string[]; label?: string }) {
    return {
      glbUrl: 'mock://assets3d/scene-placeholder.glb',
      previewUrl: svgPlaceholder('scène 3D · ' + (label ?? 'véhicule'), '#102a22'),
    };
  }
}

// --- 6. Banking -------------------------------------------------------------
export class MockBankingService implements BankingService {
  readonly name = 'BankingService';
  readonly mode = 'mock' as const;
  readonly provider = 'mock';

  async listTransactions({ compteRef }: { compteRef: string; since?: string }): Promise<BankTransaction[]> {
    return [
      { id: `mock-${compteRef}-1`, date: '2026-06-10', montant: 22000, libelle: '[MOCK] Acompte client', contrepartie: 'M. Lefèvre' },
      { id: `mock-${compteRef}-2`, date: '2026-06-12', montant: -130000, libelle: '[MOCK] Décaissement vendeur', contrepartie: 'Auction House JP' },
      { id: `mock-${compteRef}-3`, date: '2026-06-13', montant: 13000, libelle: '[MOCK] Honoraires', contrepartie: 'Galerie Apanage' },
    ];
  }
}

// --- 7. Payment / Séquestre -------------------------------------------------
export class MockPaymentService implements PaymentService {
  readonly name = 'PaymentService';
  readonly mode = 'mock' as const;
  readonly provider = 'mock';

  private intent(montant: number, ref: string, statut: PaymentIntent['statut']): PaymentIntent {
    return {
      id: `mock_pay_${Math.random().toString(36).slice(2, 10)}`,
      statut,
      montant,
      reference: ref,
      checkoutUrl: statut === 'EN_ATTENTE' ? `mock://checkout/${ref}` : undefined,
    };
  }
  async createEscrowPayment({ montant, dossierRef }: { montant: number; dossierRef: string; type: 'ACOMPTE' | 'SOLDE' }) {
    // Simule un encaissement vers le séquestre (wallet ségrégué) : fonds cloisonnés.
    return this.intent(montant, dossierRef, 'EN_ATTENTE');
  }
  async releaseToVendor({ montant, dossierRef }: { montant: number; dossierRef: string; iban?: string }) {
    return this.intent(montant, dossierRef, 'DECAISSE');
  }
  async releaseCommission({ montant, dossierRef }: { montant: number; dossierRef: string }) {
    return this.intent(montant, dossierRef, 'DECAISSE');
  }
  async getStatus(id: string) {
    return { id, statut: 'RECU' as const, montant: 0, reference: id };
  }
}

// --- 8. Email ---------------------------------------------------------------
export class MockEmailService implements EmailService {
  readonly name = 'EmailService';
  readonly mode = 'mock' as const;
  readonly provider = 'mock';

  async sendMagicLink({ email, redirectTo }: { email: string; redirectTo: string }) {
    console.info(`[MOCK EmailService] magic-link → ${email} (redirect: ${redirectTo})`);
    return { sent: true };
  }
  async sendNotification({ to, sujet }: { to: string; sujet: string; corps: string }) {
    console.info(`[MOCK EmailService] notif → ${to} : ${sujet}`);
    return { sent: true };
  }
}

// --- 9. Storage -------------------------------------------------------------
export class MockStorageService implements StorageService {
  readonly name = 'StorageService';
  readonly mode = 'mock' as const;
  readonly provider = 'mock';

  async upload({ bucket, path }: { bucket: string; path: string }) {
    return { url: `mock://${bucket}/${path}` };
  }
  async getSignedUrl({ bucket, path }: { bucket: string; path: string }) {
    return { url: `mock://${bucket}/${path}?signed=mock` };
  }
}
