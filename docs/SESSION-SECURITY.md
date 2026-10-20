# Sessions et connexion

Les espaces client et administrateur expirent après 15 minutes sans activité. Le serveur exige une session applicative active, en plus de l’identité confirmée par Supabase. Un cookie Supabase encore valide ne permet donc pas de contourner l’expiration. Une nouvelle connexion ou un lien de confirmation/récupération validé crée une nouvelle session.

Un identifiant aléatoire de 256 bits est placé dans un cookie `__Host-`, Secure, HttpOnly, SameSite=Lax. Seule son empreinte SHA-256 est stockée dans D1, avec le propriétaire et l’échéance. La déconnexion supprime cet enregistrement. Les sessions expirées sont supprimées progressivement lors des connexions.

Les interactions visibles (toucher, clavier, saisie, défilement) signalent l’activité, avec une synchronisation limitée à une requête toutes les 15 secondes et un dernier envoi différé. Le délai peut donc varier de quelques secondes. Les lectures d’API, sauvegardes automatiques, changements de visibilité et vérifications de session ne prolongent pas la session. Plusieurs onglets du même navigateur partagent la session : un onglet utilisé peut la maintenir active. La reprise après suspension du téléphone vérifie le serveur avant tout renouvellement. Le contrôle serveur fonctionne même si le navigateur suspend ses minuteries.

La case « Mémoriser mon adresse e-mail sur cet appareil » enregistre uniquement l’adresse dans le stockage local après une connexion réussie. La décocher efface l’adresse mémorisée. Le mot de passe n’est pas conservé par SoraLink : le remplissage et l’enregistrement éventuels restent sous le contrôle du gestionnaire de mots de passe du navigateur.

## Déploiement

Appliquer `drizzle/0008_idle_sessions.sql` sur les bases de prévisualisation et de production avant de publier le code. La migration ajoute uniquement une table et son index. Les sessions ouvertes avant cette mise à jour doivent se reconnecter une fois. En cas de retour à la version précédente, laisser la table en place : elle est ignorée par l’ancien code.

## Vérifications

Les tests de minuterie utilisent une horloge simulée pour vérifier l’expiration, les interactions, la suspension mobile, les onglets partagés, les pannes réseau et la suppression des écouteurs. Le parcours isolé D1/R2 vérifie la connexion, la récupération de mot de passe, les accès privés refusés après expiration, la séparation des comptes, le non-renouvellement par lecture, le refus des renouvellements expirés et la révocation à la déconnexion. Ces tests ne remplacent pas un essai sur un véritable téléphone.
