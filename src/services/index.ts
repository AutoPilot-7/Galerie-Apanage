// ============================================================================
// Galerie Apanage — Factory de la couche de services (cf. specs §6)
// ----------------------------------------------------------------------------
// Point d'entrée unique côté serveur. Pour chaque tâche : renvoie l'impl réelle
// si la clé est présente (env.*.isReal), sinon le MOCK. Interchangeable sans
// toucher aux appelants (interface commune). `getServices()` agrège le tout.
// ============================================================================

import 'server-only';
import { env } from '@/lib/env';
import type { Services } from './types';
import {
  MockASRService,
  MockBankingService,
  MockEmailService,
  MockImageService,
  MockLLMService,
  MockPaymentService,
  MockScraperService,
  MockStorageService,
  MockThreeDService,
} from './mocks';
import {
  RealASRService,
  RealBankingService,
  RealEmailService,
  RealImageService,
  RealLLMService,
  RealPaymentService,
  RealScraperService,
  RealStorageService,
  RealThreeDService,
} from './real';

export const getLLM = () => (env.llm.isReal ? new RealLLMService() : new MockLLMService());
export const getASR = () => (env.asr.isReal ? new RealASRService() : new MockASRService());
export const getImage = () => (env.image.isReal ? new RealImageService() : new MockImageService());
export const getScraper = () => (env.scraper.isReal ? new RealScraperService() : new MockScraperService());
export const getThreeD = () => (env.threed.isReal ? new RealThreeDService() : new MockThreeDService());
export const getBanking = () => (env.banking.isReal ? new RealBankingService() : new MockBankingService());
export const getPayment = () => (env.payment.isReal ? new RealPaymentService() : new MockPaymentService());
export const getEmail = () => (env.email.isReal ? new RealEmailService() : new MockEmailService());
export const getStorage = () => (env.storage.isReal ? new RealStorageService() : new MockStorageService());

export function getServices(): Services {
  return {
    llm: getLLM(),
    asr: getASR(),
    image: getImage(),
    scraper: getScraper(),
    threed: getThreeD(),
    banking: getBanking(),
    payment: getPayment(),
    email: getEmail(),
    storage: getStorage(),
  };
}

/** État réel mock/réel de chaque service (introspecte les instances). */
export function servicesStatus() {
  const s = getServices();
  return Object.fromEntries(
    Object.entries(s).map(([k, v]) => [k, { mode: v.mode, provider: v.provider }]),
  ) as Record<keyof Services, { mode: 'mock' | 'real'; provider: string }>;
}
