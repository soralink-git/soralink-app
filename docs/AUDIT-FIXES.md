# Corrections de l’audit du 15 octobre 2026

## Résultat attendu

Un compte vérifié conserve son identifiant de propriétaire. Un essai possède une échéance
fixe de 14 jours ; un abonnement actif bénéficie de 15 jours de grâce après son échéance.
Une carte dépubliée, suspendue ou expirée ne donne plus accès publiquement à ses fichiers.
Le propriétaire connecté conserve la consultation de ses propres fichiers, mais ne peut
plus importer de nouveaux fichiers si son profil est inactif. Une sauvegarde provenant
d’une ancienne fenêtre est refusée avec un conflit 409.

Le choix d’offre est conservé pendant l’inscription, la confirmation et la connexion.
La demande d’achat est confirmée explicitement dans l’espace ; le règlement reste manuel.
Les parcours de connexion, les pages légales et l’administration suivent la langue choisie.
Les notifications utilisent une seule langue : celle du professionnel pour une nouvelle
demande, celle du visiteur enregistrée avec sa demande pour les confirmations/annulations.
Le bouton WhatsApp prépare un message ; il ne l’envoie pas automatiquement.

## Étapes livrées

| Étape | Correction                                                                              | Vérification                                                                    |
| ----- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1     | Propriété liée à l’identifiant Supabase, sans transfert par e-mail                      | Test avec identifiants distincts et adresse réutilisée                          |
| 1     | Envoi borné après réponse et Worker de reprise planifié                                 | Fournisseur simulé, concurrence, idempotence, erreurs et reprise                |
| 2     | Essai borné, grâce réservée aux abonnements actifs, date requise en administration      | Dates limites en test ; nouveau profil avec échéance                            |
| 2     | Médias publics uniquement s’ils figurent dans la projection publique d’une carte active | Brouillon, autre compte, dépublication, section masquée, suspension, expiration |
| 2     | Imports interdits sur profil inactif                                                    | Refus 403 après suspension                                                      |
| 3     | Révision du navigateur obligatoire à la sauvegarde                                      | Ancienne révision refusée sans perte de la nouvelle donnée                      |
| 3     | Langue et offre conservées, assistance historique corrigée                              | Liens validés et rendu FR/AR ; messages traduits                                |
| 3     | Accès légal discret et dialogue accessible au clavier                                   | Rendu serveur ; gestion du focus et d’Échap implémentée                         |
| 4     | Vrais statuts 404 pour cartes absentes/inactives                                        | Worker compilé isolé                                                            |
| 4     | Index demandes/commandes, métadonnées Drizzle cohérentes                                | Génération sans différence résiduelle ; migrations locales                      |
| 4     | CI sur PR/main, audit hebdomadaire, logs Worker                                         | Workflows fournis ; aucun réglage GitHub modifié                                |
| 4     | Correctifs des dépendances Next/React/RSC/Vite et transitives                           | Compilation et tests rejoués ; audit documenté ci-dessous                       |

## Procédure avant publication

Ce changement inclut les correctifs de la PR #2 et les complète. Ne pas intégrer deux fois
ces corrections dans des branches divergentes. Aucune donnée de production n’a été migrée
et aucun message réel n’a été envoyé pendant cette préparation.

1. Sauvegarder la base D1 et les fichiers R2 ; conserver le commit actuellement déployé.
   Tester la restauration dans des ressources isolées. La sauvegarde doit inclure la
   correspondance `profiles`, `media_assets`, `profile_media` et les objets R2.
2. Contrôler les profils historiques sans date :

   ```sql
   SELECT id,email,state,expires FROM profiles
   WHERE expires IS NULL AND state IN ('active','trial');
   ```

   Renseigner après vérification les vraies échéances des abonnements payés actifs.
   Un profil actif sans échéance n’est désormais pas public. Ne pas lui attribuer une
   nouvelle année gratuite automatiquement.

