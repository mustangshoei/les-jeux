# Histehory Quizz

Jeu consacré à l'histoire (nom provisoire). Il fait partie du dossier des jeux : lancement, comptes
communs et serveur sont décrits dans le [README à la racine](../README.md).

**Version 0.1.0** : en préparation (numérotation MAJEUR.MINEUR.CORRECTIF : voir « Versions » dans le
[README à la racine](../README.md#versions) ; le jeu passera en 1.0.0 avec son premier mode jouable).

**En préparation** : seule la page d'accueil existe, avec ses quatre modes de jeu grisés
(« Bientôt disponible ») : Trouver la date, Deviner la personne, Chronologie aléatoire, Vrai ou Faux.

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
| 0.1.0 | 28/10/2026 | Page d'accueil (quatre modes grisés) et comptes communs. |
