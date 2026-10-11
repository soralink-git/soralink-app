# Emails SoraLink selon la langue choisie

L’interface de l’application est traduite. Les emails sont envoyés par Supabase et leurs modèles doivent être enregistrés dans son tableau de bord.

Dans **Authentication → Emails → Templates**, ouvrir les modèles suivants :

- **Confirm sign up** : objet `{{ if eq .Data.language "ar" }}أكد الحساب ديالك فـ SoraLink{{ else }}Confirmez votre compte SoraLink{{ end }}`. Copier le contenu de `confirmation.html` dans le corps du message, puis enregistrer.
- **Reset password** : objet `{{ if eq .Data.language "ar" }}رجّع الدخول ديالك لـ SoraLink{{ else }}Récupérez votre accès SoraLink{{ end }}`. Copier le contenu de `recuperation.html` dans le corps du message, puis enregistrer.

Chaque message est envoyé dans une seule langue. Le site enregistre la langue dans les informations du compte à l’inscription, à la connexion et lors du changement de langue. La récupération envoyée sans connexion utilise la dernière langue enregistrée dans le compte, ou le français si aucune préférence n’est enregistrée. La variable `{{ .ConfirmationURL }}` conserve le lien sécurisé généré par Supabase. Ne pas la remplacer par une adresse statique.

Les noms de sections ci-dessus sont ceux de l’interface externe Supabase. Ils ne sont pas affichés aux clients SoraLink.
