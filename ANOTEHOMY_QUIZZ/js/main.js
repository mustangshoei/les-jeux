/* ==========================================================================
   Anotehomy Quizz - main.js
   Point d'entrée : affiche le menu tout de suite et branche l'interface et les raccourcis clavier.
   La 3D ne démarre qu'au lancement de la première partie (ensure3D, appelé par js/game/play.js) :
   rien ne se charge ni ne tourne derrière le menu et la configuration. Chargé en dernier par index.html.
   ========================================================================== */
(function () {
  'use strict';
  const { $ } = AQ.util;
  const EN = AQ.engine, G = AQ.game;

  /* un écran sans 3D (menu, configuration, résultats, statistiques) est-il ouvert ? */
  const overlayOpen = () => !$('home').hidden || !$('setup').hidden || !$('results').hidden;

  function initKeyboard() {
    const views = { 1: 'A', 2: 'P', 3: 'LD', 4: 'LG' };
    document.addEventListener('keydown', e => {
      /* Entrée pendant le retour immédiat : question suivante */
      if (e.key === 'Enter' && !e.repeat && G.session.phase === 'feedback') { e.preventDefault(); G.goNext(); return; }
      if (e.key === 'Escape' && !$('helpCard').hidden) { EN.toggleHelp(false); return; }
      const a = document.activeElement;
      if ((a && a.tagName === 'INPUT') || overlayOpen() || !EN.isReady()) return;
      const c = EN.canvas;
      if (e.key === 'h' || e.key === 'H' || e.key === '?') EN.toggleHelp();
      else if (views[e.key]) EN.setView(views[e.key]);
      else if (e.key === '+' || e.key === '=') EN.zoomAt(1 / 1.4, c.clientWidth / 2, c.clientHeight / 2);
      else if (e.key === '-') EN.zoomAt(1.4, c.clientWidth / 2, c.clientHeight / 2);
      else if (e.key === '0') EN.frameAll();
      /* ostéologie : os voisins estompés, atlas des parties (révision) */
      else if (e.key === 'v' || e.key === 'V') G.toggleNeighbors();
      else if (e.key === 'c' || e.key === 'C') G.toggleAtlas();
    });
  }

  /* Démarre la 3D une seule fois : décodage du squelette, scène, caméra, commandes. Promesse. */
  let promesse3D = null;
  function ensure3D() {
    if (!promesse3D) {
      const ld = $('loading');
      ld.textContent = 'Chargement du modèle 3D…';
      ld.hidden = false;
      promesse3D = EN.loadModel().then(parts => {
        EN.initScene(parts);
        EN.initCamera();
        EN.initInput();
        ld.hidden = true;
      }).catch(err => {
        promesse3D = null;
        console.error(err);
        G.loadError = 'Erreur 3D : ' + (err && err.message ? err.message : err) +
          ' (utilisez une version récente de Chrome, Edge, Firefox ou Safari, avec WebGL activé).';
        ld.textContent = 'Le modèle 3D ne peut pas être affiché sur ce navigateur.';
        throw new Error(G.loadError);
      });
    }
    return promesse3D;
  }

  function init() {
    G.ensure3D = ensure3D;
    G.prepareMatcher();
    G.initHome();                      /* menu immédiat, sans 3D */
    /* compte et statistiques (js/account/) : une panne ici ne doit jamais empêcher de jouer */
    try { if (AQ.account.init) AQ.account.init(); } catch (err) { console.error(err); }
    G.initSetup();
    G.initAutocomplete();
    G.initPlay();
    G.initResults();
    initKeyboard();
  }

  init();
})();
