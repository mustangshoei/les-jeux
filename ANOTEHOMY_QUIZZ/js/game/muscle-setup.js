/* ==========================================================================
   Anotehomy Quizz - game/muscle-setup.js
   PREPHASE DU JEU "Les muscles du corps humain" : zones du corps et muscles
   proposes (principaux seulement, ou tous). Le modele 3D des muscles (environ
   3 Mo) se charge a l'ouverture de cette configuration, puis s'affiche en
   arriere-plan.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc } = AQ.util;
  const D = AQ.data;
  const EN = AQ.engine;
  const { settings, session } = NS;

  const A = () => NS.ADAPTERS['muscles-localisation'];
  const check = '<span class="box"><svg viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3.5"/></svg></span>';
  const plural = (n, w) => n + ' ' + w + (n > 1 ? 's' : '');
  /* muscles d'une zone pour le filtre courant */
  const inZone = id => D.MUSCLES.filter(m => m.region === id && (!settings.mPrincipal || m.principal)).length;

  function initMuscleSetup() {
    const zones = $('mZones');
    zones.innerHTML = D.MUSCLE_REGIONS.map(r =>
      `<label class="zone"><input type="checkbox" value="${r.id}"${settings.mRegions.has(r.id) ? ' checked' : ''}>${check}` +
      `<span class="zn">${esc(r.name)}</span><span class="zc" data-zc="${r.id}"></span></label>`).join('');
    zones.addEventListener('change', e => {
      if (!e.target.matches('input')) return;
      if (e.target.checked) settings.mRegions.add(e.target.value); else settings.mRegions.delete(e.target.value);
      NS.updatePool();
    });
    const setAll = on => {
      zones.querySelectorAll('input').forEach(i => { i.checked = on; if (on) settings.mRegions.add(i.value); else settings.mRegions.delete(i.value); });
      NS.updatePool();
    };
    $('mAllZones').addEventListener('click', () => setAll(true));
    $('mNoZones').addEventListener('click', () => setAll(false));
    document.querySelectorAll('input[name=mset]').forEach(r => {
      r.checked = (r.value === 'main') === settings.mPrincipal;
      r.addEventListener('change', () => { settings.mPrincipal = r.value === 'main'; NS.updatePool(); });
    });
    $('mSetMainN').textContent = plural(D.MUSCLES.filter(m => m.principal).length, 'muscle');
    $('mSetAllN').textContent = plural(D.MUSCLES.length, 'muscle');
  }

  /* chargement du modele (une seule tentative par ouverture de la configuration) */
  let loading = false, failed = '';
  function ensureMuscleModel() {
    if (EN.musclesLoaded() || loading || failed || !EN.isReady()) return;
    loading = true;
    EN.loadMuscleModel().then(() => {
      loading = false;
      if (session.phase === 'setup' && NS.isMuscleGame()) showMuscles();
      NS.updatePool();
    }).catch(err => {
      loading = false;
      failed = 'Muscles 3D indisponibles : ' + (err && err.message ? err.message : err);
      NS.updatePool();
    });
  }
  /* nouvelle ouverture de la configuration : nouvel essai possible apres une erreur */
  function resetMuscleError() { failed = ''; }
  /* modele des muscles en arriere-plan de la configuration */
  function showMuscles() {
    if (!EN.musclesLoaded()) return;
    EN.activateMuscles();
    EN.frameAll({ view: 'A' });
  }

  function updateMusclePool() {
    D.MUSCLE_REGIONS.forEach(r => {
      const el = document.querySelector(`[data-zc="${r.id}"]`);
      if (el) el.textContent = plural(inZone(r.id), 'muscle');
    });
    ensureMuscleModel();
    const n = A().pool().length, loaded = EN.musclesLoaded();
    $('countNum').max = $('countRange').max = Math.max(1, n);
    $('countOf').textContent = `sur ${plural(n, 'muscle')} disponible${n > 1 ? 's' : ''}`;
    NS.setCount(settings.mCount, false, true);
    $('startBtn').disabled = !n || !loaded;
    $('setupWarn').textContent = !n ? 'Selectionnez au moins une zone du corps.'
      : loaded ? '' : failed || 'Chargement des muscles 3D...';
  }

  Object.assign(NS, { initMuscleSetup, updateMusclePool, resetMuscleError, showMuscles });
})(AQ.game);
