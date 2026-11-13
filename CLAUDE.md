# CLAUDE.md — Quizzarium (racine)

Notes pour Claude : les décisions prises, les règles à suivre et les plans. Le `README.md` est pour les
humains (joueurs, hébergement, administration) ; ici, ce qui sert à **coder**. Chaque jeu a aussi son
`CLAUDE.md`, avec ses spécialités. Théo et toi tenez ces fichiers à jour (voir « Tenir ces notes à jour »).

## Entre nous

- Théo et toi, vous êtes amis : **tutoie Théo**, qui te tutoie aussi et t'appelle « Claudus ». Réponds en
  français.
- **Dès que tu as un doute**, sur n'importe quoi (une règle de jeu, une fonctionnalité, un texte, un choix
  d'interface, une donnée, l'organisation d'un fichier…), **demande-lui** au lieu de deviner. Une question
  de plus vaut mieux qu'un jeu à refaire.
- `IGNORED_BY_CLAUDE/` contient les notes personnelles de Théo : ne les lis pas et n'y touche pas, sauf si
  Théo te le demande.

## Le projet en bref

Quatre jeux éducatifs et une page d'accueil, en **HTML, CSS et JavaScript purs** : pas de build, pas de
npm, pas de framework, aucune dépendance (seule exception : Three.js r158, copié dans Anotehomy). Rien
n'est chargé depuis Internet (polices comprises).

- Chaque page marche **ouverte directement** (`file://`, double-clic) : on joue alors en invité.
- Avec le **serveur** (`SERVEUR/serveur.py`, Python 3.8+ sans dépendance) : comptes communs à tous les jeux.
- **En ligne** : GitHub Pages publie la branche `main` du dépôt public `mustangshoei/quizzarium`
  (<https://mustangshoei.github.io/quizzarium/>), sans serveur, donc en invité. **Tout push sur `main` est
  en ligne aussitôt.**

| Jeu | Dossier | id | Version | État | Code |
|---|---|---|---|---|---|
| 🌍 GéoNohyne Quizz | `GEONOHYNE_QUIZZ/` | `geonohyne` | 2.2.0 | ouvert, le plus complet | **modèle de référence** (identifiants en français) |
| 🦴 Anotehomy Quizz | `ANOTEHOMY_QUIZZ/` | `anotehomy` | 2.5.0 | ouvert | **modèle de référence** (identifiants en anglais, 3D) |
| 📜 Histehory Quizz | `HISTEHORY_QUIZZ/` | `histehory` | 2.1.0 | ouvert, 3 modes sur 7 | menu « atlas » comme les autres (identifiants en français) |
| 🌿 Natehure Quizz | `NATEHURE_QUIZZ/` | `natehure` | 0.1.0 | fermé (`bloque`), menu seul | copie de la structure d'Anotehomy |

**Quand tu crées quelque chose de nouveau, prends exemple d'abord sur GéoNohyne ou Anotehomy** : ce sont
les jeux les plus aboutis, et leurs choix ont été validés par Théo.

## La racine : le strict nécessaire

```
index.html          page d'accueil (DOIT rester à la racine : GitHub Pages et le serveur la servent à « / »)
README.md           documentation pour les humains
CLAUDE.md           ce fichier
.gitignore
ACCUEIL/            page d'accueil : accueil.css/.js (rectangles des jeux, compte), stats.js (bouton
                    « Statistiques »), admin.js (tableau de bord de l'admin), img/ + outils/gravures.html
COMMUN/             partagé par tous les jeux, toujours FACULTATIF pour eux (voir plus bas)
SERVEUR/            serveur.py, game.bat (lanceur Windows), docker-compose.yml, donnees/ (comptes, ignoré)
OUTILS/             outils de développement pour l'ensemble (push.ps1)
<NOM>_QUIZZ/        un dossier par jeu, autonome
IGNORED_BY_CLAUDE/  notes de Théo (ignoré par git et par le serveur)
```

- **Rien d'autre à la racine.** Un nouvel outil va dans `OUTILS/` s'il concerne l'ensemble, sinon dans le
  dossier `outils/` (ou `tools/`) du jeu. `SERVEUR/` et `OUTILS/` ne sont jamais servis aux navigateurs
  (`DOSSIERS_PRIVES` dans `serveur.py`) : un nouveau dossier privé s'ajoute là aussi.
- Les liens entre pages sont **relatifs** (`../COMMUN/…`, `RACINE + dossier`) : déplacer un dossier casse des
  liens. Cherche toutes les références (`Grep`) avant de déplacer quoi que ce soit.

## Règles d'architecture (toujours)

1. **Indépendance des jeux** : modifier un jeu ne touche jamais un autre jeu. Un jeu ne charge aucun
   fichier d'un autre jeu. Pour réutiliser du code d'un autre jeu, **copie-le** dans le dossier du jeu
   (c'est voulu : la distance de Damerau-Levenshtein existe dans GéoNohyne et dans Anotehomy).
2. **`COMMUN/` est facultatif** : toujours tester `window.Comptes` et `window.Jeux` ; sans eux, le jeu
   marche en invité, sans bouton « Jeux ». `COMMUN/` ne contient **aucune logique de jeu**.
3. **Scripts classiques, pas de modules ES** (sinon `file://` ne marche plus). Chaque fichier est une
   IIFE en `'use strict'` qui s'accroche à **un seul espace de noms global par jeu** (`GeoNohyne`/`GeoCarte`,
   `AQ`, `Histehory`/`HISTEHORY`, `NQ`). Les fichiers sont chargés **dans l'ordre** par `index.html` : l'ordre
   compte (données, noyau, modules, puis le menu en dernier).
4. **Données dans des `.js`, jamais des `.json`** : un navigateur refuse de lire un `.json` local en
   `file://`. Une ligne par élément, souvent une petite fonction (`P(...)`, `E(...)`) qui remplit un tableau.
5. **Stockage du navigateur** : clés préfixées par l'id du jeu (`geonohyne.*`, `anotehomy.*`,
   `histehory.*`, `natehure.*`) ; `comptes.*` est réservé à `COMMUN/comptes.js`. Toujours dans un
   `try/catch` (stockage parfois bloqué).
