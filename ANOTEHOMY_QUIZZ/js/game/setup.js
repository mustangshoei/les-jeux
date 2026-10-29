/* ==========================================================================
   Anotehomy Quizz - game/setup.js
   PREPHASE, commune aux jeux : nombre de questions (champ + curseur
   synchronises), mode de jeu et options. Jeu 1 : zones du corps (ici).
   Jeu 2 : choix de l'os (js/game/osteo-setup.js). Muscles : zones et filtre
   des muscles proposes (js/game/muscle-setup.js).
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc, clamp } = AQ.util;
  const { REGIONS, BONES } = AQ.data;
  const EN = AQ.engine;
  const { settings, session } = NS;

  const gameId = () => session.game ? session.game.id : 'os-squelette';
  const isOsteoGame = () => gameId() === 'os-descriptive';
  const isMuscleGame = () => gameId() === 'muscles-localisation';
  const kind = () => isOsteoGame() ? 'osteo' : isMuscleGame() ? 'muscles' : 'bones';

  /* textes des modes, titre du nombre de questions et credits selon le jeu */
  const BP3D = 'Modele anatomique 3D : <b>BodyParts3D</b>, (c) The Database Center for Life Science, licence CC BY 4.0 (simplifie pour le web).';
  const GAME_TEXT = {
    bones: { modes: ['Un os s\'illumine en rouge sur le squelette : saisissez son nom exact dans le panneau de gauche.',
      'Le nom officiel (TA2) d\'un os s\'affiche : cliquez sur l\'os correspondant directement sur le squelette.'],
    count: 'Nombre d\'os a deviner', old: 'rotule, perone, omoplate, astragale...', credits: BP3D },
    osteo: { modes: ['Une partie de l\'os s\'illumine en rouge : saisissez son nom exact dans le panneau de gauche.',
      'Le nom officiel (TA2) d\'une partie s\'affiche : cliquez sur cette partie, directement sur l\'os.'],
    count: 'Nombre de parties a trouver', old: 'trochiter, epitrochlee, apophyse coracoide...', credits: BP3D },
    muscles: { modes: ['Un muscle s\'illumine en bleu sur le corps : saisissez son nom exact dans le panneau de gauche.',
      'Le nom officiel (TA2) d\'un muscle s\'affiche : cliquez sur ce muscle, directement sur le corps (Maj + clic ecarte un muscle qui le cache).'],
    count: 'Nombre de muscles a trouver', old: 'grand fessier, jambier anterieur, sus-epineux, couturier...',
    credits: 'Modele anatomique 3D : <b>Z-Anatomy</b> (muscles et squelette), licence CC BY-SA 4.0, derive de BodyParts3D (DBCLS) ; simplifie pour le web.' }
  };

  function initSetup() {
    const zones = $('zones');
    zones.innerHTML = REGIONS.map(r => {
      const n = BONES.filter(b => b.region === r.id && NS.available(b)).length;
      return `<label class="zone"><input type="checkbox" value="${r.id}"${settings.regions.has(r.id) ? ' checked' : ''}>` +
        `<span class="box"><svg viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3.5"/></svg></span>` +
        `<span class="zn">${esc(r.name)}</span><span class="zc">${n} os</span></label>`;
    }).join('');
    zones.addEventListener('change', e => {
      if (!e.target.matches('input')) return;
      if (e.target.checked) settings.regions.add(e.target.value); else settings.regions.delete(e.target.value);
      updatePool();
    });
    const setAll = on => {
      zones.querySelectorAll('input').forEach(i => { i.checked = on; if (on) settings.regions.add(i.value); else settings.regions.delete(i.value); });
      updatePool();
    };
    $('allZones').addEventListener('click', () => setAll(true));
    $('noZones').addEventListener('click', () => setAll(false));
    $('countNum').addEventListener('input', e => setCount(e.target.value, true));
    $('countNum').addEventListener('change', e => setCount(e.target.value));
    $('countRange').addEventListener('input', e => setCount(e.target.value));
    document.querySelectorAll('input[name=mode]').forEach(r => r.addEventListener('change', () => { settings.mode = r.value; updateOpts(); }));
    $('optAuto').addEventListener('change', e => { settings.auto = e.target.checked; });
    $('optTol').addEventListener('change', e => { settings.tol = e.target.checked; });
    $('optPrecise').checked = settings.precise;
    $('optPrecise').addEventListener('change', e => { settings.precise = e.target.checked; });
    $('startBtn').addEventListener('click', () => NS.startGame());
    NS.initOsteoSetup();
    NS.initMuscleSetup();
    configure();
    updatePool();
    updateOpts();
  }

  /* l'autocompletion ne concerne que le mode A */
  function updateOpts() { $('optAuto').closest('label').classList.toggle('is-disabled', settings.mode !== 'A'); }

  /* blocs et textes propres au jeu choisi */
  function configure() {
    const o = isOsteoGame(), m = isMuscleGame(), t = GAME_TEXT[kind()];
    $('stepZones').hidden = o || m;
    $('stepOsteo').hidden = !o;
    $('stepMuscles').hidden = !m;
    $('optNeighWrap').hidden = !o;
    $('optPreciseWrap').hidden = o || m;
    $('countTitle').textContent = t.count;
    $('setupOld').textContent = t.old;
    $('modeADesc').textContent = t.modes[0];
    $('modeBDesc').textContent = t.modes[1];
    $('setupCredits').innerHTML = t.credits + ' Rendu 3D : Three.js (licence MIT). Details dans CREDITS.md.';
  }

  /* nombre maximal de questions pour la configuration courante */
  const countMax = () => isOsteoGame() ? NS.osteoCounts().max
    : isMuscleGame() ? NS.ADAPTERS['muscles-localisation'].pool().length : NS.pool().length;

  function updatePool() {
    /* le squelette 3D se charge en arriere-plan pendant que l'accueil s'affiche */
    if (!EN.isReady()) {
      $('startBtn').disabled = true;
      $('setupWarn').textContent = NS.loadError || 'Chargement du squelette 3D...';
      return;
    }
    if (isOsteoGame()) { NS.updateOsteoPool(); return; }
    if (isMuscleGame()) { NS.updateMusclePool(); return; }
    const n = NS.pool().length;
    $('countNum').max = $('countRange').max = Math.max(1, n);
    $('countOf').textContent = `sur ${n} os disponibles`;
    setCount(settings.count, false, true);
    $('startBtn').disabled = n === 0;
    $('setupWarn').textContent = n === 0 ? 'Selectionnez au moins une zone du corps.' : '';
  }

  /* synchronisation champ numerique <-> curseur (os du squelette, parties de l'os, muscles) ;
     keep : simple mise a jour de l'affichage (le nombre souhaite est conserve, meme s'il
     depasse le maximum de la configuration courante, qui peut encore changer) */
  function setCount(v, typing, keep) {
    const key = isOsteoGame() ? 'oCount' : isMuscleGame() ? 'mCount' : 'count';
    let c = parseInt(v, 10);
    if (isNaN(c)) { if (typing) return; c = settings[key]; }
    c = clamp(c, 1, Math.max(1, countMax()));
    if (!keep) settings[key] = c;
    if (!typing || String(c) !== $('countNum').value) $('countNum').value = c;
    $('countRange').value = c;
  }

  /* retour a l'ecran de configuration */
  function showSetup() {
    clearTimeout(session.nextT);
    clearInterval(session.timer);
    session.phase = 'setup';
    EN.clearMarks(); EN.setHoverEnabled(false); EN.closeBone(); EN.showAll();
    NS.hideNotice(); NS.hideTip(); NS.setPrompt(null);
    ['qA', 'qB', 'feedback', 'reviewBox', 'results'].forEach(id => { $(id).hidden = true; });
    $('setup').hidden = false;
    $('app').className = 'mode-a';
    /* muscles : modele des muscles en arriere-plan (charge a la demande) ; sinon squelette */
    if (isMuscleGame()) { NS.resetMuscleError(); NS.showMuscles(); } else EN.deactivateMuscles();
    NS.updateDock();
    configure();
    updatePool();
    /* jeu 2 : les os detailles se chargent a l'ouverture de la configuration */
    if (isOsteoGame() && !EN.osteoLoaded()) {
      EN.loadOsteoModel().then(updatePool).catch(err => {
        $('setupWarn').textContent = 'Os detailles indisponibles : ' + (err && err.message ? err.message : err);
      });
    }
  }

  Object.assign(NS, { initSetup, showSetup, updatePool, setCount, isOsteoGame, isMuscleGame });
})(AQ.game);
