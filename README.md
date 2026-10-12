# SoraLink — version actuelle

Application React/Vinext adaptée à Cloudflare Pages. Le fichier HTML de démonstration est remplacé par l’application complète.

Construction : pnpm install --frozen-lockfile puis pnpm build. Sortie : dist/pages. Node 24.

Variables Cloudflare Pages : SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (secret), SORATAP_ADMIN_EMAIL. Compatibilité : nodejs_compat.

Bindings : DB (D1), BUCKET (R2). Initialiser une base vide avec les migrations de drizzle, dans l’ordre. Ajouter https://soralink.link/auth/callback aux URL autorisées dans Supabase Auth.

Le code ne contient ni les comptes clients, ni les données de la base de l’aperçu, ni les fichiers déposés par les clients. Ces données nécessitent une migration séparée.
