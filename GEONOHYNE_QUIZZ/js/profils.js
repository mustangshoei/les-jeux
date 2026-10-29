/* ==========================================================================
   profils.js — Comptes joueurs et statistiques

   Deux façons de jouer :
     - en INVITÉ : statistiques gardées dans ce navigateur (localStorage, clé geonohyne.profils) ;
     - avec un COMPTE (nom + mot de passe) : les comptes sont COMMUNS À TOUS LES JEUX du dossier
       (../COMMUN/comptes.js, servi par ../SERVEUR/serveur.py). Un compte créé ici sert aussi dans les
       autres jeux, et l'on reste connecté en passant de l'un à l'autre. Les statistiques GéoNohyne Quizz sont
       rangées dans l'espace « geonohyne » du compte, retrouvées depuis n'importe quel appareil ; une copie
       reste dans le navigateur, ce qui permet de jouer même si le serveur ne répond plus un moment
       (les changements partent dès qu'il répond).
   Les comptes des autres joueurs ne sont jamais listés : seuls leurs noms et leurs records
   apparaissent dans les classements. Sans serveur (index.html ouvert directement), ou si
   ../COMMUN/comptes.js manque, seul le mode invité existe : le jeu fonctionne quand même.

   Pour chaque joueur : records, historique des parties, zones les plus ratées, totaux.
   Un record = une catégorie, une façon de jouer (ciblage / nommage) et un périmètre fixe
   (tout, ou un seul groupe). Le meilleur : le plus haut score, puis le temps le plus court.

   Statistiques d'un joueur (« profil ») :
     { records:    { 'categorie|jeu|perimetre': { score, total, tempsMs, date, titre, perimetre } },
       historique: [ { date, categorie, titre, jeu, record, perimetre, score, total, tempsMs } ]  (récentes d'abord),
       rates:      { categorie: { code: [fois vue, fois ratée] } },
       totaux:     { parties, tempsMs, bonnes, questions } }
   Seuls les records sont publiés (classements). L'interface (bouton de compte, fenêtre de connexion,
   statistiques) est dans js/compte.js.
   ========================================================================== */
