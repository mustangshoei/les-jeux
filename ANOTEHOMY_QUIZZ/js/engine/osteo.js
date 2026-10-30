/* ==========================================================================
   Anotehomy Quizz - engine/osteo.js
   OS ISOLE (jeu "Osteologie descriptive") : affiche un seul os, en haute
   resolution, decoupe en regions cliquables (une maille par region, toutes
   partageant les memes sommets : l'ombrage reste continu). Les os voisins
   peuvent rester visibles, tres estompes.
   ========================================================================== */
(function (NS) {
  'use strict';

  /* couleurs bien distinctes pour l'atlas (une par region) ; au-dela de 20 regions, teintes
     espacees de l'angle d'or avec une luminosite alternee */
  const PALETTE = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4',
    '#469990', '#dcbeff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9', '#ffe119'];
  for (let i = PALETTE.length; i < 40; i++) {
    PALETTE.push('hsl(' + Math.round((i * 137.508 + 20) % 360) + ', 70%, ' + [38, 58, 72][i % 3] + '%)');
  }
  let cur = null;

  /* ouvre un os : def = definition de js/data/osteology.js ; opts.neighbors : os voisins estompes */
  function openBone(def, opts = {}) {
    closeBone();
    const src = NS.osteoPart(def.bone, def.side, def.label);
    if (!src) throw new Error('Os détaillé introuvable : ' + def.bone);
    const seg = NS.segment({ positions: src.positions, indices: src.indices, tags: src.tags, side: def.side }, def);
    const M = seg.M;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(M.P, 3));
    geom.setIndex(new THREE.BufferAttribute(M.I, 1));
    geom.computeVertexNormals();
    const pos = geom.attributes.position, nrm = geom.attributes.normal;

    /* triangles de chaque region */
    const lists = def.parts.map(() => []);
    const stats = def.parts.map(() => ({ c: [0, 0, 0], n: [0, 0, 0], area: 0 }));
    for (let t = 0; t < M.nt; t++) {
      const r = seg.lab[t], s = stats[r], a = M.A[t];
      lists[r].push(M.I[3 * t], M.I[3 * t + 1], M.I[3 * t + 2]);
      for (let k = 0; k < 3; k++) { s.c[k] += M.C[3 * t + k] * a; s.n[k] += M.N[3 * t + k] * a; }
      s.area += a;
    }
    const group = new THREE.Group(), regions = [];
    def.parts.forEach((p, r) => {
      if (!lists[r].length) { console.warn('Osteologie : region vide', def.bone, p.id); return; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', pos);
      g.setAttribute('normal', nrm);
      g.setIndex(new THREE.BufferAttribute(new Uint32Array(lists[r]), 1));
      g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, NS.MAT.bone);
      const s = stats[r], c = s.c.map(v => v / s.area), nl = Math.hypot(s.n[0], s.n[1], s.n[2]) / s.area;
      const reg = { id: p.id, part: p, index: r, mesh, area: s.area,
        center: new THREE.Vector3(c[0], c[1], c[2]), radius: g.boundingSphere.radius,
        normal: s.n.map(v => v / (Math.hypot(s.n[0], s.n[1], s.n[2]) || 1)), facing: nl };
      mesh.userData.inst = reg;
      group.add(mesh);
      regions.push(reg);
    });
    const box = new THREE.Box3().setFromBufferAttribute(pos);
    const center = box.getCenter(new THREE.Vector3()), radius = box.getSize(new THREE.Vector3()).length() / 2;
    NS.clearMarks();
    NS.setHover(null);
    NS.addObject(group);
    cur = { def, regions, group, geom, box, center, radius, neighbors: !!opts.neighbors, atlas: false, seg };
    NS.isolate({ center, radius }, cur.neighbors);
    NS.setPick(regions.map(r => r.mesh));
    NS.setHidingAllowed(false);
    NS.setViewBox(box);
    return cur;
  }

  function closeBone() {
    if (!cur) return;
    NS.clearMarks();
    NS.setHover(null);
    NS.removeObject(cur.group);
    cur.regions.forEach(r => { r.mesh.geometry.dispose(); if (r.mesh.userData.atlasMat) r.mesh.userData.atlasMat.dispose(); });
    cur.geom.dispose();
    cur = null;
    NS.restoreSkeleton();
    NS.setPick(null);
    NS.setViewBox(null);
    NS.setHidingAllowed(true);
  }

  function setNeighbors(on) {
    if (!cur) return;
    cur.neighbors = !!on;
    NS.isolate({ center: cur.center, radius: cur.radius }, cur.neighbors);
  }

  /* atlas : chaque region dans sa couleur (apprentissage, verification) */
  function setAtlas(on) {
    if (!cur) return;
    cur.atlas = !!on;
    cur.regions.forEach(r => {
      if (!r.mesh.userData.atlasMat) {
        r.mesh.userData.atlasMat = new THREE.MeshStandardMaterial({ color: PALETTE[r.index % PALETTE.length], roughness: 0.6, metalness: 0 });
      }
      if (!NS.stateOf(r)) r.mesh.material = on ? r.mesh.userData.atlasMat : NS.MAT.bone;
    });
    NS.requestRender();
  }
  const regionColor = r => PALETTE[r.index % PALETTE.length];

  /* vue d'ensemble de l'os isole (orientation courante, ou vue predefinie) */
  function frameBone(opts) { NS.frameAll(opts); }

  /* cadre une region : elle est tournee vers l'observateur (sauf si elle l'est deja,
     ou si opts.keep : orientation conservee) et la camera se rapproche si la region
     est petite par rapport a l'os ; opts.turn : toujours tourner la region vers soi */
  function focusRegion(reg, opts = {}) {
    if (!cur) return;
    const c = NS.camera(), view = [c.position.x - NS.cam.target.x, c.position.y - NS.cam.target.y, c.position.z - NS.cam.target.z];
    const vl = Math.hypot(view[0], view[1], view[2]) || 1, vd = view.map(v => v / vl);
    let dir = vd;
    if (!opts.keep && reg.facing > 0.25) {
      const n = reg.normal, dot = n[0] * vd[0] + n[1] * vd[1] + n[2] * vd[2];
      if (opts.turn || dot < 0.55) dir = n;
    }
    const rr = Math.min(Math.max(reg.radius * 2.6, 32), cur.radius), k = 1 - rr / cur.radius;
    const s = 0.35 + 0.65 * k, b = cur.center, p = reg.center;
    const target = [b.x + (p.x - b.x) * s, b.y + (p.y - b.y) * s, b.z + (p.z - b.z) * s];
    NS.lookFrom(dir, target, NS.fitDistance(rr, 0.62), opts);
  }

  Object.assign(NS, {
    openBone, closeBone, setNeighbors, setAtlas, frameBone, focusRegion, regionColor,
    osteoCurrent: () => cur
  });
})(AQ.engine);
