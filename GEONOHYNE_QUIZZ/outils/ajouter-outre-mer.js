/* ==========================================================================
   ajouter-outre-mer.js — Ajoute les départements d'Outre-Mer (971, 972, 973, 974, 976)
   à data/france/carte-departements.js, sous forme d'encadrés (cartouches).

   Utilisation (Node.js, une seule fois, uniquement si vous voulez régénérer la carte) :
     node outils/ajouter-outre-mer.js <departements-avec-outre-mer.geojson> <data/france/carte-departements.js>

   Le GeoJSON vient de gregoiredavid/france-geojson (fichier « departements-avec-outre-mer.geojson »).
   Les 96 départements de métropole ne sont pas touchés ; les cinq DOM sont projetés chacun dans
   son propre encadré (Atlantique en bas à gauche, océan Indien en bas à droite), à des échelles
   différentes pour rester lisibles. Relancer le script sur un fichier déjà complété le remet à jour.
   ========================================================================== */
'use strict';
const fs = require('fs');

const [, , fichierGeo, fichierCarte] = process.argv;
if (!fichierGeo || !fichierCarte) {
  console.error('Usage : node ajouter-outre-mer.js <departements-avec-outre-mer.geojson> <data/france/carte-departements.js>');
  process.exit(1);
}

// Encadrés : x, y, l, h en unités de la carte (viewBox 1020 × 978). Le territoire est ajusté
// dans l'encadré, marge de 12 unités.
const ENCADRES = {
  '973': { x: 14,  y: 470, l: 190, h: 230 },   // Guyane            (Atlantique)
  '971': { x: 14,  y: 712, l: 190, h: 130 },   // Guadeloupe        (Atlantique)
  '972': { x: 14,  y: 854, l: 190, h: 114 },   // Martinique        (Atlantique)
  '974': { x: 640, y: 836, l: 140, h: 132 },   // La Réunion        (océan Indien)
  '976': { x: 790, y: 836, l: 130, h: 132 }    // Mayotte           (océan Indien)
};
const ORDRE = ['971', '972', '973', '974', '976'];
const MARGE = 12;
const TOLERANCE = 0.3;      // simplification des tracés (unités de la carte)
const AIRE_MIN = 1.2;       // îlots plus petits que cela (unités²) ignorés

const arr = (v) => Math.round(v * 10) / 10;

function polygones(g) { return g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []; }

function aire(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return a / 2;
}

function centroide(pts) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n];
    const f = x0 * y1 - x1 * y0;
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  a /= 2;
  return { aire: Math.abs(a), x: cx / (6 * a), y: cy / (6 * a) };
}

//   (anneau fermé : on simplifie la liste ouverte des points)
function simplifier(pts, tol) {
  if (pts.length < 5) return pts;
  const garde = new Uint8Array(pts.length);
  garde[0] = garde[pts.length - 1] = 1;
  const pile = [[0, pts.length - 1]];
  while (pile.length) {
    const [i, j] = pile.pop();
    let dmax = 0, k = -1;
    const [ax, ay] = pts[i], [bx, by] = pts[j];
    const dx = bx - ax, dy = by - ay, n = Math.hypot(dx, dy) || 1e-9;
    for (let m = i + 1; m < j; m++) {
      const d = Math.abs(dy * pts[m][0] - dx * pts[m][1] + bx * ay - by * ax) / n;
      if (d > dmax) { dmax = d; k = m; }
    }
    if (dmax > tol && k > 0) { garde[k] = 1; pile.push([i, k], [k, j]); }
  }
  return pts.filter((_, i) => garde[i]);
}

function construireDOM(feature, boite) {
  const polys = polygones(feature.geometry);
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const p of polys) for (const r of p) for (const c of r) {
    minLon = Math.min(minLon, c[0]); maxLon = Math.max(maxLon, c[0]);
    minLat = Math.min(minLat, c[1]); maxLat = Math.max(maxLat, c[1]);
  }
  const k = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
  const largeurGeo = (maxLon - minLon) * k, hauteurGeo = maxLat - minLat;
  const dispoL = boite.l - 2 * MARGE, dispoH = boite.h - 2 * MARGE;
  const echelle = Math.min(dispoL / largeurGeo, dispoH / hauteurGeo);
  // centré dans l'encadré
  const ox = boite.x + MARGE + (dispoL - largeurGeo * echelle) / 2;
  const oy = boite.y + MARGE + (dispoH - hauteurGeo * echelle) / 2;
  const proj = (lon, lat) => [(lon - minLon) * k * echelle + ox, (maxLat - lat) * echelle + oy];

  let d = '', meilleur = null;
  for (const poly of polys) {
    poly.forEach((ring, i) => {
      let pts = ring.map((c) => proj(c[0], c[1]));
      pts = simplifier(pts.slice(0, -1), TOLERANCE).map((p) => [arr(p[0]), arr(p[1])]);
      if (pts.length < 3 || Math.abs(aire(pts)) < AIRE_MIN) return;
      d += 'M' + pts.map((p) => p[0] + ' ' + p[1]).join('L') + 'Z';
      if (i === 0) { const c = centroide(pts); if (!meilleur || c.aire > meilleur.aire) meilleur = c; }
    });
  }
  return { code: feature.properties.code, nom: feature.properties.nom, d, cx: arr(meilleur.x), cy: arr(meilleur.y) };
}

const geo = JSON.parse(fs.readFileSync(fichierGeo, 'utf8'));
const texte = fs.readFileSync(fichierCarte, 'utf8');
const debut = texte.indexOf('GeoCarte.enregistrer(');
const json = texte.slice(texte.indexOf(',', debut) + 1, texte.lastIndexOf(');'));
const carte = JSON.parse(json);

const dom = ORDRE.map((code) => {
  const f = geo.features.find((x) => String(x.properties.code) === code);
  if (!f) throw new Error('DOM introuvable dans le GeoJSON : ' + code);
  return construireDOM(f, ENCADRES[code]);
});

carte.elements = carte.elements.filter((e) => ORDRE.indexOf(e.code) === -1).concat(dom);
carte.nom = 'France : les départements (métropole et outre-mer)';
// Crédit affiché dans le jeu : la source des données seulement (rien sur le code)
carte.credit = 'Contours : IGN Admin Express (édition 2018) et INSEE, via gregoiredavid/france-geojson. Licence Ouverte (Etalab). ' +
  'Outre-mer : encadrés à échelles différentes.';
carte.cadres = ORDRE.map((c) => ENCADRES[c]);

const entete = '/* Carte GéoNohyne Quizz : ' + carte.nom + '\n' +
  '   ' + carte.credit + '\n' +
  '   Fichier généré (outils/convertir-carte.html + outils/ajouter-outre-mer.js) : ne pas modifier à la main. */\n';
fs.writeFileSync(fichierCarte, entete + 'GeoCarte.enregistrer("france-departements", ' + JSON.stringify(carte) + ');\n');
console.log('OK : ' + carte.elements.length + ' zones (' + dom.map((e) => e.code + ' ' + Math.round(e.d.length / 1024 * 10) / 10 + ' Ko').join(', ') + ')');
