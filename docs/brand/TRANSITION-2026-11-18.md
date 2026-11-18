# Transition Groupe SoraLink — 18 novembre 2026

## Décisions conservées

Architecture groupe/divisions, palettes officielles, positionnement professionnel accessible, concept 02 « S continu », même icône et même typographie pour les trois marques. Aucun changement des couleurs personnalisées enregistrées sur les cartes clientes.

## Carte SoraPrint supprimée sur demande explicite

Carte primaire 391f2eaf-ac9d-4455-bc45-3ec2961fafe1, adresse soraprint. Vérifié avant suppression : deux cartes primaires, aucune secondaire. Après suppression : une carte primaire, aucune secondaire ; aucune adresse soraprint ; contrôle des clés étrangères vide. Le compte Supabase n’est pas supprimé. Aucun objet R2 n’est supprimé, afin de conserver les médias éventuellement réutilisés.

Copies de récupération dans la même base D1 : backup_brand_20261118_soraprint, backup_brand_20261118_addresses, backup_brand_20261118_requests, backup_brand_20261118_bookings, backup_brand_20261118_profile_metrics, backup_brand_20261118_profile_metric_seen, backup_brand_20261118_catalog_order_intents, backup_brand_20261118_profile_media. Ce sont des copies internes, pas une sauvegarde indépendante. Définir leur durée de conservation avant tout nettoyage.

Pour restaurer : insérer d’abord la ligne profiles (le trigger réinsère card_registry), puis les adresses, les demandes et réservations, et les mesures. Vérifier les collisions des noms et les colonnes après toute migration ultérieure. Ne pas restaurer soraprint tout en conservant la vitrine à cette route : choisir une autre adresse publique. Le trigger profiles_media_insert reconstruit l’index média.

## Retour arrière de la vitrine

Revenir au commit de production précédent dbc6f4bdf91e1385aaf346709fc018ab5543ffd7 remet l’ancienne présentation. La suppression de carte est une opération distincte de la publication et ne s’annule pas par rollback du code.
