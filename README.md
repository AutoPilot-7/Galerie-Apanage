# Galerie Apanage

Galerie d'acquisition automobile de luxe, pensée comme une **galerie d'art**, propulsée par l'IA avec **validation commissaire** (human-in-the-loop) à chaque étape à enjeu.

> **Principe directeur** — un seul objet pivot : le **Dossier d'acquisition** (1 par demande client). Le tunnel *Demande → Constat → Acquisition* n'est **pas une navigation** : c'est le **cycle de vie** d'un Dossier, matérialisé par un champ `statut`. Trois fenêtres sur la même base : **Vitrine** (public), **Portail client**, **Cockpit commissaire**.

---

## 🚀 Démarrage local — ZÉRO clé requise

La règle d'or : **on démarre sans une seule clé**. Sans configuration Supabase, l'app sert ses données depuis un **store mémoire seedé**, et les 9 services IA/externes tournent en **mock**.

```bash
npm install
npm run dev          # http://localhost:3000
```

Points d'entrée :
- **Vitrine** : `/` · `/vitrine/collection` · `/vitrine/processus`
- **Login** (magic-link, ou accès direct en mode mock) : `/login`
- **Cockpit commissaire** : `/cockpit` (Pipeline) → fiche : `/cockpit/dossiers/[id]`
- **Portail client** : `/portail`
- **Diagnostic** : `/api/health` (indique data source + état mock/réel de chaque service)

```bash
npm run build        # build de production (passe sans aucune clé)
npm run typecheck    # tsc --noEmit
npm run test         # vitest (machine à états + cycle de vie + séquestre)
```

---

## 🧱 Arborescence

```
supabase/migrations/      8 migrations : enums, tables, finance, index,
                          machine à états (+audit), RLS (séquestre), storage, seed
src/
  domain/                 Logique métier PURE (sans I/O), testable
    types.ts              Types de domaine (miroir des enums SQL)
    statut.ts             Machine à états du Dossier + gardes human-in-the-loop
    devis.ts              Simulation frais & marge (moteur de calcul)
  lib/
    env.ts                Politique mock/réel (1 service = mock tant que clé absente)
    supabase/             Clients browser / server / admin (service_role) + middleware + types
  services/               COUCHE DE SERVICES (§6) : 1 connecteur par tâche
    types.ts              Interfaces communes (LLM, ASR, Image, Scraper, 3D,
                          Banking, Payment/séquestre, Email, Storage)
    mocks.ts              Implémentations mock (déterministes, zéro réseau)
    real.ts               Implémentations réelles branchables (Mistral, Pollinations, Brevo, Supabase Storage…)
    index.ts              Factory : choisit mock/réel selon l'env
  data/                   COUCHE DATA : 1 contrat, 2 implémentations
    types.ts              Interface DataSource + types de vue
    mock-store.ts         MockDataSource (mémoire seedée) — démarrage sans clé
    supabase-source.ts    SupabaseDataSource (Postgres + RLS)
    index.ts              getData() : sélectionne l'implémentation
  app/                    Next.js App Router (Vitrine, Cockpit, Portail, Login, API)
    actions.ts            SERVER ACTIONS : câblage de tous les flux + gardes ✋ HITL
  components/             Kit UI découplé (présentationnel, tokens de style)
```

---

## 🔌 Brancher un service réel (branchement progressif)

Chaque service reste en **mock** tant que sa clé est absente. Copier `.env.example` → `.env.local` et renseigner uniquement le nécessaire. Priorité **RGPD/UE**.

