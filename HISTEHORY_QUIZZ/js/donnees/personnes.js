


/* ==========================================================================
   Histehory Quizz - js/donnees/personnes.js
   RECENSEMENT DES PERSONNES HISTORIQUES (données seules : aucun mode de jeu ne les utilise encore).
   --------------------------------------------------------------------------
   Une ligne par personne :
     P(id, nom, naissance, mort, sexe, région, pays, domaine, résumé, options)
       naissance, mort : années ; négatives avant notre ère (pas d'année 0 : -1 est suivi de 1)
       sexe     : "F" ou "M"
       région   : clé de REGIONS ; pays : nom actuel du ou des pays (« Pologne / France »)
       domaine  : clé de DOMAINES (le domaine principal de la personne)
       résumé   : une phrase, sans le nom de la personne
       options  : A = dates approximatives ou discutées (« vers ») ;
                  { e: "…" } = époque imposée (sinon : celle du milieu de la vie)
   Époques : Antiquité (avant 476), Moyen Âge (476-1452), époque moderne (1453-1788),
   époque contemporaine (1789 et après). Personnes décédées seulement.
   ========================================================================== */
(function () {
  'use strict';

  const REGIONS = {
    europe: 'Europe', afrique: 'Afrique', 'moyen-orient': 'Moyen-Orient', asie: 'Asie',
    ameriques: 'Amériques', oceanie: 'Océanie'
  };
  const DOMAINES = {
    politique: 'Politique', militaire: 'Militaire', religion: 'Religion', philosophie: 'Philosophie',
    sciences: 'Sciences', medecine: 'Médecine', litterature: 'Littérature et histoire', arts: 'Arts',
    musique: 'Musique', exploration: 'Exploration', economie: 'Économie', societe: 'Société et droits',
    sport: 'Sport', cinema: 'Cinéma et spectacle'
  };
  const EPOQUES = { antiquite: 'Antiquité', 'moyen-age': 'Moyen Âge', moderne: 'Époque moderne', contemporaine: 'Époque contemporaine' };
  const epoqueDe = an => an < 476 ? 'antiquite' : an < 1453 ? 'moyen-age' : an < 1789 ? 'moderne' : 'contemporaine';

  const PERSONNES = [];
  const A = { a: 1 };
  function P(id, nom, naissance, mort, sexe, region, pays, domaine, resume, o = {}) {
    PERSONNES.push({ id, nom, naissance, mort, sexe, region, pays, domaine, resume,
      approx: !!o.a, epoque: o.e || epoqueDe((naissance + mort) / 2) });
  }

  /* ---------------- Antiquité ---------------- */
  P("hammurabi", "Hammurabi", -1810, -1750, "M", "moyen-orient", "Irak", "politique", "Roi de Babylone, connu pour le code de lois gravé sur une stèle de basalte.", A);
  P("hatchepsout", "Hatchepsout", -1507, -1458, "F", "afrique", "Égypte", "politique", "Reine devenue pharaon, au règne prospère marqué par une expédition vers le pays de Pount.", A);
  P("akhenaton", "Akhenaton", -1380, -1336, "M", "afrique", "Égypte", "religion", "Pharaon qui imposa le culte du disque solaire Aton et fonda la ville d'Amarna.", A);
  P("nefertiti", "Néfertiti", -1370, -1330, "F", "afrique", "Égypte", "politique", "Grande épouse royale d'Akhenaton, célèbre par son buste peint conservé à Berlin.", A);
  P("toutankhamon", "Toutânkhamon", -1341, -1323, "M", "afrique", "Égypte", "politique", "Pharaon mort jeune, dont le tombeau presque intact fut découvert en 1922.", A);
  P("ramses-2", "Ramsès II", -1303, -1213, "M", "afrique", "Égypte", "politique", "Pharaon bâtisseur d'Abou Simbel, au très long règne, signataire d'un traité de paix avec les Hittites.", A);
  P("nabuchodonosor-2", "Nabuchodonosor II", -642, -562, "M", "moyen-orient", "Irak", "politique", "Roi de Babylone, conquérant de Jérusalem en 587 av. J.-C.", A);
  P("sappho", "Sappho", -630, -570, "F", "europe", "Grèce", "litterature", "Poétesse lyrique de l'île de Lesbos.", A);
  P("solon", "Solon", -640, -560, "M", "europe", "Grèce", "politique", "Législateur athénien qui abolit l'esclavage pour dettes.", A);
  P("thales", "Thalès de Milet", -624, -546, "M", "moyen-orient", "Turquie", "philosophie", "Philosophe et mathématicien, compté parmi les Sept Sages de la Grèce.", A);
  P("cyrus-2", "Cyrus II le Grand", -600, -530, "M", "moyen-orient", "Iran", "politique", "Fondateur de l'Empire perse achéménide, conquérant de Babylone.", A);
  P("mahavira", "Mahâvîra", -599, -527, "M", "asie", "Inde", "religion", "Maître spirituel qui donna sa forme au jaïnisme.", A);
  P("pythagore", "Pythagore", -570, -495, "M", "europe", "Grèce / Italie", "philosophie", "Philosophe et mathématicien de Samos, fondateur d'une école à Crotone.", A);
  P("bouddha", "Siddhartha Gautama (le Bouddha)", -563, -483, "M", "asie", "Népal / Inde", "religion", "Prince devenu ascète, fondateur du bouddhisme.", A);
  P("confucius", "Confucius", -551, -479, "M", "asie", "Chine", "philosophie", "Penseur dont la morale et l'enseignement ont façonné la culture chinoise.");
  P("darius-1", "Darius Ier", -550, -486, "M", "moyen-orient", "Iran", "politique", "Roi des Perses qui organisa l'empire en satrapies ; ses troupes furent battues à Marathon.", A);
  P("sun-tzu", "Sun Tzu", -544, -496, "M", "asie", "Chine", "militaire", "Stratège auquel est attribué « L'Art de la guerre ».", A);
  P("leonidas-1", "Léonidas Ier", -540, -480, "M", "europe", "Grèce", "militaire", "Roi de Sparte, mort en défendant le défilé des Thermopyles contre les Perses.", A);
  P("heraclite", "Héraclite", -535, -475, "M", "moyen-orient", "Turquie", "philosophie", "Philosophe d'Éphèse, penseur du changement perpétuel.", A);
  P("eschyle", "Eschyle", -525, -456, "M", "europe", "Grèce", "litterature", "Premier des grands tragiques grecs, auteur de l'« Orestie ».", A);
  P("xerxes-1", "Xerxès Ier", -518, -465, "M", "moyen-orient", "Iran", "politique", "Roi des Perses, vainqueur aux Thermopyles mais battu à Salamine.", A);
  P("parmenide", "Parménide", -515, -450, "M", "europe", "Italie", "philosophie", "Philosophe d'Élée, penseur de l'Être.", A);
  P("anaxagore", "Anaxagore", -500, -428, "M", "europe", "Grèce", "philosophie", "Philosophe qui enseigna à Athènes que le Soleil était une pierre incandescente.", A);
  P("sophocle", "Sophocle", -497, -406, "M", "europe", "Grèce", "litterature", "Tragique athénien, auteur d'« Œdipe roi » et d'« Antigone ».", A);
  P("pericles", "Périclès", -495, -429, "M", "europe", "Grèce", "politique", "Stratège qui domina la démocratie athénienne et fit bâtir le Parthénon.", A);
  P("empedocle", "Empédocle", -494, -434, "M", "europe", "Italie", "philosophie", "Philosophe d'Agrigente, théoricien des quatre éléments.", A);
  P("herodote", "Hérodote", -484, -425, "M", "moyen-orient", "Turquie", "litterature", "Historien des guerres médiques, surnommé le « père de l'Histoire ».", A);
  P("phidias", "Phidias", -480, -430, "M", "europe", "Grèce", "arts", "Sculpteur qui dirigea le décor du Parthénon.", A);
  P("euripide", "Euripide", -480, -406, "M", "europe", "Grèce", "litterature", "Tragique athénien, auteur de « Médée ».", A);
  P("socrate", "Socrate", -470, -399, "M", "europe", "Grèce", "philosophie", "Philosophe athénien condamné à boire la ciguë, connu par les dialogues de son disciple Platon.", A);
  P("aspasie", "Aspasie", -470, -400, "F", "europe", "Grèce", "societe", "Femme lettrée venue de Milet, compagne de Périclès, réputée pour son éloquence.", A);
  P("hippocrate", "Hippocrate", -460, -370, "M", "europe", "Grèce", "medecine", "Médecin de Cos, figure fondatrice de la médecine, à qui l'on rattache un célèbre serment.", A);
  P("democrite", "Démocrite", -460, -370, "M", "europe", "Grèce", "philosophie", "Philosophe qui imagina la matière faite d'atomes.", A);
  P("thucydide", "Thucydide", -460, -400, "M", "europe", "Grèce", "litterature", "Historien de la guerre du Péloponnèse.", A);
  P("aristophane", "Aristophane", -446, -386, "M", "europe", "Grèce", "litterature", "Poète comique athénien, auteur des « Nuées » et de « Lysistrata ».", A);
  P("platon", "Platon", -428, -348, "M", "europe", "Grèce", "philosophie", "Disciple de Socrate, fondateur de l'Académie, auteur de « La République ».", A);
  P("diogene", "Diogène de Sinope", -413, -323, "M", "europe", "Grèce", "philosophie", "Philosophe cynique qui vivait, dit-on, dans un tonneau.", A);
  P("aristote", "Aristote", -384, -322, "M", "europe", "Grèce", "philosophie", "Philosophe et savant, élève de Platon et précepteur d'Alexandre le Grand.");
  P("demosthene", "Démosthène", -384, -322, "M", "europe", "Grèce", "politique", "Orateur athénien, adversaire de Philippe II de Macédoine.");
  P("philippe-2-macedoine", "Philippe II de Macédoine", -382, -336, "M", "europe", "Grèce", "politique", "Roi de Macédoine qui imposa sa domination aux cités grecques ; père d'Alexandre.");
  P("theophraste", "Théophraste", -371, -287, "M", "europe", "Grèce", "sciences", "Successeur d'Aristote, considéré comme le père de la botanique.", A);
  P("ptolemee-1", "Ptolémée Ier Sôter", -367, -282, "M", "afrique", "Égypte", "politique", "Général d'Alexandre devenu roi d'Égypte, fondateur de la dynastie des Ptolémées.", A);
  P("alexandre-le-grand", "Alexandre le Grand", -356, -323, "M", "europe", "Grèce", "militaire", "Roi de Macédoine qui conquit l'Empire perse jusqu'à l'Indus.");
  P("epicure", "Épicure", -341, -270, "M", "europe", "Grèce", "philosophie", "Philosophe qui faisait du plaisir mesuré et de l'absence de trouble le but de la vie.");
  P("chandragupta-maurya", "Chandragupta Maurya", -340, -297, "M", "asie", "Inde", "politique", "Fondateur de l'Empire maurya, qui unifia le nord de l'Inde.", A);
  P("euclide", "Euclide", -325, -265, "M", "afrique", "Égypte", "sciences", "Mathématicien d'Alexandrie, auteur des « Éléments » de géométrie.", A);
  P("pyrrhus-1", "Pyrrhus Ier", -319, -272, "M", "europe", "Grèce", "militaire", "Roi d'Épire dont les victoires trop coûteuses contre Rome ont donné l'expression « victoire à la Pyrrhus ».");
  P("aristarque", "Aristarque de Samos", -310, -230, "M", "europe", "Grèce", "sciences", "Astronome qui proposa que la Terre tourne autour du Soleil.", A);
  P("ashoka", "Ashoka", -304, -232, "M", "asie", "Inde", "politique", "Empereur maurya converti au bouddhisme, qui fit graver ses édits sur des piliers et des rochers.", A);
  P("archimede", "Archimède", -287, -212, "M", "europe", "Italie", "sciences", "Savant de Syracuse, auteur du principe de la poussée des fluides.", A);
  P("eratosthene", "Ératosthène", -276, -194, "M", "afrique", "Égypte", "sciences", "Savant d'Alexandrie qui mesura la circonférence de la Terre.", A);
  P("hamilcar-barca", "Hamilcar Barca", -275, -228, "M", "afrique", "Tunisie", "militaire", "Général carthaginois de la première guerre punique, père d'Hannibal.", A);
  P("qin-shi-huang", "Qin Shi Huang", -259, -210, "M", "asie", "Chine", "politique", "Premier empereur de Chine, enterré avec une armée de soldats en terre cuite.");
  P("liu-bang", "Liu Bang", -256, -195, "M", "asie", "Chine", "politique", "Paysan devenu empereur, fondateur de la dynastie Han.", A);
  P("hannibal", "Hannibal Barca", -247, -183, "M", "afrique", "Tunisie", "militaire", "Général carthaginois qui franchit les Alpes avec des éléphants pour attaquer Rome.", A);
  P("massinissa", "Massinissa", -238, -148, "M", "afrique", "Algérie", "politique", "Roi numide, allié de Rome contre Carthage.", A);
  P("scipion-africain", "Scipion l'Africain", -236, -183, "M", "europe", "Italie", "militaire", "Général romain vainqueur d'Hannibal à Zama.");
  P("caton-ancien", "Caton l'Ancien", -234, -149, "M", "europe", "Italie", "politique", "Homme d'État romain qui répétait que « Carthage doit être détruite ».");
  P("polybe", "Polybe", -200, -118, "M", "europe", "Grèce", "litterature", "Historien grec de l'expansion romaine.", A);
  P("hipparque", "Hipparque", -190, -120, "M", "europe", "Grèce", "sciences", "Astronome qui dressa un catalogue d'étoiles et découvrit la précession des équinoxes.", A);
  P("jugurtha", "Jugurtha", -160, -104, "M", "afrique", "Algérie", "politique", "Roi numide longtemps en guerre contre Rome.", A);
  P("marius", "Caius Marius", -157, -86, "M", "europe", "Italie", "militaire", "Général romain sept fois consul, réformateur de l'armée.");
  P("sima-qian", "Sima Qian", -145, -86, "M", "asie", "Chine", "litterature", "Historien de la cour des Han, auteur des « Mémoires historiques ».", A);
  P("sylla", "Sylla", -138, -78, "M", "europe", "Italie", "politique", "Général romain qui se fit nommer dictateur.");
  P("mithridate-6", "Mithridate VI", -135, -63, "M", "moyen-orient", "Turquie", "politique", "Roi du Pont, longtemps adversaire de Rome, réputé insensible aux poisons.", A);
  P("crassus", "Crassus", -115, -53, "M", "europe", "Italie", "economie", "Homme le plus riche de Rome, membre du premier triumvirat avec César et Pompée.", A);
  P("ciceron", "Cicéron", -106, -43, "M", "europe", "Italie", "politique", "Avocat, orateur et consul romain.");
  P("pompee", "Pompée", -106, -48, "M", "europe", "Italie", "militaire", "Général romain, rival de César dans la guerre civile.");
  P("spartacus", "Spartacus", -103, -71, "M", "europe", "Italie", "militaire", "Gladiateur thrace, chef d'une grande révolte d'esclaves contre Rome.", A);
  P("jules-cesar", "Jules César", -100, -44, "M", "europe", "Italie", "politique", "Conquérant de la Gaule, dictateur assassiné aux ides de mars.");
  P("lucrece", "Lucrèce", -94, -55, "M", "europe", "Italie", "philosophie", "Poète latin du « De rerum natura », exposé de la philosophie d'Épicure.", A);
  P("brutus", "Brutus", -85, -42, "M", "europe", "Italie", "politique", "Sénateur romain, l'un des assassins de César.");
  P("marc-antoine", "Marc Antoine", -83, -30, "M", "europe", "Italie", "militaire", "Général romain, allié puis rival d'Octave, compagnon de Cléopâtre.");
  P("vercingetorix", "Vercingétorix", -80, -46, "M", "europe", "France", "militaire", "Chef arverne qui mena la résistance gauloise et capitula à Alésia.", A);
  P("herode-1", "Hérode Ier le Grand", -73, -4, "M", "moyen-orient", "Israël", "politique", "Roi de Judée qui fit agrandir le Temple de Jérusalem.", A);
  P("virgile", "Virgile", -70, -19, "M", "europe", "Italie", "litterature", "Poète latin, auteur de l'« Énéide ».");
  P("cleopatre-7", "Cléopâtre VII", -69, -30, "F", "afrique", "Égypte", "politique", "Dernière reine de l'Égypte des Ptolémées, alliée de César puis de Marc Antoine.");
  P("horace", "Horace", -65, -8, "M", "europe", "Italie", "litterature", "Poète latin des « Odes ».");
  P("strabon", "Strabon", -64, 24, "M", "moyen-orient", "Turquie", "sciences", "Géographe grec, auteur d'une « Géographie » du monde connu.", A);
  P("auguste", "Auguste", -63, 14, "M", "europe", "Italie", "politique", "Premier empereur romain.");
  P("agrippa", "Agrippa", -63, -12, "M", "europe", "Italie", "militaire", "Général et bras droit d'Auguste, vainqueur à Actium.", A);
  P("tite-live", "Tite-Live", -59, 17, "M", "europe", "Italie", "litterature", "Historien de Rome depuis sa fondation.", A);
  P("livie", "Livie", -58, 29, "F", "europe", "Italie", "politique", "Épouse d'Auguste et mère de Tibère, très influente à la cour.");
  P("juba-2", "Juba II", -48, 23, "M", "afrique", "Algérie / Maroc", "politique", "Roi savant de Maurétanie, époux de la fille de Cléopâtre.", A);
  P("wang-mang", "Wang Mang", -45, 23, "M", "asie", "Chine", "politique", "Usurpateur qui interrompit la dynastie Han en fondant sa propre dynastie.");
  P("ovide", "Ovide", -43, 17, "M", "europe", "Italie", "litterature", "Poète latin des « Métamorphoses », exilé au bord de la mer Noire.", A);
  P("tibere", "Tibère", -42, 37, "M", "europe", "Italie", "politique", "Deuxième empereur romain.");
  P("arminius", "Arminius", -18, 21, "M", "europe", "Allemagne", "militaire", "Chef germain qui anéantit trois légions romaines dans la forêt de Teutobourg.", A);
  P("claude", "Claude", -10, 54, "M", "europe", "France / Italie", "politique", "Empereur romain né à Lyon, qui lança la conquête de la Bretagne.");
  P("jesus", "Jésus de Nazareth", -4, 30, "M", "moyen-orient", "Israël", "religion", "Prédicateur juif crucifié à Jérusalem, figure centrale du christianisme.", A);
  P("seneque", "Sénèque", -4, 65, "M", "europe", "Espagne / Italie", "philosophie", "Philosophe stoïcien, précepteur de Néron.", A);
  P("paul-tarse", "Paul de Tarse", 5, 64, "M", "moyen-orient", "Turquie", "religion", "Apôtre qui répandit le christianisme dans le monde grec.", A);
  P("vespasien", "Vespasien", 9, 79, "M", "europe", "Italie", "politique", "Empereur romain qui lança la construction du Colisée.");
  P("heron-alexandrie", "Héron d'Alexandrie", 10, 70, "M", "afrique", "Égypte", "sciences", "Ingénieur, inventeur de l'éolipyle, une machine à vapeur rudimentaire.", A);
  P("trung-trac", "Trưng Trắc", 12, 43, "F", "asie", "Viêt Nam", "militaire", "Avec sa sœur Trưng Nhị, mena une révolte contre la domination chinoise.", A);
  P("caligula", "Caligula", 12, 41, "M", "europe", "Italie", "politique", "Empereur romain réputé pour ses excès, assassiné.");
  P("agrippine", "Agrippine la Jeune", 15, 59, "F", "europe", "Allemagne / Italie", "politique", "Impératrice, mère de Néron.");
  P("pline-ancien", "Pline l'Ancien", 23, 79, "M", "europe", "Italie", "sciences", "Naturaliste auteur d'une « Histoire naturelle », mort pendant l'éruption du Vésuve.");
  P("boudicca", "Boudicca", 30, 61, "F", "europe", "Royaume-Uni", "militaire", "Reine des Icènes, à la tête d'une révolte contre les Romains.", A);
  P("neron", "Néron", 37, 68, "M", "europe", "Italie", "politique", "Empereur romain, au pouvoir lors du grand incendie de Rome.");
  P("flavius-josephe", "Flavius Josèphe", 37, 100, "M", "moyen-orient", "Israël", "litterature", "Historien de la guerre des Juifs contre Rome.", A);
  P("ban-zhao", "Ban Zhao", 45, 117, "F", "asie", "Chine", "litterature", "Historienne qui acheva le « Livre des Han ».", A);
  P("plutarque", "Plutarque", 46, 125, "M", "europe", "Grèce", "litterature", "Auteur des « Vies parallèles des hommes illustres ».", A);
  P("cai-lun", "Cai Lun", 50, 121, "M", "asie", "Chine", "sciences", "Fonctionnaire de la cour des Han, traditionnellement crédité de l'invention du papier.", A);
  P("trajan", "Trajan", 53, 117, "M", "europe", "Espagne / Italie", "politique", "Empereur sous lequel l'Empire romain atteignit sa plus grande étendue.");
  P("tacite", "Tacite", 56, 120, "M", "europe", "Italie", "litterature", "Historien romain des « Annales ».", A);
  P("hadrien", "Hadrien", 76, 138, "M", "europe", "Espagne / Italie", "politique", "Empereur qui fit construire un mur à travers la Bretagne.");
  P("zhang-heng", "Zhang Heng", 78, 139, "M", "asie", "Chine", "sciences", "Astronome et inventeur d'un sismoscope.");
  P("claude-ptolemee", "Claude Ptolémée", 100, 170, "M", "afrique", "Égypte", "sciences", "Astronome d'Alexandrie, auteur de l'« Almageste », qui plaçait la Terre au centre du monde.", A);
  P("marc-aurele", "Marc Aurèle", 121, 180, "M", "europe", "Italie", "philosophie", "Empereur et philosophe stoïcien, auteur des « Pensées ».");
  P("galien", "Galien", 129, 216, "M", "moyen-orient", "Turquie", "medecine", "Médecin grec de Pergame dont les écrits firent autorité pendant des siècles.", A);
  P("septime-severe", "Septime Sévère", 145, 211, "M", "afrique", "Libye", "politique", "Empereur romain né à Leptis Magna.");
  P("nagarjuna", "Nāgārjuna", 150, 250, "M", "asie", "Inde", "philosophie", "Philosophe bouddhiste, fondateur de l'école de la Voie du milieu.", A);
  P("tertullien", "Tertullien", 155, 220, "M", "afrique", "Tunisie", "religion", "Écrivain chrétien de Carthage, premier grand théologien de langue latine.", A);
  P("cao-cao", "Cao Cao", 155, 220, "M", "asie", "Chine", "militaire", "Seigneur de guerre de la fin des Han, figure de l'époque des Trois Royaumes.");
  P("himiko", "Himiko", 170, 248, "F", "asie", "Japon", "politique", "Reine-chamane du Yamatai, connue par les chroniques chinoises.", A);
  P("zhuge-liang", "Zhuge Liang", 181, 234, "M", "asie", "Chine", "militaire", "Stratège et chancelier du royaume de Shu.");
  P("plotin", "Plotin", 205, 270, "M", "afrique", "Égypte / Italie", "philosophie", "Philosophe néoplatonicien.");
  P("mani", "Mani", 216, 274, "M", "moyen-orient", "Irak / Iran", "religion", "Prophète fondateur du manichéisme.", A);
  P("zenobie", "Zénobie", 240, 274, "F", "moyen-orient", "Syrie", "politique", "Reine de Palmyre qui défia l'Empire romain.", A);
  P("diocletien", "Dioclétien", 244, 311, "M", "europe", "Croatie", "politique", "Empereur qui partagea le pouvoir entre quatre souverains (la tétrarchie).", A);
  P("constantin-1", "Constantin Ier", 272, 337, "M", "europe", "Serbie", "politique", "Premier empereur romain chrétien, fondateur de Constantinople.", A);
  P("faxian", "Faxian", 337, 422, "M", "asie", "Chine", "exploration", "Moine bouddhiste qui voyagea jusqu'en Inde et au Sri Lanka.", A);
  P("jerome", "Jérôme de Stridon", 347, 420, "M", "europe", "Croatie", "religion", "Traducteur de la Bible en latin (la Vulgate).", A);
  P("theodose-1", "Théodose Ier", 347, 395, "M", "europe", "Espagne", "politique", "Dernier empereur à régner sur tout l'Empire romain ; il fit du christianisme la religion officielle.");
  P("augustin", "Augustin d'Hippone", 354, 430, "M", "afrique", "Algérie", "religion", "Évêque et théologien, auteur des « Confessions ».");
  P("hypatie", "Hypatie", 360, 415, "F", "afrique", "Égypte", "sciences", "Mathématicienne et philosophe d'Alexandrie, tuée par une foule.", A);
  P("alaric-1", "Alaric Ier", 370, 410, "M", "europe", "Roumanie / Italie", "militaire", "Roi des Wisigoths qui pilla Rome en 410.", A);
  P("attila", "Attila", 395, 453, "M", "europe", "Hongrie", "militaire", "Roi des Huns, surnommé le « fléau de Dieu ».", A);

  /* ---------------- Moyen Âge ---------------- */
  P("clovis-1", "Clovis Ier", 466, 511, "M", "europe", "France / Belgique", "politique", "Roi des Francs, baptisé à Reims.", A);
  P("aryabhata", "Āryabhaṭa", 476, 550, "M", "asie", "Inde", "sciences", "Mathématicien et astronome, auteur d'un traité fondateur de l'astronomie indienne.", A);
  P("benoit-nursie", "Benoît de Nursie", 480, 547, "M", "europe", "Italie", "religion", "Fondateur du Mont-Cassin et auteur de la règle des moines bénédictins.", A);
  P("justinien-1", "Justinien Ier", 482, 565, "M", "europe", "Turquie", "politique", "Empereur byzantin, à l'origine d'un grand recueil de lois et de la basilique Sainte-Sophie.");
  P("theodora", "Théodora", 500, 548, "F", "europe", "Turquie", "politique", "Impératrice byzantine, épouse et conseillère de Justinien.", A);
  P("gregoire-1", "Grégoire le Grand", 540, 604, "M", "europe", "Italie", "religion", "Pape réformateur de l'Église et de la liturgie.", A);
  P("khadija", "Khadija", 555, 619, "F", "moyen-orient", "Arabie saoudite", "economie", "Riche commerçante de La Mecque, première épouse de Mahomet.", A);
  P("mahomet", "Mahomet", 570, 632, "M", "moyen-orient", "Arabie saoudite", "religion", "Prophète de l'islam.", A);
  P("shotoku", "Prince Shōtoku", 574, 622, "M", "asie", "Japon", "politique", "Régent qui promulgua une constitution et favorisa le bouddhisme.", A);
  P("omar", "Omar ibn al-Khattab", 584, 644, "M", "moyen-orient", "Arabie saoudite", "politique", "Deuxième calife, sous qui l'islam s'étendit à la Syrie, à l'Égypte et à la Perse.", A);
  P("tang-taizong", "Tang Taizong", 598, 649, "M", "asie", "Chine", "politique", "Empereur de la dynastie Tang, à l'apogée de la puissance chinoise.");
  P("ali", "Ali ibn Abi Talib", 600, 661, "M", "moyen-orient", "Arabie saoudite / Irak", "religion", "Cousin et gendre de Mahomet, quatrième calife.", A);
  P("xuanzang", "Xuanzang", 602, 664, "M", "asie", "Chine", "exploration", "Moine qui rapporta d'Inde des textes bouddhistes ; son voyage inspira le roman « La Pérégrination vers l'Ouest ».");
  P("pakal", "Pakal le Grand", 603, 683, "M", "ameriques", "Mexique", "politique", "Souverain maya de Palenque, enterré dans le temple des Inscriptions.");
  P("aicha", "Aïcha", 613, 678, "F", "moyen-orient", "Arabie saoudite", "religion", "Épouse de Mahomet, importante transmettrice de ses paroles.", A);
  P("wu-zetian", "Wu Zetian", 624, 705, "F", "asie", "Chine", "politique", "Seule femme à avoir régné sur la Chine avec le titre d'empereur.");
  P("tariq", "Tariq ibn Ziyad", 670, 720, "M", "afrique", "Maroc / Espagne", "militaire", "Chef berbère qui lança en 711 la conquête musulmane de l'Espagne ; Gibraltar porte son nom.", A);
  P("bede", "Bède le Vénérable", 672, 735, "M", "europe", "Royaume-Uni", "litterature", "Moine historien de l'Angleterre.", A);
  P("charles-martel", "Charles Martel", 688, 741, "M", "europe", "France", "militaire", "Maire du palais franc, vainqueur à Poitiers en 732.", A);
  P("li-bai", "Li Bai", 701, 762, "M", "asie", "Chine", "litterature", "Poète de la dynastie Tang, chantre du vin et de la lune.");
  P("du-fu", "Du Fu", 712, 770, "M", "asie", "Chine", "litterature", "Poète de la dynastie Tang, témoin des malheurs de son temps.");
  P("rabia", "Rabia al-Adawiyya", 717, 801, "F", "moyen-orient", "Irak", "religion", "Mystique soufie de Bassora, poétesse de l'amour divin.", A);
  P("charlemagne", "Charlemagne", 742, 814, "M", "europe", "France / Allemagne", "politique", "Roi des Francs couronné empereur à Rome en l'an 800.", A);
  P("haroun-al-rachid", "Haroun al-Rachid", 766, 809, "M", "moyen-orient", "Irak", "politique", "Calife abbasside de Bagdad, popularisé par « Les Mille et Une Nuits ».", A);
  P("al-khwarizmi", "Al-Khwârizmî", 780, 850, "M", "moyen-orient", "Ouzbékistan / Irak", "sciences", "Mathématicien de Bagdad dont le nom a donné le mot « algorithme ».", A);
  P("fatima-al-fihri", "Fatima al-Fihri", 800, 880, "F", "afrique", "Maroc", "societe", "Fondatrice de la mosquée Al Quaraouiyine à Fès, devenue un grand centre d'enseignement.", A);
  P("alfred-le-grand", "Alfred le Grand", 849, 899, "M", "europe", "Royaume-Uni", "politique", "Roi du Wessex qui résista aux Vikings.");
  P("rollon", "Rollon", 860, 930, "M", "europe", "Norvège / France", "militaire", "Chef viking qui reçut le territoire de la future Normandie.", A);
  P("razi", "Rhazès (al-Razi)", 865, 925, "M", "moyen-orient", "Iran", "medecine", "Médecin et chimiste persan, qui distingua la variole de la rougeole.", A);
  P("al-farabi", "Al-Fârâbî", 872, 950, "M", "moyen-orient", "Kazakhstan / Irak", "philosophie", "Philosophe commentateur d'Aristote, surnommé le « second maître ».", A);
  P("olga-kiev", "Olga de Kiev", 890, 969, "F", "europe", "Ukraine", "politique", "Princesse et régente de Kiev, première souveraine chrétienne de la Rus'.", A);
  P("otton-1", "Otton Ier le Grand", 912, 973, "M", "europe", "Allemagne", "politique", "Roi de Germanie couronné empereur en 962.");
  P("ferdowsi", "Ferdowsi", 940, 1020, "M", "moyen-orient", "Iran", "litterature", "Poète persan du « Livre des Rois » (Shâhnâmeh).", A);
  P("hugues-capet", "Hugues Capet", 940, 996, "M", "europe", "France", "politique", "Roi des Francs, fondateur de la dynastie capétienne.", A);
  P("erik-le-rouge", "Érik le Rouge", 950, 1003, "M", "europe", "Norvège / Islande", "exploration", "Viking qui fonda les premières colonies du Groenland.", A);
  P("vladimir-1", "Vladimir Ier", 958, 1015, "M", "europe", "Ukraine", "politique", "Prince de Kiev qui fit baptiser la Rus'.", A);
  P("basile-2", "Basile II", 958, 1025, "M", "europe", "Turquie", "militaire", "Empereur byzantin surnommé le « Tueur de Bulgares ».");
  P("alhazen", "Alhazen (Ibn al-Haytham)", 965, 1040, "M", "moyen-orient", "Irak / Égypte", "sciences", "Savant fondateur de l'optique moderne.", A);
  P("sei-shonagon", "Sei Shōnagon", 966, 1025, "F", "asie", "Japon", "litterature", "Dame de la cour de Heian, autrice des « Notes de chevet ».", A);
  P("leif-erikson", "Leif Erikson", 970, 1020, "M", "europe", "Islande", "exploration", "Viking qui atteignit l'Amérique du Nord vers l'an mil.", A);
  P("murasaki", "Murasaki Shikibu", 973, 1014, "F", "asie", "Japon", "litterature", "Dame de la cour de Heian, autrice du « Dit du Genji ».", A);
  P("al-biruni", "Al-Bîrûnî", 973, 1048, "M", "asie", "Ouzbékistan", "sciences", "Savant encyclopédiste, astronome et géographe de l'Inde.", A);
  P("avicenne", "Avicenne", 980, 1037, "M", "moyen-orient", "Ouzbékistan / Iran", "medecine", "Médecin et philosophe, auteur du « Canon de la médecine ».");
  P("knut-le-grand", "Knut le Grand", 995, 1035, "M", "europe", "Danemark", "politique", "Roi du Danemark, d'Angleterre et de Norvège.", A);
  P("guillaume-conquerant", "Guillaume le Conquérant", 1028, 1087, "M", "europe", "France / Royaume-Uni", "militaire", "Duc de Normandie devenu roi d'Angleterre après la bataille d'Hastings.", A);
  P("shen-kuo", "Shen Kuo", 1031, 1095, "M", "asie", "Chine", "sciences", "Savant qui décrivit l'aiguille aimantée de la boussole.");
  P("urbain-2", "Urbain II", 1035, 1099, "M", "europe", "France", "religion", "Pape qui appela à la première croisade.", A);
  P("le-cid", "Le Cid (Rodrigo Díaz de Vivar)", 1043, 1099, "M", "europe", "Espagne", "militaire", "Chevalier castillan, héros de la Reconquista.", A);
  P("omar-khayyam", "Omar Khayyâm", 1048, 1131, "M", "moyen-orient", "Iran", "sciences", "Mathématicien, astronome et poète des « Quatrains » (Rubaiyat).");
  P("abelard", "Pierre Abélard", 1079, 1142, "M", "europe", "France", "philosophie", "Philosophe et théologien, maître des écoles parisiennes.");
  P("bernard-clairvaux", "Bernard de Clairvaux", 1090, 1153, "M", "europe", "France", "religion", "Abbé cistercien, prédicateur de la deuxième croisade.");
  P("hildegarde-bingen", "Hildegarde de Bingen", 1098, 1179, "F", "europe", "Allemagne", "religion", "Abbesse, mystique, compositrice et naturaliste.");
  P("heloise", "Héloïse", 1100, 1164, "F", "europe", "France", "litterature", "Abbesse érudite, célèbre par sa correspondance avec Abélard.", A);
  P("alienor-aquitaine", "Aliénor d'Aquitaine", 1122, 1204, "F", "europe", "France / Royaume-Uni", "politique", "Reine de France puis d'Angleterre.", A);
  P("averroes", "Averroès", 1126, 1198, "M", "europe", "Espagne", "philosophie", "Philosophe andalou, grand commentateur d'Aristote.");
  P("saladin", "Saladin", 1137, 1193, "M", "moyen-orient", "Irak / Égypte / Syrie", "militaire", "Sultan qui reprit Jérusalem aux croisés en 1187.");
  P("maimonide", "Maïmonide", 1138, 1204, "M", "europe", "Espagne / Égypte", "philosophie", "Rabbin, médecin et philosophe né à Cordoue, auteur du « Guide des égarés ».");
  P("minamoto-yoritomo", "Minamoto no Yoritomo", 1147, 1199, "M", "asie", "Japon", "politique", "Premier shogun du Japon, fondateur du shogunat de Kamakura.");
  P("richard-coeur-de-lion", "Richard Cœur de Lion", 1157, 1199, "M", "europe", "Royaume-Uni", "militaire", "Roi d'Angleterre, chef de la troisième croisade.");
  P("gengis-khan", "Gengis Khan", 1162, 1227, "M", "asie", "Mongolie", "militaire", "Fondateur de l'Empire mongol.", A);
  P("philippe-auguste", "Philippe Auguste", 1165, 1223, "M", "europe", "France", "politique", "Roi de France, vainqueur à Bouvines en 1214.");
  P("fibonacci", "Fibonacci", 1170, 1250, "M", "europe", "Italie", "sciences", "Mathématicien de Pise qui diffusa les chiffres indo-arabes en Europe.", A);
  P("francois-assise", "François d'Assise", 1181, 1226, "M", "europe", "Italie", "religion", "Fondateur de l'ordre des Franciscains.");
  P("blanche-castille", "Blanche de Castille", 1188, 1252, "F", "europe", "Espagne / France", "politique", "Reine et régente de France, mère de Saint Louis.");
  P("soundiata-keita", "Soundiata Keïta", 1190, 1255, "M", "afrique", "Mali", "politique", "Fondateur de l'Empire du Mali, héros d'une grande épopée orale.", A);
  P("frederic-2", "Frédéric II de Hohenstaufen", 1194, 1250, "M", "europe", "Italie / Allemagne", "politique", "Empereur germanique et roi de Sicile, passionné de sciences.");
  P("rumi", "Djalâl ad-Dîn Rûmî", 1207, 1273, "M", "moyen-orient", "Afghanistan / Turquie", "religion", "Poète mystique persan ; ses disciples fondèrent la confrérie des derviches tourneurs.");
  P("saint-louis", "Louis IX (Saint Louis)", 1214, 1270, "M", "europe", "France", "politique", "Roi de France mort en croisade devant Tunis.");
  P("kubilai-khan", "Kubilai Khan", 1215, 1294, "M", "asie", "Mongolie / Chine", "politique", "Petit-fils de Gengis Khan, fondateur de la dynastie Yuan en Chine.");
  P("thomas-aquin", "Thomas d'Aquin", 1225, 1274, "M", "europe", "Italie", "philosophie", "Théologien qui concilia la pensée d'Aristote et la foi chrétienne.");
  P("marco-polo", "Marco Polo", 1254, 1324, "M", "europe", "Italie", "exploration", "Marchand vénitien dont le récit décrit la Chine de Kubilai Khan.");
  P("osman-1", "Osman Ier", 1258, 1326, "M", "moyen-orient", "Turquie", "politique", "Fondateur de la dynastie et de l'Empire ottomans.", A);
  P("dante", "Dante Alighieri", 1265, 1321, "M", "europe", "Italie", "litterature", "Poète florentin de « La Divine Comédie ».");
  P("giotto", "Giotto", 1267, 1337, "M", "europe", "Italie", "arts", "Peintre florentin, précurseur de la Renaissance.", A);
  P("mansa-moussa", "Mansa Moussa", 1280, 1337, "M", "afrique", "Mali", "politique", "Empereur du Mali dont le pèlerinage à La Mecque révéla l'immense richesse.", A);
  P("ibn-battuta", "Ibn Battûta", 1304, 1369, "M", "afrique", "Maroc", "exploration", "Voyageur qui parcourut le monde musulman et l'Asie jusqu'en Chine.", A);
  P("petrarque", "Pétrarque", 1304, 1374, "M", "europe", "Italie", "litterature", "Poète humaniste du « Canzoniere ».");
  P("boccace", "Boccace", 1313, 1375, "M", "europe", "Italie", "litterature", "Auteur du « Décaméron ».");
  P("du-guesclin", "Bertrand du Guesclin", 1320, 1380, "M", "europe", "France", "militaire", "Connétable de France pendant la guerre de Cent Ans.", A);
  P("ibn-khaldoun", "Ibn Khaldoun", 1332, 1406, "M", "afrique", "Tunisie", "philosophie", "Historien et penseur des sociétés, auteur de la « Muqaddima ».");
  P("tamerlan", "Tamerlan", 1336, 1405, "M", "asie", "Ouzbékistan", "militaire", "Conquérant turco-mongol, fondateur de l'Empire timouride, à Samarcande.");
  P("chaucer", "Geoffrey Chaucer", 1343, 1400, "M", "europe", "Royaume-Uni", "litterature", "Auteur des « Contes de Canterbury ».", A);
  P("catherine-sienne", "Catherine de Sienne", 1347, 1380, "F", "europe", "Italie", "religion", "Mystique qui œuvra au retour des papes d'Avignon à Rome.");
  P("christine-pizan", "Christine de Pizan", 1364, 1430, "F", "europe", "Italie / France", "litterature", "Première femme de lettres à vivre de sa plume, autrice de « La Cité des dames ».", A);
  P("jan-hus", "Jan Hus", 1370, 1415, "M", "europe", "Tchéquie", "religion", "Réformateur de Bohême, brûlé comme hérétique.", A);
  P("zheng-he", "Zheng He", 1371, 1433, "M", "asie", "Chine", "exploration", "Amiral qui mena sept grandes expéditions maritimes jusqu'aux côtes de l'Afrique.", A);
  P("brunelleschi", "Filippo Brunelleschi", 1377, 1446, "M", "europe", "Italie", "arts", "Architecte de la coupole de la cathédrale de Florence.");
  P("jan-van-eyck", "Jan van Eyck", 1390, 1441, "M", "europe", "Belgique", "arts", "Peintre flamand des « Époux Arnolfini ».", A);
  P("sejong", "Sejong le Grand", 1397, 1450, "M", "asie", "Corée du Sud", "politique", "Roi de Corée qui fit créer l'alphabet hangeul.");
  P("gutenberg", "Johannes Gutenberg", 1400, 1468, "M", "europe", "Allemagne", "sciences", "Inventeur de l'imprimerie à caractères mobiles en Europe.", A);
  P("nezahualcoyotl", "Nezahualcóyotl", 1402, 1472, "M", "ameriques", "Mexique", "litterature", "Roi-poète de Texcoco, allié des Aztèques.");
  P("jeanne-arc", "Jeanne d'Arc", 1412, 1431, "F", "europe", "France", "militaire", "Paysanne qui fit lever le siège d'Orléans et sacrer Charles VII, brûlée à Rouen.");
  P("pachacutec", "Pachacútec", 1418, 1471, "M", "ameriques", "Pérou", "politique", "Empereur inca qui fit de Cuzco la capitale d'un vaste empire.", A);
  P("mehmed-2", "Mehmed II", 1432, 1481, "M", "moyen-orient", "Turquie", "militaire", "Sultan ottoman qui prit Constantinople en 1453.");

  /* ---------------- Époque moderne ---------------- */
  P("askia-mohammed", "Askia Mohammed", 1443, 1538, "M", "afrique", "Mali / Niger", "politique", "Empereur songhaï qui fit de Tombouctou un grand centre d'études.", A);
  P("christophe-colomb", "Christophe Colomb", 1451, 1506, "M", "europe", "Italie / Espagne", "exploration", "Navigateur génois qui atteignit les Antilles en 1492 pour le compte de l'Espagne.");
  P("isabelle-catholique", "Isabelle la Catholique", 1451, 1504, "F", "europe", "Espagne", "politique", "Reine de Castille qui acheva la Reconquista et finança le voyage de Colomb.");
  P("leonard-de-vinci", "Léonard de Vinci", 1452, 1519, "M", "europe", "Italie", "arts", "Peintre de « La Joconde », ingénieur et inventeur de génie.");
  P("erasme", "Érasme", 1466, 1536, "M", "europe", "Pays-Bas", "philosophie", "Humaniste de Rotterdam, auteur de l'« Éloge de la folie ».", A);
  P("moctezuma-2", "Moctezuma II", 1466, 1520, "M", "ameriques", "Mexique", "politique", "Empereur aztèque au moment de l'arrivée des Espagnols de Cortés.", A);
  P("vasco-de-gama", "Vasco de Gama", 1469, 1524, "M", "europe", "Portugal", "exploration", "Navigateur qui ouvrit la route maritime des Indes en contournant l'Afrique.", A);
  P("machiavel", "Nicolas Machiavel", 1469, 1527, "M", "europe", "Italie", "philosophie", "Penseur politique florentin, auteur du « Prince ».");
  P("durer", "Albrecht Dürer", 1471, 1528, "M", "europe", "Allemagne", "arts", "Peintre et graveur de Nuremberg.");
  P("copernic", "Nicolas Copernic", 1473, 1543, "M", "europe", "Pologne", "sciences", "Astronome qui plaça le Soleil au centre du monde.");
  P("michel-ange", "Michel-Ange", 1475, 1564, "M", "europe", "Italie", "arts", "Sculpteur du « David » et peintre du plafond de la chapelle Sixtine.");
  P("anne-de-bretagne", "Anne de Bretagne", 1477, 1514, "F", "europe", "France", "politique", "Duchesse de Bretagne, deux fois reine de France.");
  P("pizarro", "Francisco Pizarro", 1478, 1541, "M", "europe", "Espagne / Pérou", "militaire", "Conquistador qui renversa l'Empire inca.", A);
  P("magellan", "Fernand de Magellan", 1480, 1521, "M", "europe", "Portugal", "exploration", "Navigateur dont l'expédition réalisa le premier tour du monde.", A);
  P("raphael", "Raphaël", 1483, 1520, "M", "europe", "Italie", "arts", "Peintre de la Renaissance, auteur de « L'École d'Athènes ».");
  P("luther", "Martin Luther", 1483, 1546, "M", "europe", "Allemagne", "religion", "Moine dont les thèses de 1517 lancèrent la Réforme protestante.");
  P("babur", "Babur", 1483, 1530, "M", "asie", "Ouzbékistan / Inde", "politique", "Fondateur de l'Empire moghol en Inde.");
  P("las-casas", "Bartolomé de las Casas", 1484, 1566, "M", "europe", "Espagne", "religion", "Dominicain qui dénonça le sort fait aux peuples indigènes d'Amérique.", A);
  P("cortes", "Hernán Cortés", 1485, 1547, "M", "europe", "Espagne / Mexique", "militaire", "Conquistador qui renversa l'Empire aztèque.");
  P("henri-8", "Henri VIII", 1491, 1547, "M", "europe", "Royaume-Uni", "politique", "Roi d'Angleterre aux six épouses, qui rompit avec Rome.");
  P("ignace-loyola", "Ignace de Loyola", 1491, 1556, "M", "europe", "Espagne", "religion", "Fondateur de la Compagnie de Jésus (les jésuites).");
  P("jacques-cartier", "Jacques Cartier", 1491, 1557, "M", "europe", "France / Canada", "exploration", "Navigateur malouin qui explora le Saint-Laurent et nomma le Canada.");
  P("marguerite-navarre", "Marguerite de Navarre", 1492, 1549, "F", "europe", "France", "litterature", "Sœur de François Ier, autrice de « L'Heptaméron ».");
  P("paracelse", "Paracelse", 1493, 1541, "M", "europe", "Suisse", "medecine", "Médecin et alchimiste qui bouscula la médecine de son temps.");
  P("francois-1", "François Ier", 1494, 1547, "M", "europe", "France", "politique", "Roi de France de la Renaissance, vainqueur à Marignan, protecteur des artistes.");
  P("soliman", "Soliman le Magnifique", 1494, 1566, "M", "moyen-orient", "Turquie", "politique", "Sultan ottoman à l'apogée de l'empire, législateur et conquérant.");
  P("rabelais", "François Rabelais", 1494, 1553, "M", "europe", "France", "litterature", "Écrivain humaniste, auteur de « Gargantua » et « Pantagruel ».", A);
  P("charles-quint", "Charles Quint", 1500, 1558, "M", "europe", "Belgique / Espagne", "politique", "Empereur sur l'empire duquel « le soleil ne se couchait jamais ».");
  P("malinche", "La Malinche", 1500, 1529, "F", "ameriques", "Mexique", "societe", "Interprète et conseillère amérindienne de Cortés.", A);
  P("roxelane", "Roxelane (Hürrem Sultan)", 1502, 1558, "F", "moyen-orient", "Ukraine / Turquie", "politique", "Épouse de Soliman le Magnifique, très influente à la cour ottomane.", A);
  P("atahualpa", "Atahualpa", 1502, 1533, "M", "ameriques", "Pérou / Équateur", "politique", "Dernier empereur inca, exécuté par Pizarro.", A);
  P("nostradamus", "Nostradamus", 1503, 1566, "M", "europe", "France", "medecine", "Médecin et astrologue, auteur de prophéties en quatrains.");
  P("calvin", "Jean Calvin", 1509, 1564, "M", "europe", "France / Suisse", "religion", "Réformateur protestant installé à Genève.");
  P("ambroise-pare", "Ambroise Paré", 1510, 1590, "M", "europe", "France", "medecine", "Chirurgien des rois de France, père de la chirurgie moderne.", A);
  P("vesale", "André Vésale", 1514, 1564, "M", "europe", "Belgique", "medecine", "Anatomiste, auteur d'un grand traité illustré du corps humain.");
  P("therese-avila", "Thérèse d'Avila", 1515, 1582, "F", "europe", "Espagne", "religion", "Religieuse mystique, réformatrice de l'ordre du Carmel.");
  P("catherine-medicis", "Catherine de Médicis", 1519, 1589, "F", "europe", "Italie / France", "politique", "Reine puis régente de France pendant les guerres de Religion.");
  P("ivan-4", "Ivan le Terrible", 1530, 1584, "M", "europe", "Russie", "politique", "Premier grand-prince de Moscou couronné tsar.");
  P("elisabeth-1", "Élisabeth Ire", 1533, 1603, "F", "europe", "Royaume-Uni", "politique", "Reine d'Angleterre dont la flotte repoussa l'Invincible Armada.");
  P("montaigne", "Michel de Montaigne", 1533, 1592, "M", "europe", "France", "philosophie", "Penseur humaniste, auteur des « Essais ».");
  P("oda-nobunaga", "Oda Nobunaga", 1534, 1582, "M", "asie", "Japon", "militaire", "Seigneur de guerre qui engagea la réunification du Japon.");
  P("toyotomi-hideyoshi", "Toyotomi Hideyoshi", 1537, 1598, "M", "asie", "Japon", "militaire", "Fils de paysan devenu le maître du Japon réunifié.");
  P("akbar", "Akbar", 1542, 1605, "M", "asie", "Inde", "politique", "Empereur moghol tolérant, qui réunit savants de toutes religions.");
  P("marie-stuart", "Marie Stuart", 1542, 1587, "F", "europe", "Royaume-Uni", "politique", "Reine d'Écosse, exécutée sur l'ordre d'Élisabeth Ire.");
  P("tokugawa-ieyasu", "Tokugawa Ieyasu", 1543, 1616, "M", "asie", "Japon", "politique", "Fondateur du shogunat Tokugawa, qui dura plus de deux siècles et demi.");
  P("yi-sun-sin", "Yi Sun-sin", 1545, 1598, "M", "asie", "Corée du Sud", "militaire", "Amiral coréen, vainqueur des Japonais avec ses navires-tortues.");
  P("tycho-brahe", "Tycho Brahe", 1546, 1601, "M", "europe", "Danemark", "sciences", "Astronome aux observations d'une précision inédite à l'œil nu.");
  P("cervantes", "Miguel de Cervantes", 1547, 1616, "M", "europe", "Espagne", "litterature", "Auteur de « Don Quichotte ».");
  P("giordano-bruno", "Giordano Bruno", 1548, 1600, "M", "europe", "Italie", "philosophie", "Philosophe qui imagina un univers infini, brûlé pour hérésie.");
  P("ahmad-al-mansur", "Ahmad al-Mansur", 1549, 1603, "M", "afrique", "Maroc", "politique", "Sultan saadien, vainqueur à la bataille des Trois Rois.");
  P("matteo-ricci", "Matteo Ricci", 1552, 1610, "M", "europe", "Italie / Chine", "religion", "Jésuite qui fit connaître les sciences européennes à la cour de Chine.");
  P("henri-4", "Henri IV", 1553, 1610, "M", "europe", "France", "politique", "Roi de France, auteur de l'édit de Nantes, assassiné par Ravaillac.");
  P("francis-bacon", "Francis Bacon", 1561, 1626, "M", "europe", "Royaume-Uni", "philosophie", "Philosophe qui défendit la méthode expérimentale.");
  P("shakespeare", "William Shakespeare", 1564, 1616, "M", "europe", "Royaume-Uni", "litterature", "Dramaturge de « Hamlet » et de « Roméo et Juliette ».");
  P("galilee", "Galilée", 1564, 1642, "M", "europe", "Italie", "sciences", "Astronome qui tourna une lunette vers le ciel et fut condamné par l'Église.");
  P("champlain", "Samuel de Champlain", 1567, 1635, "M", "europe", "France / Canada", "exploration", "Fondateur de Québec en 1608.", A);
  P("abbas-1", "Abbas Ier le Grand", 1571, 1629, "M", "moyen-orient", "Iran", "politique", "Shah séfévide qui fit d'Ispahan sa capitale.");
  P("kepler", "Johannes Kepler", 1571, 1630, "M", "europe", "Allemagne", "sciences", "Astronome qui découvrit les lois du mouvement des planètes.");
  P("rubens", "Pierre Paul Rubens", 1577, 1640, "M", "europe", "Belgique", "arts", "Grand peintre baroque flamand.");
  P("nzinga", "Nzinga", 1583, 1663, "F", "afrique", "Angola", "politique", "Reine du Ndongo et du Matamba qui résista aux Portugais.", A);
  P("richelieu", "Cardinal de Richelieu", 1585, 1642, "M", "europe", "France", "politique", "Principal ministre de Louis XIII, fondateur de l'Académie française.");
  P("kosem", "Kösem Sultan", 1589, 1651, "F", "moyen-orient", "Grèce / Turquie", "politique", "Sultane mère et régente, figure majeure de l'Empire ottoman.", A);
  P("shah-jahan", "Shah Jahan", 1592, 1666, "M", "asie", "Inde", "politique", "Empereur moghol qui fit bâtir le Taj Mahal.");
  P("mumtaz-mahal", "Mumtaz Mahal", 1593, 1631, "F", "asie", "Inde", "politique", "Épouse de Shah Jahan, pour qui fut construit le Taj Mahal.");
  P("artemisia-gentileschi", "Artemisia Gentileschi", 1593, 1653, "F", "europe", "Italie", "arts", "Peintre baroque, l'une des premières femmes admises à l'Académie de dessin de Florence.", A);
  P("pocahontas", "Pocahontas", 1596, 1617, "F", "ameriques", "États-Unis", "societe", "Fille d'un chef powhatan, liée aux premiers colons anglais de Virginie.", A);
  P("descartes", "René Descartes", 1596, 1650, "M", "europe", "France", "philosophie", "Philosophe du « Je pense, donc je suis », auteur du « Discours de la méthode ».");
  P("cromwell", "Oliver Cromwell", 1599, 1658, "M", "europe", "Royaume-Uni", "politique", "Chef de la révolution anglaise, Lord-Protecteur après l'exécution de Charles Ier.");
  P("velazquez", "Diego Vélasquez", 1599, 1660, "M", "europe", "Espagne", "arts", "Peintre de la cour d'Espagne, auteur des « Ménines ».");
  P("rembrandt", "Rembrandt", 1606, 1669, "M", "europe", "Pays-Bas", "arts", "Peintre hollandais de « La Ronde de nuit ».");
  P("aurangzeb", "Aurangzeb", 1618, 1707, "M", "asie", "Inde", "politique", "Empereur moghol sous lequel l'empire atteignit sa plus grande étendue.");
  P("colbert", "Jean-Baptiste Colbert", 1619, 1683, "M", "europe", "France", "economie", "Ministre de Louis XIV, promoteur des manufactures et du commerce.");
  P("la-fontaine", "Jean de La Fontaine", 1621, 1695, "M", "europe", "France", "litterature", "Poète des « Fables ».");
  P("moliere", "Molière", 1622, 1673, "M", "europe", "France", "litterature", "Comédien et auteur du « Misanthrope » et du « Malade imaginaire ».");
  P("pascal", "Blaise Pascal", 1623, 1662, "M", "europe", "France", "sciences", "Savant et philosophe, inventeur d'une machine à calculer, auteur des « Pensées ».");
  P("sevigne", "Madame de Sévigné", 1626, 1696, "F", "europe", "France", "litterature", "Épistolière dont les lettres racontent la société du Grand Siècle.");
  P("shivaji", "Shivaji", 1630, 1680, "M", "asie", "Inde", "militaire", "Fondateur de l'Empire marathe face aux Moghols.");
  P("spinoza", "Baruch Spinoza", 1632, 1677, "M", "europe", "Pays-Bas", "philosophie", "Philosophe de l'« Éthique ».");
  P("vermeer", "Johannes Vermeer", 1632, 1675, "M", "europe", "Pays-Bas", "arts", "Peintre de Delft, auteur de « La Jeune Fille à la perle ».");
  P("locke", "John Locke", 1632, 1704, "M", "europe", "Royaume-Uni", "philosophie", "Philosophe des libertés et de la tolérance.");
  P("vauban", "Vauban", 1633, 1707, "M", "europe", "France", "militaire", "Ingénieur militaire de Louis XIV, bâtisseur de citadelles.");
  P("louis-14", "Louis XIV", 1638, 1715, "M", "europe", "France", "politique", "Le Roi-Soleil, qui fit bâtir Versailles et régna 72 ans.");
  P("racine", "Jean Racine", 1639, 1699, "M", "europe", "France", "litterature", "Tragédien de « Phèdre ».");
  P("newton", "Isaac Newton", 1643, 1727, "M", "europe", "Royaume-Uni", "sciences", "Savant qui formula la gravitation universelle.");
  P("basho", "Matsuo Bashō", 1644, 1694, "M", "asie", "Japon", "litterature", "Maître du haïku.");
  P("leibniz", "Gottfried Wilhelm Leibniz", 1646, 1716, "M", "europe", "Allemagne", "philosophie", "Philosophe et mathématicien, co-inventeur du calcul infinitésimal.");
  P("maria-sibylla-merian", "Maria Sibylla Merian", 1647, 1717, "F", "europe", "Allemagne / Pays-Bas", "sciences", "Naturaliste et illustratrice qui étudia les insectes jusqu'au Suriname.");
  P("juana-ines", "Juana Inés de la Cruz", 1648, 1695, "F", "ameriques", "Mexique", "litterature", "Religieuse poète, grande figure du baroque hispano-américain.", A);
  P("kangxi", "Kangxi", 1654, 1722, "M", "asie", "Chine", "politique", "Empereur Qing au très long règne.");
  P("pierre-le-grand", "Pierre le Grand", 1672, 1725, "M", "europe", "Russie", "politique", "Tsar qui modernisa la Russie et fonda Saint-Pétersbourg.");
  P("vivaldi", "Antonio Vivaldi", 1678, 1741, "M", "europe", "Italie", "musique", "Compositeur vénitien des « Quatre Saisons ».");
  P("bach", "Jean-Sébastien Bach", 1685, 1750, "M", "europe", "Allemagne", "musique", "Compositeur et organiste baroque.");
  P("haendel", "Georg Friedrich Haendel", 1685, 1759, "M", "europe", "Allemagne / Royaume-Uni", "musique", "Compositeur du « Messie ».");
  P("montesquieu", "Montesquieu", 1689, 1755, "M", "europe", "France", "philosophie", "Penseur de la séparation des pouvoirs, auteur de « De l'esprit des lois ».");
  P("voltaire", "Voltaire", 1694, 1778, "M", "europe", "France", "philosophie", "Philosophe des Lumières, auteur de « Candide ».");
  P("emilie-du-chatelet", "Émilie du Châtelet", 1706, 1749, "F", "europe", "France", "sciences", "Mathématicienne et physicienne, traductrice de Newton en français.");
  P("benjamin-franklin", "Benjamin Franklin", 1706, 1790, "M", "ameriques", "États-Unis", "sciences", "Savant inventeur du paratonnerre et père fondateur des États-Unis.");
  P("linne", "Carl von Linné", 1707, 1778, "M", "europe", "Suède", "sciences", "Naturaliste qui créa la classification des espèces à deux noms.");
  P("euler", "Leonhard Euler", 1707, 1783, "M", "europe", "Suisse", "sciences", "Mathématicien parmi les plus prolifiques de l'histoire.");
  P("qianlong", "Qianlong", 1711, 1799, "M", "asie", "Chine", "politique", "Empereur Qing, à l'apogée territorial de la Chine.");
  P("laura-bassi", "Laura Bassi", 1711, 1778, "F", "europe", "Italie", "sciences", "Physicienne, première femme professeure d'université en Europe.");
  P("rousseau", "Jean-Jacques Rousseau", 1712, 1778, "M", "europe", "Suisse / France", "philosophie", "Philosophe du « Contrat social ».");
  P("frederic-2-prusse", "Frédéric II de Prusse", 1712, 1786, "M", "europe", "Allemagne", "politique", "Roi de Prusse, despote éclairé ami de Voltaire.");
  P("diderot", "Denis Diderot", 1713, 1784, "M", "europe", "France", "philosophie", "Directeur de l'« Encyclopédie ».");
  P("marie-therese", "Marie-Thérèse d'Autriche", 1717, 1780, "F", "europe", "Autriche", "politique", "Impératrice et reine qui gouverna les possessions des Habsbourg.");
  P("pompadour", "Madame de Pompadour", 1721, 1764, "F", "europe", "France", "arts", "Favorite de Louis XV, protectrice des arts et des philosophes.");
  P("adam-smith", "Adam Smith", 1723, 1790, "M", "europe", "Royaume-Uni", "economie", "Économiste, auteur de « La Richesse des nations ».");
  P("kant", "Emmanuel Kant", 1724, 1804, "M", "europe", "Russie (Kaliningrad)", "philosophie", "Philosophe de la « Critique de la raison pure ».");
  P("james-cook", "James Cook", 1728, 1779, "M", "europe", "Royaume-Uni", "exploration", "Navigateur qui explora le Pacifique, l'Australie et la Nouvelle-Zélande.");
  P("catherine-2", "Catherine II", 1729, 1796, "F", "europe", "Allemagne / Russie", "politique", "Impératrice de Russie, amie des philosophes des Lumières.");
  P("washington", "George Washington", 1732, 1799, "M", "ameriques", "États-Unis", "politique", "Général de l'indépendance, premier président des États-Unis.");
  P("haydn", "Joseph Haydn", 1732, 1809, "M", "europe", "Autriche", "musique", "Compositeur, père de la symphonie classique.");
  P("tupac-amaru-2", "Túpac Amaru II", 1738, 1781, "M", "ameriques", "Pérou", "politique", "Chef d'une grande révolte indigène contre la domination espagnole.");
  P("lavoisier", "Antoine Lavoisier", 1743, 1794, "M", "europe", "France", "sciences", "Chimiste du « rien ne se perd, rien ne se crée », guillotiné.");
  P("jefferson", "Thomas Jefferson", 1743, 1826, "M", "ameriques", "États-Unis", "politique", "Rédacteur de la Déclaration d'indépendance, troisième président des États-Unis.");
  P("volta", "Alessandro Volta", 1745, 1827, "M", "europe", "Italie", "sciences", "Physicien, inventeur de la pile électrique.");
  P("jenner", "Edward Jenner", 1749, 1823, "M", "europe", "Royaume-Uni", "medecine", "Médecin qui mit au point la vaccination contre la variole.");
  P("tipu-sultan", "Tipu Sultan", 1751, 1799, "M", "asie", "Inde", "militaire", "Sultan de Mysore, adversaire des Britanniques, surnommé le « Tigre de Mysore ».");
  P("phillis-wheatley", "Phillis Wheatley", 1753, 1784, "F", "ameriques", "Sénégal / États-Unis", "litterature", "Esclave affranchie, première poétesse afro-américaine publiée.", A);
  P("marie-antoinette", "Marie-Antoinette", 1755, 1793, "F", "europe", "Autriche / France", "politique", "Reine de France, guillotinée pendant la Révolution.");
  P("mozart", "Wolfgang Amadeus Mozart", 1756, 1791, "M", "europe", "Autriche", "musique", "Compositeur prodige de « La Flûte enchantée ».");

  /* ---------------- Époque contemporaine : de la Révolution à 1900 ---------------- */
  const C = { e: 'contemporaine' };
  P("toussaint-louverture", "Toussaint Louverture", 1743, 1803, "M", "ameriques", "Haïti", "politique", "Ancien esclave, chef de la révolution de Saint-Domingue qui mena à l'indépendance d'Haïti.", C);
  P("olympe-de-gouges", "Olympe de Gouges", 1748, 1793, "F", "europe", "France", "societe", "Autrice de la « Déclaration des droits de la femme et de la citoyenne », guillotinée.", C);
  P("goethe", "Johann Wolfgang von Goethe", 1749, 1832, "M", "europe", "Allemagne", "litterature", "Écrivain de « Faust » et des « Souffrances du jeune Werther ».");
  P("la-fayette", "La Fayette", 1757, 1834, "M", "europe", "France", "politique", "Héros de l'indépendance américaine et acteur de la Révolution française.");
  P("kamehameha-1", "Kamehameha Ier", 1758, 1819, "M", "oceanie", "États-Unis (Hawaï)", "politique", "Roi qui unifia l'archipel d'Hawaï.", { a: 1, e: "contemporaine" });
  P("robespierre", "Maximilien de Robespierre", 1758, 1794, "M", "europe", "France", "politique", "Révolutionnaire, figure de la Terreur, guillotiné le 10 thermidor.", C);
  P("danton", "Georges Danton", 1759, 1794, "M", "europe", "France", "politique", "Orateur de la Révolution, guillotiné sur ordre du Comité de salut public.", C);
  P("mary-wollstonecraft", "Mary Wollstonecraft", 1759, 1797, "F", "europe", "Royaume-Uni", "societe", "Philosophe, autrice de la « Défense des droits de la femme ».", C);
  P("josephine", "Joséphine de Beauharnais", 1763, 1814, "F", "ameriques", "France (Martinique)", "politique", "Première épouse de Napoléon, impératrice des Français.");
  P("bennelong", "Bennelong", 1764, 1813, "M", "oceanie", "Australie", "societe", "Aborigène wangal, intermédiaire entre son peuple et les premiers colons britanniques.", A);
  P("tecumseh", "Tecumseh", 1768, 1813, "M", "ameriques", "États-Unis", "militaire", "Chef shawnee qui tenta d'unir les peuples amérindiens contre l'expansion américaine.", A);
  P("mehmet-ali", "Méhémet Ali", 1769, 1849, "M", "afrique", "Grèce / Égypte", "politique", "Vice-roi qui modernisa l'Égypte.", A);
  P("napoleon-1", "Napoléon Ier", 1769, 1821, "M", "europe", "France", "politique", "Général devenu empereur des Français, auteur du Code civil, exilé à Sainte-Hélène.");
  P("humboldt", "Alexander von Humboldt", 1769, 1859, "M", "europe", "Allemagne", "exploration", "Naturaliste explorateur de l'Amérique du Sud.");
  P("hegel", "Georg Wilhelm Friedrich Hegel", 1770, 1831, "M", "europe", "Allemagne", "philosophie", "Philosophe de l'histoire et de la dialectique.");
  P("beethoven", "Ludwig van Beethoven", 1770, 1827, "M", "europe", "Allemagne / Autriche", "musique", "Compositeur de neuf symphonies, devenu sourd.");
  P("ram-mohan-roy", "Ram Mohan Roy", 1772, 1833, "M", "asie", "Inde", "societe", "Réformateur qui combattit le sacrifice des veuves.");
  P("jane-austen", "Jane Austen", 1775, 1817, "F", "europe", "Royaume-Uni", "litterature", "Romancière d'« Orgueil et Préjugés ».");
  P("ampere", "André-Marie Ampère", 1775, 1836, "M", "europe", "France", "sciences", "Physicien de l'électromagnétisme, dont le nom désigne l'unité d'intensité électrique.");
  P("sophie-germain", "Sophie Germain", 1776, 1831, "F", "europe", "France", "sciences", "Mathématicienne autodidacte, spécialiste de la théorie des nombres et de l'élasticité.");
  P("gauss", "Carl Friedrich Gauss", 1777, 1855, "M", "europe", "Allemagne", "sciences", "Mathématicien surnommé le « prince des mathématiques ».");
  P("san-martin", "José de San Martín", 1778, 1850, "M", "ameriques", "Argentine", "militaire", "Libérateur de l'Argentine, du Chili et du Pérou.");
  P("simon-bolivar", "Simón Bolívar", 1783, 1830, "M", "ameriques", "Venezuela", "politique", "« El Libertador », qui mena l'indépendance de plusieurs pays d'Amérique du Sud.");
  P("stendhal", "Stendhal", 1783, 1842, "M", "europe", "France", "litterature", "Romancier du « Rouge et le Noir ».");
  P("chaka", "Chaka", 1787, 1828, "M", "afrique", "Afrique du Sud", "militaire", "Roi qui fit des Zoulous une grande puissance militaire.", A);
  P("sacagawea", "Sacagawea", 1788, 1812, "F", "ameriques", "États-Unis", "exploration", "Guide et interprète shoshone de l'expédition Lewis et Clark.", A);
  P("lord-byron", "Lord Byron", 1788, 1824, "M", "europe", "Royaume-Uni", "litterature", "Poète romantique, mort en Grèce pendant la guerre d'indépendance.");
  P("champollion", "Jean-François Champollion", 1790, 1832, "M", "europe", "France", "sciences", "Égyptologue qui déchiffra les hiéroglyphes grâce à la pierre de Rosette.");
  P("faraday", "Michael Faraday", 1791, 1867, "M", "europe", "Royaume-Uni", "sciences", "Physicien et chimiste qui découvrit l'induction électromagnétique.");
  P("babbage", "Charles Babbage", 1791, 1871, "M", "europe", "Royaume-Uni", "sciences", "Inventeur d'une machine à calculer programmable, ancêtre de l'ordinateur.");
  P("sojourner-truth", "Sojourner Truth", 1797, 1883, "F", "ameriques", "États-Unis", "societe", "Ancienne esclave devenue militante de l'abolition et des droits des femmes.", A);
  P("mary-shelley", "Mary Shelley", 1797, 1851, "F", "europe", "Royaume-Uni", "litterature", "Romancière de « Frankenstein ».");
  P("mary-anning", "Mary Anning", 1799, 1847, "F", "europe", "Royaume-Uni", "sciences", "Chasseuse de fossiles qui découvrit des squelettes d'ichtyosaures et de plésiosaures.");
  P("balzac", "Honoré de Balzac", 1799, 1850, "M", "europe", "France", "litterature", "Romancier de « La Comédie humaine ».");
  P("victor-hugo", "Victor Hugo", 1802, 1885, "M", "europe", "France", "litterature", "Écrivain des « Misérables », exilé sous le Second Empire.");
  P("alexandre-dumas", "Alexandre Dumas", 1802, 1870, "M", "europe", "France", "litterature", "Romancier des « Trois Mousquetaires ».");
  P("george-sand", "George Sand", 1804, 1876, "F", "europe", "France", "litterature", "Romancière qui signait d'un nom d'homme, compagne de Chopin.");
  P("benito-juarez", "Benito Juárez", 1806, 1872, "M", "ameriques", "Mexique", "politique", "Président mexicain d'origine zapotèque, opposé à l'intervention française.");
  P("garibaldi", "Giuseppe Garibaldi", 1807, 1882, "M", "europe", "Italie", "militaire", "Chef des Chemises rouges, héros de l'unité italienne.");
  P("abd-el-kader", "Abd el-Kader", 1808, 1883, "M", "afrique", "Algérie", "militaire", "Émir qui mena la résistance à la conquête française de l'Algérie.");
  P("darwin", "Charles Darwin", 1809, 1882, "M", "europe", "Royaume-Uni", "sciences", "Naturaliste, auteur de la théorie de l'évolution par la sélection naturelle.");
  P("lincoln", "Abraham Lincoln", 1809, 1865, "M", "ameriques", "États-Unis", "politique", "Président pendant la guerre de Sécession, qui abolit l'esclavage ; assassiné.");
  P("louis-braille", "Louis Braille", 1809, 1852, "M", "europe", "France", "societe", "Aveugle depuis l'enfance, inventeur de l'écriture en points saillants.");
  P("edgar-poe", "Edgar Allan Poe", 1809, 1849, "M", "ameriques", "États-Unis", "litterature", "Maître du récit fantastique et policier.");
  P("chopin", "Frédéric Chopin", 1810, 1849, "M", "europe", "Pologne / France", "musique", "Pianiste et compositeur romantique.");
  P("liszt", "Franz Liszt", 1811, 1886, "M", "europe", "Hongrie", "musique", "Pianiste virtuose et compositeur.");
  P("harriet-beecher-stowe", "Harriet Beecher Stowe", 1811, 1896, "F", "ameriques", "États-Unis", "litterature", "Romancière de « La Case de l'oncle Tom ».");
  P("truganini", "Truganini", 1812, 1876, "F", "oceanie", "Australie", "societe", "Femme aborigène de Tasmanie, témoin de la destruction de son peuple.", A);
  P("verdi", "Giuseppe Verdi", 1813, 1901, "M", "europe", "Italie", "musique", "Compositeur d'opéras, dont « La Traviata ».");
  P("wagner", "Richard Wagner", 1813, 1883, "M", "europe", "Allemagne", "musique", "Compositeur de « L'Anneau du Nibelung ».");
  P("livingstone", "David Livingstone", 1813, 1873, "M", "europe", "Royaume-Uni", "exploration", "Missionnaire et explorateur de l'Afrique australe et centrale.");
  P("hong-xiuquan", "Hong Xiuquan", 1814, 1864, "M", "asie", "Chine", "religion", "Chef de la révolte des Taiping.");
  P("ada-lovelace", "Ada Lovelace", 1815, 1852, "F", "europe", "Royaume-Uni", "sciences", "Mathématicienne qui écrivit le premier programme informatique.");
  P("bismarck", "Otto von Bismarck", 1815, 1898, "M", "europe", "Allemagne", "politique", "Chancelier qui réalisa l'unité allemande.");
  P("elizabeth-cady-stanton", "Elizabeth Cady Stanton", 1815, 1902, "F", "ameriques", "États-Unis", "societe", "Pionnière du mouvement pour le droit de vote des femmes.");
  P("frederick-douglass", "Frederick Douglass", 1818, 1895, "M", "ameriques", "États-Unis", "societe", "Ancien esclave devenu grand orateur de l'abolitionnisme.");
  P("karl-marx", "Karl Marx", 1818, 1883, "M", "europe", "Allemagne", "philosophie", "Penseur du communisme, auteur du « Capital ».");
  P("victoria", "Victoria", 1819, 1901, "F", "europe", "Royaume-Uni", "politique", "Reine du Royaume-Uni et impératrice des Indes.");
  P("clara-schumann", "Clara Schumann", 1819, 1896, "F", "europe", "Allemagne", "musique", "Pianiste virtuose et compositrice.");
  P("walt-whitman", "Walt Whitman", 1819, 1892, "M", "ameriques", "États-Unis", "litterature", "Poète des « Feuilles d'herbe ».");
  P("florence-nightingale", "Florence Nightingale", 1820, 1910, "F", "europe", "Royaume-Uni", "medecine", "Infirmière de la guerre de Crimée, fondatrice des soins infirmiers modernes.");
  P("susan-b-anthony", "Susan B. Anthony", 1820, 1906, "F", "ameriques", "États-Unis", "societe", "Militante du droit de vote des femmes.");
  P("harriet-tubman", "Harriet Tubman", 1822, 1913, "F", "ameriques", "États-Unis", "societe", "Esclave évadée qui guida des dizaines d'esclaves vers la liberté.", A);
  P("dostoievski", "Fiodor Dostoïevski", 1821, 1881, "M", "europe", "Russie", "litterature", "Romancier de « Crime et Châtiment ».");
  P("flaubert", "Gustave Flaubert", 1821, 1880, "M", "europe", "France", "litterature", "Romancier de « Madame Bovary ».");
  P("baudelaire", "Charles Baudelaire", 1821, 1867, "M", "europe", "France", "litterature", "Poète des « Fleurs du mal ».");
  P("elizabeth-blackwell", "Elizabeth Blackwell", 1821, 1910, "F", "ameriques", "Royaume-Uni / États-Unis", "medecine", "Première femme diplômée de médecine aux États-Unis.");
  P("pasteur", "Louis Pasteur", 1822, 1895, "M", "europe", "France", "sciences", "Chimiste et biologiste, inventeur du vaccin contre la rage.");
  P("mendel", "Gregor Mendel", 1822, 1884, "M", "europe", "Tchéquie", "sciences", "Moine qui découvrit les lois de l'hérédité en croisant des petits pois.");
  P("rosa-bonheur", "Rosa Bonheur", 1822, 1899, "F", "europe", "France", "arts", "Peintre animalière renommée.");
  P("lakshmibai", "Lakshmibai, rani de Jhansi", 1828, 1858, "F", "asie", "Inde", "militaire", "Reine qui combattit les Britanniques lors de la révolte de 1857.", A);
  P("tolstoi", "Léon Tolstoï", 1828, 1910, "M", "europe", "Russie", "litterature", "Romancier de « Guerre et Paix ».");
  P("jules-verne", "Jules Verne", 1828, 1905, "M", "europe", "France", "litterature", "Romancier des « Voyages extraordinaires ».");
  P("saigo-takamori", "Saigō Takamori", 1828, 1877, "M", "asie", "Japon", "militaire", "Samouraï de la restauration Meiji, puis chef d'une révolte contre le nouveau régime.");
  P("geronimo", "Geronimo", 1829, 1909, "M", "ameriques", "États-Unis / Mexique", "militaire", "Chef apache qui résista longtemps aux armées américaine et mexicaine.");
  P("louise-michel", "Louise Michel", 1830, 1905, "F", "europe", "France", "societe", "Institutrice et figure de la Commune de Paris, déportée en Nouvelle-Calédonie.");
  P("emily-dickinson", "Emily Dickinson", 1830, 1886, "F", "ameriques", "États-Unis", "litterature", "Poétesse dont l'œuvre fut presque entièrement publiée après sa mort.");
  P("sitting-bull", "Sitting Bull", 1831, 1890, "M", "ameriques", "États-Unis", "militaire", "Chef lakota, vainqueur à Little Bighorn.", A);
  P("maxwell", "James Clerk Maxwell", 1831, 1879, "M", "europe", "Royaume-Uni", "sciences", "Physicien qui unifia électricité, magnétisme et lumière.");
  P("eiffel", "Gustave Eiffel", 1832, 1923, "M", "europe", "France", "sciences", "Ingénieur de la tour qui porte son nom.");
  P("alfred-nobel", "Alfred Nobel", 1833, 1896, "M", "europe", "Suède", "sciences", "Chimiste inventeur de la dynamite, fondateur des prix Nobel.");
  P("mendeleiev", "Dmitri Mendeleïev", 1834, 1907, "M", "europe", "Russie", "sciences", "Chimiste qui dressa le tableau périodique des éléments.");
  P("cixi", "Cixi", 1835, 1908, "F", "asie", "Chine", "politique", "Impératrice douairière qui domina la cour des Qing pendant près d'un demi-siècle.");
  P("mark-twain", "Mark Twain", 1835, 1910, "M", "ameriques", "États-Unis", "litterature", "Écrivain des « Aventures de Tom Sawyer ».");
  P("liliuokalani", "Liliʻuokalani", 1838, 1917, "F", "oceanie", "États-Unis (Hawaï)", "politique", "Dernière reine d'Hawaï, renversée en 1893.");
  P("monet", "Claude Monet", 1840, 1926, "M", "europe", "France", "arts", "Peintre dont le tableau « Impression, soleil levant » donna son nom à l'impressionnisme.");
  P("rodin", "Auguste Rodin", 1840, 1917, "M", "europe", "France", "arts", "Sculpteur du « Penseur ».");
  P("tchaikovski", "Piotr Ilitch Tchaïkovski", 1840, 1893, "M", "europe", "Russie", "musique", "Compositeur du « Lac des cygnes ».");
  P("emile-zola", "Émile Zola", 1840, 1902, "M", "europe", "France", "litterature", "Romancier des « Rougon-Macquart », auteur de « J'accuse… ! ».");
  P("berthe-morisot", "Berthe Morisot", 1841, 1895, "F", "europe", "France", "arts", "Peintre impressionniste.");
  P("robert-koch", "Robert Koch", 1843, 1910, "M", "europe", "Allemagne", "medecine", "Médecin qui découvrit le bacille de la tuberculose.");
  P("menelik-2", "Menelik II", 1844, 1913, "M", "afrique", "Éthiopie", "politique", "Empereur d'Éthiopie, vainqueur des Italiens à Adoua en 1896.");
  P("nietzsche", "Friedrich Nietzsche", 1844, 1900, "M", "europe", "Allemagne", "philosophie", "Philosophe de « Ainsi parlait Zarathoustra ».");
  P("rontgen", "Wilhelm Röntgen", 1845, 1923, "M", "europe", "Allemagne", "sciences", "Physicien qui découvrit les rayons X.");
  P("edison", "Thomas Edison", 1847, 1931, "M", "ameriques", "États-Unis", "sciences", "Inventeur du phonographe et d'une ampoule électrique durable.");
  P("graham-bell", "Alexander Graham Bell", 1847, 1922, "M", "ameriques", "Royaume-Uni / Canada / États-Unis", "sciences", "Inventeur du téléphone.");
  P("kate-sheppard", "Kate Sheppard", 1847, 1934, "F", "oceanie", "Nouvelle-Zélande", "societe", "Suffragiste qui obtint en 1893 le premier droit de vote national des femmes.");
  P("sofia-kovalevskaia", "Sofia Kovalevskaïa", 1850, 1891, "F", "europe", "Russie / Suède", "sciences", "Mathématicienne, première femme professeure d'université en Suède.");
  P("taytu-betul", "Taytu Betul", 1851, 1918, "F", "afrique", "Éthiopie", "politique", "Impératrice d'Éthiopie, épouse de Menelik II, fondatrice d'Addis-Abeba.", A);
  P("meiji", "Meiji", 1852, 1912, "M", "asie", "Japon", "politique", "Empereur sous lequel le Japon se modernisa à grande vitesse.");
  P("van-gogh", "Vincent van Gogh", 1853, 1890, "M", "europe", "Pays-Bas / France", "arts", "Peintre des « Tournesols » et de « La Nuit étoilée ».");
  P("rimbaud", "Arthur Rimbaud", 1854, 1891, "M", "europe", "France", "litterature", "Poète précoce du « Bateau ivre ».");
  P("freud", "Sigmund Freud", 1856, 1939, "M", "europe", "Autriche", "medecine", "Neurologue, fondateur de la psychanalyse.");
  P("tesla", "Nikola Tesla", 1856, 1943, "M", "ameriques", "Croatie / États-Unis", "sciences", "Inventeur du moteur à courant alternatif.");
  P("emmeline-pankhurst", "Emmeline Pankhurst", 1858, 1928, "F", "europe", "Royaume-Uni", "societe", "Chef des suffragettes britanniques.");
  P("jaures", "Jean Jaurès", 1859, 1914, "M", "europe", "France", "politique", "Dirigeant socialiste et pacifiste, assassiné à la veille de la Grande Guerre.");
  P("dreyfus", "Alfred Dreyfus", 1859, 1935, "M", "europe", "France", "militaire", "Officier condamné à tort pour trahison, au cœur de l'« Affaire ».");

  /* ---------------- Époque contemporaine : XXe siècle ---------------- */
  P("theodor-herzl", "Theodor Herzl", 1860, 1904, "M", "europe", "Hongrie / Autriche", "politique", "Journaliste, fondateur du sionisme politique.");
  P("nansen", "Fridtjof Nansen", 1861, 1930, "M", "europe", "Norvège", "exploration", "Explorateur de l'Arctique, puis protecteur des réfugiés, prix Nobel de la paix.");
  P("tagore", "Rabindranath Tagore", 1861, 1941, "M", "asie", "Inde", "litterature", "Poète bengali, premier lauréat non européen du prix Nobel de littérature.");
  P("nellie-melba", "Nellie Melba", 1861, 1931, "F", "oceanie", "Australie", "musique", "Cantatrice soprano de renommée mondiale.");
  P("pierre-de-coubertin", "Pierre de Coubertin", 1863, 1937, "M", "europe", "France", "sport", "Rénovateur des Jeux olympiques modernes.");
  P("vivekananda", "Swami Vivekananda", 1863, 1902, "M", "asie", "Inde", "religion", "Maître spirituel qui fit connaître la pensée hindoue en Occident.");
  P("louis-lumiere", "Louis Lumière", 1864, 1948, "M", "europe", "France", "cinema", "Avec son frère Auguste, inventeur du cinématographe.");
  P("camille-claudel", "Camille Claudel", 1864, 1943, "F", "europe", "France", "arts", "Sculptrice, élève et compagne de Rodin.");
  P("sun-yat-sen", "Sun Yat-sen", 1866, 1925, "M", "asie", "Chine", "politique", "Père de la République de Chine, fondée en 1912.");
  P("kandinsky", "Vassily Kandinsky", 1866, 1944, "M", "europe", "Russie / France", "arts", "Peintre pionnier de l'art abstrait.");
  P("marie-curie", "Marie Curie", 1867, 1934, "F", "europe", "Pologne / France", "sciences", "Physicienne et chimiste, deux fois prix Nobel (physique et chimie).");
  P("gandhi", "Mohandas Karamchand Gandhi", 1869, 1948, "M", "asie", "Inde", "politique", "Chef non violent de l'indépendance indienne, surnommé « Mahatma ».");
  P("matisse", "Henri Matisse", 1869, 1954, "M", "europe", "France", "arts", "Peintre du fauvisme, maître de la couleur.");
  P("lenine", "Lénine", 1870, 1924, "M", "europe", "Russie", "politique", "Chef de la révolution d'Octobre 1917, fondateur de l'URSS.");
  P("rosa-luxemburg", "Rosa Luxemburg", 1871, 1919, "F", "europe", "Pologne / Allemagne", "politique", "Théoricienne révolutionnaire, assassinée à Berlin.");
  P("rutherford", "Ernest Rutherford", 1871, 1937, "M", "oceanie", "Nouvelle-Zélande / Royaume-Uni", "sciences", "Physicien qui découvrit le noyau de l'atome.");
  P("proust", "Marcel Proust", 1871, 1922, "M", "europe", "France", "litterature", "Romancier d'« À la recherche du temps perdu ».");
  P("amundsen", "Roald Amundsen", 1872, 1928, "M", "europe", "Norvège", "exploration", "Premier explorateur à atteindre le pôle Sud, en 1911.");
  P("churchill", "Winston Churchill", 1874, 1965, "M", "europe", "Royaume-Uni", "politique", "Premier ministre britannique pendant la Seconde Guerre mondiale.");
  P("shackleton", "Ernest Shackleton", 1874, 1922, "M", "europe", "Irlande / Royaume-Uni", "exploration", "Explorateur de l'Antarctique, qui sauva tout l'équipage de l'Endurance.");
  P("schweitzer", "Albert Schweitzer", 1875, 1965, "M", "afrique", "France / Gabon", "medecine", "Médecin qui fonda un hôpital à Lambaréné, prix Nobel de la paix.");
  P("jinnah", "Muhammad Ali Jinnah", 1876, 1948, "M", "asie", "Pakistan", "politique", "Fondateur du Pakistan.");
  P("staline", "Joseph Staline", 1878, 1953, "M", "europe", "Géorgie / Russie", "politique", "Dirigeant de l'URSS pendant près de trente ans, responsable de répressions massives.");
  P("lise-meitner", "Lise Meitner", 1878, 1968, "F", "europe", "Autriche / Suède", "sciences", "Physicienne qui expliqua la fission nucléaire.");
  P("einstein", "Albert Einstein", 1879, 1955, "M", "europe", "Allemagne / États-Unis", "sciences", "Physicien de la théorie de la relativité.");
  P("zapata", "Emiliano Zapata", 1879, 1919, "M", "ameriques", "Mexique", "militaire", "Chef paysan de la révolution mexicaine (« Terre et liberté »).");
  P("ataturk", "Mustafa Kemal Atatürk", 1881, 1938, "M", "moyen-orient", "Turquie", "politique", "Fondateur et premier président de la Turquie moderne.");
  P("picasso", "Pablo Picasso", 1881, 1973, "M", "europe", "Espagne / France", "arts", "Peintre de « Guernica », cofondateur du cubisme.");
  P("fleming", "Alexander Fleming", 1881, 1955, "M", "europe", "Royaume-Uni", "medecine", "Biologiste qui découvrit la pénicilline.");
  P("roosevelt-franklin", "Franklin Delano Roosevelt", 1882, 1945, "M", "ameriques", "États-Unis", "politique", "Président du New Deal et de la Seconde Guerre mondiale.");
  P("virginia-woolf", "Virginia Woolf", 1882, 1941, "F", "europe", "Royaume-Uni", "litterature", "Romancière de « Mrs Dalloway » et d'« Une chambre à soi ».");
  P("james-joyce", "James Joyce", 1882, 1941, "M", "europe", "Irlande", "litterature", "Romancier d'« Ulysse ».");
  P("stravinsky", "Igor Stravinsky", 1882, 1971, "M", "europe", "Russie / États-Unis", "musique", "Compositeur du « Sacre du printemps ».");
  P("kafka", "Franz Kafka", 1883, 1924, "M", "europe", "Tchéquie", "litterature", "Écrivain de « La Métamorphose » et du « Procès ».");
  P("coco-chanel", "Coco Chanel", 1883, 1971, "F", "europe", "France", "arts", "Créatrice de mode qui libéra la silhouette féminine.");
  P("eleanor-roosevelt", "Eleanor Roosevelt", 1884, 1962, "F", "ameriques", "États-Unis", "societe", "Militante des droits humains, inspiratrice de la Déclaration universelle de 1948.");
  P("niels-bohr", "Niels Bohr", 1885, 1962, "M", "europe", "Danemark", "sciences", "Physicien, pionnier de la physique quantique.");
  P("ben-gourion", "David Ben Gourion", 1886, 1973, "M", "moyen-orient", "Pologne / Israël", "politique", "Fondateur et premier chef du gouvernement de l'État d'Israël.");
  P("le-corbusier", "Le Corbusier", 1887, 1965, "M", "europe", "Suisse / France", "arts", "Architecte de la Cité radieuse de Marseille.");
  P("chaplin", "Charlie Chaplin", 1889, 1977, "M", "europe", "Royaume-Uni / États-Unis", "cinema", "Acteur et réalisateur, créateur du personnage de Charlot.");
  P("hitler", "Adolf Hitler", 1889, 1945, "M", "europe", "Autriche / Allemagne", "politique", "Dictateur nazi, responsable de la Seconde Guerre mondiale et de la Shoah.");
  P("nehru", "Jawaharlal Nehru", 1889, 1964, "M", "asie", "Inde", "politique", "Premier Premier ministre de l'Inde indépendante.");
  P("gabriela-mistral", "Gabriela Mistral", 1889, 1957, "F", "ameriques", "Chili", "litterature", "Poétesse, premier prix Nobel de littérature d'Amérique latine.");
  P("de-gaulle", "Charles de Gaulle", 1890, 1970, "M", "europe", "France", "politique", "Chef de la France libre, fondateur de la Ve République.");
  P("ho-chi-minh", "Hô Chi Minh", 1890, 1969, "M", "asie", "Viêt Nam", "politique", "Dirigeant de l'indépendance vietnamienne.");
  P("agatha-christie", "Agatha Christie", 1890, 1976, "F", "europe", "Royaume-Uni", "litterature", "Romancière policière, créatrice d'Hercule Poirot.");
  P("haile-selassie", "Haïlé Sélassié Ier", 1892, 1975, "M", "afrique", "Éthiopie", "politique", "Dernier empereur d'Éthiopie.");
  P("mao-zedong", "Mao Zedong", 1893, 1976, "M", "asie", "Chine", "politique", "Fondateur de la République populaire de Chine.");
  P("irene-joliot-curie", "Irène Joliot-Curie", 1897, 1956, "F", "europe", "France", "sciences", "Physicienne, prix Nobel de chimie pour la radioactivité artificielle.");
  P("amelia-earhart", "Amelia Earhart", 1897, 1937, "F", "ameriques", "États-Unis", "exploration", "Aviatrice, première femme à traverser l'Atlantique seule en avion ; disparue dans le Pacifique.");
  P("golda-meir", "Golda Meir", 1898, 1978, "F", "moyen-orient", "Ukraine / Israël", "politique", "Première ministre d'Israël.");
  P("zhou-enlai", "Zhou Enlai", 1898, 1976, "M", "asie", "Chine", "politique", "Premier ministre de la Chine populaire.");
  P("oum-kalthoum", "Oum Kalthoum", 1904, 1975, "F", "afrique", "Égypte", "musique", "Chanteuse surnommée l'« Astre de l'Orient ».", A);
  P("hemingway", "Ernest Hemingway", 1899, 1961, "M", "ameriques", "États-Unis", "litterature", "Romancier du « Vieil Homme et la Mer ».");
  P("jean-moulin", "Jean Moulin", 1899, 1943, "M", "europe", "France", "politique", "Chef de la Résistance intérieure française, mort après son arrestation.");
  P("borges", "Jorge Luis Borges", 1899, 1986, "M", "ameriques", "Argentine", "litterature", "Écrivain des « Fictions ».");
  P("suzanne-lenglen", "Suzanne Lenglen", 1899, 1938, "F", "europe", "France", "sport", "Championne de tennis, la « Divine ».");
  P("louis-armstrong", "Louis Armstrong", 1901, 1971, "M", "ameriques", "États-Unis", "musique", "Trompettiste et chanteur de jazz.");
  P("walt-disney", "Walt Disney", 1901, 1966, "M", "ameriques", "États-Unis", "cinema", "Créateur de Mickey Mouse et de grands films d'animation.");
  P("hirohito", "Hirohito", 1901, 1989, "M", "asie", "Japon", "politique", "Empereur du Japon pendant la Seconde Guerre mondiale.");
  P("lindbergh", "Charles Lindbergh", 1902, 1974, "M", "ameriques", "États-Unis", "exploration", "Aviateur, premier à traverser l'Atlantique seul et sans escale.");
  P("namatjira", "Albert Namatjira", 1902, 1959, "M", "oceanie", "Australie", "arts", "Peintre aborigène, célèbre pour ses aquarelles du centre de l'Australie.");
  P("orwell", "George Orwell", 1903, 1950, "M", "europe", "Royaume-Uni", "litterature", "Écrivain de « 1984 » et de « La Ferme des animaux ».");
  P("dali", "Salvador Dalí", 1904, 1989, "M", "europe", "Espagne", "arts", "Peintre surréaliste aux montres molles.");
  P("neruda", "Pablo Neruda", 1904, 1973, "M", "ameriques", "Chili", "litterature", "Poète, prix Nobel de littérature.");
  P("deng-xiaoping", "Deng Xiaoping", 1904, 1997, "M", "asie", "Chine", "politique", "Dirigeant qui ouvrit l'économie chinoise.");
  P("sartre", "Jean-Paul Sartre", 1905, 1980, "M", "europe", "France", "philosophie", "Philosophe existentialiste, auteur de « La Nausée ».");
  P("josephine-baker", "Joséphine Baker", 1906, 1975, "F", "europe", "États-Unis / France", "cinema", "Meneuse de revue, résistante et militante contre le racisme.");
  P("senghor", "Léopold Sédar Senghor", 1906, 2001, "M", "afrique", "Sénégal", "politique", "Poète de la négritude, premier président du Sénégal.");
  P("grace-hopper", "Grace Hopper", 1906, 1992, "F", "ameriques", "États-Unis", "sciences", "Informaticienne, pionnière des langages de programmation.");
  P("frida-kahlo", "Frida Kahlo", 1907, 1954, "F", "ameriques", "Mexique", "arts", "Peintre aux autoportraits célèbres.");
  P("herge", "Hergé", 1907, 1983, "M", "europe", "Belgique", "arts", "Auteur de bande dessinée, créateur de Tintin.");
  P("simone-de-beauvoir", "Simone de Beauvoir", 1908, 1986, "F", "europe", "France", "philosophie", "Philosophe, autrice du « Deuxième Sexe ».");
  P("allende", "Salvador Allende", 1908, 1973, "M", "ameriques", "Chili", "politique", "Président socialiste du Chili, mort lors du coup d'État de 1973.");
  P("nkrumah", "Kwame Nkrumah", 1909, 1972, "M", "afrique", "Ghana", "politique", "Premier dirigeant du Ghana indépendant, apôtre du panafricanisme.");
  P("mere-teresa", "Mère Teresa", 1910, 1997, "F", "asie", "Macédoine du Nord / Inde", "religion", "Religieuse au service des pauvres de Calcutta, prix Nobel de la paix.");
  P("cousteau", "Jacques-Yves Cousteau", 1910, 1997, "M", "europe", "France", "exploration", "Explorateur des océans, coinventeur du scaphandre autonome.");
  P("kurosawa", "Akira Kurosawa", 1910, 1998, "M", "asie", "Japon", "cinema", "Réalisateur des « Sept Samouraïs ».");
  P("alan-turing", "Alan Turing", 1912, 1954, "M", "europe", "Royaume-Uni", "sciences", "Mathématicien qui contribua à casser le code Enigma, père de l'informatique théorique.");
  P("rosa-parks", "Rosa Parks", 1913, 2005, "F", "ameriques", "États-Unis", "societe", "Militante qui refusa de céder sa place dans un bus, en 1955.");
  P("camus", "Albert Camus", 1913, 1960, "M", "europe", "Algérie / France", "litterature", "Écrivain de « L'Étranger », prix Nobel de littérature.");
  P("aime-cesaire", "Aimé Césaire", 1913, 2008, "M", "ameriques", "France (Martinique)", "litterature", "Poète et homme politique, chantre de la négritude.");
  P("jesse-owens", "Jesse Owens", 1913, 1980, "M", "ameriques", "États-Unis", "sport", "Athlète aux quatre médailles d'or des Jeux de Berlin, en 1936.");
  P("tenzing-norgay", "Tenzing Norgay", 1914, 1986, "M", "asie", "Népal / Inde", "exploration", "Sherpa qui atteignit avec Edmund Hillary le sommet de l'Everest en 1953.");
  P("edith-piaf", "Édith Piaf", 1915, 1963, "F", "europe", "France", "musique", "Chanteuse de « La Vie en rose ».");
  P("billie-holiday", "Billie Holiday", 1915, 1959, "F", "ameriques", "États-Unis", "musique", "Chanteuse de jazz de « Strange Fruit ».");
  P("indira-gandhi", "Indira Gandhi", 1917, 1984, "F", "asie", "Inde", "politique", "Première ministre de l'Inde, assassinée.");
  P("kennedy", "John Fitzgerald Kennedy", 1917, 1963, "M", "ameriques", "États-Unis", "politique", "Président des États-Unis assassiné à Dallas.");
  P("mandela", "Nelson Mandela", 1918, 2013, "M", "afrique", "Afrique du Sud", "politique", "Opposant à l'apartheid, emprisonné 27 ans, puis président de l'Afrique du Sud.");
  P("nasser", "Gamal Abdel Nasser", 1918, 1970, "M", "afrique", "Égypte", "politique", "Président égyptien qui nationalisa le canal de Suez.");
  P("katherine-johnson", "Katherine Johnson", 1918, 2020, "F", "ameriques", "États-Unis", "sciences", "Mathématicienne de la NASA, qui calcula les trajectoires des premiers vols habités.");
  P("eva-peron", "Eva Perón", 1919, 1952, "F", "ameriques", "Argentine", "politique", "Épouse du président Perón, très populaire auprès des pauvres.");
  P("edmund-hillary", "Edmund Hillary", 1919, 2008, "M", "oceanie", "Nouvelle-Zélande", "exploration", "Alpiniste qui atteignit le sommet de l'Everest avec Tenzing Norgay.");
  P("rosalind-franklin", "Rosalind Franklin", 1920, 1958, "F", "europe", "Royaume-Uni", "sciences", "Chimiste dont les clichés aux rayons X révélèrent la structure en double hélice de l'ADN.");
  P("sophie-scholl", "Sophie Scholl", 1921, 1943, "F", "europe", "Allemagne", "societe", "Étudiante résistante au nazisme (la Rose blanche), exécutée.");
  P("malcolm-x", "Malcolm X", 1925, 1965, "M", "ameriques", "États-Unis", "societe", "Militant des droits des Afro-Américains, assassiné.");
  P("thatcher", "Margaret Thatcher", 1925, 2013, "F", "europe", "Royaume-Uni", "politique", "Première femme Première ministre du Royaume-Uni.");
  P("lumumba", "Patrice Lumumba", 1925, 1961, "M", "afrique", "République démocratique du Congo", "politique", "Premier chef du gouvernement du Congo indépendant, assassiné.");
  P("marilyn-monroe", "Marilyn Monroe", 1926, 1962, "F", "ameriques", "États-Unis", "cinema", "Actrice, icône d'Hollywood.");
  P("fidel-castro", "Fidel Castro", 1926, 2016, "M", "ameriques", "Cuba", "politique", "Chef de la révolution cubaine, au pouvoir près de cinquante ans.");
  P("simone-veil", "Simone Veil", 1927, 2017, "F", "europe", "France", "politique", "Rescapée d'Auschwitz, ministre de la loi sur l'IVG, présidente du Parlement européen.");
  P("garcia-marquez", "Gabriel García Márquez", 1927, 2014, "M", "ameriques", "Colombie", "litterature", "Romancier de « Cent ans de solitude ».");
  P("che-guevara", "Ernesto « Che » Guevara", 1928, 1967, "M", "ameriques", "Argentine / Cuba", "politique", "Révolutionnaire de la révolution cubaine, tué en Bolivie.");
  P("anne-frank", "Anne Frank", 1929, 1945, "F", "europe", "Allemagne / Pays-Bas", "litterature", "Adolescente juive dont le journal, écrit dans la cachette, fut publié après sa mort en déportation.");
  P("martin-luther-king", "Martin Luther King", 1929, 1968, "M", "ameriques", "États-Unis", "societe", "Pasteur et militant non violent des droits civiques (« I have a dream »).");
  P("arafat", "Yasser Arafat", 1929, 2004, "M", "moyen-orient", "Palestine", "politique", "Dirigeant de l'Organisation de libération de la Palestine.");
  P("neil-armstrong", "Neil Armstrong", 1930, 2012, "M", "ameriques", "États-Unis", "exploration", "Astronaute, premier homme à marcher sur la Lune, en 1969.");
  P("gorbatchev", "Mikhaïl Gorbatchev", 1931, 2022, "M", "europe", "Russie", "politique", "Dernier dirigeant de l'URSS, artisan de la fin de la guerre froide.");
  P("youri-gagarine", "Youri Gagarine", 1934, 1968, "M", "europe", "Russie", "exploration", "Premier homme dans l'espace, en 1961.");
  P("elvis-presley", "Elvis Presley", 1935, 1977, "M", "ameriques", "États-Unis", "musique", "Chanteur surnommé le « King » du rock'n'roll.");
  P("vaclav-havel", "Václav Havel", 1936, 2011, "M", "europe", "Tchéquie", "politique", "Dramaturge dissident, président après la révolution de Velours.");
  P("wangari-maathai", "Wangari Maathai", 1940, 2011, "F", "afrique", "Kenya", "societe", "Écologiste du mouvement de la Ceinture verte, prix Nobel de la paix.");
  P("john-lennon", "John Lennon", 1940, 1980, "M", "europe", "Royaume-Uni", "musique", "Membre fondateur des Beatles, assassiné à New York.");
  P("pele", "Pelé", 1940, 2022, "M", "ameriques", "Brésil", "sport", "Footballeur, trois fois champion du monde.");
  P("mohamed-ali", "Mohamed Ali", 1942, 2016, "M", "ameriques", "États-Unis", "sport", "Boxeur, champion du monde des poids lourds.");
  P("stephen-hawking", "Stephen Hawking", 1942, 2018, "M", "europe", "Royaume-Uni", "sciences", "Physicien des trous noirs, atteint d'une maladie qui le paralysa.");
  P("bob-marley", "Bob Marley", 1945, 1981, "M", "ameriques", "Jamaïque", "musique", "Chanteur qui fit connaître le reggae dans le monde.");
  P("thomas-sankara", "Thomas Sankara", 1949, 1987, "M", "afrique", "Burkina Faso", "politique", "Président révolutionnaire qui renomma son pays Burkina Faso, assassiné.");
  P("benazir-bhutto", "Benazir Bhutto", 1953, 2007, "F", "asie", "Pakistan", "politique", "Première femme à diriger le gouvernement d'un pays musulman, assassinée.");
  P("steve-jobs", "Steve Jobs", 1955, 2011, "M", "ameriques", "États-Unis", "economie", "Cofondateur d'Apple.");
  P("michael-jackson", "Michael Jackson", 1958, 2009, "M", "ameriques", "États-Unis", "musique", "Chanteur et danseur surnommé le « roi de la pop ».");
  P("ayrton-senna", "Ayrton Senna", 1960, 1994, "M", "ameriques", "Brésil", "sport", "Pilote de Formule 1, trois fois champion du monde, mort en course.");

  /* ---------------- Difficulté : 1 très connu … 5 presque inconnu (pour un public français) ----------------
     Les personnes absentes de cette table sont au niveau 3. La liste PERSONNES est ensuite triée par
     difficulté, puis par date de naissance. */
  const DIFFICULTES = { 1: 'Très facile', 2: 'Facile', 3: 'Moyen', 4: 'Difficile', 5: 'Extrême' };
  const DIFFICULTE = {
    1: `toutankhamon ramses-2 bouddha confucius socrate platon aristote alexandre-le-grand archimede jules-cesar
      vercingetorix cleopatre-7 jesus neron attila mahomet charlemagne gengis-khan marco-polo jeanne-arc
      christophe-colomb leonard-de-vinci michel-ange luther henri-8 shakespeare galilee louis-14 moliere newton
      mozart napoleon-1 beethoven victor-hugo darwin lincoln karl-marx pasteur jules-verne van-gogh freud
      marie-curie gandhi lenine churchill staline einstein picasso hitler de-gaulle mao-zedong mandela kennedy
      martin-luther-king neil-armstrong anne-frank elvis-presley michael-jackson pele steve-jobs`,
    2: `nefertiti pythagore hippocrate hannibal spartacus auguste marc-antoine caligula homere clovis-1 saint-louis
      richard-coeur-de-lion dante gutenberg vasco-de-gama machiavel copernic magellan raphael francois-1
      catherine-medicis elisabeth-1 cervantes henri-4 descartes rembrandt la-fontaine pascal racine bach vivaldi
      voltaire rousseau diderot marie-antoinette robespierre jacques-cartier montaigne rabelais nostradamus
      cortes pierre-le-grand catherine-2 washington benjamin-franklin goethe la-fayette simon-bolivar balzac
      alexandre-dumas george-sand chopin tolstoi monet rodin emile-zola baudelaire edison graham-bell tesla
      bismarck victoria florence-nightingale louis-braille eiffel alfred-nobel dostoievski rimbaud flaubert
      louis-lumiere coco-chanel chaplin roosevelt-franklin ho-chi-minh fidel-castro che-guevara rosa-parks
      malcolm-x edith-piaf walt-disney sartre camus simone-de-beauvoir simone-veil mere-teresa cousteau
      jean-moulin jesse-owens mohamed-ali john-lennon bob-marley marilyn-monroe youri-gagarine gorbatchev
      stephen-hawking frida-kahlo herge agatha-christie dali alan-turing indira-gandhi thatcher jaures dreyfus
      amundsen marie-stuart louis-armstrong ayrton-senna cristophe-colomb`,
    4: `hammurabi akhenaton nabuchodonosor-2 solon thales cyrus-2 mahavira darius-1 xerxes-1 parmenide anaxagore
      empedocle aspasie democrite thucydide diogene demosthene theophraste ptolemee-1 chandragupta-maurya pyrrhus-1
      aristarque ashoka eratosthene hamilcar-barca liu-bang massinissa caton-ancien polybe hipparque jugurtha
      marius sima-qian sylla mithridate-6 crassus lucrece agrippa tite-live livie wang-mang arminius
      heron-alexandrie caligula-x agrippine flavius-josephe plutarque cai-lun tacite zhang-heng claude-ptolemee
      galien septime-severe tertullien cao-cao zhuge-liang plotin mani zenobie diocletien faxian jerome
      theodose-1 alaric-1 aryabhata benoit-nursie gregoire-1 khadija shotoku omar tang-taizong ali xuanzang
      pakal aicha wu-zetian tariq bede li-bai du-fu haroun-al-rachid al-khwarizmi alfred-le-grand rollon razi
      al-farabi olga-kiev otton-1 ferdowsi erik-le-rouge vladimir-1 basile-2 alhazen murasaki al-biruni
      knut-le-grand shen-kuo urbain-2 abelard bernard-clairvaux heloise averroes maimonide minamoto-yoritomo
      fibonacci blanche-castille soundiata-keita frederic-2 rumi kubilai-khan osman-1 giotto mansa-moussa
      ibn-battuta petrarque boccace du-guesclin ibn-khaldoun chaucer catherine-sienne christine-pizan jan-hus
      zheng-he brunelleschi jan-van-eyck sejong pachacutec mehmed-2 askia-mohammed moctezuma-2 durer
      anne-de-bretagne babur las-casas ignace-loyola marguerite-navarre paracelse atahualpa ambroise-pare vesale
      therese-avila ivan-4 oda-nobunaga toyotomi-hideyoshi akbar tokugawa-ieyasu yi-sun-sin tycho-brahe
      giordano-bruno matteo-ricci francis-bacon champlain abbas-1 rubens nzinga shah-jahan mumtaz-mahal
      artemisia-gentileschi velazquez aurangzeb colbert sevigne shivaji spinoza locke vauban basho leibniz
      kangxi haendel emilie-du-chatelet linne euler qianlong frederic-2-prusse marie-therese pompadour
      adam-smith james-cook haydn tupac-amaru-2 jefferson jenner tipu-sultan toussaint-louverture
      olympe-de-gouges danton mary-wollstonecraft tecumseh mehmet-ali humboldt hegel ram-mohan-roy ampere
      gauss san-martin stendhal chaka sacagawea lord-byron faraday babbage mary-shelley benito-juarez
      garibaldi abd-el-kader edgar-poe liszt harriet-beecher-stowe verdi wagner livingstone ada-lovelace
      elizabeth-cady-stanton frederick-douglass clara-schumann walt-whitman susan-b-anthony harriet-tubman
      mendel rosa-bonheur lakshmibai saigo-takamori geronimo louise-michel emily-dickinson sitting-bull maxwell
      mendeleiev cixi mark-twain tchaikovski berthe-morisot robert-koch menelik-2 nietzsche rontgen meiji
      emmeline-pankhurst theodor-herzl nansen tagore pierre-de-coubertin vivekananda camille-claudel
      sun-yat-sen kandinsky matisse rosa-luxemburg rutherford proust shackleton schweitzer jinnah lise-meitner
      zapata ataturk fleming virginia-woolf james-joyce stravinsky kafka eleanor-roosevelt niels-bohr
      ben-gourion le-corbusier nehru haile-selassie irene-joliot-curie amelia-earhart golda-meir zhou-enlai
      oum-kalthoum hemingway borges suzanne-lenglen hirohito lindbergh orwell neruda deng-xiaoping
      josephine-baker senghor grace-hopper allende nkrumah kurosawa aime-cesaire tenzing-norgay billie-holiday
      nasser katherine-johnson eva-peron edmund-hillary rosalind-franklin sophie-scholl lumumba garcia-marquez
      arafat vaclav-havel wangari-maathai thomas-sankara benazir-bhutto`,
    5: `hatchepsout-x mahavira-x`
  };

  const H = window.HISTEHORY = window.HISTEHORY || {};
  Object.assign(H, { PERSONNES, REGIONS, DOMAINES, EPOQUES });
})();
