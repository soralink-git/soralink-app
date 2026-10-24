# SoraLink — Boutons de contact et réseaux

## Présentation

Les boutons de contact, de site web et de réseaux affichent uniquement leur icône. Les libellés et coordonnées ne sont plus affichés dans les boutons ; ils restent dans les noms accessibles et les infobulles, notamment pour distinguer plusieurs numéros ou liens du même service.

Les nouveaux boutons de liens utilisent le même format compact de 54 × 54 px que les actions de carte. La liste se répartit sur plusieurs lignes lorsque nécessaire. Les options de l’e-mail apparaissent au clic dans un panneau séparé de la rangée d’icônes, afin de conserver une largeur utilisable.

Les anciennes cartes suivent les mêmes règles. L’adresse textuelle sous les icônes et le bloc promotionnel Google faisant doublon avec le bouton d’avis ont été retirés de cette présentation ; les liens et données restent conservés.

## Couleurs des fonds

Dans « Logo et modèle », le choix « Fond des boutons de contact et des réseaux » propose :

- « Couleurs des réseaux » : fond associé au service pour WhatsApp, Facebook, Instagram, LinkedIn, YouTube, TikTok et X.
- « Couleur de ma carte » : tous les fonds de contact reprennent la couleur principale choisie.

En l’absence de couleur de service définie, le bouton utilise toujours la couleur principale de la carte : téléphone, e-mail, localisation, site web, avis et services inconnus. Les profils sans ce réglage utilisent par défaut le mode « Couleurs des réseaux ».

Le choix porte sur le fond des boutons, pas sur une coloration individuelle des logos. Leur géométrie est conservée. La couleur de premier plan est calculée en noir ou blanc pour rester contrastée. Les actions générales de la carte conservent leur couleur principale. Les boutons de contact restent remplis dans les deux modes, y compris lorsque les autres actions de la carte ont un style contour.

## Données et droits

Le réglage est validé et enregistré dans les données JSON existantes, transmis à l’aperçu et à la carte publique. Il est accessible au client et dans les réglages admin. Les restrictions de la section d’édition et des fonctions avancées restent appliquées côté serveur. Aucune migration ni modification des comptes, contacts ou paiements n’est nécessaire.

## Validation

- Compilation, TypeScript, formatage et 291 tests réussis.
- Rendu FR/AR avec icônes seules et noms accessibles distincts pour plusieurs téléphones.
- Repli sur la couleur de carte pour les actions génériques, les services inconnus et les noms spéciaux de propriétés JavaScript.
- Contraste d’au moins 4,5:1 pour les couleurs de service et les 256 gris de carte testés.
- Conservation des liens, du filtrage des données privées et des droits.
- Parcours complets D1/R2 isolés : enregistrement des deux modes, lecture publique et maintien du refus des réglages avancés non autorisés.
- Contrôle du build public réussi. Aucun compte client réel ni message utilisé pendant ces tests.
