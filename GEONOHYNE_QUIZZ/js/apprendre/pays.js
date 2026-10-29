/* ==========================================================================
   apprendre/pays.js — Module « Apprendre les pays »

   Mode exploration : la carte du monde (196 pays) ; un clic sur un pays (ou la barre de
   recherche, qui accepte aussi les autres noms : « Myanmar », « Hollande »…) affiche sa fiche :
   continent, capitale, superficie, population, langues, monnaie, pays frontaliers, territoires.
   Les informations sont dans data/monde/infos-pays.js (à charger avant).
   Sa place dans le menu : { apprendre: 'pays' } dans js/menu.js.
   ========================================================================== */
(function () {
  'use strict';

  const INFOS = (window.GeoInfos || {})['monde-pays'];
  if (!INFOS) {
    console.error('apprendre/pays.js : data/monde/infos-pays.js doit être chargé avant ce fichier');
    return;
  }

  const nombre = (n) => Number(n).toLocaleString('fr-FR');

  // Autres noms acceptés par la recherche
  const alias = {};
  Object.keys(INFOS.zones).forEach((code) => { if (INFOS.zones[code].alias) alias[code] = INFOS.zones[code].alias; });

  GeoNohyne.registerApprentissage({
    id: 'pays',
    titre: 'Apprendre les pays',
    icone: '🌎',
    description: 'Explorez la carte du monde : capitale, population, langues, monnaie et voisins de chaque pays.',
    carte: 'monde-pays',
    unite: 'pays',
    recherche: 'Rechercher un pays (nom ou code ISO)…',
    credit: INFOS.source,
    alias,
    etiquette: (zone) => (INFOS.zones[zone.code] || {}).continent || '',   // à droite des résultats de recherche

    fiche(zone) {
      const i = INFOS.zones[zone.code];
      if (!i) return { sousTitre: 'Code ISO ' + zone.code, lignes: [] };
      const plusieurs = /[,;]|^\d/.test(i.langues);
      const lignes = [
        { libelle: 'Continent', valeur: i.continent },
        { libelle: 'Capitale', valeur: i.capitale, detail: i.capitaleDetail },
        { libelle: 'Superficie', valeur: nombre(i.superficie) + ' km²', detail: i.territoires ? 'Hors territoires rattachés' : '' },
        {
          libelle: 'Population',
          valeur: nombre(i.population) + ' habitants',
          detail: (i.populationNote ? 'Estimation' : 'Banque mondiale, ' + INFOS.anneePopulation) + ' · ' +
                  nombre(Math.round(i.population / i.superficie)) + ' hab./km²'
        },
        { libelle: plusieurs ? 'Langues officielles' : 'Langue officielle', valeur: i.langues },
        { libelle: 'Monnaie', valeur: i.monnaie },
        { libelle: 'Pays frontaliers', liens: i.voisins, vide: 'Aucune frontière terrestre', detail: i.voisinsNote }
      ];
      if (i.territoires) {
        lignes.push({
          libelle: 'Territoires rattachés',
          valeur: i.territoires.join(', '),
          detail: i.territoiresDetail || 'Dessinés avec le pays sur la carte : un clic dessus sélectionne le pays.'
        });
      }
      return { badge: zone.code, sousTitre: i.continent + ' · code ISO ' + zone.code, lignes };
    }
  });
})();
