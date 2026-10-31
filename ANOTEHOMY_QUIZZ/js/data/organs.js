/* ==========================================================================
   Anotehomy Quizz - data/organs.js
   CATALOGUE DES ORGANES (nomenclature TA2)
   --------------------------------------------------------------------------
   Une entree par organe (les deux cotes du corps sont des instances du meme organe) :
     G(id, appareil, nom TA2, nom latin, principal, [objets Z-Anatomy], options)
       appareil  : cle de ORGAN_SYSTEMS (digestif, respiratoire...)
       principal : 1 = organe classique (filtre "organes principaux")
       objets    : noms des maillages Z-Anatomy (sans le suffixe .r / .l), pris dans les fichiers
                   VisceralSystem, LymphoidOrgans, NervousSystem, CardioVascular et SkeletalSystem
                   (cartilages du larynx, osselets) ; les parties d'un organe sont regroupees.
                   « VH_F_... » : objets des organes de reference de la femme (Human Reference Atlas,
                   HuBMAP), recales dans le bassin Z-Anatomy (ou sur le thorax : option th) ;
                   « #... » : organes generes par tools/build-organs.ps1 (absents des deux modeles)
       options   : alt (variantes acceptees), old (ancienne nomenclature, reconnue mais comptee
                   fausse), u (organe impair : une seule instance, meme si Z-Anatomy le coupe en
                   deux moities ou le nomme « droit » / « gauche »), c (couleur, sinon celle de
                   l'appareil), s (sexe du corps : 'm' masculin, 'f' feminin ; sans : les deux),
                   th (objets HuBMAP recales sur le thorax)
   Cote du corps : suffixe Z-Anatomy (.r / .l), sinon « Right » / « Left » dans le nom, sinon
   position du maillage (tools/build-organs.ps1).
   Sexe du corps : le modele Z-Anatomy est masculin. Le corps feminin remplace les organes genitaux
   masculins, la vessie, l'uretre et les ureteres (prolonges jusqu'a la vessie feminine) par leurs
   equivalents feminins ; les deux versions d'un organe portent le meme nom. Le ligament large (une
   nappe qui recouvre l'uterus et ses annexes) n'est propose qu'en splanchnologie descriptive.
   Une entree tient sur UNE ligne : tools/build-organs.ps1 lit les objets Z-Anatomy
   directement dans ce fichier.
   Modele 3D : Z-Anatomy (CC BY-SA 4.0), voir CREDITS.md.
   ========================================================================== */
