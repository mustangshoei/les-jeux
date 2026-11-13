/* ==========================================================================
   compte.js — Le compte du joueur : bouton et menu déroulant (en haut à gauche)

   Même construction que le menu « Jeux » (en haut à droite) et que les menus de compte des autres
   jeux (repris de NATEHURE_QUIZZ/js/account/account.js) : un titre, le joueur, des lignes d'action,
   une note. Le menu se ferme d'un clic ailleurs ou avec Échap. Les comptes sont communs à tous les jeux
   du dossier (../COMMUN/comptes.js) : se connecter ici connecte aussi les autres jeux.
     - invité, serveur disponible : se connecter ou créer un compte (avec, à la création, la reprise des
       statistiques de l'invité) ; les comptes déjà connectés dans ce navigateur sont proposés (un clic
       remplit le nom, la croix les oublie). Le menu s'ouvre seul à l'arrivée, une fois par session du
       navigateur (tous jeux confondus) ; on peut alors continuer en invité ;
     - connecté : renommer, changer le mot de passe, changer de compte, se déconnecter, supprimer le compte ;
     - sans serveur (index.html ouvert directement) : invité seulement, la note l'explique.
   Les autres comptes ne sont jamais listés. Les données sont gérées par js/profils.js (à charger avant).
   ========================================================================== */
