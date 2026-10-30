# Anotehomy Quizz

Apprendre l'anatomie humaine en jouant, sur un modèle 3D, avec la nomenclature anatomique
internationale **TA2** (Terminologia Anatomica 2). HTML, CSS et JavaScript purs (rendu 3D : Three.js,
fourni dans le dossier) : rien à installer, aucune connexion Internet nécessaire.

Anotehomy Quizz fait partie du dossier des jeux (voir le [README à la racine](../README.md)) : il partage
avec les autres jeux les **comptes** (nom + mot de passe) et le serveur facultatif qui permet de jouer à
plusieurs sur un réseau.

**Version 2.1.0** (numérotation MAJEUR.MINEUR.CORRECTIF : voir « Versions » dans le
[README à la racine](../README.md#versions), et l'[historique](#versions) plus bas).

## Lancer le jeu

- **Seul, sur un ordinateur** : double-cliquez sur **`index.html`** (navigateur récent avec WebGL :
  Chrome, Edge, Firefox, Safari). On joue en invité (statistiques gardées dans le navigateur), sans comptes.
- **Avec les comptes** : double-cliquez sur **`game.bat`**, à la racine du dossier des jeux (Windows, il
  faut Python 3) : il lance le serveur des jeux et ouvre le navigateur. Ou, sur un NAS : lancez le serveur
  des jeux (voir le README à la racine) et ouvrez
  `http://<adresse-de-la-machine>:8080/ANOTEHOMY_QUIZZ/` (ou la page d'accueil `http://<adresse>:8080`,
  qui propose tous les jeux).
- **Changer de jeu** : bouton **« Jeux »** en haut à droite, sur le menu, la configuration et les
  résultats (jamais pendant une partie). On reste connecté dans l'autre jeu.

Anotehomy Quizz ne dépend d'aucun autre jeu. Du dossier commun `../COMMUN/`, il utilise seulement
`comptes.js` (les comptes), `jeux.js` et `jeux.css` (le bouton « Jeux ») : si ces fichiers manquent ou
plantent, le jeu se joue normalement, en invité et sans bouton « Jeux ».

## Contenu du dossier

Scripts classiques (pas de modules ES), chargés dans l'ordre par `index.html`, pour que le jeu marche en
ouvrant directement le fichier. Chaque fichier range ses fonctions dans l'espace de noms `window.AQ`
(`js/core/namespace.js`).

```
index.html                  page unique : écran de jeu (panneau latéral + scène 3D), menu, configuration,
                            résultats, statistiques, bouton de compte, fenêtre du compte
CREDITS.md                  crédits et licences (modèles 3D, Three.js, polices, algorithmes)
css/                        apparence, un fichier par partie de l'écran (base, layout, panel, stage, skeleton,
                            home, setup, results, account, responsive)
css/polices/                polices du thème (Bricolage Grotesque, IBM Plex Mono ; licence OFL)
img/                        planches des chapitres du menu (images figées du modèle 3D), trame du fond
js/main.js                  point d'entrée : menu immédiat, chargement du modèle 3D au lancement d'une partie,
                            raccourcis clavier
js/core/                    espace de noms AQ, utilitaires
js/data/                    données : zones du corps, catalogue des os, découpage des os, catalogues des muscles
                            et des vaisseaux,
                            catalogue du menu (games.js), modèles 3D compressés (*-model.js, générés)
js/engine/                  moteur 3D : modèle, scène, caméra, surbrillance, interactions, os isolé, muscles,
                            vaisseaux
js/game/                    logique de jeu : menu, correction des réponses, configuration, partie, résultats,
                            révision, et un adaptateur par jeu (skeleton-game.js, osteo-game.js, muscle-game.js,
                            vessel-game.js)
js/account/profile.js       statistiques du joueur (invité ou compte commun)
js/account/account.js       bouton de compte, fenêtre du compte, écran des statistiques
js/vendor/three.min.js      Three.js r158 (licence MIT)
tools/                      (facultatif) régénération des modèles 3D, voir tools/README.md
```

## Le menu

Même construction que le menu de GéoNohyne Quizz (`js/game/home.js`, catalogue `js/data/games.js`) :

- **Trois chapitres** :
  1. **Le corps humain** : **Ostéologie des humains** (les os du squelette, l'ostéologie descriptive),
     les muscles, les vaisseaux sanguins ; annoncés : **Splanchnologie des humains** (les organes, la
     splanchnologie descriptive : les parties de chaque organe, comme l'ostéologie pour les os), les nerfs ;
  2. **La langue médicale** : annoncés : les pathologies, les termes médicaux (le vocabulaire du milieu
     médical) ;
  3. **Apprendre la Vie** : annoncé : le module « Le corps humain » (explorer librement le corps et
     consulter la fiche de chaque élément).
- À droite, la **planche du chapitre** : une image figée tirée du modèle 3D (squelette, crâne, écorché),
  avec quelques repères et une légende. Les planches sont des images : **aucune 3D ne tourne dans le
  menu**.
- Dessous, les **cartes** du chapitre : un clic ouvre la configuration du jeu. Les jeux annoncés restent
  grisés (« Bientôt »). Les jeux d'un même **groupe** (`group` dans `js/data/games.js`) n'ont qu'une
  carte : un clic ouvre une fenêtre coupée en deux, une moitié par jeu (Échap ou un clic à côté la
  referme).
- Le dernier chapitre affiché est mémorisé (clé `anotehomy.menu.chapitre`) ; les flèches **←** **→**
  changent de chapitre.

## Déroulement d'une partie

1. **Menu** : choisir un chapitre, puis un jeu.
2. **Configuration**, sur un seul écran, sans défilement : à gauche ce qu'il faut trouver (zones du corps,
   os étudié…) et le **nombre de questions** (le nombre en grand, − et +, curseur, raccourcis 5, 10, 20,
   30 et « Tous ») ; à droite la façon de jouer (**Nommage** ou **Ciblage**), les options, la
   nomenclature et « Lancer la partie ». Sur téléphone, les deux colonnes s'empilent et l'écran défile.
3. **Partie** : une question à la fois, retour immédiat après chaque réponse.
4. **Résultats**, puis **révision** libre sur le modèle 3D.

**La 3D ne démarre qu'au lancement d'une partie** : le squelette se charge au premier lancement
(« Chargement du modèle 3D… »), les os détaillés (ostéologie), les muscles et les vaisseaux au premier lancement du jeu
concerné. Dès qu'on quitte la partie (menu, configuration), l'affichage 3D est **mis en pause** : rien ne
tourne en arrière-plan.

## Apparence

Thème « Planches anatomiques » : sombre (prune profond), **rose framboise et blanc rosé** (le sang, les
planches), menthe pour ce qui est juste, pêche pour le temps et les avertissements. Fond : papier
d'électrocardiogramme (petits et grands carreaux), tracés cardiaques et globules très discrets
(`img/trame.svg`). Polices locales : Bricolage Grotesque (textes) et IBM Plex Mono (repères, petites
capitales). Les animations s'effacent si le système demande de réduire les mouvements.

## Nomenclature TA2 et correction des réponses

Toutes les réponses utilisent les **noms français de la TA2** ; le nom latin TA2 est aussi accepté.
Les **anciens termes** (rotule, péroné, omoplate, astragale, grand fessier, trochiter…) sont reconnus et
signalés, mais **comptés faux**.

- Les noms s'affichent avec leurs accents, mais **majuscules, accents, ligatures, ponctuation, tirets et
  apostrophes ne comptent pas** : « femur » = « fémur », « oeil » = « œil ». L'article du début, le mot
  « os » ou « muscle » en tête peuvent être omis (« muscle grand dorsal » = « grand dorsal »).
- Les prépositions sont ignorées et les adjectifs d'os ramenés au nom de l'os : « trochlée humérale » =
  « trochlée de l'humérus », « tubérosité tibiale » = « tubérosité du tibia ».
- **Tolérance aux fautes de frappe** (option, cochée par défaut) : 0 faute pour un nom de 4 lettres au
  plus, 1 jusqu'à 7 lettres, 2 jusqu'à 12, 3 au-delà (une inversion de deux lettres = une faute).
- La réponse est comparée à **tous** les noms connus du jeu (actuels et anciens) : elle n'est juste que si
  le nom le plus proche est un nom TA2 de l'élément demandé. Nommer un autre élément est signalé (« vous
  avez nommé un autre os : … »).
- **Score** : 10 points par bonne réponse, 7 si elle a été acceptée avec une faute de frappe.

Code : `js/game/matcher.js`.

## Modes de jeu (communs à tous les jeux)

- **Nommage** : un élément s'illumine (en rouge ; en bleu pour les muscles ; en jaune pour les
  vaisseaux) ; on tape son nom dans le
  panneau de gauche, puis Valider (ou Entrée). « Passer » compte la question comme ratée.
  **Autocomplétion** (option) : dès 2 caractères, les noms TA2 de **tous** les éléments du jeu (pas
  seulement ceux de la partie, pour ne pas donner d'indice), la saisie surlignée même tapée sans accent ;
  flèches pour choisir, Tab ou Entrée pour insérer, Échap pour fermer.
- **Ciblage** : le nom TA2 (et le nom latin) s'affiche ; on clique sur l'élément, directement sur le
  modèle 3D. La vue se tourne d'elle-même vers une face où l'élément est visible. « Je ne sais pas »
  montre la réponse.
- **Retour immédiat** : correct ou non, la bonne réponse et son nom latin, une note éventuelle (faute de
  frappe, ancien terme, numéro ou côté faux). Question suivante après 1,3 s (bonne réponse), 2,2 s (avec
  une note) ou 3,4 s (erreur) ; **Entrée** ou « Suivant » passent tout de suite.
- **« Terminer la partie »** (panneau de gauche) arrête la partie et affiche les résultats.
- **Résultats** : pourcentage de réussite (anneau), score en points, bonnes réponses, temps ; liste des
  erreurs et des réponses acceptées avec une faute, chacune avec « Voir » (révision de cet élément).
  Boutons : Menu principal, Nouvelle configuration, Rejouer.
- **Révision** : après « Voir », cliquer sur d'autres éléments pour les identifier (nom au survol) ; le
  panneau donne le nom latin, la zone, les anciens termes à ne plus utiliser et les parties connues.
  « Retour aux résultats » revient au bilan.

## Jeu 1 : Les os du squelette

Reconnaître et localiser chaque os du corps humain. Code : `js/game/skeleton-game.js`, catalogue
`js/data/bones.js`.

- **Zones du corps** (à cocher, « Tout » / « Aucun ») : membre inférieur, membre supérieur, vertèbres,
  crâne, pelvis, autre / squelette axial. Le nombre d'os disponibles s'affiche pour chaque zone.
- Un os pair ou en série est demandé sur une de ses instances, tirée au hasard (droite ou gauche, un
  niveau donné).
- **Os en série** (côtes, vertèbres) : le numéro, le niveau et le côté du corps sont lus dans la réponse :
  « 12e côte gauche », « douzième côte gauche », « vertèbre thoracique T9 », « T9 » ou « C4 » seuls. « D9 »
  (vertèbre dorsale) est l'ancienne nomenclature. Un bon os avec un mauvais numéro ou un mauvais côté est
  compté faux, avec un message.
- **Option « Exiger le numéro et le côté »** : sans elle, le nom général suffit (« côte ») et le nom
  précis est rappelé ; avec elle, une réponse sans numéro (ou sans côté) est « incomplète », donc fausse,
  et en Ciblage il faut cliquer exactement sur l'instance demandée.

## Jeu 2 : Ostéologie descriptive

Nommer et localiser les parties d'un os : reliefs et repères (processus, fosses, incisures,
tubérosités…). Code : `js/game/osteo-game.js`, `js/game/osteo-setup.js`, découpage `js/data/osteology.js`
et `js/engine/segment.js`.

- **Os à étudier** : **tiré au hasard** parmi les zones cochées, ou **choisi** dans la liste (53 os
  détaillés, groupés par zone ; un os pair est montré du côté droit, un niveau représentatif pour les
  vertèbres et les côtes). L'os est affiché **seul**, découpé en parties, et rappelé en permanence dans le
  panneau et sur la vue 3D.
- **Nombre de parties** à trouver : au plus le nombre de parties de l'os (variable selon l'os tiré).
- **Os voisins estompés** (option, ou touche **V** pendant la partie) : situe l'os dans le squelette.
- **Résultats** : en plus des boutons communs, « Rejouer cet os », « Autre os au hasard » (os tiré au
  hasard) et « Explorer l'os » : révision avec l'**atlas** (une couleur par partie, touche **C**), parties
  cliquables.
