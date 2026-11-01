/* ==========================================================================
   compte.js — Bouton de compte, fenêtre du compte et écran des statistiques

   Le bouton en haut à gauche (tous les écrans sauf pendant les parties) montre le joueur
   (Invité ou nom du compte) et ouvre le menu du compte : un menu déroulant sur le modèle du menu
   « Jeux » (../COMMUN/jeux.js), qui se ferme d'un clic ailleurs ou avec Échap. Les comptes sont
   communs à tous les jeux du dossier (../COMMUN/comptes.js) : se connecter ici connecte aussi les autres jeux.
     - non connecté : se connecter ou créer un compte (nom + mot de passe), ou continuer en invité ;
       ce menu s'ouvre seul à l'arrivée, une fois par session du navigateur (tous jeux confondus) ;
     - connecté : renommer, changer le mot de passe, se déconnecter, supprimer le compte,
       importer les anciens profils de ce navigateur ;
     - sans serveur (index.html ouvert directement) : invité seulement.
   Les autres comptes ne sont jamais listés. L'écran des statistiques a cinq onglets : records,
   classements entre joueurs, historique, zones à revoir (avec une partie de révision), exports et sauvegarde.
   Ces onglets sont aussi des cartes de la grande catégorie « Records et statistiques » du menu.
   Les données sont gérées par js/profils.js (à charger avant).
   ========================================================================== */
