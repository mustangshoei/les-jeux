/* ==========================================================================
   Anotehomy Quizz - game/osteo-game.js
   ADAPTATEUR DU JEU 2 "Osteologie descriptive" : un seul os est affiche
   (decoupe en parties, js/data/osteology.js), eventuellement entoure des os
   voisins estompes ; les questions portent sur ses parties.
   --------------------------------------------------------------------------
   Interface commune des adaptateurs (utilisee par play.js et results.js) :
     texts            textes du panneau et des commandes
     build(opts)      promesse de la file de questions [{ item, inst }]
     showTarget(q)    mode A : marque et cadre l'element demande
     frameForClick(q) mode B : cadrage avant le clic
     evaluate(raw, q) correction d'une reponse saisie
     isHit(it, q)     mode B : l'objet clique est-il le bon ?
     clickedName(it)  nom de l'objet clique
     reveal(q, pt)    montre la bonne reponse
     focus(inst, o)   recentre la camera sur un objet
     where(inst)      precision (cote, niveau) ; names() : noms de l'autocompletion
     review(item, inst), reviewClick(it), tip(it) : revision apres la partie
     leave()          nettoyage quand on quitte le jeu
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc, shuffle, pickOne } = AQ.util;
  const D = AQ.data;
  const EN = AQ.engine;
  const { settings, session } = NS;

  /* "Scapula (cote droit)", "Vertebre cervicale (C4)", "Sixieme cote (cote droit)" */
  function boneTitle(def) {
    const b = D.BONE[def.bone], name = def.title || b.name;
    const t = name.charAt(0).toUpperCase() + name.slice(1) + (!def.title && def.label ? ' (' + def.label + ')' : '');
    return t + (def.side === 'R' ? ' (côté droit)' : def.side === 'L' ? ' (côté gauche)' : '');
  }
  /* zone du corps d'un os detaille (js/data/regions.js) */
  const zoneOf = def => D.BONE[def.bone].region;
  /* os du tirage au sort (zones cochees) */
  const pool = () => D.OSTEO.filter(d => settings.oZones.has(zoneOf(d)));

  /* noms de toutes les parties de tous les os (autocompletion : pas d'indice sur l'os en cours) */
  let allNames = null;
  function names() {
    if (!allNames) {
      const seen = new Map();
      D.OSTEO.forEach(d => d.parts.forEach(p => { if (!seen.has(p.name)) seen.set(p.name, p); }));
      allNames = Array.from(seen.values());
    }
    return allNames;
  }

  const A = NS.ADAPTERS['os-descriptive'] = {
    texts: {
      qTitleA: 'Quel est le nom de la partie en rouge\u00a0?',
      placeholder: 'Nom de la partie (nomenclature TA2)',
      qTitleB: 'Cliquez sur cette partie de l\'os :',
      promptA: 'Nommez la partie <b>en rouge</b> dans le panneau de gauche',
      other: 'une autre partie de l\'os',
      fit: 'Voir tout l\'os (touche 0)',
      target: 'Recentrer sur la partie en cours'
    },
    boneTitle, zoneOf, pool,
    /* os etudie, affiche en permanence pendant la partie et la revision */
    subject() { const cur = EN.osteoCurrent(); return cur ? { label: 'Os étudié', name: boneTitle(cur.def) } : null; },

    /* os de la partie : choisi, tire au hasard, ou le meme que la partie precedente (opts.same) */
    pickDef(opts = {}) {
      if (opts.same && session.oDef) return session.oDef;
      if (settings.oPick === 'chosen') return D.OSTEO_BY[settings.oKey] || D.OSTEO[0];
      const p = pool(), prev = session.oDef;
      /* evite de retomber sur le meme os deux fois de suite */
      const cands = p.length > 1 && prev ? p.filter(d => d !== prev) : p;
      return cands.length ? pickOne(cands) : null;
    },

    /* decoupe l'os (calcul de quelques dixiemes de seconde) puis prepare les questions */
    build(opts = {}) {
      const def = A.pickDef(opts);
      if (!def) return Promise.reject(new Error('Aucun os à étudier : cochez au moins une zone du corps.'));
      EN.deactivateMuscles(); EN.deactivateVessels();
      const ld = $('loading');
      ld.textContent = 'Préparation de l\'os : ' + boneTitle(def) + '…';
      ld.hidden = false;
      return EN.loadOsteoModel().then(() => new Promise((resolve, reject) => {
        /* laisse le navigateur afficher le message avant le calcul */
        setTimeout(() => {
          try {
            const cur = EN.openBone(def, { neighbors: settings.neighbors });
            session.oDef = def;
            ld.hidden = true;
            NS.prepareItems(def.parts);
            const qs = shuffle(cur.regions.slice()).slice(0, Math.max(1, settings.oCount)).map(r => ({ item: r.part, inst: r }));
            EN.frameBone({ view: 'A' });
            resolve(qs);
          } catch (e) { ld.hidden = true; reject(e); }
        }, 40);
      }));
    },

    /* mode A : la partie demandee en rouge, tournee vers l'observateur */
    showTarget(q) {
      EN.mark(q.inst, 'target');
      EN.setHalo(q.inst, 'target');
      EN.focusRegion(q.inst);
    },
    /* mode B : l'os entier, dans l'orientation courante */
    frameForClick() { EN.frameBone(); },
    evaluate: (raw, q) => NS.evaluateIn(raw, q.item, session.oDef.parts),
    isHit: (it, q) => it === q.inst,
    clickedName: it => it.part.name,
    reveal(q) {
      EN.mark(q.inst, 'reveal');
      EN.setHalo(q.inst, 'ok');
      EN.focusRegion(q.inst, { turn: true });
    },
    focus: (inst, opts) => EN.focusRegion(inst, opts),
    where: () => '',
    names,

    /* revision : une partie (ou aucune : exploration libre de l'os) */
    review(part, reg) {
      const cur = EN.osteoCurrent();
      if (!cur) return;
      EN.clearMarks();
      if (reg) { EN.mark(reg, 'reveal'); EN.setHalo(reg, 'ok'); EN.focusRegion(reg, { turn: true }); }
      else EN.frameBone();
      NS.setPrompt(reg ? 'Révision : <b>' + esc(part.name) + '</b> - survolez ou cliquez sur les autres parties'
        : 'Exploration : survolez ou cliquez sur une partie pour l\'identifier', 'review');
      const chips = cur.regions.map(r => `<button type="button" class="sub-chip${r === reg ? ' on' : ''}" data-reg="${r.index}" title="${esc(r.part.latin)}">` +
        `<i style="background:${EN.regionColor(r)}"></i>${esc(r.part.name)}</button>`).join('');
      NS.reviewPanel(`<p class="qlabel">${esc(boneTitle(cur.def))}</p>` +
        (part ? `<h3 class="rv-h">${esc(part.name)}</h3><div class="latin">${esc(part.latin)}</div>` +
          `<div class="rv-meta">${part.alt.length ? 'Aussi accepte : ' + esc(part.alt.join(', ')) : ''}` +
          `${part.old.length ? (part.alt.length ? '<br>' : '') + 'Ancien(s) terme(s) a ne plus utiliser : ' + esc(part.old.join(', ')) : ''}</div>`
          : '<h3 class="rv-h">Exploration de l\'os</h3>') +
        `<p class="rv-sec">Toutes les parties (${cur.regions.length})</p><div class="subs chips">${chips}</div>`);
      $('reviewBox').querySelectorAll('[data-reg]').forEach(b => b.addEventListener('click', () => {
        const r = cur.regions.find(x => x.index === +b.dataset.reg);
        if (r) A.review(r.part, r);
      }));
    },
    reviewClick(it) { A.review(it.part, it); },
    tip: it => `${esc(it.part.name)}<small>${esc(it.part.latin)}</small>`,
    leave() { EN.closeBone(); }
  };
})(AQ.game);
