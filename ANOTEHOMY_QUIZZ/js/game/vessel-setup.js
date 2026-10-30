/* ==========================================================================
   Anotehomy Quizz - game/vessel-setup.js
   CONFIGURATION DU JEU "Les vaisseaux sanguins" : zones du corps, type de
   vaisseaux (artères, veines, ou les deux) et vaisseaux proposés (principaux
   seulement, ou tous). Le modèle 3D (environ 2,4 Mo) ne se charge qu'au
   lancement de la partie (js/game/vessel-game.js, build).
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc } = AQ.util;
  const D = AQ.data;
  const { settings } = NS;

  const A = () => NS.ADAPTERS['vaisseaux'];
  const check = '<span class="box"><svg viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3.5"/></svg></span>';
  const plural = (n, w) => n + ' ' + w + (n > 1 ? 'x' : '');
  /* vaisseaux retenus par le type et le filtre « principaux » (toutes zones) */
  const kept = v => settings.vTypes.includes(v.type) && (!settings.vPrincipal || v.principal);
  const inZone = id => D.VESSELS.filter(v => v.region === id && kept(v)).length;

  function initVesselSetup() {
    const zones = $('vZones');
    zones.innerHTML = D.VESSEL_REGIONS.map(r =>
      `<label class="zone"><input type="checkbox" value="${r.id}"${settings.vRegions.has(r.id) ? ' checked' : ''}>${check}` +
      `<span class="zn">${esc(r.name)}</span><span class="zc" data-vc="${r.id}"></span></label>`).join('');
    zones.addEventListener('change', e => {
      if (!e.target.matches('input')) return;
      if (e.target.checked) settings.vRegions.add(e.target.value); else settings.vRegions.delete(e.target.value);
      NS.updatePool();
    });
    const setAll = on => {
      zones.querySelectorAll('input').forEach(i => { i.checked = on; if (on) settings.vRegions.add(i.value); else settings.vRegions.delete(i.value); });
      NS.updatePool();
    };
    $('vAllZones').addEventListener('click', () => setAll(true));
    $('vNoZones').addEventListener('click', () => setAll(false));
    document.querySelectorAll('input[name=vtype]').forEach(r => {
      r.checked = r.value === settings.vTypes;
      r.addEventListener('change', () => { settings.vTypes = r.value; NS.updatePool(); });
    });
    document.querySelectorAll('input[name=vset]').forEach(r => {
      r.checked = (r.value === 'main') === settings.vPrincipal;
      r.addEventListener('change', () => { settings.vPrincipal = r.value === 'main'; NS.updatePool(); });
    });
  }

  function updateVesselPool() {
    D.VESSEL_REGIONS.forEach(r => {
      const el = document.querySelector(`[data-vc="${r.id}"]`);
      if (el) el.textContent = plural(inZone(r.id), 'vaisseau');
    });
    /* nombres des onglets : selon le type choisi */
    const ofType = D.VESSELS.filter(v => settings.vTypes.includes(v.type));
    $('vSetMainN').textContent = ofType.filter(v => v.principal).length;
    $('vSetAllN').textContent = ofType.length;
    const n = A().pool().length;
    $('countNum').max = $('countRange').max = Math.max(1, n);
    $('countOf').textContent = `sur ${plural(n, 'vaisseau')} disponible${n > 1 ? 's' : ''}`;
    NS.setCount(settings.vCount, false, true);
    $('startBtn').disabled = !n;
    $('setupWarn').textContent = !n ? 'Sélectionnez au moins une zone du corps.' : '';
  }

  Object.assign(NS, { initVesselSetup, updateVesselPool });
})(AQ.game);
