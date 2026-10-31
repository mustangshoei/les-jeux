/* ==========================================================================
   Anotehomy Quizz - data/splanchnology.js
   CATALOGUE DE LA SPLANCHNOLOGIE DESCRIPTIVE (nomenclature TA2)
   --------------------------------------------------------------------------
   Un organe étudié (O), suivi de ses parties (P) :
     O(clé, appareil, nom, nom latin, source, options)
       appareil : clé de ORGAN_SYSTEMS (js/data/organs.js)
       source   : 'h' = organes de référence de la femme du Human Reference Atlas (HuBMAP,
                  CC BY 4.0) ; 'z' = Z-Anatomy (CC BY-SA 4.0)
       options  : s (sexe du corps : 'm' ou 'f' ; sans : les deux), c (couleur de base des parties)
     P(id, nom TA2, nom latin, [objets 3D], options)
       objets   : noms exacts des objets de la source (Z-Anatomy : suffixe .r / .l compris) ;
                  « * » remplace n'importe quels caractères
       options  : alt (variantes acceptées), old (ancienne nomenclature, reconnue mais comptée
                  fausse), c (couleur), k (vaisseau ou conduit coupé : seuls ses triangles à moins
                  de k mm des autres parties sont gardés)
   Une entrée tient sur UNE ligne : tools/build-splanchno.ps1 lit les objets directement dans ce
   fichier et produit un modèle par organe (js/data/splanchno/<clé>.js, chargé à la demande).
   ========================================================================== */
