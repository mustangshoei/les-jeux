/* ==========================================================================
   Anotehomy Quizz - data/games.js
   CATALOGUE DU MENU : les chapitres (grandes catégories), puis leurs cartes (jeux et modules).
   --------------------------------------------------------------------------
   POUR AJOUTER UN JEU : une entrée dans GAMES, avec son chapitre. status : 'ready' = jouable,
   'soon' = annoncé mais grisé (« Bientôt »). L'ordre de GAMES est celui des cartes dans le menu.
   Les identifiants des jeux jouables ne doivent pas changer : les statistiques des joueurs y sont
   rangées (js/account/profile.js).
     chapter  chapitre de la carte (CHAPTERS)
     kind     'jeu' ou 'module' (module d'exploration, chapitre « Apprendre la Vie »)
     icon     pictogramme de la vignette (js/game/home.js, ICONS) ; tint : sa couleur (TINTS)
     tagline  phrase de la carte et de l'écran de configuration
     meta     repères en bas de la carte (ex. « 194 muscles · Nommage · Ciblage »)
     group    regroupement (GROUPS) : les jeux d'un même groupe n'ont qu'une carte dans le menu ; un clic
              ouvre une fenêtre coupée en deux, une moitié par jeu (js/game/home.js)
   ========================================================================== */
