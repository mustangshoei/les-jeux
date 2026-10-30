/* ==========================================================================
   Anotehomy Quizz - data/vessels.js
   CATALOGUE DES VAISSEAUX SANGUINS (nomenclature TA2)
   --------------------------------------------------------------------------
   Une entree par vaisseau (les deux cotes du corps sont des instances du meme vaisseau) :
     V(id, type, region, nom TA2, nom latin, principal, [objets Z-Anatomy], options)
       type      : 'a' artere, 'v' veine (et sinus veineux)
       principal : 1 = vaisseau classique (filtre "vaisseaux principaux")
       objets    : noms des maillages Z-Anatomy (sans le suffixe .r / .l) ; les segments et
                   les petites branches d'un vaisseau sont regroupes avec lui
       options   : alt (variantes acceptees), old (ancienne nomenclature, reconnue mais
                   comptee fausse), u (vaisseau impair : une seule instance, meme si le nom
                   Z-Anatomy dit « droit » ou « gauche »), p (circulation pulmonaire : couleurs
                   inversees, comme dans les atlas : arteres pulmonaires en bleu, veines en rouge)
   Cote du corps : suffixe Z-Anatomy (.r / .l), sinon « Right » / « Left » dans le nom, sinon
   position du maillage (tools/build-vessels.ps1).
   Une entree tient sur UNE ligne : tools/build-vessels.ps1 lit les objets Z-Anatomy
   directement dans ce fichier.
   Modele 3D : Z-Anatomy (CC BY-SA 4.0), voir CREDITS.md.
   ========================================================================== */
