/* ==========================================================================
   france/codage.js — Jeu « Codage – Encodage »

   Écran en deux étapes :
     1. les options : le mode, les régions (une, plusieurs ou toutes ; les cinq DOM forment le
        groupe « Outre-Mer »), le nombre de départements (de 1 au maximum des régions choisies) et
        le temps par question (curseur sur 3, 5, 10, 15, 20, 25 ou 30 s) ;
     2. la partie : les départements tirés au hasard, un par un, au milieu de l'écran.

   Modes
     Codage     le nom s'affiche, on tape le numéro (Essonne → 91) ; « 1 » vaut « 01 », « 2a » vaut « 2A ».
     Encodage   le numéro s'affiche, on tape le nom (91 → Essonne) ; majuscules, accents, espaces,
                tirets et apostrophes ne comptent pas, l'article du début peut être omis (« Réunion »)
                et « St » vaut « Saint ».
   On valide par Entrée. Un seul essai par question : une réponse fausse, ou le chrono qui arrive à 0,
   rate la question ; la bonne réponse s'affiche un court instant (Entrée passe à la suite).
   En fin de partie, une petite fenêtre fait le bilan : score, réussite, temps moyen des bonnes
   réponses et départements à revoir ; « Recommencer » (mêmes options, nouveau tirage), « Options »
   ou « Menu ». Les réglages sont mémorisés.

   Données : data/france/infos-departements.js (région), noms et codes de la carte de France.
   ========================================================================== */
