# SoraLink — réduction de la dette technique

## Modifications réalisées

- La route publique et la démo utilisent `PublicCardView`. Elles ne chargent plus `app/ui.tsx`, l’éditeur, le recadrage ou la landing page dans leur graphe JavaScript initial.
- `CardView` est commun à la carte publique et à l’aperçu de l’espace client. Les règles de visibilité et de personnalisation restent centralisées.
- Les formulaires de devis, commande, échange de coordonnées et rendez-vous sont chargés à la demande dans `PublicRequestModal`. La création manuelle de rendez-vous reste dans l’espace client.
- La landing page et la présentation du dashboard sont séparées dans `LandingPage` et `DashboardEditor`. Le shell conserve la gestion de session et les mutations. Le contexte du dashboard est typé ; les onglets pourront ensuite être séparés progressivement.
- Le contenu public est rendu côté serveur à partir de la projection publique explicite : propriétaire, champs inconnus et coordonnées masquées ne sont pas sérialisés.
- Prettier 3.6.2 est fixé dans les dépendances et le lockfile. Le projet est reformatté ; `pnpm build` exécute désormais les contrôles TypeScript, les tests et le contrôle de format avant compilation.
- Les labels d’administration n’affichent plus une adresse en dur. L’autorisation continue à comparer l’identité vérifiée à `SORATAP_ADMIN_EMAIL` côté serveur. Les coordonnées commerciales publiques sont distinctes de cette règle d’autorisation.

## Mesure du JavaScript initial

Graphe statique de la carte publique et bootstrap navigateur, framework inclus, imports dynamiques exclus :

| Mesure                   |          Avant |          Après |
| ------------------------ | -------------: | -------------: |
| JavaScript non compressé | 542,760 octets | 420,564 octets |
| Estimation gzip          | 164,244 octets | 128,295 octets |

Réduction estimée gzip : 21.9 %. Cette mesure porte sur le JavaScript, pas sur les photos, vidéos, CSS, HTML, la latence réseau ou les Core Web Vitals. Le bootstrap avant modification a été récupéré depuis la version déployée ; les dépendances du composant avant modification proviennent du build précédent.

## Vérifications

`pnpm verify`, `pnpm build`, puis `pnpm verify:public`. Tests du rendu français/arabe, des contenus masqués et vides, de la personnalisation, du consentement, des commandes, des créneaux et de l’aperçu dans les dix onglets. La vérification du build utilise une base D1 locale jetable et contrôle le filtrage des données privées dans le HTML/RSC ainsi que les principales routes et assets. Aucun rendez-vous ni message réel n’est envoyé par les tests.

## Étapes suivantes

1. La documentation Cloudflare actuelle recommande Vinext pour les nouvelles applications Next.js sur Workers ([guide officiel](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)). Une migration vers OpenNext ne constitue donc pas une priorité automatique. Si une limitation réelle apparaît, évaluer l’alternative dans une branche indépendante : auth/cookies, routes SSR, D1/R2, métadonnées, PWA et médias. Vinext reste fixé à la version utilisée ; cette étape n’effectue pas de migration du framework.

## Deuxième étape — références de médias D1

- Migration `drizzle/0004_profile_media.sql` : table `profile_media`, clé composée, index `profile_media_key`, références de tous les profils existants et suppression en cascade avec le profil. Les médias sans ligne dans `media_assets` restent référencés pour préserver les fichiers historiques.
- Des triggers synchronisent les références avec l’insertion ou la modification du JSON du profil, dans la transaction de cette écriture. Ils protègent aussi les sauvegardes provenant d’une ancienne version pendant le déploiement.
- Le JSON est parcouru seulement lors de la migration et des changements de contenu. Les liens locaux, absolus et inclus dans du texte sont reconnus, dédupliqués et conservés même pour un contenu masqué.
- Le nettoyage utilise maintenant `NOT EXISTS` sur `profile_media.media_key`. Il ne parcourt plus le JSON de tous les profils pour chaque fichier. Le plan SQL de test confirme l’utilisation de l’index.
- Les sauvegardes continuent à vérifier la version précédente et l’état des médias. Un trigger bloque aussi une nouvelle référence vers un fichier en cours de suppression. La réponse d’une sauvegarde utilise `RETURNING id`, car le compteur de changements D1 inclut les écritures des triggers.
- Un fichier encore référencé est exclu de la sélection R2, même si son état était déjà `deleting`. Une panne de R2 laisse les suppressions non réalisées réessayables. Le délai de protection des fichiers récemment importés reste de 24 heures.
- Onze tests D1/Miniflare couvrent la migration, les fichiers partagés, les sauvegardes concurrentes, la course sauvegarde/nettoyage, les liens incorporés, les erreurs R2 et le plan indexé. Aucun fichier réel n’est supprimé par ces tests.

Ordre de livraison : valider localement, appliquer la migration additive et vérifier ses références avant de publier le code de nettoyage. Un retour au code utilisant `RETURNING id` (commit `28d4129` ou ultérieur) reste compatible avec cette nouvelle table ; conserver la table et les triggers en cas de retour arrière. Ne pas supprimer les références tant que le code indexé est déployé.

## Troisième étape — validation Zod des API

- `app/lib/api-validation.ts` centralise les contrats de données, d’administration, de connexion, de disponibilité et de métadonnées des fichiers. Les schémas restent côté serveur.
- Les actions JSON sont discriminées par `action` : les actions inconnues, mauvais types, booléens textuels, dates impossibles, identifiants vides et champs trop longs sont refusés avant leur traitement.
- Le catalogue conserve les brouillons complètement vides et les anciens articles textuels. Les règles de prix, d’images, de promotions et d’articles partiellement renseignés sont intégrées aux schémas. Les paramètres de personnalisation et les champs futurs du profil sont conservés ; les champs inconnus au niveau des actions ne deviennent pas des permissions.
- Les champs facultatifs `null` des formulaires et les indices de prestation numériques sous forme de texte restent compatibles. Le partage d’une carte connectée est revalidé après récupération des coordonnées côté serveur.
- La lecture JSON vérifie les octets effectivement reçus, y compris sans `Content-Length` fiable : 160 000 octets pour les actions client, 10 000 pour la connexion et l’administration. La carte garde sa limite de 35 000 caractères JSON ; les structures excessivement imbriquées sont refusées avant sérialisation. Les données invalides retournent 400, les corps trop gros 413 ; les indisponibilités de service restent 503.
- Les erreurs de validation contiennent un message français et un message darija. Les formulaires de carte choisissent la langue active. Aucune valeur de mot de passe ou de requête n’est incluse dans les erreurs.
- Les contrôles de session vérifiée, propriété, administrateur, origine, consentement, offre Pro, disponibilité, quotas et contraintes de réservation restent dans les routes. Les schémas ne remplacent pas ces contrôles. L’e-mail de connexion est normalisé, le mot de passe est transmis exactement tel quel ; les règles de confirmation Supabase et de récupération restent intactes.
- 22 tests supplémentaires couvrent les schémas, les corps mal formés et volumineux, les autorisations et les branches sensibles. Les appels au fournisseur d’authentification, au stockage et aux notifications sont simulés dans ces tests ; aucun e-mail, message ou rendez-vous réel n’est créé. Le profil existant a aussi été vérifié en lecture seule contre le schéma de carte.
