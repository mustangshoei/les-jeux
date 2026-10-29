/* ==========================================================================
   france/grand-chemin.js — Jeu « Le Grand Chemin » (La France et sa géographie)

   Deux départements A et B sont tirés au hasard. Le joueur propose des départements
   en TAPANT leur nom (la carte n'est pas cliquable), dans l'ordre qu'il veut, jusqu'à
   ce que ses propositions relient A à B de voisin en voisin. La carte ne montre que la
   silhouette de la France : seuls A, B et les départements proposés y apparaissent.

   Règles
     - France métropolitaine continentale uniquement (Corse et Outre-Mer exclus :
       ils n'ont aucune frontière terrestre avec le continent).
     - Longueur (réglable, de LONGUEUR_MIN à LONGUEUR_MAX sauts ; chaque frontière franchie = 1 saut) :
       sans détour, c'est l'écart entre A et B, ECART_MAX au plus (le plus long des plus courts chemins
       entre deux départements continentaux : Moselle – Pyrénées-Atlantiques, par exemple).
     - Détours (option) : 1 à 5 ÉTAPES imposées (nombre réglable), à relier dans l'ordre
       (A → étape 1 → étape 2 → … → B), sans repasser par un même département. Chaque étape est un vrai
       détour (hors des plus courts chemins entre l'arrêt d'avant et celui d'après). L'écart entre deux
       arrêts n'est pas réglable : il est tiré au hasard, de TRONCON_MIN à TRONCON_MAX sauts. La longueur
       réglée est celle du chemin parfait complet, étapes comprises.
     - Minimum = départements à proposer sur un chemin parfait (longueur - 1 - nombre d'étapes).
     - Étoiles : 3 si le joueur a proposé le minimum ; 2 s'il en a proposé au plus
       minimum × 1,5 (arrondi au supérieur) ; 1 sinon.
     - Indications, au choix (une seule à la fois) :
         Libre      aucune indication, les propositions restent neutres jusqu'à la fin ;
         Aide       chaque proposition est verte si elle fait partie d'un chemin parfait, rouge sinon.
                    Quand plusieurs chemins parfaits existent, on retient celui qui contient le plus de
                    propositions du joueur (à égalité, ses premières propositions) ;
         Pas à pas  on avance dans l'ordre depuis A, de voisin en voisin, sans détour : chaque
                    proposition doit toucher la précédente, rapprocher de l'arrêt suivant et laisser un
                    chemin parfait jusqu'à B ; sinon elle est rouge (et compte dans le total). Arrivé à
                    côté d'une étape ou de B, on y passe tout seul.
   Les réglages (longueur, détours, indications) sont dans le panneau « Paramètres », qui s'ouvre vers le
   haut, et sont mémorisés. Longueur, détours et « Pas à pas » changent la partie tout de suite si rien
   n'a encore été proposé, sinon ils s'appliquent à la partie suivante.
   Frontières : celles de data/france/infos-departements.js, calculées sur les contours IGN, y compris
   dans les estuaires (ex. Charente-Maritime – Gironde par l'estuaire de la Gironde).
   ========================================================================== */
