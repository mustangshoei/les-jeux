/* ==========================================================================
   COMMUN/comptes.js — Comptes joueurs communs à tous les jeux

   Un compte (nom + mot de passe) sert dans TOUS les jeux du dossier : créé dans GéoNohyne Quizz, il marche
   dans Anotehomy Quizz, et inversement. La connexion est mémorisée dans le navigateur (clé
   comptes.session) et partagée par les jeux ouverts depuis le même serveur : on reste connecté en
   passant d'un jeu à l'autre, et une connexion ou une déconnexion dans un onglet est vue tout de
   suite par les autres onglets.

   Ce fichier ne contient AUCUNE logique de jeu. Chaque jeu :
     - l'inclut AVANT ses propres scripts :  <script src="../COMMUN/comptes.js"></script>
     - vérifie qu'il est là (window.Comptes) : s'il manque ou plante, le jeu doit continuer en invité ;
     - range ses statistiques dans SON espace du compte :  Comptes.espace('id-du-jeu', options).
   Un jeu ne lit ni n'écrit jamais l'espace d'un autre jeu.

   Sans serveur (index.html ouvert directement depuis le disque), il n'y a pas de comptes :
   Comptes.serveurDisponible() reste faux et les jeux jouent en invité.

   API : window.Comptes
     pret                       promesse : serveur interrogé et compte mémorisé vérifié
     serveurDisponible()        le serveur des jeux répond-il ?
     connecte(), compte()       compte connecté : { id, nom, couleur } ou null (+ admin: true pour l'administrateur)
     erreur(), effacerErreur()  dernier problème à signaler (session expirée…)
     connecter(nom, mdp), inscrire(nom, mdp), deconnecter(), renommer(nom),
     changerMotDePasse(ancien, nouveau), supprimerCompte(mdp)      promesses ; erreur lisible si refus
                                (se connecter alors qu'un compte l'est déjà = changer de compte : l'ancienne
                                connexion est fermée, après l'envoi de ses dernières parties)
     recents(), oublierRecent(id)   comptes déjà connectés dans ce navigateur (clé comptes.recents, sans
                                l'administrateur) : [{ id, nom, couleur }], le plus récent d'abord
     admin                      réservé au compte administrateur (page d'accueil), promesses :
                                comptes(), changerMotDePasse(id, mdp), supprimer(id),
                                defis(), enregistrerDefi(semaine, jeu, mode, defi ou null)
     classement(jeu)            promesse : [{ id, nom, couleur, publiques }] des comptes qui ont publié
     espace(jeu, options)       statistiques d'un jeu pour le compte connecté (voir plus bas)
     premiereVisite()           vrai une seule fois par session du navigateur, tous jeux confondus
                                (pour ne proposer la fenêtre de connexion qu'une fois)
     reprendreSession(jeton, compte)   adopte une connexion d'avant les comptes communs (migration)
     surChangement(f)           f() à chaque connexion, déconnexion ou changement de nom
     LONGUEUR_NOM, MDP_MIN

   ESPACE D'UN JEU — Comptes.espace(jeu, { completer, fusionner, publiques })
     completer(d)        renvoie des statistiques bien formées à partir de d (null : statistiques vides)
     fusionner(srv, ici) (facultatif) ajoute aux statistiques du serveur celles jouées ici avant de les
                         avoir reçues (serveur injoignable au chargement) ; renvoie le résultat
     publiques(d)        (facultatif) partie visible des autres joueurs (classements), ou null
   Une copie des statistiques est gardée dans le navigateur (clé comptes.donnees.<jeu>) : on continue
   de jouer si le serveur ne répond plus un moment, et les changements partent dès son retour.
   Méthodes : donnees() (objet modifiable, null sans compte), modifie() (à appeler après chaque
   changement), remplacer(d) (remplace les statistiques du serveur, ex. restauration d'une
   sauvegarde), enAttente(), charge() (promesse : statistiques du serveur reçues),
   surChangement(f) (f(raison) : 'compte' | 'charge' | 'envoye').
   ========================================================================== */
