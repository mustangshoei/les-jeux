# Natehure Quizz

**Version 0.1.0** — en préparation. Nature, agriculture & végétaux : la botanique, la flore libre et
ce que l'on cultive.

> **Aucun jeu n'est encore jouable.** Cette version pose l'**interface** : le menu, ses trois chapitres,
> ses dix-huit cartes (toutes grisées, « Bientôt ») et le bouton du compte. Il n'y a ni catalogue
> d'espèces, ni écran de configuration, ni partie.

## Accès

Ce jeu est **fermé** (champ `bloque` de sa ligne dans `../COMMUN/jeux.js`) : sa tuile reste **visible**
sur la page d'accueil et dans le menu « Jeux » des autres jeux, mais elle est grisée et **inerte** — ce
n'est plus un lien, et ni la souris, ni le clavier, ni un lecteur d'écran n'y mènent.

Son dossier n'est pas touché pour autant : **`index.html` s'ouvre normalement à la main** (double-clic,
ou son adresse tapée dans le navigateur), avec son menu, son compte et son propre bouton « Jeux » — qui
reste entier — pour repartir vers les autres jeux. Voir « Accès aux jeux » dans le
[README à la racine](../README.md).

Pour l'ouvrir au public le jour venu : retirer `bloque: true` de sa ligne dans `../COMMUN/jeux.js`.

## Les trois chapitres

| № | Chapitre | Ce qu'on y apprend | Cartes |
|---|---|---|---|
| 01 | **Biologie & Anatomie végétale** | le fonctionnement interne : organes de la plante, cellule végétale, photosynthèse, circulation de la sève, familles botaniques, fleur et pollinisation | 6 |
| 02 | **Flore, Arbres & Champignons** | la nature libre, reconnue à l'œil : arbres et feuilles, écorces et silhouettes, fleurs sauvages, champignons, espèces toxiques, herbier | 6 |
| 03 | **Agriculture & Récoltes** | ce que l'on cultive : saisonnalité des fruits et légumes, grandes cultures, sol vivant, potager, techniques agronomiques, terroirs | 6 |

Les trois chapitres et leurs cartes sont décrits dans **`js/data/games.js`** : c'est le seul fichier à
modifier pour ajouter, déplacer ou renommer une carte. Les nombres annoncés en bas des cartes
(« Objectif : 60 arbres ») sont les objectifs du catalogue à constituer, pas des données déjà présentes.

## Le menu

Même construction que les menus de GéoNohyne Quizz et d'Anotehomy Quizz :

- à gauche, le titre et la **liste des chapitres** (le chapitre affiché est souligné de vert) ;
- à droite, la **planche** du chapitre : un dessin au trait avec cinq repères et une légende. Les planches
  sont **dessinées en SVG dans `js/game/home.js`** — aucune image, aucun fichier binaire — et restent
  **immobiles** : rien ne tourne en fond ;
- sous la planche, la **roue des saisons** (P printemps, É été, A automne, H hiver) : le quartier de la
  saison du jour est marqué ;
- dessous, les **cartes** du chapitre choisi.

Les flèches ← → changent de chapitre ; le dernier chapitre affiché est retenu (`natehure.menu.chapitre`
dans le stockage du navigateur).

## Contenu du dossier

```
index.html              la page du jeu (une seule) : le menu et le bouton du compte
README.md               ce fichier
css/
  base.css              thème « Herbier » : couleurs, polices, boutons, fond fixe
  home.css              le menu : chapitres, planche, repères, cartes
  account.css           bouton et menu du compte, place du bouton « Jeux »
  responsive.css        fenêtres basses et écrans étroits
  polices/              Bricolage Grotesque et IBM Plex Mono (licence OFL, textes joints)
js/
  core/namespace.js     l'espace de noms unique window.NQ
  core/utils.js         utilitaires (DOM, échappement, hasard)
  data/games.js         LE CATALOGUE DU MENU : les trois chapitres et leurs cartes
  account/account.js    le compte du joueur (s'appuie sur ../COMMUN/comptes.js)
  game/home.js          le menu : chapitres, planches SVG, cartes
```

Scripts classiques (pas de modules ES) chargés dans l'ordre par `index.html`, pour que le jeu fonctionne
en ouvrant directement ce fichier, sans serveur.

## Comptes

Les comptes sont communs à tous les jeux (`../COMMUN/comptes.js`) : on reste connecté en changeant de
jeu. Sans ce fichier, ou sans le serveur des jeux, on joue **en invité** — le bouton du compte reste et
l'explique. Aucune statistique n'est encore tenue : il n'y a pas de partie à compter.

## Historique

| Version | Date | Changements |
|---|---|---|
| 0.1.0 | 31/10/2026 | Première version : le menu, ses trois chapitres, ses dix-huit cartes (toutes « Bientôt »), les trois planches SVG, la roue des saisons et le bouton du compte. Aucun mode de jeu. |
