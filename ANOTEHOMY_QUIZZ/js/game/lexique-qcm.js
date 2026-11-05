/* ==========================================================================
   Anotehomy Quizz - game/lexique-qcm.js
   MODE « QCM » des jeux de vocabulaire (js/game/lexique-game.js) : la question (définition, description)
   s'affiche au centre de l'écran, avec entre 2 et 6 propositions (réglage de la configuration) ; on clique
   sur la bonne, ou on tape son numéro (1 à 6).
   --------------------------------------------------------------------------
   Mauvaises propositions (leurres) : chaque jeu donne ses niveaux de proximité (lex.leurres(m) : prédicats,
   du plus proche au plus lointain ; ex. même spécialité et même difficulté, puis même spécialité…). On les
   parcourt dans l'ordre, parmi les éléments retenus par la configuration d'abord, puis parmi tous, jusqu'à
   en avoir assez ; tout élément convient en dernier recours. Sont exclus :
     - les éléments interchangeables avec la réponse ou avec un autre leurre (lex.memeSens, ou une clé de
       réponse commune) : jamais deux bonnes réponses, ni deux propositions synonymes ;
     - les BONNES RÉPONSES DES RECENT (3) QUESTIONS PRÉCÉDENTES : une réponse qui vient d'être donnée ne
       reparaît pas tout de suite comme proposition (elle se reconnaîtrait sans réfléchir).
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc, shuffle } = AQ.util;

  const RECENT = 3;

  /* n leurres pour l'élément m ; lex : le jeu ; pool : éléments de la configuration ; items : tous ;
     exclus : Set des éléments à écarter */
  function choisirLeurres(lex, m, n, pool, items, exclus) {
    const pris = [m], cles = new Set(m._keys);
    const conflit = x => pris.some(p => p === x || (lex.memeSens && lex.memeSens(p, x))) || x._keys.some(k => cles.has(k));
    const niveaux = lex.leurres(m).concat(() => true);
    for (const base of [pool, items]) {
      for (const f of niveaux) {
        if (pris.length > n) return pris.slice(1);
        shuffle(base.filter(f)).forEach(x => {
          if (pris.length <= n && !exclus.has(x) && !conflit(x)) { pris.push(x); x._keys.forEach(k => cles.add(k)); }
        });
      }
    }
    return pris.slice(1);
  }

  /* ---------------- Interface ---------------- */
  let ctx = null, root = null, cur = null, options = [], faites = [];

  function mount(el, c) {
    ctx = c; root = el; faites = [];
    el.innerHTML = NS.lexQuestionHtml() +
      '<div class="lex-choix" id="tChoix" role="group" aria-label="Propositions"></div>' +
      '<div class="btn-row lex-qcm-actions"><button type="button" class="btn" id="tSkipQ">Passer</button></div>' +
      '<p class="lex-aide" id="tAideQ"></p>';
    $('tChoix').addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      if (b) choisir(+b.dataset.i);
    });
    $('tSkipQ').addEventListener('click', () => ctx.skip());
    document.addEventListener('keydown', onKey);
  }

  /* touches 1 à 6 (rangée du haut ou pavé numérique) */
  function onKey(e) {
    if (!cur || NS.lexSession.phase !== 'play' || e.altKey || e.ctrlKey || e.metaKey) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= options.length) { e.preventDefault(); choisir(n - 1); }
  }

  function ask(m) {
    cur = m;
    NS.showLexQuestion(m);
    const n = Math.max(2, Math.min(6, ctx.settings.choices || 4));
    const exclus = new Set(faites.slice(-RECENT));
    options = shuffle([m].concat(choisirLeurres(ctx.lex, m, n - 1, ctx.pool, ctx.items, exclus)));
    faites.push(m);
    const box = $('tChoix');
    box.className = 'lex-choix lex-choix--' + options.length;
    box.innerHTML = options.map((x, i) => `<button type="button" class="lex-option" data-i="${i}">` +
      `<span class="kbd">${i + 1}</span><span class="lex-option__forme">${esc(ctx.lex.label(x))}</span></button>`).join('');
    $('tSkipQ').disabled = false;
    $('tAideQ').textContent = `Cliquez sur la bonne proposition, ou tapez son numéro (1 à ${options.length}).`;
  }

  function choisir(i) {
    const x = options[i];
    if (!x || NS.lexSession.phase !== 'play') return;
    const ok = x === cur;
    /* la bonne proposition en menthe ; celle choisie, si elle est fausse, en rouge */
    $('tChoix').querySelectorAll('.lex-option').forEach((b, k) => {
      b.classList.toggle('is-ok', options[k] === cur);
      b.classList.toggle('is-ko', k === i && !ok);
    });
    ctx.answer(ctx.lex.label(x), ok ? { ok: true } : { ok: false, note: ctx.lex.rappel(x) });
  }

  function lock() {
    $('tChoix').querySelectorAll('.lex-option').forEach((b, k) => {
      b.disabled = true;
      /* question passée : la bonne réponse reste visible */
      if (options[k] === cur) b.classList.add('is-ok');
    });
    $('tSkipQ').disabled = true;
  }

  function unmount() {
    document.removeEventListener('keydown', onKey);
    if (root) root.innerHTML = '';
    ctx = root = cur = null; options = []; faites = [];
  }

  NS.registerLexMode({
    id: 'qcm', name: 'QCM', icon: '📋', status: 'ready', options: ['choices'],
    desc: 'De 2 à 6 propositions : choisissez la bonne.',
    mount, ask, lock, unmount
  });
  Object.assign(NS, { choisirLeurres, QCM_RECENT: RECENT });
})(AQ.game);
