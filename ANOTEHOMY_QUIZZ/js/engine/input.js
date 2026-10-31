/* ==========================================================================
   Anotehomy Quizz - engine/input.js
   Interactions sur la scene 3D :
     glisser (bouton gauche / 1 doigt)        rotation
     clic droit glisse / Ctrl + glisser / 2 doigts   deplacement
     molette / pincement                       zoom vers le curseur
     clic                                      selection d'un os
     Maj + clic                                masquer un os genant
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, clamp } = AQ.util;

  const canvas = NS.canvas;
  const hooks = { onBoneClick: null, onHover: null };
  const pointers = new Map();
  const ray = new THREE.Raycaster();
  let drag = null, pinch = null, hoverEvt = null, hidingAllowed = true, margin = 0;

  const local = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  /* lancer de rayon : premier os visible sous le pointeur */
  function pickAt(px, py, list) {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    ray.setFromCamera(new THREE.Vector2(px / w * 2 - 1, -(py / h) * 2 + 1), NS.camera());
    const hits = ray.intersectObjects(list, false);
    return hits.length ? { inst: hits[0].object.userData.inst, point: hits[0].point } : null;
  }
  /* objets fins (vaisseaux) : marge en pixels ; à côté de l'objet, on essaie des cercles de plus en
     plus grands autour du pointeur (8 directions), et le plus proche l'emporte */
  const DIRS8 = [[1, 0], [0.7, 0.7], [0, 1], [-0.7, 0.7], [-1, 0], [-0.7, -0.7], [0, -1], [0.7, -0.7]];
  function pick(px, py) {
    const list = NS.PICK.filter(m => m.visible);
    const hit = pickAt(px, py, list);
    if (hit || !margin) return hit;
    for (let r = 3; r <= margin; r += 3) {
      for (const [dx, dy] of DIRS8) {
        const h = pickAt(px + dx * r, py + dy * r, list);
        if (h) return h;
      }
    }
    return null;
  }

  function twoFingers() {
    const [a, b] = Array.from(pointers.values());
    return { d: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function onDown(e) {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, local(e));
    NS.stopMotion();
    if (pointers.size === 1) {
      const p = local(e);
      const pan = e.button === 2 || e.button === 1 || e.ctrlKey || e.metaKey;
      drag = { x: p.x, y: p.y, sx: p.x, sy: p.y, mode: pan ? 'pan' : 'rotate', moved: false, shift: e.shiftKey, button: e.button };
    } else if (pointers.size === 2) {
      pinch = twoFingers();
      if (drag) drag.moved = true;
    }
  }

  function onMove(e) {
    if (!pointers.has(e.pointerId)) {
      /* survol : un seul lancer de rayon par image */
      if (e.pointerType !== 'touch') { if (!hoverEvt) requestAnimationFrame(doHover); hoverEvt = e; }
      return;
    }
    const p = local(e);
    pointers.set(e.pointerId, p);
    if (pointers.size === 1 && drag) {
      const dx = p.x - drag.x, dy = p.y - drag.y;
      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > 5) {
        drag.moved = true;
        canvas.classList.add('dragging');
        NS.setHover(null);
        if (hooks.onHover) hooks.onHover(null);
      }
      if (drag.moved) {
        if (drag.mode === 'rotate') NS.rotateBy(-dx * 0.0062, dy * 0.0062);
        else NS.panBy(dx, dy);
      }
      drag.x = p.x; drag.y = p.y;
    } else if (pointers.size === 2 && pinch) {
      const t = twoFingers();
      NS.zoomAt(pinch.d / t.d, t.x, t.y);
      NS.panBy(t.x - pinch.x, t.y - pinch.y);
      pinch = t;
    }
  }

  function onUp(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size === 0) {
      canvas.classList.remove('dragging');
      if (drag && !drag.moved && e.type === 'pointerup' && drag.button === 0) {
        const p = local(e), hit = pick(p.x, p.y);
        if (hit && (drag.shift || e.shiftKey) && hidingAllowed) { NS.setHidden(hit.inst, true); NS.setHover(null); }
        else if (hit && hooks.onBoneClick) hooks.onBoneClick(hit.inst, hit.point);
      }
      drag = null; pinch = null;
    } else if (pointers.size === 1) {
      /* fin de pincement : on continue a tourner avec le doigt restant */
      const p = Array.from(pointers.values())[0];
      drag = { x: p.x, y: p.y, sx: p.x, sy: p.y, mode: 'rotate', moved: true, shift: false, button: 0 };
      pinch = null;
    }
  }

  function doHover() {
    const e = hoverEvt;
    hoverEvt = null;
    if (!e || pointers.size) return;
    const p = local(e), hit = pick(p.x, p.y);
    NS.setHover(hit ? hit.inst : null);
    if (hooks.onHover) hooks.onHover(hit ? hit.inst : null, e);
  }

  function onWheel(e) {
    e.preventDefault();
    const p = local(e), dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
    NS.zoomAt(Math.exp(clamp(dy, -300, 300) * 0.0016), p.x, p.y);
  }

  /* mots de l'interface selon les objets cliquables : os (squelette) ou muscles */
  const WORDS = {
    os: { one: ' os masqué', many: ' os masqués', pick: 'Choisir un os', hide: 'Masquer un os' },
    muscle: { one: ' muscle masqué', many: ' muscles masqués', pick: 'Choisir un muscle', hide: 'Masquer un muscle' },
    vaisseau: { one: ' vaisseau masqué', many: ' vaisseaux masqués', pick: 'Choisir un vaisseau', hide: 'Masquer un vaisseau' },
    organe: { one: ' organe masqué', many: ' organes masqués', pick: 'Choisir un organe', hide: 'Masquer un organe' },
    partie: { one: ' partie masquée', many: ' parties masquées', pick: 'Choisir une partie', hide: 'Masquer une partie' }
  };
  let words = WORDS.os;
  function setObjectWords(kind) {
    words = WORDS[kind] || WORDS.os;
    $('helpPick').textContent = words.pick;
    $('helpHide').textContent = words.hide;
    onHiddenChange();
  }

  /* bandeau "N os masques - Tout afficher" */
  function onHiddenChange() {
    const n = NS.hiddenCount();
    $('hiddenChip').hidden = n === 0;
    $('hiddenCount').textContent = n + (n > 1 ? words.many : words.one);
  }

  /* ---------------- Carte d'aide ---------------- */
  const HELP_KEY = 'anotehomy-aide-vue';
  function toggleHelp(force) {
    const card = $('helpCard'), open = typeof force === 'boolean' ? force : card.hidden;
    card.hidden = !open;
    $('btnHelp').setAttribute('aria-expanded', String(open));
    if (!open) { try { localStorage.setItem(HELP_KEY, '1'); } catch (e) { /* stockage indisponible */ } }
  }
  function helpSeen() { try { return localStorage.getItem(HELP_KEY) === '1'; } catch (e) { return false; } }

  function initInput() {
    canvas.addEventListener('pointerdown', () => { if (!$('helpCard').hidden) toggleHelp(false); });
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', () => { if (!pointers.size) { NS.setHover(null); if (hooks.onHover) hooks.onHover(null); } });
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    document.querySelectorAll('.views button').forEach(b => b.addEventListener('click', () => NS.setView(b.dataset.view)));
    $('btnHelp').addEventListener('click', () => toggleHelp());
    $('btnHelpClose').addEventListener('click', () => toggleHelp(false));
    /* premiere visite : l'aide s'affiche d'elle-meme */
    if (!helpSeen()) toggleHelp(true);
    $('zIn').addEventListener('click', () => NS.zoomAt(1 / 1.6, canvas.clientWidth / 2, canvas.clientHeight / 2));
    $('zOut').addEventListener('click', () => NS.zoomAt(1.6, canvas.clientWidth / 2, canvas.clientHeight / 2));
    $('zFit').addEventListener('click', () => NS.frameAll());
    $('btnShowAll').addEventListener('click', () => NS.showAll());
  }

  Object.assign(NS, { hooks, initInput, onHiddenChange, setObjectWords, pick, toggleHelp, setHidingAllowed: on => { hidingAllowed = !!on; },
    setPickMargin: px => { margin = Math.max(0, px | 0); } });
})(AQ.engine);
