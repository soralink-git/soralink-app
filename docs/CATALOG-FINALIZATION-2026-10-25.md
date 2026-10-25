# Finalisation Produits et services — 25 octobre 2026

## Livré

Le module unique conserve PDF intégrés et catalogue dynamique. Les produits/services,
documents et offres se gèrent dans l’interface existante ; les catégories sont intégrées
au formulaire article. La limite par défaut reste 40 articles pour les forfaits autorisés.
Aucun changement des tarifs, des comptes ou du modèle D1/R2.

## Corrections finales

- L’ouverture d’un PDF intégré possède son entrée d’historique, en plus de celle du plein
  écran. Retour ferme le plein écran, puis la lecture intégrée avant de quitter la carte.
  Passer d’un document à un autre conserve une seule entrée de lecture. Un document retiré
  ou masqué ne conserve pas une visionneuse active invisible.
- L’aperçu PDF utilise les mêmes options de chargement par plages et sans préchargement
  complet que le lecteur plein écran. Le contenu est nécessairement transféré au navigateur
  pour lecture ; aucune ouverture ne déclenche un téléchargement de fichier sur l’appareil.
- Le lecteur conserve la page et le décalage relatif quand les dimensions réelles de pages
  portrait/paysage sont découvertes ou que sa largeur change. Le zoom au point ciblé garde
  la priorité pendant le geste. Le saut à une page met immédiatement à jour son compteur.
- Le panier applique la même limite de 40 lignes article/variante que l’API, y compris via
  le bouton de demande individuelle. Une ligne déjà choisie reste modifiable à cette limite.
  Les variantes comptent séparément. Les contrôles sont verrouillés pendant la préparation
  WhatsApp et le refus de dépassement est localisé.
- Recherche publique et recherche dans l’éditeur partagent la normalisation des accents,
  signes de vocalisation arabes et espaces. La référence peut être cherchée. Le contenu de
  l’autre langue n’est pas utilisé comme traduction de secours.
- La documentation du module décrit les onglets et le suivi des demandes actuels, sans
  réintroduire une rubrique indépendante Photos/Vidéos ou une API Meta.

## Couverture des critères

| Critère                         | Vérification                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| Importer/publier PDF            | Parcours du Worker avec vrais PDF dans D1/R2 isolés                                            |
| Lecture intégrée                | PDF.js local, sans iframe externe ; URLs stables de document                                   |
| Gestes et Retour                | Tests des gestes et historique imbriqué ; lecture/zoom/Retour vérifiés en préversion           |
| Modifier un prix                | Enregistrement et projection publique vérifiés dans le parcours                                |
| Masquer produits/catégories/PDF | Projection et lecture directe refusées lorsque nécessaire                                      |
| Sélection WhatsApp              | Message calculé côté serveur, variantes, quantités, références, prix indicatifs et idempotence |
| FR/AR et RTL                    | Rendus et contenus distincts testés ; recherche sans mélange de langues                        |
| Isolation des comptes           | Lecture/mutation/médias privés et justificatifs vérifiés                                       |
| Droits et forfaits              | Fonctions, publication, quotas et comptes suspendus contrôlés côté serveur                     |
| Non-régression                  | 300 tests, TypeScript, formatage, build et parcours complets réussis                           |
| Stockage                        | Signature réelle, PDF 25 Mio/100 pages maximum, réservation de quota et nettoyage vérifiés     |
| Android/iPhone/PWA physiques    | Recette réelle toujours à confirmer ; aucun test User-Agent présenté comme preuve tactile      |

## Architecture et limites

Les métadonnées réutilisent `profiles.data` et les droits administratifs par carte dans D1.
Les fichiers sont privés dans R2, avec contrôle d’accès par API et index `profile_media`.
Aucune migration de schéma n’est nécessaire. Le téléchargement volontaire exige à la fois
l’option du propriétaire et le droit administrateur. La lecture intégrée ne constitue pas
une protection anticopie.

L’envoi WhatsApp reste confirmé manuellement par le visiteur dans WhatsApp Business.
Aucun paiement en ligne ni envoi Meta automatique ajouté. Les coordonnées ou demandes de
clients réels ne sont pas utilisées pour les essais.

## Validation reproductible

```sh
pnpm build
pnpm verify:public
pnpm verify:journey
pnpm verify:recovery
```

Six régressions supplémentaires couvrent les formats PDF mixtes, la conservation de position,
la rotation/largeur, les bornes, le panier à capacité maximale et la recherche bilingue.
Les vérifications de reprise utilisent uniquement des données synthétiques.

## Recette navigateur réalisée

Sur la préversion Cloudflare, dans Chrome de bureau :

- recherche `identite` : trouve E‑Identité sans saisir les accents ;
- sélection de deux exemplaires NFC et d’une E‑Identité : total indicatif 347 DH ;
- PDF intégré de quatre pages : ouverture, passage à la page 2 et double clic à 200 % ;
- premier Retour : fermeture du plein écran avec aperçu à la page 2 ; second Retour :
  fermeture de la lecture intégrée, carte toujours affichée ;
- interface arabe, fiche produit et photo imbriquée : Retour ferme la photo puis la fiche.

Aucun clic d’envoi WhatsApp ni soumission de demande réelle effectué. Cette recette
ne remplace pas les gestes multitactiles Android/iPhone ni la PWA installée.
