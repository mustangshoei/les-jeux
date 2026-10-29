/* ==========================================================================
   Anotehomy Quizz - main.js
   Point d'entree : affiche l'accueil tout de suite, decode le modele 3D en
   arriere-plan, puis construit la scene et branche l'interface et les
   raccourcis clavier. Charge en dernier par index.html.
   ========================================================================== */
(function () {
  'use strict';
  const { $ } = AQ.util;
  const EN = AQ.engine, G = AQ.game;

  /* un ecran superpose (accueil, configuration, resultats) est-il ouvert ? */
  const overlayOpen = () => !$('home').hidden || !$('setup').hidden || !$('results').hidden;

  function initKeyboard() {
    const views = { 1: 'A', 2: 'P', 3: 'LD', 4: 'LG' };
    document.addEventListener('keydown', e => {
      /* Entree pendant le retour immediat : question suivante */
      if (e.key === 'Enter' && !e.repeat && G.session.phase === 'feedback') { e.preventDefault(); G.goNext(); return; }
      if (e.key === 'Escape' && !$('helpCard').hidden) { EN.toggleHelp(false); return; }
      const a = document.activeElement;
      if ((a && a.tagName === 'INPUT') || overlayOpen()) return;
      const c = EN.canvas;
      if (e.key === 'h' || e.key === 'H' || e.key === '?') EN.toggleHelp();
      else if (views[e.key]) EN.setView(views[e.key]);
      else if (e.key === '+' || e.key === '=') EN.zoomAt(1 / 1.4, c.clientWidth / 2, c.clientHeight / 2);
      else if (e.key === '-') EN.zoomAt(1.4, c.clientWidth / 2, c.clientHeight / 2);
      else if (e.key === '0') EN.frameAll();
      /* osteologie : os voisins estompes, atlas des parties (revision) */
      else if (e.key === 'v' || e.key === 'V') G.toggleNeighbors();
      else if (e.key === 'c' || e.key === 'C') G.toggleAtlas();
    });
  }

  function fail(err) {
    console.error(err);
    G.loadError = 'Erreur 3D : ' + (err && err.message ? err.message : err) +
      ' (utilisez une version recente de Chrome, Edge, Firefox ou Safari, avec WebGL active).';
    $('loading').textContent = 'Le squelette 3D ne peut pas etre affiche sur ce navigateur.';
    $('setupWarn').textContent = G.loadError;
    $('startBtn').disabled = true;
  }

  function init() {
    G.prepareMatcher();
    G.initHome();                      /* accueil immediat, sans attendre le modele */
    /* compte et statistiques (js/account/) : une panne ici ne doit jamais empecher de jouer */
    try { if (AQ.account.init) AQ.account.init(); } catch (err) { console.error(err); }
    EN.loadModel().then(parts => {
      EN.initScene(parts);
      EN.initCamera();
      EN.initInput();
      G.initSetup();
      G.initAutocomplete();
      G.initPlay();
      G.initResults();
      initKeyboard();
      $('loading').hidden = true;
    }).catch(fail);
  }

  init();
})();
