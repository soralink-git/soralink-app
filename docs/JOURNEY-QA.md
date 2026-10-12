# SoraLink — vérification du parcours client

Date : 12 octobre 2026. Version de départ : `745400e`.

## Résultat automatisé

Le Worker compilé a été exécuté avec une base D1 et un stockage R2 jetables. Les requêtes passent par les véritables routes de l’application. Le fournisseur Supabase est simulé ; toute autre sortie réseau est bloquée. Aucun compte, profil, fichier, contact, rendez-vous ou message de production n’a été modifié par ce parcours.

| Étape            | Vérification                                                                                | Résultat                        |
| ---------------- | ------------------------------------------------------------------------------------------- | ------------------------------- |
| Inscription      | Réponse d’inscription avec fournisseur simulé                                               | Réussie                         |
| Confirmation     | Connexion refusée avant confirmation, acceptée après                                        | Réussie                         |
| Session          | Cookie renvoyé à la connexion ; compte identifié par l’API                                  | Réussie                         |
| Création         | Brouillon enregistré, refusé à l’accès public                                               | Réussie                         |
| Import           | Photo PNG envoyée dans R2 isolé ; taille et quota cohérents                                 | Réussie                         |
| Personnalisation | Thème sombre, texte blanc, bouton or, tailles et forme conservés                            | Réussie                         |
| Publication      | Carte disponible avec métadonnées sur le domaine définitif                                  | Réussie                         |
| PC et téléphone  | Même carte servie aux agents Windows et iPhone ; HTML FR/AR et RTL                          | Réussie côté serveur uniquement |
| Échange          | Contact avec consentement reçu dans le bon espace ; suppression par un autre compte refusée | Réussie                         |
| Rendez-vous      | Refus sans Pro ; créneaux accessibles après activation locale de Pro                        | Réussie                         |
| Réservation      | Confirmation retire le créneau ; doublon refusé ; annulation le libère                      | Réussie                         |
| Déconnexion      | Session anonyme ensuite                                                                     | Réussie                         |

## Correction issue de la revue

L’export vCard dans l’aperçu client supposait que le téléphone et l’e-mail étaient toujours des chaînes. Les valeurs absentes ou `null` pouvaient faire échouer le bouton. La construction du contenu vCard est maintenant isolée dans `app/lib/vcard.ts` et produit des champs vides dans ces cas. Trois tests vérifient les caractères français/arabe, les coordonnées absentes et la protection contre l’ajout de lignes vCard.

## Rejouer la vérification

Depuis la racine du projet : `pnpm build`, puis `pnpm verify:public` et `pnpm verify:journey`. L’authentification utilisée par ce dernier est une simulation locale ; elle ne prouve pas la livraison des e-mails ni la connexion avec un vrai compte Supabase.

## Essais visuels restant à réaliser

Aucun navigateur pilotable n’est disponible dans cette session. Un changement d’agent HTTP ne simule ni la taille du viewport ni le rendu d’un iPhone. Les règles CSS du panneau d’aperçu sont présentes : colonne sticky sur PC, panneau compact en haut sous 1100 px. Leur rendu doit encore être vérifié visuellement.

1. Sur PC : se connecter avec son vrai compte, contrôler l’e-mail du compte affiché, changer d’onglet, personnaliser les couleurs et recadrer une couverture ; confirmer que l’aperçu suit le défilement et les changements.
2. Sur téléphone : ouvrir la carte publique en navigation privée, basculer FR/العربية, vérifier la lisibilité, puis utiliser Partager et Enregistrer le contact. L’ouverture du partage natif et l’import dans le répertoire dépendent du système et restent à tester sur Android et iPhone.
3. Avec un profil de test et un forfait Pro : échanger les coordonnées avec consentement, demander un rendez-vous, le confirmer puis l’annuler dans l’espace client. Vérifier les notifications réelles seulement avec des destinataires de test autorisés.

Ces essais ne doivent pas être déclarés réussis sur la seule base des tests serveur.
