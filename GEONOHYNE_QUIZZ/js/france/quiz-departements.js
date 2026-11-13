/* ==========================================================================
   france/quiz-departements.js — Catégorie de quiz « Les départements et leurs préfectures »

   Ce fichier sert de MODÈLE pour les futures catégories : il déclare au noyau
   (core.js) les textes du jeu et l'identifiant de la carte à utiliser.
   La carte elle-même est dans data/france/carte-departements.js.
   Sa place dans le menu : { quiz: 'departements' } dans js/menu.js.
   La carte du menu réunit deux quiz : celui-ci (les départements, colonne de gauche de l'écran de choix)
   et celui des préfectures (js/france/quiz-prefectures.js, colonne de droite).
   ========================================================================== */
GeoNohyne.registerCategory({
  id: 'departements',
  titre: 'Les départements et leurs préfectures',
  icone: '🗺️',
  description: 'Placer et deviner les départements français et leurs préfectures sur une carte.',
  consigne: 'Un nom s\'affiche : cliquez sur le bon département de la carte. ' +
            'Choisissez la longueur de la partie.',
  question: 'Où se trouve…',

  // Écran de choix : nom de ce quiz dans le sélecteur « Sujet du jeu », et l'autre sujet : les préfectures
  nomColonne: 'Départements',
  colonneDroite: 'prefectures',

  // Identifiant de la carte, donné par son fichier de data/ : GeoCarte.enregistrer('france-departements', …)
  carte: 'france-departements',

  unite: 'départements',
  // Ordre INSEE (en indice) : rien, le code à côté du nom, ou en plus les questions dans l'ordre des codes
  nomIndice: 'Ordre INSEE (en indice)',
  aideIndice: 'Le code à côté du nom ; « ordre » : questions dans l\'ordre des codes',
  indices: [
    { id: 'code', libelle: 'code', titre: 'Afficher le code du département à côté du nom : « Nom (XX) »', texte: (zone) => zone.code },
    { id: 'ordre', libelle: 'ordre + code', titre: 'Les questions dans l\'ordre des codes INSEE (… 67 Bas-Rhin, 68 Haut-Rhin …), avec le code à côté du nom',
      texte: (zone) => zone.code, ordonne: true }
  ],

  // Départements d'Outre-Mer : absents du tirage « par nombre » sauf si la case est cochée
  zonesOptionnelles: {
    codes: ['971', '972', '973', '974', '976'],
    libelle: 'Inclure les départements d\'Outre-Mer (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte)',
    libelleCourt: 'Inclure l\'Outre-Mer (5 départements)'
  },

  // Sélection par régions (nouvelles régions, depuis 2016) : codes des départements de chacune.
  // Mode record : la France entière (101 départements) ou une seule région.
  nomTout: 'France entière',
  nomGroupes: 'régions',
  groupes: {
    'Auvergne-Rhône-Alpes': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
    'Bourgogne-Franche-Comté': ['21', '25', '39', '58', '70', '71', '89', '90'],
    'Bretagne': ['22', '29', '35', '56'],
    'Centre-Val de Loire': ['18', '28', '36', '37', '41', '45'],
    'Corse': ['2A', '2B'],
    'Grand Est': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
    'Hauts-de-France': ['02', '59', '60', '62', '80'],
    'Île-de-France': ['75', '77', '78', '91', '92', '93', '94', '95'],
    'Normandie': ['14', '27', '50', '61', '76'],
    'Nouvelle-Aquitaine': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
    'Occitanie': ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
    'Outre-Mer': ['971', '972', '973', '974', '976'],
    'Pays de la Loire': ['44', '49', '53', '72', '85'],
    'Provence-Alpes-Côte d\'Azur': ['04', '05', '06', '13', '83', '84']
  }
});
