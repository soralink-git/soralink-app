# SoraLink — Champs vides et mise en page

Les champs d’identité vides ne sont plus remplacés par des textes de remplissage, dans l’aperçu comme sur la carte publique. Cela concerne le nom, l’entreprise ou le contact, la profession/activité et la présentation. Les chaînes composées uniquement d’espaces sont considérées comme vides pour l’affichage, sans réécrire les données enregistrées.

Sans logo ou portrait, aucun avatar ni initiales fictives n’est affiché. Sans couverture, aucun bandeau vide n’est réservé. Les espacements supérieurs et le chevauchement de l’avatar s’adaptent à la présence réelle des images. Une identité entièrement vide n’affiche pas de panneau vide.

Les coordonnées vides ne créent pas de boutons ou de blocs vides. Les sections publiques sans contenu sont masquées. Une description d’article vide ne réserve plus de paragraphe dans la fiche détaillée.

Validation : compilation, TypeScript, formatage et 283 tests réussis ; contrôle du build public et parcours complets sur D1/R2 isolés réussis. Les tests de rendu couvrent professionnel/établissement, FR/AR, aperçu/public, champs blancs, brouillon vide et les quatre combinaisons logo/couverture. Les contrôles ne constituent pas un essai tactile sur appareil physique.
