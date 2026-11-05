/* ==========================================================================
   Anotehomy Quizz - game/terms-qcm.js
   MODE « QCM » du jeu « Les termes médicaux » (js/game/terms-game.js) : la définition d'un morphème
   s'affiche au centre de l'écran, avec entre 2 et 6 propositions (réglage de la configuration) ; on
   clique sur la bonne, ou on tape son numéro (1 à 6).
   --------------------------------------------------------------------------
   Choix des mauvaises propositions (leurres), du plus proche au plus lointain, jusqu'à en avoir assez :
     1. même thème (champ domaine) et même type (préfixe, radical, suffixe) ;
     2. même famille de thèmes (anatomie, biologie, médecine, description : MORPHEME_THEMES,
        js/data/morphemes.js) et même type ;
     3. même thème, autre type ;  4. même type, n'importe quel thème ;  5. n'importe lequel.
   Toujours parmi les types choisis dans la configuration d'abord. Sont exclus :
     - les morphèmes de même sens que la réponse ou qu'un autre leurre (deux bonnes réponses possibles,
       ou deux propositions synonymes) et ceux qui partagent une forme avec eux ;
     - les BONNES RÉPONSES DES RECENT (3) QUESTIONS PRÉCÉDENTES : une réponse qui vient d'être donnée ne
       reparaît pas tout de suite comme proposition (elle se reconnaîtrait sans réfléchir).
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc, shuffle } = AQ.util;

  const RECENT = 3;
  const FAMILLE = {};
  (AQ.data.MORPHEME_THEMES || []).forEach(t => { FAMILLE[t.name] = t.famille; });

  /* n leurres pour le morphème m ; pool : morphèmes des types choisis ; items : tous ; exclus : Set */
  function choisirLeurres(m, n, pool, items, exclus) {
    const pris = [], sens = new Set([m._sens]), formes = new Set(m._keys);
    const libre = x => x !== m && !exclus.has(x) && !sens.has(x._sens) && !x._keys.some(k => formes.has(k));
    const prendre = x => { pris.push(x); sens.add(x._sens); x._keys.forEach(k => formes.add(k)); };
    const fam = FAMILLE[m.domaine];
    const niveaux = [
      x => x.domaine === m.domaine && x.type === m.type,
      x => !!fam && FAMILLE[x.domaine] === fam && x.type === m.type,
      x => x.domaine === m.domaine,
      x => x.type === m.type,
      () => true
    ];
    for (const base of [pool, items]) {
      for (const f of niveaux) {
        if (pris.length >= n) return pris;
        shuffle(base.filter(f)).forEach(x => { if (pris.length < n && libre(x)) prendre(x); });
      }
    }
    return pris;
  }

  /* ---------------- Interface ---------------- */
  let ctx = null, root = null, cur = null, options = [], faites = [];

  function mount(el, c) {
    ctx = c; root = el; faites = [];
    el.innerHTML = NS.termDefinitionHtml() +
      '<div class="termes-choix" id="tChoix" role="group" aria-label="Propositions"></div>' +
      '<div class="btn-row termes-qcm-actions"><button type="button" class="btn" id="tSkipQ">Passer</button></div>' +
      '<p class="termes-aide" id="tAideQ"></p>';
    $('tChoix').addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      if (b) choisir(+b.dataset.i);
    });
    $('tSkipQ').addEventListener('click', () => ctx.skip());
    document.addEventListener('keydown', onKey);
  }

  /* touches 1 à 6 (rangée du haut ou pavé numérique) */
  function onKey(e) {
    if (!cur || NS.termsSession.phase !== 'play' || e.altKey || e.ctrlKey || e.metaKey) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= options.length) { e.preventDefault(); choisir(n - 1); }
  }

  function ask(m) {
    cur = m;
    NS.showTermDefinition(m);
    const n = Math.max(2, Math.min(6, ctx.settings.choices || 4));
    const exclus = new Set(faites.slice(-RECENT));
    options = shuffle([m].concat(choisirLeurres(m, n - 1, ctx.pool, ctx.items, exclus)));
    faites.push(m);
    const box = $('tChoix');
    box.className = 'termes-choix termes-choix--' + options.length;
    box.innerHTML = options.map((x, i) => `<button type="button" class="termes-option" data-i="${i}">` +
      `<span class="kbd">${i + 1}</span><span class="termes-option__forme">${esc(x.morpheme)}</span></button>`).join('');
    $('tSkipQ').disabled = false;
    $('tAideQ').textContent = `Cliquez sur la bonne proposition, ou tapez son numéro (1 à ${options.length}).`;
  }

  function choisir(i) {
    const x = options[i];
    if (!x || NS.termsSession.phase !== 'play') return;
    const ok = x === cur;
    /* la bonne proposition en menthe ; celle choisie, si elle est fausse, en rouge */
    $('tChoix').querySelectorAll('.termes-option').forEach((b, k) => {
      b.classList.toggle('is-ok', options[k] === cur);
      b.classList.toggle('is-ko', k === i && !ok);
    });
    ctx.answer(x.morpheme, ok ? { ok: true } : { ok: false, note: `« ${x.morpheme} » signifie : ${x.sens}.` });
  }

  function lock() {
    $('tChoix').querySelectorAll('.termes-option').forEach((b, k) => {
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

  NS.registerTermMode({
    id: 'qcm', name: 'QCM', icon: '📋', status: 'ready', options: ['choices'],
    desc: 'De 2 à 6 morphèmes proposés : choisissez le bon.',
    mount, ask, lock, unmount
  });
  Object.assign(NS, { choisirLeurres, QCM_RECENT: RECENT });
})(AQ.game);
