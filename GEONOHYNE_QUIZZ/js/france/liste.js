/* ==========================================================================
   france/liste.js — Jeu « La Liste des Départements »

   Écran en deux étapes :
     1. les options : quoi deviner (départements et préfectures, départements seuls, ou préfectures
        seules), le périmètre (toute la France, 101 départements, OU une seule région ; les cinq
        départements d'Outre-Mer forment ensemble le groupe « Outre-Mer »), le tri, la carte ;
     2. la liste des départements du périmètre, en colonnes :
          Code (Région) | Département | Préfecture
        Le code et la région (« Grand Est », « PACA », « Outre-Mer ») sont écrits d'avance. En mode
        « préfectures », les départements le sont aussi ; en mode « départements », la colonne des
        préfectures n'est pas affichée.
        Toute la France se trie par code, ou par région (ordre alphabétique, Outre-Mer en dernier)
        puis par code : chaque région a alors son intertitre. Le tri se choisit dans les options
        et se change pendant la partie.

   Il faut citer tous les noms à deviner, dans l'ordre qu'on veut et sans les associer : on tape un
   nom, Entrée, et il se place tout seul sur sa ligne (« Paris » remplit les deux colonnes).
   Majuscules, accents, espaces, tirets et apostrophes ne comptent pas (« illeetvilaine » =
   « Ille-et-Vilaine ») ; l'article du début peut être omis (« Réunion ») et « St » vaut « Saint ».
   Une saisie fausse n'est pas pénalisée : un message l'explique.

   Carte (option) : à côté de la liste (au-dessus sur petit écran), chaque département du périmètre
   est gris tant que rien n'est trouvé, hachuré de vert quand la moitié l'est (mode « les deux »),
   vert quand tout l'est ; en fin de partie, ceux dont rien n'a été trouvé passent en rouge. Ni noms,
   ni clic, ni survol : il faut se souvenir de quel département il s'agit. Pas de limites de régions.

   Indices, séparés pour les départements et les préfectures (boutons sous le titre de la colonne) :
     Initiale   montre l'initiale d'un nom au hasard (« Q… ») ;
     Révéler    écrit un nom en entier, en rouge : il compte comme non trouvé. On révèle d'abord un
                nom dont l'initiale est déjà affichée.
   Un chronomètre tourne jusqu'à ce que tout soit trouvé ou révélé ; « Abandonner » révèle le reste.
   Une petite fenêtre fait le bilan : « Recommencer », « Afficher la liste » ou « Menu ».

   Données : data/france/infos-departements.js (région, préfecture), noms de la carte de France.
   ========================================================================== */
