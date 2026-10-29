/* ==========================================================================
   construire-monde.js — Fabrique les cartes du monde de GéoNohyne Quizz

   Entrées (Natural Earth, domaine public, https://www.naturalearthdata.com) :
     ne_10m_admin_0_countries_fra.geojson    pays, frontières selon le point de vue de la France
     ne_10m_geography_marine_polys.geojson   océans, mers, golfes, détroits
   Sorties :
     data/monde/carte-pays.js   les 196 pays (territoires rattachés compris) ; Palestine et Bir Tawil en gris
     data/monde/carte-mers.js   océans, mers, golfes et détroits, avec leur niveau de difficulté
     un rapport : voisins terrestres, territoires rattachés, pays riverains et mers voisines,
     pour remplir ou vérifier data/monde/infos-pays.js et data/monde/infos-mers.js

   Projection Equal Earth (surfaces respectées), méridien de Greenwich au centre, sans
   l'Antarctique pour la carte des pays. Les frontières communes à deux pays sont simplifiées
   une seule fois (pas de trou ni de chevauchement entre voisins).

   Utilisé par outils/construire-monde.html (dans le navigateur, sans rien installer).
   Pour ajouter une mer : une ligne dans MERS (nom Natural Earth, ou un point pour un détroit).
   ========================================================================== */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Configuration : pays                                                */
  /* ------------------------------------------------------------------ */

  // Les 196 pays : les 193 membres de l'ONU, le Vatican, le Kosovo et Taïwan (code ISO 3166-1 alpha-3)
  const PAYS = ('AFG AGO ALB AND ARE ARG ARM ATG AUS AUT AZE BDI BEL BEN BFA BGD BGR BHR BHS BIH BLR BLZ BOL BRA ' +
    'BRB BRN BTN BWA CAF CAN CHE CHL CHN CIV CMR COD COG COL COM CPV CRI CUB CYP CZE DEU DJI DMA DNK DOM DZA ' +
    'ECU EGY ERI ESP EST ETH FIN FJI FRA FSM GAB GBR GEO GHA GIN GMB GNB GNQ GRC GRD GTM GUY HND HRV HTI HUN ' +
    'IDN IND IRL IRN IRQ ISL ISR ITA JAM JOR JPN KAZ KEN KGZ KHM KIR KNA KOR KWT LAO LBN LBR LBY LCA LIE LKA ' +
    'LSO LTU LUX LVA MAR MCO MDA MDG MDV MEX MHL MKD MLI MLT MMR MNE MNG MOZ MRT MUS MWI MYS NAM NER NGA NIC ' +
    'NLD NOR NPL NRU NZL OMN PAK PAN PER PHL PLW PNG POL PRK PRT PRY QAT ROU RUS RWA SAU SDN SEN SGP SLB SLE ' +
    'SLV SMR SOM SRB SSD STP SUR SVK SVN SWE SWZ SYC SYR TCD TGO THA TJK TKM TLS TON TTO TUN TUR TUV TWN TZA ' +
    'UGA UKR URY USA UZB VAT VCT VEN VNM VUT WSM XKX YEM ZAF ZMB ZWE').split(' ');

  const CODE_NE = { KOS: 'XKX', SDS: 'SSD' };              // codes Natural Earth différents du code ISO
  // Souverainetés Natural Earth (SOV_A3) : chaque territoire rattaché rejoint son pays
  const SOUVERAIN = { FR1: 'FRA', GB1: 'GBR', US1: 'USA', NL1: 'NLD', DN1: 'DNK', AU1: 'AUS', NZ1: 'NZL',
    CH1: 'CHN', FI1: 'FIN', CU1: 'CUB', KA1: 'KAZ' };
  // Territoires dessinés en gris, non cliquables
  const TERRITOIRES_GRIS = { PSX: 'Palestine', BRT: 'Bir Tawil (terre sans maître)' };
  const IGNORES = ['ATA', 'PGA', 'SCR'];                   // Antarctique (carte des mers seulement), récifs disputés
  const NOMS = { CHN: 'Chine', VAT: 'Vatican', FSM: 'Micronésie' };   // sinon : NAME_FR de Natural Earth
  // Cadre (zone sur laquelle la carte se centre) imposé, en degrés [lon min, lat min, lon max, lat max] :
  // la Russie, rangée en Europe, se cadre sur sa partie européenne
  const CADRES = { RUS: [27, 41, 60, 70] };
  const LIMITE_SAHARA = 27 + 40 / 60;                      // limite Maroc / Sahara occidental (27° 40′ N), en pointillés
  const SEUIL_POINT_PAYS = 12000;                          // km² : en dessous, le pays est signalé par un point

  /* ------------------------------------------------------------------ */
  /* Configuration : mers                                                */
  /* ------------------------------------------------------------------ */
  // ne : noms Natural Earth fusionnés en une seule zone ; point : [lon, lat] pour un détroit trop étroit
  // à cette échelle ; type : ocean, mer, golfe (golfe, baie, bassin) ou detroit (détroit, canal, passage) ;
  // niveau : 1 Facile, 2 Moyen, 3 Difficile, 4 Expert ; etiquette : [lon, lat] du nom écrit sur la carte
  const MERS = [
    { ne: ['North Pacific Ocean', 'South Pacific Ocean'], code: 'pacifique', nom: 'océan Pacifique', type: 'ocean', niveau: 1, etiquette: [-145, 8] },
    { ne: ['North Atlantic Ocean', 'South Atlantic Ocean'], code: 'atlantique', nom: 'océan Atlantique', type: 'ocean', niveau: 1, etiquette: [-35, 18] },
    { ne: ['INDIAN OCEAN'], code: 'indien', nom: 'océan Indien', type: 'ocean', niveau: 1, etiquette: [78, -22] },
    { ne: ['Arctic Ocean'], code: 'arctique', nom: 'océan Arctique', type: 'ocean', niveau: 1, etiquette: [-30, 84] },
    { ne: ['SOUTHERN OCEAN'], code: 'austral', nom: 'océan Austral', type: 'ocean', niveau: 1, etiquette: [20, -64] },

    { ne: ['Mediterranean Sea'], code: 'mediterranee', nom: 'mer Méditerranée', type: 'mer', niveau: 1 },
    { ne: ['Caribbean Sea'], code: 'caraibes', nom: 'mer des Caraïbes', type: 'mer', niveau: 1 },
    { ne: ['Red Sea'], code: 'mer-rouge', nom: 'mer Rouge', type: 'mer', niveau: 1 },
    { ne: ['Black Sea'], code: 'mer-noire', nom: 'mer Noire', type: 'mer', niveau: 1 },
    { ne: ['Baltic Sea'], code: 'baltique', nom: 'mer Baltique', type: 'mer', niveau: 1 },
    { ne: ['North Sea'], code: 'mer-du-nord', nom: 'mer du Nord', type: 'mer', niveau: 1 },
    { ne: ['Caspian Sea'], code: 'caspienne', nom: 'mer Caspienne', type: 'mer', niveau: 1 },
    { ne: ['Gulf of Mexico'], code: 'golfe-du-mexique', nom: 'golfe du Mexique', type: 'golfe', niveau: 1 },
    { ne: ['Persian Gulf'], code: 'golfe-persique', nom: 'golfe Persique', type: 'golfe', niveau: 1 },
    { ne: ['English Channel'], code: 'manche', nom: 'Manche', type: 'mer', niveau: 1 },
    { ne: ['South China Sea'], code: 'mer-de-chine-meridionale', nom: 'mer de Chine méridionale', type: 'mer', niveau: 1 },
    { ne: ['Hudson Bay'], code: 'baie-d-hudson', nom: 'baie d\'Hudson', type: 'golfe', niveau: 1 },
    { point: [35.5, 31.5], code: 'mer-morte', nom: 'mer Morte', type: 'mer', niveau: 1 },

    { ne: ['Arabian Sea'], code: 'mer-d-arabie', nom: 'mer d\'Arabie', type: 'mer', niveau: 2 },
    { ne: ['Bay of Bengal'], code: 'golfe-du-bengale', nom: 'golfe du Bengale', type: 'golfe', niveau: 2 },
    { ne: ['Sea of Japan'], code: 'mer-du-japon', nom: 'mer du Japon', type: 'mer', niveau: 2 },
    { ne: ['East China Sea'], code: 'mer-de-chine-orientale', nom: 'mer de Chine orientale', type: 'mer', niveau: 2 },
    { ne: ['Yellow Sea'], code: 'mer-jaune', nom: 'mer Jaune', type: 'mer', niveau: 2 },
    { ne: ['Philippine Sea'], code: 'mer-des-philippines', nom: 'mer des Philippines', type: 'mer', niveau: 2 },
    { ne: ['Sea of Okhotsk'], code: 'mer-d-okhotsk', nom: 'mer d\'Okhotsk', type: 'mer', niveau: 2 },
    { ne: ['Bering Sea'], code: 'mer-de-bering', nom: 'mer de Béring', type: 'mer', niveau: 2 },
    { ne: ['Barents Sea'], code: 'mer-de-barents', nom: 'mer de Barents', type: 'mer', niveau: 2 },
    { ne: ['Norwegian Sea'], code: 'mer-de-norvege', nom: 'mer de Norvège', type: 'mer', niveau: 2 },
    { ne: ['Greenland Sea'], code: 'mer-du-groenland', nom: 'mer du Groenland', type: 'mer', niveau: 2 },
    { ne: ['Tasman Sea'], code: 'mer-de-tasman', nom: 'mer de Tasman', type: 'mer', niveau: 2 },
    { ne: ['Coral Sea', 'Great Barrier Reef'], code: 'mer-de-corail', nom: 'mer de Corail', type: 'mer', niveau: 2 },
    { ne: ['Bay of Biscay'], code: 'golfe-de-gascogne', nom: 'golfe de Gascogne', type: 'golfe', niveau: 2 },
    { ne: ['Adriatic Sea'], code: 'mer-adriatique', nom: 'mer Adriatique', type: 'mer', niveau: 2 },
    { ne: ['Aegean Sea'], code: 'mer-egee', nom: 'mer Égée', type: 'mer', niveau: 2 },
    { ne: ['Tyrrhenian Sea'], code: 'mer-tyrrhenienne', nom: 'mer Tyrrhénienne', type: 'mer', niveau: 2 },
    { ne: ['Ionian Sea'], code: 'mer-ionienne', nom: 'mer Ionienne', type: 'mer', niveau: 2 },
    { ne: ['Gulf of Guinea'], code: 'golfe-de-guinee', nom: 'golfe de Guinée', type: 'golfe', niveau: 2 },
    { ne: ['Mozambique Channel'], code: 'canal-du-mozambique', nom: 'canal du Mozambique', type: 'detroit', niveau: 2 },
    { ne: ['Gulf of Aden'], code: 'golfe-d-aden', nom: 'golfe d\'Aden', type: 'golfe', niveau: 2 },
    { ne: ['Gulf of Alaska'], code: 'golfe-d-alaska', nom: 'golfe d\'Alaska', type: 'golfe', niveau: 2 },
    { ne: ['Labrador Sea'], code: 'mer-du-labrador', nom: 'mer du Labrador', type: 'mer', niveau: 2 },
    { ne: ['Baffin Bay'], code: 'baie-de-baffin', nom: 'baie de Baffin', type: 'golfe', niveau: 2 },
    { ne: ['Weddell Sea'], code: 'mer-de-weddell', nom: 'mer de Weddell', type: 'mer', niveau: 2 },
    { ne: ['Ross Sea'], code: 'mer-de-ross', nom: 'mer de Ross', type: 'mer', niveau: 2 },
    { ne: ['Gulf of Bothnia'], code: 'golfe-de-botnie', nom: 'golfe de Botnie', type: 'golfe', niveau: 2 },
    { ne: ['Irish Sea'], code: 'mer-d-irlande', nom: 'mer d\'Irlande', type: 'mer', niveau: 2 },
    { ne: ['Sea of Azov'], code: 'mer-d-azov', nom: 'mer d\'Azov', type: 'mer', niveau: 2 },
    { ne: ['Golfo de California'], code: 'golfe-de-californie', nom: 'golfe de Californie', type: 'golfe', niveau: 2 },
    { ne: ['Gulf of Thailand'], code: 'golfe-de-thailande', nom: 'golfe de Thaïlande', type: 'golfe', niveau: 2 },
    { point: [-64, -58], code: 'passage-de-drake', nom: 'passage de Drake', type: 'detroit', niveau: 2 },
    { ne: ['Strait of Malacca'], code: 'detroit-de-malacca', nom: 'détroit de Malacca', type: 'detroit', niveau: 2 },
    { point: [-5.6, 35.95], code: 'detroit-de-gibraltar', nom: 'détroit de Gibraltar', type: 'detroit', niveau: 2 },
    { point: [29.06, 41.12], code: 'bosphore', nom: 'Bosphore', type: 'detroit', niveau: 2 },
    { point: [-168.95, 65.75], code: 'detroit-de-bering', nom: 'détroit de Béring', type: 'detroit', niveau: 2 },
    { point: [1.45, 51.0], code: 'pas-de-calais', nom: 'pas de Calais', type: 'detroit', niveau: 2 },
    { point: [56.45, 26.5], code: 'detroit-d-ormuz', nom: 'détroit d\'Ormuz', type: 'detroit', niveau: 2 },

    { ne: ['Beaufort Sea'], code: 'mer-de-beaufort', nom: 'mer de Beaufort', type: 'mer', niveau: 3 },
    { ne: ['Chukchi Sea'], code: 'mer-des-tchouktches', nom: 'mer des Tchouktches', type: 'mer', niveau: 3 },
    { ne: ['East Siberian Sea'], code: 'mer-de-siberie-orientale', nom: 'mer de Sibérie orientale', type: 'mer', niveau: 3 },
    { ne: ['Laptev Sea'], code: 'mer-de-laptev', nom: 'mer de Laptev', type: 'mer', niveau: 3 },
    { ne: ['Kara Sea'], code: 'mer-de-kara', nom: 'mer de Kara', type: 'mer', niveau: 3 },
    { ne: ['White Sea'], code: 'mer-blanche', nom: 'mer Blanche', type: 'mer', niveau: 3 },
    { ne: ['Java Sea'], code: 'mer-de-java', nom: 'mer de Java', type: 'mer', niveau: 3 },
    { ne: ['Banda Sea'], code: 'mer-de-banda', nom: 'mer de Banda', type: 'mer', niveau: 3 },
    { ne: ['Celebes Sea'], code: 'mer-de-celebes', nom: 'mer de Célèbes', type: 'mer', niveau: 3 },
    { ne: ['Sulu Sea'], code: 'mer-de-sulu', nom: 'mer de Sulu', type: 'mer', niveau: 3 },
    { ne: ['Timor Sea'], code: 'mer-de-timor', nom: 'mer de Timor', type: 'mer', niveau: 3 },
    { ne: ['Arafura Sea'], code: 'mer-d-arafura', nom: 'mer d\'Arafura', type: 'mer', niveau: 3 },
    { ne: ['Andaman Sea'], code: 'mer-d-andaman', nom: 'mer d\'Andaman', type: 'mer', niveau: 3 },
    { ne: ['Laccadive Sea'], code: 'mer-des-laquedives', nom: 'mer des Laquedives', type: 'mer', niveau: 3 },
    { ne: ['Bismarck Sea'], code: 'mer-de-bismarck', nom: 'mer de Bismarck', type: 'mer', niveau: 3 },
    { ne: ['Solomon Sea'], code: 'mer-des-salomon', nom: 'mer des Salomon', type: 'mer', niveau: 3 },
    { ne: ['Amundsen Sea'], code: 'mer-d-amundsen', nom: 'mer d\'Amundsen', type: 'mer', niveau: 3 },
    { ne: ['Bellingshausen Sea'], code: 'mer-de-bellingshausen', nom: 'mer de Bellingshausen', type: 'mer', niveau: 3 },
    { ne: ['Sargasso Sea'], code: 'mer-des-sargasses', nom: 'mer des Sargasses', type: 'mer', niveau: 3 },
    { ne: ['Gulf of Finland'], code: 'golfe-de-finlande', nom: 'golfe de Finlande', type: 'golfe', niveau: 3 },
    { ne: ['Gulf of Riga'], code: 'golfe-de-riga', nom: 'golfe de Riga', type: 'golfe', niveau: 3 },
    { ne: ['Sea of Marmara'], code: 'mer-de-marmara', nom: 'mer de Marmara', type: 'mer', niveau: 3 },
    { ne: ['Alboran Sea'], code: 'mer-d-alboran', nom: 'mer d\'Alboran', type: 'mer', niveau: 3 },
    { ne: ['Kattegat'], code: 'cattegat', nom: 'Cattégat', type: 'detroit', niveau: 3 },
    { ne: ['Skagerrak'], code: 'skagerrak', nom: 'Skagerrak', type: 'detroit', niveau: 3 },
    { ne: ['Gulf of Oman'], code: 'golfe-d-oman', nom: 'golfe d\'Oman', type: 'golfe', niveau: 3 },
    { ne: ['Gulf of Carpentaria'], code: 'golfe-de-carpentarie', nom: 'golfe de Carpentarie', type: 'golfe', niveau: 3 },
    { ne: ['Great Australian Bight'], code: 'grande-baie-australienne', nom: 'Grande baie australienne', type: 'golfe', niveau: 3 },
    { ne: ['Gulf of Tonkin'], code: 'golfe-du-tonkin', nom: 'golfe du Tonkin', type: 'golfe', niveau: 3 },
    { ne: ['Gulf of Sidra'], code: 'golfe-de-syrte', nom: 'golfe de Syrte', type: 'golfe', niveau: 3 },
    { ne: ['Golfe du Lion'], code: 'golfe-du-lion', nom: 'golfe du Lion', type: 'golfe', niveau: 3 },
    { ne: ['Gulf of Saint Lawrence'], code: 'golfe-du-saint-laurent', nom: 'golfe du Saint-Laurent', type: 'golfe', niveau: 3 },
    { ne: ['Río de la Plata'], code: 'rio-de-la-plata', nom: 'Río de la Plata', type: 'golfe', niveau: 3 },
    { ne: ['Taiwan Strait'], code: 'detroit-de-taiwan', nom: 'détroit de Taïwan', type: 'detroit', niveau: 3 },
    { ne: ['Korea Strait'], code: 'detroit-de-coree', nom: 'détroit de Corée', type: 'detroit', niveau: 3 },
    { ne: ['Straits of Florida'], code: 'detroit-de-floride', nom: 'détroit de Floride', type: 'detroit', niveau: 3 },
    { ne: ['Davis Strait'], code: 'detroit-de-davis', nom: 'détroit de Davis', type: 'detroit', niveau: 3 },
    { ne: ['Denmark Strait'], code: 'detroit-de-danemark', nom: 'détroit de Danemark', type: 'detroit', niveau: 3 },
    { ne: ['Hudson Strait'], code: 'detroit-d-hudson', nom: 'détroit d\'Hudson', type: 'detroit', niveau: 3 },
    { ne: ['Bass Strait'], code: 'detroit-de-bass', nom: 'détroit de Bass', type: 'detroit', niveau: 3 },
    { ne: ['The North Western Passages'], code: 'passage-du-nord-ouest', nom: 'passage du Nord-Ouest', type: 'detroit', niveau: 3 },
    { point: [43.4, 12.6], code: 'bab-el-mandeb', nom: 'détroit de Bab-el-Mandeb', type: 'detroit', niveau: 3 },
    { point: [26.45, 40.2], code: 'dardanelles', nom: 'détroit des Dardanelles', type: 'detroit', niveau: 3 },
    { point: [15.62, 38.22], code: 'detroit-de-messine', nom: 'détroit de Messine', type: 'detroit', niveau: 3 },
    { point: [9.2, 41.32], code: 'bouches-de-bonifacio', nom: 'bouches de Bonifacio', type: 'detroit', niveau: 3 },
    { point: [12.7, 55.95], code: 'oresund', nom: 'Øresund', type: 'detroit', niveau: 3 },
    { point: [142.3, -10.3], code: 'detroit-de-torres', nom: 'détroit de Torrès', type: 'detroit', niveau: 3 },
    { point: [-70.8, -53.6], code: 'detroit-de-magellan', nom: 'détroit de Magellan', type: 'detroit', niveau: 3 },
    { point: [174.6, -41.2], code: 'detroit-de-cook', nom: 'détroit de Cook', type: 'detroit', niveau: 3 },

    { ne: ['Molucca Sea'], code: 'mer-des-moluques', nom: 'mer des Moluques', type: 'mer', niveau: 4 },
    { ne: ['Flores Sea'], code: 'mer-de-flores', nom: 'mer de Florès', type: 'mer', niveau: 4 },
    { ne: ['Ceram Sea'], code: 'mer-de-seram', nom: 'mer de Seram', type: 'mer', niveau: 4 },
    { ne: ['Halmahera Sea'], code: 'mer-d-halmahera', nom: 'mer d\'Halmahera', type: 'mer', niveau: 4 },
    { ne: ['Savu Sea'], code: 'mer-de-savu', nom: 'mer de Savu', type: 'mer', niveau: 4 },
    { ne: ['Bali Sea'], code: 'mer-de-bali', nom: 'mer de Bali', type: 'mer', niveau: 4 },
    { ne: ['Bo Hai'], code: 'mer-de-bohai', nom: 'mer de Bohai', type: 'mer', niveau: 4 },
    { ne: ['Inner Sea'], code: 'mer-de-seto', nom: 'mer intérieure de Seto', type: 'mer', niveau: 4 },
    { ne: ['Balearic Sea'], code: 'mer-des-baleares', nom: 'mer des Baléares', type: 'mer', niveau: 4 },
    { ne: ['Ligurian Sea'], code: 'mer-ligure', nom: 'mer Ligure', type: 'mer', niveau: 4 },
    { ne: ['Sea of Crete'], code: 'mer-de-crete', nom: 'mer de Crète', type: 'mer', niveau: 4 },
    { ne: ['Inner Seas'], code: 'mer-des-hebrides', nom: 'mer des Hébrides', type: 'mer', niveau: 4 },
    { ne: ['Waddenzee'], code: 'mer-des-wadden', nom: 'mer des Wadden', type: 'mer', niveau: 4 },
    { ne: ['Lincoln Sea'], code: 'mer-de-lincoln', nom: 'mer de Lincoln', type: 'mer', niveau: 4 },
    { ne: ['Davis Sea'], code: 'mer-de-davis', nom: 'mer de Davis', type: 'mer', niveau: 4 },
    { ne: ['Salish Sea'], code: 'mer-des-salish', nom: 'mer des Salish', type: 'mer', niveau: 4 },
    { ne: ['Gulf of Suez'], code: 'golfe-de-suez', nom: 'golfe de Suez', type: 'golfe', niveau: 4 },
    { ne: ['Gulf of Aqaba'], code: 'golfe-d-aqaba', nom: 'golfe d\'Aqaba', type: 'golfe', niveau: 4 },
    { ne: ['Gulf of Gabès'], code: 'golfe-de-gabes', nom: 'golfe de Gabès', type: 'golfe', niveau: 4 },
    { ne: ['Gulf of Kutch'], code: 'golfe-de-kutch', nom: 'golfe de Kutch', type: 'golfe', niveau: 4 },
    { ne: ['Gulf of Khambhät'], code: 'golfe-de-cambay', nom: 'golfe de Cambay', type: 'golfe', niveau: 4 },
    { ne: ['Gulf of Mannar'], code: 'golfe-de-mannar', nom: 'golfe de Mannar', type: 'golfe', niveau: 4 },
    { ne: ['Gulf of Martaban'], code: 'golfe-de-martaban', nom: 'golfe de Martaban', type: 'golfe', niveau: 4 },
    { ne: ['Gulf of Papua'], code: 'golfe-de-papouasie', nom: 'golfe de Papouasie', type: 'golfe', niveau: 4 },
    { ne: ['Shelikhova Gulf'], code: 'golfe-de-chelikhov', nom: 'golfe de Chelikhov', type: 'golfe', niveau: 4 },
    { ne: ['Gulf of Anadyr\''], code: 'golfe-d-anadyr', nom: 'golfe d\'Anadyr', type: 'golfe', niveau: 4 },
    { ne: ['Gulf of Ob'], code: 'golfe-de-l-ob', nom: 'golfe de l\'Ob', type: 'golfe', niveau: 4 },
    { ne: ['Bight of Benin'], code: 'golfe-du-benin', nom: 'golfe du Bénin', type: 'golfe', niveau: 4 },
    { ne: ['Bight of Biafra'], code: 'golfe-du-biafra', nom: 'golfe du Biafra', type: 'golfe', niveau: 4 },
    { ne: ['Gulf of Honduras'], code: 'golfe-du-honduras', nom: 'golfe du Honduras', type: 'golfe', niveau: 4 },
    { ne: ['Golfo de Panamá'], code: 'golfe-de-panama', nom: 'golfe de Panama', type: 'golfe', niveau: 4 },
    { ne: ['Bahía de Campeche'], code: 'baie-de-campeche', nom: 'baie de Campêche', type: 'golfe', niveau: 4 },
    { ne: ['Golfo de Tehuantepec'], code: 'golfe-de-tehuantepec', nom: 'golfe de Tehuantepec', type: 'golfe', niveau: 4 },
    { ne: ['Golfo de Guayaquil'], code: 'golfe-de-guayaquil', nom: 'golfe de Guayaquil', type: 'golfe', niveau: 4 },
    { ne: ['Gulf of Maine'], code: 'golfe-du-maine', nom: 'golfe du Maine', type: 'golfe', niveau: 4 },
    { ne: ['Bay of Fundy'], code: 'baie-de-fundy', nom: 'baie de Fundy', type: 'golfe', niveau: 4 },
    { ne: ['Chesapeake Bay'], code: 'baie-de-chesapeake', nom: 'baie de Chesapeake', type: 'golfe', niveau: 4 },
    { ne: ['Bristol Bay'], code: 'baie-de-bristol', nom: 'baie de Bristol', type: 'golfe', niveau: 4 },
    { ne: ['James Bay'], code: 'baie-james', nom: 'baie James', type: 'golfe', niveau: 4 },
    { ne: ['Ungava Bay'], code: 'baie-d-ungava', nom: 'baie d\'Ungava', type: 'golfe', niveau: 4 },
    { ne: ['Foxe Basin'], code: 'bassin-de-foxe', nom: 'bassin de Foxe', type: 'golfe', niveau: 4 },
    { ne: ['Gulf of Boothia'], code: 'golfe-de-boothia', nom: 'golfe de Boothia', type: 'golfe', niveau: 4 },
    { ne: ['Makassar Strait'], code: 'detroit-de-macassar', nom: 'détroit de Macassar', type: 'detroit', niveau: 4 },
    { point: [18.9, 40.3], code: 'canal-d-otrante', nom: 'canal d\'Otrante', type: 'detroit', niveau: 4 },
    { point: [36.55, 45.3], code: 'detroit-de-kertch', nom: 'détroit de Kertch', type: 'detroit', niveau: 4 },
    { point: [11.8, 37.3], code: 'canal-de-sicile', nom: 'canal de Sicile', type: 'detroit', niveau: 4 },
    { point: [105.8, -6.0], code: 'detroit-de-la-sonde', nom: 'détroit de la Sonde', type: 'detroit', niveau: 4 },
    { point: [103.9, 1.2], code: 'detroit-de-singapour', nom: 'détroit de Singapour', type: 'detroit', niveau: 4 },
    { point: [79.6, 9.8], code: 'detroit-de-palk', nom: 'détroit de Palk', type: 'detroit', niveau: 4 },
    { point: [140.6, 41.45], code: 'detroit-de-tsugaru', nom: 'détroit de Tsugaru', type: 'detroit', niveau: 4 },
    { point: [142.0, 45.65], code: 'detroit-de-la-perouse', nom: 'détroit de La Pérouse', type: 'detroit', niveau: 4 },
    { point: [141.5, 52.1], code: 'detroit-de-tartarie', nom: 'détroit de Tartarie', type: 'detroit', niveau: 4 },
    { point: [121.0, 20.5], code: 'detroit-de-lucon', nom: 'détroit de Luçon', type: 'detroit', niveau: 4 },
    { point: [-85.9, 21.7], code: 'canal-du-yucatan', nom: 'canal du Yucatán', type: 'detroit', niveau: 4 },
    { point: [-56.6, 51.55], code: 'detroit-de-belle-isle', nom: 'détroit de Belle-Isle', type: 'detroit', niveau: 4 }
  ];
  const SEUIL_POINT_MER = 15000;                           // km² : en dessous, la mer est aussi signalée par un point
  // Riverains détectés à tort (limite entre deux mers qui finit tout près d'une frontière, découpage de Natural Earth)
  const RIVERAINS_RETIRES = { 'mer-adriatique': ['GRC'], indien: ['NZL'] };

  /* ------------------------------------------------------------------ */
  /* Projection Equal Earth                                              */
  /* ------------------------------------------------------------------ */
  const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
  const LARGEUR = 1000, MARGE = 10;
  const TOLERANCE = 0.22;                                  // simplification, en unités de la carte (≈ 7,5 km)
  const AIRE_MINI = 0.04;                                  // îlots plus petits (unités², ≈ 50 km²) supprimés
  const ZOOM_MAX = 24;                                     // zoom maximal dans le jeu (14 par défaut : carte de France)

  function equalEarth(lon, lat) {
    const t = Math.asin(M * Math.sin(lat * Math.PI / 180)), t2 = t * t, t6 = t2 * t2 * t2;
    return [lon * Math.PI / 180 * Math.cos(t) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))),
            t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))];
  }
  const X_MAX = equalEarth(180, 0)[0];
  const Y_MAX = equalEarth(0, 90)[1];
  const ECHELLE = LARGEUR / (2 * X_MAX);
  const KM2 = Math.pow(6371.0088 / ECHELLE, 2);           // km² par unité² (la projection conserve les surfaces)
  const projeter = (lon, lat) => {
    const [x, y] = equalEarth(lon, lat);
    return [(x + X_MAX) * ECHELLE + MARGE, (Y_MAX - y) * ECHELLE + MARGE];
  };
  const arrondi = (v) => Math.round(v * 10) / 10;

  // Cadre [x0, y0, x1, y1] d'un rectangle de degrés (les méridiens sont courbes : on échantillonne les bords)
  function cadreDegres([lon0, lat0, lon1, lat1]) {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const lon = lon0 + (lon1 - lon0) * i / 20, lat = lat0 + (lat1 - lat0) * i / 20;
      pts.push(projeter(lon, lat0), projeter(lon, lat1), projeter(lon0, lat), projeter(lon1, lat));
    }
    return boite(pts).map(arrondi);
  }

  /* ------------------------------------------------------------------ */
  /* Géométrie                                                           */
  /* ------------------------------------------------------------------ */
  function polygones(geom) {
    if (!geom) return [];
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
    // anneaux sans le point de fermeture répété, longs segments densifiés
    return polys.map((p) => p.map((r) => densifier((r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]) ? r.slice(0, -1) : r)));
  }

  // Les méridiens sont courbes dans la projection : un segment de plus d'un degré (bord à 180°, frontière
  // le long d'un méridien) reçoit des points intermédiaires. Calcul fait dans un ordre fixe, pour qu'un
  // segment commun à deux pays donne exactement les mêmes points dans les deux.
  function densifier(r) {
    const res = [];
    for (let i = 0, n = r.length; i < n; i++) {
      const a = r[i], b = r[(i + 1) % n];
      res.push(a);
      const k = Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])));
      if (k < 2) continue;
      const inverse = a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);
      const [u, v] = inverse ? [b, a] : [a, b];
      const pts = [];
      for (let j = 1; j < k; j++) pts.push([u[0] + (v[0] - u[0]) * j / k, u[1] + (v[1] - u[1]) * j / k]);
      res.push(...(inverse ? pts.reverse() : pts));
    }
    return res;
  }

  function aire(pts) {
    let a = 0;
    for (let i = 0, n = pts.length; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      a += p[0] * q[1] - q[0] * p[1];
    }
    return Math.abs(a) / 2;
  }

  function boite(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(([x, y]) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; });
    return [x0, y0, x1, y1];
  }

  function dansAnneau([x, y], r) {
    let dedans = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) dedans = !dedans;
    }
    return dedans;
  }

  function distSegment2(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ex = ax + t * dx - px, ey = ay + t * dy - py;
    return ex * ex + ey * ey;
  }

  // Douglas-Peucker sur une chaîne ouverte (extrémités conservées)
  function douglasPeucker(pts, tol) {
    const n = pts.length;
    if (n <= 2) return pts.slice();
    const garde = new Uint8Array(n);
    garde[0] = garde[n - 1] = 1;
    const pile = [[0, n - 1]], tol2 = tol * tol;
    while (pile.length) {
      const [a, b] = pile.pop();
      let max = 0, idx = -1;
      for (let i = a + 1; i < b; i++) {
        const d = distSegment2(pts[i][0], pts[i][1], pts[a][0], pts[a][1], pts[b][0], pts[b][1]);
        if (d > max) { max = d; idx = i; }
      }
      if (max > tol2) { garde[idx] = 1; pile.push([a, idx], [idx, b]); }
    }
    return pts.filter((_, i) => garde[i]);
  }

  // Anneau projeté, simplifié, arrondi au dixième. fixes : indices à conserver (jonctions entre pays) ;
  // les morceaux entre deux points fixes, communs à deux pays, sont donc simplifiés à l'identique.
  function simplifier(anneau, fixes, cles) {
    const n = anneau.length;
    const P = anneau.map(([lon, lat]) => projeter(lon, lat));
    let f = fixes.slice();
    if (f.length < 2) {
      // Pas de jonction (île, enclave entière) : ancres choisies d'après les coordonnées seules,
      // donc identiques pour les deux anneaux qui partagent ce contour
      let a = f.length ? f[0] : 0;
      if (!f.length) for (let i = 1; i < n; i++) if (cles[i] < cles[a]) a = i;
      let b = a, dmax = -1;
      for (let i = 0; i < n; i++) {
        const d = (P[i][0] - P[a][0]) ** 2 + (P[i][1] - P[a][1]) ** 2;
        if (d > dmax) { dmax = d; b = i; }
      }
      f = a === b ? [a] : [Math.min(a, b), Math.max(a, b)];
    }
    let res = [];
    if (f.length === 1) res = P.slice();
    else {
      for (let k = 0; k < f.length; k++) {
        const i = f[k], j = f[(k + 1) % f.length], chaine = [];
        for (let t = i; ; t = (t + 1) % n) { chaine.push(P[t]); if (t === j) break; }
        const s = douglasPeucker(chaine, TOLERANCE);
        s.pop();
        res.push(...s);
      }
    }
    const out = [];
    res.forEach(([x, y]) => {
      const p = [arrondi(x), arrondi(y)], q = out[out.length - 1];
      if (!q || q[0] !== p[0] || q[1] !== p[1]) out.push(p);
    });
    if (out.length > 1 && out[0][0] === out[out.length - 1][0] && out[0][1] === out[out.length - 1][1]) out.pop();
    return out.length >= 3 ? out : null;
  }

  const chemin = (anneaux) => anneaux.map((r) => 'M' + r.map((p) => p[0] + ' ' + p[1]).join('L') + 'Z').join('');

  // Polygones simplifiés : [{ ext, trous }] ; les îlots trop petits disparaissent, sauf le plus grand
  function simplifierPolygones(polys, fixesDe) {
    const res = [];
    polys.forEach((poly) => {
      const ext = simplifier(poly[0], ...fixesDe(poly[0]));
      if (!ext) return;
      const trous = poly.slice(1).map((r) => simplifier(r, ...fixesDe(r))).filter((r) => r && aire(r) >= AIRE_MINI);
      res.push({ ext, trous, aire: aire(ext) });
    });
    if (!res.length) return res;
    const plusGrand = res.reduce((a, b) => (b.aire > a.aire ? b : a));
    return res.filter((p) => p === plusGrand || p.aire >= AIRE_MINI);
  }
  const anneauxDe = (polys) => polys.flatMap((p) => [p.ext, ...p.trous]);

  // Point bien à l'intérieur d'un anneau (pour poser un point ou un repère) : le centroïde s'il est dedans,
  // sinon le point d'une grille le plus éloigné du bord
  function pointInterieur(r) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, n = r.length; i < n; i++) {
      const [x0, y0] = r[i], [x1, y1] = r[(i + 1) % n], k = x0 * y1 - x1 * y0;
      a += k; cx += (x0 + x1) * k; cy += (y0 + y1) * k;
    }
    if (a) { cx /= 3 * a; cy /= 3 * a; if (dansAnneau([cx, cy], r)) return [arrondi(cx), arrondi(cy)]; }
    const [x0, y0, x1, y1] = boite(r);
    let meilleur = r[0], dmax = -1;
    for (let i = 1; i < 30; i++) for (let j = 1; j < 30; j++) {
      const p = [x0 + (x1 - x0) * i / 30, y0 + (y1 - y0) * j / 30];
      if (!dansAnneau(p, r)) continue;
      let d = Infinity;
      for (let k = 0, n = r.length; k < n; k++) d = Math.min(d, distSegment2(p[0], p[1], ...r[k], ...r[(k + 1) % n]));
      if (d > dmax) { dmax = d; meilleur = p; }
    }
    return [arrondi(meilleur[0]), arrondi(meilleur[1])];
  }

  // Contour de la projection (fond d'océan) : bords à ±180°
  function contourTerre() {
    const pts = [];
    for (let lat = 90; lat >= -90; lat -= 2) pts.push(projeter(-180, lat));
    for (let lat = -90; lat <= 90; lat += 2) pts.push(projeter(180, lat));
    return chemin([pts.map(([x, y]) => [arrondi(x), arrondi(y)])]);
  }

  // Vue (cadrage de la carte) entre deux latitudes
  function vueEntre(latNord, latSud) {
    const yN = projeter(0, latNord)[1], yS = projeter(0, latSud)[1];
    return { x: 0, y: arrondi(yN), w: LARGEUR + 2 * MARGE, h: arrondi(yS - yN) };
  }

  /* ------------------------------------------------------------------ */
  /* Carte des pays                                                      */
  /* ------------------------------------------------------------------ */
  function construirePays(geo, rapport) {
    const feats = geo.features.map((f) => ({ p: f.properties, polys: polygones(f.geometry) }));

    // Propriétaires de chaque sommet (pour garder les frontières communes identiques)
    const proprio = new Map();
    feats.forEach((f, fi) => f.polys.forEach((poly) => poly.forEach((r) => r.forEach((c) => {
      const k = c[0] + ',' + c[1], o = proprio.get(k);
      if (o === undefined) proprio.set(k, [fi]);
      else if (!o.includes(fi)) o.push(fi);
    }))));
    proprio.forEach((o, k) => proprio.set(k, o.sort((a, b) => a - b).join('|')));
    const fixesDe = (r) => {
      const cles = r.map((c) => c[0] + ',' + c[1]), own = cles.map((k) => proprio.get(k)), n = r.length, f = [];
      for (let i = 0; i < n; i++) if (own[i] !== own[(i - 1 + n) % n] || own[i] !== own[(i + 1) % n]) f.push(i);
      return [f, cles];
    };

    // À quelle zone appartient chaque entité Natural Earth ?
    const zoneDe = feats.map((f) => {
      const a3 = f.p.ADM0_A3;
      if (IGNORES.includes(a3)) return null;
      if (TERRITOIRES_GRIS[a3]) return '#' + a3;
      const code = CODE_NE[a3] || a3;
      if (PAYS.includes(code)) return code;
      return SOUVERAIN[f.p.SOV_A3] || (PAYS.includes(f.p.ISO_A3_EH) ? f.p.ISO_A3_EH : null);
    });
    const propre = feats.map((f, fi) => zoneDe[fi] === (CODE_NE[f.p.ADM0_A3] || f.p.ADM0_A3));

    const zones = new Map();
    rapport.ignores = [];
    rapport.territoires = {};
    feats.forEach((f, fi) => {
      const z = zoneDe[fi];
      if (!z) { if (!IGNORES.includes(f.p.ADM0_A3)) rapport.ignores.push(f.p.ADM0_A3 + ' ' + f.p.NAME_FR); return; }
      if (!zones.has(z)) zones.set(z, { polys: [], propres: [], brut: [], label: null, nom: null });
      const zone = zones.get(z);
      const s = simplifierPolygones(f.polys, fixesDe);
      zone.polys.push(...s);
      if (propre[fi] || z[0] === '#') {
        zone.propres.push(...s);
        zone.brut.push(...f.polys);
        zone.nom = NOMS[z] || TERRITOIRES_GRIS[z.slice(1)] || f.p.NAME_FR;
        zone.label = projeter(f.p.LABEL_X, f.p.LABEL_Y).map(arrondi);
      } else {
        (rapport.territoires[z] = rapport.territoires[z] || []).push(f.p.NAME_FR);
      }
    });
    rapport.manquants = PAYS.filter((c) => !zones.has(c) || !zones.get(c).nom);

    // Voisins terrestres : deux entités qui partagent au moins un segment de frontière
    const voisins = {};
    const ajouter = (a, b) => { if (a && b && a !== b) { (voisins[a] = voisins[a] || new Set()).add(b); } };
    feats.forEach((f, fi) => f.polys.forEach((poly) => poly.forEach((r) => {
      for (let i = 0, n = r.length; i < n; i++) {
        const u = proprio.get(r[i][0] + ',' + r[i][1]), v = proprio.get(r[(i + 1) % n][0] + ',' + r[(i + 1) % n][1]);
        if (u.indexOf('|') < 0 || v.indexOf('|') < 0) continue;
        const vs = v.split('|');
        u.split('|').forEach((g) => { if (+g !== fi && vs.includes(g)) ajouter(zoneDe[fi], zoneDe[+g]); });
      }
    })));
    rapport.voisins = {};
    Object.keys(voisins).filter((z) => z[0] !== '#').sort().forEach((z) => { rapport.voisins[z] = [...voisins[z]].sort(); });

    // Vérifications : quelques points disputés, et à quelle zone ils appartiennent
    const contient = (code, lon, lat) => zones.get(code).brut.some((poly) => dansAnneau([lon, lat], poly[0]) && !poly.slice(1).some((h) => dansAnneau([lon, lat], h)));
    const ouEst = (lon, lat) => [...zones.keys()].find((c) => contient(c, lon, lat)) || 'aucune';
    rapport.verifications = {
      'Crimée (34.1, 45.0)': ouEst(34.1, 45.0), 'Sahara occidental (-13, 25)': ouEst(-13, 25),
      'Chypre du Nord (33.6, 35.25)': ouEst(33.6, 35.25), 'Somaliland (45, 9.5)': ouEst(45, 9.5),
      'Cisjordanie (35.25, 32.0)': ouEst(35.25, 32.0), 'Groenland (-42, 72)': ouEst(-42, 72)
    };

    // Éléments de la carte
    const elements = [], decor = [{ d: contourTerre(), classe: 'ocean', fond: true }];
    zones.forEach((zone, code) => {
      if (code[0] === '#') {
        decor.push({ nom: zone.nom, d: chemin(anneauxDe(zone.polys)), classe: 'territoire' });
        return;
      }
      if (!PAYS.includes(code) || !zone.nom) return;
      const superficie = zone.brut.reduce((s, poly) => s + aire(poly[0].map((c) => projeter(...c))) -
        poly.slice(1).reduce((t, h) => t + aire(h.map((c) => projeter(...c))), 0), 0) * KM2;
      // Pays minuscule (le Vatican…) : son contour disparaît à cette échelle, seul son point reste
      const [cx, cy] = zone.label;
      const el = { code, nom: zone.nom, d: chemin(anneauxDe(zone.polys)), cx, cy, type: 'pays',
        cadre: CADRES[code] ? cadreDegres(CADRES[code]) : zone.propres.length ? cadreGroupe(zone.propres) : [cx, cy, cx, cy] };
      if (superficie < SEUIL_POINT_PAYS || !zone.propres.length) el.point = true;
      elements.push(el);
    });
    // Les petits pays (points) sont dessinés en dernier, au-dessus de leurs voisins
    elements.sort((a, b) => (!!a.point - !!b.point) || (a.code < b.code ? -1 : 1));

    // Limite Maroc / Sahara occidental : le long du parallèle, entre la côte et la frontière algérienne
    const xs = [];
    zones.get('MAR').brut.forEach((poly) => poly.forEach((r) => {
      for (let i = 0, n = r.length; i < n; i++) {
        const [a, b] = [r[i], r[(i + 1) % n]];
        if ((a[1] - LIMITE_SAHARA) * (b[1] - LIMITE_SAHARA) < 0) xs.push(a[0] + (LIMITE_SAHARA - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
    }));
    if (xs.length >= 2) {
      const p = projeter(Math.min(...xs), LIMITE_SAHARA).map(arrondi), q = projeter(Math.max(...xs), LIMITE_SAHARA).map(arrondi);
      decor.push({ d: 'M' + p.join(' ') + 'L' + q.join(' '), classe: 'limite-disputee', dessus: true });
    }

    // Trous des pays (lacs, mais aussi enclaves, que leur pays recouvre) : sur la carte des mers, ils
    // cachent les mers de Natural Earth qui passent dessous (les Grands Lacs ne sont pas l'Atlantique)
    const lacs = [];
    zones.forEach((zone) => zone.polys.forEach((p) => lacs.push(...p.trous)));

    return {
      lacs,
      carte: {
        version: 2,
        nom: 'Monde : les pays',
        credit: 'Contours : Natural Earth (domaine public), frontières selon le point de vue de la France. Projection Equal Earth.',
        largeur: LARGEUR + 2 * MARGE,
        hauteur: Math.round(2 * Y_MAX * ECHELLE + 2 * MARGE),
        vue: vueEntre(85, -58),
        zoomMax: ZOOM_MAX,
        decor,
        elements
      },
      zones,
      antarctique: feats.filter((f) => f.p.ADM0_A3 === 'ATA')
    };
  }

  // Cadre d'un pays : sa plus grande île et les terres proches (à moins de ~500 km), pas les îles lointaines
  function cadreGroupe(polys) {
    const grands = polys.filter((p) => p.aire >= 0.5);
    const liste = (grands.length ? grands : polys).map((p) => boite(p.ext));
    const aires = (grands.length ? grands : polys).map((p) => p.aire);
    let i0 = aires.indexOf(Math.max(...aires));
    let b = liste[i0].slice();
    const pris = new Set([i0]);
    const dist = (u, v) => Math.hypot(Math.max(0, u[0] - v[2], v[0] - u[2]), Math.max(0, u[1] - v[3], v[1] - u[3]));
    for (let change = true; change;) {
      change = false;
      liste.forEach((c, i) => {
        if (pris.has(i) || dist(b, c) > 15) return;
        pris.add(i); change = true;
        b = [Math.min(b[0], c[0]), Math.min(b[1], c[1]), Math.max(b[2], c[2]), Math.max(b[3], c[3])];
      });
    }
    return b.map(arrondi);
  }

  /* ------------------------------------------------------------------ */
  /* Carte des mers                                                      */
  /* ------------------------------------------------------------------ */
  function construireMers(geo, pays, rapport) {
    const parNom = new Map();
    geo.features.forEach((f) => {
      const n = f.properties.name;
      if (n) (parNom.get(n) || parNom.set(n, []).get(n)).push(f);
    });
    const sansFixes = (r) => [[], r.map((c) => c[0] + ',' + c[1])];
    rapport.mersIntrouvables = [];
    const brut = {};                                       // code -> anneaux bruts (lon/lat), pour les calculs

    const elements = MERS.map((m) => {
      const el = { code: m.code, nom: m.nom, type: m.type, niveau: m.niveau };
      if (m.point) {
        const p = projeter(...m.point).map(arrondi);
        return Object.assign(el, { d: '', cx: p[0], cy: p[1], point: true });
      }
      const feats = m.ne.flatMap((n) => parNom.get(n) || []);
      m.ne.filter((n) => !parNom.has(n)).forEach((n) => rapport.mersIntrouvables.push(n));
      const polysBruts = feats.flatMap((f) => polygones(f.geometry));
      brut[m.code] = polysBruts.flatMap((p) => p);
      const polys = simplifierPolygones(polysBruts, sansFixes);
      if (!polys.length) { rapport.mersIntrouvables.push(m.code + ' (vide après simplification)'); return null; }
      const plusGrand = polys.reduce((a, b) => (b.aire > a.aire ? b : a));
      const c = m.etiquette ? projeter(...m.etiquette).map(arrondi) : pointInterieur(plusGrand.ext);
      Object.assign(el, { d: chemin(anneauxDe(polys)), cx: c[0], cy: c[1], dessous: true });
      const superficie = polysBruts.reduce((s, poly) => s + aire(poly[0].map((q) => projeter(...q))), 0) * KM2;
      if (superficie < SEUIL_POINT_MER) el.point = true;
      if (m.etiquette) el.etiquette = m.nom.charAt(0).toUpperCase() + m.nom.slice(1);
      return el;
    }).filter(Boolean);
    // Les grandes étendues d'abord, les petites par-dessus ; les points en dernier
    elements.sort((a, b) => (!!a.point - !!b.point) || (a.type === 'ocean' ? 0 : 1) - (b.type === 'ocean' ? 0 : 1));

    calculerVoisinages(brut, pays, rapport);

    // Antarctique : terre grise sous les mers australes
    const antarctique = simplifierPolygones(pays.antarctique.flatMap((f) => f.polys), sansFixes);
    return {
      version: 2,
      nom: 'Monde : océans, mers, golfes et détroits',
      credit: 'Mers : Natural Earth (domaine public, d\'après les limites de l\'OHI). Projection Equal Earth.',
      largeur: LARGEUR + 2 * MARGE,
      hauteur: Math.round(2 * Y_MAX * ECHELLE + 2 * MARGE),
      vue: vueEntre(85, -80),
      zoomMax: ZOOM_MAX,
      decor: [{ d: contourTerre(), classe: 'ocean', fond: true }, { d: chemin(pays.lacs), classe: 'lac' },
        { d: chemin(anneauxDe(antarctique)), classe: 'terre', nom: 'Antarctique' }],
      elements
    };
  }

  // Pays riverains (côtes à moins de ~4 km du bord d'une mer, hors limites entre deux mers) et mers voisines
  function calculerVoisinages(brut, pays, rapport) {
    const EPS = 0.04, EPS_MER = 0.06, CELL = 1;
    const grille = new Map();
    const cle = (i, j) => i + ',' + j;
    const segments = [];
    Object.keys(brut).forEach((mer) => brut[mer].forEach((r) => {
      for (let i = 0, n = r.length; i < n; i++) {
        const a = r[i], b = r[(i + 1) % n];
        const s = { mer, ax: a[0], ay: a[1], bx: b[0], by: b[1], inter: false };
        segments.push(s);
        const i0 = Math.floor((Math.min(a[0], b[0]) - EPS_MER) / CELL), i1 = Math.floor((Math.max(a[0], b[0]) + EPS_MER) / CELL);
        const j0 = Math.floor((Math.min(a[1], b[1]) - EPS_MER) / CELL), j1 = Math.floor((Math.max(a[1], b[1]) + EPS_MER) / CELL);
        for (let x = i0; x <= i1; x++) for (let y = j0; y <= j1; y++) {
          const k = cle(x, y);
          (grille.get(k) || grille.set(k, []).get(k)).push(s);
        }
      }
    }));
    const proches = (lon, lat) => grille.get(cle(Math.floor(lon / CELL), Math.floor(lat / CELL))) || [];

    // Limites entre deux mers : segments longés par le bord d'une autre mer
    const contact = {};
    segments.forEach((s) => {
      const mx = (s.ax + s.bx) / 2, my = (s.ay + s.by) / 2;
      proches(mx, my).forEach((t) => {
        if (t.mer === s.mer || distSegment2(mx, my, t.ax, t.ay, t.bx, t.by) > EPS_MER * EPS_MER) return;
        s.inter = true;
        const c = contact[s.mer] = contact[s.mer] || {};
        c[t.mer] = (c[t.mer] || 0) + 1;
      });
    });
    rapport.voisines = {};
    Object.keys(brut).forEach((a) => {
      const v = Object.keys(brut).filter((b) => b !== a && ((contact[a] || {})[b] >= 2 || (contact[b] || {})[a] >= 2));
      rapport.voisines[a] = v;
    });

    // Riverains : sommets des côtes de chaque pays (territoires compris) proches d'un bord « côtier »
    const touches = {};
    pays.featsParZone.forEach((polys, code) => polys.forEach((poly) => poly.forEach((r) => r.forEach(([lon, lat]) => {
      proches(lon, lat).forEach((s) => {
        if (s.inter || distSegment2(lon, lat, s.ax, s.ay, s.bx, s.by) > EPS * EPS) return;
        const t = touches[s.mer] = touches[s.mer] || {};
        t[code] = (t[code] || 0) + 1;
      });
    }))));
    // Petites îles que la mer n'a pas découpées : le point d'étiquette du pays (ou d'un de ses territoires) est dans la mer
    Object.keys(brut).forEach((mer) => {
      const b = boite(brut[mer].flat());
      pays.etiquettes.forEach(({ code, lon, lat }) => {
        if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) return;
        if (brut[mer].filter((r) => dansAnneau([lon, lat], r)).length % 2) {
          const t = touches[mer] = touches[mer] || {};
          t[code] = (t[code] || 0) + 2;
        }
      });
    });
    rapport.riverains = {};
    Object.keys(brut).forEach((mer) => {
      const t = touches[mer] || {}, retires = RIVERAINS_RETIRES[mer] || [];
      rapport.riverains[mer] = Object.keys(t).filter((c) => t[c] >= 2 && !retires.includes(c)).sort();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Point d'entrée                                                      */
  /* ------------------------------------------------------------------ */
  function construire(geoPays, geoMers) {
    const rapport = {};
    const pays = construirePays(geoPays, rapport);
    // Contours bruts de chaque pays (territoires compris), pour les riverains des mers
    pays.featsParZone = new Map();
    pays.etiquettes = [];
    geoPays.features.forEach((f) => {
      const a3 = f.properties.ADM0_A3;
      if (IGNORES.includes(a3) || TERRITOIRES_GRIS[a3]) return;
      const code = PAYS.includes(CODE_NE[a3] || a3) ? (CODE_NE[a3] || a3)
        : SOUVERAIN[f.properties.SOV_A3] || (PAYS.includes(f.properties.ISO_A3_EH) ? f.properties.ISO_A3_EH : null);
      if (!code) return;
      (pays.featsParZone.get(code) || pays.featsParZone.set(code, []).get(code)).push(...polygones(f.geometry));
      pays.etiquettes.push({ code, lon: f.properties.LABEL_X, lat: f.properties.LABEL_Y });
    });
    const carteMers = construireMers(geoMers, pays, rapport);
    rapport.stats = {
      pays: pays.carte.elements.length,
      paysPoints: pays.carte.elements.filter((e) => e.point).map((e) => e.code),
      mers: carteMers.elements.length,
      mersParNiveau: [1, 2, 3, 4].map((n) => carteMers.elements.filter((e) => e.niveau === n).length)
    };
    return { cartePays: pays.carte, carteMers, rapport };
  }

  // Texte complet d'un fichier data/monde/carte-xxx.js
  function versScript(id, carte) {
    const net = (s) => String(s || '').replace(/\*\//g, '* /').replace(/[\r\n]+/g, ' ');
    return '/* Carte GéoNohyne Quizz : ' + net(carte.nom) + '\n' +
      '   ' + net(carte.credit) + '\n' +
      '   Fichier généré (outils/construire-monde.html) : ne pas modifier à la main. */\n' +
      'GeoCarte.enregistrer(' + JSON.stringify(id) + ', ' + JSON.stringify(carte) + ');\n';
  }

  root.ConstruireMonde = { construire, versScript, PAYS, MERS };
})(typeof window !== 'undefined' ? window : globalThis);