3. Appliquer une fois la migration additive `0005_audit_hardening.sql`, après les migrations
   existantes. Elle ajoute la langue des demandes, les index et un délai de transition
   fixe de 14 jours aux anciens essais sans date. Elle ne supprime aucune donnée.
4. Publier le code API et l’interface ensemble. Les anciennes fenêtres ne fournissent pas
   de révision : elles doivent être rechargées avant une nouvelle sauvegarde. Les anciens
   binaires restent compatibles avec les colonnes/index ajoutés en cas de retour arrière,
   mais leurs anciennes règles de sécurité seraient réintroduites.
5. Vérifier les bindings Pages `DB` et `BUCKET`, les variables Supabase et le compte admin.
   Les fichiers privés ne doivent pas être exposés par une autre URL publique du bucket.
6. Pour l’envoi des notifications, suivre `HIGH-PRIORITY-FIXES.md` : même base D1 pour le
   Worker planifié et Pages, secrets/configuration sur les deux services. Aucun secret
   n’est ajouté au dépôt. La configuration du Worker doit être complétée avant déploiement.
7. Dans GitHub, protéger main et rendre le job `verify` obligatoire. Le dépôt n’expose pas
   d’opération d’administration permettant d’activer ce réglage dans cette session.
8. Effectuer une recette avec comptes et destinataires de test autorisés, puis vérifier
   réception effective et erreurs. L’état `accepted` signifie accepté par le fournisseur,
   pas nécessairement livré dans la boîte de réception.

## Dépendances

Les mises à jour sont ciblées : Next 16.3.8, React/React DOM/RSC 19.2.8, Vite 8.0.16,
sharp 0.35.5 et versions corrigées des dépendances transitives. Les exceptions de version
sont explicites dans `pnpm-workspace.yaml`, avec un lockfile figé. Le délai minimal de
publication des dépendances reste actif. Vinext n’a pas été migré vers une autre version
majeure de son parcours de publication dans cette correction.

L’avis `GHSA-vfj7-8cjw-p6xm` sur `braces@3.0.3` reste signalé : aucun correctif publié
n’est disponible dans le résultat d’audit. Il se trouve dans les outils de lint/build
(globs), pas dans un traitement de motifs fourni par les clients de SoraLink identifié
par cette revue. Ne pas exposer de serveur de développement ni accepter de motifs glob
arbitraires provenant de visiteurs. L’audit hebdomadaire continue à signaler cet avis ;
il n’est pas masqué par une liste d’exceptions.

## Points qui ne sont pas présentés comme terminés

- La matrice commerciale complète Réseaux sociaux / vCard / Vitrine et les cartes
  spéciales restent une évolution produit distincte. Digital, Pack et Clé en main
  conservent le même service numérique ; Pro reste contrôlé côté serveur. Aucun droit
  commercial ou nouveau prix n’est inventé par ce correctif.
- Les textes légaux restent ceux d’un pilote : identité du vendeur/responsable et
  conditions définitives nécessitent des informations réelles, absentes du dépôt.
- Les historiques au-delà des limites actuelles et la pagination de l’administration
  restent à traiter si le volume le nécessite. Les index ont été ajoutés dès maintenant.
- Le nettoyage des imports abandonnés dépend toujours d’une prochaine action du compte ;
  aucun effacement automatique de comptes à 90 jours n’est promis.
- Le vrai SMTP, les modèles Supabase, MFA, les réglages du bucket et la restauration de
  production ne sont pas validés par les simulations locales.
- Chromium n’a pas pu être installé : téléchargement invalide dans cet environnement.
  La validation visuelle et les actions natives de partage/vCard/PWA sur Android/iPhone
  restent à réaliser ; les tests HTTP et de rendu ne les remplacent pas.

## Rejouer les vérifications

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm verify:public
pnpm verify:journey
pnpm audit --json
```

`verify:journey` utilise des ressources D1/R2 jetables et un fournisseur Supabase simulé.
Les tests de notifications utilisent un fournisseur simulé. Aucun compte, fichier,
contact, rendez-vous ou message réel ne doit être créé par ces scripts.
