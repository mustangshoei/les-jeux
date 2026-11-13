/* ==========================================================================
   modes/date.js — « Trouver la date »

   Un événement tiré de js/donnees/dates.js : son thème (domaine), sa région, son intitulé et son résumé.
   Le joueur tape la date. Deux façons de jouer (choisies en préphase) :
     - « L'année » : l'année seule (champ + interrupteur « apr. / av. J.-C. ») ;
     - « La date exacte » : jour, mois (liste) et année quand l'événement est daté au jour près ;
       sinon, l'année seule (les champs jour et mois disparaissent pour cette question).
   Juste ou faux, sans points partiels : l'année exacte (et, en date exacte, le jour et le mois exacts).
   Exception : une date approximative (option A de dates.js, « vers… ») est jugée sur l'année seule, à
   MARGE près (10 % de son ancienneté, au moins 10 ans, arrondi à la dizaine) ; la consigne annonce la marge.

   Saisie : Entrée valide (ou va au premier champ encore vide) ; « - » tapé dans l'année passe en
   « av. J.-C. ». Bonne réponse : suite automatique après DELAI_AUTO (le bouton « Suivant » se remplit) ;
   erreur : on lit la correction (bonne date, écart, résumé), puis « Suivant » ou Entrée.

   Préphase : la façon de jouer, le nombre d'événements (1 à MAX : − / +, raccourcis, curseur) et trois
   filtres croisés et cumulables, avec le nombre d'événements sur chaque case (période = époque,
   difficulté, thématique = domaine), comme « Chronologie », chacun avec un interrupteur « Tout / Aucun » ;
   les périodes et les thématiques ont leur emoji (ICONES_EPOQUE, ICONES_DOMAINE). L'écran est une grille
   2 × 2 (façon | période, nombre | difficulté et thématique) dont les titres s'alignent ligne à ligne.
   S'il y a moins d'événements que demandé, la partie les prend tous. Les réglages sont mémorisés (clé histehory.date.reglages).

   Fin : anneau de réussite, score, temps, meilleure série ; les erreurs (les 3 dernières, les autres
   derrière « Voir les N autres ») ; « Revoir mes erreurs » relance une partie avec ces seuls événements.
   La partie s'enregistre avec HistProfils.enregistrerPartie (mode 'date' ; score = bonnes réponses).
   Données : HISTEHORY.DATES ; libellés : HISTEHORY.EPOQUES, DIFFICULTES, DOMAINES, REGIONS
   (js/donnees/personnes.js). Styles : css/date.css (filtres : css/style.css).
   ========================================================================== */
