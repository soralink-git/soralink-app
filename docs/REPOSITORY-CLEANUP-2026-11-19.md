# Nettoyage du dépôt — 19 novembre 2026

## État vérifié

- 45 branches et 10 propositions ouvertes avant intervention.
- La démo utilise le composant partagé `app/public-card-view.tsx` : le bandeau et le lien d’accueil étaient déjà présents en production. Les libellés deviennent « Exemple — Démo interactive » et « Retour à l’accueil » (FR/AR), sur `/demo` et `/demo/soralink`.
- Les cartes publiques ordinaires ne reçoivent pas ce bandeau.

## Propositions remplacées

- #18 : disponibilité et documents PDF désormais gérés par `catalog-editor.tsx`, `catalog-public.tsx`, `catalogDocuments` et le schéma `soldout`. Les tests `catalog-menu.test.cjs` couvrent produits masqués, commandes épuisées et documents. L’ancien schéma `sold_out`/`pdfDocuments` ne doit pas être réintroduit.
- #94 : remplacée par #95, fusionnée le 7 novembre, puis par les corrections de design ultérieures. #93 utilisait le même commit et était déjà fermée.
- Les huit propositions Dependabot (#69–75 et #98) restent ouvertes pour validation séparée. Leur fusion ne fait pas partie du nettoyage des anciennes branches.

## Branches fusionnées éligibles au nettoyage

Chaque commit ci-dessous est conservé dans une proposition fusionnée. GitHub permet de restaurer la branche depuis la proposition ; une branche du même nom peut aussi être recréée sur le SHA indiqué. Ce relevé est un inventaire avant suppression, pas une preuve que chaque suppression a abouti.

| Branche                                | Commit                                     | Proposition fusionnée                                         |
| -------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| `chore/remove-obsolete-code`           | `202cfc299dc9645f6b7e9cf18c2de747b6240dbb` | [#106](https://github.com/soralink-git/soralink-app/pull/106) |
| `design/hallmark-polish`               | `acc5d2bbd68bde2160537c850299b496df8ad9a1` | [#78](https://github.com/soralink-git/soralink-app/pull/78)   |
| `design/premium-test-catalog`          | `24d57e38d884d8a0a0f946467ff4d2aed344cf3a` | [#60](https://github.com/soralink-git/soralink-app/pull/60)   |
| `feat/admin-workspace-ux`              | `2124986ffe1767e72f9235377d86e12c9f59f201` | [#53](https://github.com/soralink-git/soralink-app/pull/53)   |
| `feat/catalog-management-ux`           | `4903c86ad9031cf39ff1315b44c8674dc59f1ba7` | [#54](https://github.com/soralink-git/soralink-app/pull/54)   |
| `feat/client-commerce-workflow`        | `5cd6a9314390baaf831a841a3693fa16bc35b220` | [#61](https://github.com/soralink-git/soralink-app/pull/61)   |
| `feat/complete-interface-ux`           | `45930b0728c56d507ee556a47569c8ced69485c1` | [#55](https://github.com/soralink-git/soralink-app/pull/55)   |
| `feat/custom-primary-color`            | `51999838f4f3068486aafbc6cc5c0be630b21998` | [#65](https://github.com/soralink-git/soralink-app/pull/65)   |
| `feat/establishment-identity`          | `acd103a2bbc40f144f39d9b755a962fb6b6fc8f9` | [#63](https://github.com/soralink-git/soralink-app/pull/63)   |
| `feat/group-soralink-identity`         | `89077eed3b4cd4da9fe414cc975cbd52bcb12d70` | [#109](https://github.com/soralink-git/soralink-app/pull/109) |
| `feat/mobile-workspace-ux`             | `e460f30700901ebf40a4f2fa6e93276fcb4fbedb` | [#52](https://github.com/soralink-git/soralink-app/pull/52)   |
| `feat/service-button-backgrounds`      | `082ce47fe7af28ce3d95530c0dab7cf0b1004568` | [#66](https://github.com/soralink-git/soralink-app/pull/66)   |
| `feat/seven-ux-principles`             | `a364adfb8348d6d9f85604e3a0d5ca1206a77374` | [#107](https://github.com/soralink-git/soralink-app/pull/107) |
| `feat/soralink-test-profile`           | `1f5b84e511804b25563a5ecb3ec6417c4c053aa6` | [#58](https://github.com/soralink-git/soralink-app/pull/58)   |
| `feat/soraprint-product-references`    | `c0364d336c6a8e60227b04a590a9dc85558a4af7` | [#111](https://github.com/soralink-git/soralink-app/pull/111) |
| `feat/stageshow-ui-enhancements`       | `09382bcb9534cf83875ea26753721eac1e0b2464` | [#80](https://github.com/soralink-git/soralink-app/pull/80)   |
| `feat/test-card-media`                 | `ac3eada94c85c1c3a14626402bf0fe288bfdb67f` | [#59](https://github.com/soralink-git/soralink-app/pull/59)   |
| `fix/audit-depot-site-2026-11-17`      | `af479d09358b894ca142eb51e8358c7efde20a50` | [#108](https://github.com/soralink-git/soralink-app/pull/108) |
| `fix/card-save-validation-2026-11-19`  | `11a0c976c31bd7f0f6093db59b0820bc346feb06` | [#116](https://github.com/soralink-git/soralink-app/pull/116) |
| `fix/catalog-finalization`             | `61292adb6f637a1f60631749497c2a7e83b2fc57` | [#77](https://github.com/soralink-git/soralink-app/pull/77)   |
| `fix/chosen-logo-reference`            | `d4826ff0aa1ade141596ac9b7d9c9095f7a269f1` | [#110](https://github.com/soralink-git/soralink-app/pull/110) |
| `fix/compact-card-actions`             | `1332126be71fb9d660ed39cfe3927e752281a7ff` | [#57](https://github.com/soralink-git/soralink-app/pull/57)   |
| `fix/connections-audit-2026-11-19`     | `de7ef2c3d98b4681c964e895ea3fe09e3739af5e` | [#114](https://github.com/soralink-git/soralink-app/pull/114) |
| `fix/d1-defensive-fallbacks`           | `bed8639c38bd092daf17be34694a56db59ac0997` | [#79](https://github.com/soralink-git/soralink-app/pull/79)   |
| `fix/design-mobile-audit-2026-11-19`   | `616a928dd9ea96f964917e12196378aec7152db2` | [#115](https://github.com/soralink-git/soralink-app/pull/115) |
| `fix/hide-empty-card-fields`           | `0a2481b1b6c17b2aa01cc8123f8aff3ba1d3a45e` | [#64](https://github.com/soralink-git/soralink-app/pull/64)   |
| `fix/password-accessible-name`         | `5448e9d20a4f0d6e2d1d471d7312266e73b8f5db` | [#56](https://github.com/soralink-git/soralink-app/pull/56)   |
| `fix/security-dependencies-october`    | `ef1c1ea535dad8308f89326a9afea42078d6e103` | [#67](https://github.com/soralink-git/soralink-app/pull/67)   |
| `fix/style-picker-layout-2026-11-19`   | `a3a8de14e090fd380c6b991633f3b150893bd3b0` | [#117](https://github.com/soralink-git/soralink-app/pull/117) |
| `refactor/maintenance-and-recovery`    | `ce284f38912525cacc99b4e1d703578a34b56cb3` | [#68](https://github.com/soralink-git/soralink-app/pull/68)   |
| `refactor/mobile-editor-design-tokens` | `c08639bc5aedbd69571d6e8823dbf7802747c656` | [#62](https://github.com/soralink-git/soralink-app/pull/62)   |
| `restore/pre-group-soralink`           | `ff920bb442e1144b109120681d8e034134eef6d9` | [#112](https://github.com/soralink-git/soralink-app/pull/112) |

## Autres branches

| Branche                                                         | Commit                                     | Conservation                                                |
| --------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| `dependabot/github_actions/actions/checkout-7`                  | `280db3ef4da4206e55a04ce901e8d2d21fe80f0b` | [#71](https://github.com/soralink-git/soralink-app/pull/71) |
| `dependabot/github_actions/actions/setup-node-7`                | `6dacdf2420c4a9dfa2dbfb1651eb059baa65cac6` | [#69](https://github.com/soralink-git/soralink-app/pull/69) |
| `dependabot/github_actions/pnpm/action-setup-6`                 | `77d20acc5a147b0e73f8c8afcf29d34e0e418c02` | [#70](https://github.com/soralink-git/soralink-app/pull/70) |
| `dependabot/npm_and_yarn/cloudflare/workers-types-4.20260702.1` | `c1a8c8f4294868ddc787804207935dbd1bf06902` | [#98](https://github.com/soralink-git/soralink-app/pull/98) |
| `dependabot/npm_and_yarn/cloudflare-vite-1c9a1975f8`            | `b2d7f531db3eae27168cfbd7472431a98212cb8b` | [#73](https://github.com/soralink-git/soralink-app/pull/73) |
| `dependabot/npm_and_yarn/drizzle-orm-0.45.4`                    | `61fc58d8ac5ef539aac22ee56d7de88757f604e7` | [#74](https://github.com/soralink-git/soralink-app/pull/74) |
| `dependabot/npm_and_yarn/pdfjs-dist-5.7.284`                    | `477e7c61fc3028642fdc17a209440663de3d465d` | [#76](https://github.com/soralink-git/soralink-app/pull/76) |
| `dependabot/npm_and_yarn/react-next-17b537985b`                 | `79b5aa0ca792b10738c519f56e75be1789a32b1b` | [#72](https://github.com/soralink-git/soralink-app/pull/72) |
| `dependabot/npm_and_yarn/zod-4.6.7`                             | `557a789a46e82fb5ff9fb940326e11d5571f8d5f` | [#75](https://github.com/soralink-git/soralink-app/pull/75) |
| `feature/catalogue-availability-17`                             | `56a8639c4c1efe5f25c2717a06b3669e0c8289e9` | [#18](https://github.com/soralink-git/soralink-app/pull/18) |
| `fix/light-theme`                                               | `ca93c4ac1c1d562bd82145e177063fe7d493af1a` | [#93](https://github.com/soralink-git/soralink-app/pull/93) |
| `fix/light-theme-v2`                                            | `ca93c4ac1c1d562bd82145e177063fe7d493af1a` | [#94](https://github.com/soralink-git/soralink-app/pull/94) |

Les branches non fusionnées restent disponibles tant que leur retrait n’a pas été confirmé comme récupérable. Aucune réécriture de l’historique de `main`, aucune suppression de données métier et aucune modification des secrets.
