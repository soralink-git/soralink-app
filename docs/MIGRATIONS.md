# Migrations D1

## Source de vérité

Les fichiers `drizzle/NNNN_*.sql` sont la **seule source de vérité**, appliqués dans l'ordre
numérique. Ils sont écrits à la main ; `drizzle-kit generate` n'est pas utilisé pour les
produire.

L'état appliqué est suivi dans la table `schema_migrations(name, applied_at)` de chaque base
(`soralink-db` en production, `soralink-preview-db` en prévisualisation).

## Commandes

```bash
pnpm db:status                  # fichiers, appliqués, en attente (production)
pnpm db:migrate                 # applique les fichiers en attente et les enregistre
node scripts/migrate.mjs --status --db=soralink-preview-db
node scripts/migrate.mjs --baseline --db=soralink-preview-db   # enregistre sans exécuter
node scripts/migrate.mjs --status --local                      # base locale wrangler
```

Chaque fichier est appliqué par `wrangler d1 execute --file` (transactionnel côté D1) puis
enregistré. Une erreur interrompt le lot : corriger le fichier, puis relancer.

`--baseline` sert uniquement à adopter une base existante dont le schéma est déjà à jour :
il enregistre les noms **sans exécuter** le SQL.

## Point d'attention — journal Drizzle

`drizzle/meta/_journal.json` s'arrête à `0007_catalog_rights` alors que les fichiers vont
jusqu'à `0016`. Les snapshots 0008→0016 n'existent pas.

Conséquence : **ne pas lancer `drizzle-kit generate`** tant que le journal n'a pas été
régénéré depuis un schéma de référence — il produirait une migration dupliquant 0008→0016.

## État au 6 novembre 2026

- Production `soralink-db` : 17/17 appliquées.
- Prévisualisation `soralink-preview-db` : 17/17 (0014→0016 appliquées ce jour).
- Dernières migrations : `0015_secondary_media.sql` (médias des cartes secondaires),
  `0016_query_indexes.sql` (index profils/audit/notifications).
