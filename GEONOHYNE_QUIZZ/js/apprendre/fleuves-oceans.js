/* ==========================================================================
   apprendre/fleuves-oceans.js — Module « Apprendre les fleuves et océans de France »

   France métropolitaine : mers et océans (Manche, mer du Nord, océan Atlantique,
   Méditerranée), principaux fleuves et rivières. Les départements servent de fond.
   Cases à cocher : l'utilisateur choisit ce qui est affiché (mers, fleuves, rivières).
   Données : data/france/carte-hydrographie.js et data/france/infos-hydrographie.js
   (générés par outils/construire-hydrographie.py), à charger avant ce fichier.
   ========================================================================== */
(function () {
  'use strict';

  const INFOS = (window.GeoInfos || {})['france-hydrographie'];
  if (!INFOS) {
    console.error('apprendre/fleuves-oceans.js : data/france/infos-hydrographie.js doit être chargé avant ce fichier');
    return;
  }

  const nombre = (n) => Number(n).toLocaleString('fr-FR');

  // Noms des départements (pour les côtes et les départements traversés)
  const nomsDep = {};
  const carteDep = GeoCarte.obtenir('france-departements');
  if (carteDep) carteDep.elements.forEach((e) => { nomsDep[e.code] = e.nom; });
  const listeDep = (codes) => codes.map((c) => (nomsDep[c] || c) + ' (' + c + ')').join(', ');

  // Affluents et fleuves côtiers : déduits du champ « embouchure » de chaque cours d'eau
  const affluents = {};
  Object.keys(INFOS.zones).forEach((code) => {
    const e = INFOS.zones[code].embouchure;
    if (e) (affluents[e] = affluents[e] || []).push(code);
  });

  const BADGES = { mer: '🌊', fleuve: '🏞️', riviere: '💧' };
  const TYPES = { fleuve: 'Fleuve', riviere: 'Rivière' };

  function ficheMer(zone, i) {
    const lignes = [{ libelle: 'Type', valeur: i.genre }];
    if (i.superficie) lignes.push({ libelle: 'Superficie', valeur: i.superficie, detail: i.detail });
    lignes.push({ libelle: 'Côtes françaises', valeur: listeDep(i.cotes || []) });
    if (i.riverains) lignes.push({ libelle: 'Pays riverains', valeur: i.riverains });
    lignes.push({ libelle: 'Cours d\'eau qui s\'y jettent', liens: affluents[zone.code] || [], vide: 'Aucun dans cette carte' });
    return { badge: BADGES.mer, sousTitre: i.genre + ' · France métropolitaine', lignes };
  }

  function ficheCoursDEau(zone, i) {
    const lignes = [
      { libelle: 'Type', valeur: TYPES[zone.type],
        detail: zone.type === 'fleuve' ? 'Un fleuve se jette dans une mer ou un océan.'
                                       : 'Une rivière se jette dans un autre cours d\'eau.' },
      { libelle: 'Longueur', valeur: nombre(i.longueur) + ' km' },
      { libelle: 'Source', valeur: i.source },
      { libelle: 'Se jette dans', liens: [i.embouchure], vide: i.lieu, detail: i.lieu }
    ];
    if (affluents[zone.code]) {
      lignes.push({ libelle: 'Principaux affluents', liens: affluents[zone.code], vide: 'Aucun affiché' });
    }
    lignes.push({
      libelle: 'Départements traversés',
      valeur: i.departements.length ? listeDep(i.departements) : 'Aucun',
      detail: i.departements.length > 1 ? 'De l\'amont vers l\'aval (ou le long de leur limite)' : ''
    });
    return { badge: BADGES[zone.type], sousTitre: TYPES[zone.type], lignes };
  }

  GeoNohyne.registerApprentissage({
    id: 'fleuves-oceans',
    titre: 'Apprendre les fleuves et océans de France',
    icone: '🌊',
    description: 'En France métropolitaine : mers et océans qui la bordent, fleuves et rivières (source, longueur, embouchure).',
    carte: 'france-hydrographie',
    fond: { carte: 'france-departements', exclure: ['971', '972', '973', '974', '976'] },
    types: { mer: 'Mers & océans', fleuve: 'Fleuves', riviere: 'Rivières' },
    nomsTypes: { mer: 'Mer / océan', fleuve: 'Fleuve', riviere: 'Rivière' },
    unite: 'mers, fleuves et rivières',
    recherche: 'Rechercher une mer, un fleuve, une rivière…',
    libelleLiens: 'lié (embouchure, affluent)',
    credit: INFOS.source,

    fiche(zone) {
      const i = INFOS.zones[zone.code];
      if (!i) return { lignes: [] };
      return zone.type === 'mer' ? ficheMer(zone, i) : ficheCoursDEau(zone, i);
    }
  });
})();
