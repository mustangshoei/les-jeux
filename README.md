# Les jeux

Ce dossier regroupe plusieurs jeux éducatifs, en HTML, CSS et JavaScript purs (sans installation, sans
connexion Internet). Chaque jeu fonctionne **seul et indépendamment** des autres ; tous partagent un
**compte commun** et peuvent tourner en même temps, servis par un même petit serveur facultatif.

**Version de l'ensemble : 1.2.1** (voir [Versions](#versions)).

**Jouer en ligne : <https://mustangshoei.github.io/les-jeux/>** (GitHub Pages, en invité : voir « Jouer »).

| Jeu | Version | Dossier | Pour apprendre | Documentation |
|---|---|---|---|---|
| 🌍 **GéoNohyne Quizz** | 2.1.0 | `GEONOHYNE_QUIZZ/` | la géographie : départements, fleuves, pays, mers du monde (quiz, jeux, mode Apprendre) | [GEONOHYNE_QUIZZ/README.md](GEONOHYNE_QUIZZ/README.md) |
| 🦴 **Anotehomy Quizz** | 2.3.0 | `ANOTEHOMY_QUIZZ/` | l'anatomie humaine en 3D : os, ostéologie descriptive, muscles, vaisseaux sanguins, organes (corps masculin ou féminin), splanchnologie descriptive (nomenclature TA2) | [ANOTEHOMY_QUIZZ/README.md](ANOTEHOMY_QUIZZ/README.md) |
| 📜 **Histehory Quizz** | 0.1.0 | `HISTEHORY_QUIZZ/` | l'histoire (en préparation : page d'accueil et comptes seulement, aucun mode de jeu encore) — **fermé** : sa tuile reste affichée mais n'est plus cliquable | [HISTEHORY_QUIZZ/README.md](HISTEHORY_QUIZZ/README.md) |
| 🌿 **Natehure Quizz** | 0.1.0 | `NATEHURE_QUIZZ/` | la nature, les végétaux et l'agriculture (en préparation : menu et comptes seulement) — **fermé** : sa tuile reste affichée mais n'est plus cliquable | [NATEHURE_QUIZZ/README.md](NATEHURE_QUIZZ/README.md) |

## Contenu du dossier

