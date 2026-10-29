/* ==========================================================================
   france/morpion.js — Jeu « Morpion des Départements » (tic-tac-toe géographique)

   Grille 3 × 3 : chaque ligne et chaque colonne porte un critère ; une case se remplit
   avec un département qui vérifie les deux. Un département ne sert qu'une fois par grille.

   Écran en deux étapes : les options de la partie (mode, erreurs, pillage), puis la partie,
   grille au centre (« ← Options » pour revenir aux réglages). En fin de partie, une petite fenêtre
   annonce le résultat : « Recommencer », « Afficher la grille » (un clic sur une case montre alors
   toutes ses réponses possibles) ou « Menu ».

   Saisie : les suggestions ne montrent que des noms, ni code INSEE ni recherche par code (sinon les
   critères « Code INSEE commençant par… » seraient trop faciles).

   Modes
     Solo   remplir les 9 cases ; nombre d'erreurs limité (3, 5 ou 9).
     Duel   deux joueurs, Vert (✕) et Rouge (◯), chacun son tour ; le premier joueur est tiré au
            sort à chaque grille. Une mauvaise réponse fait
            perdre le tour ; on peut passer. Le premier qui aligne 3 cases (ligne, colonne ou
            diagonale) gagne. Match nul si la grille est pleine (sans pillage) ou si les deux
            joueurs passent l'un après l'autre.
            Mode pillage (option) : on peut aussi viser une case adverse et la reprendre en
            donnant un autre département valide.

   Grilles : tirées au hasard parmi les critères ci-dessous (seuils variables). Une grille n'est
   retenue que si chaque case a au moins MIN_REPONSES réponses ET si les 9 cases peuvent être
   remplies avec 9 départements différents (couplage parfait) : elle est donc toujours remplissable.

   Données : data/france/infos-departements.js (région, superficie, population, voisins),
   data/france/infos-hydrographie.js (départements traversés par les fleuves), noms de la carte.
   ========================================================================== */
