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
  AnnonceExtraite,
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

// --- 1. LLM — Mistral (UE) ou OpenRouter (passerelle multi-modèles) ---------
// Les deux exposent une API compatible OpenAI (/chat/completions). On choisit
// l'endpoint + la clé + le modèle selon le provider sélectionné dans l'env.
export class RealLLMService implements LLMService {
  readonly name = 'LLMService';
  readonly mode = 'real' as const;
  readonly provider = env.llm.provider === 'openrouter' ? 'openrouter' : 'mistral';

  private endpoint() {
    return this.provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.mistral.ai/v1/chat/completions';
  }
  private apiKey() {
    return this.provider === 'openrouter' ? env.llm.openrouterKey : env.llm.mistralKey;
  }
  private model() {
    return this.provider === 'openrouter' ? env.llm.openrouterModel : env.llm.mistralModel;
  }

  private async call(messages: ChatMessage[]): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey()}`,
    };
    if (this.provider === 'openrouter') {
      // En-têtes recommandés par OpenRouter pour l'attribution.
      headers['HTTP-Referer'] = env.site.url;
      headers['X-Title'] = 'Galerie Apanage';
    }
    const res = await fetch(this.endpoint(), {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: this.model(), messages }),
    });
    if (!res.ok) throw new Error(`${this.provider} ${res.status}: ${await res.text()}`);
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

  private dims(ratio?: string) {
    if (ratio === '16:9') return { width: 1280, height: 720 };
    if (ratio === '4:3') return { width: 1024, height: 768 };
    return { width: 1024, height: 1024 };
  }
  private build(prompt: string, ratio?: string) {
    const { width, height } = this.dims(ratio);
    const qs = new URLSearchParams({ width: String(width), height: String(height), nologo: 'true' });
    if (env.image.pollinationsKey) qs.set('token', env.image.pollinationsKey);
    // Pollinations sert l'image directement via URL (pas d'appel à attendre).
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${qs.toString()}`;
  }
  async generate({ prompt, ratio }: { prompt: string; ratio?: string }) {
    return { url: this.build(prompt, ratio) };
  }
  async retouch({ sourceUrl, prompt }: { sourceUrl: string; prompt: string }) {
    return { url: this.build(`${prompt} (ref: ${sourceUrl})`) };
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

// --- 2. ASR — Groq Whisper (large-v3) ---------------------------------------
// Groq expose une API compatible OpenAI pour la transcription. On récupère
// l'audio (URL ou base64), on le POST en multipart à /audio/transcriptions.
export class RealASRService implements ASRService {
  readonly name = 'ASRService';
  readonly mode = 'real' as const;
  readonly provider = env.asr.provider;

  async transcribe({
    audioUrl,
    audioBase64,
  }: {
    audioUrl?: string;
    audioBase64?: string;
  }): ReturnType<ASRService['transcribe']> {
    if (env.asr.provider !== 'groq' || !env.asr.groqKey) {
      return nonBranche('ASRService', 'transcribe (provider=groq + GROQ_API_KEY requis)');
    }
    // Charge les octets audio depuis l'URL ou le base64 fourni.
    let bytes: ArrayBuffer;
    if (audioUrl) {
      const r = await fetch(audioUrl);
      if (!r.ok) throw new Error(`ASR: téléchargement audio ${r.status}`);
      bytes = await r.arrayBuffer();
    } else if (audioBase64) {
      const b64 = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
      bytes = Uint8Array.from(Buffer.from(b64, 'base64')).buffer;
    } else {
      throw new Error('ASR: audioUrl ou audioBase64 requis');
    }

    const form = new FormData();
    form.append('file', new Blob([bytes]), 'audio.mp3');
    form.append('model', env.asr.groqModel);
    form.append('language', 'fr');
    form.append('response_format', 'verbose_json');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.asr.groqKey}` },
      body: form,
    });
    if (!res.ok) throw new Error(`Groq Whisper ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as {
      text: string;
      segments?: { start: number; end: number; text: string }[];
    };
    const segments = (json.segments ?? []).map((s) => ({
      speaker: 'SPEAKER_0', // Whisper ne diarise pas : un seul locuteur par défaut.
      text: s.text.trim(),
      start: s.start,
      end: s.end,
    }));
    return { texte: json.text, segments };
  }
}

export class RealScraperService implements ScraperService {
  readonly name = 'ScraperService';
  readonly mode = 'real' as const;
  readonly provider = env.scraper.provider;

