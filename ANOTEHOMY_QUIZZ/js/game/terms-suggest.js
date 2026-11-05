/* ==========================================================================
   Anotehomy Quizz - game/terms-suggest.js
   SUGGESTIONS DE SAISIE (autocomplétion) du jeu « Les termes médicaux » : un composant réutilisable,
   branché sur un champ de saisie et une liste (<ul>).
   --------------------------------------------------------------------------
   Règles :
     - rien avant MIN caractères (2), une fois la saisie normalisée ;
     - au plus MAX suggestions (5), dans l'ordre alphabétique ;
     - seulement les termes qui COMMENCENT par la saisie ;
     - comparaison sur les clés normalisées (AQ.util.cle) : sans accents, majuscules, tirets, parenthèses
       ni espaces. « hepa » trouve « hépat(o)- », « ite » trouve « -ite », « con » trouve « co-, con-, com- ».
   Clavier : flèches pour choisir, Tab ou Entrée pour insérer, Échap pour fermer ; ou clic.

   creerSuggestions({ input, list, entries, enabled, onChoose }) -> { update, hide, destroy }
     entries   () => [{ label, keys, hint }] : label affiché et inséré (« hépat(o)- »), keys : ses clés
               normalisées (une par forme : « a-, an- » -> ['a', 'an']), hint : petit texte à droite
     enabled   () => booléen : suggestions actives (option de la configuration, question ouverte)
     onChoose  (entry) => appelé après l'insertion
   ========================================================================== */
(function (NS) {
  'use strict';
  const { esc, cle } = AQ.util;

  const MIN = 2, MAX = 5;
  let nId = 0;

  /* Les suggestions pour la saisie q (déjà normalisée) : celles dont une clé commence par q,
     triées par ordre alphabétique (sur la clé : « -ite » se range à « ite »), sans doublon d'affichage. */
  function filtrer(entries, q) {
    if (q.length < MIN) return [];
    const vus = new Set();
    return entries.filter(e => e.keys.some(k => k.startsWith(q)))
      .sort((a, b) => a.tri < b.tri ? -1 : a.tri > b.tri ? 1 : 0)
      .filter(e => !vus.has(e.label) && vus.add(e.label))
      .slice(0, MAX);
  }

  /* Surligne, dans le libellé, la partie qui correspond à la saisie : dans la première forme qui commence
     par q (« co-, con-, com- » avec « com » : la 3e), en sautant ce que la normalisation retire
     (accents gardés à l'affichage, tirets et parenthèses ignorés). */
  function surligner(label, q) {
    let debut = 0;
    for (const forme of label.split(',')) {
      if (cle(forme).startsWith(q)) {
        let a = -1, b = -1, n = 0;
        for (let k = 0; k < forme.length && n < q.length; k++) {
          const c = cle(forme[k]);
          if (!c) continue;
          if (a < 0) a = k;
          n += c.length;
          b = k + 1;
        }
        a += debut; b += debut;
        return esc(label.slice(0, a)) + '<mark>' + esc(label.slice(a, b)) + '</mark>' + esc(label.slice(b));
      }
      debut += forme.length + 1;
    }
    return esc(label);
  }

  function creerSuggestions(opt) {
    const { input, list } = opt;
    const id = 'sugg' + (++nId);
    let sugg = [], actif = -1, cache = null, cacheSrc = null;

    /* clés de tri calculées une fois par liste d'entrées */
    function entrees() {
      const src = opt.entries();
      if (src !== cacheSrc) {
        cacheSrc = src;
        cache = src.map(e => Object.assign({ tri: e.keys[0] || cle(e.label) }, e));
      }
      return cache;
    }

    function update() {
      const q = cle(input.value);
      if (!opt.enabled() || q.length < MIN) { hide(); return; }
      sugg = filtrer(entrees(), q);
      /* une seule suggestion, déjà tapée en entier : inutile de la proposer */
      if (!sugg.length || (sugg.length === 1 && sugg[0].keys.includes(q))) { hide(); return; }
      actif = -1;
      list.innerHTML = sugg.map((s, i) => `<li role="option" id="${id}-${i}" aria-selected="false" data-i="${i}">` +
        `<span>${surligner(s.label, q)}</span>${s.hint ? '<small>' + esc(s.hint) + '</small>' : ''}</li>`).join('');
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      input.removeAttribute('aria-activedescendant');
    }
    function hide() {
      list.hidden = true;
      sugg = []; actif = -1;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }
    function move(d) {
      if (!sugg.length) return;
      actif = (actif + d + sugg.length) % sugg.length;
      list.querySelectorAll('li').forEach((li, i) => {
        li.classList.toggle('active', i === actif);
        li.setAttribute('aria-selected', String(i === actif));
      });
      input.setAttribute('aria-activedescendant', id + '-' + actif);
    }
    function choose(i) {
      const e = sugg[i];
      if (!e) return;
      input.value = e.label;
      hide();
      input.focus();
      if (opt.onChoose) opt.onChoose(e);
    }

    function onKey(e) {
      if (list.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Tab') { e.preventDefault(); choose(actif >= 0 ? actif : 0); }
      else if (e.key === 'Enter' && actif >= 0) { e.preventDefault(); choose(actif); }
      else if (e.key === 'Escape') { e.preventDefault(); hide(); }
    }
    function onDown(e) {
      const li = e.target.closest('li');
      if (li) { e.preventDefault(); choose(+li.dataset.i); }
    }
    let tBlur = 0;
    const onBlur = () => { tBlur = setTimeout(hide, 120); };

    list.id = list.id || id;
    list.setAttribute('role', 'listbox');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-expanded', 'false');
    input.addEventListener('input', update);
    input.addEventListener('keydown', onKey);
    input.addEventListener('blur', onBlur);
    list.addEventListener('mousedown', onDown);

    function destroy() {
      clearTimeout(tBlur);
      input.removeEventListener('input', update);
      input.removeEventListener('keydown', onKey);
      input.removeEventListener('blur', onBlur);
      list.removeEventListener('mousedown', onDown);
      hide();
    }

    return { update, hide, destroy };
  }

  Object.assign(NS, { creerSuggestions, filtrerSuggestions: filtrer });
})(AQ.game);
