# Administration des forfaits et de l’espace client

Dans **Administration → Clients**, rechercher le client puis ouvrir **Forfait et accès client**.

1. Choisir le forfait, l’état et l’échéance. E‑Identité, Produits et services et Suivi de mon activité reprennent les packs commerciaux actuels. Les anciennes offres sont conservées pour leurs clients existants.
2. Dans **Fonctions autorisées**, désactiver les modules que le client ne doit pas utiliser. Le forfait fixe le plafond : pour ajouter une fonction non incluse, attribuer le forfait correspondant. Le suivi est nécessaire aux rendez-vous.
3. Dans **Rubriques visibles dans l’espace client**, cocher les éditeurs et rubriques à afficher : identité, logo/modèle, coordonnées, réseaux/liens, catalogue, contacts, demandes, agenda et partage.
4. Vérifier **Le client verra** puis cliquer **Enregistrer le forfait et les accès**. Les changements s’affichent à la prochaine actualisation de son espace. Le serveur applique les restrictions dès l’enregistrement.

**Rétablir les accès du forfait** remet les modules et rubriques à leurs réglages standards, à enregistrer ensuite. Le changement de forfait dans ce formulaire rétablit aussi ces accès standards avant leur éventuel ajustement. Les quotas catalogue se règlent séparément dans **Droits des produits et services**.

## Trois réglages distincts

- **Fonction désactivée** : ses routes et sa publication sont bloquées ; par exemple, désactiver Produits et services retire le catalogue de la carte publique.
- **Rubrique du tableau de bord masquée** : son éditeur, ses actions et ses historiques concernés sont bloqués. Le contenu déjà publié n’est pas supprimé ni masqué sur la carte publique.
- **Sections de la carte publique** : utiliser le bouton **Carte publique : présentation et sections**, indépendant du menu de l’espace client.

Mon offre reste toujours accessible, même si toutes les rubriques sont masquées, pour permettre de demander le renouvellement. Le raccourci Créer pas à pas disparaît si l’un de ses éditeurs est retiré. Les anciennes adresses des onglets mènent au premier éditeur autorisé ou à Mon offre et ne permettent pas de contourner les réglages.

## Sécurité et conservation

Les réglages sont stockés dans `profiles.client_access`, indépendamment du JSON de contenu modifiable par le client. Seule la route administrateur peut changer cette colonne. Un champ du même nom ajouté au contenu par un client n’accorde aucun droit.

Le formulaire enregistre le forfait et les accès dans une même opération conditionnelle. Si un autre administrateur ou une activation de commande modifie l’abonnement entre-temps, une erreur demande de recharger. Une simple modification de contenu de la carte ne provoque pas ce conflit.

Les changements de visibilité, de forfait et de droits ne suppriment pas les produits, fichiers ou demandes enregistrés. Les renouvellements annuels conservent les restrictions personnalisées. Le drapeau rendez-vous des offres historiques reste conservé même si son module est temporairement désactivé.

## Mise en place et validation

Appliquer `drizzle/0011_client_access.sql` à D1 avant publication. La colonne est nullable ; toutes les lignes existantes conservent les accès de leur forfait sans intervention.

`pnpm verify:journey` vérifie les réglages avec le worker compilé et une base D1/R2 isolée : contrôle administrateur, validation stricte, conflits, accès cachés, conservation du contenu public, refus des permissions forgées et renouvellement. Les tests de rendu couvrent les formulaires FR/AR et les onglets cachés.
