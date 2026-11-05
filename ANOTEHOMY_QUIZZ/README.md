# Anotehomy Quizz

Apprendre l'anatomie humaine en jouant, sur un modèle 3D, avec la nomenclature anatomique
internationale **TA2** (Terminologia Anatomica 2). HTML, CSS et JavaScript purs (rendu 3D : Three.js,
fourni dans le dossier) : rien à installer, aucune connexion Internet nécessaire.

Anotehomy Quizz fait partie du dossier des jeux (voir le [README à la racine](../README.md)) : il partage
avec les autres jeux les **comptes** (nom + mot de passe) et le serveur facultatif qui permet de jouer à
plusieurs sur un réseau.

**Version 2.5.0** (numérotation MAJEUR.MINEUR.CORRECTIF : voir « Versions » dans le
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
                            résultats, statistiques, bouton de compte, menu du compte
CREDITS.md                  crédits et licences (modèles 3D, Three.js, polices, algorithmes)
css/                        apparence, un fichier par partie de l'écran (base, layout, panel, stage, skeleton,
                            home, setup, results, account, responsive)
css/polices/                polices du thème (Bricolage Grotesque, IBM Plex Mono ; licence OFL)
img/                        planches des chapitres du menu (images figées du modèle 3D), trame du fond
js/main.js                  point d'entrée : menu immédiat, chargement du modèle 3D au lancement d'une partie,
                            raccourcis clavier
js/core/                    espace de noms AQ, utilitaires
js/data/                    données : zones du corps, catalogue des os, découpage des os, catalogues des muscles,
                            des vaisseaux et des organes, organes découpés en parties (splanchnology.js),
                            catalogue du menu (games.js), modèles 3D compressés (*-model.js, générés),
                            pathologies (pathologies.js) et morphèmes médicaux (morphemes.js) des jeux de
                            vocabulaire
js/data/splanchno/          un modèle 3D par organe détaillé (splanchnologie descriptive, généré)
js/engine/                  moteur 3D : modèle, scène, caméra, surbrillance, interactions, os isolé, muscles,
                            vaisseaux et organes (fabrique commune systems.js), organe isolé (splanchno.js)
js/game/                    logique de jeu : menu, correction des réponses, configuration, partie, résultats,
                            révision, et un adaptateur par jeu (skeleton-game.js, osteo-game.js, muscle-game.js,
                            vessel-game.js, organ-game.js, splanchno-game.js) ; jeu des termes médicaux, sans 3D
                            vocabulaire, sans 3D (lexique-*.js : moteur commun, modes Devinette et QCM,
                            suggestions, un fichier par jeu)
