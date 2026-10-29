/* ==========================================================================
   monde/quiz-pays.js — Catégorie de quiz « Les pays du monde »

   Sur le modèle de « Les Départements » : un nom s'affiche, on clique sur le bon pays.
   196 pays (membres de l'ONU, Vatican, Kosovo, Taïwan). Les territoires rattachés comptent
   pour leur pays (un clic sur le Groenland = le Danemark). Les micro-États, signalés par un
   point facile à cliquer, sont hors du tirage « par nombre » sauf si la case est cochée
   (comme l'Outre-Mer pour les départements) ; le mode « par continents » les inclut.
   Données : data/monde/carte-pays.js et data/monde/infos-pays.js (à charger avant).
   Sa place dans le menu : { quiz: 'pays' } dans js/menu.js.
   ========================================================================== */
(function () {
  'use strict';

  const INFOS = (window.GeoInfos || {})['monde-pays'];
  if (!INFOS) {
    console.error('monde/quiz-pays.js : data/monde/infos-pays.js doit être chargé avant ce fichier');
    return;
  }

  const SEUIL_MICRO_ETAT = 1000;    // km² : en dessous, le pays est un micro-État (case à cocher)

  // Un groupe par continent
  const groupes = {};
  INFOS.continents.forEach((c) => { groupes[c] = []; });
  Object.keys(INFOS.zones).forEach((code) => groupes[INFOS.zones[code].continent].push(code));

  const microEtats = Object.keys(INFOS.zones).filter((c) => INFOS.zones[c].superficie < SEUIL_MICRO_ETAT);

  GeoNohyne.registerCategory({
    id: 'pays',
    titre: 'Les pays du monde',
    icone: '🌍',
    description: 'Placez les 196 pays sur la carte du monde, en entier ou continent par continent.',
    consigne: 'Un nom s\'affiche : cliquez sur le bon pays de la carte (ses territoires lointains comptent aussi, ' +
              'comme le Groenland pour le Danemark). Jouez sur le monde entier ou par continents.',
    question: 'Où se trouve…',

    carte: 'monde-pays',

    unite: 'pays',
    libelleIndice: 'Afficher le continent à côté du nom : « Mongolie (Asie) »',
    indice: (zone) => (INFOS.zones[zone.code] || {}).continent || '',

    zonesOptionnelles: {
      codes: microEtats,
      libelle: 'Inclure les ' + microEtats.length + ' micro-États (Vatican, Monaco, Tuvalu…) : ' +
               'ils sont signalés sur la carte par un point, facile à cliquer'
    },

    // Par continents : la carte se cadre sur les continents choisis.
    // Mode record : le monde complet (196 pays, micro-États compris) ou un seul continent.
    nomTout: 'Monde complet',
    nomGroupes: 'continents',
    groupes
  });
})();
