"""construire-hydrographie.py — Génère la carte et les fiches « Fleuves & Océans » de GéoNohyne Quizz.

Produit :
  data/france/carte-hydrographie.js   mers et océans (surfaces), fleuves et rivières (lignes), pays voisins (décor)
  data/france/infos-hydrographie.js   fiches : longueur, source, embouchure, départements traversés…

Utilisation (Python 3, une seule fois, uniquement pour régénérer les données) :
  python outils/construire-hydrographie.py <dossier-cache>

Le dossier cache reçoit les téléchargements (réutilisés si présents) :
  osm/<Nom>.json                       tracés OpenStreetMap (API Overpass), © contributeurs OpenStreetMap, ODbL
  ne_10m_admin_0_countries.geojson     pays voisins, Natural Earth (domaine public)
  departements-version-simplifiee.geojson   départements, gregoiredavid/france-geojson (Licence Ouverte)

La projection est EXACTEMENT celle de data/france/carte-departements.js (vérifiée) : les cours d'eau
se superposent donc aux départements. Pour ajouter un cours d'eau : une ligne dans COURS_D_EAU.
"""
import json
import math
import os
import sys
import time
import urllib.parse
import urllib.request

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Projection de data/france/carte-departements.js (calculée par js/carte.js sur les 96 départements)
MIN_LON = -5.103600745641675
MAX_LAT = 51.088402305103116
K = 0.6917937924742938
ECHELLE = 98.58049114961625
MARGE = 10

# Cadre affiché : un peu plus large que la France pour montrer les mers et les pays voisins
VUE = {'x': -60, 'y': -50, 'w': 1140, 'h': 1050}

TOL_LIGNE = 0.35        # simplification des cours d'eau (unités de la carte, 1 unité ≈ 1,1 km)
TOL_PAYS = 0.5          # simplification des pays voisins
MIN_KM_DEP = 3          # km de tracé nécessaires pour compter un département comme traversé (ou longé)

