# Cartographie des connexions — Galerie Apanage

Carte « qui appelle qui » du squelette implémenté. Tout converge vers l'objet pivot **Dossier**, dont le `statut` matérialise le tunnel.

---

## 1. Vue en couches

```
┌───────────────────────────────────────────────────────────────────────┐
│  UI (Next.js App Router)                                                │
│   Vitrine (public) · Portail client (4 blocs) · Cockpit (Pipeline+Fiche)│
└───────────────┬───────────────────────────────────────────────────────┘
                │  formulaires → Server Actions
┌───────────────▼───────────────────────────────────────────────────────┐
│  src/app/actions.ts  — câblage des flux + gardes ✋ HITL + journal       │
└───────┬───────────────────────────────────────────┬───────────────────┘
        │ getData()                                  │ getServices()
┌───────▼─────────────────────┐          ┌───────────▼───────────────────┐
│ COUCHE DATA (src/data)       │          │ COUCHE SERVICES (src/services) │
│  DataSource (contrat unique) │          │  1 interface par tâche         │
│   ├ MockDataSource (mémoire) │          │   LLM·ASR·Image·Scraper·3D·    │
│   └ SupabaseDataSource (RLS) │          │   Banking·Payment·Email·Storage│
└───────┬─────────────────────┘          └───────────┬───────────────────┘
        │ (si clés)                                   │ (si clés) sinon mock
┌───────▼─────────────────────┐          ┌───────────▼───────────────────┐
│ Supabase Postgres + RLS      │          │ Mistral · Pollinations · Brevo │
│ + Storage + Auth magic-link  │          │ · Lemonway · GoCardless · …    │
└─────────────────────────────┘          └────────────────────────────────┘
```

Le **domaine** (`src/domain`) est pur et partagé par toutes les couches : `statut.ts` (machine à états + gardes), `devis.ts` (simulation), `types.ts`.

---

## 2. Flux du tunnel (cycle de vie du Dossier)

Chaque ligne = une Server Action ; ✋ = validation human-in-the-loop ; les appels IA passent par la couche services (mock par défaut).

| # | Statut | Action (src/app/actions.ts) | Appelle | Effet |
|---|--------|------------------------------|---------|-------|
| 1 | **BRIEF** | `genererCdcAction` | `services.llm.generateFromTrame(CAHIER_DES_CHARGES)` ← `trame` (Base DA) | remplit `dossier.cahierDesCharges` |
| 1 | BRIEF | `transcrireAudioAction` | `services.asr.transcribe` | ajoute la transcription au brief |
| 1→2 | BRIEF | **`validerCdcAction`** ✋ | `data.transitionDossier(REPERAGE, COMMISSAIRE)` | lance le repérage + journal |
| 2 | **REPERAGE** | `ajouterLienAction` | `services.scraper.extract(lien)` | crée un `reperage` (source LIEN) |
| 2 | REPERAGE | `lancerScrapAction` | `services.scraper.search(sources whitelist)` | crée des `reperage` (source SCRAP) |
| 2 | REPERAGE | `genererRapportsAction` | `services.llm` ×2 (RAPPORT_COMMISSAIRE + RAPPORT_CLIENT) | remplit les rapports du repérage |
| 2 | REPERAGE | `selectionnerReperageAction` ✋ | `data.setReperageSelection` | marque RETENU |
| 2→3 | REPERAGE | **`publierPropositionsAction`** ✋ | `llm(ANNONCE)` + `image.generate` + `threed.generateScene` → `data.createProposition` + `setPublication` + `transitionDossier(PROPOSITIONS)` | publie vers le portail |
| 3→4 | **PROPOSITIONS** | **`validerPropositionClientAction`** ✋ (CLIENT) | `data.transitionDossier(VALIDATION, CLIENT)` | ferme la boucle portail→acquisition |
| 4→5 | **VALIDATION** | **`lancerAcquisitionAction`** ✋ | `data.transitionDossier(ACQUISITION, COMMISSAIRE)` | démarre l'acquisition |
| 5 | **ACQUISITION** | `simulerDevisAction` | `domain.simulerDevis` (+ paramètre commission) → `data.createDevis` | devis BROUILLON |
| 5→6 | ACQUISITION | **`validerDevisAction`** ✋ | `data.validateDevis` + `createEcheance(ACOMPTE/SOLDE)` + `transitionDossier(PAIEMENT)` | ouvre l'échéancier |
| 6 | **PAIEMENT** | `encaisserAction` | `services.payment.createEscrowPayment` (séquestre) + `data.enregistrerEncaissement(SEQUESTRE)` | acompte/solde encaissés |
| 6→7 | PAIEMENT | `encaisserAction` (SOLDE) | `data.transitionDossier(LIVRAISON, SYSTEME)` | solde → livraison |
| 7 | **LIVRAISON** | `genererDocumentAction` | `services.storage.upload` + `data.createDocument` | papeterie / remise / certificat |
| 7→fin | LIVRAISON | **`confirmerRemiseAction`** ✋ | `data.transitionDossier(CLOS, COMMISSAIRE)` | clôture |

