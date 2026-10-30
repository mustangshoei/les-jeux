/* ==========================================================================
   Anotehomy Quizz - game/play.js
   DEROULEMENT D'UNE PARTIE, commun aux jeux : questions, validation
   immediate, retour visuel, recentrage fluide de la camera. Gere les modes A
   (nommage) et B (ciblage). Ce qui depend du jeu (os du squelette, parties
   d'un os) est delegue a son adaptateur (NS.adapter(), voir osteo-game.js).
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc, fmt } = AQ.util;
  const EN = AQ.engine;
  const { settings, session } = NS;

  const ICON_OK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const ICON_KO = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  /* textes du panneau et des commandes selon le jeu */
  function applyTexts(A) {
    const t = A.texts;
    $('qTitleA').textContent = t.qTitleA;
    $('answerInput').placeholder = t.placeholder;
    $('qTitleB').textContent = t.qTitleB;
    $('zFit').title = t.fit; $('zFit').setAttribute('aria-label', t.fit);
    $('zTarget').title = t.target; $('zTarget').setAttribute('aria-label', t.target);
    $('panelCredits').textContent = t.credits || 'Modèle 3D : BodyParts3D, © DBCLS, CC BY 4.0';
  }

  /* ---------------- Lancement ---------------- */
  /* opts.same : meme os que la partie precedente (osteologie) */
  function startGame(opts) {
    if (session.starting) return;
    const A = NS.adapter();
    session.starting = true;
    $('startBtn').disabled = true;
    if (!EN.isReady()) $('setupWarn').textContent = 'Chargement du modèle 3D…';
    clearTimeout(session.nextT);
    clearInterval(session.timer);
    /* la 3D ne démarre qu'ici, à la première partie (js/main.js), puis l'affichage reprend */
    NS.ensure3D().then(() => {
      EN.resume();
      EN.clearMarks();
      return A.build(opts || {});
    }).then(queue => {
      session.starting = false;
      $('setupWarn').textContent = '';
      if (!queue.length) { NS.showSetup(); return; }
      session.queue = queue;
      Object.assign(session, { idx: 0, log: [], ok: 0, ko: 0, points: 0, t0: performance.now(), elapsed: 0 });
      ['home', 'setup', 'results', 'reviewBox'].forEach(id => { $(id).hidden = true; });
      $('btnQuit').hidden = false;
      $('app').className = settings.mode === 'A' ? 'mode-a' : 'mode-b';
      $('modeChip').textContent = settings.mode === 'A' ? 'Nommage' : 'Ciblage';
      applyTexts(A);
      NS.updateDock();
      EN.setHoverEnabled(settings.mode === 'B');
      session.timer = setInterval(updateTimer, 250);
      updateTimer();
      nextQuestion();
    }).catch(err => {
      session.starting = false;
      console.error(err);
      NS.showSetup();
      $('setupWarn').textContent = 'Impossible de lancer la partie : ' + (err && err.message ? err.message : err);
    });
  }

  /* ---------------- Indicateurs temps reel ---------------- */
  function updateTimer() { $('timer').textContent = fmt(NS.inGame() ? (performance.now() - session.t0) / 1000 : session.elapsed); }
  function updateHud() {
    const N = session.queue.length;
    $('qCounter').textContent = `Question ${Math.min(session.idx + 1, N)} / ${N}`;
    $('barFill').style.width = (N ? session.log.length / N * 100 : 0) + '%';
    $('sScore').textContent = session.points;
    $('sOk').textContent = session.ok;
    $('sKo').textContent = session.ko;
  }

  /* ---------------- Question suivante ---------------- */
  function nextQuestion() {
    clearTimeout(session.nextT);
    EN.clearMarks(); EN.showAll();
    NS.hideNotice(); NS.hideSuggest();
    $('feedback').hidden = true;
    if (session.idx >= session.queue.length) { NS.endGame(false); return; }
    session.phase = 'play';
    const A = NS.adapter(), q = NS.curQ(), it = q.item;
    updateHud();
    if (settings.mode === 'A') {
      A.showTarget(q);
      NS.setPrompt('<span class="dot"></span>' + A.texts.promptA);
      $('qA').hidden = false; $('qB').hidden = true;
      const inp = $('answerInput');
      inp.value = ''; inp.disabled = false;
      $('btnSubmit').disabled = false; $('btnSkipA').disabled = false;
      inp.focus({ preventScroll: true });
    } else {
      const d = describe(A, q);
      $('qB').hidden = false; $('qA').hidden = true;
      $('targetName').textContent = d.name;
      $('targetLatin').textContent = 'Latin (TA2) : ' + d.latin;
      $('btnSkipB').disabled = false;
      NS.setPrompt('Cliquez sur : <b>' + esc(d.name) + '</b>');
      A.frameForClick(q);
    }
  }
  /* nom affiche d'une question : precis si l'adaptateur le permet ("12e cote gauche") */
  const describe = (A, q) => A.describe ? A.describe(q) : { name: q.item.name, latin: q.item.latin, where: A.where(q.inst) };

  /* ---------------- Reponses ---------------- */
  function submitA() {
    if (session.phase !== 'play' || settings.mode !== 'A') return;
    const inp = $('answerInput'), raw = inp.value.trim();
    if (!raw) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); return; }
    const q = NS.curQ();
    answer(q, raw, NS.adapter().evaluate(raw, q));
  }
  function skipQuestion() {
    if (session.phase !== 'play') return;
    const q = NS.curQ();
    if (settings.mode === 'B') NS.adapter().reveal(q, null);
    answer(q, null, { ok: false, skipped: true });
  }
  /* mode B : clic sur un objet (pt = point touche, coordonnees du modele) */
  function clickItem(it, pt) {
    if (session.phase !== 'play' || settings.mode !== 'B') return;
    const A = NS.adapter(), q = NS.curQ(), ok = A.isHit(it, q);
    EN.mark(it, ok ? 'ok' : 'ko');
    if (ok) { q.inst = it; EN.setHalo(it, 'ok'); } else A.reveal(q, pt);
    answer(q, A.clickedName(it), { ok });
  }
  function answer(q, given, r) {
    const A = NS.adapter(), ok = !!r.ok;
    session.phase = 'feedback';
    NS.hideSuggest();
    const d = describe(A, q);
    session.log.push({ item: q.item, inst: q.inst, ok, given, typo: !!r.typo, oldName: r.oldName || null, other: r.other || null,
      skipped: !!r.skipped, incomplete: !!r.incomplete, note: r.note || null, where: d.where, disp: d });
    if (ok) { session.ok++; session.points += r.typo ? 7 : 10; } else session.ko++;
    updateHud();
    if (settings.mode === 'A') {
      $('answerInput').disabled = true; $('btnSubmit').disabled = true; $('btnSkipA').disabled = true;
      EN.mark(q.inst, ok ? 'ok' : 'ko');
      EN.setHalo(q.inst, ok ? 'ok' : 'target');
    } else $('btnSkipB').disabled = true;
    showFeedback(q, ok, given, r);
  }

  /* ---------------- Retour immediat ---------------- */
  function showFeedback(q, ok, given, r) {
    const A = NS.adapter(), d = describe(A, q), fb = $('feedback'), wait = ok ? (r.note ? 2200 : 1300) : 3400;
    const nameHtml = `<b>${esc(d.name)}</b>${d.where && settings.mode === 'A' ? ' <span class="fb-where">(' + esc(d.where) + ')</span>' : ''}<div class="latin">${esc(d.latin)}</div>`;
    let title, body = '', note = '';
    if (ok) {
      title = 'Correct\u00a0!';
      body = nameHtml;
      if (r.typo) note = `Réponse acceptée malgré une faute de frappe : « ${esc(given)} ».`;
      if (r.note) note += (note ? '<br>' : '') + esc(r.note);
    } else {
      title = r.skipped ? 'Réponse passée' : r.incomplete ? 'Réponse incomplète' : 'Incorrect';
      if (given && settings.mode === 'B') body += `Vous avez cliqué sur : <b>${esc(given)}</b><br>`;
      if (given && settings.mode === 'A') body += `Votre réponse : « ${esc(given)} »<br>`;
      body += 'Bonne réponse : ' + nameHtml;
      if (r.note) note = esc(r.note);
      else if (r.oldName) note = `« ${esc(r.oldName)} » est un terme de l'ancienne nomenclature${r.other && r.other !== q.item ? ' (= ' + esc(r.other.name) + ')' : ''}. Utilisez le terme TA2.`;
      else if (r.other && settings.mode === 'A') note = `Vous avez nommé ${A.texts.other} : ${esc(r.other.name)}.`;
    }
    NS.setPrompt(ok ? 'Correct : <b>' + esc(d.name) + '</b>' : (r.skipped ? 'Réponse : ' : 'Incorrect, c\'était : ') + '<b>' + esc(d.name) + '</b>', ok ? 'ok' : 'ko');
    fb.className = 'feedback ' + (ok ? 'ok' : 'ko');
    fb.innerHTML = `<div class="fb-title">${ok ? ICON_OK : ICON_KO}${title}</div><div class="fb-body">${body}</div>` +
      (note ? `<div class="fb-note">${note}</div>` : '') +
      `<div class="fb-next"><div class="fb-timer"><div id="fbBar"></div></div><button type="button" class="btn" id="btnNext">Suivant<span class="kbd">Entrée</span></button></div>`;
    fb.hidden = false;
    const bar = $('fbBar');
    if (bar.animate) bar.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: wait, easing: 'linear', fill: 'forwards' });
    $('btnNext').addEventListener('click', goNext);
    session.nextT = setTimeout(goNext, wait);
  }
  function goNext() {
    if (session.phase !== 'feedback') return;
    clearTimeout(session.nextT);
    session.idx++;
    nextQuestion();
  }

  /* bouton "recentrer" : garde l'orientation courante */
  function recenter() {
    const A = NS.adapter(), q = NS.curQ();
    const it = NS.inGame() && q ? q.inst : (session.phase === 'review' ? EN.markedItems()[0] : null);
    if (it && !(settings.mode === 'B' && session.phase === 'play')) A.focus(it, { keep: true }); else EN.frameAll();
  }

  /* ---------------- Commandes propres a l'osteologie (barre du bas) ---------------- */
  const isOsteo = () => !!EN.osteoCurrent();
  function updateDock() {
    const on = isOsteo(), cur = EN.osteoCurrent();
    $('btnNeigh').hidden = !on;
    $('btnAtlas').hidden = !(on && session.phase === 'review');
    $('btnNeigh').setAttribute('aria-pressed', String(!!(cur && cur.neighbors)));
    $('btnAtlas').setAttribute('aria-pressed', String(!!(cur && cur.atlas)));
    updateSubject();
  }
  /* os etudie (osteologie) : rappel permanent dans le panneau et sur la vue 3D */
  function updateSubject() {
    const A = NS.adapter(), s = A.subject ? A.subject() : null;
    $('subjectCard').hidden = !s;
    $('stageBadge').hidden = !s;
    if (!s) return;
    $('subjectLabel').textContent = s.label;
    $('subjectName').textContent = s.name;
    $('stageBadge').innerHTML = esc(s.label) + ' : <b>' + esc(s.name) + '</b>';
  }
  function toggleNeighbors() {
    const cur = EN.osteoCurrent();
    if (!cur) return;
    settings.neighbors = !cur.neighbors;
    EN.setNeighbors(settings.neighbors);
    const o = $('optNeigh');
    if (o) o.checked = settings.neighbors;
    updateDock();
  }
  function toggleAtlas() {
    const cur = EN.osteoCurrent();
    if (!cur || session.phase !== 'review') return;
    EN.setAtlas(!cur.atlas);
    updateDock();
  }

  function initPlay() {
    $('answerForm').addEventListener('submit', e => { e.preventDefault(); submitA(); });
    $('btnSkipA').addEventListener('click', skipQuestion);
    $('btnSkipB').addEventListener('click', skipQuestion);
    $('btnQuit').addEventListener('click', () => { if (NS.inGame()) NS.endGame(true); });
    $('zTarget').addEventListener('click', recenter);
    $('btnNeigh').addEventListener('click', toggleNeighbors);
    $('btnAtlas').addEventListener('click', toggleAtlas);
    /* clic sur un objet : ciblage (mode B) ou identification (revision) */
    EN.hooks.onBoneClick = (it, pt) => {
      if (session.phase === 'review') { NS.adapter().reviewClick(it); NS.hideTip(); return; }
      clickItem(it, pt);
    };
  }

  Object.assign(NS, { startGame, updateTimer, goNext, recenter, initPlay, updateDock, toggleNeighbors, toggleAtlas, applyTexts });
})(AQ.game);
