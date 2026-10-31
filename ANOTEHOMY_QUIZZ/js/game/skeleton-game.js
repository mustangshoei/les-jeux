/* ==========================================================================
   Anotehomy Quizz - game/skeleton-game.js
   ADAPTATEUR DU JEU 1 "Les os du squelette" : les questions portent sur les
   os du squelette entier (js/data/bones.js). Le deroulement commun d'une
   partie est dans js/game/play.js, les resultats dans js/game/results.js.
   Interface d'un adaptateur : voir js/game/osteo-game.js (meme structure).
   Os en serie (cotes, vertebres) : le numero, le niveau et le cote du corps
   sont lus dans la reponse ; l'option "precision" de la prephase les exige.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { esc, pickOne, shuffle } = AQ.util;
  const D = AQ.data;
  const EN = AQ.engine;
  const { settings } = NS;

  /* ---------------- Os en serie numerotes ---------------- */
  /* rib : numero + cote du corps ; vert : niveau (lettre + numero, ex. T9) */
  const SERIES = {
    costa: { kind: 'rib' },
    vertebra_cervicalis: { kind: 'vert', letter: 'c' },
    vertebra_thoracica: { kind: 'vert', letter: 't' },
    vertebra_lumbalis: { kind: 'vert', letter: 'l' }
  };
  const LETTER_BONE = { c: 'vertebra_cervicalis', t: 'vertebra_thoracica', l: 'vertebra_lumbalis' };
  const ORDINALS = {};
  ['premiere premier', 'deuxieme seconde second', 'troisieme', 'quatrieme', 'cinquieme', 'sixieme', 'septieme',
    'huitieme', 'neuvieme', 'dixieme', 'onzieme', 'douzieme'].forEach((l, i) => l.split(' ').forEach(w => { ORDINALS[w] = i + 1; }));
  const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12 };
  const FILLER = new Set(['numero', 'no', 'n', 'niveau', 'nr']);

  /* numero et cote du corps d'une instance (cote 12 gauche : { num: 12, side: 'L' }) */
  function expected(b, inst) {
    const s = SERIES[b.id];
    if (!s || !inst || !inst.label) return null;
    return { num: parseInt(inst.label.replace(/\D+/g, ''), 10), side: s.kind === 'rib' ? inst.side : null, letter: s.letter || null };
  }
  const ordinal = n => n === 1 ? '1re' : n + 'e';
  /* nom precis : "12e cote gauche", "vertebre thoracique T9" (null pour les autres os) */
  function preciseName(b, inst) {
    const e = expected(b, inst);
    if (!e) return null;
    if (SERIES[b.id].kind === 'rib') return ordinal(e.num) + ' côte ' + (e.side === 'L' ? 'gauche' : 'droite');
    return b.name + ' ' + inst.label;
  }

  /* lecture d'une reponse : { num, side, code: { letter, num }, rest } */
  function parsePrecision(raw) {
    const w = NS.norm(raw).split(' ').filter(Boolean), out = { num: null, side: null, code: null, rest: '' }, keep = [];
    for (let i = 0; i < w.length; i++) {
      const t = w[i], next = w[i + 1];
      let m = /^(c|t|th|l|d)(\d{1,2})$/.exec(t);
      if (m) { out.code = { letter: m[1] === 'th' ? 't' : m[1], num: +m[2] }; continue; }
      if (/^(c|t|th|l|d)$/.test(t) && next && /^\d{1,2}$/.test(next)) { out.code = { letter: t === 'th' ? 't' : t, num: +next }; i++; continue; }
      if (t === 'gauche' || t === 'g') { out.side = 'L'; continue; }
      if (t === 'droite' || t === 'droit' || t === 'd') { out.side = 'R'; continue; }
      m = /^(\d{1,2})(e|em|eme|iem|ieme|er|ere|re|nd|nde)?$/.exec(t);
      if (m) { out.num = +m[1]; continue; }
      if (ORDINALS[t]) { out.num = ORDINALS[t]; continue; }
      if (ROMAN[t] && keep.length) { out.num = ROMAN[t]; continue; }
      if (FILLER.has(t) || t === 'e' || t === 'eme') continue;
      keep.push(t);
    }
    out.rest = keep.join(' ');
    return out;
  }

  /* correction d'un os en serie : os general, puis numero / niveau et cote du corps */
  function evaluateSeries(raw, b, inst) {
    const exp = expected(b, inst), p = parsePrecision(raw), disp = preciseName(b, inst);
    let r;
    if (p.code) {
      /* niveau vertebral saisi (T9, D9, L3...) */
      if (p.code.letter === 'd' && exp.letter === 't') return { ok: false, oldName: 'D' + p.code.num + ' (vertèbre dorsale)', other: b };
      if (p.code.letter !== exp.letter) {
        const ob = D.BONE[LETTER_BONE[p.code.letter]];
        return { ok: false, other: ob || null };
      }
      p.num = p.code.num;
      r = { ok: true, typo: false, oldName: null, other: null };
      if (p.rest && p.rest !== 'vertebre') { const g = NS.evaluate(p.rest, b, inst); if (!g.ok) return g; r.typo = g.typo; }
    } else {
      if (!p.rest) return { ok: false, oldName: null, other: null };
      r = NS.evaluate(p.rest, b, inst);
      if (!r.ok) return r;
    }
    if (p.num !== null && p.num !== exp.num) return { ok: false, note: `Bon os, mais mauvais numéro : c'était ${disp}.` };
    if (p.side && exp.side && p.side !== exp.side) return { ok: false, note: `Bon os, mais mauvais côté : c'était ${disp}.` };
    const complete = p.num !== null && (!exp.side || p.side);
    if (!complete) {
      if (settings.precise) return { ok: false, incomplete: true, note: `Réponse incomplète : il fallait préciser ${SERIES[b.id].kind === 'rib' ? 'le numéro et le côté' : 'le niveau'} (${disp}).` };
      r.note = `Nom précis : ${disp}.`;
    }
    return r;
  }

  NS.ADAPTERS['os-squelette'] = {
    texts: {
      qTitleA: 'Quel est le nom de l\'os en rouge\u00a0?',
      placeholder: 'Nom de l\'os (nomenclature TA2)',
      qTitleB: 'Cliquez sur cet os :',
      promptA: 'Nommez l\'os <b>en rouge</b> dans le panneau de gauche',
      other: 'un autre os',
      fit: 'Voir tout le squelette (touche 0)',
      target: 'Recentrer sur l\'os en cours'
    },
    preciseName,

    /* file de questions (promesse) : os des zones cochees, tires au hasard ; avec l'option
       "precision", un os en serie est demande sous une forme precise (une instance donnee) */
    build() {
      EN.closeBone();
      EN.deactivateMuscles(); EN.deactivateSystems();
      return Promise.resolve(shuffle(NS.pool().slice()).slice(0, settings.count).map(b => {
        const q = { item: b, inst: null };
        if (settings.precise && SERIES[b.id]) { q.inst = pickOne(EN.instancesOf(b.id)); q.precise = true; }
        return q;
      }));
    },
    /* mode A : un os pair ou une serie (vertebres, cotes...) : une instance au hasard */
    showTarget(q) {
      if (!q.inst) q.inst = pickOne(EN.instancesOf(q.item.id));
      EN.mark(q.inst, 'target');
      EN.setHalo(q.inst, 'target');
      EN.focusInstance(q.inst);
    },
    /* mode B : vue d'ensemble, tournee vers une face ou l'os est visible si besoin */
    frameForClick(q) {
      const views = EN.bestViews(q.inst || EN.instancesOf(q.item.id)[0]);
      EN.frameAll({ view: views.includes(EN.view()) ? null : views[0] });
    },
    /* nom affiche : precis pour un os en serie (des que l'instance est connue) */
    describe(q) {
      const p = q.inst ? preciseName(q.item, q.inst) : null;
      return { name: p || q.item.name, latin: q.item.latin, where: p ? '' : NS.instDesc(q.inst) };
    },
    evaluate: (raw, q) => SERIES[q.item.id] ? evaluateSeries(raw, q.item, q.inst) : NS.evaluate(raw, q.item, q.inst),
    isHit: (it, q) => q.precise ? it === q.inst : it.bone === q.item.id,
    clickedName: it => preciseName(D.BONE[it.bone], it) || D.BONE[it.bone].name,
    /* mode B : montre la bonne reponse et vole vers l'instance demandee (ou la plus proche du clic) */
    reveal(q, pt) {
      const list = q.precise ? [q.inst] : EN.instancesOf(q.item.id);
      list.forEach(i => EN.mark(i, 'reveal'));
      const dist = it => pt ? it.center.distanceTo(pt) : 0;
      const near = list.reduce((a, c) => dist(c) < dist(a) ? c : a, list[0]);
      q.inst = near;
      EN.setHalo(near, 'ok');
      EN.focusInstance(near);
    },
    focus: (inst, opts) => EN.focusInstance(inst, opts),
    where: inst => NS.instDesc(inst),
    /* noms proposes par l'autocompletion : tous les os (pas seulement ceux de la partie) */
    names: () => D.BONES,

    /* revision : toutes les instances d'un os ; la camera cadre "inst" (ou la premiere) */
    review(b, inst) {
      EN.clearMarks();
      const list = EN.instancesOf(b.id);
      list.forEach(it => EN.mark(it, 'reveal'));
      const focus = inst || list[0];
      if (focus) { EN.setHalo(focus, 'ok'); EN.focusInstance(focus); }
      const pn = focus ? preciseName(b, focus) : null;
      NS.setPrompt('Révision : <b>' + esc(pn || b.name) + '</b> - cliquez sur un autre os pour l\'identifier', 'review');
      /* parties de l'os : celles du jeu "Osteologie descriptive" si l'os y est decrit */
      const def = D.OSTEO.find(o => o.bone === b.id);
      const subs = def ? def.parts : b.sub;
      NS.reviewPanel(`<p class="qlabel">Révision - cliquez sur d'autres os pour les identifier</p><h3 class="rv-h">${esc(pn || b.name)}</h3>` +
        `<div class="latin">${esc(b.latin)}</div><div class="rv-meta">${pn ? esc(b.name) + ' - ' : ''}Zone : ${esc(D.REGION[b.region].name)}${b.paired ? ' - os pair' : ''}` +
        `${b.old.length ? '<br>Ancien(s) terme(s) a ne plus utiliser : ' + esc(b.old.join(', ')) : ''}</div>` +
        (subs.length ? `<p class="rv-sec">${def ? 'Parties (jeu Osteologie descriptive)' : 'Principales parties'}</p>` +
          `<div class="subs">${subs.map(s => `<span title="${esc(s.latin)}">${esc(s.name)}</span>`).join('')}</div>` : ''));
    },
    reviewClick(it) { this.review(D.BONE[it.bone], it); },
    tip(it) {
      const b = D.BONE[it.bone], pn = preciseName(b, it), w = pn ? '' : NS.instDesc(it);
      return `${esc(pn || b.name)}${w ? ' (' + esc(w) + ')' : ''}<small>${esc(b.latin)}</small>`;
    },
    leave() {}
  };
})(AQ.game);
