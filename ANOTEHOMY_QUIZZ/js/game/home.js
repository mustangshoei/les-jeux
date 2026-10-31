/* ==========================================================================
   Anotehomy Quizz - game/home.js
   LE MENU « Planches anatomiques » (même construction que le menu de GéoNohyne Quizz) : à gauche, les
   CHAPITRES (js/data/games.js) ; à droite, la PLANCHE du chapitre (une image figée tirée du modèle 3D,
   avec quelques repères et une légende) ; dessous, les CARTES du chapitre : jeux jouables, ou grisés
   (« Bientôt »). Le dernier chapitre affiché est mémorisé ; les flèches ← → changent de chapitre.
   Aucune 3D ne tourne ici : les planches sont des images (img/chapitre-*.webp, fabriquées une fois pour
   toutes à partir du modèle) et la scène 3D est en pause (js/engine/scene.js).
   ========================================================================== */
(function (NS) {
  'use strict';
  const { $, esc } = AQ.util;
  const D = AQ.data;
  const EN = AQ.engine;
  const { session } = NS;

  const CLE = 'anotehomy.menu.chapitre';      /* dernier chapitre affiché */

  /* ---------- Pictogrammes (traits sur une grille de 24 × 24) ---------- */
  const ICONS = {
    os: '<path d="M7.2 7.2l9.6 9.6"/><path d="M7.6 4.8a2.3 2.3 0 1 0-2.8 2.8 2.3 2.3 0 1 0 2.8 2.8M16.4 19.2a2.3 2.3 0 1 0 2.8-2.8 2.3 2.3 0 1 0-2.8-2.8"/>',
    osteo: '<path d="M5.5 5.5l7 7"/><path d="M5.9 3.5a1.9 1.9 0 1 0-2.4 2.4 1.9 1.9 0 1 0 2.4 2.4"/><circle cx="15.5" cy="15.5" r="4"/><path d="M18.5 18.5l3 3"/>',
    muscle: '<path d="M3 13.5c2.2-5.6 6.5-8.6 11-8.6 3.6 0 6 1.6 7 4-1.4 5.6-6.6 9.8-12.6 9.8-2.4 0-4.3-1.8-5.4-5.2z"/><path d="M7 13c2.4-.6 5-2.2 7-4.8M9.5 16.2c2.6-.8 5.2-2.6 7-5.4"/>',
    organe: '<path d="M12 20.5s-7.5-4.6-7.5-10.3A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3z"/><path d="M12 7.6V4"/>',
    splanchno: '<path d="M12 4v7M12 11c-1.4 1.6-3 2.2-4.6 2"/><path d="M9 6.5C6 7 4 10 4 14.5c0 2.6 1.6 4.5 3.6 4.5 1.8 0 2.8-1.6 2.8-3.8V9.5"/><path d="M15 6.5c3 .5 5 3.5 5 8 0 .6 0 1.1-.2 1.6"/><circle cx="16.5" cy="17" r="2.6"/><path d="M18.4 18.9l2.1 2.1"/>',
    nerf: '<path d="M12 3v6M12 9l-5 4M12 9l5 4M7 13l-3 6M7 13l2 7M17 13l3 6M17 13l-2 7"/><circle cx="12" cy="9" r="1.6"/>',
    vaisseau: '<path d="M4 20c4-1 6-4 7-8s3-7 9-8"/><path d="M9.2 14.6c2.6.2 5 1.4 7 3.8M12.4 8.6c1.6-.4 3.6-.2 5.6.8"/>',
    pathologie: '<circle cx="12" cy="12" r="5"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.9 2.9M15.5 15.5l2.9 2.9M5.6 18.4l2.9-2.9M15.5 8.5l2.9-2.9"/>',
    termes: '<path d="M4.5 3h3M14.5 3h3M6 3v5a5 5 0 0 0 10 0V3"/><path d="M11 13v3a4 4 0 0 0 8 0v-2"/><circle cx="19" cy="12" r="2"/>',
    corps: '<circle cx="12" cy="4.6" r="2.2"/><path d="M12 7.6v7.2M12 9.4l-5.4 3M12 9.4l5.4 3M12 14.8l-3.2 6.4M12 14.8l3.2 6.4"/>',
    cadenas: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    fleche: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  const picto = nom => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[nom] || ICONS.corps) + '</svg>';

  /* Vignettes : [couleur, ombre portée (relief)] */
  const TINTS = {
    nacre: ['#f6e1e6', '#9c7d86'], peche: ['#ffc48a', '#a8743f'], framboise: ['#ff5c8a', '#a3264c'],
    rose: ['#ff9ab8', '#a85574'], lavande: ['#c9a2ff', '#7552a8'], menthe: ['#5ee8c5', '#2b8f76']
  };

  /* ---------- Planches des chapitres : image figée, repères (en % de l'image), légende ----------
     Images et positions produites une fois pour toutes à partir du modèle 3D (vue de face du squelette,
     crâne de trois quarts, écorché de face) ; côté : de quel côté du repère s'écrit l'étiquette. */
  const PLANCHES = {
    corps: {
      src: 'img/chapitre-corps.webp', l: 540, h: 1328,
      reperes: [
        { texte: 'Crâne', x: 49.8, y: 5.6, cote: 'd' },
        { texte: 'Humérus', x: 26.9, y: 27.8, cote: 'g' },
        { texte: 'Cage thoracique', x: 49.2, y: 21, cote: 'g' },
        { texte: 'Bassin', x: 61.2, y: 45.4, cote: 'd' },
        { texte: 'Fémur', x: 63.3, y: 59.1, cote: 'd' }
      ],
      coeur: { x: 54.3, y: 25.6 },
      legende: () => D.BONES.length + ' os · ' + D.OSTEO.length + ' os détaillés · ' + D.MUSCLES.length + ' muscles',
      description: 'Squelette humain vu de face'
    },
    langue: {
      src: 'img/chapitre-langue.webp', l: 722, h: 950,
      reperes: [
        { texte: 'Céphal(o)- · tête', x: 73, y: 27.1, cote: 'd' },
        { texte: 'Ophtalm(o)- · œil', x: 35.7, y: 55.8, cote: 'g' },
        { texte: 'Rhin(o)- · nez', x: 16.6, y: 61, cote: 'g' },
        { texte: 'Ot(o)- · oreille', x: 69.3, y: 54.2, cote: 'd' },
        { texte: 'Odont(o)- · dent', x: 21.1, y: 73.4, cote: 'g' },
        { texte: 'Gnath(o)- · mâchoire', x: 44, y: 80, cote: 'd' }
      ],
      legende: () => 'Racines grecques et latines · pathologies · termes médicaux',
      description: 'Crâne vu de trois quarts, entouré de racines de mots médicaux'
    },
    vie: {
      src: 'img/chapitre-vie.webp', l: 558, h: 1332,
      reperes: [
        { texte: 'Temporal', x: 56.6, y: 8.6, cote: 'd' },
        { texte: 'Deltoïde', x: 27.7, y: 23.4, cote: 'g' },
        { texte: 'Grand pectoral', x: 63.6, y: 25.8, cote: 'd' },
        { texte: 'Biceps brachial', x: 72.5, y: 31.5, cote: 'd' },
        { texte: 'Vaste latéral', x: 33.6, y: 62.9, cote: 'g' }
      ],
      legende: () => 'Os · muscles · organes · nerfs · vaisseaux',
      description: 'Écorché : les muscles du corps humain vus de face'
    }
  };

  const deuxChiffres = n => (n < 10 ? '0' : '') + n;
  const compte = (n, unite) => deuxChiffres(n) + ' ' + unite[n > 1 ? 1 : 0];
  const sansAnimation = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function lire() { try { return localStorage.getItem(CLE); } catch (e) { return null; } }
  function ecrire(id) { try { localStorage.setItem(CLE, id); } catch (e) { /* valable pour la session */ } }

  let courant = -1;                  /* index du chapitre affiché */
  let plancheAffichee = null;

  /* ---------- Chapitres (le nombre affiché est celui des cartes : un groupe compte pour une) ---------- */
  function renderChapters() {
    $('homeChapters').innerHTML = D.CHAPTERS.map((c, i) =>
      `<button type="button" class="chapitre-ligne" data-index="${i}">` +
      `<span class="chapitre-num">${deuxChiffres(i + 1)}</span><span class="chapitre-nom">${esc(c.name)}</span>` +
      `<span class="chapitre-nb">${compte(D.cardsOf(c.id).length, c.unit)}</span></button>`).join('');
  }

  /* ---------- Cartes d'un chapitre : un jeu (data-game) ou un groupe de jeux (data-group) ----------
     contenu() sert aussi aux moitiés de la fenêtre d'un groupe. */
  function contenu(g, numero) {
    const pret = g.status === 'ready';
    const t = TINTS[g.tint] || TINTS.rose;
    const vignette = pret
      ? `<span class="carte-icone" style="--teinte:${t[0]};--teinte-ombre:${t[1]}">${picto(g.icon)}</span>`
      : `<span class="carte-icone">${picto('cadenas')}</span>`;
    const bas = pret
      ? `<span class="carte-meta">${esc(g.meta || '')}</span><span class="carte-go">${picto('fleche')}</span>`
      : `<span class="carte-bientot">Bientôt</span>`;
    return `<span class="carte-haut"><span class="carte-index">${numero}</span>${vignette}</span>` +
      `<span class="carte-titre">${esc(g.name)}</span><span class="carte-desc">${esc(g.tagline)}</span>` +
      `<span class="carte-bas">${bas}</span>`;
  }

  function carte(g, numero, rang) {
    const corps = contenu(g, numero);
    return g.status === 'ready'
      ? `<button type="button" class="carte" data-${g.games ? 'group' : 'game'}="${g.id}" style="--rang:${rang}"` +
        (g.games ? ' aria-haspopup="dialog"' : '') + `>${corps}</button>`
      : `<div class="carte carte--bientot" aria-disabled="true" style="--rang:${rang}">${corps}</div>`;
  }

  /* Affiche le chapitre n° index (en boucle) ; defiler : amène les cartes à l'écran si elles n'y sont pas */
  function aller(index, defiler) {
    index = (index + D.CHAPTERS.length) % D.CHAPTERS.length;
    if (index !== courant) {
      courant = index;
      const c = D.CHAPTERS[index], jeux = D.cardsOf(c.id);
      ecrire(c.id);
      document.querySelectorAll('#homeChapters [data-index]').forEach((b, i) => {
        if (i === index) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      $('homeChapterNum').textContent = 'Chapitre ' + deuxChiffres(index + 1);
      $('homeChapterTitle').textContent = c.name;
      $('homeChapterDesc').textContent = c.desc;
      const dispo = jeux.filter(g => g.status === 'ready').length;
      $('homeChapterCount').innerHTML = compte(jeux.length, c.unit) + ' · <span class="chapitre-dispo">' +
        deuxChiffres(dispo) + ' disponible' + (dispo > 1 ? 's' : '') + '</span>';
      $('homeCards').innerHTML = jeux.map((g, i) => carte(g, (index + 1) + '.' + (i + 1), i)).join('');
      afficherPlanche(c.image);
    }
    if (defiler) {
      const tete = $('homeChapter');
      if (tete.getBoundingClientRect().top > window.innerHeight - 160) {
        tete.scrollIntoView({ behavior: sansAnimation() ? 'auto' : 'smooth', block: 'start' });
      }
    }
  }

  /* ---------- Fenêtre d'un groupe : un rectangle coupé en deux, une moitié par jeu ----------
     Rien d'autre : un clic sur une moitié ouvre la configuration du jeu ; Échap ou un clic à côté referme. */
  function moitie(g, numero) {
    const corps = contenu(g, numero);
    return g.status === 'ready'
      ? `<button type="button" class="duo-moitie" data-game="${g.id}">${corps}</button>`
      : `<div class="duo-moitie duo-moitie--bientot" aria-disabled="true">${corps}</div>`;
  }

  function ouvrirGroupe(id, numero) {
    const r = D.GROUP[id];
    if (!r || r.status !== 'ready') return;
    const f = $('homeDuo');
    f.setAttribute('aria-label', r.name);
    $('homeDuoChoix').innerHTML = r.games.map((g, i) => moitie(g, numero + '.' + (i + 1))).join('');
    f.showModal();
    f.focus();                         /* la fenêtre elle-même : Tab mène ensuite aux deux moitiés */
  }

  /* ---------- Planche du chapitre : l'ancienne s'efface pendant que la nouvelle apparaît ---------- */
  function afficherPlanche(id) {
    if (id === plancheAffichee) return;
    plancheAffichee = id;
    const p = PLANCHES[id];
    $('homeAtlas').hidden = !p;
    if (!p) return;
    const pl = document.createElement('div');
    pl.className = 'planche';
    pl.style.setProperty('--ratio', p.l / p.h);
    pl.setAttribute('role', 'img');
    pl.setAttribute('aria-label', p.description);
    pl.innerHTML = `<img src="${p.src}" alt="" draggable="false">` +
      p.reperes.map((r, i) => `<span class="planche-repere planche-repere--${r.cote}" style="left:${r.x}%;top:${r.y}%;--rang:${i}">` +
        `<span class="planche-etiquette">${esc(r.texte)}</span></span>`).join('') +
      (p.coeur ? `<span class="planche-coeur" style="left:${p.coeur.x}%;top:${p.coeur.y}%"></span>` : '');
    const cadre = $('homePlanche');
    const anciennes = [...cadre.querySelectorAll('.planche')];
    const fondu = anciennes.length > 0 && !sansAnimation();
    anciennes.forEach(a => {
      if (!fondu) return a.remove();
      a.classList.add('is-sortie');
      a.removeAttribute('role');
      a.setAttribute('aria-hidden', 'true');
      setTimeout(() => a.remove(), 400);
    });
    if (fondu) pl.classList.add('is-entree');
    cadre.appendChild(pl);
    $('homeLegend').textContent = p.legende();
  }

  /* ---------- Navigation ---------- */
  /* retour au menu (depuis la configuration ou les résultats) ; chId : chapitre à afficher */
  function showHome(chId) {
    clearTimeout(session.nextT);
    clearInterval(session.timer);
    session.phase = 'home';
    EN.clearMarks(); EN.setHoverEnabled(false); EN.closeBone(); EN.deactivateMuscles(); EN.deactivateSystems(); EN.showAll();
    NS.hideNotice(); NS.hideTip(); NS.setPrompt(null); NS.updateDock();
    ['qA', 'qB', 'feedback', 'reviewBox', 'setup', 'results'].forEach(id => { $(id).hidden = true; });
    $('app').className = 'mode-a';
    EN.pause();                        /* aucune 3D ne tourne derrière le menu */
    $('home').hidden = false;
    $('homeMsg').textContent = '';
    const i = chId ? D.CHAPTERS.findIndex(c => c.id === chId) : -1;
    if (i >= 0) aller(i, false);
  }

  /* lance la configuration d'un jeu disponible */
  function openGame(gameId) {
    const g = D.GAME[gameId];
    if (!g || g.status !== 'ready') return;
    session.game = g;
    $('brandSub').textContent = g.name;
    $('setupTitle').textContent = g.name;
    $('setupSub').textContent = g.tagline;
    const t = TINTS[g.tint] || TINTS.rose;
    const logo = $('setupLogo');
    logo.innerHTML = picto(g.icon);
    logo.style.setProperty('--teinte', t[0]);
    logo.style.setProperty('--teinte-ombre', t[1]);
    $('home').hidden = true;
    NS.showSetup();
  }

  /* version du jeu, en bas du menu (liste des jeux : ../COMMUN/jeux.js ; sans elle, rien n'est affiché) */
  function afficherVersion() {
    const jeu = window.Jeux && Jeux.liste.find(j => j.id === 'anotehomy');
    if (jeu && jeu.version) $('homeVersion').textContent = 'Anotehomy Quizz · version ' + jeu.version;
  }

  function initHome() {
    renderChapters();
    afficherVersion();
    $('homeChapters').addEventListener('click', e => {
      const b = e.target.closest('[data-index]');
      if (b) aller(Number(b.dataset.index), true);
    });
    $('homeCards').addEventListener('click', e => {
      const g = e.target.closest('[data-game]');
      if (g) return openGame(g.dataset.game);
      const r = e.target.closest('[data-group]');
      if (r) ouvrirGroupe(r.dataset.group, r.querySelector('.carte-index').textContent);
    });
    const duo = $('homeDuo');
    duo.addEventListener('click', e => {
      if (e.target === duo) return duo.close();            /* clic à côté du rectangle */
      const g = e.target.closest('[data-game]');
      if (g) { duo.close(); openGame(g.dataset.game); }
    });
    /* « ← Menu » de la configuration : retour au chapitre du jeu */
    document.addEventListener('click', e => {
      const n = e.target.closest('[data-nav]');
      if (!n) return;
      showHome(n.dataset.nav === 'cat' && session.game ? session.game.chapter : null);
    });
    /* flèches du clavier : chapitre précédent ou suivant (sauf pendant une saisie ; Alt + ← = page précédente) */
    document.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || $('home').hidden) return;
      if (e.target.closest && e.target.closest('input, select, textarea, dialog')) return;
      e.preventDefault();
      aller(courant + (e.key === 'ArrowRight' ? 1 : -1), false);
    });
    session.game = D.GAMES.find(g => g.status === 'ready');
    const memorise = D.CHAPTERS.findIndex(c => c.id === lire());
    aller(memorise >= 0 ? memorise : 0, false);
    showHome();
  }

  Object.assign(NS, { initHome, showHome, openGame, ICONS: ICONS, picto });
})(AQ.game);
