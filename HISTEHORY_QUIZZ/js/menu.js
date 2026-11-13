/* ==========================================================================
   menu.js — Le menu « Chroniques » : chapitres, planche du chapitre, cartes des modes

   Même construction que les menus de GéoNohyne Quizz, d'Anotehomy Quizz et de Natehure Quizz (repris de
   NATEHURE_QUIZZ/js/game/home.js) : à gauche les CHAPITRES ; à droite la PLANCHE du chapitre (un dessin
   au trait, avec quelques repères et une légende) ; dessous, les CARTES du chapitre. Le dernier chapitre
   affiché est mémorisé (clé histehory.menu.chapitre) ; les flèches ← → changent de chapitre.

   RÈGLE (comme dans GéoNohyne Quizz) : une carte est active dès que le mode de même id est enregistré
   (Histehory.registerMode, js/core.js) ; elle affiche alors l'icône, le titre et la description du mode.
   Sinon elle reste GRISÉE (cadenas, « Bientôt ») et affiche les textes donnés ici.

   POUR AJOUTER, DÉPLACER OU RENOMMER UNE CARTE OU UN CHAPITRE : modifier CHAPITRES et MENU.
     MENU : { mode, chapitre, picto (clé de PICTOS), teinte (clé de TEINTES), titre, description, meta }
     meta : repères en bas de la carte, texte ou fonction (calculé à l'affichage, d'après les données)
   Les planches sont dessinées ici en SVG (le chapitre des personnages reprend trois portraits de img/)
   et restent IMMOBILES : rien ne tourne en fond, seules les apparitions sont animées.
   Ce fichier est chargé en dernier dans index.html : il affiche les modes chargés avant lui.
   ========================================================================== */