(function () {
  'use strict';

  let C = window.Comptes || null;           // comptes communs (../COMMUN/comptes.js) ; absent : invité seulement
  const ID_JEU = 'geonohyne';                 // espace de GéoNohyne Quizz dans les comptes communs (COMMUN/jeux.js)
  const CLE = 'geonohyne.profils';            // invité (et anciens profils locaux, d'avant les comptes)
  const ANCIENNE_SESSION = 'geoquiz.session';   // connexion d'avant les comptes communs : reprise une fois
  const INVITE = 'invite';
  const COULEUR_INVITE = '#64748b';
  const MAX_HISTORIQUE = 1000;              // parties gardées par joueur (les totaux, eux, comptent tout)
  const LONGUEUR_NOM = C ? C.LONGUEUR_NOM : 20;
  const MDP_MIN = C ? C.MDP_MIN : 4;

  let stockageOk = true;
  let local = null;                         // { version, actif, profils: { invite, ...anciens profils } }
  let publics = [];                         // [{ id, nom, couleur, records }] : records de tous les comptes
  const abonnes = [];                       // appelés quand le joueur ou ses données changent

  /* ---------- Statistiques vides et complétées ---------- */

  const totauxVides = () => ({ parties: 0, tempsMs: 0, bonnes: 0, questions: 0 });
  const profilVide = () => ({ records: {}, historique: [], rates: {}, totaux: totauxVides() });

  // Données lues (ou restaurées) : on complète ce qui manque plutôt que de tout refuser
  function completerProfil(p) {
    p = p && typeof p === 'object' ? p : {};
    return {
      records: p.records && typeof p.records === 'object' ? p.records : {},
      historique: Array.isArray(p.historique) ? p.historique.slice(0, MAX_HISTORIQUE) : [],
      rates: p.rates && typeof p.rates === 'object' ? p.rates : {},
      totaux: Object.assign(totauxVides(), p.totaux || {})
    };
  }

  /* ---------- Stockage dans le navigateur (invité) ---------- */

  function lire(cle) {
    try { const t = localStorage.getItem(cle); return t ? JSON.parse(t) : null; }
    catch (e) { stockageOk = false; return null; }
  }
  function ecrire(cle, valeur) {
    try {
      if (valeur === null) localStorage.removeItem(cle);
      else localStorage.setItem(cle, JSON.stringify(valeur));
      stockageOk = true;
    } catch (e) { stockageOk = false; }   // navigateur sans stockage : les données valent pour la session
  }

  function chargerLocal() {
    const d = lire(CLE);
    const profils = {};
    if (d && d.profils && typeof d.profils === 'object') {
      Object.keys(d.profils).forEach((id) => {
        const p = d.profils[id];
        if (p && typeof p.nom === 'string') profils[id] = Object.assign({ nom: p.nom, couleur: p.couleur || COULEUR_INVITE }, completerProfil(p));
      });
    }
    profils[INVITE] = profils[INVITE] || Object.assign({ nom: 'Invité', couleur: COULEUR_INVITE }, profilVide());
    profils[INVITE].nom = 'Invité';
    return { version: 1, actif: INVITE, profils };
  }

  const sauverLocal = () => ecrire(CLE, local);

  function notifier() { abonnes.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); }

  /* ---------- Compte connecté : espace « geonohyne » des comptes communs ---------- */

  let espace = null;
  if (C) {
    try {
      espace = C.espace(ID_JEU, {
        completer: completerProfil,
        fusionner: (serveur, ici) => { fusionner(serveur, ici); return serveur; },
        publiques: (p) => ({ records: p.records })
      });
    } catch (e) {                           // code commun défaillant : GéoNohyne Quizz continue en invité
      console.error('profils.js : comptes communs indisponibles', e);
      C = null;
    }
  }

  const connecte = () => !!(C && C.connecte() && espace.donnees());

  /* ---------- Joueur courant ---------- */

  // Statistiques du joueur courant (compte connecté, sinon invité)
  const courant = () => (connecte() ? espace.donnees() : local.profils[INVITE]);

  function actif() {
    if (connecte()) { const c = C.compte(); return { id: c.id, nom: c.nom, couleur: c.couleur, invite: false }; }
    return { id: INVITE, nom: 'Invité', couleur: COULEUR_INVITE, invite: true };
  }

  // Après toute modification des statistiques : enregistrement local, puis envoi au serveur (compte)
  function modifie() {
    if (connecte()) espace.modifie();
    else sauverLocal();
    notifier();
  }

  async function rafraichirClassements() {
    if (!C || !C.serveurDisponible()) return;
    try {
      publics = (await C.classement(ID_JEU)).map((c) => ({ id: c.id, nom: c.nom, couleur: c.couleur,
        records: c.publiques && c.publiques.records && typeof c.publiques.records === 'object' ? c.publiques.records : {} }));
    } catch (e) { /* classements momentanément indisponibles */ }
  }

  /* ---------- Comptes ---------- */

  function sansComptes() { return new Error('Les comptes ne sont pas disponibles (fichier ../COMMUN/comptes.js introuvable).'); }

  async function connecter(nom, mdp) {
    if (!C) throw sansComptes();
    await C.connecter(nom, mdp);
    await espace.charge();
    await rafraichirClassements();
    notifier();
  }

  // reprendreInvite : les statistiques de l'invité de ce navigateur deviennent celles du compte
  async function inscrire(nom, mdp, reprendreInvite) {
    if (!C) throw sansComptes();
    await C.inscrire(nom, mdp);
    if (reprendreInvite) {
      espace.remplacer(completerProfil(JSON.parse(JSON.stringify(local.profils[INVITE]))));
      Object.assign(local.profils[INVITE], profilVide());
      sauverLocal();
    }
    await rafraichirClassements();
    notifier();
  }

  async function deconnecter() {
    if (!C) return;
    await C.deconnecter();
    notifier();
  }

  async function renommer(nom) {
    if (!C || !C.connecte()) throw new Error('Connectez-vous d\'abord.');
    await C.renommer(nom);
    await rafraichirClassements();
    notifier();
  }

  async function changerMotDePasse(ancien, nouveau) {
    if (!C || !C.connecte()) throw new Error('Connectez-vous d\'abord.');
    await C.changerMotDePasse(ancien, nouveau);
  }

  async function supprimerCompte(mdp) {
    if (!C || !C.connecte()) return;
    await C.supprimerCompte(mdp);
    await rafraichirClassements();
    notifier();
  }

  // Une fois par session du navigateur, tous jeux confondus (fenêtre de connexion à l'arrivée)
  function premiereVisite() {
    if (C) return C.premiereVisite();
    try {
      if (sessionStorage.getItem('geonohyne.accueil') === '1') return false;
      sessionStorage.setItem('geonohyne.accueil', '1');
    } catch (e) { /* sans stockage */ }
    return true;
  }

  /* ---------- Anciens profils de ce navigateur (d'avant les comptes) ---------- */

  // L'invité (s'il a joué) et les profils locaux d'avant les comptes, à importer dans le compte connecté
  function anciensProfils() {
    return Object.keys(local.profils)
      .filter((id) => local.profils[id].totaux.parties > 0 || id !== INVITE)
      .map((id) => ({ id, nom: id === INVITE ? 'Invité (ce navigateur)' : local.profils[id].nom, parties: local.profils[id].totaux.parties }));
  }

  function fusionner(cible, source) {
    Object.keys(source.records).forEach((cle) => {
      if (meilleur(source.records[cle], cible.records[cle])) cible.records[cle] = source.records[cle];
    });
    cible.historique = cible.historique.concat(source.historique)
      .sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, MAX_HISTORIQUE);
    Object.keys(source.rates).forEach((cat) => {
      const c = cible.rates[cat] = cible.rates[cat] || {};
      Object.keys(source.rates[cat]).forEach((code) => {
        const v = c[code] = c[code] || [0, 0];
        v[0] += source.rates[cat][code][0] || 0;
        v[1] += source.rates[cat][code][1] || 0;
      });
    });
    Object.keys(cible.totaux).forEach((k) => { cible.totaux[k] += source.totaux[k] || 0; });
  }

  // Ajoute les statistiques d'un ancien profil local au compte connecté, puis l'efface du navigateur
  function importerAncien(id) {
    if (!connecte() || !local.profils[id]) return;
    fusionner(espace.donnees(), completerProfil(local.profils[id]));
    if (id === INVITE) Object.assign(local.profils[INVITE], profilVide());
    else delete local.profils[id];
    sauverLocal();
    modifie();
  }

  /* ---------- Parties et records ---------- */

  const cleRecord = (categorie, jeu, perimetre) => categorie + '|' + jeu + '|' + perimetre;

  // a est-il meilleur que b ? Score (en proportion, si le périmètre a changé de taille), puis temps
  function meilleur(a, b) {
    if (!b) return true;
    const ra = a.score / (a.total || 1), rb = b.score / (b.total || 1);
    if (ra !== rb) return ra > rb;
    return a.tempsMs < b.tempsMs;
  }

  // Records de tous les joueurs (le sien à jour, même avant l'envoi au serveur), invité compris s'il joue
  function joueursAvecRecords() {
    const moi = actif();
    const liste = publics.map((c) => (c.id === moi.id ? { id: c.id, nom: moi.nom, couleur: moi.couleur, records: courant().records } : c));
    if (!liste.some((c) => c.id === moi.id)) liste.push({ id: moi.id, nom: moi.nom, couleur: moi.couleur, records: courant().records });
    return liste;
  }

  // Classement de tous les joueurs sur un record (meilleur d'abord)
  function classement(cle) {
    return joueursAvecRecords()
      .filter((j) => j.records[cle])
      .map((j) => Object.assign({ id: j.id, nom: j.nom, couleur: j.couleur }, j.records[cle]))
      .sort((a, b) => (meilleur(a, b) ? -1 : meilleur(b, a) ? 1 : 0));
  }

  const recordDe = (cle) => courant().records[cle] || null;

  /* Enregistre une partie terminée pour le joueur courant.
     p : { categorie, titre, jeu: 'ciblage' | 'nommage', record: bool, perimetre: { id, nom } (record),
           description (occasionnel), score, total, tempsMs, resultats: [{ code, ok }] }
     Renvoie le bilan des records : { record, cle, ancien, nouveauRecord, actuel, classement, rang } */
  function enregistrerPartie(p) {
    const pr = courant();
    const date = new Date().toISOString();
    pr.historique.unshift({
      date, categorie: p.categorie, titre: p.titre, jeu: p.jeu, record: !!p.record,
      perimetre: p.record ? p.perimetre.nom : (p.description || ''), score: p.score, total: p.total, tempsMs: p.tempsMs
    });
    if (pr.historique.length > MAX_HISTORIQUE) pr.historique.length = MAX_HISTORIQUE;

    const t = pr.totaux;
    t.parties++; t.tempsMs += p.tempsMs; t.bonnes += p.score; t.questions += p.total;

    const r = pr.rates[p.categorie] = pr.rates[p.categorie] || {};
    (p.resultats || []).forEach(({ code, ok }) => {
      const v = r[code] = r[code] || [0, 0];
      v[0]++;
      if (!ok) v[1]++;
    });

    let bilan = { record: false };
    if (p.record) {
      const cle = cleRecord(p.categorie, p.jeu, p.perimetre.id);
      const ancien = pr.records[cle] || null;
      const essai = { score: p.score, total: p.total, tempsMs: p.tempsMs, date, titre: p.titre, perimetre: p.perimetre.nom };
      const nouveauRecord = meilleur(essai, ancien);
      if (nouveauRecord) pr.records[cle] = essai;
      const cl = classement(cle);
      bilan = { record: true, cle, ancien, nouveauRecord, actuel: pr.records[cle], classement: cl,
        rang: cl.findIndex((e) => e.id === actif().id) + 1 };
    }
    modifie();
    return bilan;
  }

  // Efface les statistiques du joueur courant (le compte reste)
  function reinitialiser() {
    Object.assign(courant(), profilVide());
    modifie();
  }

  // Zones les plus ratées d'une catégorie (au moins une fois), les plus ratées d'abord
  function zonesRatees(categorie, id, max) {
    const r = courant().rates[categorie] || {};
    return Object.keys(r).filter((code) => r[code][1] > 0)
      .map((code) => ({ code, vues: r[code][0], ratees: r[code][1] }))
      .sort((a, b) => b.ratees - a.ratees || b.ratees / b.vues - a.ratees / a.vues)
      .slice(0, max || 20);
  }

  function statistiques() {
    const p = courant();
    const a = actif();
    return { nom: a.nom, couleur: a.couleur, totaux: Object.assign({}, p.totaux), records: p.records, historique: p.historique, rates: p.rates };
  }

  /* ---------- Exports ---------- */

  // Temps lisible : « 04:12,3 »
  function temps(ms) {
    const d = Math.floor(ms / 100);
    const s = Math.floor(d / 10);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') + ',' + (d % 10);
  }

  // CSV pour un tableur français : séparateur « ; », encodage UTF-8 avec BOM (accents lus par Excel)
  const champ = (v) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = (lignes) => '﻿' + lignes.map((l) => l.map(champ).join(';')).join('\r\n') + '\r\n';
  const pourcent = (s, t) => (t ? Math.round((s / t) * 1000) / 10 : 0).toString().replace('.', ',');
  const secondes = (ms) => (Math.round(ms / 100) / 10).toString().replace('.', ',');
  const NOMS_JEU = { ciblage: 'Ciblage', nommage: 'Nommage' };

  function historiqueCSV() {
    const nom = actif().nom;
    const lignes = [['Joueur', 'Date', 'Heure', 'Catégorie', 'Façon de jouer', 'Mode', 'Périmètre ou sélection',
      'Score', 'Total', 'Réussite (%)', 'Temps (s)']];
    courant().historique.forEach((h) => {
      const d = new Date(h.date);
      lignes.push([nom, d.toLocaleDateString('fr-FR'), d.toLocaleTimeString('fr-FR'), h.titre, NOMS_JEU[h.jeu] || h.jeu,
        h.record ? 'Record' : 'Occasionnel', h.perimetre, h.score, h.total, pourcent(h.score, h.total), secondes(h.tempsMs)]);
    });
    return csv(lignes);
  }

  function recordsCSV() {
    const lignes = [['Joueur', 'Catégorie', 'Façon de jouer', 'Périmètre', 'Score', 'Total', 'Réussite (%)', 'Temps (s)', 'Date']];
    joueursAvecRecords().forEach((j) => {
      Object.keys(j.records).sort().forEach((cle) => {
        const r = j.records[cle];
        lignes.push([j.nom, r.titre, NOMS_JEU[cle.split('|')[1]] || cle.split('|')[1], r.perimetre, r.score, r.total,
          pourcent(r.score, r.total), secondes(r.tempsMs), new Date(r.date).toLocaleDateString('fr-FR')]);
      });
    });
    return csv(lignes);
  }

  // Sauvegarde des statistiques du joueur courant (lui seul : les autres comptes restent privés)
  const sauvegarde = () => JSON.stringify({ type: 'geonohyne-profil', version: 2, nom: actif().nom,
    date: new Date().toISOString(), profil: courant() }, null, 1);

  // Remplace les statistiques du joueur courant par une sauvegarde (nouvelle, faite sous l'ancien nom
  // GéoQuiz, ou ancienne sauvegarde de tous les profils : on y prend le profil qui était actif) ;
  // lève une erreur si ce n'en est pas une
  function restaurer(texte) {
    let d;
    try { d = JSON.parse(texte); } catch (e) { throw new Error('Ce fichier n\'est pas une sauvegarde GéoNohyne Quizz (JSON illisible).'); }
    let p = null;
    if (d && (d.type === 'geonohyne-profil' || d.type === 'geoquiz-profil')) p = d.profil;
    else if (d && d.profils && typeof d.profils === 'object') p = d.profils[d.actif] || d.profils[Object.keys(d.profils)[0]];
    if (!p || typeof p !== 'object') throw new Error('Ce fichier n\'est pas une sauvegarde GéoNohyne Quizz.');
    if (connecte()) { espace.remplacer(completerProfil(p)); notifier(); }
    else { Object.assign(courant(), completerProfil(p)); modifie(); }
  }

  /* ---------- Démarrage ---------- */

  local = chargerLocal();

  // Connexion d'avant les comptes communs (serveur GéoNohyne Quizz seul) : le jeton devient celui de tous les
  // jeux, et des parties qui n'avaient pas pu partir sont renvoyées
  const ancienne = lire(ANCIENNE_SESSION);
  if (ancienne) {
    ecrire(ANCIENNE_SESSION, null);
    if (C && !C.connecte() && typeof ancienne.jeton === 'string' && ancienne.compte && ancienne.compte.id) {
      C.reprendreSession(ancienne.jeton, ancienne.compte);
      if (ancienne.enAttente) espace.remplacer(completerProfil(ancienne.profil));
    }
  }

  let pret = Promise.resolve();
  if (C) {
    C.surChangement(notifier);                                   // connexion, déconnexion, nom (ici ou dans un autre jeu)
    espace.surChangement(() => { rafraichirClassements().then(notifier); });   // statistiques reçues ou envoyées
    pret = C.pret.then(() => espace.charge()).then(rafraichirClassements).then(notifier, (e) => { console.error(e); notifier(); });
  }

  window.GeoProfils = {
    // joueur et comptes
    actif, liste: () => [actif()], connecter, inscrire, deconnecter, renommer, changerMotDePasse, supprimerCompte,
    anciensProfils, importerAncien, premiereVisite,
    comptesDisponibles: () => !!C,
    serveurDisponible: () => !!(C && C.serveurDisponible()),
    connecte,
    enAttente: () => !!(connecte() && espace.enAttente()),
    erreur: () => (C ? C.erreur() : ''),
    effacerErreur: () => { if (C) C.effacerErreur(); },
    pret,
    // statistiques
    cleRecord, meilleur, classement, recordDe, enregistrerPartie, reinitialiser, zonesRatees, statistiques,
    temps, historiqueCSV, recordsCSV, sauvegarde, restaurer,
    stockageDisponible: () => stockageOk,
    surChangement: (f) => abonnes.push(f),
    LONGUEUR_NOM, MDP_MIN
  };
})();
