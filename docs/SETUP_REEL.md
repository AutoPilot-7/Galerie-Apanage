# Passer en mode réel (Supabase + Vercel) — route manuelle

Le squelette tourne en **mock** sans aucune clé. Pour basculer en **réel**, l'app détecte automatiquement la présence des variables Supabase (`src/lib/env.ts` → `getData()` choisit `SupabaseDataSource`). Aucune ligne de code à changer.

## 1. Créer le projet Supabase
- [database.new](https://database.new) → région **UE** (ex. Frankfurt) pour le RGPD.
- Note le mot de passe DB.

## 2. Appliquer le schéma (8 migrations en un script)
- Dashboard → **SQL Editor** → *New query* → colle le contenu de [`INSTALL_SUPABASE.sql`](INSTALL_SUPABASE.sql) → **Run**.
- *(Alternative CLI : `supabase link --project-ref <ref>` puis `supabase db push`.)*
- Vérifie : **Table editor** doit montrer `dossier`, `reperage`, `compte_bancaire`, … et `dossier` contient 4 dossiers de démo.

## 3. Récupérer les clés
Dashboard → **Project Settings → API** :
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` (secret) → `SUPABASE_SERVICE_ROLE_KEY` ⚠ serveur uniquement

## 4. Configurer l'Auth magic-link
Dashboard → **Authentication → URL Configuration** :
- **Site URL** = `https://<ton-domaine>.vercel.app`
- **Redirect URLs** (ajouter) = `https://<ton-domaine>.vercel.app/auth/callback` **et** `http://localhost:3000/auth/callback`

## 5. Brancher les variables sur Vercel
Vercel → projet `galerie-apanage` → **Settings → Environment Variables** (cocher *Production* + *Preview*) :
```
NEXT_PUBLIC_SUPABASE_URL      = https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <anon>
SUPABASE_SERVICE_ROLE_KEY     = <service_role>
NEXT_PUBLIC_SITE_URL          = https://<ton-domaine>.vercel.app
```
Puis **Redeploy** (ou `git commit --allow-empty` + push). `/api/health` doit afficher `"dataSource":"supabase"`.

## 6. Première connexion + provisioning
La RLS masque tout tant qu'un compte n'est pas rattaché. Connecte-toi via `/login` (magic-link), puis dans le **SQL Editor** exécute les snippets en bas de `INSTALL_SUPABASE.sql` :
- te déclarer **commissaire** (insert dans `app_user`) → accès Cockpit.
- (option) rattacher un **client** de démo à un e-mail → accès Portail filtré.

## 7. (Option) Régénérer les types typés
```bash
supabase link --project-ref <ref>
npm run db:types     # écrase src/lib/supabase/database.types.ts (déjà fidèle au schéma)
```

## 8. Brancher un service IA réel (exemple Mistral)
Dans Vercel (ou `.env.local`) :
```
LLM_PROVIDER=mistral
MISTRAL_API_KEY=<clé>
```
Le reste (ASR, 3D, paiement…) reste en mock tant que la clé est absente.
