/* ==========================================================================
   Natehure Quizz - core/namespace.js
   --------------------------------------------------------------------------
   Espace de noms global unique : window.NQ.
   Les scripts sont des scripts classiques charges dans l'ordre par index.html
   (et non des modules ES), afin que le jeu fonctionne en ouvrant directement
   index.html, sans serveur local. Chaque fichier ajoute ses fonctions dans
   l'un des sous-espaces ci-dessous :
     NQ.util    utilitaires generiques
     NQ.data    donnees (chapitres et cartes du menu, puis flore, cultures...)
     NQ.game    logique de jeu : menu, configuration, partie, resultats
     NQ.account compte du joueur (comptes communs a tous les jeux)
   ========================================================================== */
window.NQ = { util: {}, data: {}, game: {}, account: {} };
