# SoraLink — première version modulaire

Site et application FR/Darija pour cartes NFC/QR. Hébergement prévu : Cloudflare Pages, Auth et données : Supabase. Le dépôt contient uniquement une clé publishable publique ; aucune clé secrète.

## Développement

Node 22 ou ultérieur : `npm ci`, `npm test`, puis `npm run build`.
La sortie est `dist/`. Les Pages Functions restent dans `functions/`.

## Livré dans cette branche

- Site commercial responsive, FR/Darija, devis WhatsApp et cinq forfaits.
- Démonstration, profils /c/<UUID>, QR généré localement, vCard échappée et métadonnées serveur.
- Inscription, confirmation e-mail, connexion, récupération, espace client et aperçu privé.
- Modules identité, réseaux, WhatsApp, coordonnées, vCard, galerie par envoi de photos ou URLs, PDF par envoi de fichier ou URL, horaires, lien RDV, menu, avis Google sans filtrage, programme et fiche produit.
- Administration des droits/forfaits/modes/publication avec MFA TOTP.
- Migration additive et tests PostgreSQL : brouillons privés, isolation de deux clients, contrôle de formule, restrictions admin.

## Ce qui reste à livrer avant exploitation commerciale

Analyse antivirus des documents, nettoyage des anciens fichiers remplacés, commandes et paiements manuels, formulaire de devis interne anti-abus, domaines clients, synchronisation calendrier, albums invités, équipe et multi-cartes. Les images JPG, PNG et WebP sont envoyées dans un bucket privé (4 Mo par fichier), les PDF peuvent atteindre 10 Mo. Les fichiers publiés sont servis par une route contrôlée, sans cache public, qui vérifie les droits Storage courants. Les brouillons sont prévisualisés avec des URLs locales après téléchargement authentifié. Les PDF sont proposés au téléchargement ; le lecteur intégré et l’analyse antivirus restent à ajouter. Une carte est limitée à 40 objets de stockage, anciens fichiers remplacés compris. Le lien permanent fonctionne ; l’ancien lien de démonstration card.html?u=demo est conservé via un alias. Toute nouvelle carte doit conserver ses alias avant changement de nom. Le pilote limite chaque client à une carte.

## État de mise en service

Les deux migrations ont été appliquées au projet Supabase soralink. Les tests RLS et MFA ont passé sur PostgreSQL embarqué puis sur la base distante, dans une transaction annulée après vérification. La base d’origine est conservée. Aucun compte utilisateur n’existe encore. Les retours Auth, e-mails et l’interface mobile doivent être vérifiés avant lancement.

1. Migrations déjà appliquées sur le projet `soralink` : modular_foundation et permanent_aliases. Elles créent les tables `sl_*`, copient le profil public de démonstration et conservent `public.cards`. Ne pas les réexécuter sur ce projet. Le schéma `sl_private` doit rester hors des schémas exposés au Data API.
2. Dans Supabase Auth : Site URL `https://soralink.link` ; URLs de retour exactes pour `/dashboard.html` et `/reset.html`, plus la prévisualisation de confiance. Configurer et tester l’envoi des e-mails.
3. Créer le compte de l’exploitant et vérifier son UUID. L’attribution admin se fait par un opérateur autorisé dans SQL : `insert into sl_private.admins(user_id) values ('UUID_VÉRIFIÉ');`. Ne jamais attribuer admin sur la base d’un user_metadata ou d’une simple adresse déclarée. L’écran `/admin.html` permet d’enrôler TOTP ; les privilèges exigent aal2.
4. Cloudflare Pages : commande `npm run build`, sortie `dist`, version Node 22+, racine du dépôt. Vérifier la prévisualisation de la branche avant fusion. La branche main synchronisée avec soralink.link est conservée à ce stade.
5. Recette sur iPhone et Android, QR imprimé, import VCF, RTL, erreurs réseau et accès croisés. Compléter identité légale, politique de conservation et consentement avant ouverture.

## Sécurité

Les droits sont séparés du contenu public. Les clients ont des permissions SQL limitées et RLS. Les helpers SECURITY DEFINER sont placés dans sl_private, ont un search_path vide et vérifient identité/propriété. Les RPC publics sont SECURITY INVOKER et ont des grants explicites. Les lectures de blocs publics filtrent les modules autorisés : une baisse de formule retire leur rendu sans effacer leur contenu. Les images externes déjà publiées restent sous le contrôle de leur fournisseur ; masquer un bloc ne les supprime pas.

L’ancienne table cards ne doit être retirée de l’API qu’après migration et vérification des anciens liens ; cette branche ne modifie pas ses permissions.

Les dépendances sont épinglées et le lockfile est suivi. `npm test` couvre logique de forfait, URLs, injection HTML, vCard, serveur et droits PostgreSQL. Les tests Auth, DNS, livraison e-mail et appareils réels restent nécessaires.

Les icônes de réseaux proviennent de Font Awesome Free Brands 7.3.1 ; la licence est fournie dans public/brand-icons-license.txt. Elles sont identifiées par le domaine du lien, jamais par le texte libre fourni par un client.
