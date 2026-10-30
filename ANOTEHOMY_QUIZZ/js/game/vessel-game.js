/* ==========================================================================
   Anotehomy Quizz - game/vessel-game.js
   ADAPTATEUR DU JEU "Les vaisseaux sanguins" : localisation des arteres et des
   veines sur le modele 3D Z-Anatomy (js/engine/vessels.js, js/data/vessels.js).
   Meme interface que les autres adaptateurs (voir js/game/osteo-game.js).
   ========================================================================== */
(function (NS) {
  'use strict';
  const { esc, pickOne, shuffle } = AQ.util;
  const D = AQ.data;
  const EN = AQ.engine;
  const { settings } = NS;

  /* côté accordé au nom : « artère fémorale droite », « sinus transverse droit », « veines brachiales gauches » */
  function sideOf(v, s) {
    if (s !== 'R' && s !== 'L') return '';
    const fem = /^(grande |petite )?(artère|veine|arcade|aorte)/.test(v.name);
    const pl = /^(grande |petite )?(artères|veines|arcades)\b/.test(v.name);
    return (s === 'R' ? (fem ? 'droite' : 'droit') : 'gauche') + (pl ? 's' : '');
  }
  /* vaisseaux du tirage : zones cochees, type (arteres, veines ou les deux), filtre "principaux",
     presents dans le modele */
  const typeOk = v => settings.vTypes.includes(v.type);
  const pool = () => D.VESSELS.filter(v => settings.vRegions.has(v.region) && typeOk(v) && (!settings.vPrincipal || v.principal) &&
    (!EN.vesselsLoaded() || EN.vesselInstances(v.id).length));
  /* inst.vis : part du vaisseau visible sans rien masquer (%, js/engine/vessels.js) */
  const DEEP = 15, PEEL = 45;
  /* cadre un vaisseau ; s'il est en partie cache, les vaisseaux qui le recouvrent sont masques */
  function show(inst, opts) {
    const key = EN.focusInstance(inst, opts);
    if (inst.vis < PEEL) EN.peelVessels(inst, key);
  }
  const typeName = v => D.VESSEL_TYPE[v.type].one;

  const A = NS.ADAPTERS['vaisseaux'] = {
    texts: {
      qTitleA: 'Quel est le nom du vaisseau en jaune ?',
      placeholder: 'Nom du vaisseau (nomenclature TA2)',
      qTitleB: 'Cliquez sur ce vaisseau :',
      promptA: 'Nommez le vaisseau <b>en jaune</b> dans le panneau de gauche',
      other: 'un autre vaisseau',
      fit: 'Voir tout le corps (touche 0)',
      target: 'Recentrer sur le vaisseau en cours',
      credits: 'Modèle 3D : Z-Anatomy, CC BY-SA 4.0'
    },
    pool,

    build() {
      return EN.loadVesselModel().then(() => {
        EN.activateVessels();
        EN.setVesselTypes(settings.vTypes);   /* artères seules ou veines seules : les autres sont cachées */
        return shuffle(pool().slice()).slice(0, settings.vCount).map(v => ({ item: v, inst: null }));
      });
    },
    /* mode A : un cote au hasard, en jaune ; un vaisseau recouvert est degage */
    showTarget(q) {
      if (!q.inst) q.inst = pickOne(EN.vesselInstances(q.item.id));
      EN.mark(q.inst, 'target');
      EN.setHalo(q.inst, 'target');
      show(q.inst);
    },
    /* mode B : vue d'ensemble tournee vers une face ou le vaisseau se voit ; rien n'est masque
       (ce serait un indice), mais un vaisseau cache est signale */
    frameForClick(q) {
      const list = EN.vesselInstances(q.item.id), views = EN.bestViews(list[0]);
      EN.frameAll({ view: views.includes(EN.view()) ? null : views[0] });
      if (list.every(i => i.vis < DEEP)) {
        NS.showNotice('Vaisseau caché par d\'autres : Maj + clic sur ceux qui le recouvrent pour les écarter.');
      }
    },
    describe: q => ({ name: q.item.name, latin: q.item.latin, where: q.inst ? sideOf(q.item, q.inst.side) : '' }),
    evaluate: (raw, q) => NS.evaluateIn(raw, q.item, D.VESSELS),
    isHit: (it, q) => it.bone === q.item.id,
    clickedName: it => D.VESSEL[it.bone].name,
    reveal(q, pt) {
      const list = EN.vesselInstances(q.item.id);
      list.forEach(i => EN.mark(i, 'reveal'));
      const dist = it => pt ? it.center.distanceTo(pt) : 0;
      const near = list.reduce((a, c) => dist(c) < dist(a) ? c : a, list[0]);
      q.inst = near;
      EN.setHalo(near, 'ok');
      show(near);
    },
    focus: (inst, opts) => EN.focusInstance(inst, opts),
    where: inst => inst ? sideOf(D.VESSEL[inst.bone], inst.side) : '',
    names: () => D.VESSELS,
    /* autocomplétion : seulement le type choisi (artères seules, veines seules, ou les deux), toutes zones
       confondues (proposer seulement les zones cochées serait un indice) */
    suggestNames: () => D.VESSELS.filter(typeOk),
    listKey: () => settings.vTypes,

    /* revision : depuis les resultats (vaisseau degage), ou clic sur un vaisseau de la scene
       (clicked : les vaisseaux masques a la main restent masques, l'orientation est gardee) */
    review(v, inst, clicked) {
      EN.clearMarks();
      if (!clicked) EN.showAll();
      const list = EN.vesselInstances(v.id);
      list.forEach(it => EN.mark(it, 'reveal'));
      const focus = inst || list[0];
      if (focus) { EN.setHalo(focus, 'ok'); if (clicked) EN.focusInstance(focus, { keep: true }); else show(focus); }
      NS.setPrompt('Révision : <b>' + esc(v.name) + '</b> - cliquez sur un autre vaisseau pour l\'identifier', 'review');
      NS.reviewPanel(`<p class="qlabel">Révision - cliquez sur d'autres vaisseaux pour les identifier</p><h3 class="rv-h">${esc(v.name)}</h3>` +
        `<div class="latin">${esc(v.latin)}</div><div class="rv-meta">${v.type === 'a' ? 'Artère' : 'Veine'}` +
        `${v.pulmonary ? ' (circulation pulmonaire)' : ''} - zone : ${esc(D.VESSEL_REGION[v.region].name)}` +
        `${v.principal ? ' - vaisseau principal' : ''}${list.length > 1 ? ' - pair' : ''}` +
        `${v.alt.length ? '<br>Aussi accepté : ' + esc(v.alt.join(', ')) : ''}` +
        `${v.old.length ? '<br>Ancien(s) terme(s) à ne plus utiliser : ' + esc(v.old.join(', ')) : ''}</div>` +
        `<p class="rv-sec">Couleurs</p><div class="rv-meta">Artères en rouge, veines en bleu ; dans la circulation ` +
        `pulmonaire, c'est l'inverse (sang pauvre en oxygène dans les artères). Maj + clic masque un vaisseau ` +
        `qui en cache un autre ; « Tout afficher » les fait réapparaître.</div>`);
    },
    reviewClick(it) { A.review(D.VESSEL[it.bone], it, true); },
    tip(it) {
      const v = D.VESSEL[it.bone], s = sideOf(v, it.side);
      return `${esc(v.name)}${s ? ' (' + s + ')' : ''}<small>${esc(v.latin)} · ${typeName(v)}</small>`;
    },
    leave() { EN.deactivateVessels(); }
  };
})(AQ.game);
