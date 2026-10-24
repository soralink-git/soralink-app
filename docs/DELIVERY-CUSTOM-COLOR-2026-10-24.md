# SoraLink — Couleur principale personnalisée

Sous « Votre couleur principale », l’option « Couleur personnalisée » complète les palettes existantes. Elle propose un sélecteur natif et un champ pour un code de six caractères hexadécimaux, avec ou sans #. Les valeurs valides sont normalisées au format #rrggbb.

La couleur principale et celle des boutons sont mises à jour ensemble dans l’aperçu et suivent l’enregistrement automatique existant. Une saisie incomplète ne modifie pas les données ; un message localisé s’affiche en cas de code invalide après avoir quitté le champ. Choisir à nouveau une palette remet sa couleur et ferme l’option personnalisée.

Le contrôle côté serveur accepte une couleur principale personnalisée valide tout en maintenant les restrictions des réglages avancés et les droits de la section d’édition. Les contenus, les couleurs de fond et les réglages réservés à l’administration ne sont pas déverrouillés par cette option.

Validation : compilation, TypeScript, formatage et 285 tests réussis. Tests FR/AR des contrôles, normalisation des codes, refus des valeurs invalides et maintien des protections. Parcours D1/R2 isolé : enregistrement, projection et rendu publics de la nouvelle couleur, puis refus d’une modification avancée non autorisée. Contrôle du build public et parcours complets réussis. Aucun compte client ni message réel utilisé.
