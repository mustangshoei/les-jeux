/* ==========================================================================
   Anotehomy Quizz - game/terms-game.js
   JEU « LES TERMES MÉDICAUX » (chapitre « La langue médicale ») : les morphèmes du vocabulaire médical
   (préfixes, radicaux, suffixes : js/data/morphemes.js). Jeu SANS 3D, avec ses propres écrans :
   configuration (#termsSetup), partie (#termsPlay), résultats (#termsResults). Ouvert depuis le menu par
   js/game/home.js (SCREENS['termes-medicaux']).
   --------------------------------------------------------------------------
   Ce fichier gère ce qui est commun à tous les modes : configuration, tirage des questions, compteur,
   score, temps, retour après chaque réponse, résultats et statistiques (js/account/profile.js).
   Chaque MODE DE JEU s'enregistre dans TERM_MODES (registerTermMode) :
     id, name, icon, desc   carte du mode dans la configuration
     status                 'ready' (jouable) ou 'soon' (carte grisée, « Bientôt »)
     options                options de la configuration qui le concernent (les autres sont cachées) :
                            'auto' (suggestions), 'tol' (fautes de frappe), 'choices' (nombre de propositions)
     mount(el, ctx)         construit l'interface de question dans el, au début de la partie.
                            ctx.answer(given, r) : réponse donnée (given : texte affiché, r : { ok, typo,
                            note }), ctx.skip() : question passée, ctx.settings, ctx.items (tous les
                            morphèmes), ctx.pool (ceux de la configuration)
     ask(m)                 affiche la question du morphème m
     lock()                 fige l'interface pendant le retour immédiat
     unmount()              fin de partie
   Modes : « Devinette » (js/game/terms-devinette.js), « QCM » (js/game/terms-qcm.js). Tous deux affichent
   la définition avec termDefinitionHtml / showTermDefinition (ci-dessous).
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc, fmt, clamp, shuffle, cle } = AQ.util;
  const D = AQ.data;
  const GAME_ID = 'termes-medicaux';

  const TYPES = [
    { id: 'Préfixe', name: 'Préfixes', ex: 'hyper-, tachy-, endo-' },
    { id: 'Radical', name: 'Radicaux', ex: 'hépat(o)-, cardi(o)-' },
    { id: 'Suffixe', name: 'Suffixes', ex: '-ite, -ectomie, -algie' }
  ];

  /* ---------------- Modes de jeu ---------------- */
  const TERM_MODES = {};
  const MODE_ORDER = ['devinette', 'qcm'];   /* ordre des cartes ; un mode inconnu se range à la fin */
  function registerTermMode(m) {
    if (!MODE_ORDER.includes(m.id)) MODE_ORDER.push(m.id);
    TERM_MODES[m.id] = Object.assign(TERM_MODES[m.id] || {}, m);
  }

  /* ---------------- Données ----------------
     Chaque morphème reçoit (une fois) :
       name   = morpheme (nom commun à tous les jeux : statistiques, « à revoir »)
       _keys  clés de réponse : chaque forme (« a-, an- »), avec et sans sa voyelle de liaison
              (« hépat(o)- » -> 'hepato' et 'hepat') ; la première est la forme complète de la 1re forme
       _sens  sens normalisé (deux morphèmes de même sens et de même type sont synonymes)
       _langue langue d'origine, sans le mot d'origine (qui donnerait la réponse) */
  let ITEMS = null;
  const BY_KEY = new Map();
  function langueDe(origine) {
    if (/\bDCI\b/.test(origine)) return 'Nomenclature des médicaments (DCI)';
    return origine.replace(/\s*[(.].*$/, '').trim() || origine;
  }
  function prepare() {
    if (ITEMS) return ITEMS;
    ITEMS = D.MORPHEMES || [];
    ITEMS.forEach(m => {
      m.name = m.morpheme;
      const keys = [];
      m.morpheme.split(',').forEach(forme => {
        [cle(forme), cle(forme.replace(/\([^)]*\)/g, ''))].forEach(k => { if (k && !keys.includes(k)) keys.push(k); });
      });
      m._keys = keys;
      m._sens = cle(m.sens);
      m._langue = langueDe(m.origine);
      keys.forEach(k => { if (!BY_KEY.has(k)) BY_KEY.set(k, []); BY_KEY.get(k).push(m); });
    });
    return ITEMS;
  }
  /* morphèmes dont une forme s'écrit exactement ainsi (clé normalisée) */
  const byKey = k => BY_KEY.get(k) || [];

  /* ---------------- Réglages et session ---------------- */
  /* choices : nombre de propositions du QCM (2 à 6) */
  const settings = { mode: 'devinette', types: new Set(TYPES.map(t => t.id)), count: 15, auto: true, tol: true, choices: 4 };
  /* phase : 'off' (écrans fermés) | 'setup' | 'play' (question ouverte) | 'feedback' (réponse affichée) | 'end' */
  const session = { phase: 'off', game: null, queue: [], idx: 0, log: [], ok: 0, ko: 0, points: 0, t0: 0, elapsed: 0, timer: 0, nextT: 0 };
  const pool = () => prepare().filter(m => settings.types.has(m.type));
  const mode = () => TERM_MODES[settings.mode];
  const isOpen = () => ['termsSetup', 'termsPlay', 'termsResults'].some(id => !$(id).hidden);

  function showOnly(id) {
    ['termsSetup', 'termsPlay', 'termsResults'].forEach(x => { $(x).hidden = x !== id; });
  }

  /* ---------------- Configuration ---------------- */
  function renderSetup() {
    const tous = prepare();
    $('tTypes').innerHTML = TYPES.map(t => {
      const n = tous.filter(m => m.type === t.id).length;
      return `<label class="zone" title="${esc(t.ex)}"><input type="checkbox" value="${t.id}"${settings.types.has(t.id) ? ' checked' : ''}>` +
        `<span class="box"><svg viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3.5"/></svg></span>` +
        `<span class="zn">${esc(t.name)}<small class="termes-zex">${esc(t.ex)}</small></span><span class="zc">${n}</span></label>`;
    }).join('');
    $('tModes').innerHTML = MODE_ORDER.filter(id => TERM_MODES[id]).map(id => {
      const m = TERM_MODES[id], pret = m.status === 'ready';
      return `<label class="choix-carte${pret ? '' : ' is-soon'}"${pret ? '' : ' aria-disabled="true"'}>` +
        `<input type="radio" name="tmode" value="${id}"${id === settings.mode ? ' checked' : ''}${pret ? '' : ' disabled'}>` +
        `<span class="choix-carte__icone" aria-hidden="true">${m.icon}</span>` +
        `<span class="choix-carte__titre">${esc(m.name)}${pret ? '' : ' <span class="chip termes-bientot">Bientôt</span>'}</span>` +
        `<span class="choix-carte__desc">${esc(m.desc)}</span></label>`;
    }).join('');
    $('tOptAuto').checked = settings.auto;
    $('tOptTol').checked = settings.tol;
    updateOpts();
    updatePool();
  }
  /* seules les options du mode choisi sont affichées */
  function updateOpts() {
    const opts = (mode() && mode().options) || [];
    $('tOptAuto').closest('label').hidden = !opts.includes('auto');
    $('tOptTol').closest('label').hidden = !opts.includes('tol');
    $('tChoicesWrap').hidden = !opts.includes('choices');
    $('tChoices').querySelectorAll('input').forEach(i => { i.checked = Number(i.value) === settings.choices; });
  }
  const countMax = () => Math.max(1, pool().length);
  function updatePool() {
    const n = pool().length;
    $('tCountNum').max = $('tCountRange').max = Math.max(1, n);
    $('tCountOf').textContent = `sur ${n} morphème${n > 1 ? 's' : ''}`;
    setCount(settings.count, false, true);
    const pret = mode() && mode().status === 'ready';
    $('tStart').disabled = n === 0 || !pret;
    $('tWarn').textContent = n === 0 ? 'Cochez au moins un type de morphème.' : '';
  }
  /* keep : simple mise à jour de l'affichage (le nombre souhaité est gardé, même au-delà du maximum) */
  function setCount(v, typing, keep) {
    let c = parseInt(v, 10);
    if (isNaN(c)) { if (typing) return; c = settings.count; }
    c = clamp(c, 1, countMax());
    if (!keep) settings.count = c;
    if (!typing || String(c) !== $('tCountNum').value) $('tCountNum').value = c;
    $('tCountRange').value = c;
    const max = countMax();
    $('tCountAll').textContent = max;
    document.querySelectorAll('#tCountPresets [data-nombre]').forEach(b => {
      const tous = b.dataset.nombre === 'max', n = tous ? max : Number(b.dataset.nombre);
      b.hidden = !tous && n >= max;
      b.classList.toggle('on', n === c);
      b.setAttribute('aria-pressed', String(n === c));
    });
  }

  /* ouverture depuis le menu (js/game/home.js) */
  function open(g, logo) {
    session.game = g;
    $('tSetupTitle').textContent = g.name;
    $('tSetupSub').textContent = g.tagline;
    const l = $('tSetupLogo');
    l.innerHTML = logo.html;
    l.style.setProperty('--teinte', logo.tint[0]);
    l.style.setProperty('--teinte-ombre', logo.tint[1]);
    showSetup();
  }
  function showSetup() {
    stopTimers();
    session.phase = 'setup';
    showOnly('termsSetup');
    renderSetup();
  }
  /* retour au menu : tout est fermé (appelé par showHome, js/game/home.js) */
  function close() {
    if (session.phase === 'off') return;
    stopTimers();
    unmountMode();
    session.phase = 'off';
    showOnly(null);
  }
  function stopTimers() { clearTimeout(session.nextT); clearInterval(session.timer); }

  /* ---------------- Partie ---------------- */
  let monte = null;   /* mode dont l'interface est construite */
  function unmountMode() { if (monte && monte.unmount) monte.unmount(); monte = null; }

  function start() {
    const M = mode(), p = pool();
    if (!M || M.status !== 'ready' || !p.length) return;
    stopTimers();
    unmountMode();
    session.queue = shuffle(p.slice()).slice(0, Math.min(settings.count, p.length));
    Object.assign(session, { idx: 0, log: [], ok: 0, ko: 0, points: 0, t0: performance.now(), elapsed: 0 });
    $('tModeChip').textContent = M.name;
    showOnly('termsPlay');
    $('tFeedback').hidden = true;
    monte = M;
    M.mount($('tQuestion'), { settings, items: prepare(), pool: p, byKey, answer, skip });
    session.timer = setInterval(updateTimer, 250);
    updateTimer();
    next();
  }
  const inGame = () => session.phase === 'play' || session.phase === 'feedback';
  const cur = () => session.queue[session.idx];
  function updateTimer() { $('tTimer').textContent = fmt(inGame() ? (performance.now() - session.t0) / 1000 : session.elapsed); }
  function updateHud() {
    const N = session.queue.length;
    $('tCounter').textContent = `Question ${Math.min(session.idx + 1, N)} / ${N}`;
    $('tBar').style.width = (N ? session.log.length / N * 100 : 0) + '%';
    $('tScore').textContent = session.points;
    $('tOk').textContent = session.ok;
    $('tKo').textContent = session.ko;
  }
  function next() {
    clearTimeout(session.nextT);
    $('tFeedback').hidden = true;
    if (session.idx >= session.queue.length) { end(false); return; }
    session.phase = 'play';
    updateHud();
    monte.ask(cur());
  }
  function skip() { if (session.phase === 'play') answer(null, { ok: false, skipped: true }); }
  /* r : { ok, typo, note, skipped } */
  function answer(given, r) {
    if (session.phase !== 'play') return;
    const m = cur(), ok = !!r.ok;
    session.phase = 'feedback';
    session.log.push({ item: m, ok, given, typo: !!r.typo, note: r.note || null, skipped: !!r.skipped });
    if (ok) { session.ok++; session.points += r.typo ? 7 : 10; } else session.ko++;
    updateHud();
    monte.lock();
    showFeedback(m, ok, given, r);
  }

  /* ---------------- Définition (commune aux modes) ----------------
     La définition au centre, et trois indices : type, langue d'origine (sans le mot d'origine, qui donnerait
     la réponse), thème. */
  const termDefinitionHtml = () => '<p class="qlabel termes-qlabel">Définition</p><p class="termes-sens" id="tSens"></p>' +
    '<div class="termes-indices" id="tIndices" aria-label="Indices"></div>';
  function showTermDefinition(m) {
    $('tSens').textContent = m.sens;
    $('tIndices').innerHTML = [m.type, m._langue, m.domaine].map(t => `<span class="chip">${esc(t)}</span>`).join('');
  }

  /* ---------------- Retour immédiat ---------------- */
  const ICON_OK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const ICON_KO = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  /* fiche d'un morphème : forme, type, origine, exemples */
  const ficheHtml = m => `<div class="termes-fiche"><b class="termes-forme">${esc(m.morpheme)}</b>` +
    `<span class="termes-meta">${esc(m.type)} · ${esc(m.origine)}</span></div>` +
    `<ul class="termes-ex">${m.exemples.map(x => `<li><b>${esc(x.mot)}</b> : ${esc(x.explication)}</li>`).join('')}</ul>`;

  function showFeedback(m, ok, given, r) {
    /* temps de lecture : les exemples restent affichés un peu plus longtemps après une erreur */
    const wait = ok ? (r.note || r.typo ? 3600 : 2600) : 5200, fb = $('tFeedback');
    let title, body = '', note = '';
    if (ok) {
      title = 'Correct !';
      if (r.typo) note = `Réponse acceptée malgré une faute de frappe : « ${esc(given)} ».`;
    } else {
      title = r.skipped ? 'Réponse passée' : 'Incorrect';
      if (given) body += `<p class="termes-donne">Votre réponse : « ${esc(given)} »</p>`;
      body += '<p class="termes-donne">Bonne réponse :</p>';
    }
    if (r.note) note += (note ? '<br>' : '') + esc(r.note);
    body += ficheHtml(m);
    fb.className = 'feedback termes-feedback ' + (ok ? 'ok' : 'ko');
    fb.innerHTML = `<div class="fb-title">${ok ? ICON_OK : ICON_KO}${title}</div><div class="fb-body">${body}</div>` +
      (note ? `<div class="fb-note">${note}</div>` : '') +
      `<div class="fb-next"><div class="fb-timer"><div id="tFbBar"></div></div><button type="button" class="btn" id="tNext">Suivant<span class="kbd">Entrée</span></button></div>`;
    fb.hidden = false;
    const bar = $('tFbBar');
    if (bar.animate) bar.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: wait, easing: 'linear', fill: 'forwards' });
    $('tNext').addEventListener('click', goNext);
    session.nextT = setTimeout(goNext, wait);
  }
  function goNext() {
    if (session.phase !== 'feedback') return;
    clearTimeout(session.nextT);
    session.idx++;
    next();
  }

  /* ---------------- Fin de partie ---------------- */
  const detail = () => TYPES.filter(t => settings.types.has(t.id)).map(t => t.name.toLowerCase()).join(', ')
    .replace(/^./, c => c.toUpperCase()) + (settings.mode === 'qcm' ? ' - ' + settings.choices + ' propositions' : '');

  function end(aborted) {
    stopTimers();
    session.elapsed = (performance.now() - session.t0) / 1000;
    session.phase = 'end';
    unmountMode();
    renderResults(aborted);
    showOnly('termsResults');
    /* statistiques du joueur : une panne ici ne bloque pas les résultats */
    try {
      if (AQ.account.saveGame) {
        AQ.account.saveGame(aborted, { game: session.game, mode: settings.mode, log: session.log, ok: session.ok,
          points: session.points, elapsed: session.elapsed, total: session.queue.length, detail: detail() });
      }
    } catch (err) { console.error(err); }
  }

  function renderResults(aborted) {
    const n = session.log.length, pct = n ? Math.round(session.ok / n * 100) : 0, C = 2 * Math.PI * 58;
    const errs = session.log.filter(l => !l.ok), typos = session.log.filter(l => l.ok && (l.typo || l.note));
    const msg = pct === 100 ? 'Parfait !' : pct >= 80 ? 'Excellent travail !' : pct >= 50 ? 'Bon travail, continuez !' : 'Continuez à vous entraîner !';
    const ligne = (l, cls, texte) => `<li${cls ? ' class="' + cls + '"' : ''}><div><div class="en">${esc(l.item.morpheme)}<i>${esc(l.item.type)} · ${esc(l.item.sens)}</i></div>` +
      `<div class="ea">${texte}</div></div></li>`;
    const reponse = l => l.skipped ? 'Question passée' : `Votre réponse : <b>« ${esc(l.given)} »</b>` + (l.note ? ' - ' + esc(l.note) : '');
    $('tResultsCard').innerHTML =
      `<h2 class="res-title">Partie terminée — ${msg}</h2>
      <p class="res-sub">${esc(mode().name)} · <b>${esc(detail())}</b></p>
      <div class="res-top">
        <div class="ring"><svg viewBox="0 0 140 140"><circle class="bg" cx="70" cy="70" r="58"/><circle class="fg" id="tRingFg" cx="70" cy="70" r="58" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}"/></svg><div class="pct">${pct}%</div></div>
        <div class="kpis">
          <div class="kpi"><b>${session.points} pts</b><span>Score total</span></div>
          <div class="kpi"><b>${session.ok} / ${n}</b><span>Bonnes réponses</span></div>
          <div class="kpi"><b>${pct} %</b><span>Taux de réussite</span></div>
          <div class="kpi"><b>${fmt(session.elapsed)}</b><span>Temps passé</span></div>
        </div>
      </div>
      ${aborted && n < session.queue.length ? `<p class="fb-note">Partie interrompue : ${n} question(s) traitée(s) sur ${session.queue.length}.</p>` : ''}
      <h3 class="res-sec">Récapitulatif des erreurs (${errs.length})</h3>
      ${errs.length ? `<ul class="errs">${errs.map(l => ligne(l, '', reponse(l))).join('')}</ul>` : '<div class="perfect">Aucune erreur, tous les morphèmes ont été trouvés.</div>'}
      ${typos.length ? `<h3 class="res-sec">Acceptées avec une remarque (${typos.length})</h3><ul class="errs">${typos.map(l => ligne(l, 'typo', `Saisi : <b>« ${esc(l.given)} »</b>` + (l.note ? ' - ' + esc(l.note) : ''))).join('')}</ul>` : ''}
      <div class="res-actions"><button type="button" class="btn ghost" id="tBtnHome">Menu principal</button><button type="button" class="btn" id="tBtnCfg">Nouvelle configuration</button><button type="button" class="btn primary" id="tBtnReplay">Rejouer</button></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => { const r = $('tRingFg'); if (r) r.style.strokeDashoffset = (C * (1 - pct / 100)).toFixed(1); }));
    $('tBtnHome').addEventListener('click', () => NS.showHome(session.game ? session.game.chapter : null));
    $('tBtnCfg').addEventListener('click', showSetup);
    $('tBtnReplay').addEventListener('click', start);
  }

  /* ---------------- Branchements ---------------- */
  function initTerms() {
    $('tTypes').addEventListener('change', e => {
      if (!e.target.matches('input')) return;
      if (e.target.checked) settings.types.add(e.target.value); else settings.types.delete(e.target.value);
      updatePool();
    });
    const setAll = on => {
      $('tTypes').querySelectorAll('input').forEach(i => { i.checked = on; if (on) settings.types.add(i.value); else settings.types.delete(i.value); });
      updatePool();
    };
    $('tAllTypes').addEventListener('click', () => setAll(true));
    $('tNoTypes').addEventListener('click', () => setAll(false));
    $('tModes').addEventListener('change', e => {
      if (!e.target.matches('input[name=tmode]')) return;
      settings.mode = e.target.value;
      updateOpts();
      updatePool();
    });
    $('tCountNum').addEventListener('input', e => setCount(e.target.value, true));
    $('tCountNum').addEventListener('change', e => setCount(e.target.value));
    $('tCountRange').addEventListener('input', e => setCount(e.target.value));
    document.querySelectorAll('#termsSetup [data-tpas]').forEach(b => b.addEventListener('click', () => setCount(settings.count + Number(b.dataset.tpas))));
    $('tCountPresets').addEventListener('click', e => {
      const b = e.target.closest('[data-nombre]');
      if (b) setCount(b.dataset.nombre === 'max' ? countMax() : b.dataset.nombre);
    });
    $('tOptAuto').addEventListener('change', e => { settings.auto = e.target.checked; });
    $('tOptTol').addEventListener('change', e => { settings.tol = e.target.checked; });
    $('tChoices').addEventListener('change', e => { if (e.target.matches('input')) settings.choices = Number(e.target.value); });
    $('tStart').addEventListener('click', start);
    $('tQuit').addEventListener('click', () => { if (inGame()) end(true); });
    /* Entrée pendant le retour immédiat : question suivante */
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.repeat && session.phase === 'feedback' && !$('termsPlay').hidden) { e.preventDefault(); goNext(); }
    });
    NS.SCREENS[GAME_ID] = { open, close };
  }

  Object.assign(NS, { initTerms, registerTermMode, TERM_MODES, termsOpen: isOpen, termsSession: session, termDefinitionHtml, showTermDefinition, termsSettings: settings, prepareTerms: prepare });
})(AQ.game);
