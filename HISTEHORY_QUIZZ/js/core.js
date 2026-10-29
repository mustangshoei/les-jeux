/* ==========================================================================
   core.js — Noyau de Histehory Quizz

   Pour l'instant : l'enregistrement des modes de jeu et le passage d'un écran à l'autre.
   Aucun mode n'est encore développé : la page d'accueil (js/menu.js) les affiche grisés.

   CONTRAT D'UN MODE DE JEU (Histehory.registerMode)
     id, titre, ouvrir()   obligatoires (carte de l'accueil : { mode: 'id' } dans js/menu.js)
     icone, description    textes de la carte de l'accueil
   Un mode affiche son écran (une <section class="screen"> de index.html) avec Histehory.afficher(id) ;
   un élément data-action="menu" ramène à l'accueil. Les parties s'enregistrent pour le joueur
   (compte ou invité) avec HistProfils.enregistrerPartie (js/profils.js).
   ========================================================================== */
(function () {
  'use strict';

  const modes = [];               // modes de jeu enregistrés, dans l'ordre

  function registerMode(def) {
    if (!def || !def.id || !def.titre || typeof def.ouvrir !== 'function') {
      throw new Error('Histehory.registerMode : id, titre et ouvrir sont obligatoires');
    }
    if (modes.some((m) => m.id === def.id)) throw new Error('Histehory.registerMode : mode déjà enregistré (' + def.id + ')');
    modes.push(def);
  }

  // Pour l'accueil (js/menu.js) : mode enregistré, ou null s'il n'est pas chargé
  const trouver = (id) => modes.find((m) => m.id === id) || null;

  function ouvrir(id) {
    const m = trouver(id);
    if (m) m.ouvrir();
  }

  function afficher(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('hidden', s.id !== id));
    document.body.dataset.ecran = id;            // pour la feuille de style (ex. boutons du haut cachés en partie)
    window.scrollTo(0, 0);
  }

  // data-action="menu" : retour à l'accueil
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="menu"]')) afficher('screen-menu');
  });

  window.Histehory = { registerMode, trouver, ouvrir, afficher };
})();