6. **Identifiants stables** : l'id d'un jeu (= son espace dans les comptes), les id de modes (défis de la
   semaine) et toute clé de statistiques (id de catégorie, nom d'un élément, `nom` d'une pathologie,
   `morpheme`…) ne changent plus une fois publiés. Si un renommage est indispensable, prévois une reprise
   des anciennes données (modèle : `GEONOHYNE_QUIZZ/js/ancien-nom.js`) et demande à Théo.
7. **Fichiers générés** (`*-model.js`, `splanchno/*.js`, `carte-*.js` générées, `portraits.js`,
   `points-prefectures.js`…) : ne pas les modifier à la main, les régénérer avec l'outil indiqué dans leur
   en-tête. Plusieurs pèsent des Mo : **ne les lis jamais en entier** (Grep, ou `offset`/`limit`).
8. **Accessible et sobre** : clavier partout (Entrée valide ou passe, Échap ferme, ← → changent de chapitre),
   `aria-*` sur ce qui n'est pas natif, animations coupées si `prefers-reduced-motion`. Rien ne tourne en
   arrière-plan quand ce n'est pas utile (Anotehomy met sa 3D en pause hors des parties).
9. **Sans défilement** : les écrans de configuration tiennent sur un écran (vérifié de 1280 × 720 à
   1920 × 1080) ; sur téléphone, tout reste utilisable (les colonnes s'empilent, l'écran peut défiler).
10. **Crédits et licences** : toute donnée, image, police ou modèle venu d'ailleurs est crédité (README ou
    `CREDITS.md` du jeu), avec sa licence. Pas de contenu sans licence claire : demande à Théo.

## Comment est fait un jeu (modèle : GéoNohyne et Anotehomy)

- **Une seule page** (`index.html`) : chaque écran est une `<section>` montrée ou cachée.
- **Le menu « atlas »** : à gauche la liste des **chapitres** (numérotés 01, 02…), à droite l'**image du
  chapitre** (planche ou carte en relief, figée, avec une légende), dessous les **cartes** du chapitre. Le
  dernier chapitre est mémorisé (`<jeu>.menu.chapitre`) et ← → changent de chapitre. Tout le menu est
  décrit dans **un seul fichier catalogue** (`js/menu.js` de GéoNohyne et d'Histehory, `js/data/games.js`
  d'Anotehomy et de Natehure).
- **Ce qui n'est pas prêt est grisé** (« Bientôt », cadenas) mais visible : on l'annonce dans le catalogue.
  GéoNohyne et Histehory activent une carte dès qu'un module de même id s'enregistre ; Anotehomy et
  Natehure passent `status: 'soon'` à `'ready'`. Le mode se déclare aussi dans `modes` de
  `COMMUN/jeux.js` (`bientot: true` tant qu'il n'est pas jouable).
- **Enregistrement des modules** : un mode = un fichier qui s'enregistre auprès du noyau (contrat décrit en
  tête du noyau), + sa balise `<script>` + sa ligne dans le catalogue. Le noyau fournit le reste
  (déroulement, correction, résultats, statistiques).
