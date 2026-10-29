/* ==========================================================================
   Anotehomy Quizz - core/namespace.js
   --------------------------------------------------------------------------
   Espace de noms global unique : window.AQ.
   Les scripts sont des scripts classiques charges dans l'ordre par index.html
   (et non des modules ES), afin que le jeu fonctionne en ouvrant directement
   index.html, sans serveur local. Chaque fichier ajoute ses fonctions dans
   l'un des sous-espaces ci-dessous :
     AQ.util    utilitaires generiques
     AQ.data    donnees anatomiques (regions, catalogue des os)
     AQ.geo     geometrie du squelette (primitives + vues)
     AQ.engine  moteur : rendu SVG, camera, surbrillance, interactions
     AQ.game    logique de jeu : correction, configuration, partie, resultats
     AQ.account compte du joueur (comptes communs a tous les jeux) et statistiques
   ========================================================================== */
window.AQ = { util: {}, data: {}, geo: {}, engine: {}, game: {}, account: {} };