(function (NS) {
  'use strict';

  const CHAPTERS = [
    { id: 'corps', name: 'Le corps humain', image: 'corps', unit: ['jeu', 'jeux'],
      desc: 'Os, muscles, organes, nerfs et vaisseaux : reconnaître et situer chaque élément sur le corps en 3D.' },
    { id: 'langue', name: 'La langue médicale', image: 'langue', unit: ['jeu', 'jeux'],
      desc: 'Les mots de la médecine : les pathologies et le vocabulaire du milieu médical.' },
    { id: 'vie', name: 'Apprendre la Vie', image: 'vie', unit: ['module', 'modules'],
      desc: 'Explorer librement le corps humain et consulter la fiche de chaque élément.' }
  ];

  /* organes distincts (la vessie, l'uretre et les ureteres ont une version par sexe du corps, de meme nom) */
  const organs = list => new Set(list.map(o => o.name)).size;

  /* Regroupements : une carte pour plusieurs jeux (elle prend la place du premier d'entre eux) */
  const GROUPS = [
    { id: 'osteologie', icon: 'os', tint: 'nacre',
      name: 'Ostéologie des humains',
      tagline: 'Les os du corps humain : le squelette entier, puis chaque os en détail.',
      meta: '2 jeux · ' + NS.BONES.length + ' os' },
    { id: 'splanchnologie-humains', icon: 'organe', tint: 'rose',
      name: 'Splanchnologie des humains',
      tagline: 'Les organes du corps humain : leur place, puis leurs parties en détail.',
      meta: '2 jeux · ' + organs(NS.ORGANS) + ' organes · ' + NS.SPLANCHNO.length + ' détaillés' }
  ];

  const muscles = () => NS.MUSCLES.length;
  const GAMES = [
    /* ---------- 1. Le corps humain ---------- */
    { id: 'os-squelette', chapter: 'corps', group: 'osteologie', kind: 'jeu', status: 'ready', icon: 'os', tint: 'nacre',
      name: 'Les os du squelette',
      tagline: 'Reconnaître et situer chaque os du corps humain.',
      desc: 'Un os s\'illumine sur le squelette 3D : donnez son nom (Nommage), ou cliquez sur l\'os demandé (Ciblage).',
      meta: NS.BONES.length + ' os · Nommage · Ciblage' },
    { id: 'os-descriptive', chapter: 'corps', group: 'osteologie', kind: 'jeu', status: 'ready', icon: 'osteo', tint: 'peche',
      name: 'Ostéologie descriptive',
      tagline: 'Nommer et situer les parties d\'un os : reliefs, fosses, incisures.',
      desc: 'Un os tiré au sort (ou choisi) est affiché seul, découpé en parties : identifiez ses reliefs et ses repères.',
      meta: NS.OSTEO.length + ' os détaillés · ' + NS.OSTEO.reduce((n, d) => n + d.parts.length, 0) + ' parties' },
    { id: 'muscles-localisation', chapter: 'corps', kind: 'jeu', status: 'ready', icon: 'muscle', tint: 'framboise',
      name: 'Les muscles du corps humain',
      tagline: 'Reconnaître et situer les muscles, zone par zone.',
      desc: 'Un muscle s\'illumine sur le corps en 3D : donnez son nom (Nommage), ou cliquez sur le muscle demandé (Ciblage).',
      meta: muscles() + ' muscles · ' + NS.MUSCLES.filter(m => m.principal).length + ' principaux' },
    { id: 'organes', chapter: 'corps', group: 'splanchnologie-humains', kind: 'jeu', status: 'ready', icon: 'organe', tint: 'peche',
      name: 'Les organes',
      tagline: 'Reconnaître et situer les organes du corps humain, appareil par appareil.',
      desc: 'Un organe s\'illumine sur le corps en 3D : donnez son nom (Nommage), ou cliquez sur l\'organe demandé (Ciblage).',
      meta: organs(NS.ORGANS) + ' organes · ' + organs(NS.ORGANS.filter(o => o.principal)) + ' principaux' },
    { id: 'splanchnologie', chapter: 'corps', group: 'splanchnologie-humains', kind: 'jeu', status: 'ready', icon: 'splanchno', tint: 'menthe',
      name: 'Splanchnologie descriptive',
      tagline: 'Nommer et situer les parties d\'un organe, comme l\'ostéologie pour les os.',
      desc: 'Un organe tiré au sort (ou choisi) est affiché seul, découpé en parties : identifiez ses segments, faces, cavités et conduits.',
      meta: NS.SPLANCHNO.length + ' organes détaillés · ' + NS.SPLANCHNO.reduce((n, d) => n + d.parts.length, 0) + ' parties' },
    { id: 'nerfs', chapter: 'corps', kind: 'jeu', status: 'soon', icon: 'nerf',
      name: 'Les nerfs',
      tagline: 'Suivre les nerfs : origines, trajets et territoires.' },
    { id: 'vaisseaux', chapter: 'corps', kind: 'jeu', status: 'ready', icon: 'vaisseau', tint: 'lavande',
      name: 'Les vaisseaux sanguins',
      tagline: 'Reconnaître et situer les artères et les veines, zone par zone.',
      desc: 'Un vaisseau s\'illumine sur le corps en 3D : donnez son nom (Nommage), ou cliquez sur le vaisseau demandé (Ciblage).',
      meta: NS.VESSELS.length + ' vaisseaux · ' + NS.VESSELS.filter(v => v.principal).length + ' principaux' },

    /* ---------- 2. La langue médicale (nom temporaire) ---------- */
    { id: 'pathologies', chapter: 'langue', kind: 'jeu', status: 'soon', icon: 'pathologie',
      name: 'Les pathologies',
      tagline: 'Reconnaître les maladies et leurs termes.' },
    { id: 'termes-medicaux', chapter: 'langue', kind: 'jeu', status: 'soon', icon: 'termes',
      name: 'Les termes médicaux',
      tagline: 'Le vocabulaire du milieu médical : racines, examens, actes, spécialités et traitements.' },

    /* ---------- 3. Apprendre la Vie ---------- */
    { id: 'corps-humain', chapter: 'vie', kind: 'module', status: 'soon', icon: 'corps',
      name: 'Le corps humain',
      tagline: 'Explorer le corps en 3D : os, muscles, organes, nerfs et vaisseaux, avec leur fiche.' }
  ];

  const gamesOf = chId => GAMES.filter(g => g.chapter === chId);
  const GAME = {};
  GAMES.forEach(g => { GAME[g.id] = g; });
  const CHAPTER = {};
  CHAPTERS.forEach(c => { CHAPTER[c.id] = c; });
  const GROUP = {};
  GROUPS.forEach(r => {
    GROUP[r.id] = r;
    r.games = GAMES.filter(g => g.group === r.id);
    r.status = r.games.some(g => g.status === 'ready') ? 'ready' : 'soon';
  });

  /* Les cartes d'un chapitre, dans l'ordre : un jeu seul, ou un groupe à la place de son premier jeu */
  function cardsOf(chId) {
    const cartes = [];
    gamesOf(chId).forEach(g => {
      if (!g.group) cartes.push(g);
      else if (GROUP[g.group].games[0] === g) cartes.push(GROUP[g.group]);
    });
    return cartes;
  }

  Object.assign(NS, { CHAPTERS, CHAPTER, GAMES, GAME, GROUPS, GROUP, gamesOf, cardsOf });
})(AQ.data);
