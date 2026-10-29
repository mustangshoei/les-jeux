/* ==========================================================================
   france/entonnoir.js — Jeu « L'Entonnoir »

   Inspiré du Morpion : on cite un département qui vérifie un critère ; un critère s'ajoute alors
   (les possibilités se réduisent), et ainsi de suite jusqu'à ce qu'un seul département vérifie
   tous les critères : il faut alors trouver lequel.

   Écran en deux étapes : les options (erreurs autorisées : 3, 5 ou 9), puis la partie.

   Déroulement
     - À chaque étape, on tape le nom d'un département (suggestions sans code) qui vérifie TOUS les
       critères affichés. Le même département peut resservir d'une étape à l'autre.
     - Bonne réponse : un critère s'ajoute, avec le nombre de départements encore possibles.
     - Mauvaise réponse : une erreur, et le message dit quel critère n'est pas vérifié.
     - Dernière étape : un seul département vérifie tout ; le trouver gagne la partie, épuiser ses
       erreurs la perd. Une petite fenêtre fait le bilan ; le parcours montre ensuite, pour chaque
       étape, tous les départements qui convenaient.

   Génération : on tire d'abord le département final, puis on empile des critères qu'il vérifie,
   un par famille, chacun retirant au moins 10 % des possibles (de préférence entre un cinquième
   et les trois quarts), jusqu'à n'en laisser qu'un : de 4 à 7 étapes, et de 15 à 80 possibles
   après le premier critère. Les familles « code INSEE » et « lettres » sont tirées plus rarement.

   Cas limites : un département trop proche de la latitude (ou de la longitude) de Paris, ou dont la
   superficie, la population, la densité ou l'altitude est à moins de 2 % du seuil d'un critère
   (les chiffres varient selon les sources), n'est jamais compté contre : il ne sert jamais à
   départager (il reste compté parmi les possibles tant qu'un autre critère ne l'écarte pas), et le
   proposer est accepté, avec un message qui le signale. Il ne peut pas être le département final.
   Position par rapport à Paris : d'après le centre du département sur la carte (métropole).

   Données : data/france/infos-departements.js (région, préfecture, sous-préfectures, superficie,
   population, voisins), data/france/infos-hydrographie.js (côtes des mers, départements traversés
   par les cours d'eau), noms et centres de la carte de France. Écrits ici : pays frontaliers,
   préfectures de région, origine des noms, points culminants.
   ========================================================================== */
