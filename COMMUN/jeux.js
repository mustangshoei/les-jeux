/* ==========================================================================
   COMMUN/jeux.js — Liste des jeux et sélecteur « Changer de jeu »

   JEUX ci-dessous est la seule liste des jeux du dossier : elle remplit la page d'accueil
   (index.html à la racine) et le sélecteur de chaque jeu. Pour ajouter un jeu : une ligne ici
   (son dossier doit contenir un index.html), puis le sélecteur dans le jeu (voir plus bas).
     id        identifiant du jeu ; c'est aussi le nom de son espace dans les comptes communs
               (Comptes.espace(id), COMMUN/comptes.js) : ne plus le changer une fois des parties jouées
     dossier   dossier du jeu, à la racine
     nom, icone, description   textes du sélecteur et de la page d'accueil
     version   version du jeu (MAJEUR.MINEUR.CORRECTIF), la même que dans son README : à changer avec lui
     modes     ses modes de jeu, pour les défis de la semaine (tableau de bord de l'administrateur) :
               { id, nom, groupe?, variantes?, bientot? }. id : celui du mode dans le jeu, ne plus le changer
               une fois des défis préparés ; groupe : intertitre (« France », « Les os »…) ; variantes : façons
               de jouer proposées pour le défi ; bientot : mode annoncé mais pas encore jouable
   VERSION est celle de l'ensemble (COMMUN/, SERVEUR/, page d'accueil) : « Versions » dans le README à la racine.

   SÉLECTEUR : dans la page d'un jeu, un élément
       <div class="jeux-coin" data-jeux-selecteur="id-du-jeu"></div>
   reçoit un bouton qui ouvre la liste des autres jeux (le jeu courant y est marqué « vous y êtes »).
   Le jeu place cet élément (en haut à droite) et choisit quand il est visible, dans SA feuille de
   style ; il peut aussi régler les couleurs du sélecteur (variables --jx-*, voir COMMUN/jeux.css).
   Si ce fichier manque, le jeu fonctionne normalement, simplement sans sélecteur.
   ========================================================================== */
