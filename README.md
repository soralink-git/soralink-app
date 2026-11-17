# SoraLink — version actuelle

Application React/Vinext adaptée à Cloudflare Pages. Les cartes publiques et les démonstrations utilisent leurs propres composants, séparés de l’espace client.

Construction : pnpm install --frozen-lockfile puis pnpm build. Sortie : dist/pages. Node 24.
Qualité : `pnpm check` (TypeScript, avec détection des variables et paramètres inutilisés), `pnpm lint` (ESLint), `pnpm test` (node:test), `pnpm verify` (les trois plus Prettier).

Les tests et les vérifications de parcours importent directement la version fixée de
`miniflare` déclarée dans `devDependencies`, indépendamment des dépendances internes de
Wrangler. Toute évolution de cette version doit être validée avec les trois commandes
`pnpm verify:public`, `pnpm verify:journey` et `pnpm verify:recovery` après le build.

Variables Cloudflare Pages : SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (secret), SORATAP_ADMIN_EMAIL, PUBLIC_SITE_URL, EMAIL_FROM, NOTIFICATIONS_ENABLED. Optionnel : TURNSTILE_SITE_KEY (publique) et TURNSTILE_SECRET_KEY (secret) pour activer le contrôle anti-robot du formulaire public. Compatibilité : nodejs_compat.

Bindings : DB (D1), BUCKET (R2), NOTIFICATIONS (service Worker, optionnel). Initialiser une base vide avec les migrations de drizzle, dans l’ordre. Ajouter https://soralink.link/auth/callback aux URL autorisées dans Supabase Auth.

Migrations : `pnpm db:status` puis `pnpm db:migrate` (suivi dans `schema_migrations`).
Détails et limites dans [docs/MIGRATIONS.md](docs/MIGRATIONS.md).

Notifications : `worker.ts` déclenche un envoi borné après chaque demande ou changement de statut. Le Worker planifié `soralink-notifications` (`wrangler.notifications.jsonc`, cron `* * * * *`) draine les reprises et les files en retard ; le déployer sur la même base D1 avec `RESEND_API_KEY`.

Le code ne contient ni les comptes clients, ni les données de la base de l’aperçu, ni les fichiers déposés par les clients. Ces données nécessitent une migration séparée.

## Sécurité du compte administrateur

L’accès `/admin` est autorisé uniquement pour l’adresse vérifiée `SORATAP_ADMIN_EMAIL`.
Activer la double authentification Supabase sur ce compte (Authentication → Users →
compte administrateur → MFA, ou réglage MFA du projet), puis vérifier que la session
admin reste utilisable. L’interface n’affiche jamais cette adresse.

## Exploitation

- **Santé** : `GET /api/health` renvoie `200 {"status":"ok","database":"ok","email":"ok"}` ou `503` si
  D1 ne répond pas. Le champ `email` passe à `failing` dès qu'un envoi a échoué pour une cause
  fournisseur (401/403/erreur réseau) dans les 24 h. Le workflow `.github/workflows/uptime.yml`
  l’interroge toutes les 15 minutes, vérifie l’accueil, ouvre un ticket « Incident » (santé ou
  e-mail) et le referme au retour à la normale.
- **Sauvegarde** : `.github/workflows/backup.yml` (lundi 03:00 UTC) exporte D1 avec
  relecture de la copie chiffrée, puis copie tous les objets R2 avec un manifeste chiffré.
  Le job échoue si les secrets requis manquent. `backup-check.yml` vérifie quotidiennement
  la présence de copies D1/R2 de moins de huit jours et ouvre un incident en cas d’échec.
  Secrets : `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `BACKUP_ENCRYPTION_KEY`,
  `R2_BACKUP_ACCESS_KEY_ID`, `R2_BACKUP_SECRET_ACCESS_KEY`. Activation, limites de cohérence,
  migration `0019` et restauration isolée : [corrections du 17 novembre](docs/AUDIT-CORRECTIONS-2026-11-17.md).
  Le code livré ne prouve pas que ces secrets sont configurés ni que la sauvegarde a été exécutée.
- **Alerting Cloudflare** (erreurs Workers/Pages) : à créer dans le dashboard
  (Notifications → Add policy → Workers / Pages), le jeton d’automatisation n’ayant pas
  les droits `Alerting`. Le workflow d’uptime couvre la disponibilité.

## Corrections de l’audit

Les étapes et prérequis de mise en service sont détaillés dans
[docs/AUDIT-FIXES.md](docs/AUDIT-FIXES.md). Avant publication, renseigner les vraies
échéances des profils payés sans date puis appliquer la migration additive
`0005_audit_hardening.sql`. Le code exige une révision du navigateur à la sauvegarde :
recharger les anciennes fenêtres. Le traitement planifié des notifications se déploie
séparément, sur la même D1, après configuration de ses variables/secrets.