(function (NS) {
  'use strict';

  /* zones du corps proposees en configuration */
  const VESSEL_REGIONS = [
    { id: 'tete', name: 'Tête et cou' },
    { id: 'encephale', name: 'Encéphale' },
    { id: 'thorax', name: 'Thorax et cœur' },
    { id: 'abdomen', name: 'Abdomen' },
    { id: 'pelvis', name: 'Pelvis et périnée' },
    { id: 'ms', name: 'Membre supérieur' },
    { id: 'mi', name: 'Membre inférieur' }
  ];
  const VESSEL_TYPES = [
    { id: 'a', name: 'Artères', one: 'artère' },
    { id: 'v', name: 'Veines', one: 'veine' }
  ];
  const VESSELS = [];
  function V(id, type, region, name, latin, principal, z, o = {}) {
    VESSELS.push({ id, type, region, name, latin, principal: !!principal, z, alt: o.alt || [], old: o.old || [], unpaired: !!o.u, pulmonary: !!o.p });
  }

  /* ---------------- Tête et cou : artères ---------------- */
  V('carotis_communis', 'a', 'tete', 'artère carotide commune', 'arteria carotis communis', 1, ['Right common carotid artery', 'Left common carotid artery'], { alt: ['carotide commune'], old: ['artère carotide primitive', 'carotide primitive'] });
  V('carotis_externa', 'a', 'tete', 'artère carotide externe', 'arteria carotis externa', 1, ['External carotid artery'], { alt: ['carotide externe'] });
  V('carotis_interna', 'a', 'tete', 'artère carotide interne', 'arteria carotis interna', 1, ['Internal carotid artery'], { alt: ['carotide interne'] });
  V('vertebralis', 'a', 'tete', 'artère vertébrale', 'arteria vertebralis', 1, ['Vertebral artery']);
  V('truncus_thyrocervicalis', 'a', 'tete', 'tronc thyro-cervical', 'truncus thyrocervicalis', 0, ['Thyrocervical trunk'], { alt: ['tronc thyrocervical'], old: ['tronc thyro-bicervico-scapulaire'] });
  V('thyroidea_inferior', 'a', 'tete', 'artère thyroïdienne inférieure', 'arteria thyroidea inferior', 0, ['Inferior thyroid artery']);
  V('transversa_colli', 'a', 'tete', 'artère transverse du cou', 'arteria transversa colli', 0, ['Transverse cervical artery', '(Deep branch of transverse cervical artery)', '(Superficial branch of transverse cervical artery)'], { alt: ['artère cervicale transverse'], old: ['artère cervicale transverse superficielle'] });
  V('suprascapularis', 'a', 'tete', 'artère suprascapulaire', 'arteria suprascapularis', 0, ['Suprascapular artery'], { old: ['artère sus-scapulaire', 'artère scapulaire supérieure'] });
  V('truncus_costocervicalis', 'a', 'tete', 'tronc costo-cervical', 'truncus costocervicalis', 0, ['Costocervical trunk'], { alt: ['tronc costocervical'], old: ['tronc cervico-intercostal'] });
  V('cervicalis_profunda', 'a', 'tete', 'artère cervicale profonde', 'arteria cervicalis profunda', 0, ['Deep cervical artery']);
  V('facialis', 'a', 'tete', 'artère faciale', 'arteria facialis', 1, ['Facial artery'], { old: ['artère maxillaire externe'] });
  V('angularis', 'a', 'tete', 'artère angulaire', 'arteria angularis', 0, ['Angular artery']);
  V('labialis_superior', 'a', 'tete', 'artère labiale supérieure', 'arteria labialis superior', 0, ['Superior labial artery'], { old: ['artère coronaire labiale supérieure'] });
  V('labialis_inferior', 'a', 'tete', 'artère labiale inférieure', 'arteria labialis inferior', 0, ['Inferior labial artery'], { old: ['artère coronaire labiale inférieure'] });
  V('submentalis', 'a', 'tete', 'artère submentale', 'arteria submentalis', 0, ['Submental artery'], { old: ['artère sous-mentale'] });
  V('pharyngea_ascendens', 'a', 'tete', 'artère pharyngienne ascendante', 'arteria pharyngea ascendens', 0, ['Ascending pharyngeal artery']);
  V('occipitalis', 'a', 'tete', 'artère occipitale', 'arteria occipitalis', 1, ['Occipital artery']);
  V('temporalis_superficialis', 'a', 'tete', 'artère temporale superficielle', 'arteria temporalis superficialis', 1, ['Superficial temporal artery', 'Frontal branch of superficial temporal artery']);
  V('transversa_faciei', 'a', 'tete', 'artère transverse de la face', 'arteria transversa faciei', 0, ['Transverse facial artery']);
  V('maxillaris', 'a', 'tete', 'artère maxillaire', 'arteria maxillaris', 1, ['Maxillary artery'], { old: ['artère maxillaire interne'] });
  V('meningea_media', 'a', 'tete', 'artère méningée moyenne', 'arteria meningea media', 1, ['Middle meningeal artery', 'Accessory branch of middle meningeal artery']);
  V('alveolaris_inferior', 'a', 'tete', 'artère alvéolaire inférieure', 'arteria alveolaris inferior', 0, ['Inferior alveolar artery', 'Mental branch of inferior alveolar artery', 'Mylohyoid branch of inferior alveolar artery'], { old: ['artère dentaire inférieure'] });
  V('alveolaris_superior_posterior', 'a', 'tete', 'artère alvéolaire supérieure postérieure', 'arteria alveolaris superior posterior', 0, ['Posterior superior alveolar artery'], { old: ['artère alvéolaire', 'artère dentaire supérieure postérieure'] });
  V('infraorbitalis', 'a', 'tete', 'artère infra-orbitaire', 'arteria infraorbitalis', 0, ['Infra-orbital artery'], { alt: ['artère infraorbitaire'], old: ['artère sous-orbitaire'] });
  V('temporales_profundae', 'a', 'tete', 'artères temporales profondes', 'arteriae temporales profundae', 0, ['Anterior deep temporal artery', 'Posterior deep temporal artery'], { alt: ['artère temporale profonde'] });
  V('buccalis', 'a', 'tete', 'artère buccale', 'arteria buccalis', 0, ['Buccal artery']);
  V('palatina_descendens', 'a', 'tete', 'artère palatine descendante', 'arteria palatina descendens', 0, ['Descending palatine artery', 'Greater palatine artery'], { alt: ['artère grande palatine'] });
  V('sphenopalatina', 'a', 'tete', 'artère sphéno-palatine', 'arteria sphenopalatina', 0, ['Posterior lateral nasal branches of sphenopalatine artery.', 'Posterior septal branches of sphenopalatine artery'], { alt: ['artère sphénopalatine'] });
  V('canalis_pterygoidei', 'a', 'tete', 'artère du canal ptérygoïdien', 'arteria canalis pterygoidei', 0, ['Artery of pterygoid canal'], { old: ['artère vidienne'] });
  V('ophthalmica', 'a', 'tete', 'artère ophtalmique', 'arteria ophthalmica', 1, ['Ophthalmic artery']);
  V('centralis_retinae', 'a', 'tete', 'artère centrale de la rétine', 'arteria centralis retinae', 0, ['Central retinal artery']);
  V('ciliares_posteriores', 'a', 'tete', 'artères ciliaires postérieures', 'arteriae ciliares posteriores', 0, ['Long posterior ciliary arteries', 'Short posterior ciliary arteries']);
  V('lacrimalis', 'a', 'tete', 'artère lacrymale', 'arteria lacrimalis', 0, ['Lacrimal artery']);
  V('supraorbitalis', 'a', 'tete', 'artère supra-orbitaire', 'arteria supraorbitalis', 0, ['Supra-orbital artery'], { alt: ['artère supraorbitaire'], old: ['artère sus-orbitaire'] });
  V('supratrochlearis', 'a', 'tete', 'artère supratrochléaire', 'arteria supratrochlearis', 0, ['Supratrochlear artery'], { old: ['artère frontale interne'] });
  V('ethmoidalis_anterior', 'a', 'tete', 'artère ethmoïdale antérieure', 'arteria ethmoidalis anterior', 0, ['Anterior ethmoidal artery', 'Anterior septal branches of anterior ethmoidal artery']);
  V('ethmoidalis_posterior', 'a', 'tete', 'artère ethmoïdale postérieure', 'arteria ethmoidalis posterior', 0, ['Posterior ethmoidal artery', 'Septal branches of posterior ethmoidal artery']);

  /* ---------------- Tête et cou : veines ---------------- */
  V('jugularis_interna', 'v', 'tete', 'veine jugulaire interne', 'vena jugularis interna', 1, ['Internal jugular vein'], { alt: ['jugulaire interne'] });
  V('jugularis_externa', 'v', 'tete', 'veine jugulaire externe', 'vena jugularis externa', 1, ['External jugular vein'], { alt: ['jugulaire externe'] });
  V('jugularis_anterior', 'v', 'tete', 'veine jugulaire antérieure', 'vena jugularis anterior', 0, ['Anterior jugular vein']);
  V('facialis_v', 'v', 'tete', 'veine faciale', 'vena facialis', 1, ['Facial vein']);
  V('facialis_communis', 'v', 'tete', 'veine faciale commune', 'vena facialis communis', 0, ['Common facial vein'], { old: ['tronc thyro-linguo-facial', 'tronc veineux thyro-linguo-facial'] });
  V('angularis_v', 'v', 'tete', 'veine angulaire', 'vena angularis', 0, ['Angular vein']);
  V('labialis_superior_v', 'v', 'tete', 'veine labiale supérieure', 'vena labialis superior', 0, ['Superior labial vein']);
  V('labiales_inferiores_v', 'v', 'tete', 'veines labiales inférieures', 'venae labiales inferiores', 0, ['Inferior labial veins'], { alt: ['veine labiale inférieure'] });
  V('submentalis_v', 'v', 'tete', 'veine submentale', 'vena submentalis', 0, ['Submental vein'], { old: ['veine sous-mentale'] });
  V('retromandibularis', 'v', 'tete', 'veine rétromandibulaire', 'vena retromandibularis', 1, ['Retromandibular vein', 'Anterior division of retromandibular vein', 'Posterior division of retromandibular vein'], { alt: ['veine rétro-mandibulaire'] });
  V('temporales_superficiales_v', 'v', 'tete', 'veines temporales superficielles', 'venae temporales superficiales', 0, ['Superficial temporal veins'], { alt: ['veine temporale superficielle'] });
  V('maxillares_v', 'v', 'tete', 'veines maxillaires', 'venae maxillares', 0, ['Maxillary veins'], { alt: ['veine maxillaire'] });
  V('auricularis_posterior_v', 'v', 'tete', 'veine auriculaire postérieure', 'vena auricularis posterior', 0, ['Posterior auricular vein']);
  V('occipitalis_v', 'v', 'tete', 'veine occipitale', 'vena occipitalis', 0, ['Occipital vein']);
  V('vertebralis_v', 'v', 'tete', 'veine vertébrale', 'vena vertebralis', 0, ['Vertebral vein']);
  V('lingualis_v', 'v', 'tete', 'veine linguale', 'vena lingualis', 0, ['Lingual vein']);
  V('thyroidea_superior_v', 'v', 'tete', 'veine thyroïdienne supérieure', 'vena thyroidea superior', 0, ['Superior thyroid vein']);
  V('suprascapularis_v', 'v', 'tete', 'veine suprascapulaire', 'vena suprascapularis', 0, ['Suprascapular vein'], { old: ['veine sus-scapulaire'] });
  V('ophthalmica_superior', 'v', 'tete', 'veine ophtalmique supérieure', 'vena ophthalmica superior', 0, ['Superior ophthalmic vein']);
  V('ophthalmica_inferior', 'v', 'tete', 'veine ophtalmique inférieure', 'vena ophthalmica inferior', 0, ['Inferior ophthalmic vein']);

  /* ---------------- Encéphale : artères ---------------- */
  V('basilaris', 'a', 'encephale', 'artère basilaire', 'arteria basilaris', 1, ['Basilar artery'], { old: ['tronc basilaire'], u: 1 });
  V('cerebri_anterior', 'a', 'encephale', 'artère cérébrale antérieure', 'arteria cerebri anterior', 1, ['Anterior cerebral artery', 'Orbitofrontal branches of anterior cerebral artery']);
  V('pericallosa', 'a', 'encephale', 'artère péricalleuse', 'arteria pericallosa', 0, ['Pericallosal artery']);
  V('callosomarginalis', 'a', 'encephale', 'artère calloso-marginale', 'arteria callosomarginalis', 0, ['Callosomarginal artery', 'Frontal branches of callosomarginal artery'], { alt: ['artère callosomarginale'] });
  V('cerebri_media', 'a', 'encephale', 'artère cérébrale moyenne', 'arteria cerebri media', 1, ['Middle cerebral artery (M1-segment)', 'Insular branches of middle cerebral artery (M2)', 'Insular branches of middle cerebral artery (M2-segment)', 'Middle cerebral artery (M3-segment)', 'Middle cerebral artery (M3 segment)', 'Anterior temporal branch', 'Artery of precentral sulcus', 'Prefrontal artery', 'Lateral frontobasal artery', 'Artery of central sulcus', 'Parietal branches of middle cerebral artery', 'Postcentral arterial branch', 'Posterior parietal artery', 'Posterior temporal branch', 'Temporal branches of middle cerebral artery', 'Temporo-occipital branch', 'Branch to angular gyrus'], { old: ['artère sylvienne'] });
  V('centrales_anterolaterales', 'a', 'encephale', 'artères centrales antéro-latérales', 'arteriae centrales anterolaterales', 0, ['Distal lateral striate branches', 'Proximal lateral striate branches'], { alt: ['artères lenticulo-striées', 'artères striées latérales'] });
  V('cerebri_posterior', 'a', 'encephale', 'artère cérébrale postérieure', 'arteria cerebri posterior', 1, ['Posterior cerebral artery', 'Medial occipital artery', 'Lateral occipital artery', 'Parieto-occipital artery']);
  V('communicans_anterior', 'a', 'encephale', 'artère communicante antérieure', 'arteria communicans anterior', 1, ['Anterior communicating artery'], { u: 1 });
  V('communicans_posterior', 'a', 'encephale', 'artère communicante postérieure', 'arteria communicans posterior', 1, ['Posterior communicating artery']);
  V('superior_cerebelli', 'a', 'encephale', 'artère supérieure du cervelet', 'arteria superior cerebelli', 0, ['Superior cerebellar artery'], { alt: ['artère cérébelleuse supérieure'] });
  V('inferior_anterior_cerebelli', 'a', 'encephale', 'artère inférieure et antérieure du cervelet', 'arteria inferior anterior cerebelli', 0, ['Anterior inferior cerebellar artery'], { alt: ['artère cérébelleuse antéro-inférieure', 'artère cérébelleuse inférieure antérieure'], old: ['artère cérébelleuse moyenne'] });
  V('inferior_posterior_cerebelli', 'a', 'encephale', 'artère inférieure et postérieure du cervelet', 'arteria inferior posterior cerebelli', 0, ['Posterior inferior cerebellar artery'], { alt: ['artère cérébelleuse postéro-inférieure', 'artère cérébelleuse inférieure postérieure'] });
  V('arteriae_pontis', 'a', 'encephale', 'artères du pont', 'arteriae pontis', 0, ['Lateral pontine branches of basilar artery', 'Medial pontine branches of basilar artery'], { alt: ['rameaux pontiques', 'artères pontiques'], old: ['artères protubérantielles'] });
  V('spinalis_anterior', 'a', 'encephale', 'artère spinale antérieure', 'arteria spinalis anterior', 0, ['Anterior spinal artery'], { u: 1 });

  /* ---------------- Encéphale : sinus veineux de la dure-mère ---------------- */
  V('sinus_sagittalis_superior', 'v', 'encephale', 'sinus sagittal supérieur', 'sinus sagittalis superior', 1, ['Superior sagittal sinus'], { old: ['sinus longitudinal supérieur'], u: 1 });
  V('sinus_sagittalis_inferior', 'v', 'encephale', 'sinus sagittal inférieur', 'sinus sagittalis inferior', 0, ['Inferior sagittal sinus'], { old: ['sinus longitudinal inférieur'], u: 1 });
  V('sinus_rectus', 'v', 'encephale', 'sinus droit', 'sinus rectus', 1, ['Straight sinus'], { u: 1 });
  V('sinus_occipitalis', 'v', 'encephale', 'sinus occipital', 'sinus occipitalis', 0, ['Occipital sinus'], { u: 1 });
  V('sinus_transversus', 'v', 'encephale', 'sinus transverse', 'sinus transversus', 1, ['Transverse sinus'], { old: ['sinus latéral'] });
  V('sinus_sigmoideus', 'v', 'encephale', 'sinus sigmoïde', 'sinus sigmoideus', 1, ['Sigmoid sinus']);
  V('sinus_petrosus_superior', 'v', 'encephale', 'sinus pétreux supérieur', 'sinus petrosus superior', 0, ['Superior petrosal sinus']);
  V('sinus_petrosus_inferior', 'v', 'encephale', 'sinus pétreux inférieur', 'sinus petrosus inferior', 0, ['Inferior petrosal sinus']);
  V('sinus_cavernosus', 'v', 'encephale', 'sinus caverneux', 'sinus cavernosus', 1, ['Cavernous sinus']);
  V('sinus_intercavernosi', 'v', 'encephale', 'sinus intercaverneux', 'sinus intercavernosi', 0, ['Anterior intercavernous sinus', 'Posterior intercavernous sinus'], { alt: ['sinus coronaire de la selle'], u: 1 });
  V('plexus_basilaris', 'v', 'encephale', 'plexus basilaire', 'plexus basilaris', 0, ['Basilar venous plexus'], { u: 1 });

  /* ---------------- Thorax et cœur : artères ---------------- */
  V('aorta_ascendens', 'a', 'thorax', 'aorte ascendante', 'aorta ascendens', 1, ['Ascending aorta'], { u: 1 });
  V('arcus_aortae', 'a', 'thorax', 'arc de l\'aorte', 'arcus aortae', 1, ['Aortic arch'], { alt: ['arc aortique'], old: ['crosse de l\'aorte', 'crosse aortique'], u: 1 });
  V('aorta_thoracica', 'a', 'thorax', 'aorte thoracique', 'aorta thoracica', 1, ['Thoracic aorta'], { alt: ['aorte descendante thoracique', 'partie thoracique de l\'aorte'], u: 1 });
  V('truncus_brachiocephalicus', 'a', 'thorax', 'tronc brachiocéphalique', 'truncus brachiocephalicus', 1, ['Brachiocephalic trunk'], { alt: ['tronc brachio-céphalique'], old: ['tronc artériel brachio-céphalique', 'artère innominée'], u: 1 });
  V('subclavia', 'a', 'thorax', 'artère subclavière', 'arteria subclavia', 1, ['Right subclavian artery', 'Left subclavian artery'], { old: ['artère sous-clavière', 'sous-clavière'] });
  V('thoracica_interna', 'a', 'thorax', 'artère thoracique interne', 'arteria thoracica interna', 1, ['Internal thoracic artery'], { old: ['artère mammaire interne'] });
  V('musculophrenica', 'a', 'thorax', 'artère musculo-phrénique', 'arteria musculophrenica', 0, ['Musculophrenic artery'], { alt: ['artère musculophrénique'] });
  V('intercostales_posteriores', 'a', 'thorax', 'artères intercostales postérieures', 'arteriae intercostales posteriores', 1, ['Posterior intercostal arteries', 'First posterior intercostal artery', 'Second posterior intercostal artery'], { alt: ['artère intercostale postérieure', 'artères intercostales'] });
  V('intercostalis_suprema', 'a', 'thorax', 'artère intercostale suprême', 'arteria intercostalis suprema', 0, ['Supreme intercostal artery'], { old: ['artère intercostale supérieure'] });
  V('subcostalis', 'a', 'thorax', 'artère subcostale', 'arteria subcostalis', 0, ['Subcostal artery'], { old: ['artère sous-costale'] });
  V('phrenicae_superiores', 'a', 'thorax', 'artères phréniques supérieures', 'arteriae phrenicae superiores', 0, ['Superior phrenic arteries'], { alt: ['artère phrénique supérieure'], old: ['artères diaphragmatiques supérieures'] });
  V('coronaria_dextra', 'a', 'thorax', 'artère coronaire droite', 'arteria coronaria dextra', 1, ['Right coronary artery', 'Right inferolateral branch of right coronary artery'], { u: 1 });
  V('coronaria_sinistra', 'a', 'thorax', 'artère coronaire gauche', 'arteria coronaria sinistra', 1, ['Left coronary artery'], { alt: ['tronc commun de la coronaire gauche'], u: 1 });
  V('interventricularis_anterior', 'a', 'thorax', 'rameau interventriculaire antérieur', 'ramus interventricularis anterior', 1, ['Anterior interventricular artery', 'Septal branches of anterior interventricular artery'], { alt: ['artère interventriculaire antérieure'], u: 1 });
  V('circumflexus', 'a', 'thorax', 'rameau circonflexe', 'ramus circumflexus', 1, ['Circumflex artery of heart'], { alt: ['artère circonflexe'], u: 1 });
  V('truncus_pulmonalis', 'a', 'thorax', 'tronc pulmonaire', 'truncus pulmonalis', 1, ['Pulmonary trunk', 'Bifurcation of pulmonary trunk'], { alt: ['tronc de l\'artère pulmonaire'], u: 1, p: 1 });
  V('pulmonalis', 'a', 'thorax', 'artère pulmonaire', 'arteria pulmonalis', 1, ['Right pulmonary artery', 'Left pulmonary artery'], { alt: ['artère pulmonaire droite', 'artère pulmonaire gauche'], p: 1 });
  V('lobaris_superior', 'a', 'thorax', 'artères lobaires supérieures', 'arteriae lobares superiores', 0, ['Superior lobar artery of right lung', 'Anterior segmental artery of right lung', 'Apical segmental artery of right lung', 'Posterior segmental artery of right lung', 'Anterior segmental artery of left lung', 'Apical segmental artery of left lung', 'Posterior segmental artery of left lung', 'Superior lingular artery of left lung', 'Inferior lingular artery of left lung'], { alt: ['artère lobaire supérieure'], p: 1 });
  V('lobaris_media', 'a', 'thorax', 'artère lobaire moyenne', 'arteria lobaris media', 0, ['Middle lobar artery of right lung', 'Lateral segmental artery of right lung', 'Medial segmental artery of right lung'], { u: 1, p: 1 });
  V('lobaris_inferior', 'a', 'thorax', 'artères lobaires inférieures', 'arteriae lobares inferiores', 0, ['Inferior lobar artery of right lung', 'Superior segmental artery of right lung', 'Anterior basal segmental artery of right lung', 'Lateral basal segmental artery of right lung', 'Medial basal segmental artery of right lung', 'Posterior basal segmental artery of right lung', 'Superior segmental artery of left lung', 'Anterior basal segmental artery of left lung', 'Lateral basal segmental artery of left lung', 'Medial basal segmental artery of left lung', 'Posterior basal segmental artery of left lung'], { alt: ['artère lobaire inférieure'], p: 1 });

  /* ---------------- Thorax et cœur : veines ---------------- */
  V('cava_superior', 'v', 'thorax', 'veine cave supérieure', 'vena cava superior', 1, ['Superior vena cava'], { u: 1 });
  V('brachiocephalica', 'v', 'thorax', 'veine brachiocéphalique', 'vena brachiocephalica', 1, ['Right brachiocephalic vein', 'Left brachiocephalic vein'], { alt: ['veine brachio-céphalique'], old: ['tronc veineux brachio-céphalique', 'veine innominée'] });
  V('subclavia_v', 'v', 'thorax', 'veine subclavière', 'vena subclavia', 1, ['Right subclavian vein', 'Left subclavian vein'], { old: ['veine sous-clavière'] });
  V('azygos', 'v', 'thorax', 'veine azygos', 'vena azygos', 1, ['Azygos vein'], { alt: ['azygos'], old: ['grande veine azygos'], u: 1 });
  V('hemiazygos', 'v', 'thorax', 'veine hémi-azygos', 'vena hemiazygos', 1, ['Hemi-azygos vein'], { alt: ['veine hémiazygos'], old: ['petite veine azygos inférieure'], u: 1 });
  V('hemiazygos_accessoria', 'v', 'thorax', 'veine hémi-azygos accessoire', 'vena hemiazygos accessoria', 0, ['Accessory hemi-azygos vein'], { alt: ['veine hémiazygos accessoire'], old: ['petite veine azygos supérieure'], u: 1 });
  V('intercostalis_superior_v', 'v', 'thorax', 'veine intercostale supérieure', 'vena intercostalis superior', 0, ['Right superior intercostal vein', 'Left superior intercostal vein'], { alt: ['veines intercostales postérieures'] });
  V('thoracicae_internae_v', 'v', 'thorax', 'veines thoraciques internes', 'venae thoracicae internae', 0, ['Internal thoracic veins'], { alt: ['veine thoracique interne'], old: ['veines mammaires internes'] });
  V('musculophrenicae_v', 'v', 'thorax', 'veines musculo-phréniques', 'venae musculophrenicae', 0, ['Musculophrenic veins'], { alt: ['veine musculo-phrénique'] });
  V('subcostalis_v', 'v', 'thorax', 'veine subcostale', 'vena subcostalis', 0, ['Right subcostal vein', 'Left subcostal vein'], { old: ['veine sous-costale'] });
  V('phrenica_superior_v', 'v', 'thorax', 'veines phréniques supérieures', 'venae phrenicae superiores', 0, ['Right superior phrenic vein'], { alt: ['veine phrénique supérieure'] });
  V('pulmonalis_superior_v', 'v', 'thorax', 'veine pulmonaire supérieure', 'vena pulmonalis superior', 1, ['Right superior pulmonary vein', 'Left superior pulmonary vein', 'Apical vein of right lung', 'Anterior vein of right lung', 'Posterior vein of right lung', 'Lateral vein of right lung', 'Medial vein of right lung', 'Apicoposterior vein of left lung', 'Anterior vein of left lung', 'Lingular vein of left lung', 'Superior lingular vein of left lung', 'Inferior lingular vein of left lung'], { alt: ['veines pulmonaires supérieures', 'veines pulmonaires'], p: 1 });
  V('pulmonalis_inferior_v', 'v', 'thorax', 'veine pulmonaire inférieure', 'vena pulmonalis inferior', 1, ['Right inferior pulmonary vein', 'Left inferior pulmonary vein', 'Superior vein of right lung', 'Superior basal vein of right lung', 'Inferior basal vein of right lung', 'Superior vein of left lung', 'Superior basal vein of left lung', 'Inferior basal vein of left lung'], { alt: ['veines pulmonaires inférieures'], p: 1 });
  V('sinus_coronarius', 'v', 'thorax', 'sinus coronaire', 'sinus coronarius', 1, ['Coronary sinus'], { u: 1 });
  V('cardiaca_magna', 'v', 'thorax', 'grande veine du cœur', 'vena cardiaca magna', 1, ['Great cardiac vein'], { alt: ['grande veine cardiaque'], old: ['grande veine coronaire'], u: 1 });
  V('cardiaca_media', 'v', 'thorax', 'veine moyenne du cœur', 'vena cardiaca media', 0, ['Middle cardiac vein'], { alt: ['veine cardiaque moyenne', 'veine interventriculaire postérieure'], u: 1 });
  V('ventriculi_sinistri_posterior', 'v', 'thorax', 'veine postérieure du ventricule gauche', 'vena ventriculi sinistri posterior', 0, ['Inferior vein of left ventricle', 'Inferior vein of left ventricle (//Posterior \'\')'], { alt: ['veine inférieure du ventricule gauche'], u: 1 });

  /* ---------------- Abdomen : artères ---------------- */
  V('aorta_abdominalis', 'a', 'abdomen', 'aorte abdominale', 'aorta abdominalis', 1, ['Abdominal aorta'], { alt: ['partie abdominale de l\'aorte'], u: 1 });
  V('truncus_coeliacus', 'a', 'abdomen', 'tronc cœliaque', 'truncus coeliacus', 1, ['Coeliac trunk'], { u: 1 });
  V('gastrica_sinistra', 'a', 'abdomen', 'artère gastrique gauche', 'arteria gastrica sinistra', 1, ['Left gastric artery'], { old: ['artère coronaire stomachique'], u: 1 });
  V('hepatica_communis', 'a', 'abdomen', 'artère hépatique commune', 'arteria hepatica communis', 1, ['Common hepatic artery'], { u: 1 });
  V('hepatica_propria', 'a', 'abdomen', 'artère hépatique propre', 'arteria hepatica propria', 1, ['Proper hepatic artery'], { u: 1 });
  V('gastroduodenalis', 'a', 'abdomen', 'artère gastro-duodénale', 'arteria gastroduodenalis', 0, ['Gastroduodenal artery'], { alt: ['artère gastroduodénale'], u: 1 });
  V('splenica', 'a', 'abdomen', 'artère splénique', 'arteria splenica', 1, ['Splenic artery'], { alt: ['artère liénale'], u: 1 });
  V('mesenterica_superior', 'a', 'abdomen', 'artère mésentérique supérieure', 'arteria mesenterica superior', 1, ['Superior mesenteric artery'], { u: 1 });
  V('pancreaticoduodenalis_inferior', 'a', 'abdomen', 'artère pancréatico-duodénale inférieure', 'arteria pancreaticoduodenalis inferior', 0, ['Inferior pancreaticoduodenal artery', 'Anterior inferior pancreaticoduodenal artery'], { alt: ['artère pancréaticoduodénale inférieure'], u: 1 });
  V('colica_media', 'a', 'abdomen', 'artère colique moyenne', 'arteria colica media', 0, ['Middle colic artery'], { u: 1 });
  V('colica_dextra', 'a', 'abdomen', 'artère colique droite', 'arteria colica dextra', 0, ['Right colic artery'], { u: 1 });
  V('ileocolica', 'a', 'abdomen', 'artère iléo-colique', 'arteria ileocolica', 0, ['Ileocolic artery', 'Colic branch of ileocolic artery', 'Ileal branch of ileocolic artery'], { alt: ['artère iléocolique'], old: ['artère iléo-bicaeco-appendiculo-colique'], u: 1 });
  V('appendicularis', 'a', 'abdomen', 'artère appendiculaire', 'arteria appendicularis', 0, ['Appendicular artery'], { u: 1 });
  V('marginalis_coli', 'a', 'abdomen', 'artère marginale du côlon', 'arteria marginalis coli', 0, ['Marginal artery'], { alt: ['arcade marginale du côlon'], u: 1 });
  V('mesenterica_inferior', 'a', 'abdomen', 'artère mésentérique inférieure', 'arteria mesenterica inferior', 1, ['Inferior mesenteric artery'], { u: 1 });
  V('colica_sinistra', 'a', 'abdomen', 'artère colique gauche', 'arteria colica sinistra', 0, ['Left colic artery', 'Ascending branch of left colic artery', 'Descending branch of left colic artery'], { u: 1 });
  V('sigmoideae', 'a', 'abdomen', 'artères sigmoïdiennes', 'arteriae sigmoideae', 0, ['Sigmoid arteries'], { alt: ['artère sigmoïdienne'], u: 1 });
  V('renalis', 'a', 'abdomen', 'artère rénale', 'arteria renalis', 1, ['Right renal artery', 'Left renal artery', 'Anterior branch of renal artery', 'Posterior branch of renal artery', 'Intrarenal arteries of right kidney', 'Intrarenal arteries of left kidney']);
  V('suprarenalis_inferior', 'a', 'abdomen', 'artère surrénale inférieure', 'arteria suprarenalis inferior', 0, ['Inferior suprarenal artery'], { alt: ['artère suprarénale inférieure'], old: ['artère capsulaire inférieure'] });
  V('phrenica_inferior', 'a', 'abdomen', 'artère phrénique inférieure', 'arteria phrenica inferior', 0, ['Inferior phrenic artery'], { old: ['artère diaphragmatique inférieure'] });
  V('testicularis', 'a', 'abdomen', 'artère testiculaire', 'arteria testicularis', 1, ['Right testicular artery', 'Left testicular artery'], { old: ['artère spermatique'] });
  V('lumbales', 'a', 'abdomen', 'artères lombales', 'arteriae lumbales', 0, ['Lumbar arteries'], { alt: ['artère lombale'], old: ['artères lombaires'] });
  V('epigastrica_superior', 'a', 'abdomen', 'artère épigastrique supérieure', 'arteria epigastrica superior', 0, ['Superior epigastric artery']);
  V('epigastrica_inferior', 'a', 'abdomen', 'artère épigastrique inférieure', 'arteria epigastrica inferior', 1, ['Inferior epigastric artery'], { old: ['artère épigastrique'] });
  V('epigastrica_superficialis', 'a', 'abdomen', 'artère épigastrique superficielle', 'arteria epigastrica superficialis', 0, ['Superficial epigastric artery'], { old: ['artère sous-cutanée abdominale'] });

  /* ---------------- Abdomen : veines ---------------- */
  V('cava_inferior', 'v', 'abdomen', 'veine cave inférieure', 'vena cava inferior', 1, ['Inferior vena cava (abdominal part)', 'Inferior vena cava (thoracic part)'], { u: 1 });
  V('hepaticae', 'v', 'abdomen', 'veines hépatiques', 'venae hepaticae', 1, ['Hepatic veins'], { alt: ['veine hépatique'], old: ['veines sus-hépatiques'], u: 1 });
  V('portae_hepatis', 'v', 'abdomen', 'veine porte hépatique', 'vena portae hepatis', 1, ['Hepatic portal vein'], { alt: ['veine porte'], u: 1 });
  V('splenica_v', 'v', 'abdomen', 'veine splénique', 'vena splenica', 1, ['Splenic vein'], { alt: ['veine liénale'], u: 1 });
  V('mesenterica_superior_v', 'v', 'abdomen', 'veine mésentérique supérieure', 'vena mesenterica superior', 1, ['Superior mesenteric vein'], { old: ['grande veine mésaraïque'], u: 1 });
  V('mesenterica_inferior_v', 'v', 'abdomen', 'veine mésentérique inférieure', 'vena mesenterica inferior', 1, ['Inferior mesenteric vein'], { old: ['petite veine mésaraïque'], u: 1 });
  V('colica_media_v', 'v', 'abdomen', 'veine colique moyenne', 'vena colica media', 0, ['Middle colic vein'], { u: 1 });
  V('colica_dextra_v', 'v', 'abdomen', 'veine colique droite', 'vena colica dextra', 0, ['Right colic vein'], { u: 1 });
  V('gastroomentalis_dextra_v', 'v', 'abdomen', 'veine gastro-omentale droite', 'vena gastroomentalis dextra', 0, ['Right gastro-omental vein'], { alt: ['veine gastroomentale droite'], old: ['veine gastro-épiploïque droite'], u: 1 });
  V('gastroomentalis_sinistra_v', 'v', 'abdomen', 'veine gastro-omentale gauche', 'vena gastroomentalis sinistra', 0, ['Left gastro-omental vein'], { alt: ['veine gastroomentale gauche'], old: ['veine gastro-épiploïque gauche'], u: 1 });
  V('sigmoideae_v', 'v', 'abdomen', 'veines sigmoïdiennes', 'venae sigmoideae', 0, ['Sigmoid veins'], { alt: ['veine sigmoïdienne'], u: 1 });
  V('renalis_v', 'v', 'abdomen', 'veine rénale', 'vena renalis', 1, ['Right renal vein', 'Left renal vein', 'Intrarenal veins of right kidney', 'Intrarenal veins of left kidney']);
  V('testicularis_v', 'v', 'abdomen', 'veine testiculaire', 'vena testicularis', 0, ['Right testicular vein', 'Left testicular vein'], { old: ['veine spermatique'] });
  V('lumbales_v', 'v', 'abdomen', 'veines lombales', 'venae lumbales', 0, ['Lumbar veins'], { alt: ['veine lombale'], old: ['veines lombaires'] });
  V('lumbalis_ascendens', 'v', 'abdomen', 'veine lombale ascendante', 'vena lumbalis ascendens', 0, ['Right ascending lumbar vein', 'Left ascending lumbar vein'], { old: ['veine lombaire ascendante'] });
  V('epigastricae_superiores_v', 'v', 'abdomen', 'veines épigastriques supérieures', 'venae epigastricae superiores', 0, ['Superior epigastric veins'], { alt: ['veine épigastrique supérieure'] });
  V('epigastrica_inferior_v', 'v', 'abdomen', 'veine épigastrique inférieure', 'vena epigastrica inferior', 0, ['Inferior epigastric vein']);
  V('epigastrica_superficialis_v', 'v', 'abdomen', 'veine épigastrique superficielle', 'vena epigastrica superficialis', 0, ['Superficial epigastric vein'], { old: ['veine sous-cutanée abdominale'] });

  /* ---------------- Pelvis et périnée : artères ---------------- */
  V('iliaca_communis', 'a', 'pelvis', 'artère iliaque commune', 'arteria iliaca communis', 1, ['Common iliac artery'], { old: ['artère iliaque primitive'] });
  V('iliaca_externa', 'a', 'pelvis', 'artère iliaque externe', 'arteria iliaca externa', 1, ['External iliac artery']);
  V('iliaca_interna', 'a', 'pelvis', 'artère iliaque interne', 'arteria iliaca interna', 1, ['Internal iliac artery', 'Anterior division of internal iliac artery', 'Posterior division of internal iliac artery'], { old: ['artère hypogastrique'] });
  V('sacralis_mediana', 'a', 'pelvis', 'artère sacrale médiane', 'arteria sacralis mediana', 0, ['Median sacral artery'], { old: ['artère sacrée moyenne', 'artère sacrée médiane'], u: 1 });
  V('iliolumbalis', 'a', 'pelvis', 'artère ilio-lombale', 'arteria iliolumbalis', 0, ['Iliolumbar artery', 'Iliacus branch of iliolumbar artery', 'Lumbar branch of iliolumbar artery', 'Spinal branch of iliolumbar artery'], { alt: ['artère iliolombale'] });
  V('glutea_superior', 'a', 'pelvis', 'artère glutéale supérieure', 'arteria glutea superior', 1, ['Superior gluteal artery'], { old: ['artère fessière', 'artère fessière supérieure'] });
  V('glutea_inferior', 'a', 'pelvis', 'artère glutéale inférieure', 'arteria glutea inferior', 0, ['Inferior gluteal artery'], { old: ['artère ischiatique', 'artère fessière inférieure'] });
  V('obturatoria', 'a', 'pelvis', 'artère obturatrice', 'arteria obturatoria', 0, ['Obturator artery']);
  V('pudenda_interna', 'a', 'pelvis', 'artère pudendale interne', 'arteria pudenda interna', 0, ['Internal pudendal artery'], { old: ['artère honteuse interne'] });
  V('rectalis_superior', 'a', 'pelvis', 'artère rectale supérieure', 'arteria rectalis superior', 0, ['Superior anorectal artery'], { old: ['artère hémorroïdale supérieure'], u: 1 });
  V('dorsalis_penis', 'a', 'pelvis', 'artère dorsale du pénis', 'arteria dorsalis penis', 0, ['Dorsal artery of penis'], { old: ['artère dorsale de la verge'] });
  V('profunda_penis', 'a', 'pelvis', 'artère profonde du pénis', 'arteria profunda penis', 0, ['Deep artery of penis'], { alt: ['artère caverneuse'], old: ['artère profonde de la verge'] });
  V('pudendae_externae', 'a', 'pelvis', 'artères pudendales externes', 'arteriae pudendae externae', 0, ['Superficial external pudendal artery', 'Deep external pudendal artery'], { alt: ['artère pudendale externe'], old: ['artères honteuses externes'] });

  /* ---------------- Pelvis et périnée : veines ---------------- */
  V('iliaca_communis_v', 'v', 'pelvis', 'veine iliaque commune', 'vena iliaca communis', 1, ['Common iliac vein'], { old: ['veine iliaque primitive'] });
  V('iliaca_externa_v', 'v', 'pelvis', 'veine iliaque externe', 'vena iliaca externa', 1, ['External iliac vein']);
  V('iliaca_interna_v', 'v', 'pelvis', 'veine iliaque interne', 'vena iliaca interna', 1, ['Internal iliac vein'], { old: ['veine hypogastrique'] });
  V('iliolumbalis_v', 'v', 'pelvis', 'veine ilio-lombale', 'vena iliolumbalis', 0, ['Iliolumbar vein'], { alt: ['veine iliolombale'] });
  V('gluteae_superiores_v', 'v', 'pelvis', 'veines glutéales supérieures', 'venae gluteae superiores', 0, ['Superior gluteal veins'], { alt: ['veine glutéale supérieure'], old: ['veines fessières'] });
  V('gluteae_inferiores_v', 'v', 'pelvis', 'veines glutéales inférieures', 'venae gluteae inferiores', 0, ['Inferior gluteal veins'], { alt: ['veine glutéale inférieure'], old: ['veines ischiatiques'] });
  V('pudenda_interna_v', 'v', 'pelvis', 'veine pudendale interne', 'vena pudenda interna', 0, ['Internal pudendal vein'], { old: ['veine honteuse interne'] });
  V('sacrales_laterales_v', 'v', 'pelvis', 'veines sacrales latérales', 'venae sacrales laterales', 0, ['Lateral sacral veins'], { alt: ['veine sacrale latérale'], old: ['veines sacrées latérales'] });
  V('dorsalis_profunda_penis', 'v', 'pelvis', 'veine dorsale profonde du pénis', 'vena dorsalis profunda penis', 0, ['Deep dorsal vein of penis'], { old: ['veine dorsale profonde de la verge'], u: 1 });
  V('dorsales_superficiales_penis', 'v', 'pelvis', 'veines dorsales superficielles du pénis', 'venae dorsales superficiales penis', 0, ['Superficial dorsal veins of penis'], { old: ['veines dorsales superficielles de la verge'], u: 1 });
  V('pudendae_externae_v', 'v', 'pelvis', 'veines pudendales externes', 'venae pudendae externae', 0, ['External pudendal veins'], { alt: ['veine pudendale externe'], old: ['veines honteuses externes'] });

  /* ---------------- Membre supérieur : artères ---------------- */
  V('axillaris', 'a', 'ms', 'artère axillaire', 'arteria axillaris', 1, ['Axillary artery']);
  V('thoracoacromialis', 'a', 'ms', 'artère thoraco-acromiale', 'arteria thoracoacromialis', 0, ['Thoraco-acromial artery', 'Pectoral branches of thoraco-acromial artery'], { alt: ['artère thoracoacromiale'], old: ['artère acromio-thoracique'] });
  V('thoracica_lateralis', 'a', 'ms', 'artère thoracique latérale', 'arteria thoracica lateralis', 0, ['Lateral thoracic artery'], { old: ['artère mammaire externe'] });
  V('subscapularis', 'a', 'ms', 'artère subscapulaire', 'arteria subscapularis', 0, ['Subscapular artery'], { old: ['artère sous-scapulaire', 'artère scapulaire inférieure'] });
  V('circumflexa_scapulae', 'a', 'ms', 'artère circonflexe de la scapula', 'arteria circumflexa scapulae', 0, ['Circumflex scapular artery'], { old: ['artère scapulaire inférieure'] });
  V('thoracodorsalis', 'a', 'ms', 'artère thoraco-dorsale', 'arteria thoracodorsalis', 0, ['Thoracodorsal artery'], { alt: ['artère thoracodorsale'] });
  V('circumflexa_humeri_anterior', 'a', 'ms', 'artère circonflexe humérale antérieure', 'arteria circumflexa humeri anterior', 0, ['Anterior circumflex humeral artery'], { alt: ['artère circonflexe antérieure de l\'humérus'] });
  V('circumflexa_humeri_posterior', 'a', 'ms', 'artère circonflexe humérale postérieure', 'arteria circumflexa humeri posterior', 0, ['Posterior circumflex humeral artery'], { alt: ['artère circonflexe postérieure de l\'humérus'] });
  V('brachialis', 'a', 'ms', 'artère brachiale', 'arteria brachialis', 1, ['Brachial artery'], { old: ['artère humérale'] });
  V('profunda_brachii', 'a', 'ms', 'artère profonde du bras', 'arteria profunda brachii', 1, ['Deep brachial artery'], { alt: ['artère brachiale profonde'], old: ['artère humérale profonde'] });
  V('collateralis_media', 'a', 'ms', 'artère collatérale moyenne', 'arteria collateralis media', 0, ['Middle collateral artery']);
  V('collateralis_radialis', 'a', 'ms', 'artère collatérale radiale', 'arteria collateralis radialis', 0, ['Radial collateral artery']);
  V('collateralis_ulnaris_superior', 'a', 'ms', 'artère collatérale ulnaire supérieure', 'arteria collateralis ulnaris superior', 0, ['Superior ulnar collateral artery'], { old: ['artère collatérale interne supérieure'] });
  V('collateralis_ulnaris_inferior', 'a', 'ms', 'artère collatérale ulnaire inférieure', 'arteria collateralis ulnaris inferior', 0, ['Inferior ulnar collateral artery'], { old: ['artère collatérale interne inférieure'] });
  V('radialis', 'a', 'ms', 'artère radiale', 'arteria radialis', 1, ['Radial artery', 'Palmar carpal branch of radial artery']);
  V('ulnaris', 'a', 'ms', 'artère ulnaire', 'arteria ulnaris', 1, ['Ulnar artery', 'Dorsal carpal branch of ulnar artery'], { old: ['artère cubitale'] });
  V('recurrens_ulnaris', 'a', 'ms', 'artère récurrente ulnaire', 'arteria recurrens ulnaris', 0, ['(Ulnar recurrent artery)'], { old: ['artère récurrente cubitale'] });
  V('interossea_communis', 'a', 'ms', 'artère interosseuse commune', 'arteria interossea communis', 0, ['Common interosseous artery'], { old: ['tronc des interosseuses'] });
  V('interossea_posterior', 'a', 'ms', 'artère interosseuse postérieure', 'arteria interossea posterior', 0, ['Posterior interosseous artery']);
  V('interossea_recurrens', 'a', 'ms', 'artère interosseuse récurrente', 'arteria interossea recurrens', 0, ['Recurrent interosseous artery']);
  V('arcus_palmaris_superficialis', 'a', 'ms', 'arcade palmaire superficielle', 'arcus palmaris superficialis', 1, ['Superficial palmar arch'], { alt: ['arcade artérielle palmaire superficielle'] });
  V('arcus_palmaris_profundus', 'a', 'ms', 'arcade palmaire profonde', 'arcus palmaris profundus', 1, ['Deep palmar arch'], { alt: ['arcade artérielle palmaire profonde'] });
  V('metacarpales_palmares', 'a', 'ms', 'artères métacarpiennes palmaires', 'arteriae metacarpales palmares', 0, ['Palmar metacarpal arteries'], { alt: ['artère métacarpienne palmaire'] });
  V('digitales_palmares', 'a', 'ms', 'artères digitales palmaires', 'arteriae digitales palmares', 0, ['Common palmar digital arteries', 'Proper palmar digital arteries'], { alt: ['artère digitale palmaire', 'artères digitales palmaires communes', 'artères digitales palmaires propres'] });
  V('rete_carpale_dorsale', 'a', 'ms', 'réseau carpien dorsal', 'rete carpale dorsale', 0, ['Dorsal carpal anastomosis'], { alt: ['arcade carpienne dorsale'] });
  V('metacarpales_dorsales', 'a', 'ms', 'artères métacarpiennes dorsales', 'arteriae metacarpales dorsales', 0, ['Dorsal metacarpal arteries'], { alt: ['artère métacarpienne dorsale'] });
  V('digitales_dorsales_manus', 'a', 'ms', 'artères digitales dorsales de la main', 'arteriae digitales dorsales manus', 0, ['Dorsal digital arteries of hand'], { alt: ['artère digitale dorsale de la main'] });

  /* ---------------- Membre supérieur : veines ---------------- */
  V('axillaris_v', 'v', 'ms', 'veine axillaire', 'vena axillaris', 1, ['Axillary vein']);
  V('cephalica', 'v', 'ms', 'veine céphalique', 'vena cephalica', 1, ['Cephalic vein']);
  V('basilica', 'v', 'ms', 'veine basilique', 'vena basilica', 1, ['Basilic vein']);
  V('mediana_cubiti', 'v', 'ms', 'veine médiane du coude', 'vena mediana cubiti', 1, ['Median cubital vein'], { alt: ['veine intermédiaire du coude'], old: ['veine médiane basilique', 'veine médiane céphalique'] });
  V('mediana_antebrachii', 'v', 'ms', 'veine médiane de l\'avant-bras', 'vena mediana antebrachii', 0, ['Median antebrachial vein'], { alt: ['veine intermédiaire de l\'avant-bras'] });
  V('brachiales_v', 'v', 'ms', 'veines brachiales', 'venae brachiales', 1, ['Brachial veins'], { alt: ['veine brachiale'], old: ['veines humérales'] });
  V('radiales_v', 'v', 'ms', 'veines radiales', 'venae radiales', 0, ['Radial veins'], { alt: ['veine radiale'] });
  V('ulnares_v', 'v', 'ms', 'veines ulnaires', 'venae ulnares', 0, ['Ulnar veins'], { alt: ['veine ulnaire'], old: ['veines cubitales'] });
  V('thoracica_lateralis_v', 'v', 'ms', 'veine thoracique latérale', 'vena thoracica lateralis', 0, ['Lateral thoracic vein'], { old: ['veine mammaire externe'] });
  V('subscapularis_v', 'v', 'ms', 'veine subscapulaire', 'vena subscapularis', 0, ['Subscapular vein'], { old: ['veine sous-scapulaire'] });
  V('circumflexa_scapulae_v', 'v', 'ms', 'veine circonflexe de la scapula', 'vena circumflexa scapulae', 0, ['Circumflex scapular vein']);
  V('thoracodorsalis_v', 'v', 'ms', 'veine thoraco-dorsale', 'vena thoracodorsalis', 0, ['Thoracodorsal vein'], { alt: ['veine thoracodorsale'] });
  V('circumflexa_humeri_anterior_v', 'v', 'ms', 'veine circonflexe humérale antérieure', 'vena circumflexa humeri anterior', 0, ['Anterior circumflex humeral vein']);
  V('circumflexa_humeri_posterior_v', 'v', 'ms', 'veine circonflexe humérale postérieure', 'vena circumflexa humeri posterior', 0, ['Posterior circumflex humeral vein']);
  V('rete_venosum_dorsale_manus', 'v', 'ms', 'réseau veineux dorsal de la main', 'rete venosum dorsale manus', 0, ['Dorsal venous network of hand']);
  V('digitales_dorsales_manus_v', 'v', 'ms', 'veines digitales dorsales de la main', 'venae digitales dorsales manus', 0, ['Dorsal digital veins of hand'], { alt: ['veine digitale dorsale de la main'] });
  V('arcus_venosus_palmaris_superficialis', 'v', 'ms', 'arcade veineuse palmaire superficielle', 'arcus venosus palmaris superficialis', 0, ['Superficial venous palmar arch']);
  V('arcus_venosus_palmaris_profundus', 'v', 'ms', 'arcade veineuse palmaire profonde', 'arcus venosus palmaris profundus', 0, ['Deep venous palmar arch']);
  V('digitales_palmares_v', 'v', 'ms', 'veines digitales palmaires', 'venae digitales palmares', 0, ['Palmar digital veins'], { alt: ['veine digitale palmaire'] });

  /* ---------------- Membre inférieur : artères ---------------- */
  V('femoralis', 'a', 'mi', 'artère fémorale', 'arteria femoralis', 1, ['Femoral artery'], { old: ['artère fémorale commune', 'artère fémorale superficielle'] });
  V('profunda_femoris', 'a', 'mi', 'artère profonde de la cuisse', 'arteria profunda femoris', 1, ['Deep femoral artery'], { alt: ['artère fémorale profonde'] });
  V('circumflexa_femoris_lateralis', 'a', 'mi', 'artère circonflexe fémorale latérale', 'arteria circumflexa femoris lateralis', 1, ['Lateral circumflex femoral artery', 'Descending branch of lateral circumflex femoral artery'], { old: ['artère circonflexe externe', 'artère circonflexe antérieure'] });
  V('circumflexa_femoris_medialis', 'a', 'mi', 'artère circonflexe fémorale médiale', 'arteria circumflexa femoris medialis', 1, ['Medial circumflex femoral artery'], { old: ['artère circonflexe interne', 'artère circonflexe postérieure'] });
  V('perforantes', 'a', 'mi', 'artères perforantes', 'arteriae perforantes', 0, ['Perforating femoral arteries'], { alt: ['artère perforante'] });
  V('poplitea', 'a', 'mi', 'artère poplitée', 'arteria poplitea', 1, ['Popliteal artery']);
  V('superior_lateralis_genus', 'a', 'mi', 'artère supéro-latérale du genou', 'arteria superior lateralis genus', 0, ['Superior lateral genicular artery'], { alt: ['artère géniculaire supérieure latérale'], old: ['artère articulaire supéro-externe du genou'] });
  V('superior_medialis_genus', 'a', 'mi', 'artère supéro-médiale du genou', 'arteria superior medialis genus', 0, ['Superior medial genicular artery'], { alt: ['artère géniculaire supérieure médiale'], old: ['artère articulaire supéro-interne du genou'] });
  V('media_genus', 'a', 'mi', 'artère moyenne du genou', 'arteria media genus', 0, ['Middle genicular artery'], { alt: ['artère géniculaire moyenne'], old: ['artère articulaire moyenne du genou'] });
  V('inferior_lateralis_genus', 'a', 'mi', 'artère inféro-latérale du genou', 'arteria inferior lateralis genus', 0, ['Inferior lateral genicular artery'], { alt: ['artère géniculaire inférieure latérale'], old: ['artère articulaire inféro-externe du genou'] });
  V('inferior_medialis_genus', 'a', 'mi', 'artère inféro-médiale du genou', 'arteria inferior medialis genus', 0, ['Inferior medial genicular artery'], { alt: ['artère géniculaire inférieure médiale'], old: ['artère articulaire inféro-interne du genou'] });
  V('rete_patellare', 'a', 'mi', 'réseau patellaire', 'rete patellare', 0, ['Patellar anastomosis'], { alt: ['réseau articulaire du genou'], old: ['réseau rotulien'] });
  V('tibialis_anterior_a', 'a', 'mi', 'artère tibiale antérieure', 'arteria tibialis anterior', 1, ['Anterior tibial artery']);
  V('dorsalis_pedis', 'a', 'mi', 'artère dorsale du pied', 'arteria dorsalis pedis', 1, ['Dorsalis pedis artery'], { old: ['artère pédieuse'] });
  V('arcuata', 'a', 'mi', 'artère arquée', 'arteria arcuata', 0, ['Arcuate artery'], { alt: ['artère arquée du pied'], old: ['artère dorsale du métatarse'] });
  V('tarsalis_lateralis', 'a', 'mi', 'artère tarsienne latérale', 'arteria tarsalis lateralis', 0, ['Lateral tarsal artery'], { old: ['artère dorsale du tarse'] });
  V('plantaris_profunda', 'a', 'mi', 'artère plantaire profonde', 'arteria plantaris profunda', 0, ['Deep plantar artery'], { alt: ['rameau plantaire profond'] });
  V('metatarsales_dorsales', 'a', 'mi', 'artères métatarsiennes dorsales', 'arteriae metatarsales dorsales', 0, ['Dorsal metatarsal arteries'], { alt: ['artère métatarsienne dorsale'] });
  V('digitales_dorsales_pedis', 'a', 'mi', 'artères digitales dorsales du pied', 'arteriae digitales dorsales pedis', 0, ['Dorsal digital arteries of foot'], { alt: ['artère digitale dorsale du pied'] });
  V('tibialis_posterior_a', 'a', 'mi', 'artère tibiale postérieure', 'arteria tibialis posterior', 1, ['Posterior tibial artery', 'Calcaneal branches of posterior tibial artery']);
  V('fibularis', 'a', 'mi', 'artère fibulaire', 'arteria fibularis', 1, ['Fibular artery', 'Calcaneal branches of fibular artery'], { old: ['artère péronière'] });
  V('plantaris_medialis', 'a', 'mi', 'artère plantaire médiale', 'arteria plantaris medialis', 1, ['Medial plantar artery', 'Superficial branch of medial plantar artery'], { old: ['artère plantaire interne'] });
  V('plantaris_lateralis', 'a', 'mi', 'artère plantaire latérale', 'arteria plantaris lateralis', 1, ['Lateral plantar artery'], { old: ['artère plantaire externe'] });
  V('arcus_plantaris', 'a', 'mi', 'arcade plantaire', 'arcus plantaris profundus', 0, ['Plantar arch'], { alt: ['arcade plantaire profonde'] });
  V('metatarsales_plantares', 'a', 'mi', 'artères métatarsiennes plantaires', 'arteriae metatarsales plantares', 0, ['Plantar metatarsal arteries', 'Perforating branches of plantar metatarsal arteries'], { alt: ['artère métatarsienne plantaire'] });
  V('digitales_plantares', 'a', 'mi', 'artères digitales plantaires', 'arteriae digitales plantares', 0, ['Common plantar digital arteries', 'Proper plantar digital arteries'], { alt: ['artère digitale plantaire', 'artères digitales plantaires communes', 'artères digitales plantaires propres'] });

  /* ---------------- Membre inférieur : veines ---------------- */
  V('femoralis_v', 'v', 'mi', 'veine fémorale', 'vena femoralis', 1, ['Femoral vein'], { old: ['veine fémorale commune', 'veine fémorale superficielle'] });
  V('profunda_femoris_v', 'v', 'mi', 'veine profonde de la cuisse', 'vena profunda femoris', 0, ['Deep femoral vein'], { alt: ['veine fémorale profonde'] });
  V('circumflexae_femoris_laterales_v', 'v', 'mi', 'veines circonflexes fémorales latérales', 'venae circumflexae femoris laterales', 0, ['Lateral circumflex femoral veins'], { alt: ['veine circonflexe fémorale latérale'] });
  V('circumflexae_femoris_mediales_v', 'v', 'mi', 'veines circonflexes fémorales médiales', 'venae circumflexae femoris mediales', 0, ['Medial circumflex femoral veins'], { alt: ['veine circonflexe fémorale médiale'] });
  V('perforantes_v', 'v', 'mi', 'veines perforantes', 'venae perforantes', 0, ['Perforating veins'], { alt: ['veine perforante'] });
  V('saphena_magna', 'v', 'mi', 'grande veine saphène', 'vena saphena magna', 1, ['Great saphenous vein'], { alt: ['veine grande saphène'], old: ['veine saphène interne', 'saphène interne'] });
  V('saphena_parva', 'v', 'mi', 'petite veine saphène', 'vena saphena parva', 1, ['Small saphenous vein'], { alt: ['veine petite saphène'], old: ['veine saphène externe', 'saphène externe'] });
  V('poplitea_v', 'v', 'mi', 'veine poplitée', 'vena poplitea', 1, ['Popliteal vein']);
  V('geniculares_v', 'v', 'mi', 'veines du genou', 'venae geniculares', 0, ['Genicular veins'], { alt: ['veines géniculaires'] });
  V('tibiales_anteriores_v', 'v', 'mi', 'veines tibiales antérieures', 'venae tibiales anteriores', 1, ['Anterior tibial veins'], { alt: ['veine tibiale antérieure'] });
  V('tibiales_posteriores_v', 'v', 'mi', 'veines tibiales postérieures', 'venae tibiales posteriores', 1, ['Posterior tibial veins'], { alt: ['veine tibiale postérieure'] });
  V('fibulares_v', 'v', 'mi', 'veines fibulaires', 'venae fibulares', 0, ['Fibular veins'], { alt: ['veine fibulaire'], old: ['veines péronières'] });
  V('plantares_mediales_v', 'v', 'mi', 'veines plantaires médiales', 'venae plantares mediales', 0, ['Medial plantar veins'], { alt: ['veine plantaire médiale'], old: ['veines plantaires internes'] });
  V('plantares_laterales_v', 'v', 'mi', 'veines plantaires latérales', 'venae plantares laterales', 0, ['Lateral plantar veins'], { alt: ['veine plantaire latérale'], old: ['veines plantaires externes'] });
  V('arcus_venosus_plantaris', 'v', 'mi', 'arcade veineuse plantaire', 'arcus venosus plantaris', 0, ['Plantar venous arch']);
  V('metatarsales_plantares_v', 'v', 'mi', 'veines métatarsiennes plantaires', 'venae metatarsales plantares', 0, ['Plantar metatarsal veins'], { alt: ['veine métatarsienne plantaire'] });
  V('digitales_plantares_v', 'v', 'mi', 'veines digitales plantaires', 'venae digitales plantares', 0, ['Plantar digital veins'], { alt: ['veine digitale plantaire'] });
  V('arcus_venosus_dorsalis_pedis', 'v', 'mi', 'arcade veineuse dorsale du pied', 'arcus venosus dorsalis pedis', 0, ['Dorsal venous arch of foot']);
  V('metatarsales_dorsales_v', 'v', 'mi', 'veines métatarsiennes dorsales', 'venae metatarsales dorsales', 0, ['Dorsal metatarsal veins'], { alt: ['veine métatarsienne dorsale'] });
  V('digitales_dorsales_pedis_v', 'v', 'mi', 'veines digitales dorsales du pied', 'venae digitales dorsales pedis', 0, ['Dorsal digital veins of foot'], { alt: ['veine digitale dorsale du pied'] });
  V('intercapitulares_pedis_v', 'v', 'mi', 'veines intercapitulaires du pied', 'venae intercapitulares pedis', 0, ['Intercapitular veins of foot'], { alt: ['veine intercapitulaire du pied'] });

  const VESSEL = {};
  VESSELS.forEach(v => { VESSEL[v.id] = v; });
  const VESSEL_REGION = {};
  VESSEL_REGIONS.forEach(r => { VESSEL_REGION[r.id] = r; });
  const VESSEL_TYPE = {};
  VESSEL_TYPES.forEach(t => { VESSEL_TYPE[t.id] = t; });

  Object.assign(NS, { VESSELS, VESSEL, VESSEL_REGIONS, VESSEL_REGION, VESSEL_TYPES, VESSEL_TYPE });
})(AQ.data);