# code, nom, type, indice (lon, lat) proche du cours d'eau (choix parmi les homonymes),
# embouchure (code d'une zone de la carte), lieu de l'embouchure, longueur (km), source
COURS_D_EAU = [
    ('seine', 'Seine', 'fleuve', (2.35, 48.85), 'manche', 'Estuaire de la Seine, entre Le Havre et Honfleur', 777, 'Source-Seine, plateau de Langres (Côte-d\'Or)'),
    ('loire', 'Loire', 'fleuve', (1.0, 47.4), 'atlantique', 'Estuaire de la Loire, à Saint-Nazaire', 1006, 'Mont Gerbier de Jonc (Ardèche)'),
    ('garonne', 'Garonne', 'fleuve', (0.6, 44.2), 'atlantique', 'Bec d\'Ambès : avec la Dordogne, elle forme l\'estuaire de la Gironde', 529, 'Val d\'Aran, dans les Pyrénées (Espagne)'),
    ('rhone', 'Rhône', 'fleuve', (4.8, 45.0), 'mediterranee', 'Camargue, par deux bras (Grand Rhône et Petit Rhône)', 812, 'Glacier du Rhône (Valais, Suisse)'),
    ('rhin', 'Rhin', 'fleuve', (7.6, 48.3), 'mer-du-nord', 'Delta du Rhin et de la Meuse (Pays-Bas)', 1233, 'Alpes suisses (lac de Toma, canton des Grisons)'),
    ('meuse', 'Meuse', 'fleuve', (5.4, 49.0), 'mer-du-nord', 'Delta du Rhin et de la Meuse (Pays-Bas)', 925, 'Le Châtelet-sur-Meuse, plateau de Langres (Haute-Marne)'),
    ('escaut', 'Escaut', 'fleuve', (3.4, 50.3), 'mer-du-nord', 'Estuaire de l\'Escaut occidental (Pays-Bas)', 350, 'Gouy (Aisne)'),
    ('somme', 'Somme', 'fleuve', (2.3, 49.9), 'manche', 'Baie de Somme', 263, 'Fonsomme (Aisne)'),
    ('orne', 'Orne', 'fleuve', (-0.3, 49.0), 'manche', 'Ouistreham (Calvados)', 170, 'Aunou-sur-Orne (Orne)'),
    ('vilaine', 'Vilaine', 'fleuve', (-1.7, 47.9), 'atlantique', 'Entre Pénestin et Arzal (Morbihan)', 218, 'Juvigné (Mayenne)'),
    ('charente', 'Charente', 'fleuve', (0.0, 45.7), 'atlantique', 'Près de Rochefort, face à l\'île d\'Aix (Charente-Maritime)', 381, 'Chéronnac (Haute-Vienne)'),
    ('adour', 'Adour', 'fleuve', (-0.6, 43.7), 'atlantique', 'Entre Bayonne et Tarnos', 308, 'Près du col du Tourmalet (Hautes-Pyrénées)'),
    ('aude', 'Aude', 'fleuve', (2.35, 43.2), 'mediterranee', 'Fleury (Aude)', 224, 'Massif du Carlit (Pyrénées-Orientales)'),
    ('herault', 'Hérault', 'fleuve', (3.5, 43.6), 'mediterranee', 'Agde (Hérault)', 148, 'Mont Aigoual (Gard)'),
    ('var', 'Var', 'fleuve', (7.1, 43.85), 'mediterranee', 'Entre Saint-Laurent-du-Var et Nice', 114, 'Estenc, près du col de la Cayolle (Alpes-Maritimes)'),
    ('tet', 'Têt', 'fleuve', (2.6, 42.65), 'mediterranee', 'Canet-en-Roussillon (Pyrénées-Orientales)', 116, 'Massif du Carlit (Pyrénées-Orientales)'),

    ('marne', 'Marne', 'riviere', (3.5, 48.95), 'seine', 'Entre Charenton-le-Pont et Alfortville (Val-de-Marne)', 514, 'Balesmes-sur-Marne, plateau de Langres (Haute-Marne)'),
    ('oise', 'Oise', 'riviere', (2.6, 49.3), 'seine', 'Conflans-Sainte-Honorine (Yvelines)', 341, 'Près de Chimay (Belgique)'),
    ('aisne', 'Aisne', 'riviere', (3.5, 49.4), 'oise', 'Compiègne (Oise)', 356, 'Sommaisne, en Argonne (Meuse)'),
    ('yonne', 'Yonne', 'riviere', (3.5, 47.9), 'seine', 'Montereau-Fault-Yonne (Seine-et-Marne)', 292, 'Mont Préneley, dans le Morvan (Nièvre)'),
    ('aube', 'Aube', 'riviere', (4.3, 48.4), 'seine', 'Marcilly-sur-Seine (Marne)', 249, 'Praslay, plateau de Langres (Haute-Marne)'),
    ('eure', 'Eure', 'riviere', (1.4, 48.8), 'seine', 'Près de Pont-de-l\'Arche (Eure)', 229, 'Marchainville, dans le Perche (Orne)'),
    ('allier', 'Allier', 'riviere', (3.3, 46.3), 'loire', 'Bec d\'Allier, près de Nevers (Nièvre)', 421, 'Moure de la Gardille (Lozère)'),
    ('cher', 'Cher', 'riviere', (2.0, 47.2), 'loire', 'Villandry, près de Tours (Indre-et-Loire)', 368, 'Mérinchal (Creuse)'),
    ('indre', 'Indre', 'riviere', (1.3, 46.9), 'loire', 'Avoine, près de Chinon (Indre-et-Loire)', 279, 'Saint-Priest-la-Marche (Cher)'),
    ('vienne', 'Vienne', 'riviere', (0.6, 46.5), 'loire', 'Candes-Saint-Martin (Indre-et-Loire)', 363, 'Plateau de Millevaches (Corrèze)'),
    ('creuse', 'Creuse', 'riviere', (1.5, 46.6), 'vienne', 'Port-de-Piles (Vienne)', 264, 'Plateau de Millevaches (Creuse)'),
    ('maine', 'Maine', 'riviere', (-0.56, 47.45), 'loire', 'Bouchemaine, près d\'Angers (Maine-et-Loire)', 12, 'Confluence de la Mayenne et de la Sarthe, au nord d\'Angers'),
    ('mayenne', 'Mayenne', 'riviere', (-0.7, 48.1), 'maine', 'Au nord d\'Angers (Maine-et-Loire)', 202, 'Lalacelle (Orne)'),
    ('sarthe', 'Sarthe', 'riviere', (0.1, 48.0), 'maine', 'Au nord d\'Angers (Maine-et-Loire)', 314, 'Soligny-la-Trappe, dans le Perche (Orne)'),
    ('loir', 'Loir', 'riviere', (0.8, 47.75), 'sarthe', 'Briollay, près d\'Angers (Maine-et-Loire)', 318, 'Saint-Éman (Eure-et-Loir)'),
    ('dordogne', 'Dordogne', 'riviere', (0.8, 44.85), 'atlantique', 'Bec d\'Ambès : avec la Garonne, elle forme l\'estuaire de la Gironde', 483, 'Puy de Sancy (Puy-de-Dôme)'),
    ('lot', 'Lot', 'riviere', (1.2, 44.5), 'garonne', 'Aiguillon (Lot-et-Garonne)', 485, 'Mont Lozère (Lozère)'),
    ('tarn', 'Tarn', 'riviere', (2.2, 43.9), 'garonne', 'Boudou, près de Moissac (Tarn-et-Garonne)', 381, 'Mont Lozère (Lozère)'),
    ('aveyron', 'Aveyron', 'riviere', (1.9, 44.25), 'tarn', 'Près de Montauban (Tarn-et-Garonne)', 292, 'Sévérac-le-Château (Aveyron)'),
    ('ariege', 'Ariège', 'riviere', (1.6, 43.2), 'garonne', 'Portet-sur-Garonne, au sud de Toulouse (Haute-Garonne)', 163, 'Pyrénées, près de la frontière andorrane (Ariège)'),
    ('gers', 'Gers', 'riviere', (0.6, 43.6), 'garonne', 'Layrac, près d\'Agen (Lot-et-Garonne)', 175, 'Plateau de Lannemezan (Hautes-Pyrénées)'),
    ('vezere', 'Vézère', 'riviere', (1.2, 45.1), 'dordogne', 'Limeuil (Dordogne)', 211, 'Plateau de Millevaches (Corrèze)'),
    ('saone', 'Saône', 'riviere', (5.0, 46.8), 'rhone', 'Lyon (Rhône)', 473, 'Vioménil (Vosges)'),
    ('doubs', 'Doubs', 'riviere', (6.4, 47.2), 'saone', 'Verdun-sur-le-Doubs (Saône-et-Loire)', 453, 'Mouthe (Doubs)'),
    ('ain', 'Ain', 'riviere', (5.5, 46.2), 'rhone', 'Près de Loyettes (Ain)', 190, 'Conte, plateau de Nozeroy (Jura)'),
    ('isere', 'Isère', 'riviere', (5.8, 45.3), 'rhone', 'Au nord de Valence (Drôme)', 286, 'Glacier des sources de l\'Isère, près de Val-d\'Isère (Savoie)'),
    ('drome', 'Drôme', 'riviere', (5.1, 44.75), 'rhone', 'Entre Loriol-sur-Drôme et Livron-sur-Drôme', 110, 'La Bâtie-des-Fonds (Drôme)'),
    ('durance', 'Durance', 'riviere', (5.9, 44.0), 'rhone', 'Avignon (Vaucluse)', 323, 'Montgenèvre (Hautes-Alpes)'),
    ('ardeche', 'Ardèche', 'riviere', (4.3, 44.5), 'rhone', 'Pont-Saint-Esprit (Gard)', 125, 'Col de la Chavade (Ardèche)'),
    ('arve', 'Arve', 'riviere', (6.5, 46.05), 'rhone', 'Genève (Suisse)', 108, 'Col de Balme, massif du Mont-Blanc (Haute-Savoie)'),
    ('verdon', 'Verdon', 'riviere', (6.3, 43.8), 'durance', 'Vinon-sur-Verdon (Var)', 166, 'Près du col d\'Allos (Alpes-de-Haute-Provence)'),
    ('moselle', 'Moselle', 'riviere', (6.2, 48.9), 'rhin', 'Coblence (Allemagne)', 560, 'Col de Bussang (Vosges)'),
    ('meurthe', 'Meurthe', 'riviere', (6.5, 48.5), 'moselle', 'Pompey, près de Nancy (Meurthe-et-Moselle)', 161, 'Massif des Vosges, près du col de la Schlucht (Vosges)'),
    ('sarre', 'Sarre', 'riviere', (7.0, 48.8), 'moselle', 'Konz (Allemagne)', 246, 'Massif du Donon (Bas-Rhin, Moselle)'),
    ('ill', 'Ill', 'riviere', (7.6, 48.2), 'rhin', 'Gambsheim, au nord de Strasbourg (Bas-Rhin)', 217, 'Winkel, dans le Jura alsacien (Haut-Rhin)'),
    ('gave-de-pau', 'Gave de Pau', 'riviere', (-0.4, 43.3), 'adour', 'Bec des Gaves, près de Peyrehorade (Landes), puis l\'Adour', 193, 'Cirque de Gavarnie (Hautes-Pyrénées)'),
]

