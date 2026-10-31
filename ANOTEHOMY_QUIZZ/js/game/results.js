/* ==========================================================================
   Anotehomy Quizz - game/results.js
   FIN DE PARTIE (score, pourcentage, temps, recapitulatif des erreurs) et
   REVISION (exploration apres la partie : os du squelette, ou parties de
   l'os ou de l'organe etudie). Le contenu propre a chaque jeu vient de son
   adaptateur ; A.results (osteologie, splanchnologie descriptive) : rappel du
   sujet etudie et boutons « Explorer », « Autre ... au hasard », « Rejouer ... ».
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc, fmt } = AQ.util;
  const EN = AQ.engine;
  const { settings, session } = NS;

  /* ---------------- Fin de partie ---------------- */
  function endGame(aborted) {
    clearTimeout(session.nextT);
    clearInterval(session.timer);
    session.elapsed = (performance.now() - session.t0) / 1000;
    session.phase = 'end';
    NS.updateTimer();
    EN.clearMarks(); EN.setHoverEnabled(false); EN.showAll();
    NS.hideSuggest(); NS.hideNotice(); NS.setPrompt(null);
    ['qA', 'qB', 'feedback'].forEach(id => { $(id).hidden = true; });
    $('barFill').style.width = '100%';
    renderResults(aborted);
    /* statistiques du joueur (js/account/profile.js) : une panne ici ne bloque pas les resultats */
    try { if (AQ.account.saveGame) AQ.account.saveGame(aborted); } catch (err) { console.error(err); }
    $('results').hidden = false;
    NS.updateDock();
    EN.frameAll();
  }

  function answerText(l) {
    if (l.skipped) return 'Question passée';
    if (settings.mode === 'B') return `Vous avez cliqué sur : <b>${esc(l.given)}</b>`;
    let a = `Votre réponse : <b>« ${esc(l.given)} »</b>`;
    if (l.note) a += ' - ' + esc(l.note);
    else if (l.oldName) a += l.other && l.other !== l.item ? ' - ancien terme désignant : ' + esc(l.other.name) : ' - ancienne nomenclature';
    else if (l.other) a += ' - ' + NS.adapter().texts.other + ' (' + esc(l.other.name) + ')';
    return a;
  }
  /* nom affiche d'une reponse (precis : "12e cote gauche") */
  const shownName = l => (l.disp && l.disp.name) || l.item.name;

  function renderResults(aborted) {
    const A = NS.adapter(), R = A.results || null, other = R ? R.other() : '';
    const n = session.log.length, pct = n ? Math.round(session.ok / n * 100) : 0, C = 2 * Math.PI * 58;
    const errs = session.log.map((l, i) => [l, i]).filter(([l]) => !l.ok);
    const typos = session.log.map((l, i) => [l, i]).filter(([l]) => l.ok && l.typo);
    const msg = pct === 100 ? 'Parfait\u00a0!' : pct >= 80 ? 'Excellent travail\u00a0!' : pct >= 50 ? 'Bon travail, continuez\u00a0!' : 'Continuez à vous entraîner\u00a0!';
    const item = ([l, i], cls, text) => `<li${cls ? ' class="' + cls + '"' : ''}><div><div class="en">${esc(shownName(l))}<i>${esc(l.item.latin)}</i></div>` +
      `<div class="ea">${text}</div></div><button type="button" class="btn" data-review="${i}">Voir</button></li>`;
    $('resultsCard').innerHTML =
      `<h2 class="res-title">Partie terminée — ${msg}</h2>
      ${R ? `<p class="res-sub">${R.subject()}</p>` : ''}
      <div class="res-top">
        <div class="ring"><svg viewBox="0 0 140 140"><circle class="bg" cx="70" cy="70" r="58"/><circle class="fg" id="ringFg" cx="70" cy="70" r="58" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}"/></svg><div class="pct">${pct}%</div></div>
        <div class="kpis">
          <div class="kpi"><b>${session.points} pts</b><span>Score total</span></div>
          <div class="kpi"><b>${session.ok} / ${n}</b><span>Bonnes réponses</span></div>
          <div class="kpi"><b>${pct} %</b><span>Taux de réussite</span></div>
          <div class="kpi"><b>${fmt(session.elapsed)}</b><span>Temps passé</span></div>
        </div>
      </div>
      ${aborted && n < session.queue.length ? `<p class="fb-note">Partie interrompue : ${n} question(s) traitée(s) sur ${session.queue.length}.</p>` : ''}
      <h3 class="res-sec">Récapitulatif des erreurs (${errs.length})</h3>
      ${errs.length ? `<ul class="errs">${errs.map(e => item(e, '', answerText(e[0]))).join('')}</ul>` : `<div class="perfect">Aucune erreur, toutes les réponses sont correctes en nomenclature TA2.</div>`}
      ${typos.length ? `<h3 class="res-sec">Acceptées avec une faute de frappe (${typos.length})</h3><ul class="errs">${typos.map(t => item(t, 'typo', `Saisi : <b>« ${esc(t[0].given)} »</b>`)).join('')}</ul>` : ''}
      <div class="res-actions"><button type="button" class="btn ghost" id="btnHome">Menu principal</button><button type="button" class="btn" id="btnNewCfg">Nouvelle configuration</button>` +
      (R ? `<button type="button" class="btn" id="btnExplore">${esc(R.explore)}</button>` : '') +
      (other ? `<button type="button" class="btn" id="btnOther">${esc(other)}</button>` : '') +
      `<button type="button" class="btn primary" id="btnReplay">${R ? esc(R.replay) : 'Rejouer'}</button></div>`;
    /* animation de l'anneau apres insertion dans la page */
    requestAnimationFrame(() => requestAnimationFrame(() => { const r = $('ringFg'); if (r) r.style.strokeDashoffset = (C * (1 - pct / 100)).toFixed(1); }));
    $('resultsCard').querySelectorAll('[data-review]').forEach(btn => btn.addEventListener('click', () => {
      const l = session.log[+btn.dataset.review];
      startReview(l.item, l.inst);
    }));
    $('btnReplay').addEventListener('click', () => NS.startGame({ same: true }));
    $('btnNewCfg').addEventListener('click', () => NS.showSetup());
    $('btnHome').addEventListener('click', () => NS.showHome());
    if (R) $('btnExplore').addEventListener('click', () => { startReview(null, null); if (R.onExplore) R.onExplore(); NS.updateDock(); });
    if (other) $('btnOther').addEventListener('click', () => NS.startGame());
  }

  /* ---------------- Revision ---------------- */
  function startReview(item, inst) {
    session.phase = 'review';
    $('results').hidden = true;
    $('btnQuit').hidden = true;
    $('app').className = 'mode-r';
    EN.setHoverEnabled(true);
    NS.adapter().review(item, inst);
    NS.updateDock();
  }
  /* panneau de revision (html du jeu) + bouton de retour aux resultats */
  function reviewPanel(html) {
    const rb = $('reviewBox');
    rb.innerHTML = html + '<div class="btn-row"><button type="button" class="btn primary grow" id="btnBackRes">Retour aux résultats</button></div>';
    rb.hidden = false;
    $('btnBackRes').addEventListener('click', backToResults);
  }
  function backToResults() {
    session.phase = 'end';
    EN.clearMarks(); EN.setHoverEnabled(false); hideTip(); NS.setPrompt(null);
    $('reviewBox').hidden = true;
    $('app').className = settings.mode === 'A' ? 'mode-a' : 'mode-b';
    $('results').hidden = false;
    NS.updateDock();
    EN.frameAll();
  }

  /* ---------------- Info-bulle (revision) ---------------- */
  function showTip(it, e) {
    const t = $('tooltip'), r = $('stage').getBoundingClientRect();
    t.innerHTML = NS.adapter().tip(it);
    t.hidden = false;
    const x = Math.min(e.clientX - r.left + 14, r.width - t.offsetWidth - 8), y = e.clientY - r.top + 16;
    t.style.left = Math.max(8, x) + 'px';
    t.style.top = (y + t.offsetHeight > r.height ? y - t.offsetHeight - 24 : y) + 'px';
  }
  function hideTip() { $('tooltip').hidden = true; }

  function initResults() {
    EN.hooks.onHover = (it, e) => { if (it && session.phase === 'review') showTip(it, e); else hideTip(); };
  }

  Object.assign(NS, { endGame, startReview, reviewPanel, hideTip, initResults });
})(AQ.game);
