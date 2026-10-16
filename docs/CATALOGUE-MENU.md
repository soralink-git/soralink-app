# Catalogue / Menu v1

## Parcours et limites

Mon espace → Produits et services → PDF, Produits, Photos et vidéos ou Apparence. Chaque enregistrement publie les changements sur une carte déjà publiée ; une carte en brouillon reste privée. La galerie et les vidéos se gèrent dans l’onglet Photos et vidéos du catalogue et apparaissent dans le bloc Produits et services sur la carte publique. Les fichiers existants sont réutilisés. Les anciennes sections Photos et Vidéo ne sont plus affichées séparément. Les promotions restent accessibles dans leur panneau de gestion.

Valeurs initiales : 40 articles pour une offre payante, 10 en essai ; 3 PDF par carte, 25 Mio et 100 pages par PDF ; 400 Mio de stockage partagé, 160 fichiers pour une offre payante et 80 en essai. Les fichiers en cours de chargement comptent dans les quotas. Une image principale, sa miniature et jusqu’à 5 images supplémentaires sont possibles par article, dans les limites du stockage partagé. Jusqu’à 40 catégories.

Administration → client → Droits Catalogue / Menu : activation, PDF, produits, commandes WhatsApp, téléchargement, nombre de documents/articles, stockage, nombre de fichiers, taille et pages PDF. Les droits sont attribués par carte ; les valeurs par défaut suivent le statut du forfait. Les valeurs maximales du schéma sont des garde-fous : 10 PDF, 200 articles, 2 000 Mio, 500 fichiers ; PDF limités à 25 Mio / 100 pages pour cette version. Rétablir les limites du forfait efface la surcharge.

Une baisse du nombre maximal conserve les données et limite immédiatement la projection publique. Elle interdit d’augmenter le nombre enregistré au-delà du quota, mais laisse réduire le contenu ou modifier les articles déjà conservés. Réduire la taille/pages PDF interdit les imports qui dépassent les nouvelles limites et leur nouvel enregistrement. Désactiver une fonction bloque ses mutations et sa diffusion publique. Une mise à jour de coordonnées sans modification du catalogue reste possible.

Les noms et descriptions FR/AR sont distincts. Les anciens champs `name`, `description`, `category` deviennent les contenus français par compatibilité ; le propriétaire peut les corriger dans les champs de langue correspondants. Aucune traduction ou détection de langue automatique. Le nom arabe peut être renseigné seul. Une traduction absente donne une indication localisée. Les références sont des identifiants neutres.

## Lecture PDF

Les documents s’ouvrent dans la carte sans iframe, sans navigation externe et sans téléchargement automatique. Le premier aperçu est chargé à l’approche de l’écran. Toucher l’aperçu ouvre une boîte de dialogue plein écran ; le document défile verticalement. Pincement, double toucher, déplacement tactile, numéro de page et saut à une page sont disponibles. Les pages proches de la zone visible sont rendues ; les canevas éloignés sont démontés. Les téléchargements automatiques anticipés du lecteur plein écran sont désactivés, les requêtes Range restent autorisées. Les canevas sont bornés en pixels.

Le numéro de page est conservé entre aperçu et plein écran. Le zoom conserve le point ciblé et la position de défilement pendant le geste. La fermeture revient à l’aperçu de la même page. Une entrée temporaire dans l’historique permet au bouton Retour de fermer la visionneuse avant de quitter la carte/PWA. Les boîtes de dialogue photo et fiche produit suivent aussi cet ordre, y compris lorsqu’elles sont imbriquées.

Les documents ont une identité stable indépendante de la clé du fichier : `/api/catalog-documents/{profileId}/{documentId}`. Remplacer le PDF conserve ce chemin et l’adresse de la carte. Un ancien PDF unique garde l’identité `legacy-pdf`. Retirer le PDF dans le nouveau gestionnaire produit un tableau vide explicite : il ne réapparaît pas à partir de l’ancien champ.

Le téléchargement volontaire nécessite le consentement du propriétaire pour ce document et l’autorisation administrateur. Il passe par `?download=1`, avec une réponse `Content-Disposition: attachment`. Il ne s’agit pas d’un dispositif de protection anticopie : le navigateur reçoit nécessairement le contenu pour le lire.

## Produits et demandes

Disponibilité disponible/épuisé/masqué, type produit/service, catégorie, ordre, photo principale, galerie, miniature, référence, ancien prix, promotion et dates facultatives. Dates de promotion comparées au jour au Maroc, bornes incluses. Recherche dans le nom de la langue choisie et filtre par catégorie. Affichage par lots de 12 articles, avec « Afficher plus ». La carte publique reçoit au maximum le nombre d’articles autorisé ; le maximum absolu reste 200. Les photos sont compressées avant import, la miniature principale à 480 px ; les autres images à 1 600 px maximum.

Un article masqué ou appartenant à une catégorie masquée est absent de la projection publique et ne peut pas être commandé par son identifiant. Un article épuisé est affiché mais ne peut pas être sélectionné. La fiche détaillée et les photos s’ouvrent à l’intérieur de la carte. Une demande individuelle réutilise le formulaire existant, pour produit ou devis de service.

