"""serveur.py — Serveur des jeux (GéoNohyne Quizz, Anotehomy Quizz…) : les sites + les comptes communs.
Python 3.8+, aucune dépendance.

Lancement (depuis n'importe où) :
    game.bat                                  (Windows, à la racine) : double-clic, ouvre aussi le navigateur
    python SERVEUR/serveur.py                 port 8080, toutes les interfaces
    python SERVEUR/serveur.py --port 8000
    python SERVEUR/serveur.py --ouvrir        ouvre la page d'accueil dans le navigateur (ce que fait game.bat)
Puis, depuis un appareil du réseau : http://<adresse-de-la-machine>:8080  (page d'accueil : choix du jeu)
Si le serveur tourne déjà sur ce port, un second lancement ouvre simplement le navigateur.

Ce que fait ce serveur
  - Il sert les fichiers du dossier des jeux (index.html, COMMUN/, GEONOHYNE_QUIZZ/, ANOTEHOMY_QUIZZ/…),
    sauf SERVEUR/, IGNORED_BY_CLAUDE/ et les fichiers cachés.
  - Il gère les comptes, COMMUNS À TOUS LES JEUX : un compte créé dans un jeu sert dans tous les autres
    (création, connexion, déconnexion, changement de nom et de mot de passe, suppression).
  - Chaque jeu range ses statistiques dans SON espace du compte (comptes.<id>.jeux.<id du jeu>) : il ne
    lit ni n'écrit jamais l'espace d'un autre jeu. Le serveur ne connaît pas le contenu de ces espaces.
  - Chaque jeu peut publier une petite partie de ses statistiques (« publiques », par exemple les
    records de GéoNohyne Quizz) : c'est tout ce que les autres joueurs voient, dans les classements.
  - Un compte ADMINISTRATEUR (nom « admin ») est créé au premier lancement, avec le mot de passe ADMIN_MDP.
    Lui seul peut appeler les routes /api/admin/… (tableau de bord de la page d'accueil) : liste de tous
    les comptes, changement de leur mot de passe, suppression, et préparation des défis de la semaine
    (un par mode de jeu ; les jeux ne s'en servent pas encore). Il ne peut être ni renommé ni supprimé ;
    pour le recréer (mot de passe oublié) : serveur arrêté, retirer son entrée de comptes.json.

Sécurité
  - Mots de passe hachés avec PBKDF2-HMAC-SHA256 (sel aléatoire), jamais enregistrés en clair.
  - Connexion par jeton aléatoire (gardé dans le navigateur) ; le serveur n'en garde que l'empreinte.
  - Tentatives de connexion limitées par adresse IP.
  - Le serveur parle HTTP : très bien sur un réseau local. Pour un accès depuis Internet, placez-le
    derrière le proxy inverse HTTPS du NAS (voir le README à la racine).

Données : SERVEUR/donnees/comptes.json (+ une sauvegarde par jour, les 7 dernières), ou le dossier
indiqué par la variable d'environnement JEUX_DONNEES. Un fichier de l'ancien serveur du jeu de géographie
seul (version 1, quand GéoNohyne Quizz s'appelait GéoQuiz) est converti tout seul au premier lancement
(copie de l'original : comptes-v1.json) ; les espaces « geoquiz » (ancien nom) deviennent « geonohyne ».
"""
import argparse
import hashlib
import hmac
import json
import os
import re
import secrets
import shutil
import socket
import sys
import threading
import time
import urllib.request
import webbrowser
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))     # dossier qui regroupe les jeux
# Variables d'environnement : JEUX_*, ou les anciennes GEOQUIZ_* (serveur d'avant les comptes communs)
DONNEES = (os.environ.get('JEUX_DONNEES') or os.environ.get('GEOQUIZ_DONNEES')
           or os.path.join(RACINE, 'SERVEUR', 'donnees'))
FICHIER = os.path.join(DONNEES, 'comptes.json')
# Jamais envoyés aux navigateurs (en plus des fichiers cachés et du dossier des données)
DOSSIERS_PRIVES = [os.path.join(RACINE, n) for n in ('SERVEUR', 'IGNORED_BY_CLAUDE')] + [DONNEES]

