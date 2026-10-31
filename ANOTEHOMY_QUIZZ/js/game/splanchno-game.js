/* ==========================================================================
   Anotehomy Quizz - game/splanchno-game.js
   ADAPTATEUR DU JEU "Splanchnologie descriptive" : un seul organe est
   affiche (js/engine/splanchno.js), decoupe en parties (js/data/splanchnology.js) ;
   les questions portent sur ses parties, comme l'osteologie pour les os.
   Meme interface que les autres adaptateurs (voir js/game/osteo-game.js).
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc, shuffle, pickOne } = AQ.util;
  const D = AQ.data;
  const EN = AQ.engine;
  const { settings, session } = NS;

  /* "Rein", "Utérus et annexes" */
  const organTitle = def => def.name.charAt(0).toUpperCase() + def.name.slice(1);
  /* organes du corps choisi (masculin ou feminin) ; du tirage : appareils coches */
  const sexOk = d => !d.sex || d.sex === settings.gSex;
  const pool = () => D.SPLANCHNO.filter(d => settings.sSystems.has(d.system) && sexOk(d));

  /* noms de toutes les parties de tous les organes (autocompletion : pas d'indice sur l'organe en cours) */
  let allNames = null;
  function names() {
    if (!allNames) {
      const seen = new Map();
      D.SPLANCHNO.forEach(d => d.parts.forEach(p => { if (!seen.has(p.name)) seen.set(p.name, p); }));
      allNames = Array.from(seen.values());
    }
    return allNames;
  }

  /* inst.vis : part de la partie visible sans rien masquer (%) ; en dessous de PEEL, les parties qui la
     recouvrent sont ecartees ; en dessous de DEEP, elle est signalee comme cachee en ciblage */
  const DEEP = 15, PEEL = 50;
  function show(inst, opts) {
    const key = EN.focusInstance(inst, opts);
    if (inst.vis < PEEL) EN.peelParts(inst, key);
  }

  const A = NS.ADAPTERS['splanchnologie'] = {
    texts: {
      qTitleA: 'Quel est le nom de la partie en cyan ?',
      placeholder: 'Nom de la partie (nomenclature TA2)',
      qTitleB: 'Cliquez sur cette partie de l\'organe :',
      promptA: 'Nommez la partie <b>en cyan</b> dans le panneau de gauche',
      other: 'une autre partie de l\'organe',
      fit: 'Voir tout l\'organe (touche 0)',
      target: 'Recentrer sur la partie en cours',
      get credits() {
        const d = session.sDef;
        return d && d.src === 'h' ? 'Modèle 3D : Human Reference Atlas (HuBMAP), CC BY 4.0' : 'Modèle 3D : Z-Anatomy, CC BY-SA 4.0';
      }
    },
    organTitle, pool, sexOk,
    /* organe etudie, affiche en permanence pendant la partie et la revision */
    subject() { const cur = EN.splanchnoCurrent(); return cur ? { label: 'Organe étudié', name: organTitle(cur.def) } : null; },
    /* resultats : rappel de l'organe et boutons propres au jeu (js/game/results.js) */
    results: {
      subject: () => session.sDef ? 'Organe étudié : <b>' + esc(organTitle(session.sDef)) + '</b>' : '',
      explore: 'Explorer l\'organe',
      other: () => settings.sPick === 'random' ? 'Autre organe au hasard' : '',
      replay: 'Rejouer cet organe'
    },

    /* organe de la partie : choisi, tire au hasard, ou le meme que la partie precedente (opts.same) */
    pickDef(opts = {}) {
      if (opts.same && session.sDef) return session.sDef;
      if (settings.sPick === 'chosen') {
        const d = D.SPLANCHNO_BY[settings.sKey];
        return d && sexOk(d) ? d : null;
      }
      const p = pool(), prev = session.sDef;
      const cands = p.length > 1 && prev ? p.filter(d => d !== prev) : p;
      return cands.length ? pickOne(cands) : null;
    },

    build(opts = {}) {
      const def = A.pickDef(opts);
      if (!def) return Promise.reject(new Error('Aucun organe à étudier : cochez au moins un appareil.'));
      EN.deactivateMuscles(); EN.deactivateSystems();
      const ld = $('loading');
      ld.textContent = 'Chargement de l\'organe : ' + organTitle(def) + '…';
      ld.hidden = false;
      return EN.loadOrgan(def.key).then(parts => {
        ld.hidden = true;
        const cur = EN.openOrgan(def, parts);
        session.sDef = def;
        NS.prepareItems(def.parts);
        const qs = shuffle(cur.regions.slice()).slice(0, Math.max(1, settings.sCount)).map(r => ({ item: r.part, inst: r }));
        EN.frameAll({ view: 'A' });
        return qs;
      }, err => { ld.hidden = true; throw err; });
    },

    /* mode A : la partie demandee en cyan ; une partie recouverte par d'autres est degagee */
    showTarget(q) {
      EN.mark(q.inst, 'target');
      EN.setHalo(q.inst, 'target');
      show(q.inst);
    },
    /* mode B : l'organe entier, tourne vers une face ou la partie se voit ; rien n'est masque (ce serait
       un indice), mais une partie cachee est signalee */
    frameForClick(q) {
      const views = EN.bestViews(q.inst);
      EN.frameAll({ view: views.includes(EN.view()) ? null : views[0] });
      if (q.inst.vis < DEEP) NS.showNotice('Partie cachée par d\'autres : Maj + clic sur celles qui la recouvrent pour les écarter.');
    },
    evaluate: (raw, q) => NS.evaluateIn(raw, q.item, session.sDef.parts),
    isHit: (it, q) => it === q.inst,
    clickedName: it => it.part.name,
    reveal(q) {
      EN.mark(q.inst, 'reveal');
      EN.setHalo(q.inst, 'ok');
      show(q.inst);
    },
    focus: (inst, opts) => EN.focusInstance(inst, opts),
    where: () => '',
    names,

    /* revision : une partie (ou aucune : exploration libre de l'organe) ; clicked : clic dans la scene
       (les parties masquees a la main restent masquees, l'orientation est gardee) */
    review(part, reg, clicked) {
      const cur = EN.splanchnoCurrent();
      if (!cur) return;
      EN.clearMarks();
      if (!clicked) EN.showAll();
      if (reg) { EN.mark(reg, 'reveal'); EN.setHalo(reg, 'ok'); if (clicked) EN.focusInstance(reg, { keep: true }); else show(reg); }
      else EN.frameAll();
      NS.setPrompt(reg ? 'Révision : <b>' + esc(part.name) + '</b> - survolez ou cliquez sur les autres parties'
        : 'Exploration : survolez ou cliquez sur une partie pour l\'identifier', 'review');
      const chips = cur.regions.map(r => `<button type="button" class="sub-chip${r === reg ? ' on' : ''}" data-reg="${r.index}" title="${esc(r.part.latin)}">` +
        `<i style="background:${EN.partColor(r)}"></i>${esc(r.part.name)}</button>`).join('');
      NS.reviewPanel(`<p class="qlabel">${esc(organTitle(cur.def))}</p>` +
        (part ? `<h3 class="rv-h">${esc(part.name)}</h3><div class="latin">${esc(part.latin)}</div>` +
          `<div class="rv-meta">${part.alt.length ? 'Aussi accepté : ' + esc(part.alt.join(', ')) : ''}` +
          `${part.old.length ? (part.alt.length ? '<br>' : '') + 'Ancien(s) terme(s) à ne plus utiliser : ' + esc(part.old.join(', ')) : ''}</div>`
          : '<h3 class="rv-h">Exploration de l\'organe</h3>') +
        `<p class="rv-sec">Toutes les parties (${cur.regions.length})</p><div class="subs chips">${chips}</div>` +
        `<p class="rv-sec">Astuce</p><div class="rv-meta">Maj + clic masque une partie qui en cache une autre ; « Tout afficher » les fait réapparaître.</div>`);
      $('reviewBox').querySelectorAll('[data-reg]').forEach(b => b.addEventListener('click', () => {
        const r = cur.regions.find(x => x.index === +b.dataset.reg);
        if (r) A.review(r.part, r);
      }));
    },
    reviewClick(it) { A.review(it.part, it, true); },
    tip: it => `${esc(it.part.name)}<small>${esc(it.part.latin)}</small>`,
    leave() { EN.closeOrgan(); }
  };
})(AQ.game);
