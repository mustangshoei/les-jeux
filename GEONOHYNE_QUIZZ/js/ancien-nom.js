/* ==========================================================================
   ancien-nom.js — Reprise des données enregistrées sous l'ancien nom du jeu (GéoQuiz)

   Le jeu s'appelait GéoQuiz : ses réglages et les statistiques de l'invité étaient rangés dans le
   navigateur sous des clés « geoquiz.* », et la copie hors ligne d'un compte sous
   « comptes.donnees.geoquiz ». Chargé en premier (dans <head>), ce fichier les
   renomme une fois pour toutes en « geonohyne.* » et « comptes.donnees.geonohyne », sans écraser une
   clé qui existe déjà sous le nouveau nom. Il ne touche à aucune clé d'un autre jeu.
   La clé « geoquiz.session » (connexion d'avant les comptes communs) reste : js/profils.js la reprend.
   ========================================================================== */
(function () {
  'use strict';

  const ANCIEN = 'geoquiz.';
  const NOUVEAU = 'geonohyne.';
  const GARDEE = 'geoquiz.session';
  const COPIE_COMPTE = ['comptes.donnees.geoquiz', 'comptes.donnees.geonohyne'];

  try {
    const renommages = [];
    for (let i = 0; i < localStorage.length; i++) {
      const cle = localStorage.key(i);
      if (cle && cle.indexOf(ANCIEN) === 0 && cle !== GARDEE) renommages.push([cle, NOUVEAU + cle.slice(ANCIEN.length)]);
    }
    if (localStorage.getItem(COPIE_COMPTE[0]) !== null) renommages.push(COPIE_COMPTE);
    renommages.forEach(([ancienne, nouvelle]) => {
      if (localStorage.getItem(nouvelle) === null) localStorage.setItem(nouvelle, localStorage.getItem(ancienne));
      localStorage.removeItem(ancienne);
    });
  } catch (e) { /* navigateur sans stockage : rien à reprendre */ }
})();