(function () {
  'use strict';

  if (!window.GeoProfils || !window.GeoNohyne) {
    console.error('compte.js : js/core.js et js/profils.js doivent être chargés avant ce fichier');
    return;
  }
  const P = window.GeoProfils;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ONGLETS = ['records', 'classements', 'historique', 'revoir', 'sauvegarde'];   // de l'écran des statistiques
  const NOMS_JEU = { ciblage: '🎯 Ciblage', nommage: '⌨️ Nommage' };
  const PAS_HISTORIQUE = 50;            // parties affichées par « Afficher plus »
  const MAX_REVISION = 12;              // zones proposées à la révision, par catégorie

  let onglet = 'records';
  let historiqueMax = PAS_HISTORIQUE;
  let classement = null;                // { categorie, perimetre, jeu } choisis dans l'onglet Classements

  const initiale = (nom) => (String(nom).trim().charAt(0) || '?').toUpperCase();
  const avatar = (p, classe) => '<span class="compte-avatar' + (classe ? ' ' + classe : '') + '" style="--avatar:' + esc(p.couleur) +
    '" aria-hidden="true">' + esc(initiale(p.nom)) + '</span>';
  const pct = (s, t) => (t ? Math.round((s / t) * 100) : 0) + ' %';
  const dateCourte = (iso) => new Date(iso).toLocaleDateString('fr-FR');
  const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profil';

  function duree(ms) {
    const min = Math.round(ms / 60000);
    if (ms < 60000) return Math.round(ms / 1000) + ' s';
    if (min < 60) return min + ' min';
    return Math.floor(min / 60) + ' h ' + String(min % 60).padStart(2, '0');
  }

  function telecharger(nom, texte, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texte], { type }));
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ------------------------------------------------------------------ */
  /* Bouton de compte et menu du compte                                  */
  /* ------------------------------------------------------------------ */
  // Menu déroulant sous le bouton, sur le modèle du menu « Jeux » : le joueur en tête, puis ses actions
  // en lignes (pictogramme, titre, précision). Vues : 'connexion' ou 'inscription' (non connecté) ;
  // connecté : formulaire ouvert null, 'renommer', 'mdp' ou 'supprimer'
  let vue = 'connexion';
  let formulaire = null;
  let message = '';                     // erreur ou information affichée dans le menu
  let accueil = false;                  // menu ouvert automatiquement à l'arrivée
  let occupe = false;                   // requête en cours : boutons désactivés

  // Pictogrammes des lignes du menu (traits sur une grille de 24 × 24), par action
  const ICONES = {
    stats: '<path d="M4 20V11M10 20V5M16 20v-6M2 20h20"/>',
    invite: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    renommer: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>',
    mdp: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14.5 8.5l2 2"/>',
    deconnexion: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 17l5-5-5-5M20 12H9"/>',
    supprimer: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'
  };

  function majBouton() {
    const p = P.actif();
    const b = $('#compte-bouton');
    b.innerHTML = avatar(p) + '<span class="compte-nom">' + esc(p.nom) + '</span>';
    const quoi = p.invite ? 'se connecter, créer un compte, statistiques' : 'compte, statistiques';
    b.title = (p.invite ? 'Invité' : 'Compte : ' + p.nom) + ' (' + quoi + ')';
    b.setAttribute('aria-label', (p.invite ? 'Vous jouez en invité' : 'Compte : ' + p.nom) + '. Ouvrir le menu du compte (' + quoi + ')');
  }

  const champ = (libelle, nom, type, auto, extra) => '<label class="compte-champ">' + libelle +
    '<input name="' + nom + '" type="' + type + '" autocomplete="' + auto + '" spellcheck="false" required' + (extra || '') + '></label>';
  const erreurHtml = () => '<p class="tool-error compte-erreur" role="alert">' + esc(message) + '</p>';
  const desactive = () => (occupe ? ' disabled' : '');
  const parties = (n) => n + ' partie' + (n > 1 ? 's' : '');

  // Une ligne du menu : pictogramme, titre et précision (comme un jeu du menu « Jeux »)
  const ligne = (action, titre, detail, danger) => '<button type="button" class="compte-ligne' + (danger ? ' compte-ligne--danger' : '') +
    '" data-compte="' + action + '"' + desactive() + '><span class="compte-ligne__icone" aria-hidden="true"><svg viewBox="0 0 24 24">' +
    ICONES[action] + '</svg></span><span class="compte-ligne__texte"><b>' + titre + '</b><small>' + detail + '</small></span></button>';
  // Le joueur, en tête du menu (comme le jeu « où vous êtes » du menu « Jeux »)
  const identite = (p, detail) => '<div class="compte-identite">' + avatar(p, 'compte-avatar--menu') +
    '<span class="compte-ligne__texte"><b>' + esc(p.nom) + '</b><small>' + detail + '</small></span></div>';
  const identiteInvite = () => {
    const n = P.statistiques().totaux.parties;
    return identite(P.actif(), n ? parties(n) + ' · statistiques gardées dans ce navigateur' : 'Statistiques gardées dans ce navigateur');
  };

  // Non connecté : se connecter ou créer un compte (formulaires reconnus par les gestionnaires de mots de passe)
  function vueVisiteur() {
    const inscription = vue === 'inscription';
    const invite = P.statistiques().totaux.parties;
    return identiteInvite() +
      '<div class="mode-switch compte-onglets" role="tablist">' +
        '<button type="button" role="tab" class="mode-btn' + (inscription ? '' : ' is-active') + '" aria-selected="' + !inscription + '" data-vue="connexion">Se connecter</button>' +
        '<button type="button" role="tab" class="mode-btn' + (inscription ? ' is-active' : '') + '" aria-selected="' + inscription + '" data-vue="inscription">Créer un compte</button>' +
      '</div>' +
      '<form class="compte-form" data-form="' + vue + '">' +
        champ('Nom', 'username', 'text', 'username', ' maxlength="' + P.LONGUEUR_NOM + '"') +
        champ('Mot de passe', 'password', 'password', inscription ? 'new-password' : 'current-password', inscription ? ' minlength="' + P.MDP_MIN + '"' : '') +
        (inscription ? champ('Confirmer le mot de passe', 'confirmation', 'password', 'new-password') +
          (invite ? '<label class="checkbox-row compte-reprendre"><input name="reprendre" type="checkbox" checked><span>Reprendre les statistiques ' +
            'de l\'invité de ce navigateur (' + invite + ' partie' + (invite > 1 ? 's' : '') + ')</span></label>' : '') : '') +
        erreurHtml() +
        '<button type="submit" class="btn btn-primary compte-valider"' + desactive() + '>' +
          (occupe ? '…' : inscription ? 'Créer mon compte' : 'Se connecter') + '</button>' +
      '</form>' +
      '<div class="compte-lignes">' +
        ligne('stats', 'Statistiques de l\'invité', 'Records, historique, zones à revoir') +
        (accueil ? ligne('invite', 'Continuer en invité', 'Vous pourrez vous connecter plus tard') : '') +
      '</div>';
  }

  // Connecté : le compte, ses actions, et l'import des anciens profils de ce navigateur
  function vueCompte() {
    const p = P.actif();
    const t = P.statistiques().totaux;
    const etat = P.enAttente()
      ? (P.serveurDisponible() ? 'synchronisation…' : '⚠️ serveur injoignable : vos dernières parties seront envoyées dès son retour')
      : 'statistiques enregistrées sur le serveur';
    let html = identite(p, parties(t.parties) + ' · ' + etat);

    if (formulaire === 'renommer') {
      html += '<form class="compte-form" data-form="renommer">' + champ('Nouveau nom', 'nom', 'text', 'username', ' maxlength="' + P.LONGUEUR_NOM + '" value="' + esc(p.nom) + '"') +
        erreurHtml() + '<div class="compte-form__boutons"><button type="submit" class="btn btn-primary"' + desactive() + '>Renommer</button>' +
        '<button type="button" class="btn btn-soft" data-compte="annuler">Annuler</button></div></form>';
    } else if (formulaire === 'mdp') {
      html += '<form class="compte-form" data-form="mdp"><input type="text" name="username" autocomplete="username" value="' + esc(p.nom) + '" hidden>' +
        champ('Mot de passe actuel', 'ancien', 'password', 'current-password') +
        champ('Nouveau mot de passe', 'nouveau', 'password', 'new-password', ' minlength="' + P.MDP_MIN + '"') +
        champ('Confirmer le nouveau mot de passe', 'confirmation', 'password', 'new-password') +
        erreurHtml() + '<div class="compte-form__boutons"><button type="submit" class="btn btn-primary"' + desactive() + '>Changer le mot de passe</button>' +
        '<button type="button" class="btn btn-soft" data-compte="annuler">Annuler</button></div></form>';
    } else if (formulaire === 'supprimer') {
      html += '<form class="compte-form compte-form--danger" data-form="supprimer"><p>Supprimer le compte « ' + esc(p.nom) + ' », ses records et ses ' +
        'statistiques ? C\'est définitif.</p>' + champ('Mot de passe', 'mdp', 'password', 'current-password') +
        erreurHtml() + '<div class="compte-form__boutons"><button type="submit" class="btn btn-primary stats-danger-plein"' + desactive() + '>Supprimer définitivement</button>' +
        '<button type="button" class="btn btn-soft" data-compte="annuler">Annuler</button></div></form>';
    } else {
      if (message) html += '<p class="compte-info" role="status">' + esc(message) + '</p>';
      html += '<div class="compte-lignes">' +
        ligne('stats', 'Mes statistiques', 'Records, classements, historique') +
        ligne('renommer', 'Renommer', 'Votre nom dans tous les jeux') +
        ligne('mdp', 'Mot de passe', 'Le changer pour tous vos appareils') +
        ligne('deconnexion', 'Se déconnecter', 'De tous les jeux, dans ce navigateur') +
        ligne('supprimer', 'Supprimer le compte', 'Définitif, pour tous les jeux', true) +
        '</div>';
    }

    const anciens = P.anciensProfils();
    if (anciens.length && !formulaire) {
      html += '<div class="compte-import"><p class="compte-form__titre">Anciens profils de ce navigateur</p>' +
        '<p class="compte-menu__note">Statistiques enregistrées ici avant les comptes : ajoutez-les à votre compte (records, historique, ' +
        'zones ratées), elles sont ensuite effacées de ce navigateur.</p><ul>' +
        anciens.map((a) => '<li><span>' + esc(a.nom) + ' <small>· ' + parties(a.parties) + '</small></span>' +
          '<button type="button" class="btn btn-soft" data-importer="' + esc(a.id) + '">Importer</button></li>').join('') + '</ul></div>';
    }
    return html;
  }

  function majMenu() {
    const connecte = P.connecte();
    const serveur = P.serveurDisponible();
    $('#compte-titre').textContent = connecte ? 'Mon compte' : accueil ? 'Bienvenue sur Géonohyne Quizz' : 'Compte';
    $('#compte-aide').textContent = connecte
      ? 'Votre compte est commun à tous les jeux : vous restez connecté en changeant de jeu. Les autres joueurs ne voient que votre nom et vos records.'
      : serveur
        ? 'Un seul compte pour tous les jeux : vos records vous suivent sur tous vos appareils et comptent dans les classements.'
        : 'Sans serveur, on joue en invité. Pour créer un compte (commun à tous les jeux), lancez les jeux avec game.bat, à la racine du dossier des jeux.';
    $('#compte-corps').innerHTML = connecte ? vueCompte() : serveur ? vueVisiteur()
      : identiteInvite() + '<div class="compte-lignes">' + ligne('stats', 'Mes statistiques', 'Records, historique, zones à revoir') + '</div>';
  }

  // Premier champ d'un formulaire, sinon première ligne : le menu est prêt pour le clavier
  function focusPremierChamp() {
    const c = $('#compte-corps input:not([hidden]):not([type="checkbox"])') || $('#compte-corps button:not([disabled])');
    if (c) c.focus();
  }

  const menuOuvert = () => !$('#compte-menu').hidden;

  function ouvrirMenu(depuisAccueil) {
    accueil = !!depuisAccueil;
    vue = 'connexion';
    formulaire = null;
    message = P.erreur();
    P.effacerErreur();
    majMenu();
    $('#compte-menu').hidden = false;
    $('#compte-bouton').setAttribute('aria-expanded', 'true');
    $('.compte-coin').classList.add('is-ouvert');
    focusPremierChamp();
  }

  // rendreFocus : le bouton du compte reprend le focus (fermeture au clavier)
  function fermerMenu(rendreFocus) {
    if (!menuOuvert()) return;
    if ($('#compte-menu').contains(document.activeElement)) document.activeElement.blur();   // pas de focus dans un menu caché
    $('#compte-menu').hidden = true;
    $('#compte-bouton').setAttribute('aria-expanded', 'false');
    $('.compte-coin').classList.remove('is-ouvert');
    if (rendreFocus) $('#compte-bouton').focus();
  }

  // Lance une requête au serveur : boutons désactivés pendant l'attente, message d'erreur sinon
  async function executer(action, apres) {
    const saisie = {};                    // ce qui a été tapé, remis après chaque redessin (sauf les mots de passe)
    document.querySelectorAll('#compte-corps input[type="text"]').forEach((i) => { saisie[i.name] = i.value; });
    const remettre = () => Object.keys(saisie).forEach((n) => { const i = $('#compte-corps input[name="' + n + '"]'); if (i) i.value = saisie[n]; });
    occupe = true;
    message = '';
    majMenu();
    remettre();
    try {
      await action();
      occupe = false;
      apres();
    } catch (err) {
      occupe = false;
      message = err.message;
      majMenu();
      remettre();
      focusPremierChamp();
    }
  }

  function soumettre(form) {
    const v = (n) => (form.elements[n] ? form.elements[n].value : '');
    const sorte = form.dataset.form;
    const confirmationFausse = (a, b) => { if (a !== b) { message = 'Les deux mots de passe ne sont pas identiques.'; majMenu(); return true; } return false; };

    if (sorte === 'connexion') {
      return executer(() => P.connecter(v('username'), v('password')), () => { message = ''; fermerMenu(true); });
    }
    if (sorte === 'inscription') {
      if (confirmationFausse(v('password'), v('confirmation'))) return;
      const reprendre = form.elements.reprendre ? form.elements.reprendre.checked : false;
      return executer(() => P.inscrire(v('username'), v('password'), reprendre), () => { message = ''; fermerMenu(true); });
    }
    if (sorte === 'renommer') {
      return executer(() => P.renommer(v('nom')), () => { formulaire = null; message = 'Nom changé.'; majMenu(); });
    }
    if (sorte === 'mdp') {
      if (confirmationFausse(v('nouveau'), v('confirmation'))) return;
      return executer(() => P.changerMotDePasse(v('ancien'), v('nouveau')), () => {
        formulaire = null;
        message = 'Mot de passe changé. Vos autres appareils devront se reconnecter.';
        majMenu();
      });
    }
    if (sorte === 'supprimer') {
      return executer(() => P.supprimerCompte(v('mdp')), () => { formulaire = null; message = ''; vue = 'connexion'; majMenu(); });
    }
  }

  function brancherMenu() {
    const coin = $('.compte-coin');
    const menu = $('#compte-menu');
    $('#compte-bouton').addEventListener('click', () => (menuOuvert() ? fermerMenu(false) : ouvrirMenu(false)));
    // Clic ailleurs : fermeture. Le chemin du clic est celui du moment du clic (le menu a pu être redessiné depuis).
    document.addEventListener('click', (e) => { if (menuOuvert() && !e.composedPath().includes(coin)) fermerMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOuvert()) fermerMenu(true); });
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.vue) { vue = b.dataset.vue; message = ''; majMenu(); focusPremierChamp(); return; }
      if (b.dataset.importer) {
        const nom = (P.anciensProfils().find((a) => a.id === b.dataset.importer) || {}).nom;
        if (confirm('Ajouter les statistiques de « ' + nom + ' » à votre compte ? Elles seront ensuite effacées de ce navigateur.')) {
          P.importerAncien(b.dataset.importer);
          message = 'Statistiques de « ' + nom + ' » ajoutées à votre compte.';
          majMenu();
        }
        return;
      }
      switch (b.dataset.compte) {
        case 'invite': fermerMenu(true); break;
        case 'stats': fermerMenu(false); ouvrirStats('records'); break;
        case 'renommer': case 'mdp': case 'supprimer':
          formulaire = b.dataset.compte; message = ''; majMenu(); focusPremierChamp(); break;
        case 'annuler': formulaire = null; message = ''; majMenu(); break;
        case 'deconnexion':
          executer(() => P.deconnecter(), () => { message = ''; vue = 'connexion'; majMenu(); });
          break;
      }
    });
    menu.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!occupe) soumettre(e.target);
    });
  }

  // À l'arrivée (une fois par session du navigateur, tous jeux confondus) : si le serveur répond et qu'aucun
  // compte n'est mémorisé, on propose de se connecter ou de créer un compte ; on peut continuer en invité.
  function proposerConnexion() {
    if (P.serveurDisponible() && !P.connecte() && $('#screen-menu') && !$('#screen-menu').classList.contains('hidden') && P.premiereVisite()) {
      ouvrirMenu(true);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Écran des statistiques                                              */
  /* ------------------------------------------------------------------ */
  function ouvrirStats(o) {
    onglet = ONGLETS.includes(o) ? o : 'records';
    historiqueMax = PAS_HISTORIQUE;
    GeoNohyne.afficher('screen-stats');
    rendreStats();
  }

  function rendreStats() {
    if ($('#screen-stats').classList.contains('hidden')) return;
    const p = P.actif();
    const s = P.statistiques();
    $('#stats-avatar').innerHTML = avatar(p, 'compte-avatar--grand');
    $('#stats-titre').textContent = 'Statistiques de ' + p.nom;

    const t = s.totaux;
    const cles = Object.keys(s.records);
    const premiers = cles.filter((c) => { const cl = P.classement(c); return cl.length > 1 && cl[0].id === p.id; }).length;
    const tuile = (classe, valeur, libelle) => '<div class="tile ' + classe + '"><div class="tile__value">' + valeur +
      '</div><div class="tile__label">' + libelle + '</div></div>';
    $('#stats-totaux').innerHTML =
      tuile('tile--blue', t.parties, 'Parties jouées') +
      tuile('tile--grey', duree(t.tempsMs), 'Temps de jeu') +
      tuile('tile--green', pct(t.bonnes, t.questions), 'Bonnes réponses') +
      tuile('tile--gold', cles.length, cles.length > 1 ? 'Records' + (premiers ? ' · ' + premiers + ' 🥇' : '') : 'Record' + (premiers ? ' · 🥇' : ''));

    document.querySelectorAll('#stats-onglets [data-onglet]').forEach((b) => {
      const actif = b.dataset.onglet === onglet;
      b.classList.toggle('is-active', actif);
      b.setAttribute('aria-selected', String(actif));
    });
    const contenu = { records: ongletRecords, classements: ongletClassements, historique: ongletHistorique, revoir: ongletRevoir, sauvegarde: ongletSauvegarde }[onglet];
    $('#stats-contenu').innerHTML = contenu(s, p);
  }

  /* ---------- Onglet « Mes records » ---------- */
  function ongletRecords(s, p) {
    const blocs = GeoNohyne.listeRecords().map((cat) => {
      let nb = 0;
      const cellule = (jeu, pe) => {
        const cle = P.cleRecord(cat.id, jeu, pe.id);
        const r = s.records[cle];
        if (!r) return '<td class="stats-vide">—</td>';
        nb++;
        const cl = P.classement(cle);
        const premier = cl.length > 1 && cl[0].id === p.id;
        return '<td><b>' + r.score + ' / ' + r.total + '</b> · ' + P.temps(r.tempsMs) + (premier ? ' <span title="Meilleur de tous les joueurs">🥇</span>' : '') +
          '<small>' + dateCourte(r.date) + '</small></td>';
      };
      const lignes = cat.perimetres.map((pe) => '<tr><th scope="row">' + esc(pe.nom) + ' <small>· ' + pe.n + '</small></th>' +
        cellule('ciblage', pe) + cellule('nommage', pe) + '</tr>').join('');
      return '<details class="stats-bloc"' + (nb ? ' open' : '') + '><summary>' + esc(cat.icone) + ' ' + esc(cat.titre) +
        ' <span class="stats-compte">' + (nb ? nb + ' record' + (nb > 1 ? 's' : '') : 'aucun record') + '</span></summary>' +
        '<div class="stats-defile"><table class="stats-table"><thead><tr><th scope="col">Périmètre</th><th scope="col">' + NOMS_JEU.ciblage +
        '</th><th scope="col">' + NOMS_JEU.nommage + '</th></tr></thead><tbody>' + lignes + '</tbody></table></div></details>';
    });
    return blocs.join('') + '<p class="stats-note">Pour établir ou battre un record : ouvrez une catégorie, puis choisissez « 🏆 Record » ' +
      'sur l\'écran de choix de la partie. 🥇 : meilleur de tous les joueurs.</p>';
  }

  /* ---------- Onglet « Classements » ---------- */
  function ongletClassements() {
    const cats = GeoNohyne.listeRecords();
    if (!cats.length) return '<p class="stats-note">Aucune catégorie de quiz.</p>';
    if (!classement || !cats.some((c) => c.id === classement.categorie)) classement = { categorie: cats[0].id, perimetre: 'tout', jeu: 'ciblage' };
    const cat = cats.find((c) => c.id === classement.categorie);
    if (!cat.perimetres.some((pe) => pe.id === classement.perimetre)) classement.perimetre = 'tout';
    const options = (liste, choisi) => liste.map(([v, t]) => '<option value="' + esc(v) + '"' + (v === choisi ? ' selected' : '') + '>' + esc(t) + '</option>').join('');
    const cl = P.classement(P.cleRecord(cat.id, classement.jeu, classement.perimetre));
    const actif = P.actif().id;
    const medailles = ['🥇', '🥈', '🥉'];
    const tableau = cl.length
      ? '<div class="stats-defile"><table class="stats-table"><thead><tr><th scope="col">Rang</th><th scope="col">Profil</th><th scope="col">Score</th>' +
        '<th scope="col">Temps</th><th scope="col">Date</th></tr></thead><tbody>' +
        cl.map((e, i) => '<tr' + (e.id === actif ? ' class="is-moi"' : '') + '><td>' + (medailles[i] || (i + 1)) + '</td><td><span class="stats-profil">' +
          avatar(e) + esc(e.nom) + '</span></td><td><b>' + e.score + ' / ' + e.total + '</b></td><td>' + P.temps(e.tempsMs) + '</td><td>' + dateCourte(e.date) +
          '</td></tr>').join('') + '</tbody></table></div>'
      : '<p class="stats-note">Personne n\'a encore de record ici.</p>';
    return '<div class="stats-filtres">' +
      '<label class="field">Catégorie<select data-classement="categorie">' + options(cats.map((c) => [c.id, c.titre]), cat.id) + '</select></label>' +
      '<label class="field">Périmètre<select data-classement="perimetre">' + options(cat.perimetres.map((pe) => [pe.id, pe.nom]), classement.perimetre) + '</select></label>' +
      '<label class="field">Façon de jouer<select data-classement="jeu">' + options([['ciblage', NOMS_JEU.ciblage], ['nommage', NOMS_JEU.nommage]], classement.jeu) + '</select></label>' +
      '</div>' + tableau;
  }

  /* ---------- Onglet « Historique » ---------- */
  function ongletHistorique(s) {
    if (!s.historique.length) return '<p class="stats-note">Aucune partie pour l\'instant.</p>';
    const lignes = s.historique.slice(0, historiqueMax).map((h) => {
      const d = new Date(h.date);
      return '<tr><td>' + d.toLocaleDateString('fr-FR') + ' <small>' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + '</small></td>' +
        '<td>' + esc(h.titre) + '</td><td>' + (NOMS_JEU[h.jeu] || esc(h.jeu)) + (h.record ? ' <span class="stats-badge">🏆 Record</span>' : '') + '</td>' +
        '<td>' + esc(h.perimetre) + '</td><td><b>' + h.score + ' / ' + h.total + '</b> <small>' + pct(h.score, h.total) + '</small></td>' +
        '<td>' + P.temps(h.tempsMs) + '</td></tr>';
    }).join('');
    return '<div class="stats-defile"><table class="stats-table"><thead><tr><th scope="col">Date</th><th scope="col">Catégorie</th><th scope="col">Façon de jouer</th>' +
      '<th scope="col">Sélection</th><th scope="col">Score</th><th scope="col">Temps</th></tr></thead><tbody>' + lignes + '</tbody></table></div>' +
      (s.historique.length > historiqueMax
        ? '<button type="button" class="btn btn-soft stats-plus" data-plus>Afficher plus (' + (s.historique.length - historiqueMax) + ' de plus)</button>' : '') +
      '<p class="stats-note">' + s.historique.length + ' partie' + (s.historique.length > 1 ? 's' : '') + ' enregistrée' + (s.historique.length > 1 ? 's' : '') +
      ' (les 1 000 dernières sont gardées).</p>';
  }

  /* ---------- Onglet « Zones à revoir » ---------- */
  function ongletRevoir() {
    const blocs = GeoNohyne.listeRecords().map((cat) => {
      const ratees = P.zonesRatees(cat.id, null, MAX_REVISION);
      if (!ratees.length) return '';
      const carte = GeoCarte.obtenir(cat.carte);
      const noms = {};
      if (carte) carte.elements.forEach((e) => { noms[e.code] = e.nom; });
      const codes = ratees.filter((r) => noms[r.code]).map((r) => r.code).join(',');
      return '<div class="stats-bloc stats-bloc--revoir"><h3>' + esc(cat.icone) + ' ' + esc(cat.titre) + '</h3><div class="chips">' +
        ratees.map((r) => '<span class="chip">' + esc(noms[r.code] || r.code) + ' <small>ratée ' + r.ratees + ' fois sur ' + r.vues + '</small></span>').join('') +
        '</div><div class="stats-actions">' +
        '<button type="button" class="btn btn-primary" data-reviser="' + esc(cat.id) + '" data-codes="' + esc(codes) + '" data-type="ciblage">' +
        NOMS_JEU.ciblage + ' : revoir ces zones</button>' +
        '<button type="button" class="btn btn-soft" data-reviser="' + esc(cat.id) + '" data-codes="' + esc(codes) + '" data-type="nommage">' +
        NOMS_JEU.nommage + ' : revoir ces zones</button></div></div>';
    }).join('');
    return blocs || '<p class="stats-note">Aucune zone ratée pour l\'instant : jouez quelques parties, elles apparaîtront ici.</p>';
  }

  /* ---------- Onglet « Exports et sauvegarde » ---------- */
  function ongletSauvegarde(s, p) {
    return (P.stockageDisponible() ? '' : '<p class="status-error">⚠️ Ce navigateur refuse l\'enregistrement : les statistiques ne seront ' +
        'gardées que jusqu\'à la fermeture de la page. Pensez à faire une sauvegarde.</p>') +
      '<p class="stats-note">' + (P.connecte()
        ? 'Vos statistiques sont enregistrées sur le serveur des jeux, sous votre compte « ' + esc(p.nom) + ' ».'
        : 'Vous jouez en invité : vos statistiques sont enregistrées dans ce navigateur, sur cet appareil.') +
      ' Les exports CSV s\'ouvrent dans un tableur (Excel, LibreOffice) ; la sauvegarde JSON contient vos statistiques ' +
      'et permet de les restaurer, ici ou ailleurs.</p>' +
      '<div class="stats-actions stats-actions--colonne">' +
      '<button type="button" class="btn btn-primary" data-export="historique">📄 Historique de ' + esc(p.nom) + ' (CSV)</button>' +
      '<button type="button" class="btn btn-primary" data-export="records">🏆 Records de tous les joueurs (CSV)</button>' +
      '<button type="button" class="btn btn-soft" data-export="sauvegarde">💾 Sauvegarde de mes statistiques (JSON)</button>' +
      '<label class="btn btn-soft stats-fichier">📂 Restaurer mes statistiques (JSON)…<input type="file" accept=".json,application/json" data-restaurer></label>' +
      '<button type="button" class="btn btn-soft stats-danger" data-effacer>🗑️ Effacer les statistiques de ' + esc(p.nom) + '</button>' +
      '</div><p id="stats-message" class="stats-note" role="status"></p>';
  }

  function brancherStats() {
    $('#stats-onglets').addEventListener('click', (e) => {
      const b = e.target.closest('[data-onglet]');
      if (!b) return;
      onglet = b.dataset.onglet;
      rendreStats();
    });
    const contenu = $('#stats-contenu');
    contenu.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const nom = P.actif().nom;
      const jour = new Date().toISOString().slice(0, 10);
      if (b.hasAttribute('data-plus')) { historiqueMax += PAS_HISTORIQUE; rendreStats(); }
      else if (b.dataset.reviser) GeoNohyne.reviser(b.dataset.reviser, b.dataset.codes.split(','), b.dataset.type);
      else if (b.dataset.export === 'historique') telecharger('geonohyne-historique-' + slug(nom) + '-' + jour + '.csv', P.historiqueCSV(), 'text/csv');
      else if (b.dataset.export === 'records') telecharger('geonohyne-records-' + jour + '.csv', P.recordsCSV(), 'text/csv');
      else if (b.dataset.export === 'sauvegarde') telecharger('geonohyne-sauvegarde-' + slug(nom) + '-' + jour + '.json', P.sauvegarde(), 'application/json');
      else if (b.hasAttribute('data-effacer') &&
        confirm('Effacer tous les records, l\'historique et les zones ratées de « ' + nom + ' » ? Le profil est gardé. C\'est définitif.')) {
        P.reinitialiser();
      }
    });
    contenu.addEventListener('change', (e) => {
      const sel = e.target.closest('[data-classement]');
      if (sel) {
        classement[sel.dataset.classement] = sel.value;
        if (sel.dataset.classement === 'categorie') classement.perimetre = 'tout';
        return rendreStats();
      }
      const fichier = e.target.closest('[data-restaurer]');
      if (fichier && fichier.files[0]) {
        const lecteur = new FileReader();
        lecteur.onload = () => {
          if (!confirm('Remplacer les statistiques de « ' + P.actif().nom + ' » par celles de cette sauvegarde ?')) return;
          try { P.restaurer(String(lecteur.result)); onglet = 'records'; rendreStats(); }
          catch (err) { const m = $('#stats-message'); if (m) m.textContent = '⚠️ ' + err.message; }
        };
        lecteur.readAsText(fichier.files[0]);
      }
    });
  }

  function init() {
    majBouton();
    brancherMenu();
    brancherStats();
    P.surChangement(() => {
      majBouton();
      if (menuOuvert() && !occupe) {
        const ouvert = document.activeElement && document.activeElement.closest && document.activeElement.closest('#compte-corps form');
        if (!ouvert) majMenu();           // pas de redessin pendant la saisie d'un formulaire
      }
      rendreStats();
    });
    P.pret.then(proposerConnexion);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
