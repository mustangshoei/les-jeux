# Histehory Quizz

Jeu consacré à l'histoire (nom provisoire). Il fait partie du dossier des jeux : lancement, comptes
communs et serveur sont décrits dans le [README à la racine](../README.md).

**Version 1.2.0** (numérotation MAJEUR.MINEUR.CORRECTIF : voir « Versions » dans le
[README à la racine](../README.md#versions)).

**Modes de jeu** : deux sont jouables, **Qui est venu en premier ?** et **Chronologie** ; les cinq autres
restent grisés (« Bientôt disponible ») : Trouver la date, Deviner la personne (indices progressifs),
Qui a dit ça ?, Les paires, Vrai ou Faux.

## Chronologie (`js/modes/chronologie.js`, `css/chronologie.css`)

**Cinq événements, sous forme de blocs, à placer sur une frise de cinq emplacements**, du plus ancien
(à gauche, ou en haut sur téléphone) au plus récent. Chaque bloc porte le titre de l'événement et deux
indices (thématique · région), jamais sa date. Les événements viennent de `js/donnees/dates.js`
(939 événements, de la préhistoire à 2025).

- **Placer et déplacer** : on peut déplacer les blocs autant qu'on veut **avant de valider**.
  - **Glisser** (souris ou doigt) un bloc jusqu'à un emplacement ; déposé sur un emplacement occupé, il
    échange sa place avec l'autre bloc ; déposé dans la zone « à placer », il est retiré de la frise.
  - **Cliquer** un bloc, puis un emplacement (ou un autre bloc, pour les échanger).
  - **Clavier** : Tab, Entrée pour prendre un bloc, puis un chiffre de 1 à 5 (emplacement) ; ← / → (ou
    ↑ / ↓) décalent un bloc de la frise ; Suppr le retire ; Échap lâche la sélection.
- **Valider** (actif quand les cinq emplacements sont remplis) : la date de chaque événement s'affiche,
  avec son résumé ; les blocs bien placés sont marqués ✓ (vert), les autres ✗ et la place qu'ils auraient
  dû prendre (« ✗ n° 3 », rouge). Une échelle montre les cinq dates à leur vraie distance (deux dates très proches sont légèrement
  écartées pour que les numéros restent lisibles), avec l'écart en années entre le plus ancien et le
  plus récent. Un point par événement bien placé ; 5 sur 5 :
  « Chronologie parfaite ».
- **Préphase** : trois filtres **cumulables et croisés**, avec le nombre d'événements concernés sur chaque
  case (compte tenu des deux autres filtres) et « Tout / Aucun » pour chaque groupe :
  **période** (Antiquité, Moyen Âge, époque moderne, époque contemporaine), **difficulté** (1 à 5, comme
  dans `dates.js`) et **thématique** (les 14 domaines). **Impossible de lancer la partie s'il y a moins
  de 5 événements** qui correspondent : le message dit combien il y en a. Même chose si les événements
  restants sont trop proches dans le temps pour en tirer cinq qu'on puisse départager. Puis la longueur :
  3, 5 ou 10 manches (15, 25 ou 50 événements).
- **Tirage** : les cinq événements d'une manche ne tombent jamais la même année (sauf deux événements à
  date précise et différente) ; si une date est approximative, au moins 15 ans d'écart avec les autres.
  Les événements ne reviennent pas d'une manche à l'autre tant qu'il en reste d'autres à tirer.
- **Score** : un point par événement placé à sa vraie place, donc 5 par manche. La partie est enregistrée
  pour le joueur (bonnes réponses = événements bien placés, questions = 5 × le nombre de manches).

## Qui est venu en premier ? (`js/modes/premier.js`)

Deux personnages s'affichent dans des cadres (même principe que les rectangles de la page d'accueil) :
le portrait-médaille au centre, le nom sur un cartouche (pays · domaine · époque). La consigne change à
chaque manche : « Qui est né **⟵ EN PREMIER** ? » (vert d'eau) ou « Qui est né **EN DERNIER ⟶** ? » (orange). On
clique sur le bon cadre (ou flèche gauche / droite) ; les années s'inscrivent sur les cartouches, un
badge ✓ / ✗ marque les cadres et une mini-frise montre l'écart. Bonne réponse : la manche suivante
arrive seule au bout de 1,8 s (le bouton « Suivant » se remplit) ; erreur : on lit, puis « Suivant ».
Série de bonnes réponses affichée (« 🔥 3 d'affilée »). Jamais deux personnes nées la même année ; si une
date est approximative, au moins 15 ans d'écart. Réglages : niveau (Facile = difficulté 1-2, Moyen = 1-3,
Expert = toutes) et longueur (10, 20 ou 30 questions).

## Portraits (`img/`, `js/donnees/portraits.js`)

Chaque personne de `js/donnees/personnes.js` a une image, rangée dans `js/donnees/portraits.js` :
son **portrait** (`img/personnes/<id>.webp`, médaillon de 256 px, ~30 Ko ; 17 Mo en tout), ou à défaut une **image
générique** (`img/generiques/` : souverain, dame, guerrier, religieux, savant ; Mahomet n'a volontairement aucune image). Les portraits viennent
de l'image principale de chaque personne sur Wikidata (Wikimedia Commons), recadrée sur le visage puis
convertie en traits blancs ; sources, auteurs et licences : [img/CREDITS.md](img/CREDITS.md). Les
scripts qui les fabriquent sont dans `outils/portraits/` (voir son README).

**Fermé** (champ `bloque` de sa ligne dans `../COMMUN/jeux.js`) : sa tuile reste **visible** sur la page
d'accueil et dans le menu « Jeux » des autres jeux, mais elle est grisée et **inerte** — ce n'est plus un
lien. Le dossier n'est pas touché : `index.html` s'ouvre normalement à la main, et son propre menu
« Jeux » permet toujours d'en repartir. Pour le rouvrir : retirer `bloque: true` de sa ligne. Voir
« Accès aux jeux » dans le [README à la racine](../README.md).

## Versions

À chaque nouvelle version : une ligne ici, et le numéro dans `../COMMUN/jeux.js` (ligne `histehory`),
d'où il s'affiche dans le menu « Jeux » et sur la page d'accueil.

| Version | Date | Changements |
|---|---|---|
| 1.2.0 | 09/11/2026 | Nouveau mode **Chronologie** : cinq événements à placer sur une frise (glisser-déposer, clic ou clavier), validation qui révèle les dates, préphase avec filtres croisés par période, difficulté et thématique (lancement impossible sous 5 événements). 939 événements dans `dates.js`. |
| 1.1.1 | 08/11/2026 | Consigne « en premier / en dernier » au lieu de « avant / après ». |
| 1.1.0 | 08/11/2026 | Écran de jeu revu : portrait-héros et cartouche, consigne avant / après en couleurs et flèches opposées, badges ✓ / ✗, mini-frise, enchaînement automatique, série, survol réservé à la souris. |
| 1.0.0 | 08/11/2026 | Mode « Qui est venu en premier ? » (avant / après), portraits des personnes, sept modes annoncés. |
| 0.1.0 | 28/10/2026 | Page d'accueil (quatre modes grisés) et comptes communs. |
