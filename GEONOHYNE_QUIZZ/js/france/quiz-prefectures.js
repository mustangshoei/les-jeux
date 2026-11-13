/* ==========================================================================
   france/quiz-prefectures.js — Catégorie de quiz « Les préfectures »

   Pas de carte à elle dans le menu : ce quiz est le second sujet de l'écran de choix de « Les
   départements et leurs préfectures » (colonneDroite: 'prefectures' dans js/france/quiz-departements.js),
   avec les mêmes réglages (ciblage ou nommage, mode record, au hasard ou par régions, Outre-Mer, ordre
   INSEE, indice, rattrapage). Il se joue sur la carte des départements, où chaque préfecture est un point :
     - ciblage : le nom d'une préfecture s'affiche, on clique sur son point (ou sur son département) ;
     - nommage : un département et sa préfecture s'allument, on tape le nom de la préfecture (fautes de
       frappe légères acceptées, article du début facultatif, « St » = « Saint », « Cergy » pour Pontoise).
   Ordre INSEE (en indice, option) : rien, le numéro du département à côté du nom (« Nancy (54) »), ou en plus
   les questions dans l'ordre des codes des départements.
   Ses records et ses statistiques sont à part (catégorie « Les préfectures »).

   Données : les noms dans data/france/infos-departements.js, les points dans data/france/points-prefectures.js
   (outils/placer-prefectures.py). Chargé après js/france/quiz-departements.js, dont il reprend les régions.
   ========================================================================== */
(function () {
  'use strict';

  const DEPARTEMENTS = GeoNohyne.trouver('quiz', 'departements');
  const INFOS = (window.GeoInfos || {})['france-departements'];
  const POINTS = (window.GeoPoints || {})['france-prefectures'];
  if (!DEPARTEMENTS || !INFOS || !POINTS) {
    console.error('quiz-prefectures.js : js/france/quiz-departements.js, data/france/infos-departements.js et ' +
      'data/france/points-prefectures.js doivent être chargés avant lui (index.html)');
    return;
  }

  // Nom de la préfecture d'un département : « Pontoise (préfecture installée à Cergy) » → « Pontoise »
  const prefecture = (code) => (INFOS.zones[code] ? INFOS.zones[code].prefecture.replace(/\s*\(.*\)\s*$/, '') : '');

  GeoNohyne.registerCategory({
    id: 'prefectures',
    titre: 'Les préfectures',
    icone: '🏛️',
    description: 'Placez et nommez la préfecture de chaque département.',
    question: 'Où se trouve…',
    questionNommage: 'Quelle est la préfecture du département en surbrillance ?',
    consigneNommage: 'Tapez le nom de sa préfecture, puis Entrée.',
    aideCiblage: 'Une préfecture s\'affiche : cliquez sur son point',
    aideNommage: 'Un département s\'allume : tapez sa préfecture',
    nomColonne: 'Préfectures',

    // La carte des départements ; la zone à trouver est le département, sous le nom de sa préfecture
    carte: DEPARTEMENTS.carte,
    nomZone: (zone) => prefecture(zone.code),
    detail: (zone) => zone.nom,                       // dans les messages : « Nancy (Meurthe-et-Moselle) »
    points: POINTS.points,
    nomPoints: 'préfecture',
    credit: POINTS.source,

    // Nommage : fautes de frappe légères acceptées ; les services du Val-d'Oise sont installés à Cergy
    tolerance: true,
    alias: { '95': ['Cergy', 'Cergy-Pontoise'] },

    unite: 'préfectures',
    // Ordre INSEE (en indice) : rien, le numéro du département à côté du nom, ou en plus les questions dans l'ordre
    nomIndice: 'Ordre INSEE (en indice)',
    aideIndice: 'Le n° du département à côté du nom ; « ordre » : questions dans l\'ordre',
    indices: [
      { id: 'code', libelle: 'code', titre: 'Afficher le numéro du département à côté du nom : « Nancy (54) »', texte: (zone) => zone.code },
      { id: 'ordre', libelle: 'ordre + code', titre: 'Les questions dans l\'ordre des codes INSEE des départements (… 54 Nancy, 55 Bar-le-Duc …), avec le numéro à côté du nom',
        texte: (zone) => zone.code, ordonne: true }
    ],

    // Les mêmes régions et le même Outre-Mer que les départements
    zonesOptionnelles: {
      codes: DEPARTEMENTS.zonesOptionnelles.codes,
      libelle: 'Inclure les préfectures d\'Outre-Mer (Basse-Terre, Fort-de-France, Cayenne, Saint-Denis, Mamoudzou)',
      libelleCourt: 'Inclure l\'Outre-Mer (5 préfectures)'
    },
    nomTout: DEPARTEMENTS.nomTout,
    nomGroupes: DEPARTEMENTS.nomGroupes,
    groupes: DEPARTEMENTS.groupes
  });
})();
