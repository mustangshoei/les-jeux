/* ==========================================================================
   Anotehomy Quizz - game/autocomplete.js
   Autocompletion du mode A : propose les noms TA2 de TOUS les elements du
   jeu (tous les os, ou toutes les parties de tous les os), pas seulement
   ceux de la partie, pour ne pas donner d'indice.
   Clavier : fleches pour choisir, Tab ou Entree pour inserer, Echap pour fermer.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc } = AQ.util;
  const { settings, session } = NS;

  const LISTS = {};   /* noms normalises, par jeu */
  let sugg = [], sIdx = -1;

  /* noms proposés : ceux du jeu, ou ceux que l'adaptateur retient pour la partie (suggestNames : ex.
     les artères seules dans le jeu des vaisseaux), une liste par variante (listKey) */
  function names() {
    const A = NS.adapter();
    const id = (session.game ? session.game.id : 'os-squelette') + (A.listKey ? '|' + A.listKey() : '');
    if (!LISTS[id]) {
      LISTS[id] = (A.suggestNames ? A.suggestNames() : A.names()).map(b => ({ name: b.name, latin: b.latin, n: NS.norm(b.name), nl: NS.norm(b.latin) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return LISTS[id];
  }

  function updateSuggest() {
    const inp = $('answerInput'), raw = inp.value.trim().toLowerCase(), q = NS.norm(raw);
    if (!settings.auto || q.length < 2 || session.phase !== 'play') { hideSuggest(); return; }
    sugg = names().filter(x => x.n.includes(q) || x.nl.includes(q))
      .sort((a, b) => (b.n.startsWith(q) - a.n.startsWith(q)) || a.name.localeCompare(b.name)).slice(0, 7);
    if (!sugg.length || (sugg.length === 1 && sugg[0].n === q)) { hideSuggest(); return; }
    sIdx = -1;
    /* surligne la saisie dans le nom, sans tenir compte des accents ni des ligatures (« femur » dans
       « fémur », « oeil » dans « œil ») : recherche dans le nom plié, puis retour aux positions d'origine */
    const cherche = NS.plier(raw);
    const hl = s => {
      let plie = '';
      const pos = [];
      for (let k = 0; k < s.length; k++) {
        const c = NS.plier(s[k]);
        plie += c;
        for (let r = 0; r < c.length; r++) pos.push(k);
      }
      const i = cherche ? plie.indexOf(cherche) : -1;
      if (i < 0) return esc(s);
      const a = pos[i], b = pos[i + cherche.length - 1] + 1;
      return esc(s.slice(0, a)) + '<mark>' + esc(s.slice(a, b)) + '</mark>' + esc(s.slice(b));
    };
    const ul = $('suggest');
    ul.innerHTML = sugg.map((s, i) => `<li role="option" data-i="${i}"><span>${hl(s.name)}</span><small>${esc(s.latin)}</small></li>`).join('');
    ul.hidden = false;
  }
  function hideSuggest() { $('suggest').hidden = true; sugg = []; sIdx = -1; }
  function moveSuggest(d) {
    if (!sugg.length) return;
    sIdx = (sIdx + d + sugg.length) % sugg.length;
    $('suggest').querySelectorAll('li').forEach((li, i) => li.classList.toggle('active', i === sIdx));
  }
  function chooseSuggest(i) {
    if (!sugg[i]) return;
    const inp = $('answerInput');
    inp.value = sugg[i].name;
    hideSuggest();
    inp.focus();
  }

  function initAutocomplete() {
    const inp = $('answerInput');
    inp.addEventListener('input', updateSuggest);
    inp.addEventListener('blur', () => setTimeout(hideSuggest, 120));
    inp.addEventListener('keydown', e => {
      if ($('suggest').hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); moveSuggest(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveSuggest(-1); }
      else if (e.key === 'Tab') { e.preventDefault(); chooseSuggest(sIdx >= 0 ? sIdx : 0); }
      else if (e.key === 'Enter' && sIdx >= 0) { e.preventDefault(); chooseSuggest(sIdx); }
      else if (e.key === 'Escape') hideSuggest();
    });
    $('suggest').addEventListener('mousedown', e => {
      const li = e.target.closest('li');
      if (li) { e.preventDefault(); chooseSuggest(+li.dataset.i); }
    });
  }

  Object.assign(NS, { initAutocomplete, hideSuggest });
})(AQ.game);