# Mers et océans : polygones grossiers (lon, lat) dessinés SOUS les terres. Seule la partie maritime est
# visible : les tracés peuvent passer sous la France ou les pays voisins, mais pas sous une frontière
# terrestre entre la France et un voisin (on y verrait la mer). Limites entre mers : définitions de l'OHI.
MERS = [
    {'code': 'mer-du-nord', 'nom': 'Mer du Nord', 'genre': 'Mer', 'etiquette': 'Mer du Nord', 'texte': (2.75, 51.45),
     'superficie': 'Environ 575 000 km²', 'cotes': ['59'],
     'riverains': 'France, Belgique, Pays-Bas, Allemagne, Danemark, Norvège, Royaume-Uni',
     'poly': [(1.40, 51.17), (1.92, 50.97), (2.3, 50.97), (2.546, 51.07), (3.0, 51.25), (4.0, 51.5),
              (11.0, 51.5), (11.0, 52.6), (0.4, 52.6), (0.4, 51.45), (1.2, 51.35)]},
    {'code': 'manche', 'nom': 'Manche', 'genre': 'Mer', 'etiquette': 'Manche', 'texte': (-2.6, 50.05),
     'superficie': 'Environ 75 000 km²', 'detail': 'Largeur minimale : 33 km, au pas de Calais',
     'cotes': ['62', '80', '76', '14', '50', '35', '22', '29'], 'riverains': 'France, Royaume-Uni',
     'poly': [(1.40, 51.17), (1.92, 50.97), (2.2, 50.7), (2.0, 50.0), (1.0, 49.5), (0.5, 49.2), (-1.0, 49.0),
              (-1.5, 48.4), (-2.5, 48.3), (-3.5, 48.3), (-4.3, 48.4), (-4.57, 48.64), (-5.71, 50.07),
              (-5.4, 50.15), (-4.0, 50.6), (-2.0, 51.0), (0.0, 51.2), (1.0, 51.25)]},
    {'code': 'atlantique', 'nom': 'Océan Atlantique', 'genre': 'Océan', 'etiquette': 'Océan Atlantique', 'texte': (-3.9, 46.3),
     'superficie': 'Environ 106 millions de km² (2ᵉ océan du monde)', 'detail': 'Au sud de la Bretagne : le golfe de Gascogne',
     'cotes': ['29', '56', '44', '85', '17', '33', '40', '64'], 'riverains': None,
     'poly': [(-7.0, 52.6), (-2.8, 52.6), (-2.8, 51.5), (-4.0, 50.6), (-5.71, 50.07), (-4.57, 48.64),
              (-4.3, 48.4), (-3.5, 48.1), (-1.8, 47.4), (-1.5, 46.8), (-0.8, 46.0), (-0.7, 45.0), (-0.9, 44.3),
              (-1.1, 43.7), (-1.6, 43.38), (-1.785, 43.373), (-2.0, 43.25), (-3.0, 43.2), (-5.0, 43.2), (-7.0, 43.2)]},
    {'code': 'mediterranee', 'nom': 'Mer Méditerranée', 'genre': 'Mer', 'etiquette': 'Mer Méditerranée', 'texte': (5.3, 42.45),
     'superficie': 'Environ 2,5 millions de km²', 'detail': 'Profondeur maximale : 5 267 m (fosse de Calypso, mer Ionienne)',
     'cotes': ['66', '11', '34', '30', '13', '83', '06', '2A', '2B'], 'riverains': None,
     'poly': [(3.174, 42.435), (3.0, 42.2), (2.3, 41.6), (1.0, 41.2), (1.0, 40.4), (11.0, 40.4), (11.0, 44.5),
              (9.0, 44.5), (8.0, 44.2), (7.6, 43.85), (7.53, 43.785), (7.3, 43.9), (6.5, 43.7), (5.5, 43.6),
              (4.5, 43.9), (3.5, 43.75), (2.9, 43.2), (2.9, 42.7), (3.05, 42.52)]},
]

OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter']


# ---------------------------------------------------------------- téléchargements
def telecharger(url, fichier, donnees=None):
    if os.path.exists(fichier) and os.path.getsize(fichier) > 200:
        return
    req = urllib.request.Request(url, data=donnees, headers={'User-Agent': 'GeoNohyneQuizz-build/1.0 (projet éducatif)'})
    contenu = urllib.request.urlopen(req, timeout=300).read()
    with open(fichier, 'wb') as f:
        f.write(contenu)


def telecharger_osm(cache, nom):
    fichier = os.path.join(cache, 'osm', nom + '.json')
    if os.path.exists(fichier) and os.path.getsize(fichier) > 200:
        return fichier
    q = ('[out:json][timeout:240];relation["waterway"="river"][~"^name(:fr)?$"~"^(Le |La |L\'|L’)?%s$"]'
         '(41.0,-5.8,51.8,10.8);out geom;' % nom)
    for essai in range(4):
        for ep in OVERPASS:
            try:
                telecharger(ep, fichier, urllib.parse.urlencode({'data': q}).encode())
                return fichier
            except Exception as e:      # serveur saturé : on essaie le suivant
                print('   ', ep, e)
                time.sleep(5)
    raise RuntimeError('téléchargement impossible : ' + nom)


# ---------------------------------------------------------------- géométrie
def proj(lon, lat):
    return ((lon - MIN_LON) * K * ECHELLE + MARGE, (MAX_LAT - lat) * ECHELLE + MARGE)


