/* ==========================================================================
   ACCUEIL/admin.js — Tableau de bord de l'administrateur (page d'accueil)

   Affiché à la place de la liste des jeux quand le compte administrateur (nom « admin ») est connecté :
   ACCUEIL/accueil.js appelle AccueilAdmin.ouvrir() et fermer(). En tête, quelques chiffres, puis deux
   onglets :
     - Comptes : tous les comptes (création, dernière visite, jeux où il a des statistiques). Pour
       chacun : « Mot de passe » (le remplacer ; ses autres connexions sont fermées) et « Supprimer »
       (compte et statistiques de tous les jeux, après confirmation). L'administrateur ne se supprime pas.
     - Défi de la semaine : pour la semaine choisie (lundi → dimanche ; la semaine à venir d'abord), une
       carte par mode de jeu (les `modes` de chaque jeu, dans COMMUN/jeux.js). Un défi (titre, consigne,
       façon de jouer, nombre de questions, difficulté, statut brouillon ou prêt) se prépare dans une
       fenêtre, avec son aperçu tel que les joueurs le verront. Les jeux ne lisent pas encore ces défis.
   Tout passe par Comptes.admin (COMMUN/comptes.js) ; le serveur refuse ces routes aux autres comptes.
   ========================================================================== */
(function () {
  'use strict';

  if (!window.Comptes) return;
  const C = window.Comptes;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const JEUX = window.Jeux ? window.Jeux.liste.filter((j) => j.modes && j.modes.length) : [];
  const JOUR = 864e5;
  const DIFFICULTES = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' };
  const QUESTIONS_MAX = 200;

  let ouvert = false;
  let generation = 0;                   // change à chaque ouverture ou fermeture : une réponse arrivée après est ignorée
  let onglet = 'comptes';
  let comptes = null;                   // [{ id, nom, couleur, admin?, cree, vu, jeux }] ; null : pas encore reçus
  let defis = null;                     // semaine -> jeu -> mode -> défi ; null : pas encore reçus
  let recherche = '';
  let panneau = null;                   // { id, sorte: 'mdp' | 'supprimer' } : formulaire ouvert sous un compte
  let decalage = 1;                     // semaine affichée, par rapport à la semaine en cours
  let edition = null;                   // { j, m, s, defi } : défi ouvert dans la fenêtre

  const initiale = (nom) => (String(nom).trim().charAt(0) || '?').toUpperCase();
  const avatar = (c) => '<span class="avatar" style="--avatar:' + esc(c.couleur) + '" aria-hidden="true">' + esc(initiale(c.nom)) + '</span>';
  const dateCourte = (iso) => new Date(iso).toLocaleDateString('fr-FR');
  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
  const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const normaliser = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const jeuDe = (id) => JEUX.find((j) => j.id === id) || (window.Jeux && window.Jeux.liste.find((j) => j.id === id)) || null;

  /* ---------- Semaines (ISO : du lundi au dimanche, « 2026-W45 ») ---------- */
  function lundiDe(d) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - (x.getDay() + 6) % 7);
    return x;
  }
  function semaine(dec) {
    const lundi = lundiDe(new Date());
    lundi.setDate(lundi.getDate() + 7 * dec);
    const dimanche = new Date(lundi);
    dimanche.setDate(lundi.getDate() + 6);
    const jeudi = new Date(lundi);
    jeudi.setDate(lundi.getDate() + 3);                       // la semaine appartient à l'année de son jeudi
    const annee = jeudi.getFullYear();
    const numero = 1 + Math.round((lundi - lundiDe(new Date(annee, 0, 4))) / (7 * JOUR));
    return { cle: annee + '-W' + String(numero).padStart(2, '0'), numero, lundi, dimanche };
  }
  function periode(s) {
    const memeMois = s.lundi.getMonth() === s.dimanche.getMonth();
    return 'du ' + s.lundi.toLocaleDateString('fr-FR', memeMois ? { weekday: 'long', day: 'numeric' } : { weekday: 'long', day: 'numeric', month: 'long' }) +
      ' au ' + s.dimanche.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  const quand = (d) => (d === 0 ? 'En cours' : d === 1 ? 'À venir' : d > 1 ? 'Dans ' + d + ' semaines' : d === -1 ? 'Semaine passée' : 'Il y a ' + -d + ' semaines');

  const defisDe = (s) => (defis && defis[s.cle]) || {};
  const metaDe = (d) => [d.variante, d.questions ? pluriel(d.questions, 'question') : '', DIFFICULTES[d.difficulte] || ''].filter(Boolean).join(' · ');

  /* ---------- Chiffres ---------- */
  function rendreChiffres() {
    const joueurs = comptes ? comptes.filter((c) => !c.admin) : null;
    const t = Date.now();
    const nombre = (f) => (joueurs ? joueurs.filter(f).length : '…');
    const s = semaine(1);
    const total = JEUX.reduce((n, j) => n + j.modes.length, 0);
    const prets = defis ? JEUX.reduce((n, j) => n + Object.values(defisDe(s)[j.id] || {}).filter((d) => d.statut === 'pret').length, 0) : '…';
    const chiffre = (valeur, libelle) => '<div class="chiffre"><b>' + valeur + '</b><span>' + libelle + '</span></div>';
    $('#admin-chiffres').innerHTML =
      chiffre(joueurs ? joueurs.length : '…', 'Joueurs inscrits') +
      chiffre(nombre((c) => c.vu && t - Date.parse(c.vu) < 7 * JOUR), 'Venus ces 7 derniers jours') +
      chiffre(nombre((c) => c.cree && t - Date.parse(c.cree) < 30 * JOUR), 'Nouveaux comptes sur 30 jours') +
      chiffre(prets + ' <small>/ ' + total + '</small>', 'Défis prêts pour la semaine ' + s.numero);
  }

  /* ---------- Onglets ---------- */
  function afficherOnglet(o, focus) {
    onglet = o;
    ['comptes', 'defis'].forEach((x) => {
      const t = $('#onglet-' + x);
      t.setAttribute('aria-selected', String(x === o));
      t.tabIndex = x === o ? 0 : -1;
      $('#panneau-' + x).hidden = x !== o;
    });
    if (focus) $('#onglet-' + o).focus();
  }

  /* ---------- Comptes ---------- */
  function visite(iso) {
    if (!iso) return '<span class="attenue" title="Aucune connexion ouverte">—</span>';
    const jours = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / JOUR);
    return jours <= 0 ? 'Aujourd\'hui' : jours === 1 ? 'Hier' : jours < 7 ? 'Il y a ' + jours + ' jours' : dateCourte(iso);
  }

  function jeuxDe(c) {
    const ids = Object.keys(c.jeux || {});
    if (!ids.length) return '<span class="attenue">Aucun</span>';
    return '<span class="rang__jeux">' + ids.map((id) => {
      const j = jeuDe(id);
      const titre = (j ? j.nom : id) + (c.jeux[id] ? ' · statistiques du ' + dateCourte(c.jeux[id]) : '');
      return '<span title="' + esc(titre) + '" role="img" aria-label="' + esc(titre) + '">' + esc(j ? j.icone : id) + '</span>';
    }).join('') + '</span>';
  }

  const cellule = (libelle, contenu, classe) => '<div class="rang__cellule' + (classe ? ' ' + classe : '') + '" data-libelle="' + libelle + '">' +
    '<span class="vh">' + libelle + ' : </span>' + contenu + '</div>';

  function panneauHtml(c, soi) {
    if (panneau.sorte === 'mdp') {
      return '<form class="rang__panneau" data-form="mdp" data-id="' + esc(c.id) + '">' +
        '<input type="text" name="username" autocomplete="username" value="' + esc(c.nom) + '" hidden>' +
        '<p><b>Nouveau mot de passe pour « ' + esc(c.nom) + ' »</b></p>' +
        '<div class="rang__champs">' +
          '<label class="champ">Nouveau mot de passe<input name="mdp" type="password" autocomplete="new-password" minlength="' + C.MDP_MIN + '" required></label>' +
          '<label class="champ">Confirmer<input name="confirmation" type="password" autocomplete="new-password" required></label>' +
        '</div>' +
        '<p class="note">' + (soi ? 'Vos autres appareils devront se reconnecter.'
          : 'Ses connexions en cours sont fermées : il se reconnectera avec ce mot de passe, à lui transmettre.') + '</p>' +
        '<p class="message message--erreur" role="alert"></p>' +
        '<div class="form__boutons"><button type="submit" class="btn btn--plein">Enregistrer</button>' +
        '<button type="button" class="btn btn--doux" data-action="annuler">Annuler</button></div></form>';
    }
    return '<div class="rang__panneau rang__panneau--danger" data-id="' + esc(c.id) + '">' +
      '<p><b>Supprimer « ' + esc(c.nom) + ' » ?</b> Son compte et ses statistiques de tous les jeux disparaissent. C\'est définitif.</p>' +
      '<p class="message message--erreur" role="alert"></p>' +
      '<div class="form__boutons"><button type="button" class="btn btn--danger" data-action="confirmer">Supprimer définitivement</button>' +
      '<button type="button" class="btn btn--doux" data-action="annuler">Annuler</button></div></div>';
  }

  function rang(c) {
    const moi = C.compte();
    const soi = !!(moi && moi.id === c.id);
    const ici = panneau && panneau.id === c.id;
    return '<article class="rang' + (ici ? ' is-ouvert' : '') + '" aria-label="' + esc(c.nom) + '">' +
      '<div class="rang__qui">' + avatar(c) + '<span class="rang__nom texte"><b>' + esc(c.nom) + '</b></span>' +
        (c.admin ? '<span class="badge badge--admin">Administrateur</span>' : '') + (soi && !c.admin ? '<span class="badge">Vous</span>' : '') + '</div>' +
      cellule('Créé le', c.cree ? dateCourte(c.cree) : '—') +
      cellule('Dernière visite', visite(c.vu)) +
      cellule('Jeux', jeuxDe(c), 'rang__cellule--jeux') +
      '<div class="rang__actions">' +
        '<button type="button" class="btn btn--doux btn--petit" data-action="mdp" data-id="' + esc(c.id) + '" aria-expanded="' +
          !!(ici && panneau.sorte === 'mdp') + '" aria-label="Changer le mot de passe de ' + esc(c.nom) + '">Mot de passe</button>' +
        (c.admin ? '' : '<button type="button" class="btn btn--doux btn--petit" data-action="supprimer" data-id="' + esc(c.id) + '" aria-expanded="' +
          !!(ici && panneau.sorte === 'supprimer') + '" aria-label="Supprimer le compte de ' + esc(c.nom) + '">Supprimer</button>') +
      '</div>' +
      (ici ? panneauHtml(c, soi) : '') +
    '</article>';
  }

  function rendreComptes() {
    const zone = $('#comptes-liste');
    if (!comptes) { zone.innerHTML = '<p class="vide">Chargement des comptes…</p>'; return; }
    const q = normaliser(recherche.trim());
    // L'administrateur d'abord, puis les dernières visites
    const liste = comptes.filter((c) => !q || normaliser(c.nom).includes(q))
      .sort((a, b) => (b.admin ? 1 : 0) - (a.admin ? 1 : 0) || (b.vu || '').localeCompare(a.vu || '') || a.nom.localeCompare(b.nom, 'fr'));
    zone.innerHTML = '<div class="rang rang--tete" aria-hidden="true"><span>Joueur</span><span>Créé le</span><span>Dernière visite</span><span>Jeux</span><span></span></div>' +
      (liste.length ? liste.map(rang).join('') : '<p class="vide">Aucun compte ne correspond à « ' + esc(recherche.trim()) + ' ».</p>');
  }

  function messageComptes(texte, erreur) {
    const m = $('#comptes-message');
    m.textContent = texte;
    m.classList.toggle('message--erreur', !!erreur);
  }

  // Requête lancée depuis le formulaire ouvert sous un compte : ses boutons sont désactivés pendant l'attente
  async function agir(zone, action, reussite) {
    const boutons = zone.querySelectorAll('button');
    boutons.forEach((b) => { b.disabled = true; });
    try {
      await action();
      reussite();
    } catch (err) {
      boutons.forEach((b) => { b.disabled = false; });
      zone.querySelector('.message--erreur').textContent = err.message;
    }
  }

  function brancherComptes() {
    $('#comptes-recherche').addEventListener('input', (e) => { recherche = e.target.value; rendreComptes(); });
    $('#comptes-actualiser').addEventListener('click', () => { messageComptes(''); chargerComptes(); });
    const zone = $('#comptes-liste');
    zone.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-action]');
      if (!b || b.disabled) return;
      const id = b.dataset.id || (b.closest('[data-id]') || {}).dataset.id;
      const c = comptes && comptes.find((x) => x.id === id);
      if (!c) return;
      const action = b.dataset.action;
      if (action === 'mdp' || action === 'supprimer') {
        panneau = panneau && panneau.id === id && panneau.sorte === action ? null : { id, sorte: action };
        messageComptes('');
        rendreComptes();
        const p = zone.querySelector('.rang__panneau');
        if (p) (p.querySelector('input[type="password"]') || p.querySelector('button')).focus();
      } else if (action === 'annuler') {
        panneau = null;
        rendreComptes();
        const retour = zone.querySelector('button[data-id="' + CSS.escape(id) + '"]');
        if (retour) retour.focus();
      } else if (action === 'confirmer') {
        agir(b.closest('.rang__panneau'), () => C.admin.supprimer(id), () => {
          comptes = comptes.filter((x) => x.id !== id);
          panneau = null;
          messageComptes('Compte « ' + c.nom + ' » supprimé, avec ses statistiques.');
          rendreComptes();
          rendreChiffres();
          $('#comptes-recherche').focus();
        });
      }
    });
    zone.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const c = comptes && comptes.find((x) => x.id === f.dataset.id);
      if (!c) return;
      const erreur = f.querySelector('.message--erreur');
      if (f.elements.mdp.value.length < C.MDP_MIN) { erreur.textContent = 'Mot de passe trop court (' + C.MDP_MIN + ' caractères au moins).'; return; }
      if (f.elements.mdp.value !== f.elements.confirmation.value) { erreur.textContent = 'Les deux mots de passe ne sont pas identiques.'; return; }
      agir(f, () => C.admin.changerMotDePasse(c.id, f.elements.mdp.value), () => {
        panneau = null;
        messageComptes('Mot de passe de « ' + c.nom + ' » changé.');
        rendreComptes();
        chargerComptes();                 // ses connexions fermées : sa dernière visite change
      });
    });
  }

  async function chargerComptes() {
    const g = generation;
    try {
      const liste = await C.admin.comptes();
      if (g !== generation) return;
      comptes = liste;
      if (panneau && !comptes.some((c) => c.id === panneau.id)) panneau = null;
    } catch (err) {
      if (g !== generation) return;
      messageComptes(err.message, true);
      if (!comptes) { comptes = []; }
    }
    rendreComptes();
    rendreChiffres();
  }

  /* ---------- Défis de la semaine ---------- */
  const PUCES = { vide: ['', 'À préparer'], brouillon: ['puce--brouillon', 'Brouillon'], pret: ['puce--pret', 'Prêt'] };
  const puce = (etat) => '<span class="puce ' + PUCES[etat][0] + '">' + PUCES[etat][1] + '</span>';

  function carte(j, m, d) {
    const etat = d ? d.statut : 'vide';
    const meta = d ? metaDe(d) : '';
    return '<article class="defi is-' + etat + '">' +
      '<div class="defi__puces">' + puce(etat) +
        (m.bientot ? '<span class="puce" title="Mode annoncé, pas encore jouable">Mode à venir</span>' : '') + '</div>' +
      '<h4 class="defi__mode">' + esc(m.nom) + '</h4>' +
      (d ? '<p class="defi__titre">' + esc(d.titre) + '</p>' + (d.consigne ? '<p class="defi__consigne">' + esc(d.consigne) + '</p>' : '') +
          (meta ? '<p class="defi__meta">' + esc(meta) + '</p>' : '')
        : '<p class="defi__vide">Aucun défi pour cette semaine.</p>') +
      '<button type="button" class="btn ' + (d ? 'btn--doux' : 'btn--contour') + ' btn--petit defi__bouton" data-jeu="' + esc(j.id) +
        '" data-mode="' + esc(m.id) + '" aria-label="' + (d ? 'Modifier' : 'Préparer') + ' le défi : ' + esc(m.nom) + '">' + (d ? 'Modifier' : 'Préparer le défi') + '</button>' +
    '</article>';
  }

  function blocJeu(j, s) {
    const dj = defisDe(s)[j.id] || {};
    const n = (statut) => j.modes.filter((m) => dj[m.id] && dj[m.id].statut === statut).length;
    const prets = n('pret');
    const brouillons = n('brouillon');
    const part = (x) => (100 * x / j.modes.length).toFixed(2) + '%';
    const groupes = [];
    j.modes.forEach((m) => {
      let g = groupes.find((x) => x.nom === (m.groupe || ''));
      if (!g) groupes.push(g = { nom: m.groupe || '', modes: [] });
      g.modes.push(m);
    });
    return '<section class="defis-jeu" aria-labelledby="defis-' + esc(j.id) + '">' +
      '<header class="defis-jeu__tete">' +
        '<div class="defis-jeu__nom"><span class="defis-jeu__icone" aria-hidden="true">' + esc(j.icone) + '</span>' +
          '<div><h2 id="defis-' + esc(j.id) + '">' + esc(j.nom) + '</h2><small>' + pluriel(j.modes.length, 'mode') + ' de jeu</small></div></div>' +
        '<div class="progression"><span><b>' + prets + '</b> prêt' + (prets > 1 ? 's' : '') + ' · <b>' + brouillons + '</b> brouillon' +
          (brouillons > 1 ? 's' : '') + ' · sur ' + j.modes.length + '</span>' +
          '<span class="progression__barre" aria-hidden="true"><span class="is-pret" style="width:' + part(prets) + '"></span>' +
          '<span class="is-brouillon" style="width:' + part(brouillons) + '"></span></span></div>' +
      '</header>' +
      groupes.map((g) => (g.nom ? '<h3 class="defis-groupe">' + esc(g.nom) + '</h3>' : '') +
        '<div class="defis-grille">' + g.modes.map((m) => carte(j, m, dj[m.id])).join('') + '</div>').join('') +
    '</section>';
  }

  function rendreDefis() {
    const s = semaine(decalage);
    $('#semaine-titre').innerHTML = 'Semaine ' + s.numero + ' <span class="puce' + (decalage === 1 ? ' puce--accent' : '') + '">' + quand(decalage) + '</span>';
    $('#semaine-dates').textContent = majuscule(periode(s));
    $('#semaine-avenir').hidden = decalage === 1;
    const zone = $('#defis-jeux');
    if (!defis) { zone.innerHTML = '<p class="vide">Chargement des défis…</p>'; return; }
    zone.innerHTML = JEUX.length ? JEUX.map((j) => blocJeu(j, s)).join('')
      : '<p class="vide">Aucun mode de jeu : la liste des modes est dans COMMUN/jeux.js.</p>';
  }

  function messageDefis(texte, erreur) {
    const m = $('#defis-message');
    m.textContent = texte;
    m.classList.toggle('message--erreur', !!erreur);
  }

  async function chargerDefis() {
    const g = generation;
    try {
      const d = await C.admin.defis();
      if (g !== generation) return;
      defis = d;
    } catch (err) {
      if (g !== generation) return;
      messageDefis(err.message, true);
      if (!defis) defis = {};
    }
    rendreDefis();
    rendreChiffres();
  }

  /* Fenêtre d'un défi */
  const form = () => $('#defi-form');

  function lireFormulaire() {
    const f = form();
    const q = f.elements.questions.value.trim();
    return {
      titre: f.elements.titre.value.trim(),
      consigne: f.elements.consigne.value.trim(),
      variante: f.elements.variante.value,
      questions: q ? Number(q) : null,
      difficulte: f.elements.difficulte.value,
      statut: f.elements.statut.value || 'brouillon'
    };
  }

  function majApercu() {
    const d = lireFormulaire();
    const e = edition;
    const meta = metaDe(Object.assign({}, d, { questions: Number.isInteger(d.questions) && d.questions > 0 ? d.questions : null }));
    $('#defi-apercu').innerHTML =
      '<div class="apercu__carte">' +
        '<p class="apercu__sur"><span aria-hidden="true">🏆</span> Défi de la semaine · S' + e.s.numero + '</p>' +
        '<p class="apercu__titre' + (d.titre ? '' : ' is-vide') + '">' + esc(d.titre || 'Titre du défi') + '</p>' +
        '<p class="apercu__consigne' + (d.consigne ? '' : ' is-vide') + '">' + esc(d.consigne || 'La consigne apparaîtra ici.') + '</p>' +
        '<p class="apercu__meta"><span>' + esc(e.j.icone + ' ' + e.m.nom) + '</span>' + (meta ? '<span>' + esc(meta) + '</span>' : '') + '</p>' +
        '<p class="apercu__dates">' + esc(majuscule(periode(e.s))) + '</p>' +
      '</div>' +
      '<p class="apercu__note">' + (d.statut === 'pret'
        ? 'Prêt : il sera proposé aux joueurs cette semaine-là, dès que ' + esc(e.j.nom) + ' saura afficher les défis.'
        : 'Brouillon : seul l\'administrateur le voit.') + '</p>';
  }

  function ouvrirDefi(jeuId, modeId) {
    const j = JEUX.find((x) => x.id === jeuId);
    const m = j && j.modes.find((x) => x.id === modeId);
    if (!m) return;
    const s = semaine(decalage);
    const d = (defisDe(s)[j.id] || {})[m.id] || null;
    edition = { j, m, s, defi: d };
    const f = form();
    $('#defi-contexte').textContent = j.icone + ' ' + j.nom + ' · ' + m.nom + (m.bientot ? ' (bientôt)' : '');
    $('#defi-dialogue-titre').textContent = (d ? 'Modifier' : 'Préparer') + ' le défi de la semaine ' + s.numero;
    $('#defi-dates').textContent = majuscule(periode(s));
    f.elements.titre.value = d ? d.titre : '';
    f.elements.consigne.value = d ? d.consigne : '';
    const variantes = m.variantes || [];
    $('#defi-variante').hidden = !variantes.length;
    f.elements.variante.innerHTML = '<option value="">Au choix du joueur</option>' + variantes.map((v) => '<option>' + esc(v) + '</option>').join('');
    f.elements.variante.value = d && variantes.includes(d.variante) ? d.variante : '';
    f.elements.questions.value = d && d.questions ? d.questions : '';
    f.elements.difficulte.value = d ? d.difficulte : '';
    f.elements.statut.value = d ? d.statut : 'brouillon';
    $('#defi-erreur').textContent = '';
    const effacer = f.querySelector('[data-defi-action="effacer"]');
    effacer.hidden = !d;
    effacer.classList.remove('is-arme');
    effacer.textContent = 'Effacer ce défi';
    f.querySelectorAll('button').forEach((b) => { b.disabled = false; });
    majApercu();
    $('#defi-dialogue').showModal();
    f.elements.titre.focus();
  }

  async function enregistrerDefi(effacer) {
    const e = edition;
    const f = form();
    const erreur = $('#defi-erreur');
    let defi = null;
    if (!effacer) {
      defi = lireFormulaire();
      if (!defi.titre) { erreur.textContent = 'Donnez un titre au défi.'; f.elements.titre.focus(); return; }
      if (defi.questions !== null && !(Number.isInteger(defi.questions) && defi.questions >= 1 && defi.questions <= QUESTIONS_MAX)) {
        erreur.textContent = 'Nombre de questions : de 1 à ' + QUESTIONS_MAX + ', ou vide.';
        f.elements.questions.focus();
        return;
      }
    }
    erreur.textContent = '';
    f.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    try {
      const r = await C.admin.enregistrerDefi(e.s.cle, e.j.id, e.m.id, defi);
      const sem = defis[e.s.cle] || (defis[e.s.cle] = {});
      const dj = sem[e.j.id] || (sem[e.j.id] = {});
      if (r) dj[e.m.id] = r;
      else {
        delete dj[e.m.id];
        if (!Object.keys(dj).length) delete sem[e.j.id];
        if (!Object.keys(sem).length) delete defis[e.s.cle];
      }
      messageDefis(r ? 'Défi « ' + r.titre + ' » enregistré (' + (r.statut === 'pret' ? 'prêt' : 'brouillon') + ') : ' + e.m.nom + ', semaine ' + e.s.numero + '.'
        : 'Défi effacé : ' + e.m.nom + ', semaine ' + e.s.numero + '.');
      rendreDefis();
      rendreChiffres();
      $('#defi-dialogue').close();
    } catch (err) {
      f.querySelectorAll('button').forEach((b) => { b.disabled = false; });
      erreur.textContent = err.message;
    }
  }

  function brancherDefis() {
    const changer = (d) => { decalage = d; messageDefis(''); rendreDefis(); };
    $('#semaine-avant').addEventListener('click', () => changer(decalage - 1));
    $('#semaine-apres').addEventListener('click', () => changer(decalage + 1));
    $('#semaine-avenir').addEventListener('click', () => { changer(1); $('#semaine-apres').focus(); });
    $('#defis-jeux').addEventListener('click', (e) => {
      const b = e.target.closest('.defi__bouton');
      if (b) ouvrirDefi(b.dataset.jeu, b.dataset.mode);
    });

    const f = form();
    const dialogue = $('#defi-dialogue');
    f.addEventListener('input', majApercu);
    f.addEventListener('change', majApercu);
    f.addEventListener('submit', (e) => { e.preventDefault(); enregistrerDefi(false); });
    f.addEventListener('click', (e) => {
      const b = e.target.closest('[data-defi-action]');
      if (!b || b.disabled) return;
      if (b.dataset.defiAction === 'annuler') dialogue.close();
      else if (b.classList.contains('is-arme')) enregistrerDefi(true);
      else { b.classList.add('is-arme'); b.textContent = 'Confirmer l\'effacement'; }       // deux clics pour effacer
    });
    // Fermeture (Échap, croix, Annuler, enregistrement) : retour au bouton de la carte
    dialogue.addEventListener('close', () => {
      if (!edition) return;
      const b = $('.defi__bouton[data-jeu="' + CSS.escape(edition.j.id) + '"][data-mode="' + CSS.escape(edition.m.id) + '"]');
      edition = null;
      if (b) b.focus();
    });
  }

  /* ---------- Ouverture et fermeture du tableau de bord ---------- */
  function ouvrir() {
    ouvert = true;
    generation++;
    comptes = null;
    defis = null;
    panneau = null;
    messageComptes('');
    messageDefis('');
    afficherOnglet(onglet);
    rendreChiffres();
    rendreComptes();
    rendreDefis();
    chargerComptes();
    chargerDefis();
  }

  // Le compte change (déconnexion…) : rien ne reste affiché ni en mémoire
  function fermer() {
    if (!ouvert) return;
    ouvert = false;
    generation++;
    comptes = null;
    defis = null;
    panneau = null;
    edition = null;
    if ($('#defi-dialogue').open) $('#defi-dialogue').close();
    $('#comptes-liste').innerHTML = '';
    $('#defis-jeux').innerHTML = '';
    $('#admin-chiffres').innerHTML = '';
  }

  function brancherOnglets() {
    const ordre = ['comptes', 'defis'];
    ordre.forEach((o) => $('#onglet-' + o).addEventListener('click', () => afficherOnglet(o)));
    $('.onglets-admin').addEventListener('keydown', (e) => {
      const pas = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!pas) return;
      e.preventDefault();
      afficherOnglet(ordre[(ordre.indexOf(onglet) + pas + ordre.length) % ordre.length], true);
    });
  }

  brancherOnglets();
  brancherComptes();
  brancherDefis();

  window.AccueilAdmin = { ouvrir, fermer };
})();
