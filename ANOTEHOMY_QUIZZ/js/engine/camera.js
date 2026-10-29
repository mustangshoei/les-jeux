/* ==========================================================================
   Anotehomy Quizz - engine/camera.js
   Camera orbitale : rotation autour d'un point cible, deplacement, zoom vers
   le curseur, amortissement, vols animes et vues predefinies.
   Repere du modele : x = gauche du sujet, y = haut, z = anterieur (mm).
   Angles : theta = azimut (0 = vue anterieure), phi = elevation.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { lerp, clamp, ease } = AQ.util;
  const { BONE } = AQ.data;

  /* vues predefinies : [theta, phi] */
  const VIEW_ANGLES = { A: [0, 0], P: [Math.PI, 0], LD: [-Math.PI / 2, 0], LG: [Math.PI / 2, 0], S: [0, 1.45], I: [0, -1.45] };
  const VIEW_NAMES = { A: 'anterieure', P: 'posterieure', LD: 'laterale droite', LG: 'laterale gauche', S: 'superieure', I: 'inferieure' };
  const PHI_MAX = 1.5;

  const cam = { target: new THREE.Vector3(), r: 3000, theta: 0, phi: 0 };    /* etat courant */
  const goal = { target: new THREE.Vector3(), r: 3000, theta: 0, phi: 0 };   /* etat vise (amorti) */
  let anim = null, preset = 'A';

  const wrapPi = a => Math.atan2(Math.sin(a), Math.cos(a));
  const halfFov = () => {
    const c = NS.camera(), v = THREE.MathUtils.degToRad(c.fov) / 2;
    return Math.min(v, Math.atan(Math.tan(v) * c.aspect));
  };
  /* distance pour qu'une sphere de rayon rr occupe une fraction "fill" de l'ecran */
  const fitDistance = (rr, fill) => rr / Math.sin(halfFov()) / fill;
  const minR = () => 30;
  const maxR = () => fitDistance(NS.VIEW.getSize(new THREE.Vector3()).length() / 2, 0.35);

  function copyState(dst, src) { dst.target.copy(src.target); dst.r = src.r; dst.theta = src.theta; dst.phi = src.phi; }

  function apply() {
    const c = NS.camera(), cp = Math.cos(cam.phi);
    c.position.set(
      cam.target.x + cam.r * cp * Math.sin(cam.theta),
      cam.target.y + cam.r * Math.sin(cam.phi),
      cam.target.z + cam.r * cp * Math.cos(cam.theta));
    c.up.set(0, 1, 0);
    c.lookAt(cam.target);
    const near = Math.max(1, cam.r / 120), far = cam.r * 4 + 4000;
    if (Math.abs(c.near - near) > near * 0.2 || c.far !== far) { c.near = near; c.far = far; c.updateProjectionMatrix(); }
  }

  /* appele a chaque image par la boucle de rendu ; renvoie true si la camera bouge */
  function updateCamera(dt, now) {
    if (anim) {
      const a = anim, t = Math.min(1, (now - a.t0) / a.dur), e = ease(t);
      cam.r = Math.exp(lerp(Math.log(a.from.r), Math.log(a.to.r), e) + a.bump * Math.sin(Math.PI * e));
      /* sans recul, la cible glisse en ligne droite a l'ecran pendant le zoom */
      let u = e;
      if (!a.bump && Math.abs(Math.log(a.to.r / a.from.r)) > 0.15) u = (cam.r - a.from.r) / (a.to.r - a.from.r);
      cam.target.lerpVectors(a.from.target, a.to.target, u);
      cam.theta = lerp(a.from.theta, a.to.theta, e);
      cam.phi = lerp(a.from.phi, a.to.phi, e);
      if (t >= 1) { copyState(cam, a.to); copyState(goal, a.to); anim = null; if (a.done) a.done(); }
      apply();
      return true;
    }
    const k = 1 - Math.exp(-dt * 14);
    const moving = Math.abs(goal.theta - cam.theta) > 1e-4 || Math.abs(goal.phi - cam.phi) > 1e-4 ||
      Math.abs(Math.log(goal.r / cam.r)) > 1e-4 || goal.target.distanceToSquared(cam.target) > 1e-4;
    if (moving) {
      cam.theta = lerp(cam.theta, goal.theta, k);
      cam.phi = lerp(cam.phi, goal.phi, k);
      cam.r = Math.exp(lerp(Math.log(cam.r), Math.log(goal.r), k));
      cam.target.lerp(goal.target, k);
    }
    apply();
    return moving;
  }

  /* ---------------- Vols animes ---------------- */
  function flyTo(dest, opts = {}) {
    const to = { target: dest.target.clone(), r: clamp(dest.r, minR(), maxR()),
      theta: cam.theta + wrapPi(dest.theta - cam.theta), phi: clamp(dest.phi, -PHI_MAX, PHI_MAX) };
    const from = { target: cam.target.clone(), r: cam.r, theta: cam.theta, phi: cam.phi };
    const d = from.target.distanceTo(to.target);
    /* recul en milieu de trajet si la destination est hors champ */
    const span = 2 * Math.tan(halfFov()) * 0.8;
    const rFit = d / span, bump = rFit > Math.max(from.r, to.r) ? Math.log(rFit / Math.max(from.r, to.r)) * 0.7 : 0;
    const turn = Math.abs(to.theta - from.theta) + Math.abs(to.phi - from.phi);
    const dur = opts.dur || clamp(600 + turn * 260 + Math.abs(Math.log(to.r / from.r)) * 170 + bump * 300, 650, 1500);
    anim = { from, to, bump, t0: performance.now(), dur, done: opts.done };
    NS.requestRender();
  }
  function stopMotion() { anim = null; copyState(goal, cam); }

  /* ---------------- Vues ---------------- */
  function setActiveButton(key) {
    preset = key;
    document.querySelectorAll('.views button').forEach(b => b.classList.toggle('on', b.dataset.view === key));
  }
  /* vue predefinie la plus proche de l'orientation courante */
  function view() {
    if (preset) return preset;
    if (cam.phi > 0.9) return 'S';
    if (cam.phi < -0.9) return 'I';
    const t = wrapPi(cam.theta);
    if (Math.abs(t) <= Math.PI / 4) return 'A';
    if (Math.abs(t) >= 3 * Math.PI / 4) return 'P';
    return t < 0 ? 'LD' : 'LG';
  }
  /* rotation vers une vue predefinie autour du point cible courant */
  function setView(key, opts = {}) {
    if (!VIEW_ANGLES[key]) return;
    setActiveButton(key);
    const [theta, phi] = VIEW_ANGLES[key];
    flyTo({ target: opts.target || cam.target, r: opts.r || cam.r, theta, phi }, opts);
  }
  /* code de vue des donnees (A, P, L, S, I) -> vue reelle ; "L" depend du cote de l'os */
  const viewFor = (inst, code) => code === 'L' ? (inst && inst.side === 'L' ? 'LG' : 'LD') : code;
  /* vues ou l'objet est le mieux visible : celles de l'instance (muscles), sinon celles de l'os */
  function bestViews(inst) {
    const b = BONE[inst.bone];
    return (inst.best || (b && b.best) || ['A']).map(c => viewFor(inst, c));
  }

  /* cadre un os : vue courante si elle convient (ou si opts.keep), sinon sa meilleure vue ;
     renvoie la vue retenue (null si l'orientation courante est conservee hors vue predefinie) */
  function focusInstance(inst, opts = {}) {
    const cands = bestViews(inst), cur = view();
    const key = opts.view || (opts.keep || cands.includes(cur) ? cur : cands[0]);
    const keep = key === cur && !opts.view;
    const [theta, phi] = keep ? [cam.theta, cam.phi] : VIEW_ANGLES[key];
    if (!keep) setActiveButton(key);
    flyTo({ target: inst.center, r: fitDistance(Math.max(inst.radius, 45), 0.42), theta, phi }, opts);
    return key;
  }
  /* vue d'ensemble : le squelette entier tient entre la consigne (haut)
     et la barre de commandes (bas), qui sont superposees a la scene */
  const PAD_TOP = 64, PAD_BOTTOM = 76;
  function overview() {
    const size = NS.VIEW.getSize(new THREE.Vector3()), c = NS.camera(), h = NS.canvas.clientHeight || 1;
    const usable = Math.max(0.5, (h - PAD_TOP - PAD_BOTTOM) / h);
    const tv = Math.tan(THREE.MathUtils.degToRad(c.fov) / 2), th = tv * c.aspect;
    const depth = Math.max(size.x, size.z);
    const r = Math.max(size.y * 0.51 / (tv * usable), depth * 0.58 / th) + depth / 2;
    /* decalage vertical pour centrer dans la zone utile */
    const target = NS.VIEW.getCenter(new THREE.Vector3());
    target.y += (PAD_TOP - PAD_BOTTOM) / 2 * (2 * (r - depth / 2) * tv / h);
    return { target, r };
  }
  function frameAll(opts = {}) {
    const key = opts.view || null;
    if (key) setActiveButton(key);
    const [theta, phi] = key ? VIEW_ANGLES[key] : [cam.theta, cam.phi];
    const o = overview();
    flyTo({ target: o.target, r: o.r, theta, phi }, opts);
  }

  /* ---------------- Commandes directes (souris, tactile, clavier) ---------------- */
  function rotateBy(dTheta, dPhi) {
    anim = null;
    if (preset) setActiveButton(null);
    goal.theta += dTheta;
    goal.phi = clamp(goal.phi + dPhi, -PHI_MAX, PHI_MAX);
    NS.requestRender();
  }
  function clampTarget(v) {
    const b = NS.VIEW, m = Math.min(150, NS.VIEW.getSize(new THREE.Vector3()).length() * 0.3);
    v.set(clamp(v.x, b.min.x - m, b.max.x + m), clamp(v.y, b.min.y - m, b.max.y + m), clamp(v.z, b.min.z - m, b.max.z + m));
  }
  function panBy(dx, dy) {
    anim = null;
    const c = NS.camera(), h = NS.canvas.clientHeight || 1;
    const wpp = 2 * cam.r * Math.tan(THREE.MathUtils.degToRad(c.fov) / 2) / h;
    const right = new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 1);
    goal.target.addScaledVector(right, -dx * wpp).addScaledVector(up, dy * wpp);
    clampTarget(goal.target);
    NS.requestRender();
  }
  const ray = new THREE.Raycaster();
  /* zoom vers le point sous le curseur (px, py en pixels dans le canevas) */
  function zoomAt(factor, px, py) {
    anim = null;
    const c = NS.camera(), w = NS.canvas.clientWidth || 1, h = NS.canvas.clientHeight || 1;
    const r1 = clamp(goal.r * factor, minR(), maxR());
    ray.setFromCamera(new THREE.Vector2(px / w * 2 - 1, -(py / h) * 2 + 1), c);
    const n = new THREE.Vector3().subVectors(c.position, cam.target).normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, goal.target);
    const p = new THREE.Vector3();
    if (ray.ray.intersectPlane(plane, p)) {
      goal.target.sub(p).multiplyScalar(r1 / goal.r).add(p);
      clampTarget(goal.target);
    }
    goal.r = r1;
    NS.requestRender();
  }

  /* projection d'un point 3D en pixels du canevas */
  function project(v) {
    const p = v.clone().project(NS.camera());
    return { x: (p.x + 1) / 2 * NS.canvas.clientWidth, y: (1 - p.y) / 2 * NS.canvas.clientHeight, front: p.z < 1 };
  }
  /* rayon a l'ecran (px) d'une sphere de rayon rr centree en v */
  function screenRadius(v, rr) {
    const c = NS.camera(), d = Math.max(1, c.position.distanceTo(v));
    return rr / (d * Math.tan(THREE.MathUtils.degToRad(c.fov) / 2)) * NS.canvas.clientHeight / 2;
  }

  /* oriente la camera pour que la direction "dir" (vecteur unitaire, du centre de
     l'os vers l'observateur) fasse face a l'ecran, en cadrant { target, r } */
  function lookFrom(dir, target, r, opts = {}) {
    const theta = Math.atan2(dir[0], dir[2]), phi = clamp(Math.asin(clamp(dir[1], -1, 1)), -1.3, 1.3);
    setActiveButton(null);
    flyTo({ target: new THREE.Vector3(target[0], target[1], target[2]), r, theta, phi }, opts);
  }
  /* saut immediat (sans animation) : captures de verification */
  function jumpTo(state) {
    anim = null;
    if (state.target) cam.target.copy(state.target);
    if (state.r) cam.r = state.r;
    if (state.theta !== undefined) cam.theta = state.theta;
    if (state.phi !== undefined) cam.phi = state.phi;
    copyState(goal, cam);
    apply();
  }

  /* placement initial : squelette entier en vue anterieure */
  function initCamera() {
    const o = overview();
    cam.target.copy(o.target);
    cam.r = o.r;
    cam.theta = 0; cam.phi = 0;
    copyState(goal, cam);
    apply();
    setActiveButton('A');
  }

  Object.assign(NS, {
    cam, VIEW_NAMES, updateCamera, initCamera, flyTo, stopMotion, view, setView, focusInstance, frameAll,
    rotateBy, panBy, zoomAt, project, screenRadius, bestViews, lookFrom, jumpTo, fitDistance, overview
  });
})(AQ.engine);