def arr(v):
    return round(v * 10) / 10


def simplifier(pts, tol):
    """Douglas-Peucker (liste ouverte de points)."""
    if len(pts) < 3:
        return pts
    garde = [False] * len(pts)
    garde[0] = garde[-1] = True
    pile = [(0, len(pts) - 1)]
    while pile:
        i, j = pile.pop()
        (ax, ay), (bx, by) = pts[i], pts[j]
        dx, dy = bx - ax, by - ay
        n = math.hypot(dx, dy) or 1e-9
        dmax, k = 0, -1
        for m in range(i + 1, j):
            d = abs(dy * pts[m][0] - dx * pts[m][1] + bx * ay - by * ax) / n
            if d > dmax:
                dmax, k = d, m
        if dmax > tol and k > 0:
            garde[k] = True
            pile += [(i, k), (k, j)]
    return [p for p, g in zip(pts, garde) if g]


def simplifier_anneau(pts, tol):
    """Douglas-Peucker sur un contour fermé : coupé en deux au point le plus éloigné du premier."""
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts = pts[:-1]
    if len(pts) < 4:
        return pts
    k = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)
    return simplifier(pts[:k + 1], tol)[:-1] + simplifier(pts[k:] + [pts[0]], tol)[:-1]


def dans_vue(p, marge=0):
    return (VUE['x'] - marge <= p[0] <= VUE['x'] + VUE['w'] + marge and
            VUE['y'] - marge <= p[1] <= VUE['y'] + VUE['h'] + marge)


def decouper_ligne(pts, marge=5):
    """Garde les morceaux de ligne dans le cadre (plus un point de part et d'autre)."""
    morceaux, cur = [], []
    for i, p in enumerate(pts):
        voisin = (i > 0 and dans_vue(pts[i - 1], marge)) or (i + 1 < len(pts) and dans_vue(pts[i + 1], marge))
        if dans_vue(p, marge) or voisin:
            cur.append(p)
        elif cur:
            morceaux.append(cur)
            cur = []
    if cur:
        morceaux.append(cur)
    return [m for m in morceaux if len(m) >= 2]


def couper_polygone(pts, marge=4):
    """Sutherland-Hodgman : polygone découpé par le cadre (élargi de « marge »)."""
    x0, y0 = VUE['x'] - marge, VUE['y'] - marge
    x1, y1 = VUE['x'] + VUE['w'] + marge, VUE['y'] + VUE['h'] + marge
    bords = [(lambda p: p[0] >= x0, lambda a, b: (x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0]))),
             (lambda p: p[0] <= x1, lambda a, b: (x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0]))),
             (lambda p: p[1] >= y0, lambda a, b: (a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0)),
             (lambda p: p[1] <= y1, lambda a, b: (a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1]), y1))]
    for dedans, inter in bords:
        if not pts:
            break
        entree, pts = pts, []
        for i, b in enumerate(entree):
            a = entree[i - 1]
            if dedans(b):
                if not dedans(a):
                    pts.append(inter(a, b))
                pts.append(b)
            elif dedans(a):
                pts.append(inter(a, b))
    return pts