| Tâche | Variable(s) | Provider conseillé (UE) | État |
|------|-------------|--------------------------|------|
| Base de données + Auth + Storage | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | **Supabase** | bascule auto mock→réel |
| LLM (intake, CDC, rapports, annonce, devis) | `LLM_PROVIDER=mistral`, `MISTRAL_API_KEY` | **Mistral** | ✅ implémenté |
| Image (visuels produit) | `IMAGE_PROVIDER=pollinations` | **Pollinations** | ✅ implémenté |
| Email transactionnel | `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY` | **Brevo** | ✅ implémenté |
| Storage | `STORAGE_PROVIDER=supabase` | **Supabase Storage** | ✅ implémenté |
| ASR (transcription FR) | `ASR_PROVIDER=…`, `ASSEMBLYAI_API_KEY`/`GLADIA_API_KEY` | AssemblyAI / Gladia | squelette `real.ts` |
| Scraper (annonces) | `SCRAPER_PROVIDER=http` | whitelist | squelette `real.ts` |
| 3D (Gaussian Splatting) | `THREED_PROVIDER=luma`, `LUMA_API_KEY` | Luma / higgsfield | squelette `real.ts` |
| Open banking (rapprochement) | `BANKING_PROVIDER=…` | GoCardless / Bridge / Powens | squelette `real.ts` |
| Paiement / **séquestre** | `PAYMENT_PROVIDER=lemonway`, `LEMONWAY_API_KEY` | **Lemonway** (agent ACPR) | squelette `real.ts` |

> `SERVICES_FORCE_MOCK=true` force le mock partout (utile en CI / preview).

Les implémentations « squelette » lèvent une erreur explicite tant qu'elles ne sont pas câblées : le mock reste actif par défaut, on branche **un service à la fois** sans toucher aux appelants (interface commune).

---

## 🗄️ Supabase (colonne vertébrale)

Le schéma vit dans `supabase/migrations/` (source de vérité du modèle). Une fois le projet lié :

```bash
supabase link --project-ref <ref>
supabase db push                 # applique les 8 migrations
npm run db:types                 # régénère src/lib/supabase/database.types.ts
```

Sécurité intégrée au schéma :
- **RLS** : `anon` voit les propositions publiées (vitrine) ; le **client** ne voit que SON dossier ; le **commissaire** pilote tout mais a la finance en **lecture seule**.
- **Séquestre cloisonné** ⚠ : aucune policy d'écriture sur `compte_bancaire`/`echeance`/`paiement`/`mouvement` → ces écritures passent **obligatoirement** par le `service_role` (couche serveur), jamais par une session navigateur. Les fonds clients ne sont jamais mélangés à l'exploitation.
- **Machine à états** : trigger SQL `dossier_statut_guard` qui valide chaque transition et journalise (audit immuable). Le TS (`src/domain/statut.ts`) en est le miroir.

---

## ☁️ Déploiement Vercel

Le dépôt est relié à Vercel via l'intégration Git : **chaque push** sur la branche déclenche un déploiement preview (l'app build **sans aucune variable** → mode mock).

Pour activer le mode réel en preview/production, renseigner les variables d'env Supabase (et services) dans les *Project Settings → Environment Variables*, puis redéployer.

> ⚠️ Vercel **bloque** les déploiements utilisant une version de Next.js avec CVE critique. Garder Next à jour sur une ligne patchée (actuellement `15.3.x`).

---

## 🗺️ Cartographie des connexions

Voir [`docs/CARTOGRAPHIE.md`](docs/CARTOGRAPHIE.md) — flux inter-modules « qui appelle qui », machine à états, points de validation commissaire (✋), et correspondance connecteurs MCP ↔ tâches.

---

## ✋ Human-in-the-loop (validations commissaire)

Aucune transition à enjeu n'est automatique. Les gardes sont explicites dans le code (`src/domain/statut.ts`, champ `hitl`) **et** dans l'UI (encarts ✋), **et** journalisées :

| Transition | Acteur | Déclencheur |
|-----------|--------|-------------|
| Brief → Repérage | Commissaire ✋ | valide le cahier des charges |
| Repérage → Propositions | Commissaire ✋ | sélectionne & publie |
| Propositions → Validation | **Client** ✋ | valide une proposition (portail) |
| Validation → Acquisition | Commissaire ✋ | lance l'acquisition |
| Acquisition → Paiement | Commissaire ✋ | valide le devis |
| Paiement → Livraison | Système | solde encaissé |
| Livraison → Clos | Commissaire ✋ | confirme la remise |

---

## 🧪 Qualité

`npm run typecheck` (0 erreur) · `npm run build` (16 routes) · `npm run test` (12 tests : transitions, gardes HITL, cycle de vie complet, encaissement séquestre).
