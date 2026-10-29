/* ==========================================================================
   compte.js — Bouton de compte et fenêtre du compte

   Le bouton en haut à gauche montre le joueur (Invité ou nom du compte) et ouvre la fenêtre du
   compte. Les comptes sont communs à tous les jeux du dossier (../COMMUN/comptes.js) : se connecter
   ici connecte aussi les autres jeux.
     - non connecté : se connecter ou créer un compte (nom + mot de passe), ou continuer en invité ;
       cette fenêtre s'ouvre seule à l'arrivée, une fois par session du navigateur (tous jeux confondus) ;
     - connecté : renommer, changer le mot de passe, se déconnecter, supprimer le compte ;
     - sans serveur (index.html ouvert directement) : invité seulement.
   Les autres comptes ne sont jamais listés. Les données sont gérées par js/profils.js (à charger avant).
   ========================================================================== */
(function () {
  'use strict';

  if (!window.HistProfils) {
    console.error('compte.js : js/profils.js doit être chargé avant ce fichier');
    return;
  }
  const P = window.HistProfils;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const initiale = (nom) => (String(nom).trim().charAt(0) || '?').toUpperCase();
  const avatar = (p, classe) => '<span class="compte-avatar' + (classe ? ' ' + classe : '') + '" style="--avatar:' + esc(p.couleur) +
    '" aria-hidden="true">' + esc(initiale(p.nom)) + '</span>';
  const parties = (n) => n + ' partie' + (n > 1 ? 's' : '');

  // Vues de la fenêtre : 'connexion' ou 'inscription' (non connecté) ;
  // connecté : formulaire ouvert null, 'renommer', 'mdp' ou 'supprimer'
  let vue = 'connexion';
  let formulaire = null;
  let message = '';                     // erreur ou information affichée dans la fenêtre
  let accueil = false;                  // fenêtre ouverte automatiquement à l'arrivée
  let occupe = false;                   // requête en cours : boutons désactivés

  function majBouton() {
    const p = P.actif();
    const b = $('#compte-bouton');
    b.innerHTML = avatar(p) + '<span class="compte-nom">' + esc(p.nom) + '</span>';
    b.title = p.invite ? 'Invité (se connecter, créer un compte)' : 'Compte : ' + p.nom;
    b.setAttribute('aria-label', (p.invite ? 'Vous jouez en invité' : 'Compte : ' + p.nom) + '. Ouvrir la fenêtre du compte');
  }

  const champ = (libelle, nom, type, auto, extra) => '<label class="compte-champ">' + libelle +
    '<input name="' + nom + '" type="' + type + '" autocomplete="' + auto + '" spellcheck="false" required' + (extra || '') + '></label>';
  const erreurHtml = () => '<p class="compte-erreur" role="alert">' + esc(message) + '</p>';
  const desactive = () => (occupe ? ' disabled' : '');
  const boutonsFormulaire = (libelle, classe) => '<div class="compte-form__boutons"><button type="submit" class="btn ' + (classe || 'btn-primary') + '"' +
    desactive() + '>' + libelle + '</button><button type="button" class="btn btn-soft" data-compte="annuler">Annuler</button></div>';

  // Non connecté : se connecter ou créer un compte (formulaires reconnus par les gestionnaires de mots de passe)
  function vueVisiteur() {
    const inscription = vue === 'inscription';
    const nbInvite = P.statistiques().totaux.parties;
    return '<div class="mode-switch compte-onglets" role="tablist">' +
        '<button type="button" role="tab" class="mode-btn' + (inscription ? '' : ' is-active') + '" aria-selected="' + !inscription + '" data-vue="connexion">Se connecter</button>' +
        '<button type="button" role="tab" class="mode-btn' + (inscription ? ' is-active' : '') + '" aria-selected="' + inscription + '" data-vue="inscription">Créer un compte</button>' +
      '</div>' +
      '<form class="compte-form" data-form="' + vue + '">' +
        champ('Nom', 'username', 'text', 'username', ' maxlength="' + P.LONGUEUR_NOM + '"') +
        champ('Mot de passe', 'password', 'password', inscription ? 'new-password' : 'current-password', inscription ? ' minlength="' + P.MDP_MIN + '"' : '') +
        (inscription ? champ('Confirmer le mot de passe', 'confirmation', 'password', 'new-password') +
          (nbInvite ? '<label class="checkbox-row compte-reprendre"><input name="reprendre" type="checkbox" checked><span>Reprendre les statistiques ' +
            'de l\'invité de ce navigateur (' + parties(nbInvite) + ')</span></label>' : '') : '') +
        erreurHtml() +
        '<button type="submit" class="btn btn-primary compte-valider"' + desactive() + '>' +
          (occupe ? '…' : inscription ? 'Créer mon compte' : 'Se connecter') + '</button>' +
      '</form>' +
      '<div class="compte-actions"><button type="button" class="btn btn-soft" data-compte="invite">Continuer en invité</button></div>';
  }

  // Connecté : le compte et ses actions
  function vueCompte() {
    const p = P.actif();
    const etat = P.enAttente()
      ? (P.serveurDisponible() ? 'synchronisation…' : '⚠️ serveur injoignable : vos dernières parties seront envoyées dès son retour')
      : 'statistiques enregistrées sur le serveur';
    let html = '<div class="compte-carte">' + avatar(p, 'compte-avatar--grand') + '<div><p class="compte-carte__nom">' + esc(p.nom) + '</p>' +
      '<p class="compte-carte__info">' + parties(P.statistiques().totaux.parties) + ' · ' + etat + '</p></div></div>';

    if (formulaire === 'renommer') {
      html += '<form class="compte-form" data-form="renommer">' + champ('Nouveau nom', 'nom', 'text', 'username', ' maxlength="' + P.LONGUEUR_NOM + '" value="' + esc(p.nom) + '"') +
        erreurHtml() + boutonsFormulaire('Renommer') + '</form>';
    } else if (formulaire === 'mdp') {
      html += '<form class="compte-form" data-form="mdp"><input type="text" name="username" autocomplete="username" value="' + esc(p.nom) + '" hidden>' +
        champ('Mot de passe actuel', 'ancien', 'password', 'current-password') +
        champ('Nouveau mot de passe', 'nouveau', 'password', 'new-password', ' minlength="' + P.MDP_MIN + '"') +
        champ('Confirmer le nouveau mot de passe', 'confirmation', 'password', 'new-password') +
        erreurHtml() + boutonsFormulaire('Changer le mot de passe') + '</form>';
    } else if (formulaire === 'supprimer') {
      html += '<form class="compte-form compte-form--danger" data-form="supprimer"><p>Supprimer le compte « ' + esc(p.nom) + ' » et ses ' +
        'statistiques, dans tous les jeux ? C\'est définitif.</p>' + champ('Mot de passe', 'mdp', 'password', 'current-password') +
        erreurHtml() + boutonsFormulaire('Supprimer définitivement', 'btn-danger-plein') + '</form>';
    } else if (message) {
      html += '<p class="compte-info" role="status">' + esc(message) + '</p>';
    }

    return html + '<div class="compte-actions">' +
      '<button type="button" class="btn btn-soft" data-compte="renommer">Renommer</button>' +
      '<button type="button" class="btn btn-soft" data-compte="mdp">Mot de passe</button>' +
      '<button type="button" class="btn btn-soft" data-compte="deconnexion">Se déconnecter</button>' +
      '<button type="button" class="btn btn-soft btn-danger" data-compte="supprimer">Supprimer le compte</button>' +
      '</div>';
  }

  function majDialogue() {
    const connecte = P.connecte();
    const serveur = P.serveurDisponible();
    $('#compte-titre').textContent = connecte ? 'Mon compte' : accueil ? 'Bienvenue sur Histehory Quizz !' : 'Compte';
    $('#compte-aide').textContent = connecte
      ? 'Vos statistiques vous suivent sur tous vos appareils. Ce compte sert aussi dans les autres jeux : vous restez connecté en changeant de jeu.'
      : serveur
        ? 'Connectez-vous pour retrouver vos statistiques sur tous vos appareils, ou continuez en invité (statistiques gardées dans ce navigateur). ' +
          'Un seul compte pour tous les jeux.'
        : 'Vous jouez en invité : vos statistiques restent dans ce navigateur. Pour créer un compte (commun à tous les jeux), lancez les jeux avec game.bat, à la racine du dossier des jeux.';
    $('#compte-corps').innerHTML = connecte ? vueCompte() : serveur ? vueVisiteur()
      : '<div class="compte-actions"><button type="button" class="btn btn-primary" data-compte="invite">Continuer en invité</button></div>';
  }

  function focusPremierChamp() {
    const c = $('#compte-corps input:not([hidden]):not([type="checkbox"])');
    if (c) c.focus();
  }

  function ouvrirDialogue(depuisAccueil) {
    accueil = !!depuisAccueil;
    vue = 'connexion';
    formulaire = null;
    message = P.erreur();
    P.effacerErreur();
    majDialogue();
    const d = $('#compte-dialogue');
    if (!d.open) d.showModal();
    focusPremierChamp();
  }

  const fermerDialogue = () => { const d = $('#compte-dialogue'); if (d.open) d.close(); };

  // Lance une requête au serveur : boutons désactivés pendant l'attente, message d'erreur sinon
  async function executer(action, apres) {
    const saisie = {};                    // ce qui a été tapé, remis après chaque redessin (sauf les mots de passe)
    document.querySelectorAll('#compte-corps input[type="text"]').forEach((i) => { saisie[i.name] = i.value; });
    const remettre = () => Object.keys(saisie).forEach((n) => { const i = $('#compte-corps input[name="' + n + '"]'); if (i) i.value = saisie[n]; });
    occupe = true;
    message = '';
    majDialogue();
    remettre();
    try {
      await action();
      occupe = false;
      apres();
    } catch (err) {
      occupe = false;
      message = err.message;
      majDialogue();
      remettre();
      focusPremierChamp();
    }
  }

  function soumettre(form) {
    const v = (n) => (form.elements[n] ? form.elements[n].value : '');
    const sorte = form.dataset.form;
    const confirmationFausse = (a, b) => { if (a !== b) { message = 'Les deux mots de passe ne sont pas identiques.'; majDialogue(); return true; } return false; };

    if (sorte === 'connexion') {
      return executer(() => P.connecter(v('username'), v('password')), () => { message = ''; fermerDialogue(); });
    }
    if (sorte === 'inscription') {
      if (confirmationFausse(v('password'), v('confirmation'))) return;
      const reprendre = form.elements.reprendre ? form.elements.reprendre.checked : false;
      return executer(() => P.inscrire(v('username'), v('password'), reprendre), () => { message = ''; fermerDialogue(); });
    }
    if (sorte === 'renommer') {
      return executer(() => P.renommer(v('nom')), () => { formulaire = null; message = 'Nom changé.'; majDialogue(); });
    }
    if (sorte === 'mdp') {
      if (confirmationFausse(v('nouveau'), v('confirmation'))) return;
      return executer(() => P.changerMotDePasse(v('ancien'), v('nouveau')), () => {
        formulaire = null;
        message = 'Mot de passe changé. Vos autres appareils devront se reconnecter.';
        majDialogue();
      });
    }
    if (sorte === 'supprimer') {
      return executer(() => P.supprimerCompte(v('mdp')), () => { formulaire = null; message = ''; vue = 'connexion'; majDialogue(); });
    }
  }

  function brancherDialogue() {
    $('#compte-bouton').addEventListener('click', () => ouvrirDialogue(false));
    const d = $('#compte-dialogue');
    d.addEventListener('click', (e) => {
      if (e.target === d || e.target.closest('[data-fermer]')) return fermerDialogue();   // clic sur le fond : fermeture
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.vue) { vue = b.dataset.vue; message = ''; majDialogue(); focusPremierChamp(); return; }
      switch (b.dataset.compte) {
        case 'invite': fermerDialogue(); break;
        case 'renommer': case 'mdp': case 'supprimer':
          formulaire = b.dataset.compte; message = ''; majDialogue(); focusPremierChamp(); break;
        case 'annuler': formulaire = null; message = ''; majDialogue(); break;
        case 'deconnexion':
          executer(() => P.deconnecter(), () => { message = ''; vue = 'connexion'; majDialogue(); });
          break;
      }
    });
    d.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!occupe) soumettre(e.target);
    });
  }

  // À l'arrivée (une fois par session du navigateur, tous jeux confondus) : si le serveur répond et qu'aucun
  // compte n'est mémorisé, on propose de se connecter ou de créer un compte ; on peut continuer en invité.
  function proposerConnexion() {
    if (P.serveurDisponible() && !P.connecte() && !$('#screen-menu').classList.contains('hidden') && P.premiereVisite()) {
      ouvrirDialogue(true);
    }
  }

  function init() {
    majBouton();
    brancherDialogue();
    P.surChangement(() => {
      majBouton();
      if ($('#compte-dialogue').open && !occupe) {
        const ouvert = document.activeElement && document.activeElement.closest && document.activeElement.closest('#compte-corps form');
        if (!ouvert) majDialogue();       // pas de redessin pendant la saisie d'un formulaire
      }
    });
    P.pret.then(proposerConnexion);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