LONGUEUR_NOM = 20
MDP_MIN = 4
MDP_MAX = 200
ITERATIONS = 120_000                  # PBKDF2 : assez lent pour un attaquant, rapide pour un NAS
JETON_DUREE_JOURS = 365               # une connexion reste valable un an sans retour
MAX_CORPS = 3 * 1024 * 1024           # requêtes de 3 Mo au plus (historique GéoNohyne Quizz de 1 000 parties ≈ 200 Ko)
ID_JEU = re.compile(r'[a-z0-9][a-z0-9-]{0,31}')     # identifiant d'un jeu (« geonohyne », « anotehomy »)
ANCIENS_IDS = {'geoquiz': 'geonohyne'}              # jeux renommés : ancien identifiant -> nouveau
ESSAIS_MAX = 10                       # échecs de connexion autorisés par adresse IP…
ESSAIS_FENETRE = 10 * 60              # … sur 10 minutes
SAUVEGARDES = 7                       # sauvegardes quotidiennes gardées
COULEURS = ['#2563eb', '#db2777', '#16a34a', '#ea580c', '#7c3aed', '#0891b2', '#ca8a04', '#dc2626']
ADMIN_NOM = 'admin'                   # nom réservé au compte administrateur
ADMIN_MDP = os.environ.get('JEUX_ADMIN_MDP') or 'AdmiN'      # son mot de passe à la création (casse comprise)
ADMIN_COULEUR = '#475569'
SEMAINE = re.compile(r'\d{4}-W\d\d')  # semaine ISO d'un défi (« 2026-W45 »)
DEFI_TITRE_MAX = 80
DEFI_CONSIGNE_MAX = 600
DEFI_QUESTIONS_MAX = 200
DIFFICULTES = ('', 'facile', 'moyen', 'difficile')
STATUTS = ('brouillon', 'pret')

verrou = threading.Lock()
echecs = {}                           # ip -> [horodatages des échecs récents]


def maintenant():
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


class ErreurApi(Exception):
    def __init__(self, statut, message):
        super().__init__(message)
        self.statut = statut
        self.message = message


# ------------------------------------------------------------------ données
def migrer(d):
    """Version 1 (serveur du jeu de géographie seul) : le profil de chaque compte devient son espace
    « geonohyne », et ses records sont publiés pour les classements. Jeu renommé (ANCIENS_IDS) : son
    espace prend le nouvel identifiant. Renvoie True si quelque chose a changé."""
    change = d.get('version') != 2
    for c in d['comptes'].values():
        if 'jeux' not in c:
            c['jeux'] = {}
            if isinstance(c.get('profil'), dict):
                p = c['profil']
                records = p.get('records') if isinstance(p.get('records'), dict) else {}
                c['jeux']['geonohyne'] = {'donnees': p, 'publiques': {'records': records}, 'maj': c.get('maj') or maintenant()}
            change = True
        for ancien in ('profil', 'maj'):
            if ancien in c:
                del c[ancien]
                change = True
        for ancien, nouveau in ANCIENS_IDS.items():
            if ancien in c['jeux']:
                e = c['jeux'].pop(ancien)
                c['jeux'].setdefault(nouveau, e)      # un espace déjà au nouveau nom est gardé
                change = True
    d['version'] = 2
    return change


def assurer_admin(d):
    """Le compte administrateur existe toujours : créé (nom ADMIN_NOM, mot de passe ADMIN_MDP) s'il manque.
    Un joueur qui portait déjà ce nom est renommé. Renvoie True si quelque chose a changé."""
    if any(c.get('admin') for c in d['comptes'].values()):
        return False
    for c in d['comptes'].values():
        if c['nom'].casefold() == ADMIN_NOM:
            c['nom'] = ADMIN_NOM + ' (joueur)'
            print('Le joueur « %s » s\'appelle désormais « %s » (nom réservé à l\'administrateur).' % (ADMIN_NOM, c['nom']), flush=True)
    d['comptes']['c' + secrets.token_hex(6)] = {'nom': ADMIN_NOM, 'couleur': ADMIN_COULEUR, 'cree': maintenant(),
                                               'mdp': hacher(ADMIN_MDP), 'jeux': {}, 'admin': True}
    print('Compte administrateur créé : nom « %s ».' % ADMIN_NOM, flush=True)
    return True


