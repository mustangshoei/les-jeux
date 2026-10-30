/* ==========================================================================
   Anotehomy Quizz - account/profile.js
   STATISTIQUES DU JOUEUR : chaque partie terminee est enregistree (historique,
   meilleure partie par jeu et par mode, elements les plus rates, totaux).
     - invite : statistiques gardees dans ce navigateur (localStorage, cle
       anotehomy.profil) ;
     - compte : les comptes sont COMMUNS A TOUS LES JEUX du dossier
       (../COMMUN/comptes.js, servis par ../SERVEUR/serveur.py). Un compte cree ici
       sert aussi dans GeoNohyne Quizz, et inversement ; on reste connecte en changeant de
       jeu. Les statistiques vont dans l'espace "anotehomy" du compte (une copie
       reste dans le navigateur si le serveur ne repond plus un moment).
   Sans ../COMMUN/comptes.js (ou s'il plante), le jeu fonctionne en invite.

   Statistiques ("profil", temps en secondes) :
     { history: [{ date, game, name, mode, ok, n, total, points, time, aborted, detail }]  (recentes d'abord)
       games:   { 'jeu|mode': { played, ok, questions, time, best: { pct, ok, n, time, date, detail } } }
       missed:  { jeu: { nom de l'element: [fois demande, fois rate] } }
       totals:  { played, ok, questions, time } }
   L'interface (bouton de compte, fenetre, ecran des statistiques) est dans
   js/account/account.js.
   ========================================================================== */
