# SoraLink — Rapport de livraison du 23 octobre 2026

## Périmètre livré

### 1. Demandes WhatsApp et notifications

- `/api/catalog-order` reconstruit le message à partir des articles publiés : prix, stock, variantes et modes de remise sont contrôlés côté serveur.
- Une sélection préparée est enregistrée dans « Mes demandes » pour le forfait Activité lorsque cette section est autorisée. Elle porte explicitement la mention « envoi à confirmer » : ouvrir WhatsApp ne prouve jamais l’envoi du message.
- La notification utilise la file d’envoi existante, ses reprises et son mécanisme d’idempotence. Le Worker Pages déclenche également sa prise en charge via `ctx.waitUntil` après un appel réussi à cette route. En production, un binding de service interne `NOTIFICATIONS` appelle le Worker dédié : la clé Resend reste uniquement dans ce dernier. Le Worker dédié conserve son cron et ne possède aucune route publique.
- Une même intention ne crée pas plusieurs demandes ni plusieurs notifications. Limites : 10 nouvelles intentions par visiteur/carte en 15 minutes et 30 par carte en 15 minutes. Les intentions de plus de 30 jours sont nettoyées progressivement.
- Le forfait Catalogue conserve la sélection WhatsApp sans obtenir les fonctions Activité.
- Les bindings D1 `DB` et R2 `BUCKET` existent déjà sur les environnements Pages de production et de prévisualisation : aucune duplication de configuration n’est nécessaire. Le cron de secours existant reste à une minute ; le passer à deux minutes ralentirait la reprise.

### 2. Support QR A5 et liens QR/NFC

- Export PDF A5 depuis « Partager ma carte », en français ou en arabe, aux couleurs orange/noir de SoraLink.
- QR avec marge blanche et correction d’erreurs élevée. Le nom professionnel est intégré.
- Les nouveaux QR utilisent `?src=qr`. Un lien `?src=nfc` est disponible pour programmer les cartes physiques.
- Les anciennes cartes NFC doivent être reprogrammées pour déclarer cette origine. Un lien non marqué reste utilisable et est compté parmi les autres liens.

### 3. Sélection sur mobile

- Barre contextuelle au bas de l’écran affichant quantité et total indicatif, ou total à confirmer si un article n’a pas de prix.
- Accès direct à la sélection, masquage lorsque la sélection est visible ou qu’une fenêtre modale est ouverte, prise en compte de la zone de sécurité du téléphone et du RTL.
- Aucun doublon du bouton d’enregistrement de contact ; les trois actions compactes de la carte sont conservées.

### 4. Justificatifs de paiement privés

- Dépôt depuis une commande en attente, y compris pour renouveler un abonnement expiré.
- JPEG, PNG ou PDF : signature réelle vérifiée, 5 Mo maximum, PDF de 10 pages maximum, 3 pièces par commande et 20 dépôts par compte sur 24 heures.
- Fichiers dans un espace R2 privé distinct des médias publics. Consultation uniquement par le propriétaire ou l’administrateur, sans cache et sans URL publique de stockage.
- L’administration peut télécharger les pièces avant de confirmer manuellement l’encaissement. Le dépôt ne change ni le statut du paiement ni les droits du client.

### 5. Statistiques par origine du lien

- Compteurs QR, NFC et autres liens sur les 30 derniers jours, dans « Mes demandes » du forfait Activité.
- Droits du forfait, état du compte et autorisation de section vérifiés côté serveur ; aucune consultation des données d’un autre propriétaire.
- Filtrage des robots connus, des visites du propriétaire connecté et des répétitions rapprochées. Empreinte temporaire hachée ; aucune adresse IP brute conservée dans ces tables.
- Ces nombres mesurent des ouvertures par origine déclarée, pas des scans physiques certifiés, ni des visiteurs uniques absolus.

### 6. Variantes, retrait et échange de coordonnées

- Variantes facultatives intégrées au formulaire d’article : noms FR/AR, prix et disponibilité, maximum 12 variantes par article. La limite du catalogue reste 40 articles.
- Modes facultatifs configurables : sur place, à emporter et livraison. L’adresse est exigée pour une livraison ; les frais restent à confirmer avec le professionnel.
- Message WhatsApp bilingue contenant noms, quantités, variantes, références et prix visibles. Les prix masqués restent exclus des données publiques, y compris dans les variantes.
- Coordonnées facultatives du visiteur, avec indication de leur usage. Le mécanisme existant d’échange de contact avec consentement est réutilisé ; aucun formulaire obligatoire après le téléchargement d’une vCard.

## Migration et compatibilité

Migration additive : `drizzle/0012_commerce_metrics_receipts.sql` ; nouvelles tables d’intentions, de statistiques et de justificatifs, avec index et références aux données existantes. Migration appliquée en prévisualisation et en production. Aucune suppression ou réécriture de données client. Les forfaits, la validation manuelle des paiements, l’authentification et le fournisseur e-mail existant sont conservés. Aucune API Meta ni paiement en ligne ajouté.

## Vérifications réalisées

- `pnpm build` : TypeScript, 269 tests, formatage et compilation Vinext/Cloudflare réussis.
- `pnpm verify:public` : graphe JavaScript public isolé, filtrage des champs privés, rendu serveur, ressources, routes, référencement FR/AR et exclusion des pages privées vérifiés.
- `pnpm verify:journey` : parcours complets sur D1/R2 isolés ; sélection idempotente, variantes, livraison, prix calculés côté serveur, isolation des comptes, justificatifs privés accessibles au propriétaire/admin, renouvellement expiré et absence d’activation automatique validés.
- Test de panne d’écriture : aucune intention ni notification partiellement conservée lorsque l’enregistrement de la demande échoue.
- PDF A5 FR/AR : une page de 148 × 210 mm, aperçu visuel contrôlé, QR décodé automatiquement vers la bonne adresse marquée.
- Aucun compte client réel modifié et aucun e-mail ou message WhatsApp envoyé pendant les tests.

## Limites de validation

Les vérifications avec agents utilisateurs mobiles et le contrôle du code responsive ne remplacent pas un essai tactile sur Android/iPhone ou dans une PWA installée. Un essai sur appareils physiques et une impression réelle du support A5 restent utiles. La réception finale d’un e-mail dépend du fournisseur et de la délivrabilité ; les tests valident la création de la notification sans envoi à un destinataire réel. Les justificatifs ne prouvent pas l’encaissement bancaire : cette vérification reste manuelle.