```
game.bat                LANCEUR (Windows) : double-clic = serveur des jeux + navigateur, avec les comptes
index.html              page d'accueil : un grand rectangle par jeu (liste lue dans COMMUN/jeux.js),
                        fond animé (bulles), bouton du compte, bouton « Statistiques »,
                        tableau de bord de l'administrateur
ACCUEIL/                … son apparence et ses scripts
  accueil.css           apparence (thème clair ou sombre selon le système)
  accueil.js            les rectangles des jeux + bouton du compte (en haut à gauche)
  stats.js              bouton « Statistiques » et son panneau : les totaux du joueur, jeu par jeu
  img/                  images de fond des quatre rectangles (gravures du domaine public) + CREDITS.md
  outils/gravures.html  fabrique ces images à partir des gravures sources (mode d'emploi en tête)
  admin.js              tableau de bord de l'administrateur : comptes, défis de la semaine
README.md               ce fichier : fonctionnement général
COMMUN/                 ce que les jeux partagent (facultatif pour eux : sans lui, chaque jeu marche en invité)
  comptes.js            les comptes communs, côté navigateur (connexion, statistiques de chaque jeu)
  jeux.js               LA liste des jeux (versions, modes de jeu) + le bouton « Jeux » (changer de jeu) que chaque jeu affiche
  jeux.css              apparence de ce bouton
  police.css            LA police des titres de tout le site : la changer ici (mode d'emploi en tête)
  polices/              … ses fichiers (Dumbledor 1, avec sa licence)
SERVEUR/                le serveur des jeux (facultatif, jamais envoyé aux navigateurs)
  serveur.py            sert tous les jeux et gère les comptes communs (Python 3.8+, sans dépendance)
  docker-compose.yml    … pour le lancer dans Docker, sur un NAS
  donnees/              … les comptes (créé au premier lancement)
GEONOHYNE_QUIZZ/                le jeu GéoNohyne Quizz (tout ce qui lui est propre)
ANOTEHOMY_QUIZZ/        le jeu Anotehomy Quizz (tout ce qui lui est propre)
HISTEHORY_QUIZZ/        le jeu Histehory Quizz (en préparation, fermé)
NATEHURE_QUIZZ/         le jeu Natehure Quizz (en préparation, fermé)
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
- **En ligne, à partager** : <https://mustangshoei.github.io/les-jeux/> (dépôt public
  `mustangshoei/les-jeux`, publié par GitHub Pages depuis la branche `main`). GitHub Pages n'héberge que des
  fichiers, sans le serveur des jeux : on y joue **en invité**, comme sans rien lancer (pas de comptes, de
  tableau de bord ni de défis). Les dossiers `SERVEUR/donnees/` et `IGNORED_BY_CLAUDE/` ne sont jamais
  publiés (`.gitignore`). Mettre le site à jour : envoyer un nouveau commit sur `main`.
- **Sur un NAS ou un ordinateur toujours allumé** : voir « Héberger les jeux », puis ouvrez
  `http://<adresse-de-la-machine>:8080` depuis n'importe quel appareil du réseau : la page d'accueil
  propose les jeux ouverts. Adresses directes : `…:8080/GEONOHYNE_QUIZZ/`, `…:8080/ANOTEHOMY_QUIZZ/`,
  `…:8080/HISTEHORY_QUIZZ/` et `…:8080/NATEHURE_QUIZZ/` — les deux dernières marchent même si la page
  d'accueil n'y mène plus (voir « Accès aux jeux »).
- **Changer de jeu** : chaque jeu a un bouton **« Jeux »** en haut à droite (sur ses écrans de menu, pas
  pendant les parties). Il liste les autres jeux et la page d'accueil. On **reste connecté** d'un jeu à
  l'autre.
- **Statistiques** : bouton **sous les quatre jeux**, sur la page d'accueil. Il rassemble, pour le compte
  connecté, les totaux de chaque jeu (parties, bonnes réponses, réussite, temps) et leur cumul. En invité
  il n'y a rien à rassembler : chaque jeu garde alors ses statistiques pour lui, dans ce navigateur.
