/* ==========================================================================
   monde/quiz-oceans-mers.js — Catégorie de quiz « Les océans et mers »

   Même carte que le module « Apprendre les mers et océans du monde » (data/monde/carte-mers.js,
   à charger avant) : océans, mers, golfes et détroits, sur le fond des pays du monde.
   Le joueur choisit les niveaux de difficulté à deviner (mode « par niveaux », Facile coché au
   départ) ; les détroits trop étroits pour être cliqués sont signalés par un point.
   Sa place dans le menu : { quiz: 'oceans-mers' } dans js/menu.js.
   ========================================================================== */
(function () {
  'use strict';

  const carte = GeoCarte.obtenir('monde-mers');
  if (!carte) {
    console.error('monde/quiz-oceans-mers.js : data/monde/carte-mers.js doit être chargé avant ce fichier');
    return;
  }

  // Un groupe par niveau de difficulté (propriété « niveau » des éléments de la carte)
  const NIVEAUX = { 1: 'Facile', 2: 'Moyen', 3: 'Difficile', 4: 'Expert' };
  const groupes = {};
  Object.keys(NIVEAUX).forEach((n) => {
    groupes[NIVEAUX[n]] = carte.elements.filter((e) => e.niveau === Number(n)).map((e) => e.code);
  });

  GeoNohyne.registerCategory({
    id: 'oceans-mers',
    titre: 'Les océans et mers',
    icone: '🌊',
    description: 'Situez les océans, mers, golfes et détroits du globe, du plus connu au plus pointu.',
    consigne: 'Un nom s\'affiche : cliquez sur le bon océan, la bonne mer, le bon golfe ou le bon détroit. ' +
              'Choisissez les niveaux de difficulté ; les détroits les plus étroits sont signalés par un point.',
    question: 'Où se trouve…',

    carte: 'monde-mers',
    fond: { carte: 'monde-pays' },

    unite: 'étendues d\'eau',
    nomTout: 'Tous les niveaux',        // mode record : tous les niveaux, ou un seul
    nomGroupes: 'niveaux',
    groupes,
    modeInitial: 'groupes',            // l'écran de choix s'ouvre sur « Par niveaux »…
    groupesInitiaux: ['Facile']        // … avec seulement le niveau Facile coché
  });
})();
