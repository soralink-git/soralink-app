# Mise à jour de sécurité — 24 octobre 2026

## Résultat

L’audit des dépendances passe de 16 alertes (2 critiques, 4 élevées, 7 modérées et 3 faibles)
à aucune vulnérabilité connue dans le résultat `pnpm audit --json` obtenu le 24 octobre.
Ce résultat décrit les avis connus par le registre à cette date ; il ne garantit pas
l’absence de toute vulnérabilité applicative.

| Dépendance                                   | Avant   | Après  |
| -------------------------------------------- | ------- | ------ |
| Next / eslint-config-next                    | 16.3.8  | 16.4.1 |
| React / React DOM / react-server-dom-webpack | 19.2.8  | 19.2.9 |
| Vite                                         | 8.0.16  | 8.1.6  |
| Zod                                          | 3.25.76 | 4.6.6  |
| undici, transitif version 7                  | 7.29.1  | 7.30.1 |
| fast-uri, transitif version 3                | 3.1.8   | 3.1.9  |

Sharp reste fixé à 0.35.5. Vinext, les versions Cloudflare et l’architecture D1/R2 restent
ceux du projet. Aucune migration de données n’est nécessaire.

## Exposition et limites de l’analyse

Le build de production passe par Vinext et Vite, pas par le serveur Next.js standard.
Un avis portant sur Next installé ne prouve donc pas à lui seul qu’un chemin vulnérable
est exposé sur le site. Il reste nécessaire de mettre à jour Next et surtout le paquet
RSC utilisé par Vinext : le correctif React des typed arrays et des Server Functions
est publié dans `react-server-dom-webpack@19.2.9`. Les versions React sont alignées.

L’avis Vite lié à `launch-editor` vise le développement sous Windows. Les alertes undici
passent par Miniflare/Wrangler, dans l’outillage local. Elles sont corrigées également,
sans présenter ces chemins comme des failles démontrées sur le Worker public.

L’avis `braces` GHSA-vfj7-8cjw-p6xm a été retiré le 23 octobre 2026 par GitHub, qui le juge
non exploitable en pratique. Aucun avis n’est ignoré dans la configuration de l’audit.

## Adaptation Zod 4

- Clés explicites pour les dictionnaires FR/AR et les horaires.
- Schéma d’objet séparé des règles de profil pour conserver l’édition administrative
  du design sans imposer une identité ni supprimer les validations des profils.
- Prévaleur du catalogue avec `.prefault({})`, afin de conserver le calcul de ses valeurs
  par défaut plutôt que retourner un objet incomplet.
- Message français conservé pour une action inconnue avec le nouveau format d’erreurs.
- Bornes existantes des collections, limite du corps HTTP, profondeur et nombre de nœuds
  conservés. Une collection de 10 000 articles invalides est rejetée à sa borne avec une
  seule erreur, avant l’accumulation des erreurs par article.

## Installation et surveillance

Les versions corrigées sont inscrites dans les manifestes et le lockfile. Le délai minimal
de publication de sept jours reste actif. Une exception exacte `fast-uri@3.1.9` permet
le correctif publié le 19 octobre ; elle ne s’étend pas aux versions futures du paquet.
Les contrôles de dépendances et les restrictions de scripts d’installation sont conservés.

La CI vérifie désormais aussi `pnpm audit --audit-level high` à chaque PR et sur main,
en complément de l’audit hebdomadaire existant. Une indisponibilité du registre ou une
nouvelle alerte élevée fera échouer ce contrôle et demandera une analyse.

## Vérifications

- TypeScript, formatage et 294 tests réussis, dont trois régressions pour la migration Zod.
- Compilation Vinext/Vite et empaquetage Pages réussis.
- Graphe public et parcours complets du Worker avec D1/R2 isolés vérifiés.
- Aucun message réel envoyé, aucun compte client réel modifié pendant ces vérifications.

## Sources officielles

- [Next.js, correctifs du 14 octobre](https://nextjs.org/blog/nextjs-security-update-october-14-2026).
- [React RSC, typed arrays](https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3).
- [React Server Functions, déni de service](https://github.com/react/react/security/advisories/GHSA-h3gv-c5rc-p453).
- [Vite / launch-editor sous Windows](https://github.com/advisories/GHSA-587h-7wmj-h5pm).
- [Zod, collections](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
- [Migration Zod 4](https://zod.dev/v4/changelog).
- [undici, content-encodings](https://github.com/nodejs/undici/security/advisories/GHSA-xjj6-f33q-929c).
- [fast-uri](https://github.com/advisories/GHSA-333x-w4r6-6crp).
- [Retrait de l’avis braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
