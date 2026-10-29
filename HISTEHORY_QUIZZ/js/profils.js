/* ==========================================================================
   profils.js — Compte du joueur et statistiques

   Deux façons de jouer :
     - en INVITÉ : statistiques gardées dans ce navigateur (localStorage, clé histehory.profil) ;
     - avec un COMPTE (nom + mot de passe) : les comptes sont COMMUNS À TOUS LES JEUX du dossier
       (../COMMUN/comptes.js, servi par ../SERVEUR/serveur.py). Un compte créé ici sert aussi dans les
       autres jeux, et l'on reste connecté en passant de l'un à l'autre. Les statistiques Histehory Quizz
       sont rangées dans l'espace « histehory » du compte ; une copie reste dans le navigateur, ce qui
       permet de jouer même si le serveur ne répond plus un moment (les changements partent dès qu'il répond).
   Sans serveur (index.html ouvert directement), ou si ../COMMUN/comptes.js manque, seul le mode invité
   existe : le jeu fonctionne quand même.

   Statistiques d'un joueur (« profil ») — à enrichir avec les modes de jeu :
     { historique: [ { date, mode, titre, score, total, tempsMs } ]  (récentes d'abord),
       totaux:     { parties, tempsMs, bonnes, questions } }
   Rien n'est encore publié pour les autres joueurs (pas de classements). L'interface (bouton de
   compte, fenêtre du compte) est dans js/compte.js.
   ========================================================================== */
