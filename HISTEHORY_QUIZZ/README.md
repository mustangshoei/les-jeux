# Histehory Quizz

Jeu consacré à l'histoire (nom provisoire). Il fait partie du dossier des jeux : lancement, comptes
communs et serveur sont décrits dans le [README à la racine](../README.md).

**Version 1.0.0** (numérotation MAJEUR.MINEUR.CORRECTIF : voir « Versions » dans le
[README à la racine](../README.md#versions)).

**Modes de jeu** : un seul est jouable, **Qui est venu en premier ?** ; les six autres restent grisés
(« Bientôt disponible ») : Trouver la date, Deviner la personne (indices progressifs), Qui a dit ça ?,
Les paires, Chronologie (événements, dynasties, successions), Vrai ou Faux.

## Qui est venu en premier ? (`js/modes/premier.js`)

Deux personnages s'affichent dans des cadres (même principe que les rectangles de la page d'accueil :
portrait en traits blancs fondu dans la couleur du jeu) et la question change à chaque manche : « Qui
est né **avant** ? » ou « Qui est né **après** ? ». On clique sur le bon cadre (ou flèche gauche / droite) ;
les deux années de naissance s'affichent alors. Jamais deux personnes nées la même année ; si une date
est approximative, au moins 15 ans d'écart. Réglages : niveau (Facile = difficulté 1-2, Moyen = 1-3,
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
| 1.0.0 | 08/11/2026 | Mode « Qui est venu en premier ? » (avant / après), portraits des personnes, sept modes annoncés. |
| 0.1.0 | 28/10/2026 | Page d'accueil (quatre modes grisés) et comptes communs. |
