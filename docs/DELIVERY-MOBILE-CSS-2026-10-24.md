# SoraLink — Éditeur mobile et stabilisation CSS

## Résultat

Sur téléphone (largeur CSS jusqu’à 700 px), une fiche produit ouverte masque les autres lignes, les filtres et les réglages de liste. Le bouton « Retour à la liste » conserve la recherche et replace le focus sur l’article. Les données restent dans le même état d’édition et suivent l’enregistrement automatique existant.

La fiche commence par le nom, la photo principale et le prix facultatif. Catégorie, variantes et description sont regroupées dans un volet fermé par défaut. Les fonctions restent accessibles, avec les libellés FR/AR et les mêmes droits serveur. La limite reste de 40 articles.

Les statistiques de visites sont accessibles dans un volet fermé par défaut dans « Mes demandes ». Elles ne sont chargées qu’après ouverture du volet, au lieu d’occuper le haut du parcours de traitement des demandes.

## CSS

- `app/tokens.css` devient la source des couleurs communes clair/sombre, des familles de polices et des nouvelles constantes d’espacement et de dimensions des contrôles.
- Les deux anciennes palettes globales dans `globals.css` sont supprimées. Les couleurs de marque existantes et les couleurs choisies par les propriétaires de cartes sont préservées.
- 198 déclarations exactement répétées, avec les mêmes sélecteurs, conditions et priorités, sont retirées ; cela comprend 22 occurrences de `!important`.
- Les styles administratifs sont importés dans le layout admin, plutôt que dans le layout global.
- Les nouveaux réglages mobiles sont limités à l’espace client, sans nouvelle barre flottante au-dessus des boutons.

Mesures sources : 241 213 → 237 503 octets CSS ; 399 → 377 occurrences de `!important`. Le nombre de fichiers n’est pas un indicateur de qualité : le fichier de tokens remplace des définitions dispersées, tandis que la feuille admin devient propre à sa route.

Compilation locale : CSS commun 281 592 octets, estimation gzip 48 592 octets ; complément admin 3 080 octets, estimation gzip 961 octets. Les tailles transférées réelles dépendent de la compression du serveur et du cache.

Cette passe stabilise la base commune et retire des doublons ; elle ne supprime pas toute la dette historique ni tous les `!important`. Une suppression globale sans contrôle visuel serait risquée.

## Vérification

- Compilation, TypeScript, formatage et 271 tests réussis.
- Contrastes clair/sombre contrôlés avec les tokens centralisés.
- Tests de rendu FR/AR avec 40 articles : une seule fiche de brouillon ouverte, prix dans le formulaire principal, variantes dans les options fermées, conservation des données.
- Contrôle du build public et parcours complets D1/R2 isolés, sans envoi réel ni modification des comptes clients.
- Comparaison de la carte publique de démonstration avant/après en navigateur pour vérifier les styles principaux.

Les essais dans un dashboard authentifié sur Android/iPhone physiques restent distincts de ces contrôles. Aucun changement des règles de paiement, aucun prélèvement automatique, aucune migration de données.