(function (NS) {
  'use strict';

  const SPACE = 'anotehomy';             /* espace du jeu dans les comptes communs (COMMUN/jeux.js) */
  const KEY = 'anotehomy.profil';        /* invite */
  const MAX_HISTORY = 500;
  const GUEST_COLOR = '#64748b';

  let C = window.Comptes || null;
  let space = null;
  let storageOk = true;
  const listeners = [];

  /* ---------------- Statistiques vides et completees ---------------- */
  const emptyTotals = () => ({ played: 0, ok: 0, questions: 0, time: 0 });
  const emptyProfile = () => ({ history: [], games: {}, missed: {}, totals: emptyTotals() });
  const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  function complete(p) {
    p = obj(p);
    return { history: Array.isArray(p.history) ? p.history.slice(0, MAX_HISTORY) : [], games: obj(p.games),
      missed: obj(p.missed), totals: Object.assign(emptyTotals(), obj(p.totals)) };
  }

  /* a est-elle une meilleure partie que b ? reussite, puis nombre de questions, puis temps */
  function better(a, b) {
    if (!b) return true;
    if (a.pct !== b.pct) return a.pct > b.pct;
    if (a.n !== b.n) return a.n > b.n;
    return a.time < b.time;
  }

  /* ajoute les statistiques de src a dst (parties jouees hors ligne, invite repris dans un compte) */
  function merge(dst, src) {
    dst.history = dst.history.concat(src.history).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, MAX_HISTORY);
    Object.keys(src.games).forEach(k => {
      const s = src.games[k], d = dst.games[k] = dst.games[k] || { played: 0, ok: 0, questions: 0, time: 0, best: null };
      ['played', 'ok', 'questions', 'time'].forEach(f => { d[f] = (d[f] || 0) + (s[f] || 0); });
      if (s.best && better(s.best, d.best)) d.best = s.best;
    });
    Object.keys(src.missed).forEach(g => {
      const d = dst.missed[g] = dst.missed[g] || {};
      Object.keys(src.missed[g]).forEach(name => {
        const v = d[name] = d[name] || [0, 0];
        v[0] += src.missed[g][name][0] || 0;
        v[1] += src.missed[g][name][1] || 0;
      });
    });
    Object.keys(dst.totals).forEach(f => { dst.totals[f] += src.totals[f] || 0; });
    return dst;
  }

  /* ---------------- Invite : stockage dans le navigateur ---------------- */
  function loadGuest() {
    try { const t = localStorage.getItem(KEY); return complete(t ? JSON.parse(t) : null); }
    catch (e) { storageOk = false; return emptyProfile(); }
  }
  function saveGuest() {
    try { localStorage.setItem(KEY, JSON.stringify(guest)); storageOk = true; }
    catch (e) { storageOk = false; }      /* navigateur sans stockage : valable pour la session */
  }
  const guest = loadGuest();

  /* ---------------- Compte : espace "anotehomy" des comptes communs ---------------- */
  if (C) {
    try { space = C.espace(SPACE, { completer: complete, fusionner: merge, publiques: () => null }); }
    catch (e) { console.error('profile.js : comptes communs indisponibles', e); C = null; }
  }

  const connected = () => !!(C && C.connecte() && space.donnees());
  const current = () => connected() ? space.donnees() : guest;
  function player() {
    if (connected()) { const c = C.compte(); return { id: c.id, name: c.nom, color: c.couleur, guest: false }; }
    return { id: 'guest', name: 'Invite', color: GUEST_COLOR, guest: true };
  }
  function notify() { listeners.forEach(f => { try { f(); } catch (e) { console.error(e); } }); }
  /* apres chaque modification : enregistrement local, puis envoi au serveur (compte) */
  function changed() { if (connected()) space.modifie(); else saveGuest(); notify(); }

  /* ---------------- Parties ---------------- */
  /* configuration jouee : zones cochees, ou os etudie */
  function detailOf(gameId, s, st) {
    const D = AQ.data;
    const names = (ids, map) => Array.from(ids).map(id => map[id] ? map[id].name : id).join(', ');
    if (gameId === 'os-descriptive') return s.oDef ? AQ.game.ADAPTERS['os-descriptive'].boneTitle(s.oDef) : '';
    if (gameId === 'muscles-localisation') return names(st.mRegions, D.MUSCLE_REGION) + (st.mPrincipal ? ' - muscles principaux' : ' - tous les muscles');
    return names(st.regions, D.REGION) + (st.precise ? ' - numéro et côté exigés' : '');
  }

  /* enregistre la partie qui vient de se terminer (appele par js/game/results.js) */
  function saveGame(aborted) {
    const G = AQ.game, s = G.session, st = G.settings, n = s.log.length;
    if (!n || !s.game) return;
    const p = current(), time = Math.round(s.elapsed);
    const e = { date: new Date().toISOString(), game: s.game.id, name: s.game.name, mode: st.mode, ok: s.ok, n,
      total: s.queue.length, points: s.points, time, aborted: !!aborted && n < s.queue.length, detail: detailOf(s.game.id, s, st) };
    p.history.unshift(e);
    if (p.history.length > MAX_HISTORY) p.history.length = MAX_HISTORY;

    const key = e.game + '|' + e.mode;
    const g = p.games[key] = p.games[key] || { played: 0, ok: 0, questions: 0, time: 0, best: null };
    g.played++; g.ok += e.ok; g.questions += n; g.time += time;
    if (!e.aborted) {
      const b = { pct: Math.round(e.ok / n * 100), ok: e.ok, n, time, date: e.date, detail: e.detail };
      if (better(b, g.best)) g.best = b;
    }

    const m = p.missed[e.game] = regrouper(e.game, p.missed[e.game] || {});
    s.log.forEach(l => {
      const name = l.item && l.item.name;
      if (!name) return;
      const v = m[name] = m[name] || [0, 0];
      v[0]++;
      if (!l.ok) v[1]++;
    });

    const t = p.totals;
    t.played++; t.ok += e.ok; t.questions += n; t.time += time;
    changed();
  }

  /* efface les statistiques du joueur courant (le compte reste) */
  function reset() {
    Object.assign(current(), emptyProfile());
    changed();
  }

  /* Les éléments ratés sont rangés sous leur nom. Depuis la version 2.0.0, les noms portent leurs accents :
     ceux enregistrés sous l'ancienne orthographe (« femur ») sont regroupés sous le nom actuel (« fémur »). */
  function regrouper(gameId, m) {
    const G = AQ.game, A = G.ADAPTERS && G.ADAPTERS[gameId];
    if (!A || !G.plier) return m;
    const actuel = new Map(A.names().map(x => [G.plier(x.name), x.name]));
    Object.keys(m).forEach(k => {
      const nom = actuel.get(G.plier(k));
      if (!nom || nom === k) return;
      const v = m[nom] || [0, 0];
      m[nom] = [v[0] + m[k][0], v[1] + m[k][1]];
      delete m[k];
    });
    return m;
  }

  /* elements les plus rates d'un jeu (au moins une fois), les plus rates d'abord */
  function mostMissed(gameId, max) {
    const m = current().missed[gameId] ? regrouper(gameId, current().missed[gameId]) : {};
    return Object.keys(m).filter(k => m[k][1] > 0)
      .map(k => ({ name: k, seen: m[k][0], missed: m[k][1] }))
      .sort((a, b) => b.missed - a.missed || b.missed / b.seen - a.missed / a.seen)
      .slice(0, max || 12);
  }

  /* ---------------- Comptes ---------------- */
  const noAccounts = () => new Error('Les comptes ne sont pas disponibles (fichier ../COMMUN/comptes.js introuvable).');
  const needLogin = () => { if (!C || !C.connecte()) throw new Error('Connectez-vous d\'abord.'); };

  async function login(name, pwd) {
    if (!C) throw noAccounts();
    await C.connecter(name, pwd);
    await space.charge();
    notify();
  }
  /* takeGuest : les statistiques de l'invite de ce navigateur deviennent celles du compte */
  async function register(name, pwd, takeGuest) {
    if (!C) throw noAccounts();
    await C.inscrire(name, pwd);
    if (takeGuest) {
      space.remplacer(complete(JSON.parse(JSON.stringify(guest))));
      Object.assign(guest, emptyProfile());
      saveGuest();
    }
    notify();
  }
  async function logout() { if (C) { await C.deconnecter(); notify(); } }
  async function rename(name) { needLogin(); await C.renommer(name); notify(); }
  async function changePassword(oldPwd, newPwd) { needLogin(); await C.changerMotDePasse(oldPwd, newPwd); }
  async function deleteAccount(pwd) { needLogin(); await C.supprimerCompte(pwd); notify(); }

  /* une fois par session du navigateur, tous jeux confondus (fenetre de connexion a l'arrivee) */
  function firstVisit() {
    if (C) return C.premiereVisite();
    try {
      if (sessionStorage.getItem('anotehomy.accueil') === '1') return false;
      sessionStorage.setItem('anotehomy.accueil', '1');
    } catch (e) { /* sans stockage */ }
    return true;
  }

  let ready = Promise.resolve();
  if (C) {
    C.surChangement(notify);             /* connexion, deconnexion, nom (ici ou dans un autre jeu) */
    space.surChangement(notify);         /* statistiques recues ou envoyees */
    ready = C.pret.then(() => space.charge()).then(notify, e => { console.error(e); notify(); });
  }

  Object.assign(NS, {
    player, stats: current, saveGame, reset, mostMissed,
    login, register, logout, rename, changePassword, deleteAccount, firstVisit, ready,
    accountsAvailable: () => !!C,
    serverAvailable: () => !!(C && C.serveurDisponible()),
    connected,
    pending: () => !!(connected() && space.enAttente()),
    error: () => C ? C.erreur() : '',
    clearError: () => { if (C) C.effacerErreur(); },
    storageOk: () => storageOk,
    onChange: f => listeners.push(f),
    NAME_MAX: C ? C.LONGUEUR_NOM : 20,
    PWD_MIN: C ? C.MDP_MIN : 4
  });
})(AQ.account);
