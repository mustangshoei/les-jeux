/* ==========================================================================
   menu.js — La page d'accueil : les modes de jeu

   Une carte par mode de jeu, dans l'ordre de MENU ci-dessous.
   RÈGLE (comme dans GéoNohyne Quizz) : une carte est active dès que le mode de même id est
   enregistré (Histehory.registerMode, js/core.js) ; elle affiche alors l'icône, le titre et la
   description du mode. Sinon elle reste GRISÉE avec le badge « Bientôt disponible » et affiche
   les textes donnés ici.

   POUR AJOUTER, DÉPLACER OU RENOMMER UNE CARTE : modifier MENU.
   Ce fichier est chargé en dernier dans index.html : il affiche les modes chargés avant lui.
   ========================================================================== */
(function () {
  'use strict';

  const MENU = [
    { mode: 'date',        icone: '📅', titre: 'Trouver la date',       description: 'Un événement historique : retrouvez sa date.' },
    { mode: 'personne',    icone: '🕵️', titre: 'Deviner la personne',   description: 'Un personnage historique se cache derrière les indices : qui est-ce ?' },
    { mode: 'chronologie', icone: '⏳', titre: 'Chronologie aléatoire', description: 'Des événements tirés au hasard, à remettre dans l\'ordre.' },
    { mode: 'vrai-faux',   icone: '⚖️', titre: 'Vrai ou Faux',          description: 'Une affirmation historique : vraie ou fausse ?' }
  ];

  function element(balise, classe, texte) {
    const el = document.createElement(balise);
    if (classe) el.className = classe;
    if (texte !== undefined) el.textContent = texte;
    return el;
  }

  // Une carte : active si son mode est chargé (textes du mode), sinon grisée (textes de MENU)
  function creerCarte(entree) {
    const def = Histehory.trouver(entree.mode);
    const el = element(def ? 'button' : 'div', 'cat-card' + (def ? '' : ' cat-card--soon'));
    if (def) {
      el.type = 'button';
      el.dataset.mode = entree.mode;
    } else {
      el.setAttribute('aria-disabled', 'true');
    }
    const haut = element('div', 'cat-top');
    const icone = element('span', 'cat-icon', (def && def.icone) || entree.icone);
    icone.setAttribute('aria-hidden', 'true');
    haut.append(icone, element('span', 'badge ' + (def ? 'badge--ok' : 'badge--soon'), def ? 'Disponible' : 'Bientôt disponible'));
    el.append(
      haut,
      element('h3', 'cat-title', (def && def.titre) || entree.titre),
      element('p', 'cat-desc', (def && def.description) || entree.description)
    );
    return el;
  }

  function init() {
    const grille = document.getElementById('menu-modes');
    grille.replaceChildren(...MENU.map(creerCarte));
    grille.addEventListener('click', (e) => {
      const carte = e.target.closest('[data-mode]');
      if (carte) Histehory.ouvrir(carte.dataset.mode);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
