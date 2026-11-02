"""placer-prefectures.py — Place les préfectures sur la carte de France de GéoNohyne Quizz.

Produit :
  data/france/points-prefectures.js   position de la préfecture de chaque département, en unités de la carte

Utilisation (Python 3, une seule fois, uniquement pour régénérer les données) :
  python outils/placer-prefectures.py <dossier-cache>

Le dossier cache reçoit les téléchargements (réutilisés si présents) :
  departements-version-simplifiee.geojson   départements de métropole, gregoiredavid/france-geojson (Licence Ouverte)
  departements-avec-outre-mer.geojson       les mêmes avec l'Outre-Mer, pour les encadrés des DOM
Les positions sont celles des mairies (geo.api.gouv.fr, Licence Ouverte) ; il faut une connexion Internet.

La projection est EXACTEMENT celle de data/france/carte-departements.js : celle de js/carte.js pour la
métropole (calculée sur le GeoJSON simplifié), celle de outils/ajouter-outre-mer.js pour chaque encadré
des DOM. Les noms des préfectures viennent de data/france/infos-departements.js. Une préfecture que le
tracé simplifié de la côte ou d'une limite laisse dehors, ou presque sur le bord (Ajaccio, Cayenne,
Mâcon…), est décalée d'un cheveu vers l'intérieur de son département (MARGE).
"""
import json
import math
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARTE = os.path.join(RACINE, 'data', 'france', 'carte-departements.js')
INFOS = os.path.join(RACINE, 'data', 'france', 'infos-departements.js')
SORTIE = os.path.join(RACINE, 'data', 'france', 'points-prefectures.js')
SOURCE_GEOJSON = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/'
API = 'https://geo.api.gouv.fr/communes?'

MARGE = 1.0              # distance minimale (unités de la carte, ≈ 1,1 km en métropole) entre la préfecture et le bord

# Encadrés des DOM : ceux de outils/ajouter-outre-mer.js (x, y, l, h ; marge intérieure de 12)
ENCADRES = {'973': (14, 470, 190, 230), '971': (14, 712, 190, 130), '972': (14, 854, 190, 114),
            '974': (640, 836, 140, 132), '976': (790, 836, 130, 132)}
MARGE_ENCADRE = 12


def telecharger(cache, nom):
    chemin = os.path.join(cache, nom)
    if not os.path.exists(chemin):
        print('Téléchargement de', nom)
        urllib.request.urlretrieve(SOURCE_GEOJSON + nom, chemin)
    with open(chemin, encoding='utf-8') as f:
        return json.load(f)


def polygones(g):
    return [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates'] if g['type'] == 'MultiPolygon' else []


def coordonnees(features):
    return [c for f in features for p in polygones(f['geometry']) for r in p for c in r]


def projection_metropole(geo):
    """js/carte.js (construire) : équirectangulaire corrigée par cos(latitude moyenne), 1000 de large, marge 10."""
    cs = coordonnees([f for f in geo['features'] if str(f['properties']['code']) not in ENCADRES])
    min_lon, max_lon = min(c[0] for c in cs), max(c[0] for c in cs)
    min_lat, max_lat = min(c[1] for c in cs), max(c[1] for c in cs)
    k = math.cos((min_lat + max_lat) / 2 * math.pi / 180)
    echelle = 1000 / ((max_lon - min_lon) * k)
    return lambda lon, lat: ((lon - min_lon) * k * echelle + 10, (max_lat - lat) * echelle + 10)


def projection_encadre(feature, boite):
    """outils/ajouter-outre-mer.js (construireDOM) : le territoire ajusté et centré dans son encadré."""
    x, y, l, h = boite
    cs = coordonnees([feature])
    min_lon, max_lon = min(c[0] for c in cs), max(c[0] for c in cs)
    min_lat, max_lat = min(c[1] for c in cs), max(c[1] for c in cs)
    k = math.cos((min_lat + max_lat) / 2 * math.pi / 180)
    largeur, hauteur = (max_lon - min_lon) * k, max_lat - min_lat
    dispo_l, dispo_h = l - 2 * MARGE_ENCADRE, h - 2 * MARGE_ENCADRE
    echelle = min(dispo_l / largeur, dispo_h / hauteur)
    ox = x + MARGE_ENCADRE + (dispo_l - largeur * echelle) / 2
    oy = y + MARGE_ENCADRE + (dispo_h - hauteur * echelle) / 2
    return lambda lon, lat: ((lon - min_lon) * k * echelle + ox, (max_lat - lat) * echelle + oy)


def anneaux(d):
    res = []
    for a in d.split('M')[1:]:
        n = [float(v) for v in re.findall(r'-?\d+(?:\.\d+)?', a)]
        res.append(list(zip(n[0::2], n[1::2])))
    return res


def dedans(x, y, rings):
    n = 0
    for r in rings:
        for i in range(len(r)):
            (x1, y1), (x2, y2) = r[i], r[(i + 1) % len(r)]
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                n += 1
    return n % 2 == 1


def distance_bord(x, y, rings):
    best = math.inf
    for r in rings:
        for i in range(len(r)):
            (x1, y1), (x2, y2) = r[i], r[(i + 1) % len(r)]
            dx, dy = x2 - x1, y2 - y1
            t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy or 1)))
            best = min(best, math.hypot(x - x1 - t * dx, y - y1 - t * dy))
    return best


