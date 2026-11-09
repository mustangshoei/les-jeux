# CLAUDE.md — GéoNohyne Quizz

Spécialités de ce jeu. Les règles communes (indépendance, `COMMUN/` facultatif, versions, commits…) sont
dans le `CLAUDE.md` de la racine ; la documentation complète pour un humain est dans `README.md`.

## Carte d'identité

- Géographie : départements et préfectures, fleuves, pays, mers du monde (quiz, jeux, mode Apprendre).
- id `geonohyne` (ancien nom **GéoQuiz**, ancien id `geoquiz` : repris tout seul, ne pas casser cette
  reprise). Version dans `README.md` et dans `../COMMUN/jeux.js` (affichée en bas du menu).
- Thème « Atlas en relief » : sombre, bleu-vert ; corail = action, menthe = trouvé, sable = temps et records.
- **Identifiants et commentaires en français.** Espaces de noms globaux : `GeoNohyne` (noyau), `GeoCarte`
  (moteur et registre des cartes), `GeoInfos` (fiches des zones, `data/*/infos-*.js`), `GeoProfils`
  (statistiques, `js/profils.js`).
- **C'est le jeu modèle** : sa façon de faire (menu atlas, écran de choix, ciblage / nommage, mode record,
  modules qui s'enregistrent, cartes grisées) sert de référence aux autres jeux.

## Où est quoi

| Fichier | Rôle |
|---|---|
| `js/core.js` | **le noyau** (~100 Ko) : enregistrement des modules, écran de choix, quiz, mode Apprendre, carte SVG interactive, correction des saisies. **Lis d'abord son en-tête** : il décrit tous les contrats. |
| `js/carte.js` | moteur de cartes (GeoJSON → SVG), sans aucune donnée |
| `js/menu.js` | **le catalogue du menu** (`MENU` : chapitres et cartes, `ICONES`, `TEINTES`, `IMAGES`) ; chargé en dernier |
| `js/profils.js` / `js/compte.js` | statistiques (invité ou compte) / bouton et menu du compte, écran des statistiques |
| `js/ancien-nom.js` | reprise des clés `geoquiz.*` → `geonohyne.*`, chargé en premier (dans `<head>`) |
| `js/france/`, `js/monde/`, `js/apprendre/` | un fichier par module, rangés comme les chapitres du menu |
| `data/france/`, `data/monde/` | `carte-*.js` (tracés, souvent générés) et `infos-*.js` (fiches, modifiables à la main, une ligne par zone) |
| `outils/` | régénération des données (Python, Node, pages HTML) : voir le README |
| `css/style.css` | toute l'apparence (~120 Ko) : cherche par commentaire de section plutôt que de tout lire |

## Les quatre sortes de modules

Chaque fichier de module s'enregistre auprès du noyau ; la carte du menu de même type et de même id
s'active toute seule (sinon elle reste grisée avec les textes de `MENU`).