def charger():
    try:
        with open(FICHIER, encoding='utf-8') as f:
            d = json.load(f)
    except FileNotFoundError:
        d = {'version': 2, 'comptes': {}, 'jetons': {}}
    d.setdefault('comptes', {})
    d.setdefault('jetons', {})
    d.setdefault('defis', {})             # semaine -> jeu -> mode -> défi
    if d.get('version', 1) < 2 and not os.path.exists(os.path.join(DONNEES, 'comptes-v1.json')):
        shutil.copyfile(FICHIER, os.path.join(DONNEES, 'comptes-v1.json'))     # l'original, au cas où
    change = migrer(d)
    if assurer_admin(d) or change:
        sauver(d)
    return d


def sauver(d):
    """Écriture atomique (fichier temporaire puis remplacement) + une sauvegarde par jour.
    JSON lisible (indenté de 4 espaces, accents en clair) : on peut l'ouvrir et le corriger à la main,
    serveur arrêté (sinon le serveur réécrit le fichier à la modification suivante)."""
    os.makedirs(DONNEES, exist_ok=True)
    tmp = FICHIER + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=4)
        f.write('\n')
    os.replace(tmp, FICHIER)
    jour = os.path.join(DONNEES, 'sauvegarde-' + datetime.now().strftime('%Y-%m-%d') + '.json')
    if not os.path.exists(jour):
        shutil.copyfile(FICHIER, jour)
        anciennes = sorted(n for n in os.listdir(DONNEES) if re.fullmatch(r'sauvegarde-\d{4}-\d\d-\d\d\.json', n))
        for n in anciennes[:-SAUVEGARDES]:
            os.remove(os.path.join(DONNEES, n))


donnees = None                        # chargées au lancement (main)


def hacher(mdp, sel=None):
    sel = sel or secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac('sha256', mdp.encode('utf-8'), bytes.fromhex(sel), ITERATIONS).hex()
    return {'sel': sel, 'hash': h, 'iterations': ITERATIONS}


def verifier_mdp(mdp, m):
    h = hashlib.pbkdf2_hmac('sha256', mdp.encode('utf-8'), bytes.fromhex(m['sel']), m.get('iterations', ITERATIONS)).hex()
    return hmac.compare_digest(h, m['hash'])


def empreinte(jeton):
    return hashlib.sha256(jeton.encode('utf-8')).hexdigest()


def nom_valide(nom, sauf=None):
    n = re.sub(r'\s+', ' ', str(nom or '')).strip()
    if not n:
        raise ErreurApi(400, 'Choisissez un nom.')
    if len(n) > LONGUEUR_NOM:
        raise ErreurApi(400, 'Nom trop long (%d caractères au plus).' % LONGUEUR_NOM)
    if n.casefold() in ('invité', 'invite', ADMIN_NOM):
        raise ErreurApi(400, 'Ce nom est réservé.')
    for cid, c in donnees['comptes'].items():
        if cid != sauf and c['nom'].casefold() == n.casefold():
            raise ErreurApi(409, 'Ce nom est déjà pris.')
    return n


def mdp_valide(mdp):
    m = str(mdp or '')
    if len(m) < MDP_MIN:
        raise ErreurApi(400, 'Mot de passe trop court (%d caractères au moins).' % MDP_MIN)
    if len(m) > MDP_MAX:
        raise ErreurApi(400, 'Mot de passe trop long.')
    return m


def jeu_valide(jeu):
    if not ID_JEU.fullmatch(jeu or ''):
        raise ErreurApi(404, 'Jeu inconnu.')
    return ANCIENS_IDS.get(jeu, jeu)          # une page restée ouverte sur l'ancien nom écrit au bon endroit


