# Anotehomy Quizz

Apprendre l'anatomie humaine en jouant, sur un modele 3D, avec la nomenclature anatomique
internationale **TA2** (Terminologia Anatomica 2). HTML, CSS et JavaScript purs (rendu 3D : Three.js,
fourni dans le dossier) : rien a installer, aucune connexion Internet necessaire.

Anotehomy Quizz fait partie du dossier des jeux (voir le [README a la racine](../README.md)) : il partage
avec les autres jeux les **comptes** (nom + mot de passe) et le serveur facultatif qui permet de jouer a
plusieurs sur un reseau.

**Version 1.0.0** (numerotation MAJEUR.MINEUR.CORRECTIF : voir "Versions" dans le
[README a la racine](../README.md#versions), et l'[historique](#versions) plus bas).

## Lancer le jeu

- **Seul, sur un ordinateur** : double-cliquez sur **`index.html`** (navigateur recent avec WebGL :
  Chrome, Edge, Firefox, Safari). On joue en invite (statistiques gardees dans le navigateur), sans comptes.
- **Avec les comptes** : double-cliquez sur **`game.bat`**, a la racine du dossier des jeux (Windows, il
  faut Python 3) : il lance le serveur des jeux et ouvre le navigateur. Ou, sur un NAS : lancez le serveur
  des jeux (voir le README a la racine) et ouvrez
  `http://<adresse-de-la-machine>:8080/ANOTEHOMY_QUIZZ/` (ou la page d'accueil `http://<adresse>:8080`,
  qui propose tous les jeux).
- **Changer de jeu** : bouton **"Jeux"** en haut a droite, sur les ecrans d'accueil, de configuration et
  de resultats (jamais pendant une partie). On reste connecte dans l'autre jeu.

Anotehomy Quizz ne depend d'aucun autre jeu. Du dossier commun `../COMMUN/`, il utilise seulement
`comptes.js` (les comptes), `jeux.js` et `jeux.css` (le bouton "Jeux") : si ces fichiers manquent ou
plantent, le jeu se joue normalement, en invite et sans bouton "Jeux".

## Contenu du dossier

Scripts classiques (pas de modules ES), charges dans l'ordre par `index.html`, pour que le jeu marche en
ouvrant directement le fichier. Chaque fichier range ses fonctions dans l'espace de noms `window.AQ`
(`js/core/namespace.js`).

```
index.html                  page unique : panneau lateral, scene 3D, ecrans superposes (accueil, configuration,
                            resultats, statistiques), bouton de compte, fenetre du compte
CREDITS.md                  credits et licences (modeles 3D, Three.js, algorithmes)
css/                        apparence, un fichier par partie de l'ecran (base, layout, panel, stage, home,
                            setup, results, account, responsive)
js/main.js                  point d'entree : accueil immediat, chargement du modele 3D, raccourcis clavier
js/core/                    espace de noms AQ, utilitaires
js/data/                    donnees : zones du corps, catalogue des os, decoupage des os, catalogue des muscles,
                            catalogue des jeux (games.js), modeles 3D compresses (*-model.js, generes)
js/engine/                  moteur 3D : modele, scene, camera, surbrillance, interactions, os isole, muscles
js/game/                    logique de jeu : correction des reponses, configuration, partie, resultats, revision,
                            et un adaptateur par jeu (skeleton-game.js, osteo-game.js, muscle-game.js)
js/account/profile.js       statistiques du joueur (invite ou compte commun)
js/account/account.js       bouton de compte, fenetre du compte, ecran des statistiques
js/vendor/three.min.js      Three.js r158 (licence MIT)
tools/                      (facultatif) regeneration des modeles 3D, voir tools/README.md
```

## Deroulement d'une partie

1. **Accueil** : choisir une categorie (**Les muscles**, **Les os** ; **Les vaisseaux sanguins** arrive
   bientot et reste verrouillee), puis un jeu de la categorie.
2. **Configuration** : ce qu'il faut deviner (zones du corps, os etudie...), le **nombre de questions**
   (champ et curseur synchronises), le **mode de jeu** et les options.
3. **Partie** : une question a la fois, retour immediat apres chaque reponse.
4. **Resultats**, puis **revision** libre sur le modele 3D.

Le squelette 3D se charge en arriere-plan pendant que l'accueil s'affiche ; les os detailles (osteologie)
et les muscles ne sont charges qu'a la demande, a l'ouverture du jeu concerne.

## Nomenclature TA2 et correction des reponses

Toutes les reponses utilisent les **noms francais de la TA2** ; le nom latin TA2 est aussi accepte.
Les **anciens termes** (rotule, perone, omoplate, astragale, grand fessier, trochiter...) sont reconnus et
signales, mais **comptes faux**.

- Majuscules, accents, ponctuation, tirets et apostrophes ne comptent pas ; l'article du debut, le mot
  "os" ou "muscle" en tete peuvent etre omis ("muscle grand dorsal" = "grand dorsal").
- Les prepositions sont ignorees et les adjectifs d'os ramenes au nom de l'os : "trochlee humerale" =
  "trochlee de l'humerus", "tuberosite tibiale" = "tuberosite du tibia".
- **Tolerance aux fautes de frappe** (option, cochee par defaut) : 0 faute pour un nom de 4 lettres au
  plus, 1 jusqu'a 7 lettres, 2 jusqu'a 12, 3 au-dela (une inversion de deux lettres = une faute).
- La reponse est comparee a **tous** les noms connus du jeu (actuels et anciens) : elle n'est juste que si
  le nom le plus proche est un nom TA2 de l'element demande. Nommer un autre element est signale ("vous
  avez nomme un autre os : ...").
- **Score** : 10 points par bonne reponse, 7 si elle a ete acceptee avec une faute de frappe.

Code : `js/game/matcher.js`.

## Modes de jeu (communs aux trois jeux)

- **Mode A - Nommage** : un element s'illumine (en rouge ; en bleu pour les muscles) ; on tape son nom
  dans le panneau de gauche, puis Valider (ou Entree). "Passer" compte la question comme ratee.
  **Autocompletion** (option) : des 2 caracteres, les noms TA2 de **tous** les elements du jeu (pas
  seulement ceux de la partie, pour ne pas donner d'indice) ; fleches pour choisir, Tab ou Entree pour
  inserer, Echap pour fermer.
- **Mode B - Ciblage** : le nom TA2 (et le nom latin) s'affiche ; on clique sur l'element, directement
  sur le modele 3D. La vue se tourne d'elle-meme vers une face ou l'element est visible. "Je ne sais pas"
  montre la reponse.
- **Retour immediat** : correct ou non, la bonne reponse et son nom latin, une note eventuelle (faute de
  frappe, ancien terme, numero ou cote faux). Question suivante apres 1,3 s (bonne reponse), 2,2 s (avec
  une note) ou 3,4 s (erreur) ; **Entree** ou "Suivant" passent tout de suite.
- **"Terminer la partie"** (panneau de gauche) arrete la partie et affiche les resultats.
- **Resultats** : pourcentage de reussite (anneau), score en points, bonnes reponses, temps ; liste des
  erreurs et des reponses acceptees avec une faute, chacune avec "Voir" (revision de cet element).
  Boutons : Menu principal, Nouvelle configuration, Rejouer.
- **Revision** : apres "Voir", cliquer sur d'autres elements pour les identifier (nom au survol) ; le
  panneau donne le nom latin, la zone, les anciens termes a ne plus utiliser et les parties connues.
  "Retour aux resultats" revient au bilan.

## Jeu 1 : Les os du squelette

Reconnaitre et localiser chaque os du corps humain. Code : `js/game/skeleton-game.js`, catalogue
`js/data/bones.js`.

- **Zones du corps** (a cocher, "Tout" / "Aucun") : membre inferieur, membre superieur, vertebres, crane,
  pelvis, autre / squelette axial. Le nombre d'os disponibles s'affiche pour chaque zone.
- Un os pair ou en serie est demande sur une de ses instances, tiree au hasard (droite ou gauche, un
  niveau donne).
- **Os en serie** (cotes, vertebres) : le numero, le niveau et le cote du corps sont lus dans la reponse :
  "12e cote gauche", "douzieme cote gauche", "vertebre thoracique T9", "T9" ou "C4" seuls. "D9" (vertebre
  dorsale) est l'ancienne nomenclature. Un bon os avec un mauvais numero ou un mauvais cote est compte faux,
  avec un message.
- **Option "Exiger le numero et le cote"** : sans elle, le nom general suffit ("cote") et le nom precis est
  rappele ; avec elle, une reponse sans numero (ou sans cote) est "incomplete", donc fausse, et en mode
  Ciblage il faut cliquer exactement sur l'instance demandee.

## Jeu 2 : Osteologie descriptive

Nommer et localiser les parties d'un os : reliefs et reperes (processus, fosses, incisures,
tuberosites...). Code : `js/game/osteo-game.js`, `js/game/osteo-setup.js`, decoupage `js/data/osteology.js`
et `js/engine/segment.js`.

- **Os a etudier** : **tire au hasard** parmi les zones cochees, ou **choisi** dans la liste (53 os
  detailles, groupes par zone ; un os pair est montre du cote droit, un niveau representatif pour les
  vertebres et les cotes). L'os est affiche **seul**, decoupe en parties, et rappele en permanence dans le
  panneau et sur la vue 3D.
- **Nombre de parties** a trouver : au plus le nombre de parties de l'os (variable selon l'os tire).
- **Os voisins estompes** (option, ou touche **V** pendant la partie) : situe l'os dans le squelette.
- **Resultats** : en plus des boutons communs, "Rejouer cet os", "Autre os au hasard" (os tire au hasard)
  et "Explorer l'os" : revision avec l'**atlas** (une couleur par partie, touche **C**), parties cliquables.
- Le decoupage en parties est une approximation pedagogique realisee pour ce projet (voir CREDITS.md).

## Jeu 3 : Les muscles du corps humain

Reconnaitre et localiser les muscles sur le corps en 3D. Code : `js/game/muscle-game.js`,
`js/game/muscle-setup.js`, catalogue `js/data/muscles.js`.

- **194 muscles**, dont **93 principaux** (les muscles classiques des cours d'anatomie), dans 8 zones :
  tete, cou, dos et nuque, thorax, abdomen, pelvis et perinee, membre superieur, membre inferieur.
- **Muscles proposes** : principaux seulement, ou tous (y compris les petits muscles et les muscles
  profonds).
- **Mode Nommage** : le muscle (un cote au hasard) s'allume en bleu ; s'il est en partie cache, les
  muscles qui le recouvrent sont masques automatiquement.
- **Mode Ciblage** : rien n'est masque (ce serait un indice), mais un muscle profond est signale :
  **Maj + clic** ecarte un muscle qui en cache un autre ; "Tout afficher" les fait reapparaitre.
- Chefs et parties d'un muscle forment un seul objet cliquable par cote du corps.

## Commandes de la vue 3D

Le bouton **?** (ou la touche **H**) affiche l'aide ; elle s'ouvre seule a la premiere visite.

| Action | Souris | Tactile | Clavier |
|---|---|---|---|
| Tourner | glisser | 1 doigt | |
| Deplacer | clic droit + glisser, ou Ctrl + glisser | 2 doigts | |
| Zoomer | molette (vers le curseur) | pincer | **+** / **-** ; tout voir : **0** |
| Choisir un element | clic | toucher | |
| Masquer un element | Maj + clic | | |
| Vues anterieure, posterieure, laterales | boutons de la barre du bas | | **1** **2** **3** **4** |
| Question suivante | "Suivant" | | **Entree** |

Barre du bas : vues, zoom, "voir tout", "recentrer sur l'element en cours" et, en osteologie, os voisins
(**V**) et atlas des parties (**C**, en revision).

## Compte et statistiques

- **Bouton de compte** en haut a gauche (ecrans d'accueil, de configuration et de resultats) : il affiche
  "Invite" ou le nom du compte connecte, et ouvre la fenetre du compte.
- **Comptes** (seulement quand le jeu est ouvert depuis le serveur) : nom + mot de passe (4 caracteres au
  moins), **communs a tous les jeux du dossier** : un compte cree ici sert aussi dans GeoNohyne Quizz, et
  inversement. A l'arrivee, une fenetre propose de se connecter, de creer un compte ou de continuer en
  invite (une fois par session du navigateur, tous jeux confondus). La connexion est memorisee et
  partagee par les jeux : on reste connecte en changeant de jeu.
- **Fenetre du compte** connecte : mes statistiques, renommer, changer le mot de passe (les autres
  appareils devront se reconnecter), se deconnecter, supprimer le compte (mot de passe demande ; le compte
  et ses statistiques disparaissent de **tous** les jeux).
- **Invite** : toujours possible ; statistiques gardees dans ce navigateur (`localStorage`, cle
  `anotehomy.profil`). A la creation d'un compte, une case permet de **reprendre les statistiques de
  l'invite**.
- **Ce qui est enregistre** : chaque partie terminee (ou interrompue, marquee comme telle) : jeu, mode,
  configuration (zones, os etudie), bonnes reponses, score, temps.
- **Ecran des statistiques** (bouton "Mes statistiques" de la fenetre du compte) :
  - totaux : parties, temps de jeu, taux de bonnes reponses, questions ;
  - **par jeu et par mode** : parties, reussite moyenne, **meilleure partie** (meilleure reussite, puis le
    plus de questions, puis le temps le plus court ; parties completes seulement) ;
  - **a revoir** : pour chaque jeu, les elements les plus rates ("ratee 3 fois sur 4") ;
  - **dernieres parties** (les 500 dernieres sont gardees) ;
  - "Effacer mes statistiques" (le compte est garde).
- Les statistiques d'Anotehomy Quizz sont rangees dans l'espace `anotehomy` du compte, sur le serveur :
  **rien n'est public** (pas de classement pour l'instant), seul le joueur les voit. Les autres jeux n'y
  ont pas acces.
- **Hors ligne** : si le serveur ne repond plus un moment, on continue de jouer avec son compte ; les
  parties partent des son retour (copie dans le navigateur, cle `comptes.donnees.anotehomy`).

## Ajouter un jeu dans Anotehomy Quizz

1. Ajouter son entree dans `js/data/games.js` (categorie, `status: 'soon'` tant qu'il n'est pas pret :
   la carte reste grisee "Bientot disponible").
2. Ecrire son **adaptateur** dans `js/game/` (meme interface que `js/game/osteo-game.js`, decrite en tete
   de ce fichier) et, si besoin, son bloc de configuration (`index.html` + un fichier `*-setup.js`).
3. Ajouter les `<script defer>` dans `index.html` (l'ordre compte), puis passer `status` a `'ready'`.

Le deroulement, la correction, les resultats et les statistiques sont communs : rien d'autre a ecrire.

## Modeles 3D, outils et credits

- Squelette et os detailles : **BodyParts3D** (DBCLS, CC BY 4.0) ; muscles : **Z-Anatomy** (CC BY-SA 4.0,
  `js/data/muscle-model.js` est donc distribue sous la meme licence) ; rendu : **Three.js** (MIT).
  Details et modifications : `CREDITS.md`.
- Les modeles compresses de `js/data/*-model.js` sont generes par les scripts de `tools/` (PowerShell +
  C#, rien a installer) : **inutiles pour jouer**, ils servent a changer le niveau de detail ou la liste
  des os et des muscles. Mode d'emploi : `tools/README.md`.

## Versions

Numerotation **MAJEUR.MINEUR.CORRECTIF** commune a tous les jeux (regles : "Versions" dans le
[README a la racine](../README.md#versions)). A chaque nouvelle version : une ligne ici, et le numero dans
`../COMMUN/jeux.js` (ligne `anotehomy`), d'ou il s'affiche dans le menu "Jeux" et sur la page d'accueil.

| Version | Date | Changements |
|---|---|---|
| 1.0.0 | 28/10/2026 | Premiere version numerotee : les os du squelette, osteologie descriptive (53 os detailles), les muscles (194, dont 93 principaux), modes Nommage et Ciblage, comptes communs et statistiques. |
