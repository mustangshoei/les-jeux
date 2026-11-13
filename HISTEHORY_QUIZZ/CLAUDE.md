# CLAUDE.md — Histehory Quizz

Spécialités de ce jeu. Les règles communes (indépendance, `COMMUN/` facultatif, versions, commits…) sont
dans le `CLAUDE.md` de la racine ; la documentation pour un humain est dans `README.md`.

## Carte d'identité

- L'histoire : personnages, dates, citations, chronologies. **Nom provisoire.**
- id `histehory`. Version dans `README.md` et dans `../COMMUN/jeux.js`. **Ouvert au public** (depuis la
  2.0.0) ; ses totaux sont déclarés (`totaux` dans `../COMMUN/jeux.js`) et comptent sur l'accueil.
- Trois modes jouables, **« Qui est venu en premier ? »**, **« Chronologie »** et **« Trouver la date »** ; quatre
  autres annoncés (grisés).
- Thème « Chroniques », sombre seulement : brun d'archives, **ambre** (actions, sélection) et **orange**
  (consignes), fond de papier réglé fixe ; polices locales Bricolage Grotesque et IBM Plex Mono (`css/polices/`).
  Même construction que les autres jeux : menu « atlas », menu de compte déroulant.
- **Identifiants et commentaires en français.** Espaces de noms : `Histehory` (noyau : `registerMode`,
  `trouver`, `ouvrir`, `afficher`), `HISTEHORY` (données : `PERSONNES`, `PORTRAITS`, `DATES`, `REGIONS`,
  `DOMAINES`, `EPOQUES`, `DIFFICULTES`), `HistProfils` (statistiques).

## Où est quoi

