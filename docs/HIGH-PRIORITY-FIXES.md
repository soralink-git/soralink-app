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

1. La configuration du Worker référence maintenant la base D1 de production existante
   `soralink-db`. Ne pas créer de base supplémentaire. L’envoi reste désactivé par défaut.
2. Dans Resend, vérifier le domaine expéditeur et ses enregistrements DNS. L’adresse prévue
   est `SoraLink <notifications@soralink.link>` ; elle doit appartenir au domaine validé.
3. Sur le Worker `soralink-notifications` uniquement, ajouter `RESEND_API_KEY` en secret.
   Ne jamais la copier dans le dépôt ni dans la conversation. Pages n’a pas besoin de cette clé.
4. Configurer sur le Worker `PUBLIC_SITE_URL=https://soralink.link`, l’expéditeur vérifié
   `EMAIL_FROM` et `NOTIFICATIONS_ENABLED=true`. Le déclencheur planifié traite la file.
5. Une fois le Worker prêt, configurer sur Pages les mêmes `PUBLIC_SITE_URL`, `EMAIL_FROM`
   et `NOTIFICATIONS_ENABLED=true`. Pages enregistre les notifications dans la même base ;
   il ne détient pas le secret du fournisseur. L’activation du Worker doit précéder celle de Pages.
6. Valider avec un destinataire de test autorisé : nouvelle demande au professionnel,
   confirmation/annulation de rendez-vous au visiteur, reprise après erreur, état `accepted`
   et réception effective. La clé d’idempotence reste identique entre les tentatives.

Les e-mails d’inscription et de récupération de compte restent gérés par Supabase :
ce mécanisme concerne les notifications des demandes, sans changer l’authentification.
WhatsApp reste manuel : aucun compte Meta ni frais d’API WhatsApp n’est activé.

Les simulations n’envoient aucun e-mail réel. Les messages de plus de 23 heures sont
marqués en échec pour éviter de rejouer des envois ambigus. La configuration par défaut
reste désactivée tant que le domaine et la clé du fournisseur ne sont pas prêts.
