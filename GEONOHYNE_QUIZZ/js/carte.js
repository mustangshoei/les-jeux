/* ==========================================================================
   carte.js — Moteur de cartes de GéoNohyne Quizz

   Ce fichier ne contient AUCUNE donnée de pays. Il sait :
     - convertir un GeoJSON en carte SVG           GeoCarte.construire(geojson, options)
     - enregistrer / retrouver une carte           GeoCarte.enregistrer(id, carte) / obtenir(id)
     - produire le texte d'un fichier de données   GeoCarte.versScript(id, carte)

   Les cartes elles-mêmes sont dans le dossier data/, rangées par grande catégorie
   (data/france/, data/monde/…) : un fichier par carte, nommé carte-<nom>.js
   (ex. data/france/carte-departements.js enregistre la carte 'france-departements').
   Pour en créer une à partir d'un GeoJSON (autre pays, régions, provinces…),
   ouvrir outils/convertir-carte.html.

   Format d'une carte
     { version, nom, credit, largeur, hauteur,
       elements: [ { code, nom, d, cx, cy } ] }
       d       tracé SVG de la zone (attribut "d" d'un <path>)
       cx, cy  point central de la zone
   ========================================================================== */
(function (root) {
  'use strict';

  const LARGEUR = 1000;   // largeur de la carte en unités SVG (la hauteur s'en déduit)
  const MARGE = 10;

  // Propriétés GeoJSON reconnues automatiquement si aucune n'est précisée
  const CODES_POSSIBLES = ['code', 'code_insee', 'INSEE_DEP', 'CODE_DEPT', 'insee', 'iso_3166_2', 'adm1_code', 'id'];
  const NOMS_POSSIBLES = ['nom', 'NOM', 'NOM_DEPT', 'name', 'NAME', 'NAME_1', 'name_fr'];

  const registre = {};

  function lire(props, champ, possibles) {
    const cles = champ ? [champ] : possibles;
    for (const k of cles) {
      const v = props[k];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  }

  function polygones(geom) {
    if (!geom) return [];
    if (geom.type === 'Polygon') return [geom.coordinates];
    if (geom.type === 'MultiPolygon') return geom.coordinates;
    return [];
  }

  // Centroïde d'un anneau (formule du lacet) ; repli sur la moyenne des points
  function centroide(pts) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, n = pts.length; i < n; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % n];
      const f = x0 * y1 - x1 * y0;
      a += f;
      cx += (x0 + x1) * f;
      cy += (y0 + y1) * f;
    }
    a /= 2;
    if (Math.abs(a) < 1e-6) {
      const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      return { aire: 0, x: mx, y: my };
    }
    return { aire: Math.abs(a), x: cx / (6 * a), y: cy / (6 * a) };
  }

  /* GeoJSON (lon/lat) -> carte SVG.
     options (toutes facultatives) :
       champCode, champNom   noms des propriétés GeoJSON (sinon détection automatique)
       exclure               expression régulière (texte ou RegExp) : codes à ignorer
       minimum               nombre minimal de zones attendues
       nom, credit           métadonnées recopiées dans la carte
     Projection équirectangulaire corrigée par cos(latitude moyenne) : adaptée
     aux cartes de pays ou de régions. */
  function construire(geojson, options) {
    const o = options || {};
    const exclure = o.exclure instanceof RegExp ? o.exclure
      : (typeof o.exclure === 'string' && o.exclure ? new RegExp(o.exclure) : null);

    const feats = [];
    const vus = new Set();
    for (const f of (geojson && geojson.features) || []) {
      const p = f.properties || {};
      const code = lire(p, o.champCode, CODES_POSSIBLES);
      if (!code) continue;
      if (exclure && exclure.test(code)) continue;
      const polys = polygones(f.geometry);
      if (!polys.length) continue;
      if (vus.has(code)) throw new Error('code en double : ' + code + ' (choisissez une autre propriété de code)');
      vus.add(code);
      feats.push({ code, nom: lire(p, o.champNom, NOMS_POSSIBLES) || code, polys });
    }
    if (feats.length === 0 || feats.length < (o.minimum || 1)) {
      throw new Error('données insuffisantes : ' + feats.length + ' zone(s) trouvée(s)');
    }

    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const f of feats) for (const poly of f.polys) for (const ring of poly) for (const c of ring) {
      if (c[0] < minLon) minLon = c[0];
      if (c[0] > maxLon) maxLon = c[0];
      if (c[1] < minLat) minLat = c[1];
      if (c[1] > maxLat) maxLat = c[1];
    }
    const k = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    const echelle = LARGEUR / ((maxLon - minLon) * k);
    const proj = (lon, lat) => [
      (lon - minLon) * k * echelle + MARGE,
      (maxLat - lat) * echelle + MARGE
    ];
    const arr = (v) => Math.round(v * 10) / 10;

    const elements = feats.map((f) => {
      let d = '';
      let meilleur = null;
      for (const poly of f.polys) {
        poly.forEach((ring, i) => {
          const pts = [];
          let prec = null;
          for (const c of ring) {
            const [x, y] = proj(c[0], c[1]);
            const rx = arr(x), ry = arr(y);
            if (prec && prec[0] === rx && prec[1] === ry) continue;
            prec = [rx, ry];
            pts.push(prec);
          }
          if (pts.length < 3) return;
          d += 'M' + pts.map((p) => p[0] + ' ' + p[1]).join('L') + 'Z';
          if (i === 0) {                       // anneau extérieur
            const c = centroide(pts);
            if (!meilleur || c.aire > meilleur.aire) meilleur = c;
          }
        });
      }
      return {
        code: f.code,
        nom: f.nom,
        d,
        cx: meilleur ? arr(meilleur.x) : 0,
        cy: meilleur ? arr(meilleur.y) : 0
      };
    }).sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));

    return {
      version: 2,
      nom: o.nom || '',
      credit: o.credit || '',
      largeur: LARGEUR + 2 * MARGE,
      hauteur: Math.round((maxLat - minLat) * echelle) + 2 * MARGE,
      elements
    };
  }

  function valide(c) {
    return !!c && Array.isArray(c.elements) && c.elements.length > 0 && c.largeur > 0 && c.hauteur > 0;
  }

  function enregistrer(id, carte) {
    if (!id || !valide(carte)) throw new Error('GeoCarte.enregistrer : carte invalide (' + id + ')');
    registre[id] = carte;
  }

  function obtenir(id) {
    return registre[id] || null;
  }

  // Texte complet d'un fichier data/carte-<id>.js
  function versScript(id, carte) {
    const net = (s) => String(s || '').replace(/\*\//g, '* /').replace(/[\r\n]+/g, ' ');
    return '/* Carte GéoNohyne Quizz : ' + net(carte.nom || id) + '\n' +
      '   ' + net(carte.credit) + '\n' +
      '   Fichier généré (outils/convertir-carte.html) : ne pas modifier à la main. */\n' +
      'GeoCarte.enregistrer(' + JSON.stringify(id) + ', ' + JSON.stringify(carte) + ');\n';
  }

  const API = { construire, enregistrer, obtenir, valide, versScript };
  root.GeoCarte = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
