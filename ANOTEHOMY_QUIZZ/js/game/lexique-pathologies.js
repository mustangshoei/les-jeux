/* ==========================================================================
   Anotehomy Quizz - game/lexique-pathologies.js
   JEU « LES PATHOLOGIES » (2.1, chapitre « La langue médicale ») : reconnaître une maladie à sa
   description (js/data/pathologies.js : 494 pathologies). Lexique du moteur commun js/game/lexique-game.js
   (interface décrite en tête de ce fichier).
   --------------------------------------------------------------------------
   Filtres, croisés : DIFFICULTÉ (très connues, un peu connues, difficiles) ET SPÉCIALITÉ (19) ; le nombre
   à côté de chaque case tient compte de l'autre filtre (« Cardiologie : 9 » parmi les difficiles…).
   Indices : spécialité, mécanisme, difficulté.
   Correction (Devinette) :
     - majuscules, accents, ponctuation et petits mots (de, du, la, des…) ne comptent pas :
       « infarctus myocarde » = « Infarctus du myocarde » ;
     - les autres noms (alt : sigles, noms courants : « HTA », « crise cardiaque ») sont acceptés ;
     - les ANCIENS TERMES et éponymes (old : « apoplexie », « mongolisme ») sont reconnus mais comptés faux,
       avec le nom à employer (comme les anciens termes anatomiques des autres jeux) ;
     - une autre pathologie est signalée avec sa description ;
     - fautes de frappe (option) : js/game/lexique-devinette.js (plusProche), sur tous les noms connus.
   Suggestions : toutes les pathologies (pas seulement celles de la configuration : aucun indice), et leurs
   autres noms ; le début du nom d'abord, puis le début d'un mot intérieur (« myoc » : « Infarctus du
   myocarde »). Les anciens termes ne sont pas proposés.
   QCM : leurres de même spécialité et même difficulté, puis même spécialité, puis même mécanisme et même
   difficulté, puis même difficulté.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { esc, plier } = AQ.util;
  const D = AQ.data;
  const SPEC = D.SPECIALITES || {}, MECA = D.MECANISMES || {}, DIFF = D.DIFFICULTES || {};

  const NIVEAUX = [
    { id: '1', name: 'Très connues', hint: 'grand public' },
    { id: '2', name: 'Un peu connues', hint: 'quelques notions' },
    { id: '3', name: 'Difficiles', hint: 'soignants, études avancées' }
  ];

  /* ---------------- Normalisation des noms ----------------
     mots(« Infarctus du myocarde ») -> ['infarctus', 'myocarde'] ; clé : les mots collés. */
  const STOP = new Set(['de', 'du', 'des', 'd', 'la', 'le', 'les', 'l', 'a', 'au', 'aux', 'en', 'et', 'un', 'une']);
  const mots = s => plier(s).replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(w => w && !STOP.has(w));
  const cleNom = s => mots(s).join('');
  /* clés qui commencent à chaque mot intérieur (suggestions) */
  const clesMots = s => { const m = mots(s); return m.slice(1).map((w, i) => m.slice(i + 1).join('')); };
  const majuscule = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------------- Données ----------------
     Chaque pathologie reçoit (une fois) : name (nom affiché, avec majuscule : clé des statistiques),
     _keys (nom puis autres noms acceptés), _old (anciens termes). BY_KEY : clé -> [{ x, old }]. */
  let ITEMS = null;
  const BY_KEY = new Map();
  function items() {
    if (ITEMS) return ITEMS;
    ITEMS = D.PATHOLOGIES || [];
    const range = (k, x, old) => { if (!BY_KEY.has(k)) BY_KEY.set(k, []); BY_KEY.get(k).push({ x, old }); };
    ITEMS.forEach(p => {
      p.name = majuscule(p.nom);
      p._keys = [cleNom(p.nom)].concat(p.alt.map(cleNom)).filter((k, i, a) => k && a.indexOf(k) === i);
      p._old = p.old.map(cleNom).filter(Boolean);
      p._keys.forEach(k => range(k, p, false));
      p._old.forEach(k => range(k, p, true));
    });
    return ITEMS;
  }

  /* ---------------- Correction (Devinette) ---------------- */
  const ancien = (raw, x) => ({ ok: false, note: `« ${raw} » est un ancien terme, à ne plus employer : on dit aujourd'hui « ${x.name} ».` });
  function evaluate(raw, p, opt) {
    const q = cleNom(raw);
    if (!q) return { ok: false };
    if (p._keys.includes(q)) return { ok: true };
    if (p._old.includes(q)) return ancien(raw, p);
    items();
    const exacts = BY_KEY.get(q);
    if (exacts) return autre(raw, exacts[0].x, exacts[0].old);
    if (!opt.tol) return { ok: false };
    const best = NS.lexPlusProche(q, p, opt.items, x => x._keys.concat(x._old));
    if (!best) return { ok: false };
    const old = best.x._old.includes(best.k) && !best.x._keys.includes(best.k);
    if (best.x === p) return old ? ancien(raw, p) : { ok: true, typo: true };
    return autre(raw, best.x, old);
  }
  /* la saisie désigne une autre pathologie (o) ; old : par un ancien terme */
  const autre = (raw, o, old) => ({ ok: false, note: old
    ? `« ${raw} » est un ancien terme désignant une autre pathologie : ${o.name}.`
    : `${o.name} est une autre pathologie : ${o.resume}` });

  const liste = (titre, l) => l.length ? `<li><b>${titre}</b> : ${l.map(esc).join(', ')}</li>` : '';

  NS.registerLexique({
    id: 'pathologies',
    items,
    evaluate,
    filters: [
      { id: 'difficulte', label: 'Difficulté', of: p => p.difficulte, options: NIVEAUX, defaut: ['1', '2'] },
      { id: 'specialite', label: 'Spécialités', of: p => p.specialite, souple: true,
        options: Object.keys(SPEC).map(id => ({ id, name: SPEC[id] })) }
    ],
    unit: ['pathologie', 'pathologies'],
    countTitle: 'Nombre de pathologies à trouver',
    questionLabel: 'Description',
    question: p => p.resume,
    hints: p => [SPEC[p.specialite], MECA[p.mecanisme], DIFF[p.difficulte]].filter(Boolean),
    label: p => p.name,
    sub: p => SPEC[p.specialite] + ' · ' + p.resume,
    rappel: p => `${p.name} : ${p.resume}`,
    fiche: p => `<div class="lex-fiche"><b class="lex-forme">${esc(p.name)}</b>` +
      `<span class="lex-meta">${esc(SPEC[p.specialite])} · ${esc(MECA[p.mecanisme])} · ${esc(DIFF[p.difficulte])}</span></div>` +
      ((p.alt.length || p.old.length) ? `<ul class="lex-ex">${liste('Autres noms acceptés', p.alt)}${liste('Ancien terme, à ne plus employer', p.old)}</ul>` : ''),
    detail: sel => {
      const niv = NIVEAUX.filter(n => sel.difficulte.has(n.id)).map(n => n.name.toLowerCase()).join(', ').replace(/^./, c => c.toUpperCase());
      const ids = Object.keys(SPEC).filter(id => sel.specialite.has(id)), n = ids.length;
      const spe = n === Object.keys(SPEC).length ? 'toutes les spécialités' : n <= 3 ? ids.map(id => SPEC[id]).join(', ') : n + ' spécialités';
      return niv + ' · ' + spe;
    },
    note: '<b>Reconnaître les maladies.</b> Une description s\'affiche : retrouvez la pathologie. Les sigles et ' +
      'noms courants (« HTA », « crise cardiaque ») sont acceptés ; les anciens termes et éponymes (« apoplexie », ' +
      '« mongolisme ») sont signalés et comptés faux. En Devinette, majuscules, accents et petits mots (de, la…) ne comptent pas.',
    credits: 'Recensement des pathologies (descriptions, spécialités, mécanismes, difficulté) rédigé pour Anotehomy Quizz.',
    modeDesc: { devinette: 'Une description s\'affiche : écrivez le nom de la pathologie.',
      qcm: 'De 2 à 6 pathologies proposées : choisissez la bonne.' },
    placeholder: 'Écrivez le nom de la pathologie…',
    aide: 'Majuscules, accents et petits mots (de, la…) ne comptent pas ; sigles et noms courants acceptés.',
    suggestions: () => items().flatMap(p => [{ label: p.name, keys: [p._keys[0]], motKeys: clesMots(p.nom) }]
      .concat(p.alt.map(a => ({ label: a, keys: [cleNom(a)], motKeys: clesMots(a), hint: '= ' + p.name })))),
    leurres: p => [
      x => x.specialite === p.specialite && x.difficulte === p.difficulte,
      x => x.specialite === p.specialite,
      x => x.mecanisme === p.mecanisme && x.difficulte === p.difficulte,
      x => x.difficulte === p.difficulte
    ]
  });
})(AQ.game);
