/* ==========================================================================
   Anotehomy Quizz - engine/vessels.js
   VAISSEAUX SANGUINS (jeu "Les vaisseaux sanguins") : modele Z-Anatomy charge
   a la demande (js/data/vessel-model.js), un objet cliquable par vaisseau et
   par cote du corps. Arteres en rouge, veines en bleu (circulation pulmonaire
   inversee, comme dans les atlas). Le coeur et le squelette Z-Anatomy sont en
   decor, en transparence : on voit les vaisseaux a travers les os (crane,
   bassin...). Le squelette du jeu 1 est masque pendant ce jeu.
   ========================================================================== */
(function (NS) {
  'use strict';

  const VESSEL_INST = [];   /* instances (un vaisseau, un cote) */
  const BY_VESSEL = {};     /* par identifiant de vaisseau */
  let group = null, promise = null, active = false, box = null;

  function materials() {
    const std = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.45, metalness: 0 }, extra || {}));
    NS.MAT.artery = std(0xc8322c, { emissive: 0x3a0806, emissiveIntensity: 0.6 });
    NS.MAT.vein = std(0x2f5bd0, { emissive: 0x081a40, emissiveIntensity: 0.6 });
    NS.MAT.heart = std(0xb4574c, { roughness: 0.6, transparent: true, opacity: 0.32, depthWrite: false });
    NS.MAT.ghostBone = std(0xeadfc8, { roughness: 0.9, transparent: true, opacity: 0.14, depthWrite: false });
  }

  /* vues ou le vaisseau est visible (tools/build-vessels.ps1, Visibility.cs), comme pour les muscles */
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
        const m = new THREE.Mesh(g, p.kind === 'c' ? NS.MAT.heart : NS.MAT.ghostBone);
        m.raycast = () => {};          /* decor : jamais touche par le lancer de rayon */
        m.renderOrder = p.kind === 'c' ? 2 : 1;
        group.add(m);
        return;
      }
      const def = AQ.data.VESSEL[p.bone];
      /* couleur du sang : rouge (oxygene) ou bleu ; inversee pour la circulation pulmonaire */
      const red = def && (def.type === 'a') !== def.pulmonary;
      const rest = red ? NS.MAT.artery : NS.MAT.vein;
      const mesh = new THREE.Mesh(g, rest);
      mesh.userData.rest = rest;
      const s = g.boundingSphere, v = visibility(p.label);
      const inst = { bone: p.bone, vessel: true, side: p.side, label: null, mesh,
        center: s.center.clone(), radius: s.radius, box: g.boundingBox.clone(), best: v.best, vis: v.vis };
      mesh.userData.inst = inst;
      VESSEL_INST.push(inst);
      (BY_VESSEL[p.bone] = BY_VESSEL[p.bone] || []).push(inst);
      group.add(mesh);
    });
    box = new THREE.Box3().setFromObject(group);
    NS.addObject(group);
  }

  /* vaisseau recouvert par d'autres (veine contre son artere...) : ceux-ci sont masques */
  const peelFor = (inst, key) => NS.peelAmong(inst, key, VESSEL_INST);

  /* chargement unique (le fichier fait environ 2,4 Mo) */
  function loadVesselModel() {
    if (!promise) {
      promise = (AQ.data.VESSEL_MODEL ? Promise.resolve() : NS.loadScript('js/data/vessel-model.js'))
        .then(() => NS.decodeModel(AQ.data.VESSEL_MODEL))
        .then(parts => { build(parts); return VESSEL_INST; })
        .catch(err => { promise = null; throw err; });
    }
    return promise;
  }

  /* bascule vers les vaisseaux : squelette du jeu 1 masque, vaisseaux cliquables (avec une marge :
     ils sont fins) */
  function activateVessels() {
    if (!group || active) return;
    NS.deactivateMuscles();
    active = true;
    NS.closeBone();
    NS.clearMarks(); NS.setHover(null);
    NS.showAll();
    NS.isolate({ center: new THREE.Vector3(), radius: 0 }, false);
    group.visible = true;
    NS.setPick(VESSEL_INST.map(i => i.mesh));
    NS.setPickMargin(8);
    NS.setViewBox(box);
    NS.setHidingAllowed(true);
    NS.setMarkPalette('vessel');
    NS.setObjectWords('vaisseau');
    NS.requestRender();
  }
  /* types de vaisseaux affichés : 'av' (tous), 'a' (artères seules) ou 'v' (veines seules). Les autres
     sont cachés et ne sont plus cliquables (« Tout afficher » ne les fait pas réapparaître). */
  function setVesselTypes(types) {
    const shown = [];
    VESSEL_INST.forEach(i => {
      const ok = String(types || 'av').includes(AQ.data.VESSEL[i.bone].type);
      i.mesh.visible = ok;
      if (ok) shown.push(i.mesh);
    });
    if (active) NS.setPick(shown);
    NS.requestRender();
  }

  /* retour au squelette du jeu 1 */
  function deactivateVessels() {
    if (!active) return;
    setVesselTypes('av');
    active = false;
    NS.clearMarks(); NS.setHover(null);
    NS.showAll();                       /* vaisseaux masques (Maj + clic) : liste videe */
    group.visible = false;
    NS.restoreSkeleton();
    NS.setPick(null);
    NS.setPickMargin(0);
    NS.setViewBox(null);
    NS.setMarkPalette('default');
    NS.setObjectWords('os');
    NS.requestRender();
  }

  Object.assign(NS, {
    VESSEL_INST, loadVesselModel, activateVessels, deactivateVessels, setVesselTypes, peelVessels: peelFor,
    vesselsActive: () => active,
    vesselsLoaded: () => VESSEL_INST.length > 0,
    vesselInstances: id => BY_VESSEL[id] || []
  });
})(AQ.engine);
