# Audit design et corrections — 19 novembre 2026

## Périmètre et direction

Site de carte digitale SoraLink actuellement en production. Conserver son symbole de lien, ses couleurs orange/charbon, ses typographies, la photo produit et les offres. Les projets de groupe précédemment retirés ne sont pas réintroduits. Les prix, destinations WhatsApp, droits des packs, comptes et intégrations restent inchangés.

Direction : une navigation plus compacte, une hiérarchie typographique claire, des offres entièrement lisibles et un formulaire accessible rapidement sur petit écran. Réutiliser les styles existants dans harmony.css, sans ajouter une nouvelle feuille de surcharge.

## Constats et priorités

| Priorité | Constat observé                                                                                                                                                                                                                               | Correction                                                                                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | À 337 px CSS, la grille des offres mesure 305 px mais chacune des trois cartes mesure 352 px. Les douze colonnes conservent onze espaces de 32 px, même quand les colonnes sont réduites à zéro. Le masquage du débordement coupe les cartes. | Une vraie colonne sous 700 px pour les offres, fonctionnalités, comparaisons et témoignages ; vérification des rectangles enfants, pas seulement du défilement de la page. |
| P1       | L’en-tête atteint 256 px à 337 px CSS : marque, actions sur deux rangées, navigation.                                                                                                                                                         | Marque et commandes sur une première ligne ; navigation sur une seconde ; connexion nommée accessible avec icône et création disponible dans le contenu.                   |
| P2       | Badge de recommandation flottant sans retour à la ligne ; lien de configuration à 12,5 px avec faible visibilité.                                                                                                                             | Badge dans le flux, texte à partir de 14 px et lien souligné avec une cible de 48 px.                                                                                      |
| P2       | Symbole NFC sur la page de connexion différent du symbole de lien sur l’accueil.                                                                                                                                                              | Composant de marque commun, avec lien d’accueil localisé.                                                                                                                  |
| P2       | Introduction promotionnelle longue avant le formulaire sur petit écran.                                                                                                                                                                       | Donner directement accès au formulaire, dont le titre et les instructions restent présents.                                                                                |
| P2       | Assistance fixe susceptible de gêner les derniers liens.                                                                                                                                                                                      | Espacement inférieur du pied de page et prise en compte de la zone de sécurité du navigateur.                                                                              |

## Plan réalisé

1. Mesurer le site en production et corriger les grilles et la navigation.
2. Harmoniser les éléments de marque et améliorer les textes et contrôles des offres.
3. Vérifier la compilation, les tests et les parcours isolés ; contrôler visuellement une prévisualisation avant publication.
4. Publier après validation des contrôles puis vérifier le résultat en production.

## Méthode et limites

Le navigateur de contrôle utilise une largeur de bureau de 1 348 px CSS et le zoom du navigateur pour contrôler des largeurs CSS étroites, dont 337 px. Ces contrôles de responsive et de zoom ne constituent pas une validation sur un téléphone physique ni une émulation iOS/Android. Le lancement du navigateur headless local est indisponible dans cet environnement ; la validation visuelle utilise le navigateur Cloud et la prévisualisation Cloudflare. Aucun formulaire réel ni message WhatsApp n’est envoyé pendant les tests.

Les couleurs personnalisées des cartes clients, la structure de la base et les secrets ne font pas partie des modifications. La multiplication historique des feuilles CSS reste un sujet de maintenance à traiter séparément avec une couverture visuelle plus large.
