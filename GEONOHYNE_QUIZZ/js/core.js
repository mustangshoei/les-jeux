/* ==========================================================================
   core.js — Noyau de GéoNohyne Quizz

   Ne contient rien de spécifique à une catégorie ni à un pays. Gère :
     - l'enregistrement des modules (quiz, jeux à part, modules « Apprendre »)
     - le choix de la partie, le déroulement du quiz, le score, le chrono
     - le mode « Apprendre » : carte cliquable, fiche de la zone, recherche
     - la carte SVG interactive (zoom, déplacement, clic)

   MENU : décrit et affiché par js/menu.js (chapitres, c'est-à-dire grandes catégories, et
   leurs cartes). Le menu interroge le noyau avec GeoNohyne.trouver(type, id) et ouvre un
   module avec GeoNohyne.ouvrir(type, id) ; type = 'quiz', 'jeu' ou 'apprendre'.
   RÈGLE : tout ce qui n'est pas encore fonctionnel apparaît GRISÉ (« Bientôt disponible »).

   FAÇONS DE JOUER (toutes les catégories de quiz) : CIBLAGE (le nom s'affiche, on clique sur la zone)
   ou NOMMAGE (une zone s'allume, on tape son nom ; majuscules, accents, espaces, tirets et apostrophes
   ignorés). Chacune en mode OCCASIONNEL (par défaut : nombre de questions, groupes, options) ou en
   mode RECORD (périmètre fixe : toutes les zones, ou celles d'un seul groupe ; sans indice ni
   rattrapage ; suggestions de noms seulement en occasionnel). Chaque partie est enregistrée pour le
   profil actif (js/profils.js) : historique, zones ratées, totaux, et records.

   POUR AJOUTER UNE CATÉGORIE DE QUIZ (voir README.md)
     1. Copier js/france/quiz-departements.js en js/<france|monde>/quiz-xxx.js et l'adapter
     2. Ajouter dans index.html :  <script src="js/<france|monde>/quiz-xxx.js"></script>
     3. Placer la carte { quiz: 'xxx' } dans js/menu.js (si elle y est déjà, grisée, elle s'active)

   CONTRAT D'UNE CATÉGORIE (GeoNohyne.registerCategory)
     id, titre       obligatoires
     carte           obligatoire : identifiant d'une carte de data/ (voir carte.js)
     icone, description   textes de la carte du menu
     consigne        phrase d'explication de la catégorie (l'écran de choix décrit lui-même ciblage et nommage)
     nomColonne      titre de sa colonne sur l'écran de choix (défaut : « Votre partie »)
     colonneDroite   id d'une seconde colonne de l'écran de choix (index.html), affichée à droite (ex.
                     'setup-prefectures') ; sans elle, une seule colonne, centrée
     question        texte au-dessus du nom à trouver (défaut : « Où se trouve… »)
     unite           nom des zones, au pluriel (« départements »), pour le sélecteur de nombre
     libelleOrdre    texte de la case « ordre des codes » (la case n'apparaît que s'il est défini)
     indice(zone)    renvoie le code à afficher à côté du nom : « Nom (code) » (active la case à cocher)
     libelleIndice   texte de cette case à cocher
     libelleOrdreCourt, libelleIndiceCourt   (facultatifs) versions courtes, affichées sur l'écran de choix
                     (la version complète reste en info-bulle)
     zonesOptionnelles  { codes: [...], libelle, libelleCourt } : zones écartées du tirage « par nombre » sauf
                     si la case (libellée libelle, ou libelleCourt sur l'écran de choix) est cochée ; elles
                     restent accessibles via un groupe (ex. Outre-Mer)
     groupes         { 'Nom du groupe': [codes des zones] } : active le mode « par groupes » (régions…) ;
                     en jouant par groupes, la carte se cadre sur les groupes choisis. L'écran de choix
                     montre alors une mini-carte cliquable des groupes (cocher, ou choisir le périmètre)
     nomGroupes      nom des groupes, au pluriel (« régions »)
     modeInitial     'groupes' : l'écran de choix s'ouvre sur le mode « par groupes », tous cochés
     groupesInitiaux [noms] : avec modeInitial 'groupes', seuls ces groupes sont cochés au départ
     nomTout         nom du périmètre complet en mode record (« France entière », « Monde complet »…) ;
                     les autres périmètres de record sont les groupes, un par un
     fond            { carte, exclure } : carte de décor non cliquable (voir le contrat « Apprendre »)

   CONTRAT D'UN MODULE « APPRENDRE » (GeoNohyne.registerApprentissage) — voir js/apprendre/departements.js
     id, titre, carte    obligatoires (carte du menu : { apprendre: 'id' } dans js/menu.js)
     icone, description  textes de la carte du menu
     unite           nom des zones, au pluriel (message d'accueil de la fiche)
     recherche       texte d'aide de la barre de recherche
     credit          source des informations (affichée sous la fiche)
     groupes         { 'Nom du groupe': [codes] } : limites tracées sur la carte (régions…)
     fiche(zone)     renvoie { badge, sousTitre, lignes: [{ libelle, valeur, detail } | { libelle, liens: [codes], vide, detail }] }
                     (badge : texte de la pastille à côté du nom, par défaut le code de la zone)
     fond            { carte, exclure: [codes] } : carte affichée en décor, non cliquable, sous les zones
                     (ex. départements sous les cours d'eau). Les éléments de la carte principale peuvent alors
                     avoir : type, ligne (tracé linéaire), dessous (sous le fond), etiquette (texte sur la carte)
     types           { valeur: 'Libellé' } : une case à cocher par valeur pour choisir ce qui est affiché
     champFiltre     propriété des zones lue par ces cases (défaut : 'type' ; ex. 'niveau' de difficulté)
     filtresEstompes true : les zones décochées sont estompées et non cliquables, au lieu d'être masquées
     nomsTypes       { type: 'Nom au singulier' } : affiché à droite des résultats de recherche
     etiquette(zone) (facultatif) texte affiché à droite des résultats de recherche (remplace nomsTypes / code)
     alias           { code: ['autre nom', …] } : autres noms acceptés par la recherche (« Myanmar »…)
     libelleLiens    légende des zones liées surlignées (défaut : « frontalier »)

   FORMAT D'UNE CARTE (data/, voir carte.js) : en plus de { code, nom, d, cx, cy }, un élément peut avoir
     point: true     petite zone (micro-État, détroit…) signalée par un point facile à cliquer, posé en (cx, cy) ;
                     d peut alors être vide
     cadre           [x0, y0, x1, y1] : zone sur laquelle se cadrer (ex. un pays sans ses territoires lointains)
   et la carte : vue {x, y, w, h} (cadrage initial), zoomMax (défaut 14),
     decor [{ d, classe, nom, fond, dessus }] : tracés non cliquables (classe CSS « decor-<classe> », nom affiché
     au survol en mode Apprendre ; fond : sous tout le reste ; dessus : au-dessus des zones)

   CONTRAT D'UN JEU À PART (GeoNohyne.registerJeu) — voir js/france/grand-chemin.js
     id, titre       obligatoires (carte du menu : { jeu: 'id' } dans js/menu.js)
     icone, description   textes de la carte du menu
     ecran           id de la <section> du jeu dans index.html (la carte #map-wrap y est déplacée)
     ouvrir(api)     appelé à chaque ouverture ; api = { carte, zones, etat, reinitialiserVue, cadrer, cadrerSur, esc,
                     normaliser, suggestions } ; suggestions(texte, [{ code, nom }]) : les mêmes règles que le
                     nommage (3 caractères au moins, début du nom), ou null si le texte est trop court
     clic(code)      (facultatif) appelé à chaque clic sur une zone de la carte ; absent = carte non cliquable
     sansCarte       true : le jeu n'utilise pas la carte (ex. Morpion des Départements)
   Pas de mode record ni de statistiques pour les jeux à part.

   CONTRAT D'UNE PAGE (GeoNohyne.registerPage) — aucune pour l'instant (les statistiques s'ouvrent depuis
   le menu du compte, js/compte.js)
     id, titre, ouvrir()   obligatoires (carte du menu : { page: 'id' } dans js/menu.js)
     icone, description    textes de la carte du menu
   ========================================================================== */
