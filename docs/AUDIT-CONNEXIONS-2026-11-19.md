# Audit des connexions — 19 novembre 2026

## Périmètre et référence

Le site de cartes digitales restauré est conservé. Référence inspectée :
`main` à `0b63917e104d9775ffe7cc7b86d53c96aaa62e0b`, arbre
`88dba15a9155dfcf5279d09889173f25ce6303bb`.

GitHub déclenche les builds Cloudflare Pages. Le runtime Pages utilise Supabase
pour l'authentification, D1 pour les données métier et R2 pour les fichiers.
Le Worker `soralink-notifications` traite les e-mails via Resend chaque minute.
Une intégration GitHub → Supabase de déploiement SQL n'est pas nécessaire à cette architecture.

## Constats vérifiés avant livraison

| Élément                     | Résultat                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub → Pages              | Déploiements automatiques activés sur `main`, dernier déploiement réussi sur le commit de référence                                                                 |
| Production                  | Déploiement `0fd03466-dfbc-41fe-bc5d-001baebe96d6`, accueil et principales routes HTTP 200                                                                          |
| Supabase                    | Projet `dbxucclfabgpuxqtdykt` actif, URL identique dans Pages, API Auth accessible avec une clé publiable active, fournisseur e-mail activé et confirmation requise |
| D1 production               | 20 migrations, `quick_check=ok`, aucune violation de clé étrangère                                                                                                  |
| D1 preview avant correction | 19 migrations : `0019_card_registry.sql` manquante                                                                                                                  |
| Médias                      | 5 actifs `ready`, aucune référence primaire ou secondaire vers un média non prêt                                                                                    |
| Notifications               | Worker configuré, secret Resend présent, cron chaque minute, 6 envois acceptés et aucun échec enregistré                                                            |
| API privées                 | `/api/data` et `/api/admin` refusent l'accès sans connexion, HTTP 401                                                                                               |
| Sauvegardes                 | Contrôle GitHub en échec : identifiants R2 absents ; aucune sauvegarde complète récente attestée                                                                    |

Les valeurs des secrets Pages sont masquées par l'API. Leur présence ne prouve pas
leur validité ; la nouvelle sonde vérifie la clé Auth réellement utilisée par le runtime.
Le contrôle d'API Auth ne démontre pas la réception d'un e-mail ni une connexion réelle d'utilisateur.

## Corrections

- Préproduction : copie des six tables concernées dans `backup_audit_20261119_*`,
  puis application et enregistrement de la migration `0019` en un lot de 34 requêtes.
  Les six tables étaient vides avant et le restent après. Les 20 migrations sont
  maintenant enregistrées ; intégrité et clés étrangères sont valides. Aucune
  migration ni restauration n'a été exécutée sur la production pendant cet audit.
- `/api/health` contrôle désormais le projet et la clé Supabase via une requête
  de lecture des paramètres Auth, avec délai maximal de quatre secondes et sans
  suivre les redirections. Il contrôle aussi R2 par une lecture de métadonnées.
  Une dépendance critique absente ou défaillante produit HTTP 503.
- Le workflow Uptime écrivait les indicateurs HTTP/e-mail seulement dans ses logs,
  sans les publier dans `GITHUB_OUTPUT`. Les conditions d'alerte pouvaient donc
  laisser passer une panne. Un script publie désormais des résultats explicites,
  vérifie le JSON reçu et inspecte accueil, D1, Auth, R2 et état e-mail. Le job
  échoue après signalement d'une panne et ne clôt l'incident qu'après rétablissement.

## Validation locale

- Build, TypeScript, formatage et 353 tests réussis ; zéro erreur ESLint et les
  85 avertissements préexistants restent dans le budget actuel.
- Rendu public et état de santé exécutés dans le Worker compilé, avec D1/R2 isolés
  et fournisseur Auth simulé : cas valide et clé refusée (HTTP 503) vérifiés.
- Parcours applicatifs et restauration synthétique isolée réussis.
- Audit de dépendances : aucune alerte non atténuée. L'avis picomatch reste publié
  en amont ; les deux parseurs installés disposent du patch et des empreintes vérifiées.

## Blocages et suites

La surveillance des sauvegardes doit rester en échec jusqu'à une copie complète vérifiée.
L'incident de suivi est [#113](https://github.com/soralink-git/soralink-app/issues/113).
Les marqueurs complets D1/R2 sont absents du bucket de sauvegarde inspecté ; la copie
chiffrée des cinq objets du 17 novembre ne constitue pas une nouvelle sauvegarde SQL.

Les cinq secrets requis sont `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`,
`BACKUP_ENCRYPTION_KEY`, `R2_BACKUP_ACCESS_KEY_ID`, `R2_BACKUP_SECRET_ACCESS_KEY`.
Le journal du contrôle défaillant confirme les deux identifiants R2 vides.
Le connecteur GitHub ne propose pas la gestion des secrets et l'interface disponible
n'est pas connectée. La connexion Cloudflare ne donne pas accès à la création des
jetons de compte. Aucune valeur de secret n'est inscrite dans le code ou ce rapport.
Voir [les droits minimaux et la procédure de sauvegarde](AUDIT-CORRECTIONS-2026-11-17.md).

Supabase signale aussi que la protection contre les mots de passe compromis est
désactivée. Aucun autre avertissement de sécurité ni de santé n'a été retourné.
Ce réglage reste à examiner dans les paramètres Auth avec un accès administrateur.
Les informations légales définitives et les avertissements ESLint préexistants
restent des sujets distincts ; cet audit ne les présente pas comme résolus.
