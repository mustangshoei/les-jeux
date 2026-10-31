/* ==========================================================================
   Anotehomy Quizz - game/splanchno-setup.js
   CONFIGURATION DU JEU "Splanchnologie descriptive" : organe tiré au hasard
   parmi des appareils, ou organe choisi dans une liste ; sexe du corps
   (partagé avec le jeu "Les organes" : les organes génitaux et la glande
   mammaire ne sont proposés que pour le corps correspondant). Le modèle 3D
   de l'organe ne se charge qu'au lancement de la partie.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc } = AQ.util;
  const D = AQ.data;
  const { settings } = NS;

  const A = () => NS.ADAPTERS['splanchnologie'];
  const check = '<span class="box"><svg viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3.5"/></svg></span>';
  const plural = (n, w) => n + ' ' + w + (n > 1 ? 's' : '');
  /* appareils qui ont au moins un organe détaillé */
  const systems = () => D.ORGAN_SYSTEMS.filter(s => D.SPLANCHNO.some(d => d.system === s.id));

  function initSplanchnoSetup() {
    const box = $('sSystems');
    box.innerHTML = systems().map(s =>
      `<label class="zone"><input type="checkbox" value="${s.id}"${settings.sSystems.has(s.id) ? ' checked' : ''}>${check}` +
      `<span class="zn" title="${esc(s.name)}">${esc(s.short)}</span><span class="zc" data-sc="${s.id}"></span></label>`).join('');
    box.addEventListener('change', e => {
      if (!e.target.matches('input')) return;
      if (e.target.checked) settings.sSystems.add(e.target.value); else settings.sSystems.delete(e.target.value);
      NS.updatePool();
    });
    const setAll = on => {
      box.querySelectorAll('input').forEach(i => { i.checked = on; if (on) settings.sSystems.add(i.value); else settings.sSystems.delete(i.value); });
      NS.updatePool();
    };
    $('sAllSystems').addEventListener('click', () => setAll(true));
    $('sNoSystems').addEventListener('click', () => setAll(false));
    $('sOrgan').addEventListener('change', e => { settings.sKey = e.target.value; NS.updatePool(); });
    document.querySelectorAll('input[name=spick]').forEach(r => {
      r.checked = r.value === settings.sPick;
      r.addEventListener('change', () => { settings.sPick = r.value; NS.updatePool(); });
    });
    document.querySelectorAll('input[name=ssex]').forEach(r => {
      r.addEventListener('change', () => { settings.gSex = r.value; NS.updatePool(); });
    });
  }

  /* liste des organes du corps choisi, groupée par appareil */
  function fillOrgans() {
    const sel = $('sOrgan'), list = D.SPLANCHNO.filter(A().sexOk);
    if (!list.some(d => d.key === settings.sKey)) settings.sKey = list[0].key;
    sel.innerHTML = systems().map(s => {
      const l = list.filter(d => d.system === s.id);
      return l.length ? `<optgroup label="${esc(s.name)}">` + l.map(d => `<option value="${d.key}">${esc(A().organTitle(d))}</option>`).join('') + '</optgroup>' : '';
    }).join('');
    sel.value = settings.sKey;
  }

  /* nombre de parties : { min, max } sur les organes possibles, n = nombre d'organes possibles */
  function splanchnoCounts() {
    const list = settings.sPick === 'chosen' ? [D.SPLANCHNO_BY[settings.sKey]].filter(d => d && A().sexOk(d)) : A().pool();
    if (!list.length) return { min: 0, max: 0, n: 0 };
    const c = list.map(d => d.parts.length);
    return { min: Math.min.apply(null, c), max: Math.max.apply(null, c), n: list.length };
  }

  function updateSplanchnoPool() {
    const chosen = settings.sPick === 'chosen';
    document.querySelectorAll('input[name=ssex]').forEach(r => { r.checked = r.value === settings.gSex; });
    $('sRandomPane').hidden = chosen;
    $('sChosenPane').hidden = !chosen;
    fillOrgans();
    systems().forEach(s => {
      const el = document.querySelector(`[data-sc="${s.id}"]`);
      if (el) el.textContent = plural(D.SPLANCHNO.filter(d => d.system === s.id && A().sexOk(d)).length, 'organe');
    });
    const c = splanchnoCounts();
    $('countNum').max = $('countRange').max = Math.max(1, c.max);
    $('countOf').textContent = !c.n ? '' : chosen || c.min === c.max ? `sur ${c.max} parties`
      : `parties au plus (l'organe tiré en compte de ${c.min} à ${c.max})`;
    NS.setCount(settings.sCount, false, true);
    const d = D.SPLANCHNO_BY[settings.sKey];
    $('sOrganInfo').textContent = d ? `${D.ORGAN_SYSTEM[d.system].name} - ${d.parts.length} parties à reconnaître.` : '';
    $('startBtn').disabled = !c.n;
    $('setupWarn').textContent = !c.n ? 'Cochez au moins un appareil.' : '';
  }

  Object.assign(NS, { initSplanchnoSetup, splanchnoCounts, updateSplanchnoPool });
})(AQ.game);