(function () {
  'use strict';

  if (!window.HistProfils) {
    console.error('compte.js : js/profils.js doit être chargé avant ce fichier');
    return;
  }
  const P = window.HistProfils;
  const C = window.Comptes || null;              // pour la liste des comptes déjà utilisés ici
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Pictogrammes des lignes (traits sur une grille de 24 x 24) */
  const ICONES = {
    renommer: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    mdp: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
    changer: '<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>',
    deconnexion: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 17l5-5-5-5M20 12H9"/>',
    supprimer: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    invite: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  const SILHOUETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
    '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>';

  /* vue : null (lignes d'action du compte connecté) | 'connexion' | 'inscription' | 'renommer' | 'mdp' | 'supprimer' */
  let vue = 'connexion';
  let propose = '';           // nom rempli d'avance (compte déjà utilisé ici)
  let message = '';           // erreur à afficher dans le menu
  let info = '';              // confirmation (« Nom changé. »)
  let accueil = false;        // menu ouvert automatiquement à l'arrivée
  let occupe = false;         // requête en cours : boutons désactivés

  const parties = (n) => n + ' partie' + (n > 1 ? 's' : '');
  const initiale = (n) => (String(n).trim().charAt(0) || '?').toUpperCase();
  const avatar = (c) => '<span class="acct-av"' + (c ? ' style="--av:' + esc(c.couleur) + '"' : '') + ' aria-hidden="true">' +
    (c ? esc(initiale(c.nom)) : SILHOUETTE) + '</span>';
  const dis = () => (occupe ? ' disabled' : '');
  const ligne = (act, titre, detail, danger) => '<button type="button" class="acct-ligne' + (danger ? ' acct-ligne--danger' : '') +
    '" data-act="' + act + '"' + dis() + '><span class="acct-ligne__icone" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONES[act] +
    '</svg></span><span class="acct-ligne__texte"><b>' + titre + '</b><small>' + detail + '</small></span></button>';
  const identite = (c, detail) => '<div class="acct-identite">' + avatar(c) +
    '<span class="acct-ligne__texte"><b>' + esc(c ? c.nom : 'Invité') + '</b><small>' + detail + '</small></span></div>';
  const champ = (libelle, nom, type, auto, extra) => '<label class="acct-field">' + libelle +
    '<input name="' + nom + '" type="' + type + '" autocomplete="' + auto + '" spellcheck="false" required' + (extra || '') + '></label>';
  const erreur = () => '<p class="acct-err" role="alert">' + esc(message) + '</p>';
  const boutons = (libelle, classe, annuler) => '<div class="acct-boutons"><button type="submit" class="btn ' + (classe || 'btn-primary') + '"' + dis() + '>' +
    (occupe ? '…' : libelle) + '</button>' + (annuler ? '<button type="button" class="btn btn-soft" data-act="annuler"' + dis() + '>Annuler</button>' : '') + '</div>';

  /* Le joueur actif, tel que le bouton l'affiche */
  const joueur = () => { const p = P.actif(); return p.invite ? null : { nom: p.nom, couleur: p.couleur }; };

  function majBouton() {
    const c = joueur();
    const b = $('acctBtn');
    b.innerHTML = avatar(c) + '<span class="acct-name">' + esc(c ? c.nom : 'Invité') + '</span>';
    b.title = c ? 'Compte : ' + c.nom : 'Invité (se connecter, créer un compte)';
    b.setAttribute('aria-label', (c ? 'Compte : ' + c.nom : 'Vous jouez en invité') + '. Ouvrir le menu du compte');
  }

  /* Comptes déjà connectés dans ce navigateur (sauf celui qui l'est) : un clic remplit le nom */
  function vueRecents() {
    if (!C || !C.recents) return '';
    const c = C.compte();
    const liste = C.recents().filter((r) => !c || r.id !== c.id);
    if (!liste.length) return '';
    return '<p class="acct-menu__titre">Comptes déjà utilisés ici</p>' + liste.map((r) =>
      '<div class="acct-recent">' +
        '<button type="button" class="acct-ligne" data-recent="' + esc(r.id) + '"' + dis() + '>' + avatar(r) +
          '<span class="acct-ligne__texte"><b>' + esc(r.nom) + '</b><small>Se connecter</small></span></button>' +
        '<button type="button" class="acct-oublier" data-oublier="' + esc(r.id) + '" aria-label="Oublier ' + esc(r.nom) +
          ' sur cet appareil" title="Oublier sur cet appareil"' + dis() + '>✕</button>' +
      '</div>').join('');
  }

  /* Se connecter ou créer un compte (formulaires reconnus par les gestionnaires de mots de passe) */
  function vueFormulaireAcces() {
    const neuf = vue === 'inscription';
    const nbInvite = P.connecte() ? 0 : P.statistiques().totaux.parties;
    return (neuf ? '' : vueRecents()) +
      '<div class="acct-tabs" role="tablist">' +
        '<button type="button" role="tab" aria-selected="' + !neuf + '" class="' + (neuf ? '' : 'on') + '" data-vue="connexion"' + dis() + '>Se connecter</button>' +
        '<button type="button" role="tab" aria-selected="' + neuf + '" class="' + (neuf ? 'on' : '') + '" data-vue="inscription"' + dis() + '>Créer un compte</button>' +
      '</div>' +
      '<form class="acct-form" data-form="' + vue + '">' +
        champ('Nom', 'username', 'text', 'username', ' maxlength="' + P.LONGUEUR_NOM + '"' + (!neuf && propose ? ' value="' + esc(propose) + '"' : '')) +
        champ('Mot de passe', 'password', 'password', neuf ? 'new-password' : 'current-password', neuf ? ' minlength="' + P.MDP_MIN + '"' : '') +
        (neuf ? champ('Confirmer le mot de passe', 'confirmation', 'password', 'new-password') : '') +
        (neuf && nbInvite ? '<label class="checkbox-row acct-check"><input name="reprendre" type="checkbox" checked><span>Reprendre les statistiques ' +
          'de l\'invité de ce navigateur (' + parties(nbInvite) + ')</span></label>' : '') +
        erreur() + boutons(neuf ? 'Créer le compte' : 'Se connecter', 'btn-primary', P.connecte()) +
      '</form>' +
      (accueil && !P.connecte() ? '<div class="acct-lignes">' + ligne('invite', 'Continuer en invité', 'Statistiques gardées dans ce navigateur') + '</div>' : '');
  }

  function vueConnecte() {
    const p = P.actif();
    const etat = P.enAttente()
      ? (P.serveurDisponible() ? 'synchronisation…' : 'serveur injoignable : envoi à son retour')
      : 'connecté à tous les jeux';
    let html = identite(joueur(), parties(P.statistiques().totaux.parties) + ' · ' + etat);
    if (vue === 'renommer') {
      html += '<form class="acct-form" data-form="renommer">' + champ('Nouveau nom', 'nom', 'text', 'username', ' maxlength="' + P.LONGUEUR_NOM + '" value="' + esc(p.nom) + '"') +
        erreur() + boutons('Renommer', 'btn-primary', true) + '</form>';
    } else if (vue === 'mdp') {
      html += '<form class="acct-form" data-form="mdp"><input type="text" name="username" autocomplete="username" value="' + esc(p.nom) + '" hidden>' +
        champ('Mot de passe actuel', 'ancien', 'password', 'current-password') +
        champ('Nouveau mot de passe', 'nouveau', 'password', 'new-password', ' minlength="' + P.MDP_MIN + '"') +
        champ('Confirmer le nouveau mot de passe', 'confirmation', 'password', 'new-password') +
        erreur() + boutons('Changer le mot de passe', 'btn-primary', true) + '</form>';
    } else if (vue === 'supprimer') {
      html += '<form class="acct-form danger" data-form="supprimer"><p>Supprimer le compte « ' + esc(p.nom) + ' » et ses statistiques, dans tous les jeux ? ' +
        'C\'est définitif.</p>' + champ('Mot de passe', 'mdp', 'password', 'current-password') +
        erreur() + boutons('Supprimer définitivement', 'btn-danger-plein', true) + '</form>';
    } else if (vue === 'connexion') {
      html += vueFormulaireAcces();
    } else {
      html += (info ? '<p class="acct-info" role="status">' + esc(info) + '</p>' : '') +
        (message ? '<div class="acct-form">' + erreur() + '</div>' : '') +
        '<div class="acct-lignes">' +
          ligne('renommer', 'Renommer', 'Le nouveau nom vaut pour tous les jeux') +
          ligne('mdp', 'Changer le mot de passe', 'Les autres appareils devront se reconnecter') +
          ligne('changer', 'Changer de compte', 'Se connecter avec un autre compte') +
          ligne('deconnexion', 'Se déconnecter', 'De tous les jeux, dans ce navigateur') +
          ligne('supprimer', 'Supprimer le compte', 'Et ses statistiques, dans tous les jeux', true) +
        '</div>';
    }
    return html;
  }

  function dessinerMenu() {
    const connecte = P.connecte();
    const serveur = P.serveurDisponible();
    $('acctTitle').textContent = connecte ? 'Mon compte' : accueil ? 'Bienvenue sur Histehory Quizz' : 'Compte';
    if (connecte) $('acctBody').innerHTML = vueConnecte();
    else if (serveur) $('acctBody').innerHTML = identite(null, 'Vous jouez en invité · ' + parties(P.statistiques().totaux.parties)) + vueFormulaireAcces();
    else $('acctBody').innerHTML = identite(null, 'Vous jouez en invité · ' + parties(P.statistiques().totaux.parties));
    $('acctHelp').textContent = connecte
      ? 'Un seul compte pour tous les jeux : vous restez connecté en changeant de jeu. Vos statistiques vous suivent sur tous vos appareils.'
      : serveur
        ? 'Un seul compte pour tous les jeux : vos statistiques vous suivent sur tous vos appareils. En invité, elles restent dans ce navigateur.'
        : 'Sans serveur, on joue en invité : vos statistiques restent dans ce navigateur. Pour créer un compte (commun à tous les jeux), lancez les jeux avec game.bat, dans le dossier SERVEUR.';
  }

  /* Le champ à remplir (le mot de passe si le nom est déjà là), sinon la première ligne */
  function focusPremier() {
    const nom = document.querySelector('#acctBody input[name="username"]:not([hidden]), #acctBody input[name="nom"]');
    const c = nom && nom.value && nom.name === 'username' ? document.querySelector('#acctBody input[type="password"]')
      : nom || document.querySelector('#acctBody input[type="password"], #acctBody button:not([disabled])');
    if (c) c.focus();
  }

  const ouvert = () => !$('acctMenu').hidden;

  function ouvrir(depuisAccueil) {
    accueil = !!depuisAccueil;
    vue = P.connecte() ? null : 'connexion';
    propose = '';
    info = '';
    message = P.erreur();
    P.effacerErreur();
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
    accueil = false;
    if (rendreFocus) $('acctBtn').focus();
  }

  /* Lance une requête au serveur : boutons désactivés pendant l'attente, message d'erreur sinon */
  async function executer(action, apres) {
    const saisie = {};          // ce qui a été tapé, remis après chaque redessin (sauf les mots de passe)
    document.querySelectorAll('#acctBody input[type="text"]').forEach((i) => { saisie[i.name] = i.value; });
    const remettre = () => Object.keys(saisie).forEach((n) => {
      const i = document.querySelector('#acctBody input[name="' + n + '"]');
      if (i) i.value = saisie[n];
    });
    occupe = true;
    message = '';
    dessinerMenu();
    remettre();
    try {
      await action();
      occupe = false;
      apres();
    } catch (err) {
      occupe = false;
      message = err.message;
      dessinerMenu();
      remettre();
      focusPremier();
    }
  }

  function soumettre(form) {
    const v = (n) => (form.elements[n] ? form.elements[n].value : '');
    const sorte = form.dataset.form;
    const differents = (a, b) => {
      if (a === b) return false;
      message = 'Les deux mots de passe ne sont pas identiques.';
      dessinerMenu();
      focusPremier();
      return true;
    };
    const fini = () => { vue = null; propose = ''; message = ''; dessinerMenu(); fermer(true); };
    if (sorte === 'connexion') return executer(() => P.connecter(v('username'), v('password')), fini);
    if (sorte === 'inscription') {
      if (differents(v('password'), v('confirmation'))) return;
      const reprendre = form.elements.reprendre ? form.elements.reprendre.checked : false;
      return executer(() => P.inscrire(v('username'), v('password'), reprendre), fini);
    }
    if (sorte === 'renommer') {
      return executer(() => P.renommer(v('nom')), () => { vue = null; info = 'Nom changé.'; dessinerMenu(); focusPremier(); });
    }
    if (sorte === 'mdp') {
      if (differents(v('nouveau'), v('confirmation'))) return;
      return executer(() => P.changerMotDePasse(v('ancien'), v('nouveau')), () => {
        vue = null;
        info = 'Mot de passe changé. Vos autres appareils devront se reconnecter.';
        dessinerMenu();
        focusPremier();
      });
    }
    if (sorte === 'supprimer') {
      return executer(() => P.supprimerCompte(v('mdp')), () => { vue = 'connexion'; info = ''; dessinerMenu(); focusPremier(); });
    }
  }

  function brancher() {
    const coin = document.querySelector('.acct-coin');
    const menu = $('acctMenu');
    $('acctBtn').addEventListener('click', () => (ouvert() ? fermer(false) : ouvrir(false)));
    // Clic ailleurs : fermeture (le chemin est celui du moment du clic : le menu a pu être redessiné depuis)
    document.addEventListener('click', (e) => { if (ouvert() && !e.composedPath().includes(coin)) fermer(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ouvert()) fermer(true); });
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.vue) { vue = b.dataset.vue; message = ''; dessinerMenu(); focusPremier(); return; }
      if (b.dataset.recent && C) {
        const r = C.recents().find((x) => x.id === b.dataset.recent);
        vue = 'connexion'; propose = r ? r.nom : ''; message = '';
        dessinerMenu(); focusPremier();
        return;
      }
      if (b.dataset.oublier && C) { C.oublierRecent(b.dataset.oublier); dessinerMenu(); focusPremier(); return; }
      switch (b.dataset.act) {
        case 'invite': fermer(true); break;
        case 'renommer': case 'mdp': case 'supprimer':
          vue = b.dataset.act; message = ''; info = ''; dessinerMenu(); focusPremier(); break;
        case 'changer': vue = 'connexion'; propose = ''; message = ''; info = ''; dessinerMenu(); focusPremier(); break;
        case 'annuler': vue = P.connecte() ? null : 'connexion'; message = ''; dessinerMenu(); focusPremier(); break;
        case 'deconnexion':
          executer(() => P.deconnecter(), () => { vue = 'connexion'; info = ''; dessinerMenu(); focusPremier(); });
          break;
      }
    });
    menu.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!occupe) soumettre(e.target);
    });
  }

  // À l'arrivée (une fois par session du navigateur, tous jeux confondus) : si le serveur répond et qu'aucun
  // compte n'est mémorisé, le menu s'ouvre pour proposer de se connecter ; on peut continuer en invité.
  function proposerConnexion() {
    if (P.serveurDisponible() && !P.connecte() && document.body.dataset.ecran === 'screen-menu' && P.premiereVisite()) ouvrir(true);
  }

  function init() {
    majBouton();
    brancher();
    P.surChangement(() => {
      majBouton();
      if (ouvert() && !occupe) {
        const saisie = document.activeElement && document.activeElement.closest && document.activeElement.closest('#acctBody form');
        if (!saisie) dessinerMenu();      // pas de redessin pendant la saisie d'un formulaire
      }
    });
    P.pret.then(proposerConnexion);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