def defi_valide(d):
    """Un défi de la semaine, tel que l'administrateur le prépare : seuls ces champs sont gardés."""
    if not isinstance(d, dict):
        raise ErreurApi(400, 'Défi illisible.')
    titre = re.sub(r'\s+', ' ', str(d.get('titre') or '')).strip()
    if not titre:
        raise ErreurApi(400, 'Donnez un titre au défi.')
    if len(titre) > DEFI_TITRE_MAX:
        raise ErreurApi(400, 'Titre trop long (%d caractères au plus).' % DEFI_TITRE_MAX)
    consigne = str(d.get('consigne') or '').strip()
    if len(consigne) > DEFI_CONSIGNE_MAX:
        raise ErreurApi(400, 'Consigne trop longue (%d caractères au plus).' % DEFI_CONSIGNE_MAX)
    questions = d.get('questions')
    if questions is not None and (type(questions) is not int or not 1 <= questions <= DEFI_QUESTIONS_MAX):
        raise ErreurApi(400, 'Nombre de questions : de 1 à %d.' % DEFI_QUESTIONS_MAX)
    if d.get('difficulte', '') not in DIFFICULTES or d.get('statut') not in STATUTS:
        raise ErreurApi(400, 'Difficulté ou statut inconnu.')
    return {'titre': titre, 'consigne': consigne, 'variante': re.sub(r'\s+', ' ', str(d.get('variante') or '')).strip()[:40],
            'questions': questions, 'difficulte': d.get('difficulte', ''), 'statut': d['statut'], 'maj': maintenant()}


def nouveau_jeton(cid):
    jeton = secrets.token_urlsafe(32)
    t = maintenant()
    donnees['jetons'][empreinte(jeton)] = {'compte': cid, 'cree': t, 'vu': t}
    return jeton


def public(cid):
    c = donnees['comptes'][cid]
    p = {'id': cid, 'nom': c['nom'], 'couleur': c['couleur']}
    if c.get('admin'):
        p['admin'] = True
    return p


def purger_jetons():
    limite = time.time() - JETON_DUREE_JOURS * 86400
    for e, j in list(donnees['jetons'].items()):
        if j['compte'] not in donnees['comptes'] or datetime.fromisoformat(j['vu']).timestamp() < limite:
            del donnees['jetons'][e]


# ------------------------------------------------------------------ limitation des essais
def trop_d_essais(ip):
    t = time.time()
    liste = [x for x in echecs.get(ip, []) if t - x < ESSAIS_FENETRE]
    echecs[ip] = liste
    return len(liste) >= ESSAIS_MAX


def noter_echec(ip):
    echecs.setdefault(ip, []).append(time.time())


