/* ==========================================================================
   france/quiz-fleuves.js — Catégorie de quiz « Fleuves & Océans »

   Même carte que le module Apprendre (data/france/carte-hydrographie.js, à charger
   avant) : mers et océans, fleuves et rivières de France métropolitaine, sur le fond
   des départements. Le joueur choisit les types à deviner (mode « par types »).
   ========================================================================== */
(function () {
  'use strict';

  const carte = GeoCarte.obtenir('france-hydrographie');
  if (!carte) {
    console.error('france/quiz-fleuves.js : data/france/carte-hydrographie.js doit être chargé avant ce fichier');
    return;
  }

  // Types à deviner : un groupe par type de zone de la carte
  const NOMS = { mer: 'Mers & océans', fleuve: 'Fleuves', riviere: 'Rivières' };
  const groupes = {};
  Object.keys(NOMS).forEach((type) => {
    groupes[NOMS[type]] = carte.elements.filter((e) => e.type === type).map((e) => e.code);
  });

  GeoNohyne.registerCategory({
    id: 'fleuves',
    titre: 'Fleuves & Océans',
    icone: '🌊',
    description: 'Situez les mers, fleuves et rivières de France métropolitaine.',
    consigne: 'Un nom s\'affiche : cliquez sur la bonne mer, le bon fleuve ou la bonne rivière. ' +
              'Choisissez les types à deviner.',
    question: 'Où se trouve…',

    carte: 'france-hydrographie',
    fond: { carte: 'france-departements', exclure: ['971', '972', '973', '974', '976'] },

    unite: 'éléments',
    nomTout: 'Toute la carte',          // mode record : toute la carte, ou un seul type
    nomGroupes: 'types',
    groupes,
    modeInitial: 'groupes'      // l'écran de choix s'ouvre sur « Par types », tous cochés
  });
})();
