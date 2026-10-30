/* ==========================================================================
   Histehory Quizz - js/donnees/dates.js
   RECENSEMENT DES DATES HISTORIQUES (données seules : aucun mode de jeu ne les utilise encore).
   --------------------------------------------------------------------------
   Une ligne par événement :
     E(id, événement, année, mois, jour, région, domaine, difficulté, résumé, options)
       année      : négative avant notre ère (pas d'année 0)
       mois, jour : null si la date n'est connue (ou n'a de sens) qu'à l'année près ;
                    sinon, le jeu peut demander la date au jour près (champ « precision » : 'jour' ou 'annee')
       région, domaine : mêmes clés que js/donnees/personnes.js
       difficulté : de 1 (très connue) à 5 (presque inconnue), pour un public français
       options    : A = année approximative ou discutée
   ========================================================================== */
(function () {
  'use strict';

  const DATES = [];
  const A = { a: 1 };
  function E(id, evenement, annee, mois, jour, region, domaine, difficulte, resume, o = {}) {
    DATES.push({ id, evenement, annee, mois, jour, precision: jour ? 'jour' : 'annee', region, domaine, difficulte, resume, approx: !!o.a });
  }

  /* ---------------- Antiquité ---------------- */
  E("pyramide-kheops", "Construction de la grande pyramide de Khéops", -2560, null, null, "afrique", "arts", 3, "Tombeau du pharaon Khéops à Gizeh, seule merveille du monde antique encore debout.", A);
  E("code-hammurabi", "Code de Hammurabi", -1750, null, null, "moyen-orient", "politique", 4, "Recueil de lois du roi de Babylone, gravé sur une stèle.", A);
  E("premiers-jeux-olympiques", "Premiers Jeux olympiques antiques", -776, null, null, "europe", "sport", 2, "Date traditionnelle des premiers Jeux à Olympie, en l'honneur de Zeus.");
  E("fondation-rome", "Fondation légendaire de Rome", -753, 4, 21, "europe", "politique", 2, "Selon la tradition, Romulus fonde Rome le 21 avril.");
  E("bataille-marathon", "Bataille de Marathon", -490, null, null, "europe", "militaire", 3, "Les Athéniens repoussent l'armée perse de Darius Ier.");
  E("thermopyles", "Bataille des Thermopyles", -480, null, null, "europe", "militaire", 3, "Léonidas et ses Spartiates retardent l'armée de Xerxès.");
  E("salamine", "Bataille de Salamine", -480, null, null, "europe", "militaire", 4, "La flotte grecque menée par Thémistocle écrase la flotte perse.");
  E("mort-socrate", "Mort de Socrate", -399, null, null, "europe", "philosophie", 3, "Condamné par Athènes, le philosophe boit la ciguë.");
  E("mort-alexandre", "Mort d'Alexandre le Grand à Babylone", -323, 6, 10, "moyen-orient", "politique", 3, "Son empire, de la Grèce à l'Indus, est partagé entre ses généraux.", A);
  E("unification-chine", "Unification de la Chine par Qin Shi Huang", -221, null, null, "asie", "politique", 4, "Naissance du premier empire chinois.");
  E("hannibal-alpes", "Hannibal franchit les Alpes", -218, null, null, "europe", "militaire", 3, "Avec ses éléphants, le Carthaginois envahit l'Italie.");
  E("destruction-carthage", "Destruction de Carthage", -146, null, null, "afrique", "militaire", 4, "Fin de la troisième guerre punique ; Carthage est rasée par Rome.");
  E("alesia", "Siège d'Alésia", -52, null, null, "europe", "militaire", 2, "Vercingétorix capitule devant César : la Gaule devient romaine.");
  E("rubicon", "César franchit le Rubicon", -49, 1, 10, "europe", "politique", 3, "« Le sort en est jeté » : début de la guerre civile romaine.", A);
  E("assassinat-cesar", "Assassinat de Jules César", -44, 3, 15, "europe", "politique", 2, "Poignardé en plein Sénat aux ides de mars.");
  E("actium", "Bataille d'Actium", -31, 9, 2, "europe", "militaire", 4, "Octave bat Antoine et Cléopâtre et devient seul maître de Rome.");
  E("auguste-empereur", "Octave reçoit le titre d'Auguste", -27, 1, 16, "europe", "politique", 4, "Début de l'Empire romain.");
  E("pompei", "Éruption du Vésuve", 79, null, null, "europe", "sciences", 2, "Pompéi et Herculanum sont ensevelies sous les cendres.");
  E("edit-milan", "Édit de Milan", 313, null, null, "europe", "religion", 4, "Constantin et Licinius accordent la liberté de culte aux chrétiens.");
  E("sac-rome-410", "Sac de Rome par Alaric", 410, 8, 24, "europe", "militaire", 4, "Les Wisigoths pillent Rome, un choc pour tout le monde romain.");
  E("fin-empire-occident", "Chute de l'Empire romain d'Occident", 476, null, null, "europe", "politique", 2, "Le dernier empereur, Romulus Augustule, est déposé : début conventionnel du Moyen Âge.");

  /* ---------------- Moyen Âge ---------------- */
  E("bapteme-clovis", "Baptême de Clovis", 496, null, null, "europe", "religion", 2, "Le roi des Francs reçoit le baptême à Reims.", A);
  E("hegire", "L'Hégire", 622, null, null, "moyen-orient", "religion", 3, "Départ de Mahomet de La Mecque vers Médine, début du calendrier musulman.");
  E("conquete-espagne", "Début de la conquête musulmane de l'Espagne", 711, null, null, "europe", "militaire", 4, "Tariq ibn Ziyad franchit le détroit de Gibraltar.");
  E("bataille-poitiers-732", "Bataille de Poitiers", 732, null, null, "europe", "militaire", 2, "Charles Martel arrête une armée omeyyade.");
  E("couronnement-charlemagne", "Couronnement de Charlemagne", 800, 12, 25, "europe", "politique", 1, "Le pape Léon III sacre Charlemagne empereur à Rome, le jour de Noël.");
  E("traite-verdun", "Traité de Verdun", 843, null, null, "europe", "politique", 4, "Partage de l'empire carolingien entre les trois petits-fils de Charlemagne.");
  E("saint-empire", "Couronnement d'Otton Ier", 962, 2, 2, "europe", "politique", 5, "Naissance du Saint-Empire romain germanique.");
  E("hugues-capet-roi", "Élection d'Hugues Capet", 987, null, null, "europe", "politique", 3, "Début de la dynastie capétienne en France.");
  E("hastings", "Bataille d'Hastings", 1066, 10, 14, "europe", "militaire", 2, "Guillaume le Conquérant devient roi d'Angleterre.");
  E("premiere-croisade", "Appel de Clermont", 1095, 11, 27, "europe", "religion", 4, "Le pape Urbain II appelle à la première croisade.");
  E("prise-jerusalem-1099", "Prise de Jérusalem par les croisés", 1099, 7, 15, "moyen-orient", "militaire", 4, "Fin de la première croisade.");
  E("saladin-jerusalem", "Saladin reprend Jérusalem", 1187, 10, 2, "moyen-orient", "militaire", 4, "Après sa victoire de Hattin, le sultan reprend la ville aux croisés.");
  E("bouvines", "Bataille de Bouvines", 1214, 7, 27, "europe", "militaire", 3, "Philippe Auguste bat une coalition menée par l'empereur Otton IV.");
  E("magna-carta", "Grande Charte (Magna Carta)", 1215, 6, 15, "europe", "politique", 3, "Le roi Jean sans Terre accepte de limiter son pouvoir.");
  E("mort-gengis-khan", "Mort de Gengis Khan", 1227, null, null, "asie", "politique", 4, "Son empire mongol s'étend de la Chine à la mer Caspienne.");
  E("peste-noire", "Arrivée de la peste noire en Europe", 1347, null, null, "europe", "medecine", 3, "L'épidémie tue entre un tiers et la moitié des Européens en quelques années.");
  E("orleans", "Jeanne d'Arc délivre Orléans", 1429, 5, 8, "europe", "militaire", 2, "Tournant de la guerre de Cent Ans.");
  E("mort-jeanne-arc", "Mort de Jeanne d'Arc", 1431, 5, 30, "europe", "religion", 2, "Condamnée pour hérésie, elle est brûlée à Rouen.");
  E("prise-constantinople", "Prise de Constantinople", 1453, 5, 29, "europe", "militaire", 2, "Les Ottomans de Mehmed II mettent fin à l'Empire byzantin.");
  E("fin-guerre-cent-ans", "Bataille de Castillon", 1453, 7, 17, "europe", "militaire", 4, "Dernière bataille de la guerre de Cent Ans.");

  /* ---------------- Époque moderne ---------------- */
  E("bible-gutenberg", "Impression de la Bible de Gutenberg", 1455, null, null, "europe", "sciences", 3, "Premier grand livre imprimé avec des caractères mobiles en Europe.", A);
  E("chute-grenade", "Prise de Grenade", 1492, 1, 2, "europe", "militaire", 4, "Les Rois catholiques achèvent la Reconquista.");
  E("colomb-amerique", "Christophe Colomb atteint l'Amérique", 1492, 10, 12, "ameriques", "exploration", 1, "Il débarque aux Bahamas, croyant avoir atteint les Indes.");
  E("vasco-de-gama-inde", "Vasco de Gama arrive en Inde", 1498, 5, 20, "asie", "exploration", 4, "Ouverture de la route maritime des Indes par le cap de Bonne-Espérance.");
  E("marignan", "Bataille de Marignan", 1515, 9, 13, "europe", "militaire", 1, "Victoire de François Ier en Italie.");
  E("theses-luther", "Les 95 thèses de Luther", 1517, 10, 31, "europe", "religion", 3, "Début de la Réforme protestante.");
  E("tour-du-monde", "Retour de l'expédition Magellan", 1522, 9, 6, "europe", "exploration", 4, "Premier tour du monde, achevé par Elcano après la mort de Magellan.");
  E("chute-tenochtitlan", "Chute de Tenochtitlan", 1521, 8, 13, "ameriques", "militaire", 4, "Cortés s'empare de la capitale aztèque.");
  E("villers-cotterets", "Ordonnance de Villers-Cotterêts", 1539, null, null, "europe", "politique", 3, "Le français devient la langue des actes officiels.");
  E("saint-barthelemy", "Massacre de la Saint-Barthélemy", 1572, 8, 24, "europe", "religion", 2, "Des milliers de protestants sont tués à Paris puis en province.");
  E("edit-nantes", "Édit de Nantes", 1598, 4, 13, "europe", "religion", 2, "Henri IV accorde la liberté de culte aux protestants.");
  E("assassinat-henri-4", "Assassinat d'Henri IV", 1610, 5, 14, "europe", "politique", 3, "Le roi est poignardé par Ravaillac rue de la Ferronnerie.");
  E("mayflower", "Arrivée du Mayflower", 1620, 11, 11, "ameriques", "exploration", 4, "Des colons puritains anglais débarquent au Massachusetts.", A);
  E("proces-galilee", "Condamnation de Galilée", 1633, 6, 22, "europe", "sciences", 4, "L'Église le contraint à abjurer l'idée que la Terre tourne autour du Soleil.");
  E("traites-westphalie", "Traités de Westphalie", 1648, 10, 24, "europe", "politique", 4, "Fin de la guerre de Trente Ans.");
  E("execution-charles-1", "Exécution de Charles Ier", 1649, 1, 30, "europe", "politique", 4, "Le roi d'Angleterre est décapité pendant la révolution anglaise.");
  E("versailles-cour", "La cour s'installe à Versailles", 1682, 5, 6, "europe", "politique", 3, "Louis XIV fait du château le siège du pouvoir.");
  E("revocation-edit-nantes", "Révocation de l'édit de Nantes", 1685, 10, 18, "europe", "religion", 3, "Par l'édit de Fontainebleau, Louis XIV interdit le protestantisme.");
  E("mort-louis-14", "Mort de Louis XIV", 1715, 9, 1, "europe", "politique", 3, "Fin d'un règne de 72 ans.");
  E("seisme-lisbonne", "Tremblement de terre de Lisbonne", 1755, 11, 1, "europe", "sciences", 4, "Séisme, raz-de-marée et incendie dévastent la ville.");
  E("independance-americaine", "Déclaration d'indépendance des États-Unis", 1776, 7, 4, "ameriques", "politique", 1, "Les treize colonies rompent avec la Grande-Bretagne.");

  /* ---------------- Époque contemporaine ---------------- */
  E("prise-bastille", "Prise de la Bastille", 1789, 7, 14, "europe", "politique", 1, "Le peuple de Paris s'empare de la forteresse : début de la Révolution française.");
  E("ddhc", "Déclaration des droits de l'homme et du citoyen", 1789, 8, 26, "europe", "societe", 2, "Texte fondateur adopté par l'Assemblée nationale constituante.");
  E("abolition-privileges", "Nuit du 4 août", 1789, 8, 4, "europe", "politique", 3, "L'Assemblée abolit les privilèges.");
  E("execution-louis-16", "Exécution de Louis XVI", 1793, 1, 21, "europe", "politique", 2, "Le roi est guillotiné place de la Révolution.");
  E("sacre-napoleon", "Sacre de Napoléon Ier", 1804, 12, 2, "europe", "politique", 2, "Napoléon se couronne empereur à Notre-Dame de Paris.");
  E("independance-haiti", "Indépendance d'Haïti", 1804, 1, 1, "ameriques", "politique", 4, "Première république fondée par d'anciens esclaves.");
  E("austerlitz", "Bataille d'Austerlitz", 1805, 12, 2, "europe", "militaire", 2, "Victoire de Napoléon sur les Autrichiens et les Russes.");
  E("waterloo", "Bataille de Waterloo", 1815, 6, 18, "europe", "militaire", 1, "Défaite finale de Napoléon.");
  E("abolition-esclavage-france", "Abolition de l'esclavage en France", 1848, 4, 27, "europe", "societe", 3, "Décret porté par Victor Schœlcher.");
  E("origine-especes", "Publication de « L'Origine des espèces »", 1859, 11, 24, "europe", "sciences", 4, "Darwin expose la théorie de l'évolution par la sélection naturelle.");
  E("gettysburg", "Discours de Gettysburg", 1863, 11, 19, "ameriques", "politique", 5, "Abraham Lincoln définit la démocratie en quelques phrases.");
  E("assassinat-lincoln", "Assassinat d'Abraham Lincoln", 1865, 4, 14, "ameriques", "politique", 3, "Le président est abattu dans un théâtre de Washington.");
  E("commune-paris", "Début de la Commune de Paris", 1871, 3, 18, "europe", "politique", 3, "Insurrection parisienne, écrasée en mai pendant la « Semaine sanglante ».");
  E("tour-eiffel", "Inauguration de la tour Eiffel", 1889, 3, 31, "europe", "arts", 3, "Construite pour l'Exposition universelle de Paris.");
  E("cinematographe", "Première séance publique du cinématographe", 1895, 12, 28, "europe", "cinema", 3, "Les frères Lumière projettent leurs films au Grand Café, à Paris.");
  E("loi-1905", "Loi de séparation des Églises et de l'État", 1905, 12, 9, "europe", "religion", 3, "Fondement de la laïcité en France.");
  E("titanic", "Naufrage du Titanic", 1912, 4, 15, "europe", "exploration", 2, "Le paquebot sombre après avoir heurté un iceberg.");
  E("sarajevo", "Attentat de Sarajevo", 1914, 6, 28, "europe", "politique", 3, "L'assassinat de l'archiduc François-Ferdinand déclenche la Première Guerre mondiale.");
  E("verdun", "Début de la bataille de Verdun", 1916, 2, 21, "europe", "militaire", 3, "L'une des plus longues et meurtrières batailles de la Grande Guerre.");
  E("revolution-octobre", "Révolution d'Octobre", 1917, 11, 7, "europe", "politique", 3, "Les bolcheviks de Lénine prennent le pouvoir en Russie (25 octobre du calendrier julien).");
  E("armistice-1918", "Armistice de 1918", 1918, 11, 11, "europe", "militaire", 1, "Fin des combats de la Première Guerre mondiale.");
  E("krach-1929", "Krach de Wall Street", 1929, 10, 24, "ameriques", "economie", 3, "Le « jeudi noir » ouvre la Grande Dépression.");
  E("hitler-chancelier", "Hitler nommé chancelier", 1933, 1, 30, "europe", "politique", 3, "Arrivée des nazis au pouvoir en Allemagne.");
  E("invasion-pologne", "Invasion de la Pologne", 1939, 9, 1, "europe", "militaire", 2, "Début de la Seconde Guerre mondiale.");
  E("appel-18-juin", "Appel du 18 juin", 1940, 6, 18, "europe", "politique", 1, "De Gaulle appelle les Français à poursuivre le combat depuis Londres.");
  E("pearl-harbor", "Attaque de Pearl Harbor", 1941, 12, 7, "oceanie", "militaire", 2, "Le Japon attaque la flotte américaine à Hawaï.");
  E("debarquement-normandie", "Débarquement en Normandie", 1944, 6, 6, "europe", "militaire", 1, "Le « Jour J » des Alliés.");
  E("liberation-auschwitz", "Libération d'Auschwitz", 1945, 1, 27, "europe", "societe", 3, "L'Armée rouge découvre le camp d'extermination.");
  E("capitulation-allemagne", "Capitulation de l'Allemagne", 1945, 5, 8, "europe", "militaire", 1, "Fin de la Seconde Guerre mondiale en Europe.");
  E("hiroshima", "Bombardement atomique d'Hiroshima", 1945, 8, 6, "asie", "militaire", 2, "Première utilisation de la bombe atomique contre une ville.");
  E("droit-vote-femmes-france", "Premier vote des Françaises", 1945, 4, 29, "europe", "societe", 3, "Les femmes votent pour la première fois, aux élections municipales.");
  E("independance-inde", "Indépendance de l'Inde", 1947, 8, 15, "asie", "politique", 3, "Fin de la domination britannique et partition avec le Pakistan.");
  E("ddh-1948", "Déclaration universelle des droits de l'homme", 1948, 12, 10, "europe", "societe", 3, "Adoptée par l'ONU à Paris.");
  E("republique-populaire-chine", "Proclamation de la République populaire de Chine", 1949, 10, 1, "asie", "politique", 3, "Mao Zedong proclame le nouveau régime à Pékin.");
  E("traite-rome", "Traités de Rome", 1957, 3, 25, "europe", "politique", 3, "Naissance de la Communauté économique européenne.");
  E("spoutnik", "Lancement de Spoutnik 1", 1957, 10, 4, "europe", "sciences", 3, "Premier satellite artificiel, lancé par l'URSS.");
  E("vol-gagarine", "Vol de Youri Gagarine", 1961, 4, 12, "europe", "exploration", 3, "Premier homme dans l'espace.");
  E("independance-algerie", "Indépendance de l'Algérie", 1962, 7, 5, "afrique", "politique", 3, "Fin de la guerre d'Algérie.");
  E("i-have-a-dream", "Discours « I have a dream »", 1963, 8, 28, "ameriques", "societe", 3, "Martin Luther King à la marche sur Washington.");
  E("assassinat-kennedy", "Assassinat de John F. Kennedy", 1963, 11, 22, "ameriques", "politique", 2, "Le président est abattu à Dallas.");
  E("mai-68", "Mai 68", 1968, null, null, "europe", "societe", 1, "Révolte étudiante et grève générale en France.");
  E("homme-sur-lune", "Premiers pas sur la Lune", 1969, 7, 21, "ameriques", "exploration", 1, "Neil Armstrong marche sur la Lune (le 20 juillet heure américaine).");
  E("loi-veil", "Promulgation de la loi Veil", 1975, 1, 17, "europe", "societe", 4, "Dépénalisation de l'interruption volontaire de grossesse en France.");
  E("abolition-peine-mort", "Abolition de la peine de mort en France", 1981, 10, 9, "europe", "societe", 3, "Loi portée par Robert Badinter.");
  E("tchernobyl", "Catastrophe de Tchernobyl", 1986, 4, 26, "europe", "sciences", 2, "Explosion d'un réacteur nucléaire en Ukraine soviétique.");
  E("chute-mur-berlin", "Chute du mur de Berlin", 1989, 11, 9, "europe", "politique", 1, "Le mur s'ouvre ; l'Allemagne est réunifiée l'année suivante.");
  E("liberation-mandela", "Libération de Nelson Mandela", 1990, 2, 11, "afrique", "politique", 3, "Après 27 ans de prison, prélude à la fin de l'apartheid.");
  E("fin-urss", "Dissolution de l'URSS", 1991, 12, 26, "europe", "politique", 3, "Fin de l'Union soviétique et de la guerre froide.");
  E("genocide-rwanda", "Début du génocide des Tutsi au Rwanda", 1994, 4, 7, "afrique", "societe", 3, "Environ 800 000 personnes sont tuées en cent jours.");
  E("attentats-11-septembre", "Attentats du 11 septembre 2001", 2001, 9, 11, "ameriques", "politique", 1, "Des avions détournés frappent le World Trade Center et le Pentagone.");
  E("euro-pieces", "Mise en circulation de l'euro", 2002, 1, 1, "europe", "economie", 2, "Pièces et billets en euros remplacent douze monnaies nationales.");

  /* ---------------- Mise à disposition ---------------- */
  const H = window.HISTEHORY = window.HISTEHORY || {};
  Object.assign(H, { DATES });
})();
