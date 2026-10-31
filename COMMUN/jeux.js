/* ==========================================================================
   COMMUN/jeux.js — Liste des jeux et sélecteur « Changer de jeu »

   JEUX ci-dessous est la seule liste des jeux du dossier : elle remplit la page d'accueil
   (index.html à la racine) et le sélecteur de chaque jeu. Pour ajouter un jeu : une ligne ici
   (son dossier doit contenir un index.html), puis le sélecteur dans le jeu (voir plus bas).
     id        identifiant du jeu ; c'est aussi le nom de son espace dans les comptes communs
               (Comptes.espace(id), COMMUN/comptes.js) : ne plus le changer une fois des parties jouées
     dossier   dossier du jeu, à la racine
     nom, icone, description   textes du sélecteur et de la page d'accueil
     couleur, accent   les deux couleurs du jeu, reprises de SA feuille de style : couleur = son fond
               (la couleur dominante de son thème), accent = sa couleur d'action. La page d'accueil en
               fait le grand rectangle du jeu ; à changer si le thème du jeu change.
     totaux    où lire les statistiques du joueur pour ce jeu (page d'accueil, bouton « Statistiques ») :
               { cle, parties, bonnes, questions, temps, ms }. cle = le champ qui porte les totaux dans
               l'espace du jeu ; les quatre suivants = les noms de ses compteurs (chaque jeu a les siens) ;
               ms : le temps est en millisecondes (sinon en secondes). Absent = le jeu ne compte rien
               encore : la page d'accueil l'indique au lieu d'inventer des zéros.
     version   version du jeu (MAJEUR.MINEUR.CORRECTIF), la même que dans son README : à changer avec lui
     modes     ses modes de jeu, pour les défis de la semaine (tableau de bord de l'administrateur) :
               { id, nom, groupe?, variantes?, bientot? }. id : celui du mode dans le jeu, ne plus le changer
               une fois des défis préparés ; groupe : intertitre (« France », « Les os »…) ; variantes : façons
               de jouer proposées pour le défi ; bientot : mode annoncé mais pas encore jouable
   ACCÈS (deux réglages, indépendants) : ils ne touchent QUE la navigation par l'interface publique.
   Le dossier du jeu n'est pas modifié : son index.html reste entièrement fonctionnel si on l'ouvre
   à la main (double-clic, ou son adresse tapée dans le navigateur).
     masque    le jeu disparaît de la page d'accueil ET du menu « Jeux » des autres jeux : aucun lien
               n'y mène plus. Le jeu garde son propre menu « Jeux », pour en ressortir.
     bloque    le jeu reste VISIBLE (page d'accueil et menu « Jeux »), mais sa tuile n'est plus un
               lien : elle est inerte (aria-disabled, pointer-events: none), avec la mention « Fermé ».
   Les deux réglages ne concernent pas le tableau de bord de l'administrateur : les défis de la
   semaine se préparent pour tous les jeux, masqués ou bloqués compris.
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

  const VERSION = '1.2.0';

  const CIBLAGE = ['Ciblage', 'Nommage'];
  const NOMMAGE = ['Nommage', 'Ciblage'];
  const DUEL = ['Solo', 'Duel'];

  const JEUX = [
    { id: 'geonohyne', dossier: 'GEONOHYNE_QUIZZ', nom: 'GéoNohyne Quizz', icone: '🌍', version: '2.1.0',
      couleur: '#0d3b4a', accent: '#ff7a59',
      description: 'Géographie : départements, fleuves, pays et mers du monde.',
      totaux: { cle: 'totaux', parties: 'parties', bonnes: 'bonnes', questions: 'questions', temps: 'tempsMs', ms: true },
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
    { id: 'anotehomy', dossier: 'ANOTEHOMY_QUIZZ', nom: 'Anotehomy Quizz', icone: '🦴', version: '2.3.0',
      couleur: '#3a1529', accent: '#ff5c8a',
      description: 'Anatomie humaine en 3D : os, ostéologie descriptive, muscles, vaisseaux sanguins, organes, splanchnologie descriptive.',
      totaux: { cle: 'totals', parties: 'played', bonnes: 'ok', questions: 'questions', temps: 'time', ms: false },
      modes: [
        { id: 'os-squelette', nom: 'Les os du squelette', groupe: 'Ostéologie des humains', variantes: NOMMAGE },
        { id: 'os-descriptive', nom: 'Ostéologie descriptive', groupe: 'Ostéologie des humains', variantes: NOMMAGE },
        { id: 'muscles-localisation', nom: 'Les muscles du corps humain', groupe: 'Le corps humain', variantes: NOMMAGE },
        { id: 'organes', nom: 'Les organes', groupe: 'Splanchnologie des humains', variantes: NOMMAGE },
        { id: 'splanchnologie', nom: 'Splanchnologie descriptive', groupe: 'Splanchnologie des humains', variantes: NOMMAGE },
        { id: 'nerfs', nom: 'Les nerfs', groupe: 'Le corps humain', bientot: true },
        { id: 'vaisseaux', nom: 'Les vaisseaux sanguins', groupe: 'Le corps humain', variantes: NOMMAGE },
        { id: 'pathologies', nom: 'Les pathologies', groupe: 'La langue médicale', bientot: true },
        { id: 'termes-medicaux', nom: 'Les termes médicaux', groupe: 'La langue médicale', bientot: true }
      ] },
    /* bloque : la tuile reste visible, partout, mais elle n'est plus cliquable */
    { id: 'histehory', dossier: 'HISTEHORY_QUIZZ', nom: 'Histehory Quizz', icone: '📜', version: '0.1.0', bloque: true,
      couleur: '#33230d', accent: '#f59e0b',
      description: 'Histoire : dates, personnages, chronologie, vrai ou faux.',
      modes: [
        { id: 'date', nom: 'Trouver la date', bientot: true },
        { id: 'personne', nom: 'Deviner la personne', bientot: true },
        { id: 'chronologie', nom: 'Chronologie aléatoire', bientot: true },
        { id: 'vrai-faux', nom: 'Vrai ou Faux', bientot: true }
      ] },
    /* bloque : la tuile reste visible, partout, mais elle n'est plus cliquable */
    { id: 'natehure', dossier: 'NATEHURE_QUIZZ', nom: 'Natehure Quizz', icone: '🌿', version: '0.1.0', bloque: true,
      couleur: '#12331f', accent: '#5fe08a',
      description: 'Nature, agriculture & végétaux : botanique, flore, arbres, champignons, cultures et récoltes.',
      modes: [
        { id: 'anatomie-plante', nom: 'L\'anatomie de la plante', groupe: 'Biologie & Anatomie végétale', bientot: true },
        { id: 'cellule-vegetale', nom: 'La cellule végétale', groupe: 'Biologie & Anatomie végétale', bientot: true },
        { id: 'photosynthese', nom: 'La photosynthèse', groupe: 'Biologie & Anatomie végétale', bientot: true },
        { id: 'seve', nom: 'La sève et les vaisseaux', groupe: 'Biologie & Anatomie végétale', bientot: true },
        { id: 'familles-botaniques', nom: 'Les familles botaniques', groupe: 'Biologie & Anatomie végétale', bientot: true },
        { id: 'fleur', nom: 'La fleur et la pollinisation', groupe: 'Biologie & Anatomie végétale', bientot: true },
        { id: 'arbres-feuilles', nom: 'Les arbres et leurs feuilles', groupe: 'Flore, Arbres & Champignons', bientot: true },
        { id: 'ecorces', nom: 'Les écorces et les silhouettes', groupe: 'Flore, Arbres & Champignons', bientot: true },
        { id: 'fleurs-sauvages', nom: 'Les fleurs sauvages', groupe: 'Flore, Arbres & Champignons', bientot: true },
        { id: 'champignons', nom: 'Les champignons', groupe: 'Flore, Arbres & Champignons', bientot: true },
        { id: 'toxiques', nom: 'Comestible ou toxique ?', groupe: 'Flore, Arbres & Champignons', bientot: true },
        { id: 'herbier', nom: 'L\'herbier', groupe: 'Flore, Arbres & Champignons', bientot: true },
        { id: 'saisons', nom: 'Fruits et légumes de saison', groupe: 'Agriculture & Récoltes', bientot: true },
        { id: 'grandes-cultures', nom: 'Les grandes cultures', groupe: 'Agriculture & Récoltes', bientot: true },
        { id: 'sol-vivant', nom: 'Le sol vivant', groupe: 'Agriculture & Récoltes', bientot: true },
        { id: 'potager', nom: 'Le potager', groupe: 'Agriculture & Récoltes', bientot: true },
        { id: 'techniques', nom: 'Les techniques agronomiques', groupe: 'Agriculture & Récoltes', bientot: true },
        { id: 'terroirs', nom: 'Les terroirs et les appellations', groupe: 'Agriculture & Récoltes', bientot: true }
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

  /* Cadenas des jeux fermés (champ « bloque ») */
  const CADENAS = '<span class="jx-cadenas" aria-hidden="true"><svg viewBox="0 0 24 24">' +
    '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>';

  let numero = 0;

  function selecteur(conteneur, idCourant) {
    const id = 'jx-menu-' + (++numero);
    conteneur.innerHTML =
      '<div class="jx-selecteur">' +
        '<button type="button" class="jx-bouton" aria-haspopup="true" aria-expanded="false" aria-controls="' + id + '" title="Changer de jeu">' +
          ICONE + '<span class="jx-libelle">Jeux</span></button>' +
        '<div class="jx-menu" id="' + id + '" hidden>' +
          '<p class="jx-titre">Changer de jeu</p>' +
          /* masque : absent de la liste (sauf le jeu courant, qui s'y montre « vous y êtes ») */
          JEUX.filter((j) => !j.masque || j.id === idCourant).map((j) => {
            const ici = j.id === idCourant;
            const detail = ici ? 'Vous y êtes' + (j.version ? ' · version ' + j.version : '')
              : j.bloque ? 'Fermé pour le moment' : j.description;
            const corps = '<span class="jx-icone" aria-hidden="true">' + esc(j.icone) + '</span><span class="jx-texte"><b>' + esc(j.nom) +
              '</b><small>' + esc(detail) + '</small></span>';
            if (ici) return '<span class="jx-jeu is-ici" aria-current="page">' + corps + '</span>';
            /* bloque : la ligne reste visible mais n'est plus un lien ; un cadenas le dit */
            if (j.bloque) return '<span class="jx-jeu is-bloque" aria-disabled="true">' + corps + CADENAS + '</span>';
            return '<a class="jx-jeu" href="' + esc(lien(j)) + '">' + corps + '</a>';
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

  const copie = (j) => Object.assign({}, j, { modes: (j.modes || []).map((m) => Object.assign({}, m)) });

  window.Jeux = {
    version: VERSION,
    /* liste : TOUS les jeux (tableau de bord de l'administrateur, défis de la semaine) */
    liste: JEUX.map(copie),
    /* publics : ceux que l'interface publique peut montrer (les « masque » en sont retirés) ;
       chaque entrée garde son champ « bloque », à la charge de l'appelant de la rendre inerte */
    publics: JEUX.filter((j) => !j.masque).map(copie),
    lien, racine: RACINE, selecteur
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancher);
  else brancher();
})();
