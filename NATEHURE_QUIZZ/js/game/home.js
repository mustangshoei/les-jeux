/* ==========================================================================
   Natehure Quizz - game/home.js
   LE MENU « Herbier » (meme construction que les menus de GeoNohyne Quizz et d'Anotehomy Quizz) :
   a gauche, les CHAPITRES (js/data/games.js) ; a droite, la PLANCHE du chapitre (un dessin au trait,
   avec quelques reperes et une legende) ; dessous, les CARTES du chapitre. Le dernier chapitre
   affiche est memorise ; les fleches <- -> changent de chapitre.
   Les planches sont dessinees ici en SVG (aucune image, aucun fichier binaire) et restent IMMOBILES :
   rien ne tourne en fond, seules les apparitions sont animees.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc } = NQ.util;
  const D = NQ.data;

  const CLE = 'natehure.menu.chapitre';      /* dernier chapitre affiche */

  /* ---------- Pictogrammes des cartes (traits sur une grille de 24 x 24) ---------- */
  const ICONS = {
    plante: '<path d="M12 21V8"/><path d="M12 12c-3.4 0-5.5-1.8-5.5-5 3.4 0 5.5 1.8 5.5 5z"/><path d="M12 15c3.4 0 5.5-1.8 5.5-5-3.4 0-5.5 1.8-5.5 5z"/><path d="M9.5 21h5"/>',
    cellule: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="2.2"/><ellipse cx="15.5" cy="8.5" rx="2.6" ry="1.5" transform="rotate(-25 15.5 8.5)"/><ellipse cx="14.5" cy="15" rx="2.6" ry="1.5" transform="rotate(20 14.5 15)"/><ellipse cx="7.5" cy="15.5" rx="2.4" ry="1.4" transform="rotate(-15 7.5 15.5)"/>',
    soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2 19 19M5 19l1.8-1.8M17.2 6.8 19 5"/>',
    seve: '<path d="M12 3v18"/><path d="M8.5 3v18M15.5 3v18"/><path d="M8.5 8h3.5M15.5 12h-3.5M8.5 16h3.5"/>',
    famille: '<circle cx="12" cy="4.5" r="2"/><path d="M12 6.5v3.5M12 10H5.5v3M12 10h6.5v3"/><circle cx="5.5" cy="15.5" r="2.5"/><circle cx="12" cy="15.5" r="2.5"/><circle cx="18.5" cy="15.5" r="2.5"/><path d="M12 10v3"/>',
    fleur: '<circle cx="12" cy="9" r="2.2"/><path d="M12 6.8c0-2 1-3.3 2.6-3.3S17 5 15.6 6.6 12 8 12 6.8z"/><path d="M14.2 9c2 0 3.3 1 3.3 2.6S15.8 14 14.4 12.6 13 9 14.2 9z"/><path d="M9.8 9c-2 0-3.3 1-3.3 2.6S8.2 14 9.6 12.6 11 9 9.8 9z"/><path d="M12 11.2c0 2-1 3.3-2.6 3.3S7 12.5 8.4 11.1"/><path d="M12 13v8"/>',
    feuille: '<path d="M4 20C4 11 10 5 20 4c1 10-5 16-14 16z"/><path d="M4 20 16 8"/><path d="M10 14l1-4M13 11l1-4M8 16l-4 1"/>',
    arbre: '<path d="M12 21v-6"/><path d="M12 15c-4.4 0-7-2.6-7-6.2C5 5.4 8 3 12 3s7 2.4 7 5.8c0 3.6-2.6 6.2-7 6.2z"/><path d="M9.5 21h5"/><path d="M12 15l-3-3M12 12l3-3"/>',
    champignon: '<path d="M4.5 11c0-4 3.4-7 7.5-7s7.5 3 7.5 7z"/><path d="M4.5 11h15"/><path d="M9.5 11v6a2.5 2.5 0 0 0 5 0v-6"/><path d="M9.5 14h5"/>',
    danger: '<path d="M12 3.5 21 19.5H3z"/><path d="M12 9v5"/><path d="M12 17h.01"/>',
    herbier: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 3.5v17"/><path d="M11.5 16c0-4 2-6.5 5.5-7 .3 4-1.8 7-5.5 7z"/><path d="M11.5 16 17 9.5"/>',
    calendrier: '<rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3.5v4M16 3.5v4"/><path d="M7.5 14h3M13.5 14h3M7.5 17.5h3"/>',
    epi: '<path d="M12 21V7"/><path d="M12 7c0-2.2 1.3-3.5 3-3.5 0 2.2-1.3 3.5-3 3.5z"/><path d="M12 7c0-2.2-1.3-3.5-3-3.5 0 2.2 1.3 3.5 3 3.5z"/><path d="M12 11.5c0-2.2 1.3-3.5 3-3.5 0 2.2-1.3 3.5-3 3.5z"/><path d="M12 11.5c0-2.2-1.3-3.5-3-3.5 0 2.2 1.3 3.5 3 3.5z"/><path d="M12 16c0-2.2 1.3-3.5 3-3.5 0 2.2-1.3 3.5-3 3.5z"/><path d="M12 16c0-2.2-1.3-3.5-3-3.5 0 2.2 1.3 3.5 3 3.5z"/>',
    sol: '<path d="M3 7.5h18M3 12h18M3 16.5h18"/><rect x="3" y="4.5" width="18" height="15" rx="1.5"/><path d="M7 4.5V3M12 4.5V3M17 4.5V3"/>',
    potager: '<path d="M4 20h16"/><path d="M7 20v-5M7 15c-1.8 0-3-1.2-3-3 1.8 0 3 1.2 3 3z"/><path d="M7 15c1.8 0 3-1.2 3-3-1.8 0-3 1.2-3 3z"/><path d="M14 20v-7M14 13c-1.8 0-3-1.2-3-3 1.8 0 3 1.2 3 3z"/><path d="M14 13c1.8 0 3-1.2 3-3-1.8 0-3 1.2-3 3z"/><path d="M19.5 20V8"/>',
    tracteur: '<circle cx="7" cy="16.5" r="3.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M4 13V8h5l2 5"/><path d="M11 13h7v4.5"/><path d="M10.5 13V8"/>',
    terroir: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    cadenas: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    fleche: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  const picto = nom => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[nom] || ICONS.plante) + '</svg>';

  /* Vignettes : [couleur, ombre portee (relief)] */
  const TINTS = {
    menthe: ['#5fe08a', '#22734a'], pousse: ['#a8d75e', '#5f7f2c'], soleil: ['#ffd84d', '#a8891f'],
    eau: ['#5bc8e8', '#2a7e97'], terre: ['#d9a05b', '#8f6128'], ecorce: ['#b08968', '#6d4f38'],
    amanite: ['#ff6b5c', '#a5342a'], lichen: ['#c2f0d1', '#7a9c85'], fleur: ['#f7a8c4', '#9c5a72']
  };

  /* ---------- Les planches des chapitres ----------
     Un dessin au trait par chapitre, dans un carton de 400 x 520 ; les reperes sont donnes en % de
     ce carton (cote : de quel cote du point s'ecrit l'etiquette), ils restent donc en place quelle
     que soit la taille affichee. */
  const L = 400, H = 520;

  const PLANCHES = {
    /* Une plante entiere (racine, tige, feuilles, fleur) et, a la loupe, une cellule vegetale */
    biologie: {
      dessin:
        /* sol */
        '<path data-t="terre" d="M20 380h360v6H20z"/>' +
        '<path data-t="doux" d="M30 394h40M90 400h34M150 394h40M212 402h34M272 394h40M330 400h34"/>' +
        /* racine pivotante et ses radicelles */
        '<path data-t="" d="M150 380v96"/>' +
        '<path data-t="" d="M150 404c-18 10-34 20-48 42M150 420c16 8 30 18 42 36M150 446c-12 10-20 22-26 38M150 452c14 10 22 22 28 38"/>' +
        '<path data-t="doux" d="M124 428c-8 6-14 12-18 20M196 442c6 6 10 12 13 20"/>' +
        /* tige */
        '<path data-t="" d="M150 380V128"/>' +
        /* feuille gauche et feuille droite */
        '<path data-t="plein" d="M150 248c-22-26-56-36-94-30 6 34 34 54 72 48 10-2 17-8 22-18z"/>' +
        '<path data-t="doux" d="M150 248 62 222M104 236l-6-16M124 242l-5-18"/>' +
        '<path data-t="plein" d="M150 312c20-22 50-30 84-24-6 30-30 48-64 42-9-2-15-8-20-18z"/>' +
        '<path data-t="doux" d="M150 312 228 290M194 300l5-14M172 306l4-15"/>' +
        /* fleur : un coeur et six petales */
        '<circle data-t="plein" cx="150" cy="106" r="15"/>' +
        '<path data-t="" d="M150 91c0-14 6-22 16-22s12 12 2 20-18 6-18 2z"/>' +
        '<path data-t="" d="M163 98c12-7 21-6 26 3s-7 14-18 8-10-9-8-11z"/>' +
        '<path data-t="" d="M163 114c12 7 16 15 11 24s-16 1-16-11 3-14 5-13z"/>' +
        '<path data-t="" d="M137 114c-12 7-16 15-11 24s16 1 16-11-3-14-5-13z"/>' +
        '<path data-t="" d="M137 98c-12-7-21-6-26 3s7 14 18 8 10-9 8-11z"/>' +
        '<path data-t="" d="M150 91c0-14-6-22-16-22s-12 12-2 20 18 6 18 2z"/>' +
        /* loupe sur la feuille droite : une cellule vegetale */
        '<path data-t="doux" d="M232 332l24 46"/>' +
        '<circle data-t="" cx="300" cy="440" r="62"/>' +
        '<rect data-t="plein" x="264" y="404" width="72" height="72" rx="10"/>' +
        '<rect data-t="doux" x="272" y="412" width="56" height="56" rx="7"/>' +
        '<circle data-t="doux" cx="288" cy="428" r="9"/>' +
        '<ellipse data-t="" cx="314" cy="425" rx="11" ry="6" transform="rotate(-24 314 425)"/>' +
        '<ellipse data-t="" cx="308" cy="454" rx="11" ry="6" transform="rotate(18 308 454)"/>' +
        '<ellipse data-t="" cx="282" cy="452" rx="10" ry="5.5" transform="rotate(-12 282 452)"/>',
      reperes: [
        { texte: 'Fleur', x: 150, y: 106, cote: 'd' },
        { texte: 'Tige', x: 150, y: 184, cote: 'd' },
        { texte: 'Feuille', x: 86, y: 224, cote: 'g' },
        { texte: 'Racine', x: 150, y: 452, cote: 'd' },
        { texte: 'Cellule', x: 318, y: 452, cote: 'd' }
      ],
      legende: () => 'Organes · cellule · photosynthèse · familles botaniques',
      description: 'Planche : une plante entière, de la racine à la fleur, et sa cellule vue à la loupe'
    },

    /* Un arbre, sa feuille en detail, et deux champignons a son pied */
    flore: {
      dessin:
        /* sol */
        '<path data-t="terre" d="M20 430h360v6H20z"/>' +
        '<path data-t="doux" d="M34 444h34M96 450h30M186 444h34M250 450h30M336 444h32"/>' +
        /* houppier */
        '<path data-t="plein" d="M140 258c-44 0-78-20-82-54-3-24 12-40 28-44-6-24 10-44 34-46 10-20 34-28 54-18 18-12 44-6 54 14 24 0 40 20 36 42 16 8 24 26 18 44-8 42-48 62-102 62z"/>' +
        /* branches dans le houppier */
        '<path data-t="doux" d="M140 258v-96M140 196l-34-26M140 180l32-24M140 214l-28 20M140 168l26 18"/>' +
        /* tronc et son ecorce */
        '<path data-t="" d="M130 430V256M150 430V256"/>' +
        /* ecorce : de courtes crevasses, alternees d'un bord a l'autre du tronc */
        '<path data-t="doux" d="M133 298h7M141 312h6M133 326h7M140 340h7M133 354h6M141 368h6M133 382h7M140 396h7M134 410h6"/>' +
        '<path data-t="" d="M118 436c6-8 12-10 12-10M162 436c-6-8-12-10-12-10"/>' +
        /* feuille en detail, en haut a droite */
        '<path data-t="plein" d="M322 72c-36 10-58 40-58 76 36-4 62-30 62-66 0-4-2-8-4-10z"/>' +
        '<path data-t="doux" d="M322 72 264 148M300 96l-12-10M310 118l-14-8M284 116l-12 2"/>' +
        '<path data-t="" d="M264 148l-14 18"/>' +
        /* champignon : chapeau, lames, pied, anneau */
        '<path data-t="amanite" d="M250 374a50 26 0 0 1 100 0z"/>' +
        '<path data-t="" d="M250 374h100"/>' +
        '<path data-t="doux" d="M262 374v8M278 374v10M296 374v10M314 374v10M330 374v8"/>' +
        '<path data-t="" d="M290 374v56M310 374v56"/>' +
        '<path data-t="" d="M286 392h28"/>' +
        '<path data-t="" d="M284 430h32"/>' +
        /* petit champignon voisin */
        '<path data-t="terre" d="M344 406a22 12 0 0 1 44 0z"/>' +
        '<path data-t="" d="M344 406h44M360 406v24M372 406v24M356 430h20"/>',
      reperes: [
        { texte: 'Houppier', x: 104, y: 118, cote: 'd' },
        { texte: 'Feuille', x: 296, y: 132, cote: 'g' },
        { texte: 'Écorce', x: 140, y: 350, cote: 'g' },
        { texte: 'Chapeau', x: 300, y: 362, cote: 'd' },
        { texte: 'Lames', x: 266, y: 382, cote: 'g' }
      ],
      legende: () => 'Arbres · écorces · fleurs sauvages · champignons · espèces toxiques',
      description: 'Planche : un arbre avec sa feuille en détail et des champignons à son pied'
    },

    /* Un champ en perspective, un epi au premier plan, et une coupe de sol */
    agriculture: {
      dessin:
        /* ciel, soleil et horizon */
        '<path data-t="" d="M60 150h280"/>' +
        '<circle data-t="soleil" cx="306" cy="74" r="24"/>' +
        '<path data-t="soleil" d="M306 40v-10M306 108v10M272 74h-10M340 74h10M284 52l-7-7M328 96l7 7M284 96l-7 7M328 52l7-7"/>' +
        /* rangs de culture, en perspective : tous partent de l'horizon et s'arretent au sol coupe */
        '<path data-t="doux" d="M190 150 40 358M194 150l-54 208M198 150l-18 208M202 150l18 208M206 150l54 208M210 150l150 208"/>' +
        /* sillons en travers : leurs extremites suivent les deux rangs exterieurs */
        '<path data-t="doux" d="M150 206h100M118 250h164M82 300h236"/>' +
        /* epi de ble au premier plan */
        '<path data-t="" d="M74 358V206"/>' +
        '<path data-t="plein" d="M74 206c0-16 9-26 22-26 0 16-9 26-22 26z"/>' +
        '<path data-t="plein" d="M74 206c0-16-9-26-22-26 0 16 9 26 22 26z"/>' +
        '<path data-t="plein" d="M74 232c0-16 9-26 22-26 0 16-9 26-22 26z"/>' +
        '<path data-t="plein" d="M74 232c0-16-9-26-22-26 0 16 9 26 22 26z"/>' +
        '<path data-t="plein" d="M74 258c0-16 9-26 22-26 0 16-9 26-22 26z"/>' +
        '<path data-t="plein" d="M74 258c0-16-9-26-22-26 0 16 9 26 22 26z"/>' +
        '<path data-t="" d="M74 180v-22"/>' +
        '<path data-t="doux" d="M74 300c-16 6-24 16-28 32M74 318c14 6 22 16 25 30"/>' +
        /* coupe de sol : litiere, humus, argile, roche mere */
        '<path data-t="" d="M40 358h320v142H40z"/>' +
        '<path data-t="" d="M40 382h320M40 424h320M40 466h320"/>' +
        '<path data-t="doux" d="M56 370h16M94 374h16M140 370h16M196 374h16M250 370h16M300 374h16M336 370h16"/>' +
        '<path data-t="terre" d="M60 396c8-6 14-6 22 0M110 406c8-6 14-6 22 0M172 396c8-6 14-6 22 0M232 408c8-6 14-6 22 0M292 396c8-6 14-6 22 0"/>' +
        '<path data-t="doux" d="M62 440h24M110 450h24M166 440h24M224 452h24M284 440h24M322 450h22"/>' +
        '<path data-t="doux" d="M58 486l20-12 18 12M130 486l20-12 18 12M208 486l20-12 18 12M286 486l20-12 18 12"/>',
      reperes: [
        { texte: 'Soleil', x: 306, y: 74, cote: 'g' },
        { texte: 'Épi', x: 74, y: 218, cote: 'd' },
        { texte: 'Rangs', x: 250, y: 254, cote: 'd' },
        { texte: 'Humus', x: 150, y: 402, cote: 'g' },
        { texte: 'Roche mère', x: 170, y: 482, cote: 'g' }
      ],
      legende: () => 'Saisonnalité · grandes cultures · sol vivant · potager · agronomie',
      description: 'Planche : un champ en perspective, un épi de blé et une coupe du sol'
    }
  };

  const deuxChiffres = n => (n < 10 ? '0' : '') + n;
  const compte = (n, unite) => deuxChiffres(n) + ' ' + unite[n > 1 ? 1 : 0];
  function lire() { try { return localStorage.getItem(CLE); } catch (e) { return null; } }
  function ecrire(id) { try { localStorage.setItem(CLE, id); } catch (e) { /* valable pour la session */ } }

  const cartesDe = id => D.GAMES.filter(g => g.chapter === id);
  let courant = null;

  /* ---------- Les chapitres, a gauche ---------- */
  function dessinerChapitres() {
    $('homeChapters').innerHTML = D.CHAPTERS.map((c, i) => {
      const n = cartesDe(c.id).length;
      return '<button type="button" class="chapitre-ligne" data-chapitre="' + esc(c.id) + '" aria-current="false">' +
        '<span class="chapitre-num">' + deuxChiffres(i + 1) + '</span>' +
        '<span class="chapitre-nom">' + esc(c.name) + '</span>' +
        '<span class="chapitre-nb">' + compte(n, c.unit) + '</span></button>';
    }).join('');
  }

  /* ---------- La planche du chapitre ----------
     L'ancienne s'efface pendant que la nouvelle apparait : le cadre garde sa taille, la page ne
     bouge pas d'un chapitre a l'autre. */
  function dessinerPlanche(chapitre) {
    const p = PLANCHES[chapitre.image];
    const cadre = $('homePlanche');
    if (!p) { cadre.innerHTML = ''; return; }

    const reperes = p.reperes.map((r, i) =>
      '<span class="planche-repere planche-repere--' + r.cote + '" style="left:' + (r.x / L * 100).toFixed(2) +
      '%;top:' + (r.y / H * 100).toFixed(2) + '%;--rang:' + i + '">' +
      '<span class="planche-etiquette">' + esc(r.texte) + '</span></span>').join('');

    const neuve = document.createElement('div');
    neuve.className = 'planche is-entree';
    neuve.style.setProperty('--ratio', (L / H).toFixed(4));
    neuve.innerHTML = '<svg class="dessin" viewBox="0 0 ' + L + ' ' + H + '" role="img" aria-label="' +
      esc(p.description) + '">' + p.dessin + '</svg>' + reperes;

    cadre.querySelectorAll('.planche').forEach(vieille => {
      vieille.classList.remove('is-entree');
      vieille.classList.add('is-sortie');
      vieille.addEventListener('animationend', () => vieille.remove());
      setTimeout(() => vieille.remove(), 600);
    });
    cadre.append(neuve);
    $('homeLegend').textContent = p.legende();
  }

  /* ---------- Les cartes du chapitre ----------
     Aucun jeu n'est encore jouable : chaque carte est un <div> grise, avec un cadenas et
     « Bientot ». Le jour ou un jeu passe en 'ready', sa carte devient un <button> cliquable. */
  function carte(g, i) {
    const bientot = g.status !== 'ready';
    const [teinte, ombre] = TINTS[g.tint] || TINTS.menthe;
    const balise = bientot ? 'div' : 'button';
    return '<' + balise + ' class="carte' + (bientot ? ' carte--bientot' : '') + '"' +
      (bientot ? ' aria-disabled="true"' : ' type="button" data-jeu="' + esc(g.id) + '"') +
      ' style="--rang:' + i + '">' +
      '<span class="carte-haut">' +
        '<span class="carte-icone" style="--teinte:' + teinte + ';--teinte-ombre:' + ombre + '">' +
          picto(bientot ? 'cadenas' : g.icon) + '</span>' +
        '<span class="carte-index">' + deuxChiffres(i + 1) + '</span>' +
      '</span>' +
      '<span class="carte-titre">' + esc(g.name) + '</span>' +
      '<span class="carte-desc">' + esc(g.desc) + '</span>' +
      '<span class="carte-bas"><span class="carte-meta">' + esc(g.meta) + '</span>' +
        (bientot ? '<span class="carte-bientot">Bientôt</span>'
          : '<span class="carte-go">' + picto('fleche') + '</span>') +
      '</span></' + balise + '>';
  }

  function afficher(id) {
    const chapitre = D.CHAPTERS.find(c => c.id === id) || D.CHAPTERS[0];
    if (courant === chapitre.id) return;
    courant = chapitre.id;
    ecrire(chapitre.id);

    document.querySelectorAll('.chapitre-ligne').forEach(b =>
      b.setAttribute('aria-current', String(b.dataset.chapitre === chapitre.id)));

    const cartes = cartesDe(chapitre.id);
    const prets = cartes.filter(g => g.status === 'ready').length;
    const i = D.CHAPTERS.indexOf(chapitre);
    $('homeChapterNum').textContent = 'Chapitre ' + deuxChiffres(i + 1);
    $('homeChapterTitle').textContent = chapitre.name;
    $('homeChapterDesc').textContent = chapitre.desc;
    $('homeChapterCount').innerHTML = compte(cartes.length, chapitre.unit) +
      (prets ? ' · <span class="chapitre-dispo">' + deuxChiffres(prets) + ' disponible' + (prets > 1 ? 's' : '') + '</span>'
        : ' · en préparation');
    $('homeCards').innerHTML = cartes.map(carte).join('');
    dessinerPlanche(chapitre);
  }

  /* ---------- Roue des saisons : le quartier de la saison du jour est marque ---------- */
  function marquerSaison() {
    const mois = new Date().getMonth();                 /* 0 = janvier */
    const saison = mois <= 1 || mois === 11 ? 'hiver' : mois <= 4 ? 'printemps' : mois <= 7 ? 'ete' : 'automne';
    document.querySelectorAll('[data-saison]').forEach(el =>
      el.classList.toggle('is-maintenant', el.dataset.saison === saison));
  }

  function init() {
    dessinerChapitres();
    $('homeChapters').addEventListener('click', e => {
      const b = e.target.closest('[data-chapitre]');
      if (b) afficher(b.dataset.chapitre);
    });
    /* Fleches <- -> : chapitre precedent, chapitre suivant (hors champ de saisie) */
    document.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.target.closest('input, textarea, select, [contenteditable]')) return;
      if (document.querySelector('.acct-menu:not([hidden]), .jx-menu:not([hidden])')) return;
      const i = D.CHAPTERS.findIndex(c => c.id === courant);
      const n = D.CHAPTERS.length;
      afficher(D.CHAPTERS[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n].id);
    });
    marquerSaison();

    const connu = D.CHAPTERS.some(c => c.id === lire());
    afficher(connu ? lire() : D.CHAPTERS[0].id);

    /* Version du jeu, lue dans ../COMMUN/jeux.js (absent : le jeu marche sans) */
    const moi = window.Jeux && window.Jeux.liste.find(j => j.id === 'natehure');
    $('homeVersion').textContent = moi && moi.version ? 'Version ' + moi.version : '';
  }

  NS.home = { init, afficher };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(NQ.game);
