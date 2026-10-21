# Offres SoraLink — octobre 2026

| Offre                     | Première année / achat | Renouvellement | Accès                                                                                                    |
| ------------------------- | ---------------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| 1 — Une carte, une action | 99 DH, une fois        | Aucun          | Carte NFC + QR vers une destination externe. Commande WhatsApp, sans compte SoraLink. Livraison séparée. |
| 2 — E‑Identité            | 149 DH                 | 149 DH/an      | Ma carte, réseaux et liens, partage.                                                                     |
| 3 — Produits et services  | 249 DH                 | 149 DH/an      | Pack 2 + 40 articles, catégories intégrées au formulaire, PDF, promotions et commandes WhatsApp.         |
| 4 — Suivi de mon activité | 499 DH                 | 149 DH/an      | Pack 3 + contacts, demandes, agenda et notifications e-mail.                                             |

Les packs 2 à 4 incluent la première année d’hébergement et les modifications de contenus. Toutes leurs fonctions sont conservées au renouvellement. Carte NFC physique en supplément. Aucun paiement en ligne ni prélèvement automatique.

## Activation manuelle

Le client enregistre d’abord sa carte, puis demande une offre depuis Mon offre. Une commande n’accorde aucun droit avant confirmation. L’administrateur vérifie le paiement, passe la commande à **Paiement confirmé**, puis clique **Activer ou renouveler · 12 mois**. Une commande ne peut être appliquée qu’une fois, y compris avec deux requêtes concurrentes (transaction D1 et marqueur conditionnel).

Le renouvellement est un type de commande distinct. Le serveur fixe son montant à 149 DH et reprend le forfait enregistré ; le client ne peut pas choisir un autre pack à ce tarif. Il prolonge une échéance payée encore future d’un an ; un compte expiré ou en essai repart de l’activation. Si le forfait change entre la demande de renouvellement et son activation, l’administrateur doit annuler la demande obsolète. Les changements de pack sont traités comme une nouvelle activation annuelle aux prix affichés.

## Compatibilité et droits

Les identifiants actuels sont `Identite`, `Catalogue`, `Activite`. Les comptes historiques `Digital`, `Pack`, `Accompagnement` conservent leur catalogue et leur suivi ; leurs rendez-vous restent contrôlés par leur ancien indicateur Pro. Aucune conversion automatique ni suppression des données. Les nouveaux comptes commencent par E‑Identité en essai pendant 14 jours. Le choix dans l’URL ne change pas le forfait enregistré.

`app/lib/offers.ts` centralise tarifs et capacités. Les routes de catalogue, fichiers publics, formulaires, historique, agenda et mutations appliquent les capacités côté serveur. Une ancienne valeur Pro ne débloque pas les rendez-vous du pack 2 ou 3. Les droits catalogue personnalisés ne permettent pas de contourner le pack E‑Identité. Les fichiers et articles existants restent enregistrés lors d’un changement de droits, mais sont exclus de la projection publique si le pack ne les autorise plus.

## Migration

Appliquer `drizzle/0010_offer_orders.sql` aux bases de prévisualisation et de production avant de déployer le worker. Elle ajoute `kind`, `amount` et `applied` à `orders`, sans modifier les offres ou échéances existantes. Les montants des commandes historiques restent vides ; ne pas leur attribuer rétroactivement les nouveaux tarifs. Ces anciennes commandes se traitent depuis la fiche client.

## Vérifications

Les tests couvrent la grille FR/AR, les accès par pack, la conservation des droits historiques, la projection publique et les échéances. `pnpm verify:journey` exécute aussi les appels HTTP au worker compilé, avec D1/R2 isolés et un fournisseur d’authentification simulé : refus des contournements, WhatsApp, confirmation manuelle, renouvellement à 149 DH, isolation des comptes et activation unique. Aucun message réel n’est envoyé.
