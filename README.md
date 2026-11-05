  # Les jeux

Ce dossier regroupe plusieurs jeux éducatifs, en HTML, CSS et JavaScript purs (sans installation, sans
connexion Internet). Chaque jeu fonctionne **seul et indépendamment** des autres ; tous partagent un
**compte commun** et peuvent tourner en même temps, servis par un même petit serveur facultatif.

| Jeu | Dossier | Pour apprendre | Documentation |
|---|---|---|---|
| 🌍 **GéoNohyne Quizz** | `GEONOHYNE_QUIZZ/` | la géographie : départements, fleuves, pays, mers du monde (quiz, jeux, mode Apprendre) | [GEONOHYNE_QUIZZ/README.md](GEONOHYNE_QUIZZ/README.md) |
| 🦴 **Anotehomy Quizz** | `ANOTEHOMY_QUIZZ/` | l'anatomie humaine en 3D : os, ostéologie descriptive, muscles (nomenclature TA2) | [ANOTEHOMY_QUIZZ/README.md](ANOTEHOMY_QUIZZ/README.md) |

## Contenu du dossier

```
game.bat                LANCEUR (Windows) : double-clic = serveur des jeux + navigateur, avec les comptes
index.html              page d'accueil : choix du jeu (liste lue dans COMMUN/jeux.js)
README.md               ce fichier : fonctionnement général
COMMUN/                 ce que les jeux partagent (facultatif pour eux : sans lui, chaque jeu marche en invité)
  comptes.js            les comptes communs, côté navigateur (connexion, statistiques de chaque jeu)
  jeux.js               LA liste des jeux + le bouton « Jeux » (changer de jeu) que chaque jeu affiche
  jeux.css              apparence de ce bouton
SERVEUR/                le serveur des jeux (facultatif, jamais envoyé aux navigateurs)
  serveur.py            sert tous les jeux et gère les comptes communs (Python 3.8+, sans dépendance)
  docker-compose.yml    … pour le lancer dans Docker, sur un NAS
  donnees/              … les comptes (créé au premier lancement)
GEONOHYNE_QUIZZ/                le jeu GéoNohyne Quizz (tout ce qui lui est propre)
ANOTEHOMY_QUIZZ/        le jeu Anotehomy Quizz (tout ce qui lui est propre)
IGNORED_BY_CLAUDE/      notes personnelles, hors des jeux (jamais servies par le serveur)
```

## Jouer

- **Avec les comptes, en un double-clic (Windows)** : **`game.bat`**. Il démarre le serveur des jeux et
  ouvre la page d'accueil dans le navigateur. Laissez sa fenêtre ouverte pendant que vous jouez ; la
  fermer arrête le serveur (un nouveau double-clic, serveur déjà lancé, rouvre simplement le navigateur).
  Il faut Python 3 (python.org, case « Add python.exe to PATH ») : sans lui, `game.bat` le dit. La fenêtre
  affiche aussi l'adresse à ouvrir depuis les autres appareils de la maison (`http://192.168.x.x:8080`) ;
  au premier lancement, Windows demande d'autoriser Python sur le réseau : acceptez pour jouer à plusieurs.
  Autre port : `game.bat --port 8081`.
