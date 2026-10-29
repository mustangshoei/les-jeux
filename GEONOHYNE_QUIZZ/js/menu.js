/* ==========================================================================
   menu.js — Le menu « Atlas en relief » : chapitres, carte des régions, cartes

   Le menu est une suite de CHAPITRES (grandes catégories). En haut : la liste des chapitres
   et, à côté, l'IMAGE du chapitre choisi : une carte en relief dessinée à partir des données
   (image : 'france' = les régions, 'monde' = les continents, 'apprendre' = les fleuves et les mers ;
   voir IMAGES), avec sa légende. En dessous : le chapitre choisi et ses cartes. Chaque carte est :
     { quiz: 'id' }       catégorie de quiz        (GeoNohyne.registerCategory)
     { jeu: 'id' }        jeu à part               (GeoNohyne.registerJeu)
     { apprendre: 'id' }  module d'exploration     (GeoNohyne.registerApprentissage)
     { page: 'id' }       page                     (GeoNohyne.registerPage)
   Les statistiques ne sont pas dans le menu : elles s'ouvrent depuis le menu du compte (js/compte.js).
   et peut préciser :
     icone   pictogramme de la vignette (une clé de ICONES)
     teinte  couleur de la vignette (une clé de TEINTES)
     meta    repères affichés en bas de la carte (par défaut : selon le type, voir META)

   RÈGLE : une carte est active dès que le module de même type et de même id est chargé ;
   elle affiche alors le titre et la description du module. Sinon elle reste GRISÉE (cadenas,
   badge « Bientôt ») et affiche le titre et la description donnés ici.

   POUR AJOUTER, DÉPLACER OU RENOMMER UNE CARTE OU UN CHAPITRE : modifier MENU.
   Ce fichier est chargé en dernier dans index.html : il affiche les modules chargés avant lui.
   ========================================================================== */
