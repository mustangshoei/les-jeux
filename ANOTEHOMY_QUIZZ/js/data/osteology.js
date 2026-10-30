/* ==========================================================================
   Anotehomy Quizz - data/osteology.js
   DECOUPAGE DES OS EN REGIONS (jeu "Osteologie descriptive")
   --------------------------------------------------------------------------
   Chaque os (os droit pour les os pairs) est decoupe en parties nommees en
   nomenclature TA2. Une partie est definie par :
     id, name (francais TA2), latin, alt (variantes acceptees), old (ancienne
     nomenclature, reconnue mais comptee fausse) et sa geometrie :
       test(t, B) : vrai si le triangle t appartient a la partie (la premiere
                    partie dont le test est vrai l'emporte : l'ordre compte) ;
       seed(B)    : point(s) d'ou la partie s'etend par croissance le long de
                    la surface (pour les zones sans limite nette) ;
       grow       : vitesse relative de cette croissance (defaut 1 ; 0 = la
                    partie ne s'etend pas et fait barriere).
   La surface non attribuee par les tests est partagee entre les parties
   voisines par croissance geodesique (voir js/engine/segment.js). Une
   derniere partie "test: () => true" recoit tout le reste.

   Triangle t : x, y, z (mm) ; nx, ny, nz (normale) ; h (hauteur 0 -> 1) ;
   a (0 posterieur -> 1 anterieur) ; m (0 lateral -> 1 medial ; pour un os
   impair : 1 sur la ligne mediane) ; lat = 1 - m ; nm (normale vers le medial) ;
   el (element BodyParts3D d'origine) ; i (indice, pour les champs B.F).
   Contexte B : B.L (reperes calcules dans landmarks), B.ext (point extreme dans
   une direction), B.dir(m, s, a) (direction medial/haut/avant), B.dxyz (repere
   brut, x = gauche du sujet), B.d (distance d'un triangle a un point), B.sphere,
   B.field (distance geodesique), B.axis, B.plane, B.surf, B.hOf / B.mOf / B.aOf,
   B.relief (saillie par rapport a la surface moyenne d'un os plat et courbe),
   B.split (partage geodesique d'une zone entre des graines), B.cup / B.bestCup
   (centre d'une cupule : acetabulum, fosse, meat, foramen).
   Outils de ce fichier : longAxis, crest (ligne de crete d'un os long),
   outline / onArc (bords d'un os plat), line2 / lineSide, vaultCenter / outward
   (faces interne et externe des os du crane), artProcesses (vertebres).
   Repere : x = gauche du sujet, y = haut, z = anterieur (mm).
   Les decoupages ont ete verifies visuellement, os par os, sur des planches
   de rendus en couleurs (une couleur par partie, mode "atlas" du jeu).
   ========================================================================== */