(function () {
  'use strict';

  const INFOS = (window.GeoInfos || {})['france-departements'];
  const CARTE = window.GeoCarte && GeoCarte.obtenir('france-departements');
  if (!INFOS || !CARTE) {
    console.error('france/codage.js : data/france/infos-departements.js et carte-departements.js doivent être chargés avant');
    return;
  }

  const OUTRE_MER = 'Outre-Mer';
  const TEMPS = [3, 5, 10, 15, 20, 25, 30];   // secondes par question : les crans du curseur
  const DELAI_BONNE = 700;                     // pause avant la question suivante (ms)
  const DELAI_FAUSSE = 1800;
  const CLE = 'geonohyne.codage.reglages';       // derniers réglages (mémorisés)
  const MODES = {
    codage: {
      nom: 'Codage',
      consigne: 'Quel est le numéro de…',
      saisie: 'Numéro du département, puis Entrée…',
      aide: 'Le nom d\'un département s\'affiche : tapez son numéro (Essonne → 91), puis Entrée.'
    },
    encodage: {
      nom: 'Encodage',
      consigne: 'Quel département porte le numéro…',
      saisie: 'Nom du département, puis Entrée…',
      aide: 'Un numéro s\'affiche : tapez le nom du département (91 → Essonne), puis Entrée. ' +
        'Majuscules, accents, espaces, tirets et apostrophes ne comptent pas.'
    }
  };

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Même tolérance que La Liste : « illeetvilaine », « Réunion », « St-… »
  const reduire = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .replace(/\bst(e?)\b/g, 'saint$1')
    .replace(/[^a-z0-9]/g, '');
  const ARTICLE = /^(le\s+|la\s+|les\s+|l['’]\s*)/i;
  // Code tapé : « 1 » = « 01 », « 2a » = « 2A » ; les espaces ne comptent pas
  const lireCode = (s) => {
    const t = String(s).replace(/\s+/g, '').toUpperCase();
    return /^\d$/.test(t) ? '0' + t : t;
  };
  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
  const secondes = (ms) => (ms / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' s';
  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ---------- Les départements ---------- */
  // Ordre des codes : 2A et 2B entre 19 et 21, les DOM à la fin
  const rang = (c) => (c === '2A' ? 20.1 : c === '2B' ? 20.2 : parseInt(c, 10));
  const DEPS = CARTE.elements.filter((e) => INFOS.zones[e.code]).map((e) => ({
    code: e.code,
    nom: e.nom,
    groupe: e.code.length === 3 ? OUTRE_MER : INFOS.zones[e.code].region,
    cles: new Set([reduire(e.nom), reduire(e.nom.replace(ARTICLE, ''))])
  })).sort((a, b) => rang(a.code) - rang(b.code));
  // Régions : ordre alphabétique, Outre-Mer en dernier
  const GROUPES = [...new Set(DEPS.map((d) => d.groupe))]
    .sort((a, b) => (a === OUTRE_MER) - (b === OUTRE_MER) || a.localeCompare(b, 'fr'));

  /* ---------- Réglages (mémorisés) ---------- */
  // nombre : le nombre voulu ; on en joue au plus autant qu'en comptent les régions choisies
  const reglages = { mode: 'codage', regions: GROUPES.slice(), nombre: 20, temps: 10 };
  try {
    const m = JSON.parse(localStorage.getItem(CLE) || 'null');
    if (m) {
      if (MODES[m.mode]) reglages.mode = m.mode;
      if (Array.isArray(m.regions)) reglages.regions = GROUPES.filter((g) => m.regions.includes(g));
      if (m.nombre >= 1) reglages.nombre = Math.floor(m.nombre);
      if (TEMPS.includes(m.temps)) reglages.temps = m.temps;
    }
  } catch (e) { /* stockage indisponible ou illisible : réglages par défaut */ }
  function sauver() {
    try { localStorage.setItem(CLE, JSON.stringify(reglages)); } catch (e) { /* valable pour la session */ }
  }
  const choisis = () => DEPS.filter((d) => reglages.regions.includes(d.groupe));

  /* ---------- Partie ---------- */
  let p = null;

  function arreter() {
    if (p) { clearInterval(p.chrono); clearTimeout(p.minuteur); }
  }

  function nouvellePartie() {
    arreter();
    const deps = choisis();
    if (!deps.length) return;
    p = {
      mode: reglages.mode,
      temps: reglages.temps,
      questions: melanger(deps).slice(0, Math.min(reglages.nombre, deps.length)),
      idx: -1,
      score: 0,
      rates: [],                     // départements ratés (réponse fausse ou temps écoulé)
      durees: [],                    // temps de réponse des bonnes réponses (ms)
      debut: 0,                      // affichage de la question en cours
      repondu: 0,                    // heure de la réponse (pause avant la suivante)
      verrou: false,                 // réponse donnée : pause avant la question suivante
      chrono: null,
      minuteur: null,
      fini: false
    };
    const m = MODES[p.mode];
    const saisie = $('#codage-saisie');
    saisie.placeholder = m.saisie;
    // Clavier numérique sur mobile en codage, sauf si la Corse (2A, 2B) est en jeu
    saisie.inputMode = p.mode === 'codage' && !p.questions.some((d) => /[AB]/.test(d.code)) ? 'numeric' : 'text';
    $('#codage-consigne').textContent = m.consigne;
    $('#codage-total').textContent = p.questions.length;
    avancer();
  }

  function avancer() {
    clearTimeout(p.minuteur);
    p.idx++;
    if (p.idx >= p.questions.length) return terminer();
    const d = p.questions[p.idx];
    p.verrou = false;
    $('#codage-carte').className = 'codage-carte';
    $('#codage-question').textContent = p.mode === 'codage' ? d.nom : d.code;
    const saisie = $('#codage-saisie');
    saisie.value = '';
    saisie.readOnly = false;         // (pas disabled : le clavier reste ouvert sur mobile)
    retour('idle', 'Votre réponse, puis Entrée.');
    majStats();
    p.debut = Date.now();
    majChrono(p.temps * 1000);
    p.chrono = setInterval(() => {
      // Écran quitté (menu, options) : la partie s'arrête
      if ($('#screen-codage').classList.contains('hidden') || $('#codage-jeu').classList.contains('hidden')) return arreter();
      const reste = p.temps * 1000 - (Date.now() - p.debut);
      if (reste <= 0) repondre(null);
      else majChrono(reste);
    }, 100);
    saisie.focus();
  }

  // texte === null : temps écoulé
  function repondre(texte) {
    if (!p || p.fini || p.verrou) return;
    if (texte !== null && !texte.trim()) return;        // champ vide : rien à valider
    clearInterval(p.chrono);
    p.verrou = true;
    p.repondu = Date.now();
    const d = p.questions[p.idx];
    const duree = p.repondu - p.debut;
    const bon = texte !== null && (p.mode === 'codage' ? lireCode(texte) === d.code : d.cles.has(reduire(texte)));
    const paire = '<strong>' + esc(d.code) + '</strong> = <strong>' + esc(d.nom) + '</strong>';
    if (bon) {
      p.score++;
      p.durees.push(duree);
      retour('ok', '✅ ' + paire + ' (' + secondes(duree) + ')');
    } else {
      p.rates.push(d);
      retour('ko', texte === null
        ? '⏱ Temps écoulé : ' + paire + '.'
        : '❌ ' + paire + ' (vous avez tapé « ' + esc(texte.trim()) + ' »).');
    }
    $('#codage-carte').className = 'codage-carte ' + (bon ? 'is-ok' : 'is-ko');
    $('#codage-saisie').readOnly = true;
    if (texte === null) majChrono(0);
    majStats();
    p.minuteur = setTimeout(avancer, bon ? DELAI_BONNE : DELAI_FAUSSE);
  }

  function terminer() {
    p.fini = true;
    arreter();
    const n = p.questions.length;
    const pourcent = Math.round(100 * p.score / n);
    $('#codage-saisie').readOnly = true;
    retour(p.score === n ? 'ok' : 'idle', 'Partie terminée : ' + p.score + ' / ' + n + '.');

    $('#codage-fin-emoji').textContent = pourcent === 100 ? '🏆' : pourcent >= 70 ? '🎉' : pourcent >= 40 ? '👍' : '📚';
    $('#codage-fin-texte').textContent = MODES[p.mode].nom + ' · ' + pluriel(n, 'département') + ' · ' + p.temps + ' s par question';
    $('#codage-fin-score').textContent = p.score;
    $('#codage-fin-score-label').textContent = 'Bonnes réponses sur ' + n;
    $('#codage-fin-pourcent').textContent = pourcent + ' %';
    $('#codage-fin-moyenne').textContent = p.durees.length
      ? secondes(p.durees.reduce((a, b) => a + b, 0) / p.durees.length) : '—';
    $('#codage-fin-rates').classList.toggle('hidden', !p.rates.length);
    $('#codage-fin-liste').innerHTML = p.rates.slice().sort((a, b) => rang(a.code) - rang(b.code)).map((d) =>
      '<span class="chip">' + esc(d.code) + ' · ' + esc(d.nom) + '</span>').join('');
    $('#codage-fin').showModal();
  }

  /* ---------- Affichage de la partie ---------- */

  function retour(type, html) {
    const f = $('#codage-feedback');
    f.className = 'fb fb-' + type;
    f.innerHTML = '<span>' + html + '</span>';
  }

  function majStats() {
    $('#codage-numero').textContent = Math.min(p.idx + 1, p.questions.length);
    $('#codage-score').textContent = p.score;
  }

  // Barre qui rétrécit, rouge dans le dernier tiers
  function majChrono(reste) {
    const total = p.temps * 1000;
    $('#codage-chrono-barre').style.width = (100 * Math.max(0, reste) / total) + '%';
    $('#codage-chrono').classList.toggle('is-urgent', reste <= total / 3);
    $('#codage-chrono-texte').textContent = Math.ceil(Math.max(0, reste) / 1000) + ' s';
  }

  /* ---------- Options ---------- */

  function definirMode(m) {
    reglages.mode = m;
    document.querySelectorAll('[data-codage-mode]').forEach((b) => {
      const actif = b.dataset.codageMode === m;
      b.classList.toggle('is-active', actif);
      b.setAttribute('aria-pressed', String(actif));
    });
    $('#codage-mode-aide').textContent = MODES[m].aide;
  }

  function dessinerRegions() {
    const liste = $('#codage-regions');
    liste.innerHTML = '';
    GROUPES.forEach((g) => {
      const label = document.createElement('label');
      label.className = 'chip-check';
      const coche = document.createElement('input');
      coche.type = 'checkbox';
      coche.value = g;
      coche.checked = reglages.regions.includes(g);
      const texte = document.createElement('span');
      texte.textContent = g + ' · ' + DEPS.filter((d) => d.groupe === g).length;
      label.append(coche, texte);
      liste.appendChild(label);
    });
  }

  // Le nombre de départements suit les régions choisies : de 1 à leur total
  function majNombre() {
    const max = choisis().length;
    const valeur = Math.min(reglages.nombre, max);
    const curseur = $('#codage-nombre-curseur');
    const champ = $('#codage-nombre');
    curseur.max = champ.max = Math.max(1, max);
    curseur.value = champ.value = Math.max(1, valeur);
    curseur.disabled = champ.disabled = max === 0;
    $('#codage-nombre-max').textContent = Math.max(1, max);
    $('#codage-lancer').disabled = max === 0;
    $('#codage-statut').textContent = max === 0 ? 'Choisissez au moins une région.' : '';
  }

  function majTemps() {
    const curseur = $('#codage-temps');
    curseur.value = TEMPS.indexOf(reglages.temps);
    $('#codage-temps-valeur').textContent = reglages.temps + ' s';
    curseur.setAttribute('aria-valuetext', reglages.temps + ' secondes');
  }

  // Deux étapes : les options, puis la partie
  function afficherEtape(etape) {
    if (etape === 'options') arreter();
    $('#codage-options').classList.toggle('hidden', etape !== 'options');
    $('#codage-jeu').classList.toggle('hidden', etape !== 'jeu');
    window.scrollTo(0, 0);
  }

  // Partie commencée et pas terminée
  const enCours = () => p && !p.fini && (p.idx > 0 || p.verrou);

  function brancher() {
    dessinerRegions();
    document.querySelectorAll('[data-codage-mode]').forEach((b) => b.addEventListener('click', () => {
      definirMode(b.dataset.codageMode);
      sauver();
    }));
    $('#codage-regions').addEventListener('change', () => {
      reglages.regions = [...document.querySelectorAll('#codage-regions input:checked')].map((i) => i.value);
      majNombre();
      sauver();
    });
    document.querySelectorAll('[data-codage-regions]').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('#codage-regions input').forEach((i) => { i.checked = b.dataset.codageRegions === 'tout'; });
      $('#codage-regions').dispatchEvent(new Event('change'));
    }));

    // Nombre : curseur et champ numérique synchronisés
    const curseur = $('#codage-nombre-curseur');
    const champ = $('#codage-nombre');
    curseur.addEventListener('input', () => {
      reglages.nombre = champ.value = +curseur.value;
      sauver();
    });
    champ.addEventListener('input', () => {
      const v = parseInt(champ.value, 10);
      if (!isNaN(v)) curseur.value = Math.min(+curseur.max, Math.max(1, v));
    });
    champ.addEventListener('change', () => {
      reglages.nombre = +curseur.value;
      champ.value = curseur.value;
      sauver();
    });

    $('#codage-temps').addEventListener('input', (e) => {
      reglages.temps = TEMPS[+e.target.value];
      majTemps();
      sauver();
    });

    $('#codage-lancer').addEventListener('click', () => {
      if (!choisis().length) return;
      afficherEtape('jeu');
      nouvellePartie();
    });
    $('#codage-retour').addEventListener('click', () => {
      if (enCours() && !confirm('Quitter la partie en cours ?')) return;
      afficherEtape('options');
    });
    $('#codage-recommencer').addEventListener('click', () => {
      if (enCours() && !confirm('Recommencer avec un nouveau tirage ?')) return;
      nouvellePartie();
    });

    // Entrée : valide la réponse, ou passe la pause qui suit une réponse
    $('#codage-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!p || p.fini) return;
      if (p.verrou) {
        if (Date.now() - p.repondu > 300) avancer();     // pas sur une double frappe d'Entrée
        return;
      }
      repondre($('#codage-saisie').value);
    });

    // Fenêtre de fin : un bouton, Échap ou un clic à côté la ferment.
    // « Menu » (data-action="menu") est traité ensuite par js/core.js.
    const fin = $('#codage-fin');
    fin.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      const r = fin.getBoundingClientRect();
      const dehors = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      if (!b && !dehors) return;
      fin.close();
      if (b && b.dataset.fin === 'rejouer') nouvellePartie();
      if (b && b.dataset.fin === 'options') afficherEtape('options');
    });
  }

  let branche = false;
  GeoNohyne.registerJeu({
    id: 'codage',
    titre: 'Codage – Encodage',
    icone: '🔢',
    description: 'Le numéro d\'un département à partir de son nom, ou l\'inverse, avant la fin du chrono.',
    ecran: 'screen-codage',
    sansCarte: true,

    ouvrir() {
      if (!branche) { brancher(); branche = true; }
      definirMode(reglages.mode);
      majNombre();
      majTemps();
      afficherEtape('options');        // on règle d'abord la partie, puis « Lancer la partie »
    }
  });
})();
