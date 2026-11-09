# CLAUDE.md — Natehure Quizz

Spécialités de ce jeu. Les règles communes (indépendance, `COMMUN/` facultatif, versions, commits…) sont
dans le `CLAUDE.md` de la racine ; la documentation pour un humain est dans `README.md`.

## Carte d'identité

- Nature, agriculture et végétaux : botanique, flore libre, arbres, champignons, cultures et récoltes.
- id `natehure`. Version **0.1.0** (dans `README.md` et `../COMMUN/jeux.js`) : **aucun jeu jouable**,
  seulement le menu (3 chapitres, 18 cartes « Bientôt ») et le bouton du compte. **Fermé** (`bloque: true`).
- Thème « Herbier » : vert sous-bois, accents vert feuille (actions, juste), terre de Sienne (saisons,
  récoltes), soleil (records), rouge amanite (ratés, espèces toxiques), eau (sève) ; fond de papier
  millimétré, immobile.
- **Même structure qu'Anotehomy** (copiée, pas partagée) : identifiants en anglais, commentaires en
  français, scripts `defer`, espace de noms unique `window.NQ` (`util`, `data`, `game`, `account`).

## Où est quoi

| Fichier | Rôle |
|---|---|
| `js/data/games.js` | **le catalogue du menu** : `CHAPTERS` (3) et `GAMES` (18, tous `status: 'soon'`) ; les nombres de `meta` (« Objectif : 60 arbres ») sont des **objectifs**, pas des données existantes |
| `js/game/home.js` | le menu : `ICONS`, `TINTS`, les **planches dessinées en SVG** (aucune image) et la **roue des saisons** (saison du jour marquée) |
| `js/account/account.js` | bouton et menu du compte (sur `../COMMUN/comptes.js`) ; pas encore de statistiques |
| `js/core/` | `namespace.js` (`window.NQ`), `utils.js` |
| `css/` | `base.css` (thème), `home.css`, `account.css`, `responsive.css`, `polices/` |

## Démarrer le premier jeu

Rien n'est encore décidé : **demande à Théo** quel jeu ouvrir en premier et sous quelle forme. Pistes, en
reprenant ce qui marche ailleurs (en **copiant** le code dans ce dossier, jamais en le chargeant depuis
un autre jeu) :

- **Questions sur des fiches** (familles botaniques, saisons des fruits et légumes, comestible ou
  toxique…) : le moteur de vocabulaire d'Anotehomy (`ANOTEHOMY_QUIZZ/js/game/lexique-*.js` : filtres
  croisés, modes Devinette et QCM, suggestions, résultats) est le meilleur modèle.
- **Reconnaître sur une image** (feuilles, écorces, champignons, organes de la plante) : le principe
  Ciblage / Nommage de GéoNohyne et d'Anotehomy, avec des images sous licence libre (Wikimedia Commons),
  créditées dans un `CREDITS.md`.

Dans tous les cas : un **catalogue d'espèces** en `js/data/*.js` (une ligne par espèce, nom français, nom
scientifique, autres noms et anciens noms acceptés ou signalés, comme la TA2 d'Anotehomy), un fichier
`js/account/profile.js` pour les statistiques (modèle : celui d'Anotehomy, espace `natehure`, invité dans
`natehure.profil`), le champ `totaux` dans `../COMMUN/jeux.js`, et le passage en **1.0.0** au premier mode
complet.

## Pièges

- Pas encore d'écran de configuration, de partie ni de résultats : tout est à construire (index.html,
  css, js). Garde la même construction que les autres jeux pour que Théo s'y retrouve.
- Les planches du menu restent **immobiles** : seules les apparitions sont animées.
- L'id de chaque carte de `GAMES` est déjà repris dans `modes` de `../COMMUN/jeux.js` (défis de la
  semaine) : ne le change pas sans changer les deux, et plus du tout une fois le jeu jouable.

## Plans

Les 18 cartes du menu, par chapitre :

- **Biologie & Anatomie végétale** : l'anatomie de la plante, la cellule végétale, la photosynthèse, la
  sève et les vaisseaux, les familles botaniques, la fleur et la pollinisation.
- **Flore, Arbres & Champignons** : les arbres et leurs feuilles, les écorces et les silhouettes, les
  fleurs sauvages, les champignons, comestible ou toxique ?, l'herbier.
- **Agriculture & Récoltes** : fruits et légumes de saison, les grandes cultures, le sol vivant, le
  potager, les techniques agronomiques, les terroirs et les appellations.