(function (NS) {
  'use strict';

  const OSTEO = [];        /* definitions, dans l'ordre de la liste de choix */
  const OSTEO_BY = {};     /* par cle */

  /* partie d'un os */
  const P = (id, name, latin, o = {}) => Object.assign({ id, name, latin, alt: [], old: [] }, o);
  /* os : identifiant du catalogue (js/data/bones.js), cote ('R' = droit ; null = impair),
     etiquette (niveau vertebral, numero de cote) et definition { landmarks, parts } */
  function OS(bone, side, label, def) {
    const key = bone + (label ? '-' + label.replace(/\s+/g, '') : '');
    const d = Object.assign({ key, bone, side, label }, def);
    OSTEO.push(d);
    OSTEO_BY[key] = d;
  }

  /* ---------------- Outils communs ---------------- */
  /* t est-il du cote medial du point p ? (os pair) */
  const isMed = (t, B, p) => (t.x - p[0]) * (B.med || 1) > 0;
  /* decalage medial (mm, positif = plus medial) de t par rapport a p */
  const medOff = (t, B, p) => (t.x - p[0]) * (B.med || 1);
  /* valeur d'un champ par triangle (B.F) */
  const F = (B, name, t) => B.F[name][t.i];
  /* os long : axe entre les centres des extremites ; B.F.s = 0 distal -> 1 proximal ;
     position autour de l'axe : B.F.rm (vers le medial, -1 -> 1) et B.F.ra (vers l'avant) */
  function longAxis(B, lo = 0.04, hi = 0.96) {
    B.L.bot = B.centroid(t => t.h < lo);
    B.L.top = B.centroid(t => t.h > hi);
    B.axis('s', B.L.bot, B.L.top);
    const d = B.unit(B.sub(B.L.top, B.L.bot));
    const flat = v => { const k = B.dot(v, d); return B.unit([v[0] - k * d[0], v[1] - k * d[1], v[2] - k * d[2]]); };
    const md = flat(B.dir(1, 0, 0)), ad = flat(B.dir(0, 0, 1)), n = B.M.nt;
    const rm = new Float32Array(n), ra = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = B.set(i), r = flat(B.sub([t.x, t.y, t.z], B.L.bot));
      rm[i] = B.dot(r, md); ra[i] = B.dot(r, ad);
    }
    B.F.rm = rm; B.F.ra = ra;
  }
  /* crete d'un os long (bord interosseux, bord anterieur, ligne apre) : dans chaque tranche
     de B.F.s entre s0 et s1, point le plus saillant dans la direction dir ; B.F[name] = distance
     (mm) a cette ligne de crete (Infinity hors de [s0, s1]) */
  function crest(B, name, dir, s0, s1, opts = {}) {
    const bins = opts.bins || 40, filter = opts.filter;
    const n = B.M.nt, S = B.F[opts.field || 's'], best = new Float64Array(bins).fill(-Infinity), pts = new Array(bins).fill(null);
    const bin = s => Math.min(bins - 1, Math.floor((s - s0) / (s1 - s0) * bins));
    for (let i = 0; i < n; i++) {
      if (S[i] < s0 || S[i] > s1) continue;
      const t = B.set(i);
      if (filter && !filter(t, B)) continue;
      const v = t.x * dir[0] + t.y * dir[1] + t.z * dir[2], b = bin(S[i]);
      if (v > best[b]) { best[b] = v; pts[b] = [t.x, t.y, t.z]; }
    }
    const f = new Float32Array(n).fill(Infinity);
    for (let i = 0; i < n; i++) {
      if (S[i] < s0 || S[i] > s1) continue;
      const t = B.set(i), b = bin(S[i]);
      for (let k = Math.max(0, b - 2); k <= Math.min(bins - 1, b + 2); k++) if (pts[k]) f[i] = Math.min(f[i], B.d(t, pts[k]));
    }
    B.F[name] = f;
    /* point de la crete a la position s (pour placer des graines entre deux cretes) */
    B.K = B.K || {};
    B.K[name] = s => { let k = bin(Math.max(s0, Math.min(s1, s))); while (k > 0 && !pts[k]) k--; return pts[k] || B.cen.slice(); };
    return f;
  }
  /* graine d'une face comprise entre deux cretes : point de surface le plus proche du milieu
     des deux cretes a la position s, du cote dir */
  const faceSeed = (B, c1, c2, s, dir) => B.surf(B.mix(B.K[c1](s), B.K[c2](s), 0.5), t => B.ndot(t, dir) > 0.3);
  /* champ B.F.hgt : hauteur normalisee t.h de chaque triangle (pour crest selon la hauteur) */
  function heightField(B) {
    const f = new Float32Array(B.M.nt);
    for (let i = 0; i < B.M.nt; i++) f[i] = B.set(i).h;
    B.F.hgt = f;
  }
  /* distance (mm) du triangle au segment [a, b] (ligne, crete reliant deux reperes) */
  function segDist(t, a, b) {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ap = [t.x - a[0], t.y - a[1], t.z - a[2]];
    const k = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / (ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 || 1)));
    return Math.hypot(ap[0] - k * ab[0], ap[1] - k * ab[1], ap[2] - k * ab[2]);
  }
  /* contact avec un os voisin (surfaces articulaires des petits os) : B.F[name] = distance (mm)
     du triangle au point le plus proche de la surface de cet os (meme repere) : version
     detaillee de l'osteologie si elle existe, sinon squelette du jeu 1 ; la surface voisine
     est echantillonnee tous les millimetres environ (sommets et interieur des triangles).
     opts.side / opts.label : instance voulue (ex. { side: 'R', label: 'metacarpien IV' }). */
  function contact(B, name, bone, opts = {}) {
    const n = B.M.nt, f = new Float32Array(n).fill(Infinity), fd = new Float32Array(n);
    B.F[name] = f;
    B.F[name + 'Dot'] = fd;   /* la surface regarde-t-elle l'os voisin ? (cosinus) */
    const fine = AQ.engine.osteoPart(bone, opts.side, opts.label);
    const srcs = fine ? [[fine.positions, fine.indices]] : AQ.engine.instancesOf(bone)
      .filter(i => (!opts.side || i.side === opts.side) && (!opts.label || i.label === opts.label))
      .map(i => [i.mesh.geometry.attributes.position.array, i.mesh.geometry.index.array]);
    if (!srcs.length) return f;
    const cs = 4, grid = new Map(), key = (x, y, z) => ((Math.floor(x / cs) + 2000) * 4096 + (Math.floor(y / cs) + 2000)) * 4096 + Math.floor(z / cs) + 2000;
    const add = (x, y, z) => {
      const k = key(x, y, z);
      let c = grid.get(k);
      if (!c) grid.set(k, c = []);
      c.push(x, y, z);
    };
    const len = (p, a, b) => Math.hypot(p[a] - p[b], p[a + 1] - p[b + 1], p[a + 2] - p[b + 2]);
    srcs.forEach(([p, ix]) => {
      for (let i = 0; i < p.length; i += 3) add(p[i], p[i + 1], p[i + 2]);
      for (let t = 0; t < ix.length; t += 3) {
        const a = ix[t] * 3, b = ix[t + 1] * 3, c = ix[t + 2] * 3;
        const k = Math.min(8, Math.ceil(Math.max(len(p, a, b), len(p, b, c), len(p, c, a))));
        if (k < 2) continue;
        for (let i = 0; i <= k; i++) for (let j = 0; j <= k - i; j++) {
          if ((i === 0 && j === 0) || i === k || j === k) continue;     /* sommets deja ajoutes */
          const u = i / k, v = j / k, w = 1 - u - v;
          add(p[a] * w + p[b] * u + p[c] * v, p[a + 1] * w + p[b + 1] * u + p[c + 1] * v, p[a + 2] * w + p[b + 2] * u + p[c + 2] * v);
        }
      }
    });
    for (let i = 0; i < n; i++) {
      const t = B.set(i);
      let best = Infinity, bx = 0, by = 0, bz = 0;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        const c = grid.get(key(t.x + dx * cs, t.y + dy * cs, t.z + dz * cs));
        if (!c) continue;
        for (let j = 0; j < c.length; j += 3) {
          const d = (c[j] - t.x) ** 2 + (c[j + 1] - t.y) ** 2 + (c[j + 2] - t.z) ** 2;
          if (d < best) { best = d; bx = c[j]; by = c[j + 1]; bz = c[j + 2]; }
        }
      }
      f[i] = Math.sqrt(best);
      if (best < Infinity && best > 1e-9) fd[i] = (t.nx * (bx - t.x) + t.ny * (by - t.y) + t.nz * (bz - t.z)) / f[i];
    }
    return f;
  }
  /* os long du pied (metatarsien, oriente d'arriere en avant) : B.F.s = 0 distal -> 1 proximal */
  function footAxis(B) {
    B.L.bot = B.centroid(t => t.a > 0.96);
    B.L.top = B.centroid(t => t.a < 0.04);
    B.axis('s', B.L.bot, B.L.top);
  }
  /* surface concave autour d'un centre c (cupule, incisure) : la normale regarde vers c */
  const facesTo = (t, B, c, k = 0.5) => B.ndot(t, B.unit([c[0] - t.x, c[1] - t.y, c[2] - t.z])) > k;
  /* centre de courbure d'un os plat du crane : sphere ajustee aux triangles qui verifient
     un filtre (ecaille) ; sert de centre a outward() */
  const vaultCenter = (B, filter) => B.sphere(B.centroid(filter), 1e4, filter).c;
  /* champ B.F.out : la normale pointe-t-elle vers l'exterieur (depuis un centre sc) ? */
  function outward(B, sc) {
    const n = B.M.nt, f = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = B.set(i), d = B.unit([t.x - sc[0], t.y - sc[1], t.z - sc[2]]);
      f[i] = t.nx * d[0] + t.ny * d[1] + t.nz * d[2];
    }
    B.F.out = f;
  }
  /* cote du sujet pour un os impair : x > centre = gauche */
  const leftSide = (t, B) => t.x > B.cen[0];

  /* ---- os plats (apres B.relief('r', plan)) : coordonnees U, V dans le plan de l'os ---- */
  /* droite principale, dans le plan, des triangles qui verifient un filtre : { u, v, du, dv } */
  function line2(B, filter) {
    const U = B.F.rU, V = B.F.rV, A = B.M.A, n = B.M.nt;
    let w = 0, su = 0, sv = 0, cuu = 0, cuv = 0, cvv = 0;
    for (let i = 0; i < n; i++) { if (!filter(B.set(i), B)) continue; su += U[i] * A[i]; sv += V[i] * A[i]; w += A[i]; }
    const u = su / (w || 1), v = sv / (w || 1);
    for (let i = 0; i < n; i++) {
      if (!filter(B.set(i), B)) continue;
      const du = U[i] - u, dv = V[i] - v;
      cuu += du * du * A[i]; cuv += du * dv * A[i]; cvv += dv * dv * A[i];
    }
    const th = 0.5 * Math.atan2(2 * cuv, cuu - cvv);
    return { u, v, du: Math.cos(th), dv: Math.sin(th) };
  }
  /* champ B.F[name] : distance signee (mm, dans le plan) a une droite de line2,
     positive du cote du point p */
  function lineSide(B, name, ln, p) {
    const U = B.F.rU, V = B.F.rV, n = B.M.nt, f = new Float32Array(n);
    for (let i = 0; i < n; i++) f[i] = -(U[i] - ln.u) * ln.dv + (V[i] - ln.v) * ln.du;
    if (f[B.near(p)] < 0) for (let i = 0; i < n; i++) f[i] = -f[i];
    B.F[name] = f;
    return f;
  }
  /* contour de l'os projete dans son plan : B.F[name] = distance (mm) au contour, vers
     l'interieur ; B.F[name + 'A'] = angle autour du centre. Seuls les triangles qui
     verifient keep(t, B) dessinent le contour (on ecarte les processus saillants). */
  function outline(B, name, keep, bins = 120) {
    const U = B.F.rU, V = B.F.rV, A = B.M.A, n = B.M.nt;
    let su = 0, sv = 0, sw = 0;
    const kept = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (keep(B.set(i), B)) { kept[i] = 1; su += U[i] * A[i]; sv += V[i] * A[i]; sw += A[i]; }
    const u0 = su / (sw || 1), v0 = sv / (sw || 1);
    const ang = new Float32Array(n), rad = new Float32Array(n), mx = new Float32Array(bins);
    const binOf = a => Math.min(bins - 1, Math.floor((a + Math.PI) / (2 * Math.PI) * bins));
    for (let i = 0; i < n; i++) {
      ang[i] = Math.atan2(V[i] - v0, U[i] - u0);
      rad[i] = Math.hypot(U[i] - u0, V[i] - v0);
      if (kept[i]) { const b = binOf(ang[i]); if (rad[i] > mx[b]) mx[b] = rad[i]; }
    }
    const env = mx.map((m, b) => Math.max(mx[(b + bins - 1) % bins], m, mx[(b + 1) % bins]));
    const f = new Float32Array(n);
    for (let i = 0; i < n; i++) f[i] = env[binOf(ang[i])] - rad[i];
    B.F[name] = f;
    B.F[name + 'A'] = ang;
    return f;
  }
  /* angle (autour du centre du contour) du point de la surface le plus proche de p */
  const angleOf = (B, name, p) => B.F[name + 'A'][B.near(p)];
  /* l'angle x est-il sur l'arc qui va de a a b sans passer par o ? */
  function onArc(x, a, b, o) {
    const T = 2 * Math.PI, d = v => ((v - a) % T + T) % T;
    return d(o) < d(b) ? d(x) >= d(b) : d(x) <= d(b);
  }

  /* ======================================================================
     MEMBRE SUPERIEUR
     ====================================================================== */

  /* ---------------- Clavicule ---------------- */
  OS('clavicula', 'R', null, {
    landmarks(B) {
      /* longueur le long de l'os depuis l'extremite sternale (os en S) */
      B.L.st = B.ext(B.dir(1, 0, 0.2));
      const g = B.field('g', B.L.st);
      let mx = 0;
      for (let i = 0; i < g.length; i++) if (g[i] > mx) mx = g[i];
      B.L.len = mx;
      B.L.con = B.ext(B.dir(0, -1, -0.8), t => F(B, 'g', t) > 0.66 * mx && F(B, 'g', t) < 0.85 * mx);
    },
    parts: [
      P('facies_articularis_sternalis', 'surface articulaire sternale', 'facies articularis sternalis', { alt: ['face articulaire sternale'],
        test: (t, B) => F(B, 'g', t) < 0.1 * B.L.len && t.nm > 0.55, grow: 0 }),
      P('facies_articularis_acromialis', 'surface articulaire acromiale', 'facies articularis acromialis', { alt: ['face articulaire acromiale'],
        test: (t, B) => F(B, 'g', t) > 0.92 * B.L.len && t.nm < -0.55, grow: 0 }),
      P('extremitas_sternalis', 'extrémité sternale', 'extremitas sternalis', { old: ['extrémité interne', 'extrémité médiale'],
        test: (t, B) => F(B, 'g', t) < 0.14 * B.L.len, grow: 0 }),
      P('extremitas_acromialis', 'extrémité acromiale', 'extremitas acromialis', { old: ['extrémité externe', 'extrémité latérale'],
        test: (t, B) => F(B, 'g', t) > 0.88 * B.L.len, grow: 0 }),
      P('tuberculum_conoideum', 'tubercule conoïde', 'tuberculum conoideum', { old: ['tubercule coracoïdien'],
        test: (t, B) => B.d(t, B.L.con) < 8, grow: 0 }),
      P('linea_trapezoidea', 'ligne trapézoïde', 'linea trapezoidea',
        { test: (t, B) => t.ny < -0.4 && F(B, 'g', t) > 0.74 * B.L.len && B.d(t, B.L.con) > 6, grow: 0 }),
      P('sulcus_subclavius', 'sillon du muscle subclavier', 'sulcus musculi subclavii', { alt: ['sillon subclavier'], old: ['gouttière du subclavier', 'gouttière sous-clavière'],
        test: (t, B) => t.ny < -0.6 && F(B, 'g', t) > 0.32 * B.L.len && F(B, 'g', t) < 0.62 * B.L.len, grow: 0 }),
      P('corpus', 'corps de la clavicule', 'corpus claviculae', { alt: ['corps', 'diaphyse'],
        test: () => true })
    ]
  });

  /* ---------------- Scapula ---------------- */
  /* epine : forte saillie posterieure, ou saillie moderee le long de la ligne de l'epine (racine) */
  const scapSpine = (t, B) => { const r = F(B, 'r', t); return r > 12 || (r > 4 && Math.abs(F(B, 'so', t)) < 10); };
  OS('scapula', 'R', null, {
    landmarks(B) {
      const L = B.L;
      /* plan du corps de la scapula, normale orientee vers l'arriere */
      const pl = B.plane();
      if (pl.n[2] > 0) pl.n = pl.n.map(v => -v);
      L.back = pl.n;
      /* saillie posterieure par rapport a la surface moyenne (courbe) du corps : B.F.r */
      B.relief('r', pl, 3);
      L.ia = B.ext(B.dir(0, -1, 0));
      L.sa = B.ext(B.dir(0.8, 1, -0.2));
      L.gl = B.ext(B.dir(-1, -0.15, 0.25), t => t.h > 0.55 && t.h < 0.85);
      L.ac = B.ext(B.dir(-0.6, 0.5, -0.1), t => t.h > 0.8);
      L.co = B.ext(B.dir(-0.2, 0, 1));
      B.field('co', L.co);
      B.field('ac', L.ac);
      /* ligne de l'epine (fortes saillies hors acromion) : B.F.so > 0 du cote supra-epineux */
      const spine = line2(B, t => F(B, 'r', t) > 12 && F(B, 'ac', t) > 50 && B.d(t, L.gl) > 30);
      lineSide(B, 'so', spine, L.sa);
      /* contour du corps (sans glene, processus ni epine) et ses secteurs */
      outline(B, 'ol', t => B.d(t, L.gl) > 32 && F(B, 'co', t) > 45 && F(B, 'ac', t) > 55 && F(B, 'r', t) < 6);
      L.aSa = angleOf(B, 'ol', L.sa); L.aIa = angleOf(B, 'ol', L.ia);
      L.aGl = angleOf(B, 'ol', L.gl); L.aCo = angleOf(B, 'ol', L.co);
      /* incisure de la scapula : point du bord superieur le plus proche du processus coracoide */
      let best = Infinity;
      L.inc = L.co;
      for (let i = 0; i < B.M.nt; i++) {
        const t = B.set(i), g = F(B, 'co', t);
        if (F(B, 'ol', t) < 3 && g > 42 && g < best && onArc(F(B, 'olA', t), L.aSa, L.aCo, L.aIa)) { best = g; L.inc = [t.x, t.y, t.z]; }
      }
      /* fosses posterieures : la face posterieure libre est partagee entre deux graines,
         de part et d'autre de l'epine (qui fait barriere) */
      const back = t => B.ndot(t, L.back) > 0.3 && F(B, 'r', t) < 3 && F(B, 'ol', t) > 8;
      L.supra = B.surf(B.centroid(t => back(t) && F(B, 'so', t) > 10), t => back(t) && F(B, 'so', t) > 5);
      L.infra = B.surf(B.centroid(t => back(t) && F(B, 'so', t) < -25), t => back(t) && F(B, 'so', t) < -15);
      B.split('fos', t => B.ndot(t, L.back) > 0.1 && !scapSpine(t, B) && F(B, 'ol', t) >= 5 && B.d(t, L.gl) >= 27 &&
        F(B, 'co', t) >= 42 && F(B, 'ac', t) >= 45, [L.supra, L.infra]);
    },
    parts: [
      P('cavitas_glenoidalis', 'cavité glénoïdale', 'cavitas glenoidalis', { alt: ['glène', 'cavité glénoïde de la scapula'], old: ['cavité glénoïde'],
        test: (t, B) => B.d(t, B.L.gl) < 18 && t.nm < -0.3, grow: 0.3 }),
      P('processus_coracoideus', 'processus coracoïde', 'processus coracoideus', { alt: ['coracoïde'], old: ['apophyse coracoïde'],
        test: (t, B) => F(B, 'co', t) < 42 && t.h > 0.6, grow: 0.3 }),
      P('acromion', 'acromion', 'acromion',
        { test: (t, B) => F(B, 'ac', t) < 45 && t.h > 0.7, grow: 0.3 }),
      P('incisura_scapulae', 'incisure de la scapula', 'incisura scapulae', { alt: ['incisure supra-scapulaire', 'incisure suprascapulaire'], old: ['échancrure coracoïdienne', 'échancrure de l\'omoplate'],
        test: (t, B) => B.d(t, B.L.inc) < 7, grow: 0 }),
      P('angulus_superior', 'angle supérieur', 'angulus superior', { alt: ['angle supérieur de la scapula'], old: ['angle supéro-interne'],
        test: (t, B) => B.d(t, B.L.sa) < 14, grow: 0 }),
      P('angulus_inferior', 'angle inférieur', 'angulus inferior', { alt: ['angle inférieur de la scapula'],
        test: (t, B) => B.d(t, B.L.ia) < 18, grow: 0 }),
      P('collum', 'col de la scapula', 'collum scapulae', { alt: ['col'], old: ['col de l\'omoplate'],
        test: (t, B) => B.d(t, B.L.gl) < 27 && F(B, 'r', t) < 10, grow: 0.3 }),
      P('spina_scapulae', 'épine de la scapula', 'spina scapulae', { alt: ['épine', 'épine scapulaire'], old: ['épine de l\'omoplate'],
        test: scapSpine, grow: 0 }),
      P('margo_superior', 'bord supérieur', 'margo superior', { alt: ['bord supérieur de la scapula'], old: ['bord cervical'],
        test: (t, B) => F(B, 'ol', t) < 5 && onArc(F(B, 'olA', t), B.L.aSa, B.L.aCo, B.L.aIa), grow: 0 }),
      P('margo_medialis', 'bord médial', 'margo medialis', { alt: ['bord médial de la scapula'], old: ['bord spinal', 'bord interne', 'bord vertébral'],
        test: (t, B) => F(B, 'ol', t) < 5 && onArc(F(B, 'olA', t), B.L.aSa, B.L.aIa, B.L.aGl), grow: 0 }),
      P('margo_lateralis', 'bord latéral', 'margo lateralis', { alt: ['bord latéral de la scapula'], old: ['bord axillaire', 'bord externe'],
        test: (t, B) => F(B, 'ol', t) < 6 && onArc(F(B, 'olA', t), B.L.aIa, B.L.aGl, B.L.aSa), grow: 0 }),
      P('fossa_subscapularis', 'fosse subscapulaire', 'fossa subscapularis', { alt: ['face costale'], old: ['fosse sous-scapulaire'],
        test: (t, B) => B.ndot(t, B.L.back) < -0.1, grow: 0.3 }),
      P('fossa_supraspinata', 'fosse supra-épineuse', 'fossa supraspinata', { old: ['fosse sus-épineuse'],
        test: (t, B) => F(B, 'fos', t) === 0 }),
      P('fossa_infraspinata', 'fosse infra-épineuse', 'fossa infraspinata', { old: ['fosse sous-épineuse'],
        test: (t, B) => F(B, 'fos', t) === 1 })
    ]
  });

  /* ---------------- Humerus ---------------- */
  OS('humerus', 'R', null, {
    landmarks(B) {
      const L = B.L;
      L.head = B.sphere(B.ext(B.dir(1, 0.6, -0.5), t => t.h > 0.8), 32);
      L.headAxis = B.dir(1, 0.9, -0.6);
      L.gt = B.ext(B.dir(-1, 0.2, 0.1), t => t.h > 0.85);
      L.lt = B.ext(B.dir(0.2, 0, 1), t => t.h > 0.82 && t.h < 0.95);
      L.dt = B.ext(B.dir(-1, 0, 0.35), t => t.h > 0.48 && t.h < 0.66);
      L.dist = B.centroid(t => t.h < 0.08);
      L.me = B.ext(B.dir(1, 0, 0), t => t.h < 0.15);
      L.le = B.ext(B.dir(-1, 0, 0), t => t.h < 0.13);
    },
    parts: [
      P('caput', 'tête de l\'humérus', 'caput humeri', { alt: ['tête', 'tête humérale'],
        test: (t, B) => { const h = B.L.head; return B.d(t, h.c) < h.r * 1.08 && B.dot(B.sub([t.x, t.y, t.z], h.c), B.L.headAxis) > -0.25 * h.r; } }),
      P('tuberculum_majus', 'tubercule majeur', 'tuberculum majus', { alt: ['grand tubercule'], old: ['grosse tubérosité', 'trochiter'],
        test: (t, B) => B.d(t, B.L.gt) < 22 && t.h > 0.82 }),
      P('tuberculum_minus', 'tubercule mineur', 'tuberculum minus', { alt: ['petit tubercule'], old: ['petite tubérosité', 'trochin'],
        test: (t, B) => B.d(t, B.L.lt) < 12 }),
      P('collum_anatomicum', 'col anatomique', 'collum anatomicum', { alt: ['col anatomique de l\'humérus'],
        test: (t, B) => { const h = B.L.head; return B.d(t, h.c) < h.r * 1.22 && B.dot(B.sub([t.x, t.y, t.z], h.c), B.L.headAxis) > -0.5 * h.r; }, grow: 0 }),
      P('sulcus_intertubercularis', 'sillon intertuberculaire', 'sulcus intertubercularis', { old: ['coulisse bicipitale', 'gouttière bicipitale'],
        test: (t, B) => t.h > 0.74 && t.h < B.hOf(B.L.lt) + 0.02 && t.nz > 0.35 && medOff(t, B, B.L.lt) < -4 && medOff(t, B, B.L.lt) > -16 }),
      P('collum_chirurgicum', 'col chirurgical', 'collum chirurgicum', { alt: ['col chirurgical de l\'humérus'],
        test: t => t.h > 0.78 && t.h < 0.85 }),
      P('tuberositas_deltoidea', 'tubérosité deltoïdienne', 'tuberositas deltoidea', { old: ['v deltoïdien', 'empreinte deltoïdienne'],
        test: (t, B) => B.d(t, B.L.dt) < 16 && t.nm < 0 }),
      P('epicondylus_medialis', 'épicondyle médial', 'epicondylus medialis', { old: ['épitrochlée'],
        test: (t, B) => B.d(t, B.L.me) < 13 }),
      P('epicondylus_lateralis', 'épicondyle latéral', 'epicondylus lateralis',
        { test: (t, B) => B.d(t, B.L.le) < 11 }),
      P('fossa_olecrani', 'fosse olécrânienne', 'fossa olecrani', { old: ['fossette olécrânienne'],
        test: (t, B) => t.h > 0.05 && t.h < 0.15 && t.nz < -0.45 && Math.abs(t.x - B.L.dist[0]) < 13 }),
      P('fossa_coronoidea', 'fosse coronoïdienne', 'fossa coronoidea', { old: ['fossette coronoïdienne'],
        test: (t, B) => t.h > 0.07 && t.h < 0.13 && t.nz > 0.45 && medOff(t, B, B.L.dist) > -2 && medOff(t, B, B.L.dist) < 12 }),
      P('capitulum', 'capitulum', 'capitulum humeri', { alt: ['capitulum de l\'humérus'], old: ['condyle huméral'],
        test: (t, B) => t.h < 0.09 && medOff(t, B, B.L.dist) < -3 && t.nz > -0.25 }),
      P('trochlea', 'trochlée', 'trochlea humeri', { alt: ['trochlée humérale', 'trochlée de l\'humérus'],
        test: (t, B) => t.h < 0.09 && medOff(t, B, B.L.dist) >= -3 }),
      P('corpus', 'corps de l\'humérus', 'corpus humeri', { alt: ['corps', 'diaphyse', 'diaphyse humérale'],
        test: t => t.h > 0.16 && t.h < 0.77 })
    ]
  });

  /* ---------------- Radius ---------------- */
  OS('radius', 'R', null, {
    landmarks(B) {
      longAxis(B);
      B.L.ax = B.unit(B.sub(B.L.top, B.L.bot));
      B.L.tub = B.ext(B.dir(0.7, 0, 0.7), t => F(B, 's', t) > 0.75 && F(B, 's', t) < 0.88);
      B.L.sty = B.ext(B.dir(-0.6, -1, 0.1), t => F(B, 's', t) < 0.12);
      B.L.dor = B.ext(B.dir(0, 0, -1), t => F(B, 's', t) > 0.03 && F(B, 's', t) < 0.12);
      crest(B, 'io', B.dir(1, 0, 0), 0.2, 0.8);
    },
    parts: [
      P('fovea_articularis', 'fovea articulaire', 'fovea articularis capitis radii', { alt: ['fovea articulaire de la tête du radius', 'fossette articulaire'], old: ['cupule radiale'],
        test: (t, B) => F(B, 's', t) > 0.95 && B.ndot(t, B.L.ax) > 0.55, grow: 0 }),
      P('circumferentia_articularis', 'circonférence articulaire', 'circumferentia articularis radii', { alt: ['circonférence articulaire de la tête du radius', 'pourtour articulaire'],
        test: (t, B) => F(B, 's', t) > 0.935, grow: 0 }),
      P('tuberositas', 'tubérosité radiale', 'tuberositas radii', { alt: ['tubérosité du radius'], old: ['tubérosité bicipitale'],
        test: (t, B) => B.d(t, B.L.tub) < 10, grow: 0 }),
      P('collum', 'col du radius', 'collum radii', { alt: ['col'],
        test: (t, B) => F(B, 's', t) > 0.87, grow: 0 }),
      P('processus_styloideus', 'processus styloïde du radius', 'processus styloideus radii', { alt: ['processus styloïde'], old: ['apophyse styloïde', 'apophyse styloïde du radius'],
        test: (t, B) => B.d(t, B.L.sty) < 10, grow: 0 }),
      P('facies_articularis_carpalis', 'surface articulaire carpienne', 'facies articularis carpalis', { alt: ['face articulaire carpienne'],
        test: (t, B) => B.ndot(t, B.L.ax) < -0.6 && F(B, 's', t) < 0.05, grow: 0 }),
      P('incisura_ulnaris', 'incisure ulnaire', 'incisura ulnaris', { alt: ['incisure ulnaire du radius'], old: ['cavité sigmoïde du radius'],
        test: (t, B) => F(B, 's', t) < 0.07 && F(B, 'rm', t) > 0.6 && t.nm > 0.5, grow: 0 }),
      P('tuberculum_dorsale', 'tubercule dorsal', 'tuberculum dorsale', { alt: ['tubercule dorsal du radius'], old: ['tubercule de Lister'],
        test: (t, B) => B.d(t, B.L.dor) < 6, grow: 0 }),
      P('margo_interosseus', 'bord interosseux', 'margo interosseus radii', { alt: ['bord interosseux du radius', 'bord médial'], old: ['crête interosseuse'],
        test: (t, B) => F(B, 'io', t) < 3.5, grow: 0 }),
      P('corpus', 'corps du radius', 'corpus radii', { alt: ['corps', 'diaphyse'],
        test: () => true })
    ]
  });

  /* ---------------- Ulna ---------------- */
  OS('ulna', 'R', null, {
    landmarks(B) {
      const L = B.L;
      longAxis(B);
      L.ol = B.ext(B.dir(0, 1, -0.3));
      L.cor = B.ext(B.dir(0, 0, 1), t => F(B, 's', t) > 0.8 && F(B, 's', t) < 0.92);
      /* incisure trochleaire : sphere ajustee au fond de la cupule, entre olecrane et processus coronoide */
      const mid = B.mix(L.ol, L.cor, 0.5), front = t => t.nz > 0.2 && F(B, 'ra', t) > 0;
      L.tn = B.sphere(B.surf(mid, front), 16, front);
      /* incisure radiale : face laterale du processus coronoide */
      L.rn = B.ext(B.dir(-1, 0, 0.3), t => F(B, 's', t) > 0.83 && F(B, 's', t) < 0.91 && F(B, 'ra', t) > -0.2);
      L.tub = B.ext(B.dir(0, -0.3, 1), t => F(B, 's', t) > 0.74 && F(B, 's', t) < 0.82);
      L.sty = B.ext(B.dir(0.3, -1, -0.3), t => F(B, 's', t) < 0.1);
      crest(B, 'io', B.dir(-1, 0, 0), 0.2, 0.75);
    },
    parts: [
      P('incisura_trochlearis', 'incisure trochléaire', 'incisura trochlearis', { old: ['grande cavité sigmoïde'],
        test: (t, B) => { const c = B.L.tn; return B.d(t, c.c) < c.r * 1.7 && facesTo(t, B, c.c, 0.45); }, grow: 0 }),
      P('incisura_radialis', 'incisure radiale', 'incisura radialis', { alt: ['incisure radiale de l\'ulna'], old: ['petite cavité sigmoïde'],
        test: (t, B) => B.d(t, B.L.rn) < 9 && t.nm < -0.35, grow: 0 }),
      P('processus_coronoideus', 'processus coronoïde', 'processus coronoideus', { alt: ['processus coronoïde de l\'ulna'], old: ['apophyse coronoïde'],
        test: (t, B) => B.d(t, B.L.cor) < 13, grow: 0 }),
      P('olecranon', 'olécrâne', 'olecranon', { alt: ['olécrâne de l\'ulna', 'olécranon'],
        test: (t, B) => F(B, 's', t) > 0.89 || (F(B, 's', t) > 0.84 && F(B, 'ra', t) < -0.3), grow: 0 }),
      P('tuberositas', 'tubérosité de l\'ulna', 'tuberositas ulnae', { alt: ['tubérosité ulnaire'], old: ['tubérosité cubitale'],
        test: (t, B) => B.d(t, B.L.tub) < 9, grow: 0 }),
      P('processus_styloideus', 'processus styloïde de l\'ulna', 'processus styloideus ulnae', { alt: ['processus styloïde'], old: ['apophyse styloïde', 'apophyse styloïde du cubitus'],
        test: (t, B) => B.d(t, B.L.sty) < 7, grow: 0 }),
      P('caput', 'tête de l\'ulna', 'caput ulnae', { alt: ['tête', 'tête ulnaire'], old: ['tête du cubitus'],
        test: (t, B) => F(B, 's', t) < 0.07, grow: 0 }),
      P('margo_interosseus', 'bord interosseux', 'margo interosseus ulnae', { alt: ['bord interosseux de l\'ulna', 'bord latéral'], old: ['crête interosseuse'],
        test: (t, B) => F(B, 'io', t) < 3.5, grow: 0 }),
      P('corpus', 'corps de l\'ulna', 'corpus ulnae', { alt: ['corps', 'diaphyse'],
        test: () => true })
    ]
  });

  /* ---------------- Os courts (carpe, tarse) ---------------- */
  /* une surface articulaire par os voisin (contact dans le squelette), apres les reperes
     particuliers (o.first) ; le reste forme les faces non articulaires (o.faces).
     joint : { id, name, latin, bones: [[os, etiquette]], d (marge de contact, mm),
               max (seuil maximal, mm : 6,5 par defaut ; plus pour un interligne large),
               where (filtre supplementaire : face de l'os ou se trouve la surface),
               test (regle propre, a la place du contact ; champs B.F.j0, j1... disponibles) } */
  function shortBone(bone, side, o) {
    OS(bone, side, null, Object.assign({}, o.extra || {}, {
      landmarks(B) {
        /* seuil adaptatif : ecart articulaire minimal + marge, surface tournee vers l'os voisin */
        o.joints.forEach((j, k) => {
          const f = new Float32Array(B.M.nt).fill(Infinity), fd = new Float32Array(B.M.nt);
          j.bones.forEach(([b, label]) => {
            const g = contact(B, '_c', b, { side: D_SIDE[b] === false ? null : side, label }), gd = B.F._cDot;
            for (let i = 0; i < f.length; i++) if (g[i] < f[i]) { f[i] = g[i]; fd[i] = gd[i]; }
          });
          let mn = Infinity;
          for (let i = 0; i < f.length; i++) if (f[i] < mn) mn = f[i];
          B.F['j' + k] = f;
          B.F['j' + k + 'Dot'] = fd;
          B.L['thr' + k] = Math.min(mn + (j.d || 2.2), j.max || 6.5);
        });
        if (o.landmarks) o.landmarks(B);
      },
      /* contact : a moins de 0,8 mm (les os du modele se touchent ou s'interpenetrent un peu :
         l'orientation n'y veut rien dire), ou sous le seuil en regardant l'os voisin */
      parts: (o.first || []).concat(o.joints.map((j, k) => P(j.id, j.name, j.latin, {
        alt: j.alt || [], old: j.old || [], grow: 0,
        test: j.test || ((t, B) => {
          if (j.where && !j.where(t, B)) return false;
          const d = F(B, 'j' + k, t);
          return d < 0.8 || (d < B.L['thr' + k] && F(B, 'j' + k + 'Dot', t) > 0.15);
        }) })), o.faces)
    }));
  }
  /* os voisins impairs (pas de cote) */
  const D_SIDE = { vomer: false, os_ethmoidale: false, os_sphenoidale: false, os_frontale: false };
  /* surface articulaire (nom descriptif) */
  const J = (id, name, bones, o = {}) => Object.assign({ id, name, latin: o.latin || 'facies articularis', bones }, o);
  const HAND_FACES = [
    P('facies_palmaris', 'face palmaire', 'facies palmaris', { alt: ['face antérieure'], test: t => t.nz > 0.1 }),
    P('facies_dorsalis', 'face dorsale', 'facies dorsalis', { alt: ['face postérieure'], test: () => true })
  ];
  const FOOT_FACES = [
    P('facies_plantaris', 'face plantaire', 'facies plantaris', { alt: ['face inférieure'], test: t => t.ny < -0.1 }),
    P('facies_dorsalis', 'face dorsale', 'facies dorsalis', { alt: ['face supérieure'], test: () => true })
  ];

  /* Os de la main droite en position anatomique : paume en avant (+z), pouce en dehors,
     proximal = haut. */
  shortBone('os_scaphoideum', 'R', {
    landmarks(B) { B.L.tub = B.ext(B.dir(-0.4, -0.7, 1)); },
    first: [P('tuberculum', 'tubercule du scaphoïde', 'tuberculum ossis scaphoidei', { alt: ['tubercule de l\'os scaphoïde', 'tubercule'],
      test: (t, B) => B.d(t, B.L.tub) < 5, grow: 0 })],
    joints: [J('facies_radialis', 'surface articulaire radiale', [['radius']], { alt: ['surface articulaire pour le radius'] }),
      J('facies_lunata', 'surface articulaire pour le lunatum', [['os_lunatum']]),
      J('facies_capitata', 'surface articulaire pour le capitatum', [['os_capitatum']]),
      J('facies_trapezii', 'surface articulaire pour le trapèze et le trapézoïde', [['os_trapezium'], ['os_trapezoideum']], { alt: ['surface articulaire pour le trapèze'] })],
    faces: HAND_FACES
  });
  shortBone('os_lunatum', 'R', {
    /* interligne radio-lunaire large dans le modele (cartilage et disque articulaire absents) */
    joints: [J('facies_radialis', 'surface articulaire radiale', [['radius']], { alt: ['surface articulaire pour le radius'], d: 3, max: 9 }),
      J('facies_scaphoidea', 'surface articulaire pour le scaphoïde', [['os_scaphoideum']]),
      J('facies_triquetra', 'surface articulaire pour le triquetrum', [['os_triquetrum']]),
      J('facies_capitata', 'surface articulaire pour le capitatum et l\'hamatum', [['os_capitatum'], ['os_hamatum']], { alt: ['surface articulaire pour le capitatum'] })],
    faces: HAND_FACES
  });
  shortBone('os_triquetrum', 'R', {
    joints: [J('facies_pisiformis', 'surface articulaire pour le pisiforme', [['os_pisiforme']], { alt: ['facette pisiforme'] }),
      J('facies_lunata', 'surface articulaire pour le lunatum', [['os_lunatum']]),
      J('facies_hamata', 'surface articulaire pour l\'hamatum', [['os_hamatum']])],
    faces: HAND_FACES
  });
  shortBone('os_pisiforme', 'R', {
    joints: [J('facies_triquetra', 'surface articulaire pour le triquetrum', [['os_triquetrum']], { d: 2.8 })],
    faces: [P('corpus', 'corps du pisiforme', 'os pisiforme', { alt: ['face palmaire', 'pisiforme'], test: () => true })]
  });
  shortBone('os_trapezium', 'R', {
    landmarks(B) { B.L.tub = B.ext(B.dir(0.3, -0.3, 1)); },
    first: [P('tuberculum', 'tubercule du trapèze', 'tuberculum ossis trapezii', { alt: ['tubercule de l\'os trapèze', 'tubercule'],
      test: (t, B) => B.d(t, B.L.tub) < 5, grow: 0 })],
    joints: [J('facies_metacarpalis_I', 'surface articulaire pour le métacarpien I', [['ossa_metacarpi', 'metacarpien I']], { alt: ['surface en selle', 'surface articulaire du pouce'] }),
      J('facies_scaphoidea', 'surface articulaire pour le scaphoïde', [['os_scaphoideum']]),
      J('facies_trapezoidea', 'surface articulaire pour le trapézoïde et le métacarpien II', [['os_trapezoideum'], ['ossa_metacarpi', 'metacarpien II']], { alt: ['surface articulaire pour le trapézoïde'] })],
    faces: HAND_FACES
  });
  shortBone('os_trapezoideum', 'R', {
    joints: [J('facies_metacarpalis_II', 'surface articulaire pour le métacarpien II', [['ossa_metacarpi', 'metacarpien II']]),
      J('facies_scaphoidea', 'surface articulaire pour le scaphoïde', [['os_scaphoideum']]),
      J('facies_trapezii', 'surface articulaire pour le trapèze', [['os_trapezium']]),
      J('facies_capitata', 'surface articulaire pour le capitatum', [['os_capitatum']])],
    faces: HAND_FACES
  });
  shortBone('os_capitatum', 'R', {
    first: [P('caput', 'tête du capitatum', 'caput ossis capitati', { alt: ['tête de l\'os capitatum', 'tête'], old: ['tête du grand os'],
      test: t => t.h > 0.62, grow: 0 })],
    joints: [J('facies_metacarpalis', 'surface articulaire pour les métacarpiens', [['ossa_metacarpi', 'metacarpien II'], ['ossa_metacarpi', 'metacarpien III'], ['ossa_metacarpi', 'metacarpien IV']], { alt: ['surface articulaire pour le métacarpien III'] }),
      J('facies_hamata', 'surface articulaire pour l\'hamatum', [['os_hamatum']]),
      J('facies_trapezoidea', 'surface articulaire pour le trapézoïde', [['os_trapezoideum']])],
    faces: HAND_FACES
  });
  shortBone('os_hamatum', 'R', {
    landmarks(B) {
      B.L.hk = B.ext(B.dir(-0.2, -0.3, 1));
      B.field('hk', B.L.hk);
    },
    first: [P('hamulus', 'hamulus de l\'hamatum', 'hamulus ossis hamati', { alt: ['hamulus de l\'os hamatum', 'hamulus', 'crochet de l\'hamatum'], old: ['apophyse unciforme', 'crochet de l\'os crochu'],
      test: (t, B) => F(B, 'hk', t) < 9 && t.a > 0.5, grow: 0 })],
    joints: [J('facies_metacarpalis', 'surface articulaire pour les métacarpiens IV et V', [['ossa_metacarpi', 'metacarpien IV'], ['ossa_metacarpi', 'metacarpien V']], { alt: ['surface articulaire pour les métacarpiens'] }),
      J('facies_capitata', 'surface articulaire pour le capitatum', [['os_capitatum']]),
      J('facies_triquetra', 'surface articulaire pour le triquetrum et le lunatum', [['os_triquetrum'], ['os_lunatum']], { alt: ['surface articulaire pour le triquetrum'] })],
    faces: HAND_FACES
  });

  /* ---------------- Metacarpiens et phalange ---------------- */
  OS('ossa_metacarpi', 'R', 'metacarpien I', {
    title: 'premier métacarpien',
    landmarks(B) { longAxis(B); },
    parts: [
      P('basis', 'base du métacarpien I', 'basis ossis metacarpi I', { alt: ['base', 'base du premier métacarpien', 'base du métacarpien'],
        test: (t, B) => F(B, 's', t) > 0.8, grow: 0 }),
      P('caput', 'tête du métacarpien I', 'caput ossis metacarpi I', { alt: ['tête', 'tête du premier métacarpien', 'tête du métacarpien'],
        test: (t, B) => F(B, 's', t) < 0.22, grow: 0 }),
      P('corpus', 'corps du métacarpien I', 'corpus ossis metacarpi I', { alt: ['corps', 'corps du premier métacarpien', 'corps du métacarpien', 'diaphyse'],
        test: () => true })
    ]
  });
  OS('ossa_metacarpi', 'R', 'metacarpien III', {
    title: 'troisième métacarpien',
    landmarks(B) {
      longAxis(B);
      B.L.sty = B.ext(B.dir(-0.7, 0.5, -1), t => F(B, 's', t) > 0.75);
    },
    parts: [
      P('processus_styloideus', 'processus styloïde du métacarpien III', 'processus styloideus ossis metacarpi tertii', { alt: ['processus styloïde', 'processus styloïde du troisième métacarpien'], old: ['apophyse styloïde du troisième métacarpien'],
        test: (t, B) => B.d(t, B.L.sty) < 4.5, grow: 0 }),
      P('basis', 'base du métacarpien III', 'basis ossis metacarpi III', { alt: ['base', 'base du troisième métacarpien', 'base du métacarpien'],
        test: (t, B) => F(B, 's', t) > 0.84, grow: 0 }),
      P('caput', 'tête du métacarpien III', 'caput ossis metacarpi III', { alt: ['tête', 'tête du troisième métacarpien', 'tête du métacarpien'],
        test: (t, B) => F(B, 's', t) < 0.18, grow: 0 }),
      P('corpus', 'corps du métacarpien III', 'corpus ossis metacarpi III', { alt: ['corps', 'corps du troisième métacarpien', 'corps du métacarpien', 'diaphyse'],
        test: () => true })
    ]
  });
  OS('phalanx_proximalis_manus', 'R', 'doigt III', {
    title: 'phalange proximale du doigt III',
    landmarks(B) { longAxis(B); },
    parts: [
      P('basis', 'base de la phalange', 'basis phalangis', { alt: ['base', 'base de la phalange proximale'],
        test: (t, B) => F(B, 's', t) > 0.8, grow: 0 }),
      P('caput', 'tête de la phalange', 'caput phalangis', { alt: ['tête', 'trochlée de la phalange', 'tête de la phalange proximale'],
        test: (t, B) => F(B, 's', t) < 0.2, grow: 0 }),
      P('corpus', 'corps de la phalange', 'corpus phalangis', { alt: ['corps', 'corps de la phalange proximale', 'diaphyse'],
        test: () => true })
    ]
  });

  /* ======================================================================
     PELVIS
     ====================================================================== */

  /* ---------------- Os coxal ---------------- */
  OS('os_coxae', 'R', null, {
    landmarks(B) {
      const L = B.L;
      heightField(B);
      L.asis = B.ext(B.dir(-0.2, 0.2, 1), t => t.h > 0.6);
      L.aiis = B.ext(B.dir(0, 0, 1), t => t.h > 0.45 && t.h < 0.62);
      L.psis = B.ext(B.dir(0.2, 0.3, -1), t => t.h > 0.6);
      L.piis = B.ext(B.dir(0, -0.2, -1), t => t.h > 0.45 && t.h < 0.65 && B.d(t, L.psis) > 25);
      L.it = B.ext(B.dir(0, -1, -0.6), t => t.h < 0.3);
      L.is = B.ext(B.dir(0.5, 0, -1), t => t.h > 0.2 && t.h < 0.45);
      L.sym = B.ext(B.dir(1, 0, 0.3), t => t.h < 0.35);
      L.symLow = B.ext(B.dir(1, -1, 0.3), t => t.h < 0.3);
      L.pt = B.ext(B.dir(0.3, 0.6, 1), t => t.h < 0.4 && t.m > 0.7);
      /* acetabulum : la plus grande cupule de la face laterale (convergence des normales),
         cherchee depuis plusieurs points ; B.F.ad = profondeur au-dela du rayon moyen */
      const starts = [];
      [0.18, 0.26, 0.34, 0.42].forEach(h => [0.35, 0.5, 0.65].forEach(a =>
        starts.push(B.add(B.surf(B.at(0, h, a), t => t.nm < -0.3), B.dir(-1, 0, 0), 20))));
      L.acet = B.bestCup(starts, 42, 18, 34);
      const ad = new Float32Array(B.M.nt).fill(-99);
      for (let i = 0; i < B.M.nt; i++) { const t = B.set(i); if (B.d(t, L.acet.c) < L.acet.r * 1.25 && facesTo(t, B, L.acet.c, 0.5)) ad[i] = B.d(t, L.acet.c) - L.acet.r; }
      B.F.ad = ad;
      /* incisures ischiatiques : bord posterieur, tranche par tranche, entre les reperes */
      const hs = B.hOf(L.is), hp = B.hOf(L.piis), ht = B.hOf(L.it);
      crest(B, 'gsn', B.dir(0.3, 0, -1), hs + 0.02, hp - 0.015, { field: 'hgt', bins: 24 });
      crest(B, 'lsn', B.dir(0.3, 0, -1), ht + 0.07, hs - 0.02, { field: 'hgt', bins: 12 });
      /* detroit superieur (ligne arquee puis pecten du pubis) : de l'extremite antero-inferieure
         de la face auriculaire au tubercule pubien, crete interne la plus saillante vers le haut et
         le dedans ; partagee au niveau de l'eminence ilio-pubienne (au-dessus de l'acetabulum) */
      L.auA = B.ext(B.dir(0.2, -0.6, 1), t => t.nm > 0.4 && t.a < 0.35 && t.h > 0.55 && t.h < 0.85);
      B.axis('br', L.auA, L.pt);
      crest(B, 'brim', B.dir(0.8, 1, -0.3), 0.04, 0.93, { field: 'br', bins: 30, filter: t => F(B, 'brR', t) < 30 && t.nm > -0.3 && F(B, 'ad', t) < -90 });
      const u = B.unit(B.sub(L.pt, L.auA)), len = B.dist(L.auA, L.pt);
      L.brSplit = B.dot(B.sub(L.acet.c, L.auA), u) / len + 0.12;
      L.ipe = B.ext(B.dir(0.5, 1, 0.2), t => F(B, 'brim', t) < 4 && Math.abs(F(B, 'br', t) - L.brSplit) < 0.04);
    },
    parts: [
      P('fossa_acetabuli', 'fosse acétabulaire', 'fossa acetabuli', { alt: ['fosse de l\'acétabulum'], old: ['arrière-fond du cotyle'],
        test: (t, B) => F(B, 'ad', t) > 2.5, grow: 0 }),
      P('facies_lunata', 'surface semi-lunaire', 'facies lunata', { alt: ['face semi-lunaire', 'surface articulaire de l\'acétabulum', 'acétabulum'], old: ['croissant articulaire du cotyle'],
        test: (t, B) => F(B, 'ad', t) > -90, grow: 0 }),
      P('spina_iliaca_anterior_superior', 'épine iliaque antéro-supérieure', 'spina iliaca anterior superior', { alt: ['eias'],
        test: (t, B) => B.d(t, B.L.asis) < 12, grow: 0 }),
      P('spina_iliaca_anterior_inferior', 'épine iliaque antéro-inférieure', 'spina iliaca anterior inferior', { alt: ['eiai'],
        test: (t, B) => B.d(t, B.L.aiis) < 10, grow: 0 }),
      P('spina_iliaca_posterior_superior', 'épine iliaque postéro-supérieure', 'spina iliaca posterior superior', { alt: ['eips'],
        test: (t, B) => B.d(t, B.L.psis) < 12, grow: 0 }),
      P('spina_iliaca_posterior_inferior', 'épine iliaque postéro-inférieure', 'spina iliaca posterior inferior', { alt: ['eipi'],
        test: (t, B) => B.d(t, B.L.piis) < 9, grow: 0 }),
      P('tuber_ischiadicum', 'tubérosité ischiatique', 'tuber ischiadicum', { old: ['tubérosité sciatique', 'tubérosité de l\'ischion'],
        test: (t, B) => B.d(t, B.L.it) < 22, grow: 0 }),
      P('spina_ischiadica', 'épine ischiatique', 'spina ischiadica', { old: ['épine sciatique'],
        test: (t, B) => B.d(t, B.L.is) < 8, grow: 0 }),
      P('incisura_ischiadica_major', 'grande incisure ischiatique', 'incisura ischiadica major', { old: ['grande échancrure sciatique'],
        test: (t, B) => F(B, 'gsn', t) < 6, grow: 0 }),
      P('incisura_ischiadica_minor', 'petite incisure ischiatique', 'incisura ischiadica minor', { old: ['petite échancrure sciatique'],
        test: (t, B) => F(B, 'lsn', t) < 5, grow: 0 }),
      P('facies_symphysialis', 'face symphysaire', 'facies symphysialis', { alt: ['surface symphysaire'],
        test: (t, B) => B.d(t, B.L.sym) < 18 && t.nm > 0.5, grow: 0 }),
      P('tuberculum_pubicum', 'tubercule pubien', 'tuberculum pubicum', { old: ['épine du pubis'],
        test: (t, B) => B.d(t, B.L.pt) < 7, grow: 0 }),
      P('eminentia_iliopubica', 'éminence ilio-pubienne', 'eminentia iliopubica', { old: ['éminence ilio-pectinée'],
        test: (t, B) => B.d(t, B.L.ipe) < 8, grow: 0 }),
      P('linea_arcuata', 'ligne arquée', 'linea arcuata', { alt: ['ligne arquée de l\'ilium'], old: ['ligne innominée'],
        test: (t, B) => F(B, 'brim', t) < 4 && F(B, 'br', t) < B.L.brSplit, grow: 0 }),
      P('pecten_ossis_pubis', 'pecten du pubis', 'pecten ossis pubis', { alt: ['ligne pectinéale'], old: ['crête pectinéale'],
        test: (t, B) => F(B, 'brim', t) < 4, grow: 0 }),
      P('crista_iliaca', 'crête iliaque', 'crista iliaca',
        { test: t => t.ny > 0.45 && t.h > 0.72, grow: 0 }),
      P('facies_auricularis', 'face auriculaire', 'facies auricularis', { alt: ['surface auriculaire', 'face auriculaire de l\'ilium'],
        test: t => t.nm > 0.4 && t.a < 0.35 && t.h > 0.55 && t.h < 0.85, grow: 0 }),
      P('tuberositas_iliaca', 'tubérosité iliaque', 'tuberositas iliaca', { old: ['tubérosité iliaque postérieure'],
        test: t => t.nm > -0.2 && t.a < 0.3 && t.h > 0.7, grow: 0 }),
      P('fossa_iliaca', 'fosse iliaque', 'fossa iliaca', { old: ['fosse iliaque interne'],
        test: t => t.nm > 0.2 && t.h > 0.72 }),
      P('facies_glutea', 'face glutéale', 'facies glutea', { alt: ['face glutea', 'face fessière'], old: ['fosse iliaque externe'],
        test: t => t.nm < -0.2 && t.h > 0.55, grow: 0 }),
      /* corps et branches : croissance depuis des graines (le detroit superieur fait barriere) ;
         le corps de l'ilium a une graine au-dessus de l'acetabulum et une sous la ligne arquee */
      P('corpus_ossis_ilii', 'corps de l\'ilium', 'corpus ossis ilii', { alt: ['corps de l\'os iliaque'],
        seed: B => [B.surf(B.add(B.L.acet.c, [0, 1, 0], B.L.acet.r * 1.45)),
          B.surf(B.add(B.mix(B.L.auA, B.L.acet.c, 0.45), B.dir(1, 0, 0), 25), t => t.nm > 0.3)] }),
      P('corpus_ossis_ischii', 'corps de l\'ischium', 'corpus ossis ischii', { alt: ['corps de l\'ischion'],
        seed: B => B.surf(B.mix(B.L.acet.c, B.L.it, 0.5)) }),
      P('corpus_ossis_pubis', 'corps du pubis', 'corpus ossis pubis',
        { seed: B => B.surf(B.add(B.L.sym, B.dir(-1, 0, 0), 12)) }),
      P('ramus_superior_ossis_pubis', 'branche supérieure du pubis', 'ramus superior ossis pubis', { alt: ['branche supérieure'], old: ['branche horizontale du pubis'],
        seed: B => B.surf(B.mix(B.L.acet.c, B.L.pt, 0.55)) }),
      P('ramus_ischiopubicus', 'branche ischio-pubienne', 'ramus ischiopubicus', { alt: ['branche inférieure du pubis', 'branche de l\'ischium'],
        seed: B => B.surf(B.mix(B.L.symLow, B.L.it, 0.5)) })
    ]
  });

  /* ---------------- Sacrum ---------------- */
  /* repere propre du sacrum (incline dans le bassin) : B.L.fw = avant de l'os (normale de la
     face pelvienne), B.L.up = vers la base ; B.F.su = 0 a l'apex -> 1 a la base, B.F.sw = position
     d'avant en arriere (mm, positif en avant du plan moyen) */
  function sacralFrame(B) {
    const L = B.L, pl = B.plane();
    let n = [0, pl.n[1], pl.n[2]];
    if (n[2] < 0) n = n.map(v => -v);
    n = B.unit(n);
    let up = [0, n[2], -n[1]];
    if (up[1] < 0) up = up.map(v => -v);
    L.fw = n; L.up = up;
    L.base = B.ext(up, t => t.lat < 0.2);
    L.apex = B.ext(up.map(v => -v), t => t.lat < 0.3);
    B.axis('su', L.apex, L.base);
    const f = new Float32Array(B.M.nt);
    for (let i = 0; i < B.M.nt; i++) { const t = B.set(i); f[i] = B.proj(t, n, pl.c); }
    B.F.sw = f;
  }
  OS('sacrum', null, null, {
    landmarks(B) {
      const L = B.L;
      sacralFrame(B);
      const su = t => F(B, 'su', t), fw = L.fw, up = L.up;
      /* promontoire : bord anterieur de la base ; processus articulaires superieurs : saillies
         posterieures de la base, de chaque cote */
      L.prom = B.ext(B.add(up, fw, 1.2), t => t.lat < 0.2);
      const back = fw.map(v => -v), upBack = B.unit(B.add(up, back, 0.6));
      L.pasR = B.ext(upBack, t => !leftSide(t, B) && t.lat > 0.15 && t.lat < 0.6 && su(t) > 0.7);
      L.pasL = B.ext(upBack, t => leftSide(t, B) && t.lat > 0.15 && t.lat < 0.6 && su(t) > 0.7);
      /* cornes sacrales : de part et d'autre du hiatus, saillies dirigees en bas et en arriere */
      const downBack = B.unit(B.add(back, up, -1.6));
      L.corR = B.ext(downBack, t => !leftSide(t, B) && t.lat > 0.08 && t.lat < 0.3 && su(t) < 0.35 && F(B, 'sw', t) < 0);
      L.corL = B.ext(downBack, t => leftSide(t, B) && t.lat > 0.08 && t.lat < 0.3 && su(t) < 0.35 && F(B, 'sw', t) < 0);
      /* crete sacrale mediane : ligne mediane posterieure la plus saillante */
      crest(B, 'cm', back, 0.3, 0.85, { field: 'su', bins: 24, filter: t => t.lat < 0.12 });
    },
    parts: [
      P('promontorium', 'promontoire', 'promontorium', { alt: ['promontoire sacral'],
        test: (t, B) => B.d(t, B.L.prom) < 9, grow: 0 }),
      P('basis', 'base du sacrum', 'basis ossis sacri', { alt: ['base', 'face supérieure de s1'],
        test: (t, B) => B.ndot(t, B.L.up) > 0.55 && t.lat < 0.3 && F(B, 'su', t) > 0.8 && F(B, 'sw', t) > -5, grow: 0 }),
      P('processus_articularis_superior', 'processus articulaire supérieur', 'processus articularis superior', { alt: ['processus articulaires supérieurs'], old: ['apophyse articulaire supérieure'],
        test: (t, B) => B.d(t, B.L.pasR) < 11 || B.d(t, B.L.pasL) < 11, grow: 0 }),
      P('cornu_sacrale', 'corne sacrale', 'cornu sacrale', { alt: ['cornes sacrales'], old: ['corne du sacrum'],
        test: (t, B) => B.d(t, B.L.corR) < 6 || B.d(t, B.L.corL) < 6, grow: 0 }),
      P('apex', 'apex du sacrum', 'apex ossis sacri', { alt: ['apex', 'sommet du sacrum'],
        test: (t, B) => F(B, 'su', t) < 0.07, grow: 0 }),
      P('crista_sacralis_mediana', 'crête sacrale médiane', 'crista sacralis mediana', { alt: ['crête sacrale'], old: ['crête sacrée'],
        test: (t, B) => F(B, 'cm', t) < 5, grow: 0 }),
      P('hiatus_sacralis', 'hiatus sacral', 'hiatus sacralis', { old: ['hiatus sacré'],
        test: (t, B) => t.lat < 0.14 && F(B, 'su', t) < 0.3 && B.ndot(t, B.L.fw) < 0.2 && F(B, 'sw', t) < 0, grow: 0 }),
      P('facies_auricularis', 'face auriculaire', 'facies auricularis', { alt: ['surface auriculaire'],
        test: (t, B) => t.lat > 0.7 && t.nm < -0.45 && F(B, 'su', t) > 0.45, grow: 0 }),
      P('ala', 'aile du sacrum', 'ala ossis sacri', { alt: ['aile', 'ailes du sacrum'], old: ['aileron sacré', 'aileron'],
        test: (t, B) => t.lat > 0.3 && B.ndot(t, B.L.up) > 0.35 && F(B, 'su', t) > 0.6 }),
      P('tuberositas_ossis_sacri', 'tubérosité sacrale', 'tuberositas ossis sacri', { alt: ['tubérosité du sacrum'],
        test: (t, B) => t.lat > 0.55 && B.ndot(t, B.L.fw) < -0.3 && F(B, 'su', t) > 0.5, grow: 0 }),
      P('facies_pelvica', 'face pelvienne', 'facies pelvica', { alt: ['face antérieure'],
        test: (t, B) => B.ndot(t, B.L.fw) > 0.3 }),
      P('facies_dorsalis', 'face dorsale', 'facies dorsalis', { alt: ['face postérieure'],
        test: (t, B) => B.ndot(t, B.L.fw) < -0.3 })
    ]
  });

  /* ---------------- Coccyx (separe du sacrum) ---------------- */
  OS('coccyx', null, null, {
    landmarks(B) {
      B.L.coR = B.ext(B.dxyz(-0.3, 0.7, -1), t => !leftSide(t, B) && t.h > 0.55 && t.lat > 0.12);
      B.L.coL = B.ext(B.dxyz(0.3, 0.7, -1), t => leftSide(t, B) && t.h > 0.55 && t.lat > 0.12);
    },
    parts: [
      P('cornu_coccygeum', 'corne du coccyx', 'cornu coccygeum', { alt: ['cornes du coccyx', 'corne coccygienne'],
        test: (t, B) => B.d(t, B.L.coR) < 4.5 || B.d(t, B.L.coL) < 4.5, grow: 0 }),
      P('basis', 'base du coccyx', 'basis ossis coccygis', { alt: ['base'],
        test: t => t.h > 0.78 && t.ny > 0.35, grow: 0 }),
      P('apex', 'apex du coccyx', 'apex ossis coccygis', { alt: ['apex', 'pointe du coccyx', 'sommet du coccyx'],
        test: t => t.h < 0.14, grow: 0 }),
      P('facies_pelvica', 'face pelvienne', 'facies pelvica ossis coccygis', { alt: ['face antérieure'],
        test: t => t.nz > 0.1 }),
      P('facies_dorsalis', 'face dorsale', 'facies dorsalis ossis coccygis', { alt: ['face postérieure'],
        test: () => true })
    ]
  });

  /* ======================================================================
     MEMBRE INFERIEUR
     ====================================================================== */

  /* ---------------- Femur ---------------- */
  OS('femur', 'R', null, {
    landmarks(B) {
      const L = B.L;
      /* tete : sphere ajustee sur la partie proximale mediale */
      L.head = B.sphere(B.ext(B.dir(1, 0.6, 0), t => t.h > 0.75), 34);
      /* grand trochanter (sommet lateral), petit trochanter (saillie postero-mediale) */
      L.gt = B.ext(B.dir(-1, 1, 0), t => t.h > 0.75);
      L.lt = B.ext(B.dir(0.7, -0.15, -1), t => t.h > 0.7 && t.h < 0.88 && t.m > 0.4);
      /* extremite distale */
      L.dist = B.centroid(t => t.h < 0.1);
      L.me = B.ext(B.dir(1, 0, 0), t => t.h < 0.16);
      L.le = B.ext(B.dir(-1, 0, 0), t => t.h < 0.16);
      L.at = B.ext(B.dir(1, 0.35, 0), t => t.h > 0.1 && t.h < 0.2);
      /* ligne (en avant) et crete (en arriere) intertrochanteriques : du grand au petit trochanter */
      const hl = B.hOf(L.lt);
      L.gtA = B.ext(B.dir(-0.5, -0.3, 1), t => t.h > hl + 0.04 && t.h < hl + 0.1 && t.m < 0.45);
      L.ltA = B.ext(B.dir(0.8, 0, 1), t => Math.abs(t.h - hl) < 0.015);
      L.gtP = B.ext(B.dir(-0.4, 0.2, -1), t => t.h > hl + 0.07 && t.m < 0.4);
      /* tuberosite gluteale : face posterieure, sous le grand trochanter */
      L.tg = B.ext(B.dir(-0.6, 0, -1), t => t.h > hl - 0.08 && t.h < hl - 0.02);
    },
    parts: [
      P('fovea', 'fovea de la tête du fémur', 'fovea capitis femoris', { alt: ['fovea capitis', 'fovea'], old: ['fossette du ligament rond'],
        test: (t, B) => { const h = B.L.head; return B.d(t, B.add(h.c, B.dir(1, -0.15, -0.25), h.r)) < h.r * 0.3; } }),
      P('caput', 'tête du fémur', 'caput femoris', { alt: ['tête', 'tête fémorale'],
        test: (t, B) => B.d(t, B.L.head.c) < B.L.head.r * 1.07 }),
      P('trochanter_major', 'grand trochanter', 'trochanter major',
        { test: (t, B) => B.d(t, B.L.gt) < 34 && t.m < B.mOf(B.L.gt) + 0.25 }),
      P('trochanter_minor', 'petit trochanter', 'trochanter minor',
        { test: (t, B) => B.d(t, B.L.lt) < 13 }),
      P('crista_intertrochanterica', 'crête intertrochantérique', 'crista intertrochanterica', { old: ['ligne intertrochantérique postérieure'],
        test: (t, B) => segDist(t, B.L.gtP, B.L.lt) < 6 && t.nz < -0.2, grow: 0 }),
      P('linea_intertrochanterica', 'ligne intertrochantérique', 'linea intertrochanterica', { old: ['ligne intertrochantérique antérieure'],
        test: (t, B) => segDist(t, B.L.gtA, B.L.ltA) < 5 && t.nz > 0.2, grow: 0 }),
      P('collum', 'col du fémur', 'collum femoris', { alt: ['col', 'col fémoral'],
        test: (t, B) => t.h > B.hOf(B.L.lt) + 0.03 && t.m > 0.35 }),
      P('tuberositas_glutea', 'tubérosité glutéale', 'tuberositas glutea', { alt: ['tubérosité glutea'], old: ['tubérosité fessière', 'crête du grand fessier'],
        test: (t, B) => B.d(t, B.L.tg) < 14 && t.nz < 0, grow: 0 }),
      P('epicondylus_medialis', 'épicondyle médial', 'epicondylus medialis', { old: ['épicondyle interne'],
        test: (t, B) => B.d(t, B.L.me) < 15 }),
      P('epicondylus_lateralis', 'épicondyle latéral', 'epicondylus lateralis', { old: ['épicondyle externe'],
        test: (t, B) => B.d(t, B.L.le) < 14 }),
      P('tuberculum_adductorium', 'tubercule de l\'adducteur', 'tuberculum adductorium', { alt: ['tubercule adducteur'], old: ['tubercule du grand adducteur', 'tubercule du troisième adducteur'],
        test: (t, B) => B.d(t, B.L.at) < 8 }),
      P('facies_patellaris', 'face patellaire', 'facies patellaris', { alt: ['surface patellaire'], old: ['trochlée fémorale'],
        test: (t, B) => t.h < 0.12 && t.h > 0.03 && t.nz > 0.45 && Math.abs(t.x - B.L.dist[0]) < 18 }),
      P('fossa_intercondylaris', 'fosse intercondylaire', 'fossa intercondylaris', { old: ['échancrure intercondylienne'],
        test: (t, B) => t.h < 0.09 && t.z < B.L.dist[2] && Math.abs(t.x - B.L.dist[0]) < 10 }),
      P('facies_poplitea', 'surface poplitée', 'facies poplitea', { alt: ['face poplitée'], old: ['triangle poplité'],
        test: (t, B) => t.h > 0.11 && t.h < 0.24 && t.nz < -0.6 && Math.abs(t.x - B.L.dist[0]) < 18, grow: 0 }),
      P('condylus_medialis', 'condyle médial', 'condylus medialis', { old: ['condyle interne'],
        test: (t, B) => t.h < 0.13 && isMed(t, B, B.L.dist) }),
      P('condylus_lateralis', 'condyle latéral', 'condylus lateralis', { old: ['condyle externe'],
        test: t => t.h < 0.13 }),
      P('linea_aspera', 'ligne âpre', 'linea aspera',
        { test: t => t.h > 0.3 && t.h < 0.68 && t.nz < -0.8 }),
      P('corpus', 'corps du fémur', 'corpus femoris', { alt: ['corps', 'diaphyse', 'diaphyse fémorale'],
        test: t => t.h > 0.18 && t.h < 0.7 })
    ]
  });

  /* ---------------- Patella ---------------- */
  OS('patella', 'R', null, {
    parts: [
      P('apex', 'apex de la patella', 'apex patellae', { alt: ['apex', 'pointe de la patella'], old: ['pointe de la rotule'],
        test: t => t.h < 0.12 }),
      P('basis', 'base de la patella', 'basis patellae', { alt: ['base'], old: ['base de la rotule'],
        test: t => t.h > 0.82 && t.ny > 0.3 }),
      P('facies_articularis', 'face articulaire', 'facies articularis patellae', { alt: ['face articulaire de la patella', 'face postérieure'],
        test: t => t.nz < -0.3 }),
      P('facies_anterior', 'face antérieure', 'facies anterior patellae', { alt: ['face antérieure de la patella'],
        test: () => true })
    ]
  });

  /* ---------------- Tibia ---------------- */
  OS('tibia', 'R', null, {
    landmarks(B) {
      const L = B.L;
      longAxis(B);
      L.top = B.centroid(t => t.h > 0.95);
      L.tt = B.ext(B.dir(0, 0, 1), t => t.h > 0.78 && t.h < 0.92);
      L.dist = B.centroid(t => t.h < 0.05);
      L.mm = B.ext(B.dir(1, -1, 0), t => t.h < 0.1);
      /* trois bords de la diaphyse (lignes de crete) et graines des trois faces */
      crest(B, 'ma', B.dir(0, 0, 1), 0.22, 0.8);
      crest(B, 'mm', B.dir(1, 0, -0.7), 0.2, 0.82);
      crest(B, 'mi', B.dir(-1, 0, -0.4), 0.2, 0.82);
      L.fMed = faceSeed(B, 'ma', 'mm', 0.5, B.dir(1, 0, 0.6));
      L.fLat = faceSeed(B, 'ma', 'mi', 0.5, B.dir(-1, 0, 0.6));
      L.fPost = faceSeed(B, 'mm', 'mi', 0.5, B.dir(0, 0, -1));
    },
    parts: [
      P('eminentia_intercondylaris', 'éminence intercondylaire', 'eminentia intercondylaris', { old: ['épines tibiales', 'massif des épines'],
        test: (t, B) => Math.abs(t.x - B.L.top[0]) < 9 && t.h > 0.965 && t.ny > 0.3, grow: 0 }),
      P('area_intercondylaris_anterior', 'aire intercondylaire antérieure', 'area intercondylaris anterior', { old: ['surface préspinale'],
        test: (t, B) => Math.abs(t.x - B.L.top[0]) < 13 && t.h > 0.94 && t.ny > 0.45 && t.z > B.L.top[2] + 6, grow: 0 }),
      P('area_intercondylaris_posterior', 'aire intercondylaire postérieure', 'area intercondylaris posterior', { old: ['surface rétrospinale'],
        test: (t, B) => Math.abs(t.x - B.L.top[0]) < 12 && t.h > 0.94 && t.ny > 0.45 && t.z < B.L.top[2] - 6, grow: 0 }),
      P('facies_articularis_superior', 'surface articulaire supérieure', 'facies articularis superior', { alt: ['face articulaire supérieure', 'plateau tibial'], old: ['cavités glénoïdes du tibia'],
        test: t => t.h > 0.93 && t.ny > 0.6, grow: 0 }),
      P('tuberositas_tibiae', 'tubérosité tibiale', 'tuberositas tibiae', { alt: ['tubérosité du tibia'], old: ['tubérosité antérieure du tibia', 'tubercule tibial antérieur'],
        test: (t, B) => B.d(t, B.L.tt) < 15, grow: 0 }),
      P('facies_articularis_fibularis', 'surface articulaire fibulaire', 'facies articularis fibularis', { alt: ['face articulaire fibulaire'],
        test: t => t.nm < -0.4 && t.nz < -0.2 && t.h > 0.86 && t.h < 0.94, grow: 0 }),
      P('condylus_medialis', 'condyle médial', 'condylus medialis', { alt: ['condyle médial du tibia'], old: ['plateau tibial interne', 'condyle interne'],
        test: (t, B) => t.h > 0.88 && isMed(t, B, B.L.top), grow: 0 }),
      P('condylus_lateralis', 'condyle latéral', 'condylus lateralis', { alt: ['condyle latéral du tibia'], old: ['plateau tibial externe', 'condyle externe'],
        test: t => t.h > 0.88, grow: 0 }),
      P('facies_articularis_malleoli_medialis', 'surface articulaire malléolaire', 'facies articularis malleoli medialis', { alt: ['face articulaire de la malléole médiale', 'surface articulaire de la malléole'],
        test: (t, B) => B.d(t, B.L.mm) < 20 && t.nm < -0.5 && t.h < 0.1, grow: 0 }),
      P('malleolus_medialis', 'malléole médiale', 'malleolus medialis', { old: ['malléole interne'],
        test: (t, B) => B.d(t, B.L.mm) < 16 && medOff(t, B, B.L.dist) > 5, grow: 0 }),
      P('incisura_fibularis', 'incisure fibulaire', 'incisura fibularis', { old: ['échancrure péronière'],
        test: t => t.nm < -0.5 && t.h < 0.08, grow: 0 }),
      P('facies_articularis_inferior', 'surface articulaire inférieure', 'facies articularis inferior', { alt: ['face articulaire inférieure'], old: ['pilon tibial'],
        test: t => t.ny < -0.55 && t.h < 0.04, grow: 0 }),
      P('margo_anterior', 'bord antérieur', 'margo anterior', { alt: ['bord antérieur du tibia'], old: ['crête tibiale'],
        test: (t, B) => F(B, 'ma', t) < 3.5, grow: 0 }),
      P('margo_medialis', 'bord médial', 'margo medialis', { alt: ['bord médial du tibia'], old: ['bord interne'],
        test: (t, B) => F(B, 'mm', t) < 3.5, grow: 0 }),
      P('margo_interosseus', 'bord interosseux', 'margo interosseus', { alt: ['bord interosseux du tibia', 'bord latéral'], old: ['bord externe'],
        test: (t, B) => F(B, 'mi', t) < 3.5, grow: 0 }),
      /* faces de la diaphyse : croissance depuis une graine, les bords faisant barriere */
      P('facies_medialis', 'face médiale', 'facies medialis', { alt: ['face médiale du tibia'], old: ['face interne'],
        seed: B => B.L.fMed }),
      P('facies_lateralis', 'face latérale', 'facies lateralis', { alt: ['face latérale du tibia'], old: ['face externe'],
        seed: B => B.L.fLat }),
      P('facies_posterior', 'face postérieure', 'facies posterior', { alt: ['face postérieure du tibia'],
        seed: B => B.L.fPost })
    ]
  });

  /* ---------------- Fibula ---------------- */
  OS('fibula', 'R', null, {
    landmarks(B) {
      longAxis(B);
      B.L.apex = B.ext(B.dir(0, 1, -0.3));
      crest(B, 'mi', B.dir(1, 0, 0.3), 0.2, 0.75);
    },
    parts: [
      P('apex_capitis', 'apex de la tête de la fibula', 'apex capitis fibulae', { alt: ['apex de la tête'], old: ['apophyse styloïde du péroné'],
        test: (t, B) => B.d(t, B.L.apex) < 6, grow: 0 }),
      P('facies_articularis_capitis', 'surface articulaire de la tête', 'facies articularis capitis fibulae', { alt: ['face articulaire de la tête de la fibula'],
        test: t => t.h > 0.93 && t.nm > 0.35 && t.ny > 0.25, grow: 0 }),
      P('caput', 'tête de la fibula', 'caput fibulae', { alt: ['tête'], old: ['tête du péroné'],
        test: t => t.h > 0.93, grow: 0 }),
      P('collum', 'col de la fibula', 'collum fibulae', { alt: ['col'], old: ['col du péroné'],
        test: t => t.h > 0.87, grow: 0 }),
      P('facies_articularis_malleoli', 'surface articulaire malléolaire', 'facies articularis malleoli lateralis', { alt: ['face articulaire de la malléole latérale'],
        test: t => t.h < 0.1 && t.nm > 0.55 && t.nz > -0.3, grow: 0 }),
      P('fossa_malleoli', 'fosse de la malléole latérale', 'fossa malleoli lateralis', { alt: ['fosse malléolaire'], old: ['fossette malléolaire'],
        test: t => t.nm > 0.3 && t.nz < -0.3 && t.h < 0.09, grow: 0 }),
      P('malleolus_lateralis', 'malléole latérale', 'malleolus lateralis', { old: ['malléole externe', 'malléole péronière'],
        test: t => t.h < 0.12, grow: 0 }),
      P('margo_interosseus', 'bord interosseux', 'margo interosseus fibulae', { alt: ['bord interosseux de la fibula'], old: ['crête interosseuse'],
        test: (t, B) => F(B, 'mi', t) < 3, grow: 0 }),
      P('corpus', 'corps de la fibula', 'corpus fibulae', { alt: ['corps', 'diaphyse'], old: ['corps du péroné'],
        test: () => true })
    ]
  });

  /* ---------------- Talus ---------------- */
  OS('talus', 'R', null, {
    landmarks(B) {
      B.L.pl = B.ext(B.dir(-1, -0.6, 0), t => t.a > 0.25 && t.a < 0.7);
      B.L.pp = B.ext(B.dir(0, 0, -1));
    },
    parts: [
      P('processus_lateralis', 'processus latéral du talus', 'processus lateralis tali', { alt: ['processus latéral'],
        test: (t, B) => B.d(t, B.L.pl) < 9, grow: 0 }),
      P('processus_posterior', 'processus postérieur du talus', 'processus posterior tali', { alt: ['processus postérieur'], old: ['tubercule postérieur de l\'astragale'],
        test: (t, B) => B.d(t, B.L.pp) < 9, grow: 0 }),
      P('facies_articularis_navicularis', 'surface articulaire naviculaire', 'facies articularis navicularis', { alt: ['face articulaire naviculaire'],
        test: t => t.a > 0.82 && t.nz > 0.4, grow: 0 }),
      P('caput', 'tête du talus', 'caput tali', { alt: ['tête'], old: ['tête de l\'astragale'],
        test: t => t.a > 0.78, grow: 0 }),
      P('trochlea', 'trochlée du talus', 'trochlea tali', { alt: ['trochlée', 'face supérieure de la trochlée'], old: ['poulie astragalienne'],
        test: t => t.ny > 0.55 && t.a < 0.7, grow: 0 }),
      P('facies_malleolaris_medialis', 'face malléolaire médiale', 'facies malleolaris medialis',
        { test: t => t.nm > 0.6 && t.h > 0.4 && t.a < 0.7, grow: 0 }),
      P('facies_malleolaris_lateralis', 'face malléolaire latérale', 'facies malleolaris lateralis',
        { test: t => t.nm < -0.6 && t.h > 0.3 && t.a < 0.7, grow: 0 }),
      P('facies_articularis_calcanea_posterior', 'surface articulaire calcanéenne postérieure', 'facies articularis calcanea posterior', { alt: ['face articulaire calcanéenne postérieure'],
        test: t => t.ny < -0.45 && t.a < 0.5, grow: 0 }),
      P('sulcus_tali', 'sillon du talus', 'sulcus tali', { old: ['sillon astragalien'],
        test: t => t.ny < -0.3 && t.a >= 0.5 && t.a < 0.62, grow: 0 }),
      P('collum', 'col du talus', 'collum tali', { alt: ['col'], old: ['col de l\'astragale'],
        test: t => t.a > 0.6 }),
      P('corpus', 'corps du talus', 'corpus tali', { alt: ['corps'],
        test: () => true })
    ]
  });

  /* ---------------- Calcaneus ---------------- */
  OS('calcaneus', 'R', null, {
    landmarks(B) {
      B.L.sus = B.ext(B.dir(1, 0.4, 0.2), t => t.a > 0.35 && t.a < 0.75 && t.h > 0.4);
      B.L.tf = B.ext(B.dir(-1, 0, 0), t => t.a > 0.4 && t.a < 0.75 && t.h > 0.2 && t.h < 0.7);
    },
    parts: [
      P('tuber_calcanei', 'tubérosité du calcanéus', 'tuber calcanei', { alt: ['tubérosité calcanéenne'], old: ['tubérosité postérieure du calcanéum'],
        test: t => t.a < 0.22, grow: 0 }),
      P('facies_articularis_talaris_media', 'face articulaire talaire moyenne', 'facies articularis talaris media', { alt: ['surface articulaire talaire moyenne'],
        test: (t, B) => B.d(t, B.L.sus) < 15 && t.ny > 0.5, grow: 0 }),
      P('sustentaculum_tali', 'sustentaculum du talus', 'sustentaculum tali', { alt: ['sustentaculum tali'], old: ['petite apophyse du calcanéum'],
        test: (t, B) => B.d(t, B.L.sus) < 13, grow: 0 }),
      P('trochlea_fibularis', 'trochlée fibulaire', 'trochlea fibularis', { old: ['tubercule des péroniers', 'trochlée péronière'],
        test: (t, B) => B.d(t, B.L.tf) < 7, grow: 0 }),
      P('facies_articularis_cuboidea', 'face articulaire cuboïdienne', 'facies articularis cuboidea', { alt: ['surface articulaire cuboïdienne'],
        test: t => t.nz > 0.55 && t.a > 0.85, grow: 0 }),
      P('facies_articularis_talaris_posterior', 'face articulaire talaire postérieure', 'facies articularis talaris posterior', { alt: ['surface articulaire talaire postérieure', 'thalamus'],
        test: t => t.ny > 0.5 && t.a > 0.35 && t.a < 0.65, grow: 0 }),
      P('facies_articularis_talaris_anterior', 'face articulaire talaire antérieure', 'facies articularis talaris anterior', { alt: ['surface articulaire talaire antérieure'],
        test: t => t.ny > 0.45 && t.a > 0.74 && t.m > 0.45, grow: 0 }),
      P('sulcus_calcanei', 'sillon du calcanéus', 'sulcus calcanei', { old: ['sillon calcanéen'],
        test: t => t.ny > 0.2 && t.a >= 0.62 && t.a < 0.74, grow: 0 }),
      P('corpus', 'corps du calcanéus', 'corpus calcanei', { alt: ['corps'],
        test: () => true })
    ]
  });

  /* ---------------- Tarse anterieur, metatarsiens ---------------- */
  /* pied droit : orteils en avant (+z), plante en bas, medial = vers l'axe du corps */
  shortBone('os_naviculare', 'R', {
    landmarks(B) { B.L.tub = B.ext(B.dir(1, -0.5, 0)); },
    first: [P('tuberositas', 'tubérosité de l\'os naviculaire', 'tuberositas ossis navicularis', { alt: ['tubérosité du naviculaire', 'tubérosité'], old: ['tubercule du scaphoïde tarsien'],
      test: (t, B) => B.d(t, B.L.tub) < 7, grow: 0 })],
    joints: [J('facies_talaris', 'surface articulaire pour le talus', [['talus']], { alt: ['surface articulaire talaire'] }),
      J('facies_cuneiformes', 'surfaces articulaires pour les cunéiformes', [['os_cuneiforme_mediale'], ['os_cuneiforme_intermedium'], ['os_cuneiforme_laterale']], { alt: ['surface articulaire pour les cunéiformes'] }),
      J('facies_cuboidea', 'surface articulaire pour le cuboïde', [['os_cuboideum']])],
    faces: FOOT_FACES
  });
  shortBone('os_cuboideum', 'R', {
    landmarks(B) {
      B.L.tub = B.ext(B.dir(-0.6, -1, -0.2));
      /* sillon du tendon du long fibulaire : face plantaire, en avant de la tuberosite */
      B.L.sul = B.surf(B.add(B.L.tub, B.dir(0.4, 0, 1), 9), t => t.ny < -0.3);
      /* surface pour le cuneiforme lateral : zone compacte de la face mediale, centree sur le
         contact (le cuneiforme lateral du modele deborde sur la face dorsale) */
      B.L.cun = B.centroid(t => F(B, 'j2', t) < 1.5 && t.nm > 0.35);
    },
    first: [P('tuberositas', 'tubérosité de l\'os cuboïde', 'tuberositas ossis cuboidei', { alt: ['tubérosité du cuboïde', 'tubérosité'],
      test: (t, B) => B.d(t, B.L.tub) < 6, grow: 0 }),
      P('sulcus_fibularis', 'sillon du tendon du muscle long fibulaire', 'sulcus tendinis musculi fibularis longi', { alt: ['sillon du long fibulaire', 'sillon du cuboïde'], old: ['gouttière du long péronier', 'sillon du long péronier'],
        test: (t, B) => B.d(t, B.L.sul) < 5.5 && t.ny < 0, grow: 0 })],
    joints: [J('facies_calcanea', 'surface articulaire pour le calcanéus', [['calcaneus']], { alt: ['surface articulaire calcanéenne'] }),
      J('facies_metatarsalis', 'surface articulaire pour les métatarsiens IV et V', [['ossa_metatarsi', 'metatarsien IV'], ['ossa_metatarsi', 'metatarsien V']], { alt: ['surface articulaire pour les métatarsiens'] }),
      J('facies_cuneiformis', 'surface articulaire pour le cunéiforme latéral et le naviculaire', [['os_cuneiforme_laterale'], ['os_naviculare']], { alt: ['surface articulaire pour le cunéiforme latéral'],
        test: (t, B) => t.nm > 0.2 && B.d(t, B.L.cun) < 7 })],
    faces: FOOT_FACES
  });
  shortBone('os_cuneiforme_mediale', 'R', {
    joints: [J('facies_navicularis', 'surface articulaire pour le naviculaire', [['os_naviculare']]),
      J('facies_metatarsalis_I', 'surface articulaire pour le métatarsien I', [['ossa_metatarsi', 'metatarsien I']]),
      J('facies_lateralis', 'surface articulaire pour le cunéiforme intermédiaire et le métatarsien II', [['os_cuneiforme_intermedium'], ['ossa_metatarsi', 'metatarsien II']], { alt: ['surface articulaire pour le cunéiforme intermédiaire'] })],
    faces: [P('facies_medialis', 'face médiale', 'facies medialis', { test: t => t.nm > 0.5 }),
      P('facies_plantaris', 'face plantaire', 'facies plantaris', { alt: ['face inférieure', 'bord plantaire'], test: t => t.ny < -0.3 }),
      P('facies_dorsalis', 'face dorsale', 'facies dorsalis', { alt: ['face supérieure'], test: () => true })]
  });
  OS('ossa_metatarsi', 'R', 'metatarsien I', {
    title: 'premier métatarsien',
    landmarks(B) {
      footAxis(B);
      B.L.tub = B.ext(B.dir(-0.6, -1, 0), t => F(B, 's', t) > 0.72);
    },
    parts: [
      P('tuberositas', 'tubérosité du métatarsien I', 'tuberositas ossis metatarsi primi', { alt: ['tubérosité du premier métatarsien', 'tubérosité'],
        test: (t, B) => B.d(t, B.L.tub) < 6, grow: 0 }),
      P('basis', 'base du métatarsien I', 'basis ossis metatarsi I', { alt: ['base', 'base du premier métatarsien', 'base du métatarsien'],
        test: (t, B) => F(B, 's', t) > 0.8, grow: 0 }),
      P('caput', 'tête du métatarsien I', 'caput ossis metatarsi I', { alt: ['tête', 'tête du premier métatarsien', 'tête du métatarsien'],
        test: (t, B) => F(B, 's', t) < 0.24, grow: 0 }),
      P('corpus', 'corps du métatarsien I', 'corpus ossis metatarsi I', { alt: ['corps', 'corps du premier métatarsien', 'corps du métatarsien', 'diaphyse'],
        test: () => true })
    ]
  });
  OS('ossa_metatarsi', 'R', 'metatarsien V', {
    title: 'cinquième métatarsien',
    landmarks(B) {
      footAxis(B);
      B.L.tub = B.ext(B.dir(-1, -0.2, -0.6), t => F(B, 's', t) > 0.7);
    },
    parts: [
      P('tuberositas', 'tubérosité du métatarsien V', 'tuberositas ossis metatarsi quinti', { alt: ['tubérosité du cinquième métatarsien', 'tubérosité', 'processus styloïde du cinquième métatarsien'], old: ['apophyse styloïde du cinquième métatarsien'],
        test: (t, B) => B.d(t, B.L.tub) < 7, grow: 0 }),
      P('basis', 'base du métatarsien V', 'basis ossis metatarsi V', { alt: ['base', 'base du cinquième métatarsien', 'base du métatarsien'],
        test: (t, B) => F(B, 's', t) > 0.82, grow: 0 }),
      P('caput', 'tête du métatarsien V', 'caput ossis metatarsi V', { alt: ['tête', 'tête du cinquième métatarsien', 'tête du métatarsien'],
        test: (t, B) => F(B, 's', t) < 0.2, grow: 0 }),
      P('corpus', 'corps du métatarsien V', 'corpus ossis metatarsi V', { alt: ['corps', 'corps du cinquième métatarsien', 'corps du métatarsien', 'diaphyse'],
        test: () => true })
    ]
  });

  /* ======================================================================
     VERTEBRES
     ====================================================================== */
  const SPINOUS = ['processus epineux', 'processus spinosus', { old: ['apophyse épineuse'] }];
  const TRANSV = { old: ['apophyse transverse'] };
  /* processus articulaires : de chaque cote, point le plus haut (superieur) et le plus bas
     (inferieur) de l'arc, en arriere du corps (a < aMax) et hors ligne mediane */
  function artProcesses(B, aMax, latMin = 0.15, latMax = 0.7) {
    const L = B.L;
    const f = (left, up) => B.ext(B.dxyz(0, up ? 1 : -1, -0.15), t => leftSide(t, B) === left && t.lat > latMin && t.lat < latMax && t.a < aMax);
    L.sapR = f(false, true); L.sapL = f(true, true);
    L.iapR = f(false, false); L.iapL = f(true, false);
  }
  const nearPair = (t, B, k, r) => B.d(t, B.L[k + 'R']) < r || B.d(t, B.L[k + 'L']) < r;

  /* ---------------- Atlas (C1) ---------------- */
  OS('atlas', null, 'C1', {
    landmarks(B) {
      const L = B.L;
      L.ta = B.ext(B.dxyz(0, 0, 1));
      L.tp = B.ext(B.dxyz(0, 0, -1));
    },
    parts: [
      P('tuberculum_anterius', 'tubercule antérieur', 'tuberculum anterius atlantis', { alt: ['tubercule antérieur de l\'atlas'],
        test: (t, B) => B.d(t, B.L.ta) < 6, grow: 0 }),
      P('tuberculum_posterius', 'tubercule postérieur', 'tuberculum posterius atlantis', { alt: ['tubercule postérieur de l\'atlas'],
        test: (t, B) => B.d(t, B.L.tp) < 7, grow: 0 }),
      P('fovea_dentis', 'fovea de la dent', 'fovea dentis', { alt: ['fossette de la dent', 'surface articulaire pour la dent'],
        test: t => t.nz < -0.5 && t.a > 0.65 && t.lat < 0.3, grow: 0 }),
      P('facies_articularis_superior', 'face articulaire supérieure', 'facies articularis superior', { alt: ['surface articulaire supérieure'], old: ['cavité glénoïde de l\'atlas'],
        test: t => t.ny > 0.6 && t.lat > 0.32 && t.lat < 0.7 && t.a > 0.35 && t.a < 0.72, grow: 0 }),
      P('facies_articularis_inferior', 'face articulaire inférieure', 'facies articularis inferior', { alt: ['surface articulaire inférieure'],
        test: t => t.ny < -0.6 && t.lat > 0.3 && t.lat < 0.7 && t.a > 0.3 && t.a < 0.75, grow: 0 }),
      P('processus_transversus', 'processus transverse', 'processus transversus', Object.assign({
        test: t => t.lat > 0.74, grow: 0 }, TRANSV)),
      P('sulcus_arteriae_vertebralis', 'sillon de l\'artère vertébrale', 'sulcus arteriae vertebralis', { old: ['gouttière de l\'artère vertébrale'],
        test: t => t.ny > 0.35 && t.a > 0.2 && t.a < 0.42 && t.lat > 0.3 && t.lat < 0.6, grow: 0 }),
      P('arcus_anterior', 'arc antérieur', 'arcus anterior atlantis', { alt: ['arc antérieur de l\'atlas'],
        test: t => t.a > 0.72 && t.lat < 0.35, grow: 0 }),
      P('arcus_posterior', 'arc postérieur', 'arcus posterior atlantis', { alt: ['arc postérieur de l\'atlas'],
        test: t => t.a < 0.38 && t.lat < 0.55, grow: 0 }),
      P('massa_lateralis', 'masse latérale', 'massa lateralis atlantis', { alt: ['masses latérales'],
        test: () => true })
    ]
  });

  /* ---------------- Axis (C2) ---------------- */
  OS('axis', null, 'C2', {
    parts: [
      P('dens', 'dent de l\'axis', 'dens axis', { alt: ['dent', 'processus odontoïde'], old: ['apophyse odontoïde'],
        test: t => t.h > 0.6 && t.lat < 0.3 && t.a > 0.4 }),
      P('facies_articularis_superior', 'face articulaire supérieure', 'facies articularis superior', { alt: ['surface articulaire supérieure'],
        test: t => t.ny > 0.45 && t.lat > 0.25 && t.lat < 0.75 && t.h > 0.35 && t.h < 0.75 }),
      P('processus_transversus', 'processus transverse', 'processus transversus', Object.assign({
        test: t => t.lat > 0.8 }, TRANSV)),
      P('processus_spinosus', SPINOUS[0], SPINOUS[1], Object.assign({
        test: t => t.a < 0.25 && t.lat < 0.35 }, SPINOUS[2])),
      P('processus_articularis_inferior', 'processus articulaire inférieur', 'processus articularis inferior', { old: ['apophyse articulaire inférieure'],
        test: t => t.ny < -0.4 && t.a > 0.25 && t.a < 0.55 && t.lat > 0.25 }),
      P('corpus', 'corps de l\'axis', 'corpus axis', { alt: ['corps', 'corps vertébral'],
        test: t => t.h < 0.6 && t.a > 0.55 && t.lat < 0.4 }),
      P('lamina', 'lame', 'lamina arcus vertebrae', { alt: ['lame vertébrale', 'lames'],
        test: t => t.a < 0.5 && t.lat < 0.6 })
    ]
  });

  /* ---------------- Vertebre cervicale (C4) ---------------- */
  OS('vertebra_cervicalis', null, 'C4', {
    landmarks(B) {
      artProcesses(B, 0.55, 0.25, 0.85);
      /* uncus : relief superieur des bords lateraux du corps */
      const L = B.L;
      L.unR = B.ext(B.dxyz(-0.3, 1, 0), t => !leftSide(t, B) && t.a > 0.6 && t.lat > 0.2 && t.lat < 0.5);
      L.unL = B.ext(B.dxyz(0.3, 1, 0), t => leftSide(t, B) && t.a > 0.6 && t.lat > 0.2 && t.lat < 0.5);
    },
    parts: [
      P('uncus', 'uncus du corps', 'uncus corporis', { alt: ['uncus', 'processus unciforme'], old: ['apophyse semi-lunaire', 'crochet'],
        test: (t, B) => nearPair(t, B, 'un', 4), grow: 0 }),
      P('processus_articularis_superior', 'processus articulaire supérieur', 'processus articularis superior', { old: ['apophyse articulaire supérieure'],
        test: (t, B) => nearPair(t, B, 'sap', 6), grow: 0 }),
      P('processus_articularis_inferior', 'processus articulaire inférieur', 'processus articularis inferior', { old: ['apophyse articulaire inférieure'],
        test: (t, B) => nearPair(t, B, 'iap', 6), grow: 0 }),
      P('corpus', 'corps vertébral', 'corpus vertebrae', { alt: ['corps', 'corps de la vertèbre'],
        test: t => t.a > 0.62 && t.lat < 0.42, grow: 0 }),
      P('processus_transversus', 'processus transverse', 'processus transversus', Object.assign({ alt: ['processus transverse et foramen transversaire'],
        test: t => t.lat > 0.62 && t.a > 0.45, grow: 0 }, TRANSV)),
      P('pediculus', 'pédicule', 'pediculus arcus vertebrae', { alt: ['pédicule vertébral', 'pédicules'],
        test: t => t.lat > 0.3 && t.lat < 0.62 && t.a > 0.45 && t.a < 0.65, grow: 0 }),
      P('processus_spinosus', SPINOUS[0], SPINOUS[1], Object.assign({ alt: ['processus épineux bifide'],
        test: t => t.a < 0.15, grow: 0 }, SPINOUS[2])),
      P('lamina', 'lame', 'lamina arcus vertebrae', { alt: ['lame vertébrale', 'lames'],
        test: () => true })
    ]
  });

  /* ---------------- Vertebre proeminente (C7) ---------------- */
  OS('vertebra_cervicalis', null, 'C7', {
    title: 'vertèbre proéminente (C7)',
    landmarks(B) {
      artProcesses(B, 0.6, 0.25, 0.8);
      const L = B.L;
      L.unR = B.ext(B.dxyz(-0.3, 1, 0), t => !leftSide(t, B) && t.a > 0.65 && t.lat > 0.2 && t.lat < 0.5);
      L.unL = B.ext(B.dxyz(0.3, 1, 0), t => leftSide(t, B) && t.a > 0.65 && t.lat > 0.2 && t.lat < 0.5);
      L.sp = B.ext(B.dxyz(0, -0.4, -1));
    },
    parts: [
      P('uncus', 'uncus du corps', 'uncus corporis', { alt: ['uncus', 'processus unciforme'], old: ['apophyse semi-lunaire', 'crochet'],
        test: (t, B) => nearPair(t, B, 'un', 4), grow: 0 }),
      P('processus_articularis_superior', 'processus articulaire supérieur', 'processus articularis superior', { old: ['apophyse articulaire supérieure'],
        test: (t, B) => nearPair(t, B, 'sap', 6), grow: 0 }),
      P('processus_articularis_inferior', 'processus articulaire inférieur', 'processus articularis inferior', { old: ['apophyse articulaire inférieure'],
        test: (t, B) => nearPair(t, B, 'iap', 6), grow: 0 }),
      P('corpus', 'corps vertébral', 'corpus vertebrae', { alt: ['corps', 'corps de la vertèbre'],
        test: t => t.a > 0.68 && t.lat < 0.4, grow: 0 }),
      P('processus_transversus', 'processus transverse', 'processus transversus', Object.assign({ alt: ['processus transverse et foramen transversaire'],
        test: t => t.lat > 0.6 && t.a > 0.45, grow: 0 }, TRANSV)),
      P('pediculus', 'pédicule', 'pediculus arcus vertebrae', { alt: ['pédicule vertébral', 'pédicules'],
        test: t => t.lat > 0.28 && t.lat < 0.6 && t.a > 0.5 && t.a < 0.7, grow: 0 }),
      P('processus_spinosus', SPINOUS[0], SPINOUS[1], Object.assign({ alt: ['processus épineux de la vertèbre proéminente'],
        test: t => t.a < 0.3 && t.lat < 0.25, grow: 0 }, SPINOUS[2])),
      P('lamina', 'lame', 'lamina arcus vertebrae', { alt: ['lame vertébrale', 'lames'],
        test: () => true })
    ]
  });

  /* ---------------- Vertebre thoracique (T6) ---------------- */
  OS('vertebra_thoracica', null, 'T6', {
    landmarks(B) {
      /* hauteur du corps vertebral (partie anterieure, mediane) */
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < B.M.nt; i++) { const t = B.set(i); if (t.a > 0.7 && t.lat < 0.3) { lo = Math.min(lo, t.h); hi = Math.max(hi, t.h); } }
      B.L.bodyLo = lo; B.L.bodyHi = hi;
      artProcesses(B, 0.5, 0.12, 0.5);
    },
    parts: [
      P('fovea_costalis_superior', 'fossette costale supérieure', 'fovea costalis superior', { old: ['demi-facette costale supérieure'],
        test: (t, B) => t.lat > 0.3 && t.lat < 0.52 && t.a > 0.48 && t.a < 0.66 && t.h > B.L.bodyHi - 0.09 && Math.abs(t.nx) > 0.35 }),
      P('fovea_costalis_inferior', 'fossette costale inférieure', 'fovea costalis inferior', { old: ['demi-facette costale inférieure'],
        test: (t, B) => t.lat > 0.3 && t.lat < 0.52 && t.a > 0.48 && t.a < 0.66 && t.h < B.L.bodyLo + 0.09 && Math.abs(t.nx) > 0.35 }),
      P('corpus', 'corps vertébral', 'corpus vertebrae', { alt: ['corps', 'corps de la vertèbre'],
        test: t => t.a > 0.55 && t.lat < 0.45 }),
      P('fovea_costalis_processus_transversi', 'fossette costale du processus transverse', 'fovea costalis processus transversi', { alt: ['fossette costale transversaire'],
        test: t => t.lat > 0.7 && t.nz > 0.35 }),
      P('processus_transversus', 'processus transverse', 'processus transversus', Object.assign({
        test: t => t.lat > 0.55 && t.a < 0.5 }, TRANSV)),
      P('processus_articularis_superior', 'processus articulaire supérieur', 'processus articularis superior', { old: ['apophyse articulaire supérieure'],
        test: (t, B) => nearPair(t, B, 'sap', 8), grow: 0 }),
      P('processus_articularis_inferior', 'processus articulaire inférieur', 'processus articularis inferior', { old: ['apophyse articulaire inférieure'],
        test: (t, B) => nearPair(t, B, 'iap', 8), grow: 0 }),
      P('pediculus', 'pédicule', 'pediculus arcus vertebrae', { alt: ['pédicule vertébral', 'pédicules'],
        test: t => t.a > 0.42 && t.a < 0.58 && t.lat > 0.3 && t.lat < 0.55, grow: 0 }),
      P('processus_spinosus', SPINOUS[0], SPINOUS[1], Object.assign({
        test: t => (t.a < 0.25 && t.lat < 0.2) || t.h < 0.3, grow: 0 }, SPINOUS[2])),
      P('lamina', 'lame', 'lamina arcus vertebrae', { alt: ['lame vertébrale', 'lames'],
        test: () => true })
    ]
  });

  /* ---------------- Vertebre lombaire (L3) ---------------- */
  OS('vertebra_lumbalis', null, 'L3', {
    landmarks(B) {
      B.L.mamR = B.ext(B.dxyz(-0.6, 0.3, -1), t => !leftSide(t, B) && t.lat > 0.2 && t.lat < 0.5 && t.a < 0.35);
      B.L.mamL = B.ext(B.dxyz(0.6, 0.3, -1), t => leftSide(t, B) && t.lat > 0.2 && t.lat < 0.5 && t.a < 0.35);
    },
    parts: [
      P('processus_mammillaris', 'processus mamillaire', 'processus mammillaris', { old: ['tubercule mamillaire'],
        test: (t, B) => B.d(t, B.L.mamR) < 5 || B.d(t, B.L.mamL) < 5 }),
      P('corpus', 'corps vertébral', 'corpus vertebrae', { alt: ['corps', 'corps de la vertèbre'],
        test: t => t.a > 0.5 && t.lat < 0.5 }),
      P('processus_costiformis', 'processus costiforme', 'processus costiformis', { alt: ['processus costal', 'processus transverse'], old: ['apophyse costiforme', 'apophyse transverse'],
        test: t => t.lat > 0.55 && t.a > 0.3 && t.a < 0.55 }),
      P('processus_articularis_superior', 'processus articulaire supérieur', 'processus articularis superior', { old: ['apophyse articulaire supérieure'],
        test: t => t.lat > 0.2 && t.lat < 0.5 && t.a < 0.4 && t.h > 0.55 }),
      P('processus_articularis_inferior', 'processus articulaire inférieur', 'processus articularis inferior', { old: ['apophyse articulaire inférieure'],
        test: t => t.lat > 0.1 && t.lat < 0.35 && t.a < 0.35 && t.h < 0.4 }),
      P('pediculus', 'pédicule', 'pediculus arcus vertebrae', { alt: ['pédicule vertébral', 'pédicules'],
        test: t => t.a > 0.38 && t.a < 0.52 && t.lat > 0.3 && t.lat < 0.55 }),
      P('processus_spinosus', SPINOUS[0], SPINOUS[1], Object.assign({
        test: t => t.a < 0.22 && t.lat < 0.15 }, SPINOUS[2])),
      P('lamina', 'lame', 'lamina arcus vertebrae', { alt: ['lame vertébrale', 'lames'],
        test: t => t.a > 0.2 && t.a < 0.4 && t.lat < 0.35 })
    ]
  });

  /* ======================================================================
     THORAX ET OS HYOIDE
     ====================================================================== */

  /* ---------------- Sternum (3 elements BodyParts3D) ---------------- */
  OS('sternum', null, null, {
    landmarks(B) {
      /* elements tries par hauteur : manubrium, corps, processus xiphoide */
      const acc = {};
      for (let i = 0; i < B.M.nt; i++) { const t = B.set(i); const a = acc[t.el] || (acc[t.el] = [0, 0]); a[0] += t.y; a[1]++; }
      const order = Object.keys(acc).map(k => [+k, acc[k][0] / acc[k][1]]).sort((p, q) => q[1] - p[1]);
      B.L.manu = order[0][0]; B.L.body = order[1] ? order[1][0] : -1; B.L.xiph = order[2] ? order[2][0] : -1;
      /* angle sternal : jonction manubrium-corps, en avant */
      let hj = Infinity;
      for (let i = 0; i < B.M.nt; i++) { const t = B.set(i); if (t.el === B.L.manu && t.h < hj) hj = t.h; }
      B.L.hj = hj;
    },
    parts: [
      P('incisura_jugularis', 'incisure jugulaire', 'incisura jugularis', { old: ['fourchette sternale'],
        test: (t, B) => t.el === B.L.manu && t.h > 0.94 && t.lat < 0.3, grow: 0 }),
      P('incisura_clavicularis', 'incisure claviculaire', 'incisura clavicularis', { alt: ['incisures claviculaires'],
        test: (t, B) => t.el === B.L.manu && t.lat > 0.45 && t.h > 0.86, grow: 0 }),
      P('angulus_sterni', 'angle sternal', 'angulus sterni', { alt: ['angle du sternum'], old: ['angle de Louis'],
        test: (t, B) => t.nz > 0.4 && Math.abs(t.h - B.L.hj) < 0.025, grow: 0 }),
      P('incisurae_costales', 'incisures costales', 'incisurae costales', { alt: ['incisure costale'],
        test: (t, B) => (t.el === B.L.body || (t.el === B.L.manu && t.h < 0.86)) && Math.abs(t.nx) > 0.75, grow: 0 }),
      P('manubrium', 'manubrium sternal', 'manubrium sterni', { alt: ['manubrium', 'manubrium du sternum'], old: ['poignée du sternum'],
        test: (t, B) => t.el === B.L.manu }),
      P('corpus', 'corps du sternum', 'corpus sterni', { alt: ['corps'], old: ['lame du sternum'],
        test: (t, B) => t.el === B.L.body }),
      P('processus_xiphoideus', 'processus xiphoïde', 'processus xiphoideus', { alt: ['xiphoïde'], old: ['appendice xiphoïde'],
        test: (t, B) => t.el === B.L.xiph })
    ]
  });

  /* ---------------- Cote (6e cote droite) ---------------- */
  OS('costa', 'R', 'cote 6', {
    title: 'sixième côte',
    landmarks(B) {
      const L = B.L;
      /* longueur le long de la cote depuis la tete (os courbe) */
      L.head = B.ext(B.dir(1, 0.3, -0.6));
      const g = B.field('g', L.head);
      let mx = 0;
      for (let i = 0; i < g.length; i++) if (g[i] > mx) mx = g[i];
      L.len = mx;
      L.tub = B.ext(B.dir(0, 0.3, -1), t => F(B, 'g', t) > 24 && F(B, 'g', t) < 45);
    },
    parts: [
      P('caput', 'tête de la côte', 'caput costae', { alt: ['tête'],
        test: (t, B) => F(B, 'g', t) < 13 }),
      P('tuberculum', 'tubercule de la côte', 'tuberculum costae', { alt: ['tubercule', 'tubercule costal'],
        test: (t, B) => B.d(t, B.L.tub) < 8 }),
      P('collum', 'col de la côte', 'collum costae', { alt: ['col'],
        test: (t, B) => F(B, 'g', t) < 30 }),
      P('angulus', 'angle de la côte', 'angulus costae', { alt: ['angle costal'],
        test: (t, B) => F(B, 'g', t) > 55 && F(B, 'g', t) < 72 }),
      P('extremitas_anterior', 'extrémité antérieure', 'extremitas anterior costae', { alt: ['extrémité sternale', 'extrémité antérieure de la côte'],
        test: (t, B) => F(B, 'g', t) > B.L.len - 15 }),
      P('sulcus_costae', 'sillon de la côte', 'sulcus costae', { alt: ['sillon costal'], old: ['gouttière costale'],
        test: (t, B) => { const g = F(B, 'g', t); if (g < 75 || g > B.L.len - 40) return false;
          const d = B.unit([B.max[0] - t.x, 0, B.cen[2] - t.z]); return t.ny < -0.4 && t.nx * d[0] + t.nz * d[2] > 0.35; }, grow: 0 }),
      P('corpus', 'corps de la côte', 'corpus costae', { alt: ['corps'],
        test: () => true })
    ]
  });

  /* ---------------- Os hyoide ---------------- */
  OS('os_hyoideum', null, null, {
    landmarks(B) {
      B.L.lcR = B.ext(B.dxyz(0, 1, 0.2), t => !leftSide(t, B) && t.lat > 0.2 && t.lat < 0.6);
      B.L.lcL = B.ext(B.dxyz(0, 1, 0.2), t => leftSide(t, B) && t.lat > 0.2 && t.lat < 0.6);
    },
    parts: [
      P('cornu_minus', 'petite corne', 'cornu minus', { alt: ['petites cornes'],
        test: (t, B) => B.d(t, B.L.lcR) < 3.5 || B.d(t, B.L.lcL) < 3.5, grow: 0 }),
      P('corpus', 'corps de l\'os hyoïde', 'corpus ossis hyoidei', { alt: ['corps'],
        test: t => t.lat < 0.42 && t.a > 0.45, grow: 0 }),
      P('cornu_majus', 'grande corne', 'cornu majus', { alt: ['grandes cornes'],
        test: () => true })
    ]
  });

  /* ======================================================================
     CRANE
     ====================================================================== */

  /* ---------------- Mandibule ---------------- */
  OS('mandibula', null, null, {
    landmarks(B) {
      B.L.ment = B.ext(B.dxyz(0, -0.4, 1), t => t.lat < 0.3);
      B.L.angR = B.ext(B.dxyz(-0.5, -1, -1), t => !leftSide(t, B));
      B.L.angL = B.ext(B.dxyz(0.5, -1, -1), t => leftSide(t, B));
    },
    parts: [
      P('protuberantia_mentalis', 'protubérance mentonnière', 'protuberantia mentalis', { alt: ['menton', 'éminence mentonnière'],
        test: (t, B) => B.d(t, B.L.ment) < 13 && t.lat < 0.3 }),
      P('processus_condylaris', 'processus condylaire', 'processus condylaris', { alt: ['condyle de la mandibule', 'tête de la mandibule'], old: ['condyle mandibulaire'],
        test: t => t.h > 0.78 && t.a < 0.22 }),
      P('processus_coronoideus', 'processus coronoïde', 'processus coronoideus', { alt: ['processus coronoïde de la mandibule'], old: ['apophyse coronoïde'],
        test: t => t.h > 0.7 && t.a > 0.22 && t.a < 0.45 && t.lat > 0.5 }),
      P('incisura_mandibulae', 'incisure de la mandibule', 'incisura mandibulae', { alt: ['incisure mandibulaire'], old: ['échancrure sigmoïde'],
        test: t => t.h > 0.6 && t.h < 0.8 && t.a > 0.15 && t.a < 0.3 && t.ny > 0.2 && t.lat > 0.55 }),
      P('angulus_mandibulae', 'angle de la mandibule', 'angulus mandibulae', { alt: ['angle mandibulaire'], old: ['gonion'],
        test: (t, B) => B.d(t, B.L.angR) < 14 || B.d(t, B.L.angL) < 14 }),
      P('ramus_mandibulae', 'branche de la mandibule', 'ramus mandibulae', { alt: ['branche', 'ramus'], old: ['branche montante'],
        test: t => t.a < 0.38 && t.lat > 0.6 }),
      P('pars_alveolaris', 'partie alvéolaire', 'pars alveolaris mandibulae', { alt: ['processus alvéolaire', 'arcade alvéolaire'],
        test: t => t.ny > 0.35 && t.a > 0.3 && t.h > 0.3 }),
      P('corpus', 'corps de la mandibule', 'corpus mandibulae', { alt: ['corps'],
        test: t => t.a > 0.3 && t.h < 0.55 })
    ]
  });

  /* ---------------- Maxillaire (droit) ---------------- */
  OS('maxilla', 'R', null, {
    landmarks(B) {
      const L = B.L;
      L.zyg = B.ext(B.dir(-1, 0, 0), t => t.h > 0.4 && t.h < 0.75);
      L.tub = B.ext(B.dir(0, 0, -1), t => t.h > 0.15 && t.h < 0.5);
      /* foramen infra-orbitaire : petite cupule de la face anterieure, sous le rebord orbitaire,
         en dehors de l'ouverture nasale (le sillon lacrymal, plus medial, est ecarte) */
      let best = null;
      [0.5, 0.58, 0.66].forEach(h => [0.25, 0.35, 0.45].forEach(m => {
        const c = B.cup(B.add(B.surf(B.at(m, h, 1), t => t.nz > 0.4), B.dir(0, 0, 1), 3), 7, 0.5);
        if (c.r >= 1 && c.r <= 5 && B.mOf(c.c) < 0.55 && B.aOf(c.c) > 0.6 && (!best || c.area > best.area)) best = c;
      }));
      L.iof = best ? best.c : B.surf(B.at(0.4, 0.6, 1), t => t.nz > 0.4);
      /* epine nasale anterieure : pointe anterieure, mediane, basse */
      L.ens = B.ext(B.dir(1, -0.2, 1), t => t.m > 0.8 && t.h > 0.2 && t.h < 0.45);
    },
    parts: [
      P('foramen_infraorbitale', 'foramen infra-orbitaire', 'foramen infraorbitale', { old: ['trou sous-orbitaire'],
        test: (t, B) => B.d(t, B.L.iof) < 5, grow: 0 }),
      P('spina_nasalis_anterior', 'épine nasale antérieure', 'spina nasalis anterior', { old: ['épine nasale antérieure et inférieure'],
        test: (t, B) => B.d(t, B.L.ens) < 5, grow: 0 }),
      P('processus_frontalis', 'processus frontal', 'processus frontalis maxillae', { old: ['apophyse montante'],
        test: t => t.h > 0.72 && t.m > 0.55, grow: 0 }),
      P('processus_zygomaticus', 'processus zygomatique', 'processus zygomaticus maxillae', { old: ['apophyse pyramidale', 'apophyse zygomatique'],
        test: (t, B) => B.d(t, B.L.zyg) < 12, grow: 0 }),
      P('facies_orbitalis', 'face orbitaire', 'facies orbitalis maxillae', { alt: ['face orbitaire du maxillaire', 'face supérieure'],
        test: t => t.ny > 0.5 && t.h > 0.55 && t.m < 0.75, grow: 0 }),
      P('processus_palatinus', 'processus palatin', 'processus palatinus', { old: ['apophyse palatine'],
        test: t => t.m > 0.8 && t.h < 0.3, grow: 0 }),
      P('processus_alveolaris', 'processus alvéolaire', 'processus alveolaris', { alt: ['arcade alvéolaire'], old: ['bord alvéolaire'],
        test: t => t.h < 0.2, grow: 0 }),
      P('tuber_maxillae', 'tubérosité du maxillaire', 'tuber maxillae', { alt: ['tubérosité maxillaire'],
        test: (t, B) => B.d(t, B.L.tub) < 12, grow: 0 }),
      P('facies_nasalis', 'face nasale', 'facies nasalis maxillae', { alt: ['face médiale', 'face nasale du maxillaire'],
        test: t => t.nm > 0.5 && t.m > 0.6 && t.h >= 0.2, grow: 0 }),
      P('facies_anterior', 'face antérieure', 'facies anterior maxillae', { alt: ['face antérieure du maxillaire', 'face jugale'], old: ['fosse canine'],
        test: t => t.nz > 0.35, grow: 0 }),
      P('facies_infratemporalis', 'face infratemporale', 'facies infratemporalis maxillae', { alt: ['face postérieure'], old: ['face zygomatique'],
        test: t => t.nz < -0.25 }),
      P('corpus', 'corps du maxillaire', 'corpus maxillae', { alt: ['corps'],
        test: () => true })
    ]
  });

  /* ---------------- Os frontal ---------------- */
  OS('os_frontale', null, null, {
    landmarks(B) {
      /* centre de courbure de l'ecaille (moitie haute de l'os) */
      outward(B, vaultCenter(B, t => t.h > 0.45));
      B.L.gla = B.ext(B.dxyz(0, -0.2, 1), t => t.lat < 0.15 && t.h > 0.25 && t.h < 0.5);
      B.L.zR = B.ext(B.dxyz(-1, -1, 0.2), t => !leftSide(t, B) && t.h < 0.4);
      B.L.zL = B.ext(B.dxyz(1, -1, 0.2), t => leftSide(t, B) && t.h < 0.4);
      B.L.tR = B.surf(B.at(0.3, 0.75, 1), t => F(B, 'out', t) > 0.3);
      B.L.tL = B.surf(B.at(0.7, 0.75, 1), t => F(B, 'out', t) > 0.3);
    },
    parts: [
      P('glabella', 'glabelle', 'glabella', { old: ['bosse nasale'],
        test: (t, B) => B.d(t, B.L.gla) < 10 && F(B, 'out', t) > 0, grow: 0 }),
      P('processus_zygomaticus', 'processus zygomatique', 'processus zygomaticus ossis frontalis', { old: ['apophyse orbitaire externe'],
        test: (t, B) => B.d(t, B.L.zR) < 13 || B.d(t, B.L.zL) < 13, grow: 0 }),
      P('pars_nasalis', 'partie nasale', 'pars nasalis ossis frontalis', { old: ['échancrure nasale', 'épine nasale du frontal'],
        test: t => t.lat < 0.18 && t.h < 0.25, grow: 0 }),
      P('pars_orbitalis', 'partie orbitaire', 'pars orbitalis ossis frontalis', { alt: ['lame orbitaire du frontal', 'face orbitaire'], old: ['voûte orbitaire'],
        test: t => t.ny < -0.35 && t.h < 0.3 && t.lat > 0.12, grow: 0 }),
      P('facies_interna', 'face interne', 'facies interna ossis frontalis', { alt: ['face endocrânienne'],
        test: (t, B) => F(B, 'out', t) < -0.25, grow: 0 }),
      P('margo_supraorbitalis', 'bord supra-orbitaire', 'margo supraorbitalis', { old: ['arcade orbitaire', 'rebord sus-orbitaire'],
        test: t => t.h > 0.18 && t.h < 0.32 && t.lat > 0.15 && t.lat < 0.8 && t.nz > 0.2, grow: 0 }),
      P('arcus_superciliaris', 'arcade sourcilière', 'arcus superciliaris', { alt: ['arcades sourcilières'],
        test: t => t.h > 0.3 && t.h < 0.45 && t.lat > 0.15 && t.lat < 0.55 && t.nz > 0.5, grow: 0 }),
      P('tuber_frontale', 'tubérosité frontale', 'tuber frontale', { alt: ['tuber frontal', 'tubérosités frontales'], old: ['bosse frontale'],
        test: (t, B) => (B.d(t, B.L.tR) < 18 || B.d(t, B.L.tL) < 18) && F(B, 'out', t) > 0, grow: 0 }),
      P('squama', 'écaille frontale', 'squama frontalis', { alt: ['écaille', 'écaille du frontal', 'face externe'],
        test: () => true })
    ]
  });

  /* ---------------- Os parietal (droit) ---------------- */
  OS('os_parietale', 'R', null, {
    landmarks(B) {
      const L = B.L;
      outward(B, vaultCenter(B));
      const ext = d => B.ext(d, t => F(B, 'out', t) > 0.2);
      L.af = ext(B.dir(0.6, 1, 1));
      L.as = ext(B.dir(-0.4, -1, 1));
      L.ao = ext(B.dir(0.6, 1, -1));
      L.am = ext(B.dir(-0.4, -1, -1));
      L.tub = ext(B.dir(-1, 0.25, 0));
      ['af', 'as', 'ao', 'am'].forEach(k => B.field(k, L[k]));
      /* quatre bords : contour de l'os dans son plan, entre les angles */
      const pl = B.plane();
      B.relief('r', pl, 6);
      outline(B, 'ol', () => true);
      ['af', 'as', 'ao', 'am'].forEach(k => { L['a_' + k] = angleOf(B, 'ol', L[k]); });
    },
    parts: [
      P('facies_interna', 'face interne', 'facies interna ossis parietalis', { alt: ['face endocrânienne'],
        test: (t, B) => F(B, 'out', t) < -0.2 && F(B, 'ol', t) > 4, grow: 0.5 }),
      P('angulus_frontalis', 'angle frontal', 'angulus frontalis', { old: ['angle antéro-supérieur'],
        test: (t, B) => F(B, 'af', t) < 24, grow: 0 }),
      P('angulus_sphenoidalis', 'angle sphénoïdal', 'angulus sphenoidalis', { old: ['angle antéro-inférieur'],
        test: (t, B) => F(B, 'as', t) < 20, grow: 0 }),
      P('angulus_occipitalis', 'angle occipital', 'angulus occipitalis', { old: ['angle postéro-supérieur'],
        test: (t, B) => F(B, 'ao', t) < 24, grow: 0 }),
      P('angulus_mastoideus', 'angle mastoïdien', 'angulus mastoideus', { old: ['angle postéro-inférieur'],
        test: (t, B) => F(B, 'am', t) < 20, grow: 0 }),
      P('margo_sagittalis', 'bord sagittal', 'margo sagittalis', { old: ['bord supérieur', 'bord interne'],
        test: (t, B) => F(B, 'ol', t) < 6 && onArc(F(B, 'olA', t), B.L.a_af, B.L.a_ao, B.L.a_am), grow: 0 }),
      P('margo_squamosus', 'bord squameux', 'margo squamosus', { old: ['bord inférieur', 'bord temporal'],
        test: (t, B) => F(B, 'ol', t) < 6 && onArc(F(B, 'olA', t), B.L.a_as, B.L.a_am, B.L.a_af), grow: 0 }),
      P('margo_frontalis', 'bord frontal', 'margo frontalis', { old: ['bord antérieur'],
        test: (t, B) => F(B, 'ol', t) < 6 && onArc(F(B, 'olA', t), B.L.a_af, B.L.a_as, B.L.a_am), grow: 0 }),
      P('margo_occipitalis', 'bord occipital', 'margo occipitalis', { old: ['bord postérieur'],
        test: (t, B) => F(B, 'ol', t) < 6, grow: 0 }),
      P('tuber_parietale', 'tuber pariétal', 'tuber parietale', { alt: ['tubérosité pariétale'], old: ['bosse pariétale'],
        test: (t, B) => B.d(t, B.L.tub) < 20 && F(B, 'out', t) > 0, grow: 0 }),
      P('facies_externa', 'face externe', 'facies externa ossis parietalis', { alt: ['face exocrânienne'],
        test: () => true })
    ]
  });

  /* ---------------- Os temporal (droit) ---------------- */
  OS('os_temporale', 'R', null, {
    landmarks(B) {
      const L = B.L;
      L.zyg = B.ext(B.dir(0, 0, 1));
      B.field('zyg', L.zyg);
      L.mas = B.ext(B.dir(-0.2, -1, -0.8), t => t.m < 0.6);
      L.sty = B.ext(B.dir(0.3, -1, 0.3), t => t.m > 0.35);
      B.field('sty', L.sty);
      /* fosse mandibulaire : cupule tournee vers le bas, sous la racine du processus zygomatique */
      const f0 = B.centroid(t => t.ny < -0.6 && t.h > 0.25 && t.h < 0.5 && t.a > 0.45 && t.a < 0.7 && t.m < 0.5);
      L.fos = B.bestCup([6, 12, 18].map(d => B.add(f0, [0, -1, 0], d)), 22, 6, 24, 0.5);
      /* meat acoustique externe : conduit (cupule etroite) juste en arriere de la fosse */
      const m0 = B.add(L.fos.c, [0, 3, -14]);
      L.mea = B.bestCup([0, 4, 8].map(d => B.add(m0, B.dir(-1, 0, 0), d)), 10, 2, 7, 0.4);
    },
    parts: [
      P('processus_styloideus', 'processus styloïde', 'processus styloideus', { alt: ['processus styloïde du temporal'], old: ['apophyse styloïde'],
        test: (t, B) => F(B, 'sty', t) < 16, grow: 0 }),
      P('processus_mastoideus', 'processus mastoïde', 'processus mastoideus', { alt: ['mastoïde'], old: ['apophyse mastoïde'],
        test: (t, B) => B.d(t, B.L.mas) < 17, grow: 0 }),
      P('fossa_mandibularis', 'fosse mandibulaire', 'fossa mandibularis', { old: ['cavité glénoïde du temporal'],
        test: (t, B) => { const c = B.L.fos; return B.d(t, c.c) < c.r * 1.2 && facesTo(t, B, c.c, 0.5) && t.ny < 0; }, grow: 0 }),
      P('meatus_acusticus_externus', 'méat acoustique externe', 'meatus acusticus externus', { old: ['conduit auditif externe'],
        test: (t, B) => { const c = B.L.mea; return B.d(t, c.c) < c.r * 1.8 && facesTo(t, B, c.c, 0.3); }, grow: 0 }),
      P('processus_zygomaticus', 'processus zygomatique', 'processus zygomaticus ossis temporalis', { old: ['apophyse zygomatique'],
        test: (t, B) => F(B, 'zyg', t) < 32 && t.h < 0.6, grow: 0 }),
      P('pars_tympanica', 'partie tympanique', 'pars tympanica', { old: ['os tympanal'],
        test: t => t.h < 0.38 && t.m < 0.45 && t.a > 0.3 && t.a < 0.55, grow: 0 }),
      P('pars_petrosa', 'partie pétreuse', 'pars petrosa', { old: ['rocher', 'pyramide pétreuse'],
        test: t => t.m > 0.55 && t.h < 0.6 }),
      P('pars_squamosa', 'partie squameuse', 'pars squamosa', { old: ['écaille du temporal', 'écaille temporale'],
        test: () => true })
    ]
  });

  /* ---------------- Os occipital ---------------- */
  OS('os_occipitale', null, null, {
    landmarks(B) {
      const L = B.L;
      /* centre de courbure de l'ecaille (moitie haute de l'os) */
      outward(B, vaultCenter(B, t => t.h > 0.5));
      L.pro = B.ext(B.dxyz(0, 0, -1), t => t.lat < 0.15 && F(B, 'out', t) > 0.3);
      L.cR = B.ext(B.dxyz(-0.4, -1, 0.4), t => !leftSide(t, B));
      L.cL = B.ext(B.dxyz(0.4, -1, 0.4), t => leftSide(t, B));
      /* foramen magnum : entre les condyles */
      L.fm = B.mix(L.cR, L.cL, 0.5);
    },
    parts: [
      P('condylus_occipitalis', 'condyle occipital', 'condylus occipitalis', { alt: ['condyles occipitaux'], old: ['condyle de l\'occipital'],
        test: (t, B) => (B.d(t, B.L.cR) < 12 || B.d(t, B.L.cL) < 12) && t.ny < 0, grow: 0 }),
      P('facies_interna', 'face interne', 'facies interna ossis occipitalis', { alt: ['face endocrânienne'],
        test: (t, B) => F(B, 'out', t) < -0.25 && t.a < 0.7, grow: 0.5 }),
      P('protuberantia_occipitalis_externa', 'protubérance occipitale externe', 'protuberantia occipitalis externa', { alt: ['inion'],
        test: (t, B) => B.d(t, B.L.pro) < 10, grow: 0 }),
      /* crete occipitale externe : ligne mediane de la face externe, sous la protuberance */
      P('crista_occipitalis_externa', 'crête occipitale externe', 'crista occipitalis externa',
        { test: (t, B) => Math.abs(t.x - B.cen[0]) < 3 && F(B, 'out', t) > 0.2 && t.h < B.hOf(B.L.pro) - 0.03 && t.z < B.L.fm[2] - 10, grow: 0 }),
      P('pars_basilaris', 'partie basilaire', 'pars basilaris ossis occipitalis', { alt: ['clivus'], old: ['apophyse basilaire'],
        test: t => t.a > 0.75 && t.lat < 0.3, grow: 0 }),
      P('pars_lateralis', 'partie latérale', 'pars lateralis ossis occipitalis', { alt: ['parties latérales'], old: ['masses latérales de l\'occipital'],
        test: t => t.lat > 0.2 && t.a > 0.45 && t.h < 0.35 }),
      P('squama', 'écaille occipitale', 'squama occipitalis', { alt: ['écaille', 'écaille de l\'occipital'],
        test: (t, B) => F(B, 'out', t) > 0.2 })
    ]
  });

  /* ---------------- Os sphenoide ---------------- */
  OS('os_sphenoidale', null, null, {
    landmarks(B) {
      const L = B.L;
      /* extremites des ailes : petites ailes (hautes et anterieures), grandes ailes (plus bas,
         plus en dehors) ; la fissure orbitaire superieure les separe le long de la surface */
      L.amiR = B.ext(B.dxyz(-1, 0.2, 0.3), t => !leftSide(t, B) && t.h > 0.72 && t.a > 0.45);
      L.amiL = B.ext(B.dxyz(1, 0.2, 0.3), t => leftSide(t, B) && t.h > 0.72 && t.a > 0.45);
      L.amaR = B.ext(B.dxyz(-1, 0, 0), t => !leftSide(t, B) && t.h > 0.3 && t.h < 0.7);
      L.amaL = B.ext(B.dxyz(1, 0, 0), t => leftSide(t, B) && t.h > 0.3 && t.h < 0.7);
      L.dorsum = B.ext(B.dxyz(0, 1, -0.6), t => t.lat < 0.1 && t.a < 0.5);
    },
    parts: [
      P('sella_turcica', 'selle turcique', 'sella turcica', { alt: ['selle', 'fosse hypophysaire'],
        test: t => t.lat < 0.12 && t.ny > 0.5 && t.h > 0.6 && t.a > 0.3 && t.a < 0.7, grow: 0 }),
      P('dorsum_sellae', 'dos de la selle', 'dorsum sellae', { alt: ['lame quadrilatère'],
        test: (t, B) => B.d(t, B.L.dorsum) < 8, grow: 0 }),
      P('processus_pterygoideus', 'processus ptérygoïde', 'processus pterygoideus', { alt: ['processus ptérygoïdiens'], old: ['apophyse ptérygoïde'],
        test: t => t.h < 0.3 && t.lat < 0.45, grow: 0 }),
      P('corpus', 'corps du sphénoïde', 'corpus ossis sphenoidalis', { alt: ['corps'],
        test: t => t.lat < 0.16 && t.h > 0.3, grow: 0.3 }),
      /* ailes : croissance depuis leurs extremites */
      P('ala_minor', 'petite aile', 'ala minor', { alt: ['petites ailes'], old: ['apophyse d\'Ingrassias'],
        seed: B => [B.L.amiR, B.L.amiL] }),
      P('ala_major', 'grande aile', 'ala major', { alt: ['grandes ailes'],
        seed: B => [B.L.amaR, B.L.amaL] })
    ]
  });

  /* ---------------- Os ethmoide ---------------- */
  OS('os_ethmoidale', null, null, {
    parts: [
      P('crista_galli', 'crista galli', 'crista galli', { alt: ['apophyse crista galli'], old: ['apophyse crista-galli'],
        test: t => t.lat < 0.12 && t.h > 0.78, grow: 0 }),
      P('lamina_cribrosa', 'lame criblée', 'lamina cribrosa', { alt: ['lame criblée de l\'ethmoïde'],
        test: t => t.ny > 0.5 && t.h > 0.7 && t.lat < 0.28, grow: 0 }),
      P('lamina_perpendicularis', 'lame perpendiculaire', 'lamina perpendicularis', { alt: ['lame verticale'],
        test: t => t.lat < 0.1 && t.h < 0.75, grow: 0 }),
      P('lamina_orbitalis', 'lame orbitaire', 'lamina orbitalis', { old: ['os planum'],
        test: t => t.lat > 0.72 && t.nm < -0.55, grow: 0 }),
      P('concha_nasalis_media', 'cornet nasal moyen', 'concha nasalis media', { alt: ['cornet moyen'],
        test: t => t.lat > 0.12 && t.lat < 0.6 && t.h < 0.4 && (t.nm > 0.4 || t.ny < -0.5), grow: 0 }),
      P('labyrinthus', 'labyrinthe ethmoïdal', 'labyrinthus ethmoidalis', { alt: ['labyrinthe'], old: ['masses latérales de l\'ethmoïde'],
        test: () => true })
    ]
  });

  /* ---------------- Os zygomatique (droit) ---------------- */
  OS('os_zygomaticum', 'R', null, {
    parts: [
      P('processus_frontalis', 'processus frontal', 'processus frontalis ossis zygomatici', { old: ['apophyse frontale', 'apophyse orbitaire externe'],
        test: t => t.h > 0.68, grow: 0 }),
      P('processus_temporalis', 'processus temporal', 'processus temporalis', { old: ['apophyse temporale'],
        test: t => t.a < 0.3 && t.h < 0.6, grow: 0 }),
      P('facies_orbitalis', 'face orbitaire', 'facies orbitalis ossis zygomatici',
        { test: t => t.nm > 0.25 && t.nz < 0.15 && t.ny > -0.2 && t.h > 0.4, grow: 0 }),
      P('facies_temporalis', 'face temporale', 'facies temporalis',
        { test: t => t.nz < -0.3, grow: 0 }),
      P('facies_lateralis', 'face latérale', 'facies lateralis', { alt: ['face externe', 'face jugale'],
        test: () => true })
    ]
  });

  /* ---------------- Petits os de la face ---------------- */
  /* os nasal : lame mince qui chevauche ses voisins dans le modele ; les bords sont pris sur
     la tranche de l'os (surface perpendiculaire a la face externe), du cote de chaque voisin */
  const nasalRim = (t, B) => Math.abs(B.ndot(t, B.L.ne)) < 0.45;
  OS('os_nasale', 'R', null, {
    landmarks(B) {
      contact(B, 'fr', 'os_frontale');
      contact(B, 'mx', 'maxilla', { side: 'R' });
      contact(B, 'na', 'os_nasale', { side: 'L' });
      /* normale moyenne de la face externe (ponderee par l'aire) */
      const s = [0, 0, 0];
      for (let i = 0; i < B.M.nt; i++) {
        const t = B.set(i), a = B.M.A[i];
        if (t.nz > 0.3) { s[0] += t.nx * a; s[1] += t.ny * a; s[2] += t.nz * a; }
      }
      B.L.ne = B.unit(s);
    },
    parts: [
      P('margo_superior', 'bord supérieur', 'margo superior ossis nasalis', { alt: ['bord frontal', 'bord supérieur de l\'os nasal'],
        test: (t, B) => t.h > 0.93 || (nasalRim(t, B) && F(B, 'fr', t) < 2.5), grow: 0 }),
      P('margo_medialis', 'bord médial', 'margo medialis ossis nasalis', { alt: ['bord interne', 'bord médial de l\'os nasal'],
        test: (t, B) => nasalRim(t, B) && F(B, 'na', t) < 2.5, grow: 0 }),
      P('margo_lateralis', 'bord latéral', 'margo lateralis ossis nasalis', { alt: ['bord maxillaire', 'bord latéral de l\'os nasal'],
        test: (t, B) => nasalRim(t, B) && F(B, 'mx', t) < 2.5, grow: 0 }),
      P('margo_inferior', 'bord inférieur', 'margo inferior ossis nasalis', { alt: ['bord libre', 'bord inférieur de l\'os nasal'],
        test: t => t.h < 0.1, grow: 0 }),
      P('facies_externa', 'face externe', 'facies externa ossis nasalis', { alt: ['face antérieure'],
        test: (t, B) => B.ndot(t, B.L.ne) > 0 }),
      P('facies_interna', 'face interne', 'facies interna ossis nasalis', { alt: ['face postérieure', 'face nasale'],
        test: () => true })
    ]
  });
  OS('os_lacrimale', 'R', null, {
    landmarks(B) {
      heightField(B);
      /* crete lacrymale posterieure : arete verticale la plus saillante de la face laterale */
      crest(B, 'cr', B.dir(-1, 0, 0), 0.12, 0.95, { field: 'hgt', bins: 14, filter: t => t.nm < -0.2 });
      /* position antero-posterieure de la crete, lissee le long de la hauteur */
      B.L.crz = h => { let s = 0; for (let d = -0.08; d < 0.09; d += 0.04) s += B.K.cr(h + d)[2]; return s / 5; };
      B.L.ham = B.ext(B.dir(-0.4, -1, 0.7));
    },
    parts: [
      P('hamulus_lacrimalis', 'hamulus lacrymal', 'hamulus lacrimalis', { alt: ['crochet lacrymal', 'hamulus de l\'os lacrymal'],
        test: (t, B) => B.d(t, B.L.ham) < 3.2, grow: 0 }),
      P('crista_lacrimalis_posterior', 'crête lacrymale postérieure', 'crista lacrimalis posterior', { alt: ['crête lacrymale'],
        test: (t, B) => t.nm < -0.2 && t.h > 0.1 && Math.abs(t.z - B.L.crz(t.h)) < 1.1, grow: 0 }),
      P('sulcus_lacrimalis', 'sillon lacrymal', 'sulcus lacrimalis ossis lacrimalis', { alt: ['sillon lacrymal de l\'os lacrymal', 'gouttière lacrymale'],
        test: (t, B) => t.nm < -0.2 && t.z > B.L.crz(t.h), grow: 0 }),
      P('facies_orbitalis', 'face orbitaire', 'facies orbitalis ossis lacrimalis', { alt: ['face latérale'],
        test: t => t.nm < -0.2 }),
      P('facies_nasalis', 'face nasale', 'facies nasalis ossis lacrimalis', { alt: ['face médiale'],
        test: () => true })
    ]
  });
  OS('os_palatinum', 'R', null, {
    landmarks(B) {
      B.L.orb = B.ext(B.dir(-0.3, 1, 0.6));
      B.L.sph = B.ext(B.dir(0.3, 1, -0.8));
      B.L.pyr = B.ext(B.dir(-1, -0.5, -1), t => t.h < 0.35);
    },
    parts: [
      P('processus_orbitalis', 'processus orbitaire', 'processus orbitalis ossis palatini', { alt: ['processus orbitaire de l\'os palatin'], old: ['apophyse orbitaire'],
        test: (t, B) => B.d(t, B.L.orb) < 5, grow: 0 }),
      P('processus_sphenoidalis', 'processus sphénoïdal', 'processus sphenoidalis ossis palatini', { alt: ['processus sphénoïdal de l\'os palatin'], old: ['apophyse sphénoïdale'],
        test: (t, B) => B.d(t, B.L.sph) < 4.5, grow: 0 }),
      P('processus_pyramidalis', 'processus pyramidal', 'processus pyramidalis ossis palatini', { alt: ['processus pyramidal de l\'os palatin'], old: ['apophyse pyramidale du palatin'],
        test: (t, B) => B.d(t, B.L.pyr) < 6, grow: 0 }),
      P('lamina_horizontalis', 'lame horizontale', 'lamina horizontalis ossis palatini', { alt: ['lame horizontale de l\'os palatin'],
        test: t => t.h < 0.2, grow: 0 }),
      P('lamina_perpendicularis', 'lame perpendiculaire', 'lamina perpendicularis ossis palatini', { alt: ['lame verticale', 'lame perpendiculaire de l\'os palatin'],
        test: () => true })
    ]
  });
  OS('vomer', null, null, {
    parts: [
      P('ala_vomeris', 'aile du vomer', 'ala vomeris', { alt: ['ailes du vomer'],
        test: t => t.h > 0.78 && t.a < 0.42, grow: 0 }),
      P('crista_choanalis', 'crête choanale du vomer', 'crista choanalis vomeris', { alt: ['bord postérieur du vomer', 'crête choanale'],
        test: t => t.a < 0.07, grow: 0 }),
      P('margo_inferior', 'bord inférieur', 'margo inferior vomeris', { alt: ['bord inférieur du vomer'],
        test: t => t.h < 0.06 || t.ny < -0.7, grow: 0 }),
      P('facies_lateralis', 'face latérale', 'facies lateralis vomeris', { alt: ['faces latérales du vomer', 'lame du vomer'],
        test: () => true })
    ]
  });
  OS('concha_nasalis_inferior', 'R', null, {
    landmarks(B) {
      B.L.lac = B.ext(B.dir(0, 1, 0.6), t => t.a > 0.55);
      B.L.max = B.ext(B.dir(-1, -0.2, 0), t => t.a > 0.3 && t.a < 0.7 && t.h > 0.3);
      B.L.eth = B.ext(B.dir(0.3, 1, -0.3), t => t.a > 0.2 && t.a < 0.5);
    },
    parts: [
      P('processus_lacrimalis', 'processus lacrymal', 'processus lacrimalis conchae', { alt: ['processus lacrymal du cornet inférieur'], old: ['apophyse lacrymale'],
        test: (t, B) => B.d(t, B.L.lac) < 3.5, grow: 0 }),
      P('processus_maxillaris', 'processus maxillaire', 'processus maxillaris conchae', { alt: ['processus maxillaire du cornet inférieur'], old: ['apophyse auriculaire'],
        test: (t, B) => B.d(t, B.L.max) < 4.5, grow: 0 }),
      P('processus_ethmoidalis', 'processus ethmoïdal', 'processus ethmoidalis conchae', { alt: ['processus ethmoïdal du cornet inférieur'], old: ['apophyse ethmoïdale'],
        test: (t, B) => B.d(t, B.L.eth) < 3.5, grow: 0 }),
      P('facies_medialis', 'face médiale', 'facies medialis conchae', { alt: ['face convexe', 'face interne'],
        test: t => t.nm > 0.15 }),
      P('facies_lateralis', 'face latérale', 'facies lateralis conchae', { alt: ['face concave', 'face externe'],
        test: () => true })
    ]
  });

  Object.assign(NS, { OSTEO, OSTEO_BY });
})(AQ.data);
