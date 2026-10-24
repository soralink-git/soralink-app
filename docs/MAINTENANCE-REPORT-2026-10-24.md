# SoraLink — rapport de corrections du 24 octobre 2026

## Résultat

Le nettoyage et le découpage sont réalisés sans changement des forfaits, des droits,
des URLs publiques ni des données clients. La compilation, les 294 tests existants,
le contrôle du build public, les parcours du Worker et la nouvelle répétition de
récupération réussissent. L’audit ne remonte aucune vulnérabilité connue.

## Corrections livrées

### Nettoyage des éléments inutilisés

- 65 fichiers de scaffolding inutilisés retirés : bibliothèque `components/ui/`, composant
  de reconnexion non référencé, ancien hook mobile, utilitaire de classes et configuration
  de génération de composants. Leurs 6 810 lignes ne sont plus analysées par TypeScript.
- 19 dépendances directes retirées avec ces composants, dont Recharts, Embla, cmdk,
  react-hook-form, vaul, sonner, raw-body et json-rpc-2.0.
- Arbre de dépendances : 855 → 712 paquets, soit 143 de moins. La catégorie dépendances
  applicatives du résultat d’audit passe de 249 à 110 ; des dépendances restent transitives
  lorsqu’un outil conservé les utilise réellement.
- Le graphe d’imports, TypeScript et le build confirment l’absence d’import cassé après retrait.
  Les paquets nécessaires aux API Supabase, PDF, QR, icônes et au build sont conservés.
- `.sites-runtime/` était déjà ignoré et aucun fichier de ce cache n’était suivi. Aucun
  historique Git n’a été réécrit. `backups/` est maintenant exclu aussi pour les exports privés.

### Traitements API séparés

`app/api/data/route.ts` passe de 727 à 64 lignes. Le point d’entrée conserve l’origine,
la lecture JSON bornée, la validation Zod, l’identité, les droits d’activité communs et
la gestion des erreurs. Il délègue à `app/lib/data/` :

- `read.ts` : lecture publique, profil propriétaire et historiques ;
- `profiles.ts` : sauvegarde, révision, droits de personnalisation et médias ;
- `requests.ts` : demandes publiques et partage de contact ;
- `activity.ts` : rendez-vous, statuts et suppression de contact ;
- `orders.ts` : commandes et renouvellements ;
- `types.ts` : actions discriminées et identité vérifiée partagées.

Les routes catalogue et administration existantes restent distinctes. Le découpage ne
crée pas une seconde API concurrente et ne déplace pas les contrôles communs dans le client.
Les appels aux domaines sont attendus dans le bloc de gestion d’erreurs du routeur.

### Éditeur et interface

| Fichier principal      |        Avant |        Après |
| ---------------------- | -----------: | -----------: |
| `dashboard-editor.tsx` | 1 463 lignes | 1 200 lignes |
| `catalog-editor.tsx`   | 1 031 lignes |   890 lignes |
| `ui.tsx`               | 1 611 lignes | 1 529 lignes |

Les forfaits/renouvellements et le partage sont extraits dans `dashboard-orders.tsx` et
`dashboard-share.tsx`. La gestion PDF devient `catalog-documents-editor.tsx` et l’en-tête
`site-header.tsx`. Les états, valeurs par défaut, callbacks, traductions et contrôles
restent ceux de l’éditeur existant. Les propriétés des nouveaux composants sont typées.

Il s’agit d’un découpage progressif : la gestion de session et plusieurs états de formulaire
restent volumineux dans le shell. Cette livraison ne prétend pas avoir supprimé toute dette
technique ni validé une refonte complète de l’éditeur.

### Surveillance et mises à jour

- L’audit bloquant de la CI passe du seuil élevé au seuil modéré.
- L’audit planifié devient quotidien au lieu d’hebdomadaire.
- Dependabot est configuré pour proposer les mises à jour npm et GitHub Actions chaque
  semaine, avec délai de sept jours pour les mises à jour ordinaires et groupes cohérents
  React/Next et Vite/Cloudflare. Les versions majeures npm et les fusions automatiques
  ne sont pas activées par cette configuration.
- Une répétition D1/R2 de récupération est ajoutée à chaque CI avec `pnpm verify:recovery`.

### Vérification d’exploitation et stratégie de sortie

- Production, lecture seule : `PRAGMA quick_check` retourne `ok` et un bookmark D1
  Time Travel est disponible.
- Répétition isolée : les 14 tables, leurs lignes, index et triggers sont exportés puis
  restaurés. Trois objets R2 sont copiés en liste paginée et comparés par SHA-256,
  contenu et métadonnées, y compris un justificatif fictif privé.
- Le test détecte une copie corrompue et vérifie l’unicité du propriétaire, les clés
  étrangères et le fonctionnement du trigger des références médias après restauration.
- `vinext check` indique 12 éléments supportés et aucune incompatibilité détectée.
  Ce scan ne valide pas un portage vers un autre framework.
- Une comparaison Next/OpenNext sur Workers et Next sur Node avec API Cloudflare séparée
  est documentée, avec conditions d’essai et de retour arrière. Vinext reste fixé.

## Limites et actions externes restantes

| Point                                          | État exact                                                                                                                                                   | Suite nécessaire                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Protection effective de `main`                 | Non modifiée : lecture de la protection refusée par GitHub, HTTP 403. Aucun ruleset retourné, ce qui ne permet pas de conclure sur une protection classique. | Appliquer et vérifier la règle avec les droits Administration du dépôt ; configuration prête. |
| Copie et restauration intégrales de production | Non réalisées. Seules l’intégrité D1, la disponibilité du bookmark et une répétition synthétique sont vérifiées.                                             | Planifier un export cohérent D1/R2 et restaurer dans une cible privée indépendante.           |
| Android/iPhone physiques                       | Non testés dans cette session.                                                                                                                               | Rejouer la grille mobile/PWA sur les appareils réels, notamment gestes et bouton Retour.      |
| Mentions légales définitives                   | Aucun renseignement juridique inventé.                                                                                                                       | Compléter et valider l’identité légale du vendeur et ses conditions.                          |
| MFA et délivrabilité réelle                    | Pas de changement des comptes ni d’envoi de message réel. Le Worker de notifications est déjà activé et son secret fournisseur présent.                      | Recette autorisée de réception et vérification des protections de compte séparées.            |

La connexion GitHub actuelle ne dispose pas des capacités d’administration nécessaires.
Une CI verte ne constitue pas à elle seule une protection de branche. Aucun refus automatique
d’approbation n’a eu lieu : il s’agit d’un refus d’accès de l’API GitHub.

## Documents et commandes

- [Procédure de reprise](RECOVERY-RUNBOOK.md).
- [Protection main et suivi des dépendances](MAIN-BRANCH-PROTECTION.md).
- [Corps de requête de protection proposé](github-main-protection.json).
- [Évaluation de sortie de Vinext](FRAMEWORK-EXIT-REVIEW.md).

```sh
pnpm build
pnpm verify:public
pnpm verify:journey
pnpm verify:recovery
pnpm audit --audit-level moderate
```

Aucune migration, aucun paiement, aucun rendez-vous, aucun compte réel ni aucun fichier
client n’est modifié par ces vérifications. Aucun e-mail ni message WhatsApp réel envoyé.
