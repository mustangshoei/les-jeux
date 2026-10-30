/* ==========================================================================
   Anotehomy Quizz - game/matcher.js
   Correction des reponses saisies (mode A) : normalisation, distance
   d'edition, tolerance aux fautes, detection de l'ancienne nomenclature.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { BONES } = AQ.data;

  /* plages Unicode construites en ASCII : diacritiques combinants, apostrophe typographique, ligatures œ et æ
     (que la décomposition NFD ne sépare pas : « œil » doit valoir « oeil ») */
  const RE_DIACRITICS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
  const RE_PUNCT = new RegExp('[' + String.fromCharCode(0x2019) + "'`\\-_.,;:()/]", 'g');
  const RE_OE = new RegExp(String.fromCharCode(0x153), 'g'), RE_AE = new RegExp(String.fromCharCode(0xe6), 'g');

  /* minuscules, sans accents ni ligatures : "Œil" -> "oeil", "Fémur" -> "femur" */
  const plier = s => String(s).toLowerCase().normalize('NFD').replace(RE_DIACRITICS, '').replace(RE_OE, 'oe').replace(RE_AE, 'ae');

  /* "L'Os Fémur" -> "femur" */
  function norm(s) {
    return plier(s)
      .replace(RE_PUNCT, ' ').replace(/\s+/g, ' ').trim()
      .replace(/^(l|le|la|les|un|une) /, '').replace(/^os /, '').trim();
  }

  /* Forme canonique pour comparer les reponses :
     - sans articles ni prepositions : "tete du femur" = "tete femur" ;
     - adjectifs d'os ramenes au nom de l'os : "trochlee humerale" = "trochlee de l'humerus",
       "tuberosite tibiale" = "tuberosite du tibia" ;
     - sans le mot "muscle" initial : "muscle grand dorsal" = "grand dorsal". */
  const ADJ = {};
  [['humerus', 'humeral humerale humeraux humerales humeri'], ['femur', 'femoral femorale femoraux femorales femoris'],
    ['tibia', 'tibial tibiale tibiaux tibiales tibiae'], ['fibula', 'fibulaire fibulaires fibulae'],
    ['radius', 'radial radiale radiaux radiales radii'], ['ulna', 'ulnaire ulnaires ulnae'],
    ['scapula', 'scapulaire scapulaires scapulae'], ['clavicule', 'claviculaire claviculaires claviculae'],
    ['sternum', 'sternal sternale sternaux sternales sterni'], ['cote', 'costal costale costaux costales costae'],
    ['vertebre', 'vertebral vertebrale vertebraux vertebrales vertebrae'], ['sacrum', 'sacral sacrale sacraux sacrales sacri'],
    ['coccyx', 'coccygien coccygienne coccygis'], ['patella', 'patellaire patellaires patellae'],
    ['calcaneus', 'calcaneen calcaneenne calcanei'], ['talus', 'talaire talaires tali'],
    ['mandibule', 'mandibulaire mandibulaires mandibulae'], ['hyoide', 'hyoidien hyoidienne'],
    ['ilium', 'iliaque iliaques ilii'], ['ischium', 'ischiatique ischiatiques ischii'], ['pubis', 'pubien pubienne pubiens pubiennes'],
    ['acetabulum', 'acetabulaire acetabulaires'], ['sphenoide', 'sphenoidal sphenoidale sphenoidaux sphenoidales'],
    ['ethmoide', 'ethmoidal ethmoidale ethmoidaux ethmoidales'], ['occipital', 'occipitale occipitaux occipitales'],
    ['frontal', 'frontale frontaux frontales'], ['parietal', 'parietale parietaux parietales'],
    ['temporal', 'temporale temporaux temporales'], ['hamatum', 'hamati'], ['scaphoide', 'scaphoidien scaphoidienne'],
    ['cuboide', 'cuboidien cuboidienne'], ['carpe', 'carpien carpienne carpiens carpiennes'], ['tarse', 'tarsien tarsienne tarsiens tarsiennes']
  ].forEach(([noun, list]) => list.split(' ').forEach(w => { ADJ[w] = noun; }));
  const STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'os']);
  function canon(s) {
    return norm(s).split(' ').filter(w => w && !STOP.has(w)).map(w => ADJ[w] || w).join(' ')
      .replace(/^(muscles?|m) /, '').trim();
  }

  /* distance de Damerau-Levenshtein (inversion de 2 lettres = 1 faute) */
  function lev(a, b) {
    const m = a.length, n = b.length, d = [];
    for (let i = 0; i <= m; i++) d[i] = [i];
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[m][n];
  }

  /* nombre de fautes tolerees selon la longueur du mot */
  const tolFor = len => len <= 4 ? 0 : len <= 7 ? 1 : len <= 12 ? 2 : 3;

  /* precalcule les formes normalisees des noms (actuels et anciens) d'une liste d'elements
     (os, ou parties d'os) : { name, latin, alt, old } */
  function prepareItems(list) {
    list.forEach(b => {
      if (b._c) return;
      b._c = Array.from(new Set([b.name, b.latin].concat(b.alt || []).map(canon).filter(Boolean)));
      /* anciens termes : forme canonique (comparaison) et forme d'origine (affichage) */
      b._o = []; b._oRaw = [];
      (b.old || []).forEach(o => { const c = canon(o); if (c) { b._o.push(c); b._oRaw.push(o); } });
    });
  }
  function prepareMatcher() { prepareItems(BONES); }

  /* Retourne { ok, typo, oldName, other } :
     - la reponse est rapprochee de TOUS les noms connus de la liste (actuels et anciens) ;
     - elle n'est juste que si le nom le plus proche est un nom TA2 de l'element cible. */
  function evaluateIn(raw, target, list) {
    const n = canon(raw), res = { ok: false, typo: false, oldName: null, other: null };
    if (n.length < 2) return res;
    prepareItems(list);
    let best = { d: Infinity, b: null, c: '', old: false, raw: '' };
    const consider = (b, names, old, raws) => names.forEach((c, i) => {
      const d = lev(n, c);
      if (d < best.d) best = { d, b, c, old, raw: raws ? raws[i] : c };
    });
    consider(target, target._c, false);
    list.forEach(b => { if (b !== target) consider(b, b._c, false); });
    list.forEach(b => consider(b, b._o, true, b._oRaw));
    const tol = NS.settings.tol ? tolFor(Math.max(n.length, best.c.length)) : 0;
    if (best.d > tol) return res;
    if (best.b === target && !best.old) { res.ok = true; res.typo = best.d > 0; return res; }
    if (best.old) res.oldName = best.raw;
    res.other = best.b;
    return res;
  }

  /* os du squelette ; une vertebre peut aussi etre nommee par son niveau (C4, T7...) */
  function evaluate(raw, target, inst) {
    const n = norm(raw);
    if (target.labelAnswer && inst && inst.label && n.replace(/^vertebre /, '').replace(/\s/g, '') === inst.label.toLowerCase()) {
      return { ok: true, typo: false, oldName: null, other: null };
    }
    return evaluateIn(raw, target, BONES);
  }

  Object.assign(NS, { plier, norm, canon, lev, prepareItems, prepareMatcher, evaluate, evaluateIn });
})(AQ.game);
