# Suite des corrections — 15 octobre 2026

## Historique et administration

Les demandes, contacts et commandes du client sont consultables par pages de 50 éléments.
Le bouton « Afficher plus » / « بيّن المزيد » charge les suivants sans réinitialiser le
brouillon de la carte. Les requêtes en cours devenues obsolètes après une actualisation
sont ignorées ; un échec conserve la position pour réessayer.

La position combine date et identifiant : des éléments créés au même instant ne sont pas
perdus entre deux pages. L’ajout d’un élément plus récent ou la suppression du dernier
élément lu ne décale pas la page suivante. Les lignes restent filtrées par propriétaire
vérifié, même si un curseur a été copié depuis un autre compte. Les paramètres de curseur
sont validés puis liés à la requête SQL. Les curseurs ne constituent pas une autorisation.

L’administration utilise également des pages pour les clients, commandes et événements.
La recherche nom/e-mail interroge l’ensemble des clients sur validation du formulaire,
avec les caractères `%`, `_` et les apostrophes traités littéralement. Les compteurs
restent globaux, indépendants des pages et du filtre. Les dates du journal suivent la
langue choisie. Les profils dont la date de modification change peuvent se déplacer dans
le classement : actualiser la liste pour retrouver les modifications les plus récentes.

Les deux dernières notifications de chaque demande affichée sont chargées avec elle,
y compris dans les anciennes pages. La consultation ne déclenche aucun envoi.

Les statuts de demande affichés en anglais sont remplacés par des libellés FR/darija.
Les e-mails préparés manuellement suivent la langue choisie et le type de demande
(devis, commande ou rendez-vous). Le bouton WhatsApp prépare toujours un message manuel.

Le changement de langue actualise l’URL en conservant l’offre, l’onglet et les ancres :
une actualisation ne rétablit plus l’ancienne langue. Les liens vers l’espace client
conservent aussi ce choix.

Le logo et les liens légaux / offres du pied de page conservent aussi la langue choisie,
depuis l’accueil, la connexion, l’administration et la carte. Les libellés résiduels
« LIVE », « Option Pro » et la ville du pied de page sont traduits selon la langue.

Aucune migration ni suppression de données n’est nécessaire pour ce lot. Les index
existants sont conservés. Le serveur retourne toujours les champs historiques initiaux ;
les clients mis à jour utilisent en plus les métadonnées de pagination.

## Vérifications

- Tests sur SQLite isolé : trois pages avec dates identiques, insertion/suppression entre
  pages, séparation des comptes, notifications anciennes, recherche et compteurs globaux.
- Parcours du Worker compilé avec D1/R2 jetables et fournisseur d’authentification simulé :
  106 demandes parcourues sans doublon, isolation des comptes, refus anonyme et curseur invalide.
- Rendu des libellés français et darija et réponses préparées ; compilation TypeScript,
  tests, formatage, vérification du graphe public et du parcours complet.
- Audit des dépendances : un avis élevé subsiste sur `braces@3.0.3`
  (`GHSA-vfj7-8cjw-p6xm`), sans version corrigée publiée dans le résultat obtenu.
  L’avis reste visible et concerne la chaîne d’outils déjà documentée.

## Points nécessitant des informations ou des accès supplémentaires

- Notifications automatiques : expéditeur validé et clé du fournisseur d’envoi absents.
  WhatsApp automatique nécessite une intégration et des identifiants Business dédiés.
  Aucun message réel n’a été envoyé pour ces vérifications.
- Mentions légales définitives : identité et adresse du responsable, statut de l’entreprise,
  identifiants légaux applicables et conditions commerciales à fournir. Ne pas inventer ces données.
- Types Réseaux sociaux / vCard / Vitrine : droits de chaque offre à définir avant de
  restreindre les cartes déjà achetées ; aucun prix ni droit existant n’est modifié ici.
- Sauvegarde complète et restauration isolée : l’archive SQL séparée et la copie des médias
  n’ont pas été réalisées lors du déploiement précédent. Un point de restauration natif D1
  avait été vérifié. Ce lot ne lit ni ne modifie les médias de production.
- Recette visuelle sur Android/iPhone, partage natif, vCard et installation PWA à effectuer
  sur appareils réels. Les vérifications de rendu et d’agent utilisateur ne la remplacent pas.
- Vérification effective du SMTP Supabase, de MFA et de la protection de branche :
  à faire avec les accès d’administration appropriés.
- Nettoyage automatique des imports abandonnés sans visite du compte : nécessite un Worker
  d’entretien configuré et une politique de conservation validée avant activation en production.
