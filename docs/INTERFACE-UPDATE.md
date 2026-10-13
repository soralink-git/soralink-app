# Interface de la carte et de l’espace client

La carte publique et son aperçu partagent une même présentation : couverture au ratio 4:1, portrait ou logo centré, identité lisible, actions principales avant les contenus et blocs distincts pour chaque section. Le style par défaut reste noir et or. Les couleurs, tailles, thèmes et formes choisis par les clients sont conservés.

Les dix rubriques de l’espace client sont regroupées en personnalisation, gestion des clients et diffusion/offre. Le titre correspond à la rubrique active. L’aperçu reste présent dans tous les onglets, avec une disposition adaptée aux petits écrans. Les liens marketing ne s’affichent plus dans le header de l’éditeur.

Le bouton WhatsApp reste une icône unique. Le nom SoraLink reste de gauche à droite en arabe. Les formulaires conservent la validation, les permissions, le consentement et les limites de l’offre Pro existants. Aucun changement de schéma ou de données de production.

## Vérification

- Compilation TypeScript, formatage et build Pages : réussis.
- 62 tests automatisés : réussis, dont carte publique, français/arabe et aperçu dans les dix onglets.
- Vérification du build public et du parcours complet sur D1/R2 isolés : réussie.
- Pas de navigateur de test disponible dans cet environnement : le rendu visuel, l’appareil photo et le partage natif sur un vrai téléphone restent à vérifier.

## Alignement de l’aperçu et de la carte

L’aperçu utilise désormais la carte complète, sans le mode compact ni les anciennes règles de style spécifiques à l’aperçu. Le sélecteur de langue est aussi visible dans l’aperçu. Deux tests comparent exactement le HTML de la carte dans l’éditeur et sur la page publique, en français et en arabe. Le bloc d’identité est arrondi comme dans les références fournies. Les ajustements de mise en page se basent sur la largeur de la carte elle-même ; seule la largeur disponible peut différer entre l’espace client et la page publique.