(function (NS) {
  'use strict';

  /* appareils proposes en configuration ; short : nom court des cases de la configuration (sous le titre
     « Appareils ») ; c : couleur par defaut de leurs organes */
  const ORGAN_SYSTEMS = [
    { id: 'digestif', name: 'Appareil digestif', short: 'Digestif', c: 0xd98c7e },
    { id: 'respiratoire', name: 'Appareil respiratoire', short: 'Respiratoire', c: 0xe8a4ab },
    { id: 'urinaire', name: 'Appareil urinaire', short: 'Urinaire', c: 0xe2c674 },
    { id: 'genital', name: 'Appareil génital', short: 'Génital', c: 0xd6a888 },
    { id: 'endocrine', name: 'Glandes endocrines', short: 'Endocrine', c: 0xe0a238 },
    { id: 'lymphatique', name: 'Organes lymphoïdes', short: 'Lymphoïde', c: 0x86c46a },
    { id: 'coeur', name: 'Cœur', short: 'Cœur', c: 0xae4036 },
    { id: 'nerveux', name: 'Encéphale et moelle', short: 'Nerveux', c: 0xdcb4ae },
    { id: 'sens', name: 'Organes des sens', short: 'Sens', c: 0xe8dcc6 }
  ];
  const ORGANS = [];
  function G(id, system, name, latin, principal, z, o = {}) {
    ORGANS.push({ id, system, name, latin, principal: !!principal, z, alt: o.alt || [], old: o.old || [], unpaired: !!o.u, color: o.c || null,
      sex: o.s || null });
  }

  /* ---------------- Appareil digestif ---------------- */
  G('lingua', 'digestif', 'langue', 'lingua', 1, ['Tongue'], { u: 1, c: 0xc65a5c });
  G('palatum_molle', 'digestif', 'palais mou', 'palatum molle', 1, ['Soft palate'], { old: ['voile du palais'], u: 1, c: 0xd77e80 });
  G('uvula_palatina', 'digestif', 'uvule palatine', 'uvula palatina', 1, ['Uvula of palate'], { alt: ['luette'], u: 1, c: 0xd77e80 });
  G('gingiva', 'digestif', 'gencive', 'gingiva', 0, ['Gingiva'], { alt: ['gencives'], u: 1, c: 0xe39a9a });
  G('glandula_parotidea', 'digestif', 'glande parotide', 'glandula parotidea', 1, ['Parotid gland', '(Accessory parotid gland)'], { alt: ['parotide'], c: 0xe4b88c });
  G('ductus_parotideus', 'digestif', 'conduit parotidien', 'ductus parotideus', 0, ['Parotid duct'], { old: ['canal de Sténon', 'canal parotidien'], c: 0xf0d6b0 });
  G('glandula_submandibularis', 'digestif', 'glande submandibulaire', 'glandula submandibularis', 1, ['Submandibular gland'], { old: ['glande sous-maxillaire'], c: 0xe4b88c });
  G('ductus_submandibularis', 'digestif', 'conduit submandibulaire', 'ductus submandibularis', 0, ['Submandibular duct'], { old: ['canal de Wharton', 'canal sous-maxillaire'], c: 0xf0d6b0 });
  G('glandula_sublingualis', 'digestif', 'glande sublinguale', 'glandula sublingualis', 1, ['Sublingual gland'], { c: 0xe4b88c });
  G('pars_nasalis_pharyngis', 'digestif', 'nasopharynx', 'pars nasalis pharyngis', 1, ['Nasopharynx'], { alt: ['partie nasale du pharynx', 'rhinopharynx', 'cavum'], u: 1, c: 0xd48078 });
  G('pars_oralis_pharyngis', 'digestif', 'oropharynx', 'pars oralis pharyngis', 1, ['Oropharynx'], { alt: ['partie orale du pharynx', 'mésopharynx'], u: 1, c: 0xd48078 });
  G('pars_laryngea_pharyngis', 'digestif', 'laryngopharynx', 'pars laryngea pharyngis', 1, ['Laryngopharynx'], { alt: ['partie laryngée du pharynx', 'hypopharynx'], u: 1, c: 0xd48078 });
  G('oesophagus', 'digestif', 'œsophage', 'oesophagus', 1, ['Oesophagus'], { u: 1, c: 0xc97a70 });
  G('gaster', 'digestif', 'estomac', 'gaster', 1, ['Stomach'], { u: 1, c: 0xe39484 });
  G('duodenum', 'digestif', 'duodénum', 'duodenum', 1, ['Duodenum'], { u: 1, c: 0xe8a080 });
  G('jejunum_ileum', 'digestif', 'jéjunum et iléon', 'jejunum et ileum', 1, ['Jejunum'], { alt: ['intestin grêle', 'jéjuno-iléon', 'jéjunum', 'iléon'], u: 1, c: 0xeaa98e });
  G('colon_ascendens', 'digestif', 'côlon ascendant', 'colon ascendens', 1, ['Ascending colon'], { alt: ['caecum et côlon ascendant'], old: ['côlon droit'], u: 1, c: 0xd59a76 });
  G('colon_transversum', 'digestif', 'côlon transverse', 'colon transversum', 1, ['Transverse colon'], { u: 1, c: 0xd59a76 });
  G('colon_descendens', 'digestif', 'côlon descendant', 'colon descendens', 1, ['Descending colon'], { old: ['côlon gauche'], u: 1, c: 0xd59a76 });
  G('colon_sigmoideum', 'digestif', 'côlon sigmoïde', 'colon sigmoideum', 1, ['Sigmoid colon'], { alt: ['sigmoïde'], old: ['côlon pelvien', 'côlon ilio-pelvien'], u: 1, c: 0xd59a76 });
  G('appendix_vermiformis', 'digestif', 'appendice vermiforme', 'appendix vermiformis', 1, ['Vermiform appendix'], { alt: ['appendice'], u: 1, c: 0xd59a76 });
  G('taeniae_coli', 'digestif', 'ténias du côlon', 'taeniae coli', 0, ['Free taenia', 'Mesocolic taenia', 'Omental taenia'], { alt: ['bandelettes du côlon', 'ténia du côlon'], u: 1, c: 0xeed2b8 });
  G('hepar', 'digestif', 'foie', 'hepar', 1, ['Liver'], { u: 1, c: 0x7c3026 });
  G('vesica_biliaris', 'digestif', 'vésicule biliaire', 'vesica biliaris', 1, ['Gallbladder'], { alt: ['vesica fellea'], u: 1, c: 0x4e8f3c });
  G('ductus_choledochus', 'digestif', 'conduit cholédoque', 'ductus choledochus', 1, ['Bile duct'], { alt: ['voie biliaire principale', 'cholédoque'], old: ['canal cholédoque'], u: 1, c: 0x6fae4c });
  G('pancreas', 'digestif', 'pancréas', 'pancreas', 1, ['Pancreas'], { u: 1, c: 0xe6c27c });
  G('ductus_pancreaticus', 'digestif', 'conduit pancréatique', 'ductus pancreaticus', 0, ['Pancreatic duct'], { alt: ['conduit pancréatique principal'], old: ['canal de Wirsung', 'canal pancréatique'], u: 1, c: 0xf4e2b0 });
  G('ductus_pancreaticus_accessorius', 'digestif', 'conduit pancréatique accessoire', 'ductus pancreaticus accessorius', 0, ['Accessory pancreatic duct'], { old: ['canal de Santorini', 'canal pancréatique accessoire'], u: 1, c: 0xf4e2b0 });
  G('omentum_minus', 'digestif', 'petit omentum', 'omentum minus', 0, ['Lesser omentum'], { old: ['petit épiploon'], u: 1, c: 0xf0dcc0 });

  /* ---------------- Appareil respiratoire ---------------- */
  G('cavitas_nasi', 'respiratoire', 'cavité nasale', 'cavitas nasi', 1, ['Mucosa of nasal cavity'], { alt: ['cavités nasales', 'muqueuse nasale'], old: ['fosses nasales'], u: 1, c: 0xd98a8c });
  G('cartilago_septi_nasi', 'respiratoire', 'cartilage septal du nez', 'cartilago septi nasi', 0, ['Nasal septal cartilage', 'Lateral process of nasal septal cartilage'], { alt: ['cartilage du septum nasal', 'cartilage septal'], u: 1, c: 0xd6e2e4 });
  G('cartilago_alaris_major', 'respiratoire', 'grand cartilage alaire', 'cartilago alaris major', 0, ['Major alar cartilage'], { alt: ['cartilage alaire'], c: 0xd6e2e4 });
  G('epiglottis', 'respiratoire', 'épiglotte', 'epiglottis', 1, ['Epiglottis'], { alt: ['cartilage épiglottique'], u: 1, c: 0xe4e8d4 });
  G('cartilago_thyroidea', 'respiratoire', 'cartilage thyroïde', 'cartilago thyroidea', 1, ['Thyroid cartilage'], { alt: ['cartilage thyroïdien'], old: ['pomme d\'Adam'], u: 1, c: 0xd6e2e4 });
  G('cartilago_cricoidea', 'respiratoire', 'cartilage cricoïde', 'cartilago cricoidea', 1, ['Cricoid cartilage'], { u: 1, c: 0xd6e2e4 });
  G('cartilago_arytenoidea', 'respiratoire', 'cartilage aryténoïde', 'cartilago arytenoidea', 0, ['Arytenoid cartilage'], { c: 0xd6e2e4 });
  G('cartilago_corniculata', 'respiratoire', 'cartilage corniculé', 'cartilago corniculata', 0, ['Corniculate cartilage'], { old: ['cartilage de Santorini'], c: 0xd6e2e4 });
  G('trachea', 'respiratoire', 'trachée', 'trachea', 1, ['Trachea'], { u: 1, c: 0xe6dcc6 });
  G('bronchus_principalis', 'respiratoire', 'bronche principale', 'bronchus principalis', 1, ['Right main bronchus', 'Left main bronchus'], { alt: ['bronche principale droite', 'bronche principale gauche'], old: ['bronche souche'], c: 0xe6dcc6 });
  G('bronchus_intermedius', 'respiratoire', 'bronche intermédiaire', 'bronchus intermedius', 0, ['Intermediate bronchus'], { alt: ['tronc intermédiaire'], c: 0xe6dcc6 });
  G('bronchus_lobaris_superior', 'respiratoire', 'bronche lobaire supérieure', 'bronchus lobaris superior', 0, ['Right superior lobar bronchus', 'Left superior lobar bronchus', 'Anterior segmental bronchus of right lung (BIII)', 'Apical segmental bronchus of right lung (BI)', 'Posterior segmental bronchus of right lung (BII)', 'Anterior segmental bronchus of left lung (BIII)', 'Apicoposterior segmental bronchus of left lung (BI+BII)', 'Inferior lingular segmental bronchus of left lung (BV)', 'Superior lingular segmental bronchus of left lung (BIV)'], { c: 0xe6dcc6 });
  G('bronchus_lobaris_medius', 'respiratoire', 'bronche lobaire moyenne', 'bronchus lobaris medius', 0, ['Middle lobar bronchus', 'Lateral segmental bronchus of right lung (BIV)', 'Medial segmental bronchus of right lung (BV)'], { u: 1, c: 0xe6dcc6 });
  G('bronchus_lobaris_inferior', 'respiratoire', 'bronche lobaire inférieure', 'bronchus lobaris inferior', 0, ['Right inferior lobar bronchus', 'Left inferior lobar bronchus', 'Anterior basal segmental bronchus of right lung (BVIII)', 'Lateral basal segmental bronchus of right lung (BIX)', 'Medial basal segmental bronchus of right lung (BVII)', 'Posterior basal segmental bronchus of right lung (BX)', 'Superior segmental bronchus of right lung (BVI)', '(Anteromedial basal segmental bronchus of left lung)', 'Anterior basal segmental bronchus of left lung (BVIII)', 'Lateral basal segmental bronchus of left lung (BIX)', 'Medial basal segmental bronchus of left lung (BVII)', 'Posterior basal segmental bronchus of left lung (BX)', 'Superior segmental bronchus of left lung (BVI)'], { c: 0xe6dcc6 });
  G('lobus_superior_pulmonis', 'respiratoire', 'lobe supérieur du poumon', 'lobus superior pulmonis', 1, ['Superior lobe of right lung', 'Superior lobe of left lung'], { alt: ['lobe supérieur'] });
  G('lobus_medius_pulmonis_dextri', 'respiratoire', 'lobe moyen du poumon droit', 'lobus medius pulmonis dextri', 1, ['Middle lobe of right lung'], { alt: ['lobe moyen'], u: 1, c: 0xeeb4b8 });
  G('lobus_inferior_pulmonis', 'respiratoire', 'lobe inférieur du poumon', 'lobus inferior pulmonis', 1, ['Inferior lobe of right lung', 'Inferior lobe of left lung'], { alt: ['lobe inférieur'], c: 0xdf9aa2 });

  /* ---------------- Appareil urinaire ---------------- */
  G('ren', 'urinaire', 'rein', 'ren', 1, ['Kidney'], { c: 0x8c3a2e });
  G('pelvis_renalis', 'urinaire', 'pelvis rénal', 'pelvis renalis', 1, ['Renal pelvis'], { old: ['bassinet'] });
  G('ureter', 'urinaire', 'uretère', 'ureter', 1, ['Ureter'], { s: 'm' });
  G('ureter_f', 'urinaire', 'uretère', 'ureter', 1, ['#ureter_f'], { s: 'f' });
  G('vesica_urinaria', 'urinaire', 'vessie', 'vesica urinaria', 1, ['Urinary bladder'], { alt: ['vessie urinaire'], u: 1, c: 0xead28c, s: 'm' });
  G('vesica_urinaria_f', 'urinaire', 'vessie', 'vesica urinaria', 1, ['VH_F_fundus_of_urinary_bladder_dome', 'VH_F_fundus_of_urinary_bladder_base', 'VH_F_urinary_bladder_neck_smooth_muscle', 'VH_F_trigone_of_urinary_bladder', 'VH_F_ureteral_orifice_R', 'VH_F_ureteral_orifice_L'], { alt: ['vessie urinaire'], u: 1, c: 0xead28c, s: 'f' });
  G('urethra', 'urinaire', 'urètre', 'urethra masculina', 1, ['Urethra'], { alt: ['urètre masculin'], u: 1, s: 'm' });
  G('urethra_feminina', 'urinaire', 'urètre', 'urethra feminina', 1, ['#urethra_feminina'], { alt: ['urètre féminin'], u: 1, s: 'f' });

  /* ---------------- Appareil génital masculin ---------------- */
  G('testis', 'genital', 'testicule', 'testis', 1, ['Testis'], { c: 0xead6c4, s: 'm' });
  G('epididymis', 'genital', 'épididyme', 'epididymis', 1, ['Epididymis'], { c: 0xc89a7a, s: 'm' });
  G('ductus_deferens', 'genital', 'conduit déférent', 'ductus deferens', 1, ['Ductus deferens'], { old: ['canal déférent'], c: 0xe0c6a2, s: 'm' });
  G('glandula_seminalis', 'genital', 'glande séminale', 'glandula seminalis', 1, ['Seminal gland'], { alt: ['vésicule séminale'], s: 'm' });
  G('ductus_ejaculatorius', 'genital', 'conduit éjaculateur', 'ductus ejaculatorius', 0, ['Ejaculatory duct'], { old: ['canal éjaculateur'], c: 0xe0c6a2, s: 'm' });
  G('prostata', 'genital', 'prostate', 'prostata', 1, ['Prostate'], { u: 1, c: 0xc98a6c, s: 'm' });
  G('corpus_cavernosum_penis', 'genital', 'corps caverneux du pénis', 'corpus cavernosum penis', 1, ['Corpus cavernosum of penis'], { alt: ['corps caverneux'], old: ['corps caverneux de la verge'], u: 1, c: 0xc47a76, s: 'm' });
  G('corpus_spongiosum_penis', 'genital', 'corps spongieux du pénis', 'corpus spongiosum penis', 1, ['Corpus spongiosum of penis'], { alt: ['corps spongieux'], old: ['corps spongieux de la verge'], u: 1, c: 0xd89490, s: 'm' });
  G('glans_penis', 'genital', 'gland du pénis', 'glans penis', 1, ['Glans penis'], { alt: ['gland'], u: 1, c: 0xd89490, s: 'm' });

  /* ---------------- Appareil génital féminin (HuBMAP recalé ; clitoris, bulbes et glandes générés) ---------------- */
  G('ovarium', 'genital', 'ovaire', 'ovarium', 1, ['VH_F_left_ovary', 'VH_F_right_ovary'], { c: 0xe8c4a8, s: 'f' });
  G('tuba_uterina', 'genital', 'trompe utérine', 'tuba uterina', 1, ['VH_F_ampulla_of_uterine_tube_R', 'VH_F_isthmus_of_fallopian_tube_R', 'VH_F_fibria_of_uterine_tube_R', 'VH_F_uterine_tube_infundibulum_R', 'VH_F_ampulla_of_uterine_tube_L', 'VH_F_isthmus_of_fallopian_tube_L', 'VH_F_fibria_of_uterine_tube_L', 'VH_F_uterine_tube_infundibulum_L'], { alt: ['salpinx'], old: ['trompe de Fallope'], c: 0xe0a898, s: 'f' });
  G('uterus', 'genital', 'utérus', 'uterus', 1, ['VH_F_body_of_uterus', 'VH_F_fundus_of_uterus', 'VH_F_cornua', 'VH_F_lower_uterine_segment', 'VH_F_posterior_wall_of_uterus', 'VH_F_anterior_wall_of_uterus', 'VH_F_cervix', 'VH_F_internal_cervical_os', 'VH_F_external_cervical_os'], { old: ['matrice'], u: 1, c: 0xc9706a, s: 'f' });
  G('vagina', 'genital', 'vagin', 'vagina', 1, ['VH_F_vagina', 'VH_F_cervicovaginal_junction'], { u: 1, c: 0xd88a86, s: 'f' });
  G('ligamentum_teres_uteri', 'genital', 'ligament rond de l\'utérus', 'ligamentum teres uteri', 0, ['VH_F_right_round_ligament_of_uterus', 'VH_F_left_round_ligament_of_uterus'], { alt: ['ligament rond'], c: 0xf0dcc0, s: 'f' });
  G('ligamentum_ovarii_proprium', 'genital', 'ligament propre de l\'ovaire', 'ligamentum ovarii proprium', 0, ['VH_F_ovarian_ligament_R', 'VH_F_ovarian_ligament_L'], { old: ['ligament utéro-ovarien'], c: 0xf0dcc0, s: 'f' });
  G('ligamentum_suspensorium_ovarii', 'genital', 'ligament suspenseur de l\'ovaire', 'ligamentum suspensorium ovarii', 0, ['VH_F_suspensory_ligament_of_ovary_R', 'VH_F_suspensory_ligament_of_ovary_L'], { old: ['ligament lombo-ovarien', 'ligament infundibulo-pelvien'], c: 0xf0dcc0, s: 'f' });
  G('ligamentum_cardinale', 'genital', 'ligament cardinal', 'ligamentum cardinale', 0, ['VH_F_right_cardinal_ligament_of_uterus', 'VH_F_left_cardinal_ligament_of_uterus'], { alt: ['ligament transverse du col'], old: ['ligament de Mackenrodt'], c: 0xf0dcc0, s: 'f' });
  G('ligamentum_rectouterinum', 'genital', 'ligament utéro-sacral', 'ligamentum rectouterinum', 0, ['VH_F_right_uterosacral_ligament', 'VH_F_left_uterosacral_ligament'], { alt: ['ligament recto-utérin', 'ligament utéro-sacré'], c: 0xf0dcc0, s: 'f' });
  G('clitoris', 'genital', 'clitoris', 'clitoris', 1, ['#clitoris'], { u: 1, c: 0xc47a76, s: 'f' });
  G('bulbus_vestibuli', 'genital', 'bulbe du vestibule', 'bulbus vestibuli', 0, ['#bulbus_vestibuli'], { alt: ['bulbe vestibulaire'], c: 0xd89490, s: 'f' });
  G('glandula_vestibularis_major', 'genital', 'glande vestibulaire majeure', 'glandula vestibularis major', 0, ['#glandula_vestibularis_major'], { old: ['glande de Bartholin'], c: 0xe4b88c, s: 'f' });
  G('glandula_mammaria', 'genital', 'glande mammaire', 'glandula mammaria', 1, ['VH_F_mammary_lobes_R', 'VH_F_main_lactiferous_ducts_R', 'VH_F_main_lactiferous_sinuses_R', 'VH_F_nipple_R', 'VH_F_areola_R', 'VH_F_areolar_tubercles_R', 'VH_F_mammary_lobes_L', 'VH_F_main_lactiferous_ducts_L', 'VH_F_main_lactiferous_sinuses_L', 'VH_F_nipple_L', 'VH_F_areola_L', 'VH_F_areolar_tubercles_L'], { alt: ['sein', 'mamelle'], c: 0xf0c0a8, s: 'f', th: 1 });

  /* ---------------- Glandes endocrines ---------------- */
  G('glandula_thyroidea', 'endocrine', 'glande thyroïde', 'glandula thyroidea', 1, ['Thyroid gland'], { alt: ['thyroïde'], old: ['corps thyroïde'], u: 1, c: 0xa83c3c });
  G('glandula_parathyroidea_superior', 'endocrine', 'glande parathyroïde supérieure', 'glandula parathyroidea superior', 0, ['Superior parathyroid gland'], { alt: ['parathyroïde supérieure'], c: 0xd0a040 });
  G('glandula_parathyroidea_inferior', 'endocrine', 'glande parathyroïde inférieure', 'glandula parathyroidea inferior', 0, ['Inferior parathyroid gland'], { alt: ['parathyroïde inférieure'], c: 0xd0a040 });
  G('glandula_suprarenalis', 'endocrine', 'glande surrénale', 'glandula suprarenalis', 1, ['Suprarenal gland'], { alt: ['glande suprarénale', 'surrénale'], old: ['capsule surrénale'] });
  G('adenohypophysis', 'endocrine', 'adénohypophyse', 'adenohypophysis', 1, ['Adenohypophysis'], { alt: ['lobe antérieur de l\'hypophyse', 'antéhypophyse'], u: 1, c: 0xd88a6a });
  G('neurohypophysis', 'endocrine', 'neurohypophyse', 'neurohypophysis', 1, ['Neurohypophysis'], { alt: ['lobe postérieur de l\'hypophyse', 'posthypophyse'], u: 1, c: 0xe8b890 });
  G('glandula_pinealis', 'endocrine', 'glande pinéale', 'glandula pinealis', 1, ['Pineal gland'], { alt: ['corps pinéal'], old: ['épiphyse'], u: 1, c: 0xc8a882 });

  /* ---------------- Organes lymphoïdes ---------------- */
  G('splen', 'lymphatique', 'rate', 'splen', 1, ['Spleen'], { alt: ['lien'], u: 1, c: 0x6e2c4c });
  G('thymus', 'lymphatique', 'thymus', 'thymus', 1, ['Left lobe of thymus', 'Right lobe of thymus'], { u: 1, c: 0xead0a8 });
  G('tonsilla_palatina', 'lymphatique', 'tonsille palatine', 'tonsilla palatina', 1, ['Palatine tonsil'], { old: ['amygdale palatine'], c: 0xd88084 });
  G('nodi_submandibulares', 'lymphatique', 'nœuds submandibulaires', 'nodi lymphoidei submandibulares', 0, ['Submandibular nodes'], { alt: ['nœuds lymphatiques submandibulaires'], old: ['ganglions sous-maxillaires'] });
  G('nodi_submentales', 'lymphatique', 'nœuds submentaux', 'nodi lymphoidei submentales', 0, ['Submental nodes'], { alt: ['nœuds lymphatiques submentaux'], old: ['ganglions sous-mentaux'] });
  G('nodi_parotidei', 'lymphatique', 'nœuds parotidiens', 'nodi lymphoidei parotidei', 0, ['Superficial parotid nodes', 'Infra-auricular nodes', 'Intraglandular parotid nodes', 'Pre-auricular nodes'], { alt: ['nœuds lymphatiques parotidiens'], old: ['ganglions parotidiens'] });
  G('nodi_mastoidei', 'lymphatique', 'nœuds mastoïdiens', 'nodi lymphoidei mastoidei', 0, ['Mastoid nodes'], { alt: ['nœuds rétro-auriculaires'], old: ['ganglions mastoïdiens'] });
  G('nodi_occipitales', 'lymphatique', 'nœuds occipitaux', 'nodi lymphoidei occipitales', 0, ['Occipital nodes'], { old: ['ganglions occipitaux'] });
  G('nodi_faciales', 'lymphatique', 'nœuds faciaux', 'nodi lymphoidei faciales', 0, ['Bucinator node', 'Mandibular node', 'Nasolabial node'], { old: ['ganglions faciaux'] });
  G('nodi_retropharyngeales', 'lymphatique', 'nœuds rétropharyngiens', 'nodi lymphoidei retropharyngeales', 0, ['Retropharyngeal nodes'], { old: ['ganglions rétropharyngiens'] });
  G('nodi_cervicales_anteriores', 'lymphatique', 'nœuds cervicaux antérieurs', 'nodi lymphoidei cervicales anteriores', 0, ['Superficial anterior cervical nodes', 'Paratracheal cervical nodes', 'Pretracheal nodes', 'Thyroid nodes'], { old: ['ganglions cervicaux antérieurs'] });
  G('nodi_cervicales_laterales_superficiales', 'lymphatique', 'nœuds cervicaux latéraux superficiels', 'nodi lymphoidei cervicales laterales superficiales', 0, ['Superficial lateral cervical nodes'], { old: ['ganglions jugulaires externes'] });
  G('nodi_cervicales_laterales_profundi', 'lymphatique', 'nœuds cervicaux latéraux profonds', 'nodi lymphoidei cervicales laterales profundi', 1, ['Inferior deep lateral cervical nodes', 'Anterior inferior jugular nodes', 'Jugulodigastric node', 'Lateral superior jugular node'], { alt: ['nœuds jugulaires'], old: ['ganglions jugulaires internes', 'chaîne jugulaire interne'] });
  G('nodi_supraclaviculares', 'lymphatique', 'nœuds supraclaviculaires', 'nodi lymphoidei supraclaviculares', 0, ['Supraclavicular nodes'], { old: ['ganglions sus-claviculaires', 'ganglion de Troisier'] });
  G('nodi_axillares', 'lymphatique', 'nœuds axillaires', 'nodi lymphoidei axillares', 1, ['Anterior axillary nodes', 'Apical axillary nodes', 'Central axillary nodes', 'Lateral axillary nodes', 'Posterior axillary nodes'], { alt: ['nœuds lymphatiques axillaires'], old: ['ganglions axillaires'] });
  G('nodi_infraclaviculares', 'lymphatique', 'nœuds infraclaviculaires', 'nodi lymphoidei infraclaviculares', 0, ['Infraclavicular nodes'], { alt: ['nœuds deltopectoraux'], old: ['ganglions sous-claviculaires'] });
  G('nodi_interpectorales', 'lymphatique', 'nœuds interpectoraux', 'nodi lymphoidei interpectorales', 0, ['Interpectoral nodes'], { old: ['ganglions de Rotter'] });
  G('nodi_brachiales', 'lymphatique', 'nœuds brachiaux', 'nodi lymphoidei brachiales', 0, ['Brachial nodes'], { old: ['ganglions huméraux'] });
  G('nodi_cubitales', 'lymphatique', 'nœuds cubitaux', 'nodi lymphoidei cubitales', 0, ['Cubital nodes', 'Supratrochlear nodes'], { alt: ['nœuds supratrochléaires'], old: ['ganglions épitrochléens'] });
  G('nodi_parasternales', 'lymphatique', 'nœuds parasternaux', 'nodi lymphoidei parasternales', 0, ['Parasternal nodes'], { old: ['ganglions mammaires internes'] });
  G('nodi_intercostales', 'lymphatique', 'nœuds intercostaux', 'nodi lymphoidei intercostales', 0, ['Intercostal nodes'], { old: ['ganglions intercostaux'] });
  G('nodi_mediastinales', 'lymphatique', 'nœuds médiastinaux', 'nodi lymphoidei mediastinales', 0, ['Brachiocephalic nodes', 'Juxta-oesophageal nodes', 'Lateral pericardial nodes', 'Prepericardial nodes', 'Node of arch of azygos vein', 'Node of ligamentum arteriosum', 'Prevertebral nodes'], { old: ['ganglions médiastinaux'] });
  G('nodi_tracheobronchiales', 'lymphatique', 'nœuds trachéobronchiques', 'nodi lymphoidei tracheobronchiales', 0, ['Superior tracheobronchial nodes', 'Inferior tracheobronchial nodes', 'Paratracheal thoracic nodes'], { alt: ['nœuds trachéo-bronchiques'], old: ['ganglions intertrachéobronchiques'] });
  G('nodi_intrapulmonales', 'lymphatique', 'nœuds intrapulmonaires', 'nodi lymphoidei intrapulmonales', 0, ['Intrapulmonary nodes'], { old: ['ganglions intrapulmonaires'] });
  G('nodi_phrenici', 'lymphatique', 'nœuds phréniques', 'nodi lymphoidei phrenici', 0, ['Superior diaphragmatic nodes', 'Inferior diaphragmatic nodes'], { alt: ['nœuds diaphragmatiques'], old: ['ganglions diaphragmatiques'] });
  G('nodi_coeliaci', 'lymphatique', 'nœuds cœliaques', 'nodi lymphoidei coeliaci', 0, ['Coeliac nodes'], { old: ['ganglions cœliaques'] });
  G('nodi_gastrici', 'lymphatique', 'nœuds gastriques et pyloriques', 'nodi lymphoidei gastrici et pylorici', 0, ['Right gastric nodes', 'Right gastro-omental nodes', '(Retropyloric nodes)', '(Subpyloric nodes)', '(Suprapyloric node)'], { alt: ['nœuds gastriques', 'nœuds pyloriques'], old: ['ganglions gastriques'] });
  G('nodi_pancreatici', 'lymphatique', 'nœuds pancréatiques', 'nodi lymphoidei pancreatici', 0, ['Superior pancreatic nodes', 'Inferior pancreatic nodes', 'Superior pancreaticoduodenal nodes'], { alt: ['nœuds pancréatico-duodénaux'], old: ['ganglions pancréatiques'] });
  G('nodi_splenici', 'lymphatique', 'nœuds spléniques', 'nodi lymphoidei splenici', 0, ['Splenic nodes'], { alt: ['nœuds liénaux'], old: ['ganglions spléniques'] });
  G('nodus_cysticus', 'lymphatique', 'nœud cystique', 'nodus lymphoideus cysticus', 0, ['Cystic node'], { old: ['ganglion de Mascagni', 'ganglion cystique'] });
  G('nodi_mesenterici_superiores', 'lymphatique', 'nœuds mésentériques supérieurs', 'nodi lymphoidei mesenterici superiores', 1, ['Central superior mesenteric nodes', 'Juxta-intestinal mesenteric nodes', 'Paracolic superior mesenteric nodes', 'Ileocolic nodes', 'Middle colic nodes', 'Right colic nodes', 'Appendicular nodes', 'Precaecal nodes', 'Retrocaecal nodes'], { alt: ['nœuds mésentériques'], old: ['ganglions mésentériques'] });
  G('nodi_mesenterici_inferiores', 'lymphatique', 'nœuds mésentériques inférieurs', 'nodi lymphoidei mesenterici inferiores', 0, ['Left colic nodes', 'Sigmoid nodes'], { old: ['ganglions mésentériques inférieurs'] });
  G('nodi_lumbales', 'lymphatique', 'nœuds lombaux', 'nodi lymphoidei lumbales', 0, ['Lateral aortic nodes', 'Pre-aortic nodes', 'Retro-aortic nodes', 'Lateral caval nodes', 'Precaval nodes', 'Retrocaval nodes', 'Intermediate lumbar nodes'], { alt: ['nœuds lomboaortiques', 'nœuds latéro-aortiques'], old: ['ganglions lombaires', 'ganglions lombo-aortiques'] });
  G('nodi_epigastrici_inferiores', 'lymphatique', 'nœuds épigastriques inférieurs', 'nodi lymphoidei epigastrici inferiores', 0, ['Inferior epigastric nodes'], { old: ['ganglions épigastriques'] });
  G('nodi_iliaci_communes', 'lymphatique', 'nœuds iliaques communs', 'nodi lymphoidei iliaci communes', 0, ['Intermediate common iliac nodes', 'Lateral common iliac nodes', 'Medial common iliac nodes', 'Median sacral nodes', 'Subaortic nodes'], { old: ['ganglions iliaques primitifs'] });
  G('nodi_iliaci_externi', 'lymphatique', 'nœuds iliaques externes', 'nodi lymphoidei iliaci externi', 0, ['Intermediate external iliac nodes', 'Medial external iliac nodes', 'Obturator nodes', '(Intermediate lacunar node)', '(Lateral lacunar node)', '(Medial lacunar node)'], { old: ['ganglions iliaques externes'] });
  G('nodi_iliaci_interni', 'lymphatique', 'nœuds iliaques internes', 'nodi lymphoidei iliaci interni', 0, ['Lateral sacral nodes'], { alt: ['nœuds sacraux latéraux'], old: ['ganglions hypogastriques'] });
  G('nodi_gluteales', 'lymphatique', 'nœuds glutéaux', 'nodi lymphoidei gluteales', 0, ['Superior gluteal nodes', 'Inferior gluteal nodes'], { old: ['ganglions fessiers'] });
  G('nodi_paravesicales', 'lymphatique', 'nœuds paravésicaux', 'nodi lymphoidei paravesicales', 0, ['Lateral vesical nodes', 'Postvesical nodes', 'Prevesical nodes'], { alt: ['nœuds vésicaux'], old: ['ganglions vésicaux'] });
  G('nodi_pararectales', 'lymphatique', 'nœuds pararectaux', 'nodi lymphoidei pararectales', 0, ['Pararectal nodes'], { alt: ['nœuds anorectaux'], old: ['ganglions rectaux'] });
  G('nodi_inguinales_superficiales', 'lymphatique', 'nœuds inguinaux superficiels', 'nodi lymphoidei inguinales superficiales', 1, ['Inferior superficial inguinal nodes', 'Superolateral superficial inguinal nodes', 'Superomedial superficial inguinal nodes'], { alt: ['nœuds inguinaux'], old: ['ganglions inguinaux superficiels'] });
  G('nodi_inguinales_profundi', 'lymphatique', 'nœuds inguinaux profonds', 'nodi lymphoidei inguinales profundi', 0, ['(Intermediate deep inguinal node)', '(Proximal deep inguinal node)'], { old: ['ganglions inguinaux profonds', 'ganglion de Cloquet'] });
  G('nodi_poplitei', 'lymphatique', 'nœuds poplités', 'nodi lymphoidei poplitei', 0, ['Superficial popliteal nodes', 'Deep popliteal nodes'], { old: ['ganglions poplités'] });
  G('nodi_tibiales', 'lymphatique', 'nœuds tibiaux et fibulaire', 'nodi lymphoidei tibiales et fibularis', 0, ['(Anterior tibial node)', '(Posterior tibial node)', '(Fibular node)'], { alt: ['nœuds tibiaux', 'nœud tibial antérieur'], old: ['ganglion tibial antérieur'] });

  /* ---------------- Cœur ---------------- */
  G('atrium_dextrum', 'coeur', 'atrium droit', 'atrium dextrum', 1, ['Right atrium'], { old: ['oreillette droite'], u: 1, c: 0xc0574c });
  G('ventriculus_dexter', 'coeur', 'ventricule droit', 'ventriculus dexter cordis', 1, ['Right ventricle'], { u: 1, c: 0xa8423a });
  G('atrium_sinistrum', 'coeur', 'atrium gauche', 'atrium sinistrum', 1, ['Left atrium'], { old: ['oreillette gauche'], u: 1, c: 0xc0574c });
  G('ventriculus_sinister', 'coeur', 'ventricule gauche', 'ventriculus sinister cordis', 1, ['Left ventricle'], { u: 1, c: 0x963630 });
  G('musculi_papillares', 'coeur', 'muscles papillaires', 'musculi papillares', 0, ['Anterior papillary muscle of right ventricle', 'Inferior papillary muscle of right ventricle', 'Septal papillary muscle of right ventricle', 'Inferior papillary muscle of left ventricle'], { alt: ['muscle papillaire'], old: ['piliers du cœur', 'muscles papillaires du cœur'], u: 1, c: 0xd06a5e });
  G('valva_aortae', 'coeur', 'valve aortique', 'valva aortae', 0, ['Left coronary leaflet', 'Non-coronary leaflet', 'Right coronary leaflet'], { alt: ['valve de l\'aorte'], old: ['valvule sigmoïde aortique', 'valvules sigmoïdes aortiques'], u: 1, c: 0xf0e2c8 });
  G('valva_trunci_pulmonalis', 'coeur', 'valve du tronc pulmonaire', 'valva trunci pulmonalis', 0, ['Anterior semilunar leaflet of pulmonary valve', 'Left semilunar leaflet of pulmonary valve', 'Right semilunar leaflet of pulmonary valve'], { alt: ['valve pulmonaire'], old: ['valvule sigmoïde pulmonaire', 'valvules sigmoïdes pulmonaires'], u: 1, c: 0xf0e2c8 });
  G('valva_atrioventricularis_dextra', 'coeur', 'valve atrioventriculaire droite', 'valva atrioventricularis dextra', 0, ['Inferior leaflet of right atrioventricular valve', 'Septal leaflet of right atrioventricular valve'], { alt: ['valve tricuspide', 'valve atrio-ventriculaire droite'], u: 1, c: 0xf0e2c8 });
  G('valva_atrioventricularis_sinistra', 'coeur', 'valve atrioventriculaire gauche', 'valva atrioventricularis sinistra', 0, ['Posterior leaflet of left atrioventricular valve'], { alt: ['valve mitrale', 'valve atrio-ventriculaire gauche'], u: 1, c: 0xf0e2c8 });

  /* ---------------- Encéphale et moelle ---------------- */
  G('lobus_frontalis', 'nerveux', 'lobe frontal', 'lobus frontalis', 1, ['Superior frontal gyrus', 'Middle frontal gyrus', 'Opercular part of inferior frontal gyrus', 'Triangular part of inferior frontal gyrus', 'Orbital part of  inferior frontal gyrus', 'Inferior frontal sulcus', 'Superior frontal sulcus', 'Orbital gyri', 'Orbital gyri (Frontomarginal gyrus and sulcus*)', 'Orbital sulci (H-shaped orbital sulci*)', 'Orbital sulci (Lateral Orbital sulcus*)', 'Olfactory sulcus', 'Straight gyrus (Gyrus rectus)', 'Transverse frontopolar gyrus and sulcus*', 'Paracentral gyrus and sulcus*', 'Paracentral sulcus', 'Precentral gyrus', 'Precentral sulcus (Superior part)*', 'Precentral sulcus (inferior part)*'], { c: 0xe2a8a0 });
  G('lobus_parietalis', 'nerveux', 'lobe pariétal', 'lobus parietalis', 1, ['Postcentral gyrus', 'Postcentral sulcus', 'Superior parietal lobule', 'Supramarginal gyrus', 'Angular gyrus', 'Intraparietal sulcus', 'Precuneus', 'Subparietal sulcus', 'Sulcus interm_prim-Jensen'], { c: 0xdcbc98 });
  G('lobus_temporalis', 'nerveux', 'lobe temporal', 'lobus temporalis', 1, ['Superior temporal gyrus (Lateral part)', 'Superior temporal sulcus', 'Middle temporal gyrus', 'Inferior temporal gyrus', 'Inferior temporal sulcus', 'Lateral occipitotemporal gyrus', 'Medial occipitotemporal gyrus (Parahippocampal*)', 'Occipitotemporal sulcus (Lateral part*)', 'Temporal plane', 'Temporal pole', 'Transverse temporal gyri'], { c: 0xc8aacc });
  G('lobus_occipitalis', 'nerveux', 'lobe occipital', 'lobus occipitalis', 1, ['Cuneus', 'Lingual gyrus', 'Superior occipital gyri', 'Lateral occipital gyrus (Middle occipital gyrus*)', 'Inferior occipital gyrus and sulcus*', 'Lunate sulcus', 'Occipital pole', 'Transverse occipital sulcus', 'Anterior occipital sulcus*'], { c: 0xa8bcd8 });
  G('insula', 'nerveux', 'insula', 'insula', 1, ['Insula (Subcentral gyrus and ant. and post. sulci*)', 'Circular sulcus of insula'], { alt: ['lobe de l\'insula', 'lobe insulaire'], c: 0xdccc8c });
  G('lobus_limbicus', 'nerveux', 'gyrus cingulaire', 'gyrus cinguli', 0, ['Cingulate gyrus (Posteroventral part*)', 'Cingulate gyrus and sulcus (Middle anterior part)', 'Cingulate gyrus and sulcus (Middle posterior part)', 'Cingulate gyrus and sulcus (Posterior dorsal part)', 'Cingulate sulcus (Marginal part*)'], { alt: ['lobe limbique', 'circonvolution cingulaire'], c: 0xb8d0a4 });
  G('sulcus_centralis', 'nerveux', 'sillon central', 'sulcus centralis', 1, ['Central sulcus'], { old: ['scissure de Rolando'], c: 0x8a6e6a });
  G('sulcus_lateralis', 'nerveux', 'sillon latéral', 'sulcus lateralis', 1, ['Lat_Fis-post', 'Lat_Fis-ant-Horizont', 'Lat_Fis-ant-Vertical'], { alt: ['fissure latérale'], old: ['scissure de Sylvius', 'scissure latérale'], c: 0x8a6e6a });
  G('sulcus_parietooccipitalis', 'nerveux', 'sillon pariéto-occipital', 'sulcus parietooccipitalis', 0, ['Parieto-occipital sulcus'], { old: ['scissure perpendiculaire interne', 'scissure pariéto-occipitale'], c: 0x8a6e6a });
  G('sulcus_calcarinus', 'nerveux', 'sillon calcarin', 'sulcus calcarinus', 0, ['Calcarine sulcus'], { old: ['scissure calcarine'], c: 0x8a6e6a });
  G('sulcus_collateralis', 'nerveux', 'sillon collatéral', 'sulcus collateralis', 0, ['Collateral sulcus', ' Posterior transverse collateral sulcus'], { old: ['scissure collatérale'], c: 0x8a6e6a });
  G('hippocampus', 'nerveux', 'hippocampe', 'hippocampus', 1, ['Hippocampus'], { old: ['corne d\'Ammon'], c: 0xc4d890 });
  G('corpus_amygdaloideum', 'nerveux', 'corps amygdaloïde', 'corpus amygdaloideum', 1, ['Amygdaloid body'], { alt: ['amygdale cérébrale', 'complexe amygdalien'], old: ['noyau amygdalien'], c: 0xe0a0c0 });
  G('substantia_alba_telencephali', 'nerveux', 'substance blanche du télencéphale', 'substantia alba telencephali', 0, ['White matter of telencephalon', 'Stria terminalis'], { alt: ['substance blanche du cerveau', 'centre semi-ovale'], c: 0xf2eadf });
  G('corpus_callosum', 'nerveux', 'corps calleux', 'corpus callosum', 1, ['Corpus callosum'], { u: 1, c: 0xf6f0e4 });
  G('fornix', 'nerveux', 'fornix', 'fornix', 0, ['Fornix'], { old: ['trigone cérébral'], c: 0xf0e6d4 });
  G('commissura_anterior', 'nerveux', 'commissure antérieure', 'commissura anterior', 0, ['Anterior commissure'], { alt: ['commissure blanche antérieure'], u: 1, c: 0xf0e6d4 });
  G('commissura_posterior', 'nerveux', 'commissure postérieure', 'commissura posterior', 0, ['Posterior commissure'], { alt: ['commissure épithalamique'], u: 1, c: 0xf0e6d4 });
  G('commissura_hippocampi', 'nerveux', 'commissure du fornix', 'commissura fornicis', 0, ['Hippocampal commissure'], { alt: ['commissure hippocampique'], old: ['psaltérium', 'lyre de David'], u: 1, c: 0xf0e6d4 });
  G('septum_pellucidum', 'nerveux', 'septum pellucide', 'septum pellucidum', 0, ['Septum pellucidum'], { old: ['septum lucidum', 'cloison transparente'], u: 1, c: 0xeee2d4 });
  G('nuclei_septales', 'nerveux', 'noyaux septaux', 'nuclei septales', 0, ['Septal nuclei'], { u: 1, c: 0xb49c8c });
  G('ventriculus_lateralis', 'nerveux', 'ventricule latéral', 'ventriculus lateralis', 1, ['Lateral ventricle'], { c: 0x6aa2da });
  G('ventriculus_tertius', 'nerveux', 'troisième ventricule', 'ventriculus tertius', 1, ['Third ventricle'], { alt: ['3e ventricule', 'V3'], u: 1, c: 0x6aa2da });
  G('aqueductus_mesencephali', 'nerveux', 'aqueduc du mésencéphale', 'aqueductus mesencephali', 0, ['Aqueduct of midbrain'], { alt: ['aqueduc cérébral'], old: ['aqueduc de Sylvius'], u: 1, c: 0x6aa2da });
  G('ventriculus_quartus', 'nerveux', 'quatrième ventricule', 'ventriculus quartus', 1, ['Fourth ventricle'], { alt: ['4e ventricule', 'V4'], u: 1, c: 0x6aa2da });
  G('canalis_centralis', 'nerveux', 'canal central de la moelle', 'canalis centralis', 0, ['Central canal', 'Central canal\''], { alt: ['canal central'], old: ['canal de l\'épendyme', 'canal épendymaire'], u: 1, c: 0x6aa2da });
  G('nucleus_caudatus', 'nerveux', 'noyau caudé', 'nucleus caudatus', 1, ['Caudate nucleus'], { c: 0x9c8a7c });
  G('putamen', 'nerveux', 'putamen', 'putamen', 1, ['Putamen'], { c: 0x8c7c70 });
  G('globus_pallidus', 'nerveux', 'globus pallidus', 'globus pallidus', 0, ['Globus pallidus'], { alt: ['pallidum'], c: 0xb4a898 });
  G('thalamus', 'nerveux', 'thalamus', 'thalamus', 1, ['Thalamus'], { alt: ['thalamus dorsal'], old: ['couche optique'], c: 0xb6927c });
  G('hypothalamus', 'nerveux', 'hypothalamus', 'hypothalamus', 1, ['Hypothalamus'], { u: 1, c: 0xc89c84 });
  G('corpus_geniculatum_laterale', 'nerveux', 'corps géniculé latéral', 'corpus geniculatum laterale', 0, ['Lateral geniculate body'], { alt: ['noyau géniculé latéral'], old: ['corps genouillé externe'], c: 0xb6927c });
  G('corpus_geniculatum_mediale', 'nerveux', 'corps géniculé médial', 'corpus geniculatum mediale', 0, ['Medial geniculate body'], { alt: ['noyau géniculé médial'], old: ['corps genouillé interne'], c: 0xb6927c });
  G('corpus_mammillare', 'nerveux', 'corps mamillaire', 'corpus mammillare', 0, ['Mamillary body'], { old: ['tubercule mamillaire'], c: 0xc89c84 });
  G('habenula', 'nerveux', 'habénula', 'habenula', 0, ['Habenula'], { u: 1, c: 0xb6927c });
  G('stria_medullaris_thalami', 'nerveux', 'strie médullaire du thalamus', 'stria medullaris thalami', 0, ['Stria medullaris thalami'], { c: 0xf0e6d4 });
  G('chiasma_opticum', 'nerveux', 'chiasma optique', 'chiasma opticum', 1, ['Optic chiasm'], { u: 1, c: 0xf2e6b8 });
  G('tractus_opticus', 'nerveux', 'tractus optique', 'tractus opticus', 0, ['Optic tract'], { old: ['bandelette optique'], c: 0xf2e6b8 });
  G('mesencephalon', 'nerveux', 'mésencéphale', 'mesencephalon', 1, ['Midbrain', 'Interpeduncular fossa'], { old: ['pédoncules cérébraux'], u: 1, c: 0xd8c2a8 });
  G('crus_cerebri', 'nerveux', 'base du pédoncule cérébral', 'crus cerebri', 0, ['Base of peduncle'], { alt: ['pédoncule cérébral', 'pied du pédoncule cérébral'], c: 0xe4d2bc });
  G('colliculus_superior', 'nerveux', 'colliculus supérieur', 'colliculus superior', 0, ['Superior colliculus'], { old: ['tubercule quadrijumeau antérieur'], c: 0xccae96 });
  G('colliculus_inferior', 'nerveux', 'colliculus inférieur', 'colliculus inferior', 0, ['Inferior colliculus'], { old: ['tubercule quadrijumeau postérieur'], c: 0xccae96 });
  G('nucleus_ruber', 'nerveux', 'noyau rouge', 'nucleus ruber', 0, ['Red nucleus'], { c: 0xc0504a });
  G('pons', 'nerveux', 'pont', 'pons', 1, ['Pons'], { old: ['protubérance annulaire', 'protubérance'], u: 1, c: 0xdcc6aa });
  G('medulla_oblongata', 'nerveux', 'moelle allongée', 'medulla oblongata', 1, ['Medulla oblongata', 'Olive', 'Pyramid of medulla oblongata'], { old: ['bulbe rachidien', 'bulbe'], u: 1, c: 0xe2cfb4 });
  G('hemispherium_cerebelli', 'nerveux', 'hémisphère du cervelet', 'hemispherium cerebelli', 1, ['Anterior quadrangular lobule', 'Posterior quadrangular lobule', 'Superior semilunar lobule', 'Inferior semilunar lobule', 'Gracile lobule', 'Biventral lobule', 'Tonsil of cerebellum', 'Wing of central lobule', 'Flocculus', 'Peduncle of flocculus'], { alt: ['cervelet', 'hémisphère cérébelleux'], c: 0xc89090 });
  G('vermis_cerebelli', 'nerveux', 'vermis du cervelet', 'vermis cerebelli', 0, ['Lingula of cerebellum', 'Central lobule', 'Culmen', 'Declive', 'Folium of vermis', 'Tuber of vermis', 'Pyramis of vermis', 'Uvula of vermis', 'Nodule of vermis'], { alt: ['vermis'], u: 1, c: 0xb47c80 });
  G('pedunculus_cerebellaris_superior', 'nerveux', 'pédoncule cérébelleux supérieur', 'pedunculus cerebellaris superior', 0, ['Superior cerebellar peduncle'], { c: 0xe4d2bc });
  G('medulla_spinalis', 'nerveux', 'moelle spinale', 'medulla spinalis', 1, ['White matter of spinal cord'], { old: ['moelle épinière'], u: 1, c: 0xeadcc6 });
  G('cauda_equina', 'nerveux', 'queue de cheval', 'cauda equina', 0, ['Cauda equina'], { u: 1, c: 0xf2e6b8 });
  G('falx_cerebri', 'nerveux', 'faux du cerveau', 'falx cerebri', 0, ['Falx cerebri'], { u: 1, c: 0xd4cab0 });
  G('tentorium_cerebelli', 'nerveux', 'tente du cervelet', 'tentorium cerebelli', 0, ['Tentorium cerebelli'], { u: 1, c: 0xd4cab0 });

  /* ---------------- Organes des sens ---------------- */
  G('sclera', 'sens', 'sclère', 'sclera', 1, ['Sclera'], { old: ['sclérotique'], c: 0xf6f2ec });
  G('cornea', 'sens', 'cornée', 'cornea', 1, ['Cornea'], { c: 0xb8dcee });
  G('iris', 'sens', 'iris', 'iris', 1, ['Iris'], { c: 0x5a7cb4 });
  G('lens', 'sens', 'cristallin', 'lens', 1, ['Lens'], { alt: ['lentille'], c: 0xeee2a4 });
  G('corpus_vitreum', 'sens', 'corps vitré', 'corpus vitreum', 1, ['Vitreous body'], { alt: ['vitré'], old: ['humeur vitrée'], c: 0xc8e2ea });
  G('retina', 'sens', 'rétine', 'retina', 1, ['Retina'], { c: 0xd86c4c });
  G('camera_anterior', 'sens', 'chambre antérieure du bulbe', 'camera anterior bulbi', 0, ['Anterior chamber of eyeball'], { alt: ['chambre antérieure'], c: 0xa8d4e8 });
  G('zonula_ciliaris', 'sens', 'zonule ciliaire', 'zonula ciliaris', 0, ['Zonular fibres'], { alt: ['fibres zonulaires'], old: ['zonule de Zinn'], c: 0xe8e0c8 });
  G('ligamentum_suspensorium_bulbi', 'sens', 'ligament suspenseur du bulbe', 'ligamentum suspensorium bulbi', 0, ['Suspensory ligament of eyeball'], { old: ['ligament de Lockwood'], c: 0xe0d6c4 });
  G('glandula_lacrimalis', 'sens', 'glande lacrymale', 'glandula lacrimalis', 1, ['Lacrimal gland'], { c: 0xe4b4a2 });
  G('canaliculus_lacrimalis', 'sens', 'canalicule lacrymal', 'canaliculus lacrimalis', 0, ['Lacrimal canaliculus', 'Ampulla of lacrimal canaliculus'], { alt: ['canalicules lacrymaux'], c: 0xe8cdb8 });
  G('saccus_lacrimalis', 'sens', 'sac lacrymal', 'saccus lacrimalis', 0, ['Lacrimal sac'], { c: 0xe8cdb8 });
  G('ductus_nasolacrimalis', 'sens', 'conduit lacrymo-nasal', 'ductus nasolacrimalis', 0, ['Nasolacrimal duct'], { alt: ['conduit nasolacrymal'], old: ['canal lacrymo-nasal'], c: 0xe8cdb8 });
  G('membrana_tympanica', 'sens', 'membrane du tympan', 'membrana tympanica', 1, ['Tympanic membrane'], { alt: ['membrane tympanique', 'tympan'], c: 0xe0c8a2 });
  G('malleus', 'sens', 'malléus', 'malleus', 1, ['Malleus'], { alt: ['marteau'], c: 0xf0e6cc });
  G('incus', 'sens', 'incus', 'incus', 1, ['Incus'], { alt: ['enclume'], c: 0xf0e6cc });
  G('stapes', 'sens', 'stapès', 'stapes', 1, ['Stapes'], { alt: ['étrier'], c: 0xf0e6cc });
  G('tuba_auditiva', 'sens', 'trompe auditive', 'tuba auditiva', 1, ['Auditory tube'], { alt: ['tube auditif', 'trompe pharyngo-tympanique'], old: ['trompe d\'Eustache'], c: 0xd8a490 });
  G('cochlea', 'sens', 'cochlée', 'cochlea', 1, ['Cochlea'], { old: ['limaçon'], c: 0xe8d6a8 });
  G('vestibulum', 'sens', 'vestibule', 'vestibulum', 1, ['Vestibule'], { alt: ['vestibule de l\'oreille interne', 'vestibule osseux'], c: 0xdcc898 });

  const ORGAN = {};
  ORGANS.forEach(o => { ORGAN[o.id] = o; });
  const ORGAN_SYSTEM = {};
  ORGAN_SYSTEMS.forEach(s => { ORGAN_SYSTEM[s.id] = s; });

  Object.assign(NS, { ORGANS, ORGAN, ORGAN_SYSTEMS, ORGAN_SYSTEM });
})(AQ.data);
