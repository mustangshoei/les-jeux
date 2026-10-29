/* ==========================================================================
   france/grand-chemin.js — Jeu « Le Grand Chemin » (La France et sa géographie)

   Deux départements A et B sont tirés au hasard. Le joueur propose des départements
   en TAPANT leur nom (la carte n'est pas cliquable), dans l'ordre qu'il veut, jusqu'à
   ce que ses propositions relient A à B de voisin en voisin. La carte ne montre que la
   silhouette de la France : seuls A, B et les départements proposés y apparaissent.

   Règles
     - France métropolitaine continentale uniquement (Corse et Outre-Mer exclus :
       ils n'ont aucune frontière terrestre avec le continent).
     - Écart entre A et B : de ECART_MIN à ECART_MAX sauts (chaque frontière franchie = 1 saut).
       Le chemin le plus court passe donc par « écart - 1 » départements : c'est le minimum.
     - Étoiles : 3 si le joueur a proposé le minimum ; 2 s'il en a proposé au plus
       minimum × 1,5 (arrondi au supérieur) ; 1 sinon.
     - Aide (option) : chaque proposition est verte si elle fait partie d'un chemin parfait,
       rouge sinon. Quand plusieurs chemins parfaits existent, on retient celui qui contient
       le plus de propositions du joueur (à égalité, ses premières propositions) : les couleurs
       s'adaptent donc en direct à ses choix.
   Frontières : celles de data/france/infos-departements.js, calculées sur les contours IGN, y compris
   dans les estuaires (ex. Charente-Maritime – Gironde par l'estuaire de la Gironde).
   ========================================================================== */
