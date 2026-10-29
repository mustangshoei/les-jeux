/* ==========================================================================
   Anotehomy Quizz - engine/segment.js
   DECOUPAGE D'UN OS EN REGIONS ANATOMIQUES
   --------------------------------------------------------------------------
   1. subdivision de Loop des maillages grossiers (os plus lisse a l'ecran,
      frontieres de regions plus fines) ;
   2. etiquetage des triangles par les regles de js/data/osteology.js
      (premiere regle vraie = region du triangle) et par des points-graines ;
   3. le reste de la surface est attribue a la region la plus proche en
      distance geodesique (croissance le long de la surface, Dijkstra) ;
   4. lissage des frontieres et suppression des petits ilots.
   Repere : x = gauche du sujet, y = haut, z = anterieur (mm).
   ========================================================================== */
(function (NS) {
  'use strict';

  /* ---------------- File de priorite (tas binaire, suppression paresseuse) ---------------- */
  function makeHeap() {
    const D = [], X = [];
    return {
      size: () => D.length,
      push(d, x) {
        D.push(d); X.push(x);
        let i = D.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (D[p] <= D[i]) break;
          const td = D[p]; D[p] = D[i]; D[i] = td;
          const tx = X[p]; X[p] = X[i]; X[i] = tx;
          i = p;
        }
      },
      pop(out) {
        out[0] = D[0]; out[1] = X[0];
        const ld = D.pop(), lx = X.pop();
        if (D.length) {
          D[0] = ld; X[0] = lx;
          let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = l + 1;
            let m = i;
            if (l < D.length && D[l] < D[m]) m = l;
            if (r < D.length && D[r] < D[m]) m = r;
            if (m === i) break;
            const td = D[m]; D[m] = D[i]; D[i] = td;
            const tx = X[m]; X[m] = X[i]; X[i] = tx;
            i = m;
          }
        }
        return out;
      }
    };
  }

  /* ---------------- Subdivision de Loop ---------------- */
  function subdivide(P, I, T) {
    const nv = P.length / 3, nt = I.length / 3;
    const key = (a, b) => a < b ? a * nv + b : b * nv + a;
    const emap = new Map(), EA = [], EB = [], EO1 = [], EO2 = [], EC = [];
    const te = new Int32Array(nt * 3);
    for (let t = 0; t < nt; t++) {
      for (let k = 0; k < 3; k++) {
        const a = I[3 * t + k], b = I[3 * t + (k + 1) % 3], c = I[3 * t + (k + 2) % 3];
        const kk = key(a, b);
        let e = emap.get(kk);
        if (e === undefined) { e = EA.length; emap.set(kk, e); EA.push(a); EB.push(b); EO1.push(c); EO2.push(-1); EC.push(1); }
        else { if (EC[e] === 1) EO2[e] = c; EC[e]++; }
        te[3 * t + k] = e;
      }
    }
    const ne = EA.length;
    const nbSum = new Float64Array(nv * 3), nbCnt = new Int32Array(nv);
    const bdSum = new Float64Array(nv * 3), bdCnt = new Int32Array(nv);
    for (let e = 0; e < ne; e++) {
      const a = EA[e], b = EB[e];
      for (let k = 0; k < 3; k++) { nbSum[3 * a + k] += P[3 * b + k]; nbSum[3 * b + k] += P[3 * a + k]; }
      nbCnt[a]++; nbCnt[b]++;
      if (EC[e] !== 2) {
        for (let k = 0; k < 3; k++) { bdSum[3 * a + k] += P[3 * b + k]; bdSum[3 * b + k] += P[3 * a + k]; }
        bdCnt[a]++; bdCnt[b]++;
      }
    }
    const NP = new Float32Array((nv + ne) * 3);
    /* sommets existants */
    for (let v = 0; v < nv; v++) {
      for (let k = 0; k < 3; k++) {
        const p = P[3 * v + k];
        if (bdCnt[v] === 2) NP[3 * v + k] = 0.75 * p + 0.125 * bdSum[3 * v + k];
        else if (bdCnt[v] > 0) NP[3 * v + k] = p;
        else {
          const n = nbCnt[v], beta = n === 3 ? 3 / 16 : 3 / (8 * n);
          NP[3 * v + k] = (1 - n * beta) * p + beta * nbSum[3 * v + k];
        }
      }
    }
    /* nouveaux sommets au milieu des aretes */
    for (let e = 0; e < ne; e++) {
      const a = EA[e], b = EB[e], o = 3 * (nv + e);
      for (let k = 0; k < 3; k++) {
        NP[o + k] = EC[e] === 2
          ? 0.375 * (P[3 * a + k] + P[3 * b + k]) + 0.125 * (P[3 * EO1[e] + k] + P[3 * EO2[e] + k])
          : 0.5 * (P[3 * a + k] + P[3 * b + k]);
      }
    }
    const NI = new Uint32Array(nt * 12), NT = T ? new Uint8Array(nt * 4) : null;
    for (let t = 0; t < nt; t++) {
      const a = I[3 * t], b = I[3 * t + 1], c = I[3 * t + 2];
      const ab = nv + te[3 * t], bc = nv + te[3 * t + 1], ca = nv + te[3 * t + 2];
      NI.set([a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca], 12 * t);
      if (NT) NT.fill(T[t], 4 * t, 4 * t + 4);
    }
    return { P: NP, I: NI, T: NT };
  }

  /* ---------------- Maillage d'analyse : centres, normales, aires, voisinage ---------------- */
  function analyse(P, I, T) {
    const nt = I.length / 3, nv = P.length / 3;
    const C = new Float32Array(nt * 3), N = new Float32Array(nt * 3), A = new Float32Array(nt);
    for (let t = 0; t < nt; t++) {
      const a = 3 * I[3 * t], b = 3 * I[3 * t + 1], c = 3 * I[3 * t + 2];
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
      const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      A[t] = l / 2;
      N[3 * t] = nx / l; N[3 * t + 1] = ny / l; N[3 * t + 2] = nz / l;
      for (let k = 0; k < 3; k++) C[3 * t + k] = (P[a + k] + P[b + k] + P[c + k]) / 3;
    }
    /* triangles voisins par arete partagee */
    const adj = new Int32Array(nt * 3).fill(-1), first = new Map();
    const link = (t, u) => { for (let k = 0; k < 3; k++) if (adj[3 * t + k] < 0) { adj[3 * t + k] = u; return; } };
    for (let t = 0; t < nt; t++) {
      for (let k = 0; k < 3; k++) {
        const a = I[3 * t + k], b = I[3 * t + (k + 1) % 3];
        const kk = a < b ? a * nv + b : b * nv + a;
        const u = first.get(kk);
        if (u === undefined) first.set(kk, t); else if (u >= 0) { link(t, u); link(u, t); first.set(kk, -1); }
      }
    }
    return { P, I, T, nt, nv, C, N, A, adj };
  }

  /* ---------------- Contexte d'un os : outils pour ecrire les regles ---------------- */
  function context(M, side) {
    const P = M.P, C = M.C, N = M.N, nt = M.nt;
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { if (P[i + k] < min[k]) min[k] = P[i + k]; if (P[i + k] > max[k]) max[k] = P[i + k]; }
    const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    const cen = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    /* cote medial : +x pour un os droit, -x pour un os gauche ; 0 pour un os impair (median) */
    const med = side === 'R' ? 1 : side === 'L' ? -1 : 0;
    const B = { M, side, med, min, max, size, cen, L: {}, F: {} };

    /* contexte d'un triangle, reutilise pour toutes les regles :
       x,y,z centre ; nx,ny,nz normale ; h hauteur (0 bas -> 1 haut) ;
       a (0 posterieur -> 1 anterieur) ; m (0 lateral -> 1 medial ; os impair : 1 sur la ligne mediane) ;
       lat = 1 - m ; nm composante medial de la normale ; el element BodyParts3D d'origine */
    const t = { i: 0, x: 0, y: 0, z: 0, nx: 0, ny: 0, nz: 0, h: 0, a: 0, m: 0, lat: 0, nm: 0, el: 0 };
    B.t = t;
    B.set = i => {
      t.i = i;
      t.x = C[3 * i]; t.y = C[3 * i + 1]; t.z = C[3 * i + 2];
      t.nx = N[3 * i]; t.ny = N[3 * i + 1]; t.nz = N[3 * i + 2];
      t.h = (t.y - min[1]) / size[1];
      t.a = (t.z - min[2]) / size[2];
      if (med > 0) { t.m = (t.x - min[0]) / size[0]; t.nm = t.nx; }
      else if (med < 0) { t.m = (max[0] - t.x) / size[0]; t.nm = -t.nx; }
      else { t.m = 1 - Math.abs(t.x - cen[0]) / (size[0] / 2); t.nm = t.x > cen[0] ? -t.nx : t.nx; }
      t.lat = 1 - t.m;
      t.el = M.T ? M.T[i] : 0;
      return t;
    };

    /* vecteurs (tableaux [x, y, z]) */
    const unit = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
    B.unit = unit;
    B.add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s, p[2] + v[2] * s];
    B.sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
    B.mix = (p, q, s) => [p[0] + (q[0] - p[0]) * s, p[1] + (q[1] - p[1]) * s, p[2] + (q[2] - p[2]) * s];
    B.dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    B.dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    /* direction anatomique : m vers le medial (os pair), s vers le haut, a vers l'avant */
    B.dir = (m, s, a) => unit([m * (med || 1), s, a]);
    /* direction brute du repere (x = gauche du sujet) */
    B.dxyz = (x, y, z) => unit([x, y, z]);
    /* point en coordonnees normalisees de la boite (m : 0 lateral -> 1 medial pour un os pair ;
       pour un os impair, m = fraction le long de x, de la droite vers la gauche du sujet) */
    B.at = (m, h, a) => [med < 0 ? max[0] - m * size[0] : min[0] + m * size[0], min[1] + h * size[1], min[2] + a * size[2]];
    /* distance du centre du triangle courant a un point ; produit scalaire avec une direction */
    B.d = (tt, p) => Math.hypot(tt.x - p[0], tt.y - p[1], tt.z - p[2]);
    B.proj = (tt, dir, origin) => (tt.x - (origin ? origin[0] : 0)) * dir[0] + (tt.y - (origin ? origin[1] : 0)) * dir[1] + (tt.z - (origin ? origin[2] : 0)) * dir[2];
    B.ndot = (tt, dir) => tt.nx * dir[0] + tt.ny * dir[1] + tt.nz * dir[2];

    /* triangle le plus proche d'un point */
    B.near = p => {
      let bi = 0, bd = Infinity;
      for (let i = 0; i < nt; i++) {
        const d = (C[3 * i] - p[0]) ** 2 + (C[3 * i + 1] - p[1]) ** 2 + (C[3 * i + 2] - p[2]) ** 2;
        if (d < bd) { bd = d; bi = i; }
      }
      return bi;
    };
    /* point extreme dans une direction (moyenne des triangles a moins de tol mm du maximum),
       parmi les triangles qui verifient filtre(t, B) */
    B.ext = (dir, filter, tol = 1.5) => {
      const d = unit(dir);
      let best = -Infinity;
      for (let i = 0; i < nt; i++) {
        B.set(i);
        if (filter && !filter(t, B)) continue;
        const v = t.x * d[0] + t.y * d[1] + t.z * d[2];
        if (v > best) best = v;
      }
      const s = [0, 0, 0];
      let n = 0;
      for (let i = 0; i < nt; i++) {
        B.set(i);
        if (filter && !filter(t, B)) continue;
        if (t.x * d[0] + t.y * d[1] + t.z * d[2] >= best - tol) { s[0] += t.x; s[1] += t.y; s[2] += t.z; n++; }
      }
      return n ? [s[0] / n, s[1] / n, s[2] / n] : B.cen.slice();
    };
    /* barycentre (pondere par l'aire) des triangles qui verifient un filtre */
    B.centroid = filter => {
      const s = [0, 0, 0];
      let w = 0;
      for (let i = 0; i < nt; i++) {
        B.set(i);
        if (filter && !filter(t, B)) continue;
        const a = M.A[i];
        s[0] += t.x * a; s[1] += t.y * a; s[2] += t.z * a; w += a;
      }
      return w ? [s[0] / w, s[1] / w, s[2] / w] : B.cen.slice();
    };
    /* sphere ajustee (moindres carres) aux triangles a moins de r mm d'un point
       (et qui verifient un filtre eventuel) : { c, r } */
    B.sphere = (p, r, filter) => {
      const S = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], R = [0, 0, 0, 0];
      let n = 0;
      for (let i = 0; i < nt; i++) {
        const x = C[3 * i], y = C[3 * i + 1], z = C[3 * i + 2];
        if ((x - p[0]) ** 2 + (y - p[1]) ** 2 + (z - p[2]) ** 2 > r * r) continue;
        if (filter && !filter(B.set(i), B)) continue;
        const row = [2 * x, 2 * y, 2 * z, 1], rhs = x * x + y * y + z * z, w = M.A[i];
        for (let a = 0; a < 4; a++) { R[a] += row[a] * rhs * w; for (let b = 0; b < 4; b++) S[a][b] += row[a] * row[b] * w; }
        n++;
      }
      if (n < 8) return { c: p.slice(), r: r / 2 };
      const s = solve(S, R);
      if (!s) return { c: p.slice(), r: r / 2 };
      return { c: [s[0], s[1], s[2]], r: Math.sqrt(Math.max(1, s[3] + s[0] * s[0] + s[1] * s[1] + s[2] * s[2])) };
    };
    /* champ de distance geodesique (le long de la surface) depuis un ou plusieurs points */
    B.field = (name, pts) => {
      const list = Array.isArray(pts[0]) ? pts : [pts];
      const dist = new Float64Array(nt).fill(Infinity), heap = makeHeap(), out = [0, 0];
      list.forEach(p => { const i = B.near(p); dist[i] = 0; heap.push(0, i); });
      while (heap.size()) {
        heap.pop(out);
        const d = out[0], u = out[1];
        if (d > dist[u]) continue;
        for (let k = 0; k < 3; k++) {
          const v = M.adj[3 * u + k];
          if (v < 0) continue;
          const nd = d + Math.hypot(C[3 * u] - C[3 * v], C[3 * u + 1] - C[3 * v + 1], C[3 * u + 2] - C[3 * v + 2]);
          if (nd < dist[v]) { dist[v] = nd; heap.push(nd, v); }
        }
      }
      B.F[name] = dist;
      return dist;
    };
    /* partage geodesique d'un domaine (triangles qui verifient filter) entre des points-graines :
       B.F[name][i] = indice de la graine la plus proche en restant dans le domaine (-1 sinon) */
    B.split = (name, filter, seeds) => {
      const inD = new Uint8Array(nt);
      for (let i = 0; i < nt; i++) inD[i] = filter(B.set(i), B) ? 1 : 0;
      const own = new Int16Array(nt).fill(-1), dist = new Float64Array(nt).fill(Infinity), heap = makeHeap(), out = [0, 0];
      seeds.forEach((p, s) => {
        let bi = -1, bd = Infinity;
        for (let i = 0; i < nt; i++) {
          if (!inD[i]) continue;
          const d = (C[3 * i] - p[0]) ** 2 + (C[3 * i + 1] - p[1]) ** 2 + (C[3 * i + 2] - p[2]) ** 2;
          if (d < bd) { bd = d; bi = i; }
        }
        if (bi >= 0) { dist[bi] = 0; own[bi] = s; heap.push(0, bi); }
      });
      while (heap.size()) {
        heap.pop(out);
        const d = out[0], u = out[1];
        if (d > dist[u]) continue;
        for (let k = 0; k < 3; k++) {
          const v = M.adj[3 * u + k];
          if (v < 0 || !inD[v]) continue;
          const nd = d + Math.hypot(C[3 * u] - C[3 * v], C[3 * u + 1] - C[3 * v + 1], C[3 * u + 2] - C[3 * v + 2]);
          if (nd < dist[v]) { dist[v] = nd; own[v] = own[u]; heap.push(nd, v); }
        }
      }
      B.F[name] = own;
      return own;
    };
    /* coordonnees normalisees d'un point (memes conventions que t.h, t.a, t.m) */
    B.hOf = p => (p[1] - min[1]) / size[1];
    B.aOf = p => (p[2] - min[2]) / size[2];
    B.mOf = p => med > 0 ? (p[0] - min[0]) / size[0] : med < 0 ? (max[0] - p[0]) / size[0] : 1 - Math.abs(p[0] - cen[0]) / (size[0] / 2);
    /* point de la surface le plus proche de p parmi les triangles qui verifient un filtre */
    B.surf = (p, filter) => {
      let bi = -1, bd = Infinity;
      for (let i = 0; i < nt; i++) {
        B.set(i);
        if (filter && !filter(t, B)) continue;
        const d = (t.x - p[0]) ** 2 + (t.y - p[1]) ** 2 + (t.z - p[2]) ** 2;
        if (d < bd) { bd = d; bi = i; }
      }
      return bi < 0 ? p.slice() : [C[3 * bi], C[3 * bi + 1], C[3 * bi + 2]];
    };
    /* plan principal (moindres carres) des triangles qui verifient un filtre : { c, n }
       n = vecteur propre de plus petite valeur propre de la covariance (os plats) */
    B.plane = filter => {
      const c = B.centroid(filter), S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let i = 0; i < nt; i++) {
        B.set(i);
        if (filter && !filter(t, B)) continue;
        const d = [t.x - c[0], t.y - c[1], t.z - c[2]], a = M.A[i];
        for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) S[r][k] += d[r] * d[k] * a;
      }
      const e = eigen3(S);
      return { c, n: e.vectors[0], axes: e.vectors, values: e.values };
    };
    /* relief d'un os plat et courbe (scapula, ilium, os du crane) : surface moyenne du second degre
       w = f(u, v) ajustee dans le repere du plan pl, en ecartant a chaque passe les saillies
       (ecart > trim mm : epine, processus, bords epais) ; B.F[name] = ecart signe w - f(u, v),
       positif du cote de pl.n. B.F[name + 'U'] et B.F[name + 'V'] : coordonnees dans le plan. */
    B.relief = (name, pl, trim = 5, passes = 5) => {
      const e1 = pl.axes[1], e2 = pl.axes[2], n = pl.n, c = pl.c, s = Math.max(size[0], size[1], size[2]) / 2;
      const U = new Float32Array(nt), V = new Float32Array(nt), W = new Float64Array(nt), R = new Float64Array(nt);
      for (let i = 0; i < nt; i++) {
        const dx = C[3 * i] - c[0], dy = C[3 * i + 1] - c[1], dz = C[3 * i + 2] - c[2];
        U[i] = dx * e1[0] + dy * e1[1] + dz * e1[2];
        V[i] = dx * e2[0] + dy * e2[1] + dz * e2[2];
        W[i] = dx * n[0] + dy * n[1] + dz * n[2];
        R[i] = W[i];
      }
      const row = (u, v) => [1, u, v, u * u, u * v, v * v];
      for (let pass = 0; pass < passes; pass++) {
        const S = [0, 1, 2, 3, 4, 5].map(() => [0, 0, 0, 0, 0, 0]), Q = [0, 0, 0, 0, 0, 0];
        const lim = pass ? trim : trim * 4;
        for (let i = 0; i < nt; i++) {
          if (Math.abs(R[i]) > lim) continue;
          const f = row(U[i] / s, V[i] / s), w = M.A[i];
          for (let a = 0; a < 6; a++) { Q[a] += f[a] * W[i] * w; for (let b = 0; b < 6; b++) S[a][b] += f[a] * f[b] * w; }
        }
        const k = solve(S, Q);
        if (!k) break;
        for (let i = 0; i < nt; i++) {
          const f = row(U[i] / s, V[i] / s);
          R[i] = W[i] - (k[0] * f[0] + k[1] * f[1] + k[2] * f[2] + k[3] * f[3] + k[4] * f[4] + k[5] * f[5]);
        }
      }
      B.F[name] = R;
      B.F[name + 'U'] = U;
      B.F[name + 'V'] = V;
      return R;
    };
    /* centre d'une cupule (acetabulum, cavite glenoidale, incisure...) : point ou convergent,
       au sens des moindres carres, les normales des triangles a moins de R mm qui le regardent
       (produit scalaire > k), affine en quelques passes depuis c0 ; { c, r } (r : rayon moyen) */
    B.cup = (c0, R, k = 0.6, passes = 8) => {
      let c = c0.slice();
      const at = (cc, fn) => {
        for (let i = 0; i < nt; i++) {
          const x = C[3 * i], y = C[3 * i + 1], z = C[3 * i + 2], dx = cc[0] - x, dy = cc[1] - y, dz = cc[2] - z;
          const d = Math.hypot(dx, dy, dz);
          if (d > R || d < 1e-6) continue;
          if ((N[3 * i] * dx + N[3 * i + 1] * dy + N[3 * i + 2] * dz) / d <= k) continue;
          fn(i, x, y, z, d);
        }
      };
      for (let p = 0; p < passes; p++) {
        const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], Q = [0, 0, 0];
        let w = 0;
        at(c, (i, x, y, z) => {
          const n = [N[3 * i], N[3 * i + 1], N[3 * i + 2]], P = [x, y, z], a = M.A[i];
          for (let u = 0; u < 3; u++) for (let v = 0; v < 3; v++) { const m = (u === v ? 1 : 0) - n[u] * n[v]; S[u][v] += m * a; Q[u] += m * P[v] * a; }
          w += a;
        });
        if (!w) break;
        const s = solve(S, Q);
        if (!s) break;
        c = s;
      }
      let rs = 0, w = 0;
      at(c, (i, x, y, z, d) => { rs += d * M.A[i]; w += M.A[i]; });
      return { c, r: w ? rs / w : R / 2, area: w };
    };
    /* meilleure cupule (plus grande surface tournee vers le centre, rayon dans [rMin, rMax])
       parmi plusieurs points de depart */
    B.bestCup = (starts, R, rMin, rMax, k = 0.6) => {
      let best = null;
      starts.forEach(s => {
        const cp = B.cup(s, R, k);
        if (cp.r >= rMin && cp.r <= rMax && (!best || cp.area > best.area)) best = cp;
      });
      return best || B.cup(starts[0], R, k);
    };
    /* parametre le long d'un axe p0 -> p1 (0 en p0, 1 en p1) et distance a cet axe */
    B.axis = (name, p0, p1) => {
      const u = B.sub(p1, p0), len = Math.hypot(u[0], u[1], u[2]) || 1, d = [u[0] / len, u[1] / len, u[2] / len];
      const s = new Float32Array(nt), r = new Float32Array(nt);
      for (let i = 0; i < nt; i++) {
        const w = [C[3 * i] - p0[0], C[3 * i + 1] - p0[1], C[3 * i + 2] - p0[2]];
        const k = w[0] * d[0] + w[1] * d[1] + w[2] * d[2];
        s[i] = k / len;
        r[i] = Math.hypot(w[0] - k * d[0], w[1] - k * d[1], w[2] - k * d[2]);
      }
      B.F[name] = s;
      B.F[name + 'R'] = r;
      return s;
    };
    return B;
  }

  /* valeurs et vecteurs propres d'une matrice symetrique 3 x 3 (methode de Jacobi),
     tries par valeur propre croissante */
  function eigen3(S) {
    const a = S.map(r => r.slice()), v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (let sweep = 0; sweep < 50; sweep++) {
      const off = Math.abs(a[0][1]) + Math.abs(a[0][2]) + Math.abs(a[1][2]);
      if (off < 1e-9) break;
      for (let p = 0; p < 2; p++) {
        for (let q = p + 1; q < 3; q++) {
          if (Math.abs(a[p][q]) < 1e-12) continue;
          const th = (a[q][q] - a[p][p]) / (2 * a[p][q]);
          const tt = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
          const c = 1 / Math.sqrt(tt * tt + 1), s = tt * c;
          for (let k = 0; k < 3; k++) {
            const akp = a[k][p], akq = a[k][q];
            a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq;
          }
          for (let k = 0; k < 3; k++) {
            const apk = a[p][k], aqk = a[q][k];
            a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk;
          }
          for (let k = 0; k < 3; k++) {
            const vkp = v[k][p], vkq = v[k][q];
            v[k][p] = c * vkp - s * vkq; v[k][q] = s * vkp + c * vkq;
          }
        }
      }
    }
    const order = [0, 1, 2].sort((i, j) => a[i][i] - a[j][j]);
    return { values: order.map(i => a[i][i]), vectors: order.map(i => [v[0][i], v[1][i], v[2][i]]) };
  }

  /* systeme lineaire n x n (pivot de Gauss) ; null si singulier */
  function solve(S, R) {
    const n = R.length, a = S.map((row, i) => row.concat([R[i]]));
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
      if (Math.abs(a[p][c]) < 1e-12) return null;
      [a[c], a[p]] = [a[p], a[c]];
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = a[r][c] / a[c][c];
        for (let k = c; k <= n; k++) a[r][k] -= f * a[c][k];
      }
    }
    return a.map((row, i) => row[n] / row[i]);
  }

  /* ---------------- Etiquetage ---------------- */
  function label(M, B, parts) {
    const nt = M.nt, C = M.C, adj = M.adj;
    const lab = new Int16Array(nt).fill(-1);
    /* 1. regles : la premiere vraie l'emporte */
    for (let i = 0; i < nt; i++) {
      const tt = B.set(i);
      for (let r = 0; r < parts.length; r++) {
        if (parts[r].test && parts[r].test(tt, B)) { lab[i] = r; break; }
      }
    }
    const testCounts = new Array(parts.length).fill(0);
    for (let i = 0; i < nt; i++) if (lab[i] >= 0) testCounts[lab[i]]++;
    /* 2. points-graines : triangle encore libre le plus proche de chaque point */
    parts.forEach((p, r) => {
      if (!p.seed) return;
      const pts = p.seed(B);
      (Array.isArray(pts[0]) ? pts : [pts]).forEach(q => {
        let bi = -1, bd = Infinity;
        for (let i = 0; i < nt; i++) {
          if (lab[i] >= 0) continue;
          const d = (C[3 * i] - q[0]) ** 2 + (C[3 * i + 1] - q[1]) ** 2 + (C[3 * i + 2] - q[2]) ** 2;
          if (d < bd) { bd = d; bi = i; }
        }
        if (bi >= 0) lab[bi] = r;
      });
    });
    /* 3. croissance geodesique depuis toutes les regions deja placees (poids "grow" par region ;
       grow = 0 : la region ne s'etend pas et sert de barriere). Une seconde passe, a poids egaux,
       attribue ce qui n'a ete atteint par aucune region en croissance. */
    /* Float64 : la distance stockee doit etre identique a celle placee dans la file */
    const dist = new Float64Array(nt), heap = makeHeap(), out = [0, 0];
    const growAll = w => {
      dist.fill(Infinity);
      for (let i = 0; i < nt; i++) if (lab[i] >= 0) { dist[i] = 0; if (w[lab[i]] > 0) heap.push(0, i); }
      while (heap.size()) {
        heap.pop(out);
        const d = out[0], u = out[1];
        if (d > dist[u]) continue;
        for (let k = 0; k < 3; k++) {
          const v = adj[3 * u + k];
          if (v < 0 || dist[v] === 0) continue;
          const nd = d + Math.hypot(C[3 * u] - C[3 * v], C[3 * u + 1] - C[3 * v + 1], C[3 * u + 2] - C[3 * v + 2]) / w[lab[u]];
          if (nd < dist[v]) { dist[v] = nd; lab[v] = lab[u]; heap.push(nd, v); }
        }
      }
    };
    growAll(parts.map(p => p.grow === undefined ? 1 : p.grow));
    const count = () => { const c = new Array(parts.length).fill(0); for (let i = 0; i < nt; i++) if (lab[i] >= 0) c[lab[i]]++; return c; };
    B.stats = { afterTests: testCounts, afterGrowth: count(), unreached: 0 };
    for (let i = 0; i < nt; i++) if (lab[i] < 0) B.stats.unreached++;
    if (B.stats.unreached) growAll(parts.map(() => 1));
    for (let i = 0; i < nt; i++) if (lab[i] < 0) lab[i] = 0;
    /* 4a. lissage : un triangle prend l'etiquette partagee par au moins 2 de ses 3 voisins */
    for (let pass = 0; pass < 2; pass++) {
      const next = lab.slice();
      for (let i = 0; i < nt; i++) {
        const a = adj[3 * i], b = adj[3 * i + 1], c = adj[3 * i + 2];
        if (a < 0 || b < 0 || c < 0) continue;
        const la = lab[a], lb = lab[b], lc = lab[c];
        if (la === lb && la !== lab[i]) next[i] = la;
        else if (la === lc && la !== lab[i]) next[i] = la;
        else if (lb === lc && lb !== lab[i]) next[i] = lb;
      }
      lab.set(next);
    }
    /* 4b. ilots : composante trop petite par rapport a la plus grande de sa region -> region voisine */
    const comp = new Int32Array(nt).fill(-1), sizes = [], compLab = [];
    for (let i = 0; i < nt; i++) {
      if (comp[i] >= 0) continue;
      const id = sizes.length, stack = [i];
      comp[i] = id;
      let n = 0;
      while (stack.length) {
        const u = stack.pop();
        n++;
        for (let k = 0; k < 3; k++) {
          const v = adj[3 * u + k];
          if (v >= 0 && comp[v] < 0 && lab[v] === lab[i]) { comp[v] = id; stack.push(v); }
        }
      }
      sizes.push(n);
      compLab.push(lab[i]);
    }
    const biggest = new Int32Array(parts.length);
    sizes.forEach((n, id) => { if (n > biggest[compLab[id]]) biggest[compLab[id]] = n; });
    for (let pass = 0; pass < 3; pass++) {
      let changed = false;
      for (let i = 0; i < nt; i++) {
        const id = comp[i];
        if (id < 0 || sizes[id] >= Math.max(6, 0.12 * biggest[lab[i]])) continue;
        const votes = {};
        for (let k = 0; k < 3; k++) {
          const v = adj[3 * i + k];
          if (v >= 0 && lab[v] !== lab[i]) votes[lab[v]] = (votes[lab[v]] || 0) + 1;
        }
        let best = -1, bv = 0;
        Object.keys(votes).forEach(l => { if (votes[l] > bv) { bv = votes[l]; best = +l; } });
        if (best >= 0) { lab[i] = best; comp[i] = -2; changed = true; }
      }
      if (!changed) break;
    }
    return lab;
  }

  /* Decoupe une partie { positions, indices, tags, side } selon une definition
     { landmarks(B), parts: [{ id, test(t, B), seed(B), grow }] }.
     Renvoie { M (maillage d'analyse, eventuellement subdivise), lab (region de chaque triangle), B }. */
  function segment(src, def) {
    let P = src.positions, I = src.indices instanceof Uint32Array ? src.indices : Uint32Array.from(src.indices), T = src.tags;
    /* niveaux de subdivision (x 4 triangles chacun, au plus 3) : viser au moins ~20 000 triangles,
       sans depasser ~64 000 quand un niveau de moins en donne deja 12 000 */
    const nt0 = I.length / 3;
    let levels = def.subdivide !== undefined ? def.subdivide : Math.max(0, Math.min(3, Math.ceil(Math.log(20000 / nt0) / Math.log(4))));
    if (def.subdivide === undefined && levels > 0 && nt0 * 4 ** levels > 64000 && nt0 * 4 ** (levels - 1) >= 12000) levels--;
    for (let k = 0; k < levels; k++) ({ P, I, T } = subdivide(P, I, T));
    const M = analyse(P, I, T);
    const B = context(M, src.side);
    if (def.landmarks) def.landmarks(B);
    const lab = label(M, B, def.parts);
    return { M, lab, B };
  }

  Object.assign(NS, { segment, subdivide });
})(AQ.engine);
