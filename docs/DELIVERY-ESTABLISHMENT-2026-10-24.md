# SoraLink — Identité d’établissement

Dans « Ma carte → Identité » et dans l’assistant de création, le choix « La carte représente » permet de sélectionner « Un professionnel » ou « Un établissement / une entreprise ».

## Comportement

- Professionnel : nom complet obligatoire, nom de l’entreprise facultatif, présentation existante conservée.
- Établissement : nom commercial obligatoire (120 caractères maximum), activité/spécialité et nom du contact facultatifs. Le formulaire indique que le nom du contact est public lorsqu’il est renseigné ; pour ne pas l’afficher, laisser ce champ vide.
- La carte publique et l’aperçu mettent le nom commercial dans le titre principal. Les initiales sans logo utilisent ce même nom.
- Le contact vCard téléchargé utilise le nom commercial comme nom affiché et conserve l’organisation et les coordonnées.
- L’échange de carte reste possible sans nom de propriétaire dès lors que les conditions de partage existantes sont remplies.
- L’administration affiche le nom sélectionné et peut rechercher le nom commercial.

L’enregistrement automatique, le bouton d’enregistrement et les étapes de création vérifient le nom correspondant au type choisi. Renseigner un nom personnel ne permet pas de publier un établissement dont le nom commercial est vide. La validation côté serveur applique la même règle.

## Compatibilité et droits

Les profils sans ce nouveau réglage conservent le mode professionnel. Le choix est stocké dans les données JSON existantes ; aucune migration de base n’est nécessaire. Le compte de connexion, son propriétaire, les forfaits et les paiements restent indépendants de ce choix. Un utilisateur dont la section Identité est verrouillée ne peut pas changer le type par un appel direct à l’API.

## Vérification

- Compilation, TypeScript, formatage et 277 tests réussis.
- Tests FR/AR du titre public et des champs requis, maintien du titre des cartes existantes, vCard et partage de contact, droits d’édition et enregistrement automatique.
- Parcours complet sur D1/R2 isolés : enregistrement sans nom personnel, lecture publique FR/AR, recherche admin par établissement, rejet des noms requis manquants sans écraser la version enregistrée.
- Contrôle du build public réussi. Aucun compte client réel ni destinataire de notification utilisé pour ces tests.

Les tests de rendu et les parcours serveur ne remplacent pas une validation tactile du dashboard sur un téléphone physique.
