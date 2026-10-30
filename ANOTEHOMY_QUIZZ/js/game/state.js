/* ==========================================================================
   Anotehomy Quizz - game/state.js
   Etat partage de la partie : reglages choisis en prephase, session en cours
   et petites aides communes a tous les fichiers du jeu.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $ } = AQ.util;
  const { BONES } = AQ.data;
  const EN = AQ.engine;

  /* reglages de la prephase.
     Jeu 1 (os du squelette) : regions (zones cochees), count, precise (numero et cote exiges
     pour les cotes et les vertebres).
     Jeu 2 (osteologie) : oPick ('random' | 'chosen'), oZones (zones du tirage), oKey (os choisi),
     oCount (nombre de parties a trouver), neighbors (os voisins estompes).
     Jeu 3 (muscles) : mRegions (zones cochees, js/data/muscles.js), mPrincipal (muscles
     principaux seulement), mCount (nombre de muscles a trouver).
     Communs : mode ('A' nommage | 'B' ciblage), auto (autocompletion), tol (fautes tolerees). */
  const settings = { regions: new Set(['ms', 'mi']), count: 10, mode: 'A', auto: true, tol: true, precise: false,
    oPick: 'random', oZones: new Set(['ms', 'mi', 'pelvis', 'vert', 'crane', 'axial']), oKey: null, oCount: 30, neighbors: false,
    mRegions: new Set(['ms', 'mi']), mPrincipal: true, mCount: 15 };

  /* session en cours.
     game : jeu choisi (js/data/games.js)
     phase : 'home' | 'setup' | 'play' (question ouverte) | 'feedback' (reponse affichee)
             | 'end' (resultats) | 'review' (revision)
     queue : [{ item, inst }] (item : os ou partie d'os demande ; inst : objet 3D correspondant)
     log : une entree par reponse donnee */
  const session = { game: null, phase: 'setup', queue: [], idx: 0, log: [], ok: 0, ko: 0, points: 0, t0: 0, elapsed: 0, timer: 0, nextT: 0 };

  /* adaptateurs des jeux (js/game/skeleton-game.js, osteo-game.js, muscle-game.js), par identifiant de jeu */
  const ADAPTERS = {};
  const adapter = () => ADAPTERS[session.game ? session.game.id : 'os-squelette'];

  /* os jouables pour les zones cochées (présents dans le modèle 3D). Avant la première partie, la 3D
     n'est pas démarrée : la liste des os du modèle est lue dans l'en-tête de js/data/skeleton-model.js,
     sans décoder la géométrie. */
  const IN_MODEL = new Set(((AQ.data.MODEL && AQ.data.MODEL.parts) || []).filter(p => p[0] === 'b').map(p => p[1]));
  const available = b => EN.isReady() ? EN.instancesOf(b.id).length > 0 : IN_MODEL.has(b.id);
  const pool = () => BONES.filter(b => settings.regions.has(b.region) && available(b));
  const inGame = () => session.phase === 'play' || session.phase === 'feedback';
  const curQ = () => session.queue[session.idx];

  /* "T7, droit" : precision d'une instance (niveau, cote) */
  function instDesc(it) {
    if (!it) return '';
    const p = [];
    if (it.label) p.push(it.label);
    if (it.side) p.push(it.side === 'R' ? 'droit' : 'gauche');
    return p.join(', ');
  }

  /* bandeau d'information au-dessus du squelette */
  function showNotice(t) { const n = $('viewNotice'); n.textContent = t; n.hidden = false; }
  function hideNotice() { $('viewNotice').hidden = true; }

  /* consigne affichee en haut de la scene 3D (html deja echappe ; kind : '', 'ok', 'ko', 'review') */
  function setPrompt(html, kind) {
    const p = $('stagePrompt');
    if (!html) { p.hidden = true; return; }
    p.className = 'stage-prompt' + (kind ? ' ' + kind : '');
    p.innerHTML = html;
    p.hidden = false;
  }

  Object.assign(NS, { settings, session, ADAPTERS, adapter, available, pool, inGame, curQ, instDesc, showNotice, hideNotice, setPrompt });
})(AQ.game);
