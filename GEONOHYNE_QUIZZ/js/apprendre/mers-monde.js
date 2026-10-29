/* ==========================================================================
   apprendre/mers-monde.js — Module « Apprendre les mers et océans du monde »

   Océans, mers, golfes et détroits du globe (pas de fleuves), sur le fond des pays du monde.
   Les cases à cocher filtrent par niveau de difficulté (Facile, Moyen, Difficile, Expert) :
   les étendues décochées sont estompées, pour ne pas laisser de trou dans la carte.
   Un clic affiche la fiche : type, océan, superficie, profondeur, largeur (détroits), mers
   voisines ou mers reliées (cliquables), pays riverains.
   Données : data/monde/carte-mers.js, data/monde/infos-mers.js et la carte des pays (à charger avant).
   Sa place dans le menu : { apprendre: 'mers-monde' } dans js/menu.js.
   ========================================================================== */
(function () {
  'use strict';

  const INFOS = (window.GeoInfos || {})['monde-mers'];
  const carteMers = GeoCarte.obtenir('monde-mers');
  const cartePays = GeoCarte.obtenir('monde-pays');
  if (!INFOS || !carteMers || !cartePays) {
    console.error('apprendre/mers-monde.js : data/monde/carte-mers.js, infos-mers.js et carte-pays.js doivent être chargés avant');
    return;
  }

  const NIVEAUX = { 1: 'Facile', 2: 'Moyen', 3: 'Difficile', 4: 'Expert' };
  const BADGES = { ocean: '🌊', mer: '🌊', golfe: '⛵', detroit: '⚓' };

  // Noms des pays (riverains) et des mers (océan de rattachement, s'il est estompé par un filtre)
  const nomsPays = {};
  cartePays.elements.forEach((e) => { nomsPays[e.code] = e.nom; });
  const nomsMers = {};
  carteMers.elements.forEach((e) => { nomsMers[e.code] = e.nom; });
  const listePays = (codes) => codes.map((c) => nomsPays[c] || c).sort((a, b) => a.localeCompare(b, 'fr')).join(', ');

  GeoNohyne.registerApprentissage({
    id: 'mers-monde',
    titre: 'Apprendre les mers et océans du monde',
    icone: '⚓',
    description: 'Océans, mers, golfes et détroits du globe : superficie, profondeur, pays riverains.',
    carte: 'monde-mers',
    fond: { carte: 'monde-pays' },
    types: NIVEAUX,                   // une case à cocher par niveau de difficulté…
    champFiltre: 'niveau',            // … lu dans la propriété « niveau » des éléments
    filtresEstompes: true,
    nomsTypes: { ocean: 'Océan', mer: 'Mer', golfe: 'Golfe ou baie', detroit: 'Détroit' },
    unite: 'océans, mers, golfes et détroits',
    recherche: 'Rechercher un océan, une mer, un détroit…',
    libelleLiens: 'lié (océan, mers voisines)',
    credit: INFOS.source,

    fiche(zone) {
      const i = INFOS.zones[zone.code];
      if (!i) return { lignes: [] };
      const lignes = [{ libelle: 'Type', valeur: i.genre, detail: 'Difficulté : ' + NIVEAUX[zone.niveau] }];
      if (i.ocean) lignes.push({ libelle: 'Océan', liens: [i.ocean], vide: nomsMers[i.ocean] });
      if (i.superficie) lignes.push({ libelle: 'Superficie', valeur: i.superficie });
      if (i.profondeur) lignes.push({ libelle: 'Profondeur maximale', valeur: i.profondeur });
      if (i.largeur) lignes.push({ libelle: 'Largeur', valeur: i.largeur });
      lignes.push({ libelle: i.relie ? 'Relie' : 'Mers voisines', liens: i.voisines, vide: i.voisines.length ? 'Masquées par les filtres' : 'Aucune : mer fermée' });
      const antarctique = zone.code === 'austral' || i.ocean === 'austral';
      lignes.push({
        libelle: 'Pays riverains',
        valeur: i.riverains.length ? listePays(i.riverains) : antarctique ? 'Aucun : côtes de l\'Antarctique' : 'Aucun',
        detail: zone.type === 'ocean' ? 'Côtes de l\'océan lui-même, sans celles de ses mers' : ''
      });
      if (i.detail) lignes.push({ libelle: 'À savoir', valeur: i.detail });
      return { badge: BADGES[zone.type] || '🌊', sousTitre: i.genre + ' · ' + NIVEAUX[zone.niveau], lignes };
    }
  });
})();
