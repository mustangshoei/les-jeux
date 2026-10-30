/* ==========================================================================
   Anotehomy Quizz - game/osteo-setup.js
   PREPHASE DU JEU 2 "Osteologie descriptive" : os tire au hasard parmi des
   zones du corps, ou os choisi dans une liste ; os voisins estompes.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc } = AQ.util;
  const D = AQ.data;
  const EN = AQ.engine;
  const { settings } = NS;

  const A = () => NS.ADAPTERS['os-descriptive'];
  const check = '<span class="box"><svg viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3.5"/></svg></span>';

  function initOsteoSetup() {
    /* zones du tirage au sort (seulement celles qui ont des os detailles) */
    const zones = $('oZones');
    zones.innerHTML = D.REGIONS.map(r => {
      const n = D.OSTEO.filter(d => A().zoneOf(d) === r.id).length;
      return n ? `<label class="zone"><input type="checkbox" value="${r.id}"${settings.oZones.has(r.id) ? ' checked' : ''}>${check}` +
        `<span class="zn">${esc(r.name)}</span><span class="zc">${n} os</span></label>` : '';
    }).join('');
    zones.addEventListener('change', e => {
      if (!e.target.matches('input')) return;
      if (e.target.checked) settings.oZones.add(e.target.value); else settings.oZones.delete(e.target.value);
      NS.updatePool();
    });
    const setAll = on => {
      zones.querySelectorAll('input').forEach(i => { i.checked = on; if (on) settings.oZones.add(i.value); else settings.oZones.delete(i.value); });
      NS.updatePool();
    };
    $('oAllZones').addEventListener('click', () => setAll(true));
    $('oNoZones').addEventListener('click', () => setAll(false));

    /* liste des os, groupee par zone du corps */
    const sel = $('oBone');
    sel.innerHTML = D.REGIONS.map(r => {
      const list = D.OSTEO.filter(d => A().zoneOf(d) === r.id);
      return list.length ? `<optgroup label="${esc(r.name)}">` +
        list.map(d => `<option value="${esc(d.key)}">${esc(A().boneTitle(d))}</option>`).join('') + '</optgroup>' : '';
    }).join('');
    if (!D.OSTEO_BY[settings.oKey]) settings.oKey = D.OSTEO[0].key;
    sel.value = settings.oKey;
    sel.addEventListener('change', () => { settings.oKey = sel.value; NS.updatePool(); });

    document.querySelectorAll('input[name=opick]').forEach(r => {
      r.checked = r.value === settings.oPick;
      r.addEventListener('change', () => { settings.oPick = r.value; showPane(); NS.updatePool(); });
    });
    const nb = $('optNeigh');
    nb.checked = settings.neighbors;
    nb.addEventListener('change', () => { settings.neighbors = nb.checked; });
    showPane();
  }

  function showPane() {
    $('oRandomPane').hidden = settings.oPick !== 'random';
    $('oChosenPane').hidden = settings.oPick !== 'chosen';
  }

  /* nombre de parties : { min, max } sur les os possibles, n = nombre d'os possibles */
  function osteoCounts() {
    const list = settings.oPick === 'chosen' ? [D.OSTEO_BY[settings.oKey]].filter(Boolean) : A().pool();
    if (!list.length) return { min: 0, max: 0, n: 0 };
    const c = list.map(d => d.parts.length);
    return { min: Math.min.apply(null, c), max: Math.max.apply(null, c), n: list.length };
  }

  function updateOsteoPool() {
    const c = osteoCounts(), chosen = settings.oPick === 'chosen';
    $('countNum').max = $('countRange').max = Math.max(1, c.max);
    $('countOf').textContent = !c.n ? '' : chosen ? `sur ${c.max} parties`
      : c.min === c.max ? `sur ${c.max} parties` : `parties au plus (l'os tiré en compte de ${c.min} à ${c.max})`;
    NS.setCount(settings.oCount, false, true);
    const d = D.OSTEO_BY[settings.oKey];
    $('oBoneInfo').textContent = d ? `Zone : ${D.REGION[A().zoneOf(d)].name} - ${d.parts.length} parties à reconnaître.` : '';
    /* les os détaillés (modèle 3D) ne se chargent qu'au lancement de la partie (js/game/osteo-game.js) */
    $('startBtn').disabled = !c.n;
    $('setupWarn').textContent = !c.n ? 'Cochez au moins une zone du corps.' : '';
  }

  Object.assign(NS, { initOsteoSetup, osteoCounts, updateOsteoPool });
})(AQ.game);
