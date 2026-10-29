/* ==========================================================================
   Anotehomy Quizz - game/home.js
   ECRAN D'ACCUEIL : categories (Muscles, Os, Vaisseaux sanguins) puis jeux
   de la categorie choisie, et navigation vers la configuration d'un jeu.
   Le contenu est genere a partir de js/data/games.js.
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc } = AQ.util;
  const D = AQ.data;
  const EN = AQ.engine;
  const { session } = NS;

  const svg = (body, filled) => `<svg viewBox="0 0 24 24" aria-hidden="true"${filled ? '' : ' class="st"'}>${body}</svg>`;
  const ICONS = {
    bone: svg('<g transform="rotate(-45 12 12)" fill="currentColor"><rect x="5.5" y="10.2" width="13" height="3.6" rx="1.8"/><circle cx="5.5" cy="9.6" r="2.4"/><circle cx="5.5" cy="14.4" r="2.4"/><circle cx="18.5" cy="9.6" r="2.4"/><circle cx="18.5" cy="14.4" r="2.4"/></g>', true),
    muscle: svg('<g transform="rotate(-40 12 12)"><path d="M1 12h4M19 12h4"/><path d="M5 12c2.6-5.4 11.4-5.4 14 0c-2.6 5.4-11.4 5.4-14 0z"/><path d="M7.8 10.4c2.8-1.1 5.6-1.1 8.4 0M7.8 13.6c2.8 1.1 5.6 1.1 8.4 0"/></g>'),
    vessel: svg('<path d="M3 21c3.2-3 5-6.2 6-9.4S12 5.4 17 3.5"/><path d="M8.6 13.4c2.6.4 5.6 1.7 8.4 4.6"/><path d="M12.6 7c2 .1 4.3.9 6.4 2.6"/>'),
    lock: svg('<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>')
  };

  /* ---------------- Rendu ---------------- */
  function renderCategories() {
    $('homeCats').innerHTML = D.CATEGORIES.map(c => {
      const open = D.isOpen(c.id);
      const n = D.gamesOf(c.id).filter(g => g.status === 'ready').length;
      const foot = open ? `${n} jeu${n > 1 ? 'x' : ''} disponible${n > 1 ? 's' : ''} ${ICONS.arrow}` : `${ICONS.lock} Bientot disponible`;
      return `<button type="button" class="cat cat-${c.id}${open ? '' : ' locked'}" data-cat="${c.id}"${open ? '' : ' aria-disabled="true"'}>` +
        `<span class="cat-ico">${ICONS[c.icon]}</span><span class="cat-name">${esc(c.name)}</span>` +
        `<span class="cat-desc">${esc(c.desc)}</span><span class="cat-foot">${foot}</span></button>`;
    }).join('');
  }

  function renderGames(catId) {
    const c = D.CATEGORY[catId];
    $('homeCatIco').className = 'cat-ico cat-ico-' + c.id;
    $('homeCatIco').innerHTML = ICONS[c.icon];
    $('homeCatTitle').textContent = c.name;
    $('homeCatDesc').textContent = c.desc;
    $('crumbCat').textContent = c.name;
    $('homeGames').innerHTML = D.gamesOf(catId).map(g => {
      const ready = g.status === 'ready';
      return `<article class="game${ready ? '' : ' locked'}"${ready ? ` data-game="${g.id}"` : ''}>` +
        `<div class="game-top"><span class="game-num">Jeu ${g.num}</span>` +
        `<span class="game-status ${ready ? 'ok' : 'soon'}">${ready ? 'Disponible' : 'Bientot'}</span></div>` +
        `<h3>${esc(g.name)}</h3><p class="game-tag">${esc(g.tagline)}</p><p class="game-desc">${esc(g.desc)}</p>` +
        `<ul class="game-meta">${g.meta.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` +
        (ready ? `<button type="button" class="btn primary game-play" data-game="${g.id}">Jouer ${ICONS.arrow}</button>`
               : `<button type="button" class="btn game-play" disabled>${ICONS.lock} Bientot disponible</button>`) +
        `</article>`;
    }).join('');
  }

  /* ---------------- Navigation ---------------- */
  function showView(id) {
    ['homeCatsView', 'homeGamesView'].forEach(v => { $(v).hidden = v !== id; });
  }

  /* retour a l'accueil (depuis la configuration ou les resultats) */
  function showHome(catId) {
    clearTimeout(session.nextT);
    clearInterval(session.timer);
    session.phase = 'home';
    EN.clearMarks(); EN.setHoverEnabled(false); EN.closeBone(); EN.deactivateMuscles(); EN.showAll();
    NS.hideNotice(); NS.hideTip(); NS.setPrompt(null); NS.updateDock();
    ['qA', 'qB', 'feedback', 'reviewBox', 'setup', 'results'].forEach(id => { $(id).hidden = true; });
    $('app').className = 'mode-a';
    if (EN.isReady()) EN.frameAll({ view: 'A' });
    $('home').hidden = false;
    if (catId) openCategory(catId); else showView('homeCatsView');
  }

  function openCategory(catId) {
    if (!D.isOpen(catId)) return;
    renderGames(catId);
    showView('homeGamesView');
  }

  /* lance la configuration d'un jeu disponible */
  function openGame(gameId) {
    const g = D.GAME[gameId];
    if (!g || g.status !== 'ready') return;
    session.game = g;
    const c = D.CATEGORY[g.category];
    $('brandSub').textContent = g.name;
    $('setupCrumbCat').textContent = c.name;
    $('setupCrumbGame').textContent = g.name;
    $('setupTitle').textContent = g.name;
    $('setupSub').textContent = g.tagline;
    $('setupLogo').innerHTML = ICONS[c.icon];
    $('home').hidden = true;
    NS.showSetup();
  }

  /* categorie verrouillee : petite secousse + message */
  function nudge(el) {
    el.classList.remove('nudge');
    void el.offsetWidth;
    el.classList.add('nudge');
    $('homeMsg').textContent = 'Cette categorie arrive bientot : les jeux sur les os et sur les muscles sont deja disponibles.';
  }

  function initHome() {
    renderCategories();
    $('homeCats').addEventListener('click', e => {
      const b = e.target.closest('.cat');
      if (!b) return;
      if (b.classList.contains('locked')) nudge(b); else { $('homeMsg').textContent = ''; openCategory(b.dataset.cat); }
    });
    $('homeGames').addEventListener('click', e => {
      const g = e.target.closest('[data-game]');
      if (g) openGame(g.dataset.game);
    });
    /* fils d'Ariane (accueil, configuration) */
    document.addEventListener('click', e => {
      const n = e.target.closest('[data-nav]');
      if (!n) return;
      if (n.dataset.nav === 'home') showHome();
      else if (n.dataset.nav === 'cat') showHome(session.game ? session.game.category : null);
    });
    session.game = D.GAMES.find(g => g.status === 'ready');
    showHome();
  }

  Object.assign(NS, { initHome, showHome, openGame });
})(AQ.game);