(function () {
  'use strict';

  const INFOS = (window.GeoInfos || {})['france-departements'];
  if (!INFOS) {
    console.error('france/grand-chemin.js : data/france/infos-departements.js doit être chargé avant ce fichier');
    return;
  }

  const EXCLUS = new Set(['2A', '2B', '971', '972', '973', '974', '976']);
  const ECART_MIN = 5;
  const ECART_MAX = 12;
  const MAX_SUGGESTIONS = 8;
  const CLE_AIDE = 'geonohyne.chemin.aide';

  const $ = (sel) => document.querySelector(sel);

  /* ---------- Graphe des frontières (départements continentaux) ---------- */
  const voisins = {};
  Object.keys(INFOS.zones).forEach((c) => {
    if (!EXCLUS.has(c)) voisins[c] = INFOS.zones[c].voisins.filter((v) => !EXCLUS.has(v));
  });
  const codes = Object.keys(voisins);

  // Nombre de sauts depuis un département vers tous les autres (parcours en largeur)
  function distances(depart) {
    const d = { [depart]: 0 };
    const file = [depart];
    for (let i = 0; i < file.length; i++) {
      for (const v of voisins[file[i]]) {
        if (d[v] === undefined) { d[v] = d[file[i]] + 1; file.push(v); }
      }
    }
    return d;
  }
  const DIST = {};
  codes.forEach((c) => { DIST[c] = distances(c); });

  // Toutes les paires (A, B) possibles, calculées une fois
  const PAIRES = [];
  codes.forEach((a) => codes.forEach((b) => {
    const d = DIST[a][b];
    if (a < b && d >= ECART_MIN && d <= ECART_MAX) PAIRES.push([a, b]);
  }));

  /* ---------- État ---------- */
  let api = null;
  let carteJeu = null;           // carte de France limitée aux départements en jeu
  let partie = null;             // { a, b, ecart, min, proposes: [], fini, abandon }
  let suggestions = [];
  let suggestionActive = -1;

  function lireAide() {
    try { return localStorage.getItem(CLE_AIDE) === '1'; } catch (e) { return false; }
  }
  function ecrireAide(v) {
    try { localStorage.setItem(CLE_AIDE, v ? '1' : '0'); } catch (e) { /* option valable pour la session */ }
  }

  const nom = (code) => api.zones.get(code).nom;

  // Carte : uniquement la métropole continentale, cadrée sur elle (sans encadrés d'Outre-Mer)
  function preparerCarte() {
    const c = GeoCarte.obtenir('france-departements');
    const elements = c.elements.filter((e) => voisins[e.code]);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    elements.forEach((e) => {
      const n = e.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
      for (let i = 0; i + 1 < n.length; i += 2) {
        x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]);
        y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]);
      }
    });
    const m = 12;
    return Object.assign({}, c, {
      elements,
      cadres: [],
      vue: { x: x0 - m, y: y0 - m, w: x1 - x0 + 2 * m, h: y1 - y0 + 2 * m }
    });
  }

  /* ---------- Calculs ---------- */

  // Les propositions relient-elles A à B ?
  function relie() {
    const permis = new Set(partie.proposes.concat(partie.b));
    const vus = new Set([partie.a]);
    const file = [partie.a];
    for (let i = 0; i < file.length; i++) {
      for (const v of voisins[file[i]]) {
        if (v === partie.b) return true;
        if (permis.has(v) && !vus.has(v)) { vus.add(v); file.push(v); }
      }
    }
    return false;
  }

  // Chemin parfait (le plus court) le plus proche des choix du joueur : parmi tous les plus courts
  // chemins, celui qui contient le plus de propositions ; à égalité, ses propositions les plus anciennes.
  // Programmation dynamique couche par couche (couche k = départements à k sauts de A).
  function cheminParfait() {
    const { a, b, ecart } = partie;
    const dA = DIST[a], dB = DIST[b];
    const rang = new Map(partie.proposes.map((c, i) => [c, i]));
    const poids = (c) => (rang.has(c) ? [1, Math.pow(2, Math.max(0, 50 - rang.get(c)))] : [0, 0]);
    const meilleur = (x, y) => x.n > y.n || (x.n === y.n && x.t > y.t);

    const couches = [];
    codes.forEach((c) => {
      if (dA[c] + dB[c] === ecart) (couches[dA[c]] = couches[dA[c]] || []).push(c);
    });
    const best = { [a]: { n: 0, t: 0, prec: null } };
    for (let k = 1; k <= ecart; k++) {
      for (const v of couches[k]) {
        let p = null;
        for (const u of voisins[v]) {
          if (dA[u] === k - 1 && best[u] && (!p || meilleur(best[u], best[p]))) p = u;
        }
        const [n, t] = poids(v);
        best[v] = { n: best[p].n + n, t: best[p].t + t, prec: p };
      }
    }
    const chemin = [];
    for (let c = best[b].prec; c !== a; c = best[c].prec) chemin.unshift(c);
    return chemin;                                   // départements entre A et B (sans A ni B)
  }

  function etoiles() {
    if (partie.abandon) return 0;
    const n = partie.proposes.length;
    if (n <= partie.min) return 3;
    if (n <= Math.ceil(partie.min * 1.5)) return 2;
    return 1;
  }

  /* ---------- Affichage ---------- */

  function retour(type, html) {
    const f = $('#chemin-feedback');
    f.className = 'fb fb-' + type;
    f.innerHTML = '<span>' + html + '</span>';
  }

  function majAffichage() {
    const aide = $('#chemin-aide').checked;
    const devoile = aide || partie.fini;             // fin de partie : on montre toujours la vérité
    const parfait = new Set(devoile ? cheminParfait() : []);
    $('#screen-chemin').dataset.aide = aide || partie.fini ? '1' : '0';

    // Carte
    api.zones.forEach((z, code) => {
      let s = 'idle';
      if (code === partie.a) s = 'depart';
      else if (code === partie.b) s = 'arrivee';
      else if (partie.proposes.includes(code)) s = devoile ? (parfait.has(code) ? 'bon' : 'mauvais') : 'propose';
      else if (partie.fini && parfait.has(code)) s = 'solution';
      api.etat(code, s);
      if (s !== 'idle') z.el.parentNode.appendChild(z.el);   // dessiné au-dessus : contour entier visible
    });

    // Liste des propositions
    $('#chemin-liste').innerHTML = partie.proposes.map((c) => {
      const cls = devoile ? (parfait.has(c) ? 'chemin-chip--ok' : 'chemin-chip--ko') : '';
      return '<span class="chemin-chip ' + cls + '">' + api.esc(nom(c)) + ' <small>(' + api.esc(c) + ')</small></span>';
    }).join('');
    $('#chemin-nb').textContent = partie.proposes.length;

    // Fin de partie : étoiles et chemin parfait
    const fin = $('#chemin-fin');
    fin.classList.toggle('hidden', !partie.fini);
    if (partie.fini) {
      const e = etoiles();
      const titre = partie.abandon ? 'Solution' :
        e === 3 ? 'Chemin parfait !' : e === 2 ? 'Très bien !' : 'Arrivé à destination !';
      const solution = [partie.a].concat(cheminParfait(), partie.b).map((c) => api.esc(nom(c))).join(' → ');
      fin.innerHTML =
        '<div class="chemin-etoiles" aria-label="' + e + ' étoile(s) sur 3">' +
          [1, 2, 3].map((i) => '<span class="' + (i <= e ? 'pleine' : 'vide') + '">★</span>').join('') +
        '</div>' +
        '<p class="chemin-fin__titre">' + titre + '</p>' +
        (partie.abandon ? '' :
          '<p>Vous avez proposé <b>' + partie.proposes.length + '</b> département(s).</p>') +
        '<p class="chemin-fin__solution">Un chemin parfait : ' + solution + '</p>';
    }
    $('#chemin-abandon').disabled = partie.fini;
    $('#chemin-search').disabled = partie.fini;
  }

  /* ---------- Déroulement ---------- */

  function nouvellePartie() {
    let [a, b] = PAIRES[Math.floor(Math.random() * PAIRES.length)];
    if (Math.random() < 0.5) [a, b] = [b, a];
    const ecart = DIST[a][b];
    partie = { a, b, ecart, min: ecart - 1, proposes: [], fini: false, abandon: false };

    api.carte(carteJeu, { titre: 'Le Grand Chemin' });
    api.reinitialiserVue();
    $('#chemin-a').textContent = nom(a) + ' (' + a + ')';
    $('#chemin-b').textContent = nom(b) + ' (' + b + ')';
    $('#chemin-min').textContent = partie.min;
    $('#chemin-search').value = '';
    fermerSuggestions();
    retour('idle', 'Tapez le nom des départements qui relient les deux (Corse et Outre-Mer exclus).');
    majAffichage();
  }

  function proposer(code) {
    if (!partie || partie.fini) return;
    if (!voisins[code]) return retour('ko', 'Ce département ne fait pas partie du jeu.');
    if (code === partie.a || code === partie.b) {
      return retour('idle', '<strong>' + api.esc(nom(code)) + '</strong> est le département ' +
        (code === partie.a ? 'de départ.' : 'd\'arrivée.'));
    }
    if (partie.proposes.includes(code)) {
      return retour('idle', '<strong>' + api.esc(nom(code)) + '</strong> est déjà proposé.');
    }
    partie.proposes.push(code);
    if (relie()) {
      partie.fini = true;
      retour('ok', '🎉 Vous avez relié <strong>' + api.esc(nom(partie.a)) + '</strong> à <strong>' +
        api.esc(nom(partie.b)) + '</strong> !');
    } else if ($('#chemin-aide').checked) {
      const bon = cheminParfait().includes(code);
      retour(bon ? 'ok' : 'ko', (bon ? '✅ ' : '❌ ') + '<strong>' + api.esc(nom(code)) + '</strong> ' +
        (bon ? 'fait partie d\'un chemin parfait.' : 'ne fait pas partie d\'un chemin parfait.'));
    } else {
      retour('idle', '<strong>' + api.esc(nom(code)) + '</strong> ajouté.');
    }
    majAffichage();
  }

  function abandonner() {
    if (!partie || partie.fini) return;
    partie.fini = true;
    partie.abandon = true;
    retour('idle', 'Voici un chemin parfait. Retentez votre chance avec une nouvelle partie !');
    majAffichage();
  }

  /* ---------- Recherche (saisie du nom) ---------- */

  // Règles du nommage (js/core.js) : rien avant 3 caractères, seulement les noms qui commencent par le
  // texte tapé. En plus, un code exact (« 29 ») propose son département, même sous 3 caractères.
  // null : texte trop court, pas de liste
  function chercher(texte) {
    const libres = codes.filter((c) => c !== partie.a && c !== partie.b && !partie.proposes.includes(c));
    const parCode = libres.find((c) => c.toLowerCase() === api.normaliser(texte));
    const parNom = api.suggestions(texte, libres.map((c) => ({ code: c, nom: nom(c) })));
    if (!parCode && !parNom) return null;
    return (parCode ? [{ code: parCode, nom: nom(parCode) }] : [])
      .concat((parNom || []).filter((s) => s.code !== parCode)).slice(0, MAX_SUGGESTIONS);
  }

  function dessinerSuggestions() {
    const champ = $('#chemin-search');
    const liste = $('#chemin-suggestions');
    if (!champ.value.trim()) return fermerSuggestions();
    liste.innerHTML = suggestions.length
      ? suggestions.map((s, i) =>
          '<li role="option" id="chemin-sugg-' + i + '" data-zone="' + api.esc(s.code) + '"' +
          ' aria-selected="' + (i === suggestionActive) + '"' + (i === suggestionActive ? ' class="is-active"' : '') + '>' +
            '<span>' + api.esc(s.nom) + '</span><span class="sugg-code">' + api.esc(s.code) + '</span></li>').join('')
      : '<li class="sugg-vide">Aucun département disponible</li>';
    liste.classList.remove('hidden');
    champ.setAttribute('aria-expanded', 'true');
  }

  function fermerSuggestions() {
    const liste = $('#chemin-suggestions');
    liste.classList.add('hidden');
    liste.innerHTML = '';
    $('#chemin-search').setAttribute('aria-expanded', 'false');
    suggestions = [];
    suggestionActive = -1;
  }

  function choisir(code) {
    $('#chemin-search').value = '';
    fermerSuggestions();
    proposer(code);
  }

  function brancher() {
    const champ = $('#chemin-search');
    champ.addEventListener('input', () => {
      const res = chercher(champ.value);
      if (!res) return fermerSuggestions();
      suggestions = res;
      suggestionActive = suggestions.length ? 0 : -1;
      dessinerSuggestions();
    });
    champ.addEventListener('blur', fermerSuggestions);
    champ.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!suggestions.length) return;
        e.preventDefault();
        const n = suggestions.length;
        suggestionActive = (suggestionActive + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
        dessinerSuggestions();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (suggestionActive >= 0) choisir(suggestions[suggestionActive].code);
      } else if (e.key === 'Escape') {
        fermerSuggestions();
      }
    });
    // mousedown : le champ garde le focus, la liste ne se ferme pas avant le choix
    $('#chemin-suggestions').addEventListener('mousedown', (e) => {
      e.preventDefault();
      const li = e.target.closest('[data-zone]');
      if (li) choisir(li.dataset.zone);
    });

    $('#chemin-aide').addEventListener('change', () => {
      ecrireAide($('#chemin-aide').checked);
      if (partie) majAffichage();
    });
    $('#chemin-abandon').addEventListener('click', abandonner);
    $('#chemin-nouveau').addEventListener('click', () => { nouvellePartie(); $('#chemin-search').focus(); });
  }

  /* ---------- Enregistrement ---------- */

  GeoNohyne.registerJeu({
    id: 'grand-chemin',
    titre: 'Le Grand Chemin',
    icone: '🧭',
    description: 'Reliez deux départements de voisin en voisin, par le chemin le plus court.',
    ecran: 'screen-chemin',

    ouvrir(outils) {
      if (!api) {
        api = outils;
        carteJeu = preparerCarte();
        brancher();
      }
      $('#chemin-aide').checked = lireAide();
      nouvellePartie();
      $('#chemin-search').focus();
    }
    // pas de clic(code) : la carte n'est pas cliquable, il faut connaître les noms
  });
})();
