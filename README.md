# SoraLink — première version modulaire

Site et application FR/Darija pour cartes NFC/QR. Hébergement prévu : Cloudflare Pages, Auth et données : Supabase. Le dépôt contient uniquement une clé publishable publique ; aucune clé secrète.

## Développement

Node 22 ou ultérieur : `npm ci`, `npm test`, puis `npm run build`.
La sortie est `dist/`. Les Pages Functions restent dans `functions/`.

## Livré dans cette branche

- Site commercial responsive, FR/Darija, devis WhatsApp et cinq forfaits.
- Démonstration, profils /c/<UUID>, QR généré localement, vCard échappée et métadonnées serveur.
- Inscription, confirmation e-mail, connexion, récupération, espace client et aperçu privé.
- Modules identité, réseaux, WhatsApp, coordonnées, vCard, galerie par URLs, PDF par URL, horaires, lien RDV, menu, avis Google sans filtrage, programme et fiche produit.
- Administration des droits/forfaits/modes/publication avec MFA TOTP.
- Migration additive et tests PostgreSQL : brouillons privés, isolation de deux clients, contrôle de formule, restrictions admin.

## Ce qui reste à livrer avant exploitation commerciale

Upload et validation des fichiers dans Storage, commandes et paiements manuels, formulaire de devis interne anti-abus, domaines clients, synchronisation calendrier, albums invités, équipe et multi-cartes. Les PDF sont pour le moment ouverts par lien HTTPS ; le lecteur intégré viendra avec le contrôle Storage. Le lien permanent fonctionne ; les alias de toutes les anciennes cartes restent à migrer avant bascule. Le pilote limite chaque client à une carte.

## État de mise en service

La migration est testée sur PostgreSQL embarqué avec schéma Auth simulé. Les tentatives d’application sur le projet distant n’ont pas abouti (erreur de session de connexion) ; la base d’origine est conservée. Les parcours Auth réels et l’interface mobile doivent être vérifiés sur la prévisualisation avant lancement.

1. Appliquer `supabase/migrations/20261011170514_modular_foundation.sql` sur le projet `soralink`. Il crée des tables `sl_*` et conserve `public.cards`. Le schéma `sl_private` doit rester hors des schémas exposés au Data API.
2. Dans Supabase Auth : Site URL `https://soralink.link` ; URLs de retour exactes pour `/dashboard.html` et `/reset.html`, plus la prévisualisation de confiance. Configurer et tester l’envoi des e-mails.
3. Créer le compte de l’exploitant et vérifier son UUID. L’attribution admin se fait par un opérateur autorisé dans SQL : `insert into sl_private.admins(user_id) values ('UUID_VÉRIFIÉ');`. Ne jamais attribuer admin sur la base d’un user_metadata ou d’une simple adresse déclarée. L’écran `/admin.html` permet d’enrôler TOTP ; les privilèges exigent aal2.
4. Cloudflare Pages : commande `npm run build`, sortie `dist`, version Node 22+, racine du dépôt. Vérifier la prévisualisation de la branche avant fusion. La branche main synchronisée avec soralink.link est conservée à ce stade.
5. Recette sur iPhone et Android, QR imprimé, import VCF, RTL, erreurs réseau et accès croisés. Compléter identité légale, politique de conservation et consentement avant ouverture.

## Sécurité

Les droits sont séparés du contenu public. Les clients ont des permissions SQL limitées et RLS. Les helpers SECURITY DEFINER sont placés dans sl_private, ont un search_path vide et vérifient identité/propriété. Les RPC publics sont SECURITY INVOKER et ont des grants explicites. Les lectures de blocs publics filtrent les modules autorisés : une baisse de formule retire leur rendu sans effacer leur contenu. Les images externes déjà publiées restent sous le contrôle de leur fournisseur ; masquer un bloc ne les supprime pas.

L’ancienne table cards ne doit être retirée de l’API qu’après migration et vérification des anciens liens ; cette branche ne modifie pas ses permissions.

Les dépendances sont épinglées et le lockfile est suivi. `npm test` couvre logique de forfait, URLs, injection HTML, vCard, serveur et droits PostgreSQL. Les tests Auth, DNS, livraison e-mail et appareils réels restent nécessaires.