(function () {
  'use strict';

  const INFOS = (window.GeoInfos || {})['france-departements'];
  const HYDRO = (window.GeoInfos || {})['france-hydrographie'];
  const CARTE = window.GeoCarte && GeoCarte.obtenir('france-departements');
  if (!INFOS || !HYDRO || !CARTE) {
    console.error('france/morpion.js : data/france/infos-departements.js, infos-hydrographie.js et carte-departements.js doivent être chargés avant');
    return;
  }

  const MIN_REPONSES = 2;           // réponses possibles minimales par case
  const MAX_SUGGESTIONS = 8;
  const DELAI_FIN = 700;            // pause avant la fenêtre de fin (ms) : le temps de voir la dernière case
  const VERT = 1, ROUGE = 2;
  const JOUEURS = { 1: { nom: 'Vert', symbole: '✕' }, 2: { nom: 'Rouge', symbole: '◯' } };
  const LIGNES_GAGNANTES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

  // Départements ayant une façade maritime (métropole + les 5 DOM). L'Eure, qui ne touche que
  // l'estuaire de la Seine, n'est pas comptée.
  const LITTORAL = new Set(['06', '11', '13', '14', '17', '22', '29', '2A', '2B', '30', '33', '34', '35', '40',
    '44', '50', '56', '59', '62', '64', '66', '76', '80', '83', '85', '971', '972', '973', '974', '976']);
  // Départements frontaliers d'un pays étranger (Belgique, Luxembourg, Allemagne, Suisse, Italie,
  // Monaco, Espagne, Andorre ; Brésil et Suriname pour la Guyane)
  const ETRANGER = new Set(['01', '02', '04', '05', '06', '08', '09', '25', '31', '39', '54', '55', '57', '59',
    '64', '65', '66', '67', '68', '73', '74', '90', '973']);
  // Départements abritant une préfecture de région, actuelle (depuis 2016) ou ancienne (22 régions)
  const PREF_REGION = new Set(['13', '14', '21', '25', '2A', '31', '33', '34', '35', '44', '45', '51', '57', '59',
    '63', '67', '69', '75', '76', '80', '86', '87', '971', '972', '973', '974', '976']);
  const FLEUVES = [['loire', 'la Loire'], ['seine', 'la Seine'], ['rhone', 'le Rhône'], ['garonne', 'la Garonne']];

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nombre = (n) => Number(n).toLocaleString('fr-FR');
  const hasard = (t) => t[Math.floor(Math.random() * t.length)];
  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ---------- Données par département ---------- */
  const D = {};
  CARTE.elements.forEach((e) => {
    const i = INFOS.zones[e.code];
    if (!i) return;
    D[e.code] = {
      nom: e.nom,
      lettres: e.nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(),
      region: i.region,
      superficie: i.superficie,
      population: i.population,
      voisins: i.voisins.length,
      num: /^2[AB]$/.test(e.code) ? 20 : parseInt(e.code, 10),
      fleuves: new Set(FLEUVES.map((f) => f[0]).filter((f) => HYDRO.zones[f].departements.includes(e.code)))
    };
  });
  const CODES = Object.keys(D);

  /* ---------- Critères (familles et variantes) ---------- */
  // Une variante n'est gardée que si elle concerne entre 8 et (total - 8) départements
  const VARIANTES = [];
  function ajouter(famille, libelle, test) {
    const n = CODES.filter(test).length;
    if (n >= 8 && n <= CODES.length - 8) VARIANTES.push({ famille, libelle, test });
  }

  ajouter('mer', 'A une façade maritime', (c) => LITTORAL.has(c));
  ajouter('mer', 'N\'a pas de façade maritime', (c) => !LITTORAL.has(c));
  ajouter('etranger', 'Frontalier d\'un pays étranger', (c) => ETRANGER.has(c));
  ajouter('etranger', 'Sans frontière avec un pays étranger', (c) => !ETRANGER.has(c));
  [3, 4].forEach((n) => ajouter('voisins', 'Au plus ' + n + ' départements voisins', (c) => D[c].voisins <= n));
  [6, 7].forEach((n) => ajouter('voisins', 'Au moins ' + n + ' départements voisins', (c) => D[c].voisins >= n));
  FLEUVES.forEach(([f, nom]) => ajouter('fleuve', 'Traversé par ' + nom, (c) => D[c].fleuves.has(f)));
  ajouter('fleuve', 'Traversé par la Loire, la Seine, le Rhône ou la Garonne', (c) => D[c].fleuves.size > 0);
  [...new Set(CODES.map((c) => D[c].region))].forEach((r) => {
    if (CODES.filter((c) => D[c].region === r).length >= 4) ajouter('region', 'Région ' + r, (c) => D[c].region === r);
  });
  '0123456789'.split('').forEach((ch) => ajouter('code', 'Code INSEE commençant par ' + ch, (c) => c[0] === ch));
  [20, 30, 40, 50].forEach((t) => ajouter('code', 'Code INSEE inférieur à ' + t, (c) => D[c].num < t));
  [50, 60, 70].forEach((t) => ajouter('code', 'Code INSEE supérieur à ' + t, (c) => D[c].num > t));
  ajouter('prefecture', 'Abrite une préfecture de région (actuelle ou ancienne)', (c) => PREF_REGION.has(c));
  ajouter('prefecture', 'N\'abrite aucune préfecture de région (actuelle ou ancienne)', (c) => !PREF_REGION.has(c));
  [4000, 5000, 6000, 7000].forEach((s) => {
    ajouter('superficie', 'Plus de ' + nombre(s) + ' km²', (c) => D[c].superficie > s);
    ajouter('superficie', 'Moins de ' + nombre(s) + ' km²', (c) => D[c].superficie < s);
  });
  [200000, 300000, 500000, 800000, 1000000].forEach((p) => {
    const txt = p === 1000000 ? 'd\'un million d\'habitants' : 'de ' + nombre(p) + ' habitants';
    ajouter('population', 'Plus ' + txt, (c) => D[c].population > p);
    ajouter('population', 'Moins ' + txt, (c) => D[c].population < p);
  });
  'ABCDEGHILMNORSTUVY'.split('').forEach((l) => {
    ajouter('ecriture', 'Nom contenant la lettre ' + l, (c) => D[c].lettres.includes(l));
    ajouter('ecriture', 'Nom sans la lettre ' + l, (c) => !D[c].lettres.includes(l));
  });
  ajouter('ecriture', 'Nom composé (avec un trait d\'union)', (c) => D[c].nom.includes('-'));
  ajouter('ecriture', 'Nom sans trait d\'union', (c) => !D[c].nom.includes('-'));

  const FAMILLES = [...new Set(VARIANTES.map((v) => v.famille))];

  /* ---------- Génération d'une grille toujours remplissable ---------- */

  // Couplage parfait (algorithme de Kuhn) : 9 cases -> 9 départements distincts ?
  function couplageParfait(reponses) {
    const pris = {};
    function placer(k, vus) {
      for (const c of reponses[k]) {
        if (vus.has(c)) continue;
        vus.add(c);
        if (pris[c] === undefined || placer(pris[c], vus)) { pris[c] = k; return true; }
      }
      return false;
    }
    return reponses.every((_, k) => placer(k, new Set()));
  }

  function genererGrille() {
    for (let essai = 0; essai < 5000; essai++) {
      const criteres = melanger(FAMILLES).slice(0, 6).map((f) => hasard(VARIANTES.filter((v) => v.famille === f)));
      const lignes = criteres.slice(0, 3);
      const colonnes = criteres.slice(3);
      const reponses = [];                          // reponses[k], k = ligne * 3 + colonne
      lignes.forEach((l) => colonnes.forEach((col) => reponses.push(CODES.filter((c) => l.test(c) && col.test(c)))));
      if (reponses.some((r) => r.length < MIN_REPONSES)) continue;
      if (!couplageParfait(reponses)) continue;
      return { lignes, colonnes, reponses };
    }
    throw new Error('Morpion : impossible de générer une grille');
  }

  /* ---------- État ---------- */
  let mode = 'solo';
  let api = null;                  // outils de js/core.js (suggestions)
  let p = null;                    // partie en cours
  let suggestions = [];
  let suggestionActive = -1;

  function nouvellePartie() {
    const g = genererGrille();
    p = Object.assign(g, {
      cases: Array.from({ length: 9 }, () => null),   // { joueur, code }
      utilises: new Set(),
      joueur: mode === 'duel' && Math.random() < 0.5 ? ROUGE : VERT,   // duel : premier joueur tiré au sort
      selection: null,
      erreurs: 0,
      maxErreurs: parseInt($('#morpion-vies').value, 10),
      pillage: mode === 'duel' && $('#morpion-pillage').checked,
      passes: 0,
      fini: false,
      gagnant: null,
      ligneGagnante: null,
      vue: null                                       // case dont on affiche les réponses (fin de partie)
    });
    $('#morpion-search').value = '';
    fermerSuggestions();
    retour('idle', mode === 'solo'
      ? 'Choisissez une case, puis tapez un département qui remplit ses deux critères.'
      : '🎲 Tirage au sort : ' + JOUEURS[p.joueur].nom + ' ' + JOUEURS[p.joueur].symbole +
        ' commence. Choisissez une case, puis tapez un département.');
    rendre();
  }

  const ligneDe = (k) => Math.floor(k / 3);
  const colonneDe = (k) => k % 3;
  const libelleCase = (k) => p.lignes[ligneDe(k)].libelle + ' × ' + p.colonnes[colonneDe(k)].libelle;

  // Case jouable par le joueur courant ?
  function jouable(k) {
    if (p.fini) return false;
    const c = p.cases[k];
    if (!c) return true;
    return mode === 'duel' && p.pillage && c.joueur !== p.joueur;
  }

  /* ---------- Affichage ---------- */

  function retour(type, html) {
    const f = $('#morpion-feedback');
    f.className = 'fb fb-' + type;
    f.innerHTML = '<span>' + html + '</span>';
  }

  function rendre() {
    const grille = $('#morpion-grille');
    let html = '<div class="morpion-coin" aria-hidden="true"></div>';
    p.colonnes.forEach((c) => { html += '<div class="morpion-entete morpion-entete--col" role="columnheader">' + esc(c.libelle) + '</div>'; });
    for (let i = 0; i < 3; i++) {
      html += '<div class="morpion-entete morpion-entete--ligne" role="rowheader">' + esc(p.lignes[i].libelle) + '</div>';
      for (let j = 0; j < 3; j++) {
        const k = i * 3 + j;
        const c = p.cases[k];
        const cls = ['morpion-cellule'];
        if (c) cls.push('morpion-cellule--j' + c.joueur);
        if (p.selection === k) cls.push('is-selection');
        if (p.ligneGagnante && p.ligneGagnante.includes(k)) cls.push('is-gagnante');
        if (p.fini && p.vue === k) cls.push('is-vue');
        const actif = jouable(k) || p.fini;
        html += '<button type="button" role="gridcell" class="' + cls.join(' ') + '" data-case="' + k + '"' +
          (actif ? '' : ' disabled') + ' aria-label="' + esc(libelleCase(k)) + (c ? ' : ' + esc(D[c.code].nom) : '') + '">' +
          (c ? '<span class="morpion-symbole">' + JOUEURS[c.joueur].symbole + '</span>' +
               '<span class="morpion-nom">' + esc(D[c.code].nom) + '</span>' +
               '<span class="morpion-code">' + esc(c.code) + '</span>'
             : (p.fini ? '<span class="morpion-vide">' + p.reponses[k].length + ' réponse' +
                 (p.reponses[k].length > 1 ? 's' : '') + '</span>' : '')) +
          '</button>';
      }
    }
    grille.innerHTML = html;

    // Tour / compteur
    const tour = $('#morpion-tour');
    if (mode === 'solo') {
      tour.className = 'morpion-tour morpion-tour--j1';
      tour.textContent = p.fini ? 'Partie terminée' : 'Solo';
      const restantes = p.maxErreurs - p.erreurs;
      $('#morpion-compteur').textContent = 'Cases ' + p.cases.filter(Boolean).length + '/9 · Erreurs ' +
        p.erreurs + '/' + p.maxErreurs + (p.fini ? '' : ' (' + restantes + ' restante' + (restantes > 1 ? 's' : '') + ')');
    } else {
      const j = p.fini ? p.gagnant : p.joueur;
      tour.className = 'morpion-tour' + (j ? ' morpion-tour--j' + j : '');
      tour.textContent = p.fini
        ? (p.gagnant ? JOUEURS[p.gagnant].symbole + ' ' + JOUEURS[p.gagnant].nom + ' gagne !' : 'Match nul')
        : 'Au tour de ' + JOUEURS[p.joueur].nom + ' ' + JOUEURS[p.joueur].symbole;
      const n = (jr) => p.cases.filter((c) => c && c.joueur === jr).length;
      $('#morpion-compteur').textContent = '✕ Vert ' + n(VERT) + ' · ◯ Rouge ' + n(ROUGE) + (p.pillage ? ' · pillage' : '');
    }

    // Saisie
    const champ = $('#morpion-search');
    champ.disabled = p.fini || p.selection === null;
    $('#morpion-passer').classList.toggle('hidden', mode !== 'duel');
    $('#morpion-passer').disabled = p.fini;
    $('#morpion-case').innerHTML = p.fini
      ? 'Cliquez sur une case pour voir ses réponses possibles.'
      : p.selection === null
        ? 'Choisissez une case de la grille.'
        : 'Case : <b>' + esc(libelleCase(p.selection)) + '</b>' +
          (p.cases[p.selection] ? ' <span class="morpion-pillage-note">(pillage : donnez un autre département)</span>' : '');

    // Réponses possibles (fin de partie)
    const boite = $('#morpion-reponses');
    boite.classList.toggle('hidden', !(p.fini && p.vue !== null));
    if (p.fini && p.vue !== null) {
      boite.innerHTML = '<p><b>' + esc(libelleCase(p.vue)) + '</b> : ' + p.reponses[p.vue].length + ' réponse(s)</p>' +
        '<div class="chips">' + p.reponses[p.vue].map((c) =>
          '<span class="morpion-reponse' + (p.utilises.has(c) ? ' is-utilise' : '') + '">' +
          esc(D[c].nom) + ' <small>(' + esc(c) + ')</small></span>').join('') + '</div>';
    }
  }

  /* ---------- Déroulement ---------- */

  function choisirCase(k) {
    if (!p) return;
    if (p.fini) { p.vue = k; return rendre(); }
    if (!jouable(k)) return;
    p.selection = k;
    rendre();
    $('#morpion-search').focus();
  }

  function changerJoueur() {
    p.joueur = p.joueur === VERT ? ROUGE : VERT;
    p.selection = null;
  }

  // bilan : { emoji, titre, texte } de la fenêtre de fin
  function terminer(gagnant, ligne, bilan) {
    p.fini = true;
    p.gagnant = gagnant || null;
    p.ligneGagnante = ligne || null;
    p.selection = null;
    const partie = p;
    setTimeout(() => {
      // Entre-temps : nouvelle grille, retour aux options ou au menu → pas de fenêtre
      if (p !== partie || $('#screen-morpion').classList.contains('hidden') || $('#morpion-jeu').classList.contains('hidden')) return;
      $('#morpion-fin-emoji').textContent = bilan.emoji;
      $('#morpion-fin-titre').textContent = bilan.titre;
      $('#morpion-fin-texte').textContent = bilan.texte;
      $('#morpion-fin').showModal();
    }, DELAI_FIN);
  }

  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');

  function repondre(code) {
    if (!p || p.fini || p.selection === null) return;
    const k = p.selection;
    const nomDep = '<strong>' + esc(D[code].nom) + '</strong>';
    const bon = p.reponses[k].includes(code) && !p.utilises.has(code);

    if (!bon) {
      if (mode === 'solo') {
        p.erreurs++;
        if (p.erreurs >= p.maxErreurs) {
          const remplies = p.cases.filter(Boolean).length;
          terminer(null, null, { emoji: '😕', titre: 'Partie perdue',
            texte: 'Plus d\'essai : ' + pluriel(remplies, 'case') + ' remplie' + (remplies > 1 ? 's' : '') + ' sur 9.' });
          retour('ko', '❌ ' + nomDep + ' ne convient pas. Plus d\'essai : partie perdue. Cliquez sur une case pour voir ses réponses.');
        } else {
          retour('ko', '❌ ' + nomDep + ' ne convient pas pour cette case.');
        }
      } else {
        const fautif = JOUEURS[p.joueur].nom;
        p.passes = 0;
        changerJoueur();
        retour('ko', '❌ ' + nomDep + ' ne convient pas : ' + fautif + ' perd son tour. Au tour de ' + JOUEURS[p.joueur].nom + '.');
      }
      return rendre();
    }

    const pille = !!p.cases[k];
    p.cases[k] = { joueur: p.joueur, code };
    p.utilises.add(code);
    p.passes = 0;

    if (mode === 'solo') {
      p.selection = null;
      if (p.cases.every(Boolean)) {
        terminer(VERT, null, { emoji: '🎉', titre: 'Grille complète !',
          texte: 'Les 9 cases sont remplies, avec ' + pluriel(p.erreurs, 'erreur') + '.' });
        retour('ok', '🎉 Grille complète avec ' + p.erreurs + ' erreur' + (p.erreurs > 1 ? 's' : '') + ' ! ' +
          'Cliquez sur une case pour voir les autres réponses possibles.');
      } else {
        retour('ok', '✅ ' + nomDep + ' convient.');
      }
      return rendre();
    }

    const ligne = LIGNES_GAGNANTES.find((l) => l.every((x) => p.cases[x] && p.cases[x].joueur === p.joueur));
    if (ligne) {
      terminer(p.joueur, ligne, { emoji: '🏆', titre: JOUEURS[p.joueur].nom + ' ' + JOUEURS[p.joueur].symbole + ' gagne !',
        texte: 'Trois cases alignées.' });
      retour('ok', '🏆 ' + JOUEURS[p.joueur].nom + ' aligne trois cases et gagne ! Cliquez sur une case pour voir ses réponses.');
    } else if (!p.pillage && p.cases.every(Boolean)) {
      terminer(null, null, { emoji: '🤝', titre: 'Match nul', texte: 'La grille est pleine, sans alignement.' });
      retour('idle', 'Grille pleine sans alignement : match nul. Cliquez sur une case pour voir ses réponses.');
    } else {
      const auteur = JOUEURS[p.joueur].nom;
      changerJoueur();
      retour('ok', '✅ ' + nomDep + (pille ? ' : case pillée par ' : ' : case prise par ') + auteur +
        '. Au tour de ' + JOUEURS[p.joueur].nom + '.');
    }
    rendre();
  }

  function passer() {
    if (!p || p.fini || mode !== 'duel') return;
    p.passes++;
    const auteur = JOUEURS[p.joueur].nom;
    changerJoueur();
    if (p.passes >= 2) {
      terminer(null, null, { emoji: '🤝', titre: 'Match nul', texte: 'Les deux joueurs ont passé leur tour.' });
      retour('idle', 'Les deux joueurs ont passé : match nul. Cliquez sur une case pour voir ses réponses.');
    } else {
      retour('idle', auteur + ' passe son tour. Au tour de ' + JOUEURS[p.joueur].nom + '.');
    }
    rendre();
  }

  /* ---------- Recherche (saisie du nom) ---------- */
  // Les suggestions listent les départements non encore utilisés, avec les règles du nommage (js/core.js) :
  // rien avant 3 caractères, seulement les noms qui commencent par le texte tapé (taper « y » ne liste
  // pas les noms qui contiennent un Y). Noms seulement : ni code affiché ni recherche par code.

  // null : texte trop court, pas de liste
  function chercher(texte) {
    const res = api.suggestions(texte, CODES.filter((c) => !p.utilises.has(c)).map((c) => ({ code: c, nom: D[c].nom })));
    return res && res.slice(0, MAX_SUGGESTIONS);
  }

  function dessinerSuggestions() {
    const champ = $('#morpion-search');
    const liste = $('#morpion-suggestions');
    if (!champ.value.trim()) return fermerSuggestions();
    liste.innerHTML = suggestions.length
      ? suggestions.map((s, i) =>
          '<li role="option" data-zone="' + esc(s.code) + '" aria-selected="' + (i === suggestionActive) + '"' +
          (i === suggestionActive ? ' class="is-active"' : '') + '><span>' + esc(s.nom) + '</span></li>').join('')
      : '<li class="sugg-vide">Aucun département disponible</li>';
    liste.classList.remove('hidden');
    champ.setAttribute('aria-expanded', 'true');
  }

  function fermerSuggestions() {
    const liste = $('#morpion-suggestions');
    liste.classList.add('hidden');
    liste.innerHTML = '';
    $('#morpion-search').setAttribute('aria-expanded', 'false');
    suggestions = [];
    suggestionActive = -1;
  }

  function choisir(code) {
    $('#morpion-search').value = '';
    fermerSuggestions();
    repondre(code);
  }

  /* ---------- Interface ---------- */

  function definirMode(m) {
    mode = m;
    document.querySelectorAll('[data-morpion-mode]').forEach((b) => {
      const actif = b.dataset.morpionMode === m;
      b.classList.toggle('is-active', actif);
      b.setAttribute('aria-pressed', String(actif));
    });
    $('#morpion-vies-wrap').classList.toggle('hidden', m !== 'solo');
    $('#morpion-pillage-wrap').classList.toggle('hidden', m !== 'duel');
    $('#morpion-mode-aide').textContent = m === 'solo'
      ? 'Remplissez seul les 9 cases de la grille, sans dépasser le nombre d\'erreurs autorisé.'
      : 'Vert (✕) contre Rouge (◯), chacun son tour sur le même écran : le premier qui aligne 3 cases gagne.';
  }

  // Deux étapes : les options de la partie, puis la partie (grille au centre)
  function afficherEtape(etape) {
    $('#morpion-options').classList.toggle('hidden', etape !== 'options');
    $('#morpion-jeu').classList.toggle('hidden', etape !== 'jeu');
    window.scrollTo(0, 0);
  }

  function brancher() {
    document.querySelectorAll('[data-morpion-mode]').forEach((b) => b.addEventListener('click', () => {
      definirMode(b.dataset.morpionMode);
    }));
    $('#morpion-lancer').addEventListener('click', () => {
      afficherEtape('jeu');
      nouvellePartie();
    });
    $('#morpion-retour').addEventListener('click', () => afficherEtape('options'));
    $('#morpion-nouvelle').addEventListener('click', nouvellePartie);
    $('#morpion-passer').addEventListener('click', passer);
    $('#morpion-grille').addEventListener('click', (e) => {
      const b = e.target.closest('[data-case]');
      if (b) choisirCase(parseInt(b.dataset.case, 10));
    });

    const champ = $('#morpion-search');
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
    $('#morpion-suggestions').addEventListener('mousedown', (e) => {
      e.preventDefault();
      const li = e.target.closest('[data-zone]');
      if (li) choisir(li.dataset.zone);
    });

    // Fenêtre de fin : un bouton, Échap ou un clic à côté la ferment (= « Afficher la grille »).
    // « Menu » (data-action="menu") est traité ensuite par js/core.js.
    const fin = $('#morpion-fin');
    fin.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      const r = fin.getBoundingClientRect();
      const dehors = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      if (!b && !dehors) return;
      fin.close();
      if (b && b.dataset.fin === 'rejouer') nouvellePartie();
    });
  }

  let branche = false;
  GeoNohyne.registerJeu({
    id: 'morpion',
    titre: 'Morpion des Départements',
    icone: '⭕',
    description: 'Tic-tac-toe géographique à critères croisés, en solo ou à deux.',
    ecran: 'screen-morpion',
    sansCarte: true,

    ouvrir(outils) {
      api = outils;
      if (!branche) { brancher(); branche = true; }
      definirMode(mode);
      afficherEtape('options');        // on choisit d'abord les options, puis « Lancer la partie »
    }
  });
})();
