/* ==========================================================================
   Anotehomy Quizz - engine/muscles.js
   MUSCLES (jeu "Les muscles du corps humain") : modele Z-Anatomy charge a la
   demande (js/data/muscle-model.js), un objet cliquable par muscle et par
   cote du corps, squelette Z-Anatomy en decor (parfaitement aligne avec les
   muscles). Le squelette du jeu 1 est masque pendant ce jeu.
   ========================================================================== */
(function (NS) {
  'use strict';

  const MUSCLE_INST = [];   /* instances (un muscle, un cote) */
  const BY_MUSCLE = {};     /* par identifiant de muscle */
  let group = null, promise = null, active = false, box = null;

  function materials() {
    const std = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.6, metalness: 0 }, extra || {}));
    NS.MAT.muscle = std(0xa4473e, { roughness: 0.55 });
    NS.MAT.tendon = std(0xdcd3c2, { roughness: 0.45 });
    NS.MAT.skeleton = std(0xcfc3ab, { roughness: 0.8 });
  }

  /* vues ou le muscle est visible, calculees par tools/build-muscles.ps1 (Visibility.cs) :
     "P LG;64" -> best ['P', 'LG'], vis 64 (% du muscle visible au mieux, sans rien masquer) */
  function visibility(label) {
    const [views, pct] = String(label || '').split(';');
    return { best: views ? views.split(' ') : ['A'], vis: pct ? +pct : 100 };
  }

  function build(parts) {
    materials();
    group = new THREE.Group();
    group.visible = false;
    parts.forEach(p => {
      const g = NS.makeGeometry(p.positions, p.indices);
      if (p.kind !== 'b') {
        const m = new THREE.Mesh(g, NS.MAT.skeleton);
        m.raycast = () => {};          /* decor : jamais touche par le lancer de rayon */
        group.add(m);
        return;
      }
      const def = AQ.data.MUSCLE[p.bone];
      const rest = def && def.tendon ? NS.MAT.tendon : NS.MAT.muscle;
      const mesh = new THREE.Mesh(g, rest);
      mesh.userData.rest = rest;
      const s = g.boundingSphere, v = visibility(p.label);
      const inst = { bone: p.bone, muscle: true, side: p.side, label: null, mesh,
        center: s.center.clone(), radius: s.radius, box: g.boundingBox.clone(), best: v.best, vis: v.vis };
      mesh.userData.inst = inst;
      MUSCLE_INST.push(inst);
      (BY_MUSCLE[p.bone] = BY_MUSCLE[p.bone] || []).push(inst);
      group.add(mesh);
    });
    box = new THREE.Box3().setFromObject(group);
    NS.addObject(group);
  }

  /* muscle profond : masque les muscles qui le recouvrent vus depuis "key" (vue predefinie).
     Rayons paralleles a la direction de vue, vers des sommets de la face du muscle tournee
     vers l'observateur ; tout muscle touche avant le sommet est masque (Maj + clic automatique).
     Renvoie le nombre de muscles masques. */
  const DIRS = { A: [0, 0, 1], P: [0, 0, -1], LD: [-1, 0, 0], LG: [1, 0, 0], S: [0, 1, 0], I: [0, -1, 0] };
  const ray = new THREE.Raycaster();
  function peelFor(inst, key) {
    const d = DIRS[key];
    if (!d || !inst || !inst.muscle) return 0;
    const g = inst.mesh.geometry, pos = g.attributes.position, nrm = g.attributes.normal;
    const others = MUSCLE_INST.filter(m => m !== inst && m.mesh.visible).map(m => m.mesh);
    const dir = new THREE.Vector3(-d[0], -d[1], -d[2]), o = new THREE.Vector3(), p = new THREE.Vector3();
    const hide = new Set(), step = Math.max(1, Math.floor(pos.count / 90)), FAR = 1500;
    for (let i = 0; i < pos.count; i += step) {
      if (nrm.getX(i) * d[0] + nrm.getY(i) * d[1] + nrm.getZ(i) * d[2] < 0.2) continue;
      p.fromBufferAttribute(pos, i);
      o.set(p.x + d[0] * FAR, p.y + d[1] * FAR, p.z + d[2] * FAR);
      ray.set(o, dir);
      ray.far = FAR - 0.5;
      ray.intersectObjects(others, false).forEach(h => hide.add(h.object.userData.inst));
    }
    hide.forEach(m => NS.setHidden(m, true));
    return hide.size;
  }

  /* chargement unique (le fichier fait environ 3 Mo) */
  function loadMuscleModel() {
    if (!promise) {
      promise = (AQ.data.MUSCLE_MODEL ? Promise.resolve() : NS.loadScript('js/data/muscle-model.js'))
        .then(() => NS.decodeModel(AQ.data.MUSCLE_MODEL))
        .then(parts => { build(parts); return MUSCLE_INST; })
        .catch(err => { promise = null; throw err; });
    }
    return promise;
  }

  /* bascule vers les muscles : squelette du jeu 1 masque, muscles cliquables */
  function activateMuscles() {
    if (!group || active) return;
    active = true;
    NS.closeBone();
    NS.clearMarks(); NS.setHover(null);
    NS.showAll();
    NS.isolate({ center: new THREE.Vector3(), radius: 0 }, false);
    group.visible = true;
    NS.setPick(MUSCLE_INST.map(i => i.mesh));
    NS.setViewBox(box);
    NS.setHidingAllowed(true);
    NS.setMarkPalette('muscle');
    NS.setObjectWords('muscle');
    NS.requestRender();
  }
  /* retour au squelette du jeu 1 */
  function deactivateMuscles() {
    if (!active) return;
    active = false;
    NS.clearMarks(); NS.setHover(null);
    NS.showAll();                       /* muscles masques (Maj + clic) : liste videe */
    group.visible = false;
    NS.restoreSkeleton();
    NS.setPick(null);
    NS.setViewBox(null);
    NS.setMarkPalette('default');
    NS.setObjectWords('os');
    NS.requestRender();
  }

  Object.assign(NS, {
    MUSCLE_INST, loadMuscleModel, activateMuscles, deactivateMuscles, peelFor,
    musclesActive: () => active,
    musclesLoaded: () => MUSCLE_INST.length > 0,
    muscleInstances: id => BY_MUSCLE[id] || []
  });
})(AQ.engine);
