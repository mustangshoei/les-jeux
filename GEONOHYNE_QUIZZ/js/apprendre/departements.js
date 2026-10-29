/* ==========================================================================
   apprendre/departements.js — Module « Apprendre les départements »

   Mode exploration : la carte de France complète (Outre-Mer compris) ; un clic
   sur un département (ou la barre de recherche) affiche sa fiche à gauche.
   Les informations sont dans data/france/infos-departements.js (à charger avant).
   Ce fichier sert de MODÈLE pour les futurs modules d'apprentissage.
   Sa place dans le menu : { apprendre: 'departements' } dans js/menu.js.
   ========================================================================== */
(function () {
  'use strict';

  const INFOS = (window.GeoInfos || {})['france-departements'];
  if (!INFOS) {
    console.error('apprendre/departements.js : data/france/infos-departements.js doit être chargé avant ce fichier');
    return;
  }

  const nombre = (n) => Number(n).toLocaleString('fr-FR');

  // Régions (limites tracées sur la carte) : déduites des fiches
  const groupes = {};
  Object.keys(INFOS.zones).forEach((code) => {
    const r = INFOS.zones[code].region;
    (groupes[r] = groupes[r] || []).push(code);
  });

  GeoNohyne.registerApprentissage({
    id: 'departements',
    titre: 'Apprendre les départements',
    icone: '🗺️',
    description: 'Explorez la carte : région, préfecture, superficie, population et voisins de chaque département.',
    carte: 'france-departements',
    unite: 'départements',
    recherche: 'Rechercher un département (nom ou code)…',
    credit: INFOS.source,
    groupes,

    // Fiche d'un département, dans l'ordre d'affichage. Lignes : { libelle, valeur, detail }
    // ou { libelle, liens: [codes], vide } (liens cliquables vers d'autres zones de la carte)
    fiche(zone) {
      const i = INFOS.zones[zone.code];
      if (!i) return { sousTitre: 'Code INSEE ' + zone.code, lignes: [] };
      const lignes = [
        { libelle: 'Région', valeur: i.region },
        { libelle: 'Préfecture', valeur: i.prefecture }
      ];
      if (i.sousPrefectures.length) {
        lignes.push({
          libelle: i.sousPrefectures.length > 1 ? 'Sous-préfectures' : 'Sous-préfecture',
          valeur: i.sousPrefectures.join(', ')
        });
      }
      lignes.push(
        { libelle: 'Superficie', valeur: nombre(i.superficie) + ' km²' },
        {
          libelle: 'Population',
          valeur: nombre(i.population) + ' habitants',
          detail: 'Population légale ' + INFOS.anneePopulation + ' · ' +
                  nombre(Math.round(i.population / i.superficie)) + ' hab./km²'
        },
        { libelle: 'Départements frontaliers', liens: i.voisins, vide: i.voisinsNote || 'Aucun' }
      );
      return { sousTitre: 'Code INSEE ' + zone.code, lignes };
    }
  });
})();
