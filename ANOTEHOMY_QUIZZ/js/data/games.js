/* ==========================================================================
   Anotehomy Quizz - data/games.js
   CATALOGUE DES CATEGORIES ET DES JEUX (ecran d'accueil)
   --------------------------------------------------------------------------
   Pour ajouter un jeu : ajouter une entree dans GAMES avec la categorie
   voulue. status : 'ready' = jouable, 'soon' = annonce mais verrouille.
   Une categorie est verrouillee tant qu'elle n'a aucun jeu 'ready'.
   ========================================================================== */
(function (NS) {
  'use strict';

  const CATEGORIES = [
    { id: 'muscles', name: 'Les muscles', icon: 'muscle',
      desc: 'Muscles squelettiques : situation, insertions et actions.' },
    { id: 'os', name: 'Les os', icon: 'bone',
      desc: 'Squelette humain et anatomie descriptive des os.' },
    { id: 'vaisseaux', name: 'Les vaisseaux sanguins', icon: 'vessel',
      desc: 'Arteres et veines : trajets, branches et territoires.' }
  ];

  const GAMES = [
    { id: 'os-squelette', category: 'os', num: 1, status: 'ready',
      name: 'Les os du squelette',
      tagline: 'Reconnaitre et localiser chaque os du corps humain.',
      desc: 'Un os s\'illumine sur le squelette 3D : donnez son nom (mode Nommage), ou cliquez sur l\'os demande (mode Ciblage).',
      meta: [NS.BONES.length + ' os', 'Nommage ou ciblage', 'Squelette 3D'] },
    { id: 'os-descriptive', category: 'os', num: 2, status: 'ready',
      name: 'Osteologie descriptive',
      tagline: 'Nommer et localiser les parties d\'un os.',
      desc: 'Un os tire au sort (ou choisi) est affiche seul, decoupe en parties : identifiez ses reliefs et ses reperes (processus, fosses, incisures, tuberosites...).',
      meta: [NS.OSTEO.length + ' os detailles', NS.OSTEO.reduce((n, d) => n + d.parts.length, 0) + ' parties', 'Nommage ou ciblage'] },
    { id: 'muscles-localisation', category: 'muscles', num: 1, status: 'ready',
      name: 'Les muscles du corps humain',
      tagline: 'Reconnaitre et localiser les muscles du corps humain.',
      desc: 'Un muscle s\'illumine sur le corps en 3D : donnez son nom (mode Nommage), ou cliquez sur le muscle demande (mode Ciblage). Muscles principaux ou tous les muscles, zone par zone.',
      meta: [NS.MUSCLES.length + ' muscles', NS.MUSCLES.filter(m => m.principal).length + ' principaux', 'Nommage ou ciblage'] }
  ];

  const gamesOf = catId => GAMES.filter(g => g.category === catId);
  const isOpen = catId => gamesOf(catId).some(g => g.status === 'ready');
  const GAME = {};
  GAMES.forEach(g => { GAME[g.id] = g; });
  const CATEGORY = {};
  CATEGORIES.forEach(c => { CATEGORY[c.id] = c; });

  Object.assign(NS, { CATEGORIES, CATEGORY, GAMES, GAME, gamesOf, isOpen });
})(AQ.data);
