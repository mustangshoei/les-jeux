/* ==========================================================================
   Anotehomy Quizz - game/lexique-game.js
   MOTEUR DES JEUX DE VOCABULAIRE (« lexiques ») du chapitre « La langue médicale » : « Les pathologies »
   (js/game/lexique-pathologies.js) et « Les termes médicaux » (js/game/lexique-morphemes.js). Jeux SANS
   3D, avec leurs propres écrans, partagés : configuration (#lexSetup), partie (#lexPlay), résultats
   (#lexResults). Ouverts depuis le menu par js/game/home.js (SCREENS, js/game/state.js).
   --------------------------------------------------------------------------
   Ce fichier gère ce qui est commun : configuration (filtres, nombre de questions, mode, options), tirage
   des questions, compteur, score, temps, retour immédiat, résultats et statistiques.

   LEXIQUE (un par jeu, registerLexique) : ce qui est propre au jeu.
     id                identifiant du jeu (js/data/games.js) ; les statistiques y sont rangées
     items()           tous les éléments, préparés : name (nom affiché et clé des statistiques),
                       _keys (clés de réponse normalisées : la première est celle du nom principal)
     filters           cases de la configuration, croisées : un élément est jouable si, pour CHAQUE
                       filtre, sa valeur (of(x)) est cochée. [{ id, label, of, options: [{ id, name, hint }],
                       souple (bloc qui défile si la place manque) }]. Le nombre affiché à côté d'une
                       case tient compte des autres filtres.
     unit              ['pathologie', 'pathologies'] ; countTitle : titre du nombre de questions
     questionLabel     « Définition », « Description »… ; question(x) : texte au centre de l'écran
     hints(x)          indices sous la question (petites étiquettes)
     fiche(x)          html de la fiche montrée après la réponse ; sub(x) : petit texte des résultats
     label(x)          libellé d'un élément (propositions du QCM)
     detail(sel)       résumé de la configuration (statistiques) ; sel : { idFiltre: Set }
     note, credits     textes de la configuration (html)
     modeDesc          phrase de chaque carte de mode ({ devinette, qcm })
     Devinette :       evaluate(raw, x) -> { ok, typo, note }, suggestions(pool) -> [{ label, keys, motKeys,
                       hint }] (js/game/lexique-suggest.js), placeholder, aide
     QCM :             leurres(m) -> prédicats (x) => booléen, du plus proche au plus lointain ;
                       memeSens(a, b) (facultatif) : deux éléments interchangeables, jamais proposés ensemble
   MODE DE JEU (registerLexMode) : id, name, icon, status ('ready' | 'soon'), options (['auto', 'tol',
     'choices'] : options de la configuration qui le concernent, les autres sont cachées),
     mount(el, ctx), ask(x), lock(), unmount(). ctx : { lex, settings, items, pool, answer(given, r), skip() }.
     Modes : js/game/lexique-devinette.js, js/game/lexique-qcm.js.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc, fmt, clamp, shuffle, listeRepliable, deplierListes } = AQ.util;
  const ECRANS = ['lexSetup', 'lexPlay', 'lexResults'];

  /* ---------------- Registres ---------------- */
  const LEXIQUES = {};
  const LEX_MODES = {};
  const MODE_ORDER = ['devinette', 'qcm'];   /* ordre des cartes ; un mode inconnu se range à la fin */
  function registerLexique(lex) { LEXIQUES[lex.id] = lex; }
  function registerLexMode(m) {
    if (!MODE_ORDER.includes(m.id)) MODE_ORDER.push(m.id);
    LEX_MODES[m.id] = Object.assign(LEX_MODES[m.id] || {}, m);
  }

  /* ---------------- Réglages (un jeu de réglages par lexique) et session ---------------- */
  let lex = null;                 /* lexique ouvert */
  const REGLAGES = {};
  /* sel : cases cochées, par filtre ; choices : nombre de propositions du QCM (2 à 6) */
  function reglagesDe(L) {
    if (!REGLAGES[L.id]) {
      const sel = {};
      L.filters.forEach(f => { sel[f.id] = new Set(f.defaut || f.options.map(o => o.id)); });
      REGLAGES[L.id] = { mode: 'devinette', sel, count: 15, auto: true, tol: true, choices: 4 };
    }
    return REGLAGES[L.id];
  }
  const settings = () => reglagesDe(lex);
  /* phase : 'off' (écrans fermés) | 'setup' | 'play' (question ouverte) | 'feedback' (réponse affichée) | 'end' */
  const session = { phase: 'off', game: null, queue: [], idx: 0, log: [], ok: 0, ko: 0, points: 0, t0: 0, elapsed: 0, timer: 0, nextT: 0 };

  const items = () => lex.items();
  /* élément retenu par les filtres ; sauf : filtre ignoré (comptes affichés à côté de ses cases) */
  const passe = (x, sel, sauf) => lex.filters.every(f => f.id === sauf || sel[f.id].has(String(f.of(x))));
  const pool = () => { const s = settings().sel; return items().filter(x => passe(x, s)); };
  const mode = () => LEX_MODES[settings().mode];
  const isOpen = () => ECRANS.some(id => !$(id).hidden);
  const showOnly = id => ECRANS.forEach(x => { $(x).hidden = x !== id; });
  const pluriel = n => lex.unit[n > 1 ? 1 : 0];

  /* ---------------- Configuration ---------------- */
  const COCHE = '<span class="box"><svg viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3.5"/></svg></span>';
  function renderFilters() {
    $('tFilters').innerHTML = lex.filters.map(f => `<div class="setup-bloc${f.souple ? ' setup-bloc--souple' : ' lex-filtre'}" data-filtre="${f.id}">
        <div class="setup-bloc__tete"><span class="setup-etiquette">${esc(f.label)}</span>
          <span><button type="button" class="link" data-tout="1">Tout</button><button type="button" class="link" data-tout="0">Aucun</button></span></div>
        <div class="zones lex-zones${f.options.length <= 4 ? ' lex-zones--peu' : ''}">${f.options.map(o =>
          `<label class="zone"${o.hint ? ` title="${esc(o.hint)}"` : ''}><input type="checkbox" value="${esc(o.id)}">${COCHE}` +
          `<span class="zn">${esc(o.name)}${o.hint ? `<small class="lex-zex">${esc(o.hint)}</small>` : ''}</span><span class="zc"></span></label>`).join('')}</div>
      </div>`).join('');
  }
  /* cases et nombres : le nombre d'une case tient compte des autres filtres */
  function updateFilters() {
    const s = settings().sel, tous = items();
    lex.filters.forEach(f => {
      const bloc = $('tFilters').querySelector(`[data-filtre="${f.id}"]`);
      bloc.querySelectorAll('.zone').forEach(z => {
        const inp = z.querySelector('input'), id = inp.value;
        const n = tous.filter(x => String(f.of(x)) === id && passe(x, s, f.id)).length;
        inp.checked = s[f.id].has(id);
        z.querySelector('.zc').textContent = n;
        z.classList.toggle('is-vide', n === 0);
      });
    });
  }
  function renderSetup() {
    renderFilters();
    $('tModes').innerHTML = MODE_ORDER.filter(id => LEX_MODES[id]).map(id => {
      const m = LEX_MODES[id], pret = m.status === 'ready', desc = (lex.modeDesc && lex.modeDesc[id]) || m.desc;
      return `<label class="choix-carte${pret ? '' : ' is-soon'}"${pret ? '' : ' aria-disabled="true"'}>` +
        `<input type="radio" name="tmode" value="${id}"${id === settings().mode ? ' checked' : ''}${pret ? '' : ' disabled'}>` +
        `<span class="choix-carte__icone" aria-hidden="true">${m.icon}</span>` +
        `<span class="choix-carte__titre">${esc(m.name)}${pret ? '' : ' <span class="chip lex-bientot">Bientôt</span>'}</span>` +
        `<span class="choix-carte__desc">${esc(desc)}</span></label>`;
    }).join('');
    $('tCountTitle').textContent = lex.countTitle;
    $('tNote').innerHTML = lex.note;
    $('tCredits').innerHTML = lex.credits;
    $('tOptAuto').checked = settings().auto;
    $('tOptTol').checked = settings().tol;
    updateOpts();
    updatePool();
  }
  /* seules les options du mode choisi sont affichées */
  function updateOpts() {
    const opts = (mode() && mode().options) || [], st = settings();
    $('tOptAuto').closest('label').hidden = !opts.includes('auto');
    $('tOptTol').closest('label').hidden = !opts.includes('tol');
    $('tChoicesWrap').hidden = !opts.includes('choices');
    $('tChoices').querySelectorAll('input').forEach(i => { i.checked = Number(i.value) === st.choices; });
  }
  const countMax = () => Math.max(1, pool().length);
  function updatePool() {
    updateFilters();
    const n = pool().length, pret = mode() && mode().status === 'ready';
    $('tCountNum').max = $('tCountRange').max = Math.max(1, n);
    $('tCountOf').textContent = `sur ${n} ${pluriel(n)}`;
    setCount(settings().count, false, true);
    $('tStart').disabled = n === 0 || !pret;
    $('tWarn').textContent = n === 0 ? 'Aucun élément avec ces critères : cochez d\'autres cases.' : '';
  }
  /* keep : simple mise à jour de l'affichage (le nombre souhaité est gardé, même au-delà du maximum) */
  function setCount(v, typing, keep) {
    const st = settings();
    let c = parseInt(v, 10);
    if (isNaN(c)) { if (typing) return; c = st.count; }
    c = clamp(c, 1, countMax());
    if (!keep) st.count = c;
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
    lex = LEXIQUES[g.id];
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
    showOnly('lexSetup');
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
    const M = mode(), p = pool(), st = settings();
    if (!M || M.status !== 'ready' || !p.length) return;
    stopTimers();
    unmountMode();
    session.queue = shuffle(p.slice()).slice(0, Math.min(st.count, p.length));
    Object.assign(session, { idx: 0, log: [], ok: 0, ko: 0, points: 0, t0: performance.now(), elapsed: 0 });
    $('tModeChip').textContent = M.name;
    showOnly('lexPlay');
    $('tFeedback').hidden = true;
    monte = M;
    M.mount($('tQuestion'), { lex, settings: st, items: items(), pool: p, answer, skip });
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
    const x = cur(), ok = !!r.ok;
    session.phase = 'feedback';
    session.log.push({ item: x, ok, given, typo: !!r.typo, note: r.note || null, skipped: !!r.skipped });
    if (ok) { session.ok++; session.points += r.typo ? 7 : 10; } else session.ko++;
    updateHud();
    monte.lock();
    showFeedback(x, ok, given, r);
  }

  /* ---------------- Question (commune aux modes) ----------------
     Le texte au centre (définition, description) et ses indices. */
  const questionHtml = () => '<p class="qlabel lex-qlabel" id="tQLabel"></p><p class="lex-sens" id="tSens"></p>' +
    '<div class="lex-indices" id="tIndices" aria-label="Indices"></div>';
  function showQuestion(x) {
    $('tQLabel').textContent = lex.questionLabel;
    $('tSens').textContent = lex.question(x);
    $('tIndices').innerHTML = lex.hints(x).map(t => `<span class="chip">${esc(t)}</span>`).join('');
  }

  /* ---------------- Retour immédiat ---------------- */
  const ICON_OK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const ICON_KO = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function showFeedback(x, ok, given, r) {
    /* temps de lecture (Entrée ou « Suivant » passent tout de suite) : bien plus long après une erreur,
       pour lire la bonne réponse et sa fiche */
    const wait = ok ? (r.note || r.typo ? 5000 : 3500) : 9000, fb = $('tFeedback');
    let title, body = '', note = '';
    if (ok) {
      title = 'Correct !';
      if (r.typo) note = `Réponse acceptée malgré une faute de frappe : « ${esc(given)} ».`;
    } else {
      title = r.skipped ? 'Réponse passée' : 'Incorrect';
      if (given) body += `<p class="lex-donne">Votre réponse : « ${esc(given)} »</p>`;
      body += '<p class="lex-donne">Bonne réponse :</p>';
    }
    if (r.note) note += (note ? '<br>' : '') + esc(r.note);
    body += lex.fiche(x);
    fb.className = 'feedback lex-feedback ' + (ok ? 'ok' : 'ko');
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
  function detail() {
    const st = settings();
    return lex.detail(st.sel) + (st.mode === 'qcm' ? ' - ' + st.choices + ' propositions' : '');
  }
  function end(aborted) {
    stopTimers();
    session.elapsed = (performance.now() - session.t0) / 1000;
    session.phase = 'end';
    unmountMode();
    renderResults(aborted);
    showOnly('lexResults');
    /* statistiques du joueur : une panne ici ne bloque pas les résultats */
    try {
      if (AQ.account.saveGame) {
        AQ.account.saveGame(aborted, { game: session.game, mode: settings().mode, log: session.log, ok: session.ok,
          points: session.points, elapsed: session.elapsed, total: session.queue.length, detail: detail() });
      }
    } catch (err) { console.error(err); }
  }

  /* résultats : seules les 3 dernières erreurs (et réponses avec remarque) sont affichées, les autres
     derrière un bouton */
  const MAX_LISTE = 3;
  function renderResults(aborted) {
    const n = session.log.length, pct = n ? Math.round(session.ok / n * 100) : 0, C = 2 * Math.PI * 58;
    const errs = session.log.filter(l => !l.ok), remarques = session.log.filter(l => l.ok && (l.typo || l.note));
    const msg = pct === 100 ? 'Parfait !' : pct >= 80 ? 'Excellent travail !' : pct >= 50 ? 'Bon travail, continuez !' : 'Continuez à vous entraîner !';
    const ligne = (l, cls, texte) => `<li${cls ? ' class="' + cls + '"' : ''}><div><div class="en">${esc(lex.label(l.item))}<i>${esc(lex.sub(l.item))}</i></div>` +
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
      ${errs.length ? listeRepliable(errs.map(l => ligne(l, '', reponse(l))), MAX_LISTE, 'erreurs') : `<div class="perfect">Aucune erreur, toutes les ${esc(lex.unit[1])} ont été trouvées.</div>`}
      ${remarques.length ? `<h3 class="res-sec">Acceptées avec une remarque (${remarques.length})</h3>${listeRepliable(remarques.map(l => ligne(l, 'typo', `Saisi : <b>« ${esc(l.given)} »</b>` + (l.note ? ' - ' + esc(l.note) : ''))), MAX_LISTE, 'réponses')}` : ''}
      <div class="res-actions"><button type="button" class="btn ghost" id="tBtnHome">Menu principal</button><button type="button" class="btn" id="tBtnCfg">Nouvelle configuration</button><button type="button" class="btn primary" id="tBtnReplay">Rejouer</button></div>`;
    deplierListes($('tResultsCard'));
    requestAnimationFrame(() => requestAnimationFrame(() => { const r = $('tRingFg'); if (r) r.style.strokeDashoffset = (C * (1 - pct / 100)).toFixed(1); }));
    $('tBtnHome').addEventListener('click', () => NS.showHome(session.game ? session.game.chapter : null));
    $('tBtnCfg').addEventListener('click', showSetup);
    $('tBtnReplay').addEventListener('click', start);
  }

  /* ---------------- Branchements ---------------- */
  function initLexiques() {
    $('tFilters').addEventListener('change', e => {
      if (!e.target.matches('input')) return;
      const s = settings().sel[e.target.closest('[data-filtre]').dataset.filtre];
      if (e.target.checked) s.add(e.target.value); else s.delete(e.target.value);
      updatePool();
    });
    $('tFilters').addEventListener('click', e => {
      const b = e.target.closest('[data-tout]');
      if (!b) return;
      const f = lex.filters.find(x => x.id === b.closest('[data-filtre]').dataset.filtre);
      settings().sel[f.id] = new Set(b.dataset.tout === '1' ? f.options.map(o => o.id) : []);
      updatePool();
    });
    $('tModes').addEventListener('change', e => {
      if (!e.target.matches('input[name=tmode]')) return;
      settings().mode = e.target.value;
      updateOpts();
      updatePool();
    });
    $('tCountNum').addEventListener('input', e => setCount(e.target.value, true));
    $('tCountNum').addEventListener('change', e => setCount(e.target.value));
    $('tCountRange').addEventListener('input', e => setCount(e.target.value));
    document.querySelectorAll('#lexSetup [data-tpas]').forEach(b => b.addEventListener('click', () => setCount(settings().count + Number(b.dataset.tpas))));
    $('tCountPresets').addEventListener('click', e => {
      const b = e.target.closest('[data-nombre]');
      if (b) setCount(b.dataset.nombre === 'max' ? countMax() : b.dataset.nombre);
    });
    $('tOptAuto').addEventListener('change', e => { settings().auto = e.target.checked; });
    $('tOptTol').addEventListener('change', e => { settings().tol = e.target.checked; });
    $('tChoices').addEventListener('change', e => { if (e.target.matches('input')) settings().choices = Number(e.target.value); });
    $('tStart').addEventListener('click', start);
    $('tQuit').addEventListener('click', () => { if (inGame()) end(true); });
    /* Entrée pendant le retour immédiat : question suivante */
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.repeat && session.phase === 'feedback' && !$('lexPlay').hidden) { e.preventDefault(); goNext(); }
    });
    Object.keys(LEXIQUES).forEach(id => { NS.SCREENS[id] = { open, close }; });
  }

  Object.assign(NS, { initLexiques, registerLexique, registerLexMode, LEXIQUES, LEX_MODES, lexOpen: isOpen,
    lexSession: session, lexSettings: settings, lexQuestionHtml: questionHtml, showLexQuestion: showQuestion });
})(AQ.game);