Sélection de plusieurs articles (40 maximum par envoi, quantités de 1 à 99). Le serveur génère le message WhatsApp à partir des données courantes, après vérification des droits, de la publication, de la disponibilité, des prix visibles et du numéro WhatsApp public. Le message contient noms, quantités, références et prix indicatifs lorsque permis. Le visiteur confirme lui-même l’envoi dans WhatsApp. Aucun paiement en ligne et aucune API Meta.

## Données et API

D1 conserve les métadonnées dans `profiles.data`, qui contient déjà le catalogue. Cette version réutilise cet agrégat pour éviter de dupliquer les mêmes produits dans six nouvelles tables ; le contrat des collections permet une extraction ultérieure vers des tables normalisées. Les données du compte, des cartes et des forfaits sont réutilisées. Les clés R2 restent des UUID aléatoires et les objets ne sont pas publics directement. La taille réelle et le nombre de pages des nouveaux PDF sont aussi enregistrés dans les métadonnées R2.

Collections : `catalogDocuments`, `catalogCategories`, `services` étendu, `catalogSettings`. L’ordre du tableau est l’ordre manuel. `profiles.catalog_rights` est une surcharge nullable des droits, contrôlée exclusivement par l’administration, jamais par `profiles.data`.

Routes conformes aux conventions existantes :

- `GET /api/data?id={id}` : projection publique autorisée.
- `GET /api/data` : carte appartenant à l’utilisateur et droits applicables.
- `POST /api/data`, action `save` : mutations atomiques de la carte et du catalogue, contrôle du propriétaire et de la révision.
- `POST /api/upload` : fichier, contrôle de session et d’origine, signature réelle, taille, pages PDF, réservation atomique du stockage.
- `GET /api/catalog-documents/{profile}/{document}` : lecture propriétaire ou publique autorisée, requêtes Range.
- `POST /api/catalog-order` : sélection visiteur, origine et schéma borné, génération du lien WhatsApp sans envoi ni stockage d’une commande.
- `POST /api/admin`, action `catalogRights` : droits par carte, session administrateur et journal d’audit.

Tous les fichiers du module sont inclus dans l’index `profile_media`, y compris les documents/produits masqués et les miniatures. Validation de propriété à l’enregistrement, vérification du type des images et PDF. Un lien inséré dans un texte libre ne constitue pas une preuve de propriété pour lire un fichier privé d’un autre compte. Les remplacements/suppressions marquent les fichiers sans référence pour nettoyage ; les fichiers encore référencés sont protégés. Les imports abandonnés depuis 24 h sont nettoyés à la prochaine action de stockage.

## Migration et retour arrière

Appliquer `drizzle/0007_catalog_rights.sql` une seule fois aux bases de prévisualisation et de production avant de publier le code. Ajout nullable uniquement, aucune réécriture des cartes ni des anciens fichiers. Vérifier `PRAGMA table_info(profiles)` avant l’application. Le journal Drizzle et son instantané sont versionnés.

La mise à jour de l’ancien catalogue intervient lors d’un enregistrement par le propriétaire. Un retour arrière du code seul ne restitue pas les PDF multiples ou les champs nouveaux dans l’ancien éditeur : conserver les données JSON et revenir au code du module dès que possible. Ne pas effacer les données pour revenir en arrière. La colonne additive peut rester en place ; la retirer n’est pas nécessaire.

## Validation

Tests unitaires : schémas, limites, langues sans repli vers l’autre langue, disponibilité, catégories masquées, droits, conservation des brouillons, historique imbriqué, réservations concurrentes et médias protégés.

`pnpm build`, `pnpm verify:public`, `pnpm verify:journey`. Le parcours isolé vérifie de vrais PDF, la limite de pages, les fichiers privés, la lecture par plages, les PDF masqués, la substitution à adresse stable, le nettoyage de l’ancien objet, les changements de prix, les messages WhatsApp multiarticles, l’isolation des comptes et les droits administrateur. Aucun message WhatsApp n’est envoyé par le test.

Avant validation définitive sur téléphone : importer sur Android puis iPhone, lire plusieurs pages, pincer/zoomer sur un détail, revenir en arrière deux fois avec une fiche/photo imbriquée, puis répéter dans la PWA installée. Les tests avec User-Agent mobile ne remplacent pas les tests tactiles sur appareils réels.

Vérification visuelle en prévisualisation sur navigateur de bureau : recherche, fiche produit FR/AR, sélection de deux articles, photo imbriquée puis Retour vers la fiche, passage fiche → formulaire sans soumission, ouverture PDF, défilement jusqu’à la page 2, double toucher à 200 %, Retour vers l’aperçu de la page 2. Les gestes multitactiles physiques Android/iPhone et la PWA restent à valider sur appareils.

Les contrôles de visibilité et les titres des photos/vidéos sont accessibles dans l’onglet Photos et vidéos. Leur position suit le bloc Produits et services ; ils ne figurent plus comme sections indépendantes dans Interface. Masquer ce bloc ou désactiver le module retire aussi ces médias de la projection publique et de la lecture anonyme des fichiers. Désactiver le module administrativement interdit leurs modifications tout en conservant les fichiers enregistrés. Les quotas et les contrôles de propriété existants restent appliqués.