  async extract({ url }: { url: string }): ReturnType<ScraperService['extract']> {
    // Fetch du HTML brut de l'annonce (User-Agent navigateur pour éviter les 403).
    let html = '';
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GalerieApanage/1.0)' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) html = await res.text();
    } catch {
      // Réseau indisponible — on continue avec un HTML vide, le LLM fera ce qu'il peut.
    }

    // Extraction via LLM : on lui donne le HTML tronqué (max 8 000 chars) + l'URL.
    const llm = new RealLLMService();
    const snippet = html.replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 8000);

    const prompt = `Tu es un extracteur d'annonces automobiles. Extrait les informations de cette annonce et renvoie UNIQUEMENT un JSON valide (sans markdown) avec les champs : titre, prix (nombre ou null), devise ("EUR" ou null), marque, modele, annee (nombre ou null), kilometrage (nombre ou null), photos (tableau d'URLs ou []).

URL : ${url}
Contenu de la page :
${snippet}`;

    let parsed: Partial<AnnonceExtraite> = {};
    try {
      const raw = await llm['call']([{ role: 'user', content: prompt }]);
      const jsonStr = raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}';
      parsed = JSON.parse(jsonStr);
    } catch {
      // Le LLM n'a pas pu parser — on renvoie l'annonce vide avec l'URL.
    }

    return {
      url,
      titre: String(parsed.titre ?? url),
      prix: typeof parsed.prix === 'number' ? parsed.prix : null,
      devise: String(parsed.devise ?? 'EUR'),
      marque: parsed.marque ? String(parsed.marque) : null,
      modele: parsed.modele ? String(parsed.modele) : null,
      annee: typeof parsed.annee === 'number' ? parsed.annee : null,
      kilometrage: typeof parsed.kilometrage === 'number' ? parsed.kilometrage : null,
      photos: Array.isArray(parsed.photos) ? parsed.photos : [],
      provenanceOrigine: new URL(url).hostname,
      brut: { html: snippet.slice(0, 500) },
    };
  }

  async search({ sources, criteres }: { sources: string[]; criteres: Record<string, unknown> }): ReturnType<ScraperService['search']> {
    const marque = String(criteres.marque ?? '');
    const modele = String(criteres.modele ?? '');
    const query = encodeURIComponent(`${marque} ${modele}`.trim());

    // Construit une URL de recherche par source puis extrait la première annonce trouvée.
    const buildSearchUrl = (domaine: string): string | null => {
      if (domaine.includes('catawiki')) return `https://www.catawiki.com/en/l/cars?q=${query}`;
      if (domaine.includes('collectingcars')) return `https://collectingcars.com/for-sale/?search=${query}`;
      if (domaine.includes('leboncoin')) return `https://www.leboncoin.fr/recherche?text=${query}&category=2`;
      if (domaine.includes('autoscout')) return `https://www.autoscout24.fr/lst?q=${query}`;
      return null;
    };

    const results: AnnonceExtraite[] = [];
    for (const domaine of sources) {
      const url = buildSearchUrl(domaine);
      if (!url) continue;
      try {
        const annonce = await this.extract({ url });
        results.push(annonce);
      } catch {
        // Source inaccessible — on passe à la suivante.
      }
    }
    return results;
  }
}

// --- 5. 3D — Luma (Genie / Dream Machine) -----------------------------------
// Luma génère depuis des images. L'API est asynchrone : on crée un job puis on
// le sonde jusqu'à complétion (avec garde-fou de timeout). Renvoie l'URL GLB +
// un aperçu. À défaut de GLB, on retombe sur la première photo source en preview.
export class RealThreeDService implements ThreeDService {
  readonly name = 'ThreeDService';
  readonly mode = 'real' as const;
  readonly provider = env.threed.provider;

  private headers() {
    return {
      Authorization: `Bearer ${env.threed.lumaKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  async generateScene({
    photos,
    label,
  }: {
    photos: string[];
    label?: string;
  }): ReturnType<ThreeDService['generateScene']> {
    if (env.threed.provider !== 'luma' || !env.threed.lumaKey) {
      return nonBranche('ThreeDService', 'generateScene (provider=luma + LUMA_API_KEY requis)');
    }
    const base = 'https://api.lumalabs.ai/dream-machine/v1';
    const create = await fetch(`${base}/generations`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        prompt: label ?? 'Présentation produit automobile de luxe, scène de galerie',
        keyframes: photos[0] ? { frame0: { type: 'image', url: photos[0] } } : undefined,
      }),
    });
    if (!create.ok) throw new Error(`Luma ${create.status}: ${await create.text()}`);
    const job = (await create.json()) as { id: string };

    // Sondage : ~45 s max (9 × 5 s) — garde-fou Vercel 60 s.
    // Si le job n'est pas encore terminé, on renvoie l'URL du job pour affichage différé.
    for (let i = 0; i < 9; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const poll = await fetch(`${base}/generations/${job.id}`, { headers: this.headers() });
      if (!poll.ok) continue;
      const st = (await poll.json()) as {
        state: string;
        assets?: { video?: string; glb?: string };
      };
      if (st.state === 'completed') {
        return { glbUrl: st.assets?.glb ?? '', previewUrl: st.assets?.video ?? photos[0] ?? '' };
      }
      if (st.state === 'failed') throw new Error('Luma: génération échouée');
    }
    // Pas encore terminé — on renvoie la photo source comme aperçu temporaire.
    return { glbUrl: '', previewUrl: photos[0] ?? '' };
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
