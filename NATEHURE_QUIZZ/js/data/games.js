/* ==========================================================================
   Natehure Quizz - data/games.js
   CATALOGUE DU MENU : les trois chapitres (grandes categories), puis leurs cartes (les jeux).
   --------------------------------------------------------------------------
   POUR AJOUTER UN JEU : une entree dans GAMES, avec son chapitre. status : 'ready' = jouable,
   'soon' = annonce mais grise (« Bientot »). L'ordre de GAMES est celui des cartes dans le menu.
   Les identifiants des jeux jouables ne doivent pas changer : les statistiques des joueurs y seront
   rangees, et les defis de la semaine les reprennent (../COMMUN/jeux.js, champ modes).
     chapter  chapitre de la carte (CHAPTERS)
     icon     pictogramme de la vignette (js/game/home.js, ICONS) ; tint : sa couleur (TINTS)
     tagline  phrase de la carte
     meta     reperes en bas de la carte (ex. « 60 arbres · Nommage · Ciblage »)
   AUCUN JEU N'EST ENCORE JOUABLE : toutes les cartes sont en 'soon'. Les nombres annonces dans
   meta sont les objectifs du catalogue a constituer, pas des donnees deja presentes.
   ========================================================================== */
(function (NS) {
  'use strict';

  const CHAPTERS = [
    { id: 'biologie', name: 'Biologie & Anatomie végétale', image: 'biologie', unit: ['jeu', 'jeux'],
      desc: 'Le fonctionnement interne des plantes : leurs organes, leur cellule, la photosynthèse, la circulation de la sève et les grandes familles botaniques.' },
    { id: 'flore', name: 'Flore, Arbres & Champignons', image: 'flore', unit: ['jeu', 'jeux'],
      desc: 'La nature libre, reconnue à l\'œil : arbres et feuilles, écorces, fleurs sauvages, champignons, et ce qu\'il ne faut surtout pas cueillir.' },
    { id: 'agriculture', name: 'Agriculture & Récoltes', image: 'agriculture', unit: ['jeu', 'jeux'],
      desc: 'Ce que l\'on cultive et quand on le récolte : saisonnalité des fruits et légumes, grandes cultures, sol vivant, potager et techniques agronomiques.' }
  ];

  const GAMES = [
    /* ---------- 1. Biologie & Anatomie végétale ---------- */
    { id: 'anatomie-plante', chapter: 'biologie', status: 'soon', icon: 'plante', tint: 'menthe',
      name: 'L\'anatomie de la plante',
      tagline: 'Nommer et situer les organes d\'une plante, de la racine à la graine.',
      desc: 'Une partie de la plante s\'illumine sur la planche : donnez son nom, ou montrez l\'organe demandé.',
      meta: 'Racine · tige · feuille · fleur · fruit' },
    { id: 'cellule-vegetale', chapter: 'biologie', status: 'soon', icon: 'cellule', tint: 'pousse',
      name: 'La cellule végétale',
      tagline: 'Reconnaître les organites et ce qui distingue la cellule végétale.',
      desc: 'Paroi, chloroplaste, vacuole, noyau, mitochondrie : identifiez chaque organite et sa fonction.',
      meta: 'Paroi · chloroplaste · vacuole' },
    { id: 'photosynthese', chapter: 'biologie', status: 'soon', icon: 'soleil', tint: 'soleil',
      name: 'La photosynthèse',
      tagline: 'Suivre la lumière, l\'eau et le gaz carbonique jusqu\'aux sucres.',
      desc: 'Remettez le bilan dans l\'ordre, distinguez phase claire et cycle de Calvin, et situez chaque échange.',
      meta: 'Phase claire · cycle de Calvin' },
    { id: 'seve', chapter: 'biologie', status: 'soon', icon: 'seve', tint: 'eau',
      name: 'La sève et les vaisseaux',
      tagline: 'Comprendre comment l\'eau monte et où partent les sucres.',
      desc: 'Xylème et phloème, transpiration, pression racinaire : retrouvez le trajet de chaque sève.',
      meta: 'Xylème · phloème · transpiration' },
    { id: 'familles-botaniques', chapter: 'biologie', status: 'soon', icon: 'famille', tint: 'lichen',
      name: 'Les familles botaniques',
      tagline: 'Rattacher une plante à sa famille sur ses caractères constants.',
      desc: 'Rosacées, Fabacées, Astéracées, Lamiacées : reconnaissez la famille d\'une espèce, et ses cousines.',
      meta: 'Objectif : 40 familles' },
    { id: 'fleur', chapter: 'biologie', status: 'soon', icon: 'fleur', tint: 'fleur',
      name: 'La fleur et la pollinisation',
      tagline: 'Nommer les pièces florales et suivre le pollen jusqu\'à la graine.',
      desc: 'Sépales, pétales, étamines, pistil : identifiez chaque pièce, puis chaque mode de pollinisation.',
      meta: 'Étamine · pistil · pollinisateurs' },

    /* ---------- 2. Flore, Arbres & Champignons ---------- */
    { id: 'arbres-feuilles', chapter: 'flore', status: 'soon', icon: 'feuille', tint: 'menthe',
      name: 'Les arbres et leurs feuilles',
      tagline: 'Reconnaître un arbre à sa feuille, feuillus comme résineux.',
      desc: 'Une feuille est présentée seule : nommez l\'arbre dont elle vient, ou montrez la feuille demandée.',
      meta: 'Objectif : 60 arbres' },
    { id: 'ecorces', chapter: 'flore', status: 'soon', icon: 'arbre', tint: 'ecorce',
      name: 'Les écorces et les silhouettes',
      tagline: 'Identifier un arbre en hiver, sans ses feuilles.',
      desc: 'Une écorce ou une silhouette nue : retrouvez l\'espèce quand la feuille ne peut plus aider.',
      meta: 'Écorce · port · bourgeons' },
    { id: 'fleurs-sauvages', chapter: 'flore', status: 'soon', icon: 'fleur', tint: 'fleur',
      name: 'Les fleurs sauvages',
      tagline: 'Nommer les fleurs des prés, des bois et des bords de chemin.',
      desc: 'Une fleur sauvage photographiée sur le terrain : donnez son nom commun, ou son nom scientifique.',
      meta: 'Objectif : 150 espèces' },
    { id: 'champignons', chapter: 'flore', status: 'soon', icon: 'champignon', tint: 'terre',
      name: 'Les champignons',
      tagline: 'Reconnaître un champignon à son chapeau, son pied et ses lames.',
      desc: 'Chapeau, lames ou tubes, anneau, volve : identifiez l\'espèce et le milieu où elle pousse.',
      meta: 'Objectif : 80 espèces' },
    { id: 'toxiques', chapter: 'flore', status: 'soon', icon: 'danger', tint: 'amanite',
      name: 'Comestible ou toxique ?',
      tagline: 'Trier ce qui se mange, ce qui rend malade et ce qui tue.',
      desc: 'Une espèce et son sosie dangereux côte à côte : désignez le comestible, et dites ce qui les sépare.',
      meta: 'Confusions · sosies · symptômes' },
    { id: 'herbier', chapter: 'flore', status: 'soon', icon: 'herbier', tint: 'lichen',
      name: 'L\'herbier',
      tagline: 'Retrouver une espèce à partir de sa fiche d\'herbier.',
      desc: 'Milieu, floraison, taille, usages : une fiche sans son nom, à rattacher à la bonne espèce.',
      meta: 'Fiches · milieux · floraisons' },

    /* ---------- 3. Agriculture & Récoltes ---------- */
    { id: 'saisons', chapter: 'agriculture', status: 'soon', icon: 'calendrier', tint: 'terre',
      name: 'Fruits et légumes de saison',
      tagline: 'Savoir ce qui se récolte, et à quel mois.',
      desc: 'Un fruit ou un légume : placez-le sur le calendrier des récoltes, ou dites ce qui est de saison ce mois-ci.',
      meta: '12 mois · pleine saison' },
    { id: 'grandes-cultures', chapter: 'agriculture', status: 'soon', icon: 'epi', tint: 'soleil',
      name: 'Les grandes cultures',
      tagline: 'Reconnaître les cultures qui couvrent les plaines.',
      desc: 'Blé, orge, maïs, colza, tournesol, betterave : identifiez la culture, son cycle et ce qu\'on en tire.',
      meta: 'Céréales · oléagineux · fourrages' },
    { id: 'sol-vivant', chapter: 'agriculture', status: 'soon', icon: 'sol', tint: 'pousse',
      name: 'Le sol vivant',
      tagline: 'Lire un profil de sol, de la litière à la roche mère.',
      desc: 'Horizons, humus, argile, vers de terre : situez chaque couche et reconnaissez un sol à sa texture.',
      meta: 'Horizons · humus · texture' },
    { id: 'potager', chapter: 'agriculture', status: 'soon', icon: 'potager', tint: 'menthe',
      name: 'Le potager',
      tagline: 'Semer, repiquer, associer : les gestes au bon moment.',
      desc: 'Semis, plantation, éclaircissage, bonnes et mauvaises associations : retrouvez le geste et sa date.',
      meta: 'Semis · repiquage · associations' },
    { id: 'techniques', chapter: 'agriculture', status: 'soon', icon: 'tracteur', tint: 'ecorce',
      name: 'Les techniques agronomiques',
      tagline: 'Nommer les pratiques qui font une parcelle, d\'une année sur l\'autre.',
      desc: 'Rotation, assolement, jachère, engrais verts, labour ou semis direct : reliez chaque pratique à son effet.',
      meta: 'Rotation · jachère · amendements' },
    { id: 'terroirs', chapter: 'agriculture', status: 'soon', icon: 'terroir', tint: 'eau',
      name: 'Les terroirs et les appellations',
      tagline: 'Situer une production sur la carte, et savoir ce que protège son signe.',
      desc: 'AOP, IGP, label rouge : placez la production sur la carte de France et dites ce que garantit son signe.',
      meta: 'AOP · IGP · régions' }
  ];

  /* Index par identifiant : les cartes du menu et, plus tard, les ecrans de configuration */
  const GAME = {};
  GAMES.forEach(g => { GAME[g.id] = g; });

  Object.assign(NS, { CHAPTERS, GAMES, GAME });
})(NQ.data);