def chemin(lignes, ferme=False):
    return ''.join('M' + 'L'.join('%g %g' % (arr(x), arr(y)) for x, y in l) + ('Z' if ferme else '') for l in lignes)


def distance_km(a, b):
    la1, la2 = math.radians(a[1]), math.radians(b[1])
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(math.radians(b[0] - a[0]) / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


def densifier(pts, pas_km=1.5):
    """Ajoute des points intermédiaires (tracés peu détaillés) pour le calcul des départements traversés."""
    res = pts[:1]
    for a, b in zip(pts, pts[1:]):
        n = int(distance_km(a, b) // pas_km)
        res += [(a[0] + (b[0] - a[0]) * i / (n + 1), a[1] + (b[1] - a[1]) * i / (n + 1)) for i in range(1, n + 1)]
        res.append(b)
    return res


def chainer(voies, tol_km=0.5):
    """Relie bout à bout les tronçons OSM (orientés vers l'aval), même séparés par un petit écart.
    Le tracé obtenu va donc, autant que possible, de la source à l'embouchure."""
    voies = [v[:] for v in voies if len(v) >= 2]
    proche = lambda a, b: a == b or distance_km(a, b) < tol_km
    chaines = []
    while voies:
        c = voies.pop(0)
        prolonge = True
        while prolonge:
            prolonge = False
            for i, v in enumerate(voies):
                if proche(v[0], c[-1]):
                    c += v[1:] if v[0] == c[-1] else v
                elif proche(v[-1], c[0]):
                    c = (v[:-1] if v[-1] == c[0] else v) + c
                else:
                    continue
                voies.pop(i)
                prolonge = True
                break
        chaines.append(c)
    return chaines


def point_dans(pt, anneau):
    x, y, dedans = pt[0], pt[1], False
    j = len(anneau) - 1
    for i in range(len(anneau)):
        xi, yi = anneau[i]
        xj, yj = anneau[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            dedans = not dedans
        j = i
    return dedans


# ---------------------------------------------------------------- construction
def main(cache):
    os.makedirs(os.path.join(cache, 'osm'), exist_ok=True)
    ne = os.path.join(cache, 'ne_10m_admin_0_countries.geojson')
    telecharger('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/'
                'ne_10m_admin_0_countries.geojson', ne)
    deps_f = os.path.join(cache, 'departements-version-simplifiee.geojson')
    telecharger('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/'
                'departements-version-simplifiee.geojson', deps_f)

    # Départements (pour « départements traversés ») : anneaux extérieurs + boîte englobante
    deps = []
    for f in json.load(open(deps_f, encoding='utf-8'))['features']:
        g = f['geometry']
        polys = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
        anneaux = [p[0] for p in polys]
        xs = [c[0] for a in anneaux for c in a]
        ys = [c[1] for a in anneaux for c in a]
        deps.append((f['properties']['code'], anneaux, (min(xs), min(ys), max(xs), max(ys))))

    def dep_de(p):
        for code, anneaux, (a, b, c, d) in deps:
            if a <= p[0] <= c and b <= p[1] <= d and any(point_dans(p, r) for r in anneaux):
                return code
        return None

    def departements(chaines, embouchure):
        """Départements où le cours d'eau parcourt au moins MIN_KM_DEP km, de l'amont vers l'aval.
        Ordre : point d'entrée le long de l'axe principal (le plus long tronçon continu, orienté
        vers l'embouchure), ce qui reste juste pour les cours d'eau en « U »."""
        axe = max(chaines, key=len)
        if distance_km(axe[0], embouchure) < distance_km(axe[-1], embouchure):
            axe = axe[::-1]
        axe = axe[::max(1, len(axe) // 600)]
        cl = math.cos(math.radians(axe[0][1]))
        rang = lambda p: min(range(len(axe)), key=lambda i: ((axe[i][0] - p[0]) * cl) ** 2 + (axe[i][1] - p[1]) ** 2)
        km, pos = {}, {}
        for c in chaines:
            c = densifier(c)
            for n, (a, b) in enumerate(zip(c, c[1:])):
                code = dep_de(((a[0] + b[0]) / 2, (a[1] + b[1]) / 2))
                if code:
                    km[code] = km.get(code, 0) + distance_km(a, b)
                    if n % 8 == 0 or code not in pos:
                        pos.setdefault(code, []).append(rang(a))
        garde = [c for c in km if km[c] >= MIN_KM_DEP]
        return sorted(garde, key=lambda c: (min(pos[c]), sum(pos[c]) / len(pos[c])))   # ordre d'entrée

    traces = {}         # code -> points du cours d'eau (pour situer les confluents)
    polys_mer = {m['code']: m['poly'] for m in MERS}

    def trouver_embouchure(chaines, emb):
        """Extrémité aval la plus plausible : dans la mer visée, ou la plus proche du cours d'eau visé."""
        fins = [c[-1] for c in chaines]
        if emb in polys_mer:
            dans = [f for f in fins if point_dans(f, polys_mer[emb])]
            if dans:
                return dans[0]
        elif emb in traces:
            cible = traces[emb][::5]
            return min(fins, key=lambda f: min(distance_km(f, p) for p in cible))
        return max(chaines, key=len)[-1]

    # Natural Earth (rivières d'Europe) : repli quand le tracé OSM est incomplet
    ne_rivieres, credits_ne = {}, []
    for nom_f in ('ne_10m_rivers_europe', 'ne_10m_rivers_lake_centerlines'):
        fichier = os.path.join(cache, nom_f + '.geojson')
        telecharger('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/' + nom_f + '.geojson', fichier)
        for f in json.load(open(fichier, encoding='utf-8'))['features']:
            g = f['geometry']
            if not g:
                continue
            for n in {f['properties'].get('name'), f['properties'].get('name_fr')} - {None}:
                lignes = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
                ne_rivieres.setdefault(n, []).extend([[tuple(c[:2]) for c in l] for l in lignes])

    elements, infos = [], {}

    # Mers et océans (surfaces, sous les terres)
    for m in MERS:
        pts = couper_polygone([proj(*c) for c in m['poly']])
        cx, cy = proj(*m['texte'])
        elements.append({'code': m['code'], 'nom': m['nom'], 'type': 'mer', 'dessous': True,
                         'etiquette': m['etiquette'], 'd': chemin([pts], True), 'cx': arr(cx), 'cy': arr(cy)})
        infos[m['code']] = {k: m[k] for k in ('genre', 'superficie', 'cotes', 'riverains') if m.get(k)}
        if m.get('detail'):
            infos[m['code']]['detail'] = m['detail']

    # Fleuves et rivières (lignes, au-dessus des terres)
    for code, nom, type_, indice, emb, lieu, longueur, source in COURS_D_EAU:
        donnees = json.load(open(telecharger_osm(cache, nom), encoding='utf-8'))
        rels = [r for r in donnees['elements'] if r.get('type') == 'relation']
        if not rels:
            raise RuntimeError('aucune relation OSM pour ' + nom)

        def voies(r):
            ms = [m for m in r['members'] if m.get('type') == 'way' and m.get('geometry')]
            principal = [m for m in ms if m.get('role') == 'main_stream']
            return [[(g['lon'], g['lat']) for g in m['geometry']] for m in (principal or [m for m in ms if not m.get('role')])]

        # Homonymes : on garde la relation la plus proche du point indice
        rel = min(rels, key=lambda r: min((distance_km(indice, p) for v in voies(r) for p in v), default=1e9))
        chaines = sorted(chainer(voies(rel)), key=len, reverse=True)
        mesure = sum(distance_km(c[i], c[i + 1]) for c in chaines for i in range(len(c) - 1))
        origine = 'osm=%s' % rel['id']
        # Tracé OSM incomplet (ex. Somme, en partie canalisée) : repli sur Natural Earth, moins précis
        if mesure < 0.6 * longueur and nom in ne_rivieres:
            chaines = chainer(ne_rivieres[nom])
            mesure = sum(distance_km(c[i], c[i + 1]) for c in chaines for i in range(len(c) - 1))
            origine = 'Natural Earth'
            credits_ne.append(nom)

        lignes = []
        for c in chaines:
            for morceau in decouper_ligne([proj(*p) for p in c]):
                s = simplifier(morceau, TOL_LIGNE)
                if len(s) >= 2:
                    lignes.append(s)
        if not lignes:
            raise RuntimeError('tracé hors carte : ' + nom)
        principale = max(lignes, key=len)
        mx, my = principale[len(principale) // 2]
        elements.append({'code': code, 'nom': nom, 'type': type_, 'ligne': True, 'd': chemin(lignes),
                         'cx': arr(mx), 'cy': arr(my)})
        traces[code] = [p for c in chaines for p in c]
        infos[code] = {'longueur': longueur, 'source': source, 'embouchure': emb, 'lieu': lieu,
                       'departements': departements(chaines, trouver_embouchure(chaines, emb))}
        ecart = (mesure - longueur) / longueur * 100
        print('%-12s %-14s mesuré %6.0f km / cité %5d km (%+.0f %%) — %d dép.' %
              (nom, origine, mesure, longueur, ecart, len(infos[code]['departements'])))

    # Pays voisins (décor)
    decor = []
    lon0, lon1 = MIN_LON + (VUE['x'] - MARGE) / (K * ECHELLE), MIN_LON + (VUE['x'] + VUE['w'] - MARGE) / (K * ECHELLE)
    lat1, lat0 = MAX_LAT - (VUE['y'] - MARGE) / ECHELLE, MAX_LAT - (VUE['y'] + VUE['h'] - MARGE) / ECHELLE
    for f in json.load(open(ne, encoding='utf-8'))['features']:
        p = f['properties']
        if p.get('ADM0_A3') == 'FRA':
            continue
        g = f['geometry']
        polys = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
        anneaux = []
        for poly in polys:
            r = poly[0]
            xs, ys = [c[0] for c in r], [c[1] for c in r]
            if max(xs) < lon0 or min(xs) > lon1 or max(ys) < lat0 or min(ys) > lat1:
                continue
            pts = simplifier_anneau(couper_polygone([proj(*c) for c in r]), TOL_PAYS)
            if len(pts) >= 3:
                anneaux.append(pts)
        if anneaux:
            decor.append({'nom': p.get('NAME_FR') or p.get('NAME'), 'd': chemin(anneaux, True)})

    carte = {'version': 2, 'nom': 'France : mers, fleuves et rivières',
             'credit': 'Cours d\'eau : © contributeurs OpenStreetMap (ODbL)' +
                       (' ; ' + ', '.join(credits_ne) + ' : Natural Earth' if credits_ne else '') +
                       '. Pays voisins : Natural Earth. Mers : limites simplifiées (OHI).',
             'largeur': 1020, 'hauteur': 978, 'vue': VUE, 'decor': decor, 'elements': elements}
    entete = ('/* Carte GéoNohyne Quizz : ' + carte['nom'] + '\n   ' + carte['credit'] + '\n'
              '   Fichier généré (outils/construire-hydrographie.py) : ne pas modifier à la main. */\n')
    with open(os.path.join(RACINE, 'data', 'france', 'carte-hydrographie.js'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(entete + 'GeoCarte.enregistrer("france-hydrographie", ' +
                json.dumps(carte, ensure_ascii=False, separators=(',', ':')) + ');\n')

    lignes = ',\n'.join('    %s: %s' % (json.dumps(c), json.dumps(v, ensure_ascii=False)) for c, v in infos.items())
    with open(os.path.join(RACINE, 'data', 'france', 'infos-hydrographie.js'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('/* Informations sur les mers, fleuves et rivières (mode « Apprendre »)\n'
                '   Longueurs : valeurs usuelles (Sandre / encyclopédies), longueur totale y compris hors de France.\n'
                '   Départements traversés : calculés à partir des tracés OpenStreetMap, de la source à l\'embouchure.\n'
                '   Fichier généré (outils/construire-hydrographie.py). */\n'
                '(window.GeoInfos = window.GeoInfos || {})[\'france-hydrographie\'] = {\n'
                '  source: \'Tracés © contributeurs OpenStreetMap (ODbL) ; longueurs : Sandre et encyclopédies.\',\n'
                '  zones: {\n' + lignes + '\n  }\n};\n')
    print('OK :', len(elements), 'éléments,', len(decor), 'pays voisins')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    main(sys.argv[1])
