/* ==========================================================================
   Natehure Quizz - account/account.js
   LE COMPTE DU JOUEUR, en haut a gauche : un bouton et un menu deroulant, sur le modele du menu
   « Jeux » (en haut a droite) et du menu de compte d'Anotehomy Quizz. Le menu se ferme d'un clic
   ailleurs ou avec Echap.
     - invite : se connecter ou creer un compte ; les comptes deja connectes dans ce navigateur sont
       proposes (un clic remplit le nom, la croix les oublie) ;
     - connecte : changer de compte, se deconnecter.
   Les comptes sont communs a tous les jeux (../COMMUN/comptes.js). Sans ce fichier, ou sans serveur,
   on joue en invite : le bouton reste, le menu l'explique.
   Les statistiques ne sont pas encore tenues ici : aucun jeu n'est jouable (js/data/games.js).
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc } = NQ.util;
  const C = window.Comptes || null;

  /* Pictogrammes des lignes (traits sur une grille de 24 x 24) */
  const ICONS = {
    changer: '<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>',
    deconnexion: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 17l5-5-5-5M20 12H9"/>'
  };
  const SILHOUETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
    '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>';

  let form = null;          /* null : actions du compte ; 'login' | 'signup' : formulaire */
  let propose = '';         /* nom rempli d'avance (compte deja utilise ici) */
  let message = '';         /* erreur a afficher dans le menu */
  let busy = false;         /* requete en cours : boutons desactives */

  const initial = n => (String(n).trim().charAt(0) || '?').toUpperCase();
  const avatar = c => '<span class="acct-av" ' + (c ? 'style="--av:' + esc(c.couleur) + '"' : '') +
    ' aria-hidden="true">' + (c ? esc(initial(c.nom)) : SILHOUETTE) + '</span>';
  const dis = () => (busy ? ' disabled' : '');
  const ligne = (act, titre, detail) => '<button type="button" class="acct-ligne" data-act="' + act + '"' + dis() + '>' +
    '<span class="acct-ligne__icone" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONS[act] + '</svg></span>' +
    '<span class="acct-ligne__texte"><b>' + titre + '</b><small>' + detail + '</small></span></button>';
  const identite = (c, detail) => '<div class="acct-identite">' + avatar(c) +
    '<span class="acct-ligne__texte"><b>' + esc(c ? c.nom : 'Invité') + '</b><small>' + detail + '</small></span></div>';
  const champ = (libelle, nom, type, auto, extra) => '<label class="acct-field">' + libelle +
    '<input name="' + nom + '" type="' + type + '" autocomplete="' + auto + '" spellcheck="false" required' + (extra || '') + '></label>';

  function majBouton() {
    const c = C && C.compte();
    const b = $('acctBtn');
    b.innerHTML = avatar(c) + '<span class="acct-name">' + esc(c ? c.nom : 'Invité') + '</span>';
    b.title = c ? 'Compte : ' + c.nom + ' (changer de compte, se déconnecter)' : 'Invité (se connecter, créer un compte)';
    b.setAttribute('aria-label', (c ? 'Compte : ' + c.nom : 'Vous jouez en invité') + '. Ouvrir le menu du compte');
  }

  /* Comptes deja connectes dans ce navigateur (sauf celui qui l'est) : un clic remplit le nom */
  function vueRecents() {
    const c = C.compte();
    const liste = C.recents().filter(r => !c || r.id !== c.id);
    if (!liste.length) return '';
    return '<p class="acct-menu__titre">Comptes déjà utilisés ici</p>' + liste.map(r =>
      '<div class="acct-recent">' +
        '<button type="button" class="acct-ligne" data-recent="' + esc(r.id) + '"' + dis() + '>' + avatar(r) +
          '<span class="acct-ligne__texte"><b>' + esc(r.nom) + '</b><small>Se connecter</small></span></button>' +
        '<button type="button" class="acct-oublier" data-oublier="' + esc(r.id) + '" aria-label="Oublier ' + esc(r.nom) +
          ' sur cet appareil" title="Oublier sur cet appareil"' + dis() + '>✕</button>' +
      '</div>').join('');
  }

  function vueFormulaire() {
    const neuf = form === 'signup';
    return (neuf ? '' : vueRecents()) +
      '<div class="acct-tabs" role="tablist">' +
        '<button type="button" role="tab" aria-selected="' + !neuf + '" class="' + (neuf ? '' : 'on') + '" data-vue="login"' + dis() + '>Se connecter</button>' +
        '<button type="button" role="tab" aria-selected="' + neuf + '" class="' + (neuf ? 'on' : '') + '" data-vue="signup"' + dis() + '>Créer un compte</button>' +
      '</div>' +
      '<form class="acct-form" data-form="' + form + '">' +
        champ('Nom', 'name', 'text', 'username', ' maxlength="' + C.LONGUEUR_NOM + '"' + (!neuf && propose ? ' value="' + esc(propose) + '"' : '')) +
        champ('Mot de passe', 'pwd', 'password', neuf ? 'new-password' : 'current-password', neuf ? ' minlength="' + C.MDP_MIN + '"' : '') +
        (neuf ? champ('Confirmer le mot de passe', 'pwd2', 'password', 'new-password') : '') +
        '<p class="acct-err" role="alert">' + esc(message) + '</p>' +
        '<div class="btn-row"><button type="submit" class="btn primary"' + dis() + '>' +
          (busy ? '…' : neuf ? 'Créer le compte' : 'Se connecter') + '</button>' +
          (C.connecte() ? '<button type="button" class="btn" data-act="annuler"' + dis() + '>Annuler</button>' : '') + '</div>' +
      '</form>';
  }

  function dessinerMenu() {
    if (!C) {
      $('acctBody').innerHTML = identite(null, 'Vous jouez en invité');
      $('acctHelp').textContent = 'Les comptes communs ne sont pas chargés : on joue en invité.';
      return;
    }
    const c = C.compte();
    const serveur = C.serveurDisponible();
    $('acctTitle').textContent = c ? 'Mon compte' : 'Compte';
    let html;
    if (!c && !serveur) {
      html = identite(null, 'Vous jouez en invité');
    } else if (c && !form) {
      html = identite(c, 'Connecté à tous les jeux') +
        (message ? '<p class="acct-err" role="alert">' + esc(message) + '</p>' : '') +
        '<div class="acct-lignes">' +
          ligne('changer', 'Changer de compte', 'Se connecter avec un autre compte') +
          ligne('deconnexion', 'Se déconnecter', 'De tous les jeux, dans ce navigateur') +
        '</div>';
    } else {
      html = identite(c, c ? 'Connecté · choisissez un autre compte' : 'Vous jouez en invité') + vueFormulaire();
    }
    $('acctBody').innerHTML = html;
    $('acctHelp').textContent = !c && !serveur
      ? 'Sans serveur, on joue en invité. Pour les comptes, lancez les jeux avec game.bat, à la racine du dossier des jeux.'
      : 'Un seul compte pour tous les jeux : vous restez connecté en changeant de jeu.';
  }

  /* Le champ a remplir (le mot de passe si le nom est deja la), sinon la premiere ligne */
  function focusPremier() {
    const nom = document.querySelector('#acctBody input[name="name"]');
    const c = nom && nom.value ? document.querySelector('#acctBody input[type="password"]')
      : nom || document.querySelector('#acctBody button:not([disabled])');
    if (c) c.focus();
  }

  const ouvert = () => !$('acctMenu').hidden;

  function ouvrir() {
    if (C) {
      form = C.connecte() ? null : 'login';
      propose = '';
      message = C.erreur();
      C.effacerErreur();
    }
    dessinerMenu();
    $('acctMenu').hidden = false;
    $('acctBtn').setAttribute('aria-expanded', 'true');
    document.querySelector('.acct-coin').classList.add('is-ouvert');
    focusPremier();
  }

  /* rendreFocus : le bouton du compte reprend le focus (fermeture au clavier) */
  function fermer(rendreFocus) {
    if (!ouvert()) return;
    if ($('acctMenu').contains(document.activeElement)) document.activeElement.blur();
    $('acctMenu').hidden = true;
    $('acctBtn').setAttribute('aria-expanded', 'false');
    document.querySelector('.acct-coin').classList.remove('is-ouvert');
    if (rendreFocus) $('acctBtn').focus();
  }

  /* Lance une requete au serveur : boutons desactives pendant l'attente, message d'erreur sinon */
  async function executer(action, apres) {
    const saisie = {};          /* ce qui a ete tape, remis apres chaque redessin (sauf les mots de passe) */
    document.querySelectorAll('#acctBody input[type="text"]').forEach(i => { saisie[i.name] = i.value; });
    const remettre = () => Object.keys(saisie).forEach(n => {
      const i = document.querySelector('#acctBody input[name="' + n + '"]');
      if (i) i.value = saisie[n];
    });
    busy = true;
    message = '';
    dessinerMenu();
    remettre();
    try {
      await action();
      busy = false;
      apres();
    } catch (err) {
      busy = false;
      message = err.message;
      dessinerMenu();
      remettre();
      focusPremier();
    }
  }

  function soumettre(f) {
    const v = n => (f.elements[n] ? f.elements[n].value : '');
    const neuf = f.dataset.form === 'signup';
    if (neuf && v('pwd') !== v('pwd2')) {
      message = 'Les deux mots de passe ne sont pas identiques.';
      dessinerMenu();
      focusPremier();
      return;
    }
    executer(() => (neuf ? C.inscrire(v('name'), v('pwd')) : C.connecter(v('name'), v('pwd'))),
      () => { form = null; propose = ''; message = ''; dessinerMenu(); fermer(true); });
  }

  function brancher() {
    const coin = document.querySelector('.acct-coin');
    const menu = $('acctMenu');
    $('acctBtn').addEventListener('click', () => (ouvert() ? fermer(false) : ouvrir()));
    /* Clic ailleurs : fermeture. Le chemin du clic est celui du moment du clic (le menu a pu etre
       redessine depuis). */
    document.addEventListener('click', e => { if (ouvert() && !e.composedPath().includes(coin)) fermer(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && ouvert()) fermer(true); });
    if (!C) return;
    menu.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.vue) { form = b.dataset.vue; message = ''; dessinerMenu(); focusPremier(); return; }
      if (b.dataset.recent) {
        const r = C.recents().find(x => x.id === b.dataset.recent);
        form = 'login'; propose = r ? r.nom : ''; message = '';
        dessinerMenu(); focusPremier();
        return;
      }
      if (b.dataset.oublier) { C.oublierRecent(b.dataset.oublier); dessinerMenu(); focusPremier(); return; }
      switch (b.dataset.act) {
        case 'changer': form = 'login'; propose = ''; message = ''; dessinerMenu(); focusPremier(); break;
        case 'annuler': form = null; propose = ''; message = ''; dessinerMenu(); focusPremier(); break;
        case 'deconnexion':
          executer(() => C.deconnecter(), () => { form = 'login'; message = ''; dessinerMenu(); focusPremier(); });
          break;
      }
    });
    menu.addEventListener('submit', e => {
      e.preventDefault();
      if (!busy) soumettre(e.target);
    });
    /* Connexion, deconnexion ou changement de nom (ici ou dans un autre onglet) */
    C.surChangement(() => {
      if (!busy) { form = C.connecte() ? null : 'login'; propose = ''; }
      majBouton();
      if (ouvert()) dessinerMenu();
    });
  }

  function init() {
    brancher();
    majBouton();
  }

  NS.init = init;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(NQ.account);
