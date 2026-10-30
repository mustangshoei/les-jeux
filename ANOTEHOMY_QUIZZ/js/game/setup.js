/* ==========================================================================
   Anotehomy Quizz - game/setup.js
   PREPHASE, commune aux jeux : nombre de questions (champ + curseur
   synchronises), mode de jeu et options. Jeu 1 : zones du corps (ici).
   Jeu 2 : choix de l'os (js/game/osteo-setup.js). Muscles : zones et filtre
   des muscles proposes (js/game/muscle-setup.js). Vaisseaux : zones, type et
   filtre des vaisseaux proposes (js/game/vessel-setup.js).
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
  const isVesselGame = () => gameId() === 'vaisseaux';
  const kind = () => isOsteoGame() ? 'osteo' : isMuscleGame() ? 'muscles' : isVesselGame() ? 'vessels' : 'bones';

  /* textes des modes (une phrase courte, comme dans GéoNohyne Quizz), titre du nombre de questions et
     crédits selon le jeu */
  const BP3D = 'Modèle anatomique 3D : <b>BodyParts3D</b>, © The Database Center for Life Science, licence CC BY 4.0 (simplifié pour le web).';
  const GAME_TEXT = {
    bones: { modes: ['Un os s\'illumine en rouge : écrivez son nom.', 'Un nom d\'os s\'affiche : cliquez sur cet os.'],
      count: 'Nombre d\'os à deviner', old: 'rotule, péroné, omoplate, astragale…', credits: BP3D },
    osteo: { modes: ['Une partie de l\'os s\'illumine : écrivez son nom.', 'Un nom de partie s\'affiche : cliquez sur cette partie.'],
      count: 'Nombre de parties à trouver', old: 'trochiter, épitrochlée, apophyse coracoïde…', credits: BP3D },
    muscles: { modes: ['Un muscle s\'illumine en bleu : écrivez son nom.', 'Un nom de muscle s\'affiche : cliquez sur ce muscle.'],
      count: 'Nombre de muscles à trouver', old: 'grand fessier, jambier antérieur, sus-épineux, couturier…',
      credits: 'Modèle anatomique 3D : <b>Z-Anatomy</b> (muscles et squelette), licence CC BY-SA 4.0, dérivé de BodyParts3D (DBCLS) ; simplifié pour le web.' },
    vessels: { modes: ['Un vaisseau s\'illumine en jaune : écrivez son nom.', 'Un nom de vaisseau s\'affiche : cliquez sur ce vaisseau.'],
      count: 'Nombre de vaisseaux à trouver', old: 'artère humérale, saphène interne, sous-clavière, artère pédieuse…',
      credits: 'Modèle anatomique 3D : <b>Z-Anatomy</b> (vaisseaux, cœur et squelette), licence CC BY-SA 4.0, dérivé de BodyParts3D (DBCLS) ; simplifié pour le web.' }
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
    /* − et +, raccourcis (5, 10, 20, 30, tous) */
    document.querySelectorAll('#setup [data-pas]').forEach(b => b.addEventListener('click', () => {
      setCount(settings[countKey()] + Number(b.dataset.pas));
    }));
    $('countPresets').addEventListener('click', e => {
      const b = e.target.closest('[data-nombre]');
      if (b) setCount(b.dataset.nombre === 'max' ? countMax() : b.dataset.nombre);
    });
    document.querySelectorAll('input[name=mode]').forEach(r => r.addEventListener('change', () => { settings.mode = r.value; updateOpts(); }));
    $('optAuto').addEventListener('change', e => { settings.auto = e.target.checked; });
    $('optTol').addEventListener('change', e => { settings.tol = e.target.checked; });
    $('optPrecise').checked = settings.precise;
    $('optPrecise').addEventListener('change', e => { settings.precise = e.target.checked; });
    $('startBtn').addEventListener('click', () => NS.startGame());
    NS.initOsteoSetup();
    NS.initMuscleSetup();
    NS.initVesselSetup();
    configure();
    updatePool();
    updateOpts();
  }

  /* l'autocompletion ne concerne que le mode A */
  function updateOpts() { $('optAuto').closest('label').classList.toggle('is-disabled', settings.mode !== 'A'); }

  /* blocs et textes propres au jeu choisi */
  function configure() {
    const o = isOsteoGame(), m = isMuscleGame(), v = isVesselGame(), t = GAME_TEXT[kind()];
    $('stepZones').hidden = o || m || v;
    $('stepOsteo').hidden = !o;
    $('stepMuscles').hidden = !m;
    $('stepVessels').hidden = !v;
    $('optNeighWrap').hidden = !o;
    $('optPreciseWrap').hidden = o || m || v;
    $('countTitle').textContent = t.count;
    $('setupOld').textContent = t.old;
    $('modeADesc').textContent = t.modes[0];
    $('modeBDesc').textContent = t.modes[1];
    $('setupCredits').innerHTML = t.credits + ' Rendu 3D : Three.js (licence MIT). Détails dans CREDITS.md.';
  }

  /* nombre maximal de questions pour la configuration courante */
  const countMax = () => isOsteoGame() ? NS.osteoCounts().max
    : isMuscleGame() ? NS.ADAPTERS['muscles-localisation'].pool().length
    : isVesselGame() ? NS.ADAPTERS['vaisseaux'].pool().length : NS.pool().length;

  function updatePool() {
    if (isOsteoGame()) { NS.updateOsteoPool(); return; }
    if (isMuscleGame()) { NS.updateMusclePool(); return; }
    if (isVesselGame()) { NS.updateVesselPool(); return; }
    const n = NS.pool().length;
    $('countNum').max = $('countRange').max = Math.max(1, n);
    $('countOf').textContent = `sur ${n} os disponibles`;
    setCount(settings.count, false, true);
    $('startBtn').disabled = n === 0;
    $('setupWarn').textContent = n === 0 ? 'Sélectionnez au moins une zone du corps.' : '';
  }

  /* synchronisation champ numerique <-> curseur (os du squelette, parties de l'os, muscles, vaisseaux) ;
     keep : simple mise a jour de l'affichage (le nombre souhaite est conserve, meme s'il
     depasse le maximum de la configuration courante, qui peut encore changer) */
  const countKey = () => isOsteoGame() ? 'oCount' : isMuscleGame() ? 'mCount' : isVesselGame() ? 'vCount' : 'count';
  function setCount(v, typing, keep) {
    const key = countKey();
    let c = parseInt(v, 10);
    if (isNaN(c)) { if (typing) return; c = settings[key]; }
    c = clamp(c, 1, Math.max(1, countMax()));
    if (!keep) settings[key] = c;
    if (!typing || String(c) !== $('countNum').value) $('countNum').value = c;
    $('countRange').value = c;
    updatePresets(c);
  }
  /* raccourcis : celui du nombre choisi est enfoncé ; ceux qui dépassent le maximum sont cachés */
  function updatePresets(v) {
    const max = Math.max(1, countMax());
    $('countAll').textContent = max;
    document.querySelectorAll('#countPresets [data-nombre]').forEach(b => {
      const tous = b.dataset.nombre === 'max', n = tous ? max : Number(b.dataset.nombre);
      b.hidden = !tous && n >= max;
      b.classList.toggle('on', n === v);
      b.setAttribute('aria-pressed', String(n === v));
    });
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
    /* aucune 3D derrière la configuration : les modèles (squelette, os détaillés, muscles, vaisseaux) ne se
       chargent qu'au lancement de la partie (js/game/play.js), et l'affichage est en pause */
    EN.deactivateMuscles(); EN.deactivateVessels();
    EN.pause();
    NS.updateDock();
    configure();
    updatePool();
  }

  Object.assign(NS, { initSetup, showSetup, updatePool, setCount, isOsteoGame, isMuscleGame, isVesselGame });
})(AQ.game);