js/account/profile.js       statistiques du joueur (invité ou compte commun)
js/account/account.js       bouton de compte, menu du compte, écran des statistiques
js/vendor/three.min.js      Three.js r158 (licence MIT)
tools/                      (facultatif) régénération des modèles 3D, voir tools/README.md
```

## Le menu

Même construction que le menu de GéoNohyne Quizz (`js/game/home.js`, catalogue `js/data/games.js`) :

- **Trois chapitres** :
  1. **Le corps humain** : **Ostéologie des humains** (les os du squelette, l'ostéologie descriptive),
     les muscles, les vaisseaux sanguins, **Splanchnologie des humains** (les organes, la splanchnologie
     descriptive : les parties de chaque organe, comme l'ostéologie pour les os) ; annoncés : les nerfs ;
  2. **La langue médicale** : **les pathologies** (reconnaître une maladie à sa description), **les termes
     médicaux** (les briques du vocabulaire médical : préfixes,
     radicaux, suffixes) ;
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
(« Chargement du modèle 3D… »), les os détaillés (ostéologie), les muscles, les vaisseaux et les organes au premier lancement du jeu
concerné, chaque organe détaillé (splanchnologie descriptive) quand il est tiré ou choisi. Dès qu'on quitte la partie (menu, configuration), l'affichage 3D est **mis en pause** : rien ne
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
  vaisseaux ; en cyan pour les organes) ; on tape son nom dans le
  panneau de gauche, puis Valider (ou Entrée). « Passer » compte la question comme ratée.
  **Autocomplétion** (option) : dès 2 caractères, les noms TA2 de **tous** les éléments du jeu (pas
  seulement ceux de la partie, pour ne pas donner d'indice), la saisie surlignée même tapée sans accent ;
  flèches pour choisir, Tab ou Entrée pour insérer, Échap pour fermer.
- **Ciblage** : le nom TA2 (et le nom latin) s'affiche ; on clique sur l'élément, directement sur le
  modèle 3D. La vue se tourne d'elle-même vers une face où l'élément est visible. « Je ne sais pas »
  montre la réponse.
- **Retour immédiat** : correct ou non, la bonne réponse et son nom latin, une note éventuelle (faute de
  frappe, ancien terme, numéro ou côté faux). Question suivante après 2,2 s (bonne réponse), 3,5 s (avec
  une note) ou 6,5 s (erreur) ; **Entrée** ou « Suivant » passent tout de suite.
- **« Terminer la partie »** (panneau de gauche) arrête la partie et affiche les résultats.
- **Résultats** : pourcentage de réussite (anneau), score en points, bonnes réponses, temps ; liste des
  erreurs et des réponses acceptées avec une faute, chacune avec « Voir » (révision de cet élément) :
  seules les **3 dernières** de chaque liste s'affichent, les autres derrière un bouton « Voir les N
  autres erreurs ».
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

## Jeu 5 : Les organes

Reconnaître et localiser les organes sur le corps en 3D (carte « Splanchnologie des humains »). Code :
`js/game/organ-game.js`, `js/game/organ-setup.js`, moteur `js/engine/organs.js`, catalogue
`js/data/organs.js`.

- **205 organes** (192 dans le corps masculin, 196 dans le corps féminin), dont 103 principaux, dans
  9 **appareils** : digestif (de la langue au côlon sigmoïde, foie, pancréas, glandes salivaires…),
  respiratoire (cavité nasale, cartilages du larynx, trachée, bronches, lobes des poumons), urinaire,
  génital, glandes endocrines, organes lymphoïdes (rate, thymus, tonsilles et 39 groupes de nœuds
  lymphatiques), cœur (cavités, valves), encéphale et moelle (lobes, sillons, noyaux gris, ventricules,
  tronc cérébral, cervelet, moelle spinale), organes des sens (œil, voies lacrymales, oreille moyenne et
  interne).
- **Sexe du corps** : masculin ou féminin (réglage partagé avec la splanchnologie descriptive). Le corps
  féminin remplace les organes génitaux masculins, la vessie, l'urètre et les uretères par leurs
  équivalents féminins : ovaires, trompes utérines, utérus, vagin, ligaments de l'utérus et de l'ovaire,
  clitoris, bulbes du vestibule, glandes vestibulaires majeures, glandes mammaires, vessie, urètre
  féminin, uretères prolongés jusqu'à la vessie.
- **Organes proposés** : principaux seulement, ou tous. Les organes des appareils non cochés, et ceux de
  l'autre sexe, sont **cachés** pendant la partie, ne sont pas cliquables et ne sont pas proposés par
  l'autocomplétion.
- Chaque organe a sa couleur (foie brun, vésicule verte, ventricules cérébraux bleus…) ; la cible est
  **cyan**. Le squelette est affiché en transparence.
- **Nommage** : un organe caché par d'autres (cristallin dans l'œil, noyaux gris dans le cerveau…) est
  dégagé automatiquement. **Ciblage** : un organe caché est signalé (**Maj + clic** écarte un organe
  gênant).
- Le modèle Z-Anatomy est **masculin**. Les organes féminins viennent des organes de référence de la
  femme du **Human Reference Atlas** (HuBMAP), recalés dans le bassin du modèle (similitude ajustée sur la
  symphyse pubienne, le promontoire et le coccyx) et sur le thorax (glandes mammaires). Le clitoris, les
  bulbes du vestibule, les glandes vestibulaires majeures et l'urètre féminin, absents des deux modèles,
  sont **générés** (formes simples placées d'après la symphyse, les rameaux ischio-pubiens et l'orifice du
  vagin). Le bassin osseux reste celui du modèle masculin.
- Le grand omentum, la plèvre, le péritoine et le ligament large de l'utérus ne sont pas repris (ils
  cacheraient tout le reste ; le ligament large est en splanchnologie descriptive).

## Jeu 6 : Splanchnologie descriptive

Nommer et situer les parties d'un organe, comme l'ostéologie descriptive pour les os (carte
« Splanchnologie des humains »). Code : `js/game/splanchno-game.js`, `js/game/splanchno-setup.js`,
moteur `js/engine/splanchno.js`, catalogue `js/data/splanchnology.js`, un modèle par organe dans
`js/data/splanchno/`.

- **20 organes détaillés, 335 parties** : duodénum et pancréas (têtes, col, corps, queue, conduits,
  parties du duodénum), foie (8 segments, vésicule, cholédoque), gros intestin (cæcum, côlons, angles,
  rectum, valve iléo-cæcale), larynx (cartilages, os hyoïde), trachée et bronches (jusqu'aux bronches
  segmentaires), poumons droit et gauche (segments, hile), rein (capsule, cortex, colonnes, pyramides,
  papilles, calices, pelvis, hile), vessie, organes génitaux masculins, utérus et annexes (fond, corps,
  col, trompes, ovaires, ligaments, vagin), glande mammaire, rate (faces, hile), nœud lymphatique,
  cœur (cavités, valves, artères et veines coronaires, gros vaisseaux), hémisphère cérébral (gyrus et
  sillons), tronc cérébral et cervelet (lobules, vermis), noyaux gris et ventricules, bulbe de l'œil
  (tuniques, milieux transparents, muscles), oreille (tympan, osselets, cochlée, vestibule).
- **Organe étudié** : tiré au hasard parmi des appareils (jamais deux fois de suite le même), ou choisi
  dans une liste ; **sexe du corps** partagé avec le jeu des organes (utérus et glande mammaire : corps
  féminin ; organes génitaux masculins : corps masculin).
- L'organe est affiché **seul, à une taille commune** (un nœud lymphatique aussi grand que le cœur),
  chaque partie dans sa couleur. **Nommage** : une partie cachée par d'autres (pyramides sous la capsule
  du rein, cristallin dans l'œil…) est dégagée automatiquement. **Ciblage** : une partie cachée est
  signalée (**Maj + clic** écarte une partie gênante).
- Résultats : « Explorer l'organe » (toutes ses parties, une à une), « Autre organe au hasard »,
  « Rejouer cet organe ». L'autocomplétion propose les parties de tous les organes (aucun indice).
- Modèles : organes de référence de la femme du Human Reference Atlas (HuBMAP) pour la plupart (organes
  communs aux deux sexes compris), Z-Anatomy pour le foie, le larynx, les bronches, l'encéphale,
  l'oreille et les organes génitaux masculins.

## Jeux de vocabulaire (sans 3D) : moteur commun

« Les pathologies » (jeu 7) et « Les termes médicaux » (jeu 8), chapitre « La langue médicale », n'ont
pas de 3D : ils ont leurs propres écrans (configuration, partie, résultats), communs aux deux, et rien ne
se charge derrière. Code : `js/game/lexique-game.js` (moteur : écrans, filtres, déroulement, résultats,
statistiques ; interface d'un jeu et d'un mode décrite en tête), `js/game/lexique-devinette.js` et
`js/game/lexique-qcm.js` (les deux modes), `js/game/lexique-suggest.js` (suggestions de saisie),
`css/lexique.css` ; un fichier par jeu : `js/game/lexique-pathologies.js`, `js/game/lexique-morphemes.js`
(données, filtres, indices, correction, choix des mauvaises propositions).

- **Configuration** : les **filtres** du jeu (cases à cocher, « Tout » / « Aucun »), **croisés** : un
  élément est proposé s'il remplit tous les filtres, et le nombre à côté de chaque case tient compte des
  autres (une case sans élément est estompée) ; nombre de questions, **mode de jeu** et ses options.
  Chaque jeu garde ses propres réglages pendant la session.
- **Mode Devinette** : la question (définition, description) au centre de l'écran, avec trois indices ;
  on écrit la réponse, puis Valider (ou Entrée). « Passer » compte la question comme ratée.
  **Suggestions de saisie** (option) : dès 2 caractères, au plus 5, par ordre alphabétique, sans tenir
  compte des accents, majuscules, tirets ni parenthèses ; flèches pour choisir, Tab ou Entrée pour
  insérer, Échap pour fermer. Tolérance aux fautes de frappe (option) : mêmes règles que les autres
  jeux (7 points au lieu de 10).
- **Mode QCM** : la question et ses indices, puis **2 à 6 propositions** (réglage de la configuration,
  4 par défaut) ; clic, ou touches **1** à **6**. Après la réponse, la bonne proposition est en menthe,
  celle choisie à tort en rouge, avec son sens ; « Passer » montre la bonne réponse. Les mauvaises
  propositions sont **proches de la réponse** (critères propres à chaque jeu, du plus proche au plus
  lointain), jamais deux propositions interchangeables, et la bonne réponse d'une question n'est proposée
  dans aucune des **3 questions suivantes** (`RECENT` dans `js/game/lexique-qcm.js`).
- **Retour immédiat** : la fiche de l'élément. Question suivante après 3,5 s (bonne réponse), 5 s (avec
  une remarque) ou 9 s (erreur) ; **Entrée** ou « Suivant » passent tout de suite.
- **Résultats** : comme les autres jeux (anneau, score, temps, erreurs et réponses acceptées avec une
  remarque, les 3 dernières affichées et les autres derrière un bouton) ; Menu principal, Nouvelle configuration, Rejouer. Statistiques par mode (« Devinette »,
  « QCM »), éléments les plus ratés dans « à revoir ».
- **Ajouter un jeu de vocabulaire** : un fichier `js/game/lexique-<jeu>.js` qui appelle `registerLexique`
  (interface en tête de `js/game/lexique-game.js`), son `<script defer>` après `lexique-qcm.js`, et sa
  carte dans `js/data/games.js`. **Ajouter un mode** : un fichier qui appelle `registerLexMode`.

## Jeu 7 : Les pathologies

Reconnaître une maladie à sa **description** (« Nécrose d'une partie du muscle cardiaque, une artère
coronaire s'étant bouchée » : infarctus du myocarde). Données : `js/data/pathologies.js` ; code :
`js/game/lexique-pathologies.js`.

- **494 pathologies**, chacune avec sa spécialité (19), son mécanisme (infectieux, tumoral,
  auto-immun… : 16), sa **difficulté** (1 : très connue du grand public, 2 : connue avec quelques
  notions, 3 : réservée aux soignants et aux études avancées), une description, ses autres noms (sigles,
  noms courants) et ses anciens termes. Le nom (`nom`) sert de clé aux statistiques : ne plus le changer.
- **Filtres croisés : difficulté ET spécialités** : « Cardiologie » parmi les difficiles, ou toutes les
  spécialités parmi les très connues… Par défaut : très connues et un peu connues, toutes les
  spécialités (348 pathologies).
- **Indices** : spécialité, mécanisme, difficulté.
- **Devinette** : majuscules, accents, ponctuation et petits mots (de, du, la, des…) ne comptent pas
  (« infarctus myocarde » = « Infarctus du myocarde ») ; les **autres noms** sont acceptés (« HTA »,
  « crise cardiaque ») ; les **anciens termes** et éponymes (« apoplexie », « mongolisme ») sont reconnus
  mais **comptés faux**, avec le nom à employer, comme les anciens termes anatomiques des autres jeux ; une
  autre pathologie est signalée avec sa description. Suggestions : toutes les pathologies et leurs autres
  noms (pas seulement celles de la configuration : aucun indice), celles qui commencent par la saisie
  d'abord, puis celles dont un mot commence par la saisie (« myoc » : « Myocardite », « Infarctus du
  myocarde ») ; jamais les anciens termes.
- **QCM** : mauvaises propositions de **même spécialité et même difficulté**, puis même spécialité, puis
  même mécanisme et même difficulté, puis même difficulté. En pratique, toutes de la même spécialité
  (sauf si la spécialité choisie en compte trop peu : nutrition, 8 pathologies).
- **Fiche** : nom, spécialité, mécanisme, difficulté, autres noms acceptés, anciens termes à ne plus
  employer.

## Jeu 8 : Les termes médicaux

Les briques du vocabulaire médical : retrouver le **morphème** (préfixe, radical ou suffixe) qui correspond
à une définition, « hépat(o)- » pour « Foie », « -ite » pour « Inflammation ». Données :
`js/data/morphemes.js` ; code : `js/game/lexique-morphemes.js`.

- **Filtre** : types de morphèmes (préfixes, radicaux, suffixes). **Indices** : type, langue d'origine,
  thème. **Fiche** : forme, type, origine et 2 ou 3 exemples de mots réels.
- **751 morphèmes** : 125 préfixes, 410 radicaux, 216 suffixes, chacun avec son sens, son origine
  (grecque, latine…), son thème et 2 ou 3 exemples de mots réels. **26 thèmes** (appareil digestif, œil
  et vision, médicaments, position et direction…), groupés en 4 familles (anatomie, biologie, médecine,
  description) : `MORPHEME_THEMES`, en bas du fichier. Les données sont un tableau JSON rangé
  dans un fichier `.js` : un navigateur refuse de lire un fichier `.json` local, et le jeu doit marcher
  en ouvrant directement `index.html`. La forme (`morpheme`) sert de clé aux statistiques : ne plus la
  changer.
- **Mode Devinette** : la définition s'affiche au centre de l'écran, avec trois indices (type, langue
  d'origine, thème) ; on écrit le morphème, puis Valider (ou Entrée). « Passer » compte la question comme
  ratée.
  - **Suggestions de saisie** (option) : dès 2 caractères, au plus 5 morphèmes (des types choisis : tous,
    pas seulement ceux de la partie), par ordre alphabétique, seulement ceux qui **commencent** par la
    saisie. Accents, majuscules, tirets et parenthèses ne comptent pas : « hepa » trouve « hépat(o)- »,
    « ite » trouve « -ite », « com » trouve « co-, con-, com- ». Flèches pour choisir, Tab ou Entrée pour
    insérer, Échap pour fermer.
  - **Correction** : « hepato », « hepat » et « hépat(o)- » valent « hépat(o)- » (voyelle de liaison
    facultative). Un autre morphème de **même sens et même type** est accepté, avec la forme attendue en
    rappel (« ten(o)- » pour « tendin(o)- », « Tendon ») ; de même sens mais d'un autre type, il est
    compté faux, avec l'explication (« -cyte » est un suffixe, on attendait le radical « cyt(o)- ») ; un
    autre morphème est signalé avec son sens. Tolérance aux fautes de frappe (option) : mêmes règles que
    les autres jeux (7 points au lieu de 10).
  - **Retour immédiat** : la fiche du morphème (forme, type, origine) et ses exemples (délais : voir le
    moteur commun ci-dessus).
- **Mode QCM** : la définition et ses indices, puis **2 à 6 propositions** (réglage de la configuration,
  4 par défaut) ; clic, ou touches **1** à **6**. Après la réponse, la bonne proposition est en menthe,
  celle choisie à tort en rouge, avec son sens ; « Passer » montre la bonne réponse.
  - **Mauvaises propositions** : du **même thème et du même type** que la réponse d'abord (pour « Cœur » :
    « thromb(o)- », « artér(io)- », « phléb(o)- »…), puis de la même famille de thèmes et du même type,
    puis du même thème, puis du même type. En pratique, 95 à 99 % sont du même thème, toutes du même
    type. Jamais deux propositions de même sens (pas de seconde bonne réponse).
  - **Pas de réponse récente** : la bonne réponse d'une question n'est proposée dans aucune des
    **3 questions suivantes** (`RECENT` dans `js/game/lexique-qcm.js`).

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

- **Bouton de compte** en haut à gauche (menu, configuration et résultats) : il affiche l'initiale et le
  nom du joueur (« Invité » ou le compte connecté), et ouvre le **menu du compte** : un menu déroulant
  juste en dessous, construit comme le menu « Jeux » d'en face (un titre, le joueur, des lignes d'action
  avec leur pictogramme, une note). Il se ferme d'un clic ailleurs ou avec **Échap**.
- **Comptes** (seulement quand le jeu est ouvert depuis le serveur) : nom + mot de passe (4 caractères au
  moins), **communs à tous les jeux du dossier** : un compte créé ici sert aussi dans GéoNohyne Quizz, et
  inversement. À l'arrivée, le menu s'ouvre seul et propose de se connecter, de créer un compte ou de
  continuer en invité (une fois par session du navigateur, tous jeux confondus). La connexion est mémorisée et
  partagée par les jeux : on reste connecté en changeant de jeu.
- **Menu du compte** connecté : mes statistiques, renommer, changer le mot de passe (les autres
  appareils devront se reconnecter), se déconnecter, supprimer le compte (mot de passe demandé ; le compte
  et ses statistiques disparaissent de **tous** les jeux).
- **Invité** : toujours possible ; statistiques gardées dans ce navigateur (`localStorage`, clé
  `anotehomy.profil`). À la création d'un compte, une case permet de **reprendre les statistiques de
  l'invité**.
- **Ce qui est enregistré** : chaque partie terminée (ou interrompue, marquée comme telle) : jeu, mode,
  configuration (zones, os étudié), bonnes réponses, score, temps.
- **Écran des statistiques** (ligne « Mes statistiques » du menu du compte) :
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
Un **jeu sans 3D** n'a pas d'adaptateur : il déclare ses écrans dans `AQ.game.SCREENS`
(`js/game/state.js` : `{ open, close }`), que le menu ouvre à la place de la configuration commune, et
passe sa propre session à `AQ.account.saveGame` (modèle : `js/game/lexique-game.js`).
Un nouveau chapitre se déclare dans `CHAPTERS` (`js/data/games.js`) et sa planche dans `PLANCHES`
(`js/game/home.js` : image de `img/`, repères en pourcentage de l'image, légende).

## Modèles 3D, outils et crédits

- Squelette et os détaillés : **BodyParts3D** (DBCLS, CC BY 4.0) ; muscles, vaisseaux et organes :
  **Z-Anatomy** (CC BY-SA 4.0, `js/data/muscle-model.js`, `js/data/vessel-model.js` et
  `js/data/organ-model.js` sont donc distribués sous la même licence) ; organes féminins et la plupart
  des organes détaillés : **Human Reference Atlas** (HuBMAP, CC BY 4.0) ; rendu : **Three.js** (MIT) ;
  polices : **Bricolage Grotesque** et **IBM Plex Mono** (OFL). Détails et modifications : `CREDITS.md`.
- Les planches du menu (`img/chapitre-*.webp`) sont des rendus figés de ces modèles, faits une fois pour
  toutes dans le navigateur ; elles suivent la licence du modèle dont elles viennent (voir `CREDITS.md`).
- Les modèles compressés de `js/data/*-model.js` sont générés par les scripts de `tools/` (PowerShell +
  C#, rien à installer) : **inutiles pour jouer**, ils servent à changer le niveau de détail ou la liste
  des os, des muscles, des vaisseaux et des organes, et le découpage des organes détaillés. Mode
  d'emploi : `tools/README.md`.

## Versions

Numérotation **MAJEUR.MINEUR.CORRECTIF** commune à tous les jeux (règles : « Versions » dans le
[README à la racine](../README.md#versions)). À chaque nouvelle version : une ligne ici, et le numéro dans
`../COMMUN/jeux.js` (ligne `anotehomy`), d'où il s'affiche dans le menu « Jeux » et sur la page d'accueil.

| Version | Date | Changements |
|---|---|---|
| 2.5.0 | 05/11/2026 | Nouveau jeu **Les pathologies** (chapitre « La langue médicale », sans 3D) : 494 pathologies, filtres croisés **difficulté et spécialités** (19), modes Devinette (autres noms et sigles acceptés, anciens termes comptés faux, petits mots ignorés, suggestions par début de mot) et QCM (propositions de même spécialité et même difficulté). Les deux jeux de vocabulaire partagent désormais un même moteur (`js/game/lexique-*.js`). Tous les jeux : plus de temps pour lire la réponse (surtout après une erreur) ; en fin de partie, seules les 3 dernières erreurs sont affichées, les autres derrière un bouton. |
| 2.4.0 | 05/11/2026 | Nouveau jeu **Les termes médicaux** (chapitre « La langue médicale », sans 3D) : 751 morphèmes (préfixes, radicaux, suffixes) avec sens, origine et exemples ; 26 thèmes ; mode **Devinette** (la définition au centre de l'écran, le joueur écrit le morphème ; suggestions dès 2 caractères, 5 au plus, par ordre alphabétique, sans tenir compte des accents, tirets ni parenthèses) ; mode **QCM** (2 à 6 propositions du même thème, aucune bonne réponse des 3 questions précédentes parmi les propositions). |
| 2.3.0 | 31/10/2026 | Menu du compte (en haut à gauche) au même style que GéoNohyne Quizz : menu déroulant sous le bouton (titre, joueur, lignes d'action avec pictogramme, note), au lieu d'une fenêtre au centre de l'écran ; l'invité reprend son accent (« Invité »). Les organes : **sexe du corps** au choix (masculin ou féminin) ; 16 organes féminins (ovaires, trompes, utérus, vagin, ligaments, clitoris, bulbes du vestibule, glandes vestibulaires majeures, glandes mammaires, vessie, urètre et uretères féminins), tirés du Human Reference Atlas (HuBMAP, CC BY 4.0) recalé dans le bassin, ou générés. Nouveau jeu **Splanchnologie descriptive** : 20 organes découpés en 335 parties (foie, rein, cœur, poumons, encéphale, œil, utérus et annexes…), un organe affiché seul, au hasard ou choisi ; résultats avec exploration de l'organe. |
| 2.2.0 | 30/10/2026 | Nouveau jeu **Les organes** (192 organes dans 9 appareils, dont 97 principaux, modèle 3D Z-Anatomy) : la carte « Splanchnologie des humains » s'ouvre ; choix des appareils (les organes des autres appareils sont cachés et absents de l'autocomplétion), squelette en transparence, cible cyan. |
| 2.1.0 | 30/10/2026 | Groupes de jeux : « Ostéologie des humains » (les os du squelette, ostéologie descriptive) et « Splanchnologie des humains » (organes, splanchnologie descriptive) n'ont plus qu'une carte, qui ouvre une fenêtre coupée en deux pour choisir le jeu ; « Les termes médicamenteux » deviennent « Les termes médicaux » (tout le vocabulaire du milieu médical) ; nouveau jeu **Les vaisseaux sanguins** (279 artères et veines, dont 101 principales, modèle 3D Z-Anatomy, choix des zones et des artères et/ou veines, squelette et cœur en transparence) ; os ou partie d'os survolé bien plus visible (rose franc et contour lumineux, au lieu d'un blanc à peine plus clair). |
| 2.0.0 | 30/10/2026 | Refonte graphique complète, inspirée de GéoNohyne Quizz : thème « Planches anatomiques » (rose et blanc sur fond sombre), menu en trois chapitres (Le corps humain, La langue médicale, Apprendre la Vie) avec une planche tirée du modèle 3D ; jeux annoncés (organes, splanchnologie descriptive, nerfs, vaisseaux sanguins, pathologies, termes médicamenteux, module « Le corps humain ») ; configuration sur un seul écran, sans défilement ; 3D chargée au lancement de la partie et en pause hors des parties ; accents dans tous les textes et tous les noms (toujours facultatifs dans les réponses). |
| 1.0.0 | 28/10/2026 | Première version numérotée : les os du squelette, ostéologie descriptive (53 os détaillés), les muscles (194, dont 101 principaux), modes Nommage et Ciblage, comptes communs et statistiques. |