(function () {
  'use strict';

  const INFOS = (window.GeoInfos || {})['france-departements'];
  const HYDRO = (window.GeoInfos || {})['france-hydrographie'];
  const CARTE = window.GeoCarte && GeoCarte.obtenir('france-departements');
  const CARTE_EAU = window.GeoCarte && GeoCarte.obtenir('france-hydrographie');
  if (!INFOS || !HYDRO || !CARTE || !CARTE_EAU) {
    console.error('france/entonnoir.js : les fichiers infos-departements, infos-hydrographie, carte-departements et carte-hydrographie doivent être chargés avant');
    return;
  }

  const MAX_SUGGESTIONS = 8;
  const ETAPES_MIN = 4;
  const ETAPES_MAX = 7;
  const DEPART_MIN = 15;            // possibles après le premier critère…
  const DEPART_MAX = 80;            // … ni trop peu, ni presque tous
  const RATIO_MIN = 0.2;            // part des possibles gardée par un critère, de préférence
  const RATIO_MAX = 0.75;
  const RATIO_UTILE = 0.9;          // un critère doit retirer au moins 10 % des possibles
  const POIDS = { code: 0.35, lettre: 0.3 };   // familles tirées plus rarement (défaut : 1)
  const MARGE_SEUIL = 0.02;         // à moins de 2 % d'un seuil chiffré : cas douteux
  const MARGE_PARIS = 0.02;         // position : 2 % de la hauteur de la métropole (une vingtaine de km)
  const DELAI_FIN = 700;            // pause avant la fenêtre de fin (ms)

  /* ---------- Données écrites ici ---------- */

  // Pays frontaliers. Monaco, le Brésil et le Suriname ne touchent qu'un département chacun :
  // ils comptent pour « frontalier d'un pays étranger » mais ne font pas un critère à eux seuls.
  const PAYS = [
    ['de la Belgique', ['02', '08', '54', '55', '59']],
    ['du Luxembourg', ['54', '57']],
    ['de l\'Allemagne', ['57', '67', '68']],
    ['de la Suisse', ['01', '25', '39', '68', '74', '90']],
    ['de l\'Italie', ['04', '05', '06', '73', '74']],
    ['de l\'Espagne', ['09', '31', '64', '65', '66']],
    ['d\'Andorre', ['09', '66']],
    ['de Monaco', ['06']],
    ['du Brésil', ['973']],
    ['du Suriname', ['973']]
  ];
  // Départements dont la préfecture est aussi préfecture de région (régions actuelles)
  const PREF_REGION = new Set(['13', '21', '2A', '31', '33', '35', '44', '45', '59', '67', '69', '75', '76',
    '971', '972', '973', '974', '976']);
  // Origine du nom : un cours d'eau (ou l'estuaire de la Gironde), ou un relief
  const NOM_EAU = new Set(['01', '02', '03', '07', '09', '10', '11', '12', '13', '16', '17', '18', '19', '23',
    '24', '25', '26', '27', '28', '30', '31', '32', '33', '34', '35', '36', '37', '38', '41', '42', '43', '44',
    '45', '46', '47', '49', '51', '52', '53', '54', '55', '57', '58', '60', '61', '67', '68', '69', '70', '71',
    '72', '76', '77', '79', '80', '81', '82', '83', '85', '86', '87', '89', '91', '92', '93', '94', '95']);
  const NOM_RELIEF = new Set(['04', '05', '06', '08', '15', '39', '48', '63', '64', '65', '66', '88']);
  // Point culminant (m) : IGN, via Wikipédia « Liste des départements de France par altitude ».
  // Seuils retenus loin des valeurs limites : 200, 1 000, 2 000 et 3 000 m.
  const ALTITUDES = {
    '01': 1720, '02': 285, '03': 1287, '04': 3410, '05': 4102, '06': 3120, '07': 1753, '08': 501, '09': 3143,
    '10': 372, '11': 2469, '12': 1461, '13': 1041, '14': 361, '15': 1855, '16': 368, '17': 173, '18': 502,
    '19': 977, '2A': 2425, '2B': 2706, '21': 721, '22': 340, '23': 936, '24': 491, '25': 1463, '26': 2454,
    '27': 251, '28': 286, '29': 387, '30': 1560, '31': 3222, '32': 386, '33': 167, '34': 1152, '35': 258,
    '36': 467, '37': 186, '38': 4088, '39': 1495, '40': 237, '41': 258, '42': 1631, '43': 1744, '44': 116,
    '45': 281, '46': 781, '47': 284, '48': 1699, '49': 216, '50': 367, '51': 286, '52': 523, '53': 416,
    '54': 730, '55': 451, '56': 301, '57': 986, '58': 857, '59': 271, '60': 239, '61': 413, '62': 211,
    '63': 1885, '64': 2973, '65': 3298, '66': 2921, '67': 1098, '68': 1422, '69': 1008, '70': 1215,
    '71': 901, '72': 341, '73': 3855, '74': 4807, '75': 130, '76': 247, '77': 216, '78': 231, '79': 271,
    '80': 216, '81': 1267, '82': 506, '83': 1712, '84': 1910, '85': 290, '86': 231, '87': 799, '88': 1363,
    '89': 607, '90': 1247, '91': 177, '92': 179, '93': 131, '94': 130, '95': 216,
    '971': 1467, '972': 1395, '973': 831, '974': 3070, '976': 660
  };
  // Article des noms, pour « Voisin de la Gironde », « du Nord », « des Landes », « de l'Ain »
  const MASCULINS = new Set(['14', '15', '18', '25', '29', '30', '32', '39', '41', '45', '46', '47', '49', '56',
    '59', '62', '63', '67', '68', '69', '81', '82', '83', '84', '90', '94', '95']);
  const PLURIELS = new Set(['04', '05', '06', '08', '13', '22', '40', '64', '65', '66', '78', '79', '88', '92']);
  const SANS_ARTICLE = new Set(['75', '976']);
  const EAU_MASCULINS = new Set(['rhone', 'rhin', 'escaut', 'adour', 'herault', 'var', 'allier', 'cher', 'loir',
    'lot', 'tarn', 'aveyron', 'gers', 'doubs', 'ain', 'verdon', 'gave-de-pau']);

  /* ---------- Outils ---------- */
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sansAccents = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const nombre = (n) => Number(n).toLocaleString('fr-FR');
  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
  const hasard = (t) => t[Math.floor(Math.random() * t.length)];
  const voyelle = (nom) => /^[AEIOUYÉÈÊÂ]/i.test(nom) || nom === 'Hérault';
  // Ordre des codes : 2A et 2B entre 19 et 21, les DOM à la fin
  const rang = (c) => (c === '2A' ? 20.1 : c === '2B' ? 20.2 : parseInt(c, 10));

  /* ---------- Départements ---------- */
  const D = {};
  CARTE.elements.forEach((e) => {
    const i = INFOS.zones[e.code];
    if (!i) return;
    D[e.code] = {
      nom: e.nom,
      lettres: sansAccents(e.nom).toUpperCase(),
      region: i.region,
      superficie: i.superficie,
      population: i.population,
      densite: i.population / i.superficie,
      voisins: i.voisins,
      prefecture: i.prefecture.replace(/\s*\(.*\)\s*$/, ''),   // « Pontoise (préfecture installée à Cergy) »
      sousPrefectures: i.sousPrefectures.length,
      num: /^2[AB]$/.test(e.code) ? 20 : parseInt(e.code, 10),
      metro: e.code.length === 2,
      cx: e.cx,
      cy: e.cy
    };
  });
  const CODES = Object.keys(D).sort((a, b) => rang(a) - rang(b));

  function deLe(code) {
    const nom = D[code].nom;
    if (SANS_ARTICLE.has(code) || /^La /.test(nom)) return 'de ' + nom;
    if (PLURIELS.has(code)) return 'des ' + nom;
    if (voyelle(nom)) return 'de l\'' + nom;
    return (MASCULINS.has(code) ? 'du ' : 'de la ') + nom;
  }

  /* ---------- Critères ---------- */
  // Un critère : { famille, libelle, codes (Set des départements qui le vérifient sans doute
  // possible), incertain(code) (cas douteux, ni dedans ni dehors) }.
  // Il n'est gardé que s'il concerne au moins 2 départements et en écarte au moins 2.
  const CRITERES = [];
  function ajouter(famille, libelle, test, incertain) {
    const douteux = incertain || (() => false);
    const codes = CODES.filter((c) => test(c) && !douteux(c));
    const exclus = CODES.filter((c) => !test(c) && !douteux(c));
    if (codes.length < 2 || exclus.length < 2) return;
    CRITERES.push({ famille, libelle, codes: new Set(codes), incertain: douteux });
  }
  // Critère chiffré : cas limite à moins de MARGE_SEUIL du seuil ; detail(code) donne la valeur (message)
  function presDuSeuil(valeur, s, unite) {
    const limite = (c) => Math.abs(valeur(c) - s) < s * MARGE_SEUIL;
    limite.detail = (c) => nombre(Math.round(valeur(c))) + unite;
    return limite;
  }

  // Mers et océans (côtes de la métropole d'après le module Fleuves ; Antilles et Guyane sur l'Atlantique)
  const COTES = {};
  ['manche', 'atlantique', 'mediterranee', 'mer-du-nord'].forEach((m) => { COTES[m] = new Set(HYDRO.zones[m].cotes); });
  ['971', '972', '973'].forEach((c) => COTES.atlantique.add(c));
  COTES.indien = new Set(['974', '976']);
  const LITTORAL = new Set(Object.values(COTES).flatMap((s) => [...s]));
  ajouter('mer', 'A une façade maritime', (c) => LITTORAL.has(c));
  ajouter('mer', 'N\'a pas de façade maritime', (c) => !LITTORAL.has(c));
  ajouter('mer', 'Bordé par la Manche', (c) => COTES.manche.has(c));
  ajouter('mer', 'Bordé par l\'océan Atlantique', (c) => COTES.atlantique.has(c));
  ajouter('mer', 'Bordé par la Méditerranée', (c) => COTES.mediterranee.has(c));
  ajouter('mer', 'Bordé par l\'océan Indien', (c) => COTES.indien.has(c));

  // Cours d'eau du module Fleuves : 16 fleuves et 36 rivières
  CARTE_EAU.elements.filter((e) => e.type === 'fleuve' || e.type === 'riviere').forEach((e) => {
    const deps = new Set((HYDRO.zones[e.code] || {}).departements || []);
    const article = voyelle(e.nom) ? 'l\'' : EAU_MASCULINS.has(e.code) ? 'le ' : 'la ';
    ajouter('eau', 'Traversé par ' + article + e.nom, (c) => deps.has(c));
  });

  // Voisins
  CODES.forEach((x) => ajouter('voisin', 'Voisin ' + deLe(x), (c) => D[x].voisins.includes(c)));
  [3, 4].forEach((n) => ajouter('nb-voisins', 'Au plus ' + n + ' départements voisins', (c) => D[c].voisins.length <= n));
  [6, 7, 8].forEach((n) => ajouter('nb-voisins', 'Au moins ' + n + ' départements voisins', (c) => D[c].voisins.length >= n));

  // Pays étrangers
  const ETRANGER = {};
  PAYS.forEach(([, deps]) => deps.forEach((c) => { ETRANGER[c] = (ETRANGER[c] || 0) + 1; }));
  ajouter('etranger', 'Frontalier d\'un pays étranger', (c) => ETRANGER[c] > 0);
  ajouter('etranger', 'Sans frontière avec un pays étranger', (c) => !ETRANGER[c]);
  ajouter('etranger', 'Frontalier d\'au moins deux pays étrangers', (c) => ETRANGER[c] >= 2);
  PAYS.forEach(([pays, deps]) => ajouter('etranger', 'Frontalier ' + pays, (c) => deps.includes(c)));

  // Régions
  [...new Set(CODES.map((c) => D[c].region))].forEach((r) => ajouter('region', 'Région ' + r, (c) => D[c].region === r));
  ajouter('frontiere-region', 'Touche un département d\'une autre région',
    (c) => D[c].voisins.some((v) => D[v].region !== D[c].region));
  ajouter('frontiere-region', 'Ne touche aucun département d\'une autre région',
    (c) => D[c].voisins.every((v) => D[v].region === D[c].region));

  // Position par rapport à Paris (centre du département, métropole) ; Paris lui-même n'est ni au
  // nord ni au sud de Paris.
  const PARIS = D['75'];
  const METRO = CODES.filter((c) => D[c].metro);
  const ys = METRO.map((c) => D[c].cy);
  const MARGE = MARGE_PARIS * (Math.max(...ys) - Math.min(...ys));
  const pres = (axe) => (c) => c !== '75' && D[c].metro && Math.abs(D[c][axe] - PARIS[axe]) < MARGE;
  ajouter('position', 'Plus au nord que Paris (métropole)', (c) => D[c].metro && D[c].cy < PARIS.cy, pres('cy'));
  ajouter('position', 'Plus au sud que Paris (métropole)', (c) => D[c].metro && D[c].cy > PARIS.cy, pres('cy'));
  ajouter('position', 'Plus à l\'est que Paris (métropole)', (c) => D[c].metro && D[c].cx > PARIS.cx, pres('cx'));
  ajouter('position', 'Plus à l\'ouest que Paris (métropole)', (c) => D[c].metro && D[c].cx < PARIS.cx, pres('cx'));

  // Outre-Mer, îles
  ajouter('outre-mer', 'Département d\'Outre-Mer', (c) => !D[c].metro);
  ajouter('outre-mer', 'Département insulaire (une île)', (c) => ['2A', '2B', '971', '972', '974', '976'].includes(c));

  // Préfecture et sous-préfectures
  const initiale = (s) => sansAccents(s.replace(/^(le|la|les)\s+/i, '')).charAt(0).toUpperCase();
  ajouter('prefecture', 'Sa préfecture est aussi préfecture de région', (c) => PREF_REGION.has(c));
  ajouter('prefecture', 'Sa préfecture n\'est pas préfecture de région', (c) => !PREF_REGION.has(c));
  ajouter('prefecture', 'Préfecture au nom composé (avec un trait d\'union)', (c) => D[c].prefecture.includes('-'));
  ajouter('prefecture', 'Préfecture dont le nom commence par « Saint »', (c) => /^Saint/.test(D[c].prefecture));
  ajouter('prefecture', 'Préfecture et département ont la même initiale', (c) => initiale(D[c].prefecture) === initiale(D[c].nom));
  ajouter('sous-prefecture', 'Aucune sous-préfecture', (c) => D[c].sousPrefectures === 0);
  ajouter('sous-prefecture', 'Une seule sous-préfecture', (c) => D[c].sousPrefectures === 1);
  [3, 4].forEach((n) => ajouter('sous-prefecture', 'Au moins ' + n + ' sous-préfectures', (c) => D[c].sousPrefectures >= n));

  // Superficie, population, densité
  const superficie = (c) => D[c].superficie;
  [1000, 4000, 5000, 6000, 7000, 8000].forEach((s) => {
    ajouter('superficie', 'Plus de ' + nombre(s) + ' km²', (c) => D[c].superficie > s, presDuSeuil(superficie, s, ' km²'));
    ajouter('superficie', 'Moins de ' + nombre(s) + ' km²', (c) => D[c].superficie < s, presDuSeuil(superficie, s, ' km²'));
  });
  const population = (c) => D[c].population;
  [200000, 300000, 500000, 800000, 1000000].forEach((n) => {
    const txt = n === 1000000 ? 'd\'un million d\'habitants' : 'de ' + nombre(n) + ' habitants';
    ajouter('population', 'Plus ' + txt, (c) => D[c].population > n, presDuSeuil(population, n, ' habitants'));
    ajouter('population', 'Moins ' + txt, (c) => D[c].population < n, presDuSeuil(population, n, ' habitants'));
  });
  const densite = (c) => D[c].densite;
  [150, 300, 1000].forEach((d) => ajouter('densite', 'Plus de ' + nombre(d) + ' habitants par km²',
    (c) => D[c].densite > d, presDuSeuil(densite, d, ' habitants par km²')));
  [30, 50, 100].forEach((d) => ajouter('densite', 'Moins de ' + d + ' habitants par km²',
    (c) => D[c].densite < d, presDuSeuil(densite, d, ' habitants par km²')));

  // Point culminant
  const altitude = (c) => ALTITUDES[c];
  [1000, 2000, 3000].forEach((a) => ajouter('altitude', 'Point culminant au-dessus de ' + nombre(a) + ' m',
    (c) => ALTITUDES[c] > a, presDuSeuil(altitude, a, ' m')));
  ajouter('altitude', 'Point culminant sous 200 m', (c) => ALTITUDES[c] < 200, presDuSeuil(altitude, 200, ' m'));

  // Le nom
  ajouter('nom', 'Nommé d\'après un cours d\'eau', (c) => NOM_EAU.has(c));
  ajouter('nom', 'Nommé d\'après un relief (montagne, massif)', (c) => NOM_RELIEF.has(c));
  ajouter('nom', 'Nom avec « Haut », « Haute » ou « Bas »', (c) => /(^|-)(Haut|Haute|Hautes|Hauts|Bas)(-|$)/.test(D[c].nom));

  // Code INSEE et écriture du nom : tirés plus rarement (POIDS)
  ajouter('lettre', 'Nom composé (avec un trait d\'union)', (c) => D[c].nom.includes('-'));
  ajouter('lettre', 'Nom sans trait d\'union', (c) => !D[c].nom.includes('-'));
  '0123456789'.split('').forEach((ch) => ajouter('code', 'Code INSEE commençant par ' + ch, (c) => c[0] === ch));
  [20, 30, 40, 50].forEach((t) => ajouter('code', 'Code INSEE inférieur à ' + t, (c) => D[c].num < t));
  [50, 60, 70].forEach((t) => ajouter('code', 'Code INSEE supérieur à ' + t, (c) => D[c].num > t));
  'ABCDEGHILMNORSTUVY'.split('').forEach((l) => {
    ajouter('lettre', 'Nom contenant la lettre ' + l, (c) => D[c].lettres.includes(l));
    ajouter('lettre', 'Nom sans la lettre ' + l, (c) => !D[c].lettres.includes(l));
  });

  /* ---------- Génération d'une partie ---------- */

  // Une famille au hasard (selon POIDS), puis un critère de cette famille
  function tirer(options) {
    const parFamille = {};
    options.forEach((o) => { (parFamille[o.c.famille] = parFamille[o.c.famille] || []).push(o); });
    const familles = Object.keys(parFamille);
    const poids = familles.map((f) => (POIDS[f] === undefined ? 1 : POIDS[f]));
    let r = Math.random() * poids.reduce((a, b) => a + b, 0);
    let i = 0;
    while (r >= poids[i] && i < familles.length - 1) { r -= poids[i]; i++; }
    return hasard(parFamille[familles[i]]);
  }

  // Empile des critères vérifiés par la cible jusqu'à ce qu'elle reste seule ; null si c'est raté.
  // Un cas douteux reste possible : seul un critère qui l'écarte sans doute le retire.
  function construire(cible) {
    let reste = CODES;
    const familles = new Set();
    const etapes = [];
    while (reste.length > 1) {
      if (etapes.length === ETAPES_MAX) return null;
      const premiere = !etapes.length;
      const peutFinir = etapes.length + 1 >= ETAPES_MIN;
      const valides = [];
      CRITERES.forEach((c) => {
        if (familles.has(c.famille) || !c.codes.has(cible)) return;
        const garde = reste.filter((x) => c.codes.has(x) || c.incertain(x));
        const n = garde.length;
        if (n > reste.length * RATIO_UTILE) return;                    // retire trop peu
        if (n === 1 && !peutFinir) return;                             // finirait trop tôt
        if (premiere && (n < DEPART_MIN || n > DEPART_MAX)) return;
        valides.push({ c, garde, ratio: n / reste.length });
      });
      if (!valides.length) return null;
      const bons = valides.filter((v) => v.garde.length === 1 || (v.ratio >= RATIO_MIN && v.ratio <= RATIO_MAX));
      const choix = tirer(bons.length ? bons : valides);
      etapes.push({ critere: choix.c, possibles: choix.garde, reponse: null });
      familles.add(choix.c.famille);
      reste = choix.garde;
    }
    return etapes.length >= ETAPES_MIN ? etapes : null;
  }

  function genererPartie() {
    for (let essai = 0; essai < 3000; essai++) {
      const cible = hasard(CODES);
      const etapes = construire(cible);
      if (etapes) return { cible, etapes };
    }
    throw new Error('Entonnoir : impossible de générer une partie');
  }

  /* ---------- État ---------- */
  let api = null;                  // outils de js/core.js (suggestions)
  let p = null;                    // partie en cours
  let suggestions = [];
  let suggestionActive = -1;

  function nouvellePartie() {
    p = Object.assign(genererPartie(), {
      etape: 0,
      erreurs: 0,
      maxErreurs: parseInt($('#entonnoir-vies').value, 10),
      fini: false,
      gagne: false
    });
    $('#entonnoir-search').value = '';
    fermerSuggestions();
    retour('idle', 'Tapez le nom d\'un département qui vérifie le critère, puis choisissez-le dans la liste.');
    rendre();
    $('#entonnoir-search').focus();
  }

  const derniere = () => p.etape === p.etapes.length - 1;
  // Partie commencée (au moins une réponse ou une erreur) et pas terminée
  const enCours = () => p && !p.fini && (p.etape > 0 || p.erreurs > 0);

  /* ---------- Affichage ---------- */

  function retour(type, html) {
    const f = $('#entonnoir-feedback');
    f.className = 'fb fb-' + type;
    f.innerHTML = '<span>' + html + '</span>';
  }

  // douteux : cas limite pour l'un des critères (accepté, mais ne sert pas à départager)
  function chip(code, classe, douteux) {
    return '<span class="entonnoir-chip' + (classe ? ' ' + classe : '') + '"' +
      (douteux ? ' title="Cas limite : trop près du seuil d\'un critère ou de Paris (accepté)"' : '') + '>' + esc(D[code].nom) +
      (douteux ? ' ?' : '') + ' <small>' + esc(code) + '</small></span>';
  }

  // Les critères, du plus large au plus étroit, chacun un peu plus en retrait (l'entonnoir).
  // En fin de partie : tous les critères, et pour chacun les départements qui convenaient.
  function rendre() {
    const total = p.etapes.length;
    const visibles = p.fini ? total : p.etape + 1;
    let html = '';
    for (let k = 0; k < visibles; k++) {
      const e = p.etapes[k];
      const n = e.possibles.length;
      const cls = ['entonnoir-etape'];
      if (e.reponse) cls.push('is-faite');
      else if (!p.fini) cls.push('is-courante');
      else if (k > p.etape) cls.push('is-non-atteinte');
      html += '<li class="' + cls.join(' ') + '" style="--i:' + k + '">' +
        '<div class="entonnoir-etape__ligne">' +
          '<span class="entonnoir-num" aria-hidden="true">' + (k + 1) + '</span>' +
          '<span class="entonnoir-critere">' + esc(e.critere.libelle) + '</span>' +
          '<span class="entonnoir-compte">' + (n === 1 ? '1 seul possible' : n + ' possibles') + '</span>' +
          (e.reponse ? '<span class="entonnoir-reponse">✓ ' + esc(D[e.reponse].nom) + '</span>' : '') +
        '</div>' +
        (p.fini
          ? '<details><summary>' + (n === 1 ? 'Le département qui convenait' : 'Les ' + n + ' départements qui convenaient') +
            '</summary><div class="chips">' + e.possibles.map((c) =>
              chip(c, c === p.cible ? 'is-cible' : c === e.reponse ? 'is-reponse' : '',
                p.etapes.slice(0, k + 1).some((x) => x.critere.incertain(c)))).join('') + '</div></details>'
          : '') +
        '</li>';
    }
    $('#entonnoir-etapes').innerHTML = html;

    $('#entonnoir-numero').textContent = Math.min(p.etape + 1, total);
    $('#entonnoir-total').textContent = total;
    const restantes = p.maxErreurs - p.erreurs;
    $('#entonnoir-erreurs').textContent = 'Erreurs ' + p.erreurs + ' / ' + p.maxErreurs +
      (p.fini ? '' : ' (' + restantes + ' restante' + (restantes > 1 ? 's' : '') + ')');
    $('#entonnoir-consigne').innerHTML = p.fini
      ? (p.gagne ? '🎯 Trouvé : <strong>' + esc(D[p.cible].nom) + '</strong> était le seul département possible.'
                 : 'Le département final était <strong>' + esc(D[p.cible].nom) + '</strong>.') +
        ' Ouvrez une étape pour voir tous les départements qui convenaient.'
      : derniere()
        ? '🕵️ Un seul département vérifie tous ces critères : lequel ?'
        : 'Citez un département qui vérifie <strong>tous</strong> ces critères.';
    const champ = $('#entonnoir-search');
    champ.disabled = p.fini;
    champ.placeholder = p.fini ? 'Partie terminée' : 'Tapez le nom d\'un département…';
  }

  /* ---------- Déroulement ---------- */

  function repondre(code) {
    if (!p || p.fini) return;
    const criteres = p.etapes.slice(0, p.etape + 1).map((e) => e.critere);
    const nomDep = '<strong>' + esc(D[code].nom) + '</strong>';
    const doute = criteres.find((c) => c.incertain(code));
    const rate = criteres.find((c) => !c.codes.has(code) && !c.incertain(code));

    if (rate) {
      p.erreurs++;
      if (p.erreurs >= p.maxErreurs) {
        retour('ko', '❌ ' + nomDep + ' : ne vérifie pas « ' + esc(rate.libelle) + ' ». Plus d\'essai : partie perdue.');
        return terminer(false);
      }
      retour('ko', '❌ ' + nomDep + ' : ne vérifie pas « ' + esc(rate.libelle) + ' ».');
      return rendre();
    }
    // Cas limite (trop près d'un seuil ou de Paris) : accepté, en le signalant. Le département final
    // n'est jamais un cas limite : on ne passe ici qu'avant la dernière étape.
    const limite = doute
      ? ' (cas limite pour « ' + esc(doute.libelle) + ' » : ' +
        (doute.incertain.detail ? esc(doute.incertain.detail(code)) + ' dans nos données' : 'trop près de Paris') + ', accepté)'
      : '';

    p.etapes[p.etape].reponse = code;
    if (derniere()) {
      retour('ok', '🎯 ' + nomDep + ' : c\'est bien le seul département qui vérifie tous les critères !');
      return terminer(true);
    }
    p.etape++;
    const e = p.etapes[p.etape];
    retour('ok', '✅ ' + nomDep + ' convient' + limite + '. Nouveau critère : « ' + esc(e.critere.libelle) + ' » (' +
      (e.possibles.length === 1 ? 'il n\'en reste qu\'un' : 'il en reste ' + e.possibles.length) + ').');
    rendre();
  }

  function terminer(gagne) {
    p.fini = true;
    p.gagne = gagne;
    fermerSuggestions();
    rendre();
    const partie = p;
    setTimeout(() => {
      // Entre-temps : nouvelle partie, retour aux options ou au menu → pas de fenêtre
      if (p !== partie || $('#screen-entonnoir').classList.contains('hidden') || $('#entonnoir-jeu').classList.contains('hidden')) return;
      const cible = D[p.cible].nom + ' (' + p.cible + ')';
      $('#entonnoir-fin-emoji').textContent = gagne ? '🎯' : '😕';
      $('#entonnoir-fin-titre').textContent = gagne ? 'Trouvé !' : 'Partie perdue';
      $('#entonnoir-fin-texte').textContent = gagne
        ? 'Le seul département possible était ' + cible + ' : ' + pluriel(p.etapes.length, 'étape') + ', ' +
          pluriel(p.erreurs, 'erreur') + '.'
        : 'Le département final était ' + cible + '. Étape atteinte : ' + (p.etape + 1) + ' sur ' + p.etapes.length + '.';
      $('#entonnoir-fin').showModal();
    }, DELAI_FIN);
  }

  /* ---------- Recherche (saisie du nom) ---------- */
  // Les suggestions listent tous les départements, sans leur code, avec les règles du nommage
  // (js/core.js) : rien avant 3 caractères, seulement les noms qui commencent par le texte tapé.

  // null : texte trop court, pas de liste
  function chercher(texte) {
    const res = api.suggestions(texte, CODES.map((c) => ({ code: c, nom: D[c].nom })));
    return res && res.slice(0, MAX_SUGGESTIONS);
  }

  function dessinerSuggestions() {
    const champ = $('#entonnoir-search');
    const liste = $('#entonnoir-suggestions');
    if (!champ.value.trim()) return fermerSuggestions();
    liste.innerHTML = suggestions.length
      ? suggestions.map((s, i) =>
          '<li role="option" data-zone="' + esc(s.code) + '" aria-selected="' + (i === suggestionActive) + '"' +
          (i === suggestionActive ? ' class="is-active"' : '') + '><span>' + esc(s.nom) + '</span></li>').join('')
      : '<li class="sugg-vide">Aucun département</li>';
    liste.classList.remove('hidden');
    champ.setAttribute('aria-expanded', 'true');
  }

  function fermerSuggestions() {
    const liste = $('#entonnoir-suggestions');
    liste.classList.add('hidden');
    liste.innerHTML = '';
    $('#entonnoir-search').setAttribute('aria-expanded', 'false');
    suggestions = [];
    suggestionActive = -1;
  }

  function choisir(code) {
    $('#entonnoir-search').value = '';
    fermerSuggestions();
    repondre(code);
  }

  /* ---------- Interface ---------- */

  // Deux étapes : les options de la partie, puis la partie
  function afficherEtape(etape) {
    $('#entonnoir-options').classList.toggle('hidden', etape !== 'options');
    $('#entonnoir-jeu').classList.toggle('hidden', etape !== 'jeu');
    window.scrollTo(0, 0);
  }

  function brancher() {
    $('#entonnoir-lancer').addEventListener('click', () => {
      afficherEtape('jeu');
      nouvellePartie();
    });
    $('#entonnoir-retour').addEventListener('click', () => {
      if (enCours() && !confirm('Quitter la partie en cours ?')) return;
      afficherEtape('options');
    });
    $('#entonnoir-nouvelle').addEventListener('click', () => {
      if (enCours() && !confirm('Abandonner cette partie et en commencer une autre ?')) return;
      nouvellePartie();
    });

    const champ = $('#entonnoir-search');
    champ.addEventListener('input', () => {
      const res = chercher(champ.value);
      if (!res) return fermerSuggestions();
      suggestions = res;
      suggestionActive = suggestions.length ? 0 : -1;
      dessinerSuggestions();
    });
    champ.addEventListener('blur', fermerSuggestions);
    champ.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!suggestions.length) return;
        e.preventDefault();
        const n = suggestions.length;
        suggestionActive = (suggestionActive + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
        dessinerSuggestions();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (suggestionActive >= 0) choisir(suggestions[suggestionActive].code);
      } else if (e.key === 'Escape') {
        fermerSuggestions();
      }
    });
    $('#entonnoir-suggestions').addEventListener('mousedown', (e) => {
      e.preventDefault();
      const li = e.target.closest('[data-zone]');
      if (li) choisir(li.dataset.zone);
    });

    // Fenêtre de fin : un bouton, Échap ou un clic à côté la ferment (= « Afficher le parcours »).
    // « Menu » (data-action="menu") est traité ensuite par js/core.js.
    const fin = $('#entonnoir-fin');
    fin.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      const r = fin.getBoundingClientRect();
      const dehors = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      if (!b && !dehors) return;
      fin.close();
      if (b && b.dataset.fin === 'rejouer') nouvellePartie();
    });
  }

  let branche = false;
  GeoNohyne.registerJeu({
    id: 'entonnoir',
    titre: 'L\'Entonnoir',
    icone: '🕵️',
    description: 'Un critère de plus à chaque étape, jusqu\'à ce qu\'il ne reste qu\'un seul département.',
    ecran: 'screen-entonnoir',
    sansCarte: true,

    ouvrir(outils) {
      api = outils;
      if (!branche) { brancher(); branche = true; }
      afficherEtape('options');        // on choisit d'abord les options, puis « Lancer la partie »
    }
  });
})();
