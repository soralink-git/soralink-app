# Emails SoraLink en français et darija

L’interface de l’application est traduite. Les emails sont envoyés par Supabase et leurs modèles doivent être enregistrés dans son tableau de bord.

Dans **Authentication → Emails → Templates**, ouvrir les modèles suivants :

- **Confirm sign up** : objet `Confirmez votre compte SoraLink · أكد الحساب ديالك`. Copier le contenu de `confirmation.html` dans le corps du message, puis enregistrer.
- **Reset password** : objet `Récupérez votre accès SoraLink · رجّع الدخول ديالك`. Copier le contenu de `recuperation.html` dans le corps du message, puis enregistrer.

Ces deux messages contiennent le français et la darija : Supabase ne reçoit pas encore la langue choisie sur le site. La variable `{{ .ConfirmationURL }}` conserve le lien sécurisé généré par Supabase. Ne pas la remplacer par une adresse statique.

Les noms de sections ci-dessus sont ceux de l’interface externe Supabase. Ils ne sont pas affichés aux clients SoraLink.