(function () {
  'use strict';

  const H = window.HISTEHORY || {};
  const CLE = 'histehory.menu.chapitre';
  const nombre = (n) => n.toLocaleString('fr-FR');

  const CHAPITRES = [
    { id: 'temps', titre: 'Le fil du temps', image: 'temps', unite: ['mode', 'modes'],
      description: 'Dates, frises et chronologies : remettre les personnages et les événements dans l\'ordre du temps.' },
    { id: 'figures', titre: 'Les grandes figures', image: 'figures', unite: ['mode', 'modes'],
      description: 'Personnages et citations : reconnaître celles et ceux qui ont fait l\'histoire, et ce qu\'ils ont dit.' },
    { id: 'epreuves', titre: 'L\'épreuve de l\'historien', image: 'epreuves', unite: ['mode', 'modes'],
      description: 'Associer, trancher, vérifier : des défis pour tout ce que vous savez de l\'histoire.' }
  ];

  // L'ordre de MENU est celui des cartes dans chaque chapitre : les modes jouables d'abord.
  const MENU = [
    { mode: 'premier', chapitre: 'temps', picto: 'medailles', teinte: 'turquoise', titre: 'Qui est venu en premier ?',
      description: 'Deux personnages : lequel est né en premier, ou en dernier ?',
      meta: () => nombre((H.PERSONNES || []).length) + ' personnages · 10 à 30 questions' },
    { mode: 'chronologie', chapitre: 'temps', picto: 'frise', teinte: 'ambre', titre: 'Chronologie',
      description: 'Cinq événements à remettre dans l\'ordre sur la frise du temps.',
      meta: () => nombre((H.DATES || []).length) + ' événements · 5 par manche' },
    { mode: 'date', chapitre: 'temps', picto: 'calendrier', teinte: 'cuivre', titre: 'Trouver la date',
      description: 'Un événement historique : retrouvez son année, ou sa date exacte.',
      meta: () => nombre((H.DATES || []).length) + ' événements · année ou date exacte' },
    { mode: 'personne', chapitre: 'figures', picto: 'silhouette', teinte: 'sable', titre: 'Deviner la personne',
      description: 'Un personnage se cache derrière des indices progressifs : moins il en faut, plus vous gagnez de points.', meta: 'Indices progressifs' },
    { mode: 'citation', chapitre: 'figures', picto: 'guillemets', teinte: 'parchemin', titre: 'Qui a dit ça ?',
      description: 'Une citation célèbre : retrouvez son auteur.', meta: 'Citations · auteurs' },
    { mode: 'paires', chapitre: 'epreuves', picto: 'lien', teinte: 'braise', titre: 'Les paires',
      description: 'Reliez chaque personnage à son rôle ou son invention, chaque événement à son lieu.', meta: 'Associations' },
    { mode: 'vrai-faux', chapitre: 'epreuves', picto: 'balance', teinte: 'grenat', titre: 'Vrai ou Faux',
      description: 'Une affirmation historique : vraie ou fausse ?', meta: 'Affirmations' }
  ];

  /* ---------- Pictogrammes des cartes (traits sur une grille de 24 x 24) ---------- */
  const PICTOS = {
    medailles: '<circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/><path d="M8 9.5v5M14.5 10.5c.5-.7 1.1-1 1.8-1 1 0 1.7.6 1.7 1.5 0 1.4-2 2-3.5 3.5h3.5"/>',
    frise: '<path d="M2.5 12h17"/><path d="M17 8.5l3.5 3.5-3.5 3.5"/><path d="M5 9v6M9 9v6M13 9v6"/><circle cx="7" cy="12" r="1.2"/>',
    calendrier: '<rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3.5v4M16 3.5v4"/><path d="M7.5 14h3M13.5 14h3M7.5 17.5h3"/>',
    silhouette: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/><path d="M11 6.5c.3-.6.8-.9 1.4-.9.8 0 1.3.5 1.3 1.2 0 1-1.2 1.1-1.6 1.9M12.3 10.3v.1"/>',
    guillemets: '<path d="M5 17c2.2-1 3.5-3 3.5-6V7H4v5h4.5"/><path d="M15 17c2.2-1 3.5-3 3.5-6V7H14v5h4.5"/>',
    lien: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    balance: '<path d="M12 4v15M8 20h8M5 7h14"/><path d="M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',
    cadenas: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    fleche: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  const picto = (nom) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (PICTOS[nom] || PICTOS.frise) + '</svg>';

  /* Vignettes : [couleur, ombre portée (relief)] */
  const TEINTES = {
    ambre: ['#f59e0b', '#8a5506'], cuivre: ['#ea580c', '#7c2d0a'], turquoise: ['#2dd4bf', '#0f766e'],
    sable: ['#e7c79a', '#8c7350'], parchemin: ['#f5ecdc', '#9a876a'], braise: ['#fb923c', '#9a3c0e'],
    grenat: ['#f87171', '#9b2c2c']
  };

  /* ---------- Les planches des chapitres ----------
     Un dessin au trait par chapitre, dans un carton de 400 x 520 ; les repères sont donnés en unités de
     ce carton (côté : de quel côté du point s'écrit l'étiquette), ils restent donc en place quelle que
     soit la taille affichée. */
  const L = 400, HT = 520;
  const portrait = (id, cx, cy, r) => {
    const f = H.PORTRAITS && H.PORTRAITS[id];
    if (!f) return '';
    return '<clipPath id="pl-' + id + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 6) + '"/></clipPath>' +
      '<image href="img/' + f + '" x="' + (cx - r) + '" y="' + (cy - r) + '" width="' + 2 * r + '" height="' + 2 * r +
      '" clip-path="url(#pl-' + id + ')" preserveAspectRatio="xMidYMid slice"/>';
  };

  const PLANCHES = {
    /* Un sablier, et sous lui la frise du temps, coupée par l'an 1 */
    temps: {
      dessin: () =>
        /* sablier : socle, chapiteau, montants */
        '<rect data-t="plein" x="110" y="40" width="180" height="16" rx="4"/>' +
        '<rect data-t="plein" x="110" y="350" width="180" height="16" rx="4"/>' +
        '<path data-t="" d="M124 56v294M276 56v294"/>' +
        '<path data-t="doux" d="M118 72h8M118 334h8M274 72h8M274 334h8"/>' +
        /* l'ampoule de verre */
        '<path data-t="" d="M142 56c0 86 52 112 54 147-2 35-54 61-54 147"/>' +
        '<path data-t="" d="M258 56c0 86-52 112-54 147 2 35 54 61 54 147"/>' +
        /* le sable : en haut, le filet, le tas en bas */
        '<path data-t="sable" d="M156 118c14 32 34 52 42 78h4c8-26 28-46 42-78z"/>' +
        '<path data-t="doux" d="M200 200v128"/>' +
        '<path data-t="sable" d="M148 350c18-24 38-34 52-36 14 2 34 12 52 36z"/>' +
        /* la frise : un trait fléché, des graduations, l'an 1 plus marqué, cinq événements */
        '<path data-t="" d="M24 444h340M354 436l12 8-12 8"/>' +
        '<path data-t="doux" d="M44 438v12M84 438v12M124 438v12M164 438v12M244 438v12M284 438v12M324 438v12"/>' +
        '<path data-t="braise" d="M204 426v36"/>' +
        '<circle data-t="plein" cx="66" cy="444" r="6"/><circle data-t="plein" cx="142" cy="444" r="6"/>' +
        '<circle data-t="plein" cx="262" cy="444" r="6"/><circle data-t="plein" cx="306" cy="444" r="6"/><circle data-t="plein" cx="340" cy="444" r="6"/>' +
        '<path data-t="doux" d="M66 444v-26M142 444v26M262 444v-26M306 444v26M340 444v-26"/>',
      reperes: [
        { texte: 'Sablier', x: 124, y: 200, cote: 'g' },
        { texte: 'Le temps qui passe', x: 200, y: 262, cote: 'd' },
        { texte: 'Avant J.-C.', x: 104, y: 416, cote: 'd' },
        { texte: 'An 1', x: 204, y: 462, cote: 'd' },
        { texte: 'Après J.-C.', x: 284, y: 474, cote: 'd' }
      ],
      legende: () => nombre((H.DATES || []).length) + ' événements · ' + nombre((H.PERSONNES || []).length) + ' personnages · de la préhistoire à nos jours',
      description: 'Planche : un sablier au-dessus d\'une frise du temps coupée par l\'an 1'
    },

    /* Trois portraits-médailles (Napoléon, Jeanne d'Arc, Marie Curie) et une plume */
    figures: {
      dessin: () =>
        /* grand médaillon au centre, deux plus petits dessous */
        '<circle data-t="plein" cx="200" cy="190" r="118"/>' + portrait('napoleon-1', 200, 190, 118) +
        '<circle data-t="" cx="200" cy="190" r="118"/><circle data-t="doux" cx="200" cy="190" r="126"/>' +
        '<circle data-t="plein" cx="104" cy="392" r="74"/>' + portrait('jeanne-arc', 104, 392, 74) +
        '<circle data-t="" cx="104" cy="392" r="74"/><circle data-t="doux" cx="104" cy="392" r="80"/>' +
        '<circle data-t="plein" cx="296" cy="392" r="74"/>' + portrait('marie-curie', 296, 392, 74) +
        '<circle data-t="" cx="296" cy="392" r="74"/><circle data-t="doux" cx="296" cy="392" r="80"/>' +
        /* un ruban qui relie les médaillons */
        '<path data-t="doux" d="M150 300c-10 14-18 24-30 30M250 300c10 14 18 24 30 30"/>' +
        /* plume d'écrivain, en bas */
        '<path data-t="" d="M176 498c22-30 42-48 64-58 4 16-12 34-36 46-10 5-20 9-28 12z"/>' +
        '<path data-t="doux" d="M176 498l52-48"/>',
      reperes: [
        { texte: 'Napoléon', x: 300, y: 112, cote: 'd' },
        { texte: 'Jeanne d\'Arc', x: 100, y: 320, cote: 'd' },
        { texte: 'Marie Curie', x: 296, y: 320, cote: 'd' },
        { texte: 'Plume', x: 228, y: 462, cote: 'd' }
      ],
      legende: () => nombre((H.PERSONNES || []).length) + ' personnages · portraits en taille-douce',
      description: 'Planche : trois portraits-médailles, Napoléon, Jeanne d\'Arc et Marie Curie, et une plume'
    },

    /* Une balance (vrai d'un côté, faux de l'autre) et deux maillons de chaîne (les paires) */
    epreuves: {
      dessin: () =>
        /* balance : pied, fléau, plateaux */
        '<path data-t="" d="M200 66v270M156 336h88M170 336l30-30 30 30"/>' +
        '<circle data-t="plein" cx="200" cy="60" r="8"/>' +
        '<path data-t="" d="M86 104h228"/>' +
        '<path data-t="doux" d="M86 104 56 206M86 104l30 102M314 104l-30 102M314 104l30 102"/>' +
        '<path data-t="plein" d="M46 206a40 16 0 0 0 80 0z"/>' +
        '<path data-t="plein" d="M274 206a40 16 0 0 0 80 0z"/>' +
        '<path data-t="juste" d="M70 186l12 12 22-26"/>' +
        '<path data-t="faux" d="M300 172l26 26M326 172l-26 26"/>' +
        /* deux maillons de chaîne entrelacés */
        '<rect data-t="" x="94" y="408" width="120" height="56" rx="28"/>' +
        '<rect data-t="braise" x="186" y="408" width="120" height="56" rx="28"/>' +
        '<path data-t="doux" d="M40 380h320"/>',
      reperes: [
        { texte: 'Vrai', x: 86, y: 222, cote: 'd' },
        { texte: 'Faux', x: 314, y: 222, cote: 'd' },
        { texte: 'Fléau', x: 260, y: 104, cote: 'd' },
        { texte: 'Les paires', x: 246, y: 464, cote: 'd' }
      ],
      legende: () => 'Associer · trancher · vérifier',
      description: 'Planche : une balance, vrai d\'un côté, faux de l\'autre, et deux maillons de chaîne'
    }
  };

  const deuxChiffres = (n) => (n < 10 ? '0' : '') + n;
  const compte = (n, unite) => deuxChiffres(n) + ' ' + unite[n > 1 ? 1 : 0];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (id) => document.getElementById(id);
  function lire() { try { return localStorage.getItem(CLE); } catch (e) { return null; } }
  function ecrire(id) { try { localStorage.setItem(CLE, id); } catch (e) { /* valable pour la session */ } }

  const cartesDe = (id) => MENU.filter((m) => m.chapitre === id);
  const pret = (m) => !!Histehory.trouver(m.mode);
  let courant = null;

  /* ---------- Les chapitres, à gauche ---------- */
  function dessinerChapitres() {
    $('menuChapitres').innerHTML = CHAPITRES.map((c, i) =>
      '<button type="button" class="chapitre-ligne" data-chapitre="' + esc(c.id) + '" aria-current="false">' +
        '<span class="chapitre-num">' + deuxChiffres(i + 1) + '</span>' +
        '<span class="chapitre-nom">' + esc(c.titre) + '</span>' +
        '<span class="chapitre-nb">' + compte(cartesDe(c.id).length, c.unite) + '</span></button>').join('');
  }

  /* ---------- La planche du chapitre ----------
     L'ancienne s'efface pendant que la nouvelle apparaît : le cadre garde sa taille, la page ne bouge pas. */
  function dessinerPlanche(chapitre) {
    const p = PLANCHES[chapitre.image];
    const cadre = $('menuPlanche');
    if (!p) { cadre.innerHTML = ''; return; }
    const reperes = p.reperes.map((r, i) =>
      '<span class="planche-repere planche-repere--' + r.cote + '" style="left:' + (r.x / L * 100).toFixed(2) +
      '%;top:' + (r.y / HT * 100).toFixed(2) + '%;--rang:' + i + '">' +
      '<span class="planche-etiquette">' + esc(r.texte) + '</span></span>').join('');
    const neuve = document.createElement('div');
    neuve.className = 'planche is-entree';
    neuve.style.setProperty('--ratio', (L / HT).toFixed(4));
    neuve.innerHTML = '<svg class="dessin" viewBox="0 0 ' + L + ' ' + HT + '" role="img" aria-label="' +
      esc(p.description) + '">' + p.dessin() + '</svg>' + reperes;
    cadre.querySelectorAll('.planche').forEach((vieille) => {
      vieille.classList.remove('is-entree');
      vieille.classList.add('is-sortie');
      vieille.addEventListener('animationend', () => vieille.remove());
      setTimeout(() => vieille.remove(), 600);
    });
    cadre.append(neuve);
    $('menuLegende').textContent = p.legende();
  }

  /* ---------- Les cartes du chapitre ----------
     Un mode enregistré : un <button> qui l'ouvre. Sinon : un <div> grisé, cadenas et « Bientôt ». */
  function carte(m, i) {
    const def = Histehory.trouver(m.mode);
    const [teinte, ombre] = TEINTES[m.teinte] || TEINTES.ambre;
    const balise = def ? 'button' : 'div';
    const meta = typeof m.meta === 'function' ? m.meta() : m.meta;
    return '<' + balise + ' class="carte' + (def ? '' : ' carte--bientot') + '"' +
      (def ? ' type="button" data-mode="' + esc(m.mode) + '"' : ' aria-disabled="true"') + ' style="--rang:' + i + '">' +
      '<span class="carte-haut">' +
        '<span class="carte-icone" style="--teinte:' + teinte + ';--teinte-ombre:' + ombre + '">' + picto(def ? m.picto : 'cadenas') + '</span>' +
        '<span class="carte-index">' + deuxChiffres(i + 1) + '</span>' +
      '</span>' +
      '<span class="carte-titre">' + esc((def && def.titre) || m.titre) + '</span>' +
      '<span class="carte-desc">' + esc((def && def.description) || m.description) + '</span>' +
      '<span class="carte-bas"><span class="carte-meta">' + esc(meta || '') + '</span>' +
        (def ? '<span class="carte-go">' + picto('fleche') + '</span>' : '<span class="carte-bientot">Bientôt</span>') +
      '</span></' + balise + '>';
  }

  function afficher(id) {
    const chapitre = CHAPITRES.find((c) => c.id === id) || CHAPITRES[0];
    if (courant === chapitre.id) return;
    courant = chapitre.id;
    ecrire(chapitre.id);
    document.querySelectorAll('.chapitre-ligne').forEach((b) => b.setAttribute('aria-current', String(b.dataset.chapitre === chapitre.id)));
    const cartes = cartesDe(chapitre.id);
    const prets = cartes.filter(pret).length;
    const i = CHAPITRES.indexOf(chapitre);
    $('menuChapitreNum').textContent = 'Chapitre ' + deuxChiffres(i + 1);
    $('menuChapitreTitre').textContent = chapitre.titre;
    $('menuChapitreDesc').textContent = chapitre.description;
    $('menuChapitreCompte').innerHTML = compte(cartes.length, chapitre.unite) +
      (prets ? ' · <span class="chapitre-dispo">' + deuxChiffres(prets) + ' disponible' + (prets > 1 ? 's' : '') + '</span>' : ' · en préparation');
    $('menuCartes').innerHTML = cartes.map(carte).join('');
    dessinerPlanche(chapitre);
  }

  /* ---------- Cadran : l'année du jour au centre, l'aiguille sur le mois ---------- */
  function regler() {
    const d = new Date();
    $('cadranAnnee').textContent = String(d.getFullYear());
    const a = (d.getMonth() + d.getDate() / 31) / 12 * 2 * Math.PI;
    const aiguille = $('cadranAiguille');
    aiguille.setAttribute('x2', (50 + 30 * Math.sin(a)).toFixed(1));
    aiguille.setAttribute('y2', (50 - 30 * Math.cos(a)).toFixed(1));
  }

  function init() {
    dessinerChapitres();
    $('menuChapitres').addEventListener('click', (e) => {
      const b = e.target.closest('[data-chapitre]');
      if (b) afficher(b.dataset.chapitre);
    });
    $('menuCartes').addEventListener('click', (e) => {
      const c = e.target.closest('[data-mode]');
      if (c) Histehory.ouvrir(c.dataset.mode);
    });
    // Flèches ← → : chapitre précédent, chapitre suivant (sur l'accueil, hors champ de saisie et menus ouverts)
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (document.body.dataset.ecran !== 'screen-menu') return;
      if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
      if (document.querySelector('.acct-menu:not([hidden]), .jx-menu:not([hidden])')) return;
      const i = CHAPITRES.findIndex((c) => c.id === courant);
      const n = CHAPITRES.length;
      afficher(CHAPITRES[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n].id);
    });
    regler();
    const connu = CHAPITRES.some((c) => c.id === lire());
    afficher(connu ? lire() : CHAPITRES[0].id);
    // Version du jeu, lue dans ../COMMUN/jeux.js (absent : le jeu marche sans)
    const moi = window.Jeux && window.Jeux.liste.find((j) => j.id === 'histehory');
    $('menuVersion').textContent = moi && moi.version ? 'Version ' + moi.version : '';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
