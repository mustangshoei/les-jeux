/* ==========================================================================
   Anotehomy Quizz - game/organ-game.js
   ADAPTATEUR DU JEU "Les organes" : localisation des organes sur le modele 3D
   Z-Anatomy (js/engine/organs.js, js/data/organs.js). Meme interface que les
   autres adaptateurs (voir js/game/osteo-game.js).
   ========================================================================== */
(function (NS) {
  'use strict';
  const { esc, pickOne, shuffle } = AQ.util;
  const D = AQ.data;
  const EN = AQ.engine;
  const { settings } = NS;

  /* côté accordé au nom : « rein droit », « glande surrénale droite », « nœuds axillaires gauches » */
  const FEM = /^(grande |petite )?(glande|bronche|substance|commissure|base|strie|insula|tonsille|membrane|trompe|cochlée|cornée|rétine|sclère|zonule|chambre|valve|cavité|vésicule|uvule|langue)\b/;
  const PL = /^(nœuds|noyaux|muscles|ténias)\b/;
  function sideOf(o, s) {
    if (s !== 'R' && s !== 'L') return '';
    return (s === 'R' ? (FEM.test(o.name) ? 'droite' : 'droit') : 'gauche') + (PL.test(o.name) ? 's' : '');
  }
  /* organes du corps choisi (masculin ou feminin) ; du tirage : appareils coches, filtre "principaux",
     presents dans le modele */
  const sexOk = o => !o.sex || o.sex === settings.gSex;
  const bodyOrgans = () => D.ORGANS.filter(sexOk);
  const systemOk = o => settings.gSystems.has(o.system) && sexOk(o);
  const pool = () => D.ORGANS.filter(o => systemOk(o) && (!settings.gPrincipal || o.principal) &&
    (!EN.organsLoaded() || EN.organInstances(o.id).length));
  /* inst.vis : part de l'organe visible sans rien masquer (%, js/engine/systems.js) */
  const DEEP = 15, PEEL = 50;
  /* cadre un organe ; s'il est en partie cache, les organes qui le recouvrent sont masques */
  function show(inst, opts) {
    const key = EN.focusInstance(inst, opts);
    if (inst.vis < PEEL) EN.peelOrgans(inst, key);
  }

  const A = NS.ADAPTERS['organes'] = {
    texts: {
      qTitleA: 'Quel est le nom de l\'organe en cyan ?',
      placeholder: 'Nom de l\'organe (nomenclature TA2)',
      qTitleB: 'Cliquez sur cet organe :',
      promptA: 'Nommez l\'organe <b>en cyan</b> dans le panneau de gauche',
      other: 'un autre organe',
      fit: 'Voir tout le corps (touche 0)',
      target: 'Recentrer sur l\'organe en cours',
      credits: 'Modèle 3D : Z-Anatomy, CC BY-SA 4.0'
    },
    pool,

    build() {
      return EN.loadOrganModel().then(() => {
        EN.activateOrgans();
        EN.setOrganView(settings.gSystems, settings.gSex);   /* autres appareils et autre sexe : caches */
        return shuffle(pool().slice()).slice(0, settings.gCount).map(o => ({ item: o, inst: null }));
      });
    },
    /* mode A : un cote au hasard, en cyan ; un organe recouvert est degage */
    showTarget(q) {
      if (!q.inst) q.inst = pickOne(EN.organInstances(q.item.id));
      EN.mark(q.inst, 'target');
      EN.setHalo(q.inst, 'target');
      show(q.inst);
    },
    /* mode B : vue d'ensemble tournee vers une face ou l'organe se voit ; rien n'est masque
       (ce serait un indice), mais un organe cache est signale */
    frameForClick(q) {
      const list = EN.organInstances(q.item.id), views = EN.bestViews(list[0]);
      EN.frameAll({ view: views.includes(EN.view()) ? null : views[0] });
      if (list.every(i => i.vis < DEEP)) {
        NS.showNotice('Organe caché par d\'autres : Maj + clic sur ceux qui le recouvrent pour les écarter.');
      }
    },
    describe: q => ({ name: q.item.name, latin: q.item.latin, where: q.inst ? sideOf(q.item, q.inst.side) : '' }),
    evaluate: (raw, q) => NS.evaluateIn(raw, q.item, bodyOrgans()),
    isHit: (it, q) => it.bone === q.item.id,
    clickedName: it => D.ORGAN[it.bone].name,
    reveal(q, pt) {
      const list = EN.organInstances(q.item.id);
      list.forEach(i => EN.mark(i, 'reveal'));
      const dist = it => pt ? it.center.distanceTo(pt) : 0;
      const near = list.reduce((a, c) => dist(c) < dist(a) ? c : a, list[0]);
      q.inst = near;
      EN.setHalo(near, 'ok');
      show(near);
    },
    focus: (inst, opts) => EN.focusInstance(inst, opts),
    where: inst => inst ? sideOf(D.ORGAN[inst.bone], inst.side) : '',
    names: bodyOrgans,
    /* autocomplétion : seulement les appareils cochés et le corps choisi (les autres organes sont cachés) */
    suggestNames: () => D.ORGANS.filter(systemOk),
    listKey: () => settings.gSex + ':' + Array.from(settings.gSystems).sort().join(','),

    /* revision : depuis les resultats (organe degage), ou clic sur un organe de la scene
       (clicked : les organes masques a la main restent masques, l'orientation est gardee) */
    review(o, inst, clicked) {
      EN.clearMarks();
      if (!clicked) EN.showAll();
      const list = EN.organInstances(o.id);
      list.forEach(it => EN.mark(it, 'reveal'));
      const focus = inst || list[0];
      if (focus) { EN.setHalo(focus, 'ok'); if (clicked) EN.focusInstance(focus, { keep: true }); else show(focus); }
      NS.setPrompt('Révision : <b>' + esc(o.name) + '</b> - cliquez sur un autre organe pour l\'identifier', 'review');
      NS.reviewPanel(`<p class="qlabel">Révision - cliquez sur d'autres organes pour les identifier</p><h3 class="rv-h">${esc(o.name)}</h3>` +
        `<div class="latin">${esc(o.latin)}</div><div class="rv-meta">${esc(D.ORGAN_SYSTEM[o.system].name)}` +
        `${o.sex ? (o.sex === 'f' ? ' - corps féminin' : ' - corps masculin') : ''}` +
        `${o.principal ? ' - organe principal' : ''}${list.length > 1 ? ' - pair' : ''}` +
        `${o.alt.length ? '<br>Aussi accepté : ' + esc(o.alt.join(', ')) : ''}` +
        `${o.old.length ? '<br>Ancien(s) terme(s) à ne plus utiliser : ' + esc(o.old.join(', ')) : ''}</div>` +
        `<p class="rv-sec">Astuce</p><div class="rv-meta">Maj + clic masque un organe qui en cache un autre ; ` +
        `« Tout afficher » les fait réapparaître.</div>`);
    },
    reviewClick(it) { A.review(D.ORGAN[it.bone], it, true); },
    tip(it) {
      const o = D.ORGAN[it.bone], s = sideOf(o, it.side);
      return `${esc(o.name)}${s ? ' (' + s + ')' : ''}<small>${esc(o.latin)}</small>`;
    },
    leave() { EN.deactivateOrgans(); }
  };
})(AQ.game);
