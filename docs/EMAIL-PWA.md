# Notifications e-mail et PWA — 15 octobre 2026

## Notifications

Les demandes de devis, commandes et rendez-vous génèrent une alerte e-mail au professionnel
quand la file est activée. Une confirmation ou annulation de rendez-vous génère un e-mail
au visiteur si une adresse valide a été renseignée. L’échange de coordonnées reste dans
les contacts et n’envoie pas de notification e-mail. Les messages suivent la langue du
professionnel pour les alertes, celle du visiteur pour ses rendez-vous.

La file est liée à la mutation SQL : une demande refusée ne produit pas d’e-mail.
L’envoi utilise les verrous, les reprises bornées et la clé d’idempotence Resend existants.
Les tests simulent le fournisseur ; aucun e-mail réel n’est envoyé pendant ces contrôles.

Pages n’a plus besoin de la clé du fournisseur pour préparer les notifications :
`NOTIFICATIONS_ENABLED`, `PUBLIC_SITE_URL` et `EMAIL_FROM` suffisent à activer la file.
Le secret `RESEND_API_KEY` appartient uniquement au Worker `soralink-notifications`,
lié à la base D1 de production existante. Le déclencheur prévu traite au plus dix messages
par minute. La configuration fournie reste explicitement désactivée par défaut.

Le Worker a été installé sur Cloudflare avec la planification chaque minute et les accès
publics désactivés. Il ne possède pas encore de clé Resend et son envoi est désactivé.

### Activation à terminer

1. Créer/utiliser un compte Resend et y ajouter le domaine `soralink.link`.
2. Valider les enregistrements DNS fournis par Resend, sans modifier les MX existants
   du domaine principal. Ne pas inventer de valeur DKIM/SPF.
3. Ajouter une clé Resend limitée à l’envoi dans les secrets Cloudflare du Worker,
   sous le nom `RESEND_API_KEY`. Ne pas transmettre cette clé dans la conversation.
4. Vérifier l’expéditeur `SoraLink <notifications@soralink.link>`, puis activer le Worker.
5. Activer ensuite la file sur Pages avec les mêmes URL et expéditeur.
6. Effectuer un envoi réel vers une adresse de test autorisée et contrôler sa réception.

Le détail des variables figure dans [HIGH-PRIORITY-FIXES.md](HIGH-PRIORITY-FIXES.md).
L’API Cloudflare Email a refusé l’accès dans cette session et aucun connecteur Resend
n’a été trouvé. Aucun compte tiers, abonnement ou clé secrète n’a été créé.
Les e-mails d’authentification Supabase restent indépendants. WhatsApp reste manuel.

## Installation et mode hors connexion

- Le manifeste français/darija conserve une identité d’application unique (`id: /`),
  un périmètre limité au site et une ouverture de l’espace avec la langue choisie.
- Le HTML de l’accueil référence le bon manifeste dès le serveur ; le bouton de langue
  met aussi ce manifeste à jour pendant la navigation.
- La page hors connexion affiche une seule langue. Elle reprend le choix explicite de
  l’URL, puis la préférence locale disponible ; un bouton permet de changer de langue.
- La redirection Cloudflare de `/offline.html` vers `/offline` reste dans les ressources
  statiques, afin que la page de secours ne soit pas envoyée au routeur de l’application.
- Le service worker ne conserve que la page générique hors connexion. Les données de
  compte, réponses API, cartes et fichiers clients ne sont pas mis en cache hors ligne.
- Aucun formulaire ni aucune sauvegarde n’est rejoué automatiquement sans connexion.

Les tests couvrent les manifestes, icônes, langue hors connexion, priorité URL/préférence,
stockage indisponible et exclusion des requêtes API/authentification/écriture du cache.
Les tests du Worker compilé vérifient les deux manifestes et leurs liens dans le HTML.

L’extension du navigateur local n’est pas accessible dans cette session. Les règles CSS
pour les petits écrans sont présentes ; une installation sur Android/iPhone et les actions
natives de partage/vCard restent à tester sur appareils réels. Les tests de rendu et de
service worker ne constituent pas une validation sur téléphone.
