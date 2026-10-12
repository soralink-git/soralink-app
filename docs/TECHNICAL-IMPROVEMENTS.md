# SoraLink — première étape de réduction de la dette technique

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

1. Ajouter `profile_media(profile_id, media_key)` avec une clé composée et un index sur `media_key`. Prévoir le remplissage initial, la synchronisation atomique avec les sauvegardes et des tests de concurrence avant de remplacer les recherches JSON par les références indexées. Le nettoyage actuel n’a pas été modifié dans cette étape.
2. Ajouter des schémas Zod par action API, en conservant les contrôles d’identité, propriété, publication, consentement, quotas et concurrence. Une validation de forme ne remplace pas ces contrôles.
3. La documentation Cloudflare actuelle recommande Vinext pour les nouvelles applications Next.js sur Workers ([guide officiel](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)). Une migration vers OpenNext ne constitue donc pas une priorité automatique. Si une limitation réelle apparaît, évaluer l’alternative dans une branche indépendante : auth/cookies, routes SSR, D1/R2, métadonnées, PWA et médias. Vinext reste fixé à la version utilisée ; cette étape n’effectue pas de migration du framework.
