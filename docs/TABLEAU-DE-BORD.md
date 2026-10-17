# Tableau de bord SoraLink

## Création guidée

Les nouveaux propriétaires sans carte enregistrée arrivent dans un assistant à quatre étapes :
style (modèle, ambiance, palette et images), identité, actions de contact, puis vérification.
Le nom est requis avant les étapes Contact et Vérifier. Les autres champs sont facultatifs.
L’utilisateur peut passer à la gestion à tout moment et rouvrir l’assistant.
Les modifications partagent l’état de l’éditeur : quitter l’assistant ne les efface pas.
Le choix Brouillon / Publiée est explicite ; le bouton final appelle la sauvegarde existante,
avec vérification serveur de la session, de la propriété, des droits et de la révision.
Un échec de sauvegarde ne ferme pas l’assistant.

## Gestion

- Marque et style : quatre modèles, ambiance claire/sombre, palettes, logo et couverture.
  Le fond photo, les couleurs détaillées et la typographie restent dans un volet avancé.
- Identité : nom, profession, entreprise et présentation.
- Actions directes : téléphone, WhatsApp, e-mail, adresse/Maps et site web, avec visibilité.
- Réseaux et liens : plateformes existantes, ordre par glisser-déposer ou boutons accessibles.
- Produits et services : catalogue existant, médias, documents et offres.
- Contacts, demandes, agenda, partage et offre : fonctions existantes conservées.

L’aperçu complet utilise le même composant que la carte publique, dans chaque rubrique.
L’arabe conserve la direction RTL et la police Cairo. Aucun texte n’est traduit automatiquement.

## Modèles

Exécutif, Créatif, Contact direct et Minimaliste s’appliquent via les champs de style existants.
Le champ `template` identifie la variante de présentation. Les anciennes valeurs restent valides
et conservent le rendu existant. Les modèles ne modifient ni les contenus, ni les photos,
ni la visibilité, ni les droits de forfait, ni la publication. Les couleurs restent modifiables.
Les recommandations métiers sont indicatives : il n’existe aucune page dédiée par profession.

`socialOrder` est une liste bornée de plateformes reconnues. Elle est validée côté serveur,
normalisée sans doublons et incluse dans la projection publique. Les réseaux masqués ne sont
pas transmis au visiteur. Le masquage du site utilise la section `links` existante.
Aucune migration D1 ni modification de l’authentification n’est nécessaire.

## Partage et contacts

La vCard contient aussi l’entreprise, la fonction, l’adresse et le site lorsqu’ils sont visibles.
Le texte est protégé contre l’injection de lignes et replié à 75 octets UTF-8.
Le QR utilise le lien public actuel de la carte, une marge de quatre modules et la correction H.
Le logo central est facultatif, limité à 18 % du côté du QR, et provient du stockage local autorisé.
Une erreur de génération est affichée et ne permet pas de télécharger un ancien QR trompeur.
La génération reste côté client dans le tableau de bord ; aucun générateur tiers ne reçoit le lien.
La modification du contenu conserve la destination du QR. Tester le scan avant impression.

## Validation

Tests de conservation des contenus/droits lors du choix d’un modèle, validation des données,
ordre public des réseaux, parcours initial FR/AR, séparation des outils, confidentialité et vCard.
Compilation et parcours isolés D1/R2 à exécuter avant publication.
La validation sur appareils physiques (scan avec logo, import iOS/Android, usage tactile) reste
nécessaire. L’objectif de chargement inférieur à une seconde dépend du réseau et du contenu ;
il ne constitue pas une mesure obtenue ni une garantie sur tous les appareils.

### Ajout de réseaux par plateforme

« Réseaux et liens » présente uniquement les liens déjà renseignés. « Ajouter un lien »
ouvre un sélecteur avec icônes, recherche, réseaux sociaux et autres liens (site, avis Google).
La plateforme choisie ouvre un champ de saisie unique ; le lien est validé avant son ajout
à l’état de l’éditeur. Les modifications ne sont publiées qu’après l’enregistrement commun.
Les fiches permettent de modifier ou retirer les liens. Les réseaux ajoutés se réordonnent
par glisser-déposer ou boutons accessibles. Les champs existants sont réutilisés : aucun
transfert de données, changement de stockage ou nouvelle limite de forfait.