# ------------------------------------------------------------------ serveur HTTP
class Gestionnaire(SimpleHTTPRequestHandler):
    server_version = 'Jeux/2.0'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=RACINE, **kwargs)

    def log_message(self, fmt, *args):          # journal sobre : pas les fichiers statiques
        if self.path.startswith('/api/') or (args and str(args[1]).startswith(('4', '5'))):
            sys.stderr.write('%s %s\n' % (self.address_string(), fmt % args))

    # ----- fichiers statiques : tout sauf les dossiers privés et les fichiers cachés
    def chemin_interdit(self):
        chemin = unquote(urlsplit(self.path).path)
        if any(p.startswith('.') for p in chemin.split('/') if p):
            return True
        # Chemin réel (casse, noms courts Windows, liens résolus) comparé aux dossiers privés
        reel = os.path.normcase(os.path.realpath(self.translate_path(self.path)))
        if '__pycache__' in reel.split(os.sep):
            return True
        for d in DOSSIERS_PRIVES:
            d = os.path.normcase(os.path.realpath(d))
            if reel == d or reel.startswith(d + os.sep):
                return True
        return False

    def do_GET(self):
        if self.path.startswith('/api/'):
            return self.api('GET')
        if self.chemin_interdit():
            return self.send_error(HTTPStatus.NOT_FOUND)
        return super().do_GET()

    def do_HEAD(self):
        if self.path.startswith('/api/') or self.chemin_interdit():
            return self.send_error(HTTPStatus.NOT_FOUND)
        return super().do_HEAD()

    def do_POST(self):
        self.api('POST')

    def do_PUT(self):
        self.api('PUT')

    def end_headers(self):
        # Fichiers des jeux toujours revalidés : une mise à jour est vue tout de suite par les amis
        if not self.path.startswith('/api/'):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    # ----- API JSON
    def repondre(self, statut, objet):
        corps = json.dumps(objet, ensure_ascii=False).encode('utf-8')
        self.send_response(statut)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(corps)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(corps)

    def lire_json(self):
        n = int(self.headers.get('Content-Length') or 0)
        if n > MAX_CORPS:
            raise ErreurApi(413, 'Données trop volumineuses.')
        if not n:
            return {}
        try:
            d = json.loads(self.rfile.read(n).decode('utf-8'))
        except (ValueError, UnicodeDecodeError):
            raise ErreurApi(400, 'Requête illisible.')
        if not isinstance(d, dict):
            raise ErreurApi(400, 'Requête illisible.')
        return d

    def compte_connecte(self):
        entete = self.headers.get('Authorization') or ''
        jeton = entete[7:].strip() if entete.startswith('Bearer ') else ''
        j = donnees['jetons'].get(empreinte(jeton)) if jeton else None
        if not j or j['compte'] not in donnees['comptes']:
            raise ErreurApi(401, 'Session expirée : reconnectez-vous.')
        if j['vu'][:10] != maintenant()[:10]:      # « vu » mis à jour une fois par jour au plus
            j['vu'] = maintenant()
            sauver(donnees)
        return j['compte'], empreinte(jeton)

    def api(self, methode):
        route = urlsplit(self.path).path.rstrip('/')
        ip = self.client_address[0]
        try:
            with verrou:
                statut, objet = self.traiter(methode, route, ip)
            self.repondre(statut, objet)
        except ErreurApi as e:
            self.repondre(e.statut, {'erreur': e.message})
        except Exception as e:                    # erreur inattendue : on la journalise, sans planter
            sys.stderr.write('Erreur %s %s : %r\n' % (methode, route, e))
            self.repondre(500, {'erreur': 'Erreur du serveur.'})

    def traiter(self, methode, route, ip):
        if methode == 'GET' and route == '/api/etat':
            return 200, {'ok': True, 'comptes': len(donnees['comptes'])}

        # Classements d'un jeu : nom, couleur et partie publique des statistiques (rien d'autre n'est public)
        m = re.fullmatch(r'/api/classements/([^/]+)', route)
        if methode == 'GET' and m:
            jeu = jeu_valide(m.group(1))
            return 200, {'comptes': [dict(public(cid), publiques=c['jeux'][jeu]['publiques'])
                                     for cid, c in donnees['comptes'].items()
                                     if c['jeux'].get(jeu, {}).get('publiques')]}

        if methode == 'POST' and route == '/api/inscription':
            d = self.lire_json()
            nom = nom_valide(d.get('nom'))
            mdp = mdp_valide(d.get('mdp'))
            cid = 'c' + secrets.token_hex(6)
            donnees['comptes'][cid] = {'nom': nom, 'couleur': COULEURS[len(donnees['comptes']) % len(COULEURS)],
                                       'cree': maintenant(), 'mdp': hacher(mdp), 'jeux': {}}
            jeton = nouveau_jeton(cid)
            sauver(donnees)
            return 201, {'jeton': jeton, 'compte': public(cid)}

        if methode == 'POST' and route == '/api/connexion':
            if trop_d_essais(ip):
                raise ErreurApi(429, 'Trop d\'essais : réessayez dans quelques minutes.')
            d = self.lire_json()
            nom = re.sub(r'\s+', ' ', str(d.get('nom') or '')).strip().casefold()
            cid = next((k for k, c in donnees['comptes'].items() if c['nom'].casefold() == nom), None)
            if not cid or not verifier_mdp(str(d.get('mdp') or ''), donnees['comptes'][cid]['mdp']):
                noter_echec(ip)
                raise ErreurApi(401, 'Nom ou mot de passe incorrect.')
            purger_jetons()
            jeton = nouveau_jeton(cid)
            sauver(donnees)
            return 200, {'jeton': jeton, 'compte': public(cid)}

        # ----- routes réservées au compte connecté
        cid, emp = self.compte_connecte()
        compte = donnees['comptes'][cid]

        if methode == 'GET' and route == '/api/moi':
            return 200, {'compte': public(cid)}

        # Espace d'un jeu dans le compte : ses statistiques (contenu libre, choisi par le jeu)
        m = re.fullmatch(r'/api/moi/jeux/([^/]+)', route)
        if m:
            jeu = jeu_valide(m.group(1))
            if methode == 'GET':
                e = compte['jeux'].get(jeu) or {}
                return 200, {'donnees': e.get('donnees'), 'maj': e.get('maj')}
            if methode == 'PUT':
                d = self.lire_json()
                if not isinstance(d.get('donnees'), dict):
                    raise ErreurApi(400, 'Statistiques invalides.')
                publiques = d.get('publiques') if isinstance(d.get('publiques'), dict) else None
                compte['jeux'][jeu] = {'donnees': d['donnees'], 'publiques': publiques, 'maj': maintenant()}
                sauver(donnees)
                return 200, {'ok': True, 'maj': compte['jeux'][jeu]['maj']}

        if route.startswith('/api/admin/'):
            if not compte.get('admin'):
                raise ErreurApi(403, 'Réservé à l\'administrateur.')
            return self.traiter_admin(methode, route, emp)

        if methode == 'POST' and route == '/api/moi/renommer':
            if compte.get('admin'):
                raise ErreurApi(403, 'Le compte administrateur garde son nom.')
            compte['nom'] = nom_valide(self.lire_json().get('nom'), sauf=cid)
            sauver(donnees)
            return 200, {'compte': public(cid)}

        if methode == 'POST' and route == '/api/moi/mdp':
            d = self.lire_json()
            if not verifier_mdp(str(d.get('ancien') or ''), compte['mdp']):
                raise ErreurApi(403, 'Mot de passe actuel incorrect.')
            compte['mdp'] = hacher(mdp_valide(d.get('nouveau')))
            for e in [e for e, j in donnees['jetons'].items() if j['compte'] == cid and e != emp]:
                del donnees['jetons'][e]          # les autres appareils devront se reconnecter
            sauver(donnees)
            return 200, {'ok': True}

        if methode == 'POST' and route == '/api/moi/supprimer':
            if compte.get('admin'):
                raise ErreurApi(403, 'Le compte administrateur ne peut pas être supprimé.')
            if not verifier_mdp(str(self.lire_json().get('mdp') or ''), compte['mdp']):
                raise ErreurApi(403, 'Mot de passe incorrect.')
            del donnees['comptes'][cid]
            purger_jetons()
            sauver(donnees)
            return 200, {'ok': True}

        if methode == 'POST' and route == '/api/deconnexion':
            donnees['jetons'].pop(emp, None)
            sauver(donnees)
            return 200, {'ok': True}

        raise ErreurApi(404, 'Route inconnue.')

    # ----- routes de l'administrateur (tableau de bord de la page d'accueil)
    def traiter_admin(self, methode, route, emp):
        # Tous les comptes : création, dernière visite (connexion encore ouverte la plus récente), jeux joués
        if methode == 'GET' and route == '/api/admin/comptes':
            vus = {}
            for j in donnees['jetons'].values():
                vus[j['compte']] = max(vus.get(j['compte'], ''), j['vu'])
            return 200, {'comptes': [dict(public(k), cree=c.get('cree'), vu=vus.get(k),
                                          jeux={jeu: e.get('maj') for jeu, e in c['jeux'].items()})
                                     for k, c in donnees['comptes'].items()]}

        m = re.fullmatch(r'/api/admin/comptes/([^/]+)/(mdp|supprimer)', route)
        if methode == 'POST' and m:
            cible = m.group(1)
            if cible not in donnees['comptes']:
                raise ErreurApi(404, 'Ce compte n\'existe plus.')
            if m.group(2) == 'mdp':
                donnees['comptes'][cible]['mdp'] = hacher(mdp_valide(self.lire_json().get('mdp')))
                for e in [e for e, j in donnees['jetons'].items() if j['compte'] == cible and e != emp]:
                    del donnees['jetons'][e]      # ses connexions sont fermées (sauf celle de l'administrateur)
            else:
                if donnees['comptes'][cible].get('admin'):
                    raise ErreurApi(403, 'Le compte administrateur ne peut pas être supprimé.')
                del donnees['comptes'][cible]
                purger_jetons()
            sauver(donnees)
            return 200, {'ok': True}

        if methode == 'GET' and route == '/api/admin/defis':
            return 200, {'defis': donnees['defis']}

        # Défi d'un mode de jeu pour une semaine : { defi: {...} } l'enregistre, { defi: null } l'efface
        m = re.fullmatch(r'/api/admin/defis/([^/]+)/([^/]+)/([^/]+)', route)
        if methode == 'PUT' and m:
            semaine, jeu, mode = m.groups()
            if not SEMAINE.fullmatch(semaine) or not ID_JEU.fullmatch(mode):
                raise ErreurApi(404, 'Semaine ou mode inconnu.')
            jeu = jeu_valide(jeu)
            d = self.lire_json().get('defi')
            if d is None:
                modes = donnees['defis'].get(semaine, {}).get(jeu, {})
                modes.pop(mode, None)
                if not modes:
                    donnees['defis'].get(semaine, {}).pop(jeu, None)
                if not donnees['defis'].get(semaine, True):
                    del donnees['defis'][semaine]
                defi = None
            else:
                defi = defi_valide(d)
                donnees['defis'].setdefault(semaine, {}).setdefault(jeu, {})[mode] = defi
            sauver(donnees)
            return 200, {'defi': defi}

        raise ErreurApi(404, 'Route inconnue.')