- **Sans rien lancer** : double-cliquez sur `index.html` (page d'accueil) ou directement sur l'`index.html`
  d'un jeu. Rien à installer. On joue **en invité** : les statistiques restent dans le navigateur, et il
  n'y a pas de comptes (ils ont besoin du serveur).
- **Sur un NAS ou un ordinateur toujours allumé** : voir « Héberger les jeux », puis ouvrez
  `http://<adresse-de-la-machine>:8080` depuis n'importe quel appareil du réseau : la page d'accueil
  propose tous les jeux. Adresses directes : `…:8080/GEONOHYNE_QUIZZ/` et `…:8080/ANOTEHOMY_QUIZZ/`.
- **Changer de jeu** : chaque jeu a un bouton **« Jeux »** en haut à droite (sur ses écrans de menu, pas
  pendant les parties). Il liste les autres jeux et la page d'accueil. On **reste connecté** d'un jeu à
  l'autre.
- **Plusieurs jeux en même temps** : chaque jeu peut être ouvert dans son propre onglet ; une connexion
  ou une déconnexion dans l'un est appliquée tout de suite dans les autres.

## Les comptes communs

- **Un seul compte pour tous les jeux** : nom + mot de passe (4 caractères au moins). Créer un compte
  dans un jeu le crée pour tous ; renommer, changer de mot de passe, se déconnecter ou supprimer le compte
  vaut aussi pour tous (la suppression efface les statistiques de tous les jeux).
- La connexion est **mémorisée dans le navigateur** (clé `comptes.session`), partagée par les jeux ouverts
  depuis le même serveur ; elle expire après un an sans visite. La fenêtre « se connecter / créer un
  compte / continuer en invité » ne s'ouvre seule qu'**une fois par session du navigateur**, tous jeux
  confondus.
- **Chaque jeu a son propre espace dans le compte** (`geonohyne`, `anotehomy`…) pour ses statistiques : un
  jeu ne lit ni n'écrit jamais l'espace d'un autre. Le contenu de cet espace est choisi par le jeu ; le
  serveur ne le connaît pas.
- **Ce que voient les autres joueurs** : uniquement le nom, la couleur et ce qu'un jeu choisit de publier
  pour ses classements (GéoNohyne Quizz : les records ; Anotehomy Quizz : rien pour l'instant). Aucune liste des
  comptes n'est jamais affichée.
- **Invité** : toujours possible, avec ou sans serveur ; chaque jeu garde alors ses statistiques dans le
  navigateur. À la création d'un compte, on peut reprendre les statistiques de l'invité.
- **Hors ligne** : si le serveur ne répond plus un moment, on continue de jouer avec son compte ; une copie
  des statistiques reste dans le navigateur (clé `comptes.donnees.<jeu>`) et part dès le retour du serveur.
  Après une déconnexion, ces copies sont effacées (sauf des parties pas encore envoyées).

## Indépendance des jeux

Règle d'organisation : **modifier un jeu ne doit jamais toucher un autre jeu.**

- Tout ce qui est propre à un jeu (pages, styles, scripts, données, outils, documentation) est **dans son
  dossier**, et un jeu ne charge **aucun fichier d'un autre jeu**.
- Un jeu ne peut utiliser que le dossier `COMMUN/`, et seulement de façon **facultative** : si
  `COMMUN/comptes.js` manque ou plante, le jeu se joue en invité ; si `COMMUN/jeux.js` manque, il n'a
  simplement pas de bouton « Jeux ». Casser (ou supprimer) un jeu laisse donc les autres intacts.
- Les clés de stockage du navigateur sont préfixées : `geonohyne.*` pour GéoNohyne Quizz, `anotehomy.*` pour
  Anotehomy Quizz, `comptes.*` pour les comptes communs.
- `COMMUN/` et `SERVEUR/` sont partagés : les modifier peut concerner tous les jeux. Ils ne contiennent
  **aucune logique de jeu** (les comptes, la liste des jeux et le bouton « Jeux »), pour rester petits et
  stables. Le serveur range les données de chaque jeu à part : un jeu qui envoie des données invalides
  n'abîme que son propre espace.

## Héberger les jeux sur un NAS (ou tout ordinateur toujours allumé)

Le serveur `SERVEUR/serveur.py` sert **tout le dossier** (page d'accueil, `COMMUN/` et les jeux) **et**
gère les comptes. Il n'utilise que Python 3.8 ou plus récent, sans rien installer d'autre. Il n'envoie
jamais aux navigateurs `SERVEUR/`, `IGNORED_BY_CLAUDE/` ni les fichiers cachés. Les comptes sont dans
`SERVEUR/donnees/comptes.json`, avec une copie par jour (les 7 dernières) : sauvegardez ce dossier avec le
reste du NAS. Ce fichier est un JSON lisible (indenté de 4 espaces) ; pour le corriger à la main, **arrêtez
d'abord le serveur** : sinon il réécrit le fichier à la modification suivante et vos changements sont perdus.

**Avec Docker (recommandé sur un NAS : Synology « Container Manager », QNAP « Container Station », Unraid,
TrueNAS…)**

1. Copiez tout le dossier des jeux sur le NAS (par exemple `/volume1/docker/jeux`).
2. Dans l'outil Docker du NAS, créez un projet à partir de `SERVEUR/docker-compose.yml` (sur Synology :
   Container Manager → Projet → Créer, chemin = le dossier `SERVEUR`), ou en SSH :
   `cd /volume1/docker/jeux/SERVEUR && docker compose up -d`.
3. Ouvrez `http://<adresse-du-NAS>:8080`. Pour changer de port, modifiez la ligne `"8080:8080"` (le
   premier nombre). Le conteneur redémarre tout seul avec le NAS.

**Sans Docker** (paquet Python 3 du NAS, ou un ordinateur) : `python3 SERVEUR/serveur.py --port 8080`
(sous Windows : `game.bat`). Option `--ouvrir` : ouvre aussi la page d'accueil dans le navigateur ; si le
serveur tourne déjà sur ce port, un second lancement se contente d'ouvrir le navigateur.
Variables possibles : `JEUX_PORT`, `JEUX_HOTE` (interface d'écoute, `0.0.0.0` par défaut), `JEUX_DONNEES`
(dossier des comptes). Les anciennes variables `GEOQUIZ_PORT`, `GEOQUIZ_HOTE`, `GEOQUIZ_DONNEES` marchent
encore.

**Mettre un jeu à jour** : remplacez les fichiers de son dossier seulement ; les autres jeux et les comptes
ne sont pas touchés. Les navigateurs revérifient les fichiers à chaque visite : la nouvelle version est vue
tout de suite. Ne remplacez jamais `SERVEUR/donnees/`.

**Reprendre les comptes de l'ancien serveur** (celui du jeu de géographie seul, quand GéoNohyne Quizz
s'appelait GéoQuiz : `geoquiz/serveur/donnees/comptes.json`) :

1. Arrêtez l'ancien conteneur `geoquiz` (ou l'ancien `serveur.py`).
2. Copiez `comptes.json` dans `SERVEUR/donnees/`.
3. Lancez le nouveau serveur : le fichier est converti tout seul (les statistiques de chaque compte
   deviennent son espace `geonohyne`) et l'original est gardé sous `comptes-v1.json`. Les joueurs déjà
   connectés le restent : leur connexion est reprise à leur prochaine visite.

**Ancien nom GéoQuiz** : rien à faire. Le serveur renomme tout seul les espaces `geoquiz` des comptes en
`geonohyne`, et le jeu reprend, dans chaque navigateur, les réglages et statistiques d'invité enregistrés
sous l'ancien nom (clés `geoquiz.*`). Les anciennes sauvegardes JSON se restaurent toujours.

**Sécurité**

- Mots de passe **hachés** (PBKDF2-SHA256, sel aléatoire), jamais stockés en clair ; connexion par jeton
  aléatoire dont le serveur ne garde que l'empreinte ; 10 essais de connexion ratés au plus par adresse sur
  10 minutes.
- Le serveur parle **HTTP** : parfait sur le réseau de la maison. **Pour un accès depuis Internet**, ne
  l'exposez pas directement : passez par le **proxy inverse HTTPS du NAS** (Synology : Panneau de
  configuration → Portail de connexion → Avancé → Proxy inversé, avec un certificat Let's Encrypt), ou par
  un VPN (Tailscale, WireGuard…). Sinon, les mots de passe circuleraient en clair.
- Pas de récupération de mot de passe par e-mail : en cas d'oubli, l'administrateur peut supprimer le
  compte dans `comptes.json` (serveur arrêté), et le joueur en recrée un.

### API du serveur (pour les développeurs)

Réponses JSON ; erreur : `{ "erreur": "message lisible" }`. Les routes `moi` demandent l'en-tête
`Authorization: Bearer <jeton>`. Côté navigateur, tout passe par `COMMUN/comptes.js` (API décrite en tête
du fichier) : un jeu n'appelle jamais ces routes lui-même.

| Route | Rôle |
|---|---|
| `GET /api/etat` | le serveur répond-il ? |
| `POST /api/inscription` `{ nom, mdp }` | crée un compte → `{ jeton, compte }` |
| `POST /api/connexion` `{ nom, mdp }` | → `{ jeton, compte }` |
| `GET /api/moi` | le compte connecté `{ id, nom, couleur }` |
| `GET /api/moi/jeux/<jeu>` | statistiques du jeu pour ce compte → `{ donnees, maj }` |
| `PUT /api/moi/jeux/<jeu>` `{ donnees, publiques }` | les enregistre (`publiques` : partie visible dans les classements, ou `null`) |
| `GET /api/classements/<jeu>` | `[{ id, nom, couleur, publiques }]` des comptes qui ont publié pour ce jeu |
| `POST /api/moi/renommer` · `/api/moi/mdp` · `/api/moi/supprimer` · `/api/deconnexion` | gestion du compte |

## Ajouter un jeu

1. Créez son dossier à la racine, en **MAJUSCULES** (`MONJEU/`), avec son `index.html` et un `README.md`
   qui le décrit en détail. Tout ce qui lui est propre reste dans ce dossier.
2. Ajoutez sa ligne dans `JEUX`, au début de `COMMUN/jeux.js` (identifiant, dossier, nom, icône,
   description) : il apparaît sur la page d'accueil et dans le bouton « Jeux » de tous les jeux.
3. Dans son `index.html`, pour le bouton « Jeux » : `<link rel="stylesheet" href="../COMMUN/jeux.css">`,
   `<script src="../COMMUN/jeux.js"></script>` et `<div class="jeux-coin" data-jeux-selecteur="<id>"></div>`,
   placé en haut à droite par sa propre feuille de style (couleurs : variables `--jx-*`, voir
   `COMMUN/jeux.css`).
4. Pour les comptes : `<script src="../COMMUN/comptes.js"></script>` avant ses scripts, puis
   `Comptes.espace('<id>', { completer, fusionner, publiques })` pour ses statistiques. Toujours vérifier
   `window.Comptes` et prévoir le mode invité : le jeu doit marcher sans `COMMUN/`. Exemples :
   `GEONOHYNE_QUIZZ/js/profils.js`, `ANOTEHOMY_QUIZZ/js/account/profile.js`.

## Dossier IGNORED_BY_CLAUDE

Notes personnelles (fichiers `.txt` : idées de jeux, brouillons). Elles ne font pas partie des jeux, ne
sont jamais servies par le serveur et peuvent être ignorées par Claude.
