/* ==========================================================================
   ACCUEIL/accueil.js — Page d'accueil : la liste des jeux et le bouton du compte

   Les quatre jeux : COMMUN/jeux.js (sans lui, les rectangles écrits dans index.html restent).
   Le bouton « Statistiques », sous les jeux : ACCUEIL/stats.js.
   Bouton du compte, en haut à gauche : un menu déroulant sur le modèle de celui des jeux (GéoNohyne
   Quizz), qui se ferme d'un clic ailleurs ou avec Échap. Comptes : COMMUN/comptes.js (sans lui, pas de
   bouton ; sans serveur, on reste invité).
     - non connecté : se connecter ou créer un compte ; les comptes déjà connectés dans ce navigateur
       sont proposés (un clic remplit le nom, la croix les oublie) ;
     - connecté : changer de compte (même formulaire : l'ancienne connexion est fermée), se déconnecter ;
     - administrateur (nom « admin ») : la page devient le tableau de bord (ACCUEIL/admin.js) ; le menu
       permet de revenir à la liste des jeux, et inversement.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Les quatre jeux ----------
     Un grand rectangle par jeu, au fond de sa couleur dominante (champs « couleur » et « accent » de
     COMMUN/jeux.js). Jeux.publics, et non Jeux.liste : un jeu « masque » n'aurait aucun rectangle ici.
     Un jeu « bloque » garde le sien, entièrement visible, mais ce n'est plus un lien : une <div>
     inerte, grisée, marquée d'un cadenas. */
  const CADENAS = '<span class="jeu__cadenas" title="Fermé pour le moment"><svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>';

  if (window.Jeux) {
    $('#jeux').innerHTML = Jeux.publics.map((j) => {
      const style = ' style="--jeu-couleur:' + esc(j.couleur || '#1e293b') + ';--jeu-accent:' + esc(j.accent || '#94a3b8') + '"';
      const corps = '<span class="jeu__tete"><span class="jeu__icone" aria-hidden="true">' + esc(j.icone) + '</span>' +
        '<span class="jeu__coin">' +
          (j.version ? '<span class="jeu__version" title="Version du jeu">v' + esc(j.version) + '</span>' : '') +
          (j.bloque ? CADENAS : '') + '</span></span>' +
        '<span class="jeu__nom">' + esc(j.nom) + '</span><span class="jeu__desc">' + esc(j.description) + '</span>';
      return j.bloque
        ? '<div class="jeu jeu--bloque"' + style + ' aria-disabled="true">' + corps +
          '<span class="jeu__aller">Fermé pour le moment</span></div>'
        : '<a class="jeu"' + style + ' href="' + esc(Jeux.lien(j)) + '">' + corps +
          '<span class="jeu__aller">Jouer <span aria-hidden="true">→</span></span></a>';
    }).join('');
    if (Jeux.version) $('#version').textContent = $('#admin-version').textContent = 'Les jeux · version ' + Jeux.version;
  }

  if (!window.Comptes) return;
  const C = window.Comptes;
  const Admin = window.AccueilAdmin || null;

  /* ---------- Bouton du compte et son menu ---------- */
  let vue = null;                       // null : actions du compte connecté ; 'connexion' | 'inscription' : formulaire
  let nomPropose = '';                  // nom rempli d'avance (compte déjà utilisé ici)
  let message = '';                     // erreur à afficher dans le menu
  let occupe = false;                   // requête en cours : boutons désactivés
  let voirJeux = false;                 // administrateur : liste des jeux au lieu du tableau de bord
  let dernier = C.compte() ? C.compte().id : null;

  // Pictogrammes des lignes du menu (traits sur une grille de 24 × 24)
  const ICONES = {
    tableau: '<rect x="3.5" y="3.5" width="7" height="9" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.5"/>' +
      '<rect x="13.5" y="11.5" width="7" height="9" rx="1.5"/><rect x="3.5" y="15.5" width="7" height="5" rx="1.5"/>',
    jeux: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/>' +
      '<rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    changer: '<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>',
    deconnexion: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 17l5-5-5-5M20 12H9"/>'
  };
  const SILHOUETTE = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>';

  const initiale = (nom) => (String(nom).trim().charAt(0) || '?').toUpperCase();
  const avatar = (c, classe) => '<span class="avatar' + (c ? '' : ' avatar--invite') + (classe ? ' ' + classe : '') + '"' +
    (c ? ' style="--avatar:' + esc(c.couleur) + '"' : '') + ' aria-hidden="true">' + (c ? esc(initiale(c.nom)) : SILHOUETTE) + '</span>';
  const desactive = () => (occupe ? ' disabled' : '');
  const ligne = (action, titre, detail) => '<button type="button" class="ligne" data-compte="' + action + '"' + desactive() + '>' +
    '<span class="ligne__icone" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONES[action] + '</svg></span>' +
    '<span class="texte"><b>' + titre + '</b><small>' + detail + '</small></span></button>';
  const identite = (c, detail) => '<div class="identite">' + avatar(c, 'avatar--menu') +
    '<span class="texte"><b>' + esc(c ? c.nom : 'Invité') + '</b><small>' + detail + '</small></span></div>';
  const champ = (libelle, nom, type, auto, extra) => '<label class="champ">' + libelle +
    '<input name="' + nom + '" type="' + type + '" autocomplete="' + auto + '" spellcheck="false" required' + (extra || '') + '></label>';

  const modeAdmin = () => { const c = C.compte(); return !!(c && c.admin && Admin) && !voirJeux; };

  function majBouton() {
    const c = C.compte();
    const b = $('#compte-bouton');
    b.innerHTML = avatar(c) + '<span class="compte-nom">' + esc(c ? c.nom : 'Invité') + '</span>' +
      (c && c.admin ? '<span class="badge badge--admin">Admin</span>' : '');
    b.title = c ? 'Compte : ' + c.nom + ' (changer de compte, se déconnecter)' : 'Invité (se connecter, créer un compte)';
    b.setAttribute('aria-label', (c ? 'Compte : ' + c.nom : 'Vous jouez en invité') + '. Ouvrir le menu du compte');
  }

  // Comptes déjà connectés dans ce navigateur (sauf celui qui l'est) : un clic remplit le nom
  function vueRecents() {
    const c = C.compte();
    const liste = C.recents().filter((r) => !c || r.id !== c.id);
    if (!liste.length) return '';
    return '<div class="recents"><p class="menu-sous-titre">Comptes déjà utilisés ici</p><ul>' + liste.map((r) =>
      '<li><button type="button" class="recent" data-recent="' + esc(r.id) + '"' + desactive() + '>' + avatar(r) +
        '<span class="texte"><b>' + esc(r.nom) + '</b><small>Se connecter</small></span></button>' +
      '<button type="button" class="recent__oublier" data-oublier="' + esc(r.id) + '" title="Oublier sur cet appareil" aria-label="Oublier ' +
        esc(r.nom) + ' sur cet appareil"' + desactive() + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></li>').join('') +
      '</ul></div>';
  }

  function vueFormulaire() {
    const inscription = vue === 'inscription';
    return (inscription ? '' : vueRecents()) +
      '<div class="onglets" role="tablist">' +
        '<button type="button" role="tab" aria-selected="' + !inscription + '" data-vue="connexion"' + desactive() + '>Se connecter</button>' +
        '<button type="button" role="tab" aria-selected="' + inscription + '" data-vue="inscription"' + desactive() + '>Créer un compte</button>' +
      '</div>' +
      '<form class="form" data-form="' + vue + '">' +
        champ('Nom', 'username', 'text', 'username', ' maxlength="' + C.LONGUEUR_NOM + '"' + (!inscription && nomPropose ? ' value="' + esc(nomPropose) + '"' : '')) +
        champ('Mot de passe', 'password', 'password', inscription ? 'new-password' : 'current-password', inscription ? ' minlength="' + C.MDP_MIN + '"' : '') +
        (inscription ? champ('Confirmer le mot de passe', 'confirmation', 'password', 'new-password') : '') +
        '<p class="message message--erreur" role="alert">' + esc(message) + '</p>' +
        '<div class="form__boutons"><button type="submit" class="btn btn--plein"' + desactive() + '>' +
          (occupe ? '…' : inscription ? 'Créer le compte' : 'Se connecter') + '</button>' +
          (C.connecte() ? '<button type="button" class="btn btn--doux" data-compte="annuler"' + desactive() + '>Annuler</button>' : '') + '</div>' +
      '</form>';
  }

  function majMenu() {
    const c = C.compte();
    const serveur = C.serveurDisponible();
    $('#compte-titre').textContent = c ? (c.admin ? 'Administration' : 'Mon compte') : 'Compte';
    let html;
    if (!c && !serveur) {
      html = identite(null, 'Vous jouez en invité');
    } else if (c && !vue) {
      html = identite(c, c.admin ? 'Administrateur · tous les jeux' : 'Connecté à tous les jeux') +
        (message ? '<p class="message message--erreur" role="alert">' + esc(message) + '</p>' : '') +
        '<div class="lignes">' +
          (c.admin && Admin ? (modeAdmin() ? ligne('jeux', 'Voir la page des jeux', 'Le tableau de bord reste dans ce menu')
            : ligne('tableau', 'Tableau de bord', 'Comptes et défis de la semaine')) : '') +
          ligne('changer', 'Changer de compte', 'Se connecter avec un autre compte') +
          ligne('deconnexion', 'Se déconnecter', 'De tous les jeux, dans ce navigateur') +
        '</div>';
    } else {
      html = identite(c, c ? 'Connecté · choisissez un autre compte' : 'Vous jouez en invité') + vueFormulaire();
    }
    $('#compte-corps').innerHTML = html;
    $('#compte-note').textContent = !c && !serveur
      ? 'Sans serveur, on joue en invité. Pour les comptes, lancez les jeux avec game.bat, à la racine du dossier des jeux.'
      : c && c.admin
        ? 'Le tableau de bord n\'existe que sur cette page ; dans les jeux, « admin » joue comme les autres comptes.'
        : 'Un seul compte pour tous les jeux : vous restez connecté en changeant de jeu.';
  }

  // Le champ à remplir (le mot de passe si le nom est déjà là), sinon la première ligne
  function focusPremier() {
    const nom = $('#compte-corps input[name="username"]');
    const c = nom && nom.value ? $('#compte-corps input[type="password"]') : nom || $('#compte-corps button:not([disabled])');
    if (c) c.focus();
  }

  const menuOuvert = () => !$('#compte-menu').hidden;

  function ouvrirMenu() {
    vue = C.connecte() ? null : 'connexion';
    nomPropose = '';
    message = C.erreur();
    C.effacerErreur();
    majMenu();
    $('#compte-menu').hidden = false;
    $('#compte-bouton').setAttribute('aria-expanded', 'true');
    $('.compte-coin').classList.add('is-ouvert');
    focusPremier();
  }

  // rendreFocus : le bouton du compte reprend le focus (fermeture au clavier)
  function fermerMenu(rendreFocus) {
    if (!menuOuvert()) return;
    if ($('#compte-menu').contains(document.activeElement)) document.activeElement.blur();
    $('#compte-menu').hidden = true;
    $('#compte-bouton').setAttribute('aria-expanded', 'false');
    $('.compte-coin').classList.remove('is-ouvert');
    if (rendreFocus) $('#compte-bouton').focus();
  }

  // Liste des jeux, ou tableau de bord pour l'administrateur
  function majVue() {
    const admin = modeAdmin();
    if ((document.body.dataset.vue === 'admin') === admin) return;
    document.body.dataset.vue = admin ? 'admin' : 'jeux';
    $('#vue-jeux').hidden = admin;
    $('#vue-admin').hidden = !admin;
    document.title = admin ? 'Tableau de bord · Les jeux' : 'Les jeux';
    if (admin) Admin.ouvrir();
    else if (Admin) Admin.fermer();
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
      focusPremier();
    }
  }

  function soumettre(form) {
    const v = (n) => (form.elements[n] ? form.elements[n].value : '');
    const inscription = form.dataset.form === 'inscription';
    if (inscription && v('password') !== v('confirmation')) {
      message = 'Les deux mots de passe ne sont pas identiques.';
      majMenu();
      focusPremier();
      return;
    }
    executer(() => (inscription ? C.inscrire(v('username'), v('password')) : C.connecter(v('username'), v('password'))),
      () => { vue = null; nomPropose = ''; message = ''; voirJeux = false; majVue(); majMenu(); fermerMenu(true); });
  }

  function brancherMenu() {
    const coin = $('.compte-coin');
    const menu = $('#compte-menu');
    $('#compte-bouton').addEventListener('click', () => (menuOuvert() ? fermerMenu(false) : ouvrirMenu()));
    // Clic ailleurs : fermeture. Le chemin du clic est celui du moment du clic (le menu a pu être redessiné depuis).
    document.addEventListener('click', (e) => { if (menuOuvert() && !e.composedPath().includes(coin)) fermerMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOuvert()) fermerMenu(true); });
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.vue) { vue = b.dataset.vue; message = ''; majMenu(); focusPremier(); return; }
      if (b.dataset.recent) {
        const r = C.recents().find((x) => x.id === b.dataset.recent);
        vue = 'connexion'; nomPropose = r ? r.nom : ''; message = '';
        majMenu(); focusPremier();
        return;
      }
      if (b.dataset.oublier) { C.oublierRecent(b.dataset.oublier); majMenu(); focusPremier(); return; }
      switch (b.dataset.compte) {
        case 'changer': vue = 'connexion'; nomPropose = ''; message = ''; majMenu(); focusPremier(); break;
        case 'annuler': vue = null; nomPropose = ''; message = ''; majMenu(); focusPremier(); break;
        case 'tableau': voirJeux = false; majVue(); fermerMenu(true); break;
        case 'jeux': voirJeux = true; majVue(); fermerMenu(true); break;
        case 'deconnexion':
          executer(() => C.deconnecter(), () => { vue = 'connexion'; message = ''; majMenu(); focusPremier(); });
          break;
      }
    });
    menu.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!occupe) soumettre(e.target);
    });
  }

  // Connexion, déconnexion ou changement de nom (ici ou dans un autre onglet)
  C.surChangement(() => {
    const c = C.compte();
    const id = c ? c.id : null;
    if (id !== dernier) {
      dernier = id;
      voirJeux = false;
      if (!occupe) { vue = c ? null : 'connexion'; nomPropose = ''; }
    }
    majBouton();
    majVue();
    if (menuOuvert()) majMenu();
  });

  $('.compte-coin').hidden = false;
  brancherMenu();
  majBouton();
  majVue();
})();
