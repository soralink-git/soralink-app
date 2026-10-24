# Protection de main — configuration préparée

## Limite d’accès constatée

Le 24 octobre 2026, la lecture des rulesets retourne une liste vide. La lecture de
`branches/main/protection` retourne HTTP 403, « Resource not accessible by integration ».
Cela ne démontre pas l’absence d’une protection classique : la connexion ne peut ni
la lire ni la modifier. La protection n’est donc pas annoncée comme activée.

## Réglage proposé

Dans GitHub → dépôt SoraLink → Settings → Branches → règle pour `main` :

- exiger une pull request ;
- exiger le contrôle `verify` et une branche à jour avant fusion ;
- appliquer la règle aussi aux administrateurs ;
- interdire force-push et suppression de la branche ;
- conserver un historique linéaire ;
- ne pas imposer l’approbation d’un second compte lorsque le dépôt est maintenu seul.

Vérifier d’abord les règles actuelles pour conserver toute protection plus forte.
Le fichier `github-main-protection.json` contient le corps de requête de référence.
Avec une connexion GitHub disposant du droit Administration du dépôt, la commande est :

```sh
gh api --method PUT repos/soralink-git/soralink-app/branches/main/protection \
  --input docs/github-main-protection.json
```

Cette commande n’a pas été exécutée. Ne pas partager de jeton ou mot de passe dans le chat.
Après application, vérifier que `verify` est bien le contexte requis et qu’une PR en échec
ne peut pas être fusionnée. La CI verte seule ne constitue pas une règle de protection.

## Dépendances

- `.github/dependabot.yml` propose les mises à jour hebdomadaires npm et GitHub Actions.
- Les mises à jour courantes attendent sept jours ; les versions majeures npm ne sont
  pas proposées automatiquement. React/Next et Vite/Cloudflare sont regroupés.
- Aucune fusion automatique n’est activée.
- La CI bloque les avis modérés ou plus graves ; l’audit planifié devient quotidien.
- La configuration des mises à jour de versions n’atteste pas de l’activation des
  options Dependabot Alerts/Security Updates dans les paramètres GitHub, non accessibles ici.

[Documentation GitHub](https://docs.github.com/en/rest/branches/branch-protection#update-branch-protection).
