# Corrections dépôt et site — 17 novembre 2026

## Changements livrés

- Le retrait d’un média sur la carte principale conserve les références secondaires et l’état `ready`.
- Les cartes secondaires utilisent une résolution partagée avec les droits et l’adresse de notification du compte propriétaire : PDF, demandes, rendez-vous, statuts, contacts, intentions WhatsApp et statistiques. Les historiques paginés et les statistiques ciblent la carte sélectionnée.
- La migration `0019_card_registry.sql` conserve les données existantes et rattache les clés étrangères d’adresses, intentions et statistiques à une identité commune aux deux types de carte. Les identifiants inconnus restent refusés.
- Les sauvegardes échouent si leurs secrets manquent. D1 est relu après envoi ; les fichiers R2 sont copiés avec pagination, chiffrés individuellement, accompagnés d’un manifeste chiffré et vérifiés par taille/empreinte. Un marqueur n’est publié qu’en fin de copie complète.
- Un contrôle quotidien de fraîcheur des copies D1/R2 signale les sauvegardes manquantes ou âgées de plus de huit jours.
- Une CSP bloquante minimale protège `base-uri`, `object-src`, `frame-ancestors` et `form-action`. La politique détaillée des scripts reste en observation pendant la préparation des nonces RSC ; aucun faux durcissement des scripts n’est annoncé.
- Le changement de langue efface le message transitoire de la langue précédente. Les textes arabes des pages d’information sont complétés ; le quota de cartes est décrit comme une valeur par défaut.
- ESLint refuse une augmentation au-delà du budget actuel de 85 avertissements. Ce garde-fou ne remplace pas le traitement de la dette existante.

## Avant activation en production

1. Renseigner les secrets GitHub Actions `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `BACKUP_ENCRYPTION_KEY`, `R2_BACKUP_ACCESS_KEY_ID`, `R2_BACKUP_SECRET_ACCESS_KEY`. La clé AES doit être gardée séparément hors de Cloudflare. Le compte est existant ; aucune valeur de secret n’est incluse dans le dépôt.
2. Utiliser un jeton R2 S3 limité aux buckets concernés : lecture de `soralink-files`, écriture/lecture de `soralink-backups`. Le code ne modifie pas les objets source. Les noms sont configurables par `R2_SOURCE_BUCKET` et `R2_BACKUP_BUCKET` ; les deux buckets doivent être distincts. Prévoir une copie indépendante du compte et une rétention adaptée ; le script ne supprime aucune copie historique.
3. Déclencher `Sauvegarde D1 et R2` dans une fenêtre adaptée à l’export D1, puis contrôler la fraîcheur et répéter une restauration dans des ressources isolées. Les écritures doivent être arrêtées pendant la capture pour obtenir une sauvegarde cohérente D1/R2. Hors maintenance, une copie paginée n’est pas un snapshot atomique : chaque GET conditionnel refuse les objets modifiés depuis leur listage, mais ne prouve pas l’absence de modifications entre pages ou après copie.
4. Avec cette sauvegarde vérifiée, appliquer `pnpm db:status` puis la migration `0019` par le runner existant. Ne pas utiliser `--baseline` pour contourner une migration non exécutée. La migration reconstruit quatre tables en conservant leurs lignes ; ne pas déployer le code multi-cartes avant sa réussite. Le runner suit les fichiers SQL, pas l’ancien journal Drizzle.
5. Déployer la révision vérifiée puis vérifier les cartes principales et secondaires en FR/AR, les PDF publics/privés, les demandes, les statuts et les statistiques.

## Restauration R2 isolée

```
node scripts/restore-r2.mjs --manifest=backups/files/<capture>/manifest.enc --target-bucket=soralink-restore-rehearsal
```

Le script refuse le bucket de sauvegarde, le bucket source du manifeste et le nom de production `soralink-files`. Il vérifie le chiffrement authentifié, la taille et le SHA-256 de chaque objet avant sa publication dans la cible isolée, avec ses métadonnées HTTP et personnalisées. Un échec après plusieurs objets peut laisser une restauration partielle dans ce bucket isolé ; ne pas l’utiliser avant la réussite complète. Il ne rebascule aucun binding.

La restauration SQL conserve le script `restore-backup.mjs`. La répétition synthétique `verify:recovery` et les tests des scripts ne démontrent pas une restauration complète de production.

## Points non résolus automatiquement

- `picomatch` reste signalé en amont par `GHSA-fc5q-39xc-vjpf`, sans version corrigée disponible. Les versions installées 2.3.2 et 4.0.7 ont désormais un patch local PNPM qui refuse tous les extglobs répétés `+(...)` et `*(...)` avant compilation regex, dans les deux chemins du parseur. Ce sous-ensemble de globs n’est pas utilisé par le projet. `pnpm security:audit` vérifie les empreintes SHA-256 des deux parseurs réellement résolus et leurs rejets avant de considérer cet avis précis comme atténué. Toute nouvelle alerte, version inconnue, absence de patch, empreinte différente ou panne du registre reste bloquante. L’audit brut continue de signaler l’avis ; il ne faut pas présenter le paquet amont comme corrigé.
- Les 85 avertissements ESLint préexistants ne sont pas tous refactorisés dans cette correction fonctionnelle. Leur suppression exige une recette des éditeurs, autosaves et prévisualisations.
- L’identité légale complète du vendeur/responsable, les durées de conservation décidées, les formalités et les conditions finales ne peuvent pas être inventées. Les mentions provisoires restent visibles en attendant ces informations validées.
- La politique de scripts CSP exige une prise en charge des nonces dans le rendu Vinext/RSC ; seules les directives compatibles sont appliquées immédiatement.
- Des médias historiquement passés en état `deleting` peuvent nécessiter une réparation après vérification de leur présence R2 et des références. Aucun changement aveugle d’état de données de production n’est exécuté ici.

## Activation du 17 novembre 2026

- Migration `0019_card_registry.sql` appliquée sur la base D1 de production, avec conservation contrôlée des quatre tables (adresses : 1 ligne ; intentions : 0 ; statistiques : 5 ; empreintes de visite : 1).
- Copie des quatre tables et de leur schéma conservée dans la même base sous `backup_108_20261117_*`, en complément du point Time Travel pré-migration `0000018d-00000000-00005126-5e7077c2675aef5d4ec7996b49d80dab`.
- Les cinq objets du bucket applicatif ont été copiés avec chiffrement AES-GCM et relecture des copies dans `soralink-backups/backups/deploy-2026-11-17-108/files/`. Leur clé de récupération est conservée séparément et ne figure pas dans le dépôt.
- Le téléchargement local de l’export SQL a été refusé par le contrôle automatique. Aucun export SQL brut local n’est utilisé comme sauvegarde validée. La récupération D1 repose ici sur Time Travel et les copies des tables dans Cloudflare ; cela ne remplace pas une sauvegarde SQL indépendante à long terme.
- Les secrets GitHub Actions des sauvegardes planifiées restent à configurer. Cette intervention ne prétend pas avoir activé le job hebdomadaire. Les contrôles de présence et de fraîcheur signaleront son absence.
