/* ==========================================================================
   modes/chronologie.js — « Chronologie »

   Cinq événements, sous forme de blocs, à placer sur une frise de cinq emplacements, du plus ancien
   (à gauche, ou en haut sur téléphone) au plus récent. On peut déplacer les blocs autant qu'on veut
   avant de valider ; « Valider » révèle alors la date de chaque événement, marque ceux qui sont bien
   placés (✓) ou la place qu'ils auraient dû prendre (n° 3), et dessine les cinq dates à l'échelle.

   Déplacer un bloc (trois façons, au choix)
     - le glisser avec la souris ou le doigt jusqu'à un emplacement (ou jusqu'à la zone des blocs à
       placer pour le retirer) ; déposé sur un emplacement occupé, il prend sa place et l'autre bloc
       prend la sienne (ou retourne dans la zone s'il en venait) ;
     - cliquer un bloc, puis un emplacement (ou un autre bloc, pour les échanger) ;
     - au clavier : Tab jusqu'au bloc, Entrée pour le prendre, puis un chiffre de 1 à 5 (emplacement) ;
       ← / → (ou ↑ / ↓) décalent un bloc de la frise, Suppr le retire, Échap lâche la sélection.

   Préphase : trois filtres croisés, cumulables (chaque case porte le nombre d'événements concernés,
   compte tenu des deux autres filtres) : la période (époque), la difficulté et la thématique
   (domaine). Aucun filtre coché sur un groupe : aucun événement. Impossible de lancer la partie s'il y a
   moins de 5 événements, ou si on ne peut pas en tirer 5 qu'on puisse départager (voir compatibles).
   Puis le nombre de manches (3, 5 ou 10). Les événements ne reviennent pas d'une manche à l'autre
   tant qu'il en reste d'autres à tirer.

   Score : un point par événement placé à sa vraie place (5 par manche). La partie s'enregistre avec
   HistProfils.enregistrerPartie : score = événements bien placés, total = 5 × le nombre de manches.
   Données : js/donnees/dates.js (HISTEHORY.DATES) ; libellés des époques, difficultés, domaines et
   régions : js/donnees/personnes.js (HISTEHORY.EPOQUES, DIFFICULTES, DOMAINES, REGIONS).
   ========================================================================== */