### Plusieurs entrées par plateforme ou action

`profileLinks` est une liste ordonnée de 40 entrées maximum, indépendantes du forfait catalogue.
Chaque entrée possède un identifiant unique, un type reconnu, une valeur, deux libellés FR/AR
facultatifs et sa propre visibilité. Plusieurs entrées du même type sont autorisées. Les adresses
peuvent conserver un lien Maps et une destination précise. Le choix d’une plateforme existante
ajoute une nouvelle entrée et ne remplace plus la précédente.

Les anciennes cartes sans liste continuent d’utiliser leurs champs historiques. L’éditeur les
adapte avec des identifiants stables ; au premier changement, il conserve les valeurs et la
confidentialité dans la liste. Une liste vide est explicite et ne réactive jamais les anciens liens.
Aucune migration D1 ni réécriture des comptes n’est requise.

À la sauvegarde, la première entrée de chaque type alimente aussi le champ historique pour
les traitements existants. La première adresse e-mail reste la destinataire des notifications ;
les demandes du catalogue utilisent le premier WhatsApp visible dans la projection publique.
Les changements d’ordre peuvent donc modifier le contact principal de leur type.

Le serveur vérifie les types, formats, identifiants uniques et la limite de 40 entrées. La projection
publique transmet uniquement les champs autorisés des entrées visibles et respecte les sections
masquées. La fiche vCard contient les téléphones, e-mails, adresses et sites visibles ; un numéro
WhatsApp identique à un téléphone n’est pas dupliqué. Les anciennes cartes gardent leur rendu
jusqu’à la modification de leurs liens. Les tests incluent sauvegarde D1, lecture publique,
réseaux et numéros multiples, confidentialité, limites et conservation de l’état propriétaire.

### Retrait des contenus ajoutés

Les images de l’assistant et le lien YouTube disposent d’une action de retrait explicite,
comme les médias, documents, produits, catégories, promotions et liens existants.
Dans l’agenda, chaque date de fermeture et prestation peut être supprimée ; une pause
retirée est enregistrée par deux valeurs vides, sans rétablissement automatique à midi.
L’agenda possède son propre bouton d’enregistrement. Le dernier élément d’une liste peut
être retiré sans réapparition des données historiques. Ces changements de configuration
sont publiés après enregistrement ; les contrôles de nettoyage des fichiers inutilisés et
de protection des fichiers encore référencés restent appliqués côté serveur.

### Sauvegarde automatique

Un seul bouton « Enregistrer les modifications » reste disponible dans la barre d’état.
L’éditeur enregistre automatiquement après 800 ms de pause dans la saisie. Les envois sont
sérialisés avec la révision D1 attendue ; une réponse ancienne ne remplace jamais l’état de saisie.
Les imports suspendent les nouveaux envois jusqu’à leur fin. La saisie reste possible pendant
une sauvegarde et l’aperçu conserve son composant pendant les changements d’état.

Le chargement initial ne déclenche pas d’écriture. La première carte se crée au premier
changement valide ; son assistant reste ouvert. La visibilité publique est un choix explicite.
Les champs incomplets ou refusés ne sont pas marqués enregistrés. L’état indique attente,
enregistrement, succès, hors ligne, erreur ou conflit en FR/AR. Le retour du réseau relance
la sauvegarde en attente ; il n’existe pas de boucle de tentatives sur une erreur de validation.

Un conflit de révision bloque les écritures suivantes, y compris manuelles. Le propriétaire
peut recharger la version enregistrée après confirmation de l’abandon des modifications locales.
Un rafraîchissement de l’espace attend les écritures en cours ; la fermeture signale les changements
non enregistrés. Les données en attente restent en mémoire et ne sont pas stockées dans un cache
local partagé. La sauvegarde nécessite une connexion ; le succès n’est affiché qu’après réponse
positive du serveur. Les règles de session, propriété, quotas et publication restent inchangées.

La sauvegarde transmet également l’identité du propriétaire chargée avec la carte :
si le compte connecté change dans un autre onglet, le serveur refuse la modification
avant toute écriture. Les aperçus temporaires de recadrage ne sont pas enregistrés.