(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ZOOM_MAX = 14;                // zoom maximal par défaut (une carte peut fixer le sien : zoomMax)
  const RAYON_POINT = 4.5;            // rayon à l'écran (px) du point d'une petite zone…
  const RAYON_POINT_CLIC = 11;        // … et de la surface cliquable autour de lui

  /* Pauses avant la question suivante (en millisecondes) */
  const DELAI_BONNE = 500;
  const DELAI_FAUSSE = 1500;

  /* Nommage : nombre de caractères à taper avant que des suggestions s'affichent */
  const MIN_SUGGESTION = 3;

  /* Nombre minimal de questions du sélecteur (le maximum = nombre de zones de la carte) */
  const DEJA_JOUE = new Set(['ok', 'ko']);   // états des zones déjà apparues (trouvée / ratée)
  const MIN_QUESTIONS = 10;

  /* Parcours de la partie : une étape par question jusqu'à ce nombre, une barre au-delà */
  const MAX_ETAPES = 30;

  const $ = (sel) => document.querySelector(sel);

  const categories = [];          // catégories de quiz enregistrées, dans l'ordre
  const apprentissages = [];      // modules « Apprendre » enregistrés, dans l'ordre
  const jeux = [];                // jeux à part (ex. Le Grand Chemin), enregistrés par GeoNohyne.registerJeu
  const pages = [];               // pages du menu, enregistrées par GeoNohyne.registerPage
  const zones = new Map();        // code -> { nom, el, cx, cy, brut }

  let svg = null;
  let categorie = null;           // catégorie ouverte
  let carte = null;               // carte de cette catégorie
  let base = { x: 0, y: 0, w: 100, h: 100 };
  let vue = { ...base };
  let vueDepart = null;           // vue de départ de la partie (cadrée sur les groupes choisis) ; null = toute la carte
  let zoomMax = ZOOM_MAX;         // zoom maximal de la carte affichée
  let cerclesPoints = [];         // points des petites zones : leur taille à l'écran ne dépend pas du zoom
  let jeu = null;                 // état de la partie en cours
  let derniereTaille = 20;        // dernier nombre de questions choisi
  let miniCarte = null;           // écran de choix : mini-carte des groupes de la catégorie ouverte (<svg>)
  const CLE_RECORD = 'geonohyne.setup.record';   // dernier état de l'interrupteur « Mode record »
  let derniereConfig = null;      // réglages de la dernière partie (bouton « Rejouer »)
  let mode = 'nombre';            // mode de sélection (occasionnel) : 'nombre' ou 'groupes'
  let jeuType = 'ciblage';        // façon de jouer : 'ciblage' ou 'nommage' (gardée d'une catégorie à l'autre)
  let partieType = 'occasionnel'; // 'occasionnel' (par défaut) ou 'record'
  let perimetre = 'tout';         // périmètre du record : 'tout' ou le nom d'un groupe
  let apprendre = null;           // module « Apprendre » ouvert (null : la carte sert au quiz)
  let selection = null;           // code de la zone affichée dans la fiche
  let activite = null;            // jeu à part en cours (reçoit les clics sur la carte)

  /* ------------------------------------------------------------------ */
  /* Enregistrement des catégories                                       */
  /* ------------------------------------------------------------------ */
  function registerCategory(def) {
    if (!def || !def.id || !def.titre || !def.carte) {
      throw new Error('GeoNohyne.registerCategory : id, titre et carte sont obligatoires');
    }
    if (categories.some((c) => c.id === def.id)) {
      throw new Error('GeoNohyne.registerCategory : catégorie déjà enregistrée (' + def.id + ')');
    }
    categories.push(def);
  }

  function registerApprentissage(def) {
    if (!def || !def.id || !def.titre || !def.carte) {
      throw new Error('GeoNohyne.registerApprentissage : id, titre et carte sont obligatoires');
    }
    if (apprentissages.some((a) => a.id === def.id)) {
      throw new Error('GeoNohyne.registerApprentissage : module déjà enregistré (' + def.id + ')');
    }
    apprentissages.push(def);
  }

  function registerJeu(def) {
    if (!def || !def.id || !def.titre || !def.ecran || typeof def.ouvrir !== 'function') {
      throw new Error('GeoNohyne.registerJeu : id, titre, ecran et ouvrir sont obligatoires');
    }
    if (jeux.some((j) => j.id === def.id)) {
      throw new Error('GeoNohyne.registerJeu : jeu déjà enregistré (' + def.id + ')');
    }
    jeux.push(def);
  }

  function registerPage(def) {
    if (!def || !def.id || !def.titre || typeof def.ouvrir !== 'function') {
      throw new Error('GeoNohyne.registerPage : id, titre et ouvrir sont obligatoires');
    }
    if (pages.some((p) => p.id === def.id)) throw new Error('GeoNohyne.registerPage : page déjà enregistrée (' + def.id + ')');
    pages.push(def);
  }

  // Pour le menu (js/menu.js) : module enregistré d'un type donné, ou null s'il n'est pas chargé
  function trouver(type, id) {
    const liste = { quiz: categories, jeu: jeux, apprendre: apprentissages, page: pages }[type] || [];
    return liste.find((d) => d.id === id) || null;
  }

  // Ouvre un module depuis le menu
  function ouvrir(type, id) {
    if (type === 'quiz') ouvrirCategorie(id);
    else if (type === 'jeu') ouvrirJeu(id);
    else if (type === 'apprendre') ouvrirApprentissage(id);
    else if (type === 'page') { const p = trouver('page', id); if (p) { arreterPartie(); p.ouvrir(); } }
  }

  // Pour les statistiques (js/compte.js) : chaque catégorie de quiz et ses périmètres de record
  function listeRecords() {
    return categories.map((cat) => {
      const c = GeoCarte.obtenir(cat.carte);
      const perimetres = [{ id: 'tout', nom: cat.nomTout || 'Tout', n: c ? c.elements.length : 0 }];
      Object.keys(cat.groupes || {}).forEach((g) => perimetres.push({ id: g, nom: g, n: cat.groupes[g].length }));
      return { id: cat.id, titre: cat.titre, icone: cat.icone || '🧭', carte: cat.carte, perimetres };
    });
  }

  window.GeoNohyne = {
    registerCategory, registerApprentissage, registerJeu, registerPage, trouver, ouvrir,
    afficher: (id) => afficher(id), listeRecords, reviser: (id, codes, type) => reviser(id, codes, type)
  };

  /* ------------------------------------------------------------------ */
  /* Utilitaires                                                         */
  /* ------------------------------------------------------------------ */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function formaterTemps(ms) {
    const s = Math.floor(ms / 1000);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function melanger(tab) {
    const a = tab.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function afficher(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('hidden', s.id !== id));
    document.body.dataset.ecran = id;            // ex. le bouton de compte est caché pendant les parties (css)
    window.scrollTo(0, 0);
  }

  // Arrête la partie en cours sans l'enregistrer (ouverture d'un autre module)
  function arreterPartie() {
    if (jeu) { jeu.actif = false; clearInterval(jeu.chrono); clearTimeout(jeu.minuteur); }
  }

  /* ------------------------------------------------------------------ */
  /* Ouverture d'une catégorie                                           */
  /* ------------------------------------------------------------------ */
  // Active ou désactive tous les réglages de l'écran de choix de la partie
  function activerChoix(actif) {
    ['#count-range', '#count-input', '#opt-ordre', '#opt-indice', '#opt-rattrapage', '#opt-extras', '#opt-record', '#btn-start']
      .forEach((s) => { $(s).disabled = !actif; });
  }

  /* ---------- Sélection par groupes (régions…) ---------- */

  // Codes des zones des groupes cochés (les codes absents de la carte sont ignorés)
  function codesChoisis() {
    const codes = [];
    document.querySelectorAll('#groupes-liste input:checked').forEach((i) => {
      categorie.groupes[i.value].forEach((c) => { if (zones.has(c)) codes.push(c); });
    });
    return codes;
  }

  // Texte et état du bouton « Lancer » selon le mode
  function majBoutonLancer() {
    const b = $('#btn-start');
    if (!carte) return;
    if (partieType === 'record') {
      b.textContent = 'Lancer le record (' + codesPerimetre().length + ' ' + (categorie.unite || 'zones') + ')';
      b.disabled = false;
      return;
    }
    if (mode !== 'groupes') { b.textContent = 'Lancer la partie'; b.disabled = false; return; }
    const n = codesChoisis().length;
    b.textContent = n ? 'Lancer la partie (' + n + ' ' + (categorie.unite || 'zones') + ')'
                      : 'Cochez au moins un groupe';
    b.disabled = n === 0;
  }

  // Boutons d'un sélecteur (attribut data-<nom>) : celui de la valeur choisie est enfoncé
  function enfoncer(attribut, valeur) {
    document.querySelectorAll('.mode-btn[data-' + attribut + ']').forEach((b) => {
      const actif = b.getAttribute('data-' + attribut) === valeur;
      b.classList.toggle('is-active', actif);
      b.setAttribute('aria-pressed', String(actif));
    });
  }

  function definirMode(m) {
    mode = m;
    enfoncer('mode', m);
    $('#mode-nombre').classList.toggle('hidden', m !== 'nombre');
    $('#mode-groupes').classList.toggle('hidden', m !== 'groupes');
    majBoutonLancer();
    majMiniCarte();
  }

  /* ---------- Façon de jouer (ciblage / nommage) et mode (occasionnel / record) ---------- */

  const AIDE_RECORD = 'Mode record : toutes les zones du périmètre, une fois chacune, sans indice ni rattrapage. ' +
                      'Le meilleur score l\'emporte, puis le meilleur temps.';

  // Sous les deux cartes (qui décrivent déjà ciblage et nommage) : seulement les règles du mode record
  function majAide() {
    const record = partieType === 'record';
    $('#setup-aide').textContent = record ? AIDE_RECORD : '';
    $('#setup-aide').classList.toggle('hidden', !record);
  }

  function definirJeuType(t) {
    jeuType = t;
    enfoncer('jeu-type', t);
    majAide();
    majRecords();
  }

  function definirPartieType(t) {
    partieType = t;
    $('#opt-record').checked = t === 'record';
    $('#partie-occasionnelle').classList.toggle('hidden', t !== 'occasionnel');
    $('#partie-record').classList.toggle('hidden', t !== 'record');
    majAide();
    majRecords();
    majBoutonLancer();
    majMiniCarte();
  }

  function lireRecord() {
    try { return localStorage.getItem(CLE_RECORD) === '1'; } catch (e) { return false; }
  }

  /* ---------- Mini-carte des groupes : une région cliquée est cochée (ou devient le périmètre du record) ---------- */

  // Construite à l'ouverture de la catégorie, à partir de sa carte : chaque zone porte son groupe (data-groupe)
  function preparerMiniCarte(cat) {
    miniCarte = null;
    document.querySelectorAll('[data-mini-carte]').forEach((p) => { p.innerHTML = ''; });
    if (!cat.groupes || !carte) return;
    const groupeDe = {};
    Object.keys(cat.groupes).forEach((g) => cat.groupes[g].forEach((c) => { groupeDe[c] = g; }));
    const v = carte.vue || { x: 0, y: 0, w: carte.largeur, h: carte.hauteur };
    const svg = creerSVG('svg', 'mini-carte', { viewBox: [v.x, v.y, v.w, v.h].join(' '), 'aria-hidden': 'true' });
    // Carte en longueur (le monde) : au-dessus de la liste, sur toute la largeur ; sinon, à côté
    document.querySelectorAll('.groupes-choix').forEach((b) => b.classList.toggle('groupes-choix--large', v.w / v.h > 1.3));
    carte.elements.forEach((e) => {
      if (!e.d && !e.point) return;
      const forme = e.d
        ? creerSVG('path', 'mini-zone' + (e.ligne ? ' mini-zone--ligne' : ''), { d: e.d })
        : creerSVG('circle', 'mini-zone mini-zone--point', { cx: e.cx, cy: e.cy, r: v.w * 0.006 });
      const g = groupeDe[e.code];
      if (g) {
        forme.dataset.groupe = g;
        const titre = creerSVG('title');
        titre.textContent = g;
        forme.appendChild(titre);
      } else {
        forme.classList.add('mini-zone--hors');
      }
      svg.appendChild(forme);
    });
    miniCarte = svg;
  }

  // Place la mini-carte dans le panneau affiché (occasionnel par groupes, ou record) et colore les groupes choisis
  function majMiniCarte() {
    if (!miniCarte) return;
    const place = document.querySelector('[data-mini-carte="' + (partieType === 'record' ? 'record' : 'groupes') + '"]');
    if (place && miniCarte.parentNode !== place) place.appendChild(miniCarte);
    const choisis = partieType === 'record'
      ? (perimetre === 'tout' ? null : new Set([perimetre]))
      : new Set([...document.querySelectorAll('#groupes-liste input:checked')].map((i) => i.value));
    miniCarte.querySelectorAll('[data-groupe]').forEach((z) => {
      z.classList.toggle('is-choisi', !choisis || choisis.has(z.dataset.groupe));
    });
  }

  // Survol : toute la région s'éclaire, sur la carte et dans la liste
  function survolerGroupe(g) {
    if (!miniCarte) return;
    miniCarte.querySelectorAll('[data-groupe]').forEach((z) => z.classList.toggle('is-survol', z.dataset.groupe === g));
    document.querySelectorAll('#groupes-liste input, #record-perimetres input').forEach((i) => {
      i.parentNode.classList.toggle('is-survol', i.value === g);
    });
  }

  /* ---------- Périmètres du record : toutes les zones, ou un seul groupe ---------- */

  function codesPerimetre() {
    if (perimetre === 'tout' || !categorie.groupes || !categorie.groupes[perimetre]) return [...zones.keys()];
    return categorie.groupes[perimetre].filter((c) => zones.has(c));
  }
  const nomPerimetre = () => (perimetre === 'tout' ? categorie.nomTout || 'Tout' : perimetre);

  // Texte d'une case de groupe : le nom, et à droite le nombre de zones
  function puce(nom, n) {
    const texte = document.createElement('span');
    const b = document.createElement('b');
    b.textContent = nom;
    const small = document.createElement('small');
    small.textContent = n;
    texte.append(b, small);
    return texte;
  }

  function preparerPerimetres(cat) {
    const liste = $('#record-perimetres');
    liste.innerHTML = '';
    const ajouter = (id, nom, n) => {
      const label = document.createElement('label');
      label.className = 'chip-check';
      const choix = document.createElement('input');
      choix.type = 'radio';
      choix.name = 'perimetre';
      choix.value = id;
      choix.checked = id === perimetre;
      label.append(choix, puce(nom, n));
      liste.appendChild(label);
    };
    ajouter('tout', cat.nomTout || 'Tout', zones.size);
    Object.keys(cat.groupes || {}).forEach((g) => {
      const n = cat.groupes[g].filter((c) => zones.has(c)).length;
      if (n) ajouter(g, g, n);
    });
  }

  // Record du profil et meilleur de tous les profils, pour la façon de jouer et le périmètre choisis
  function majRecords() {
    const boite = $('#record-scores');
    if (!categorie || !window.GeoProfils) { boite.innerHTML = ''; return; }
    const cle = GeoProfils.cleRecord(categorie.id, jeuType, perimetre);
    const moi = GeoProfils.recordDe(cle);
    const premier = GeoProfils.classement(cle)[0];
    const ligne = (libelle, r, detail) => '<div class="record-ligne"><span>' + libelle + '</span>' +
      (r ? '<b>' + r.score + ' / ' + r.total + ' · ' + GeoProfils.temps(r.tempsMs) + '</b><small>' + esc(detail) + '</small>'
         : '<b class="record-vide">pas encore de record</b>') + '</div>';
    boite.innerHTML =
      ligne('Votre record (' + esc(GeoProfils.actif().nom) + ')', moi, moi ? 'le ' + new Date(moi.date).toLocaleDateString('fr-FR') : '') +
      ligne('Meilleur de tous les joueurs', premier, premier ? premier.nom : '');
  }

  // Une case à cocher par groupe ; sans groupes dans la catégorie, le choix du mode est masqué
  function preparerGroupes(cat) {
    const liste = $('#groupes-liste');
    liste.innerHTML = '';
    $('#mode-wrap').classList.toggle('hidden', !cat.groupes);
    if (cat.groupes) {
      const nom = cat.nomGroupes || 'groupes';
      $('#mode-groupes-nom').textContent = nom;
      $('#groupes-titre').textContent = nom.charAt(0).toUpperCase() + nom.slice(1) + ' à inclure';
      Object.keys(cat.groupes).forEach((g) => {
        const n = cat.groupes[g].filter((c) => zones.has(c)).length;
        if (!n) return;
        const label = document.createElement('label');
        label.className = 'chip-check';
        const coche = document.createElement('input');
        coche.type = 'checkbox';
        coche.value = g;
        label.append(coche, puce(g, n));
        liste.appendChild(label);
      });
    }
    // modeInitial 'groupes' : on commence par le choix des groupes, tous cochés (ou ceux de groupesInitiaux)
    const parGroupes = !!cat.groupes && cat.modeInitial === 'groupes';
    if (parGroupes) {
      liste.querySelectorAll('input').forEach((i) => {
        i.checked = !cat.groupesInitiaux || cat.groupesInitiaux.includes(i.value);
      });
    }
    definirMode(parGroupes ? 'groupes' : 'nombre');
  }

  /* ---------- Zones optionnelles (ex. Outre-Mer) et plage du curseur ---------- */

  // Codes tirables en mode « par nombre » : null = toute la carte
  function codesNombre() {
    const opt = categorie.zonesOptionnelles;
    if (!opt || $('#opt-extras').checked) return null;
    const ecarte = new Set(opt.codes);
    return [...zones.keys()].filter((c) => !ecarte.has(c));
  }

  // Curseur : de MIN_QUESTIONS au nombre de zones tirables
  function majPlage() {
    const dispo = codesNombre();
    const total = dispo ? dispo.length : zones.size;
    const min = Math.min(MIN_QUESTIONS, total);
    ['#count-range', '#count-input'].forEach((s) => { $(s).min = min; $(s).max = total; });
    $('#count-min').textContent = min;
    $('#count-max').textContent = total;
    const v = Math.min(total, Math.max(min, parseInt($('#count-input').value, 10) || derniereTaille));
    $('#count-range').value = $('#count-input').value = v;
    majRaccourcis();
  }

  // Raccourcis 10, 20, 30, 50, « Tous » : celui de la valeur choisie est enfoncé ; ceux hors plage sont cachés
  function majRaccourcis() {
    const curseur = $('#count-range');
    const v = +curseur.value, min = +curseur.min, max = +curseur.max;
    $('#count-tous').textContent = max;
    document.querySelectorAll('#nombre-raccourcis [data-nombre]').forEach((b) => {
      const tous = b.dataset.nombre === 'max';
      const n = tous ? max : Number(b.dataset.nombre);
      b.hidden = !tous && (n < min || n >= max);
      b.classList.toggle('is-active', n === v);
      b.setAttribute('aria-pressed', String(n === v));
    });
  }

  function ouvrirCategorie(id) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    arreterPartie();
    categorie = cat;
    carte = null;
    apprendre = null;
    activite = null;

    $('#setup-titre').textContent = cat.titre;
    // Colonne de la catégorie (nomColonne) et colonne droite facultative (colonneDroite : id d'une colonne de
    // l'écran, ex. 'setup-prefectures') ; sans elle, une seule colonne, centrée
    $('#setup-col-nom').textContent = cat.nomColonne || 'Votre partie';
    document.querySelectorAll('.setup-col--droite').forEach((c) => c.classList.toggle('hidden', c.id !== cat.colonneDroite));
    $('#setup-colonnes').classList.toggle('setup-colonnes--deux', !!cat.colonneDroite);
    $('#count-unit').textContent = cat.unite || 'zones';
    $('#opt-ordre').checked = false;
    $('#opt-ordre-wrap').classList.toggle('hidden', !cat.libelleOrdre);
    // Options : libellé court sur l'écran (libelleOrdreCourt, libelleIndiceCourt), le complet en info-bulle
    $('#opt-ordre-label').textContent = cat.libelleOrdreCourt || cat.libelleOrdre || '';
    $('#opt-ordre-label').title = cat.libelleOrdreCourt ? cat.libelleOrdre : '';
    $('#opt-indice').checked = false;
    $('#opt-indice-wrap').classList.toggle('hidden', typeof cat.indice !== 'function');
    $('#opt-indice-label').textContent = cat.libelleIndiceCourt || cat.libelleIndice || 'Afficher un indice';
    $('#opt-indice-label').title = cat.libelleIndiceCourt ? cat.libelleIndice : '';
    $('#opt-rattrapage').checked = true;
    $('#opt-extras').checked = false;
    $('#opt-extras-wrap').classList.toggle('hidden', !cat.zonesOptionnelles);
    const opt = cat.zonesOptionnelles;            // libellé court (libelleCourt) sur l'écran, le complet en info-bulle
    $('#opt-extras-label').textContent = opt ? opt.libelleCourt || opt.libelle : '';
    $('#opt-extras-label').title = opt && opt.libelleCourt ? opt.libelle : '';

    $('#mode-wrap').classList.add('hidden');      // réaffiché une fois la carte chargée (si groupes)
    perimetre = 'tout';
    miniCarte = null;
    definirJeuType(jeuType);                      // la façon de jouer est gardée ; le mode record est mémorisé
    definirPartieType(lireRecord() ? 'record' : 'occasionnel');
    definirMode('nombre');
    activerChoix(false);
    afficher('screen-setup');

    carte = GeoCarte.obtenir(cat.carte);
    if (!carte) {
      // Le détail technique va dans la console (développeur) ; le joueur ne voit qu'un message simple
      console.error('core.js : carte introuvable « ' + cat.carte + ' » : vérifiez que son fichier (dossier data/) existe et est référencé dans index.html');
      $('#setup-status').innerHTML = '<span class="status-error">⚠️ Cette carte n\'est pas disponible pour le moment.</span>';
      return;
    }

    construireSVG(carte, cat, false);
    preparerGroupes(cat);
    preparerPerimetres(cat);
    preparerMiniCarte(cat);
    majMiniCarte();
    majRecords();

    $('#count-input').value = derniereTaille;
    majPlage();

    // Seule la source des données reste affichée (crédit exigé par les licences des cartes)
    $('#setup-status').innerHTML = carte.credit ? '<span class="credit">' + esc(carte.credit) + '</span>' : '';
    activerChoix(true);
  }

  /* ------------------------------------------------------------------ */
  /* Carte SVG : construction, zoom, déplacement                         */
  /* ------------------------------------------------------------------ */
  // Limites entre groupes (régions) : un segment partagé par deux zones de groupes différents
  // est une frontière de groupe. Calculé au chargement à partir des tracés : rien à stocker.
  function tracerFrontieres(c, groupes) {
    const groupeDe = {};
    Object.keys(groupes).forEach((g) => groupes[g].forEach((code) => { groupeDe[code] = g; }));
    const segments = new Map();            // « x y|x y » -> groupes des zones qui possèdent ce segment
    for (const el of c.elements) {
      const g = groupeDe[el.code];
      if (!g) continue;
      for (const anneau of el.d.split('M').slice(1)) {
        const pts = anneau.replace('Z', '').split('L');
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          if (a === b) continue;
          const cle = a < b ? a + '|' + b : b + '|' + a;
          const l = segments.get(cle);
          if (l) l.push(g); else segments.set(cle, [g]);
        }
      }
    }
    let d = '';
    segments.forEach((l, cle) => { if (l.length === 2 && l[0] !== l[1]) d += 'M' + cle.replace('|', 'L'); });
    return d;
  }

  function creerSVG(nom, classe, attributs) {
    const el = document.createElementNS(SVG_NS, nom);
    if (classe) el.setAttribute('class', classe);
    Object.keys(attributs || {}).forEach((k) => el.setAttribute(k, attributs[k]));
    return el;
  }

  // Une zone cliquable. Surface : un <path>. Ligne (cours d'eau) : un groupe avec un tracé visible
  // et un tracé invisible plus large qui facilite le clic. Point (micro-État, détroit) : son éventuel
  // contour, un rond bien visible et un rond invisible plus large, de taille fixe à l'écran (majPoints).
  // type : sert aux couleurs et aux filtres.
  function creerZone(el, bulles) {
    let z;
    if (el.ligne) {
      z = creerSVG('g', 'zone ligne');
      z.append(creerSVG('path', 'ligne-clic', { d: el.d }), creerSVG('path', 'ligne-trait', { d: el.d }));
    } else if (el.point) {
      z = creerSVG('g', 'zone zone--point');
      if (el.d) z.appendChild(creerSVG('path', 'point-forme', { d: el.d }));
      const clic = creerSVG('circle', 'point-clic', { cx: el.cx, cy: el.cy });
      const rond = creerSVG('circle', 'point-rond', { cx: el.cx, cy: el.cy });
      z.append(clic, rond);
      cerclesPoints.push([clic, RAYON_POINT_CLIC], [rond, RAYON_POINT]);
    } else {
      z = creerSVG('path', 'zone', { d: el.d });
    }
    z.dataset.code = el.code;
    z.dataset.state = 'idle';
    if (el.type) z.dataset.type = el.type;
    if (bulles) {
      const t = creerSVG('title');
      t.textContent = el.nom + (el.type ? '' : ' (' + el.code + ')');
      z.appendChild(t);
    }
    zones.set(el.code, { nom: el.nom, el: z, cx: el.cx, cy: el.cy, brut: el });
    return z;
  }

  // Décor non cliquable : couche 'fond' (sous tout le reste), 'dessus' (au-dessus des zones) ou
  // 'milieu' (le reste). Le nom d'un élément s'affiche au survol, seulement hors quiz (bulles).
  function dessinerDecor(c, couche, bulles) {
    const liste = (c.decor || []).filter((p) => (p.fond ? 'fond' : p.dessus ? 'dessus' : 'milieu') === couche);
    if (!liste.length) return;
    const g = creerSVG('g', 'decor');
    liste.forEach((p) => {
      const e = creerSVG('path', 'decor-' + (p.classe || 'pays'), { d: p.d });
      if (p.nom && bulles) {
        const t = creerSVG('title');
        t.textContent = p.nom;
        e.appendChild(t);
        e.classList.add('decor-nomme');
      }
      g.appendChild(e);
    });
    svg.appendChild(g);
  }

  // Carte avec fond (ex. cours d'eau sur les départements, mers sous les pays) : zones « dessous » (mers),
  // décor (pays voisins, lacs), fond non cliquable, étiquettes, puis zones « dessus » (cours d'eau, détroits)
  function construireAvecFond(c, def, fond, bulles) {
    const exclus = new Set(def.fond.exclure || []);
    dessinerDecor(c, 'fond', bulles);
    const gDessous = creerSVG('g');
    c.elements.filter((e) => e.dessous).forEach((e) => gDessous.appendChild(creerZone(e, bulles)));
    svg.appendChild(gDessous);

    dessinerDecor(c, 'milieu', bulles);

    // Le fond et ses territoires (ex. Palestine sur la carte des pays) : de la terre, non cliquable
    const gf = creerSVG('g', 'fond');
    fond.elements.filter((e) => !exclus.has(e.code) && e.d)
      .forEach((e) => gf.appendChild(creerSVG('path', 'fond-zone', { d: e.d })));
    (fond.decor || []).filter((p) => p.classe === 'territoire')
      .forEach((p) => gf.appendChild(creerSVG('path', 'fond-zone', { d: p.d })));
    svg.appendChild(gf);

    // Étiquettes (noms des mers) : seulement hors quiz, sinon elles donneraient la réponse
    const champ = def.champFiltre || 'type';
    const ge = creerSVG('g', 'etiquettes');
    c.elements.filter((e) => e.etiquette && bulles).forEach((e) => {
      const t = creerSVG('text', 'etiquette', { x: e.cx, y: e.cy });
      t.dataset.type = e.type || '';
      t.dataset.filtre = e[champ] === undefined ? '' : String(e[champ]);
      t.textContent = e.etiquette;
      ge.appendChild(t);
    });
    svg.appendChild(ge);

    const gDessus = creerSVG('g');
    c.elements.filter((e) => !e.dessous).forEach((e) => gDessus.appendChild(creerZone(e, bulles)));
    svg.appendChild(gDessus);
    dessinerDecor(c, 'dessus', bulles);
  }

  // def : catégorie de quiz ou module « Apprendre » ;
  // bulles : true = nom de la zone au survol (jamais en quiz : ce serait donner la réponse)
  function construireSVG(c, def, bulles) {
    svg.innerHTML = '';
    zones.clear();
    cerclesPoints = [];
    svg.setAttribute('aria-label', 'Carte : ' + def.titre);
    svg.dataset.carte = def.carte || '';                  // permet des couleurs propres à une carte (css)
    base = c.vue ? { ...c.vue } : { x: 0, y: 0, w: c.largeur, h: c.hauteur };
    vue = { ...base };
    vueDepart = null;
    zoomMax = c.zoomMax || ZOOM_MAX;
    // La légende « point » n'apparaît que si la carte a des petites zones signalées par un point
    document.body.dataset.points = c.elements.some((e) => e.point) ? '1' : '0';

    const fond = def.fond && GeoCarte.obtenir(def.fond.carte);
    if (fond) {
      construireAvecFond(c, def, fond, bulles);
      const repere = creerSVG('circle');
      repere.setAttribute('id', 'marker');
      repere.style.display = 'none';
      svg.appendChild(repere);
      return appliquerVue();
    }

    dessinerDecor(c, 'fond', bulles);                     // ex. le fond d'océan de la carte du monde

    // Encadrés (cartouches) des territoires éloignés, derrière les zones
    if (c.cadres && c.cadres.length) {
      const gc = document.createElementNS(SVG_NS, 'g');
      gc.setAttribute('id', 'cadres');
      for (const r of c.cadres) {
        const rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('class', 'cadre');
        ['x', 'y'].forEach((k) => rect.setAttribute(k, r[k]));
        rect.setAttribute('width', r.l);
        rect.setAttribute('height', r.h);
        rect.setAttribute('rx', 10);
        gc.appendChild(rect);
      }
      svg.appendChild(gc);
    }

    dessinerDecor(c, 'milieu', bulles);                   // ex. territoires non cliquables (Palestine)

    const g = document.createElementNS(SVG_NS, 'g');
    for (const el of c.elements) g.appendChild(creerZone(el, bulles));
    svg.appendChild(g);

    if (def.groupes) {                     // limites des groupes (régions) : trait un peu plus épais
      const f = document.createElementNS(SVG_NS, 'path');
      f.setAttribute('class', 'frontieres');
      f.setAttribute('d', tracerFrontieres(c, def.groupes));
      svg.appendChild(f);
    }

    dessinerDecor(c, 'dessus', bulles);                   // ex. limite en pointillés (Sahara occidental)

    const repere = document.createElementNS(SVG_NS, 'circle');
    repere.setAttribute('id', 'marker');
    repere.style.display = 'none';
    svg.appendChild(repere);

    appliquerVue();
  }

  function appliquerVue() {
    svg.setAttribute('viewBox', vue.x + ' ' + vue.y + ' ' + vue.w + ' ' + vue.h);
    majTailles();
    const z = $('#carte-zoom');
    if (z) z.textContent = 'Zoom ×' + (base.w / vue.w).toFixed(1).replace('.', ',');
  }

  // Unités SVG par pixel écran (la carte est centrée et jamais déformée) ; 0 si la carte est cachée
  function echellePixel() {
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return 0;
    return Math.max(vue.w / r.width, vue.h / r.height);
  }

  // Éléments dont la taille à l'écran est fixe : repère de la bonne réponse, points des petites zones
  function majTailles() {
    const k = echellePixel();
    if (!k) return;                        // carte cachée : mise à jour quand elle apparaît (ResizeObserver)
    majRepere(k);
    cerclesPoints.forEach(([c, r]) => c.setAttribute('r', r * k));
  }

  // Cadre [x0, y0, x1, y1] d'une zone : celui que donne la carte (ex. un pays sans ses territoires lointains),
  // sinon celui de son tracé (calculé une fois)
  function cadreZone(code) {
    const z = zones.get(code);
    if (z.brut.cadre) return z.brut.cadre;
    if (!z.cadre) {
      const n = (z.brut.d || '').match(/-?\d+(?:\.\d+)?/g);
      if (!n) z.cadre = [z.cx, z.cy, z.cx, z.cy];
      else {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (let i = 0; i + 1 < n.length; i += 2) {
          const x = +n[i], y = +n[i + 1];
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        z.cadre = [x0, y0, x1, y1];
      }
    }
    return z.cadre;
  }

  // Vue qui montre toutes ces zones (avec une marge), aux proportions de la carte
  function vueSur(codes) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    codes.forEach((c) => {
      const b = cadreZone(c);
      x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]);
    });
    const ratio = base.h / base.w;
    const w = Math.min(base.w, Math.max(base.w / zoomMax, Math.max(x1 - x0, (y1 - y0) / ratio) * 1.16));
    const h = w * ratio;
    vue = { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
    limiterVue();
    return { ...vue };
  }

  function limiterVue() {
    if (vue.w >= base.w - 1e-6) {
      vue.x = base.x; vue.y = base.y; vue.w = base.w; vue.h = base.h;
      return;
    }
    vue.x = Math.min(Math.max(vue.x, base.x), base.x + base.w - vue.w);
    vue.y = Math.min(Math.max(vue.y, base.y), base.y + base.h - vue.h);
  }

  function zoomer(facteur, cx, cy) {
    const w = Math.min(base.w, Math.max(base.w / zoomMax, vue.w / facteur));
    const h = w * base.h / base.w;
    vue.x = cx - (cx - vue.x) * (w / vue.w);
    vue.y = cy - (cy - vue.y) * (h / vue.h);
    vue.w = w;
    vue.h = h;
    limiterVue();
    appliquerVue();
  }

  function pointSVG(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  // Retour à la vue de départ : celle de la partie (cadrée sur les groupes choisis) ou toute la carte
  function reinitialiserVue() {
    vue = { ...(vueDepart || base) };
    appliquerVue();
  }

  /* Anneau pulsant autour de la bonne réponse */
  function afficherRepere(code) {
    const z = zones.get(code);
    const m = svg.querySelector('#marker');
    if (!z || !m) return;
    m.setAttribute('cx', z.cx);
    m.setAttribute('cy', z.cy);
    m.style.display = 'block';
    majRepere();
  }
  function masquerRepere() {
    const m = svg.querySelector('#marker');
    if (m) m.style.display = 'none';
  }

  /* Zone trouvée : deux ondes et l'étiquette « Nom · +1 » (au-dessus de la carte, en pixels) */
  function celebrer(code) {
    const z = zones.get(code);
    const wrap = $('#map-wrap');
    const ctm = svg.getScreenCTM();
    if (!z || !wrap || !ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = z.cx; pt.y = z.cy;
    const p = pt.matrixTransform(ctm);
    const r = wrap.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'trouve';
    el.setAttribute('aria-hidden', 'true');
    el.style.left = Math.round(p.x - r.left) + 'px';
    el.style.top = Math.round(p.y - r.top) + 'px';
    el.innerHTML = '<i class="trouve-onde"></i><i class="trouve-onde"></i><span class="trouve-etiquette"></span>';
    el.lastChild.textContent = z.nom + ' · +1';
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  function majRepere(k) {
    const m = svg.querySelector('#marker');
    const echelle = k || echellePixel();
    if (m && echelle && m.style.display !== 'none') m.setAttribute('r', 18 * echelle);
  }

  function etat(code, valeur) {
    const z = zones.get(code);
    if (z) z.el.dataset.state = valeur;
  }

  function brancherCarte() {
    // Molette : zoom centré sur le curseur
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const p = pointSVG(e.clientX, e.clientY);
      zoomer(Math.exp(-e.deltaY * 0.0015), p.x, p.y);
    }, { passive: false });

    // Glisser : déplacement ; un simple clic reste un clic
    let glisse = null;
    let aGlisse = false;
    svg.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      glisse = { x: e.clientX, y: e.clientY, vx: vue.x, vy: vue.y };
      aGlisse = false;
    });
    window.addEventListener('pointermove', (e) => {
      if (!glisse) return;
      const dx = e.clientX - glisse.x;
      const dy = e.clientY - glisse.y;
      if (!aGlisse && Math.hypot(dx, dy) < 6) return;
      aGlisse = true;
      svg.classList.add('panning');
      const k = echellePixel();
      vue.x = glisse.vx - dx * k;
      vue.y = glisse.vy - dy * k;
      limiterVue();
      appliquerVue();
    });
    const finGlisse = () => { glisse = null; svg.classList.remove('panning'); };
    window.addEventListener('pointerup', finGlisse);
    window.addEventListener('pointercancel', finGlisse);

    svg.addEventListener('click', (e) => {
      if (aGlisse) { aGlisse = false; return; }
      const z = e.target.closest && e.target.closest('.zone');
      if (activite) { if (z && activite.clic) activite.clic(z.dataset.code); return; }
      if (apprendre) selectionner(z ? z.dataset.code : null, false);   // clic hors zone : fiche refermée
      else if (z) repondre(z.dataset.code);
    });

    document.querySelectorAll('[data-zoom]').forEach((b) => {
      b.addEventListener('click', () => {
        const act = b.dataset.zoom;
        if (act === 'reset') return reinitialiserVue();
        zoomer(act === 'in' ? 1.6 : 1 / 1.6, vue.x + vue.w / 2, vue.y + vue.h / 2);
      });
    });
    // Taille de la carte modifiée (fenêtre, carte qui apparaît sur un autre écran) : repère et points recalculés
    if (window.ResizeObserver) new ResizeObserver(() => majTailles()).observe(svg);
    else window.addEventListener('resize', majTailles);
  }

  /* ------------------------------------------------------------------ */
  /* Déroulement de la partie                                            */
  /* ------------------------------------------------------------------ */

  // Le message est enveloppé dans UN seul <span> : sans cela, le conteneur flex
  // traiterait chaque morceau de texte comme un élément séparé et supprimerait
  // les espaces en bord de morceau (« cliqué surParis »).
  function retour(type, html) {
    const f = $('#feedback');
    f.className = 'fb fb-' + type;
    f.innerHTML = '<span>' + html + '</span>';
  }

  // Compteur qui change : nouvelle valeur, avec un petit bond
  function compteur(sel, v) {
    const el = $(sel);
    if (el.textContent === String(v)) return;
    el.textContent = v;
    el.classList.remove('is-change');
    void el.offsetWidth;
    el.classList.add('is-change');
  }

  function majStats() {
    const n = jeu.pool.length;
    $('#stat-label').textContent = jeu.rattrapage ? 'Retrouvés' : 'Trouvés';
    compteur('#stat-score', jeu.score);
    compteur('#stat-rates', jeu.joues - jeu.score);
    $('#stat-progress').textContent = (jeu.rattrapage ? 'Rattrapage · ' : '') + 'Étape ' + Math.min(jeu.joues + 1, n) + ' / ' + n;
    dessinerParcours();
  }

  // Le parcours : une étape par question (trouvée, ratée, en cours, à venir) reliées par un trait
  // qui avance ; au-delà de MAX_ETAPES, une barre (part trouvée, part ratée)
  function dessinerParcours() {
    const boite = $('#parcours');
    const n = jeu.pool.length;
    const res = jeu.resultats;
    boite.classList.toggle('parcours--barre', n > MAX_ETAPES);
    if (n > MAX_ETAPES) {
      const ok = res.filter((r) => r.ok).length;
      boite.innerHTML = '<i class="parcours-ok" style="width:' + (ok / n * 100) + '%"></i>' +
        '<i class="parcours-ko" style="width:' + ((res.length - ok) / n * 100) + '%"></i>';
      return;
    }
    let html = '<span class="parcours-trace" style="--avance:' + (n > 1 ? Math.min(res.length, n - 1) / (n - 1) : 0) + '"></span>';
    for (let i = 0; i < n; i++) {
      const r = res[i];
      html += '<i' + (r ? ' class="' + (r.ok ? 'is-ok' : 'is-ko') + '"' : i === res.length ? ' class="is-courant"' : '') + '></i>';
    }
    boite.innerHTML = html;
  }

  // Série de bonnes réponses d'affilée (affichée à partir de 2)
  function majSerie(monte) {
    const s = $('#serie');
    s.classList.toggle('hidden', jeu.serie < 2);
    $('#serie-nb').textContent = '×' + jeu.serie;
    if (monte && jeu.serie >= 2) {
      s.classList.remove('is-monte');
      void s.offsetWidth;
      s.classList.add('is-monte');
    }
  }

  function bonneReponse(code) {
    jeu.serie++;
    majSerie(true);
    celebrer(code);
  }
  function mauvaiseReponse() {
    jeu.serie = 0;
    majSerie(false);
  }

  function majChrono() {
    if (jeu) $('#stat-time').textContent = formaterTemps(Date.now() - jeu.debut);
  }

  function boutonAction(libelle, suite) {
    const b = $('#btn-action');
    b.textContent = libelle;
    b.className = 'btn btn-action ' + (suite ? 'btn-primary' : 'btn-dark');
  }

  // Ordre des codes : comparaison « naturelle » (01 < 2 < 19 < 21 …). Les codes 2A et 2B
  // sont placés entre 19 et 21 ; le Haut-Rhin (68) suit donc bien le Bas-Rhin (67).
  const cleCode = (c) => c.replace(/^2([AB])$/, '20$1');
  const comparerCodes = (a, b) => cleCode(a).localeCompare(cleCode(b), 'fr', { numeric: true });

  /* config :
       jeu          'ciblage' ou 'nommage'
       record       true : mode record (toutes les zones de codes, dans le désordre, sans indice ni rattrapage)
       perimetre    { id, nom } du record
       codes        zones tirables (défaut : toute la carte)
       nombre       nombre de questions (défaut : toutes les zones tirables)
       ordonne      true : zones présentées dans l'ordre des codes
       estompe      true : zones hors sélection estompées (groupes, record), false : masquées (zones optionnelles)
       description  résumé de la sélection, pour l'historique (« 20 départements au hasard »…) */
  function demarrer(config) {
    if (!carte) return;
    derniereConfig = config;
    const record = !!config.record;
    const nommage = config.jeu === 'nommage';
    const candidats = config.codes || [...zones.keys()];
    const taille = Math.max(1, Math.min(Number(config.nombre) || candidats.length, candidats.length));
    const pool = melanger(candidats).slice(0, taille);
    if (config.ordonne && !record) pool.sort(comparerCodes);

    // Zones hors sélection : estompées (groupes, record) ou masquées (zones optionnelles non incluses)
    const estompe = !!config.estompe;
    const dansQuiz = new Set(candidats);
    zones.forEach((z, code) => {
      const dehors = !dansQuiz.has(code);
      z.el.classList.toggle('hors-quiz', dehors && estompe);
      z.el.classList.toggle('masque', dehors && !estompe);
    });
    const cadres = svg.querySelector('#cadres');
    if (cadres) {                                   // les encadrés suivent les zones optionnelles
      const opt = categorie.zonesOptionnelles;
      const dehors = !!opt && !opt.codes.some((c) => dansQuiz.has(c));
      cadres.classList.toggle('hors-quiz', dehors && estompe);
      cadres.classList.toggle('masque', dehors && !estompe);
    }

    zones.forEach((z) => { z.el.dataset.state = 'idle'; });
    masquerRepere();
    $('#screen-game').appendChild($('#map-wrap'));   // la carte est partagée avec le mode « Apprendre »
    // Par groupes (régions, continents…) ou en record : la carte se cadre sur les zones choisies ; ⤢ y revient
    vueDepart = estompe ? vueSur(candidats) : null;
    reinitialiserVue();

    arreterPartie();
    jeu = {
      pool,
      jeuType: nommage ? 'nommage' : 'ciblage',
      record,
      perimetre: config.perimetre || null,
      description: config.description || '',
      idx: 0, score: 0, joues: 0,
      verrou: false, minuteur: null, finaliser: null,
      resultats: [],
      resultatsPrincipaux: null,  // résultats de la partie, mémorisés au début du rattrapage
      rattrapageActif: !record && $('#opt-rattrapage').checked,   // option « rattrapage des erreurs »
      rattrapage: false,      // true pendant la mini-session finale
      principal: null,        // score de la partie, mémorisé au début du rattrapage
      tempsPrincipal: 0,      // temps de la partie (sans le rattrapage)
      indice: !record && typeof categorie.indice === 'function' && $('#opt-indice').checked,
      serie: 0,               // bonnes réponses d'affilée
      debut: Date.now(),
      chrono: null,
      actif: true
    };
    jeu.chrono = setInterval(majChrono, 250);
    majSerie(false);
    $('#partie-titre').textContent = categorie.titre + ' · ' + (nommage ? 'Nommage' : 'Ciblage') + (record ? ' · Record' : '');

    // Nommage : champ de saisie (avec suggestions en occasionnel seulement)
    $('#screen-game').dataset.jeu = jeu.jeuType;
    $('#nommage').classList.toggle('hidden', !nommage);
    $('#nommage-saisie').placeholder = record ? 'Tapez le nom (sans suggestions)…' : 'Tapez le nom…';
    $('#question-label').textContent = questionLabel();
    majRecordEnJeu();
    afficher('screen-game');
    majStats();
    majChrono();
    suivante();
    majTailles();
  }

  function questionLabel() {
    const q = jeu.jeuType === 'nommage' ? 'Quel est le nom de la zone en surbrillance ?' : (categorie.question || 'Où se trouve…');
    return jeu.rattrapage ? 'Rattrapage · ' + q.charAt(0).toLowerCase() + q.slice(1) : q;
  }

  // En mode record : le record du profil sur ce périmètre (à la place du bouton de compte)
  function majRecordEnJeu() {
    const ligne = $('#record-en-jeu');
    ligne.classList.toggle('hidden', !jeu.record);
    if (!jeu.record || !window.GeoProfils) return;
    const r = GeoProfils.recordDe(GeoProfils.cleRecord(categorie.id, jeu.jeuType, jeu.perimetre.id));
    ligne.textContent = '🏆 Record · ' + jeu.perimetre.nom + ' — ' +
      (r ? 'votre meilleur : ' + r.score + ' / ' + r.total + ' · ' + GeoProfils.temps(r.tempsMs) : 'premier essai sur ce périmètre');
  }

  // Fin d'une série de questions : rattrapage s'il y a des erreurs, sinon fin de partie
  function finPhase() {
    if (!jeu.rattrapage) jeu.tempsPrincipal = Date.now() - jeu.debut;
    if (jeu.rattrapageActif && !jeu.rattrapage && jeu.resultats.some((r) => !r.ok)) return lancerRattrapage();
    finir();
  }

  // Mini-session finale : uniquement les zones ratées. La carte est remise à zéro pour ne
  // pas révéler lesquelles étaient ratées. Une seule passe : pas de rattrapage du rattrapage.
  function lancerRattrapage() {
    const rates = jeu.resultats.filter((r) => !r.ok).map((r) => r.code);
    jeu.principal = { score: jeu.score, total: jeu.pool.length };
    jeu.resultatsPrincipaux = jeu.resultats;
    jeu.rattrapage = true;
    jeu.pool = rates;
    jeu.idx = 0; jeu.score = 0; jeu.joues = 0; jeu.resultats = [];
    jeu.serie = 0;
    majSerie(false);

    zones.forEach((z) => { z.el.dataset.state = 'idle'; });
    masquerRepere();
    reinitialiserVue();
    $('#question-label').textContent = questionLabel();
    majStats();
    suivante();
    retour('idle', '🔁 Rattrapage : ' + rates.length + ' à ' + (jeu.jeuType === 'nommage' ? 'renommer.' : 'replacer.'));
  }

  function suivante() {
    if (jeu.idx >= jeu.pool.length) return finPhase();
    const code = jeu.pool[jeu.idx];
    const z = zones.get(code);
    jeu.verrou = false;
    const indice = jeu.indice ? ' (' + categorie.indice(z.brut) + ')' : '';
    $('#target-hint').textContent = '';
    boutonAction('Passer', false);
    if (jeu.jeuType === 'nommage') {
      // La zone à nommer s'allume ; l'anneau pulsant aide à repérer les très petites
      etat(code, 'question');
      afficherRepere(code);
      $('#target-name').textContent = '?' + indice;
      retour('idle', 'Tapez le nom de la zone en surbrillance, puis Entrée.');
      const champ = $('#nommage-saisie');
      champ.value = '';
      champ.disabled = false;
      fermerSuggestionsNom();
      champ.focus();
      return;
    }
    // Option « code » : le nom s'affiche sous la forme « Nom (XX) »
    $('#target-name').textContent = z.nom + indice;
    retour('idle', 'Cliquez sur la carte pour répondre.');
  }

  /* ---------- Nommage : comparaison de la réponse tapée ---------- */

  // On ignore les majuscules, les accents, les espaces, les tirets et les apostrophes : « cotesdarmor »
  const reduire = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/[\s\-'’‘ʼ]/g, '');
  // Le mot générique d'une étendue d'eau peut être omis : « Pacifique » pour « océan Pacifique »
  const GENERIQUE = /^(ocean|mer|golfe|baie|detroit|canal|passage|bouches|bassin)\s+(de\s+la\s+|de\s+l['’]|des\s+|du\s+|de\s+|d['’])?/;

  function nomCorrect(texte, z) {
    const t = reduire(texte);
    const base = String(z.nom).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    return t === reduire(base) || t === reduire(base.replace(GENERIQUE, ''));
  }

  // texte === null : le joueur passe la question
  function repondreNom(texte) {
    if (!jeu || !jeu.actif || jeu.verrou || jeu.jeuType !== 'nommage') return;
    if (texte !== null && !reduire(texte)) return;          // champ vide : rien à valider
    jeu.verrou = true;
    const cible = jeu.pool[jeu.idx];
    const nomCible = zones.get(cible).nom;
    const bon = texte !== null && nomCorrect(texte, zones.get(cible));
    $('#nommage-saisie').disabled = true;
    fermerSuggestionsNom();
    let delai;

    jeu.joues++;
    if (bon) {
      jeu.score++;
      jeu.resultats.push({ code: cible, ok: true });
      etat(cible, 'right');
      bonneReponse(cible);
      retour('ok', '✅ Bravo ! C\'est bien <strong>' + esc(nomCible) + '</strong>.');
      jeu.finaliser = () => etat(cible, 'ok');
      delai = DELAI_BONNE;
    } else {
      jeu.resultats.push({ code: cible, ok: false });
      etat(cible, 'reveal');
      mauvaiseReponse();
      retour('ko', texte === null
        ? '⏭️ Question passée : c\'était <strong>' + esc(nomCible) + '</strong>.'
        : '❌ Non : c\'était <strong>' + esc(nomCible) + '</strong> (vous avez tapé « ' + esc(texte.trim()) + ' »).');
      jeu.finaliser = () => etat(cible, 'ko');
      delai = DELAI_FAUSSE;
    }
    jeu.idx++;
    majStats();
    boutonAction('Suivant →', true);
    jeu.minuteur = setTimeout(avancer, delai);
  }

  // code === null : le joueur passe la question
  function repondre(code) {
    if (!jeu || !jeu.actif || jeu.verrou || jeu.jeuType === 'nommage') return;
    // Un département déjà apparu (trouvé ou raté) n'est plus cliquable : le clic est ignoré
    if (code && DEJA_JOUE.has(zones.get(code).el.dataset.state)) return;
    // Une zone hors des groupes choisis (estompée) n'est pas cliquable non plus
    if (code && zones.get(code).el.classList.contains('hors-quiz')) return;
    jeu.verrou = true;

    const cible = jeu.pool[jeu.idx];
    const nomCible = zones.get(cible).nom;
    let delai;

    jeu.joues++;
    if (code === cible) {
      jeu.score++;
      jeu.resultats.push({ code: cible, ok: true });
      etat(cible, 'right');
      bonneReponse(cible);
      retour('ok', '✅ Bravo ! C\'est bien <strong>' + esc(nomCible) + '</strong>.');
      jeu.finaliser = () => etat(cible, 'ok');
      delai = DELAI_BONNE;
    } else {
      jeu.resultats.push({ code: cible, ok: false });
      const precedent = code ? zones.get(code).el.dataset.state : null;
      if (code) etat(code, 'wrong');
      etat(cible, 'reveal');            // la bonne zone clignote : pas besoin de la nommer
      afficherRepere(cible);
      mauvaiseReponse();
      retour('ko', code
        ? '❌ Raté : vous avez cliqué sur <strong>' + esc(zones.get(code).nom) + '</strong>.'
        : '⏭️ Question passée.');
      jeu.finaliser = () => {
        if (code) etat(code, precedent);
        etat(cible, 'ko');
      };
      delai = DELAI_FAUSSE;
    }

    jeu.idx++;
    majStats();
    boutonAction('Suivant →', true);
    jeu.minuteur = setTimeout(avancer, delai);
  }

  function avancer() {
    if (!jeu || !jeu.verrou) return;
    clearTimeout(jeu.minuteur);
    if (jeu.finaliser) { jeu.finaliser(); jeu.finaliser = null; }
    masquerRepere();
    suivante();
  }

  function finir() {
    jeu.actif = false;
    clearInterval(jeu.chrono);
    clearTimeout(jeu.minuteur);

    // Le score affiché est celui de la partie ; le rattrapage est résumé à part
    const base = jeu.principal || { score: jeu.score, total: jeu.pool.length };
    const total = base.total;
    const pct = total ? Math.round((base.score / total) * 100) : 0;
    const tempsMs = jeu.tempsPrincipal || (Date.now() - jeu.debut);
    $('#end-score').textContent = base.score + ' / ' + total;
    $('#end-percent').textContent = pct + ' %';
    $('#end-time').textContent = jeu.record && window.GeoProfils ? GeoProfils.temps(tempsMs) : formaterTemps(tempsMs);

    // Enregistrement pour le profil actif : historique, zones ratées, totaux et, en mode record, records
    const bilan = window.GeoProfils ? GeoProfils.enregistrerPartie({
      categorie: categorie.id, titre: categorie.titre, jeu: jeu.jeuType, record: jeu.record,
      perimetre: jeu.perimetre, description: jeu.description,
      score: base.score, total, tempsMs, resultats: jeu.resultatsPrincipaux || jeu.resultats
    }) : null;
    afficherBilanRecord(bilan);

    const ligne = $('#end-rattrapage');
    ligne.textContent = jeu.rattrapage ? 'Rattrapage : ' + jeu.score + ' / ' + jeu.pool.length + ' retrouvés.' : '';
    ligne.classList.toggle('hidden', !jeu.rattrapage);

    let emoji, msg;
    if (pct >= 90) { emoji = '🏆'; msg = 'Excellent ! Vous êtes incollable.'; }
    else if (pct >= 70) { emoji = '🎉'; msg = 'Très bien joué !'; }
    else if (pct >= 50) { emoji = '👍'; msg = 'Pas mal, continuez comme ça.'; }
    else { emoji = '💪'; msg = 'Courage, chaque partie vous fait progresser.'; }
    if (bilan && bilan.record && bilan.nouveauRecord) { emoji = '🏆'; msg = 'Nouveau record !'; }
    $('#end-emoji').textContent = emoji;
    $('#end-message').textContent = msg;

    const rates = jeu.resultats.filter((r) => !r.ok);
    const liste = $('#end-missed');
    liste.innerHTML = '';
    rates.forEach((r) => {
      const s = document.createElement('span');
      s.className = 'chip';
      const z = zones.get(r.code);
      s.textContent = z.nom + (z.brut.type ? '' : ' (' + r.code + ')');   // pas de code pour un fleuve
      liste.appendChild(s);
    });
    $('#end-missed-block').classList.toggle('hidden', rates.length === 0);

    afficher('screen-end');
  }

  // Écran de fin, mode record : nouveau record ou record à battre, et place parmi les profils
  function afficherBilanRecord(bilan) {
    const boite = $('#end-record');
    boite.classList.toggle('hidden', !(bilan && bilan.record));
    if (!bilan || !bilan.record) return;
    const t = GeoProfils.temps;
    const r = (x) => x.score + ' / ' + x.total + ' · ' + t(x.tempsMs);
    const nomJeu = jeu.jeuType === 'nommage' ? 'nommage' : 'ciblage';
    let html = '<p class="end-record__contexte">🏆 Record · ' + esc(categorie.titre) + ' · ' + esc(jeu.perimetre.nom) + ' · ' + nomJeu + '</p>';
    if (bilan.nouveauRecord) {
      html += '<p class="end-record__titre">Nouveau record personnel !</p>' +
        '<p>' + (bilan.ancien ? 'Ancien record : ' + r(bilan.ancien) : 'Premier record sur ce périmètre.') + '</p>';
    } else {
      html += '<p class="end-record__titre end-record__titre--neutre">Votre record : ' + r(bilan.actuel) + '</p>';
    }
    const cl = bilan.classement;
    if (cl.length > 1) {
      html += '<p>' + (bilan.rang === 1 ? '🥇 Meilleur de tous les joueurs (' + cl.length + ' classés)'
        : 'Classement : ' + bilan.rang + '<sup>e</sup> sur ' + cl.length + ' joueurs · meilleur : ' + r(cl[0]) + ' (' + esc(cl[0].nom) + ')') + '</p>';
    }
    boite.innerHTML = html;
  }

  function quitter() {
    if (jeu && jeu.actif && jeu.joues > 0 && !confirm('Quitter la partie en cours ?')) return;
    arreterPartie();
    afficher('screen-menu');
  }

  // Révision (depuis les statistiques) : partie occasionnelle sur les zones données d'une catégorie
  function reviser(id, codes, type) {
    ouvrirCategorie(id);
    if (!carte) return;
    const dispo = codes.filter((c) => zones.has(c));
    if (!dispo.length) return;
    definirJeuType(type === 'nommage' ? 'nommage' : 'ciblage');
    demarrer({ jeu: jeuType, codes: dispo, estompe: true, description: 'Révision : ' + dispo.length + ' zones souvent ratées' });
  }

  /* ---------- Suggestions de noms (nommage, et jeux à part : api.suggestions) ---------- */
  // Seulement à partir de MIN_SUGGESTION caractères (sinon une lettre afficherait presque tous les
  // noms), et seulement les noms qui COMMENCENT par le texte tapé : « ua » ne propose pas Guadeloupe.
  // Le début peut sauter un article ou un mot générique : « bel » (Territoire de Belfort),
  // « reu » (La Réunion), « med » (mer Méditerranée). Le nom exact vient en tête, puis l'ordre
  // alphabétique sans les tirets ni les espaces : « Loire » avant « Loir-et-Cher ».
  // entrees : [{ code, nom, … }] ; renvoie null si le texte est trop court (pas de liste à afficher).
  const DEBUT_FACULTATIF = /^(territoire\s+de\s+|la\s+|le\s+|les\s+|l['’]\s*)/;

  function filtrerNoms(texte, entrees) {
    const q = reduire(texte);
    if (q.length < MIN_SUGGESTION) return null;
    const res = [];
    entrees.forEach((e) => {
      const base = String(e.nom).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      const debuts = [base.replace(GENERIQUE, ''), base.replace(DEBUT_FACULTATIF, '')].map(reduire);
      let score = -1;
      if (reduire(base) === q || debuts.includes(q)) score = 0;            // nom exact : toujours en tête
      else if (reduire(base).startsWith(q)) score = 1;
      else if (debuts.some((d) => d.startsWith(q))) score = 2;
      if (score >= 0) res.push(Object.assign({}, e, { cle: reduire(base), score }));
    });
    return res.sort((a, b) => a.score - b.score || a.cle.localeCompare(b.cle, 'fr'));
  }

  /* ---------- Nommage : suggestions (mode occasionnel seulement) ---------- */
  let suggNom = [];
  let suggNomActive = -1;

  function majSuggestionsNom() {
    if (!jeu || jeu.record) return fermerSuggestionsNom();
    const res = filtrerNoms($('#nommage-saisie').value, [...zones].map(([code, z]) => ({ code, nom: z.nom })));
    if (!res) return fermerSuggestionsNom();
    suggNom = res.slice(0, 8);
    suggNomActive = suggNom.length ? 0 : -1;
    dessinerSuggestionsNom();
  }

  function dessinerSuggestionsNom() {
    const liste = $('#nommage-suggestions');
    liste.innerHTML = suggNom.length
      ? suggNom.map((s, i) => '<li role="option" data-nom="' + esc(s.nom) + '" aria-selected="' + (i === suggNomActive) + '"' +
          (i === suggNomActive ? ' class="is-active"' : '') + '><span>' + esc(s.nom) + '</span></li>').join('')
      : '<li class="sugg-vide">Aucun nom ne correspond</li>';
    liste.classList.remove('hidden');
    $('#nommage-saisie').setAttribute('aria-expanded', 'true');
  }

  function fermerSuggestionsNom() {
    const liste = $('#nommage-suggestions');
    liste.classList.add('hidden');
    liste.innerHTML = '';
    $('#nommage-saisie').setAttribute('aria-expanded', 'false');
    suggNom = [];
    suggNomActive = -1;
  }

  function brancherNommage() {
    const champ = $('#nommage-saisie');
    champ.addEventListener('input', majSuggestionsNom);
    champ.addEventListener('blur', fermerSuggestionsNom);
    champ.addEventListener('keydown', (e) => {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && suggNom.length) {
        e.preventDefault();
        suggNomActive = (suggNomActive + (e.key === 'ArrowDown' ? 1 : -1) + suggNom.length) % suggNom.length;
        dessinerSuggestionsNom();
      } else if (e.key === 'Escape') {
        fermerSuggestionsNom();
      }
    });
    // Entrée : la suggestion surlignée si la liste est ouverte, sinon le texte tapé
    $('#nommage').addEventListener('submit', (e) => {
      e.preventDefault();
      if (jeu && jeu.verrou) return avancer();
      const choix = suggNomActive >= 0 ? suggNom[suggNomActive].nom : champ.value;
      repondreNom(choix);
    });
    // mousedown (et non click) : le champ garde le focus, la liste ne se ferme pas avant le choix
    $('#nommage-suggestions').addEventListener('mousedown', (e) => {
      e.preventDefault();
      const li = e.target.closest('[data-nom]');
      if (li) repondreNom(li.dataset.nom);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Mode « Apprendre » : carte cliquable, fiche de la zone, recherche   */
  /* ------------------------------------------------------------------ */
  let suggestions = [];           // résultats de recherche affichés
  let suggestionActive = -1;      // index de la suggestion surlignée (clavier)

  // Pour la recherche : sans accents ni majuscules, tirets et apostrophes = espaces
  const normaliser = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[-'’\s]+/g, ' ').trim();

  function ouvrirApprentissage(id) {
    const def = apprentissages.find((a) => a.id === id);
    if (!def) return;
    if (jeu) { jeu.actif = false; clearInterval(jeu.chrono); clearTimeout(jeu.minuteur); }

    $('#learn-titre').textContent = def.titre;
    $('#learn-search').value = '';
    $('#learn-search').placeholder = def.recherche || 'Rechercher…';
    $('#learn-credit').textContent = def.credit || '';
    $('#learn-legende-liens').textContent = def.libelleLiens || 'frontalier';
    $('#screen-learn').dataset.module = def.id;         // permet des couleurs propres au module (css)
    fermerSuggestions();
    afficher('screen-learn');

    const c = GeoCarte.obtenir(def.carte);
    if (!c) {
      apprendre = null;
      console.error('core.js : carte introuvable « ' + def.carte + ' » : vérifiez que son fichier (dossier data/) est référencé dans index.html');
      $('#learn-fiche').innerHTML = '<p class="status-error">⚠️ Cette carte n\'est pas disponible pour le moment.</p>';
      return;
    }
    apprendre = def;
    activite = null;
    $('#screen-learn').appendChild($('#map-wrap'));   // la carte est partagée avec le quiz
    construireSVG(c, def, true);
    preparerFiltres(def);
    selectionner(null, false);
  }

  // Filtres (cases à cocher) : un par valeur déclarée dans def.types, lue dans la propriété
  // def.champFiltre des zones (par défaut leur type) ; masqués sinon
  const valeurFiltre = (z) => {
    const v = z.brut[(apprendre && apprendre.champFiltre) || 'type'];
    return v === undefined ? null : String(v);
  };

  function preparerFiltres(def) {
    const boite = $('#learn-filtres');
    boite.innerHTML = '';
    boite.classList.toggle('hidden', !def.types);
    if (!def.types) return;
    Object.keys(def.types).forEach((type) => {
      const n = [...zones.values()].filter((z) => valeurFiltre(z) === type).length;
      if (!n) return;
      const label = document.createElement('label');
      label.className = 'chip-check';
      const coche = document.createElement('input');
      coche.type = 'checkbox';
      coche.value = type;
      coche.checked = true;
      const texte = document.createElement('span');
      texte.textContent = def.types[type] + ' · ' + n;
      label.append(coche, texte);
      boite.appendChild(label);
    });
  }

  // Zones décochées : masquées, ou seulement estompées et non cliquables (def.filtresEstompes : pas de
  // trou dans la carte, ex. une mer décochée au milieu des autres)
  function appliquerFiltres() {
    const actifs = new Set([...document.querySelectorAll('#learn-filtres input:checked')].map((i) => i.value));
    const classe = apprendre.filtresEstompes ? 'filtre-off' : 'masque';
    zones.forEach((z) => { const v = valeurFiltre(z); if (v !== null) z.el.classList.toggle(classe, !actifs.has(v)); });
    svg.querySelectorAll('.etiquette').forEach((t) => t.classList.toggle('masque', !actifs.has(t.dataset.filtre)));
    if (selection && !visible(selection)) selectionner(null, false);
    else selectionner(selection, false);            // remet à jour la fiche et les zones liées
  }

  const visible = (code) => zones.has(code) && !zones.get(code).el.classList.contains('masque') &&
    !zones.get(code).el.classList.contains('filtre-off');

  // Affiche la fiche d'une zone (null : aucune) ; cadrer = true : la carte se centre dessus
  function selectionner(code, cadrer) {
    zones.forEach((z) => { z.el.dataset.state = 'idle'; z.el.classList.remove('survol'); });
    selection = code && visible(code) ? code : null;
    afficherFiche();                              // marque aussi les zones liées (voisines)
    if (!selection) return;
    etat(selection, 'selected');
    if (cadrer) cadrerZone(selection);
  }

  function afficherFiche() {
    const boite = $('#learn-fiche');
    if (!selection) {
      boite.innerHTML =
        '<div class="fiche-vide">' +
          '<div class="fiche-vide__icone" aria-hidden="true">👆</div>' +
          '<p>Cliquez sur la carte ou utilisez la recherche pour afficher la fiche d\'un des ' +
          [...zones.keys()].filter(visible).length + ' ' + esc(apprendre.unite || 'territoires') + '.</p>' +
        '</div>';
      return;
    }
    const z = zones.get(selection);
    const f = (typeof apprendre.fiche === 'function' && apprendre.fiche(z.brut)) || {};
    let html =
      '<div class="fiche-head">' +
        '<span class="fiche-code">' + esc(f.badge || selection) + '</span>' +
        '<div>' +
          '<h2 class="fiche-nom">' + esc(z.nom) + '</h2>' +
          (f.sousTitre ? '<p class="fiche-sous">' + esc(f.sousTitre) + '</p>' : '') +
        '</div>' +
      '</div>' +
      '<dl class="fiche-liste">';
    (f.lignes || []).forEach((l) => {
      html += '<div class="fiche-ligne"><dt>' + esc(l.libelle) + '</dt><dd>';
      if (l.liens) {
        const liens = l.liens.filter(visible);
        liens.forEach((c) => etat(c, 'voisin'));
        html += liens.length
          ? '<span class="liens">' + liens.map((c) =>
              '<button type="button" class="lien-zone" data-zone="' + esc(c) + '">' + esc(zones.get(c).nom) +
                (zones.get(c).brut.type ? '' : ' <small>(' + esc(c) + ')</small>') + '</button>').join('') + '</span>'
          : '<span class="fiche-detail">' + esc(l.vide || 'Aucun') + '</span>';
        if (liens.length && l.detail) html += '<span class="fiche-detail">' + esc(l.detail) + '</span>';
      } else {
        html += esc(l.valeur) + (l.detail ? '<span class="fiche-detail">' + esc(l.detail) + '</span>' : '');
      }
      html += '</dd></div>';
    });
    boite.innerHTML = html + '</dl>';
    boite.scrollTop = 0;
  }

  // Zoom sur une zone (les très petites, comme Paris, restent lisibles dans leur contexte). Le cadre
  // vient des données (un pays et non ses territoires lointains), pas du dessin.
  function cadrerZone(code) {
    if (!zones.has(code)) return;
    const [x0, y0, x1, y1] = cadreZone(code);
    const ratio = base.h / base.w;
    const w = Math.min(base.w, Math.max(base.w / 7, Math.max(x1 - x0, (y1 - y0) / ratio) * 3));
    const h = w * ratio;
    vue = { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
    limiterVue();
    appliquerVue();
  }

  // Résultats : code exact, puis nom qui commence par la saisie, puis mot du nom, puis contenu ;
  // les autres noms (def.alias, ex. « Myanmar » pour la Birmanie) passent juste après le nom
  function chercher(texte) {
    const q = normaliser(texte);
    if (!q) return [];
    const res = [];
    const scoreNom = (n) => {
      const nom = normaliser(n);
      if (nom.startsWith(q)) return 1;
      if (nom.split(' ').some((m) => m.startsWith(q))) return 2;
      if (nom.includes(q)) return 3;
      return -1;
    };
    zones.forEach((z, code) => {
      if (!visible(code)) return;                 // types décochés dans les filtres : ignorés
      const c = code.toLowerCase();
      let score = c === q ? 0 : scoreNom(z.nom);
      ((apprendre.alias || {})[code] || []).forEach((a) => {
        const s = scoreNom(a);
        if (s >= 0 && (score < 0 || s + 0.5 < score)) score = s + 0.5;
      });
      if (score < 0 && c.startsWith(q)) score = 4;
      if (score >= 0) res.push({ code, nom: z.nom, score });
    });
    return res.sort((a, b) => a.score - b.score || a.nom.localeCompare(b.nom, 'fr')).slice(0, 8);
  }

  // À droite d'une suggestion : def.etiquette(zone) si le module la fournit (ex. le continent d'un pays),
  // sinon le type de la zone (« Fleuve »), sinon son code (« 54 »)
  function etiquetteZone(code) {
    const brut = zones.get(code).brut;
    if (typeof apprendre.etiquette === 'function') return apprendre.etiquette(brut);
    return brut.type ? ((apprendre.nomsTypes || {})[brut.type] || brut.type) : code;
  }

  function majSuggestions() {
    suggestions = chercher($('#learn-search').value);
    suggestionActive = suggestions.length ? 0 : -1;
    dessinerSuggestions();
  }

  function dessinerSuggestions() {
    const champ = $('#learn-search');
    const liste = $('#learn-suggestions');
    if (!champ.value.trim()) return fermerSuggestions();
    liste.innerHTML = suggestions.length
      ? suggestions.map((s, i) =>
          '<li role="option" id="sugg-' + i + '" data-zone="' + esc(s.code) + '"' +
          ' aria-selected="' + (i === suggestionActive) + '"' + (i === suggestionActive ? ' class="is-active"' : '') + '>' +
            '<span>' + esc(s.nom) + '</span><span class="sugg-code">' + esc(etiquetteZone(s.code)) + '</span>' +
          '</li>').join('')
      : '<li class="sugg-vide">Aucun résultat</li>';
    liste.classList.remove('hidden');
    champ.setAttribute('aria-expanded', 'true');
    if (suggestionActive >= 0) champ.setAttribute('aria-activedescendant', 'sugg-' + suggestionActive);
    else champ.removeAttribute('aria-activedescendant');
  }

  function fermerSuggestions() {
    const liste = $('#learn-suggestions');
    liste.classList.add('hidden');
    liste.innerHTML = '';
    $('#learn-search').setAttribute('aria-expanded', 'false');
    $('#learn-search').removeAttribute('aria-activedescendant');
    suggestions = [];
    suggestionActive = -1;
  }

  function choisirSuggestion(code) {
    selectionner(code, true);
    $('#learn-search').value = zones.get(code).nom;
    fermerSuggestions();
  }

  function brancherApprentissage() {
    const champ = $('#learn-search');
    champ.addEventListener('input', majSuggestions);
    champ.addEventListener('focus', () => { if (champ.value.trim()) majSuggestions(); });
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
        if (suggestionActive >= 0) choisirSuggestion(suggestions[suggestionActive].code);
      } else if (e.key === 'Escape') {
        fermerSuggestions();
      }
    });
    // mousedown (et non click) : le champ garde le focus, la liste ne se ferme pas avant le choix
    $('#learn-suggestions').addEventListener('mousedown', (e) => {
      e.preventDefault();
      const li = e.target.closest('[data-zone]');
      if (li) choisirSuggestion(li.dataset.zone);
    });

    $('#learn-filtres').addEventListener('change', appliquerFiltres);

    // Fiche : les départements frontaliers sont cliquables et surlignés sur la carte au survol
    const fiche = $('#learn-fiche');
    fiche.addEventListener('click', (e) => {
      const b = e.target.closest('[data-zone]');
      if (b) selectionner(b.dataset.zone, true);
    });
    const survol = (e, actif) => {
      const b = e.target.closest('[data-zone]');
      const z = b && zones.get(b.dataset.zone);
      if (z) z.el.classList.toggle('survol', actif);
    };
    fiche.addEventListener('mouseover', (e) => survol(e, true));
    fiche.addEventListener('mouseout', (e) => survol(e, false));

    // Échap : referme la fiche
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && apprendre && e.target !== champ &&
          !$('#screen-learn').classList.contains('hidden')) selectionner(null, false);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Jeux à part (ex. Le Grand Chemin) : écran propre, carte partagée     */
  /* ------------------------------------------------------------------ */
  // Outils mis à disposition des jeux (def.ouvrir(api))
  const API_JEU = {
    carte: (c, def) => construireSVG(c, def, false),   // construit la carte (zones cliquables)
    zones,                                             // code -> { nom, el, cx, cy, brut }
    etat,                                              // etat(code, 'valeur') : attribut data-state
    reinitialiserVue,
    cadrer: (code) => cadrerZone(code),
    cadrerSur: (codes) => { vueDepart = vueSur(codes); reinitialiserVue(); },   // vue de départ sur ces zones (⤢ y revient)
    esc,
    normaliser: (s) => normaliser(s),                  // texte sans accents ni majuscules (recherche)
    suggestions: (texte, entrees) => filtrerNoms(texte, entrees)   // suggestions de noms, comme le nommage
  };

  function ouvrirJeu(id) {
    const def = jeux.find((j) => j.id === id);
    if (!def) return;
    if (jeu) { jeu.actif = false; clearInterval(jeu.chrono); clearTimeout(jeu.minuteur); }
    apprendre = null;
    activite = def;
    afficher(def.ecran);
    if (!def.sansCarte) $('#' + def.ecran).appendChild($('#map-wrap'));   // carte partagée avec les autres écrans
    def.ouvrir(API_JEU);
  }

  /* ------------------------------------------------------------------ */
  /* Interface                                                           */
  /* ------------------------------------------------------------------ */
  function brancherInterface() {
    $('#btn-quit').addEventListener('click', quitter);
    $('#btn-action').addEventListener('click', () => {
      if (!jeu || !jeu.actif) return;
      if (jeu.verrou) avancer();
      else if (jeu.jeuType === 'nommage') repondreNom(null);
      else repondre(null);
    });

    // Sélecteur de nombre : curseur et champ numérique restent synchronisés
    const curseur = $('#count-range');
    const champ = $('#count-input');
    const nombreChoisi = () => {
      const v = parseInt(champ.value, 10);
      return Math.min(+curseur.max, Math.max(+curseur.min, isNaN(v) ? +curseur.value : v));
    };
    curseur.addEventListener('input', () => { champ.value = curseur.value; majRaccourcis(); });
    champ.addEventListener('input', () => {
      const v = parseInt(champ.value, 10);
      if (!isNaN(v)) curseur.value = Math.min(+curseur.max, Math.max(+curseur.min, v));
    });
    champ.addEventListener('change', () => { champ.value = curseur.value = nombreChoisi(); majRaccourcis(); });
    // − et +, raccourcis (10, 20, 30, 50, tous)
    const choisirNombre = (n) => { champ.value = n; champ.dispatchEvent(new Event('change')); };
    document.querySelectorAll('[data-pas]').forEach((b) => {
      b.addEventListener('click', () => { if (!champ.disabled) choisirNombre(nombreChoisi() + Number(b.dataset.pas)); });
    });
    $('#nombre-raccourcis').addEventListener('click', (e) => {
      const b = e.target.closest('[data-nombre]');
      if (b && !champ.disabled) choisirNombre(b.dataset.nombre === 'max' ? +curseur.max : Number(b.dataset.nombre));
    });
    const lancer = () => {
      if (partieType === 'record') {
        return demarrer({ jeu: jeuType, record: true, codes: codesPerimetre(), estompe: true,
          perimetre: { id: perimetre, nom: nomPerimetre() } });
      }
      const ordonne = $('#opt-ordre').checked;
      const unite = categorie.unite || 'zones';
      if (mode === 'groupes') {
        const codes = codesChoisis();
        const groupes = [...document.querySelectorAll('#groupes-liste input:checked')].map((i) => i.value);
        if (codes.length) {
          demarrer({ jeu: jeuType, nombre: codes.length, ordonne, codes, estompe: true,
            description: (categorie.nomGroupes || 'groupes') + ' : ' + groupes.join(', ') });
        }
      } else {
        const n = nombreChoisi();
        derniereTaille = n;
        demarrer({ jeu: jeuType, nombre: n, ordonne, codes: codesNombre(), estompe: false, description: n + ' ' + unite + ' au hasard' });
      }
    };
    $('#btn-start').addEventListener('click', lancer);
    $('#opt-extras').addEventListener('change', majPlage);

    // Façon de jouer, mode (occasionnel / record), périmètre du record
    document.querySelectorAll('.mode-btn[data-jeu-type]').forEach((b) => {
      b.addEventListener('click', () => definirJeuType(b.dataset.jeuType));
    });
    $('#opt-record').addEventListener('change', (e) => {
      try { localStorage.setItem(CLE_RECORD, e.target.checked ? '1' : '0'); } catch (err) { /* valable pour la session */ }
      definirPartieType(e.target.checked ? 'record' : 'occasionnel');
    });
    $('#record-perimetres').addEventListener('change', (e) => {
      if (e.target.name !== 'perimetre') return;
      perimetre = e.target.value;
      majRecords();
      majBoutonLancer();
      majMiniCarte();
    });

    // Mini-carte : un clic coche ou décoche la région (record : la choisit, un second clic revient à « tout »)
    document.querySelectorAll('[data-mini-carte]').forEach((place) => {
      place.addEventListener('click', (e) => {
        const z = e.target.closest('[data-groupe]');
        if (!z) return;
        const g = z.dataset.groupe;
        if (partieType === 'record') {
          const cible = perimetre === g ? 'tout' : g;
          const r = [...document.querySelectorAll('#record-perimetres input')].find((i) => i.value === cible);
          if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
        } else {
          const c = [...document.querySelectorAll('#groupes-liste input')].find((i) => i.value === g);
          if (c) { c.checked = !c.checked; c.dispatchEvent(new Event('change', { bubbles: true })); }
        }
      });
      place.addEventListener('mouseover', (e) => {
        const z = e.target.closest('[data-groupe]');
        survolerGroupe(z ? z.dataset.groupe : null);
      });
      place.addEventListener('mouseleave', () => survolerGroupe(null));
    });

    // Mode de sélection (par nombre / par groupes) et cases des groupes
    document.querySelectorAll('.mode-btn[data-mode]').forEach((b) => {
      b.addEventListener('click', () => definirMode(b.dataset.mode));
    });
    $('#groupes-liste').addEventListener('change', () => { majBoutonLancer(); majMiniCarte(); });
    document.querySelectorAll('[data-groupes]').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#groupes-liste input').forEach((i) => { i.checked = b.dataset.groupes === 'tout'; });
        majBoutonLancer();
        majMiniCarte();
      });
    });
    champ.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !$('#btn-start').disabled) lancer(); });

    // data-action="menu" : retour au menu, sur la grande catégorie en cours
    // (ou sur celle de data-menu-categorie, que js/menu.js sélectionne)
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      switch (el.dataset.action) {
        case 'menu': afficher('screen-menu'); break;
        case 'setup': afficher('screen-setup'); break;
        case 'replay': if (derniereConfig) demarrer(derniereConfig); break;
      }
    });
  }

  function init() {
    svg = $('#map');
    brancherCarte();
    brancherInterface();
    brancherApprentissage();
    brancherNommage();
    // Changement de profil (bouton de compte) : records de l'écran de choix remis à jour
    if (window.GeoProfils) GeoProfils.surChangement(() => { if (categorie) majRecords(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