| Fichier | Rôle |
|---|---|
| `index.html` | toutes les `<section class="screen">` : le menu (`screen-menu`), puis, par mode, configuration / jeu / fin ; le coin du compte (`.acct-coin`) et le coin « Jeux » |
| `js/core.js` | petit noyau : enregistrement des modes, `afficher(idSection)`, `data-action="menu"` |
| `js/menu.js` | **le menu « atlas » et son catalogue** : `CHAPITRES` (3), `MENU` (les 7 modes, avec leur chapitre ; les modes jouables d'abord), `PICTOS`, `TEINTES`, `PLANCHES` (dessins SVG ; le chapitre des figures reprend trois portraits de `img/`). Une carte s'active quand son mode est enregistré ; chargé en dernier |
| `js/modes/<mode>.js` | **un fichier par mode** (aujourd'hui : `premier.js`, `chronologie.js`, `date.js`) |
| `css/style.css` | polices, couleurs (variables), fond, boutons, écrans de configuration / partie / fin des modes, **filtres en cases** de la préphase (`.puce`, `.chrono-groupe`, `.chrono-etat` : partagés par « Chronologie » et « Trouver la date ») |
| `css/menu.css`, `css/compte.css` | le menu « atlas » (repris de Natehure) ; le bouton et le menu déroulant du compte |
| `css/chronologie.css`, `css/date.css` | un mode à l'écran riche a sa propre feuille, chargée après les autres |
| `js/donnees/personnes.js` | 573 personnes (décédées), table `DIFFICULTE` (1 à 5, 3 par défaut) |
| `js/donnees/dates.js` | 939 événements datés, triés par date, répartis sur toutes les époques et les six régions (Europe : environ les deux tiers) ; difficulté de 1 à 5 : 23 / 68 / 256 / 345 / 247. Chargé par `index.html`, utilisé par « Chronologie » et « Trouver la date » |
| `js/donnees/portraits.js` | id → image : **généré** par `outils/portraits/f5_portraits.py`, ne pas l'éditer à la main |
| `js/profils.js` / `js/compte.js` | statistiques (invité ou compte) / bouton et menu déroulant du compte (repris de Natehure, avec renommer, mot de passe, suppression et reprise des statistiques de l'invité) |
| `img/personnes/`, `img/generiques/`, `img/CREDITS.md` | portraits (générés, ~30 Ko chacun), images génériques, crédits (généré) |
| `outils/portraits/` | fabrique des portraits en Python (mode d'emploi : son `README.md`) |

Les noms des trois chapitres (Le fil du temps, Les grandes figures, L'épreuve de l'historien) sont une
proposition de Claude (Théo n'avait pas d'idée de noms) : à changer dans `CHAPITRES` s'il en trouve d'autres.

## Ajouter un mode

1. Ses écrans dans `index.html` : `screen-<mode>-config`, `screen-<mode>-jeu`, `screen-<mode>-fin`
   (sur le modèle de « premier »), avec `data-action="menu"` sur les boutons « ← Accueil ».
2. `js/modes/<mode>.js` : une IIFE qui appelle `Histehory.registerMode({ id, titre, icone, description,
   ouvrir })` et affiche ses écrans avec `Histehory.afficher(id)`. **L'id est celui de `MENU`** (`date`,
   `personne`, `citation`, `paires`, `chronologie`, `vrai-faux`).
3. En fin de partie : `HistProfils.enregistrerPartie({ mode, titre, score, total, tempsMs })`.
4. Sa balise `<script>` avant `js/menu.js` (et `js/donnees/dates.js` s'il en a besoin) ; retirer
   `bientot: true` de son mode dans `../COMMUN/jeux.js` ; README + version (MINEURE).

Pour un mode à saisie (Trouver la date, Deviner la personne, Qui a dit ça ?), reprends les règles de
correction et de suggestions communes (voir le `CLAUDE.md` de la racine) en **copiant** le code utile
d'Anotehomy (`js/game/matcher.js`, `js/game/lexique-*.js`) : jamais de chargement depuis un autre jeu.

## Conventions des données

- Années **négatives avant notre ère, pas d'année 0** (-1 est suivi de 1). Affichage : « 52 av. J.-C. »,
  « vers 1412 » si approximatif (`A` → `approx: true`).
- Époques : Antiquité (< 476), Moyen Âge (476-1452), époque moderne (1453-1788), contemporaine (≥ 1789) ;
  calculée au milieu de la vie, sauf `{ e: '…' }`.
- Difficulté de 1 (très connu) à 5 (presque inconnu), **pour un public français**. Les personnes : par la
  table `DIFFICULTE` (absentes = 3) ; les événements : 8e argument de `E(...)`.
- `REGIONS` et `DOMAINES` sont les mêmes clés pour les personnes et les dates.
- **Un intitulé d'événement ne donne jamais sa date** : ni année, ni mois, ni jour, ni calendrier révolutionnaire
  (« Abolition des privilèges », pas « Nuit du 4 août » ; « Armistice franco-allemand de Rethondes », pas « Armistice
  du 22 juin »). Même règle pour le résumé (ni fête ni saison : « le jour de Noël », « un hiver glacial »). Les noms propres
  légitimes restent (« 1984 », « Manifeste des 343 »).
- **Un intitulé désigne un seul événement** : si l'histoire en a connu plusieurs du même genre, on le précise
  (« Première Coupe du monde de football remportée par la France », « Traité de Paris reconnaissant
  l'indépendance des États-Unis », « Première élection de François Mitterrand »). Avant d'ajouter un événement,
  cherche dans `dates.js` s'il existe déjà un titre voisin.
- Le résumé ne contient jamais le nom de la personne (il pourra servir d'indice).
- L'id d'une personne sert aux portraits et pourra servir aux statistiques : ne plus le changer.

## « Qui est venu en premier ? » (`js/modes/premier.js`) : ce qui est à retenir

- Deux cadres « médaille » (portrait, cartouche nom / pays · domaine · époque) ; consigne qui alterne
  « ⟵ EN PREMIER » (vert d'eau) et « EN DERNIER ⟶ » (orange) ; clic ou ← / →.
- Tirage : jamais la même année de naissance ; au moins `ECART_APPROX` = 15 ans si une date est
  approximative (la réponse doit rester sûre).
- Bonne réponse : suite automatique après `DELAI_AUTO` = 1,8 s (le bouton « Suivant » se remplit) ;
  erreur : on lit, puis « Suivant » ou Entrée. Série affichée, badges ✓ / ✗, mini-frise de l'écart.
- Niveaux : Facile (difficulté ≤ 2), Moyen (≤ 3), Expert (toutes) ; longueur 10, 20 ou 30.

## « Chronologie » (`js/modes/chronologie.js`, `css/chronologie.css`) : ce qui est à retenir

- Une manche = **5 événements** (`NB`) tirés de `HISTEHORY.DATES`, que le joueur place sur 5 emplacements ;
  les blocs non placés sont dans une zone au-dessus. État d'une manche : `slots` (id posé sur chaque
  emplacement), `sel` (bloc sélectionné), `ordre` (la bonne réponse), `valide`.
- **Déplacements** : glisser-déposer par les *pointer events* (souris et tactile ; `touch-action: none` sur
  les blocs ; un fantôme `.bloc--fantome` suit le pointeur ; sous 6 px c'est un simple clic), clic puis
  emplacement, clavier (Entrée, chiffres 1-5, flèches, Suppr, Échap). Déposer sur un emplacement occupé
  **échange** les deux blocs. Après « Valider », plus rien ne bouge.
- **Événements « départageables »** (`compatibles`) : jamais deux événements de la même année (sauf deux
  dates précises et différentes), et au moins 15 ans d'écart si l'une des dates est approximative. Cette
  relation est transitive dans l'ordre du temps, donc `plusLongueChaine` (programmation dynamique) dit
  si l'on peut tirer 5 événements d'un vivier : c'est ce qui bloque le lancement en préphase.
- **Préphase** : 3 filtres cumulables et croisés (période = époque, difficulté, thématique = domaine),
  avec le nombre d'événements sur chaque case ; lancement **impossible sous 5 événements**. Les cases sont
  construites une fois puis mises à jour sur place (`majPreparation`) pour ne pas perdre le focus.
- **Score** : un point par événement **à sa vraie place** (5 par manche), enregistré avec
  `enregistrerPartie` (`score` = bien placés, `total` = 5 × manches). Pas de crédit partiel pour un bloc
  « bien ordonné par rapport aux autres » mais décalé : un seul bloc mal placé peut en décaler d'autres.
- Après validation : date, ✓ ou « ✗ n° k » (la place qu'il aurait dû prendre), résumé, et une échelle des
  5 dates à leur vraie distance (points numérotés d'après la vraie place).

## « Trouver la date » (`js/modes/date.js`, `css/date.css`) : ce qui est à retenir

- Une question = un événement de `HISTEHORY.DATES` : thème (`DOMAINES`) en pastille, région, intitulé,
  résumé. Deux façons (`FACONS`) : `annee` ou `exacte` ; `auJour(e, facon)` dit si l'on demande jour et
  mois (date exacte, événement daté au jour, **pas approximatif**), sinon l'année seule.
- **Juste ou faux** (choix de Théo, pas de points partiels). Date approximative : jugée sur l'année, à
  `marge(e)` près = max(10, 10 % de (2000 − année)) arrondi à la dizaine (choix de Théo : « ±10 % de
  l'âge, au moins 10 ans ») ; la consigne l'annonce. Écart en années sans année 0 (`ecartAns`).
- **Saisie** (choix de Théo : champs à taper) : jour (texte numérique), mois (`<select>`), année
  (chiffres seulement ; « - » bascule l'ère), ère en deux boutons. Entrée valide ou mène au premier champ
  vide ; année 0 et jour impossible refusés avec un message.
- Préphase (modèle dessiné par Théo) : **grille 2 × 2 dont les titres s'alignent ligne à ligne** (façon |
  période, nombre | difficulté et thématique ; une colonne sur téléphone). Façon en deux grandes cartes ;
  nombre 1 à `MAX` = 50 dans un encadré (− / +, curseur rempli par `--rempli`, raccourcis, puis l'état) ;
  les filtres de « Chronologie » (même code, recopié), construits dans `date-filtre-<id>` : périodes en
  cartes avec emoji (`ICONES_EPOQUE`), thématiques avec emoji (`ICONES_DOMAINE`), coche sur les cases
  rondes cochées. **Rien ne bouge quand les nombres changent** (demande de Théo) : compteurs de largeur fixe,
  et difficulté / thématiques en **lignes justifiées** (`lignes` du filtre, `LIGNES_DOMAINE` : 5 lignes de
  3 + 2 regroupées par sens ; une nouvelle thématique doit y être placée), libres sur téléphone ; interrupteur « Tout / Aucun » à trois positions (`data-etat` : tout, partiel, aucun).
  Tout le style est restreint à `.date-config` (ne touche pas « Chronologie »). Tient en 1280 × 720.
  Réglages retenus (`histehory.date.reglages`).
- Fin : anneau, erreurs (3 visibles, « Voir les N autres »), « Revoir mes erreurs » (`demarrer(liste)`,
  partie enregistrée avec « révision » dans le titre).

## Portraits

- Médaillons de 256 px en traits blancs (« taille-douce »), tirés de l'image Wikidata de chaque personne
  (Wikimedia Commons) ; à défaut une **image générique** (souverain, dame, guerrier, religieux, savant).
- **Mahomet n'a volontairement aucune image** (`null`) : à respecter pour toute personne ajoutée dans le
  même cas.
- Nouvelle personne : relancer la chaîne `outils/portraits/` (`f1` → `f5`), qui réécrit `portraits.js` et
  `img/CREDITS.md`. Les sources (`src/`, `grand/`…) ne sont pas versionnées.

## Plans

- Les quatre modes annoncés ; il faudra des citations pour « Qui a dit ça ? ».
- « Chronologie » : variantes possibles à discuter avec Théo (période en années libres, dynasties ou
  successions de souverains, 6 à 8 blocs, score par ordre relatif).
- Pas encore d'écran de statistiques dans le jeu, ni de classements.
