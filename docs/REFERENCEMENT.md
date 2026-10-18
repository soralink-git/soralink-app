# Référencement SoraLink

## Éléments publiés par l’application

- Titre et description de la plateforme, adaptés au français et à l’arabe.
- URL canonique française : https://soralink.link/ (les paramètres de suivi et d’offre sont retirés).
- URL canonique arabe : https://soralink.link/?lang=ar.
- Liens réciproques `hreflang` FR/AR et version par défaut française.
- Identité structurée WebSite / Organization : SoraLink et son domaine officiel.
- https://soralink.link/robots.txt annonce le sitemap et laisse explorer les pages publiques, y compris les photos publiques servies par `/api/upload?key=...`. Les autres routes API ne sont pas proposées à l’exploration. Les contrôles de confidentialité des fichiers restent appliqués par le serveur.
- https://soralink.link/sitemap.xml contient les deux versions de l’accueil uniquement.
- Les pages de compte, connexion, administration et démo portent `noindex, nofollow`.
- Les cartes publiques conservent leurs propres métadonnées et URL canoniques existantes. Le sitemap n’énumère pas les clients.

## Validation Google Search Console à terminer par le propriétaire

La publication du code ne valide pas automatiquement une propriété Google.

1. Ouvrir https://search.google.com/search-console avec le compte Google du propriétaire.
2. Ajouter une propriété de type **Domaine** : `soralink.link`.
3. Copier la valeur TXT fournie par Google, sous la forme `google-site-verification=...`.
4. Ajouter cet enregistrement TXT à la racine du domaine dans Cloudflare DNS, puis cliquer sur **Valider** dans Search Console. Le propriétaire peut transmettre cette valeur pour que l’ajout DNS soit effectué avec le connecteur Cloudflare.
5. Dans **Sitemaps**, envoyer `https://soralink.link/sitemap.xml`.
6. Dans **Inspection de l’URL**, tester `https://soralink.link/`, puis demander l’indexation. Refaire pour `https://soralink.link/?lang=ar`.

Le statut Google doit être lu dans Search Console. La présence dans un autre moteur, la publication d’un sitemap ou une demande d’indexation ne garantissent ni l’indexation Google ni une première position sur « SoraLink ».

Documentation :

- https://support.google.com/webmasters/answer/9008080?hl=fr
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- https://developers.google.com/search/docs/specialty/international/localized-versions