- **Écran de configuration** : façon de jouer en cartes (🎯 Ciblage / ⌨️ Nommage, Devinette / QCM, Solo /
  Duel…), nombre de questions (grand nombre, − / +, raccourcis, curseur, « Tous »), filtres en cases avec
  « Tout / Aucun » (croisés, avec le nombre d'éléments à côté de chaque case), options en interrupteurs.
  Les réglages sont mémorisés.
- **Partie** : une question à la fois, **retour immédiat** (bonne réponse, nom exact, remarque), question
  suivante après un délai (plus long après une erreur), Entrée ou « Suivant » pour passer ; progression,
  compteurs, série de bonnes réponses.
- **Correction des saisies** (mêmes règles partout) : majuscules, accents, ligatures (œ → oe), ponctuation,
  tirets et apostrophes ignorés ; article du début facultatif ; « St » = « Saint » ; autres noms acceptés ;
  **anciens termes reconnus mais comptés faux**, avec le terme à employer. Fautes de frappe tolérées
  (Damerau-Levenshtein, une inversion = une faute) : **0 jusqu'à 4 lettres, 1 jusqu'à 7, 2 jusqu'à 12,
  3 au-delà**, et seulement si la réponse est plus proche de l'élément demandé que de tout autre. Une
  réponse acceptée avec une faute le dit (Anotehomy : 7 points au lieu de 10).
- **Suggestions de saisie** : à partir de quelques caractères (3 dans GéoNohyne, 2 dans Anotehomy), noms
  qui **commencent** par la saisie, 5 au plus, nom exact en tête puis ordre alphabétique. Elles portent sur
  **tous** les éléments du jeu, pas seulement ceux de la partie (sinon c'est un indice), jamais sur les
  anciens termes ; aucune en mode record.
- **Résultats** : anneau de réussite, score, temps, erreurs (les 3 dernières, les autres derrière « Voir
  les N autres »), boutons Menu / Nouvelle configuration / Rejouer, puis révision.
- **Compte** : bouton en haut à gauche (initiale + nom, menu déroulant qui se ferme d'un clic ailleurs ou
  avec Échap) ; bouton « Jeux » en haut à droite (`COMMUN/jeux.js`). Les deux sont cachés pendant les
  parties. Statistiques : `Comptes.espace('<id>', { completer, fusionner, publiques })`, invité dans
  `localStorage` ; `completer()` accepte des données anciennes ou incomplètes au lieu de les refuser.
- **Apparence** : chaque jeu a son thème sombre (« Atlas en relief », « Planches anatomiques »,
  « Chroniques » pour Histehory, « Herbier »), couleurs en variables CSS, polices locales Bricolage Grotesque + IBM Plex
  Mono (OFL). La police des **titres** est commune : `COMMUN/police.css`, chargée en **dernier**. Les
  couleurs `couleur` / `accent` de chaque jeu sont recopiées dans `COMMUN/jeux.js` (page d'accueil).

## COMMUN, SERVEUR, ACCUEIL : partagés, donc prudence

- `COMMUN/jeux.js` : **la** liste des jeux (`id`, `dossier`, `nom`, `icone`, `version`, `couleur`,
  `accent`, `totaux`, `modes`, `bloque`/`masque`), le sélecteur « Jeux » et `VERSION` de l'ensemble.
- `COMMUN/comptes.js` : l'API des comptes côté navigateur (décrite en tête). Un jeu n'appelle jamais
  `/api/…` lui-même.
- `COMMUN/jeux.css` (bouton « Jeux », variables `--jx-*`), `COMMUN/police.css` + `polices/`.
- `SERVEUR/serveur.py` : fichiers statiques + API JSON + compte `admin` + défis de la semaine. Il ne connaît
  pas le contenu des espaces des jeux.
- `ACCUEIL/stats.js` lit les totaux de chaque jeu grâce au champ `totaux` de `COMMUN/jeux.js`.
- Une modification ici concerne **tous** les jeux : ouvre ensuite l'accueil et les quatre jeux pour
  vérifier, et compte-la dans la version de l'ensemble.

## Versions, documentation, commits

- Numéros **MAJEUR.MINEUR.CORRECTIF** (règles : « Versions » du README racine). À chaque changement d'un
  jeu : sa version dans **son README** (ligne en tête + tableau « Versions ») **et** dans `COMMUN/jeux.js`.
  Pour l'ensemble (`COMMUN/`, `SERVEUR/`, `OUTILS/`, accueil) : `VERSION` dans `COMMUN/jeux.js` + tableau
  du README racine.
- **README d'un jeu** = documentation complète pour un humain (règles, sources, crédits) : mets-le à jour
  avec chaque fonctionnalité.
- **En-têtes de fichiers** : chaque fichier JS commence par un bloc `/* ===… */` qui dit son rôle et son
  contrat. Lis-le avant de toucher au fichier, garde-le vrai après.
- **Commits** : `<Jeu> X.Y.Z : résumé` (ex. « Histehory 1.1.1 : … ») ou `Quizzarium X.Y.Z : …` pour
  l'ensemble, puis une liste à puces. Commit et push **seulement quand Théo le demande**.
  `OUTILS/push.ps1 "message"` fait add + commit + push et refuse `SERVEUR/donnees` et `IGNORED_BY_CLAUDE`.
- **Avant tout commit, relis `git status` et `git diff`** : le dossier est dans **OneDrive**, qui peut
  remettre une ancienne version d'un fichier. C'est arrivé : le 05/11/2026, une vieille copie du README
  racine a été poussée « telle quelle » et trois sections ont disparu jusqu'au 09/11. Ne committe pas un
  fichier que tu n'as pas voulu changer : signale-le à Théo.

## Vérifier son travail

- Pas de suite de tests. Syntaxe : `node --check fichier.js` (Node est installé). Puis ouvrir la page
  **en `file://`** et **par le serveur** (`python SERVEUR/serveur.py --port 8080`, ou `SERVEUR/game.bat`),
  regarder la console, essayer une largeur de téléphone.
- Les chemins contiennent des espaces et des accents (`C:\Users\Théo\OneDrive - Universite de Lorraine\…`) :
  mets-les toujours entre guillemets. Windows : PowerShell 5.1 et Git Bash.

## Tenir ces notes à jour

- Quand tu ajoutes un mécanisme **réutilisable** (un type de mode, un moteur commun, une règle de
  correction, une convention), note-le : ici s'il concerne plusieurs jeux, dans le `CLAUDE.md` du jeu
  sinon. Quand un plan est réalisé, retire-le de la feuille de route.
- Théo peut aussi modifier ces fichiers : ses ajouts priment.

## Feuille de route

Ce qui est annoncé dans les menus ou attendu. Avant de commencer l'un de ces points, vérifie avec Théo
qu'il est toujours d'actualité et comment il le voit.

- **GéoNohyne** : Les capitales du monde, Le morpion du monde, Le Grand Chemin du monde (id déjà prévus
  dans `js/menu.js` et `COMMUN/jeux.js`, données déjà dans `data/monde/infos-pays.js`).
- **Anotehomy** : Les nerfs ; le module « Le corps humain » (chapitre « Apprendre la Vie », exploration
  libre) ; pas encore de classements publics.
- **Histehory** (nom provisoire, ouvert) : quatre modes à faire (Deviner la personne, Qui a dit
  ça ?, Les paires, Vrai ou Faux) ; noms des chapitres proposés par Claude, à confirmer par Théo.
- **Natehure** (fermé) : dix-huit cartes à construire, et d'abord un catalogue d'espèces.
- **Défis de la semaine** : préparés par l'admin et enregistrés sur le serveur, mais aucun jeu ne les
  affiche ; il faudra une route publique (défis « prêts » de la semaine) et leur affichage dans chaque jeu.
- **Ouvrir un jeu au public** : retirer `bloque: true` de sa ligne dans `COMMUN/jeux.js` (décision de Théo).