def recaler(x, y, rings):
    """Le point le plus proche, dans le département, à MARGE au moins du bord (cercles de plus en plus grands)."""
    if dedans(x, y, rings) and distance_bord(x, y, rings) >= MARGE:
        return x, y
    for i in range(1, 41):
        r = i * 0.25
        for j in range(32):
            a = j * math.pi / 16
            px, py = x + r * math.cos(a), y + r * math.sin(a)
            if dedans(px, py, rings) and distance_bord(px, py, rings) >= MARGE:
                return px, py
    raise ValueError('aucune place à l\'intérieur')


def plier(s):
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]', '', s)


def main():
    if len(sys.argv) != 2:
        sys.exit('Usage : python outils/placer-prefectures.py <dossier-cache>')
    cache = sys.argv[1]
    os.makedirs(cache, exist_ok=True)

    texte = open(CARTE, encoding='utf-8').read()
    debut = texte.index('GeoCarte.enregistrer(')
    carte = json.loads(texte[texte.index(',', debut) + 1:texte.rindex(');')])
    traces = {e['code']: anneaux(e['d']) for e in carte['elements']}

    infos = open(INFOS, encoding='utf-8').read()
    prefectures = {m.group(1): re.sub(r'\s*\(.*\)\s*$', '', m.group(2).replace("\\'", "'")) for m in re.finditer(
        r"'(\w+)': \{ region: '(?:[^'\\]|\\.)*', prefecture: '((?:[^'\\]|\\.)*)'", infos)}

    metropole = projection_metropole(telecharger(cache, 'departements-version-simplifiee.geojson'))
    outre_mer = telecharger(cache, 'departements-avec-outre-mer.geojson')
    encadres = {str(f['properties']['code']): projection_encadre(f, ENCADRES[str(f['properties']['code'])])
                for f in outre_mer['features'] if str(f['properties']['code']) in ENCADRES}

    points = {}
    for code in sorted(prefectures, key=lambda c: (len(c), c.replace('2A', '20A').replace('2B', '20B'))):
        nom = prefectures[code]
        url = API + urllib.parse.urlencode({'nom': nom, 'codeDepartement': code, 'fields': 'nom,code,centre,mairie', 'limit': 10})
        with urllib.request.urlopen(url, timeout=30) as r:
            communes = [c for c in json.load(r) if plier(c['nom']) == plier(nom)]
        if len(communes) != 1:
            sys.exit('Préfecture introuvable ou ambiguë : ' + code + ' ' + nom)
        lon, lat = (communes[0].get('mairie') or communes[0]['centre'])['coordinates']
        x, y = (encadres.get(code) or metropole)(lon, lat)
        nx, ny = recaler(x, y, traces[code])
        if (nx, ny) != (x, y):
            print('  {} {} : décalée de {:.1f}'.format(code, nom, math.hypot(nx - x, ny - y)))
        points[code] = [round(nx, 1), round(ny, 1)]

    lignes = ',\n'.join("    '{}': [{}, {}]".format(c, p[0], p[1]) for c, p in points.items())
    with open(SORTIE, 'w', encoding='utf-8', newline='\n') as f:
        f.write('/* Préfectures sur la carte de France (data/france/carte-departements.js), en unités de la carte :\n'
                '   la mairie de chaque préfecture (geo.api.gouv.fr, Licence Ouverte, Etalab), projetée comme la carte ;\n'
                '   décalée d\'un cheveu vers l\'intérieur si le tracé simplifié de la côte ou d\'une limite la laissait au bord.\n'
                '   Fichier généré (outils/placer-prefectures.py) : ne pas modifier à la main. */\n'
                "(window.GeoPoints = window.GeoPoints || {})['france-prefectures'] = {\n"
                "  carte: 'france-departements',\n"
                "  source: 'Préfectures : mairies, d\\'après geo.api.gouv.fr (Licence Ouverte, Etalab).',\n"
                '  points: {\n' + lignes + '\n  }\n};\n')
    print('OK :', len(points), 'préfectures ->', os.path.relpath(SORTIE, RACINE))


if __name__ == '__main__':
    main()
