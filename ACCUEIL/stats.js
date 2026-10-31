/* ==========================================================================
   ACCUEIL/stats.js — Le bouton « Statistiques » de la page d'accueil et son panneau

   Rassemble, pour LE COMPTE CONNECTÉ, les totaux de chaque jeu : parties jouées, bonnes réponses,
   réussite et temps passé, puis le cumul des quatre. Chaque jeu range ses statistiques à sa façon ;
   COMMUN/jeux.js dit où les lire, dans le champ « totaux » de sa ligne :
       { cle, parties, bonnes, questions, temps, ms }
   Un jeu sans ce champ ne compte encore rien : on le dit, plutôt que d'afficher des zéros.

   EN INVITÉ, il n'y a rien à rassembler : chaque jeu garde alors ses statistiques pour lui, dans ce
   navigateur et dans son propre format. Le panneau l'explique et invite à se connecter.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const C = window.Comptes || null;

  const ICONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V4"/><path d="M4 20h16"/>' +
    '<path d="M8 20v-6M13 20V8M18 20v-9"/></svg>';

  // Espaces ouverts à la première ouverture du panneau, puis réutilisés (un par jeu qui compte)
  let espaces = null;

  const JEUX = () => (window.Jeux ? window.Jeux.publics.filter((j) => j.totaux) : []);

  function ouvrirEspaces() {
    if (espaces || !C) return;
    espaces = {};
    JEUX().forEach((j) => {
      try { espaces[j.id] = C.espace(j.id, { completer: (d) => (d && typeof d === 'object' ? d : {}) }); }
      catch (e) { console.error('stats.js : espace « ' + j.id +' » indisponible', e); }
    });
  }

  /* Totaux d'un jeu, remis aux mêmes noms quel que soit son format interne */
  function totauxDe(jeu) {
    const espace = espaces && espaces[jeu.id];
    const d = espace && espace.donnees();
    const bloc = d && d[jeu.totaux.cle];
    if (!bloc || typeof bloc !== 'object') return null;
    const n = (champ) => (Number(bloc[champ]) || 0);
    return {
      parties: n(jeu.totaux.parties),
      bonnes: n(jeu.totaux.bonnes),
      questions: n(jeu.totaux.questions),
      secondes: jeu.totaux.ms ? Math.round(n(jeu.totaux.temps) / 1000) : n(jeu.totaux.temps)
    };
  }

  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
  const pourcent = (a, b) => (b ? Math.round((a / b) * 100) : 0) + ' %';

  function duree(s) {
    s = Math.max(0, Math.round(s));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h) return h + ' h ' + String(m).padStart(2, '0');
    if (m) return m + ' min';
    return s + ' s';
  }

  const chiffres = (t) => '<p class="stats-chiffres">' +
    '<span><b>' + t.parties + '</b> ' + (t.parties > 1 ? 'parties' : 'partie') + '</span>' +
    '<span><b>' + t.bonnes + '</b> / ' + t.questions + ' bonnes réponses</span>' +
    '<span>réussite <b>' + pourcent(t.bonnes, t.questions) + '</b></span>' +
    '<span>temps <b>' + duree(t.secondes) + '</b></span></p>';

  function ligne(jeu, t) {
    const pastille = '<span class="stats-jeu__pastille" style="--jeu-couleur:' + esc(jeu.couleur || '') +
      '" aria-hidden="true">' + esc(jeu.icone) + '</span>';
    const corps = t && t.parties
      ? chiffres(t)
      : '<p class="stats-jeu__vide">' + (jeu.totaux ? 'Aucune partie jouée pour l\'instant.'
        : 'Ce jeu ne compte pas encore de parties : il est en préparation.') + '</p>';
    return '<div class="stats-jeu">' + pastille +
      '<p class="stats-jeu__nom">' + esc(jeu.nom) + '</p>' + corps + '</div>';
  }

  function corpsPanneau() {
    const compte = C && C.compte();
    if (!compte) {
      return '<p class="stats-message">Vous jouez en invité. Chaque jeu garde alors ses statistiques pour ' +
        'lui, dans ce navigateur : elles ne peuvent pas être rassemblées ici. Connectez-vous avec le bouton ' +
        'du compte, en haut à gauche, et vos parties seront comptées pour tous les jeux.</p>';
    }
    const tous = window.Jeux ? window.Jeux.publics : [];
    const cumul = { parties: 0, bonnes: 0, questions: 0, secondes: 0 };
    const lignes = tous.map((jeu) => {
      const t = jeu.totaux ? totauxDe(jeu) : null;
      if (t) Object.keys(cumul).forEach((k) => { cumul[k] += t[k]; });
      return ligne(jeu, t);
    }).join('');
    const total = cumul.parties
      ? '<div class="stats-jeu stats-total"><span class="stats-jeu__pastille" aria-hidden="true">Σ</span>' +
        '<p class="stats-jeu__nom">Tous les jeux</p>' + chiffres(cumul) + '</div>'
      : '<p class="stats-message stats-total">Aucune partie enregistrée pour ce compte. Jouez une partie : ' +
        'elle sera comptée ici, et vous la retrouverez depuis n\'importe quel appareil.</p>';
    return lignes + total;
  }

  function dessiner() {
    $('#stats-corps').innerHTML = corpsPanneau();
    const compte = C && C.compte();
    $('#stats-sous-titre').textContent = compte
      ? 'Compte ' + compte.nom + ' · toutes vos parties, jeu par jeu'
      : 'Vos parties, jeu par jeu';
  }

  function ouvrir() {
    ouvrirEspaces();
    dessiner();
    $('#stats-dialogue').showModal();
    // Les statistiques du serveur arrivent peut-être après : on redessine à leur arrivée
    Object.keys(espaces || {}).forEach((id) => {
      const e = espaces[id];
      if (e && e.charge) e.charge().then(() => { if ($('#stats-dialogue').open) dessiner(); }).catch(() => {});
    });
  }

  function init() {
    const bouton = $('#stats-bouton');
    if (!bouton) return;
    bouton.innerHTML = ICONE + '<span>Statistiques</span>';
    bouton.hidden = false;
    bouton.addEventListener('click', ouvrir);
    $('#stats-dialogue').addEventListener('click', (e) => {
      if (e.target.closest('[data-stats-fermer]')) $('#stats-dialogue').close();
    });
    // Changement de compte (ici ou dans un autre onglet) : le panneau ouvert suit
    if (C) C.surChangement(() => { if ($('#stats-dialogue').open) dessiner(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
