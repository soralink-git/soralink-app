# Corrections prioritaires

## Propriété des comptes

La connexion ne transfère plus de profil, commande ou média en fonction de l’e-mail.
Le propriétaire reste l’identifiant Supabase vérifié (`sb:<id>`), même si l’adresse change.
Les profils historiques restent conservés avec leur propriétaire existant. Toute migration
historique doit être effectuée séparément après vérification de la propriété des deux comptes.
Ce correctif ne peut pas identifier ou annuler automatiquement des transferts antérieurs.

## Notifications

Après une mutation réussie sur `/api/data`, Pages lance en arrière-plan un envoi éligible.
Les échecs restent réessayables et les envois concurrents utilisent le bail SQL et la clé
d’idempotence existants. Aucun envoi ne démarre si les notifications sont désactivées.

Le Worker `notifications-worker.ts` traite aussi dix messages par minute sans visite du site.
Avant de le déployer avec `wrangler.notifications.jsonc` :

1. Ajouter `d1_databases` avec `binding: "DB"`, le `database_name` et le `database_id`
   **réels de la base déjà utilisée par Pages**. Ne pas créer une autre base.
2. Configurer sur Pages et sur le Worker `NOTIFICATIONS_ENABLED=true`, `PUBLIC_SITE_URL`
   (URL HTTPS du site), `EMAIL_FROM` (expéditeur validé) et le secret `RESEND_API_KEY`.
3. Déployer le Worker séparément et le site Pages. La configuration fournie définit le
   déclencheur chaque minute et désactive les URL publiques du Worker.
4. Valider avec un destinataire de test autorisé : création d’une demande, confirmation,
   annulation, reprise après erreur, état `accepted` et réception effective.

Le fournisseur est simulé dans les tests : aucun e-mail réel n’est envoyé. Les messages
anciens de plus de 23 heures sont marqués en échec pour éviter de rejouer des envois ambigus.
La configuration des ressources et secrets en production n’est pas incluse dans le dépôt.