(function () {
  'use strict';

  const H = window.HISTEHORY || {};
  const DATES = H.DATES || [];

  const NB = 5;                       // événements par manche
  const MANCHES = [3, 5, 10];         // longueurs de partie proposées
  const ECART_APPROX = 15;            // ans d'écart minimal quand l'une des dates est approximative
  const SEUIL_GLISSE = 6;             // px à parcourir avant qu'un appui devienne un glissement
  const ECART_POINTS = 8;             // % de largeur au moins entre deux points de l'échelle (lisibilité)
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  /* ---------- Les trois filtres de la préphase ---------- */
  const epoqueDe = (an) => (an < 476 ? 'antiquite' : an < 1453 ? 'moyen-age' : an < 1789 ? 'moderne' : 'contemporaine');
  const AIDE_EPOQUE = { antiquite: 'avant 476', 'moyen-age': '476 – 1452', moderne: '1453 – 1788', contemporaine: 'depuis 1789' };
  const FILTRES = [
    { id: 'epoque', titre: 'Période', libelles: () => H.EPOQUES || {}, de: (e) => epoqueDe(e.annee), aide: AIDE_EPOQUE },
    { id: 'difficulte', titre: 'Difficulté', libelles: () => H.DIFFICULTES || { 1: 'Très facile', 2: 'Facile', 3: 'Moyen', 4: 'Difficile', 5: 'Extrême' }, de: (e) => String(e.difficulte) },
    { id: 'domaine', titre: 'Thématique', libelles: () => H.DOMAINES || {}, de: (e) => e.domaine }
  ];

  const choisis = {};                 // id du filtre -> Set des valeurs cochées (tout, au départ)
  const puces = {};                   // id du filtre -> { valeur: { bouton, n } }
  const reglages = { manches: 5 };
  let partie = null;                  // { vivier, vus, n, i, score, parfaites, debut, m }
  let drag = null;                    // glissement en cours : { id, bloc, x, y, pid, actif, ghost, dx, dy, cible }

  const $ = (id) => document.getElementById(id);
  const hasard = (n) => Math.floor(Math.random() * n);
  const nombre = (n) => n.toLocaleString('fr-FR');
  const pluriel = (n, mot) => nombre(n) + ' ' + mot + (n > 1 ? 's' : '');
  function el(balise, classe, texte) {
    const x = document.createElement(balise);
    if (classe) x.className = classe;
    if (texte !== undefined) x.textContent = texte;
    return x;
  }
  function melanger(t) {
    for (let i = t.length - 1; i > 0; i--) { const j = hasard(i + 1); [t[i], t[j]] = [t[j], t[i]]; }
    return t;
  }

  /* ---------- Dates : ordre, textes, événements qu'on peut départager ---------- */
  const cle = (e) => e.annee * 10000 + (e.mois || 0) * 100 + (e.jour || 0);   // ordre chronologique (année négative = avant notre ère)

  function anneeTexte(e) {
    const n = Math.abs(e.annee);
    const s = n >= 10000 ? nombre(n) : String(n);
    return e.annee < 0 ? s + ' av. J.-C.' : s;
  }
  function dateTexte(e) {
    if (e.approx) return 'vers ' + anneeTexte(e);
    if (e.jour) return (e.jour === 1 ? '1er' : e.jour) + ' ' + MOIS[e.mois - 1] + ' ' + anneeTexte(e);
    if (e.mois) return MOIS[e.mois - 1] + ' ' + anneeTexte(e);
    return anneeTexte(e);
  }

  /* Deux événements se départagent s'ils ne tombent pas la même année (sauf si les deux ont un jour précis
     et différent) et, quand l'une des dates est approximative, s'ils sont éloignés d'au moins ECART_APPROX ans.
     Cette relation est « transitive » dans l'ordre du temps : une suite d'événements consécutifs
     compatibles est compatible deux à deux. */
  function compatibles(a, b) {
    if (a.annee === b.annee) {
      return a.jour !== null && b.jour !== null && !a.approx && !b.approx && (a.mois !== b.mois || a.jour !== b.jour);
    }
    return !(a.approx || b.approx) || Math.abs(a.annee - b.annee) >= ECART_APPROX;
  }

  /* Plus longue suite d'événements qu'on peut départager (programmation dynamique, n² : quelques ms).
     Sert à savoir si l'on peut tirer NB événements, et de secours au tirage au hasard. */
  function plusLongueChaine(liste) {
    const t = liste.slice().sort((a, b) => cle(a) - cle(b));
    const long = new Array(t.length).fill(1), prec = new Array(t.length).fill(-1);
    let fin = -1;
    for (let i = 0; i < t.length; i++) {
      for (let j = 0; j < i; j++) {
        if (long[j] + 1 > long[i] && compatibles(t[j], t[i])) { long[i] = long[j] + 1; prec[i] = j; }
      }
      if (fin < 0 || long[i] > long[fin]) fin = i;
    }
    const chaine = [];
    for (let i = fin; i >= 0; i = prec[i]) chaine.push(t[i]);
    return chaine.reverse();
  }

  function tirerCinq(source) {
    if (source.length < NB) return null;
    for (let essai = 0; essai < 300; essai++) {
      const c = [];
      for (const e of melanger(source.slice())) {
        if (c.every((x) => compatibles(x, e))) { c.push(e); if (c.length === NB) return c; }
      }
    }
    const chaine = plusLongueChaine(source);
    return chaine.length >= NB ? melanger(chaine.slice()).slice(0, NB) : null;
  }
  // D'abord parmi les événements pas encore vus pendant la partie ; s'il n'y en a plus assez, parmi tous
  function tirerManche(vivier, vus) {
    let m = tirerCinq(vivier.filter((e) => !vus.has(e.id)));
    if (!m) { vus.clear(); m = tirerCinq(vivier); }
    return m;
  }

  /* ---------- Écran de préphase ---------- */
  const passe = (e, sauf) => FILTRES.every((f) => f.id === sauf || choisis[f.id].has(f.de(e)));
  const vivier = () => DATES.filter((e) => passe(e));

  function construireFiltres() {
    FILTRES.forEach((f) => { choisis[f.id] = new Set(Object.keys(f.libelles())); });
    $('chrono-filtres').replaceChildren(...FILTRES.map((f) => {
      const groupe = el('div', 'chrono-groupe');
      const tete = el('div', 'chrono-groupe__tete');
      const outils = el('span', 'chrono-groupe__outils');
      [['Tout', true], ['Aucun', false]].forEach(([texte, tout]) => {
        const b = el('button', 'btn-link', texte);
        b.type = 'button';
        b.addEventListener('click', () => {
          choisis[f.id] = new Set(tout ? Object.keys(f.libelles()) : []);
          majPreparation();
        });
        outils.append(b);
      });
      tete.append(el('h2', 'config__titre', f.titre), outils);
      const liste = el('div', 'chrono-puces');
      puces[f.id] = {};
      Object.entries(f.libelles()).forEach(([valeur, libelle]) => {
        const b = el('button', 'puce');
        b.type = 'button';
        const n = el('span', 'puce__n', '0');
        b.append(el('span', 'puce__nom', libelle));
        if (f.aide && f.aide[valeur]) b.append(el('span', 'puce__aide', f.aide[valeur]));
        b.append(n);
        b.addEventListener('click', () => {
          const s = choisis[f.id];
          if (s.has(valeur)) s.delete(valeur); else s.add(valeur);
          majPreparation();
        });
        liste.append(b);
        puces[f.id][valeur] = { bouton: b, n };
      });
      groupe.append(tete, liste);
      return groupe;
    }));
    $('chrono-manches').replaceChildren(...MANCHES.map((n) => {
      const b = el('button', 'choix');
      b.type = 'button';
      b.dataset.manches = n;
      b.append(el('span', 'choix__titre', n + ' manches'), el('span', 'choix__aide', pluriel(n * NB, 'événement')));
      b.addEventListener('click', () => { reglages.manches = n; majPreparation(); });
      return b;
    }));
  }

  function majPreparation() {
    FILTRES.forEach((f) => {
      Object.entries(puces[f.id]).forEach(([valeur, p]) => {
        // Le nombre d'une case tient compte des deux autres filtres
        const n = DATES.filter((e) => passe(e, f.id) && f.de(e) === valeur).length;
        const actif = choisis[f.id].has(valeur);
        p.n.textContent = nombre(n);
        p.bouton.classList.toggle('is-active', actif);
        p.bouton.classList.toggle('is-vide', n === 0);
        p.bouton.setAttribute('aria-pressed', actif);
      });
    });
    $('chrono-manches').querySelectorAll('.choix').forEach((b) => {
      const actif = +b.dataset.manches === reglages.manches;
      b.classList.toggle('is-active', actif);
      b.setAttribute('aria-pressed', actif);
    });
    const v = vivier();
    const possible = v.length >= NB && plusLongueChaine(v).length >= NB;
    let texte;
    if (v.length === 0) texte = 'Aucun événement ne correspond à ces choix.';
    else if (v.length < NB) texte = 'Il faut au moins ' + NB + ' événements pour lancer une partie : il n\'y en a que ' + v.length + '.';
    else if (!possible) texte = 'Ces ' + v.length + ' événements sont trop proches dans le temps : on ne peut pas en tirer ' + NB + ' qu\'on puisse départager.';
    else texte = pluriel(v.length, 'événement') + ' à tirer' + (v.length < NB * reglages.manches ? ' : certains reviendront d\'une manche à l\'autre.' : '.');
    const etat = $('chrono-etat');
    etat.textContent = texte;
    etat.classList.toggle('chrono-etat--non', !possible);
    $('chrono-commencer').disabled = !possible;
  }

  function ouvrir() {
    abandonnerGlissement();
    if (!Object.keys(puces).length) construireFiltres();
    majPreparation();
    Histehory.afficher('screen-chronologie-config');
  }

  /* ---------- Partie ---------- */
  function demarrer() {
    const v = vivier();
    if (v.length < NB || plusLongueChaine(v).length < NB) return;
    partie = { vivier: v, vus: new Set(), n: reglages.manches, i: 0, score: 0, parfaites: 0, debut: Date.now(), m: null };
    Histehory.afficher('screen-chronologie-jeu');
    manche();
  }

  function manche() {
    const evts = tirerManche(partie.vivier, partie.vus);
    evts.forEach((e) => partie.vus.add(e.id));
    partie.m = {
      evts: melanger(evts.slice()),                                  // ordre d'apparition des blocs à placer
      ordre: evts.slice().sort((a, b) => cle(a) - cle(b)),           // la bonne réponse
      slots: new Array(NB).fill(null),                               // id du bloc posé sur chaque emplacement
      sel: null,                                                     // bloc sélectionné (clic ou clavier)
      valide: false,
      bons: 0
    };
    $('chrono-barre').style.width = (100 * partie.i / partie.n) + '%';
    $('chrono-echelle').classList.add('hidden');
    $('chrono-verdict').textContent = '';
    $('chrono-verdict').className = 'verdict';
    $('chrono-suite').classList.add('hidden');
    $('chrono-valider').classList.remove('hidden');
    rendre();
  }

  const enSlot = (m, id) => m.slots.indexOf(id) >= 0;
  const evenement = (m, id) => m.evts.find((e) => e.id === id);

  /* Le bloc d'un événement. Avant la validation : titre et indices (domaine, région) ; après : sa date,
     ✓ ou la place qu'il aurait dû prendre, et son résumé. */
  function bloc(m, e, place) {
    const b = el('div', 'bloc');
    b.dataset.id = e.id;
    b.append(el('span', 'bloc__titre', e.evenement));
    const info = [(H.DOMAINES || {})[e.domaine], (H.REGIONS || {})[e.region]].filter(Boolean).join(' · ');
    if (info) b.append(el('span', 'bloc__info', info));
    if (m.valide) {
      const vrai = m.ordre.findIndex((x) => x.id === e.id);
      const bon = place === vrai;
      b.append(el('span', 'bloc__date', dateTexte(e)));
      b.append(el('span', 'bloc__badge', bon ? '✓' : '✗ n° ' + (vrai + 1)));
      b.append(el('span', 'bloc__resume', e.resume));
      b.title = e.evenement + ' — ' + dateTexte(e) + '. ' + e.resume;
      b.setAttribute('aria-label', e.evenement + ', ' + dateTexte(e) + ', ' + (bon ? 'bien placé' : 'mal placé : place n° ' + (vrai + 1)));
      b.classList.add(bon ? 'bloc--bon' : 'bloc--faux');
      b.setAttribute('role', 'img');
    } else {
      b.setAttribute('role', 'button');
      b.tabIndex = 0;
      b.setAttribute('aria-pressed', m.sel === e.id);
      b.classList.toggle('is-sel', m.sel === e.id);
      b.setAttribute('aria-label', e.evenement + (info ? ' (' + info + ')' : '') +
        (place >= 0 ? ', placé en position ' + (place + 1) : ', à placer'));
    }
    return b;
  }

  function rendre(focusId) {
    const m = partie.m;
    $('chrono-reserve').replaceChildren(...m.evts.filter((e) => !enSlot(m, e.id)).map((e) => bloc(m, e, -1)));
    $('chrono-reserve').classList.toggle('hidden', m.valide);      // après la validation, tout est placé : la zone ne sert plus
    $('chrono-frise').replaceChildren(...m.slots.map((id, i) => {
      const li = el('li', 'creneau');
      li.dataset.slot = i;
      li.append(el('span', 'creneau__num', String(i + 1)));
      if (id) {
        const e = evenement(m, id);
        li.append(bloc(m, e, i));
        if (m.valide) li.classList.add(m.ordre[i].id === id ? 'creneau--bon' : 'creneau--faux');
      } else {
        li.append(el('span', 'creneau__vide', 'Déposer ici'));
        li.tabIndex = 0;
        li.setAttribute('role', 'button');
        li.setAttribute('aria-label', 'Emplacement ' + (i + 1) + ' sur ' + NB + ', vide');
      }
      return li;
    }));
    $('chrono-valider').disabled = m.valide || m.slots.some((s) => s === null);
    $('chrono-progression').textContent = 'Manche ' + (partie.i + 1) + ' / ' + partie.n;
    $('chrono-score').textContent = partie.score + ' bien placé' + (partie.score > 1 ? 's' : '');
    majAide();
    if (focusId) {
      const b = document.querySelector('#screen-chronologie-jeu .bloc[data-id="' + focusId + '"]');
      if (b) b.focus({ preventScroll: true });
    }
  }

  function majAide() {
    const m = partie.m;
    const aide = $('chrono-aide');
    if (m.valide) { aide.classList.add('invisible'); return; }
    const souris = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (m.sel) aide.textContent = 'Cliquez sur un emplacement de la frise (ou sur un autre bloc pour les échanger).';
    else aide.textContent = souris ? 'Glissez les blocs sur la frise, du plus ancien au plus récent (ou cliquez un bloc, puis un emplacement).'
      : 'Glissez les blocs sur la frise, du plus ancien au plus récent (ou touchez un bloc, puis un emplacement).';
    aide.classList.toggle('invisible', partie.i > 0 && !m.sel);
  }

  /* ---------- Déplacer les blocs ---------- */
  function placer(id, i) {                         // pose le bloc sur l'emplacement i ; l'occupant prend sa place (ou retourne dans la zone)
    const m = partie.m, src = m.slots.indexOf(id), occupant = m.slots[i];
    if (occupant === id) return;
    if (src >= 0) m.slots[src] = occupant;
    m.slots[i] = id;
  }
  function retirer(id) {
    const m = partie.m, src = m.slots.indexOf(id);
    if (src >= 0) m.slots[src] = null;
  }
  function echanger(a, b) {                        // les deux blocs prennent chacun la place de l'autre
    const m = partie.m, ia = m.slots.indexOf(a), ib = m.slots.indexOf(b);
    if (ia >= 0) m.slots[ia] = b;
    if (ib >= 0) m.slots[ib] = a;
  }
  function decaler(id, d) {
    const m = partie.m, i = m.slots.indexOf(id), j = i + d;
    if (i < 0 || j < 0 || j >= NB) return;
    [m.slots[i], m.slots[j]] = [m.slots[j], m.slots[i]];
    rendre(id);
  }

  function clicBloc(id) {
    const m = partie.m;
    if (m.sel === null) m.sel = id;
    else if (m.sel === id) m.sel = null;
    else if (!enSlot(m, m.sel) && !enSlot(m, id)) m.sel = id;      // deux blocs de la zone : on change de sélection
    else { echanger(m.sel, id); m.sel = null; }
    rendre(id);
  }
  function clicCreneau(i) {
    const m = partie.m;
    if (!m.sel) return;
    const id = m.sel;
    placer(id, i);
    m.sel = null;
    rendre(id);
  }
  function clicReserve() {
    const m = partie.m;
    if (!m.sel) return;
    const id = m.sel;
    retirer(id);
    m.sel = null;
    rendre(id);
  }

  /* ---------- Glisser-déposer (souris et tactile, par les « pointer events ») ---------- */
  function cibleSous(x, y) {
    const e = document.elementFromPoint(x, y);
    return e && e.closest ? e.closest('.creneau, .chrono-reserve') : null;
  }
  function nettoyerGlissement() {
    if (!drag) return;
    if (drag.ghost) drag.ghost.remove();
    if (drag.cible) drag.cible.classList.remove('is-cible');
    drag.bloc.classList.remove('is-origine');
    document.body.classList.remove('chrono-glisse');
    drag = null;
  }
  function abandonnerGlissement() { nettoyerGlissement(); }

  function debutAppui(e) {
    if (!partie || partie.m.valide || (e.button !== undefined && e.button !== 0)) return;
    const b = e.target.closest('.bloc');
    if (!b || drag) return;
    drag = { id: b.dataset.id, bloc: b, x: e.clientX, y: e.clientY, pid: e.pointerId, actif: false, ghost: null, cible: null };
  }
  function mouvement(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.actif) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < SEUIL_GLISSE) return;
      const r = drag.bloc.getBoundingClientRect();
      const g = drag.bloc.cloneNode(true);
      g.classList.add('bloc--fantome');
      g.removeAttribute('tabindex');
      g.style.width = r.width + 'px';
      g.style.height = r.height + 'px';
      drag.dx = drag.x - r.left;
      drag.dy = drag.y - r.top;
      drag.ghost = g;
      drag.actif = true;
      drag.bloc.classList.add('is-origine');
      document.body.classList.add('chrono-glisse');
      document.body.append(g);
    }
    e.preventDefault();
    drag.ghost.style.transform = 'translate(' + (e.clientX - drag.dx) + 'px,' + (e.clientY - drag.dy) + 'px)';
    const c = cibleSous(e.clientX, e.clientY);
    if (c !== drag.cible) {
      if (drag.cible) drag.cible.classList.remove('is-cible');
      if (c) c.classList.add('is-cible');
      drag.cible = c;
    }
  }
  function finAppui(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    const d = drag;
    const c = d.actif ? cibleSous(e.clientX, e.clientY) : null;
    nettoyerGlissement();
    if (!partie || partie.m.valide) return;
    if (!d.actif) { if (e.type === 'pointerup') clicBloc(d.id); return; }     // un simple appui : sélection
    const m = partie.m;
    if (c && c.classList.contains('creneau')) placer(d.id, +c.dataset.slot);
    else if (c) retirer(d.id);                                                  // lâché dans la zone des blocs à placer
    else return;                                                                // lâché ailleurs : rien ne bouge
    m.sel = null;
    rendre(d.id);
  }

  /* ---------- Validation, manche suivante, fin ---------- */
  function valider() {
    const m = partie.m;
    if (!m || m.valide || m.slots.some((s) => s === null)) return;
    m.valide = true;
    m.sel = null;
    m.bons = m.slots.filter((id, i) => id === m.ordre[i].id).length;
    partie.score += m.bons;
    if (m.bons === NB) partie.parfaites++;
    rendre();
    echelle(m);
    const v = $('chrono-verdict');
    v.textContent = m.bons === NB ? '✓ Chronologie parfaite !' : m.bons + ' / ' + NB + ' bien placé' + (m.bons > 1 ? 's' : '');
    v.className = 'verdict ' + (m.bons === NB ? 'verdict--bon' : m.bons <= 1 ? 'verdict--faux' : 'verdict--moyen');
    $('chrono-barre').style.width = (100 * (partie.i + 1) / partie.n) + '%';
    $('chrono-valider').classList.add('hidden');
    const suite = $('chrono-suite');
    suite.textContent = partie.i + 1 < partie.n ? 'Manche suivante →' : 'Voir le résultat';
    suite.classList.remove('hidden');
    suite.focus({ preventScroll: true });
  }

  // Les cinq dates à l'échelle : un point par événement, numéroté d'après sa vraie place (vert : bien placé)
  function echelle(m) {
    const ans = m.ordre.map((e) => e.annee), min = ans[0], max = ans[NB - 1];
    const trait = $('chrono-echelle-trait');
    // Position en % de la largeur ; deux dates très proches sont légèrement écartées pour que les numéros restent lisibles
    const pos = m.ordre.map((e) => 3 + 94 * (max === min ? .5 : (e.annee - min) / (max - min)));
    for (let k = 1; k < NB; k++) pos[k] = Math.max(pos[k], pos[k - 1] + ECART_POINTS);
    pos[NB - 1] = Math.min(pos[NB - 1], 97);                              // le dernier ne déborde pas de la ligne…
    for (let k = NB - 2; k >= 0; k--) pos[k] = Math.min(pos[k], pos[k + 1] - ECART_POINTS);   // … et les autres reculent pour lui laisser la place
    trait.replaceChildren(...m.ordre.map((e, k) => {
      const p = el('span', 'chrono-point ' + (m.slots[k] === e.id ? 'chrono-point--bon' : 'chrono-point--faux'), String(k + 1));
      p.style.left = pos[k] + '%';
      p.title = e.evenement + ' — ' + dateTexte(e);
      return p;
    }));
    const ecart = max - min - (min < 0 && max > 0 ? 1 : 0);      // pas d'année 0
    $('chrono-echelle-legende').textContent = 'Du plus ancien au plus récent : ' + pluriel(ecart, 'an') + ' d\'écart.';
    $('chrono-echelle').classList.remove('hidden');
  }

  function suivant() {
    if (!partie || !partie.m.valide) return;
    partie.i++;
    if (partie.i < partie.n) manche();
    else terminer();
  }

  function terminer() {
    const total = partie.n * NB, tempsMs = Date.now() - partie.debut;
    const titre = 'Chronologie (' + partie.n + ' manches)';
    if (window.HistProfils) HistProfils.enregistrerPartie({ mode: 'chronologie', titre, score: partie.score, total, tempsMs });
    const s = Math.round(tempsMs / 1000);
    $('chrono-fin-score').textContent = partie.score + ' / ' + total;
    $('chrono-fin-detail').textContent = partie.n + ' manches · ' + pluriel(partie.parfaites, 'chronologie') + ' parfaite' + (partie.parfaites > 1 ? 's' : '') +
      ' · ' + Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s';
    const r = partie.score / total;
    $('chrono-fin-message').textContent = r === 1 ? 'Sans faute : le temps n\'a plus de secret pour vous !' : r >= .8 ? 'Excellent !'
      : r >= .6 ? 'Bien joué !' : r >= .4 ? 'Pas mal, encore un effort.' : 'Le temps file : rejouez !';
    partie = null;
    Histehory.afficher('screen-chronologie-fin');
  }

  /* ---------- Branchements ---------- */
  function init() {
    $('chrono-commencer').addEventListener('click', demarrer);
    $('chrono-rejouer').addEventListener('click', demarrer);
    $('chrono-reglages').addEventListener('click', ouvrir);
    $('chrono-valider').addEventListener('click', valider);
    $('chrono-suite').addEventListener('click', suivant);
    $('chrono-quitter').addEventListener('click', () => { partie = null; ouvrir(); });

    const ecran = $('screen-chronologie-jeu');
    ecran.addEventListener('pointerdown', debutAppui);
    document.addEventListener('pointermove', mouvement, { passive: false });
    document.addEventListener('pointerup', finAppui);
    document.addEventListener('pointercancel', finAppui);
    // Emplacement vide ou zone des blocs : on y pose le bloc sélectionné (les blocs, eux, passent par debutAppui)
    ecran.addEventListener('click', (e) => {
      if (!partie || partie.m.valide || e.target.closest('.bloc')) return;
      const c = e.target.closest('.creneau, .chrono-reserve');
      if (!c) return;
      if (c.classList.contains('creneau')) clicCreneau(+c.dataset.slot); else clicReserve();
    });

    document.addEventListener('keydown', (e) => {
      if (!partie || document.body.dataset.ecran !== 'screen-chronologie-jeu') return;
      const m = partie.m;
      if (m.valide) {
        if ((e.key === 'Enter' || e.key === ' ') && !(e.target.closest && e.target.closest('button'))) { e.preventDefault(); suivant(); }
        return;
      }
      if (e.key === 'Escape') { m.sel = null; rendre(); return; }
      const b = e.target.closest ? e.target.closest('.bloc') : null;
      const c = e.target.closest ? e.target.closest('.creneau') : null;
      const valide = e.key === 'Enter' || e.key === ' ';
      if (b) {
        const id = b.dataset.id;
        if (valide) { e.preventDefault(); clicBloc(id); }
        else if (/^[1-5]$/.test(e.key)) { e.preventDefault(); placer(id, +e.key - 1); m.sel = null; rendre(id); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); decaler(id, -1); }
        else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); decaler(id, 1); }
        else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); retirer(id); m.sel = null; rendre(id); }
      } else if (c && valide && m.sel) {
        e.preventDefault();
        clicCreneau(+c.dataset.slot);
      }
    });
  }

  Histehory.registerMode({
    id: 'chronologie',
    icone: '⏳',
    titre: 'Chronologie',
    description: 'Cinq événements à remettre dans l\'ordre sur la frise du temps.',
    ouvrir
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
