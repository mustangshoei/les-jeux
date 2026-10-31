/* ==========================================================================
   Anotehomy Quizz - game/organ-setup.js
   CONFIGURATION DU JEU "Les organes" : appareils (digestif, respiratoire...),
   sexe du corps et organes proposés (principaux seulement, ou tous). Les
   organes des appareils non cochés, et ceux de l'autre sexe, sont cachés
   pendant la partie. Le modèle 3D (environ
   2,7 Mo) ne se charge qu'au lancement de la partie (js/game/organ-game.js).
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc } = AQ.util;
  const D = AQ.data;
  const { settings } = NS;

  const A = () => NS.ADAPTERS['organes'];
  const check = '<span class="box"><svg viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3.5"/></svg></span>';
  const plural = (n, w) => n + ' ' + w + (n > 1 ? 's' : '');
  const sexOk = o => !o.sex || o.sex === settings.gSex;
  const inSystem = id => D.ORGANS.filter(o => o.system === id && sexOk(o) && (!settings.gPrincipal || o.principal)).length;

  function initOrganSetup() {
    const box = $('gSystems');
    box.innerHTML = D.ORGAN_SYSTEMS.map(s =>
      `<label class="zone"><input type="checkbox" value="${s.id}"${settings.gSystems.has(s.id) ? ' checked' : ''}>${check}` +
      `<span class="zn" title="${esc(s.name)}">${esc(s.short)}</span><span class="zc" data-gc="${s.id}"></span></label>`).join('');
    box.addEventListener('change', e => {
      if (!e.target.matches('input')) return;
      if (e.target.checked) settings.gSystems.add(e.target.value); else settings.gSystems.delete(e.target.value);
      NS.updatePool();
    });
    const setAll = on => {
      box.querySelectorAll('input').forEach(i => { i.checked = on; if (on) settings.gSystems.add(i.value); else settings.gSystems.delete(i.value); });
      NS.updatePool();
    };
    $('gAllSystems').addEventListener('click', () => setAll(true));
    $('gNoSystems').addEventListener('click', () => setAll(false));
    document.querySelectorAll('input[name=gset]').forEach(r => {
      r.checked = (r.value === 'main') === settings.gPrincipal;
      r.addEventListener('change', () => { settings.gPrincipal = r.value === 'main'; NS.updatePool(); });
    });
    document.querySelectorAll('input[name=gsex]').forEach(r => {
      r.checked = r.value === settings.gSex;
      r.addEventListener('change', () => { settings.gSex = r.value; NS.updatePool(); });
    });
  }

  function updateOrganPool() {
    /* le sexe du corps est partagé avec la splanchnologie descriptive : onglets resynchronisés */
    document.querySelectorAll('input[name=gsex]').forEach(r => { r.checked = r.value === settings.gSex; });
    const body = D.ORGANS.filter(sexOk);
    $('gSetMainN').textContent = body.filter(o => o.principal).length;
    $('gSetAllN').textContent = body.length;
    D.ORGAN_SYSTEMS.forEach(s => {
      const el = document.querySelector(`[data-gc="${s.id}"]`);
      if (el) el.textContent = plural(inSystem(s.id), 'organe');
    });
    const n = A().pool().length;
    $('countNum').max = $('countRange').max = Math.max(1, n);
    $('countOf').textContent = `sur ${plural(n, 'organe')} disponible${n > 1 ? 's' : ''}`;
    NS.setCount(settings.gCount, false, true);
    $('startBtn').disabled = !n;
    $('setupWarn').textContent = !n ? 'Sélectionnez au moins un appareil.' : '';
  }

  Object.assign(NS, { initOrganSetup, updateOrganPool });
})(AQ.game);