(function (NS) {
  'use strict';

  const SPLANCHNO = [];
  let cur = null;
  function O(key, system, name, latin, src, o = {}) {
    cur = { key, system, name, latin, src, sex: o.s || null, color: o.c || 0xd8a8a0, parts: [] };
    SPLANCHNO.push(cur);
  }
  function P(id, name, latin, z, o = {}) {
    cur.parts.push({ id, organ: cur.key, name, latin, z, alt: o.alt || [], old: o.old || [], color: o.c || null });
  }

  /* ---------------- Appareil digestif ---------------- */
  O('duodenum_pancreas', 'digestif', 'duodénum et pancréas', 'duodenum et pancreas', 'h', { c: 0xe6c27c });
  P('caput_pancreatis', 'tête du pancréas', 'caput pancreatis', ['VH_F_head_of_pancreas'], { c: 0xe6c27c });
  P('processus_uncinatus', 'processus unciné', 'processus uncinatus pancreatis', ['VH_F_ucinate_process1'], { alt: ['processus unciné du pancréas'], old: ['crochet du pancréas', 'petit pancréas de Winslow'], c: 0xd8b068 });
  P('collum_pancreatis', 'col du pancréas', 'collum pancreatis', ['VH_F_neck_of_pancreas'], { old: ['isthme du pancréas'], c: 0xf0d08c });
  P('corpus_pancreatis', 'corps du pancréas', 'corpus pancreatis', ['VH_F_body_of_pancreas'], { c: 0xe2bc70 });
  P('cauda_pancreatis', 'queue du pancréas', 'cauda pancreatis', ['VH_F_tail_of_pancreas'], { c: 0xd4aa5e });
  P('ductus_pancreaticus', 'conduit pancréatique', 'ductus pancreaticus', ['VH_F_ventral_pancreatic_duct'], { alt: ['conduit pancréatique principal'], old: ['canal de Wirsung', 'canal pancréatique'], c: 0xfff0b8 });
  P('ductus_pancreaticus_accessorius', 'conduit pancréatique accessoire', 'ductus pancreaticus accessorius', ['VH_F_dorsal_pancreatic_duct'], { old: ['canal de Santorini'], c: 0xfff6d0 });
  P('ductus_choledochus', 'conduit cholédoque', 'ductus choledochus', ['VH_F_common_bile_duct'], { alt: ['cholédoque', 'voie biliaire principale'], old: ['canal cholédoque'], c: 0x6fae4c });
  P('ampulla_hepatopancreatica', 'ampoule hépato-pancréatique', 'ampulla hepatopancreatica', ['VH_F_hepatopancreatic_ampulla'], { alt: ['ampoule hépatopancréatique'], old: ['ampoule de Vater'], c: 0x8cc06a });
  P('musculus_sphincter_ampullae', 'muscle sphincter de l\'ampoule', 'musculus sphincter ampullae hepatopancreaticae', ['VH_F_sphincter_of_heptopancreatic_ampulla'], { alt: ['sphincter de l\'ampoule hépato-pancréatique'], old: ['sphincter d\'Oddi'], c: 0xc0786a });
  P('pars_superior_duodeni', 'partie supérieure du duodénum', 'pars superior duodeni', ['VH_F_duodenum_superior'], { alt: ['D1', 'premier duodénum'], c: 0xe8a080 });
  P('ampulla_duodeni', 'ampoule du duodénum', 'ampulla duodeni', ['VH_F_duodenal_ampulla'], { alt: ['bulbe duodénal'], c: 0xf0b494 });
  P('pars_descendens_duodeni', 'partie descendante du duodénum', 'pars descendens duodeni', ['VH_F_duodenum_descending'], { alt: ['D2', 'deuxième duodénum'], c: 0xdc9474 });
  P('pars_horizontalis_duodeni', 'partie horizontale du duodénum', 'pars horizontalis duodeni', ['VH_F_duodenum_horizontal'], { alt: ['D3', 'troisième duodénum'], old: ['partie inférieure du duodénum'], c: 0xe8a080 });
  P('pars_ascendens_duodeni', 'partie ascendante du duodénum', 'pars ascendens duodeni', ['VH_F_duodenum_ascending'], { alt: ['D4', 'quatrième duodénum'], c: 0xdc9474 });

  O('foie', 'digestif', 'foie', 'hepar', 'z', { c: 0x8c3a2e });
  P('segmentum_i', 'lobe caudé', 'lobus caudatus', ['Posterior segment of liver (I)'], { alt: ['segment I', 'segment postérieur'], old: ['lobe de Spiegel'], c: 0x9c4a36 });
  P('segmentum_ii', 'segment postérieur latéral gauche', 'segmentum posterius laterale sinistrum', ['Left posterior lateral segment of liver (II)'], { alt: ['segment II'], c: 0x7c3026 });
  P('segmentum_iii', 'segment antérieur latéral gauche', 'segmentum anterius laterale sinistrum', ['Left anterior lateral segment of liver (III)'], { alt: ['segment III'], c: 0x9a4232 });
  P('segmentum_iv', 'segment médial gauche', 'segmentum mediale sinistrum', ['Left medial segment of liver (IV)'], { alt: ['segment IV'], c: 0xae5a42 });
  P('segmentum_v', 'segment antérieur médial droit', 'segmentum anterius mediale dextrum', ['Anterior medial segment of liver (V)'], { alt: ['segment V'], c: 0x8a3628 });
  P('segmentum_vi', 'segment antérieur latéral droit', 'segmentum anterius laterale dextrum', ['Anterior lateral segment of liver (VI)'], { alt: ['segment VI'], c: 0xa44a36 });
  P('segmentum_vii', 'segment postérieur latéral droit', 'segmentum posterius laterale dextrum', ['Posterior lateral segment of liver (VII)'], { alt: ['segment VII'], c: 0x80302a });
  P('segmentum_viii', 'segment postérieur médial droit', 'segmentum posterius mediale dextrum', ['Posterior medial segment of liver (VIII)'], { alt: ['segment VIII'], c: 0xb45640 });
  P('vesica_biliaris', 'vésicule biliaire', 'vesica biliaris', ['Gallbladder'], { alt: ['vesica fellea'], c: 0x4e8f3c });
  P('ductus_choledochus', 'conduit cholédoque', 'ductus choledochus', ['Bile duct'], { alt: ['cholédoque', 'voie biliaire principale'], old: ['canal cholédoque'], c: 0x6fae4c, k: 20 });

  O('gros_intestin', 'digestif', 'gros intestin', 'intestinum crassum', 'h', { c: 0xd59a76 });
  P('ileum_terminale', 'partie terminale de l\'iléon', 'pars terminalis ilei', ['VH_F_ileum_terminal'], { alt: ['iléon terminal', 'dernière anse iléale'], c: 0xeaa98e });
  P('valva_ileocaecalis', 'valve iléo-cæcale', 'valva ileocaecalis', ['VH_F_ileocecal_valve'], { alt: ['valve iléo-caecale', 'papille iléale', 'ostium iléal'], old: ['valvule de Bauhin'], c: 0xf4d0b8 });
  P('caecum', 'cæcum', 'caecum', ['VH_F_caecum'], { alt: ['caecum'], c: 0xc88866 });
  P('appendix_vermiformis', 'appendice vermiforme', 'appendix vermiformis', ['VH_F_vermiform_appendix'], { alt: ['appendice'], c: 0xe4b090 });
  P('colon_ascendens', 'côlon ascendant', 'colon ascendens', ['VH_F_ascending_colon'], { old: ['côlon droit'], c: 0xd59a76 });
  P('flexura_coli_dextra', 'angle colique droit', 'flexura coli dextra', ['VH_F_hepatic_flexure_of_colon'], { alt: ['courbure colique droite', 'angle hépatique'], c: 0xe8b08a });
  P('colon_transversum', 'côlon transverse', 'colon transversum', ['VH_F_transverse_colon'], { c: 0xc88866 });
  P('flexura_coli_sinistra', 'angle colique gauche', 'flexura coli sinistra', ['VH_F_splenic_flexure_of_colon'], { alt: ['courbure colique gauche', 'angle splénique'], c: 0xe8b08a });
  P('colon_descendens', 'côlon descendant', 'colon descendens', ['VH_F_descending_colon'], { old: ['côlon gauche'], c: 0xd59a76 });
  P('colon_sigmoideum', 'côlon sigmoïde', 'colon sigmoideum', ['VH_F_sigmoid_colon'], { alt: ['sigmoïde'], old: ['côlon pelvien', 'côlon ilio-pelvien'], c: 0xc88866 });
  P('rectum', 'rectum', 'rectum', ['VH_F_rectum'], { c: 0xb87458 });

  /* ---------------- Appareil respiratoire ---------------- */
  O('larynx', 'respiratoire', 'larynx', 'larynx', 'z', { c: 0xd6e2e4 });
  P('os_hyoideum', 'os hyoïde', 'os hyoideum', ['Hyoid bone'], { alt: ['hyoïde'], c: 0xeadfc8 });
  P('epiglottis', 'épiglotte', 'epiglottis', ['Epiglottis'], { alt: ['cartilage épiglottique'], c: 0xe4e8d4 });
  P('cartilago_thyroidea', 'cartilage thyroïde', 'cartilago thyroidea', ['Thyroid cartilage'], { alt: ['cartilage thyroïdien'], old: ['pomme d\'Adam'], c: 0xc8dade });
  P('cartilago_cricoidea', 'cartilage cricoïde', 'cartilago cricoidea', ['Cricoid cartilage'], { c: 0xb4cad0 });
  P('cartilago_arytenoidea', 'cartilage aryténoïde', 'cartilago arytenoidea', ['Arytenoid cartilage.*'], { alt: ['cartilages aryténoïdes'], c: 0x9cc0c8 });
  P('cartilago_corniculata', 'cartilage corniculé', 'cartilago corniculata', ['Corniculate cartilage.*'], { alt: ['cartilages corniculés'], old: ['cartilage de Santorini'], c: 0x86b0bc });
  P('trachea', 'trachée', 'trachea', ['Trachea'], { c: 0xe6dcc6, k: 25 });

  O('bronches', 'respiratoire', 'trachée et bronches', 'trachea et bronchi', 'z', { c: 0xe6dcc6 });
  P('trachea', 'trachée', 'trachea', ['Trachea'], { c: 0xe6dcc6 });
  P('bronchus_principalis_dexter', 'bronche principale droite', 'bronchus principalis dexter', ['Right main bronchus'], { old: ['bronche souche droite'], c: 0xd8c8a8 });
  P('bronchus_principalis_sinister', 'bronche principale gauche', 'bronchus principalis sinister', ['Left main bronchus'], { old: ['bronche souche gauche'], c: 0xd8c8a8 });
  P('bronchus_intermedius', 'bronche intermédiaire', 'bronchus intermedius', ['Intermediate bronchus.r'], { alt: ['tronc intermédiaire'], c: 0xc8b490 });
  P('bronchus_lobaris_superior_dexter', 'bronche lobaire supérieure droite', 'bronchus lobaris superior dexter', ['Right superior lobar bronchus'], { c: 0xe0a070 });
  P('bronchus_lobaris_medius', 'bronche lobaire moyenne', 'bronchus lobaris medius', ['Middle lobar bronchus.r'], { c: 0x9cc078 });
  P('bronchus_lobaris_inferior_dexter', 'bronche lobaire inférieure droite', 'bronchus lobaris inferior dexter', ['Right inferior lobar bronchus'], { c: 0x78a8d0 });
  P('bronchus_lobaris_superior_sinister', 'bronche lobaire supérieure gauche', 'bronchus lobaris superior sinister', ['Left superior lobar bronchus'], { c: 0xe0a070 });
  P('bronchus_lobaris_inferior_sinister', 'bronche lobaire inférieure gauche', 'bronchus lobaris inferior sinister', ['Left inferior lobar bronchus'], { c: 0x78a8d0 });
  P('b_apicalis_d', 'bronche segmentaire apicale droite', 'bronchus segmentalis apicalis [B I]', ['Apical segmental bronchus of right lung (BI)'], { alt: ['B1 droite', 'bronche apicale droite'], c: 0xf0b888 });
  P('b_posterior_d', 'bronche segmentaire postérieure droite', 'bronchus segmentalis posterior [B II]', ['Posterior segmental bronchus of right lung (BII)'], { alt: ['B2 droite', 'bronche postérieure droite'], c: 0xd89060 });
  P('b_anterior_d', 'bronche segmentaire antérieure droite', 'bronchus segmentalis anterior [B III]', ['Anterior segmental bronchus of right lung (BIII)'], { alt: ['B3 droite', 'bronche antérieure droite'], c: 0xf4c8a0 });
  P('b_lateralis_d', 'bronche segmentaire latérale', 'bronchus segmentalis lateralis [B IV]', ['Lateral segmental bronchus of right lung (BIV)'], { alt: ['B4 droite', 'bronche latérale'], c: 0xb4d090 });
  P('b_medialis_d', 'bronche segmentaire médiale', 'bronchus segmentalis medialis [B V]', ['Medial segmental bronchus of right lung (BV)'], { alt: ['B5 droite', 'bronche médiale'], c: 0x88b068 });
  P('b_superior_d', 'bronche segmentaire supérieure droite', 'bronchus segmentalis superior [B VI]', ['Superior segmental bronchus of right lung (BVI)'], { alt: ['B6 droite', 'bronche de Nelson droite'], c: 0xa4c4e0 });
  P('b_basalis_medialis_d', 'bronche segmentaire basale médiale droite', 'bronchus segmentalis basalis medialis [B VII]', ['Medial basal segmental bronchus of right lung (BVII)'], { alt: ['B7 droite', 'bronche paracardiaque'], c: 0x5c8cc0 });
  P('b_basalis_anterior_d', 'bronche segmentaire basale antérieure droite', 'bronchus segmentalis basalis anterior [B VIII]', ['Anterior basal segmental bronchus of right lung (BVIII)'], { alt: ['B8 droite'], c: 0x8cb4dc });
  P('b_basalis_lateralis_d', 'bronche segmentaire basale latérale droite', 'bronchus segmentalis basalis lateralis [B IX]', ['Lateral basal segmental bronchus of right lung (BIX)'], { alt: ['B9 droite'], c: 0x6a9ccc });
  P('b_basalis_posterior_d', 'bronche segmentaire basale postérieure droite', 'bronchus segmentalis basalis posterior [B X]', ['Posterior basal segmental bronchus of right lung (BX)'], { alt: ['B10 droite'], c: 0x4c7cb0 });
  P('b_apicoposterior_g', 'bronche segmentaire apico-postérieure', 'bronchus segmentalis apicoposterior [B I+II]', ['Apicoposterior segmental bronchus of left lung (BI+BII)'], { alt: ['B1+2 gauche', 'bronche apico-postérieure'], c: 0xe4a878 });
  P('b_anterior_g', 'bronche segmentaire antérieure gauche', 'bronchus segmentalis anterior [B III]', ['Anterior segmental bronchus of left lung (BIII)'], { alt: ['B3 gauche', 'bronche antérieure gauche'], c: 0xf4c8a0 });
  P('b_lingularis_superior', 'bronche lingulaire supérieure', 'bronchus lingularis superior [B IV]', ['Superior lingular segmental bronchus of left lung (BIV)'], { alt: ['B4 gauche'], c: 0xb4d090 });
  P('b_lingularis_inferior', 'bronche lingulaire inférieure', 'bronchus lingularis inferior [B V]', ['Inferior lingular segmental bronchus of left lung (BV)'], { alt: ['B5 gauche'], c: 0x88b068 });
  P('b_superior_g', 'bronche segmentaire supérieure gauche', 'bronchus segmentalis superior [B VI]', ['Superior segmental bronchus of left lung (BVI)'], { alt: ['B6 gauche', 'bronche de Nelson gauche'], c: 0xa4c4e0 });
  P('b_basalis_anteromedialis_g', 'bronche segmentaire basale antéro-médiale', 'bronchus segmentalis basalis anteromedialis [B VII+VIII]', ['(Anteromedial basal segmental bronchus of left lung)', 'Medial basal segmental bronchus of left lung (BVII)', 'Anterior basal segmental bronchus of left lung (BVIII)'], { alt: ['B7+8 gauche', 'bronche basale antérieure gauche'], c: 0x8cb4dc });
  P('b_basalis_lateralis_g', 'bronche segmentaire basale latérale gauche', 'bronchus segmentalis basalis lateralis [B IX]', ['Lateral basal segmental bronchus of left lung (BIX)'], { alt: ['B9 gauche'], c: 0x6a9ccc });
  P('b_basalis_posterior_g', 'bronche segmentaire basale postérieure gauche', 'bronchus segmentalis basalis posterior [B X]', ['Posterior basal segmental bronchus of left lung (BX)'], { alt: ['B10 gauche'], c: 0x4c7cb0 });

  O('poumon_droit', 'respiratoire', 'poumon droit', 'pulmo dexter', 'h', { c: 0xe8a4ab });
  P('s_apicale', 'segment apical', 'segmentum apicale [S I]', ['VH_F_right_apical_bronchopulmonary_segment'], { alt: ['S1', 'segment apical du lobe supérieur'], c: 0xf0b8bc });
  P('s_posterius', 'segment postérieur', 'segmentum posterius [S II]', ['VH_F_right_posterior_bronchopulmonary_segment'], { alt: ['S2', 'segment postérieur du lobe supérieur'], c: 0xd8909a });
  P('s_anterius', 'segment antérieur', 'segmentum anterius [S III]', ['VH_F_right_anterior_bronchopulmonary_segm'], { alt: ['S3', 'segment antérieur du lobe supérieur'], c: 0xf6c6c8 });
  P('s_laterale', 'segment latéral', 'segmentum laterale [S IV]', ['VH_F_right_lateral_bronchopulmonary_segmennt'], { alt: ['S4', 'segment latéral du lobe moyen'], c: 0xc4a8d8 });
  P('s_mediale', 'segment médial', 'segmentum mediale [S V]', ['VH_F_right_medial_bronchopulmonary_segment'], { alt: ['S5', 'segment médial du lobe moyen'], c: 0xa88cc8 });
  P('s_superius', 'segment supérieur', 'segmentum superius [S VI]', ['VH_F_right_superior_bronchopulmonary_segment'], { alt: ['S6', 'segment de Nelson', 'segment apical du lobe inférieur'], c: 0xe0a080 });
  P('s_basale_mediale', 'segment basal médial', 'segmentum basale mediale [S VII]', ['VH_F_right_medial_basal_bronchopulmonary_segment'], { alt: ['S7', 'segment paracardiaque'], c: 0xb47c60 });
  P('s_basale_anterius', 'segment basal antérieur', 'segmentum basale anterius [S VIII]', ['VH_F_right_anterior_basal_bronchopulmonary_segment'], { alt: ['S8'], c: 0xeab896 });
  P('s_basale_laterale', 'segment basal latéral', 'segmentum basale laterale [S IX]', ['VH_F_right_lateral_basal_bronchopulmonary_segment'], { alt: ['S9'], c: 0xd49470 });
  P('s_basale_posterius', 'segment basal postérieur', 'segmentum basale posterius [S X]', ['VH_F_right_posterior_basal_bronchopulmonary_segment'], { alt: ['S10'], c: 0xc08262 });
  P('hilum_pulmonis', 'hile du poumon', 'hilum pulmonis', ['VH_F_hilum_R', 'VH_F_hilum_upper_R', 'VH_F_hilum_middle_R', 'VH_F_hilum_lower_R'], { alt: ['hile pulmonaire'], c: 0x9a6a6e });

  O('poumon_gauche', 'respiratoire', 'poumon gauche', 'pulmo sinister', 'h', { c: 0xe8a4ab });
  P('s_apicale', 'segment apical', 'segmentum apicale [S I]', ['VH_F_left_apical_bronchopulmonary_segment'], { alt: ['S1'], c: 0xf0b8bc });
  P('s_posterius', 'segment postérieur', 'segmentum posterius [S II]', ['VH_F_left_posterior_bronchopulmonary_segment'], { alt: ['S2'], c: 0xd8909a });
  P('s_anterius', 'segment antérieur', 'segmentum anterius [S III]', ['VH_F_left_anterior_bronchopulmonary_segment'], { alt: ['S3'], c: 0xf6c6c8 });
  P('s_lingulare_superius', 'segment lingulaire supérieur', 'segmentum lingulare superius [S IV]', ['VH_F_lingula_superior_bronchopulmonary_segment'], { alt: ['S4', 'lingula supérieure'], c: 0xc4a8d8 });
  P('s_lingulare_inferius', 'segment lingulaire inférieur', 'segmentum lingulare inferius [S V]', ['VH_F_lingula_inferior_bronchopulmonary_segment'], { alt: ['S5', 'lingula inférieure'], c: 0xa88cc8 });
  P('s_superius', 'segment supérieur', 'segmentum superius [S VI]', ['VH_F_left_superior_bronchopulmonary_segment'], { alt: ['S6', 'segment de Nelson'], c: 0xe0a080 });
  P('s_basale_mediale', 'segment basal médial', 'segmentum basale mediale [S VII]', ['VH_F_left_medial_basal_bronchopulmonary_segment'], { alt: ['S7'], c: 0xb47c60 });
  P('s_basale_anterius', 'segment basal antérieur', 'segmentum basale anterius [S VIII]', ['VH_F_left_anterior_basal_bronchopulmonary_segment'], { alt: ['S8'], c: 0xeab896 });
  P('s_basale_laterale', 'segment basal latéral', 'segmentum basale laterale [S IX]', ['VH_F_left_lateral_basal_bronchopulmonary_segment'], { alt: ['S9'], c: 0xd49470 });
  P('s_basale_posterius', 'segment basal postérieur', 'segmentum basale posterius [S X]', ['VH_F_left_posterior_basal_bronchopulmonary_segment'], { alt: ['S10'], c: 0xc08262 });
  P('hilum_pulmonis', 'hile du poumon', 'hilum pulmonis', ['VH_F_hilum_L', 'VH_F_hilum_upper_L', 'VH_F_hilum_lower_L'], { alt: ['hile pulmonaire'], c: 0x9a6a6e });

  /* ---------------- Appareil urinaire ---------------- */
  O('rein', 'urinaire', 'rein', 'ren', 'h', { c: 0x8c3a2e });
  P('capsula_fibrosa', 'capsule fibreuse', 'capsula fibrosa renis', ['VH_F_kidney_capsule_L'], { alt: ['capsule rénale', 'capsule du rein'], c: 0xc8a890 });
  P('cortex_renalis', 'cortex rénal', 'cortex renalis', ['VH_F_outer_cortex_of_kidney_L'], { alt: ['substance corticale'], c: 0x9c3a2e });
  P('columnae_renales', 'colonnes rénales', 'columnae renales', ['VH_F_renal_column_L'], { alt: ['colonne rénale'], old: ['colonnes de Bertin'], c: 0xb4503c });
  P('pyramides_renales', 'pyramides rénales', 'pyramides renales', ['VH_F_renal_pyramid_L_*'], { alt: ['pyramide rénale', 'médulla rénale', 'medulla renalis'], old: ['pyramides de Malpighi', 'substance médullaire'], c: 0x6e2222 });
  P('papillae_renales', 'papilles rénales', 'papillae renales', ['VH_F_renal_papilla_L_*'], { alt: ['papille rénale'], c: 0xd87a62 });
  P('calices_minores', 'calices mineurs', 'calices renales minores', ['VH_F_minor_calyx_L_*'], { alt: ['calice mineur'], old: ['petits calices'], c: 0xeed88a });
  P('calices_majores', 'calices majeurs', 'calices renales majores', ['VH_F_major_calyx_L_*'], { alt: ['calice majeur'], old: ['grands calices'], c: 0xe2c262 });
  P('pelvis_renalis', 'pelvis rénal', 'pelvis renalis', ['VH_F_renal_pelvis_L'], { old: ['bassinet'], c: 0xd6aa44 });
  P('hilum_renale', 'hile rénal', 'hilum renale', ['VH_F_hilum_of_kidney_L'], { alt: ['hile du rein'], c: 0xb88a70 });
  P('ureter', 'uretère', 'ureter', ['VH_F_left_ureter'], { c: 0xe8cc74, k: 30 });

  O('vessie', 'urinaire', 'vessie', 'vesica urinaria', 'h', { c: 0xead28c });
  P('corpus_vesicae', 'corps de la vessie', 'corpus vesicae', ['VH_F_fundus_of_urinary_bladder_dome'], { alt: ['dôme de la vessie', 'apex de la vessie'], c: 0xead28c });
  P('fundus_vesicae', 'fond de la vessie', 'fundus vesicae', ['VH_F_fundus_of_urinary_bladder_base'], { alt: ['base de la vessie'], c: 0xd8b86c });
  P('cervix_vesicae', 'col de la vessie', 'cervix vesicae', ['VH_F_urinary_bladder_neck_smooth_muscle'], { alt: ['col vésical'], c: 0xc4945a });
  P('trigonum_vesicae', 'trigone vésical', 'trigonum vesicae', ['VH_F_trigone_of_urinary_bladder'], { alt: ['trigone de la vessie'], old: ['trigone de Lieutaud'], c: 0xe48a6a });
  P('ostium_ureteris', 'orifice urétéral', 'ostium ureteris', ['VH_F_ureteral_orifice_R', 'VH_F_ureteral_orifice_L'], { alt: ['orifices urétéraux', 'méat urétéral'], c: 0xb04a3c });

  /* ---------------- Appareil génital ---------------- */
  O('genital_masculin', 'genital', 'organes génitaux masculins', 'organa genitalia masculina', 'z', { s: 'm', c: 0xd6a888 });
  P('testis', 'testicule', 'testis', ['Testis.*'], { c: 0xead6c4 });
  P('epididymis', 'épididyme', 'epididymis', ['Epididymis.*'], { c: 0xc89a7a });
  P('ductus_deferens', 'conduit déférent', 'ductus deferens', ['Ductus deferens.*'], { old: ['canal déférent'], c: 0xe0c6a2 });
  P('glandula_seminalis', 'glande séminale', 'glandula seminalis', ['Seminal gland.*'], { alt: ['vésicule séminale'], c: 0xd6a888 });
  P('ductus_ejaculatorius', 'conduit éjaculateur', 'ductus ejaculatorius', ['Ejaculatory duct.*'], { old: ['canal éjaculateur'], c: 0xf0dcc0 });
  P('prostata', 'prostate', 'prostata', ['Prostate'], { c: 0xc98a6c });
  P('urethra', 'urètre', 'urethra masculina', ['Urethra'], { alt: ['urètre masculin'], c: 0xe2c674 });
  P('corpus_cavernosum', 'corps caverneux du pénis', 'corpus cavernosum penis', ['Corpus cavernosum of penis'], { alt: ['corps caverneux'], old: ['corps caverneux de la verge'], c: 0xc47a76 });
  P('corpus_spongiosum', 'corps spongieux du pénis', 'corpus spongiosum penis', ['Corpus spongiosum of penis'], { alt: ['corps spongieux'], old: ['corps spongieux de la verge'], c: 0xe0a4a0 });
  P('glans_penis', 'gland du pénis', 'glans penis', ['Glans penis'], { alt: ['gland'], c: 0xd89490 });

  O('uterus_annexes', 'genital', 'utérus et annexes', 'uterus et adnexa uteri', 'h', { s: 'f', c: 0xc9706a });
  P('fundus_uteri', 'fond de l\'utérus', 'fundus uteri', ['VH_F_fundus_of_uterus'], { alt: ['fond utérin'], c: 0xc9706a });
  P('corpus_uteri', 'corps de l\'utérus', 'corpus uteri', ['VH_F_body_of_uterus'], { alt: ['corps utérin'], c: 0xb85e58 });
  P('cornu_uteri', 'corne de l\'utérus', 'cornu uteri', ['VH_F_cornua'], { alt: ['cornes utérines', 'corne utérine'], c: 0xdc8a80 });
  P('isthmus_uteri', 'isthme de l\'utérus', 'isthmus uteri', ['VH_F_lower_uterine_segment'], { alt: ['segment inférieur', 'isthme utérin'], c: 0xd47a72 });
  P('cervix_uteri', 'col de l\'utérus', 'cervix uteri', ['VH_F_cervix'], { alt: ['col utérin'], c: 0xe0a0a0 });
  P('ostium_uteri_internum', 'orifice interne du col', 'ostium anatomicum uteri internum', ['VH_F_internal_cervical_os'], { alt: ['orifice interne de l\'utérus'], c: 0xf0c4c0 });
  P('ostium_uteri', 'orifice externe de l\'utérus', 'ostium uteri', ['VH_F_external_cervical_os'], { alt: ['orifice externe du col'], old: ['museau de tanche'], c: 0xf6d4d0 });
  P('facies_vesicalis', 'face vésicale de l\'utérus', 'facies vesicalis uteri', ['VH_F_anterior_wall_of_uterus'], { alt: ['face antérieure de l\'utérus', 'paroi antérieure de l\'utérus'], c: 0xc46a62 });
  P('facies_intestinalis', 'face intestinale de l\'utérus', 'facies intestinalis uteri', ['VH_F_posterior_wall_of_uterus'], { alt: ['face postérieure de l\'utérus', 'paroi postérieure de l\'utérus'], c: 0xa85450 });
  P('infundibulum_tubae', 'infundibulum de la trompe', 'infundibulum tubae uterinae', ['VH_F_uterine_tube_infundibulum_*'], { alt: ['pavillon de la trompe'], c: 0xe8b0a4 });
  P('fimbriae_tubae', 'franges de la trompe', 'fimbriae tubae uterinae', ['VH_F_fibria_of_uterine_tube_*'], { alt: ['fimbriae', 'franges tubaires'], c: 0xf4c8bc });
  P('ampulla_tubae', 'ampoule de la trompe', 'ampulla tubae uterinae', ['VH_F_ampulla_of_uterine_tube_*'], { alt: ['ampoule tubaire'], c: 0xd89888 });
  P('isthmus_tubae', 'isthme de la trompe', 'isthmus tubae uterinae', ['VH_F_isthmus_of_fallopian_tube_*'], { alt: ['isthme tubaire'], c: 0xc47c70 });
  P('ovarium', 'ovaire', 'ovarium', ['VH_F_left_ovary', 'VH_F_right_ovary'], { c: 0xead2bc });
  P('ligamentum_ovarii_proprium', 'ligament propre de l\'ovaire', 'ligamentum ovarii proprium', ['VH_F_ovarian_ligament_*'], { old: ['ligament utéro-ovarien'], c: 0xf2e2c8 });
  P('ligamentum_suspensorium_ovarii', 'ligament suspenseur de l\'ovaire', 'ligamentum suspensorium ovarii', ['VH_F_suspensory_ligament_of_ovary_*'], { old: ['ligament lombo-ovarien', 'ligament infundibulo-pelvien'], c: 0xe6d4b8 });
  P('mesovarium', 'mésovarium', 'mesovarium', ['VH_F_mesovarium_*'], { c: 0xd8e4c8 });
  P('mesosalpinx', 'mésosalpinx', 'mesosalpinx', ['VH_F_mesosalpinx_*'], { c: 0xc8dcc0 });
  P('ligamentum_latum', 'ligament large de l\'utérus', 'ligamentum latum uteri', ['VH_F_broad_ligament'], { alt: ['ligament large'], c: 0xf0e8d8 });
  P('ligamentum_teres_uteri', 'ligament rond de l\'utérus', 'ligamentum teres uteri', ['VH_F_*_round_ligament_of_uterus'], { alt: ['ligament rond'], c: 0xe8dcb4 });
  P('ligamentum_cardinale', 'ligament cardinal', 'ligamentum cardinale', ['VH_F_*_cardinal_ligament_of_uterus'], { alt: ['ligament transverse du col'], old: ['ligament de Mackenrodt'], c: 0xdcc8a8 });
  P('ligamentum_rectouterinum', 'ligament utéro-sacral', 'ligamentum rectouterinum', ['VH_F_*_uterosacral_ligament'], { alt: ['ligament recto-utérin', 'ligament utéro-sacré'], c: 0xd0bc9c });
  P('excavatio_vesicouterina', 'excavation vésico-utérine', 'excavatio vesicouterina', ['VH_F_uterovesical_pouch'], { alt: ['cul-de-sac vésico-utérin'], c: 0xe4ecf0 });
  P('vagina', 'vagin', 'vagina', ['VH_F_vagina'], { c: 0xd88a86 });
  P('fornix_vaginae', 'fornix du vagin', 'fornix vaginae', ['VH_F_cervicovaginal_junction'], { alt: ['cul-de-sac vaginal'], old: ['dôme vaginal'], c: 0xeaa8a4 });

  O('glande_mammaire', 'genital', 'glande mammaire', 'glandula mammaria', 'h', { s: 'f', c: 0xf0c0a8 });
  P('lobi_glandulae', 'lobes de la glande mammaire', 'lobi glandulae mammariae', ['VH_F_mammary_lobes_L'], { alt: ['lobes mammaires', 'tissu glandulaire'], c: 0xf2d2b0 });
  P('ductus_lactiferi', 'conduits lactifères', 'ductus lactiferi', ['VH_F_main_lactiferous_ducts_L'], { alt: ['conduit lactifère', 'canaux galactophores'], old: ['canaux lactifères'], c: 0xf8ecd8 });
  P('sinus_lactiferi', 'sinus lactifères', 'sinus lactiferi', ['VH_F_main_lactiferous_sinuses_L'], { alt: ['sinus lactifère', 'ampoules lactifères'], c: 0xe8c896 });
  P('papilla_mammaria', 'papille mammaire', 'papilla mammaria', ['VH_F_nipple_L'], { alt: ['mamelon'], c: 0xb8686a });
  P('areola_mammae', 'aréole', 'areola mammae', ['VH_F_areola_L'], { alt: ['aréole mammaire', 'aréole du sein'], c: 0xc88070 });
  P('glandulae_areolares', 'glandes aréolaires', 'glandulae areolares', ['VH_F_areolar_tubercles_L'], { alt: ['tubercules aréolaires'], old: ['tubercules de Montgomery'], c: 0xd89a86 });
  P('ligamenta_suspensoria', 'ligaments suspenseurs du sein', 'ligamenta suspensoria mammaria', ['VH_F_suspensory_ligaments_L'], { alt: ['ligaments suspenseurs'], old: ['ligaments de Cooper'], c: 0xf0f0e4 });
  P('corpus_adiposum', 'corps adipeux du sein', 'corpus adiposum mammae', ['VH_F_fat_L'], { alt: ['graisse du sein', 'tissu adipeux mammaire'], c: 0xf6e2a0 });

  /* ---------------- Organes lymphoïdes ---------------- */
  O('rate', 'lymphatique', 'rate', 'splen', 'h', { c: 0x6e2c4c });
  P('facies_diaphragmatica', 'face diaphragmatique', 'facies diaphragmatica splenis', ['VH_F_diaphragmatic_surface_of_spleen'], { alt: ['face diaphragmatique de la rate'], c: 0x7a3456 });
  P('facies_gastrica', 'face gastrique', 'facies gastrica splenis', ['VH_F_gastric_surface_of_spleen'], { alt: ['face gastrique de la rate'], c: 0x9a4a6c });
  P('facies_renalis', 'face rénale', 'facies renalis splenis', ['VH_F_renal_surface_of_spleen'], { alt: ['face rénale de la rate'], c: 0x5c2440 });
  P('facies_colica', 'face colique', 'facies colica splenis', ['VH_F_colic_surface_of_spleen'], { alt: ['face colique de la rate'], c: 0xb46484 });
  P('hilum_splenicum', 'hile de la rate', 'hilum splenicum', ['VH_F_hilum_of_spleen'], { alt: ['hile splénique'], c: 0xd890a8 });

  O('noeud_lymphatique', 'lymphatique', 'nœud lymphatique', 'nodus lymphoideus', 'h', { c: 0x86c46a });
  P('capsula', 'capsule du nœud lymphatique', 'capsula nodi lymphoidei', ['Yao_capsule_of_lymph_node'], { alt: ['capsule'], c: 0xe0e6c8 });
  P('noduli', 'nodules lymphoïdes', 'noduli lymphoidei', ['Yao_follicles'], { alt: ['follicules lymphoïdes', 'cortex'], c: 0x5c9c48 });
  P('paracortex', 'paracortex', 'paracortex', ['Yao_paracortex'], { alt: ['zone paracorticale', 'cortex profond'], c: 0x9cc87a });
  P('medulla', 'médulla du nœud lymphatique', 'medulla nodi lymphoidei', ['Yao_medulla_of_lymph_node'], { alt: ['médulla', 'zone médullaire'], c: 0xc8dca0 });
  P('vasa_afferentia', 'vaisseaux lymphatiques afférents', 'vasa afferentia', ['Yao_afferent_lymphatic_vessel'], { alt: ['vaisseau afférent', 'lymphatiques afférents'], c: 0xf0e070 });
  P('vas_efferens', 'vaisseau lymphatique efférent', 'vas efferens', ['Yao_efferent_lymph_node'], { alt: ['vaisseau efférent', 'lymphatique efférent'], c: 0xe8b450 });
  P('vasa_sanguinea', 'vaisseaux sanguins du nœud', 'vasa sanguinea nodi lymphoidei', ['Yao_blood_vasculature'], { alt: ['vaisseaux sanguins'], c: 0xc04a4a });

  /* ---------------- Cœur ---------------- */
  O('coeur', 'coeur', 'cœur', 'cor', 'h', { c: 0xae4036 });
  P('atrium_dextrum', 'atrium droit', 'atrium dextrum', ['VH_F_right_cardiac_atrium'], { old: ['oreillette droite'], c: 0xc0574c });
  P('atrium_sinistrum', 'atrium gauche', 'atrium sinistrum', ['VH_F_left_cardiac_atrium'], { old: ['oreillette gauche'], c: 0xd06a5c });
  P('ventriculus_dexter', 'ventricule droit', 'ventriculus dexter', ['VH_F_right_ventricle'], { c: 0xa8423a });
  P('ventriculus_sinister', 'ventricule gauche', 'ventriculus sinister', ['VH_F_left_ventricle'], { c: 0x963630 });
  P('septum_interventriculare', 'septum interventriculaire', 'septum interventriculare', ['VH_F_interventricular_septum'], { c: 0xc87a6a });
  P('musculi_papillares', 'muscles papillaires', 'musculi papillares', ['VH_F_papillary_muscle_of_heart_*'], { alt: ['muscle papillaire'], old: ['piliers du cœur'], c: 0xe08a7a });
  P('valva_aortae', 'valve aortique', 'valva aortae', ['VH_F_aortic_valve'], { alt: ['valve de l\'aorte'], old: ['valvules sigmoïdes aortiques'], c: 0xf4e8d0 });
  P('valva_trunci_pulmonalis', 'valve du tronc pulmonaire', 'valva trunci pulmonalis', ['VH_F_pulmonary_valve'], { alt: ['valve pulmonaire'], old: ['valvules sigmoïdes pulmonaires'], c: 0xe8eef0 });
  P('valva_mitralis', 'valve atrioventriculaire gauche', 'valva atrioventricularis sinistra', ['VH_F_mitral_valve'], { alt: ['valve mitrale', 'valve atrio-ventriculaire gauche'], c: 0xf0dcc0 });
  P('valva_tricuspidalis', 'valve atrioventriculaire droite', 'valva atrioventricularis dextra', ['VH_F_tricuspid_valve'], { alt: ['valve tricuspide', 'valve atrio-ventriculaire droite'], c: 0xe4d4b8 });
  P('arteria_coronaria_dextra', 'artère coronaire droite', 'arteria coronaria dextra', ['VH_F_right_coronary_artery'], { c: 0xe23a32 });
  P('ramus_marginalis_dexter', 'rameau marginal droit', 'ramus marginalis dexter', ['VH_F_right_marginal_artery'], { alt: ['artère marginale droite'], c: 0xf05a48 });
  P('arteria_coronaria_sinistra', 'artère coronaire gauche', 'arteria coronaria sinistra', ['VH_F_left_coronary_artery'], { alt: ['tronc commun de la coronaire gauche'], c: 0xe23a32 });
  P('ramus_interventricularis_anterior', 'rameau interventriculaire antérieur', 'ramus interventricularis anterior', ['VH_F_left_anterior_descending_artery'], { alt: ['artère interventriculaire antérieure', 'IVA'], c: 0xff6a50 });
  P('ramus_diagonalis', 'rameau diagonal', 'ramus diagonalis', ['VH_F_diagonal_branch_of_left_anterior_descending_artery'], { alt: ['artère diagonale'], c: 0xf08a70 });
  P('ramus_circumflexus', 'rameau circonflexe', 'ramus circumflexus', ['VH_F_left_circumflex_artery'], { alt: ['artère circonflexe'], c: 0xd02a28 });
  P('ramus_marginalis_sinister', 'rameau marginal gauche', 'ramus marginalis sinister', ['VH_F_left_marginal_branch'], { alt: ['artère marginale gauche'], c: 0xf05a48 });
  P('ramus_interventricularis_posterior', 'rameau interventriculaire postérieur', 'ramus interventricularis posterior', ['VH_F_left_posterior_descending_branch_of_circumflex_branch_of_left_coronary_artery'], { alt: ['artère interventriculaire postérieure', 'IVP'], c: 0xff7a60 });
  P('ramus_posterior_ventriculi_sinistri', 'rameau postérieur du ventricule gauche', 'ramus posterior ventriculi sinistri', ['VH_F_posterior_left_ventricular_branch'], { alt: ['rameau ventriculaire gauche postérieur'], c: 0xe04a3a });
  P('sinus_coronarius', 'sinus coronaire', 'sinus coronarius', ['VH_F_coronary_sinus'], { c: 0x3a5ab0 });
  P('vena_cardiaca_magna', 'grande veine du cœur', 'vena cardiaca magna', ['VH_F_great_cardiac_vein'], { alt: ['grande veine cardiaque'], c: 0x4a6ec8 });
  P('vena_cardiaca_media', 'veine moyenne du cœur', 'vena cardiaca media', ['VH_F_middle_cardiac_vein'], { alt: ['veine interventriculaire postérieure', 'veine cardiaque moyenne'], c: 0x5a80d4 });
  P('vena_cardiaca_parva', 'petite veine du cœur', 'vena cardiaca parva', ['VH_F_small_cardiac_vein'], { alt: ['petite veine cardiaque'], c: 0x6a90dc });
  P('vena_obliqua_atrii_sinistri', 'veine oblique de l\'atrium gauche', 'vena obliqua atrii sinistri', ['VH_F_oblique_vein_of_left_atrium'], { old: ['veine de Marshall'], c: 0x7a9ce0 });
  P('vena_marginalis_sinistra', 'veine marginale gauche', 'vena marginalis sinistra', ['VH_F_left_marginal_vein'], { c: 0x5a80d4 });
  P('vena_posterior_ventriculi_sinistri', 'veine postérieure du ventricule gauche', 'vena ventriculi sinistri posterior', ['VH_F_posterior_vein_of_left_ventricle'], { c: 0x4a6ec8 });
  P('venae_ventriculi_dextri_anteriores', 'veines antérieures du ventricule droit', 'venae ventriculi dextri anteriores', ['VH_F_anterior_cardiac_vein'], { alt: ['veines cardiaques antérieures'], c: 0x6a90dc });
  P('aorta_ascendens', 'aorte ascendante', 'pars ascendens aortae', ['VH_F_ascending_aorta'], { alt: ['partie ascendante de l\'aorte'], c: 0xd8483c });
  P('arcus_aortae', 'arc de l\'aorte', 'arcus aortae', ['VH_F_aortic_arch'], { alt: ['crosse de l\'aorte', 'arc aortique'], c: 0xc83c32, k: 25 });
  P('truncus_pulmonalis', 'tronc pulmonaire', 'truncus pulmonalis', ['VH_F_pulmonary_trunk'], { alt: ['artère pulmonaire'], c: 0x6a7ad8 });
  P('arteria_pulmonalis_dextra', 'artère pulmonaire droite', 'arteria pulmonalis dextra', ['VH_F_pulmonary_artery_R'], { c: 0x7a8ae0, k: 20 });
  P('arteria_pulmonalis_sinistra', 'artère pulmonaire gauche', 'arteria pulmonalis sinistra', ['VH_F_pulmonary_artery_L'], { c: 0x7a8ae0, k: 20 });
  P('venae_pulmonales', 'veines pulmonaires', 'venae pulmonales', ['VH_F_pulmonary_vein_*'], { alt: ['veine pulmonaire'], c: 0xe0705a, k: 20 });
  P('vena_cava_superior', 'veine cave supérieure', 'vena cava superior', ['VH_F_superior_vena_cava'], { c: 0x3c5cb8, k: 25 });
  P('vena_cava_inferior', 'veine cave inférieure', 'vena cava inferior', ['VH_F_inferior_vena_cava_*'], { c: 0x3c5cb8, k: 15 });

  /* ---------------- Encéphale ---------------- */
  O('hemisphere', 'nerveux', 'hémisphère cérébral', 'hemispherium cerebri', 'z', { c: 0xe2a8a0 });
  P('gyrus_frontalis_superior', 'gyrus frontal supérieur', 'gyrus frontalis superior', ['Superior frontal gyrus.l'], { alt: ['F1'], old: ['première circonvolution frontale'], c: 0xe8a898 });
  P('gyrus_frontalis_medius', 'gyrus frontal moyen', 'gyrus frontalis medius', ['Middle frontal gyrus.l'], { alt: ['F2'], old: ['deuxième circonvolution frontale'], c: 0xd89080 });
  P('pars_opercularis', 'partie operculaire du gyrus frontal inférieur', 'pars opercularis gyri frontalis inferioris', ['Opercular part of inferior frontal gyrus.l'], { alt: ['pars opercularis', 'partie operculaire'], c: 0xf0b8a0 });
  P('pars_triangularis', 'partie triangulaire du gyrus frontal inférieur', 'pars triangularis gyri frontalis inferioris', ['Triangular part of inferior frontal gyrus.l'], { alt: ['pars triangularis', 'partie triangulaire', 'aire de Broca'], c: 0xe49c84 });
  P('pars_orbitalis', 'partie orbitaire du gyrus frontal inférieur', 'pars orbitalis gyri frontalis inferioris', ['Orbital part of  inferior frontal gyrus.l'], { alt: ['pars orbitalis', 'partie orbitaire'], c: 0xf4c4b0 });
  P('gyrus_precentralis', 'gyrus précentral', 'gyrus precentralis', ['Precentral gyrus.l'], { alt: ['gyrus moteur'], old: ['circonvolution frontale ascendante'], c: 0xc87868 });
  P('sulcus_precentralis', 'sillon précentral', 'sulcus precentralis', ['Precentral sulcus (Superior part)*.l', 'Precentral sulcus (inferior part)*.l'], { c: 0x8a6e6a });
  P('sulcus_frontalis_superior', 'sillon frontal supérieur', 'sulcus frontalis superior', ['Superior frontal sulcus.l'], { c: 0x8a6e6a });
  P('sulcus_frontalis_inferior', 'sillon frontal inférieur', 'sulcus frontalis inferior', ['Inferior frontal sulcus.l'], { c: 0x8a6e6a });
  P('gyri_orbitales', 'gyrus orbitaires', 'gyri orbitales', ['Orbital gyri.l', 'Orbital gyri (Frontomarginal gyrus and sulcus*).l'], { alt: ['gyri orbitaires'], c: 0xf0c8b8 });
  P('sulci_orbitales', 'sillons orbitaires', 'sulci orbitales', ['Orbital sulci (H-shaped orbital sulci*).l', 'Orbital sulci (Lateral Orbital sulcus*).l'], { c: 0x8a6e6a });
  P('gyrus_rectus', 'gyrus droit', 'gyrus rectus', ['Straight gyrus (Gyrus rectus).l'], { c: 0xdcb0a0 });
  P('sulcus_olfactorius', 'sillon olfactif', 'sulcus olfactorius', ['Olfactory sulcus.l'], { c: 0x8a6e6a });
  P('lobulus_paracentralis', 'lobule paracentral', 'lobulus paracentralis', ['Paracentral gyrus and sulcus*.l', 'Paracentral sulcus.l'], { c: 0xc89080 });
  P('sulcus_centralis', 'sillon central', 'sulcus centralis', ['Central sulcus.l'], { old: ['scissure de Rolando'], c: 0x6a4a46 });
  P('sulcus_lateralis', 'sillon latéral', 'sulcus lateralis', ['Lat_Fis-post.l', 'Lat_Fis-ant-Horizont.l', 'Lat_Fis-ant-Vertical.l'], { alt: ['fissure latérale'], old: ['scissure de Sylvius'], c: 0x6a4a46 });
  P('gyrus_postcentralis', 'gyrus postcentral', 'gyrus postcentralis', ['Postcentral gyrus.l'], { old: ['circonvolution pariétale ascendante'], c: 0xdcbc98 });
  P('sulcus_postcentralis', 'sillon postcentral', 'sulcus postcentralis', ['Postcentral sulcus.l'], { c: 0x8a7a66 });
  P('lobulus_parietalis_superior', 'lobule pariétal supérieur', 'lobulus parietalis superior', ['Superior parietal lobule.l'], { alt: ['P1'], c: 0xe8cca4 });
  P('gyrus_supramarginalis', 'gyrus supramarginal', 'gyrus supramarginalis', ['Supramarginal gyrus.l'], { old: ['gyrus pli courbe antérieur'], c: 0xd0b088 });
  P('gyrus_angularis', 'gyrus angulaire', 'gyrus angularis', ['Angular gyrus.l'], { old: ['pli courbe'], c: 0xc4a47c });
  P('sulcus_intraparietalis', 'sillon intrapariétal', 'sulcus intraparietalis', ['Intraparietal sulcus.l'], { c: 0x8a7a66 });
  P('precuneus', 'précunéus', 'precuneus', ['Precuneus.l'], { alt: ['précuneus'], old: ['lobule quadrilatère'], c: 0xe0c8a4 });
  P('sulcus_subparietalis', 'sillon subpariétal', 'sulcus subparietalis', ['Subparietal sulcus.l'], { c: 0x8a7a66 });
  P('gyrus_temporalis_superior', 'gyrus temporal supérieur', 'gyrus temporalis superior', ['Superior temporal gyrus (Lateral part).l'], { alt: ['T1'], c: 0xc8aacc });
  P('sulcus_temporalis_superior', 'sillon temporal supérieur', 'sulcus temporalis superior', ['Superior temporal sulcus.l'], { c: 0x7a6a80 });
  P('gyrus_temporalis_medius', 'gyrus temporal moyen', 'gyrus temporalis medius', ['Middle temporal gyrus.l'], { alt: ['T2'], c: 0xb498bc });
  P('sulcus_temporalis_inferior', 'sillon temporal inférieur', 'sulcus temporalis inferior', ['Inferior temporal sulcus.l'], { c: 0x7a6a80 });
  P('gyrus_temporalis_inferior', 'gyrus temporal inférieur', 'gyrus temporalis inferior', ['Inferior temporal gyrus.l'], { alt: ['T3'], c: 0xa488ae });
  P('gyri_temporales_transversi', 'gyrus temporaux transverses', 'gyri temporales transversi', ['Transverse temporal gyri.l'], { alt: ['gyri temporaux transverses', 'gyrus de Heschl'], c: 0xd8c0e0 });
  P('planum_temporale', 'planum temporal', 'planum temporale', ['Temporal plane.l'], { alt: ['plan temporal'], c: 0xc4b0d4 });
  P('polus_temporalis', 'pôle temporal', 'polus temporalis', ['Temporal pole.l'], { c: 0xbca0c8 });
  P('gyrus_occipitotemporalis_lateralis', 'gyrus occipito-temporal latéral', 'gyrus occipitotemporalis lateralis', ['Lateral occipitotemporal gyrus.l'], { alt: ['gyrus fusiforme'], old: ['T4'], c: 0xa894c0 });
  P('gyrus_parahippocampalis', 'gyrus parahippocampal', 'gyrus parahippocampalis', ['Medial occipitotemporal gyrus (Parahippocampal*).l'], { alt: ['gyrus parahippocampique'], old: ['T5', 'circonvolution de l\'hippocampe'], c: 0xb8d0a4 });
  P('sulcus_occipitotemporalis', 'sillon occipito-temporal', 'sulcus occipitotemporalis', ['Occipitotemporal sulcus (Lateral part*).l'], { c: 0x7a6a80 });
  P('sulcus_collateralis', 'sillon collatéral', 'sulcus collateralis', ['Collateral sulcus.l', ' Posterior transverse collateral sulcus.l'], { old: ['scissure collatérale'], c: 0x6a6a74 });
  P('cuneus', 'cunéus', 'cuneus', ['Cuneus.l'], { c: 0xa8bcd8 });
  P('gyrus_lingualis', 'gyrus lingual', 'gyrus lingualis', ['Lingual gyrus.l'], { old: ['O5'], c: 0x94acd0 });
  P('gyri_occipitales_superiores', 'gyrus occipitaux supérieurs', 'gyri occipitales superiores', ['Superior occipital gyri.l'], { alt: ['gyrus occipital supérieur', 'O1'], c: 0xb8cce4 });
  P('gyrus_occipitalis_medius', 'gyrus occipital moyen', 'gyrus occipitalis lateralis', ['Lateral occipital gyrus (Middle occipital gyrus*).l'], { alt: ['gyrus occipital latéral', 'O2'], c: 0x9cb4d8 });
  P('gyrus_occipitalis_inferior', 'gyrus occipital inférieur', 'gyrus occipitalis inferior', ['Inferior occipital gyrus and sulcus*.l'], { alt: ['O3'], c: 0x88a4cc });
  P('polus_occipitalis', 'pôle occipital', 'polus occipitalis', ['Occipital pole.l'], { c: 0x7c98c4 });
  P('sulcus_occipitalis_transversus', 'sillon occipital transverse', 'sulcus occipitalis transversus', ['Transverse occipital sulcus.l'], { c: 0x5a6a80 });
  P('sulcus_lunatus', 'sillon lunatum', 'sulcus lunatus', ['Lunate sulcus.l'], { alt: ['sillon semi-lunaire'], c: 0x5a6a80 });
  P('sulcus_occipitalis_anterior', 'sillon occipital antérieur', 'sulcus occipitalis anterior', ['Anterior occipital sulcus*.l'], { c: 0x5a6a80 });
  P('sulcus_calcarinus', 'sillon calcarin', 'sulcus calcarinus', ['Calcarine sulcus.l'], { old: ['scissure calcarine'], c: 0x4c5a70 });
  P('sulcus_parietooccipitalis', 'sillon pariéto-occipital', 'sulcus parietooccipitalis', ['Parieto-occipital sulcus.l'], { old: ['scissure perpendiculaire interne'], c: 0x4c5a70 });
  P('insula', 'insula', 'insula', ['Insula (Subcentral gyrus and ant. and post. sulci*).l'], { alt: ['lobe de l\'insula'], c: 0xdccc8c });
  P('sulcus_circularis_insulae', 'sillon circulaire de l\'insula', 'sulcus circularis insulae', ['Circular sulcus of insula.l'], { alt: ['sillon limitant de l\'insula'], c: 0x8a8060 });
  P('gyrus_cinguli', 'gyrus cingulaire', 'gyrus cinguli', ['Cingulate gyrus (Posteroventral part*).l', 'Cingulate gyrus and sulcus (Middle anterior part).l', 'Cingulate gyrus and sulcus (Middle posterior part).l', 'Cingulate gyrus and sulcus (Posterior dorsal part).l'], { alt: ['gyrus du cingulum'], old: ['circonvolution du corps calleux'], c: 0xb8d0a4 });
  P('sulcus_cinguli', 'sillon cingulaire', 'sulcus cinguli', ['Cingulate sulcus (Marginal part*).l'], { alt: ['partie marginale du sillon cingulaire'], old: ['scissure calloso-marginale'], c: 0x6a7a5c });

  O('tronc_cervelet', 'nerveux', 'tronc cérébral et cervelet', 'truncus encephali et cerebellum', 'z', { c: 0xd8c2a8 });
  P('mesencephalon', 'mésencéphale', 'mesencephalon', ['Midbrain.*'], { c: 0xd8c2a8 });
  P('crus_cerebri', 'base du pédoncule cérébral', 'crus cerebri', ['Base of peduncle.*'], { alt: ['pied du pédoncule cérébral'], c: 0xe8d6bc });
  P('fossa_interpeduncularis', 'fosse interpédonculaire', 'fossa interpeduncularis', ['Interpeduncular fossa.*'], { c: 0xa48c78 });
  P('colliculus_superior', 'colliculus supérieur', 'colliculus superior', ['Superior colliculus*'], { old: ['tubercule quadrijumeau antérieur'], c: 0xccae96 });
  P('colliculus_inferior', 'colliculus inférieur', 'colliculus inferior', ['Inferior colliculus*'], { old: ['tubercule quadrijumeau postérieur'], c: 0xbc9e86 });
  P('pons', 'pont', 'pons', ['Pons.*'], { old: ['protubérance annulaire'], c: 0xdcc6aa });
  P('medulla_oblongata', 'moelle allongée', 'medulla oblongata', ['Medulla oblongata.*'], { old: ['bulbe rachidien', 'bulbe'], c: 0xe2cfb4 });
  P('oliva', 'olive', 'oliva', ['Olive.*'], { alt: ['olive bulbaire'], c: 0xc8b494 });
  P('pyramis_medullae', 'pyramide de la moelle allongée', 'pyramis medullae oblongatae', ['Pyramid of medulla oblongata.*'], { alt: ['pyramide bulbaire'], c: 0xf0e2cc });
  P('ventriculus_quartus', 'quatrième ventricule', 'ventriculus quartus', ['Fourth ventricle'], { alt: ['4e ventricule', 'V4'], c: 0x6aa2da });
  P('aqueductus_mesencephali', 'aqueduc du mésencéphale', 'aqueductus mesencephali', ['Aqueduct of midbrain'], { alt: ['aqueduc cérébral'], old: ['aqueduc de Sylvius'], c: 0x8ab8e4 });
  P('pedunculus_cerebellaris_superior', 'pédoncule cérébelleux supérieur', 'pedunculus cerebellaris superior', ['Superior cerebellar peduncle.*'], { c: 0xe4d2bc });
  P('lobulus_quadrangularis_anterior', 'lobule quadrangulaire antérieur', 'lobulus quadrangularis anterior', ['Anterior quadrangular lobule.*'], { c: 0xc89090 });
  P('lobulus_quadrangularis_posterior', 'lobule quadrangulaire postérieur', 'lobulus quadrangularis posterior', ['Posterior quadrangular lobule.*'], { alt: ['lobule simple'], c: 0xd4a09a });
  P('lobulus_semilunaris_superior', 'lobule semi-lunaire supérieur', 'lobulus semilunaris superior', ['Superior semilunar lobule.*'], { c: 0xb88080 });
  P('lobulus_semilunaris_inferior', 'lobule semi-lunaire inférieur', 'lobulus semilunaris inferior', ['Inferior semilunar lobule.*'], { c: 0xc89894 });
  P('lobulus_gracilis', 'lobule gracile', 'lobulus gracilis', ['Gracile lobule.*'], { alt: ['lobule paramédian'], c: 0xa87070 });
  P('lobulus_biventer', 'lobule biventral', 'lobulus biventer', ['Biventral lobule.*'], { c: 0xd8a8a4 });
  P('tonsilla_cerebelli', 'tonsille du cervelet', 'tonsilla cerebelli', ['Tonsil of cerebellum.*'], { old: ['amygdale cérébelleuse'], c: 0x986464 });
  P('ala_lobuli_centralis', 'aile du lobule central', 'ala lobuli centralis', ['Wing of central lobule.*'], { c: 0xe0b4b0 });
  P('flocculus', 'flocculus', 'flocculus', ['Flocculus.*', 'Peduncle of flocculus.*'], { c: 0xe8c0b8 });
  P('lingula_cerebelli', 'lingula du cervelet', 'lingula cerebelli', ['Lingula of cerebellum'], { c: 0xb47c80 });
  P('lobulus_centralis', 'lobule central', 'lobulus centralis', ['Central lobule'], { c: 0xa46c70 });
  P('culmen', 'culmen', 'culmen', ['Culmen'], { c: 0xb47c80 });
  P('declive', 'déclive', 'declive', ['Declive'], { c: 0xa46c70 });
  P('folium_vermis', 'folium du vermis', 'folium vermis', ['Folium of vermis'], { c: 0xb47c80 });
  P('tuber_vermis', 'tuber du vermis', 'tuber vermis', ['Tuber of vermis'], { c: 0xa46c70 });
  P('pyramis_vermis', 'pyramide du vermis', 'pyramis vermis', ['Pyramis of vermis'], { c: 0xb47c80 });
  P('uvula_vermis', 'uvule du vermis', 'uvula vermis', ['Uvula of vermis'], { c: 0xa46c70 });
  P('nodulus', 'nodule du vermis', 'nodulus vermis', ['Nodule of vermis'], { alt: ['nodule'], c: 0xb47c80 });

  O('noyaux_ventricules', 'nerveux', 'noyaux gris et ventricules', 'nuclei basales et ventriculi', 'z', { c: 0xb49c8c });
  P('nucleus_caudatus', 'noyau caudé', 'nucleus caudatus', ['Caudate nucleus.l'], { c: 0x9c8a7c });
  P('putamen', 'putamen', 'putamen', ['Putamen.l'], { c: 0x8c7c70 });
  P('globus_pallidus', 'globus pallidus', 'globus pallidus', ['Globus pallidus.l'], { alt: ['pallidum'], c: 0xc8bcac });
  P('thalamus', 'thalamus', 'thalamus', ['Thalamus.l'], { old: ['couche optique'], c: 0xb6927c });
  P('hypothalamus', 'hypothalamus', 'hypothalamus', ['Hypothalamus'], { c: 0xc89c84 });
  P('corpus_geniculatum_laterale', 'corps géniculé latéral', 'corpus geniculatum laterale', ['Lateral geniculate body.l'], { old: ['corps genouillé externe'], c: 0xa88068 });
  P('corpus_geniculatum_mediale', 'corps géniculé médial', 'corpus geniculatum mediale', ['Medial geniculate body.l'], { old: ['corps genouillé interne'], c: 0xd0a890 });
  P('corpus_mammillare', 'corps mamillaire', 'corpus mammillare', ['Mamillary body.*'], { old: ['tubercule mamillaire'], c: 0xe0b098 });
  P('habenula', 'habénula', 'habenula', ['Habenula'], { c: 0x9a7c6c });
  P('corpus_amygdaloideum', 'corps amygdaloïde', 'corpus amygdaloideum', ['Amygdaloid body.l'], { alt: ['amygdale cérébrale'], old: ['noyau amygdalien'], c: 0xe0a0c0 });
  P('hippocampus', 'hippocampe', 'hippocampus', ['Hippocampus.l'], { old: ['corne d\'Ammon'], c: 0xc4d890 });
  P('fornix', 'fornix', 'fornix', ['Fornix.l'], { old: ['trigone cérébral'], c: 0xf0e6d4 });
  P('corpus_callosum', 'corps calleux', 'corpus callosum', ['Corpus callosum'], { c: 0xf6f0e4 });
  P('commissura_anterior', 'commissure antérieure', 'commissura anterior', ['Anterior commissure'], { c: 0xe8dcc4 });
  P('commissura_fornicis', 'commissure du fornix', 'commissura fornicis', ['Hippocampal commissure'], { alt: ['commissure hippocampique'], old: ['psaltérium'], c: 0xdcd0b8 });
  P('nuclei_septales', 'noyaux septaux', 'nuclei septales', ['Septal nuclei'], { c: 0xb49c8c });
  P('ventriculus_lateralis', 'ventricule latéral', 'ventriculus lateralis', ['Lateral ventricle.l'], { c: 0x6aa2da });
  P('ventriculus_tertius', 'troisième ventricule', 'ventriculus tertius', ['Third ventricle'], { alt: ['3e ventricule', 'V3'], c: 0x4a86c8 });
  P('chiasma_opticum', 'chiasma optique', 'chiasma opticum', ['Optic chiasm.*'], { c: 0xf2e6b8 });
  P('nucleus_ruber', 'noyau rouge', 'nucleus ruber', ['Red nucleus.l'], { c: 0xc0504a });

  /* ---------------- Organes des sens ---------------- */
  O('oeil', 'sens', 'bulbe de l\'œil', 'bulbus oculi', 'h', { c: 0xe8dcc6 });
  P('sclera', 'sclère', 'sclera', ['VH_F_sclera_R'], { old: ['sclérotique'], c: 0xf6f2ec });
  P('cornea', 'cornée', 'cornea', ['VH_F_cornea_R'], { c: 0xb8dcee });
  P('limbus_corneae', 'limbe de la cornée', 'limbus corneae', ['VH_F_corneo_scleral_junction_R'], { alt: ['limbe scléro-cornéen', 'jonction cornéo-sclérale'], c: 0xd8e8f0 });
  P('choroidea', 'choroïde', 'choroidea', ['VH_F_optic_choroid_R'], { c: 0x7a3c3a });
  P('corpus_ciliare', 'corps ciliaire', 'corpus ciliare', ['VH_F_ciliary_body_R'], { c: 0x9a5a4a });
  P('musculus_ciliaris', 'muscle ciliaire', 'musculus ciliaris', ['VH_F_ciliary_muscle_R'], { c: 0xc0706a });
  P('processus_ciliares', 'procès ciliaires', 'processus ciliares', ['VH_F_ciliary_processes_R'], { alt: ['processus ciliaires'], c: 0xb88068 });
  P('iris', 'iris', 'iris', ['VH_F_iris_R'], { c: 0x5a7cb4 });
  P('pupilla', 'pupille', 'pupilla', ['VH_F_pupil_R'], { c: 0x2a2a34 });
  P('lens', 'cristallin', 'lens', ['VH_F_lens_R'], { alt: ['lentille'], c: 0xeee2a4 });
  P('zonula_ciliaris', 'zonule ciliaire', 'zonula ciliaris', ['VH_F_suspensory_ligament_of_lens_R'], { alt: ['fibres zonulaires'], old: ['zonule de Zinn'], c: 0xe8e0c8 });
  P('humor_aquosus', 'humeur aqueuse', 'humor aquosus', ['VH_F_aqueous_humor_R'], { c: 0xa8d4e8 });
  P('corpus_vitreum', 'corps vitré', 'corpus vitreum', ['VH_F_vitreous_humor_R'], { alt: ['vitré'], old: ['humeur vitrée'], c: 0xc8e2ea });
  P('retina', 'rétine', 'retina', ['VH_F_retina_R'], { c: 0xd86c4c });
  P('macula', 'macula', 'macula', ['VH_F_macula_lutea_R'], { alt: ['macula lutea', 'tache jaune'], c: 0xe8c040 });
  P('fovea_centralis', 'fovéa centrale', 'fovea centralis', ['VH_F_fovea_R'], { alt: ['fovéa'], c: 0xc89020 });
  P('discus_nervi_optici', 'disque du nerf optique', 'discus nervi optici', ['VH_F_optic_disc_R'], { alt: ['papille optique'], old: ['tache aveugle'], c: 0xf0d8a8 });
  P('ora_serrata', 'ora serrata', 'ora serrata', ['VH_F_ora_serrata_of_retina_R'], { c: 0xb0603c });
  P('sinus_venosus_sclerae', 'sinus veineux de la sclère', 'sinus venosus sclerae', ['VH_F_schlemms_canal_R'], { old: ['canal de Schlemm'], c: 0x5a7ad0 });
  P('reticulum_trabeculare', 'réticulum trabéculaire', 'reticulum trabeculare', ['VH_F_trabecular_meshwork_R'], { alt: ['trabéculum'], c: 0xc8b8a0 });
  P('tunica_conjunctiva_bulbi', 'conjonctive bulbaire', 'tunica conjunctiva bulbi', ['VH_F_bulbar_conjunctiva_R'], { c: 0xf0d0d0 });
  P('tunica_conjunctiva_palpebrarum', 'conjonctive palpébrale', 'tunica conjunctiva palpebrarum', ['VH_F_palpebral_conjunctiva_of_right_*'], { c: 0xe8a0a0 });
  P('nervus_opticus', 'nerf optique', 'nervus opticus', ['VH_F_right_optic_nerve'], { alt: ['II'], c: 0xf2e6b8 });
  P('vagina_externa_nervi_optici', 'gaine externe du nerf optique', 'vagina externa nervi optici', ['VH_F_dura_mater_right'], { alt: ['dure-mère du nerf optique', 'gaine du nerf optique'], c: 0xd4cab0 });
  P('musculus_rectus_superior', 'muscle droit supérieur', 'musculus rectus superior', ['VH_F_superior_rectus_extraocular_muscle_R'], { alt: ['droit supérieur'], c: 0xc4524c });
  P('musculus_rectus_inferior', 'muscle droit inférieur', 'musculus rectus inferior', ['VH_F_inferior_rectus_extraocular_muscle_R'], { alt: ['droit inférieur'], c: 0xb04640 });
  P('musculus_rectus_medialis', 'muscle droit médial', 'musculus rectus medialis', ['VH_F_medial_rectus_extraocular_muscle_R'], { alt: ['droit médial'], old: ['droit interne'], c: 0xd06058 });
  P('musculus_rectus_lateralis', 'muscle droit latéral', 'musculus rectus lateralis', ['VH_F_lateral_rectus_extraocular_muscle_R'], { alt: ['droit latéral'], old: ['droit externe'], c: 0xbc4c46 });
  P('musculus_obliquus_superior', 'muscle oblique supérieur', 'musculus obliquus superior', ['VH_F_superior_oblique_extraocular_muscle_R'], { alt: ['oblique supérieur'], old: ['grand oblique'], c: 0xd87068 });
  P('musculus_obliquus_inferior', 'muscle oblique inférieur', 'musculus obliquus inferior', ['VH_F_inferior_oblique_extraocular_muscle_R'], { alt: ['oblique inférieur'], old: ['petit oblique'], c: 0xc85e58 });

  O('oreille', 'sens', 'oreille', 'auris', 'z', { c: 0xe8d6a8 });
  P('membrana_tympanica', 'membrane du tympan', 'membrana tympanica', ['Tympanic membrane.r'], { alt: ['membrane tympanique', 'tympan'], c: 0xe0c8a2 });
  P('malleus', 'malléus', 'malleus', ['Malleus.r'], { alt: ['marteau'], c: 0xf0e6cc });
  P('incus', 'incus', 'incus', ['Incus.r'], { alt: ['enclume'], c: 0xe4d8b8 });
  P('stapes', 'stapès', 'stapes', ['Stapes.r'], { alt: ['étrier'], c: 0xd8caa8 });
  P('cochlea', 'cochlée', 'cochlea', ['Cochlea.r'], { old: ['limaçon'], c: 0xe8d6a8 });
  P('vestibulum', 'vestibule et canaux semi-circulaires', 'vestibulum et canales semicirculares', ['Vestibule.r'], { alt: ['vestibule', 'canaux semi-circulaires', 'labyrinthe osseux'], c: 0xdcc898 });
  P('tuba_auditiva', 'trompe auditive', 'tuba auditiva', ['Auditory tube.r'], { alt: ['tube auditif'], old: ['trompe d\'Eustache'], c: 0xd8a490 });

  const SPLANCHNO_BY = {};
  SPLANCHNO.forEach(o => { SPLANCHNO_BY[o.key] = o; });

  Object.assign(NS, { SPLANCHNO, SPLANCHNO_BY });
})(AQ.data);
