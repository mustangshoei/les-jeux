/* ==========================================================================
   Anotehomy Quizz - game/muscle-game.js
   ADAPTATEUR DU JEU "Les muscles du corps humain" : localisation des muscles
   sur le modele 3D Z-Anatomy (js/engine/muscles.js, js/data/muscles.js).
   Meme interface que les autres adaptateurs (voir js/game/osteo-game.js).
   ========================================================================== */
(function (NS) {
  'use strict';
  const { esc, pickOne, shuffle } = AQ.util;
  const D = AQ.data;
  const EN = AQ.engine;
  const { settings } = NS;

  const sideName = s => s === 'R' ? 'droit' : s === 'L' ? 'gauche' : '';
  /* muscles du tirage : zones cochees, filtre "principaux", presents dans le modele */
  const pool = () => D.MUSCLES.filter(m => settings.mRegions.has(m.region) && (!settings.mPrincipal || m.principal) &&
    (!EN.musclesLoaded() || EN.muscleInstances(m.id).length));
  /* inst.vis : part du muscle visible sans rien masquer (%, js/engine/muscles.js) */
  const DEEP = 20, PEEL = 50;
  /* cadre un muscle ; s'il est en partie cache, les muscles qui le recouvrent sont masques */
  function show(inst, opts) {
    const key = EN.focusInstance(inst, opts);
    if (inst.vis < PEEL) EN.peelFor(inst, key);
  }

  const A = NS.ADAPTERS['muscles-localisation'] = {
    texts: {
      qTitleA: 'Quel est le nom du muscle en bleu ?',
      placeholder: 'Nom du muscle (nomenclature TA2)',
      qTitleB: 'Cliquez sur ce muscle :',
      promptA: 'Nommez le muscle <b>en bleu</b> dans le panneau de gauche',
      other: 'un autre muscle',
      fit: 'Voir tout le corps (touche 0)',
      target: 'Recentrer sur le muscle en cours',
      credits: 'Modele 3D : Z-Anatomy, CC BY-SA 4.0'
    },
    pool,

    build() {
      return EN.loadMuscleModel().then(() => {
        EN.activateMuscles();
        return shuffle(pool().slice()).slice(0, settings.mCount).map(m => ({ item: m, inst: null }));
      });
    },
    /* mode A : un cote au hasard, en bleu ; un muscle profond est degage */
    showTarget(q) {
      if (!q.inst) q.inst = pickOne(EN.muscleInstances(q.item.id));
      EN.mark(q.inst, 'target');
      EN.setHalo(q.inst, 'target');
      show(q.inst);
    },
    /* mode B : vue d'ensemble tournee vers une face ou le muscle se voit ; rien n'est masque
       (ce serait un indice), mais un muscle profond est signale */
    frameForClick(q) {
      const list = EN.muscleInstances(q.item.id), views = EN.bestViews(list[0]);
      EN.frameAll({ view: views.includes(EN.view()) ? null : views[0] });
      if (list.every(i => i.vis < DEEP)) {
        NS.showNotice('Muscle profond : Maj + clic sur les muscles qui le recouvrent pour les ecarter.');
      }
    },
    describe: q => ({ name: q.item.name, latin: q.item.latin, where: q.inst ? sideName(q.inst.side) : '' }),
    evaluate: (raw, q) => NS.evaluateIn(raw, q.item, D.MUSCLES),
    isHit: (it, q) => it.bone === q.item.id,
    clickedName: it => D.MUSCLE[it.bone].name,
    reveal(q, pt) {
      const list = EN.muscleInstances(q.item.id);
      list.forEach(i => EN.mark(i, 'reveal'));
      const dist = it => pt ? it.center.distanceTo(pt) : 0;
      const near = list.reduce((a, c) => dist(c) < dist(a) ? c : a, list[0]);
      q.inst = near;
      EN.setHalo(near, 'ok');
      show(near);
    },
    focus: (inst, opts) => EN.focusInstance(inst, opts),
    where: inst => inst ? sideName(inst.side) : '',
    names: () => D.MUSCLES,

    /* revision : depuis les resultats (muscle degage), ou clic sur un muscle de la scene
       (clicked : les muscles masques a la main restent masques, l'orientation est gardee) */
    review(m, inst, clicked) {
      EN.clearMarks();
      if (!clicked) EN.showAll();
      const list = EN.muscleInstances(m.id);
      list.forEach(it => EN.mark(it, 'reveal'));
      const focus = inst || list[0];
      if (focus) { EN.setHalo(focus, 'ok'); if (clicked) EN.focusInstance(focus, { keep: true }); else show(focus); }
      NS.setPrompt('Revision : <b>' + esc(m.name) + '</b> - cliquez sur un autre muscle pour l\'identifier', 'review');
      NS.reviewPanel(`<p class="qlabel">Revision - cliquez sur d'autres muscles pour les identifier</p><h3 class="rv-h">${esc(m.name)}</h3>` +
        `<div class="latin">${esc(m.latin)}</div><div class="rv-meta">Zone : ${esc(D.MUSCLE_REGION[m.region].name)}` +
        `${m.principal ? ' - muscle principal' : ''}${list.length > 1 ? ' - pair' : ''}` +
        `${m.alt.length ? '<br>Aussi accepte : ' + esc(m.alt.join(', ')) : ''}` +
        `${m.old.length ? '<br>Ancien(s) terme(s) a ne plus utiliser : ' + esc(m.old.join(', ')) : ''}</div>` +
        `<p class="rv-sec">Astuce</p><div class="rv-meta">Maj + clic masque un muscle qui en cache un autre ; ` +
        `"Tout afficher" les fait reapparaitre.</div>`);
    },
    reviewClick(it) { A.review(D.MUSCLE[it.bone], it, true); },
    tip(it) {
      const m = D.MUSCLE[it.bone], s = sideName(it.side);
      return `${esc(m.name)}${s ? ' (' + s + ')' : ''}<small>${esc(m.latin)}</small>`;
    },
    leave() { EN.deactivateMuscles(); }
  };
})(AQ.game);