(function () {
  'use strict';

  const INFOS = (window.GeoInfos || {})['france-departements'];
  if (!INFOS) {
    console.error('france/grand-chemin.js : data/france/infos-departements.js doit être chargé avant ce fichier');
    return;
  }

  const EXCLUS = new Set(['2A', '2B', '971', '972', '973', '974', '976']);
  const LONGUEUR_MIN = 3;             // longueur réglable (sauts)…
  const LONGUEUR_MAX = 15;            // … détours compris
  const ECART_MAX = 12;               // plus grand écart entre deux départements continentaux
  const ETAPES_MAX = 5;
  const TRONCON_MIN = 2;              // sauts entre deux arrêts (départ, étapes, arrivée) quand il y a des étapes,
  const TRONCON_MAX = 5;              // … tirés au hasard entre ces deux valeurs
  const BUDGET_RECHERCHE = 3000;      // pas de la recherche exacte « relié ? » avec étapes (voir relieParEtapes)
  const MAX_SUGGESTIONS = 8;
  const CLE_AIDE = 'geonohyne.chemin.aide';         // ancienne case « Aide » (reprise une fois)
  const CLE_MODE = 'geonohyne.chemin.mode';
  const MODES = ['libre', 'aide', 'ordre'];
  const CLE_REGLAGES = 'geonohyne.chemin.reglages';
  const REGLAGES_DEFAUT = { min: 5, max: 12, detours: false, etapes: 2 };

  const $ = (sel) => document.querySelector(sel);

  /* ---------- Graphe des frontières (départements continentaux) ---------- */
  const voisins = {};
  Object.keys(INFOS.zones).forEach((c) => {
    if (!EXCLUS.has(c)) voisins[c] = INFOS.zones[c].voisins.filter((v) => !EXCLUS.has(v));
  });
  const codes = Object.keys(voisins);

  // Nombre de sauts depuis un département vers tous les autres (parcours en largeur)
  function distances(depart) {
    const d = { [depart]: 0 };
    const file = [depart];
    for (let i = 0; i < file.length; i++) {
      for (const v of voisins[file[i]]) {
        if (d[v] === undefined) { d[v] = d[file[i]] + 1; file.push(v); }
      }
    }
    return d;
  }
  const DIST = {};
  codes.forEach((c) => { DIST[c] = distances(c); });

  // Toutes les paires (A, B), rangées par écart, calculées une fois (parties sans étape)
  const PAIRES = [];                  // PAIRES[écart] = [[a, b], …]
  codes.forEach((a) => codes.forEach((b) => {
    const d = DIST[a][b];
    if (a < b) (PAIRES[d] = PAIRES[d] || []).push([a, b]);
  }));

  const hasard = (n) => Math.floor(Math.random() * n);
  function melanger(t) {
    for (let i = t.length - 1; i > 0; i--) { const j = hasard(i + 1); [t[i], t[j]] = [t[j], t[i]]; }
    return t;
  }

  /* ---------- État ---------- */
  let api = null;
  let carteJeu = null;           // carte de France limitée aux départements en jeu
  // partie : { arrets: [A, étapes…, B], a, b, longueur, min, route (chemin parfait tiré, ou null),
  //            reglages (ceux du tirage, en JSON), ordre (pas à pas), proposes: [], fini, abandon ;
  //            pas à pas : chemin (départements validés depuis A, étapes comprises), cible (n° de l'arrêt
  //            visé), essais: [{ code, ok }] (un département refusé peut être reproposé) }
  let partie = null;
  let reglages = null;           // { min, max, detours, etapes }
  let mode = 'libre';            // indications : 'libre', 'aide' ou 'ordre' (pas à pas)
  let suggestions = [];
  let suggestionActive = -1;

  function lireMode() {
    try {
      const m = localStorage.getItem(CLE_MODE);
      if (MODES.includes(m)) return m;
      return localStorage.getItem(CLE_AIDE) === '1' ? 'aide' : 'libre';
    } catch (e) { return 'libre'; }
  }
  function ecrireMode(m) {
    try { localStorage.setItem(CLE_MODE, m); } catch (e) { /* option valable pour la session */ }
  }

  // Réglages cohérents : longueurs dans les bornes, min ≤ max ; sans détour, ECART_MAX au plus ;
  // avec k étapes, k + 1 tronçons de TRONCON_MIN à TRONCON_MAX sauts
  function corriger(r) {
    const entier = (v, d) => (Number.isInteger(v) ? v : d);
    const c = {
      min: entier(r.min, REGLAGES_DEFAUT.min),
      max: entier(r.max, REGLAGES_DEFAUT.max),
      detours: r.detours === true,
      etapes: Math.max(1, Math.min(ETAPES_MAX, entier(r.etapes, REGLAGES_DEFAUT.etapes)))
    };
    const [plancher, plafond] = bornes(c);
    c.min = Math.max(plancher, Math.min(plafond, c.min));
    c.max = Math.max(plancher, Math.min(plafond, c.max));
    if (c.min > c.max) c.max = c.min;
    return c;
  }
  // Longueurs possibles [min, max] pour ces réglages
  function bornes(r) {
    if (!r.detours) return [LONGUEUR_MIN, ECART_MAX];
    return [TRONCON_MIN * (r.etapes + 1), Math.min(LONGUEUR_MAX, TRONCON_MAX * (r.etapes + 1))];
  }

  function lireReglages() {
    try { return corriger(JSON.parse(localStorage.getItem(CLE_REGLAGES)) || REGLAGES_DEFAUT); }
    catch (e) { return corriger(REGLAGES_DEFAUT); }
  }
  function ecrireReglages() {
    try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(reglages)); } catch (e) { /* valable pour la session */ }
  }

  const nom = (code) => api.zones.get(code).nom;

  // Carte : uniquement la métropole continentale, cadrée sur elle (sans encadrés d'Outre-Mer)
  function preparerCarte() {
    const c = GeoCarte.obtenir('france-departements');
    const elements = c.elements.filter((e) => voisins[e.code]);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    elements.forEach((e) => {
      const n = e.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
      for (let i = 0; i + 1 < n.length; i += 2) {
        x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]);
        y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]);
      }
    });
    const m = 12;
    return Object.assign({}, c, {
      elements,
      cadres: [],
      vue: { x: x0 - m, y: y0 - m, w: x1 - x0 + 2 * m, h: y1 - y0 + 2 * m }
    });
  }

  /* ---------- Tirage d'une partie ---------- */

  // Un plus court chemin de p à w (départements entre les deux) qui évite `pris`, au hasard ; null s'il n'y
  // en a pas. Les plus courts chemins descendent la distance à w : un cul-de-sac le reste (mémorisé).
  function plusCourtAuHasard(p, w, pris) {
    const impasses = new Set();
    function suite(u) {
      if (u === w) return [];
      for (const v of melanger(voisins[u].filter((x) => DIST[w][x] === DIST[w][u] - 1))) {
        if ((v !== w && pris.has(v)) || impasses.has(v)) continue;
        const reste = suite(v);
        if (reste) return v === w ? reste : [v].concat(reste);
        impasses.add(v);
      }
      return null;
    }
    return suite(p);
  }

  // Sans étape : une paire dont l'écart est dans [min, max], au hasard parmi toutes ces paires
  function tirerSansEtape(min, max) {
    const paires = [].concat(...PAIRES.slice(min, Math.min(max, ECART_MAX) + 1).filter(Boolean));
    let [a, b] = paires[hasard(paires.length)];
    if (Math.random() < 0.5) [a, b] = [b, a];
    return { arrets: [a, b], longueur: DIST[a][b], route: null };
  }

  // Avec k étapes : longueur L tirée dans [min, max], partagée au hasard en k + 1 tronçons de TRONCON_MIN à
  // TRONCON_MAX sauts ;
  // on construit le chemin arrêt après arrêt, chaque tronçon étant un plus court chemin qui évite tout
  // ce qui est déjà pris. Le chemin obtenu est donc parfait : aucun ne peut être plus court.
  function tirerAvecEtapes(k, min, max) {
    for (let essai = 0; essai < 500; essai++) {
      const L = min + hasard(max - min + 1);
      const troncons = new Array(k + 1).fill(TRONCON_MIN);
      for (let r = L - TRONCON_MIN * (k + 1); r > 0; r--) {
        const libres = troncons.map((n, i) => i).filter((i) => troncons[i] < TRONCON_MAX);
        troncons[libres[hasard(libres.length)]]++;
      }

      const arrets = [codes[hasard(codes.length)]];
      const pris = new Set(arrets);
      let route = arrets.slice();
      let ok = true;
      for (let i = 0; i <= k && ok; i++) {
        const p = arrets[arrets.length - 1];
        let candidats = codes.filter((w) => DIST[p][w] === troncons[i] && !pris.has(w));
        // l'arrêt p est un vrai détour : plus court de l'arrêt d'avant au suivant sans passer par lui
        if (i > 0) candidats = candidats.filter((w) => DIST[arrets[arrets.length - 2]][w] < troncons[i - 1] + troncons[i]);
        ok = false;
        for (const w of melanger(candidats).slice(0, 8)) {
          const milieu = plusCourtAuHasard(p, w, pris);
          if (!milieu) continue;
          milieu.concat(w).forEach((c) => pris.add(c));
          arrets.push(w);
          route = route.concat(milieu, w);
          ok = true;
          break;
        }
      }
      const a = arrets[0], b = arrets[arrets.length - 1];
      if (ok && DIST[a][b] >= TRONCON_MIN && DIST[a][b] < L) return { arrets, longueur: L, route };
    }
    return null;
  }

  /* ---------- Calculs ---------- */

  // Les propositions relient-elles A à B (en passant par les étapes, dans l'ordre) ?
  function relie() {
    return partie.arrets.length === 2 ? relieSansEtape() : relieParEtapes();
  }

  function relieSansEtape() {
    const permis = new Set(partie.proposes.concat(partie.b));
    const vus = new Set([partie.a]);
    const file = [partie.a];
    for (let i = 0; i < file.length; i++) {
      for (const v of voisins[file[i]]) {
        if (v === partie.b) return true;
        if (permis.has(v) && !vus.has(v)) { vus.add(v); file.push(v); }
      }
    }
    return false;
  }

  // Avec étapes : existe-t-il, parmi les propositions, un chemin A → étape 1 → … → B qui ne passe jamais
  // deux fois par le même département (les tronçons sont disjoints) ? Problème difficile en général ;
  // ici, trois étages, du moins cher au plus cher :
  //   1. conditions nécessaires : chaque tronçon est relié, et un département OBLIGATOIRE (sur tous les
  //      chemins d'un tronçon) ne sert qu'à un tronçon. C'est ce qui refuse le « cul-de-sac » : aller à
  //      une étape et revenir par le même département ;
  //   2. preuve rapide : des plus courts tronçons, l'un après l'autre, dans divers ordres ;
  //   3. recherche exacte, élaguée par les conditions de l'étage 1 et mémorisée. Au-delà de
  //      BUDGET_RECHERCHE pas (seulement quand le joueur a proposé beaucoup de départements autour du
  //      chemin), le chemin est accepté : une victoire de trop vaut mieux qu'une partie bloquée.
  function relieParEtapes() {
    const arrets = partie.arrets;
    const terminaux = new Set(arrets);
    const permis = new Set(partie.proposes);
    const troncons = arrets.slice(1).map((b, i) => [arrets[i], b]);

    // Plus court chemin de a à b par les propositions, hors `interdits` et hors des autres arrêts ;
    // départements entre a et b, ou null. melange : voisins pris au hasard (preuve rapide)
    function chemin(a, b, interdits, melange) {
      const prec = new Map([[a, null]]);
      const file = [a];
      for (let i = 0; i < file.length; i++) {
        const u = file[i];
        const vs = melange ? melanger(voisins[u].slice()) : voisins[u];
        for (const v of vs) {
          if (prec.has(v)) continue;
          if (v === b) {
            const p = [];
            for (let c = u; c !== a; c = prec.get(c)) p.unshift(c);
            return p;
          }
          if (permis.has(v) && !terminaux.has(v) && !interdits.has(v)) { prec.set(v, u); file.push(v); }
        }
      }
      return null;
    }

    // Étage 1 sur des tronçons [[a, b], …] : null si impossible, sinon les départements obligatoires
    // (code -> n° du tronçon)
    function obligatoires(liste, interdits) {
      const o = new Map();
      for (let i = 0; i < liste.length; i++) {
        const [a, b] = liste[i];
        const p = chemin(a, b, interdits);
        if (!p) return null;
        for (const x of p) {
          if (chemin(a, b, new Set(interdits).add(x))) continue;
          if (o.has(x)) return null;
          o.set(x, i);
        }
      }
      return o;
    }

    const oblig = obligatoires(troncons, new Set());
    if (!oblig) return false;

    // Étage 2 : chaque tronçon évite ce que les précédents ont pris et les obligatoires des autres
    for (let essai = 0; essai < 24; essai++) {
      const ordre = troncons.map((t, i) => i);
      if (essai) melanger(ordre);
      const pris = new Set();
      const ok = ordre.every((i) => {
        const interdits = new Set(pris);
        oblig.forEach((j, x) => { if (j !== i) interdits.add(x); });
        const p = chemin(troncons[i][0], troncons[i][1], interdits, essai > 0);
        if (p) p.forEach((c) => pris.add(c));
        return !!p;
      });
      if (ok) return true;
    }

    // Étage 3 : on avance de voisin en voisin depuis A ; `vus` = départements déjà sur le chemin
    const vus = new Set([arrets[0]]);
    const echecs = new Set();
    let pas = 0;
    function avancer(u, t) {               // en u, en route vers arrets[t]
      if (++pas > BUDGET_RECHERCHE) throw new RangeError('budget');
      const reste = [[u, arrets[t]]].concat(troncons.slice(t));
      const interdits = new Set(vus);
      interdits.delete(u);
      if (!obligatoires(reste, interdits)) return false;
      const cle = t + '|' + u + '|' + [...vus].sort().join(',');
      if (echecs.has(cle)) return false;
      const cible = arrets[t];
      const suivants = voisins[u]
        .filter((v) => !vus.has(v) && (v === cible || (permis.has(v) && !terminaux.has(v))))
        .sort((x, y) => DIST[cible][x] - DIST[cible][y]);
      for (const v of suivants) {
        if (v === cible && t === arrets.length - 1) return true;
        vus.add(v);
        if (avancer(v, v === cible ? t + 1 : t)) return true;
        vus.delete(v);
      }
      echecs.add(cle);
      return false;
    }
    try {
      return avancer(arrets[0], 1);
    } catch (e) {
      if (e instanceof RangeError) return true;
      throw e;
    }
  }

  // Plus court chemin de a à b (départements entre les deux) le plus proche des choix du joueur : parmi tous
  // les plus courts chemins qui évitent `pris`, celui qui contient le plus de propositions ; à égalité, ses
  // propositions les plus anciennes. Programmation dynamique couche par couche (couche k = à k sauts de a).
  function tronconParfait(a, b, pris) {
    const dA = DIST[a], dB = DIST[b], ecart = dA[b];
    const rang = new Map(partie.proposes.map((c, i) => [c, i]));
    const poids = (c) => (rang.has(c) ? [1, Math.pow(2, Math.max(0, 50 - rang.get(c)))] : [0, 0]);
    const meilleur = (x, y) => x.n > y.n || (x.n === y.n && x.t > y.t);

    const couches = [];
    codes.forEach((c) => {
      if (dA[c] + dB[c] === ecart && (c === b || !pris.has(c) || c === a)) (couches[dA[c]] = couches[dA[c]] || []).push(c);
    });
    const best = { [a]: { n: 0, t: 0, prec: null } };
    for (let k = 1; k <= ecart; k++) {
      for (const v of couches[k] || []) {
        let p = null;
        for (const u of voisins[v]) {
          if (dA[u] === k - 1 && best[u] && (!p || meilleur(best[u], best[p]))) p = u;
        }
        if (!p) continue;
        const [n, t] = poids(v);
        best[v] = { n: best[p].n + n, t: best[p].t + t, prec: p };
      }
    }
    if (!best[b]) return null;
    const chemin = [];
    for (let c = best[b].prec; c !== a; c = best[c].prec) chemin.unshift(c);
    return chemin;
  }

  // Chemin parfait complet [A, …, B] le plus proche des choix du joueur : tronçon par tronçon (dans un sens,
  // sinon dans l'autre), chacun évitant les précédents ; à défaut, le chemin tiré avec la partie
  function cheminParfait() {
    const arrets = partie.arrets;
    for (const ordre of [arrets, arrets.slice().reverse()]) {
      const pris = new Set(arrets);
      let route = [ordre[0]];
      for (let i = 0; route && i + 1 < ordre.length; i++) {
        const milieu = tronconParfait(ordre[i], ordre[i + 1], pris);
        if (milieu) { milieu.forEach((c) => pris.add(c)); route = route.concat(milieu, ordre[i + 1]); }
        else route = null;
      }
      if (route) return ordre === arrets ? route : route.reverse();
    }
    return partie.route;
  }

  function etoiles() {
    if (partie.abandon) return 0;
    const n = partie.proposes.length;
    if (n <= partie.min) return 3;
    if (n <= Math.ceil(partie.min * 1.5)) return 2;
    return 1;
  }

  /* ---------- Affichage ---------- */

  function retour(type, html) {
    const f = $('#chemin-feedback');
    f.className = 'fb fb-' + type;
    f.innerHTML = '<span>' + html + '</span>';
  }

  const etapes = () => partie.arrets.slice(1, -1);
  const numeroEtape = (code) => partie.arrets.indexOf(code);      // 1 pour la première étape…

  // Départ → ① étape → … → arrivée
  function afficherTrajet() {
    const dernier = partie.arrets.length - 1;
    $('#chemin-trajet').innerHTML = partie.arrets.map((c, i) => {
      const classe = i === 0 ? 'chemin-dep--a' : i === dernier ? 'chemin-dep--b' : 'chemin-dep--etape';
      const numero = i > 0 && i < dernier ? '<span class="chemin-dep__num" aria-label="étape ' + i + '">' + i + '</span>' : '';
      return '<span class="chemin-dep ' + classe + '">' + numero + api.esc(nom(c)) + ' (' + api.esc(c) + ')</span>';
    }).join('<span class="chemin-fleche" aria-hidden="true">→</span>');
    $('#chemin-consigne').textContent = dernier > 1 ? 'Reliez les étapes dans l\'ordre' : 'Reliez en passant de voisin en voisin';
    document.querySelector('#screen-chemin .legende-etape').classList.toggle('hidden', dernier < 2);
  }

  // Numéro de chaque étape sur la carte, dans une pastille au centre du département
  function numeroterEtapes() {
    if (!etapes().length) return;
    const premier = api.zones.get(partie.a).el;
    const svg = premier.ownerSVGElement;
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    const r = carteJeu.vue.w * 0.012;
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'chemin-numeros');
    etapes().forEach((c, i) => {
      const z = api.zones.get(c);
      const rond = document.createElementNS(ns, 'circle');
      rond.setAttribute('cx', z.cx); rond.setAttribute('cy', z.cy); rond.setAttribute('r', r);
      const texte = document.createElementNS(ns, 'text');
      texte.setAttribute('x', z.cx); texte.setAttribute('y', z.cy);
      texte.setAttribute('font-size', r * 1.35);
      texte.textContent = i + 1;
      g.append(rond, texte);
    });
    svg.appendChild(g);
  }

  function majAffichage() {
    // Pas à pas : validés en vert, refusés en rouge, toujours. Sinon : couleurs avec l'aide ou en fin de partie
    const devoile = partie.ordre || mode === 'aide' || partie.fini;
    const route = partie.fini ? cheminMontre() : partie.ordre ? partie.chemin : devoile ? cheminParfait() : [];
    const parfait = new Set(partie.ordre ? partie.chemin.concat(route) : route);
    $('#screen-chemin').dataset.aide = devoile ? '1' : '0';

    // Carte
    api.zones.forEach((z, code) => {
      let s = 'idle';
      if (code === partie.a) s = 'depart';
      else if (code === partie.b) s = 'arrivee';
      else if (partie.arrets.includes(code)) s = 'etape';
      else if (partie.ordre && partie.chemin.includes(code)) s = 'bon';
      else if (partie.proposes.includes(code)) s = partie.ordre ? 'mauvais' : devoile ? (parfait.has(code) ? 'bon' : 'mauvais') : 'propose';
      else if (partie.fini && parfait.has(code)) s = 'solution';
      api.etat(code, s);
      if (s !== 'idle') z.el.parentNode.appendChild(z.el);   // dessiné au-dessus : contour entier visible
    });

    // Liste des propositions
    // (pas à pas : un essai par pastille, un département refusé pouvant être reproposé plus tard)
    const essais = partie.ordre ? partie.essais : partie.proposes.map((c) => ({ code: c, ok: parfait.has(c) }));
    $('#chemin-liste').innerHTML = essais.map(({ code: c, ok }) => {
      const cls = devoile ? (ok ? 'chemin-chip--ok' : 'chemin-chip--ko') : '';
      return '<span class="chemin-chip ' + cls + '">' + api.esc(nom(c)) + ' <small>(' + api.esc(c) + ')</small></span>';
    }).join('');
    $('#chemin-nb').textContent = partie.proposes.length;

    // Fin de partie : étoiles et chemin parfait (étapes en gras)
    const fin = $('#chemin-fin');
    fin.classList.toggle('hidden', !partie.fini);
    if (partie.fini) {
      const e = etoiles();
      const titre = partie.abandon ? 'Solution' :
        e === 3 ? 'Chemin parfait !' : e === 2 ? 'Très bien !' : 'Arrivé à destination !';
      const solution = route.map((c) => {
        const n = api.esc(nom(c));
        return numeroEtape(c) > 0 && c !== partie.b ? '<b>' + n + '</b>' : n;
      }).join(' → ');
      fin.innerHTML =
        '<div class="chemin-etoiles" aria-label="' + e + ' étoile(s) sur 3">' +
          [1, 2, 3].map((i) => '<span class="' + (i <= e ? 'pleine' : 'vide') + '">★</span>').join('') +
        '</div>' +
        '<p class="chemin-fin__titre">' + titre + '</p>' +
        (partie.abandon ? '' :
          '<p>Vous avez proposé <b>' + partie.proposes.length + '</b> département(s).</p>') +
        '<p class="chemin-fin__solution">Un chemin parfait : ' + solution + '</p>';
    }
    $('#chemin-abandon').disabled = partie.fini;
    $('#chemin-search').disabled = partie.fini;
    afficherNoteReglages();
  }

  /* ---------- Panneau « Paramètres » ---------- */

  function remplirLongueurs() {
    const plafond = reglages.detours ? LONGUEUR_MAX : ECART_MAX;
    const [plancher, plafondReel] = bornes(reglages);
    [['#chemin-long-min', reglages.min], ['#chemin-long-max', reglages.max]].forEach(([sel, valeur]) => {
      const s = $(sel);
      s.innerHTML = '';
      for (let n = LONGUEUR_MIN; n <= plafond; n++) {
        const o = new Option(String(n), String(n), false, n === valeur);
        o.disabled = n < plancher || n > plafondReel;
        s.add(o);
      }
    });
    $('#chemin-longueur-note').textContent = reglages.detours
      ? 'Chemin complet, étapes comprises : de ' + plancher + ' à ' + plafondReel + ' sauts avec ' + reglages.etapes +
        ' étape' + (reglages.etapes > 1 ? 's' : '') + ' (' + TRONCON_MIN + ' à ' + TRONCON_MAX +
        ' sauts entre deux arrêts, tirés au hasard).'
      : 'Un saut = une frontière franchie. Sans détour : ' + ECART_MAX + ' sauts au plus (le plus long écart en France).';
  }

  function afficherReglages() {
    remplirLongueurs();
    $('#chemin-detours').checked = reglages.detours;
    $('#chemin-etapes').classList.toggle('is-off', !reglages.detours);
    document.querySelectorAll('#chemin-etapes [data-etapes]').forEach((b) => {
      const actif = Number(b.dataset.etapes) === reglages.etapes;
      b.classList.toggle('is-active', actif);
      b.setAttribute('aria-pressed', String(actif));
      b.disabled = !reglages.detours;
    });
    document.querySelectorAll('#chemin-mode [data-indication]').forEach((b) => {
      const actif = b.dataset.indication === mode;
      b.classList.toggle('is-active', actif);
      b.setAttribute('aria-pressed', String(actif));
    });
    $('#chemin-mode-note').textContent = {
      libre: 'Aucune indication : les propositions restent neutres jusqu\'à la fin.',
      aide: 'Chaque proposition est verte si elle fait partie d\'un chemin parfait, rouge sinon.',
      ordre: 'Avancez dans l\'ordre depuis le départ, de voisin en voisin, sans détour : sinon le département ' +
        'est en rouge, et il compte quand même.'
    }[mode];    // Résumé sur le bouton : « 5–12 sauts », « 8–15 · 3 étapes · pas à pas »…
    const longueur = reglages.min + (reglages.max > reglages.min ? '–' + reglages.max : '');
    const extras = (reglages.detours ? [reglages.etapes + ' étape' + (reglages.etapes > 1 ? 's' : '')] : [])
      .concat(mode === 'aide' ? ['aide'] : mode === 'ordre' ? ['pas à pas'] : []);
    $('#chemin-reglages-resume').textContent = extras.length ? [longueur].concat(extras).join(' · ') : longueur + ' sauts';
  }

  // Réglages changés depuis le tirage de la partie en cours : ils serviront à la suivante
  function afficherNoteReglages() {
    $('#chemin-reglages-note').classList.toggle('hidden',
      JSON.stringify(reglages) === partie.reglages && (mode === 'ordre') === partie.ordre);
  }

  function changerReglages(modif) {
    reglages = corriger(Object.assign({}, reglages, modif));
    ecrireReglages();
    afficherReglages();
    if (partie && !partie.fini && !partie.proposes.length) nouvellePartie();    // rien de joué : on relance
    else if (partie) afficherNoteReglages();
  }

  function ouvrirReglages(ouvrir) {
    const panneau = $('#chemin-reglages');
    const bouton = $('#chemin-reglages-btn');
    if (ouvrir === !panneau.hidden) return;
    panneau.hidden = !ouvrir;
    bouton.setAttribute('aria-expanded', String(ouvrir));
    if (ouvrir) {
      // Il s'ouvre vers le haut : jamais plus haut que l'écran de jeu (sinon il serait coupé)
      const ecran = $('#screen-chemin').getBoundingClientRect();
      panneau.style.maxHeight = Math.max(160, bouton.getBoundingClientRect().top - ecran.top - 20) + 'px';
    }
  }

  /* ---------- Déroulement ---------- */

  function nouvellePartie() {
    const r = reglages;
    const tirage = (r.detours && tirerAvecEtapes(r.etapes, r.min, r.max)) || tirerSansEtape(Math.min(r.min, ECART_MAX), r.max);
    const { arrets, longueur, route } = tirage;
    partie = {
      arrets, a: arrets[0], b: arrets[arrets.length - 1], longueur, route, reglages: JSON.stringify(r),
      min: longueur - 1 - (arrets.length - 2), proposes: [], fini: false, abandon: false,
      ordre: mode === 'ordre', chemin: [arrets[0]], cible: 1, essais: []
    };

    api.carte(carteJeu, { titre: 'Le Grand Chemin' });
    api.reinitialiserVue();
    numeroterEtapes();
    afficherTrajet();
    $('#chemin-min').textContent = partie.min;
    $('#chemin-search').value = '';
    fermerSuggestions();
    retour('idle', partie.ordre
      ? 'Pas à pas : partez de <strong>' + api.esc(nom(partie.a)) + '</strong> et avancez de voisin en voisin, sans détour' +
        (arrets.length > 2 ? ', en passant par les étapes dans l\'ordre.' : '.')
      : arrets.length > 2
      ? 'Tapez le nom des départements qui relient le départ à l\'arrivée en passant par les étapes, dans l\'ordre, ' +
        'sans repasser par un même département (Corse et Outre-Mer exclus).'
      : 'Tapez le nom des départements qui relient les deux (Corse et Outre-Mer exclus).');
    majAffichage();
  }

  function proposer(code) {
    if (!partie || partie.fini) return;
    if (!voisins[code]) return retour('ko', 'Ce département ne fait pas partie du jeu.');
    if (partie.arrets.includes(code)) {
      const i = numeroEtape(code);
      return retour('idle', '<strong>' + api.esc(nom(code)) + '</strong> est ' +
        (code === partie.a ? 'le département de départ.' : code === partie.b ? 'le département d\'arrivée.' : 'l\'étape ' + i + '.'));
    }
    if ((partie.ordre ? partie.chemin : partie.proposes).includes(code)) {
      return retour('idle', '<strong>' + api.esc(nom(code)) + '</strong> est déjà proposé.');
    }
    if (partie.ordre) return proposerPasAPas(code);
    partie.proposes.push(code);
    if (relie()) {
      partie.fini = true;
      const k = partie.arrets.length - 2;
      retour('ok', '🎉 Vous avez relié <strong>' + api.esc(nom(partie.a)) + '</strong> à <strong>' +
        api.esc(nom(partie.b)) + '</strong>' + (k ? ' en passant par ' + (k > 1 ? 'les ' + k + ' étapes' : 'l\'étape') : '') + ' !');
    } else if (mode === 'aide') {
      const bon = cheminParfait().includes(code);
      retour(bon ? 'ok' : 'ko', (bon ? '✅ ' : '❌ ') + '<strong>' + api.esc(nom(code)) + '</strong> ' +
        (bon ? 'fait partie d\'un chemin parfait.' : 'ne fait pas partie d\'un chemin parfait.'));
    } else {
      retour('idle', '<strong>' + api.esc(nom(code)) + '</strong> ajouté.');
    }
    majAffichage();
  }

  // Pas à pas : la proposition doit toucher le dernier département validé, rapprocher de l'arrêt visé et
  // laisser un chemin parfait jusqu'à B sans repasser par un département ; sinon elle est rouge
  function proposerPasAPas(code) {
    partie.proposes.push(code);
    const pos = partie.chemin[partie.chemin.length - 1];
    const cible = partie.arrets[partie.cible];
    const n = '<strong>' + api.esc(nom(code)) + '</strong>';
    let raison = null;
    if (!voisins[pos].includes(code)) {
      raison = 'ne touche pas <strong>' + api.esc(nom(pos)) + '</strong>, le dernier département du chemin';
    } else if (DIST[cible][code] !== DIST[cible][pos] - 1) {
      raison = 'est un détour : il ne rapproche pas de <strong>' + api.esc(nom(cible)) + '</strong>';
    } else if (suiteParfaite(code, partie.cible, new Set(partie.arrets.concat(partie.chemin, code))) === null) {
      raison = 'ne laisse plus de chemin parfait sans repasser par un même département';
    }
    partie.essais.push({ code, ok: !raison });
    if (raison) {
      retour('ko', '❌ ' + n + ' ' + raison + '.');
      return majAffichage();
    }
    partie.chemin.push(code);
    let message = '✅ ' + n + ' : continuez.';
    if (DIST[cible][code] === 1) {                   // à côté de l'arrêt visé : on y passe
      partie.chemin.push(cible);
      partie.cible++;
      if (cible === partie.b) {
        partie.fini = true;
        message = '🎉 Vous avez relié <strong>' + api.esc(nom(partie.a)) + '</strong> à <strong>' + api.esc(nom(partie.b)) + '</strong> !';
      } else {
        message = '✅ ' + n + ' : vous voilà à l\'étape ' + (partie.cible - 1) + ', <strong>' + api.esc(nom(cible)) + '</strong>.';
      }
    }
    retour('ok', message);
    majAffichage();
  }

  // Pas à pas : un chemin parfait de u (en route vers l'arrêt n° t) jusqu'à B qui évite `pris` (les
  // départements après u, étapes comprises), ou null s'il n'y en a pas. Sur le dernier tronçon, un
  // cul-de-sac le reste (les plus courts chemins descendent la distance) ; au-delà d'un budget, inconnu
  // (undefined) : la proposition est acceptée.
  function suiteParfaite(u, t, pris) {
    const dernier = partie.arrets.length - 1;
    let pas = 0;
    function suite(x, i, impasses) {
      if (++pas > 20000) throw new RangeError('budget');
      const cible = partie.arrets[i];
      if (x === cible) return i === dernier ? [] : suite(x, i + 1, new Set());
      for (const v of voisins[x]) {
        if (DIST[cible][v] !== DIST[cible][x] - 1 || impasses.has(v)) continue;
        if (v !== cible && pris.has(v)) continue;
        if (v !== cible) pris.add(v);
        const reste = suite(v, i, impasses);
        if (v !== cible) pris.delete(v);
        if (reste) return [v].concat(reste);
        if (i === dernier) impasses.add(v);
      }
      return null;
    }
    try {
      return suite(u, t, new Set());
    } catch (e) {
      if (e instanceof RangeError) return undefined;
      throw e;
    }
  }

  // Chemin à montrer en fin de partie : pas à pas, le chemin validé (complété s'il a abandonné) ;
  // sinon le chemin parfait le plus proche des choix du joueur
  function cheminMontre() {
    if (!partie.ordre) return cheminParfait();
    const pos = partie.chemin[partie.chemin.length - 1];
    if (pos === partie.b) return partie.chemin;
    const suite = suiteParfaite(pos, partie.cible, new Set(partie.arrets.concat(partie.chemin)));
    return suite ? partie.chemin.concat(suite) : cheminParfait();
  }

  function abandonner() {
    if (!partie || partie.fini) return;
    partie.fini = true;
    partie.abandon = true;
    retour('idle', 'Voici un chemin parfait. Retentez votre chance avec une nouvelle partie !');
    majAffichage();
  }

  /* ---------- Recherche (saisie du nom) ---------- */

  // Règles du nommage (js/core.js) : rien avant 3 caractères, seulement les noms qui commencent par le
  // texte tapé. En plus, un code exact (« 29 ») propose son département, même sous 3 caractères.
  // null : texte trop court, pas de liste
  function chercher(texte) {
    const pris = partie.ordre ? partie.chemin : partie.proposes;      // pas à pas : un refusé peut revenir
    const libres = codes.filter((c) => !partie.arrets.includes(c) && !pris.includes(c));
    const parCode = libres.find((c) => c.toLowerCase() === api.normaliser(texte));
    const parNom = api.suggestions(texte, libres.map((c) => ({ code: c, nom: nom(c) })));
    if (!parCode && !parNom) return null;
    return (parCode ? [{ code: parCode, nom: nom(parCode) }] : [])
      .concat((parNom || []).filter((s) => s.code !== parCode)).slice(0, MAX_SUGGESTIONS);
  }

  function dessinerSuggestions() {
    const champ = $('#chemin-search');
    const liste = $('#chemin-suggestions');
    if (!champ.value.trim()) return fermerSuggestions();
    liste.innerHTML = suggestions.length
      ? suggestions.map((s, i) =>
          '<li role="option" id="chemin-sugg-' + i + '" data-zone="' + api.esc(s.code) + '"' +
          ' aria-selected="' + (i === suggestionActive) + '"' + (i === suggestionActive ? ' class="is-active"' : '') + '>' +
            '<span>' + api.esc(s.nom) + '</span><span class="sugg-code">' + api.esc(s.code) + '</span></li>').join('')
      : '<li class="sugg-vide">Aucun département disponible</li>';
    liste.classList.remove('hidden');
    champ.setAttribute('aria-expanded', 'true');
  }

  function fermerSuggestions() {
    const liste = $('#chemin-suggestions');
    liste.classList.add('hidden');
    liste.innerHTML = '';
    $('#chemin-search').setAttribute('aria-expanded', 'false');
    suggestions = [];
    suggestionActive = -1;
  }

  function choisir(code) {
    $('#chemin-search').value = '';
    fermerSuggestions();
    proposer(code);
  }

  function brancher() {
    const champ = $('#chemin-search');
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
    // mousedown : le champ garde le focus, la liste ne se ferme pas avant le choix
    $('#chemin-suggestions').addEventListener('mousedown', (e) => {
      e.preventDefault();
      const li = e.target.closest('[data-zone]');
      if (li) choisir(li.dataset.zone);
    });

    // Paramètres : ouverture vers le haut ; fermés par un clic ailleurs ou par Échap
    $('#chemin-reglages-btn').addEventListener('click', () => ouvrirReglages($('#chemin-reglages').hidden));
    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.chemin-reglages')) ouvrirReglages(false);
    });
    $('#screen-chemin').addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || $('#chemin-reglages').hidden || e.target === champ) return;
      ouvrirReglages(false);
      $('#chemin-reglages-btn').focus();
    });
    $('#chemin-long-min').addEventListener('change', (e) => {
      const min = Number(e.target.value);
      changerReglages({ min, max: Math.max(min, reglages.max) });
    });
    $('#chemin-long-max').addEventListener('change', (e) => {
      const max = Number(e.target.value);
      changerReglages({ max, min: Math.min(max, reglages.min) });
    });
    $('#chemin-detours').addEventListener('change', (e) => changerReglages({ detours: e.target.checked }));
    $('#chemin-etapes').addEventListener('click', (e) => {
      const b = e.target.closest('[data-etapes]');
      if (b && !b.disabled) changerReglages({ etapes: Number(b.dataset.etapes) });
    });
    // Indications : Libre et Aide s'appliquent tout de suite ; Pas à pas change les règles, donc la partie
    // (tout de suite si rien n'a été proposé, sinon à la suivante)
    $('#chemin-mode').addEventListener('click', (e) => {
      const b = e.target.closest('[data-indication]');
      if (!b || b.dataset.indication === mode) return;
      mode = b.dataset.indication;
      ecrireMode(mode);
      afficherReglages();
      if (!partie) return;
      if (partie.ordre !== (mode === 'ordre') && !partie.fini && !partie.proposes.length) nouvellePartie();
      else majAffichage();
    });

    $('#chemin-abandon').addEventListener('click', abandonner);
    $('#chemin-nouveau').addEventListener('click', () => {
      ouvrirReglages(false);
      nouvellePartie();
      $('#chemin-search').focus();
    });
  }

  /* ---------- Enregistrement ---------- */

  GeoNohyne.registerJeu({
    id: 'grand-chemin',
    titre: 'Le Grand Chemin',
    icone: '🧭',
    description: 'Reliez deux départements de voisin en voisin, par le chemin le plus court, avec ou sans détours.',
    ecran: 'screen-chemin',

    ouvrir(outils) {
      if (!api) {
        api = outils;
        carteJeu = preparerCarte();
        brancher();
      }
      reglages = lireReglages();
      afficherReglages();
      ouvrirReglages(false);
      mode = lireMode();
      afficherReglages();
      nouvellePartie();
      $('#chemin-search').focus();
    }
    // pas de clic(code) : la carte n'est pas cliquable, il faut connaître les noms
  });
})();
