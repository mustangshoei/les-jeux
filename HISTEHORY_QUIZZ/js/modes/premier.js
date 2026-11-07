/* ==========================================================================
   modes/premier.js — « Qui est venu en premier ? »

   Deux personnages s'affichent dans des cadres (même principe que les rectangles de la page
   d'accueil : portrait-médaille en traits blancs, nom sur un cartouche). La question change à chaque
   manche : « Qui est né ⟵ EN PREMIER ? » ou « Qui est né EN DERNIER ⟶ ? ». On clique sur le bon cadre
   (ou ← / →) ; les deux années s'inscrivent alors sur les cartouches, et une mini-frise montre l'écart.
   Bonne réponse : la manche suivante arrive seule (DELAI_AUTO) ; erreur : on prend le temps de lire,
   « Suivant » (ou Entrée) pour continuer.

   Tirage d'une paire : jamais la même année de naissance ; si l'une des deux dates est
   approximative (« vers »), au moins ECART_APPROX ans d'écart, pour que la réponse reste sûre.
   Portraits : js/donnees/portraits.js (HISTEHORY.PORTRAITS) ; sans lui, les cadres restent sans image.
   ========================================================================== */
(function () {
  'use strict';

  const H = window.HISTEHORY || {};
  const ECART_APPROX = 15;
  const DELAI_AUTO = 1800;
  const NIVEAUX = {
    facile: { titre: 'Facile', aide: 'Les plus connus', max: 2 },
    moyen: { titre: 'Moyen', aide: 'Connus et moins connus', max: 3 },
    expert: { titre: 'Expert', aide: 'Tous les personnages', max: 5 }
  };
  const LONGUEURS = [10, 20, 30];
  const reglages = { niveau: 'facile', longueur: 10 };
  let partie = null;
  let minuterie = null;

  const $ = (id) => document.getElementById(id);
  const hasard = (n) => Math.floor(Math.random() * n);
  const nombre = (n) => n.toLocaleString('fr-FR');
  const pluriel = (n, mot) => nombre(n) + ' ' + mot + (n > 1 ? 's' : '');

  /* ---------- Textes ---------- */
  function annee(p) {
    const a = p.naissance < 0 ? -p.naissance + ' av. J.-C.' : String(p.naissance);
    return (p.approx ? 'vers ' : '') + a;
  }
  const ne = (p) => (p.sexe === 'F' ? 'Née ' : 'Né ') + annee(p);

  /* ---------- Portrait : HISTEHORY.PORTRAITS[id] = fichier dans img/ (personne ou image générique) */
  function portrait(p) {
    const f = H.PORTRAITS && H.PORTRAITS[p.id];
    // URL absolue : dans une variable CSS, une URL relative partirait du dossier css/
    return f ? new URL('img/' + f, document.baseURI).href : '';
  }

  /* ---------- Tirage ---------- */
  function compatibles(a, b) {
    const d = Math.abs(a.naissance - b.naissance);
    if (d === 0) return false;
    return !(a.approx || b.approx) || d >= ECART_APPROX;
  }
  function tirerPaires(n) {
    const max = NIVEAUX[reglages.niveau].max;
    const vivier = (H.PERSONNES || []).filter((p) => p.difficulte <= max);
    const vus = new Set();
    const paires = [];
    for (let essai = 0; paires.length < n && essai < 5000; essai++) {
      const a = vivier[hasard(vivier.length)], b = vivier[hasard(vivier.length)];
      if (a === b || vus.has(a.id) || vus.has(b.id) || !compatibles(a, b)) continue;
      vus.add(a.id); vus.add(b.id);
      paires.push({ a, b, sens: Math.random() < .5 ? 'avant' : 'apres' });
    }
    return paires;
  }

  /* ---------- Écran de configuration ---------- */
  function choix(conteneur, options, valeur, surChoix) {
    conteneur.replaceChildren(...options.map(([v, titre, aide]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choix' + (v === valeur ? ' is-active' : '');
      b.setAttribute('aria-pressed', v === valeur);
      b.innerHTML = '<span class="choix__titre"></span>' + (aide ? '<span class="choix__aide"></span>' : '');
      b.querySelector('.choix__titre').textContent = titre;
      if (aide) b.querySelector('.choix__aide').textContent = aide;
      b.addEventListener('click', () => { surChoix(v); configurer(); });
      return b;
    }));
  }
  function configurer() {
    choix($('premier-niveaux'), Object.entries(NIVEAUX).map(([k, n]) => [k, n.titre, n.aide]), reglages.niveau, (v) => { reglages.niveau = v; });
    choix($('premier-longueurs'), LONGUEURS.map((n) => [n, n + ' questions']), reglages.longueur, (v) => { reglages.longueur = v; });
  }
  function ouvrir() {
    arreterMinuterie();
    configurer();
    Histehory.afficher('screen-premier-config');
  }

  /* ---------- Partie ---------- */
  function arreterMinuterie() {
    clearTimeout(minuterie);
    minuterie = null;
    $('premier-suite').classList.remove('btn-auto');
  }

  function demarrer() {
    partie = { paires: tirerPaires(reglages.longueur), i: 0, score: 0, serie: 0, debut: Date.now(), repondu: false };
    Histehory.afficher('screen-premier-jeu');
    manche();
  }

  function afficherEtat() {
    $('premier-progression').textContent = 'Question ' + (partie.i + 1) + ' / ' + partie.paires.length;
    $('premier-score').textContent = pluriel(partie.score, 'point');
    const serie = $('premier-serie');
    serie.textContent = partie.serie >= 2 ? '🔥 ' + partie.serie + ' d\'affilée' : '';
    serie.classList.toggle('hidden', partie.serie < 2);
  }

  function remplirCadre(cadre, p) {
    cadre.className = 'cadre';
    cadre.disabled = false;
    const img = portrait(p);
    cadre.style.setProperty('--portrait', img ? 'url("' + img + '")' : 'none');
    cadre.querySelector('.cadre__nom').textContent = p.nom;
    cadre.querySelector('.cadre__info').textContent =
      [p.pays, (H.DOMAINES || {})[p.domaine], (H.EPOQUES || {})[p.epoque]].filter(Boolean).join(' · ');
    const date = cadre.querySelector('.cadre__date');
    date.textContent = ne(p);
    date.classList.add('invisible');
    cadre.querySelector('.cadre__badge').textContent = '';
  }

  function manche() {
    arreterMinuterie();
    const m = partie.paires[partie.i];
    partie.repondu = false;
    afficherEtat();
    $('premier-barre').style.width = (100 * partie.i / partie.paires.length) + '%';
    // La consigne : mot, couleur et flèche opposés, et une petite animation quand elle change
    const mot = $('premier-sens');
    mot.textContent = m.sens === 'avant' ? '⟵ en premier' : 'en dernier ⟶';
    mot.dataset.sens = m.sens;
    mot.classList.remove('question__sens--anime');
    void mot.offsetWidth;
    mot.classList.add('question__sens--anime');
    // Aide à la première question seulement (place réservée : rien ne bouge ensuite)
    const souris = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
    $('premier-aide').textContent = souris ? 'Cliquez sur le bon portrait (ou ← / →)' : 'Touchez le bon portrait';
    $('premier-aide').classList.toggle('invisible', partie.i > 0);
    remplirCadre($('premier-a'), m.a);
    remplirCadre($('premier-b'), m.b);
    $('premier-suite').classList.add('invisible');
    $('premier-frise').classList.add('invisible');
    $('premier-verdict').textContent = '';
    $('premier-verdict').className = 'verdict';
  }

  // Mini-frise : la plus ancienne naissance à gauche, l'écart au milieu
  function frise(m) {
    const [x, y] = m.a.naissance < m.b.naissance ? [m.a, m.b] : [m.b, m.a];
    const f = $('premier-frise');
    f.querySelector('.frise__debut').textContent = annee(x);
    f.querySelector('.frise__fin').textContent = annee(y);
    f.querySelector('.frise__ecart').textContent = pluriel(y.naissance - x.naissance, 'an');
    f.classList.remove('invisible');
  }

  function repondre(cote) {
    if (!partie || partie.repondu) return;
    partie.repondu = true;
    const m = partie.paires[partie.i];
    const premier = m.a.naissance < m.b.naissance ? 'a' : 'b';
    const bon = m.sens === 'avant' ? premier : (premier === 'a' ? 'b' : 'a');
    const juste = cote === bon;
    if (juste) { partie.score++; partie.serie++; } else partie.serie = 0;
    ['a', 'b'].forEach((c) => {
      const cadre = $('premier-' + c);
      cadre.disabled = true;
      cadre.classList.add(c === bon ? 'cadre--bon' : (c === cote ? 'cadre--faux' : 'cadre--autre'));
      cadre.querySelector('.cadre__badge').textContent = c === bon ? '✓' : (c === cote ? '✗' : '');
      cadre.querySelector('.cadre__date').classList.remove('invisible');
    });
    $('premier-aide').classList.add('invisible');
    const v = $('premier-verdict');
    v.textContent = juste ? '✓ Bonne réponse !' : '✗ Raté !';
    v.className = 'verdict ' + (juste ? 'verdict--bon' : 'verdict--faux');
    frise(m);
    afficherEtat();
    $('premier-progression').textContent = 'Question ' + (partie.i + 1) + ' / ' + partie.paires.length;
    $('premier-barre').style.width = (100 * (partie.i + 1) / partie.paires.length) + '%';
    const suite = $('premier-suite');
    suite.textContent = partie.i + 1 < partie.paires.length ? 'Suivant →' : 'Voir le résultat';
    suite.classList.remove('invisible');
    suite.focus({ preventScroll: true });
    // Bonne réponse : on enchaîne seul (le bouton se remplit pendant l'attente) ; erreur : on lit la frise
    if (juste) {
      suite.style.setProperty('--delai', DELAI_AUTO + 'ms');
      void suite.offsetWidth;
      suite.classList.add('btn-auto');
      minuterie = setTimeout(suivant, DELAI_AUTO);
    }
  }

  function suivant() {
    if (!partie || !partie.repondu) return;
    arreterMinuterie();
    partie.i++;
    if (partie.i < partie.paires.length) manche();
    else terminer();
  }

  function terminer() {
    const total = partie.paires.length, tempsMs = Date.now() - partie.debut;
    const titre = 'Qui est venu en premier ? (' + NIVEAUX[reglages.niveau].titre + ')';
    if (window.HistProfils) HistProfils.enregistrerPartie({ mode: 'premier', titre, score: partie.score, total, tempsMs });
    const s = Math.round(tempsMs / 1000);
    $('premier-fin-score').textContent = partie.score + ' / ' + total;
    $('premier-fin-detail').textContent = NIVEAUX[reglages.niveau].titre + ' · ' + Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s';
    const r = partie.score / total;
    $('premier-fin-message').textContent = r === 1 ? 'Sans faute : un vrai historien !' : r >= .8 ? 'Excellent !'
      : r >= .6 ? 'Bien joué !' : r >= .4 ? 'Pas mal, encore un effort.' : 'L\'histoire n\'attend que vous : rejouez !';
    partie = null;
    Histehory.afficher('screen-premier-fin');
  }

  /* ---------- Branchements ---------- */
  function init() {
    $('premier-commencer').addEventListener('click', demarrer);
    $('premier-rejouer').addEventListener('click', demarrer);
    $('premier-reglages').addEventListener('click', ouvrir);
    $('premier-a').addEventListener('click', () => repondre('a'));
    $('premier-b').addEventListener('click', () => repondre('b'));
    $('premier-suite').addEventListener('click', suivant);
    $('premier-quitter').addEventListener('click', () => { partie = null; ouvrir(); });
    document.addEventListener('keydown', (e) => {
      if (!partie || document.body.dataset.ecran !== 'screen-premier-jeu') return;
      if (!partie.repondu && (e.key === 'ArrowLeft' || e.key === '1')) repondre('a');
      else if (!partie.repondu && (e.key === 'ArrowRight' || e.key === '2')) repondre('b');
      else if (partie.repondu && (e.key === 'Enter' || e.key === ' ') && e.target.id !== 'premier-suite') { e.preventDefault(); suivant(); }
    });
  }

  Histehory.registerMode({
    id: 'premier',
    icone: '🥇',
    titre: 'Qui est venu en premier ?',
    description: 'Deux personnages : lequel est né en premier, ou en dernier ?',
    ouvrir
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
