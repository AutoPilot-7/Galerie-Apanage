// ============================================================================
// Galerie Apanage — Lecture & politique d'environnement (cf. specs §6 & §10)
// ----------------------------------------------------------------------------
// RÈGLE D'OR : démarrer sans une seule clé. Chaque service décide ici s'il
// tourne en MOCK (clé absente) ou en réel. `SERVICES_FORCE_MOCK=true` force le
// mock partout (utile en CI / preview). Aucune variable n'est requise au build.
// ============================================================================

function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== '' ? v.trim() : undefined;
}

const FORCE_MOCK = read('SERVICES_FORCE_MOCK') === 'true';

/** Un service est « réel » si on ne force pas le mock ET qu'au moins une de ses
 *  clés requises est présente. Sinon → mock. */
function realIf(...keys: (string | undefined)[]): boolean {
  if (FORCE_MOCK) return false;
  return keys.some((k) => k !== undefined);
}

export const env = {
  forceMock: FORCE_MOCK,

  site: {
    url: read('NEXT_PUBLIC_SITE_URL') ?? 'http://localhost:3000',
  },

  // --- Supabase : colonne vertébrale ---------------------------------------
  supabase: {
    url: read('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: read('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: read('SUPABASE_SERVICE_ROLE_KEY'),
    /** Supabase est configuré (donc on quitte le mock store mémoire) ? */
    get configured(): boolean {
      return !FORCE_MOCK && !!this.url && !!this.anonKey;
    },
    /** Le service_role est dispo côté serveur (séquestre, décaissements, jobs) ? */
    get hasServiceRole(): boolean {
      return !!this.serviceRoleKey;
    },
  },

  // --- Couche de services IA / externe -------------------------------------
  llm: {
    provider: read('LLM_PROVIDER') ?? 'mock',
    mistralKey: read('MISTRAL_API_KEY'),
    mistralModel: read('MISTRAL_MODEL') ?? 'mistral-large-latest',
    get isReal() {
      return realIf(this.mistralKey) && this.provider !== 'mock';
    },
  },
  asr: {
    provider: read('ASR_PROVIDER') ?? 'mock',
    assemblyaiKey: read('ASSEMBLYAI_API_KEY'),
    gladiaKey: read('GLADIA_API_KEY'),
    get isReal() {
      return realIf(this.assemblyaiKey, this.gladiaKey) && this.provider !== 'mock';
    },
  },
  image: {
    provider: read('IMAGE_PROVIDER') ?? 'mock',
    pollinationsKey: read('POLLINATIONS_API_KEY'),
    cloudflareAccount: read('CLOUDFLARE_ACCOUNT_ID'),
    cloudflareToken: read('CLOUDFLARE_AI_TOKEN'),
    get isReal() {
      // Pollinations fonctionne sans clé ; on considère « réel » si provider!=mock.
      return !FORCE_MOCK && this.provider !== 'mock';
    },
  },
  scraper: {
    provider: read('SCRAPER_PROVIDER') ?? 'mock',
    apiKey: read('SCRAPER_API_KEY'),
    get isReal() {
      return !FORCE_MOCK && this.provider !== 'mock';
    },
  },
  threed: {
    provider: read('THREED_PROVIDER') ?? 'mock',
    lumaKey: read('LUMA_API_KEY'),
    get isReal() {
      return realIf(this.lumaKey) && this.provider !== 'mock';
    },
  },
  banking: {
    provider: read('BANKING_PROVIDER') ?? 'mock',
    gocardlessId: read('GOCARDLESS_SECRET_ID'),
    gocardlessKey: read('GOCARDLESS_SECRET_KEY'),
    get isReal() {
      return realIf(this.gocardlessId, this.gocardlessKey) && this.provider !== 'mock';
    },
  },
  payment: {
    provider: read('PAYMENT_PROVIDER') ?? 'mock',
    lemonwayKey: read('LEMONWAY_API_KEY'),
    lemonwayEnv: read('LEMONWAY_ENV') ?? 'sandbox',
    get isReal() {
      return realIf(this.lemonwayKey) && this.provider !== 'mock';
    },
  },
  email: {
    provider: read('EMAIL_PROVIDER') ?? 'mock',
    brevoKey: read('BREVO_API_KEY'),
    from: read('EMAIL_FROM') ?? 'contact@galerie-apanage.fr',
    get isReal() {
      // Supabase Auth gère le magic-link nativement ; Brevo = transactionnel.
      return !FORCE_MOCK && this.provider !== 'mock';
    },
  },
  storage: {
    provider: read('STORAGE_PROVIDER') ?? 'mock',
    get isReal() {
      // Le storage réel s'appuie sur Supabase Storage.
      return !FORCE_MOCK && this.provider !== 'mock';
    },
  },
} as const;

/** Récapitulatif lisible de l'état mock/réel (affiché en dev + /api/health). */
export function servicesStatus() {
  return {
    forceMock: env.forceMock,
    supabase: env.supabase.configured ? 'configuré' : 'mock (mémoire)',
    llm: env.llm.isReal ? env.llm.provider : 'mock',
    asr: env.asr.isReal ? env.asr.provider : 'mock',
    image: env.image.isReal ? env.image.provider : 'mock',
    scraper: env.scraper.isReal ? env.scraper.provider : 'mock',
    threed: env.threed.isReal ? env.threed.provider : 'mock',
    banking: env.banking.isReal ? env.banking.provider : 'mock',
    payment: env.payment.isReal ? env.payment.provider : 'mock',
    email: env.email.isReal ? env.email.provider : 'mock',
    storage: env.storage.isReal ? env.storage.provider : 'mock',
  } as const;
}