(function () {
  'use strict';

  const CLE_SESSION = 'comptes.session';        // { jeton, compte: { id, nom, couleur } }
  const CLE_DONNEES = 'comptes.donnees.';       // + id du jeu : { idCompte: { donnees, base, enAttente } }
  const CLE_ACCUEIL = 'comptes.accueil';        // sessionStorage : fenêtre de connexion déjà proposée
  const CLE_RECENTS = 'comptes.recents';        // [{ id, nom, couleur }] : comptes déjà connectés ici
  const RECENTS_MAX = 6;
  const LONGUEUR_NOM = 20;
  const MDP_MIN = 4;
  const DELAI_ENVOI = 400;                      // ms : regroupe les envois au serveur
  const DELAI_RESEAU = 8000;                    // ms : au-delà, le serveur est considéré absent

  // Le serveur répond à la racine du dossier des jeux (celle qui contient COMMUN/) : <racine>/api/…
  const SCRIPT = document.currentScript;
  const API = new URL('../api/', SCRIPT && SCRIPT.src ? SCRIPT.src : location.href).href;
  const SANS_SERVEUR = location.protocol === 'file:';

  let session = null;                           // { jeton, compte } ou null
  let serveur = false;                          // serveur des jeux joignable ?
  let erreur = '';
  const abonnes = [];
  const espaces = [];                           // espaces ouverts par le jeu de cette page

  /* ---------- Stockage dans le navigateur ---------- */

  function lire(cle) {
    try { const t = localStorage.getItem(cle); return t ? JSON.parse(t) : null; }
    catch (e) { return null; }
  }
  function ecrire(cle, valeur) {
    try {
      if (valeur === null) localStorage.removeItem(cle);
      else localStorage.setItem(cle, JSON.stringify(valeur));
    } catch (e) { /* navigateur sans stockage : valable pour la page */ }
  }

  const compteDe = (c) => Object.assign({ id: String(c.id), nom: String(c.nom), couleur: String(c.couleur || '#64748b') },
    c.admin === true ? { admin: true } : {});

  function recents() {
    const r = lire(CLE_RECENTS);
    return Array.isArray(r) ? r.filter((c) => c && c.id && c.nom).map(compteDe) : [];
  }
  function oublierRecent(id) { ecrire(CLE_RECENTS, recents().filter((c) => c.id !== id)); }
  function noterRecent(c) {
    if (c.admin) return;
    ecrire(CLE_RECENTS, [{ id: c.id, nom: c.nom, couleur: c.couleur }].concat(recents().filter((r) => r.id !== c.id)).slice(0, RECENTS_MAX));
  }

  function lireSession() {
    const s = lire(CLE_SESSION);
    return s && typeof s.jeton === 'string' && s.compte && s.compte.id ? { jeton: s.jeton, compte: compteDe(s.compte) } : null;
  }

  // Copies locales des statistiques d'un compte (tous jeux) : celles non envoyées sont gardées,
  // les autres effacées (ordinateur partagé) ; toutes : à la suppression du compte
  function oublierCopies(id, toutes) {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const cle = localStorage.key(i);
        if (!cle || cle.indexOf(CLE_DONNEES) !== 0) continue;
        const c = lire(cle);
        if (c && c[id] && (toutes || !c[id].enAttente)) { delete c[id]; ecrire(cle, c); }
      }
    } catch (e) { /* sans stockage : rien à effacer */ }
  }

  function notifier() { abonnes.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); }

  // Change le compte connecté (ou null) pour tous les jeux de ce navigateur, puis l'annonce
  function changerSession(s, message) {
    const avant = session ? session.compte.id : null;
    session = s;
    ecrire(CLE_SESSION, s);
    if (s) noterRecent(s.compte);
    if (message !== undefined) erreur = message;
    if ((s ? s.compte.id : null) !== avant) espaces.forEach((e) => e.changerCompte());
    notifier();
  }

  /* ---------- Dialogue avec le serveur ---------- */

  function erreurReseau() {
    const err = new Error('Le serveur des jeux ne répond pas.');
    err.statut = 0;
    return err;
  }

  async function api(methode, route, corps, authentifie) {
    if (SANS_SERVEUR) throw erreurReseau();
    const options = { method: methode, headers: {}, cache: 'no-store' };
    if (corps !== undefined) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(corps);
    }
    if (authentifie) {
      if (!session) { const err = new Error('Connectez-vous d\'abord.'); err.statut = 401; throw err; }
      options.headers.Authorization = 'Bearer ' + session.jeton;
    }
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    if (ctrl) { options.signal = ctrl.signal; setTimeout(() => ctrl.abort(), DELAI_RESEAU); }
    let rep;
    try {
      rep = await fetch(API + route, options);
    } catch (e) {
      serveur = false;
      throw erreurReseau();
    }
    serveur = true;
    let d = {};
    try { d = await rep.json(); } catch (e) { /* réponse vide ou non JSON */ }
    if (!rep.ok) {
      const err = new Error(d.erreur || 'Erreur du serveur (' + rep.status + ').');
      err.statut = rep.status;
      if (rep.status === 401 && authentifie) changerSession(null, 'Votre session a expiré : reconnectez-vous.');
      throw err;
    }
    return d;
  }

  // Au chargement : le serveur répond-il ? Le compte mémorisé est-il toujours valable (et son nom à jour) ?
  async function initialiser() {
    if (SANS_SERVEUR) return;
    // Un hébergement de fichiers seuls (GitHub Pages…) répond aussi, mais sans l'API : pas de comptes
    try {
      const r = await api('GET', 'etat');
      if (!r || r.ok !== true) throw new Error('pas le serveur des jeux');
    } catch (e) { serveur = false; return; }
    if (!session) return;
    try {
      const r = await api('GET', 'moi', undefined, true);
      if (session && session.compte.id === r.compte.id) changerSession({ jeton: session.jeton, compte: compteDe(r.compte) });
    } catch (e) { /* 401 : session fermée par api() ; autre : on garde la session */ }
  }

  /* ---------- Comptes ---------- */

  function verifierNom(nom) {
    const n = String(nom || '').replace(/\s+/g, ' ').trim();
    if (!n) throw new Error('Choisissez un nom.');
    if (n.length > LONGUEUR_NOM) throw new Error('Nom trop long (' + LONGUEUR_NOM + ' caractères au plus).');
    return n;
  }
  function verifierMdp(mdp) {
    if (String(mdp || '').length < MDP_MIN) throw new Error('Mot de passe trop court (' + MDP_MIN + ' caractères au moins).');
    return String(mdp);
  }

  // Ferme la connexion du compte connecté sur le serveur, après l'envoi de ses dernières parties ;
  // renvoie l'id de ce compte (null si la session avait déjà expiré)
  async function fermerSession() {
    if (serveur) await Promise.all(espaces.map((e) => (e.enAttente() ? e.envoyer() : null)));
    try { if (serveur) await api('POST', 'deconnexion', {}, true); } catch (e) { /* déjà expirée : rien à faire */ }
    return session ? session.compte.id : null;
  }

  // Nouvelle connexion (r : réponse du serveur) ; un compte déjà connecté est d'abord déconnecté
  async function ouvrirSession(r) {
    const nouvelle = { jeton: r.jeton, compte: compteDe(r.compte) };
    const ancien = session ? await fermerSession() : null;
    changerSession(nouvelle, '');
    if (ancien && ancien !== nouvelle.compte.id) oublierCopies(ancien, false);
  }

  async function connecter(nom, mdp) {
    await ouvrirSession(await api('POST', 'connexion', { nom: verifierNom(nom), mdp: String(mdp || '') }));
  }

  async function inscrire(nom, mdp) {
    const n = verifierNom(nom);
    await ouvrirSession(await api('POST', 'inscription', { nom: n, mdp: verifierMdp(mdp) }));
  }

  async function deconnecter() {
    if (!session) return;
    const id = await fermerSession();
    changerSession(null, '');
    if (id) oublierCopies(id, false);
  }

  async function renommer(nom) {
    const r = await api('POST', 'moi/renommer', { nom: verifierNom(nom) }, true);
    if (session) changerSession({ jeton: session.jeton, compte: compteDe(r.compte) });
  }

  async function changerMotDePasse(ancien, nouveau) {
    await api('POST', 'moi/mdp', { ancien: String(ancien || ''), nouveau: verifierMdp(nouveau) }, true);
  }

  async function supprimerCompte(mdp) {
    if (!session) return;
    await api('POST', 'moi/supprimer', { mdp: String(mdp || '') }, true);
    const id = session.compte.id;
    changerSession(null, '');
    oublierCopies(id, true);
    oublierRecent(id);
  }

  // Tableau de bord de l'administrateur (le serveur refuse ces routes aux autres comptes)
  const admin = {
    comptes: async () => (await api('GET', 'admin/comptes', undefined, true)).comptes || [],
    changerMotDePasse: async (id, mdp) => {
      await api('POST', 'admin/comptes/' + encodeURIComponent(id) + '/mdp', { mdp: verifierMdp(mdp) }, true);
    },
    supprimer: async (id) => {
      await api('POST', 'admin/comptes/' + encodeURIComponent(id) + '/supprimer', {}, true);
      oublierRecent(id);
    },
    defis: async () => (await api('GET', 'admin/defis', undefined, true)).defis || {},
    enregistrerDefi: async (semaine, jeu, mode, defi) => (await api('PUT', 'admin/defis/' +
      [semaine, jeu, mode].map(encodeURIComponent).join('/'), { defi: defi || null }, true)).defi || null
  };

  async function classement(jeu) {
    return (await api('GET', 'classements/' + encodeURIComponent(jeu))).comptes || [];
  }

  function premiereVisite() {
    try {
      if (sessionStorage.getItem(CLE_ACCUEIL) === '1') return false;
      sessionStorage.setItem(CLE_ACCUEIL, '1');
    } catch (e) { /* sans stockage : on propose quand même */ }
    return true;
  }

  function reprendreSession(jeton, compte) {
    if (!session && typeof jeton === 'string' && compte && compte.id) changerSession({ jeton, compte: compteDe(compte) });
  }

  /* ---------- Espace d'un jeu : ses statistiques dans le compte connecté ---------- */

  function espace(jeu, options) {
    const o = Object.assign({ completer: (d) => d || {}, fusionner: null, publiques: () => null }, options);
    const cle = CLE_DONNEES + jeu;
    const abonnesEspace = [];
    // Compte connecté : { id, donnees, base (statistiques du serveur reçues ou remplacées), enAttente }
    let etat = null;
    let version = 0;                  // augmente à chaque modification : une réponse arrivée entre-temps n'écrase rien
    let minuteur = null;
    let enCours = null;               // synchronisation en cours (une seule à la fois)
    let encore = false;               // … et une autre demandée pendant celle-ci
    let attente = Promise.resolve();  // promesse de charge()

    const copies = () => { const c = lire(cle); return c && typeof c === 'object' ? c : {}; };
    function sauver() {
      if (!etat) return;
      const c = copies();
      c[etat.id] = { donnees: etat.donnees, base: etat.base, enAttente: etat.enAttente };
      ecrire(cle, c);
    }
    function annoncer(raison) { abonnesEspace.forEach((f) => { try { f(raison); } catch (e) { console.error(e); } }); }

    // Nouveau compte (ou plus de compte) : sa copie locale tout de suite, puis le serveur
    function changerCompte() {
      clearTimeout(minuteur);
      version++;
      etat = null;
      if (session) {
        const id = session.compte.id;
        const c = copies();
        const copie = c[id];
        etat = copie
          ? { id, donnees: o.completer(copie.donnees), base: !!copie.base, enAttente: !!copie.enAttente }
          : { id, donnees: o.completer(null), base: false, enAttente: false };
        Object.keys(c).forEach((k) => { if (k !== id && !(c[k] && c[k].enAttente)) delete c[k]; });
        ecrire(cle, c);
        attente = pret.then(synchroniser);
      } else {
        attente = Promise.resolve();
      }
      annoncer('compte');
    }

    async function uneSynchro() {
      const e = etat;
      if (!e) return;
      try {
        if (!e.base || !e.enAttente) {
          const avant = version;
          const r = await api('GET', 'moi/jeux/' + encodeURIComponent(jeu), undefined, true);
          if (etat !== e) return;                         // compte changé entre-temps
          const recues = o.completer(r.donnees);
          if (version === avant && !e.enAttente) {
            e.donnees = recues; e.base = true; sauver(); annoncer('charge');
            return;
          }
          if (!e.base) {                                  // parties jouées ici sans les statistiques du serveur
            e.donnees = o.fusionner ? o.fusionner(recues, e.donnees) : recues;
            e.base = true; e.enAttente = true; sauver(); annoncer('charge');
          }
        }
        if (!e.enAttente) return;
        const v = version;
        await api('PUT', 'moi/jeux/' + encodeURIComponent(jeu), { donnees: e.donnees, publiques: o.publiques(e.donnees) }, true);
        if (etat === e && version === v) { e.enAttente = false; sauver(); }
        annoncer('envoye');
      } catch (err) { /* hors ligne ou session fermée : la copie locale attend le prochain essai */ }
    }

    function synchroniser() {
      if (enCours) { encore = true; return enCours; }
      enCours = (async () => {
        do { encore = false; await uneSynchro(); } while (encore);
      })().then(() => { enCours = null; }, () => { enCours = null; });
      return enCours;
    }

    function modifie() {
      if (!etat) return;
      version++;
      etat.enAttente = true;
      sauver();
      clearTimeout(minuteur);
      minuteur = setTimeout(synchroniser, DELAI_ENVOI);
    }

    function remplacer(d) {
      if (!etat) return;
      etat.donnees = o.completer(d);
      etat.base = true;                                   // ces statistiques remplacent celles du serveur
      modifie();
    }

    const enAttente = () => !!(etat && etat.enAttente);
    espaces.push({ changerCompte, envoyer: synchroniser, enAttente });
    if (session) changerCompte();

    return {
      donnees: () => (etat ? etat.donnees : null),
      modifie,
      remplacer,
      enAttente,
      charge: () => attente,
      surChangement: (f) => abonnesEspace.push(f)
    };
  }

  /* ---------- Synchronisation entre onglets et retours sur la page ---------- */

  // Connexion ou déconnexion dans un autre onglet (autre jeu, ou même jeu) : appliquée ici aussi
  window.addEventListener('storage', (e) => {
    if (e.key !== CLE_SESSION && e.key !== null) return;
    const s = lireSession();
    const avant = session ? session.compte.id : null;
    session = s;
    if ((s ? s.compte.id : null) !== avant) espaces.forEach((es) => es.changerCompte());
    notifier();
  });

  // Retour sur la page : nouvel essai si des statistiques n'ont pas pu partir
  window.addEventListener('focus', () => {
    if (session && espaces.some((e) => e.enAttente())) espaces.forEach((e) => { if (e.enAttente()) e.envoyer(); });
  });

  session = lireSession();
  const pret = initialiser().then(notifier);

  window.Comptes = {
    pret,
    serveurDisponible: () => serveur,
    connecte: () => !!session,
    compte: () => (session ? Object.assign({}, session.compte) : null),
    erreur: () => erreur,
    effacerErreur: () => { erreur = ''; },
    connecter, inscrire, deconnecter, renommer, changerMotDePasse, supprimerCompte,
    recents, oublierRecent, admin,
    classement, espace, premiereVisite, reprendreSession,
    surChangement: (f) => abonnes.push(f),
    LONGUEUR_NOM, MDP_MIN
  };
})();
