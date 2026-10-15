# Accès administrateur indépendant

- Entrée dédiée : `/admin/connexion?lang=fr` (ou `lang=ar`).
- Le compte vérifié autorisé par `SORATAP_ADMIN_EMAIL` ouvre directement `/admin` après connexion, confirmation d’e-mail ou récupération du mot de passe. Une offre choisie ne détourne pas ce compte vers une commande client.
- La session et les droits sont vérifiés côté serveur. L’URL de connexion ne donne aucun droit à un compte client ; aucun rôle fourni par le navigateur ou les métadonnées modifiables n’est utilisé.
- L’administration ne nécessite aucune carte, publication ni souscription. Elle dispose de sa navigation et de sa déconnexion.
- La carte existante, son propriétaire, son abonnement et ses contenus sont conservés. L’espace carte reste accessible explicitement via `/?app=1` ; posséder une carte demeure facultatif et ne conditionne jamais l’accès administrateur.
- Le compte Supabase autorisé et ses identifiants ne changent pas. Il n’est pas nécessaire de créer un nouveau compte ni de transférer une carte pour administrer la plateforme.

Les tests isolés couvrent un administrateur sans profil, la redirection après connexion, le refus d’un client, l’absence de création automatique de carte et l’interface français/darija.
