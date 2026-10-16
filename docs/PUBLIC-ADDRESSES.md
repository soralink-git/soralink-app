# Adresses publiques personnalisées

Le client choisit `soralink.link/son-nom` dans **Mon espace → Partager** après avoir enregistré sa carte. Le nom utilise 3 à 40 lettres latines sans accents, chiffres ou tirets, sans tiret initial/final. La casse et les espaces externes sont normalisés. Les chemins réservés de l’application ne peuvent pas être choisis.

La vérification de disponibilité exige une session vérifiée. Elle indique uniquement si le nom est disponible, sans exposer le propriétaire ni les cartes en brouillon. Le bouton de réservation réalise une seconde vérification atomique en base ; deux clients ne peuvent pas obtenir le même nom.

La table D1 `profile_addresses` conserve les anciens noms. Un index unique partiel n’autorise qu’une adresse courante par carte. Un ancien nom reste réservé à son propriétaire et peut être sélectionné à nouveau. Un conflit n’altère jamais l’adresse courante du demandeur. La réservation n’écrit pas le contenu ni la révision de la carte.

La route `/[name]` résout la même carte que `/c/[id]`. Les liens historiques restent accessibles, avec le titre et l’adresse canonique courante. Les cartes non publiées, suspendues ou expirées restent invisibles sur toutes leurs adresses. Les demandes et les médias continuent à utiliser l’identifiant interne inchangé.

Le partage public, le lien dans le tableau de bord et les nouveaux QR codes utilisent l’adresse courante. Les QR déjà imprimés continuent à fonctionner. Choisir un nom ne publie pas automatiquement une carte.

## Déploiement

Appliquer `drizzle/0006_public_addresses.sql` à D1 (prévisualisation puis production) avant de publier la nouvelle version. La migration est additive et réexécutable ; aucun profil existant n’est modifié et aucun nom n’est attribué automatiquement. Le journal Drizzle doit être conservé avec les migrations déjà appliquées.

Validation : tests de format/réservation des noms et de langue ; `pnpm build`, `pnpm verify:public`, `pnpm verify:journey`. Le parcours isolé teste aussi la concurrence entre deux comptes, les collisions, le changement et la reprise d’un ancien nom, les brouillons et les cartes suspendues, la conservation des anciens liens et les métadonnées canoniques. Aucun compte de production n’est utilisé.