Module financier (séquestre cloisonné) : `decaisserVendeurAction` → `payment.releaseToVendor` + `enregistrerEncaissement(DECAISSEMENT)` ; `libererCommissionAction` → `payment.releaseCommission` + `enregistrerEncaissement(COURANT_PRO)`. En mode réel ces écritures passent par le **service_role** (la RLS les interdit côté navigateur).

---

## 3. Base de données DA → toutes les générations IA

La table `trame` (Bibliothèque DA, `/cockpit/bibliotheque`) est la **source unique** branchée en entrée de chaque génération de texte :

```
trame(CAHIER_DES_CHARGES) ─→ llm.generateFromTrame ─→ Brief
trame(RAPPORT_COMMISSAIRE) ─┐
trame(RAPPORT_CLIENT) ──────┴→ llm.generateFromTrame ─→ Repérages (rapports)
trame(ANNONCE) ─────────────→ llm.generateFromTrame ─→ Propositions
trame(PHOTO) ───────────────→ image.generate ────────→ Propositions
trame(DEVIS) ───────────────→ (simulerDevis + llm) ──→ Devis
```

---

## 4. Les 3 fenêtres → même base (Dossier)

| Fenêtre | Routes | Lit | Écrit (actions) |
|---------|--------|-----|------------------|
| **Vitrine** (public) | `/`, `/vitrine/*`, `/mentions` | `listPublications()` (RLS anon = publiées) | — |
| **Portail client** | `/portail`, `/portail/dossiers/[id]` | `getDossier` (RLS scope client) | `validerPropositionClientAction` ✋, `envoyerMessageAction` |
| **Cockpit** | `/cockpit` (Pipeline), `/cockpit/dossiers/[id]` (Fiche 8 sections), `/galerie`, `/pilotage`, `/bibliotheque`, `/reglages` | tout (RLS commissaire) | toutes les actions du tunnel |

---

## 5. Connecteurs MCP ↔ tâches (état au build)

| Connecteur MCP | Tâche projet | État dans le squelette |
|----------------|--------------|------------------------|
| **Supabase** | DB (migrations), Auth magic-link, Storage, RLS, types TS, advisors | schéma livré ; bascule auto mock→réel via env ; clients + middleware câblés |
| **Vercel** | Déploiement preview/prod + logs | dépôt relié (git integration) ; déploiement à chaque push |
| **GitHub** | Versioning / branches | branche `claude/friendly-turing-16qubi` |
| **Lovable** | Bootstrap coquille UI (optionnel) | non mobilisé (UI déjà construite, non stylisée) |
| **Canva** | Papeterie & DA (cartes, cartons, certificats) | **mocké** (`genererDocumentAction` → placeholder Storage) — phase ultérieure |
| **higgsfield** | Scènes 3D GLB, photo produit, vidéo immersive | **mocké** (`ThreeDService`/`ImageService` → placeholders) — phase ultérieure |
| **Google Drive** | (hors cahier des charges) | en réserve, non mobilisé en v1 |

> Cohérence du choix : la couche services expose une **interface commune** par tâche. Brancher Canva/higgsfield/Lemonway/etc. = fournir une implémentation `real.ts` + la clé, **sans modifier** l'UI ni les Server Actions.