(function () {
  'use strict';

  const H = window.HISTEHORY || {};
  const DATES = H.DATES || [];

  const MAX = 50;                     // événements au plus par partie
  const RACCOURCIS = [5, 10, 20, 30, 50];
  const DELAI_AUTO = 1800;            // ms avant la question suivante après une bonne réponse
  const TOLERANCE = 0.1;              // date approximative : marge = 10 % de l'ancienneté…
  const TOLERANCE_MIN = 10;           // … au moins 10 ans
  const ANNEE_REF = 2000;             // ancienneté comptée depuis l'an 2000 (marge stable d'une année sur l'autre)
  const ERREURS_VUES = 3;             // erreurs montrées d'emblée à la fin
  const CLE = 'histehory.date.reglages';
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const JOURS_MAX = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const FACONS = [
    { id: 'annee', icone: '📅', titre: 'L\'année', aide: 'L\'année seule' },
    { id: 'exacte', icone: '🗓️', titre: 'La date exacte', aide: 'Jour, mois et année' }
  ];

  /* ---------- Les trois filtres de la préphase (mêmes que « Chronologie ») ---------- */
  const epoqueDe = (an) => (an < 476 ? 'antiquite' : an < 1453 ? 'moyen-age' : an < 1789 ? 'moderne' : 'contemporaine');
  const AIDE_EPOQUE = { antiquite: 'avant 476', 'moyen-age': '476 – 1452', moderne: '1453 – 1788', contemporaine: 'depuis 1789' };
  const ICONES_EPOQUE = { antiquite: '🏛️', 'moyen-age': '🏰', moderne: '⛵', contemporaine: '🏭' };
  // Un petit emoji par thématique (clés de HISTEHORY.DOMAINES ; une clé sans emoji s'affiche sans)
  const ICONES_DOMAINE = {
    politique: '👑', militaire: '⚔️', religion: '🕯️', philosophie: '💭', sciences: '🔬', medecine: '🩺',
    litterature: '📚', arts: '🎨', musique: '🎵', exploration: '🧭', economie: '💰', societe: '⚖️',
    sport: '🏅', cinema: '🎬'
  };
  // Thématiques rangées en lignes justifiées (chaque ligne occupe toute la largeur) : regroupées par sens, et
  // de longueurs voisines (les deux noms les plus longs ensemble, en dernier). Une clé absente va sur une dernière ligne.
  const LIGNES_DOMAINE = [
    ['politique', 'militaire', 'societe'],
    ['religion', 'philosophie', 'economie'],
    ['sciences', 'medecine', 'exploration'],
    ['arts', 'musique', 'sport'],
    ['litterature', 'cinema']
  ];
  // carte : grandes cases (icône, nom, aide) en grille, au lieu de petites cases en ligne ;
  // lignes : cases rangées en lignes justifiées (sinon : à la suite, avec retour à la ligne)
  const FILTRES = [
    { id: 'epoque', titre: 'Période', libelles: () => H.EPOQUES || {}, de: (e) => epoqueDe(e.annee), aide: AIDE_EPOQUE, icones: ICONES_EPOQUE, carte: true },
    { id: 'difficulte', titre: 'Difficulté', libelles: () => H.DIFFICULTES || { 1: 'Très facile', 2: 'Facile', 3: 'Moyen', 4: 'Difficile', 5: 'Extrême' }, de: (e) => String(e.difficulte), lignes: [['1', '2', '3', '4', '5']] },
    { id: 'domaine', titre: 'Thématique', libelles: () => H.DOMAINES || {}, de: (e) => e.domaine, icones: ICONES_DOMAINE, lignes: LIGNES_DOMAINE }
  ];

  const choisis = {};                 // id du filtre -> Set des valeurs cochées
  const puces = {};                   // id du filtre -> { valeur: { bouton, n } }
  const bascules = {};                // id du filtre -> interrupteur « Tout / Aucun »
  const reglages = { facon: 'annee', nombre: 10 };
  let partie = null;                  // { liste, facon, i, score, serie, meilleure, erreurs, debut, repondu, revision }
  let ere = 'apr';                    // ère de l'année saisie : 'apr' ou 'av'
  let minuterie = null;
  let aRevoir = [];                   // événements manqués de la dernière partie (« Revoir mes erreurs »)

  const $ = (id) => document.getElementById(id);
  const hasard = (n) => Math.floor(Math.random() * n);
  const nombre = (n) => n.toLocaleString('fr-FR');
  const pluriel = (n, mot) => nombre(n) + ' ' + mot + (n > 1 ? 's' : '');
  const borner = (n, min, max) => Math.min(max, Math.max(min, n));
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

  /* ---------- Dates : textes, marge, écarts ---------- */
  function anneeTexte(an) {
    const n = Math.abs(an);
    const s = n >= 10000 ? nombre(n) : String(n);
    return an < 0 ? s + ' av. J.-C.' : s;
  }
  const jourTexte = (j) => (j === 1 ? '1er' : String(j));
  function dateTexte(e) {
    if (e.approx) return 'vers ' + anneeTexte(e.annee);
    if (e.jour) return jourTexte(e.jour) + ' ' + MOIS[e.mois - 1] + ' ' + anneeTexte(e.annee);
    if (e.mois) return MOIS[e.mois - 1] + ' ' + anneeTexte(e.annee);
    return anneeTexte(e.annee);
  }
  const reponseTexte = (r) => (r.jour ? jourTexte(r.jour) + ' ' + MOIS[r.mois - 1] + ' ' : '') + anneeTexte(r.annee);

  // Années entre deux dates (pas d'année 0 : de 1 av. J.-C. à 1 apr. J.-C., il y a un an)
  const ecartAns = (a, b) => Math.abs(a - b) - ((a < 0) !== (b < 0) ? 1 : 0);
  // Marge acceptée sur une date approximative (0 pour une date sûre)
  const marge = (e) => (e.approx ? Math.max(TOLERANCE_MIN, Math.round(TOLERANCE * (ANNEE_REF - e.annee) / 10) * 10) : 0);
  // Demande-t-on le jour et le mois pour cet événement ?
  const auJour = (e, facon) => facon === 'exacte' && !!e.jour && !e.approx;

  /* ---------- Réglages mémorisés ---------- */
  function lireReglages() {
    try { const t = JSON.parse(localStorage.getItem(CLE) || 'null'); return t && typeof t === 'object' ? t : null; }
    catch (e) { return null; }
  }
  function sauverReglages() {
    const filtres = {};
    FILTRES.forEach((f) => { filtres[f.id] = Array.from(choisis[f.id]); });
    try { localStorage.setItem(CLE, JSON.stringify({ facon: reglages.facon, nombre: reglages.nombre, filtres })); } catch (e) { /* stockage bloqué */ }
  }

  /* ---------- Écran de préphase ---------- */
  const passe = (e, sauf) => FILTRES.every((f) => f.id === sauf || choisis[f.id].has(f.de(e)));
  const vivier = () => DATES.filter((e) => passe(e));

  function construirePreparation() {
    const lu = lireReglages() || {};
    if (FACONS.some((f) => f.id === lu.facon)) reglages.facon = lu.facon;
    if (Number.isFinite(lu.nombre)) reglages.nombre = borner(Math.round(lu.nombre), 1, MAX);
    FILTRES.forEach((f) => {
      const cles = Object.keys(f.libelles());
      const garde = lu.filtres && Array.isArray(lu.filtres[f.id]) ? lu.filtres[f.id].filter((v) => cles.includes(v)) : null;
      choisis[f.id] = new Set(garde || cles);
    });

    $('date-facons').replaceChildren(...FACONS.map((f) => {
      const b = el('button', 'choix');
      b.type = 'button';
      b.dataset.facon = f.id;
      b.append(el('span', 'choix__icone', f.icone), el('span', 'choix__titre', f.titre), el('span', 'choix__aide', f.aide));
      b.addEventListener('click', () => { reglages.facon = f.id; majPreparation(); });
      return b;
    }));

    $('date-raccourcis').replaceChildren(...RACCOURCIS.map((n) => {
      const b = el('button', '', String(n));
      b.type = 'button';
      b.dataset.nombre = n;
      b.addEventListener('click', () => fixerNombre(n));
      return b;
    }));

    // Chaque filtre dans sa case de la grille (index.html : date-filtre-<id>)
    FILTRES.forEach((f) => {
      const groupe = $('date-filtre-' + f.id);
      groupe.classList.add('chrono-groupe');
      const tete = el('div', 'chrono-groupe__tete');
      // « Tout ◯ Aucun » : les deux mots et, entre eux, un interrupteur (allumé quand tout est coché)
      const outils = el('span', 'chrono-groupe__outils date-bascule');
      const toutOuRien = (tout) => { choisis[f.id] = new Set(tout ? Object.keys(f.libelles()) : []); majPreparation(); };
      const bTout = el('button', 'btn-link', 'Tout');
      const bAucun = el('button', 'btn-link', 'Aucun');
      const bascule = el('button', 'date-bascule__interrupteur');
      [bTout, bAucun, bascule].forEach((b) => { b.type = 'button'; });
      bascule.setAttribute('role', 'switch');
      bascule.setAttribute('aria-label', f.titre + ' : tout cocher');
      bTout.addEventListener('click', () => toutOuRien(true));
      bAucun.addEventListener('click', () => toutOuRien(false));
      bascule.addEventListener('click', () => toutOuRien(bascule.dataset.etat !== 'tout'));
      bascules[f.id] = bascule;
      outils.append(bTout, bascule, bAucun);
      tete.append(el('h2', 'config__titre', f.titre), outils);
      const liste = el('div', f.carte ? 'date-cartes' : f.lignes ? 'chrono-puces date-lignes' : 'chrono-puces');
      puces[f.id] = {};
      Object.entries(f.libelles()).forEach(([valeur, libelle]) => {
        const b = el('button', f.carte ? 'puce puce--carte' : 'puce');
        b.type = 'button';
        const n = el('span', 'puce__n', '0');
        const icone = f.icones && f.icones[valeur];
        if (icone) b.append(el('span', 'puce__icone', icone));
        if (f.carte) {
          const texte = el('span', 'puce__texte');
          texte.append(el('span', 'puce__nom', libelle));
          if (f.aide && f.aide[valeur]) texte.append(el('span', 'puce__aide', f.aide[valeur]));
          b.append(texte);
        } else {
          b.append(el('span', 'puce__nom', libelle));
        }
        b.append(n);
        b.addEventListener('click', () => {
          const s = choisis[f.id];
          if (s.has(valeur)) s.delete(valeur); else s.add(valeur);
          majPreparation();
        });
        if (!f.lignes) liste.append(b);
        puces[f.id][valeur] = { bouton: b, n };
      });
      if (f.lignes) {
        const reste = new Set(Object.keys(puces[f.id]));
        const lignes = f.lignes.map((cles) => cles.filter((c) => reste.delete(c)));
        if (reste.size) lignes.push(Array.from(reste));
        lignes.filter((cles) => cles.length).forEach((cles) => {
          const ligne = el('div', 'date-ligne');
          cles.forEach((c) => ligne.append(puces[f.id][c].bouton));
          liste.append(ligne);
        });
      }
      groupe.replaceChildren(tete, liste);
    });

    // Nombre d'événements : − / +, champ (pris en compte en direct s'il est valable), curseur
    document.querySelectorAll('#screen-date-config .nombre__pas').forEach((b) => {
      b.addEventListener('click', () => fixerNombre(reglages.nombre + +b.dataset.pas));
    });
    const champ = $('date-nombre');
    champ.addEventListener('input', () => {
      const n = +champ.value;
      if (Number.isInteger(n) && n >= 1 && n <= MAX) { reglages.nombre = n; majPreparation(true); }
    });
    champ.addEventListener('change', () => fixerNombre(+champ.value || reglages.nombre));
    champ.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); fixerNombre(+champ.value || reglages.nombre); } });
    $('date-curseur').addEventListener('input', () => fixerNombre(+$('date-curseur').value));
  }

  function fixerNombre(n) {
    reglages.nombre = borner(Math.round(n) || 1, 1, MAX);
    majPreparation();
  }

  // garderChamp : ne pas réécrire le champ du nombre pendant qu'on y tape
  function majPreparation(garderChamp) {
    $('date-facons').querySelectorAll('.choix').forEach((b) => {
      const actif = b.dataset.facon === reglages.facon;
      b.classList.toggle('is-active', actif);
      b.setAttribute('aria-pressed', actif);
    });
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
      const coches = choisis[f.id].size;
      const etat = coches === 0 ? 'aucun' : coches === Object.keys(puces[f.id]).length ? 'tout' : 'partiel';
      bascules[f.id].dataset.etat = etat;
      bascules[f.id].setAttribute('aria-checked', etat === 'tout');
    });
    const n = reglages.nombre;
    if (!garderChamp) $('date-nombre').value = n;
    const curseur = $('date-curseur');
    curseur.value = n;
    curseur.style.setProperty('--rempli', ((n - 1) / (MAX - 1) * 100) + '%');
    $('date-unite').textContent = n > 1 ? 'événements' : 'événement';
    $('date-raccourcis').querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', +b.dataset.nombre === n));

    const v = vivier();
    let texte;
    if (v.length === 0) texte = 'Aucun événement ne correspond à ces choix.';
    else if (v.length < n) texte = 'Seulement ' + pluriel(v.length, 'événement') + ' pour ces choix : la partie les prendra tous.';
    else {
      const jour = reglages.facon === 'exacte' ? v.filter((e) => auJour(e, 'exacte')).length : 0;
      texte = pluriel(v.length, 'événement') + ' à tirer' + (reglages.facon === 'exacte' ? ', dont ' + nombre(jour) + ' datés au jour près.' : '.');
    }
    const etat = $('date-etat');
    etat.textContent = texte;
    etat.classList.toggle('chrono-etat--non', v.length === 0);
    $('date-commencer').disabled = v.length === 0;
    sauverReglages();
  }

  function ouvrir() {
    arreter();
    partie = null;
    if (!Object.keys(puces).length) construirePreparation();
    majPreparation();
    Histehory.afficher('screen-date-config');
  }

  /* ---------- Partie ---------- */
  function arreter() {
    clearTimeout(minuterie);
    minuterie = null;
    $('date-suite').classList.remove('btn-auto');
  }

  // liste : événements imposés (« Revoir mes erreurs ») ; sinon, tirage dans les filtres
  function demarrer(liste) {
    const source = Array.isArray(liste) ? liste : vivier();
    if (!source.length) return;
    const n = Array.isArray(liste) ? source.length : Math.min(reglages.nombre, source.length);
    partie = {
      liste: melanger(source.slice()).slice(0, n), facon: reglages.facon, i: 0, score: 0, serie: 0, meilleure: 0,
      erreurs: [], debut: Date.now(), repondu: false, revision: Array.isArray(liste)
    };
    Histehory.afficher('screen-date-jeu');
    question();
  }

  function choisirEre(valeur) {
    ere = valeur;
    document.querySelectorAll('#date-ere button').forEach((b) => {
      const actif = b.dataset.ere === ere;
      b.classList.toggle('is-active', actif);
      b.setAttribute('aria-pressed', actif);
    });
  }

  function question() {
    arreter();
    const e = partie.liste[partie.i], jour = auJour(e, partie.facon);
    partie.repondu = false;
    $('date-theme').textContent = (H.DOMAINES || {})[e.domaine] || e.domaine;
    $('date-region').textContent = (H.REGIONS || {})[e.region] || '';
    $('date-evenement').textContent = e.evenement;
    $('date-resume').textContent = e.resume;
    $('date-consigne').textContent = jour ? 'À quelle date ?' : 'En quelle année ?';
    const note = $('date-note');
    note.textContent = e.approx ? 'Date approximative : réponse acceptée à ' + marge(e) + ' ans près.'
      : partie.facon === 'exacte' && !jour ? 'On ne connaît que l\'année de cet événement.' : '';
    note.classList.toggle('invisible', !note.textContent);

    $('date-champ-jour').classList.toggle('hidden', !jour);
    $('date-champ-mois').classList.toggle('hidden', !jour);
    $('date-jour').value = '';
    $('date-mois').value = '';
    $('date-annee').value = '';
    choisirEre('apr');
    document.querySelectorAll('#screen-date-jeu .date-champ').forEach((c) => c.classList.remove('is-bon', 'is-faux'));
    document.querySelectorAll('#screen-date-jeu .date-champs input, #screen-date-jeu .date-champs select, #date-ere button').forEach((x) => { x.disabled = false; });
    $('screen-date-jeu').classList.remove('is-bon', 'is-faux');

    $('date-correction').classList.add('invisible');
    $('date-verdict').textContent = '';
    $('date-verdict').className = 'verdict';
    $('date-valider').classList.remove('hidden');
    $('date-suite').classList.add('hidden');
    // Aide à la première question seulement (sa place reste réservée : rien ne bouge ensuite)
    const aide = $('date-aide');
    const clavier = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
    aide.textContent = clavier ? 'Entrée pour valider · tapez « - » devant l\'année pour « av. J.-C. »'
      : 'Touchez « av. J.-C. » pour une date avant notre ère.';
    aide.classList.toggle('invisible', partie.i > 0);

    $('date-progression').textContent = 'Question ' + (partie.i + 1) + ' / ' + partie.liste.length;
    $('date-barre').style.width = (100 * partie.i / partie.liste.length) + '%';
    majScore();
    $(jour ? 'date-jour' : 'date-annee').focus({ preventScroll: true });
  }

  function majScore() {
    $('date-score').textContent = pluriel(partie.score, 'point');
    const serie = $('date-serie');
    serie.textContent = partie.serie >= 2 ? '🔥 ' + partie.serie + ' d\'affilée' : '';
    serie.classList.toggle('hidden', partie.serie < 2);
  }

  /* Lit la réponse. Champ vide ou invalide : { champ, message } (Entrée mène alors au premier champ à remplir) */
  function lireReponse(jour) {
    const r = {};
    if (jour) {
      const j = $('date-jour').value.trim(), m = $('date-mois').value;
      if (!j) return { champ: 'date-jour', message: 'Il manque le jour.' };
      if (!m) return { champ: 'date-mois', message: 'Il manque le mois.' };
      r.jour = +j;
      r.mois = +m;
    }
    const a = $('date-annee').value.replace(/\s/g, '');
    if (!a) return { champ: 'date-annee', message: 'Il manque l\'année.' };
    const an = parseInt(a, 10);
    if (an === 0) return { champ: 'date-annee', message: 'Il n\'y a pas d\'année 0 : l\'an 1 av. J.-C. est suivi de l\'an 1.' };
    if (jour && (!Number.isInteger(r.jour) || r.jour < 1 || r.jour > JOURS_MAX[r.mois - 1])) {
      return { champ: 'date-jour', message: 'Ce jour n\'existe pas : ' + MOIS[r.mois - 1] + ' compte au plus ' + JOURS_MAX[r.mois - 1] + ' jours.' };
    }
    r.annee = ere === 'av' ? -an : an;
    return r;
  }

  function corriger(e, r, jour) {
    const ec = ecartAns(e.annee, r.annee), m = marge(e);
    const anneeOk = e.approx ? ec <= m : ec === 0;
    const moisOk = jour && r.mois === e.mois, jourOk = jour && moisOk && r.jour === e.jour;
    const juste = anneeOk && (!jour || jourOk);
    const votre = 'Votre réponse : ' + reponseTexte(r);
    let texte;
    if (juste) {
      texte = e.approx && ec > 0 ? votre + ', à ' + pluriel(ec, 'an') + ' près : accepté pour une date approximative.'
        : jour ? 'Au jour près !' : 'L\'année exacte !';
    } else if (!anneeOk) {
      texte = votre + ' : ' + pluriel(ec, 'an') + (r.annee < e.annee ? ' trop tôt' : ' trop tard') +
        (e.approx ? ' (il fallait être à ' + m + ' ans près).' : '.');
    } else {
      // La bonne année, mais pas le bon jour : l'écart en jours (dans une même année bissextile, peu importe laquelle)
      const vrai = Date.UTC(2000, e.mois - 1, e.jour), dit = Date.UTC(2000, r.mois - 1, r.jour);
      const dj = Math.round(Math.abs(vrai - dit) / 864e5);
      texte = votre + ' : la bonne année, mais ' + pluriel(dj, 'jour') + (dit < vrai ? ' trop tôt.' : ' trop tard.');
    }
    return { juste, anneeOk, moisOk, jourOk, texte };
  }

  function valider() {
    if (!partie || partie.repondu) return;
    const e = partie.liste[partie.i], jour = auJour(e, partie.facon);
    const r = lireReponse(jour);
    const aide = $('date-aide');
    if (r.champ) {
      aide.textContent = r.message;
      aide.classList.remove('invisible');
      $(r.champ).focus({ preventScroll: true });
      return;
    }
    aide.classList.add('invisible');
    partie.repondu = true;
    const c = corriger(e, r, jour);
    if (c.juste) {
      partie.score++;
      partie.serie++;
      partie.meilleure = Math.max(partie.meilleure, partie.serie);
    } else {
      partie.serie = 0;
      partie.erreurs.push({ e, reponse: reponseTexte(r) });
    }

    // Champs figés, chacun marqué juste ou faux
    document.querySelectorAll('#screen-date-jeu .date-champs input, #screen-date-jeu .date-champs select, #date-ere button').forEach((x) => { x.disabled = true; });
    const marquer = (id, ok) => $(id).classList.add(ok ? 'is-bon' : 'is-faux');
    marquer('date-champ-annee', c.anneeOk);
    if (jour) { marquer('date-champ-mois', c.moisOk); marquer('date-champ-jour', c.jourOk); }

    const v = $('date-verdict');
    v.textContent = c.juste ? '✓ Bonne réponse' : '✗ Raté';
    v.className = 'verdict ' + (c.juste ? 'verdict--bon' : 'verdict--faux');
    $('date-solution').textContent = dateTexte(e);
    $('date-ecart').textContent = c.texte;
    $('date-correction').classList.remove('invisible');
    $('date-barre').style.width = (100 * (partie.i + 1) / partie.liste.length) + '%';
    majScore();

    $('date-valider').classList.add('hidden');
    const suite = $('date-suite');
    suite.textContent = partie.i + 1 < partie.liste.length ? 'Suivant →' : 'Voir le résultat';
    suite.classList.remove('hidden');
    suite.focus({ preventScroll: true });
    // Bonne réponse : on enchaîne seul (le bouton se remplit pendant l'attente) ; erreur : on lit la correction
    if (c.juste) {
      suite.style.setProperty('--delai', DELAI_AUTO + 'ms');
      void suite.offsetWidth;
      suite.classList.add('btn-auto');
      minuterie = setTimeout(suivant, DELAI_AUTO);
    }
  }

  function suivant() {
    if (!partie || !partie.repondu) return;
    arreter();
    partie.i++;
    if (partie.i < partie.liste.length) question();
    else terminer();
  }

  /* ---------- Fin ---------- */
  function terminer() {
    const p = partie, total = p.liste.length, tempsMs = Date.now() - p.debut;
    const facon = p.facon === 'exacte' ? 'date exacte' : 'année';
    const titre = 'Trouver la date (' + facon + ', ' + pluriel(total, 'question') + (p.revision ? ', révision' : '') + ')';
    if (window.HistProfils) HistProfils.enregistrerPartie({ mode: 'date', titre, score: p.score, total, tempsMs });

    const r = p.score / total, pc = Math.round(100 * r);
    $('date-fin-anneau').style.setProperty('--p', pc);
    $('date-fin-pourcent').textContent = pc + ' %';
    $('date-fin-score').textContent = p.score + ' / ' + total;
    $('date-fin-message').textContent = r === 1 ? 'Sans faute : un vrai calendrier vivant !' : r >= .8 ? 'Excellent !'
      : r >= .6 ? 'Bien joué !' : r >= .4 ? 'Pas mal, encore un effort.' : 'Les dates, ça se travaille : rejouez !';
    const s = Math.round(tempsMs / 1000);
    $('date-fin-detail').textContent = (p.facon === 'exacte' ? 'Date exacte' : 'Année') + ' · ' +
      Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s' +
      (p.meilleure >= 2 ? ' · meilleure série : ' + p.meilleure : '');

    // Les erreurs, de la plus récente à la plus ancienne : les ERREURS_VUES premières, les autres derrière un bouton
    const erreurs = p.erreurs.slice().reverse();
    $('date-fin-erreurs').classList.toggle('hidden', !erreurs.length);
    $('date-fin-erreurs-titre').textContent = erreurs.length > 1 ? 'Vos ' + erreurs.length + ' erreurs' : 'Votre erreur';
    $('date-fin-liste').replaceChildren(...erreurs.map((x, k) => {
      const li = el('li', 'erreur' + (k >= ERREURS_VUES ? ' hidden' : ''));
      li.append(el('span', 'erreur__titre', x.e.evenement),
        el('span', 'erreur__dates', dateTexte(x.e) + ' · vous : ' + x.reponse));
      return li;
    }));
    const plus = $('date-fin-plus');
    const reste = erreurs.length - ERREURS_VUES;
    plus.textContent = reste > 1 ? 'Voir les ' + reste + ' autres' : 'Voir l\'autre erreur';
    plus.classList.toggle('hidden', erreurs.length <= ERREURS_VUES);
    aRevoir = p.erreurs.map((x) => x.e);
    $('date-revoir').classList.toggle('hidden', !aRevoir.length);

    partie = null;
    Histehory.afficher('screen-date-fin');
  }

  /* ---------- Branchements ---------- */
  function init() {
    $('date-commencer').addEventListener('click', () => demarrer());
    $('date-rejouer').addEventListener('click', () => demarrer());
    $('date-revoir').addEventListener('click', () => demarrer(aRevoir));
    $('date-reglages').addEventListener('click', ouvrir);
    $('date-quitter').addEventListener('click', ouvrir);
    $('date-valider').addEventListener('click', valider);
    $('date-suite').addEventListener('click', suivant);
    $('date-fin-plus').addEventListener('click', () => {
      $('date-fin-liste').querySelectorAll('.erreur.hidden').forEach((li) => li.classList.remove('hidden'));
      $('date-fin-plus').classList.add('hidden');
    });

    document.querySelectorAll('#date-ere button').forEach((b) => {
      b.addEventListener('click', () => { choisirEre(b.dataset.ere); $('date-annee').focus({ preventScroll: true }); });
    });
    // L'année : des chiffres seulement ; un « - » fait passer en « av. J.-C. »
    const annee = $('date-annee');
    annee.addEventListener('input', () => {
      if (annee.value.includes('-')) choisirEre('av');
      const propre = annee.value.replace(/\D/g, '').slice(0, 5);
      if (propre !== annee.value) annee.value = propre;
    });
    const jour = $('date-jour');
    jour.addEventListener('input', () => {
      const propre = jour.value.replace(/\D/g, '').slice(0, 2);
      if (propre !== jour.value) jour.value = propre;
    });

    document.addEventListener('keydown', (e) => {
      if (!partie || document.body.dataset.ecran !== 'screen-date-jeu') return;
      if (e.key !== 'Enter') return;
      const surBouton = e.target.closest && e.target.closest('button');
      if (!partie.repondu) {
        if (!surBouton) { e.preventDefault(); valider(); }
      } else if (!surBouton) { e.preventDefault(); suivant(); }
    });
  }

  Histehory.registerMode({
    id: 'date',
    icone: '📅',
    titre: 'Trouver la date',
    description: 'Un événement, son thème et son résumé : retrouvez son année, ou sa date exacte.',
    ouvrir
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
