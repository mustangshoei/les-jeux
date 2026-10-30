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

  /* Le modèle 3D des muscles (environ 3 Mo) ne se charge qu'au lancement de la partie
     (js/game/muscle-game.js, build) : rien ne s'affiche derrière la configuration. */
  function updateMusclePool() {
    D.MUSCLE_REGIONS.forEach(r => {
      const el = document.querySelector(`[data-zc="${r.id}"]`);
      if (el) el.textContent = plural(inZone(r.id), 'muscle');
    });
    const n = A().pool().length;
    $('countNum').max = $('countRange').max = Math.max(1, n);
    $('countOf').textContent = `sur ${plural(n, 'muscle')} disponible${n > 1 ? 's' : ''}`;
    NS.setCount(settings.mCount, false, true);
    $('startBtn').disabled = !n;
    $('setupWarn').textContent = !n ? 'Sélectionnez au moins une zone du corps.' : '';
  }

  Object.assign(NS, { initMuscleSetup, updateMusclePool });
})(AQ.game);