(function () {
  'use strict';

  let C = window.Comptes || null;           // comptes communs (../COMMUN/comptes.js) ; absent : invité seulement
  const ID_JEU = 'histehory';               // espace de Histehory Quizz dans les comptes communs (COMMUN/jeux.js)
  const CLE = 'histehory.profil';           // statistiques de l'invité
  const COULEUR_INVITE = '#64748b';
  const MAX_HISTORIQUE = 1000;              // parties gardées par joueur (les totaux, eux, comptent tout)
  const LONGUEUR_NOM = C ? C.LONGUEUR_NOM : 20;
  const MDP_MIN = C ? C.MDP_MIN : 4;

  let stockageOk = true;
  const abonnes = [];                       // appelés quand le joueur ou ses données changent

  /* ---------- Statistiques vides et complétées ---------- */

  const totauxVides = () => ({ parties: 0, tempsMs: 0, bonnes: 0, questions: 0 });
  const profilVide = () => ({ historique: [], totaux: totauxVides() });

  // Données lues (ou reçues du serveur) : on complète ce qui manque plutôt que de tout refuser
  function completerProfil(p) {
    p = p && typeof p === 'object' ? p : {};
    return {
      historique: Array.isArray(p.historique) ? p.historique.slice(0, MAX_HISTORIQUE) : [],
      totaux: Object.assign(totauxVides(), p.totaux || {})
    };
  }

  // Ajoute les statistiques de source à cible (parties jouées hors ligne)
  function fusionner(cible, source) {
    cible.historique = cible.historique.concat(source.historique)
      .sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, MAX_HISTORIQUE);
    Object.keys(cible.totaux).forEach((k) => { cible.totaux[k] += source.totaux[k] || 0; });
    return cible;
  }

  /* ---------- Invité : stockage dans le navigateur ---------- */

  function chargerInvite() {
    try { const t = localStorage.getItem(CLE); return completerProfil(t ? JSON.parse(t) : null); }
    catch (e) { stockageOk = false; return profilVide(); }
  }
  function sauverInvite() {
    try { localStorage.setItem(CLE, JSON.stringify(invite)); stockageOk = true; }
    catch (e) { stockageOk = false; }       // navigateur sans stockage : les données valent pour la session
  }
  const invite = chargerInvite();

  function notifier() { abonnes.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); }

  /* ---------- Compte connecté : espace « histehory » des comptes communs ---------- */

  let espace = null;
  if (C) {
    try {
      espace = C.espace(ID_JEU, { completer: completerProfil, fusionner, publiques: () => null });
    } catch (e) {                           // code commun défaillant : Histehory Quizz continue en invité
      console.error('profils.js : comptes communs indisponibles', e);
      C = null;
    }
  }

  const connecte = () => !!(C && C.connecte() && espace.donnees());

  // Statistiques du joueur courant (compte connecté, sinon invité)
  const courant = () => (connecte() ? espace.donnees() : invite);

  function actif() {
    if (connecte()) { const c = C.compte(); return { id: c.id, nom: c.nom, couleur: c.couleur, invite: false }; }
    return { id: 'invite', nom: 'Invité', couleur: COULEUR_INVITE, invite: true };
  }

  // Après toute modification des statistiques : enregistrement local, puis envoi au serveur (compte)
  function modifie() {
    if (connecte()) espace.modifie();
    else sauverInvite();
    notifier();
  }

  /* ---------- Comptes ---------- */

  const sansComptes = () => new Error('Les comptes ne sont pas disponibles (fichier ../COMMUN/comptes.js introuvable).');
  const exigerCompte = () => { if (!C || !C.connecte()) throw new Error('Connectez-vous d\'abord.'); };

  async function connecter(nom, mdp) {
    if (!C) throw sansComptes();
    await C.connecter(nom, mdp);
    await espace.charge();
    notifier();
  }

  // reprendreInvite : les statistiques de l'invité de ce navigateur deviennent celles du compte
  async function inscrire(nom, mdp, reprendreInvite) {
    if (!C) throw sansComptes();
    await C.inscrire(nom, mdp);
    if (reprendreInvite) {
      espace.remplacer(completerProfil(JSON.parse(JSON.stringify(invite))));
      Object.assign(invite, profilVide());
      sauverInvite();
    }
    notifier();
  }

  async function deconnecter() { if (C) { await C.deconnecter(); notifier(); } }
  async function renommer(nom) { exigerCompte(); await C.renommer(nom); notifier(); }
  async function changerMotDePasse(ancien, nouveau) { exigerCompte(); await C.changerMotDePasse(ancien, nouveau); }
  async function supprimerCompte(mdp) { exigerCompte(); await C.supprimerCompte(mdp); notifier(); }

  // Une fois par session du navigateur, tous jeux confondus (fenêtre de connexion à l'arrivée)
  function premiereVisite() {
    if (C) return C.premiereVisite();
    try {
      if (sessionStorage.getItem('histehory.accueil') === '1') return false;
      sessionStorage.setItem('histehory.accueil', '1');
    } catch (e) { /* sans stockage */ }
    return true;
  }

  /* ---------- Parties ---------- */

  /* Enregistre une partie terminée pour le joueur courant (appelé par les modes de jeu).
     p : { mode, titre, score, total, tempsMs } */
  function enregistrerPartie(p) {
    const pr = courant();
    pr.historique.unshift({ date: new Date().toISOString(), mode: p.mode, titre: p.titre, score: p.score, total: p.total, tempsMs: p.tempsMs });
    if (pr.historique.length > MAX_HISTORIQUE) pr.historique.length = MAX_HISTORIQUE;
    const t = pr.totaux;
    t.parties++; t.tempsMs += p.tempsMs; t.bonnes += p.score; t.questions += p.total;
    modifie();
  }

  function statistiques() {
    const p = courant();
    return { historique: p.historique, totaux: Object.assign({}, p.totaux) };
  }

  /* ---------- Démarrage ---------- */

  let pret = Promise.resolve();
  if (C) {
    C.surChangement(notifier);              // connexion, déconnexion, nom (ici ou dans un autre jeu)
    espace.surChangement(notifier);         // statistiques reçues ou envoyées
    pret = C.pret.then(() => espace.charge()).then(notifier, (e) => { console.error(e); notifier(); });
  }

  window.HistProfils = {
    // joueur et comptes
    actif, connecter, inscrire, deconnecter, renommer, changerMotDePasse, supprimerCompte, premiereVisite,
    comptesDisponibles: () => !!C,
    serveurDisponible: () => !!(C && C.serveurDisponible()),
    connecte,
    enAttente: () => !!(connecte() && espace.enAttente()),
    erreur: () => (C ? C.erreur() : ''),
    effacerErreur: () => { if (C) C.effacerErreur(); },
    pret,
    // statistiques
    enregistrerPartie, statistiques,
    stockageDisponible: () => stockageOk,
    surChangement: (f) => abonnes.push(f),
    LONGUEUR_NOM, MDP_MIN
  };
})();