(function () {
  'use strict';

  const VERSION = '1.1.1';

  const CIBLAGE = ['Ciblage', 'Nommage'];
  const NOMMAGE = ['Nommage', 'Ciblage'];
  const DUEL = ['Solo', 'Duel'];

  const JEUX = [
    { id: 'geonohyne', dossier: 'GEONOHYNE_QUIZZ', nom: 'GéoNohyne Quizz', icone: '🌍', version: '2.1.0',
      description: 'Géographie : départements, fleuves, pays et mers du monde.',
      modes: [
        { id: 'departements', nom: 'Les départements et leurs préfectures', groupe: 'France', variantes: CIBLAGE },
        { id: 'fleuves', nom: 'Fleuves & Océans', groupe: 'France', variantes: CIBLAGE },
        { id: 'grand-chemin', nom: 'Le Grand Chemin', groupe: 'France' },
        { id: 'morpion', nom: 'Morpion des Départements', groupe: 'France', variantes: DUEL },
        { id: 'liste', nom: 'La Liste des Départements', groupe: 'France' },
        { id: 'codage', nom: 'Codage – Encodage', groupe: 'France' },
        { id: 'entonnoir', nom: 'L\'Entonnoir', groupe: 'France' },
        { id: 'pays', nom: 'Les pays du monde', groupe: 'Monde', variantes: CIBLAGE },
        { id: 'capitales', nom: 'Les capitales du monde', groupe: 'Monde', variantes: CIBLAGE, bientot: true },
        { id: 'oceans-mers', nom: 'Les océans et mers', groupe: 'Monde', variantes: CIBLAGE },
        { id: 'morpion-monde', nom: 'Le morpion du monde', groupe: 'Monde', variantes: DUEL, bientot: true },
        { id: 'grand-chemin-monde', nom: 'Le Grand Chemin du monde', groupe: 'Monde', bientot: true }
      ] },
    { id: 'anotehomy', dossier: 'ANOTEHOMY_QUIZZ', nom: 'Anotehomy Quizz', icone: '🦴', version: '2.1.0',
      description: 'Anatomie humaine en 3D : os, ostéologie descriptive, muscles, vaisseaux sanguins.',
      modes: [
        { id: 'os-squelette', nom: 'Les os du squelette', groupe: 'Ostéologie des humains', variantes: NOMMAGE },
        { id: 'os-descriptive', nom: 'Ostéologie descriptive', groupe: 'Ostéologie des humains', variantes: NOMMAGE },
        { id: 'muscles-localisation', nom: 'Les muscles du corps humain', groupe: 'Le corps humain', variantes: NOMMAGE },
        { id: 'organes', nom: 'Les organes', groupe: 'Splanchnologie des humains', bientot: true },
        { id: 'splanchnologie', nom: 'Splanchnologie descriptive', groupe: 'Splanchnologie des humains', bientot: true },
        { id: 'nerfs', nom: 'Les nerfs', groupe: 'Le corps humain', bientot: true },
        { id: 'vaisseaux', nom: 'Les vaisseaux sanguins', groupe: 'Le corps humain', variantes: NOMMAGE },
        { id: 'pathologies', nom: 'Les pathologies', groupe: 'La langue médicale', bientot: true },
        { id: 'termes-medicaux', nom: 'Les termes médicaux', groupe: 'La langue médicale', bientot: true }
      ] },
    { id: 'histehory', dossier: 'HISTEHORY_QUIZZ', nom: 'Histehory Quizz', icone: '📜', version: '0.1.0',
      description: 'Histoire : dates, personnages, chronologie, vrai ou faux.',
      modes: [
        { id: 'date', nom: 'Trouver la date', bientot: true },
        { id: 'personne', nom: 'Deviner la personne', bientot: true },
        { id: 'chronologie', nom: 'Chronologie aléatoire', bientot: true },
        { id: 'vrai-faux', nom: 'Vrai ou Faux', bientot: true }
      ] }
  ];

  // Racine du dossier des jeux (celle qui contient COMMUN/) : les liens marchent avec ou sans serveur
  const SCRIPT = document.currentScript;
  const RACINE = new URL('../', SCRIPT && SCRIPT.src ? SCRIPT.src : location.href).href;
  const lien = (jeu) => RACINE + jeu.dossier + '/index.html';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ICONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/>' +
    '<rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/>' +
    '<rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/></svg>';

  let numero = 0;

  function selecteur(conteneur, idCourant) {
    const id = 'jx-menu-' + (++numero);
    conteneur.innerHTML =
      '<div class="jx-selecteur">' +
        '<button type="button" class="jx-bouton" aria-haspopup="true" aria-expanded="false" aria-controls="' + id + '" title="Changer de jeu">' +
          ICONE + '<span class="jx-libelle">Jeux</span></button>' +
        '<div class="jx-menu" id="' + id + '" hidden>' +
          '<p class="jx-titre">Changer de jeu</p>' +
          JEUX.map((j) => {
            const ici = j.id === idCourant;
            const corps = '<span class="jx-icone" aria-hidden="true">' + esc(j.icone) + '</span><span class="jx-texte"><b>' + esc(j.nom) +
              '</b><small>' + esc(ici ? 'Vous y êtes' + (j.version ? ' · version ' + j.version : '') : j.description) + '</small></span>';
            return ici ? '<span class="jx-jeu is-ici" aria-current="page">' + corps + '</span>'
              : '<a class="jx-jeu" href="' + esc(lien(j)) + '">' + corps + '</a>';
          }).join('') +
          '<p class="jx-note">Votre compte est commun à tous les jeux : vous restez connecté en changeant de jeu.</p>' +
          '<a class="jx-accueil" href="' + esc(RACINE + 'index.html') + '">Tous les jeux</a>' +
        '</div>' +
      '</div>';

    const bouton = conteneur.querySelector('.jx-bouton');
    const menu = conteneur.querySelector('.jx-menu');
    const ouvrir = (oui) => {
      menu.hidden = !oui;
      bouton.setAttribute('aria-expanded', String(oui));
      conteneur.classList.toggle('is-ouvert', oui);
    };
    bouton.addEventListener('click', () => ouvrir(menu.hidden));
    document.addEventListener('click', (e) => { if (!menu.hidden && !conteneur.contains(e.target)) ouvrir(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) { ouvrir(false); bouton.focus(); }
    });
  }

  function brancher() {
    document.querySelectorAll('[data-jeux-selecteur]').forEach((el) => selecteur(el, el.dataset.jeuxSelecteur));
  }

  window.Jeux = {
    version: VERSION,
    liste: JEUX.map((j) => Object.assign({}, j, { modes: (j.modes || []).map((m) => Object.assign({}, m)) })),
    lien, racine: RACINE, selecteur
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancher);
  else brancher();
})();
