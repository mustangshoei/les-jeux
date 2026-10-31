/* ==========================================================================
   Anotehomy Quizz - account/account.js
   COMPTE DU JOUEUR : bouton en haut a gauche (sur les ecrans superposes :
   accueil, configuration, resultats), menu du compte et ecran des
   statistiques. Le menu est un menu deroulant sous le bouton, sur le modele du
   menu "Jeux" (../COMMUN/jeux.js) : un titre, le joueur, des lignes d'action
   (pictogramme, titre, precision) et une note ; il se ferme d'un clic ailleurs
   ou avec Echap. Les donnees sont gerees par js/account/profile.js.
     - non connecte : se connecter ou creer un compte (nom + mot de passe), ou
       continuer en invite ; le menu s'ouvre seul a l'arrivee, une fois par
       session du navigateur (tous jeux confondus) ;
     - connecte : statistiques, renommer, mot de passe, se deconnecter, supprimer ;
     - sans serveur (index.html ouvert directement) : invite seulement.
   Les comptes sont communs a tous les jeux du dossier : se connecter ici connecte
   aussi GeoNohyne Quizz. Le selecteur "Changer de jeu" (en haut a droite) vient de
   ../COMMUN/jeux.js.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc, fmt } = AQ.util;
  const P = NS;

  const MODES = { A: 'Nommage', B: 'Ciblage' };
  const HISTORY_STEP = 30;               /* parties affichees par "Afficher plus" */

  /* vues du menu : 'login' ou 'register' (non connecte) ; connecte : formulaire ouvert
     null, 'rename', 'pwd' ou 'delete' */
  let view = 'login';
  let form = null;
  let message = '';
  let welcome = false;                   /* menu ouvert automatiquement a l'arrivee */
  let busy = false;                      /* requete en cours : boutons desactives */
  let historyMax = HISTORY_STEP;

  /* pictogrammes des lignes du menu (traits sur une grille de 24 x 24), par action */
  const ICONS = {
    stats: '<path d="M4 20V11M10 20V5M16 20v-6M2 20h20"/>',
    guest: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    rename: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>',
    pwd: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14.5 8.5l2 2"/>',
    logout: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 17l5-5-5-5M20 12H9"/>',
    delete: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'
  };

  const initial = n => (String(n).trim().charAt(0) || '?').toUpperCase();
  const avatar = (p, big) => `<span class="acct-av${big ? ' big' : ''}" style="--av:${esc(p.color)}" aria-hidden="true">${esc(initial(p.name))}</span>`;
  const plural = (n, w) => n + ' ' + w + (n > 1 ? 's' : '');
  const pct = (a, b) => (b ? Math.round(a / b * 100) : 0) + ' %';
  const gameName = (id, fallback) => (AQ.data.GAME && AQ.data.GAME[id] ? AQ.data.GAME[id].name : fallback || id);
  function duration(s) {
    const min = Math.round(s / 60);
    if (s < 60) return Math.round(s) + ' s';
    if (min < 60) return min + ' min';
    return Math.floor(min / 60) + ' h ' + String(min % 60).padStart(2, '0');
  }

  /* ---------------- Bouton de compte ---------------- */
  function updateButton() {
    const p = P.player(), b = $('acctBtn');
    b.innerHTML = avatar(p) + `<span class="acct-name">${esc(p.name)}</span>`;
    const what = p.guest ? 'se connecter, créer un compte, statistiques' : 'compte, statistiques';
    b.title = (p.guest ? 'Invité' : 'Compte : ' + p.name) + ' (' + what + ')';
    b.setAttribute('aria-label', (p.guest ? 'Vous jouez en invité' : 'Compte : ' + p.name) + '. Ouvrir le menu du compte (' + what + ')');
  }

  /* ---------------- Menu du compte ---------------- */
  const field = (label, name, type, auto, extra) => `<label class="acct-field">${label}<input name="${name}" type="${type}" autocomplete="${auto}" spellcheck="false" required${extra || ''}></label>`;
  const errHtml = () => `<p class="acct-err" role="alert">${esc(message)}</p>`;
  const dis = () => busy ? ' disabled' : '';

  /* une ligne du menu : pictogramme, titre et precision (comme un jeu du menu "Jeux") */
  const line = (act, title, detail, danger) => `<button type="button" class="acct-ligne${danger ? ' acct-ligne--danger' : ''}" data-act="${act}"${dis()}>` +
    `<span class="acct-ligne__icone" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[act]}</svg></span>` +
    `<span class="acct-ligne__texte"><b>${title}</b><small>${detail}</small></span></button>`;
  /* le joueur, en tete du menu (comme le jeu "ou vous etes" du menu "Jeux") */
  const identity = (p, detail) => `<div class="acct-identite">${avatar(p)}<span class="acct-ligne__texte"><b>${esc(p.name)}</b><small>${detail}</small></span></div>`;
  function guestIdentity() {
    const n = P.stats().totals.played;
    return identity(P.player(), n ? plural(n, 'partie') + ' · statistiques gardées dans ce navigateur' : 'Statistiques gardées dans ce navigateur');
  }

  /* non connecte : formulaires reconnus par les gestionnaires de mots de passe */
  function visitorView() {
    const reg = view === 'register', played = P.stats().totals.played;
    return guestIdentity() +
      `<div class="acct-tabs" role="tablist">` +
        `<button type="button" role="tab" class="${reg ? '' : 'on'}" aria-selected="${!reg}" data-view="login">Se connecter</button>` +
        `<button type="button" role="tab" class="${reg ? 'on' : ''}" aria-selected="${reg}" data-view="register">Créer un compte</button></div>` +
      `<form class="acct-form" data-form="${view}">` +
        field('Nom', 'username', 'text', 'username', ` maxlength="${P.NAME_MAX}"`) +
        field('Mot de passe', 'password', 'password', reg ? 'new-password' : 'current-password', reg ? ` minlength="${P.PWD_MIN}"` : '') +
        (reg ? field('Confirmer le mot de passe', 'confirm', 'password', 'new-password') +
          (played ? `<label class="acct-check"><input name="take" type="checkbox" checked><span>Reprendre les statistiques de l'invité de ce navigateur (${plural(played, 'partie')})</span></label>` : '') : '') +
        errHtml() +
        `<button type="submit" class="btn primary"${dis()}>${busy ? '…' : reg ? 'Créer mon compte' : 'Se connecter'}</button>` +
      `</form>` +
      `<div class="acct-lignes">` +
        line('stats', 'Statistiques de l\'invité', 'Parties, réussite, éléments à revoir') +
        (welcome ? line('guest', 'Continuer en invité', 'Vous pourrez vous connecter plus tard') : '') +
      `</div>`;
  }

  /* connecte : le compte et ses actions */
  function accountView() {
    const p = P.player(), t = P.stats().totals;
    const state = P.pending() ? (P.serverAvailable() ? 'synchronisation…' : '⚠️ serveur injoignable : vos dernières parties partiront dès son retour')
      : 'statistiques enregistrées sur le serveur';
    let h = identity(p, plural(t.played, 'partie') + ' · ' + state);
    const buttons = (label, cls) => `<div class="btn-row"><button type="submit" class="btn ${cls}"${dis()}>${label}</button><button type="button" class="btn ghost" data-act="cancel">Annuler</button></div>`;
    if (form === 'rename') {
      h += `<form class="acct-form" data-form="rename">` + field('Nouveau nom', 'name', 'text', 'username', ` maxlength="${P.NAME_MAX}" value="${esc(p.name)}"`) +
        errHtml() + buttons('Renommer', 'primary') + `</form>`;
    } else if (form === 'pwd') {
      h += `<form class="acct-form" data-form="pwd"><input type="text" name="username" autocomplete="username" value="${esc(p.name)}" hidden>` +
        field('Mot de passe actuel', 'old', 'password', 'current-password') +
        field('Nouveau mot de passe', 'new', 'password', 'new-password', ` minlength="${P.PWD_MIN}"`) +
        field('Confirmer le nouveau mot de passe', 'confirm', 'password', 'new-password') +
        errHtml() + buttons('Changer le mot de passe', 'primary') + `</form>`;
    } else if (form === 'delete') {
      h += `<form class="acct-form danger" data-form="delete"><p>Supprimer le compte "${esc(p.name)}" et ses statistiques <b>dans tous les jeux</b> ? C'est définitif.</p>` +
        field('Mot de passe', 'pwd', 'password', 'current-password') + errHtml() + buttons('Supprimer définitivement', 'danger') + `</form>`;
    } else {
      if (message) h += `<p class="acct-info" role="status">${esc(message)}</p>`;
      h += `<div class="acct-lignes">` +
        line('stats', 'Mes statistiques', 'Parties, réussite, éléments à revoir') +
        line('rename', 'Renommer', 'Votre nom dans tous les jeux') +
        line('pwd', 'Mot de passe', 'Le changer pour tous vos appareils') +
        line('logout', 'Se déconnecter', 'De tous les jeux, dans ce navigateur') +
        line('delete', 'Supprimer le compte', 'Définitif, pour tous les jeux', true) +
        `</div>`;
    }
    return h;
  }

  function renderMenu() {
    const on = P.connected(), server = P.serverAvailable();
    $('acctTitle').textContent = on ? 'Mon compte' : welcome ? 'Bienvenue sur Anotehomy Quizz\u00a0!' : 'Compte';
    $('acctHelp').textContent = on
      ? 'Votre compte est commun à tous les jeux : vous restez connecté en changeant de jeu. Vos statistiques vous suivent sur tous vos appareils.'
      : server
        ? 'Un seul compte pour tous les jeux : vos statistiques vous suivent sur tous vos appareils.'
        : 'Sans serveur, on joue en invité. Pour créer un compte (commun à tous les jeux), lancez les jeux avec game.bat, à la racine du dossier des jeux.';
    $('acctBody').innerHTML = on ? accountView() : server ? visitorView()
      : guestIdentity() + `<div class="acct-lignes">${line('stats', 'Mes statistiques', 'Parties, réussite, éléments à revoir')}</div>`;
  }

  /* premier champ d'un formulaire, sinon premiere ligne : le menu est pret pour le clavier */
  function focusFirst() {
    const c = document.querySelector('#acctBody input:not([hidden]):not([type="checkbox"])') || document.querySelector('#acctBody button:not([disabled])');
    if (c) c.focus();
  }

  const menuOpen = () => !$('acctMenu').hidden;

  function openMenu(auto) {
    welcome = !!auto;
    view = 'login';
    form = null;
    message = P.error();
    P.clearError();
    renderMenu();
    $('acctMenu').hidden = false;
    $('acctBtn').setAttribute('aria-expanded', 'true');
    document.querySelector('.acct-coin').classList.add('is-ouvert');
    focusFirst();
  }

  /* giveFocus : le bouton du compte reprend le focus (fermeture au clavier) */
  function closeMenu(giveFocus) {
    if (!menuOpen()) return;
    if ($('acctMenu').contains(document.activeElement)) document.activeElement.blur();   /* pas de focus dans un menu cache */
    $('acctMenu').hidden = true;
    $('acctBtn').setAttribute('aria-expanded', 'false');
    document.querySelector('.acct-coin').classList.remove('is-ouvert');
    if (giveFocus) $('acctBtn').focus();
  }

  /* requete au serveur : boutons desactives pendant l'attente, message d'erreur sinon */
  async function run(action, after) {
    const typed = {};                    /* saisies remises apres chaque redessin (sauf mots de passe) */
    document.querySelectorAll('#acctBody input[type="text"]').forEach(i => { typed[i.name] = i.value; });
    const restore = () => Object.keys(typed).forEach(n => { const i = document.querySelector(`#acctBody input[name="${n}"]`); if (i) i.value = typed[n]; });
    busy = true; message = '';
    renderMenu(); restore();
    try {
      await action();
      busy = false;
      after();
    } catch (err) {
      busy = false;
      message = err.message;
      renderMenu(); restore(); focusFirst();
    }
  }

  function submit(f) {
    const v = n => f.elements[n] ? f.elements[n].value : '';
    const mismatch = (a, b) => { if (a !== b) { message = 'Les deux mots de passe ne sont pas identiques.'; renderMenu(); return true; } return false; };
    const done = () => { message = ''; closeMenu(true); };
    switch (f.dataset.form) {
      case 'login': return run(() => P.login(v('username'), v('password')), done);
      case 'register':
        if (mismatch(v('password'), v('confirm'))) return;
        return run(() => P.register(v('username'), v('password'), f.elements.take ? f.elements.take.checked : false), done);
      case 'rename': return run(() => P.rename(v('name')), () => { form = null; message = 'Nom changé.'; renderMenu(); });
      case 'pwd':
        if (mismatch(v('new'), v('confirm'))) return;
        return run(() => P.changePassword(v('old'), v('new')), () => { form = null; message = 'Mot de passe changé. Vos autres appareils devront se reconnecter.'; renderMenu(); });
      case 'delete': return run(() => P.deleteAccount(v('pwd')), () => { form = null; message = ''; view = 'login'; renderMenu(); });
    }
  }

  function bindMenu() {
    const coin = document.querySelector('.acct-coin'), menu = $('acctMenu');
    $('acctBtn').addEventListener('click', () => (menuOpen() ? closeMenu(false) : openMenu(false)));
    /* clic ailleurs : fermeture. Le chemin du clic est celui du moment du clic (le menu a pu etre redessine depuis). */
    document.addEventListener('click', e => { if (menuOpen() && !e.composedPath().includes(coin)) closeMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen()) closeMenu(true); });
    menu.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.view) { view = b.dataset.view; message = ''; renderMenu(); focusFirst(); return; }
      switch (b.dataset.act) {
        case 'guest': closeMenu(true); break;
        case 'stats': closeMenu(false); openStats(); break;
        case 'rename': case 'pwd': case 'delete': form = b.dataset.act; message = ''; renderMenu(); focusFirst(); break;
        case 'cancel': form = null; message = ''; renderMenu(); break;
        case 'logout': run(() => P.logout(), () => { message = ''; view = 'login'; renderMenu(); }); break;
      }
    });
    menu.addEventListener('submit', e => { e.preventDefault(); if (!busy) submit(e.target); });
  }

  /* ---------------- Ecran des statistiques ---------------- */
  function openStats() {
    historyMax = HISTORY_STEP;
    $('stats').hidden = false;
    renderStats();
    $('stats').scrollTop = 0;
  }
  const closeStats = () => { $('stats').hidden = true; };

  function renderStats() {
    if ($('stats').hidden) return;
    const p = P.player(), s = P.stats(), t = s.totals;
    const where = P.connected() ? `Statistiques enregistrées sur le serveur des jeux, sous votre compte "${esc(p.name)}".`
      : 'Vous jouez en invité : statistiques enregistrées dans ce navigateur, sur cet appareil.';
    const kpi = (v, l) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`;

    /* par jeu et par mode, dans l'ordre du catalogue */
    const order = (AQ.data.GAMES || []).map(g => g.id);
    const keys = Object.keys(s.games).sort((a, b) => {
      const [ga, ma] = a.split('|'), [gb, mb] = b.split('|');
      return (order.indexOf(ga) - order.indexOf(gb)) || ma.localeCompare(mb);
    });
    const rows = keys.map(k => {
      const [g, m] = k.split('|'), x = s.games[k], b = x.best;
      return `<tr><td>${esc(gameName(g))}</td><td>${MODES[m] || esc(m)}</td><td><b>${x.played}</b></td><td><b>${pct(x.ok, x.questions)}</b><small>${x.ok} / ${x.questions}</small></td>` +
        `<td>${b ? `<b>${b.pct} %</b> (${b.ok} / ${b.n}) - ${fmt(b.time)}<small>${esc(b.detail || '')} - ${new Date(b.date).toLocaleDateString('fr-FR')}</small>` : '<span class="st-empty">aucune partie complète</span>'}</td></tr>`;
    }).join('');

    /* elements a revoir, par jeu */
    const missed = order.concat(Object.keys(s.missed).filter(g => order.indexOf(g) < 0)).map(g => {
      const list = P.mostMissed(g, 12);
      return list.length ? `<p class="st-game">${esc(gameName(g))}</p><div class="subs">` +
        list.map(x => `<span>${esc(x.name)} <small>ratée ${x.missed} fois sur ${x.seen}</small></span>`).join('') + '</div>' : '';
    }).join('');

    const hist = s.history.slice(0, historyMax).map(h => {
      const d = new Date(h.date);
      return `<tr><td>${d.toLocaleDateString('fr-FR')}<small>${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small></td>` +
        `<td>${esc(gameName(h.game, h.name))}${h.aborted ? '<span class="st-tag">interrompue</span>' : ''}</td><td>${MODES[h.mode] || esc(h.mode)}</td>` +
        `<td>${esc(h.detail || '')}</td><td><b>${h.ok} / ${h.n}</b><small>${pct(h.ok, h.n)} - ${h.points} pts</small></td><td>${fmt(h.time)}</td></tr>`;
    }).join('');

    $('statsCard').innerHTML =
      `<div class="st-head">${avatar(p, true)}<div><h2 class="res-title">Statistiques de ${esc(p.name)}</h2><p class="st-sub">${where}</p></div></div>` +
      (P.storageOk() ? '' : '<p class="fb-note">Ce navigateur refuse l\'enregistrement : les statistiques ne seront gardées que jusqu\'à la fermeture de la page.</p>') +
      `<div class="kpis">${kpi(t.played, 'Parties jouées')}${kpi(duration(t.time), 'Temps de jeu')}${kpi(pct(t.ok, t.questions), 'Bonnes réponses')}${kpi(t.questions, 'Questions')}</div>` +
      `<h3 class="res-sec">Par jeu et par mode</h3>` +
      (rows ? `<div class="st-scroll"><table class="st-table"><thead><tr><th>Jeu</th><th>Mode</th><th>Parties</th><th>Réussite</th><th>Meilleure partie</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : '<p class="st-empty">Aucune partie pour l\'instant : elles apparaîtront ici à la fin de chaque partie.</p>') +
      `<h3 class="res-sec">À revoir</h3>` + (missed || '<p class="st-empty">Aucune erreur enregistrée pour l\'instant.</p>') +
      `<h3 class="res-sec">Dernières parties</h3>` +
      (hist ? `<div class="st-scroll"><table class="st-table"><thead><tr><th>Date</th><th>Jeu</th><th>Mode</th><th>Configuration</th><th>Score</th><th>Temps</th></tr></thead><tbody>${hist}</tbody></table></div>` +
        (s.history.length > historyMax ? `<button type="button" class="btn st-more" data-st="more">Afficher plus (${s.history.length - historyMax} de plus)</button>` : '') +
        `<p class="st-sub">${plural(s.history.length, 'partie')} dans l'historique (les 500 dernières sont gardées).</p>`
        : '<p class="st-empty">Aucune partie pour l\'instant.</p>') +
      `<div class="res-actions"><button type="button" class="btn ghost acct-danger" data-st="reset">Effacer mes statistiques</button>` +
      `<button type="button" class="btn primary" data-st="close">Fermer</button></div>`;
  }

  function bindStats() {
    $('statsCard').addEventListener('click', e => {
      const b = e.target.closest('[data-st]');
      if (!b) return;
      if (b.dataset.st === 'close') closeStats();
      else if (b.dataset.st === 'more') { historyMax += HISTORY_STEP; renderStats(); }
      else if (b.dataset.st === 'reset' && confirm('Effacer toutes les statistiques de "' + P.player().name + '" ? Le compte est gardé. C\'est définitif.')) P.reset();
    });
    $('stats').addEventListener('click', e => { if (e.target === $('stats')) closeStats(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('stats').hidden && !menuOpen()) closeStats(); });
  }

  /* a l'arrivee (une fois par session, tous jeux confondus) : si le serveur repond et qu'aucun
     compte n'est memorise, on propose de se connecter ou de creer un compte */
  function proposeLogin() {
    if (P.serverAvailable() && !P.connected() && !$('home').hidden && P.firstVisit()) openMenu(true);
  }

  function init() {
    updateButton();
    bindMenu();
    bindStats();
    P.onChange(() => {
      updateButton();
      if (menuOpen() && !busy) {
        const typing = document.activeElement && document.activeElement.closest && document.activeElement.closest('#acctBody form');
        if (!typing) renderMenu();       /* pas de redessin pendant la saisie d'un formulaire */
      }
      renderStats();
    });
    P.ready.then(proposeLogin);
  }

  Object.assign(NS, { init, openStats });
})(AQ.account);
