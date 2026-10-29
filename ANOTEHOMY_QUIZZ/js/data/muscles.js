/* ==========================================================================
   Anotehomy Quizz - data/muscles.js
   CATALOGUE DES MUSCLES (nomenclature TA2, en francais sans accents)
   --------------------------------------------------------------------------
   Une entree par muscle (les deux cotes sont des instances du meme muscle) :
     M(id, region, nom TA2, nom latin, principal, [objets Z-Anatomy], options)
       principal : 1 = muscle classique (filtre "muscles principaux")
       objets    : noms des maillages Z-Anatomy (sans le suffixe .r / .l) ;
                   les chefs et parties d'un muscle sont regroupes
       options   : alt (variantes acceptees), old (ancienne nomenclature,
                   reconnue mais comptee fausse), t (tendon ou aponevrose :
                   couleur plus claire), u (muscle impair : une seule
                   instance, meme si Z-Anatomy le coupe en deux moities)
   Une entree tient sur UNE ligne : tools/build-muscles.ps1 lit les objets
   Z-Anatomy directement dans ce fichier.
   Modele 3D : Z-Anatomy (CC BY-SA 4.0), voir CREDITS.md.
   ========================================================================== */
(function (NS) {
  'use strict';

  /* zones du corps proposees en prephase */
  const MUSCLE_REGIONS = [
    { id: 'tete', name: 'Tete' },
    { id: 'cou', name: 'Cou' },
    { id: 'dos', name: 'Dos et nuque' },
    { id: 'thorax', name: 'Thorax' },
    { id: 'abdomen', name: 'Abdomen' },
    { id: 'pelvis', name: 'Pelvis et perinee' },
    { id: 'ms', name: 'Membre superieur' },
    { id: 'mi', name: 'Membre inferieur' }
  ];
  const MUSCLES = [];
  function M(id, region, name, latin, principal, z, o = {}) {
    MUSCLES.push({ id, region, name, latin, principal: !!principal, z, alt: o.alt || [], old: o.old || [], tendon: !!o.t, unpaired: !!o.u });
  }

  /* ---------------- Tete ---------------- */
  M('venter_frontalis', 'tete', 'ventre frontal du muscle occipito-frontal', 'venter frontalis musculi occipitofrontalis', 1, ['Frontalis muscle'], { alt: ['muscle frontal', 'ventre frontal', 'frontal', 'muscle occipito-frontal'] });
  M('venter_occipitalis', 'tete', 'ventre occipital du muscle occipito-frontal', 'venter occipitalis musculi occipitofrontalis', 0, ['Occipitalis muscle'], { alt: ['muscle occipital', 'ventre occipital', 'occipital'] });
  M('temporoparietalis', 'tete', 'muscle temporo-parietal', 'musculus temporoparietalis', 0, ['Temporoparietalis muscle'], { alt: ['temporo-parietal'] });
  M('aponeurosis_epicranialis', 'tete', 'aponevrose epicranienne', 'aponeurosis epicranialis', 0, ['Epicranial aponeurosis'], { alt: ['galea aponevrotique', 'galea aponeurotica', 'galea'], t: 1, u: 1 });
  M('orbicularis_oculi', 'tete', 'muscle orbiculaire de l\'oeil', 'musculus orbicularis oculi', 1, ['Orbital part of orbicularis oculi', 'Palpebral part of orbicularis oculi'], { alt: ['orbiculaire de l\'oeil'], old: ['orbiculaire des paupieres', 'muscle orbiculaire des paupieres'] });
  M('corrugator_supercilii', 'tete', 'muscle corrugateur du sourcil', 'musculus corrugator supercilii', 0, ['Corrugator supercilii'], { alt: ['corrugateur du sourcil'], old: ['sourcilier', 'muscle sourcilier'] });
  M('procerus', 'tete', 'muscle procerus', 'musculus procerus', 0, ['Procerus muscle'], { alt: ['procerus'], old: ['pyramidal du nez', 'muscle pyramidal du nez'] });
  M('nasalis', 'tete', 'muscle nasal', 'musculus nasalis', 0, ['Nasalis muscle'], { old: ['transverse du nez', 'muscle transverse du nez'] });
  M('depressor_septi_nasi', 'tete', 'muscle abaisseur du septum nasal', 'musculus depressor septi nasi', 0, ['Depressor septi nasi'], { old: ['myrtiforme', 'muscle myrtiforme'] });
  M('levator_labii_superioris_alaeque_nasi', 'tete', 'muscle releveur de la levre superieure et de l\'aile du nez', 'musculus levator labii superioris alaeque nasi', 0, ['Levator nasolabialis'], { alt: ['releveur de la levre superieure et de l\'aile du nez', 'muscle elevateur de la levre superieure et de l\'aile du nez'], old: ['releveur commun de l\'aile du nez et de la levre superieure'] });
  M('levator_labii_superioris', 'tete', 'muscle releveur de la levre superieure', 'musculus levator labii superioris', 0, ['Levator labii superioris'], { alt: ['muscle elevateur de la levre superieure'], old: ['releveur propre de la levre superieure'] });
  M('zygomaticus_minor', 'tete', 'muscle petit zygomatique', 'musculus zygomaticus minor', 0, ['Zygomaticus minor muscle'], { alt: ['petit zygomatique'] });
  M('zygomaticus_major', 'tete', 'muscle grand zygomatique', 'musculus zygomaticus major', 1, ['Zygomaticus major muscle'], { alt: ['grand zygomatique'] });
  M('levator_anguli_oris', 'tete', 'muscle releveur de l\'angle de la bouche', 'musculus levator anguli oris', 0, ['Levator anguli oris'], { alt: ['muscle elevateur de l\'angle de la bouche'], old: ['canin', 'muscle canin'] });
  M('risorius', 'tete', 'muscle risorius', 'musculus risorius', 0, ['Risorius muscle'], { alt: ['risorius'] });
  M('orbicularis_oris', 'tete', 'muscle orbiculaire de la bouche', 'musculus orbicularis oris', 1, ['Orbicularis oris muscle'], { alt: ['orbiculaire de la bouche'], old: ['orbiculaire des levres', 'muscle orbiculaire des levres'], u: 1 });
  M('depressor_anguli_oris', 'tete', 'muscle abaisseur de l\'angle de la bouche', 'musculus depressor anguli oris', 0, ['Depressor anguli oris'], { old: ['triangulaire des levres', 'muscle triangulaire des levres'] });
  M('depressor_labii_inferioris', 'tete', 'muscle abaisseur de la levre inferieure', 'musculus depressor labii inferioris', 0, ['Depressor labii inferioris'], { old: ['carre du menton', 'muscle carre du menton'] });
  M('mentalis', 'tete', 'muscle mentonnier', 'musculus mentalis', 0, ['Mentalis muscle'], { alt: ['mentonnier'], old: ['houppe du menton', 'muscle de la houppe du menton'] });
  M('buccinator', 'tete', 'muscle buccinateur', 'musculus buccinator', 1, ['Bucinator'], { alt: ['buccinateur'] });
  M('masseter', 'tete', 'muscle masseter', 'musculus masseter', 1, ['Superficial part of masseter', 'Deep part of masseter'], { alt: ['masseter'] });
  M('temporalis', 'tete', 'muscle temporal', 'musculus temporalis', 1, ['Temporalis muscle'], { alt: ['temporal'] });
  M('pterygoideus_medialis', 'tete', 'muscle pterygoidien medial', 'musculus pterygoideus medialis', 1, ['Medial pterygoid muscle'], { alt: ['pterygoidien medial'], old: ['pterygoidien interne', 'muscle pterygoidien interne'] });
  M('pterygoideus_lateralis', 'tete', 'muscle pterygoidien lateral', 'musculus pterygoideus lateralis', 1, ['Inferior head of lateral pterygoid muscle', 'Superior head of lateral pterygoid muscle'], { alt: ['pterygoidien lateral'], old: ['pterygoidien externe', 'muscle pterygoidien externe'] });
  M('levator_palpebrae_superioris', 'tete', 'muscle releveur de la paupiere superieure', 'musculus levator palpebrae superioris', 0, ['Levator palpebrae superioris'], { alt: ['muscle elevateur de la paupiere superieure'] });
  M('rectus_superior', 'tete', 'muscle droit superieur', 'musculus rectus superior', 0, ['Superior rectus muscle'], { alt: ['droit superieur de l\'oeil'] });
  M('rectus_inferior', 'tete', 'muscle droit inferieur', 'musculus rectus inferior', 0, ['Inferior rectus muscle'], { alt: ['droit inferieur de l\'oeil'] });
  M('rectus_medialis', 'tete', 'muscle droit medial', 'musculus rectus medialis', 0, ['Medial rectus muscle'], { alt: ['droit medial de l\'oeil'], old: ['droit interne de l\'oeil', 'muscle droit interne'] });
  M('rectus_lateralis', 'tete', 'muscle droit lateral', 'musculus rectus lateralis', 0, ['Lateral rectus muscle'], { alt: ['droit lateral de l\'oeil'], old: ['droit externe de l\'oeil', 'muscle droit externe'] });
  M('obliquus_superior', 'tete', 'muscle oblique superieur', 'musculus obliquus superior', 0, ['Superior oblique muscle'], { alt: ['oblique superieur de l\'oeil'], old: ['grand oblique de l\'oeil'] });
  M('obliquus_inferior', 'tete', 'muscle oblique inferieur', 'musculus obliquus inferior', 0, ['Inferior oblique muscle'], { alt: ['oblique inferieur de l\'oeil'], old: ['petit oblique de l\'oeil'] });
  M('genioglossus', 'tete', 'muscle genioglosse', 'musculus genioglossus', 0, ['Genioglossus muscle'], { alt: ['genio-glosse', 'muscle genio-glosse'] });
  M('hyoglossus', 'tete', 'muscle hyoglosse', 'musculus hyoglossus', 0, ['Hyoglossus muscle'], { alt: ['hyo-glosse', 'muscle hyo-glosse'] });
  M('palatopharyngeus', 'tete', 'muscle palatopharyngien', 'musculus palatopharyngeus', 0, ['Palatopharyngeus muscle'], { alt: ['palato-pharyngien'], old: ['pharyngo-staphylin', 'muscle pharyngo-staphylin'] });

  /* ---------------- Cou ---------------- */
  M('platysma', 'cou', 'muscle platysma', 'platysma', 1, ['Platysma'], { alt: ['platysma'], old: ['peaucier du cou', 'muscle peaucier du cou'] });
  M('sternocleidomastoideus', 'cou', 'muscle sterno-cleido-mastoidien', 'musculus sternocleidomastoideus', 1, ['Sternocleidomastoid muscle'], { alt: ['sternocleidomastoidien', 'muscle sternocleidomastoidien', 'scm'] });
  M('digastricus', 'cou', 'muscle digastrique', 'musculus digastricus', 1, ['Intermediate tendon of digastric muscle', 'Anterior belly of digastric muscle', 'Posterior belly of digastric muscle'], { alt: ['digastrique'] });
  M('stylohyoideus', 'cou', 'muscle stylo-hyoidien', 'musculus stylohyoideus', 0, ['Stylohyoid muscle'], { alt: ['stylohyoidien'] });
  M('mylohyoideus', 'cou', 'muscle mylo-hyoidien', 'musculus mylohyoideus', 1, ['Mylohyoid muscle'], { alt: ['mylohyoidien'] });
  M('geniohyoideus', 'cou', 'muscle genio-hyoidien', 'musculus geniohyoideus', 0, ['Geniohyoid muscle'], { alt: ['geniohyoidien'] });
  M('omohyoideus', 'cou', 'muscle omo-hyoidien', 'musculus omohyoideus', 1, ['Omohyoid muscle'], { alt: ['omohyoidien'] });
  M('sternohyoideus', 'cou', 'muscle sterno-hyoidien', 'musculus sternohyoideus', 1, ['Sternohyoid muscle'], { alt: ['sternohyoidien'] });
  M('sternothyroideus', 'cou', 'muscle sterno-thyroidien', 'musculus sternothyroideus', 0, ['Sternothyroid muscle'], { alt: ['sternothyroidien'] });
  M('thyrohyoideus', 'cou', 'muscle thyro-hyoidien', 'musculus thyrohyoideus', 0, ['Thyrohyoid muscle'], { alt: ['thyrohyoidien'] });
  M('scalenus_anterior', 'cou', 'muscle scalene anterieur', 'musculus scalenus anterior', 1, ['Scalenus anterior muscle'], { alt: ['scalene anterieur'] });
  M('scalenus_medius', 'cou', 'muscle scalene moyen', 'musculus scalenus medius', 1, ['Scalenus medius muscle'], { alt: ['scalene moyen'] });
  M('scalenus_posterior', 'cou', 'muscle scalene posterieur', 'musculus scalenus posterior', 0, ['Scalenus posterior muscle'], { alt: ['scalene posterieur'] });
  M('longus_colli', 'cou', 'muscle long du cou', 'musculus longus colli', 0, ['Longus colli muscle'], { alt: ['long du cou'] });
  M('longus_capitis', 'cou', 'muscle long de la tete', 'musculus longus capitis', 0, ['Longus capitis muscle'], { alt: ['long de la tete'], old: ['grand droit anterieur de la tete'] });
  M('rectus_capitis_anterior', 'cou', 'muscle droit anterieur de la tete', 'musculus rectus capitis anterior', 0, ['Rectus anterior capitis muscle'], { old: ['petit droit anterieur de la tete'] });
  M('rectus_capitis_lateralis', 'cou', 'muscle droit lateral de la tete', 'musculus rectus capitis lateralis', 0, ['Rectus lateralis capitis muscle']);
  M('constrictor_pharyngis_superior', 'cou', 'muscle constricteur superieur du pharynx', 'musculus constrictor pharyngis superior', 0, ['Superior pharyngeal constrictor']);
  M('constrictor_pharyngis_medius', 'cou', 'muscle constricteur moyen du pharynx', 'musculus constrictor pharyngis medius', 0, ['Middle pharyngeal constrictor']);
  M('constrictor_pharyngis_inferior', 'cou', 'muscle constricteur inferieur du pharynx', 'musculus constrictor pharyngis inferior', 0, ['Inferior pharyngeal constrictor']);
  M('stylopharyngeus', 'cou', 'muscle stylo-pharyngien', 'musculus stylopharyngeus', 0, ['Stylopharyngeus muscle'], { alt: ['stylopharyngien'] });
  M('cricothyroideus', 'cou', 'muscle crico-thyroidien', 'musculus cricothyroideus', 0, ['Oblique part of cricothyroid muscle', 'Straight part of cricothyroid muscle'], { alt: ['cricothyroidien'] });
  M('cricoarytenoideus_posterior', 'cou', 'muscle crico-arytenoidien posterieur', 'musculus cricoarytenoideus posterior', 0, ['Posterior crico-arytenoid muscle']);
  M('cricoarytenoideus_lateralis', 'cou', 'muscle crico-arytenoidien lateral', 'musculus cricoarytenoideus lateralis', 0, ['Lateral crico-arytenoid muscle']);
  M('thyroarytenoideus', 'cou', 'muscle thyro-arytenoidien', 'musculus thyroarytenoideus', 0, ['External part of thyro-arytenoid muscle', 'Thyro-epiglottic part of thyro-arytenoid muscle'], { alt: ['thyroarytenoidien'] });
  M('arytenoideus_obliquus', 'cou', 'muscle arytenoidien oblique', 'musculus arytenoideus obliquus', 0, ['Ary-epiglottic part of oblique arytenoid muscle']);
  M('arytenoideus_transversus', 'cou', 'muscle arytenoidien transverse', 'musculus arytenoideus transversus', 0, ['Transverse arytenoid muscle'], { u: 1 });

  /* ---------------- Dos et nuque ---------------- */
  M('trapezius', 'dos', 'muscle trapeze', 'musculus trapezius', 1, ['Ascending part of trapezius muscle', 'Descending part of trapezius muscle', 'Transverse part of trapezius muscle'], { alt: ['trapeze'] });
  M('latissimus_dorsi', 'dos', 'muscle grand dorsal', 'musculus latissimus dorsi', 1, ['Latissimus dorsi muscle'], { alt: ['grand dorsal'] });
  M('rhomboideus_major', 'dos', 'muscle grand rhomboide', 'musculus rhomboideus major', 1, ['Rhomboid major muscle'], { alt: ['grand rhomboide'] });
  M('rhomboideus_minor', 'dos', 'muscle petit rhomboide', 'musculus rhomboideus minor', 1, ['Rhomboid minor muscle'], { alt: ['petit rhomboide'] });
  M('levator_scapulae', 'dos', 'muscle elevateur de la scapula', 'musculus levator scapulae', 1, ['Levator scapulae'], { alt: ['elevateur de la scapula', 'muscle releveur de la scapula'], old: ['angulaire de l\'omoplate', 'muscle angulaire de l\'omoplate', 'releveur de l\'omoplate'] });
  M('serratus_posterior_superior', 'dos', 'muscle dentele posterieur superieur', 'musculus serratus posterior superior', 0, ['Serratus posterior superior muscle'], { old: ['petit dentele posterieur et superieur'] });
  M('serratus_posterior_inferior', 'dos', 'muscle dentele posterieur inferieur', 'musculus serratus posterior inferior', 0, ['Serratus posterior inferior muscle'], { old: ['petit dentele posterieur et inferieur'] });
  M('splenius_capitis', 'dos', 'muscle splenius de la tete', 'musculus splenius capitis', 1, ['Splenius capitis muscle'], { alt: ['splenius de la tete'] });
  M('splenius_cervicis', 'dos', 'muscle splenius du cou', 'musculus splenius cervicis', 0, ['Splenius colli muscle'], { alt: ['splenius du cou'] });
  M('iliocostalis', 'dos', 'muscle ilio-costal', 'musculus iliocostalis', 1, ['Iliocostalis lumborum muscle', 'Iliocostalis thoracis muscle', 'Iliocostalis colli muscle'], { alt: ['iliocostal', 'muscle iliocostal'], old: ['sacro-lombaire', 'muscle sacro-lombaire'] });
  M('longissimus', 'dos', 'muscle longissimus', 'musculus longissimus', 1, ['Longissimus thoracis muscle', 'Longissimus capitis muscle', 'Longissimus colli muscle'], { alt: ['longissimus'], old: ['long dorsal', 'muscle long dorsal'] });
  M('spinalis', 'dos', 'muscle epineux', 'musculus spinalis', 0, ['Spinalis capitis muscle', 'Spinalis colli muscle', 'Spinalis thoracis muscle'], { alt: ['epineux'] });
  M('semispinalis', 'dos', 'muscle semi-epineux', 'musculus semispinalis', 0, ['Semispinalis thoracis muscle', 'Semispinalis colli muscle'], { alt: ['semi-epineux'] });
  M('multifidus', 'dos', 'muscle multifide', 'musculus multifidus', 0, ['Multifidus colli muscle', 'Multifidus thoracis muscle', 'Multifidus lumborum muscle'], { alt: ['multifide', 'muscles multifides'] });
  M('rotatores', 'dos', 'muscles rotateurs', 'musculi rotatores', 0, ['Rotatores'], { alt: ['rotateurs'] });
  M('interspinales', 'dos', 'muscles interepineux', 'musculi interspinales', 0, ['Interspinales colli muscles', 'Interspinales thoracis muscles', 'Interspinales lumborum muscles'], { alt: ['interepineux'] });
  M('intertransversarii', 'dos', 'muscles intertransversaires', 'musculi intertransversarii', 0, ['Dorsal parts of lateral intertransversarii lumborum muscles', 'Ventral parts of lateral intertransversarii lumborum muscles'], { alt: ['intertransversaires'] });
  M('rectus_capitis_posterior_major', 'dos', 'muscle grand droit posterieur de la tete', 'musculus rectus capitis posterior major', 0, ['Rectus posterior major capitis muscle']);
  M('rectus_capitis_posterior_minor', 'dos', 'muscle petit droit posterieur de la tete', 'musculus rectus capitis posterior minor', 0, ['Rectus posterior minor capitis muscle']);
  M('obliquus_capitis_inferior', 'dos', 'muscle oblique inferieur de la tete', 'musculus obliquus capitis inferior', 0, ['Obliquus inferior capitis muscle'], { old: ['grand oblique de la tete'] });
  M('obliquus_capitis_superior', 'dos', 'muscle oblique superieur de la tete', 'musculus obliquus capitis superior', 0, ['Obliquus superior capitis muscle'], { old: ['petit oblique de la tete'] });

  /* ---------------- Thorax ---------------- */
  M('pectoralis_major', 'thorax', 'muscle grand pectoral', 'musculus pectoralis major', 1, ['Clavicular head of pectoralis major muscle', 'Sternocostal head of pectoralis major muscle', '(Abdominal part of pectoralis major muscle)'], { alt: ['grand pectoral'] });
  M('pectoralis_minor', 'thorax', 'muscle petit pectoral', 'musculus pectoralis minor', 1, ['Pectoralis minor muscle'], { alt: ['petit pectoral'] });
  M('subclavius', 'thorax', 'muscle subclavier', 'musculus subclavius', 1, ['Subclavius muscle'], { alt: ['subclavier'], old: ['sous-clavier', 'muscle sous-clavier'] });
  M('serratus_anterior', 'thorax', 'muscle dentele anterieur', 'musculus serratus anterior', 1, ['Serratus anterior muscle'], { alt: ['dentele anterieur'], old: ['grand dentele', 'muscle grand dentele'] });
  M('intercostales_externi', 'thorax', 'muscles intercostaux externes', 'musculi intercostales externi', 1, ['External intercostal muscles'], { alt: ['intercostaux externes', 'muscle intercostal externe'] });
  M('intercostales_interni', 'thorax', 'muscles intercostaux internes', 'musculi intercostales interni', 1, ['Internal intercostal muscles'], { alt: ['intercostaux internes', 'muscle intercostal interne'] });
  M('intercostales_intimi', 'thorax', 'muscles intercostaux intimes', 'musculi intercostales intimi', 0, ['Innermost intercostal muscles'], { alt: ['intercostaux intimes', 'intercostaux les plus profonds'] });
  M('transversus_thoracis', 'thorax', 'muscle transverse du thorax', 'musculus transversus thoracis', 0, ['Transversus thoracis muscle'], { old: ['triangulaire du sternum', 'muscle triangulaire du sternum'] });
  M('levatores_costarum', 'thorax', 'muscles elevateurs des cotes', 'musculi levatores costarum', 0, ['Levatores longi costarum', 'Levatores breves costarum'], { alt: ['elevateurs des cotes', 'muscles releveurs des cotes'], old: ['surcostaux', 'muscles surcostaux'] });
  M('diaphragma', 'thorax', 'diaphragme', 'diaphragma', 1, ['Diaphragm'], { alt: ['muscle diaphragme'], u: 1 });

  /* ---------------- Abdomen ---------------- */
  M('rectus_abdominis', 'abdomen', 'muscle droit de l\'abdomen', 'musculus rectus abdominis', 1, ['Rectus abdominis muscle'], { alt: ['droit de l\'abdomen'], old: ['grand droit', 'grand droit de l\'abdomen', 'muscle grand droit'] });
  M('pyramidalis', 'abdomen', 'muscle pyramidal', 'musculus pyramidalis', 0, ['Pyramidalis muscle'], { alt: ['pyramidal', 'muscle pyramidal de l\'abdomen'] });
  M('obliquus_externus_abdominis', 'abdomen', 'muscle oblique externe de l\'abdomen', 'musculus obliquus externus abdominis', 1, ['External abdominal oblique muscle'], { alt: ['oblique externe', 'oblique externe de l\'abdomen'], old: ['grand oblique', 'muscle grand oblique'] });
  M('obliquus_internus_abdominis', 'abdomen', 'muscle oblique interne de l\'abdomen', 'musculus obliquus internus abdominis', 1, ['Internal abdominal oblique muscle'], { alt: ['oblique interne', 'oblique interne de l\'abdomen'], old: ['petit oblique', 'muscle petit oblique'] });
  M('transversus_abdominis', 'abdomen', 'muscle transverse de l\'abdomen', 'musculus transversus abdominis', 1, ['Transversus abdominis muscle'], { alt: ['transverse de l\'abdomen', 'muscle transverse'] });
  M('quadratus_lumborum', 'abdomen', 'muscle carre des lombes', 'musculus quadratus lumborum', 1, ['Quadratus lumborum muscle'], { alt: ['carre des lombes'] });
  M('linea_alba', 'abdomen', 'ligne blanche', 'linea alba', 0, ['Linea alba'], { alt: ['linea alba'], t: 1, u: 1 });

  /* ---------------- Pelvis et perinee ---------------- */
  M('levator_ani', 'pelvis', 'muscle elevateur de l\'anus', 'musculus levator ani', 1, ['Iliococcygeus muscle', 'Pubo-analis muscle', 'Pubococcygeus muscle', 'Tendinous arch of levator ani'], { alt: ['elevateur de l\'anus'], old: ['releveur de l\'anus', 'muscle releveur de l\'anus'] });
  M('ischiococcygeus', 'pelvis', 'muscle ischio-coccygien', 'musculus ischiococcygeus', 0, ['Coccygeus muscle'], { alt: ['muscle coccygien', 'ischiococcygien', 'coccygien'] });
  M('sphincter_ani_externus', 'pelvis', 'muscle sphincter externe de l\'anus', 'musculus sphincter ani externus', 0, ['External anal sphincter'], { alt: ['sphincter externe de l\'anus', 'sphincter anal externe'], u: 1 });

  /* ---------------- Membre superieur ---------------- */
  M('deltoideus', 'ms', 'muscle deltoide', 'musculus deltoideus', 1, ['Acromial part of deltoid muscle', 'Clavicular part of deltoid muscle', 'Scapular spinal part of deltoid muscle'], { alt: ['deltoide'] });
  M('supraspinatus', 'ms', 'muscle supra-epineux', 'musculus supraspinatus', 1, ['Supraspinatus muscle'], { alt: ['supra-epineux', 'supraspinatus'], old: ['sus-epineux', 'muscle sus-epineux'] });
  M('infraspinatus', 'ms', 'muscle infra-epineux', 'musculus infraspinatus', 1, ['Infraspinatus muscle'], { alt: ['infra-epineux'], old: ['sous-epineux', 'muscle sous-epineux'] });
  M('teres_minor', 'ms', 'muscle petit rond', 'musculus teres minor', 1, ['Teres minor muscle'], { alt: ['petit rond'] });
  M('teres_major', 'ms', 'muscle grand rond', 'musculus teres major', 1, ['Teres major muscle'], { alt: ['grand rond'] });
  M('subscapularis', 'ms', 'muscle subscapulaire', 'musculus subscapularis', 1, ['Subscapularis muscle'], { alt: ['subscapulaire'], old: ['sous-scapulaire', 'muscle sous-scapulaire'] });
  M('biceps_brachii', 'ms', 'muscle biceps brachial', 'musculus biceps brachii', 1, ['Long head of biceps brachii', 'Short head of biceps brachii'], { alt: ['biceps brachial', 'biceps'] });
  M('brachialis', 'ms', 'muscle brachial', 'musculus brachialis', 1, ['Brachialis muscle'], { alt: ['brachial'], old: ['brachial anterieur', 'muscle brachial anterieur'] });
  M('coracobrachialis', 'ms', 'muscle coracobrachial', 'musculus coracobrachialis', 1, ['Coracobrachialis muscle'], { alt: ['coraco-brachial', 'muscle coraco-brachial'] });
  M('triceps_brachii', 'ms', 'muscle triceps brachial', 'musculus triceps brachii', 1, ['Medial head of triceps brachii', 'Lateral head of triceps brachii', 'Long head of triceps brachii'], { alt: ['triceps brachial', 'triceps'] });
  M('anconeus', 'ms', 'muscle ancone', 'musculus anconeus', 1, ['Anconeus muscle'], { alt: ['ancone'] });
  M('pronator_teres', 'ms', 'muscle rond pronateur', 'musculus pronator teres', 1, ['Superficial head of pronator teres', 'Deep head of pronator teres'], { alt: ['rond pronateur'] });
  M('flexor_carpi_radialis', 'ms', 'muscle flechisseur radial du carpe', 'musculus flexor carpi radialis', 1, ['Flexor carpi radialis'], { alt: ['flechisseur radial du carpe'], old: ['grand palmaire', 'muscle grand palmaire'] });
  M('palmaris_longus', 'ms', 'muscle long palmaire', 'musculus palmaris longus', 1, ['Palmaris longus muscle'], { alt: ['long palmaire'], old: ['petit palmaire', 'muscle petit palmaire'] });
  M('flexor_carpi_ulnaris', 'ms', 'muscle flechisseur ulnaire du carpe', 'musculus flexor carpi ulnaris', 1, ['Humeral head of flexor carpi ulnaris', 'Ulnar head of flexor carpi ulnaris'], { alt: ['flechisseur ulnaire du carpe'], old: ['cubital anterieur', 'muscle cubital anterieur'] });
  M('flexor_digitorum_superficialis', 'ms', 'muscle flechisseur superficiel des doigts', 'musculus flexor digitorum superficialis', 1, ['Humero-ulnar head of flexor digitorum superficialis', 'Radial head of flexor digitorum superficialis'], { alt: ['flechisseur superficiel des doigts'], old: ['flechisseur commun superficiel des doigts'] });
  M('flexor_digitorum_profundus', 'ms', 'muscle flechisseur profond des doigts', 'musculus flexor digitorum profundus', 1, ['Flexor digitorum profundus'], { alt: ['flechisseur profond des doigts'], old: ['flechisseur commun profond des doigts'] });
  M('flexor_pollicis_longus', 'ms', 'muscle long flechisseur du pouce', 'musculus flexor pollicis longus', 1, ['Flexor pollicis longus'], { alt: ['long flechisseur du pouce'], old: ['long flechisseur propre du pouce'] });
  M('pronator_quadratus', 'ms', 'muscle carre pronateur', 'musculus pronator quadratus', 1, ['Pronator quadratus'], { alt: ['carre pronateur'] });
  M('brachioradialis', 'ms', 'muscle brachioradial', 'musculus brachioradialis', 1, ['Brachioradialis muscle'], { alt: ['brachio-radial', 'muscle brachio-radial'], old: ['long supinateur', 'muscle long supinateur'] });
  M('extensor_carpi_radialis_longus', 'ms', 'muscle long extenseur radial du carpe', 'musculus extensor carpi radialis longus', 1, ['Extensor carpi radialis longus'], { alt: ['long extenseur radial du carpe'], old: ['premier radial', 'premier radial externe', 'long radial'] });
  M('extensor_carpi_radialis_brevis', 'ms', 'muscle court extenseur radial du carpe', 'musculus extensor carpi radialis brevis', 1, ['Extensor carpi radialis brevis'], { alt: ['court extenseur radial du carpe'], old: ['deuxieme radial', 'second radial externe', 'court radial'] });
  M('extensor_digitorum', 'ms', 'muscle extenseur des doigts', 'musculus extensor digitorum', 1, ['Extensor digitorum'], { alt: ['extenseur des doigts'], old: ['extenseur commun des doigts'] });
  M('extensor_digiti_minimi', 'ms', 'muscle extenseur du petit doigt', 'musculus extensor digiti minimi', 0, ['Extensor digiti minimi'], { alt: ['extenseur du petit doigt'], old: ['extenseur propre du petit doigt'] });
  M('extensor_carpi_ulnaris', 'ms', 'muscle extenseur ulnaire du carpe', 'musculus extensor carpi ulnaris', 1, ['Ulnar head of extensor carpi ulnaris', 'Humeral head of extensor carpi ulnaris'], { alt: ['extenseur ulnaire du carpe'], old: ['cubital posterieur', 'muscle cubital posterieur'] });
  M('supinator', 'ms', 'muscle supinateur', 'musculus supinator', 1, ['Supinator'], { alt: ['supinateur'], old: ['court supinateur', 'muscle court supinateur'] });
  M('abductor_pollicis_longus', 'ms', 'muscle long abducteur du pouce', 'musculus abductor pollicis longus', 1, ['Abductor pollicis longus'], { alt: ['long abducteur du pouce'] });
  M('extensor_pollicis_brevis', 'ms', 'muscle court extenseur du pouce', 'musculus extensor pollicis brevis', 1, ['Extensor pollicis brevis'], { alt: ['court extenseur du pouce'] });
  M('extensor_pollicis_longus', 'ms', 'muscle long extenseur du pouce', 'musculus extensor pollicis longus', 1, ['Extensor pollicis longus'], { alt: ['long extenseur du pouce'] });
  M('extensor_indicis', 'ms', 'muscle extenseur de l\'index', 'musculus extensor indicis', 0, ['Extensor indicis'], { alt: ['extenseur de l\'index'], old: ['extenseur propre de l\'index'] });
  M('abductor_pollicis_brevis', 'ms', 'muscle court abducteur du pouce', 'musculus abductor pollicis brevis', 0, ['Abductor pollicis brevis'], { alt: ['court abducteur du pouce'] });
  M('flexor_pollicis_brevis', 'ms', 'muscle court flechisseur du pouce', 'musculus flexor pollicis brevis', 0, ['Superficial head of flexor pollicis brevis', 'Deep head of flexor pollicis brevis'], { alt: ['court flechisseur du pouce'] });
  M('opponens_pollicis', 'ms', 'muscle opposant du pouce', 'musculus opponens pollicis', 0, ['Opponens pollicis muscle'], { alt: ['opposant du pouce'] });
  M('adductor_pollicis', 'ms', 'muscle adducteur du pouce', 'musculus adductor pollicis', 0, ['Oblique head of adductor pollicis', 'Transverse head of adductor pollicis'], { alt: ['adducteur du pouce'] });
  M('abductor_digiti_minimi_manus', 'ms', 'muscle abducteur du petit doigt', 'musculus abductor digiti minimi manus', 0, ['Abductor digiti minimi of hand'], { alt: ['abducteur du petit doigt'] });
  M('flexor_digiti_minimi_brevis_manus', 'ms', 'muscle court flechisseur du petit doigt', 'musculus flexor digiti minimi brevis manus', 0, ['Flexor digiti minimi of hand'], { alt: ['court flechisseur du petit doigt'] });
  M('opponens_digiti_minimi', 'ms', 'muscle opposant du petit doigt', 'musculus opponens digiti minimi', 0, ['Opponens digiti minimi muscle of hand'], { alt: ['opposant du petit doigt'] });
  M('lumbricales_manus', 'ms', 'muscles lombricaux de la main', 'musculi lumbricales manus', 0, ['Lumbrical muscles of hand'], { alt: ['lombricaux de la main'] });
  M('interossei_dorsales_manus', 'ms', 'muscles interosseux dorsaux de la main', 'musculi interossei dorsales manus', 0, ['Dorsal interossei muscles of hand'], { alt: ['interosseux dorsaux de la main'] });
  M('interossei_palmares', 'ms', 'muscles interosseux palmaires', 'musculi interossei palmares', 0, ['Palmar interossei muscles'], { alt: ['interosseux palmaires'] });

  /* ---------------- Membre inferieur ---------------- */
  M('iliacus', 'mi', 'muscle iliaque', 'musculus iliacus', 1, ['Iliacus muscle'], { alt: ['iliaque'] });
  M('psoas_major', 'mi', 'muscle grand psoas', 'musculus psoas major', 1, ['Psoas major'], { alt: ['grand psoas', 'psoas'] });
  M('gluteus_maximus', 'mi', 'muscle grand gluteal', 'musculus gluteus maximus', 1, ['Gluteus maximus muscle'], { alt: ['grand gluteal'], old: ['grand fessier', 'muscle grand fessier'] });
  M('gluteus_medius', 'mi', 'muscle moyen gluteal', 'musculus gluteus medius', 1, ['Gluteus medius muscle'], { alt: ['moyen gluteal'], old: ['moyen fessier', 'muscle moyen fessier'] });
  M('gluteus_minimus', 'mi', 'muscle petit gluteal', 'musculus gluteus minimus', 1, ['Gluteus minimus muscle'], { alt: ['petit gluteal'], old: ['petit fessier', 'muscle petit fessier'] });
  M('tensor_fasciae_latae', 'mi', 'muscle tenseur du fascia lata', 'musculus tensor fasciae latae', 1, ['Tensor fasciae latae'], { alt: ['tenseur du fascia lata'] });
  M('tractus_iliotibialis', 'mi', 'tractus ilio-tibial', 'tractus iliotibialis', 1, ['Iliotibial tract'], { alt: ['tractus iliotibial', 'bandelette ilio-tibiale'], old: ['bandelette de maissiat'], t: 1 });
  M('piriformis', 'mi', 'muscle piriforme', 'musculus piriformis', 1, ['Piriformis muscle'], { alt: ['piriforme'], old: ['pyramidal du bassin', 'muscle pyramidal du bassin'] });
  M('gemellus_superior', 'mi', 'muscle jumeau superieur', 'musculus gemellus superior', 0, ['Superior gemellus muscle'], { alt: ['jumeau superieur'], old: ['jumeau superieur du bassin'] });
  M('obturator_internus', 'mi', 'muscle obturateur interne', 'musculus obturator internus', 1, ['Obturator internus'], { alt: ['obturateur interne'] });
  M('gemellus_inferior', 'mi', 'muscle jumeau inferieur', 'musculus gemellus inferior', 0, ['Inferior gemellus muscle'], { alt: ['jumeau inferieur'], old: ['jumeau inferieur du bassin'] });
  M('quadratus_femoris', 'mi', 'muscle carre femoral', 'musculus quadratus femoris', 1, ['Quadratus femoris muscle'], { alt: ['carre femoral'], old: ['carre crural', 'muscle carre crural'] });
  M('obturator_externus', 'mi', 'muscle obturateur externe', 'musculus obturator externus', 0, ['Obturator externus'], { alt: ['obturateur externe'] });
  M('sartorius', 'mi', 'muscle sartorius', 'musculus sartorius', 1, ['Sartorius muscle'], { alt: ['sartorius'], old: ['couturier', 'muscle couturier'] });
  M('rectus_femoris', 'mi', 'muscle droit femoral', 'musculus rectus femoris', 1, ['Rectus femoris muscle'], { alt: ['droit femoral'], old: ['droit anterieur', 'droit anterieur de la cuisse'] });
  M('vastus_lateralis', 'mi', 'muscle vaste lateral', 'musculus vastus lateralis', 1, ['Vastus lateralis muscle'], { alt: ['vaste lateral'], old: ['vaste externe', 'muscle vaste externe'] });
  M('vastus_medialis', 'mi', 'muscle vaste medial', 'musculus vastus medialis', 1, ['Vastus medialis muscle'], { alt: ['vaste medial'], old: ['vaste interne', 'muscle vaste interne'] });
  M('vastus_intermedius', 'mi', 'muscle vaste intermediaire', 'musculus vastus intermedius', 1, ['Vastus intermedius muscle'], { alt: ['vaste intermediaire'], old: ['crural', 'muscle crural'] });
  M('pectineus', 'mi', 'muscle pectine', 'musculus pectineus', 1, ['Pectineus muscle'], { alt: ['pectine'] });
  M('adductor_longus', 'mi', 'muscle long adducteur', 'musculus adductor longus', 1, ['Adductor longus'], { alt: ['long adducteur'], old: ['moyen adducteur', 'premier adducteur'] });
  M('adductor_brevis', 'mi', 'muscle court adducteur', 'musculus adductor brevis', 1, ['Adductor brevis'], { alt: ['court adducteur'], old: ['petit adducteur', 'deuxieme adducteur'] });
  M('adductor_magnus', 'mi', 'muscle grand adducteur', 'musculus adductor magnus', 1, ['Adductor magnus', '(Adductor minimus)'], { alt: ['grand adducteur'], old: ['troisieme adducteur'] });
  M('gracilis', 'mi', 'muscle gracile', 'musculus gracilis', 1, ['Gracilis muscle'], { alt: ['gracile'], old: ['droit interne', 'droit interne de la cuisse'] });
  M('biceps_femoris', 'mi', 'muscle biceps femoral', 'musculus biceps femoris', 1, ['Long head of biceps femoris', 'Short head of biceps femoris'], { alt: ['biceps femoral'], old: ['biceps crural', 'muscle biceps crural'] });
  M('semitendinosus', 'mi', 'muscle semi-tendineux', 'musculus semitendinosus', 1, ['Semitendinosus muscle'], { alt: ['semi-tendineux', 'semitendineux'], old: ['demi-tendineux', 'muscle demi-tendineux'] });
  M('semimembranosus', 'mi', 'muscle semi-membraneux', 'musculus semimembranosus', 1, ['Semimembranosus muscle'], { alt: ['semi-membraneux', 'semimembraneux'], old: ['demi-membraneux', 'muscle demi-membraneux'] });
  M('tibialis_anterior', 'mi', 'muscle tibial anterieur', 'musculus tibialis anterior', 1, ['Tibialis anterior muscle'], { alt: ['tibial anterieur'], old: ['jambier anterieur', 'muscle jambier anterieur'] });
  M('extensor_digitorum_longus', 'mi', 'muscle long extenseur des orteils', 'musculus extensor digitorum longus', 1, ['Extensor digitorum longus', 'Tendon of extensor digitorum longus'], { alt: ['long extenseur des orteils'], old: ['extenseur commun des orteils'] });
  M('extensor_hallucis_longus', 'mi', 'muscle long extenseur de l\'hallux', 'musculus extensor hallucis longus', 1, ['Extensor hallucis longus'], { alt: ['long extenseur de l\'hallux'], old: ['extenseur propre du gros orteil'] });
  M('fibularis_tertius', 'mi', 'muscle troisieme fibulaire', 'musculus fibularis tertius', 0, ['Fibularis tertius muscle'], { alt: ['troisieme fibulaire'], old: ['peronier anterieur', 'muscle peronier anterieur'] });
  M('fibularis_longus', 'mi', 'muscle long fibulaire', 'musculus fibularis longus', 1, ['Fibularis longus muscle'], { alt: ['long fibulaire'], old: ['long peronier lateral', 'muscle long peronier lateral', 'long peronier'] });
  M('fibularis_brevis', 'mi', 'muscle court fibulaire', 'musculus fibularis brevis', 1, ['Fibularis brevis muscle'], { alt: ['court fibulaire'], old: ['court peronier lateral', 'muscle court peronier lateral', 'court peronier'] });
  M('gastrocnemius', 'mi', 'muscle gastrocnemien', 'musculus gastrocnemius', 1, ['Lateral head of gastrocnemius', 'Medial head of gastrocnemius'], { alt: ['gastrocnemien', 'gastrocnemiens', 'muscles gastrocnemiens'], old: ['jumeaux', 'muscles jumeaux', 'jumeaux de la jambe'] });
  M('soleus', 'mi', 'muscle soleaire', 'musculus soleus', 1, ['Soleus muscle'], { alt: ['soleaire'] });
  M('plantaris', 'mi', 'muscle plantaire', 'musculus plantaris', 0, ['Plantaris muscle'], { alt: ['plantaire'], old: ['plantaire grele', 'muscle plantaire grele'] });
  M('tendo_calcaneus', 'mi', 'tendon calcaneen', 'tendo calcaneus', 1, ['Calcaneal tendon'], { alt: ['tendon du triceps sural'], old: ['tendon d\'achille'], t: 1 });
  M('popliteus', 'mi', 'muscle poplite', 'musculus popliteus', 1, ['Popliteus muscle'], { alt: ['poplite'] });
  M('flexor_digitorum_longus', 'mi', 'muscle long flechisseur des orteils', 'musculus flexor digitorum longus', 1, ['Flexor digitorum longus'], { alt: ['long flechisseur des orteils'], old: ['long flechisseur commun des orteils'] });
  M('tibialis_posterior', 'mi', 'muscle tibial posterieur', 'musculus tibialis posterior', 1, ['Tibialis posterior muscle'], { alt: ['tibial posterieur'], old: ['jambier posterieur', 'muscle jambier posterieur'] });
  M('flexor_hallucis_longus', 'mi', 'muscle long flechisseur de l\'hallux', 'musculus flexor hallucis longus', 1, ['Flexor hallucis longus'], { alt: ['long flechisseur de l\'hallux'], old: ['long flechisseur propre du gros orteil'] });
  M('extensor_digitorum_brevis', 'mi', 'muscle court extenseur des orteils', 'musculus extensor digitorum brevis', 0, ['Extensor digitorum brevis'], { alt: ['court extenseur des orteils'], old: ['pedieux', 'muscle pedieux'] });
  M('extensor_hallucis_brevis', 'mi', 'muscle court extenseur de l\'hallux', 'musculus extensor hallucis brevis', 0, ['Extensor hallucis brevis'], { alt: ['court extenseur de l\'hallux'] });
  M('abductor_hallucis', 'mi', 'muscle abducteur de l\'hallux', 'musculus abductor hallucis', 0, ['Abductor hallucis'], { alt: ['abducteur de l\'hallux'] });
  M('flexor_digitorum_brevis', 'mi', 'muscle court flechisseur des orteils', 'musculus flexor digitorum brevis', 0, ['Flexor digitorum brevis'], { alt: ['court flechisseur des orteils'], old: ['court flechisseur plantaire'] });
  M('abductor_digiti_minimi_pedis', 'mi', 'muscle abducteur du petit orteil', 'musculus abductor digiti minimi pedis', 0, ['Abductor digiti minimi of foot'], { alt: ['abducteur du petit orteil'] });
  M('quadratus_plantae', 'mi', 'muscle carre plantaire', 'musculus quadratus plantae', 0, ['Quadratus plantae muscle'], { alt: ['carre plantaire'], old: ['accessoire du long flechisseur'] });
  M('lumbricales_pedis', 'mi', 'muscles lombricaux du pied', 'musculi lumbricales pedis', 0, ['Lumbrical muscles of foot'], { alt: ['lombricaux du pied'] });
  M('flexor_hallucis_brevis', 'mi', 'muscle court flechisseur de l\'hallux', 'musculus flexor hallucis brevis', 0, ['Medial head of flexor hallucis brevis', 'Lateral head of flexor hallucis brevis'], { alt: ['court flechisseur de l\'hallux'] });
  M('adductor_hallucis', 'mi', 'muscle adducteur de l\'hallux', 'musculus adductor hallucis', 0, ['Oblique head of adductor hallucis', 'Transverse head of adductor hallucis'], { alt: ['adducteur de l\'hallux'] });
  M('flexor_digiti_minimi_brevis_pedis', 'mi', 'muscle court flechisseur du petit orteil', 'musculus flexor digiti minimi brevis pedis', 0, ['Flexor digiti minimi of foot'], { alt: ['court flechisseur du petit orteil'] });
  M('interossei_dorsales_pedis', 'mi', 'muscles interosseux dorsaux du pied', 'musculi interossei dorsales pedis', 0, ['Dorsal interossei muscles of foot'], { alt: ['interosseux dorsaux du pied'] });
  M('interossei_plantares', 'mi', 'muscles interosseux plantaires', 'musculi interossei plantares', 0, ['Plantar interossei muscles'], { alt: ['interosseux plantaires'] });

  const MUSCLE = {};
  MUSCLES.forEach(m => { MUSCLE[m.id] = m; });
  const MUSCLE_REGION = {};
  MUSCLE_REGIONS.forEach(r => { MUSCLE_REGION[r.id] = r; });

  Object.assign(NS, { MUSCLES, MUSCLE, MUSCLE_REGIONS, MUSCLE_REGION });
})(AQ.data);
