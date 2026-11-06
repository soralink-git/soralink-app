# Sauvegarde et reprise SoraLink

## État vérifié le 24 octobre 2026

- La base D1 de production répond `ok` à `PRAGMA quick_check`.
- Un bookmark Time Travel est disponible via l’API Cloudflare.
- `pnpm verify:recovery` réussit avec D1/R2 isolés, les migrations réelles et des données synthétiques.
- Aucun export SQL bloquant ni aucune restauration de production n’a été lancé.

La présence d’un bookmark ne prouve pas qu’un retour arrière de production a été testé.
La répétition locale ne remplace pas une copie complète indépendante de la production.

## Répétition automatique

```sh
pnpm verify:recovery
```

Le script crée deux bases et deux buckets Miniflare temporaires, sans charger les
identifiants de production. Il applique toutes les migrations, crée des profils,
articles/documents référencés, demandes, commandes, métriques et justificatifs fictifs.
Il exporte la base SQL et les objets R2 paginés, écrit une copie temporaire privée,
contrôle les empreintes SHA-256 et restaure les données dans les autres bindings.

Les contrôles comparent les 16 tables, leurs lignes, index et triggers ; ils vérifient
les contenus et métadonnées R2, le rejet d’une copie corrompue, l’unicité du propriétaire,
les clés étrangères et le fonctionnement du trigger des médias après restauration.
Les données temporaires sont supprimées à la fin. La CI rejoue cette répétition.

## Sauvegarde complète à réaliser avant validation de la reprise de production

1. Choisir une fenêtre de maintenance. L’export distant D1 peut rendre la base
   indisponible pendant son exécution ; ne pas le lancer implicitement en pleine activité.
2. Noter le commit et le déploiement actifs, les migrations appliquées, le bookmark D1
   et l’heure. Conserver séparément les configurations et secrets chez leurs fournisseurs.
3. Exporter toute la base D1 avec l’outil officiel, puis télécharger le SQL dans un
   emplacement privé hors dépôt. Le dossier local `backups/` est ignoré par Git.
4. Copier tous les objets R2, y compris les justificatifs privés et les objets historiques,
   dans un stockage privé indépendant. Paginer la liste jusqu’à son terme et conserver
   clés, tailles, SHA-256, type de contenu, cache et métadonnées personnalisées.
5. Contrôler les empreintes et la cohérence des références SQL/R2. Bloquer les nouvelles
   écritures pendant la capture, ou établir une procédure de capture cohérente : un SQL
   et un bucket copiés à deux instants différents ne constituent pas un snapshot atomique.
6. Restaurer dans une nouvelle base D1 et un bucket privé dédiés. Ne jamais utiliser
   les identifiants de production comme cible de répétition.
7. Rejouer la lecture publique et les parcours propriétaires/admin avec notifications
   sortantes désactivées. Vérifier PDF, photos, justificatifs privés, droits et tarifs.
8. Mesurer le délai de restauration, consigner les écarts et faire valider le résultat.
   La bascule des bindings et tout retour arrière réel sont des opérations distinctes.

Aucune durée de rétention ou garantie de perte maximale n’est annoncée avant mesure.
La politique proposée est une sauvegarde avant modification de schéma et une copie
régulière privée avec contrôle périodique de restauration ; sa fréquence et sa rétention
restent à dimensionner selon le volume, le coût et les besoins réels.

## Références

- [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/).
- [Export et import D1](https://developers.cloudflare.com/d1/best-practices/import-export-data/).

## Sauvegarde planifi�e et restauration test�e (6 novembre 2026)

### Proc�dure

```sh
# 1. Sauvegarde chiffr�e vers R2 (bucket priv� soralink-backups)
BACKUP_ENCRYPTION_KEY=<64 hex> node scripts/backup-d1.mjs --db=soralink-db

# 2. Restauration vers une base d�di�e (jamais la production sans --force)
BACKUP_ENCRYPTION_KEY=<64 hex> node scripts/restore-backup.mjs \
  --key=backups/soralink-db/<fichier>.sql.enc \
  --target-db=soralink-restore-rehearsal --remote
```

Le script exporte la base avec `wrangler d1 export --remote`, la chiffre en
AES-256-GCM (en-t�te `SORA1` + IV + tag) puis d�pose l'objet dans
`soralink-backups/backups/soralink-db/`. La cl� n'est jamais stock�e dans le
d�p�t : elle vit dans le secret `BACKUP_ENCRYPTION_KEY`. Le workflow
`.github/workflows/backup.yml` l'ex�cute chaque lundi � 03:00 UTC.

### R�p�tition du 6 novembre 2026

- Objet produit : `backups/soralink-db/2026-11-06T23-25-48-135Z-8f72d20a3536.sql.enc`
  (39 321 octets, 38,4 Ko d�chiffr�s).
- Restauration r�elle dans la base D1 temporaire `soralink-restore-rehearsal`
  (`--remote`), puis contr�le des lignes :

| Table         | Production | Restaur�e |
| ------------- | ---------: | --------: |
| profiles      |          2 |         2 |
| notifications |          5 |         5 |
| requests      |          2 |         2 |
| orders        |          2 |         2 |
| media_assets  |         51 |        51 |

La base temporaire a �t� supprim�e apr�s le contr�le.

### Limites connues

- La sauvegarde couvre **D1 uniquement** (sch�ma + donn�es). Les fichiers R2
  (m�dias, justificatifs) ne sont pas copi�s : ils restent dans le bucket
  `soralink-files`. Une reprise compl�te exige une copie inter-comptes ou un
  export S3 de ce bucket.
- Aucune r�tention automatique n'est configur�e : pr�voir une r�gle de cycle de
  vie sur `backups/` (par exemple 12 semaines) ou un nettoyage manuel.
- La cl� de chiffrement doit �tre sauvegard�e hors du compte Cloudflare : sans
  elle, les objets sont illisibles.