class Serveur(ThreadingHTTPServer):
    # Sous Windows, SO_REUSEADDR laisserait démarrer un second serveur sur un port déjà pris, sans erreur
    allow_reuse_address = os.name != 'nt'


def deja_lance(port):
    """Le serveur des jeux répond-il déjà sur ce port (sur cette machine) ?"""
    try:      # essai court d'abord : sous Windows, un refus de connexion met sinon 2 s à arriver
        socket.create_connection(('127.0.0.1', port), timeout=0.5).close()
    except OSError:
        return False
    try:
        with urllib.request.urlopen('http://127.0.0.1:%d/api/etat' % port, timeout=3) as r:
            return json.loads(r.read().decode('utf-8')).get('ok') is True
    except Exception:
        return False


def adresse_reseau():
    """Adresse de cette machine sur le réseau local (pour les autres appareils), ou None."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(('192.0.2.1', 80))          # rien n'est envoyé : sert seulement à choisir l'interface réseau
            ip = s.getsockname()[0]
        return None if ip.startswith('127.') else ip
    except OSError:
        return None


def main():
    global donnees
    ap = argparse.ArgumentParser(description='Serveur des jeux (sites + comptes communs)')
    ap.add_argument('--port', type=int, default=int(os.environ.get('JEUX_PORT') or os.environ.get('GEOQUIZ_PORT') or 8080))
    ap.add_argument('--hote', default=os.environ.get('JEUX_HOTE') or os.environ.get('GEOQUIZ_HOTE') or '0.0.0.0')
    ap.add_argument('--ouvrir', action='store_true', help='ouvre la page d\'accueil dans le navigateur (game.bat)')
    a = ap.parse_args()
    local = 'http://localhost:%d/' % a.port

    if deja_lance(a.port):                        # deuxième double-clic sur game.bat : on ouvre juste le navigateur
        print('Le serveur des jeux tourne déjà : %s' % local, flush=True)
        if a.ouvrir:
            webbrowser.open(local)
        return
    try:
        serveur = Serveur((a.hote, a.port), Gestionnaire)
    except OSError:
        sys.exit('Le port %d est déjà utilisé par un autre programme. Choisissez-en un autre, par exemple : --port 8081' % a.port)

    os.makedirs(DONNEES, exist_ok=True)
    donnees = charger()
    print('Jeux : %s  (données : %s)' % (local if a.hote in ('0.0.0.0', '127.0.0.1') else 'http://%s:%d/' % (a.hote, a.port), DONNEES), flush=True)
    ip = adresse_reseau() if a.hote == '0.0.0.0' else None
    if ip:
        print('Depuis un autre appareil du réseau : http://%s:%d/' % (ip, a.port), flush=True)
    if a.ouvrir:
        threading.Timer(0.5, webbrowser.open, [local]).start()
    try:
        serveur.serve_forever()
    except KeyboardInterrupt:
        print('\nArrêt.')


if __name__ == '__main__':
    main()