- Le découpage en parties est une approximation pédagogique réalisée pour ce projet (voir CREDITS.md).

## Jeu 3 : Les muscles du corps humain

Reconnaître et localiser les muscles sur le corps en 3D. Code : `js/game/muscle-game.js`,
`js/game/muscle-setup.js`, catalogue `js/data/muscles.js`.

- **194 muscles**, dont **101 principaux** (les muscles classiques des cours d'anatomie), dans 8 zones :
  tête, cou, dos et nuque, thorax, abdomen, pelvis et périnée, membre supérieur, membre inférieur.
- **Muscles proposés** : principaux seulement, ou tous (y compris les petits muscles et les muscles
  profonds).
- **Nommage** : le muscle (un côté au hasard) s'allume en bleu ; s'il est en partie caché, les muscles
  qui le recouvrent sont masqués automatiquement.
- **Ciblage** : rien n'est masqué (ce serait un indice), mais un muscle profond est signalé :
  **Maj + clic** écarte un muscle qui en cache un autre ; « Tout afficher » les fait réapparaître.
- Chefs et parties d'un muscle forment un seul objet cliquable par côté du corps.

## Jeu 4 : Les vaisseaux sanguins

Reconnaître et localiser les artères et les veines sur le corps en 3D. Code : `js/game/vessel-game.js`,
`js/game/vessel-setup.js`, moteur `js/engine/vessels.js`, catalogue `js/data/vessels.js`.

- **279 vaisseaux** (artères, veines et sinus veineux de la dure-mère), dont **101 principaux**, dans
  7 zones : tête et cou, encéphale, thorax et cœur, abdomen, pelvis et périnée, membre supérieur,
  membre inférieur.
- **Type** : artères et veines, artères seulement, ou veines seulement ; **vaisseaux proposés** :
  principaux seulement, ou tous (y compris les petites branches). Avec les artères seules (ou les veines
  seules), les vaisseaux de l'autre type sont cachés pendant la partie, ne sont pas cliquables et ne
  sont pas proposés par l'autocomplétion.
- **Couleurs** des atlas : artères en **rouge**, veines en **bleu** ; dans la circulation pulmonaire,
  c'est l'inverse (artères pulmonaires en bleu, veines pulmonaires en rouge). La cible est **jaune**.
- Le **squelette** et le **cœur** sont affichés **en transparence** : on voit les vaisseaux à travers les
  os (artères cérébrales dans le crâne, vaisseaux du bassin…). Ils ne sont pas cliquables.
- Les vaisseaux sont fins : un clic **à quelques pixels** d'un vaisseau le sélectionne (le plus proche
  l'emporte).
- **Nommage** : le vaisseau (un côté au hasard) s'allume en jaune ; s'il est caché par d'autres
  vaisseaux, ceux-ci sont masqués automatiquement. **Ciblage** : rien n'est masqué, mais un vaisseau
  caché est signalé (**Maj + clic** écarte un vaisseau gênant).
- Les segments et les petites branches d'un vaisseau forment un seul objet cliquable par côté du corps
  (ex. l'artère cérébrale moyenne avec ses branches corticales).

## Commandes de la vue 3D

Le bouton **?** (ou la touche **H**) affiche l'aide ; elle s'ouvre seule à la première visite.

| Action | Souris | Tactile | Clavier |
|---|---|---|---|
| Tourner | glisser | 1 doigt | |
| Déplacer | clic droit + glisser, ou Ctrl + glisser | 2 doigts | |
| Zoomer | molette (vers le curseur) | pincer | **+** / **-** ; tout voir : **0** |
| Choisir un élément | clic | toucher | |
| Masquer un élément | Maj + clic | | |
| Vues antérieure, postérieure, latérales | boutons de la barre du bas | | **1** **2** **3** **4** |
| Question suivante | « Suivant » | | **Entrée** |

Barre du bas : vues, zoom, « voir tout », « recentrer sur l'élément en cours » et, en ostéologie, os
voisins (**V**) et atlas des parties (**C**, en révision).

## Compte et statistiques

- **Bouton de compte** en haut à gauche (menu, configuration et résultats) : il affiche « Invité » ou le
  nom du compte connecté, et ouvre la fenêtre du compte.
- **Comptes** (seulement quand le jeu est ouvert depuis le serveur) : nom + mot de passe (4 caractères au
  moins), **communs à tous les jeux du dossier** : un compte créé ici sert aussi dans GéoNohyne Quizz, et
  inversement. À l'arrivée, une fenêtre propose de se connecter, de créer un compte ou de continuer en
  invité (une fois par session du navigateur, tous jeux confondus). La connexion est mémorisée et
  partagée par les jeux : on reste connecté en changeant de jeu.
- **Fenêtre du compte** connecté : mes statistiques, renommer, changer le mot de passe (les autres
  appareils devront se reconnecter), se déconnecter, supprimer le compte (mot de passe demandé ; le compte
  et ses statistiques disparaissent de **tous** les jeux).
- **Invité** : toujours possible ; statistiques gardées dans ce navigateur (`localStorage`, clé
  `anotehomy.profil`). À la création d'un compte, une case permet de **reprendre les statistiques de
  l'invité**.
- **Ce qui est enregistré** : chaque partie terminée (ou interrompue, marquée comme telle) : jeu, mode,
  configuration (zones, os étudié), bonnes réponses, score, temps.
- **Écran des statistiques** (bouton « Mes statistiques » de la fenêtre du compte) :
  - totaux : parties, temps de jeu, taux de bonnes réponses, questions ;
  - **par jeu et par mode** : parties, réussite moyenne, **meilleure partie** (meilleure réussite, puis le
    plus de questions, puis le temps le plus court ; parties complètes seulement) ;
  - **à revoir** : pour chaque jeu, les éléments les plus ratés (« ratée 3 fois sur 4 ») ; ceux
    enregistrés avant la version 2.0.0 sous leur nom sans accent sont regroupés sous le nom actuel ;
  - **dernières parties** (les 500 dernières sont gardées) ;
  - « Effacer mes statistiques » (le compte est gardé).
- Les statistiques d'Anotehomy Quizz sont rangées dans l'espace `anotehomy` du compte, sur le serveur :
  **rien n'est public** (pas de classement pour l'instant), seul le joueur les voit. Les autres jeux n'y
  ont pas accès.
- **Hors ligne** : si le serveur ne répond plus un moment, on continue de jouer avec son compte ; les
  parties partent dès son retour (copie dans le navigateur, clé `comptes.donnees.anotehomy`).

## Ajouter un jeu dans Anotehomy Quizz

1. Ajouter son entrée dans `js/data/games.js` : son chapitre (`chapter`), `status: 'soon'` tant qu'il
   n'est pas prêt (la carte reste grisée, « Bientôt »), son pictogramme (`icon`) et sa couleur (`tint`),
   pris dans `ICONS` et `TINTS` de `js/game/home.js`, ses textes (`name`, `tagline`, `desc`, `meta`), et
   éventuellement son groupe (`group`, déclaré dans `GROUPS`). Le
   déclarer aussi dans `../COMMUN/jeux.js` (ligne `anotehomy`, `modes`).
2. Écrire son **adaptateur** dans `js/game/` (même interface que `js/game/osteo-game.js`, décrite en tête
   de ce fichier) et, si besoin, son bloc de configuration (`index.html` + un fichier `*-setup.js`).
3. Ajouter les `<script defer>` dans `index.html` (l'ordre compte), puis passer `status` à `'ready'`.

Le déroulement, la correction, les résultats et les statistiques sont communs : rien d'autre à écrire.
Un nouveau chapitre se déclare dans `CHAPTERS` (`js/data/games.js`) et sa planche dans `PLANCHES`
(`js/game/home.js` : image de `img/`, repères en pourcentage de l'image, légende).

## Modèles 3D, outils et crédits

- Squelette et os détaillés : **BodyParts3D** (DBCLS, CC BY 4.0) ; muscles et vaisseaux : **Z-Anatomy**
  (CC BY-SA 4.0, `js/data/muscle-model.js` et `js/data/vessel-model.js` sont donc distribués sous la même
  licence) ; rendu : **Three.js** (MIT) ;
  polices : **Bricolage Grotesque** et **IBM Plex Mono** (OFL). Détails et modifications : `CREDITS.md`.
- Les planches du menu (`img/chapitre-*.webp`) sont des rendus figés de ces modèles, faits une fois pour
  toutes dans le navigateur ; elles suivent la licence du modèle dont elles viennent (voir `CREDITS.md`).
- Les modèles compressés de `js/data/*-model.js` sont générés par les scripts de `tools/` (PowerShell +
  C#, rien à installer) : **inutiles pour jouer**, ils servent à changer le niveau de détail ou la liste
  des os, des muscles et des vaisseaux. Mode d'emploi : `tools/README.md`.

## Versions

Numérotation **MAJEUR.MINEUR.CORRECTIF** commune à tous les jeux (règles : « Versions » dans le
[README à la racine](../README.md#versions)). À chaque nouvelle version : une ligne ici, et le numéro dans
`../COMMUN/jeux.js` (ligne `anotehomy`), d'où il s'affiche dans le menu « Jeux » et sur la page d'accueil.

| Version | Date | Changements |
|---|---|---|
| 2.1.0 | 30/10/2026 | Groupes de jeux : « Ostéologie des humains » (les os du squelette, ostéologie descriptive) et « Splanchnologie des humains » (organes, splanchnologie descriptive) n'ont plus qu'une carte, qui ouvre une fenêtre coupée en deux pour choisir le jeu ; « Les termes médicamenteux » deviennent « Les termes médicaux » (tout le vocabulaire du milieu médical) ; nouveau jeu **Les vaisseaux sanguins** (279 artères et veines, dont 101 principales, modèle 3D Z-Anatomy, choix des zones et des artères et/ou veines, squelette et cœur en transparence) ; os ou partie d'os survolé bien plus visible (rose franc et contour lumineux, au lieu d'un blanc à peine plus clair). |
| 2.0.0 | 30/10/2026 | Refonte graphique complète, inspirée de GéoNohyne Quizz : thème « Planches anatomiques » (rose et blanc sur fond sombre), menu en trois chapitres (Le corps humain, La langue médicale, Apprendre la Vie) avec une planche tirée du modèle 3D ; jeux annoncés (organes, splanchnologie descriptive, nerfs, vaisseaux sanguins, pathologies, termes médicamenteux, module « Le corps humain ») ; configuration sur un seul écran, sans défilement ; 3D chargée au lancement de la partie et en pause hors des parties ; accents dans tous les textes et tous les noms (toujours facultatifs dans les réponses). |
| 1.0.0 | 28/10/2026 | Première version numérotée : les os du squelette, ostéologie descriptive (53 os détaillés), les muscles (194, dont 101 principaux), modes Nommage et Ciblage, comptes communs et statistiques. |