- **Changer de compte** : bouton du compte **en haut à gauche** de la page d'accueil, comme dans les jeux.
  Il permet de se connecter, de créer un compte, de **changer de compte** (l'ancien est déconnecté) ou de
  se déconnecter ; les comptes déjà connectés dans ce navigateur y sont proposés (un clic remplit le nom,
  la croix les oublie).
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
- **Chaque jeu a son propre espace dans le compte** (`geonohyne`, `anotehomy`, `histehory`…) pour ses statistiques : un
  jeu ne lit ni n'écrit jamais l'espace d'un autre. Le contenu de cet espace est choisi par le jeu ; le
  serveur ne le connaît pas.
- **Ce que voient les autres joueurs** : uniquement le nom, la couleur et ce qu'un jeu choisit de publier
  pour ses classements (GéoNohyne Quizz : les records ; Anotehomy Quizz et Histehory Quizz : rien pour
  l'instant). La liste des comptes n'est affichée qu'à l'administrateur (voir plus bas). Le navigateur
  retient les comptes qui s'y sont connectés (clé `comptes.recents`, six au plus), pour les proposer sur
  la page d'accueil.
- **Invité** : toujours possible, avec ou sans serveur ; chaque jeu garde alors ses statistiques dans le
  navigateur. À la création d'un compte, on peut reprendre les statistiques de l'invité.
- **Hors ligne** : si le serveur ne répond plus un moment, on continue de jouer avec son compte ; une copie
  des statistiques reste dans le navigateur (clé `comptes.donnees.<jeu>`) et part dès le retour du serveur.
  Après une déconnexion, ces copies sont effacées (sauf des parties pas encore envoyées).

## Administration

- **Le compte administrateur** : nom **`admin`**, mot de passe **`AdmiN`** (casse comprise : A et N
  majuscules). Le serveur le crée tout seul à son premier lancement (ou la variable `JEUX_ADMIN_MDP`
  choisit un autre mot de passe de départ). Ce nom est réservé : aucun joueur ne peut le prendre (un
  joueur qui s'appelait déjà « admin » est renommé « admin (joueur) »). Le compte administrateur ne peut
  être ni renommé ni supprimé ; dans les jeux, il joue comme un compte ordinaire.
- **Changez ce mot de passe** dès que d'autres personnes jouent sur votre réseau : tout le monde peut lire
  ce README. Dans le tableau de bord : onglet Comptes, ligne « admin », « Mot de passe ».
- **Mot de passe administrateur oublié** : arrêtez le serveur, retirez l'entrée du compte `admin` dans
  `SERVEUR/donnees/comptes.json` (celle qui contient `"admin": true`), relancez : il est recréé avec le
  mot de passe de départ.
- **Le tableau de bord** : se connecter en `admin` depuis le bouton du compte de la **page d'accueil**
  remplace la liste des jeux par le tableau de bord (le menu du compte permet de revoir les jeux). En
  tête : joueurs inscrits, venus ces 7 derniers jours, nouveaux sur 30 jours, défis prêts pour la semaine
  à venir. Puis deux onglets :
  - **Comptes** : tous les comptes, avec leur date de création, leur dernière visite (d'après leurs
    connexions encore ouvertes) et les jeux où ils ont des statistiques ; recherche par nom. Pour chacun :
    **Mot de passe** (le remplacer : ses connexions en cours sont fermées, à lui de se reconnecter avec le
    nouveau) et **Supprimer** (compte et statistiques de tous les jeux, après confirmation).
  - **Défi de la semaine** : pour une semaine (du lundi au dimanche ; la semaine à venir s'affiche
    d'abord, les flèches changent de semaine), une carte par **mode de jeu** de chaque jeu, même ceux qui
    ne sont pas encore jouables (liste : `modes` dans `COMMUN/jeux.js`). Un défi se prépare dans une
    fenêtre : titre, consigne, façon de jouer (Ciblage, Nommage, Solo, Duel… selon le mode), nombre de
    questions, difficulté et statut (**brouillon** ou **prêt**), avec l'aperçu de ce que verront les
    joueurs.
- **Les jeux n'affichent pas encore les défis** : ils sont seulement préparés et enregistrés sur le
  serveur (`comptes.json`, partie `defis` : semaine ISO → jeu → mode). Pour les brancher plus tard, il
  faudra une route publique qui donne les défis « prêts » de la semaine en cours, et leur affichage dans
  chaque jeu.

## Indépendance des jeux

Règle d'organisation : **modifier un jeu ne doit jamais toucher un autre jeu.**

- Tout ce qui est propre à un jeu (pages, styles, scripts, données, outils, documentation) est **dans son
  dossier**, et un jeu ne charge **aucun fichier d'un autre jeu**.
- Un jeu ne peut utiliser que le dossier `COMMUN/`, et seulement de façon **facultative** : si
  `COMMUN/comptes.js` manque ou plante, le jeu se joue en invité ; si `COMMUN/jeux.js` manque, il n'a
  simplement pas de bouton « Jeux ». Casser (ou supprimer) un jeu laisse donc les autres intacts.
- Les clés de stockage du navigateur sont préfixées : `geonohyne.*` pour GéoNohyne Quizz, `anotehomy.*` pour
  Anotehomy Quizz, `histehory.*` pour Histehory Quizz, `comptes.*` pour les comptes communs.
- `COMMUN/` et `SERVEUR/` sont partagés : les modifier peut concerner tous les jeux. Ils ne contiennent
  **aucune logique de jeu** (les comptes, la liste des jeux et de leurs modes, le bouton « Jeux »), pour
  rester petits et stables. Le serveur range les données de chaque jeu à part : un jeu qui envoie des données invalides
  n'abîme que son propre espace.

## Accès aux jeux

Un jeu peut être **retiré de la navigation** sans être touché : les deux réglages se font dans sa ligne
de `COMMUN/jeux.js`, et **ne changent rien à son dossier**. Son `index.html` reste entièrement
fonctionnel si on l'ouvre à la main (double-clic, ou son adresse tapée dans le navigateur).

| Réglage | Page d'accueil | Menu « Jeux » des autres jeux | Son propre menu « Jeux » |
|---|---|---|---|
| `masque: true` | aucune tuile | absent de la liste | inchangé : on peut en ressortir |
| `bloque: true` | tuile **visible**, grisée, inerte (« Fermé pour le moment ») | ligne **visible**, grisée, inerte | inchangé |

- « Inerte » veut dire que ce n'est plus un lien : une `<div>` (ou un `<span>`) avec `aria-disabled="true"`,
  dont le contenu est en `pointer-events: none` et qui affiche le curseur `not-allowed`. Ni la souris, ni
  le clavier, ni un lecteur d'écran n'y mènent. Un **cadenas** le signale, sur le rectangle de la page
  d'accueil comme dans le menu « Jeux ».
- Les deux réglages **ne concernent pas le tableau de bord de l'administrateur** : les défis de la semaine
  se préparent pour tous les jeux, masqués et bloqués compris.
- Côté code : `Jeux.liste` donne **tous** les jeux (tableau de bord) ; `Jeux.publics` donne ceux que
  l'interface publique peut montrer (les `masque` en sont retirés, chaque entrée gardant son `bloque`).
- **Ce n'est pas une protection.** Le dépôt est public : qui lit `COMMUN/jeux.js` voit le dossier. Le but
  est d'empêcher d'y arriver par l'interface, pas de cacher le jeu.

État actuel : **Histehory Quizz** et **Natehure Quizz** sont fermés. Aucun jeu n'est masqué pour le
moment : `masque` reste disponible si l'on veut un jour retirer un jeu de la liste pour de bon.

## Versions

Chaque numéro s'écrit **MAJEUR.MINEUR.CORRECTIF** (par exemple `2.1.14`). Il y en a un pour l'ensemble
et un par jeu, tous indépendants : mettre à jour un jeu ne change que la version de ce jeu.

| Nombre | On l'augmente pour… | Exemples |
|---|---|---|
| **CORRECTIF** (3e) | une correction ou une retouche, sans rien de nouveau à apprendre pour le joueur | bug corrigé, texte ou couleur retouchés, données mises à jour (populations…) : `2.0.0` → `2.0.1` |
| **MINEUR** (2e) ; le correctif repart à 0 | une nouveauté | nouveau mode de jeu, module, carte, option ou page : `2.0.3` → `2.1.0` |
| **MAJEUR** (1er) ; les deux autres repartent à 0 | une refonte, ou un changement qui demande une conversion | nouvelle apparence, menus réorganisés, nouveau format des statistiques ou des comptes : `2.4.1` → `3.0.0` |

- **0.x** : jeu en préparation (pas encore de mode de jeu complet) ; il passe en **1.0.0** à sa sortie.
- **L'ensemble** suit ce qui est commun : `COMMUN/` (comptes, liste des jeux, bouton « Jeux »), `SERVEUR/`,
  la page d'accueil et `game.bat`. Ajouter ou retirer un jeu y compte comme une version MINEURE ; un
  changement du format des comptes ou de l'API du serveur, comme une version MAJEURE.
- **Où sont les numéros** : chaque jeu note sa version et son historique dans son README ; `COMMUN/jeux.js`
  les reprend pour l'affichage (`VERSION` pour l'ensemble, `version` dans la ligne de chaque jeu) : page
  d'accueil, menu « Jeux » (« Vous y êtes · version … »), bas du menu de GéoNohyne Quizz. À chaque nouvelle
  version, changer les deux.

Historique de l'ensemble :

| Version | Date | Changements |
|---|---|---|
| 1.2.0 | 31/10/2026 | Quatrième jeu, **Natehure Quizz** (nature, agriculture & végétaux) : son menu, ses trois chapitres et ses dix-huit cartes, aucun mode de jeu encore. **Page d'accueil refondue** : un grand rectangle par jeu, haut (jusqu'à 65 % de la hauteur de la fenêtre) et au fond de sa couleur dominante — 4 de front sur ordinateur (au plus 65 % de la largeur), 2 × 2 sur tablette, 1 colonne sur téléphone ; un **fond animé** de bulles aux couleurs des quatre jeux ; dans chaque rectangle, sous ses libellés, une **gravure ancienne** fondue dans la couleur du jeu (globe de Delisle, écorché de Vésale, frise de monuments et médaillons d'Alexandre, Jeanne d'Arc et Napoléon, orme de Loudon) ; et un bouton **« Statistiques »** qui rassemble les totaux du joueur pour tous les jeux. Deux réglages d'accès dans `COMMUN/jeux.js` : `masque` (le jeu disparaît de la page d'accueil et du menu « Jeux ») et `bloque` (son rectangle reste visible mais inerte, marqué d'un cadenas). Histehory Quizz et Natehure Quizz sont tous deux fermés. |
| 1.2.1 | 31/10/2026 | Nouvelle **police des titres**, Dumbledor 1, pour l'accueil et les quatre jeux (le texte courant ne change pas). Elle se règle en un seul endroit, `COMMUN/police.css` : fichier de la police, taille, et liste des titres concernés. |
| 1.1.1 | 29/10/2026 | Publication sur GitHub Pages ; sur un hébergement sans le serveur des jeux, les comptes ne sont plus proposés (on joue en invité). |
| 1.1.0 | 29/10/2026 | Bouton du compte sur la page d'accueil (changer de compte, comptes déjà utilisés ici) ; compte administrateur et son tableau de bord (comptes, préparation des défis de la semaine) ; modes de jeu dans `COMMUN/jeux.js`. |
| 1.0.0 | 28/10/2026 | Première version numérotée : page d'accueil, comptes communs, serveur des jeux, trois jeux (GéoNohyne Quizz, Anotehomy Quizz, Histehory Quizz). |

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
(dossier des comptes), `JEUX_ADMIN_MDP` (mot de passe de départ du compte administrateur, `AdmiN` sinon). Les anciennes variables `GEOQUIZ_PORT`, `GEOQUIZ_HOTE`, `GEOQUIZ_DONNEES` marchent
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
- Pas de récupération de mot de passe par e-mail : en cas d'oubli, l'administrateur lui en donne un
  nouveau depuis le tableau de bord (voir « Administration »).
- Les routes `/api/admin/…` ne répondent qu'au compte administrateur (le serveur le vérifie à chaque
  requête : le tableau de bord ne montre rien aux autres comptes).

### API du serveur (pour les développeurs)

Réponses JSON ; erreur : `{ "erreur": "message lisible" }`. Les routes `moi` demandent l'en-tête
`Authorization: Bearer <jeton>`. Côté navigateur, tout passe par `COMMUN/comptes.js` (API décrite en tête
du fichier) : un jeu n'appelle jamais ces routes lui-même.

| Route | Rôle |
|---|---|
| `GET /api/etat` | le serveur répond-il ? |
| `POST /api/inscription` `{ nom, mdp }` | crée un compte → `{ jeton, compte }` |
| `POST /api/connexion` `{ nom, mdp }` | → `{ jeton, compte }` |
| `GET /api/moi` | le compte connecté `{ id, nom, couleur }` (+ `admin: true` pour l'administrateur) |
| `GET /api/moi/jeux/<jeu>` | statistiques du jeu pour ce compte → `{ donnees, maj }` |
| `PUT /api/moi/jeux/<jeu>` `{ donnees, publiques }` | les enregistre (`publiques` : partie visible dans les classements, ou `null`) |
| `GET /api/classements/<jeu>` | `[{ id, nom, couleur, publiques }]` des comptes qui ont publié pour ce jeu |
| `POST /api/moi/renommer` · `/api/moi/mdp` · `/api/moi/supprimer` · `/api/deconnexion` | gestion du compte |
| `GET /api/admin/comptes` | administrateur : tous les comptes `[{ id, nom, couleur, admin?, cree, vu, jeux: { <jeu>: maj } }]` |
| `POST /api/admin/comptes/<id>/mdp` `{ mdp }` · `/api/admin/comptes/<id>/supprimer` | administrateur : nouveau mot de passe (ses connexions sont fermées), suppression |
| `GET /api/admin/defis` | administrateur : défis préparés `{ <semaine>: { <jeu>: { <mode>: défi } } }` |
| `PUT /api/admin/defis/<semaine>/<jeu>/<mode>` `{ defi }` | administrateur : enregistre `{ titre, consigne, variante, questions, difficulte, statut }` (`statut` : `brouillon` ou `pret`), ou l'efface (`defi: null`) ; semaine ISO : `2026-W45` |

## Ajouter un jeu

1. Créez son dossier à la racine, en **MAJUSCULES** (`MONJEU/`), avec son `index.html` et un `README.md`
   qui le décrit en détail. Tout ce qui lui est propre reste dans ce dossier.
2. Ajoutez sa ligne dans `JEUX`, au début de `COMMUN/jeux.js` (identifiant, dossier, nom, icône,
   version, description, modes de jeu) : il apparaît sur la page d'accueil, dans le bouton « Jeux » de
   tous les jeux et dans les défis de la semaine du tableau de bord.
   Il commence en `0.1.0` (voir [Versions](#versions)) ; l'ensemble passe à la version MINEURE suivante.
   Pour le tenir hors de la navigation tant qu'il n'est pas prêt, ajoutez `masque: true` ou
   `bloque: true` à cette ligne (voir [Accès aux jeux](#accès-aux-jeux)).
3. Dans son `index.html`, pour le bouton « Jeux » : `<link rel="stylesheet" href="../COMMUN/jeux.css">`,
   `<script src="../COMMUN/jeux.js"></script>` et `<div class="jeux-coin" data-jeux-selecteur="<id>"></div>`,
   placé en haut à droite par sa propre feuille de style (couleurs : variables `--jx-*`, voir
   `COMMUN/jeux.css`).
   Pour la police des titres : `<link rel="stylesheet" href="../COMMUN/police.css">` en **dernière**
   feuille de style, puis ajoutez ses titres à la liste en bas de `COMMUN/police.css`.
4. Pour les comptes : `<script src="../COMMUN/comptes.js"></script>` avant ses scripts, puis
   `Comptes.espace('<id>', { completer, fusionner, publiques })` pour ses statistiques. Toujours vérifier
   `window.Comptes` et prévoir le mode invité : le jeu doit marcher sans `COMMUN/`. Exemples :
   `GEONOHYNE_QUIZZ/js/profils.js`, `ANOTEHOMY_QUIZZ/js/account/profile.js`.

## Dossier IGNORED_BY_CLAUDE

Notes personnelles (fichiers `.txt` : idées de jeux, brouillons). Elles ne font pas partie des jeux, ne
sont jamais servies par le serveur et sont ignorées par Claude.
