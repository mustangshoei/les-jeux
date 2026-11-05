/* ==========================================================================
   Anotehomy Quizz - game/lexique-devinette.js
   MODE « DEVINETTE » des jeux de vocabulaire (js/game/lexique-game.js) : la question (définition,
   description) s'affiche au centre de l'écran avec ses indices ; le joueur écrit la réponse.
   Suggestions de saisie : js/game/lexique-suggest.js. La correction est propre à chaque jeu
   (lex.evaluate : js/game/lexique-morphemes.js, js/game/lexique-pathologies.js) ; elle s'appuie sur
   plusProche ci-dessous pour la tolérance aux fautes de frappe.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, cle } = AQ.util;

  /* Tolérance aux fautes de frappe, commune aux jeux : la saisie normalisée q est rapprochée de TOUTES les
     clés connues (keysOf(x) : clés d'un élément) ; renvoie { x, k, d } (élément, clé, nombre de fautes) si la
     plus proche est à distance tolérée (js/game/matcher.js, tolFor), sinon null. À égalité, l'élément
     demandé (cible) l'emporte. */
  function plusProche(q, cible, items, keysOf) {
    let best = { d: Infinity, x: null, k: '' };
    items.forEach(x => keysOf(x).forEach(k => {
      const d = NS.lev(q, k);
      if (d < best.d || (d === best.d && x === cible && best.x !== cible)) best = { d, x, k };
    }));
    return best.x && best.d <= NS.tolFor(Math.max(q.length, best.k.length)) ? best : null;
  }

  /* ---------------- Interface ---------------- */
  let ctx = null, root = null, cur = null, sugg = null, liste = null;

  function mount(el, c) {
    ctx = c; root = el;
    el.innerHTML = NS.lexQuestionHtml() + `
      <form class="lex-form" id="tForm" autocomplete="off" novalidate>
        <div class="input-wrap">
          <input class="answer lex-answer" id="tAnswer" type="text" spellcheck="false" autocapitalize="off" autocomplete="off">
          <ul class="suggest" id="tSuggest" hidden></ul>
        </div>
        <div class="btn-row">
          <button type="submit" class="btn primary grow" id="tSubmit">Valider<span class="kbd">Entrée</span></button>
          <button type="button" class="btn" id="tSkip">Passer</button>
        </div>
        <p class="lex-aide" id="tAide"></p>
      </form>`;
    const inp = $('tAnswer');
    inp.placeholder = c.lex.placeholder;
    inp.setAttribute('aria-label', c.lex.placeholder);
    $('tAide').textContent = c.lex.aide;
    liste = c.lex.suggestions(c.pool);
    sugg = NS.creerSuggestions({
      input: inp, list: $('tSuggest'), entries: () => liste,
      enabled: () => ctx.settings.auto && NS.lexSession.phase === 'play'
    });
    $('tForm').addEventListener('submit', e => { e.preventDefault(); submit(); });
    $('tSkip').addEventListener('click', () => ctx.skip());
  }

  function submit() {
    const inp = $('tAnswer'), raw = inp.value.trim();
    if (!cle(raw)) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.focus(); return; }
    ctx.answer(raw, ctx.lex.evaluate(raw, cur, { items: ctx.items, tol: ctx.settings.tol }));
  }

  function ask(x) {
    cur = x;
    NS.showLexQuestion(x);
    const inp = $('tAnswer');
    inp.value = ''; inp.disabled = false;
    $('tSubmit').disabled = false; $('tSkip').disabled = false;
    sugg.hide();
    inp.focus({ preventScroll: true });
  }
  function lock() {
    sugg.hide();
    $('tAnswer').disabled = true;
    $('tSubmit').disabled = true; $('tSkip').disabled = true;
  }
  function unmount() {
    if (sugg) sugg.destroy();
    if (root) root.innerHTML = '';
    ctx = root = cur = sugg = liste = null;
  }

  NS.registerLexMode({
    id: 'devinette', name: 'Devinette', icon: '💭', status: 'ready', options: ['auto', 'tol'],
    desc: 'La question s\'affiche : écrivez la réponse.',
    mount, ask, lock, unmount
  });
  Object.assign(NS, { lexPlusProche: plusProche });
})(AQ.game);
