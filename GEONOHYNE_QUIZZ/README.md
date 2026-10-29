# GéoNohyne Quizz

Quiz de géographie (anciennement **GéoQuiz**) : HTML, CSS et JavaScript purs, sans connexion Internet.
GéoNohyne Quizz fait partie du dossier des jeux (voir le [README à la racine](../README.md)) : il partage
avec les autres jeux les **comptes** (nom + mot de passe) et le serveur facultatif (`../SERVEUR/serveur.py`,
Python sans dépendance) qui permet de jouer à plusieurs sur un réseau, avec des classements communs.

**Version 2.0.0** (numérotation MAJEUR.MINEUR.CORRECTIF : voir « Versions » dans le
[README à la racine](../README.md#versions), et l'[historique](#versions) plus bas).

## Lancer le jeu

- **Seul, sur un ordinateur** : double-cliquez sur **`index.html`**. Rien à installer ; on joue en
  invité (statistiques gardées dans le navigateur), sans comptes.
- **Avec les comptes** : double-cliquez sur **`game.bat`**, à la racine du dossier des jeux (Windows, il
  faut Python 3) : il lance le serveur des jeux et ouvre le navigateur. Ou, sur un NAS : lancez le serveur
  des jeux (voir le README à la racine) et ouvrez
  `http://<adresse-de-la-machine>:8080/GEONOHYNE_QUIZZ/` (ou la page d'accueil `http://<adresse>:8080`, qui
  propose tous les jeux) depuis n'importe quel appareil du réseau.
- **Changer de jeu** : bouton **« Jeux »** en haut à droite, sur les
  écrans du menu (pas pendant les parties ni en mode Apprendre). On reste connecté dans l'autre jeu.

GéoNohyne Quizz ne dépend d'aucun autre jeu. Du dossier commun `../COMMUN/`, il utilise seulement
`comptes.js` (les comptes), `jeux.js` et `jeux.css` (le bouton « Jeux ») : si ces fichiers manquent ou
plantent, GéoNohyne Quizz se joue normalement, en invité et sans bouton « Jeux ».

## Contenu du dossier

Les dossiers `js/` et `data/` sont rangés comme le menu : un sous-dossier par grande catégorie.

```
index.html                         page unique (menu, mode Apprendre, choix de partie, jeu, fin de partie)
css/style.css                      toute l'apparence (« Atlas en relief », thème sombre unique)
css/polices/                       polices Bricolage Grotesque et IBM Plex Mono (licence OFL, fichiers OFL-*.txt)
img/topo.svg                       fond : courbes de niveau
js/carte.js                        moteur de cartes (GeoJSON → SVG), sans donnée de pays
js/core.js                         noyau : enregistrement des modules, quiz (ciblage, nommage, record), mode Apprendre, zoom
js/menu.js                         LE MENU : chapitres (grandes catégories), leurs cartes, carte des régions en relief
js/profils.js                      comptes (communs à tous les jeux, via ../COMMUN/comptes.js) et invité, statistiques
                                   (records, historique, zones ratées, exports)
js/compte.js                       bouton de compte (en haut à gauche), fenêtre de connexion et du compte, écran des statistiques
js/ancien-nom.js                   reprend les réglages enregistrés dans le navigateur sous l'ancien nom (GéoQuiz)

js/france/                         « La France et sa géographie »
  quiz-departements.js             quiz « Les Départements » (modèle des autres quiz)
  quiz-fleuves.js                  quiz « Fleuves & Océans »
  grand-chemin.js                  jeu « Le Grand Chemin » (relier deux départements)
  morpion.js                       jeu « Morpion des Départements » (tic-tac-toe à critères croisés)
  liste.js                         jeu « La Liste des Départements » (citer départements et préfectures)
  codage.js                        jeu « Codage – Encodage » (numéro ↔ nom des départements, chronométré)
  entonnoir.js                     jeu « L'Entonnoir » (un critère de plus à chaque étape, jusqu'à un seul département)
js/monde/                          « Le monde et ses pays »
  quiz-pays.js                     quiz « Les pays du monde »
  quiz-oceans-mers.js              quiz « Les océans et mers »
js/apprendre/                      « Apprendre »
  departements.js                  « Apprendre les départements » (modèle des autres modules)
  fleuves-oceans.js                « Apprendre les fleuves et océans de France »
  pays.js                          « Apprendre les pays »
  mers-monde.js                    « Apprendre les mers et océans du monde »

data/france/
  carte-departements.js            la carte de France (un fichier par carte)
  infos-departements.js            fiches des départements (région, préfecture, superficie, population…)
  carte-hydrographie.js            mers, fleuves, rivières et pays voisins (généré)
  infos-hydrographie.js            fiches des mers et cours d'eau (généré)
data/monde/
  carte-pays.js                    la carte du monde : 196 pays (générée)
  infos-pays.js                    fiches des pays (capitale, population, langues, monnaie, voisins…)
  carte-mers.js                    océans, mers, golfes et détroits (générée)
  infos-mers.js                    fiches des mers (superficie, profondeur, riverains…)

outils/construire-hydrographie.py  (facultatif) régénère les deux fichiers « hydrographie »
outils/construire-monde.html       (facultatif) régénère les deux cartes du monde, dans le navigateur
outils/construire-monde.js         … son moteur et ses réglages (liste des pays, des mers, niveaux)
outils/convertir-carte.html        outil pour fabriquer une nouvelle carte (autre pays…)
outils/ajouter-outre-mer.js        (facultatif) régénère les encadrés des DOM dans la carte de France
```

## Le menu

Le menu est un **atlas** : à gauche, la liste des **chapitres** (grandes catégories, numérotés 01 à 04,
avec leur nombre de cartes) ; à droite, l'**image du chapitre** : une carte en relief, dessinée à partir
des données du jeu, avec sa légende (chiffres tirés des mêmes données). Un clic sur un chapitre change
l'image (fondu) et affiche, dessous, ses cartes ; les **flèches ← →** du clavier passent au chapitre
précédent ou suivant. Le dernier chapitre affiché est mémorisé : on le retrouve en revenant au menu ou en
rouvrant le jeu.

| Chapitre | Image (et légende) | Cartes (dans l'ordre de la grille) |
|---|---|---|
| 01 **La France et sa géographie** | les régions de France, une couleur chacune, Paris (régions, départements métropolitains, d'Outre-Mer) | Les Départements · Fleuves & Océans · Les Régions *(à venir)* · Les Préfectures *(à venir)* · Le Grand Chemin · Morpion des Départements · La Liste des Départements · Codage – Encodage · L'Entonnoir |
| 02 **Le monde et ses pays** | les pays du monde, une couleur par continent, la France (pays, continents, océans et mers) | Les pays du monde · Les capitales du monde *(à venir)* · Le morpion du monde *(à venir)* · Le Grand Chemin *(à venir)* · Les océans et mers |
| 03 **Apprendre** | la France, ses fleuves et rivières, les grands fleuves et les mers nommés (cartes à explorer, nombre de fiches) | Apprendre les départements · Apprendre les fleuves et océans de France · Apprendre les pays · Apprendre les mers et océans du monde |
| 04 **Records et statistiques** | **votre réussite** par département (quiz des Départements), du corail (souvent raté) au menthe (toujours trouvé), et les trois départements les plus ratés ; redessinée après chaque partie (vos totaux) | Mes records · Classements · Historique · Zones à revoir · Exports et sauvegarde |

Tout le menu est décrit au début de **`js/menu.js`** (constante `MENU`) : c'est là qu'on ajoute, déplace
ou renomme une carte ou un chapitre, et qu'on choisit l'image d'un chapitre (`image`, une clé de
`IMAGES` : `france`, `monde`, `apprendre`, `reussite`). Chaque carte y est notée `{ quiz: 'id' }`, `{ jeu: 'id' }`,
`{ apprendre: 'id' }` ou `{ page: 'id' }`, avec son pictogramme (`icone`, une clé de `ICONES`), la
couleur de sa vignette (`teinte`, une clé de `TEINTES`) et, si besoin, ses repères (`meta`, ex.
« Solo · Duel »).

**Règle pour les ajouts futurs :** tout ce qui est ajouté mais pas encore fonctionnel apparaît **grisé**
(pointillés, cadenas, badge « Bientôt ») : il suffit de mettre sa carte dans `MENU` avec un titre et une
description. Dès que le module de même type et de même `id` est chargé, la carte devient active
automatiquement et affiche les textes du module.

## Apparence : « Atlas en relief »

Thème sombre unique : fond bleu-vert, courbes de niveau et quadrillage, panneaux « de verre », cartes en
relief (ombres empilées). Corail pour les actions, menthe pour ce qui est trouvé, sable pour le temps et
les records. Polices **Bricolage Grotesque** (titres et textes) et **IBM Plex Mono** (repères en
capitales), dans `css/polices/` : rien n'est chargé depuis Internet.

Pendant une partie : le **parcours** (une étape par question : menthe = trouvée, corail = ratée, anneau =
en cours ; une barre au-delà de 30 questions), les compteurs **Trouvés / Ratés / Temps**, la **série** de
bonnes réponses d'affilée (à partir de 2) et, sur la carte, l'étiquette **« Nom · +1 »** sur chaque zone
trouvée. Les animations sont discrètes et s'arrêtent si le système demande de réduire les animations.

## Façons de jouer : ciblage et nommage

Tous les quiz (Départements, Fleuves & Océans, Pays du monde, Océans et mers) se jouent de deux façons,
choisies en haut de l'écran de choix de la partie :

- **🎯 Ciblage** : un nom s'affiche, on clique sur la bonne zone de la carte.
- **⌨️ Nommage** : une zone s'allume en jaune sable (avec un anneau pulsant pour les plus petites), on tape son
  nom puis Entrée. Les majuscules, les accents, les espaces, les tirets et les apostrophes sont ignorés
  (« corse du sud » = « Corse-du-Sud ») ; pour une étendue d'eau, le mot « mer », « océan », « golfe »… peut
  être omis (« Pacifique »). Les codes ne sont pas acceptés. En mode occasionnel, des suggestions de noms
  s'affichent à partir de **3 caractères** tapés, et seulement pour les noms qui **commencent** par ce texte
  (« ua » ne propose pas Guadeloupe) ; le début peut sauter un article ou un mot générique (« bel » →
  Territoire de Belfort, « reu » → La Réunion, « med » → mer Méditerranée). Le nom exact vient toujours en
  tête, puis l'ordre alphabétique sans tenir compte des tirets ni des espaces : « loire » propose Loire,
  Loire-Atlantique, Loiret, puis Loir-et-Cher. En mode record, aucune suggestion. Les mêmes règles valent
  pour les suggestions du Morpion, de L'Entonnoir et du Grand Chemin (fonction `filtrerNoms` de
  `js/core.js`, donnée aux jeux par `api.suggestions`) ; le Grand Chemin propose en plus un département
  dont on tape le code exact (« 29 »).

Chaque façon de jouer existe en **mode occasionnel** (par défaut : nombre de questions, groupes, indice,
rattrapage) et en **mode record**.

## Mode record

Bouton **🏆 Record** de l'écran de choix (pas de mode record pour les jeux à part : Grand Chemin, Morpion, La Liste, Codage – Encodage, L'Entonnoir).

- **Périmètre fixe** : toutes les zones (« France entière » = les 101 départements, Outre-Mer compris ;
  « Monde complet » = les 196 pays, micro-États compris ; « Toute la carte » ; « Tous les niveaux ») ou
  celles d'**un seul** groupe (une région, un continent, un type, un niveau). La carte se cadre sur le périmètre.
- Chaque zone est demandée une fois, dans le désordre, **sans indice ni rattrapage**. Une erreur montre la
  bonne réponse et passe à la suite.
- **Record** = le meilleur score ; à score égal, le temps le plus court (au dixième de seconde). Un record par
  catégorie, façon de jouer et périmètre (ex. Départements · Bretagne · Nommage).
- L'écran de choix affiche votre record et le meilleur de tous les joueurs ; pendant la partie, votre record
  remplace le bouton de compte ; l'écran de fin annonce un nouveau record et votre place parmi les joueurs.

## Comptes et statistiques

- **Bouton de compte** en haut à gauche (tous les écrans sauf pendant les parties ; réduit à l'initiale
  en mode Apprendre) : il affiche « Invité » ou le nom du compte connecté, et ouvre le **menu du compte**,
  un menu déroulant construit comme le menu « Jeux » de droite (le joueur en tête, puis une ligne par
  action) ; il se ferme d'un clic ailleurs ou avec Échap.
- **Comptes** (seulement quand le jeu est ouvert depuis le serveur) : **nom + mot de passe** (4 caractères
  au moins), **communs à tous les jeux du dossier** : un compte créé dans GéoNohyne Quizz sert aussi dans
  Anotehomy Quizz, et inversement. À l'arrivée, le menu du compte s'ouvre seul et propose de **se connecter** ou de **créer un
  compte**, ou de **continuer en invité** (une fois par session du navigateur, tous jeux confondus). La
  connexion est **mémorisée dans le navigateur** et partagée par les jeux : on reste connecté en changeant
  de jeu, plus besoin de se reconnecter ensuite (un an sans visite la fait expirer). Les formulaires sont
  reconnus par les gestionnaires de mots de passe des navigateurs. Le fonctionnement commun (serveur,
  sécurité, données) est décrit dans le README à la racine.
- **Statistiques GéoNohyne Quizz du compte** : rangées dans l'espace `geonohyne` du compte, sur le
  serveur ; seuls les **records** sont publiés (classements). Les autres jeux n'y ont pas accès.
- **Les autres comptes sont cachés** : aucune liste de comptes. Chacun ne voit que ses propres statistiques ;
  des autres joueurs, on ne voit que le **nom et les records**, dans les classements.
- **Menu du compte** connecté : statistiques, renommer, changer le mot de passe (les autres appareils
  devront se reconnecter), se déconnecter, supprimer le compte (mot de passe demandé ; le compte disparaît
  de tous les jeux). Ces actions valent pour tous les jeux. Elle propose aussi
  d'**importer les anciens profils de ce navigateur** (ceux d'avant les comptes, et l'invité) dans le compte.
  À la création d'un compte, une case permet de **reprendre les statistiques de l'invité**.
- **Invité** : toujours possible, avec ou sans serveur ; ses statistiques restent dans le navigateur de
  l'appareil (`localStorage`, clé `geonohyne.profils`).
- **Statistiques** (ligne « Mes statistiques » du menu du compte ou grande catégorie « Records et statistiques ») :
  totaux (parties, temps de jeu, taux de bonnes réponses, records), **records** par catégorie et périmètre,
  **classements** de tous les joueurs record par record, **historique** des parties, **zones à revoir** (les
  plus ratées, avec une partie de révision en ciblage ou en nommage), **exports**.
- Toutes les parties sont enregistrées (occasionnelles et records) ; le rattrapage ne compte pas. Les
  1 000 dernières parties sont gardées dans l'historique (les totaux comptent tout).
- **Hors ligne** : si le serveur ne répond plus un moment, on continue de jouer avec son compte ; les
  parties sont envoyées dès son retour (copie gardée dans le navigateur, clé `comptes.donnees.geonohyne`).
  Une connexion d'avant les comptes communs (ancienne clé `geoquiz.session`) est reprise toute seule.
- **Ancien nom (GéoQuiz)** : les réglages et statistiques d'invité enregistrés sous les anciennes clés
  `geoquiz.*` sont repris tout seuls (`js/ancien-nom.js`), les espaces `geoquiz` des comptes sont renommés
  par le serveur, et les anciennes sauvegardes JSON se restaurent toujours.
- **Exports** : historique du joueur en **CSV**, records de tous les joueurs en **CSV** (séparateur « ; »,
  pour Excel ou LibreOffice), **sauvegarde JSON de ses statistiques**, à restaurer dans son compte ou en invité.

## Héberger le jeu sur un NAS (ou tout ordinateur toujours allumé)

GéoNohyne Quizz n'a plus de serveur à lui : le **serveur des jeux** (`../SERVEUR/serveur.py`) sert tous
les jeux du dossier **et** gère les comptes communs. Installation (Docker ou Python), mise à jour, sécurité
et reprise des comptes de l'ancien serveur (du temps de GéoQuiz) : voir le [README à la racine](../README.md).

**Mettre GéoNohyne Quizz à jour** : remplacez les fichiers de ce dossier (`GEONOHYNE_QUIZZ/`) seulement ;
les autres jeux et les comptes ne sont pas touchés. Les navigateurs revérifient les fichiers à chaque
visite : la nouvelle version est vue tout de suite.

## Fonctions communes à tous les quiz

- **Cadrage par groupes** : en jouant « par groupes » (régions, continents, niveaux…), la carte s'ouvre
  cadrée sur les zones choisies (jouer la Bretagne zoome sur la Bretagne, jouer l'Europe sur l'Europe).
  On peut toujours dézoomer ; le bouton ⤢ revient à ce cadrage.
- **Petites zones signalées par un point** : un élément de carte marqué `point: true` (micro-État, détroit
  étroit, mer Morte…) porte un point bien visible, de taille fixe à l'écran quel que soit le zoom, entouré
  d'une surface cliquable plus large : il est facile à cliquer. La légende l'indique.

## Le monde et ses pays

Deux cartes sont disponibles, **Les pays du monde** et **Les océans et mers** ; les trois autres restent
grisées. Identifiants prévus dans `js/menu.js` (le module qui utilisera l'un d'eux activera la carte) :
`{ quiz: 'capitales' }`, `{ jeu: 'morpion-monde' }`, `{ jeu: 'grand-chemin-monde' }`. Les données des fiches
(capitales, voisins, langues…) sont déjà dans `data/monde/infos-pays.js` pour ces futurs jeux.

### Les pays du monde

Sur le modèle de « Les Départements ». Code : `js/monde/quiz-pays.js`.

- **196 pays** : les 193 membres de l'ONU, le Vatican, le Kosovo et Taïwan.
- **Territoires rattachés** : ils comptent pour leur pays (un clic sur le Groenland = le Danemark, sur la
  Nouvelle-Calédonie = la France). Le **Sahara occidental** est rattaché au Maroc, avec sa limite en
  pointillés. La **Palestine** (et Bir Tawil) sont dessinées en gris, non cliquables.
- Mode **par nombre** : les 25 **micro-États** (moins de 1 000 km² : Vatican, Monaco, Tuvalu…) sont hors du
  tirage sauf si la case est cochée, comme l'Outre-Mer pour les départements. Mode **par continents** :
  Afrique, Amérique du Nord (avec l'Amérique centrale et les Caraïbes), Amérique du Sud, Asie, Europe,
  Océanie ; chaque pays est dans un seul continent (Russie → Europe ; Turquie, Kazakhstan, Caucase → Asie ;
  Égypte → Afrique ; Chypre → Europe).
- **Indice** (option) : le continent, « Mongolie (Asie) ».

### Apprendre les pays

Catégorie « Apprendre ». Code : `js/apprendre/pays.js`. Fiche de chaque pays : continent, capitale,
superficie, population (et densité), langues officielles, monnaie, pays frontaliers (surlignés et
cliquables), territoires rattachés. La recherche accepte aussi les autres noms (« Myanmar », « Hollande »,
« RDC »…) et le code ISO.

### Les océans et mers, et Apprendre les mers et océans du monde

Même carte pour le quiz (`js/monde/quiz-oceans-mers.js`) et le module Apprendre (`js/apprendre/mers-monde.js`) :
5 océans et 155 mers, golfes, baies et détroits (pas de fleuves), répartis en **quatre niveaux de
difficulté** : Facile (18), Moyen (38), Difficile (49), Expert (55). Le quiz s'ouvre sur « Par niveaux »,
Facile coché ; dans le module Apprendre, les cases à cocher filtrent par niveau (les mers décochées sont
estompées). Les détroits trop étroits pour être cliqués (Gibraltar, Bosphore, Ormuz…) et la mer Morte sont
des points. Fiche : type, océan, superficie, profondeur maximale, largeur (détroits), mers voisines ou mers
reliées (cliquables), pays riverains.

### Données des cartes du monde

| Information | Source |
|---|---|
| Frontières | **Natural Earth** (domaine public), version « point de vue de la France » : Crimée en Ukraine, Chypre du Nord dans Chypre, etc. |
| Mers et détroits | Natural Earth, d'après les limites de l'OHI |
| Population | Banque mondiale, estimations 2025 (Taïwan et Vatican : estimations nationales) |
| Superficie | mledoze/countries (données de REST Countries) |
| Capitales, langues, monnaies | établies à la main (2026) |
| Voisins, pays riverains, mers voisines | calculés sur les cartes, corrigés à la main (Israël–Syrie, Zambie–Botswana, Danemark–Canada…) |

Projection **Equal Earth** (surfaces respectées), sans l'Antarctique pour la carte des pays. Les fiches se
modifient directement dans `data/monde/infos-pays.js` et `infos-mers.js` (une ligne par pays ou par mer).
Pour régénérer les cartes (nouvelle mer, autre niveau de difficulté…) : modifier les listes au début de
`outils/construire-monde.js`, ouvrir `outils/construire-monde.html` dans le navigateur, choisir les deux
fichiers Natural Earth indiqués (dépôt GitHub `nvkelso/natural-earth-vector`, dossier `geojson/`), puis
télécharger les cartes et les placer dans `data/monde/`.

## Le Grand Chemin

Jeu de la catégorie « La France et sa géographie ». Code : `js/france/grand-chemin.js`.

- Deux départements sont tirés au hasard : **départ** (bleu) et **arrivée** (rose). Leur écart est de
  **5 à 12 sauts** (chaque frontière franchie = 1 saut) ; le chemin le plus court passe donc par
  « écart − 1 » départements : c'est le **minimum** affiché.
- La carte est **épurée** : seulement la silhouette de la France, sans frontières intérieures. Seuls le
  départ, l'arrivée et les départements proposés y apparaissent.
- On propose des départements **dans l'ordre qu'on veut**, uniquement en **tapant leur nom**
  (suggestions) : la carte n'est pas cliquable, sinon le jeu perdrait son intérêt. La partie se
  termine dès que les propositions relient le départ à l'arrivée.
- **Étoiles** : ★★★ si l'on a proposé exactement le minimum ; ★★ si l'on en a proposé au plus
  minimum × 1,5 (arrondi au supérieur) ; ★ sinon.
- **Aide** (case à cocher, mémorisée) : chaque proposition s'affiche en vert si elle fait partie d'un
  chemin parfait, en rouge sinon. S'il existe plusieurs chemins parfaits, le jeu retient celui qui
  correspond le mieux aux choix du joueur (le plus de propositions communes ; à égalité, les premières) :
  si A et B mènent tous deux à C, c'est celui que vous choisissez qui est validé, et les couleurs se
  mettent à jour en direct. Sans l'aide, les propositions restent neutres jusqu'à la fin.
- « Voir la solution » abandonne la partie et affiche un chemin parfait.
- Uniquement la **France métropolitaine continentale** (94 départements) : la Corse et l'Outre-Mer
  n'ont aucune frontière terrestre avec le continent. Les frontières sont celles des contours IGN, y
  compris dans les estuaires (la Charente-Maritime et la Gironde se touchent dans l'estuaire de la
  Gironde ; en revanche, le Calvados et la Seine-Maritime ne se touchent pas : l'Eure les sépare dans
  l'estuaire de la Seine).

## Morpion des Départements

Tic-tac-toe géographique (catégorie « La France et sa géographie », à côté du Grand Chemin).
Code : `js/france/morpion.js`.

- Deux étapes : d'abord l'écran d'**options** (mode Solo ou Duel, erreurs autorisées, mode pillage),
  puis « Lancer la partie » affiche la **grille au centre**. « ← Options » revient aux réglages,
  « Nouvelle grille » rejoue avec les mêmes options.

- Grille 3 × 3 : chaque ligne et chaque colonne porte un critère. On choisit une case, puis on tape un
  département qui vérifie les deux critères. Un département ne sert qu'une fois par grille. Les 101
  départements sont acceptés (métropole, Corse, Outre-Mer).
- Les suggestions sous la saisie ne montrent que les **noms**, sans code INSEE, et la recherche par code
  n'existe pas : sinon les critères « Code INSEE commençant par… » seraient trop faciles.
- **Fin de partie** (gagnée, perdue ou nulle) : une petite fenêtre annonce le résultat, avec
  « Recommencer » (nouvelle grille, mêmes options), « Afficher la grille » (un clic sur une case montre
  alors toutes ses réponses possibles) et « Menu ».
- **Solo** : remplir les 9 cases, avec 3, 5 ou 9 erreurs autorisées.
- **Duel** : deux joueurs, **Vert (✕)** et **Rouge (◯)**, chacun son tour ; le joueur qui commence est
  tiré au sort à chaque grille. Une mauvaise réponse fait
  perdre le tour ; « Passer mon tour » est possible. Le premier qui aligne 3 cases (ligne, colonne ou
  diagonale) gagne. Match nul si la grille est pleine, ou si les deux joueurs passent l'un après l'autre.
- **Mode pillage** (duel, décoché par défaut) : on peut aussi viser une case de l'adversaire et la lui
  prendre en donnant un autre département valide.
- **Grilles toujours remplissables** : une grille n'est proposée que si chaque case a au moins 2 réponses
  et si les 9 cases peuvent être remplies avec 9 départements différents. Les 6 critères d'une grille
  viennent de 6 familles différentes, avec des seuils tirés au hasard :

| Famille | Exemples |
|---|---|
| Façade maritime | a / n'a pas de façade maritime (les 5 DOM sont littoraux ; l'Eure, qui ne touche que l'estuaire de la Seine, ne compte pas) |
| Pays étrangers | frontalier / non frontalier d'un pays étranger (23 départements, dont la Guyane) |
| Nombre de voisins | au plus 3 ou 4, au moins 6 ou 7 départements voisins |
| Grands fleuves | traversé par la Loire, la Seine, le Rhône, la Garonne, ou l'un des quatre |
| Région | région comptant au moins 4 départements |
| Code INSEE | commence par un chiffre ; inférieur à 20, 30, 40, 50 ; supérieur à 50, 60, 70 (2A et 2B comptent pour 20) |
| Préfecture de région | abrite / n'abrite pas une préfecture de région actuelle ou ancienne (22 anciennes régions) |
| Superficie | plus / moins de 4 000, 5 000, 6 000, 7 000 km² |
| Population | plus / moins de 200 000, 300 000, 500 000, 800 000 habitants, d'un million |
| Écriture | contient / ne contient pas une lettre (accents ignorés) ; nom composé ou non |

Un critère n'est utilisé que s'il concerne entre 8 et 93 départements. Population et superficie : mêmes
sources que le mode Apprendre (populations légales 2023). Départements traversés par les fleuves : ceux
du module Fleuves & Océans.

## La Liste des Départements

Jeu de la catégorie « La France et sa géographie », après le Morpion. Code : `js/france/liste.js`.

- **À deviner** (premier écran) : **départements et préfectures**, **départements** seuls (la colonne des
  préfectures n'est pas affichée) ou **préfectures** seules (les noms des départements sont écrits
  d'avance, en gris ; indices et compteur seulement pour les préfectures). Taper un nom de ce qui n'est
  pas à deviner donne un message, sans pénalité.
- **Périmètre** : **toute la France** (101 départements) **ou une seule région** ; les cinq
  départements d'Outre-Mer forment ensemble le choix « Outre-Mer ». Tous les choix sont mémorisés.
- **La liste** : une ligne par département, en trois colonnes **Code (Région) | Département |
  Préfecture**. Le code et la région sont écrits d'avance, en entier (« 08 (Grand Est) ») sauf
  « PACA » ; les cinq DOM sont notés « Outre-Mer » (leur région porte le nom du département : ce serait
  donner la réponse). Raccourcis à modifier dans `RACCOURCIS`, au début du fichier.
- **Tri** (toute la France seulement) : **par code** (2A et 2B après le 19, les DOM à la fin) ou **par
  région** (ordre alphabétique, Outre-Mer en dernier) puis par code ; chaque région a alors son
  intertitre et la région n'est plus répétée sur chaque ligne. Il se choisit dans les options et se
  change pendant la partie (« Trier par Code | Région ») sans rien perdre ; le dernier choix est mémorisé.
- Il faut citer **tous les départements et toutes les préfectures**, dans l'ordre qu'on veut et **sans
  les associer** : on tape un nom puis Entrée (ou « Valider ») et il se place tout seul sur sa ligne ;
  « Paris » remplit les deux colonnes. Majuscules, accents, espaces, tirets et apostrophes ne comptent pas
  (« illeetvilaine » = « Ille-et-Vilaine ») ; l'article du début peut être omis (« Réunion ») et « St »
  vaut « Saint ». Pour le Val-d'Oise, « Pontoise », « Cergy » et « Cergy-Pontoise » sont acceptés.
- **Pas de pénalité** pour une saisie fausse : un message l'explique (« Nord est un département de la
  région Hauts-de-France, pas de cette liste », « déjà trouvée », « aucun département ni aucune
  préfecture »), et le texte reste sélectionné pour corriger la faute de frappe.
- **Indices**, sous le titre de chaque colonne (départements et préfectures séparément) :
  « A… Initiale » montre l'initiale d'un nom au hasard (en gris, « Q… », « Le M… ») ;
  « 👁 Révéler » écrit un nom en entier, **en rouge** : il compte comme non trouvé. Révéler prend d'abord
  un nom dont l'initiale est déjà affichée.
- Un **chronomètre** tourne dès le lancement. La partie se termine quand tout est trouvé ou révélé ;
  « Abandonner » révèle le reste en rouge. Une petite fenêtre fait le bilan (trouvés, révélés, temps,
  initiales demandées) : « Recommencer » (même périmètre), « Afficher la liste » ou « Menu ».
- Le compteur de chaque colonne (ex. 3/12) ne compte que les noms trouvés ; une ligne entièrement trouvée
  passe en vert. La liste défile seule (son en-tête reste visible) et se place sur chaque nom trouvé.
- **Carte** (option « Afficher une carte ») : à droite de la liste (au-dessus sur petit écran), la carte
  de France, cadrée sur le périmètre (les autres départements estompés). Chaque département est **gris**
  tant que rien n'est trouvé, **hachuré de vert** quand la moitié l'est (mode « les deux »), **vert**
  quand tout ce qui est à deviner l'est ; en fin de partie, ceux dont rien n'a été trouvé passent en
  **rouge**. Un nom révélé compte comme non trouvé. **Ni noms, ni clic, ni survol** : il faut savoir de
  quel département il s'agit. Pas de limites de régions ni de points de préfectures. Zoom et déplacement
  restent possibles (molette, glisser, boutons + − ⤢).

## Codage – Encodage

Jeu de la catégorie « La France et sa géographie », après La Liste. Code : `js/france/codage.js`.

- **Options** (premier écran, toutes mémorisées) :
  - **mode** : **Codage** (le nom s'affiche, on tape le numéro : Essonne → 91) ou **Encodage** (le numéro
    s'affiche, on tape le nom : 91 → Essonne) ;
  - **régions à inclure** : une, plusieurs ou toutes (« Tout » / « Aucun ») ; les cinq DOM forment le
    groupe « Outre-Mer » ;
  - **nombre de départements**, de 1 au total des régions choisies (tirés au hasard) ; si l'on retire des
    régions, il est ramené à ce total, et retrouve sa valeur si on les remet ;
  - **temps par question** : curseur à crans fixes, 3, 5, 10, 15, 20, 25 ou 30 s.
- **La partie** : un département à la fois au milieu de l'écran, la saisie juste en dessous, validée par
  **Entrée**. Une barre de chrono rétrécit sous la question (rouge dans le dernier tiers).
- **Un seul essai** : une réponse fausse, ou le chrono qui arrive à 0, rate la question. La bonne réponse
  s'affiche un court instant (0,7 s après une bonne réponse, 1,8 s après une erreur) ; Entrée passe cette
  pause. Un champ vide n'est pas compté.
- **Tolérance** : en codage, « 1 » vaut « 01 », « 2a » vaut « 2A » et les espaces ne comptent pas ; en
  encodage, la même que La Liste (majuscules, accents, espaces, tirets et apostrophes ignorés, article du
  début facultatif, « St » = « Saint »). En codage sur mobile, le clavier numérique s'ouvre, sauf si la
  Corse est en jeu (2A, 2B).
- **Bilan** (petite fenêtre) : bonnes réponses, réussite, temps moyen des bonnes réponses et départements
  à revoir ; « Recommencer » (mêmes options, nouveau tirage), « Options » ou « Menu ».

## L'Entonnoir

Jeu de la catégorie « La France et sa géographie », inspiré du Morpion. Code : `js/france/entonnoir.js`.

- **Options** : erreurs autorisées (3, 5 ou 9), puis « Lancer la partie ».
- **Principe** : un critère s'affiche ; on cite un département qui le vérifie (saisie avec suggestions,
  sans les codes). Un nouveau critère s'ajoute alors, et il faut citer un département qui vérifie
  **tous** les critères affichés, et ainsi de suite. Le nombre de départements encore possibles est
  indiqué à chaque étape. Le **même département peut resservir** d'une étape à l'autre.
- **Dernière étape** : un seul département vérifie tout ; le trouver gagne la partie. Une mauvaise réponse
  coûte une erreur (le message dit quel critère n'est pas vérifié) ; épuiser ses erreurs perd la partie.
- **Fin** : petite fenêtre (Recommencer, Afficher le parcours, Menu). Le parcours montre tous les critères
  et, pour chaque étape, les départements qui convenaient (le département final en violet, votre réponse
  en vert).
- **Génération** : le département final est tiré d'abord, puis des critères qu'il vérifie s'empilent, un
  par famille, chacun retirant au moins 10 % des possibles, jusqu'à n'en laisser qu'un : 4 à 7 étapes,
  15 à 80 possibles après le premier critère. Les 101 départements peuvent être la cible finale.
- **Cas limites** : un département trop proche de Paris (position) ou à moins de 2 % d'un seuil chiffré
  (superficie, population, densité, altitude) n'est jamais compté contre, car les chiffres varient selon
  les sources (Corrèze : 5 898 km² dans nos données, 5 857 km² ailleurs). Le proposer est **accepté**,
  avec un message qui le signale (« cas limite pour « Moins de 6 000 km² » : 5 898 km² dans nos données,
  accepté ») ; mais il ne sert jamais à départager : il reste compté parmi les possibles tant qu'un autre
  critère ne l'écarte pas, et ne peut donc pas être le département final. Dans le parcours, il est
  marqué d'un « ? ».

| Famille | Critères (un critère n'est gardé que s'il concerne au moins 2 départements et en écarte au moins 2) |
|---|---|
| Mers | façade maritime ou non ; bordé par la Manche, l'Atlantique (avec les Antilles et la Guyane), la Méditerranée, l'océan Indien |
| Cours d'eau | traversé par l'un des 16 fleuves et 36 rivières du module Fleuves |
| Voisins | voisin d'un département précis ; au plus 3 ou 4, au moins 6, 7 ou 8 voisins |
| Pays étrangers | frontalier d'un pays étranger ou non, d'au moins deux pays ; de la Belgique, du Luxembourg, de l'Allemagne, de la Suisse, de l'Italie, de l'Espagne, d'Andorre |
| Régions | région (métropole) ; touche ou non un département d'une autre région |
| Position | plus au nord, au sud, à l'est ou à l'ouest que Paris (centre du département, métropole) |
| Outre-Mer | département d'Outre-Mer ; département insulaire |
| Préfecture | aussi préfecture de région ou non ; nom composé ; commence par « Saint » ; même initiale que le département ; aucune, une seule, au moins 3 ou 4 sous-préfectures |
| Chiffres | superficie, population, densité (seuils fixes) |
| Altitude | point culminant au-dessus de 1 000, 2 000, 3 000 m ; sous 200 m (IGN, via Wikipédia « Liste des départements de France par altitude ») |
| Nom | nommé d'après un cours d'eau ; d'après un relief ; avec « Haut », « Haute » ou « Bas » |
| Plus rares | code INSEE (commence par, inférieur, supérieur à) ; écriture du nom (lettres, trait d'union) |

Les données écrites à la main (pays frontaliers, préfectures de région, origine des noms, points
culminants, articles des noms) sont au début de `js/france/entonnoir.js`.

## Apprendre les départements

Catégorie « Apprendre ». La carte de France complète s'affiche (métropole et Outre-Mer, limites des
régions tracées).

- **Clic sur un département** : sa fiche s'affiche dans le panneau de gauche (au-dessus de la carte sur
  petit écran), dans cet ordre : nom et code INSEE, région, préfecture et sous-préfectures, superficie,
  nombre d'habitants (avec la densité), départements frontaliers. Ces derniers sont mis en évidence sur
  la carte et cliquables dans la fiche. Le survol d'un département affiche son nom.
- **Barre de recherche** (en haut du panneau) : tapez un nom (accents et tirets facultatifs) ou un code
  (`54`, `2A`, `974`), puis Entrée ou clic sur une suggestion : la carte se centre sur le département.
- Clic hors de la carte ou touche Échap : la fiche se referme.

### Sources et année de référence des informations

| Information | Source |
|---|---|
| Population | **Populations municipales légales, millésime 2023** (INSEE, en vigueur au 1er janvier 2026) : somme des communes du département |
| Superficie | somme des surfaces des communes, arrondie au km² |
| Région, préfecture | Code officiel géographique 2026 (INSEE) |
| Sous-préfectures | chefs-lieux d'arrondissement |
| Départements frontaliers | calculés à partir des contours partagés de la carte du jeu |

Données obtenues via [geo.api.gouv.fr](https://geo.api.gouv.fr) (Licence Ouverte, Etalab). Pour les
mettre à jour, modifiez `data/france/infos-departements.js` (une ligne par département) et `anneePopulation`.
Cas particulier : la préfecture du Val-d'Oise est officiellement Pontoise, ses services sont installés à Cergy.

## Réglages rapides

Au début de `js/core.js` :

| Constante      | Rôle                                            | Valeur |
|----------------|-------------------------------------------------|--------|
| `DELAI_BONNE`  | pause après une bonne réponse (millisecondes)   | 500    |
| `DELAI_FAUSSE` | pause après une mauvaise réponse (millisecondes)| 1500   |
| `MIN_SUGGESTION` | nommage : caractères à taper avant les suggestions | 3    |

Le bouton « Suivant → » permet de passer la pause sans attendre.

## Ajouter une catégorie de quiz

1. Copiez `js/france/quiz-departements.js` en `js/france/quiz-xxx.js` (ou `js/monde/quiz-xxx.js`) et
   adaptez les textes.
2. Dans `index.html`, ajoutez `<script src="js/france/quiz-xxx.js"></script>` dans la section de sa
   grande catégorie.
3. Dans `js/menu.js`, placez la carte `{ quiz: 'xxx' }` dans la bonne grande catégorie.

Si la carte est déjà dans le menu, grisée (`regions`, `prefectures`, `capitales`), il suffit d'utiliser
le même `id` : elle s'active toute seule. Le nouveau quiz a automatiquement le nommage, le mode record et
les statistiques ; ses périmètres de record sont « tout » (nommé par `nomTout`) et chacun de ses `groupes`.

## Apprendre les fleuves et océans de France

France métropolitaine uniquement. La carte montre les départements en fond, les pays voisins et :

- **Mers & océans** : Manche, mer du Nord, océan Atlantique, mer Méditerranée ;
- **Fleuves** (ils se jettent dans la mer) : Seine, Loire, Garonne, Rhône, Rhin, Meuse, Escaut, Somme,
  Orne, Vilaine, Charente, Adour, Aude, Hérault, Var, Têt ;
- **Rivières** (elles se jettent dans un autre cours d'eau) : Marne, Oise, Aisne, Yonne, Aube, Eure,
  Allier, Cher, Indre, Vienne, Creuse, Maine, Mayenne, Sarthe, Loir, Dordogne, Lot, Tarn, Aveyron,
  Ariège, Gers, Vézère, Saône, Doubs, Ain, Isère, Drôme, Durance, Ardèche, Arve, Verdon, Moselle,
  Meurthe, Sarre, Ill, Gave de Pau.

Les cases à cocher sous la barre de recherche choisissent ce qui est affiché. Un clic sur un cours
d'eau affiche sa fiche : type, longueur, source, embouchure, principaux affluents, départements
traversés ; un clic sur une mer : superficie, côtes françaises, cours d'eau qui s'y jettent. Les
éléments liés (embouchure, affluents) sont surlignés sur la carte et cliquables dans la fiche.

Sources : tracés © contributeurs OpenStreetMap (ODbL) ; pays voisins Natural Earth ; longueurs usuelles
(Sandre, encyclopédies) ; départements traversés calculés à partir des tracés ; limites entre mers
simplifiées d'après l'OHI. Pour ajouter un cours d'eau : une ligne dans `COURS_D_EAU` de
`outils/construire-hydrographie.py`, puis `python outils/construire-hydrographie.py <dossier-cache>`
(le dossier cache reçoit les téléchargements ; il faut une connexion Internet).

### Quiz « Fleuves & Océans »

Même carte, en jeu. L'écran de choix s'ouvre sur **« Par types »** : cochez ce qu'il faut deviner
(mers & océans, fleuves, rivières) ; les éléments des types non cochés sont estompés et ne réagissent
pas au clic. Le mode « Par nombre » tire au hasard parmi tous les éléments. Comme pour les départements,
un élément déjà apparu (trouvé ou raté) n'est plus cliquable, et le rattrapage final reste disponible.

## Ajouter un module « Apprendre »

1. Créez le fichier d'informations `data/<france|monde>/infos-xxx.js` (sur le modèle de
   `data/france/infos-departements.js`).
2. Copiez `js/apprendre/departements.js` en `js/apprendre/xxx.js` : la fonction `fiche(zone)` renvoie
   les lignes à afficher dans le panneau.
3. Ajoutez les deux lignes `<script>` dans `index.html` (sections « Cartes et informations » et
   « Apprendre »), et la carte `{ apprendre: 'xxx' }` dans `js/menu.js`.

Options utiles (détaillées au début de `js/core.js`) : `types` et `champFiltre` (cases à cocher pour filtrer,
par type ou par niveau), `filtresEstompes` (estomper au lieu de masquer), `etiquette(zone)` (texte à droite
des résultats de recherche), `alias` (autres noms acceptés par la recherche).

## Changer de pays, ou jouer sur une autre carte

1. Procurez-vous un fichier **GeoJSON** du pays ou du découpage voulu (une zone par département,
   région, province…), idéalement déjà simplifié. Vérifiez sa licence.
2. Ouvrez `outils/convertir-carte.html` dans le navigateur, choisissez le fichier, indiquez quelle
   propriété contient le code et laquelle contient le nom, puis téléchargez `carte-<identifiant>.js`.
3. Placez ce fichier dans le sous-dossier de `data/` qui convient (`data/france/`, `data/monde/`…),
   ajoutez sa ligne `<script>` dans `index.html` (section « Cartes »), puis référencez-le dans une
   catégorie : `carte: '<identifiant>'`.

Limites : la projection de cet outil est adaptée aux pays et aux régions, pas aux cartes du monde entier
ni aux pays à cheval sur l'antiméridien (les cartes du monde sont fabriquées par `outils/construire-monde.html`,
en projection Equal Earth). Les territoires éloignés doivent être exclus
(champ « Codes à exclure » de l'outil), sinon la carte devient minuscule ; on peut ensuite les ajouter en
encadrés, comme le fait `outils/ajouter-outre-mer.js` pour la France.

## Outre-Mer

La carte de France contient les cinq DOM (971 Guadeloupe, 972 Martinique, 973 Guyane, 974 La Réunion,
976 Mayotte) dans des encadrés : Atlantique en bas à gauche, océan Indien en bas à droite, chacun à sa
propre échelle. Dans le jeu :

- mode « Par nombre » : la case « Inclure les départements d'Outre-Mer » les ajoute au tirage (le curseur
  passe de 96 à 101) ; décochée, ils sont masqués ;
- mode « Par régions » : la région « Outre-Mer » les regroupe ;
- mode « Apprendre » : ils sont toujours affichés et cliquables, comme les départements métropolitains.

Pour régénérer les encadrés (par exemple pour changer leur position) : modifiez `ENCADRES` dans
`outils/ajouter-outre-mer.js`, puis lancez
`node outils/ajouter-outre-mer.js departements-avec-outre-mer.geojson data/france/carte-departements.js`
(le GeoJSON se trouve dans le dépôt france-geojson).

## Données et crédits

Carte de France : contours IGN Admin Express (édition 2018) et INSEE, via
[gregoiredavid/france-geojson](https://github.com/gregoiredavid/france-geojson),
sous Licence Ouverte (Etalab). Ce crédit est aussi indiqué dans le fichier de la carte
et affiché dans le jeu.

Cartes du monde : [Natural Earth](https://www.naturalearthdata.com) (domaine public). Population des pays :
Banque mondiale (CC BY 4.0). Superficies : [mledoze/countries](https://github.com/mledoze/countries) (ODbL).

## Versions

Numérotation **MAJEUR.MINEUR.CORRECTIF** commune à tous les jeux (règles : « Versions » dans le
[README à la racine](../README.md#versions)). À chaque nouvelle version : une ligne ici, et le numéro dans
`../COMMUN/jeux.js` (ligne `geonohyne`), d'où il s'affiche en bas du menu, dans le menu « Jeux » et sur la
page d'accueil.

| Version | Date | Changements |
|---|---|---|
| 2.0.0 | 28/10/2026 | Refonte « Atlas en relief » : thème sombre, polices locales, menu en chapitres avec une carte en relief par chapitre (régions, monde, fleuves, votre réussite), menu du compte déroulant sur le modèle du menu « Jeux », partie avec parcours, compteurs, série et étiquette « +1 ». |
| 1.x | avant le 28/10/2026 | Versions non numérotées : GéoQuiz, puis GéoNohyne Quizz (menu en carrousel, thème clair / sombre). |
