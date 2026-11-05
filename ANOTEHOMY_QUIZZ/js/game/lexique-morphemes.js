/* ==========================================================================
   Anotehomy Quizz - game/lexique-morphemes.js
   JEU « LES TERMES MÉDICAUX » (2.2, chapitre « La langue médicale ») : les morphèmes du vocabulaire
   médical (préfixes, radicaux, suffixes : js/data/morphemes.js). Lexique du moteur commun
   js/game/lexique-game.js (interface décrite en tête de ce fichier).
   --------------------------------------------------------------------------
   Filtre : le type de morphème. Indices : type, langue d'origine, thème.
   Correction (Devinette) : la saisie est normalisée (AQ.util.cle : sans accents, majuscules, tirets,
   parenthèses ni espaces), puis comparée aux formes du morphème demandé, avec ou sans voyelle de liaison
   (« hepato », « hepat » et « hépat(o)- » valent « hépat(o)- »).
     - forme d'un AUTRE morphème de même sens et de même type (néphr(o)- pour rén(o)-, « Rein ») :
       acceptée, avec la forme attendue en rappel ;
     - même sens mais autre type (-cyte, suffixe, pour cyt(o)-, radical) : fausse, avec l'explication ;
     - autre morphème : fausse, avec son sens ;
     - fautes de frappe (option) : js/game/lexique-devinette.js (plusProche).
   QCM : leurres du même thème et du même type, puis de la même famille de thèmes (MORPHEME_THEMES) et du
   même type, puis du même thème, puis du même type.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { esc, cle } = AQ.util;
  const D = AQ.data;

  const TYPES = [
    { id: 'Préfixe', name: 'Préfixes', hint: 'hyper-, tachy-, endo-' },
    { id: 'Radical', name: 'Radicaux', hint: 'hépat(o)-, cardi(o)-' },
    { id: 'Suffixe', name: 'Suffixes', hint: '-ite, -ectomie, -algie' }
  ];
  const FAMILLE = {};
  (D.MORPHEME_THEMES || []).forEach(t => { FAMILLE[t.name] = t.famille; });

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
  function items() {
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
  const byKey = k => BY_KEY.get(k) || [];

  /* ---------------- Correction (Devinette) ---------------- */
  const typeMin = m => m.type.toLowerCase();   /* « un préfixe », « un radical », « un suffixe » */
  /* la saisie désigne d'autres morphèmes que celui demandé (list), exactement ou à une faute près */
  function autre(list, m, typo) {
    const syn = list.find(x => x.type === m.type && x._sens === m._sens);
    if (syn) return { ok: true, typo, note: `« ${syn.morpheme} » a le même sens. Forme attendue ici : « ${m.morpheme} ».` };
    const memeSens = list.find(x => x._sens === m._sens);
    if (memeSens) return { ok: false, note: `« ${memeSens.morpheme} » a bien ce sens, mais c'est un ${typeMin(memeSens)} : on attendait un ${typeMin(m)}.` };
    const o = list[0];
    return { ok: false, note: `« ${o.morpheme} » est un autre ${typeMin(o)} : ${o.sens}.` };
  }
  function evaluate(raw, m, opt) {
    const q = cle(raw);
    if (!q) return { ok: false };
    if (m._keys.includes(q)) return { ok: true };
    items();
    const exacts = byKey(q);
    if (exacts.length) return autre(exacts, m, false);
    if (!opt.tol) return { ok: false };
    const p = NS.lexPlusProche(q, m, opt.items, x => x._keys);
    if (!p) return { ok: false };
    return p.x === m ? { ok: true, typo: true } : autre([p.x], m, true);
  }

  NS.registerLexique({
    id: 'termes-medicaux',
    items,
    evaluate,
    filters: [{ id: 'type', label: 'Types de morphèmes', of: m => m.type, options: TYPES }],
    unit: ['morphème', 'morphèmes'],
    countTitle: 'Nombre de morphèmes à trouver',
    questionLabel: 'Définition',
    question: m => m.sens,
    hints: m => [m.type, m._langue, m.domaine],
    label: m => m.morpheme,
    sub: m => m.type + ' · ' + m.sens,
    rappel: m => `« ${m.morpheme} » signifie : ${m.sens}.`,
    fiche: m => `<div class="lex-fiche"><b class="lex-forme">${esc(m.morpheme)}</b>` +
      `<span class="lex-meta">${esc(m.type)} · ${esc(m.origine)}</span></div>` +
      `<ul class="lex-ex">${m.exemples.map(x => `<li><b>${esc(x.mot)}</b> : ${esc(x.explication)}</li>`).join('')}</ul>`,
    detail: sel => TYPES.filter(t => sel.type.has(t.id)).map(t => t.name.toLowerCase()).join(', ').replace(/^./, c => c.toUpperCase()),
    note: '<b>Les briques des mots médicaux.</b> Chaque définition correspond à un préfixe, un radical ou un suffixe ' +
      '(« hépat(o)- » pour « Foie »). En Devinette, accents, majuscules, tirets et parenthèses ne comptent pas : ' +
      '« hepato » vaut « hépat(o)- ». Après chaque réponse, des exemples de mots réels.',
    credits: 'Base de morphèmes (préfixes, radicaux, suffixes, origines et exemples) rédigée pour Anotehomy Quizz.',
    modeDesc: { devinette: 'Une définition s\'affiche : écrivez le morphème qui lui correspond.',
      qcm: 'De 2 à 6 morphèmes proposés : choisissez le bon.' },
    placeholder: 'Écrivez le morphème…',
    aide: 'Accents, majuscules, tirets et parenthèses ne comptent pas : « hepato » = « hépat(o)- ».',
    /* suggestions : les morphèmes des types choisis (tous, pas seulement ceux de la partie : aucun indice) */
    suggestions: pool => pool.map(m => ({ label: m.morpheme, keys: m._keys, hint: m.type })),
    leurres: m => [
      x => x.domaine === m.domaine && x.type === m.type,
      x => !!FAMILLE[m.domaine] && FAMILLE[x.domaine] === FAMILLE[m.domaine] && x.type === m.type,
      x => x.domaine === m.domaine,
      x => x.type === m.type
    ],
    memeSens: (a, b) => a._sens === b._sens
  });
})(AQ.game);
