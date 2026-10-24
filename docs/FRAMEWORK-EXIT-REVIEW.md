# Évaluation de la dépendance à Vinext

## Décision au 24 octobre 2026

Conserver `vinext@1.0.0-beta.5` fixé pour cette livraison, avec correctifs de ses
paquets React RSC et vérifications complètes. Préparer une alternative sans migrer
la production pendant un nettoyage de maintenance.

Cloudflare recommande actuellement Vinext pour Next.js sur Workers tout en précisant
son statut bêta et la nécessité d’un contrôle de compatibilité. OpenNext reste une
option technique pour exécuter la sortie de `next build` sur Workers ; « Next.js standard »
seul ne fournit pas les bindings Cloudflare au serveur Node.

## Évaluation réalisée

- `pnpm exec vinext check` : 12 éléments supportés, aucune incompatibilité détectée.
- Cette analyse statique ne prouve ni la compatibilité OpenNext ni l’absence de bugs
  dans Vinext. Elle complète le build et les parcours du Worker, sans les remplacer.
- Le point d’entrée `worker.ts` utilise `vinext/server/fetch-handler`.
- Les dépendances de plateforme restantes sont `cloudflare:workers` et les bindings
  D1/R2/services ; l’authentification serveur repose sur les cookies et Supabase.
- Les traitements de profil, demandes, rendez-vous, historique et commandes sont
  désormais séparés dans `app/lib/data/`, derrière le routeur existant. Ils n’importent
  pas l’API Vinext et peuvent être repris avec une couche serveur compatible.

## Deux stratégies comparées

| Option                                         | Travail principal                                                           | Risque à vérifier                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Next + OpenNext sur Workers                    | Adapter le build, l’entrée Worker et l’accès aux bindings ; conserver D1/R2 | Cookies/session, service de notifications, streaming PDF, assets et PWA    |
| Next sur serveur Node + API Cloudflare séparée | Définir une passerelle privée D1/R2 et adapter les accès serveur            | Nouvelle frontière d’authentification, latence, hébergement supplémentaire |

La première option reste la piste à prototyper si une limitation réelle de Vinext apparaît.
Aucune nouvelle dépendance d’adaptation n’a été installée ni présentée comme validée.

## Conditions d’une migration

Dans une branche isolée et un environnement privé, comparer la même version métier :

- build, 294 tests et parcours de droits/API ;
- connexion, confirmation, cookies, déconnexion et compte admin indépendant ;
- rendu SSR public, FR/AR, SEO, URLs, redirects et pages privées non indexables ;
- PDF avec ranges, médias privés, justificatifs, quotas et D1/R2 ;
- file de notifications avec fournisseur simulé, aucun message réel ;
- PWA, bouton Retour, recadrage/zoom et édition sur Android et iPhone réels ;
- mesure du temps de réponse, erreurs et procédure de retour au déploiement précédent.

Un changement de framework n’est livré qu’après cette comparaison et un essai de reprise.

## Sources officielles consultées

- [Next.js sur Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/).
- [Adaptateur OpenNext](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/).
