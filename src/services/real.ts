// ============================================================================
// Galerie Apanage — Implémentations RÉELLES (branchement progressif, cf. §6)
// ----------------------------------------------------------------------------
// Activées UNIQUEMENT quand la clé du service est présente (cf. src/lib/env.ts).
// Certaines tâches sont déjà câblées (LLM Mistral, Image Pollinations, Email
// Brevo, Storage Supabase). Les autres exposent un squelette explicite : opter
// pour un provider réel exige d'implémenter la méthode marquée (le mock reste
// le défaut tant que rien n'est branché). Tout tourne CÔTÉ SERVEUR.
// ============================================================================

import { env } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  ASRService,
  BankingService,
  ChatMessage,
  EmailService,
  ImageService,
  LLMService,
  PaymentService,
  ScraperService,
  StorageService,
  ThreeDService,
} from './types';

function nonBranche(service: string, methode: string): never {
  throw new Error(
    `[${service}.${methode}] provider réel sélectionné mais non encore implémenté. ` +
      `Implémentez-le dans src/services/real.ts, ou repassez le provider sur « mock ».`,
  );
}

// --- 1. LLM — Mistral (UE) --------------------------------------------------
export class RealLLMService implements LLMService {
  readonly name = 'LLMService';
  readonly mode = 'real' as const;
  readonly provider = 'mistral';

  private async call(messages: ChatMessage[]): Promise<string> {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.llm.mistralKey}`,
      },
      body: JSON.stringify({ model: env.llm.mistralModel, messages }),
    });
    if (!res.ok) throw new Error(`Mistral ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { choices: { message: { content: string } }[] };
    return json.choices[0]?.message?.content ?? '';
  }

  async chat({ messages, system }: { messages: ChatMessage[]; system?: string }) {
    const full = system ? [{ role: 'system' as const, content: system }, ...messages] : messages;
    return { reply: await this.call(full) };
  }

  async generateFromTrame({
    trameContenu,
    contexte,
  }: {
    trameType: string;
    trameContenu: string;
    contexte: Record<string, unknown>;
  }) {
    const messages: ChatMessage[] = [
      { role: 'system', content: trameContenu },
      { role: 'user', content: `Contexte du Dossier (JSON) :\n${JSON.stringify(contexte, null, 2)}` },
    ];
    return { texte: await this.call(messages) };
  }
}

// --- 3. Image — Pollinations (sans clé) -------------------------------------
export class RealImageService implements ImageService {
  readonly name = 'ImageService';
  readonly mode = 'real' as const;
  readonly provider = 'pollinations';

  async generate({ prompt }: { prompt: string; ratio?: string }) {
    // Pollinations sert l'image directement via URL (pas d'appel à attendre).
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
    return { url };
  }
  async retouch({ sourceUrl, prompt }: { sourceUrl: string; prompt: string }) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(`${prompt} (ref: ${sourceUrl})`)}`;
    return { url };
  }
}

// --- 8. Email — Brevo (FR) --------------------------------------------------
export class RealEmailService implements EmailService {
  readonly name = 'EmailService';
  readonly mode = 'real' as const;
  readonly provider = 'brevo';

  private async send(to: string, subject: string, htmlContent: string) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': env.email.brevoKey! },
      body: JSON.stringify({
        sender: { email: env.email.from, name: 'Galerie Apanage' },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });
    return { sent: res.ok };
  }
  async sendMagicLink({ email, redirectTo }: { email: string; redirectTo: string }) {
    // NB : Supabase Auth envoie nativement le magic-link. Ce relais Brevo sert
    // aux relances / notifications. On renvoie le lien fourni par l'appelant.
    return this.send(email, 'Votre accès Galerie Apanage', `<p><a href="${redirectTo}">Accéder à mon espace</a></p>`);
  }
  async sendNotification({ to, sujet, corps }: { to: string; sujet: string; corps: string }) {
    return this.send(to, sujet, `<p>${corps}</p>`);
  }
}

// --- 9. Storage — Supabase Storage ------------------------------------------
export class RealStorageService implements StorageService {
  readonly name = 'StorageService';
  readonly mode = 'real' as const;
  readonly provider = 'supabase';

  async upload({
    bucket,
    path,
    data,
    contentType,
  }: {
    bucket: 'photos' | 'assets3d' | 'documents';
    path: string;
    data: ArrayBuffer | Uint8Array | string;
    contentType?: string;
  }) {
    const admin = createAdminClient();
    if (!admin) nonBranche('StorageService', 'upload (service_role requis)');
    const { error } = await admin.storage.from(bucket).upload(path, data as ArrayBuffer, {
      contentType,
      upsert: true,
    });
    if (error) throw error;
    const { data: pub } = admin.storage.from(bucket).getPublicUrl(path);
    return { url: pub.publicUrl };
  }

  async getSignedUrl({
    bucket,
    path,
    expiresIn = 3600,
  }: {
    bucket: 'photos' | 'assets3d' | 'documents';
    path: string;
    expiresIn?: number;
  }) {
    const admin = createAdminClient();
    if (!admin) nonBranche('StorageService', 'getSignedUrl (service_role requis)');
    if (bucket === 'documents') {
      const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, expiresIn);
      if (error) throw error;
      return { url: data.signedUrl };
    }
    const { data } = admin.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl };
  }
}

// --- Squelettes : à implémenter lors du branchement du provider -------------
// (le mock reste actif par défaut ; ces classes ne sont instanciées QUE si la
//  clé correspondante est fournie ET le provider ≠ mock)

export class RealASRService implements ASRService {
  readonly name = 'ASRService';
  readonly mode = 'real' as const;
  readonly provider = env.asr.provider;
  async transcribe(): ReturnType<ASRService['transcribe']> {
    return nonBranche('ASRService', 'transcribe (AssemblyAI/Gladia)');
  }
}

export class RealScraperService implements ScraperService {
  readonly name = 'ScraperService';
  readonly mode = 'real' as const;
  readonly provider = env.scraper.provider;
  async extract(): ReturnType<ScraperService['extract']> {
    return nonBranche('ScraperService', 'extract');
  }
  async search(): ReturnType<ScraperService['search']> {
    return nonBranche('ScraperService', 'search');
  }
}

export class RealThreeDService implements ThreeDService {
  readonly name = 'ThreeDService';
  readonly mode = 'real' as const;
  readonly provider = env.threed.provider;
  async generateScene(): ReturnType<ThreeDService['generateScene']> {
    return nonBranche('ThreeDService', 'generateScene (Luma/higgsfield)');
  }
}

export class RealBankingService implements BankingService {
  readonly name = 'BankingService';
  readonly mode = 'real' as const;
  readonly provider = env.banking.provider;
  async listTransactions(): ReturnType<BankingService['listTransactions']> {
    return nonBranche('BankingService', 'listTransactions (GoCardless/Bridge/Powens)');
  }
}

export class RealPaymentService implements PaymentService {
  readonly name = 'PaymentService';
  readonly mode = 'real' as const;
  readonly provider = env.payment.provider;
  async createEscrowPayment(): ReturnType<PaymentService['createEscrowPayment']> {
    return nonBranche('PaymentService', 'createEscrowPayment (Lemonway/Mangopay)');
  }
  async releaseToVendor(): ReturnType<PaymentService['releaseToVendor']> {
    return nonBranche('PaymentService', 'releaseToVendor');
  }
  async releaseCommission(): ReturnType<PaymentService['releaseCommission']> {
    return nonBranche('PaymentService', 'releaseCommission');
  }
  async getStatus(): ReturnType<PaymentService['getStatus']> {
    return nonBranche('PaymentService', 'getStatus');
  }
}