| Sorte | Enregistrement | Carte du menu | Ce que le noyau fournit | Modèle à copier |
|---|---|---|---|---|
| Quiz | `GeoNohyne.registerCategory` | `{ quiz: 'id' }` | ciblage + nommage, occasionnel + **record**, écran de choix, statistiques, révision | `js/france/quiz-departements.js` |
| Jeu à part | `GeoNohyne.registerJeu` | `{ jeu: 'id' }` | un écran (`ecran` : sa `<section>` dans `index.html`), la carte si besoin, `api.suggestions` ; **ni record ni statistiques** | `js/france/grand-chemin.js` (avec carte), `js/france/morpion.js` (`sansCarte`) |
| Apprendre | `GeoNohyne.registerApprentissage` | `{ apprendre: 'id' }` | carte cliquable, fiche (`fiche(zone)`), recherche, filtres | `js/apprendre/departements.js` |
| Page | `GeoNohyne.registerPage` | `{ page: 'id' }` | rien (aucune pour l'instant) | — |

Ajouter un module : le fichier, sa balise `<script>` dans la bonne section de `index.html` (avant
`js/menu.js`), sa carte dans `MENU`, sa ligne dans `modes` de `../COMMUN/jeux.js`, puis le README.

## Mécanismes à connaître (et à réutiliser)

- **Écran de choix** : construit par `core.js` à partir du `<template id="setup-modele">` ; une colonne par
  quiz, deux avec `colonneDroite` (départements | préfectures ; sur téléphone, une seule dépliée).
  Mini-carte cliquable des groupes (cocher une région, choisir le périmètre du record).
- **Mode record** : périmètre fixe (tout, ou un seul groupe), sans indice ni rattrapage ni suggestion ;
  meilleur = score, puis temps au dixième. Clé `categorie|façon de jouer|périmètre`. Les records sont la
  **seule** donnée publiée (`publiques`) : GéoNohyne est le seul jeu avec des classements.
- **Suggestions** : `filtrerNoms` de `core.js` (`MIN_SUGGESTION` = 3 caractères, début du nom, article ou
  mot générique sautables), donnée aux jeux à part par `api.suggestions`. Mêmes règles partout dans le jeu.
- **Tolérance aux fautes** : option `tolerance: true` d'une catégorie (préfectures), `distance()` et
  `fautesTolerees()` dans `core.js` ; `alias` pour les autres noms (« Cergy » pour Pontoise).
- **Petites zones** : `point: true` sur un élément de carte (micro-État, détroit) → point de taille fixe à
  l'écran, surface cliquable plus large. Les **points** d'une catégorie (`points`, ex. préfectures) suivent
  l'état de leur zone.
- **Critères générés** (Morpion, L'Entonnoir) : des **familles** de critères avec des seuils tirés au
  hasard ; une grille n'est proposée que si elle est **toujours remplissable** ; un critère n'est gardé que
  s'il sépare assez de départements. **Cas limites** (à moins de 2 % d'un seuil chiffré, ou trop près de
  Paris) : jamais comptés contre le joueur, jamais utilisés pour départager.
- **Le Grand Chemin** : graphe des voisinages (France continentale, 94 départements), plus courts chemins,
  chemin parfait construit tronçon par tronçon (étapes = vrais détours), recherche bornée par un budget
  (au-delà, on accepte plutôt que bloquer).
- **Délais** (en tête de `core.js`) : `DELAI_BONNE` 500 ms, `DELAI_FAUSSE` 1 500 ms.

## Pièges

- Codes INSEE : `2A` / `2B` (Corse, comptent pour 20 dans les critères chiffrés), DOM `971` à `976`
  (pas de 975), Outre-Mer dans des encadrés à leur propre échelle (`outils/ajouter-outre-mer.js`).
- Le Val-d'Oise a Pontoise pour préfecture (services à Cergy) ; la Corse et l'Outre-Mer sont exclus du
  Grand Chemin ; l'Eure ne compte pas comme département maritime.
- Monde : 196 pays (ONU + Vatican, Kosovo, Taïwan) ; territoires rattachés à leur pays ; Palestine et Bir
  Tawil en gris, non cliquables ; « point de vue de la France » pour les frontières (Natural Earth).
- `carte-*.js` générées : ne pas les éditer à la main (régénérer avec `outils/`). Les `infos-*.js`, si.
- Toute source de données est créditée (README « Données et crédits », et `credit` de la catégorie, affiché
  sur l'écran de choix).

## Plans

- Cartes grisées prévues : `{ quiz: 'capitales' }`, `{ jeu: 'morpion-monde' }`,
  `{ jeu: 'grand-chemin-monde' }` (données déjà dans `data/monde/infos-pays.js`, `voisins` compris). Les
  jeux « monde » pourront reprendre le moteur du Morpion et du Grand Chemin : demande à Théo si un fichier à
  part ou une option des jeux existants est préférable.