(function () {
  'use strict';

  const INFOS = (window.GeoInfos || {})['france-departements'];
  const CARTE = window.GeoCarte && GeoCarte.obtenir('france-departements');
  if (!INFOS || !CARTE) {
    console.error('france/liste.js : data/france/infos-departements.js et carte-departements.js doivent être chargés avant');
    return;
  }

  const TOUT = 'tout';
  const OUTRE_MER = 'Outre-Mer';
  const DELAI_FIN = 600;            // pause avant la fenêtre de fin (ms) : le temps de voir le dernier nom
  const CLE = 'geonohyne.liste.perimetre';   // dernier périmètre choisi (mémorisé)
  const CLE_ORDRE = 'geonohyne.liste.ordre'; // dernier tri choisi : 'code' ou 'region' (mémorisé)
  const CLE_DEVINER = 'geonohyne.liste.deviner';   // quoi deviner : 'tout', 'dep' ou 'pref' (mémorisé)
  const CLE_CARTE = 'geonohyne.liste.carte';       // '1' : carte affichée (mémorisé)
  const DEVINER = {
    tout: { champs: ['dep', 'pref'], saisie: 'un département ou une préfecture',
      aide: 'Tous les départements et toutes les préfectures du périmètre, sans les associer.' },
    dep: { champs: ['dep'], saisie: 'un département',
      aide: 'Seulement les départements (la colonne des préfectures n\'est pas affichée).' },
    pref: { champs: ['pref'], saisie: 'une préfecture',
      aide: 'Seulement les préfectures : les noms des départements sont écrits d\'avance.' }
  };

  // La région est écrite en entier dans la liste, sauf ces raccourcis (nom complet au survol).
  // Les DOM y sont notés « Outre-Mer » : leur région porte le nom du département, ce serait la réponse.
  const RACCOURCIS = { 'Provence-Alpes-Côte d\'Azur': 'PACA' };
  // Autres noms acceptés pour une préfecture (les services du Val-d'Oise sont installés à Cergy)
  const ALIAS_PREFECTURES = { '95': ['Cergy', 'Cergy-Pontoise'] };
  const CHAMPS = { dep: { un: 'département', le: 'le département', e: '' }, pref: { un: 'préfecture', le: 'la préfecture', e: 'e' } };

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // On ignore les majuscules, les accents, les espaces, les tirets, les apostrophes… : « illeetvilaine »
  const reduire = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .replace(/\bst(e?)\b/g, 'saint$1')              // « St-Brieuc », « St Denis »
    .replace(/[^a-z0-9]/g, '');
  const ARTICLE = /^(le\s+|la\s+|les\s+|l['’]\s*)/i;
  const hasard = (t) => t[Math.floor(Math.random() * t.length)];
  const sansAnimation = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function formaterTemps(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const mmss = String(Math.floor(s / 60) % 60).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    return h ? h + ':' + mmss : mmss;
  }

  // Formes acceptées d'un nom : le nom, et le nom sans son article (« La Réunion » → « Réunion »)
  function cles(noms) {
    const res = new Set();
    noms.forEach((n) => { res.add(reduire(n)); res.add(reduire(n.replace(ARTICLE, ''))); });
    return res;
  }

  // Initiale affichée par l'indice ; l'article reste écrit : « Le M… », « La R… »
  function initiale(nom) {
    const m = nom.match(ARTICLE);
    const article = m ? m[0] : '';
    return article + nom.charAt(article.length).toUpperCase() + '…';
  }

  /* ---------- Les lignes : un département, sa région et sa préfecture ---------- */
  // Ordre des codes : 2A et 2B entre 19 et 21, les DOM à la fin
  const rang = (c) => (c === '2A' ? 20.1 : c === '2B' ? 20.2 : parseInt(c, 10));
  const LIGNES = CARTE.elements.filter((e) => INFOS.zones[e.code]).map((e) => {
    const i = INFOS.zones[e.code];
    const prefecture = i.prefecture.replace(/\s*\(.*\)\s*$/, '');      // « Pontoise (préfecture installée à Cergy) »
    const groupe = e.code.length === 3 ? OUTRE_MER : i.region;
    return {
      code: e.code,
      region: i.region,
      groupe,
      libelle: RACCOURCIS[groupe] || groupe,
      dep: { nom: e.nom, cles: cles([e.nom]) },
      pref: { nom: prefecture, cles: cles([prefecture].concat(ALIAS_PREFECTURES[e.code] || [])) }
    };
  }).sort((a, b) => rang(a.code) - rang(b.code));

  // Périmètres : toute la France, puis les régions (ordre alphabétique), Outre-Mer en dernier
  const GROUPES = [...new Set(LIGNES.map((l) => l.groupe))]
    .sort((a, b) => (a === OUTRE_MER) - (b === OUTRE_MER) || a.localeCompare(b, 'fr'));
  const nomPerimetre = (g) => (g === TOUT ? 'Toute la France' : g);
  const lignesDe = (g) => LIGNES.filter((l) => g === TOUT || l.groupe === g);
  // Le tri par région n'a de sens que si le périmètre en compte plusieurs (toute la France)
  const plusieursRegions = (g) => new Set(lignesDe(g).map((l) => l.groupe)).size > 1;

  /* ---------- État ---------- */
  // Statut de chaque nom : 'vide', 'initiale' (indice affiché), 'trouve', 'revele' (rouge, non trouvé),
  // 'donne' (pas à deviner : écrit d'avance, ou colonne masquée)
  let perimetre = TOUT;
  let ordre = 'code';              // tri de la liste : 'code' ou 'region'
  let deviner = 'tout';            // 'tout', 'dep' ou 'pref'
  let avecCarte = false;
  let api = null;                  // outils de js/core.js (carte)
  let p = null;                    // partie en cours

  try {
    const m = localStorage.getItem(CLE);
    if (m === TOUT || GROUPES.includes(m)) perimetre = m;
    if (localStorage.getItem(CLE_ORDRE) === 'region') ordre = 'region';
    if (DEVINER[localStorage.getItem(CLE_DEVINER)]) deviner = localStorage.getItem(CLE_DEVINER);
    avecCarte = localStorage.getItem(CLE_CARTE) === '1';
  } catch (e) { /* stockage indisponible : réglages par défaut */ }
  const memoriser = (cle, valeur) => {
    try { localStorage.setItem(cle, valeur); } catch (err) { /* stockage indisponible : valable pour la session */ }
  };

  function nouvellePartie() {
    arreterChrono();
    const lignes = lignesDe(perimetre);
    const champs = DEVINER[deviner].champs;
    const statuts = (champ) => lignes.map(() => (champs.includes(champ) ? 'vide' : 'donne'));
    p = {
      perimetre,
      lignes,
      champs,                      // ce qu'il faut deviner : ['dep', 'pref'], ['dep'] ou ['pref']
      carte: avecCarte,
      statut: { dep: statuts('dep'), pref: statuts('pref') },
      initiales: 0,                // indices « Initiale » utilisés
      debut: Date.now(),
      duree: 0,
      chrono: null,
      fini: false,
      abandon: false
    };
    $('#liste-titre').textContent = nomPerimetre(perimetre) + ' · ' + lignes.length + ' département' + (lignes.length > 1 ? 's' : '');
    $('#liste-total-dep').textContent = lignes.length;
    $('#liste-total-pref').textContent = lignes.length;
    $('#liste-tri').classList.toggle('hidden', !plusieursRegions(perimetre));
    $('.liste-table').dataset.deviner = deviner;     // colonnes, compteurs et indices affichés (css)
    preparerCarte();
    dessinerListe();
    const saisie = $('#liste-saisie');
    saisie.value = '';
    saisie.disabled = false;
    saisie.placeholder = DEVINER[deviner].saisie.charAt(0).toUpperCase() + DEVINER[deviner].saisie.slice(1) + ', puis Entrée…';
    $('#liste-valider').disabled = false;
    $('#liste-abandon').disabled = false;
    retour('idle', 'Le chrono tourne ! Tapez ' + DEVINER[deviner].saisie + ', puis Entrée.');
    majCompteurs();
    majChrono();
    p.chrono = setInterval(() => {
      // Écran quitté (menu) : la partie s'arrête
      if ($('#screen-liste').classList.contains('hidden')) return arreterChrono();
      majChrono();
    }, 250);
    saisie.focus();
  }

  function arreterChrono() {
    if (p) clearInterval(p.chrono);
  }

  // Partie commencée (au moins un nom trouvé ou un indice), pas terminée
  const enCours = () => p && !p.fini && p.champs.some((c) => p.statut[c].some((s) => s !== 'vide'));

  /* ---------- Carte (option) ---------- */

  // La carte de France, sans limites de régions, ni noms, ni clic ; les départements hors du
  // périmètre sont estompés et la vue se cadre sur le périmètre (⤢ y revient)
  function preparerCarte() {
    $('#liste-zone').classList.toggle('avec-carte', p.carte);
    $('#screen-liste').classList.toggle('avec-carte', p.carte);
    $('#liste-carte').classList.toggle('hidden', !p.carte);
    $('#liste-legende-moitie').classList.toggle('hidden', p.champs.length < 2);
    if (!p.carte) return;
    $('#liste-carte').prepend($('#map-wrap'));       // la carte est partagée avec les autres écrans
    api.carte(CARTE, { titre: 'La Liste des Départements', carte: 'france-departements' });
    // Hachures vertes des départements trouvés à moitié (couleurs dans css/style.css)
    $('#map').insertAdjacentHTML('afterbegin',
      '<defs><pattern id="liste-hachures" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect class="liste-hachures-fond" width="8" height="8"/><rect class="liste-hachures-trait" width="4" height="8"/>' +
      '</pattern></defs>');
    const dedans = new Set(p.lignes.map((l) => l.code));
    api.zones.forEach((z, code) => z.el.classList.toggle('hors-quiz', !dedans.has(code)));
    const cadres = $('#map').querySelector('#cadres');           // encadrés de l'Outre-Mer
    if (cadres) cadres.classList.toggle('hors-quiz', !p.lignes.some((l) => l.groupe === OUTRE_MER));
    if (p.perimetre === TOUT) api.reinitialiserVue();
    else api.cadrerSur([...dedans]);
  }

  // Couleur d'un département : part trouvée de ce qu'il faut deviner (rien, la moitié, tout)
  function majCarte(i) {
    if (!p.carte) return;
    const n = p.champs.filter((c) => p.statut[c][i] === 'trouve').length;
    api.etat(p.lignes[i].code, n === p.champs.length ? 'ok' : n ? 'moitie' : p.fini ? 'ko' : 'idle');
  }

  /* ---------- Affichage ---------- */

  function retour(type, html) {
    const f = $('#liste-feedback');
    f.className = 'fb fb-' + type;
    f.innerHTML = '<span>' + html + '</span>';
  }

  // Les lignes du tableau, par code ou par région (intertitre de région, puis les codes).
  // p.lignes reste dans l'ordre des codes : le numéro de ligne (data-i) ne dépend pas du tri.
  function dessinerListe() {
    const parRegion = ordre === 'region' && plusieursRegions(p.perimetre);
    const ordreLignes = p.lignes.map((_, i) => i);
    if (parRegion) {
      ordreLignes.sort((a, b) => GROUPES.indexOf(p.lignes[a].groupe) - GROUPES.indexOf(p.lignes[b].groupe) || a - b);
    }
    const colonnes = deviner === 'dep' ? 2 : 3;      // mode « départements » : pas de colonne des préfectures
    let html = '';
    let groupe = null;
    ordreLignes.forEach((i) => {
      const l = p.lignes[i];
      if (parRegion && l.groupe !== groupe) {
        groupe = l.groupe;
        const n = p.lignes.filter((x) => x.groupe === groupe).length;
        html += '<tr class="liste-groupe"><th colspan="' + colonnes + '" scope="colgroup">' + esc(groupe) +
          ' <span>· ' + n + ' département' + (n > 1 ? 's' : '') + '</span></th></tr>';
      }
      html += '<tr data-i="' + i + '">' +
        '<th scope="row"><span class="liste-code">' + esc(l.code) + '</span>' +
          (parRegion ? '' : ' <span class="liste-region"' + (l.libelle !== l.groupe ? ' title="' + esc(l.groupe) + '"' : '') +
            '>(' + esc(l.libelle) + ')</span>') + '</th>' +
        '<td data-champ="dep"></td>' +
        (colonnes === 3 ? '<td data-champ="pref"></td>' : '') +
      '</tr>';
    });
    $('#liste-corps').innerHTML = html;
    $('.liste-table').classList.toggle('liste-table--regions', parRegion);
    p.lignes.forEach((_, i) => { rendreCase('dep', i); rendreCase('pref', i); });
    $('#liste-tableau').scrollTop = 0;
  }

  function cellule(champ, i) {
    return $('#liste-corps').querySelector('tr[data-i="' + i + '"] td[data-champ="' + champ + '"]');
  }

  // nouveau : petit éclair de couleur (nom qui vient d'être trouvé ou révélé)
  function rendreCase(champ, i, nouveau) {
    majCarte(i);
    const td = cellule(champ, i);
    if (!td) return;                                 // colonne masquée (mode « départements »)
    const s = p.statut[champ][i];
    const nom = p.lignes[i][champ].nom;
    td.className = 'liste-case liste-case--' + s + (nouveau ? ' is-nouveau' : '');
    td.textContent = s === 'trouve' || s === 'revele' || s === 'donne' ? nom : s === 'initiale' ? initiale(nom) : '';
    td.parentElement.classList.toggle('is-complete', p.champs.every((c) => p.statut[c][i] === 'trouve'));
  }

  // Fait défiler la liste jusqu'au nom qui vient de changer
  function montrer(champ, i) {
    cellule(champ, i).scrollIntoView({ block: 'nearest', behavior: sansAnimation() ? 'auto' : 'smooth' });
  }

  const compter = (champ, statut) => p.statut[champ].filter((s) => s === statut).length;

  function majCompteurs() {
    $('#liste-nb-dep').textContent = compter('dep', 'trouve');
    $('#liste-nb-pref').textContent = compter('pref', 'trouve');
    document.querySelectorAll('[data-indice]').forEach((b) => {
      b.disabled = p.fini || !candidats(b.dataset.champ, b.dataset.indice).length;
    });
  }

  function majChrono() {
    $('#liste-chrono').textContent = formaterTemps(p.fini ? p.duree : Date.now() - p.debut);
  }

  /* ---------- Saisie ---------- */

  function proposer(texte) {
    if (!p || p.fini) return;
    const t = reduire(texte);
    if (!t) return;
    const saisie = $('#liste-saisie');
    const nouveaux = [];             // { champ, i } trouvés par cette saisie
    const deja = [];                 // { champ, i } déjà trouvés ou révélés
    p.lignes.forEach((l, i) => p.champs.forEach((champ) => {
      if (!l[champ].cles.has(t)) return;
      (p.statut[champ][i] === 'trouve' || p.statut[champ][i] === 'revele' ? deja : nouveaux).push({ champ, i });
    }));

    if (nouveaux.length) {
      nouveaux.forEach(({ champ, i }) => { p.statut[champ][i] = 'trouve'; rendreCase(champ, i, true); });
      montrer(nouveaux[0].champ, nouveaux[0].i);
      const nom = p.lignes[nouveaux[0].i][nouveaux[0].champ].nom;
      retour('ok', '✅ <strong>' + esc(nom) + '</strong> : ' + (nouveaux.length > 1
        ? 'département et préfecture trouvés.'
        : CHAMPS[nouveaux[0].champ].un + ' trouvé' + CHAMPS[nouveaux[0].champ].e + '.'));
      saisie.value = '';
      majCompteurs();
      return verifierFin();
    }

    if (deja.length) {
      const { champ, i } = deja[0];
      const revele = p.statut[champ][i] === 'revele';
      retour('idle', '<strong>' + esc(p.lignes[i][champ].nom) + '</strong> : ' + CHAMPS[champ].un + ' déjà ' +
        (revele ? 'révélé' : 'trouvé') + CHAMPS[champ].e + '.');
      montrer(champ, i);
      saisie.value = '';
      return;
    }

    // Un nom de ce qui n'est pas à deviner (ex. un département quand on cherche les préfectures)
    const autre = Object.keys(CHAMPS).find((c) => !p.champs.includes(c));
    const pasADeviner = autre && LIGNES.find((l) => l[autre].cles.has(t));
    if (pasADeviner) {
      retour('idle', '<strong>' + esc(pasADeviner[autre].nom) + '</strong> est ' +
        (autre === 'dep' ? 'un département : ici, seules les préfectures sont à trouver.'
                         : 'une préfecture : ici, seuls les départements sont à trouver.'));
      saisie.value = '';
      return;
    }

    // Un nom juste, mais hors du périmètre (ex. « Nord » dans la liste de la Bretagne)
    let ailleurs = null;
    LIGNES.forEach((l) => p.champs.forEach((champ) => {
      if (!ailleurs && l[champ].cles.has(t)) ailleurs = { l, champ };
    }));
    retour('ko', ailleurs
      ? '❌ <strong>' + esc(ailleurs.l[ailleurs.champ].nom) + '</strong> est ' + (ailleurs.champ === 'dep' ? 'un département' : 'une préfecture') +
        (ailleurs.l.groupe === OUTRE_MER ? ' d\'Outre-Mer' : ' de la région ' + esc(ailleurs.l.region)) + ', pas de cette liste.'
      : '❌ « ' + esc(texte.trim()) + ' » : ' + (deviner === 'tout' ? 'aucun département ni aucune préfecture'
        : deviner === 'dep' ? 'aucun département' : 'aucune préfecture') + ' de la liste.');
    saisie.select();                 // on corrige la faute de frappe, ou on tape par-dessus
  }

  /* ---------- Indices ---------- */

  // Lignes auxquelles un indice peut s'appliquer. « Révéler » prend d'abord un nom dont l'initiale
  // est déjà affichée (celui sur lequel le joueur bloque), sinon un nom encore vide.
  function candidats(champ, indice) {
    const avec = (statut) => p.statut[champ].map((s, i) => (s === statut ? i : -1)).filter((i) => i >= 0);
    if (indice === 'initiale') return avec('vide');
    const bloques = avec('initiale');
    return bloques.length ? bloques : avec('vide');
  }

  function donnerIndice(champ, indice) {
    if (!p || p.fini) return;
    const choix = candidats(champ, indice);
    if (!choix.length) return;
    const i = hasard(choix);
    const l = p.lignes[i];
    if (indice === 'initiale') {
      p.statut[champ][i] = 'initiale';
      p.initiales++;
      retour('idle', '💡 Initiale d\'' + (champ === 'dep' ? 'un département' : 'une préfecture') + ' : ligne ' +
        esc(l.code) + ' (' + esc(l.libelle) + ').');
    } else {
      p.statut[champ][i] = 'revele';
      retour('ko', '👁 Révélé' + CHAMPS[champ].e + ' : <strong>' + esc(l[champ].nom) + '</strong>, ' +
        CHAMPS[champ].le + ' du ' + esc(l.code) + '.');
    }
    rendreCase(champ, i, true);
    montrer(champ, i);
    majCompteurs();
    verifierFin();
  }

  /* ---------- Fin de partie ---------- */

  function verifierFin() {
    const reste = Object.keys(CHAMPS).some((c) => p.statut[c].some((s) => s === 'vide' || s === 'initiale'));
    if (!reste) terminer();
  }

  function abandonner() {
    if (!p || p.fini) return;
    if (enCours() && !confirm('Abandonner et afficher toute la liste ?')) return;
    p.abandon = true;
    Object.keys(CHAMPS).forEach((champ) => p.statut[champ].forEach((s, i) => {
      if (s === 'vide' || s === 'initiale') { p.statut[champ][i] = 'revele'; rendreCase(champ, i); }
    }));
    terminer();
  }

  function terminer() {
    p.fini = true;
    p.duree = Date.now() - p.debut;
    arreterChrono();
    majChrono();
    majCompteurs();
    $('#liste-saisie').disabled = true;
    $('#liste-valider').disabled = true;
    $('#liste-abandon').disabled = true;

    p.lignes.forEach((_, i) => majCarte(i));        // rien trouvé : rouge
    const total = p.lignes.length * p.champs.length;
    const trouves = p.champs.reduce((n, c) => n + compter(c, 'trouve'), 0);
    const reveles = total - trouves;
    const temps = formaterTemps(p.duree);
    const parfait = !reveles && !p.initiales;
    retour(reveles ? 'idle' : 'ok', (p.abandon ? '🏳️ Partie abandonnée' : parfait ? '🏆 Liste complète' : '🎉 Liste terminée') +
      ' en ' + temps + ' : ' + trouves + ' nom' + (trouves > 1 ? 's' : '') + ' trouvé' + (trouves > 1 ? 's' : '') + ' sur ' + total +
      (reveles > 1 ? ', les ' + reveles + ' autres sont en rouge.' : reveles ? ', l\'autre est en rouge.' : '.'));

    const partie = p;
    setTimeout(() => {
      // Entre-temps : nouvelle partie, retour aux options ou au menu → pas de fenêtre
      if (p !== partie || $('#screen-liste').classList.contains('hidden') || $('#liste-jeu').classList.contains('hidden')) return;
      $('#liste-fin-emoji').textContent = p.abandon ? '🏳️' : parfait ? '🏆' : reveles ? '📋' : '🎉';
      $('#liste-fin-titre').textContent = p.abandon ? 'Partie abandonnée' : reveles ? 'Liste terminée' : 'Liste complète !';
      const n = p.lignes.length;
      const s = n > 1 ? 's' : '';
      $('#liste-fin-texte').textContent = nomPerimetre(p.perimetre) + ' : ' +
        (deviner === 'pref' ? n + ' préfecture' + s : n + ' département' + s + (deviner === 'tout' ? ' et autant de préfectures' : '')) +
        (parfait ? ', sans aucun indice.' : '.');
      $('#liste-fin-trouves').textContent = trouves;
      $('#liste-fin-trouves-label').textContent = 'Trouvés sur ' + total;
      $('#liste-fin-reveles').textContent = reveles;
      $('#liste-fin-temps').textContent = temps;
      $('#liste-fin-indices').textContent = p.initiales
        ? '💡 ' + p.initiales + ' initiale' + (p.initiales > 1 ? 's' : '') + ' demandée' + (p.initiales > 1 ? 's' : '') + '.'
        : '';
      $('#liste-fin').showModal();
    }, DELAI_FIN);
  }

  /* ---------- Interface ---------- */

  // Deux étapes : le périmètre, puis la liste
  function afficherEtape(etape) {
    if (etape === 'options') arreterChrono();
    $('#liste-options').classList.toggle('hidden', etape !== 'options');
    $('#liste-jeu').classList.toggle('hidden', etape !== 'jeu');
    $('#screen-liste').classList.toggle('is-jeu', etape === 'jeu');
    window.scrollTo(0, 0);
  }

  // Tri de la liste : les boutons des options et ceux de la partie restent synchronisés
  function definirOrdre(o) {
    ordre = o;
    document.querySelectorAll('[data-liste-ordre]').forEach((b) => {
      const actif = b.dataset.listeOrdre === o;
      b.classList.toggle('is-active', actif);
      b.setAttribute('aria-pressed', String(actif));
    });
    memoriser(CLE_ORDRE, o);
  }

  // Quoi deviner : départements et préfectures, départements, ou préfectures
  function definirDeviner(d) {
    deviner = d;
    document.querySelectorAll('[data-liste-deviner]').forEach((b) => {
      const actif = b.dataset.listeDeviner === d;
      b.classList.toggle('is-active', actif);
      b.setAttribute('aria-pressed', String(actif));
    });
    $('#liste-deviner-aide').textContent = DEVINER[d].aide;
    memoriser(CLE_DEVINER, d);
  }

  function dessinerPerimetres() {
    const liste = $('#liste-perimetres');
    liste.innerHTML = '';
    [TOUT].concat(GROUPES).forEach((g) => {
      const label = document.createElement('label');
      label.className = 'chip-check';
      const choix = document.createElement('input');
      choix.type = 'radio';
      choix.name = 'liste-perimetre';
      choix.value = g;
      choix.checked = g === perimetre;
      const texte = document.createElement('span');
      texte.textContent = nomPerimetre(g) + ' · ' + lignesDe(g).length;
      label.append(choix, texte);
      liste.appendChild(label);
      if (g === TOUT) liste.appendChild(Object.assign(document.createElement('span'), { className: 'groupes-saut' }));
    });
  }

  function brancher() {
    dessinerPerimetres();
    $('#liste-perimetres').addEventListener('change', (e) => {
      if (e.target.name !== 'liste-perimetre') return;
      perimetre = e.target.value;
      $('#liste-ordre-wrap').classList.toggle('hidden', !plusieursRegions(perimetre));
      memoriser(CLE, perimetre);
    });
    document.querySelectorAll('[data-liste-deviner]').forEach((b) => b.addEventListener('click', () => {
      definirDeviner(b.dataset.listeDeviner);
    }));
    $('#liste-carte-option').addEventListener('change', (e) => {
      avecCarte = e.target.checked;
      memoriser(CLE_CARTE, avecCarte ? '1' : '0');
    });
    document.querySelectorAll('[data-liste-ordre]').forEach((b) => b.addEventListener('click', () => {
      definirOrdre(b.dataset.listeOrdre);
      if (!p || $('#liste-jeu').classList.contains('hidden')) return;
      dessinerListe();                 // en pleine partie : la liste se retrie, rien n'est perdu
      if (!p.fini) $('#liste-saisie').focus();
    }));
    $('#liste-lancer').addEventListener('click', () => {
      afficherEtape('jeu');
      nouvellePartie();
    });
    $('#liste-retour').addEventListener('click', () => {
      if (enCours() && !confirm('Quitter la liste en cours ?')) return;
      afficherEtape('options');
    });
    $('#liste-recommencer').addEventListener('click', () => {
      if (enCours() && !confirm('Recommencer la liste ? Le chrono repart de zéro.')) return;
      nouvellePartie();
    });
    $('#liste-abandon').addEventListener('click', abandonner);
    $('#liste-form').addEventListener('submit', (e) => {
      e.preventDefault();
      proposer($('#liste-saisie').value);
    });
    $('#liste-tableau').addEventListener('click', (e) => {
      const b = e.target.closest('[data-indice]');
      if (!b || b.disabled) return;
      donnerIndice(b.dataset.champ, b.dataset.indice);
      $('#liste-saisie').focus();    // on continue à taper sans reprendre la souris
    });
    // Fin de l'éclair de couleur
    $('#liste-corps').addEventListener('animationend', (e) => e.target.classList.remove('is-nouveau'));

    // Fenêtre de fin : un bouton, Échap ou un clic à côté la ferment (= « Afficher la liste »).
    // « Menu » (data-action="menu") est traité ensuite par js/core.js.
    const fin = $('#liste-fin');
    fin.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      const r = fin.getBoundingClientRect();
      const dehors = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      if (!b && !dehors) return;
      fin.close();
      if (b && b.dataset.fin === 'rejouer') nouvellePartie();
    });
  }

  let branche = false;
  GeoNohyne.registerJeu({
    id: 'liste',
    titre: 'La Liste des Départements',
    icone: '📝',
    description: 'Citez les départements, leurs préfectures ou les deux, d\'une région ou de toute la France, chrono en main.',
    ecran: 'screen-liste',
    sansCarte: true,                   // la carte (option) est placée par ce module, à côté de la liste
    // pas de clic(code) : la carte n'est pas cliquable, il faut se souvenir des départements

    ouvrir(outils) {
      api = outils;
      if (!branche) { brancher(); branche = true; }
      definirOrdre(ordre);
      definirDeviner(deviner);
      $('#liste-carte-option').checked = avecCarte;
      $('#liste-ordre-wrap').classList.toggle('hidden', !plusieursRegions(perimetre));
      afficherEtape('options');        // on choisit d'abord le périmètre, puis « Lancer la partie »
    }
  });
})();
