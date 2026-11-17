# Système visuel SoraLink

## Contrat

L’accueil, l’authentification, l’espace client, l’administration et les dialogues partagent `tokens.css` et `harmony.css`. Les couleurs et formes enregistrées par les clients restent prioritaires dans leurs cartes publiques. Aucune donnée métier n’est migrée.

| Élément     | Règle                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| Espacement  | 8, 16, 24, 32, 48, 64px ; 4px entre icône et libellé uniquement                                            |
| Conteneur   | 1344px maximum ; marges mobiles de 16px                                                                    |
| Grille      | 12 colonnes ; gouttières de 24px dans le héros, 32px entre cartes                                          |
| Proximité   | Cartes : 24px internes, 32px externes ; sections : 64px                                                    |
| Rayons      | Carte 32px − padding 24px = contrôle 8px ; mobile 24px − 16px = 8px ; visuel 32px − 16px = image 16px      |
| Actions     | Hauteur minimale 48px ; même hauteur de base, largeur égale dans les groupes principaux ; 8px entre cibles |
| Texte       | Échelle fluide `clamp`, corps 16–18px ; lecture limitée à 65ch ; chiffres tabulaires                       |
| Mouvement   | 200ms, `cubic-bezier(0.22, 1, 0.36, 1)` ; réduction du mouvement respectée                                 |
| Formulaires | Labels persistants, erreurs explicites après sortie du champ, correction pendant la saisie, liens ARIA     |
| Offres      | Prix et actions visibles, liste des fonctionnalités dépliable                                              |

Les bordures de 1px, anneaux de focus, métriques de texte, ratios d’images, éléments circulaires, QR et coordonnées de recadrage ne sont pas des espacements. Ils restent adaptés à leur fonction. Une traduction longue peut augmenter la hauteur d’un bouton plutôt que couper son texte.

## Contrastes et limites

Les couples de couleurs communs (texte principal, texte secondaire, accent sur surface, libellé sur bouton principal) sont testés ; les principaux couples de texte dépassent 7:1 et les bordures de champs 3:1. Cela ne constitue pas une certification WCAG de chaque contenu personnalisé. Les surfaces sombres gagnent en luminosité sans dépendre d’ombres noires. L’orange est réservé en priorité aux actions principales ; sa proportion exacte dépend du contenu affiché.

Les dimensions des images principales sont réservées. Un CLS nul sur tous les navigateurs ne peut être garanti sans mesures en conditions réelles. Les erreurs issues d’une interaction peuvent modifier la hauteur du formulaire afin de rester lisibles. Les fonctionnalités de validation serveur, consentement et authentification restent actives.

## Vérification

Build TypeScript/Vinext, lint, tests fonctionnels et calculs de contraste automatisés. Les messages de validation sont localisés FR/AR. Les contrôles de parcours utilisent des données isolées ; aucune demande réelle n’est envoyée pour la revue visuelle.

## Alignement des tableaux de bord

L’accueil, le tableau de bord client et l’administration utilisent le même conteneur de 1344px avec 24px de retrait latéral (16px sur mobile). Les boutons de la plateforme adoptent une forme capsule ; les formes enregistrées dans les cartes clients restent indépendantes. Le composant `SiteFooter` est partagé entre ces trois espaces : surface arrondie, contenu centré et colonnes qui se replient sur mobile. Dans le tableau de bord client, il se place sous toute la grille, aperçu compris.
