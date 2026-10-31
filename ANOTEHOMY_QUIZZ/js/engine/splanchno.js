/* ==========================================================================
   Anotehomy Quizz - engine/splanchno.js
   ORGANE ISOLE (jeu "Splanchnologie descriptive") : un seul organe est
   affiche, decoupe en parties cliquables (js/data/splanchnology.js), a une
   taille commune quelle que soit sa taille reelle. Son modele est charge a
   la demande (js/data/splanchno/<cle>.js, tools/build-splanchno.ps1). Les
   parties qui en cachent une autre peuvent etre ecartees (Maj + clic).
   ========================================================================== */
(function (NS) {
  'use strict';

  /* un materiau par couleur, visible des deux cotes (nappes : ligaments, conjonctive) */
  const mats = {};
  const material = c => mats[c] || (mats[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0, side: THREE.DoubleSide }));

  /* chargement unique de chaque organe */
  const loading = {};
  const model = key => AQ.data.SPLANCHNO_MODEL && AQ.data.SPLANCHNO_MODEL[key];
  function loadOrgan(key) {
    if (!loading[key]) {
      loading[key] = (model(key) ? Promise.resolve() : NS.loadScript('js/data/splanchno/' + key + '.js'))
        .then(() => NS.decodeModel(model(key)))
        .catch(err => { delete loading[key]; throw err; });
    }
    return loading[key];
  }

  let cur = null;

  /* affiche l'organe def (js/data/splanchnology.js) a partir de ses parties decodees */
  function openOrgan(def, parts) {
    NS.deactivateMuscles(); NS.deactivateSystems();
    NS.closeBone();
    const group = new THREE.Group(), regions = [];
    parts.forEach(p => {
      const part = def.parts.find(x => x.id === p.bone);
      if (!part) return;
      const g = NS.makeGeometry(p.positions, p.indices);
      const rest = material(part.color || def.color);
      const mesh = new THREE.Mesh(g, rest);
      mesh.userData.rest = rest;
      /* vues ou la partie est visible et part visible en % (tools/build-splanchno.ps1, Visibility.cs) */
      const [views, pct] = String(p.label || '').split(';');
      const inst = { bone: part.id, side: null, label: null, part, index: def.parts.indexOf(part), mesh,
        center: g.boundingSphere.center.clone(), radius: g.boundingSphere.radius, box: g.boundingBox.clone(),
        best: views ? views.split(' ') : ['A'], vis: pct ? +pct : 100 };
      mesh.userData.inst = inst;
      group.add(mesh);
      regions.push(inst);
    });
    regions.sort((a, b) => a.index - b.index);
    const box = new THREE.Box3().setFromObject(group);
    NS.clearMarks(); NS.setHover(null); NS.showAll();
    NS.isolate({ center: new THREE.Vector3(), radius: 0 }, false);   /* squelette masque */
    NS.addObject(group);
    cur = { def, regions, group, box };
    NS.setPick(regions.map(r => r.mesh));
    NS.setPickMargin(4);
    NS.setViewBox(box);
    NS.setHidingAllowed(true);
    NS.setMarkPalette('organ');
    NS.setObjectWords('partie');
    NS.requestRender();
    return cur;
  }

  function closeOrgan() {
    if (!cur) return;
    NS.clearMarks(); NS.setHover(null);
    NS.showAll();                        /* parties masquees (Maj + clic) : liste videe */
    NS.removeObject(cur.group);
    cur.regions.forEach(r => r.mesh.geometry.dispose());
    cur = null;
    NS.restoreSkeleton();
    NS.setPick(null);
    NS.setPickMargin(0);
    NS.setViewBox(null);
    NS.setMarkPalette('default');
    NS.setObjectWords('os');
    NS.requestRender();
  }
  /* ferme avec les autres systemes (muscles, vaisseaux, organes : js/engine/systems.js) */
  NS.registerSystem({ deactivate: closeOrgan });

  Object.assign(NS, {
    loadOrgan, openOrgan, closeOrgan,
    splanchnoCurrent: () => cur,
    /* partie recouverte par d'autres : celles-ci sont masquees (js/engine/muscles.js, peelAmong) */
    peelParts: (inst, key) => cur ? NS.peelAmong(inst, key, cur.regions) : 0,
    partColor: r => '#' + (r.part.color || cur.def.color).toString(16).padStart(6, '0')
  });
})(AQ.engine);
