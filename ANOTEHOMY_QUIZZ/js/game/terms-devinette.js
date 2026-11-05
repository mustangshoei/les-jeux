/* ==========================================================================
   Anotehomy Quizz - game/terms-devinette.js
   MODE « DEVINETTE » du jeu « Les termes médicaux » (js/game/terms-game.js) : la définition d'un
   morphème s'affiche au centre de l'écran, avec des indices (type, langue d'origine, thème) ; le joueur
   écrit le morphème. Suggestions de saisie : js/game/terms-suggest.js.
   --------------------------------------------------------------------------
   Correction (evaluateTerm) : la saisie est normalisée (AQ.util.cle : sans accents, majuscules, tirets,
   parenthèses ni espaces), puis comparée aux formes du morphème demandé, avec ou sans voyelle de liaison
   (« hepato », « hepat » et « hépat(o)- » valent « hépat(o)- »).
     - forme d'un AUTRE morphème de même sens et de même type (néphr(o)- pour rén(o)-, « Rein ») :
       acceptée, avec la forme attendue en rappel ;
     - même sens mais autre type (-cyte, suffixe, pour cyt(o)-, radical) : fausse, avec l'explication ;
     - autre morphème : fausse, avec son sens ;
     - tolérance aux fautes de frappe (option) : comme les autres jeux (js/game/matcher.js, tolFor), la
       saisie est rapprochée de TOUTES les formes connues ; elle n'est juste que si la plus proche est celle
       du morphème demandé (ou d'un synonyme). Une réponse avec une faute vaut 7 points au lieu de 10.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, cle } = AQ.util;

  /* « un préfixe », « un radical », « un suffixe » */
  const typeMin = m => m.type.toLowerCase();

  /* Verdict quand la saisie désigne d'autres morphèmes que celui demandé (list), exactement ou à une faute près */
  function autre(list, m, typo) {
    const syn = list.find(x => x.type === m.type && x._sens === m._sens);
    if (syn) return { ok: true, typo, note: `« ${syn.morpheme} » a le même sens. Forme attendue ici : « ${m.morpheme} ».` };
    const memeSens = list.find(x => x._sens === m._sens);
    if (memeSens) return { ok: false, note: `« ${memeSens.morpheme} » a bien ce sens, mais c'est un ${typeMin(memeSens)} : on attendait un ${typeMin(m)}.` };
    const o = list[0];
    return { ok: false, note: `« ${o.morpheme} » est un autre ${typeMin(o)} : ${o.sens}.` };
  }

  /* raw : saisie du joueur ; m : morphème demandé ; items : tous les morphèmes ; byKey : clé -> morphèmes */
  function evaluateTerm(raw, m, items, byKey, tol) {
    const q = cle(raw);
    if (!q) return { ok: false };
    if (m._keys.includes(q)) return { ok: true };
    const exacts = byKey(q);
    if (exacts.length) return autre(exacts, m, false);
    if (!tol) return { ok: false };
    /* forme connue la plus proche (à égalité, celle du morphème demandé l'emporte) */
    let best = { d: Infinity, m: null, k: '' };
    items.forEach(x => x._keys.forEach(k => {
      const d = NS.lev(q, k);
      if (d < best.d || (d === best.d && x === m && best.m !== m)) best = { d, m: x, k };
    }));
    if (!best.m || best.d > NS.tolFor(Math.max(q.length, best.k.length))) return { ok: false };
    if (best.m === m) return { ok: true, typo: true };
    return autre([best.m], m, true);
  }

  /* ---------------- Interface ---------------- */
  let ctx = null, root = null, cur = null, sugg = null, liste = null;

  function mount(el, c) {
    ctx = c; root = el;
    el.innerHTML = NS.termDefinitionHtml() + `
      <form class="termes-form" id="tForm" autocomplete="off" novalidate>
        <div class="input-wrap">
          <input class="answer termes-answer" id="tAnswer" type="text" spellcheck="false" autocapitalize="off" autocomplete="off"
            placeholder="Écrivez le morphème…" aria-label="Morphème correspondant à la définition">
          <ul class="suggest" id="tSuggest" hidden></ul>
        </div>
        <div class="btn-row">
          <button type="submit" class="btn primary grow" id="tSubmit">Valider<span class="kbd">Entrée</span></button>
          <button type="button" class="btn" id="tSkip">Passer</button>
        </div>
        <p class="termes-aide">Accents, majuscules, tirets et parenthèses ne comptent pas : « hepato » = « hépat(o)- ».</p>
      </form>`;
    /* suggestions : les morphèmes des types choisis (tous, pas seulement ceux de la partie : aucun indice) */
    liste = c.pool.map(m => ({ label: m.morpheme, keys: m._keys, hint: m.type }));
    sugg = NS.creerSuggestions({
      input: $('tAnswer'), list: $('tSuggest'), entries: () => liste,
      enabled: () => ctx.settings.auto && NS.termsSession.phase === 'play'
    });
    $('tForm').addEventListener('submit', e => { e.preventDefault(); submit(); });
    $('tSkip').addEventListener('click', () => ctx.skip());
  }

  function submit() {
    const inp = $('tAnswer'), raw = inp.value.trim();
    if (!cle(raw)) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.focus(); return; }
    ctx.answer(raw, evaluateTerm(raw, cur, ctx.items, ctx.byKey, ctx.settings.tol));
  }

  function ask(m) {
    cur = m;
    NS.showTermDefinition(m);
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

  NS.registerTermMode({
    id: 'devinette', name: 'Devinette', icon: '💭', status: 'ready', options: ['auto', 'tol'],
    desc: 'Une définition s\'affiche : écrivez le morphème qui lui correspond.',
    mount, ask, lock, unmount
  });
  Object.assign(NS, { evaluateTerm });
})(AQ.game);
