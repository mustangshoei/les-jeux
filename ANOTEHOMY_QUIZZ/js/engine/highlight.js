/* ==========================================================================
   Anotehomy Quizz - engine/highlight.js
   Etats visuels des os : cible (rouge pulsant), juste / revelation (vert),
   faux (rouge), survol. Un os marque recoit en plus :
     - une aura lumineuse (shader de Fresnel, visible meme a travers les os) ;
     - un remplissage "rayons X" de ses parties cachees derriere d'autres os ;
     - un halo pulsant a l'ecran tant qu'il reste petit (reperage).
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, clamp } = AQ.util;

  const halo = $('halo');
  const STATES = ['target', 'ok', 'ko', 'reveal'];
  const COLORS = { target: 0xff2f24, ko: 0xff2f24, ok: 0x2fe08a, reveal: 0x2fe08a };
  /* couleurs des marques : rouge sur les os ; bleu (cible) et orange (faux) sur les muscles ;
     survol : os rose franc (bien distinct de l'os blanc et du rouge de la cible), ou muscle rose pale ;
     dans les deux cas, avec un contour lumineux (hg : sa couleur) */
  const PALETTES = {
    default: { target: 0xff2f24, ko: 0xff2f24, ok: 0x2fe08a, mt: [0xff3a2f, 0xff1a0a], mk: [0xff3a2f, 0xc8150a], hv: [0xff8fb4, 0x9e1f52], hg: 0xff6f9c },
    muscle: { target: 0x2f8cff, ko: 0xffa31a, ok: 0x2fe08a, mt: [0x3d97ff, 0x0a4cff], mk: [0xffa31a, 0xb35f00], hv: [0xf4a898, 0x4a1c12], hg: 0xffd6c8 },
    /* vaisseaux (arteres rouges, veines bleues) : cible jaune, faux en violet, survol blanc */
    vessel: { target: 0xffd21f, ko: 0xd84dff, ok: 0x2fe08a, mt: [0xffd84a, 0xc79400], mk: [0xd84dff, 0x7a16a0], hv: [0xfff3e6, 0x6a5a48], hg: 0xffffff }
  };
  let hoverGlowColor = PALETTES.default.hg;
  function setMarkPalette(name) {
    const p = PALETTES[name] || PALETTES.default;
    COLORS.target = p.target; COLORS.ko = p.ko; COLORS.ok = COLORS.reveal = p.ok;
    NS.MAT.target.color.setHex(p.mt[0]); NS.MAT.target.emissive.setHex(p.mt[1]);
    NS.MAT.ko.color.setHex(p.mk[0]); NS.MAT.ko.emissive.setHex(p.mk[1]);
    NS.MAT.hover.color.setHex(p.hv[0]); NS.MAT.hover.emissive.setHex(p.hv[1]);
    hoverGlowColor = p.hg;
    document.body.classList.toggle('pal-muscle', name === 'muscle');
    document.body.classList.toggle('pal-vessel', name === 'vessel');
    NS.requestRender();
  }
  const marked = new Map();        /* instance -> { state, extras: [maillages] } */
  let hovered = null, hoverGlow = null, haloItem = null, haloKind = 'target';

  /* aura : contour lumineux qui suit la silhouette (Fresnel), additif, sans test de profondeur */
  function glowMaterial(color) {
    return new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(color) }, intensity: { value: 1 }, grow: { value: 1 } },
      vertexShader: [
        'uniform float grow;',
        'varying float vRim;',
        'void main() {',
        '  vec3 n = normalize(normalMatrix * normal);',
        '  vec4 mv = modelViewMatrix * vec4(position + normal * grow, 1.0);',
        '  vRim = 1.0 - abs(dot(n, normalize(-mv.xyz)));',
        '  gl_Position = projectionMatrix * mv;',
        '}'].join('\n'),
      fragmentShader: [
        'uniform vec3 color;',
        'uniform float intensity;',
        'varying float vRim;',
        'void main() {',
        '  float a = pow(vRim, 2.0) * intensity;',
        '  gl_FragColor = vec4(color * a, a);',
        '}'].join('\n'),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
    });
  }
  /* rayons X : ne dessine que les parties de l'os cachees par d'autres os */
  function xrayMaterial(color) {
    return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.42, depthWrite: false, depthFunc: THREE.GreaterDepth });
  }

  function addExtras(inst, state) {
    const color = COLORS[state], g = inst.mesh.geometry;
    const xray = new THREE.Mesh(g, xrayMaterial(color));
    const glow = new THREE.Mesh(g, glowMaterial(color));
    glow.material.uniforms.grow.value = clamp(inst.radius * 0.05, 0.6, 5);
    xray.renderOrder = 5;
    glow.renderOrder = 6;
    xray.raycast = glow.raycast = () => {};      /* jamais touches par le lancer de rayon */
    inst.mesh.add(xray, glow);
    return [xray, glow];
  }
  function removeExtras(entry, inst) {
    entry.extras.forEach(m => { inst.mesh.remove(m); m.material.dispose(); });
  }
  /* materiau "au repos" : os blanc, couleur de la region en mode atlas (osteologie),
     ou materiau propre a l'objet (muscle, tendon) */
  const restMaterial = inst => (inst.mesh.userData.atlasMat && NS.osteoCurrent() && NS.osteoCurrent().atlas) ? inst.mesh.userData.atlasMat
    : (inst.mesh.userData.rest || NS.MAT.bone);
  function baseMaterial(inst) { return inst === hovered ? NS.MAT.hover : restMaterial(inst); }

  /* state : 'target' | 'ok' | 'ko' | 'reveal' (accepte aussi l'ancien prefixe "st-") */
  function mark(inst, state) {
    state = String(state).replace(/^st-/, '');
    unmark(inst);
    if (inst === hovered) removeHoverGlow();     /* l'os marqué a sa propre aura */
    inst.mesh.material = state === 'target' ? NS.MAT.target : state === 'ko' ? NS.MAT.ko : NS.MAT.ok;
    marked.set(inst, { state, extras: addExtras(inst, state) });
    if (!inst.mesh.visible) NS.setHidden(inst, false);
    NS.requestRender();
  }
  function unmark(inst) {
    const e = marked.get(inst);
    if (!e) return;
    removeExtras(e, inst);
    marked.delete(inst);
    inst.mesh.material = baseMaterial(inst);
    NS.requestRender();
  }
  function clearMarks() { Array.from(marked.keys()).forEach(unmark); setHalo(null); }
  const stateOf = inst => { const e = marked.get(inst); return e ? 'st-' + e.state : undefined; };
  const markedItems = () => Array.from(marked.keys());

  function removeHoverGlow() {
    if (!hoverGlow) return;
    if (hoverGlow.parent) hoverGlow.parent.remove(hoverGlow);
    hoverGlow.material.dispose();
    hoverGlow = null;
  }

  /* survol (mode ciblage et revision) */
  let hoverEnabled = false;
  function setHoverEnabled(on) { hoverEnabled = !!on; if (!on) setHover(null); }
  function setHover(inst) {
    if (!hoverEnabled) inst = null;
    if (inst === hovered) return;
    const prev = hovered;
    hovered = inst;
    removeHoverGlow();
    if (prev && !marked.has(prev)) prev.mesh.material = restMaterial(prev);
    if (inst && !marked.has(inst)) {
      inst.mesh.material = NS.MAT.hover;
      /* contour lumineux de l'os survolé : on le repère même petit, ou serré entre d'autres os */
      hoverGlow = new THREE.Mesh(inst.mesh.geometry, glowMaterial(hoverGlowColor));
      hoverGlow.material.uniforms.grow.value = clamp(inst.radius * 0.06, 0.6, 5);
      hoverGlow.material.uniforms.intensity.value = 1.4;
      hoverGlow.renderOrder = 6;
      hoverGlow.raycast = () => {};
      inst.mesh.add(hoverGlow);
    }
    NS.canvas.classList.toggle('pointing', !!inst);
    NS.requestRender();
  }

  /* pulsation de la cible : renvoie true tant qu'il faut redessiner */
  function updateHighlight(now) {
    if (!marked.size) return false;
    const s = 0.5 + 0.5 * Math.sin(now / 1000 * 4.2);
    NS.MAT.target.emissiveIntensity = 0.35 + 0.45 * s;
    marked.forEach(e => {
      const g = e.extras[1].material.uniforms.intensity;
      g.value = e.state === 'target' ? 0.75 + 0.65 * s : 1.0;
    });
    return true;
  }

  /* ---------------- Halo a l'ecran ---------------- */
  function setHalo(inst, kind) {
    haloItem = inst || null;
    haloKind = kind === 'ok' ? 'ok' : 'target';
    halo.classList.toggle('ok', haloKind === 'ok');
    updateHalo();
  }
  function updateHalo() {
    const it = haloItem;
    if (!it || !it.mesh.visible) { halo.hidden = true; return; }
    const p = NS.project(it.center), rpx = NS.screenRadius(it.center, it.radius);
    if (!p.front || rpx > 70) { halo.hidden = true; return; }
    const r = Math.max(rpx + 10, 20);
    halo.style.left = p.x + 'px';
    halo.style.top = p.y + 'px';
    halo.style.width = halo.style.height = (2 * r) + 'px';
    halo.hidden = false;
  }

  Object.assign(NS, {
    mark, unmark, clearMarks, stateOf, markedItems, setHalo, updateHalo, updateHighlight, setMarkPalette,
    setHover, setHoverEnabled, haloKind: () => haloKind, STATES
  });
})(AQ.engine);
