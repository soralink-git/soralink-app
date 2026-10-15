# SoraLink — version actuelle

Application React/Vinext adaptée à Cloudflare Pages. Le fichier HTML de démonstration est remplacé par l’application complète.

Construction : pnpm install --frozen-lockfile puis pnpm build. Sortie : dist/pages. Node 24.

Variables Cloudflare Pages : SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (secret), SORATAP_ADMIN_EMAIL. Compatibilité : nodejs_compat.

Bindings : DB (D1), BUCKET (R2). Initialiser une base vide avec les migrations de drizzle, dans l’ordre. Ajouter https://soralink.link/auth/callback aux URL autorisées dans Supabase Auth.

Le code ne contient ni les comptes clients, ni les données de la base de l’aperçu, ni les fichiers déposés par les clients. Ces données nécessitent une migration séparée.

## Corrections de l’audit

Les étapes et prérequis de mise en service sont détaillés dans
[docs/AUDIT-FIXES.md](docs/AUDIT-FIXES.md). Avant publication, renseigner les vraies
échéances des profils payés sans date puis appliquer la migration additive
`0005_audit_hardening.sql`. Le code exige une révision du navigateur à la sauvegarde :
recharger les anciennes fenêtres. Le traitement planifié des notifications se déploie
séparément, sur la même D1, après configuration de ses variables/secrets.
