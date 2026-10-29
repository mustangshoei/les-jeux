/* ==========================================================================
   Anotehomy Quizz - engine/scene.js
   Scene Three.js : rendu WebGL, eclairage, materiaux, maillages des os,
   index des instances, os masques et boucle de rendu a la demande.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $ } = AQ.util;

  const canvas = $('view3d');
  const INST = [];      /* instances d'os cliquables */
  const BY_BONE = {};   /* BY_BONE[idOs] = [instances] */
  const PICK = [];      /* maillages testes par le lancer de rayon */
  const ALL = [];       /* tous les maillages du squelette (os + decor) */
  const MAT = {};       /* materiaux partages */
  const BOUNDS = new THREE.Box3();   /* squelette entier */
  const VIEW = new THREE.Box3();     /* zone de travail de la camera (squelette, ou os isole) */
  let renderer = null, scene = null, camera = null, keyLight = null, fillLight = null;
  let dirty = true, lastT = 0, ready = false;
  const hidden = new Set();

  function makeMaterials() {
    const std = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.72, metalness: 0 }, extra || {}));
    MAT.bone = std(0xe6dac2);
    MAT.hover = std(0xfff4d8, { emissive: 0x3a2e12, emissiveIntensity: 0.6 });
    MAT.target = std(0xff3a2f, { emissive: 0xff1a0a, emissiveIntensity: 0.5, roughness: 0.5 });
    MAT.ko = std(0xff3a2f, { emissive: 0xc8150a, emissiveIntensity: 0.35, roughness: 0.5 });
    MAT.ok = std(0x35d98a, { emissive: 0x0c8a4c, emissiveIntensity: 0.45, roughness: 0.5 });
    MAT.cartilage = std(0xa9c0d4, { roughness: 0.45, transparent: true, opacity: 0.8 });
    MAT.teeth = std(0xf6f2e8, { roughness: 0.35 });
    /* os voisins estompes autour d'un os isole (osteologie) */
    MAT.ghost = std(0x7f8db0, { roughness: 0.95, transparent: true, opacity: 0.09, depthWrite: false });
  }

  function initScene(parts) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 5, 20000);
    scene.add(camera);

    /* eclairage : ciel/sol + lumiere principale et contre-jour qui suivent la camera */
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x2c3350, 1.9));
    keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    fillLight = new THREE.DirectionalLight(0xbcd2ff, 0.9);
    scene.add(keyLight, keyLight.target, fillLight, fillLight.target);

    makeMaterials();
    const root = new THREE.Group();
    scene.add(root);
    parts.forEach(p => {
      const mat = p.kind === 'b' ? MAT.bone : (p.bone === 'cartilage' ? MAT.cartilage : MAT.teeth);
      const mesh = new THREE.Mesh(p.geometry, mat);
      mesh.userData.mat0 = mat;
      root.add(mesh);
      ALL.push(mesh);
      if (p.kind !== 'b') return;
      const s = p.geometry.boundingSphere;
      const inst = { bone: p.bone, side: p.side, label: p.label, mesh,
        center: s.center.clone(), radius: s.radius, box: p.geometry.boundingBox.clone() };
      mesh.userData.inst = inst;
      INST.push(inst);
      (BY_BONE[p.bone] = BY_BONE[p.bone] || []).push(inst);
      PICK.push(mesh);
    });
    BOUNDS.setFromObject(root);
    VIEW.copy(BOUNDS);
    new ResizeObserver(resize).observe(canvas.parentElement);
    resize();
    ready = true;
    requestAnimationFrame(frame);
  }

  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    requestRender();
  }

  /* les lumieres suivent le point de vue (eclairage constant quelle que soit la rotation) */
  const tmp = new THREE.Vector3();
  function placeLights() {
    const t = NS.cam ? NS.cam.target : BOUNDS.getCenter(tmp);
    keyLight.position.copy(camera.localToWorld(tmp.set(-900, 1200, 600)));
    keyLight.target.position.copy(t);
    fillLight.position.copy(camera.localToWorld(tmp.set(1100, -700, -200)));
    fillLight.target.position.copy(t);
  }

  /* boucle : ne redessine que si la camera bouge, si un os pulse ou si on l'a demande */
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (lastT || now)) / 1000);
    lastT = now;
    const moving = NS.updateCamera(dt, now);
    const pulsing = NS.updateHighlight(now);
    if (!(dirty || moving || pulsing)) return;
    dirty = false;
    placeLights();
    renderer.render(scene, camera);
    NS.updateHalo();
  }
  function requestRender() { dirty = true; }

  /* ---------------- Os masques (Maj + clic) ---------------- */
  function setHidden(inst, on) {
    inst.mesh.visible = !on;
    if (on) hidden.add(inst); else hidden.delete(inst);
    NS.onHiddenChange();
    requestRender();
  }
  function showAll() { Array.from(hidden).forEach(i => { i.mesh.visible = true; }); hidden.clear(); NS.onHiddenChange(); requestRender(); }

  /* ---------------- Os isole (osteologie) ---------------- */
  /* masque tout le squelette ; si neighbors, les maillages proches de "around"
     ({ center, radius }) restent visibles, estompes et non cliquables. L'os
     lui-meme (meme centre, meme taille) reste masque : il est remplace par sa
     version detaillee. */
  function isolate(around, neighbors) {
    ALL.forEach(m => {
      const s = m.geometry.boundingSphere, d = s.center.distanceTo(around.center);
      const same = d < around.radius * 0.25 && Math.abs(s.radius / around.radius - 1) < 0.3;
      const near = neighbors && !same && d < around.radius * 1.3 + s.radius + 25;
      m.visible = !!near;
      m.material = near ? MAT.ghost : m.userData.mat0;
    });
    requestRender();
  }
  function restoreSkeleton() {
    ALL.forEach(m => { m.visible = true; m.material = m.userData.mat0; });
    Array.from(hidden).forEach(i => { i.mesh.visible = false; });
    requestRender();
  }
  /* liste des maillages cliquables (os du squelette par defaut) */
  let pickDefault = null;
  function setPick(meshes) {
    if (!pickDefault) pickDefault = PICK.slice();
    PICK.length = 0;
    (meshes || pickDefault).forEach(m => PICK.push(m));
  }
  /* zone de travail de la camera */
  function setView(box) { VIEW.copy(box || BOUNDS); }
  function addObject(o) { scene.add(o); requestRender(); }
  function removeObject(o) { scene.remove(o); requestRender(); }
  /* rendu immediat (captures de verification) */
  function renderNow() { placeLights(); renderer.render(scene, camera); }

  Object.assign(NS, {
    INST, BY_BONE, PICK, MAT, BOUNDS, VIEW,
    initScene, requestRender, setHidden, showAll,
    isolate, restoreSkeleton, setPick, setViewBox: setView, addObject, removeObject, renderNow,
    isReady: () => ready,
    hiddenCount: () => hidden.size,
    camera: () => camera,
    renderInfo: () => renderer && renderer.info.render,   /* diagnostic */
    canvas,
    instancesOf: boneId => BY_BONE[boneId] || []
  });
})(AQ.engine);