(function () {
  'use strict';

  const MENU = [
    {
      id: 'france',
      titre: 'La France et sa géographie',
      description: 'Quiz et jeux sur la carte de France : départements, fleuves, préfectures…',
      unite: ['jeu', 'jeux'],
      image: 'france',
      cartes: [
        { quiz: 'departements', icone: 'carte', teinte: 'ciel' },               // js/france/quiz-departements.js
        { quiz: 'fleuves', icone: 'vagues', teinte: 'lagon' },                  // js/france/quiz-fleuves.js
        { jeu: 'grand-chemin', icone: 'chemin', teinte: 'corail', meta: '3 à 15 sauts · détours' },   // js/france/grand-chemin.js
        { jeu: 'morpion', icone: 'grille', teinte: 'lavande', meta: 'Solo · Duel' },                // js/france/morpion.js
        { jeu: 'liste', icone: 'liste', teinte: 'sable', meta: 'Chrono · indices' },                 // js/france/liste.js
        { jeu: 'codage', icone: 'diese', teinte: 'prairie', meta: '3 à 30 s par question' },         // js/france/codage.js
        { jeu: 'entonnoir', icone: 'entonnoir', teinte: 'ocre', meta: '4 à 7 étapes' }               // js/france/entonnoir.js
      ]
    },
    {
      id: 'monde',
      titre: 'Le monde et ses pays',
      description: 'Quiz et jeux sur la carte du monde : pays, capitales, océans et mers…',
      unite: ['jeu', 'jeux'],
      image: 'monde',
      cartes: [
        { quiz: 'pays', icone: 'globe', teinte: 'azur' },                       // js/monde/quiz-pays.js
        { quiz: 'capitales',         titre: 'Les capitales du monde', description: 'Retrouvez la capitale de chaque pays.' },
        { jeu: 'morpion-monde',      titre: 'Le morpion du monde',    description: 'Tic-tac-toe géographique avec les pays du monde, en solo ou à deux.' },
        { jeu: 'grand-chemin-monde', titre: 'Le Grand Chemin',        description: 'Reliez deux pays de voisin en voisin, par le chemin le plus court.' },
        { quiz: 'oceans-mers', icone: 'ancre', teinte: 'lagon' }                // js/monde/quiz-oceans-mers.js
      ]
    },
    {
      id: 'apprendre',
      titre: 'Apprendre',
      description: 'Explorez les cartes librement et consultez la fiche de chaque territoire.',
      unite: ['module', 'modules'],
      image: 'apprendre',
      cartes: [
        { apprendre: 'departements', icone: 'repere', teinte: 'corail' },       // js/apprendre/departements.js
        { apprendre: 'fleuves-oceans', icone: 'goutte', teinte: 'ciel' },       // js/apprendre/fleuves-oceans.js (France)
        { apprendre: 'pays', icone: 'globe', teinte: 'prairie' },               // js/apprendre/pays.js
        { apprendre: 'mers-monde', icone: 'ancre', teinte: 'lavande' }          // js/apprendre/mers-monde.js
      ]
    }
  ];

  // Repères par défaut, en bas des cartes actives
  const META = { quiz: 'Ciblage · Nommage · Record', apprendre: 'Carte libre · Fiches' };

  // Vignettes : [couleur, ombre portée (relief)]
  const TEINTES = {
    ciel: ['#6cc7e0', '#2f7f96'],
    lagon: ['#3fb6a8', '#1f7469'],
    corail: ['#f08a6b', '#a5492f'],
    lavande: ['#b48ad8', '#6f4b94'],
    sable: ['#f2c56b', '#a07a2a'],
    prairie: ['#9bd36b', '#5b8a32'],
    ocre: ['#e8b04a', '#9a6c16'],
    azur: ['#8fb5e8', '#4a6f9e'],
    rose: ['#e9a1b5', '#9c5468']
  };

  // Pictogrammes (traits sur une grille de 24 × 24)
  const ICONES = {
    carte: '<path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4z"/><path d="M9 4v13.5M15 6.5V20"/>',
    vagues: '<path d="M2 9c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0"/><path d="M2 15c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0"/>',
    chemin: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16"/>',
    grille: '<path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
    liste: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    diese: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    entonnoir: '<path d="M3 4h18l-7 8.5V19l-4 2v-8.5L3 4z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    ancre: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M8 11h8M5 14a7 7 0 0 0 14 0"/>',
    repere: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    goutte: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
    boussole: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    cadenas: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    fleche: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };

  // Images des chapitres : une couleur par région, par continent ; les noms affichés sur les cartes
  // (les autres régions sont trop petites, les autres cours d'eau trop nombreux)
  const COULEURS_REGIONS = {
    'Hauts-de-France': '#f2c56b', 'Normandie': '#8fb5e8', 'Île-de-France': '#ff7a59', 'Grand Est': '#5fa8d3',
    'Bretagne': '#3fb6a8', 'Pays de la Loire': '#e9a1b5', 'Centre-Val de Loire': '#c9d97a',
    'Bourgogne-Franche-Comté': '#b48ad8', 'Nouvelle-Aquitaine': '#e8b04a', 'Auvergne-Rhône-Alpes': '#6cc7e0',
    'Occitanie': '#f08a6b', 'Provence-Alpes-Côte d\'Azur': '#9bd36b', 'Corse': '#ffd88a'
  };
  const REGIONS_NOMMEES = ['Bretagne', 'Normandie', 'Grand Est', 'Nouvelle-Aquitaine', 'Occitanie', 'Auvergne-Rhône-Alpes'];
  const COULEURS_CONTINENTS = {
    'Europe': '#8fb5e8', 'Afrique': '#e8b04a', 'Asie': '#f08a6b',
    'Amérique du Nord': '#6cc7e0', 'Amérique du Sud': '#9bd36b', 'Océanie': '#b48ad8'
  };
  const COURS_NOMMES = ['seine', 'loire', 'garonne', 'rhone'];          // codes de data/france/carte-hydrographie.js
  const MERS_NOMMEES = ['manche', 'atlantique', 'mediterranee'];

  const TYPES = ['quiz', 'jeu', 'apprendre', 'page'];
  const CLE = 'geonohyne.menu.categorie';         // dernier chapitre affiché (mémorisé)

  const $ = (sel) => document.querySelector(sel);

  let liste = null;                             // liste des chapitres (boutons)
  let grille = null;                            // cartes du chapitre affiché
  let courant = -1;                             // index du chapitre affiché

  const sansAnimation = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const deuxChiffres = (n) => (n < 10 ? '0' : '') + n;
  const compte = (n, unite) => deuxChiffres(n) + ' ' + unite[n > 1 ? 1 : 0];

  function lireMemoire() {
    try { return localStorage.getItem(CLE); } catch (e) { return null; }
  }
  function ecrireMemoire(id) {
    try { localStorage.setItem(CLE, id); } catch (e) { /* stockage indisponible : valable pour la session */ }
  }

  function element(balise, classe, texte) {
    const el = document.createElement(balise);
    if (classe) el.className = classe;
    if (texte !== undefined) el.textContent = texte;
    return el;
  }

  function pictogramme(nom) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONES[nom] || ICONES.boussole) + '</svg>';
  }

  /* ---------- Cartes du chapitre ---------- */

  // Une carte : active si son module est chargé (textes du module), sinon grisée (textes de MENU).
  // numero : « 1.3 » ; rang : place dans la grille (décalage de l'apparition)
  function creerCarte(entree, numero, rang) {
    const type = TYPES.find((t) => entree[t]);
    const id = entree[type];
    const def = GeoNohyne.trouver(type, id);
    const el = element(def ? 'button' : 'div', 'carte' + (def ? '' : ' carte--bientot'));
    el.style.setProperty('--rang', rang);
    if (def) {
      el.type = 'button';
      el.dataset.type = type;
      el.dataset.id = id;
    } else {
      el.setAttribute('aria-disabled', 'true');
    }

    const vignette = element('span', 'carte-icone');
    if (def) {
      const t = TEINTES[entree.teinte] || TEINTES.ciel;
      vignette.style.setProperty('--teinte', t[0]);
      vignette.style.setProperty('--teinte-ombre', t[1]);
    }
    vignette.innerHTML = pictogramme(def ? entree.icone : 'cadenas');
    const haut = element('span', 'carte-haut');
    haut.append(element('span', 'carte-index', numero), vignette);

    const bas = element('span', 'carte-bas');
    if (def) {
      const aller = element('span', 'carte-go');
      aller.innerHTML = pictogramme('fleche');
      bas.append(element('span', 'carte-meta', entree.meta || META[type] || ''), aller);
    } else {
      bas.append(element('span', 'carte-bientot', 'Bientôt'));
    }

    el.append(
      haut,
      element('span', 'carte-titre', (def && def.titre) || entree.titre || id),
      element('span', 'carte-desc', (def && def.description) || entree.description || ''),
      bas
    );
    return el;
  }

  /* ---------- Chapitres ---------- */

  function creerChapitres() {
    MENU.forEach((c, i) => {
      const b = element('button', 'chapitre-ligne');
      b.type = 'button';
      b.dataset.index = i;
      b.append(
        element('span', 'chapitre-num', deuxChiffres(i + 1)),
        element('span', 'chapitre-nom', c.titre),
        element('span', 'chapitre-nb', compte(c.cartes.length, c.unite))
      );
      liste.appendChild(b);
    });
  }

  // Affiche le chapitre n° index (en boucle). defiler : amène les cartes à l'écran si elles n'y sont pas.
  function aller(index, defiler) {
    index = (index + MENU.length) % MENU.length;
    if (index !== courant) {
      courant = index;
      const c = MENU[index];
      ecrireMemoire(c.id);
      liste.querySelectorAll('[data-index]').forEach((b, i) => {
        if (i === index) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });

      $('#chapitre-numero').textContent = 'Chapitre ' + deuxChiffres(index + 1);
      $('#chapitre-titre').textContent = c.titre;
      $('#chapitre-desc').textContent = c.description;
      const cartes = c.cartes.map((e, i) => creerCarte(e, (index + 1) + '.' + (i + 1), i));
      const dispo = cartes.filter((el) => el.dataset.type).length;
      $('#chapitre-compte').replaceChildren(
        compte(cartes.length, c.unite) + ' · ',
        element('span', 'chapitre-dispo', deuxChiffres(dispo) + ' disponible' + (dispo > 1 ? 's' : ''))
      );
      grille.replaceChildren(...cartes);
      afficherImage(c.image);
    }
    if (defiler) {
      const tete = $('#menu-chapitre');
      if (tete.getBoundingClientRect().top > window.innerHeight - 160) {
        tete.scrollIntoView({ behavior: sansAnimation() ? 'auto' : 'smooth', block: 'start' });
      }
    }
  }

  /* ---------- Image du chapitre : une carte en relief ---------- */

  // Chaque image est dessinée à partir des données déjà chargées et rend :
  //   { cadre: [x, y, largeur, hauteur] (coordonnées de la carte), calques: contenu du <svg>,
  //     etiquettes: [{ texte, x, y, classe }], point: { x, y } (point et onde) ou null,
  //     legende, description (lecteurs d'écran), large (carte en longueur) }
  // ou null si ses données manquent : l'image est alors cachée.
  const IMAGES = { france: imageFrance, monde: imageMonde, apprendre: imageApprendre };
  const RESERVE = Object.values(TEINTES).map((t) => t[0]);    // région ou continent sans couleur attitrée

  const chemins = (els, classe) => els.map((e) => '<path' + (classe ? ' class="' + classe + '"' : '') + ' d="' + e.d + '"/>').join('');
  const moyenne = (els, k) => els.reduce((s, e) => s + e[k], 0) / els.length;
  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');

  // Cadre [x0, y0, x1, y1] de tracés SVG (« M x y L x y … »)
  function cadreDe(traces) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    traces.forEach((d) => {
      const n = d.match(/-?\d+(?:\.\d+)?/g) || [];
      for (let i = 0; i + 1 < n.length; i += 2) {
        const x = +n[i], y = +n[i + 1];
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    });
    return [x0, y0, x1, y1];
  }
  const avecMarge = (b, m) => [b[0] - m, b[1] - m, b[2] - b[0] + 2 * m, b[3] - b[1] + 2 * m];

  // Départements de métropole, groupés par région (les groupes du quiz des départements) ; calculé une fois
  let metro;
  function metropole() {
    if (metro !== undefined) return metro;
    const carte = window.GeoCarte && GeoCarte.obtenir('france-departements');
    const quiz = GeoNohyne.trouver('quiz', 'departements');
    if (!carte || !quiz || !quiz.groupes) return (metro = null);
    const outreMer = new Set((quiz.zonesOptionnelles && quiz.zonesOptionnelles.codes) || []);
    const parCode = {};
    carte.elements.forEach((e) => { parCode[e.code] = e; });
    const regions = Object.keys(quiz.groupes)
      .map((nom) => ({ nom, deps: quiz.groupes[nom].filter((c) => parCode[c] && parCode[c].d && !outreMer.has(c)).map((c) => parCode[c]) }))
      .filter((r) => r.deps.length);
    const deps = [].concat(...regions.map((r) => r.deps));
    return (metro = { carte, parCode, regions, deps, outreMer, cadre: avecMarge(cadreDe(deps.map((e) => e.d)), 14) });
  }

  // « La France et sa géographie » : les régions, une couleur chacune ; Paris
  function imageFrance() {
    const m = metropole();
    if (!m) return null;
    const nbOutreMer = m.carte.elements.filter((e) => m.outreMer.has(e.code)).length;
    return {
      cadre: m.cadre,
      calques: m.regions.map((r, i) => '<g fill="' + (COULEURS_REGIONS[r.nom] || RESERVE[i % RESERVE.length]) + '">' + chemins(r.deps) + '</g>').join(''),
      etiquettes: REGIONS_NOMMEES.map((nom) => m.regions.find((r) => r.nom === nom)).filter(Boolean)
        .map((r) => ({ texte: r.nom, x: moyenne(r.deps, 'cx'), y: moyenne(r.deps, 'cy') })),
      point: m.parCode['75'] ? { x: m.parCode['75'].cx, y: m.parCode['75'].cy } : null,
      legende: m.regions.length + ' régions · ' + m.deps.length + ' départements métropolitains' +
        (nbOutreMer ? ' · ' + nbOutreMer + ' d\'Outre-Mer' : ''),
      description: 'Carte de France métropolitaine en relief, une couleur par région'
    };
  }

  // « Le monde et ses pays » : les pays, une couleur par continent ; la France
  function imageMonde() {
    const carte = window.GeoCarte && GeoCarte.obtenir('monde-pays');
    const infos = (window.GeoInfos || {})['monde-pays'];
    if (!carte || !infos) return null;
    const continents = {};
    carte.elements.filter((e) => e.d).forEach((e) => {
      const c = (infos.zones[e.code] || {}).continent;
      if (c) (continents[c] = continents[c] || []).push(e);
    });
    const noms = Object.keys(continents);
    // Nom d'un continent : au centre de ses pays, chacun pesant selon sa taille (racine de l'aire de son cadre)
    const centre = (pays) => {
      let poids = 0, x = 0, y = 0;
      pays.forEach((e) => {
        const b = e.cadre || cadreDe([e.d]);
        const p = Math.sqrt((b[2] - b[0]) * (b[3] - b[1])) || 1;
        poids += p; x += p * e.cx; y += p * e.cy;
      });
      return { x: x / poids, y: y / poids };
    };
    const v = carte.vue || { x: 0, y: 0, w: carte.largeur, h: carte.hauteur };
    const france = carte.elements.find((e) => e.code === 'FRA');
    const mers = window.GeoCarte.obtenir('monde-mers');
    return {
      cadre: [v.x, v.y, v.w, v.h],
      large: true,
      calques: noms.map((nom, i) => '<g fill="' + (COULEURS_CONTINENTS[nom] || RESERVE[i % RESERVE.length]) + '">' + chemins(continents[nom]) + '</g>').join(''),
      etiquettes: noms.map((nom) => Object.assign({ texte: nom }, centre(continents[nom]))),
      point: france ? { x: france.cx, y: france.cy } : null,
      legende: carte.elements.length + ' pays · ' + noms.length + ' continents' + (mers ? ' · ' + mers.elements.length + ' océans, mers, golfes et détroits' : ''),
      description: 'Carte du monde en relief, une couleur par continent'
    };
  }

  // « Apprendre » : la France et ses fleuves et rivières, le nom des grands fleuves et des mers
  function imageApprendre() {
    const m = metropole();
    const hydro = window.GeoCarte && GeoCarte.obtenir('france-hydrographie');
    if (!m || !hydro) return null;
    const cours = hydro.elements.filter((e) => e.ligne && e.d);
    const parCode = {};
    hydro.elements.forEach((e) => { parCode[e.code] = e; });
    // Les fiches des modules « Apprendre » du menu : une par zone de leur carte
    const modules = [].concat(...MENU.map((c) => c.cartes)).filter((e) => e.apprendre)
      .map((e) => GeoNohyne.trouver('apprendre', e.apprendre)).filter(Boolean);
    const fiches = modules.reduce((s, d) => { const c = GeoCarte.obtenir(d.carte); return s + (c ? c.elements.length : 0); }, 0);
    // Les cours d'eau sont coupés à la frontière : hors de France, il n'y a pas de terre dessous
    return {
      cadre: m.cadre,
      calques: '<defs><clipPath id="relief-france"><path d="' + m.deps.map((e) => e.d).join('') + '"/></clipPath></defs>' +
        '<g class="relief-terre">' + chemins(m.deps) + '</g><g clip-path="url(#relief-france)">' +
        chemins(cours.filter((e) => e.type !== 'fleuve'), 'relief-riviere') + chemins(cours.filter((e) => e.type === 'fleuve'), 'relief-fleuve') + '</g>',
      etiquettes: COURS_NOMMES.map((c) => parCode[c]).filter(Boolean).map((e) => ({ texte: e.nom, x: e.cx, y: e.cy, classe: 'relief-etiquette--eau' }))
        .concat(MERS_NOMMEES.map((c) => parCode[c]).filter(Boolean).map((e) => ({ texte: e.etiquette || e.nom, x: e.cx, y: e.cy, classe: 'relief-etiquette--mer' }))),
      point: null,
      legende: pluriel(modules.length, 'carte') + ' à explorer · ' + fiches + ' fiches à consulter',
      description: 'Carte de France en relief avec ses fleuves et rivières'
    };
  }

  const images = {};                            // images déjà dessinées
  let imageAffichee = null;

  // Affiche l'image id
  function afficherImage(id) {
    if (id === imageAffichee) return;
    const img = images[id] || (IMAGES[id] ? IMAGES[id]() : null);
    if (img) images[id] = img;
    imageAffichee = id;
    $('#menu-atlas').classList.toggle('hidden', !img);
    if (!img) return;

    const [x0, y0, l, h] = img.cadre;
    const pos = (x, y) => ({
      left: Math.max(4, Math.min(96, (x - x0) / l * 100)).toFixed(2) + '%',
      top: Math.max(4, Math.min(96, (y - y0) / h * 100)).toFixed(2) + '%'
    });
    const relief = element('div', 'relief' + (img.large ? ' relief--large' : ''));
    relief.style.aspectRatio = l + ' / ' + h;
    relief.setAttribute('role', 'img');
    relief.setAttribute('aria-label', img.description);
    relief.innerHTML = '<svg viewBox="' + img.cadre.join(' ') + '" aria-hidden="true">' + img.calques + '</svg>';
    img.etiquettes.forEach((e, i) => {
      const s = element('span', 'relief-etiquette' + (e.classe ? ' ' + e.classe : ''), e.texte);
      Object.assign(s.style, pos(e.x, e.y));
      s.style.setProperty('--rang', i);
      relief.appendChild(s);
    });
    if (img.point) {
      ['relief-point', 'relief-onde'].forEach((classe) => {
        const p = element('span', classe);
        Object.assign(p.style, pos(img.point.x, img.point.y));
        relief.appendChild(p);
      });
    }

    // L'ancienne image s'efface pendant que la nouvelle apparaît
    const cadre = $('#menu-relief');
    const anciennes = [...cadre.querySelectorAll('.relief')];
    anciennes.forEach((a) => {
      if (sansAnimation()) return a.remove();
      a.classList.remove('is-entree');
      a.classList.add('is-sortie');
      a.removeAttribute('role');
      a.setAttribute('aria-hidden', 'true');
      setTimeout(() => a.remove(), 400);
    });
    if (anciennes.length) relief.classList.add('is-entree');
    cadre.appendChild(relief);
    $('#menu-legende').textContent = img.legende;
  }

  // Version du jeu, en bas du menu (liste des jeux : ../COMMUN/jeux.js ; sans elle, rien n'est affiché)
  function afficherVersion() {
    const jeu = window.Jeux && Jeux.liste.find((j) => j.id === 'geonohyne');
    if (jeu && jeu.version) $('#menu-version').textContent = 'GéoNohyne Quizz · version ' + jeu.version;
  }

  /* ---------- Événements ---------- */

  function brancher() {
    liste.addEventListener('click', (e) => {
      const b = e.target.closest('[data-index]');
      if (b) aller(Number(b.dataset.index), true);
    });
    grille.addEventListener('click', (e) => {
      const carte = e.target.closest('[data-type]');
      if (carte) GeoNohyne.ouvrir(carte.dataset.type, carte.dataset.id);
    });

    // Retour au menu sur un chapitre précis (ex. « ← Menu » du mode Apprendre)
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-menu-categorie]');
      if (!el) return;
      const i = MENU.findIndex((c) => c.id === el.dataset.menuCategorie);
      if (i >= 0) aller(i, false);
    });

    // Flèches du clavier : chapitre précédent / suivant (sauf pendant une saisie, et sans Alt :
    // Alt + ← = page précédente du navigateur)
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if ($('#screen-menu').classList.contains('hidden')) return;
      if (e.target.closest && e.target.closest('input, select, textarea, dialog, [role="dialog"]')) return;
      e.preventDefault();
      aller(courant + (e.key === 'ArrowRight' ? 1 : -1), false);
    });
  }

  function init() {
    liste = $('#menu-chapitres');
    grille = $('#menu-cartes');
    creerChapitres();
    afficherVersion();
    const memorise = MENU.findIndex((c) => c.id === lireMemoire());
    aller(memorise >= 0 ? memorise : 0, false);
    brancher();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
