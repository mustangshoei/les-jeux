/* ==========================================================================
   Anotehomy Quizz - data/bones.js
   CATALOGUE DES OS (nomenclature TA2, en francais sans accents)
   --------------------------------------------------------------------------
   Chaque os est une entree independante du catalogue BONES :
     id      : identifiant unique (base latine)
     region  : zone du corps (voir data/regions.js)
     name    : nom officiel francais TA2 (affiche et attendu)
     latin   : nom latin TA2 (accepte comme reponse)
     alt     : variantes acceptees
     old     : ANCIENNE nomenclature (reconnue mais comptee fausse)
     paired  : os pair (droite / gauche)
     best    : vues ou l'os est le mieux visible, par ordre de preference
               (A = anterieure, P = posterieure, L = laterale du cote de l'os).
               Les os profonds restent visibles par transparence (rayons X).
     labelAnswer : accepte aussi l'etiquette de l'instance (ex : "T7")
     sub     : sous-structures (preparees pour les futurs jeux).
               Format : { id, name, latin }. Pour dessiner une sous-structure
               plus tard, il suffira de passer l'option "sub" a la fonction
               bone() de geometry/primitives.js.
   ========================================================================== */
(function (NS) {
  'use strict';

  const BONES = [];
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  /* sous-structure */
  const S = (name, latin) => ({ id: slug(latin || name), name, latin: latin || '' });
  /* os */
  function B(id, region, name, latin, o = {}) {
    BONES.push({
      id, region, name, latin,
      alt: o.alt || [], old: o.old || [], paired: !!o.paired,
      best: o.best || ['A', 'P', 'L'], labelAnswer: !!o.labelAnswer,
      sub: o.sub || []
    });
  }

  /* ---------------- Membre superieur ---------------- */
  B('clavicula', 'ms', 'clavicule', 'clavicula', { paired: 1, best: ['A', 'L', 'P'], sub: [
    S('extremite sternale', 'extremitas sternalis'), S('extremite acromiale', 'extremitas acromialis'),
    S('tubercule conoide', 'tuberculum conoideum'), S('ligne trapezoide', 'linea trapezoidea')] });
  B('scapula', 'ms', 'scapula', 'scapula', { paired: 1, best: ['P', 'L', 'A'], old: ['omoplate'], sub: [
    S('incisure scapulaire', 'incisura scapulae'), S('processus coracoide', 'processus coracoideus'),
    S('acromion', 'acromion'), S('epine de la scapula', 'spina scapulae'),
    S('cavite glenoidale', 'cavitas glenoidalis'), S('fosse supra-epineuse', 'fossa supraspinata'),
    S('fosse infra-epineuse', 'fossa infraspinata'), S('fosse subscapulaire', 'fossa subscapularis'),
    S('angle inferieur', 'angulus inferior'), S('angle superieur', 'angulus superior')] });
  B('humerus', 'ms', 'humerus', 'humerus', { paired: 1, best: ['A', 'P', 'L'], sub: [
    S('tete de l humerus', 'caput humeri'), S('col anatomique', 'collum anatomicum'),
    S('col chirurgical', 'collum chirurgicum'), S('tubercule majeur', 'tuberculum majus'),
    S('tubercule mineur', 'tuberculum minus'), S('sillon intertuberculaire', 'sulcus intertubercularis'),
    S('tuberosite deltoidienne', 'tuberositas deltoidea'), S('capitulum', 'capitulum humeri'),
    S('trochlee humerale', 'trochlea humeri'), S('epicondyle lateral', 'epicondylus lateralis'),
    S('epicondyle medial', 'epicondylus medialis'), S('fosse olecranienne', 'fossa olecrani')] });
  B('radius', 'ms', 'radius', 'radius', { paired: 1, best: ['A', 'P', 'L'], sub: [
    S('tete du radius', 'caput radii'), S('col du radius', 'collum radii'),
    S('tuberosite radiale', 'tuberositas radii'), S('processus styloide du radius', 'processus styloideus radii'),
    S('incisure ulnaire', 'incisura ulnaris')] });
  B('ulna', 'ms', 'ulna', 'ulna', { paired: 1, best: ['P', 'A', 'L'], old: ['cubitus'], sub: [
    S('olecrane', 'olecranon'), S('processus coronoide', 'processus coronoideus'),
    S('incisure trochleaire', 'incisura trochlearis'), S('incisure radiale', 'incisura radialis'),
    S('tete de l ulna', 'caput ulnae'), S('processus styloide de l ulna', 'processus styloideus ulnae')] });
  B('os_scaphoideum', 'ms', 'os scaphoide', 'os scaphoideum', { paired: 1, best: ['A', 'P', 'L'], sub: [
    S('tubercule du scaphoide', 'tuberculum ossis scaphoidei')] });
  B('os_lunatum', 'ms', 'os lunatum', 'os lunatum', { paired: 1, best: ['A', 'P'], old: ['semi-lunaire', 'os semi-lunaire'] });
  B('os_triquetrum', 'ms', 'os triquetrum', 'os triquetrum', { paired: 1, best: ['A', 'P'], old: ['pyramidal', 'os pyramidal'] });
  B('os_pisiforme', 'ms', 'os pisiforme', 'os pisiforme', { paired: 1, best: ['A'] });
  B('os_trapezium', 'ms', 'os trapeze', 'os trapezium', { paired: 1, best: ['A', 'P', 'L'], sub: [
    S('tubercule du trapeze', 'tuberculum ossis trapezii')] });
  B('os_trapezoideum', 'ms', 'os trapezoide', 'os trapezoideum', { paired: 1, best: ['A', 'P'] });
  B('os_capitatum', 'ms', 'os capitatum', 'os capitatum', { paired: 1, best: ['A', 'P'], old: ['grand os'] });
  B('os_hamatum', 'ms', 'os hamatum', 'os hamatum', { paired: 1, best: ['A', 'P'], old: ['os crochu', 'crochu', 'unciforme'], sub: [
    S('hamulus de l os hamatum', 'hamulus ossis hamati')] });
  B('ossa_metacarpi', 'ms', 'os metacarpien', 'os metacarpi', { paired: 1, best: ['A', 'P'],
    alt: ['metacarpiens', 'os metacarpiens', 'ossa metacarpi', 'metacarpe'], sub: [
    S('base', 'basis ossis metacarpi'), S('corps', 'corpus ossis metacarpi'), S('tete', 'caput ossis metacarpi')] });
  B('phalanx_proximalis_manus', 'ms', 'phalange proximale de la main', 'phalanx proximalis manus', { paired: 1, best: ['A', 'P'],
    alt: ['phalange proximale', 'phalanx proximalis'], old: ['premiere phalange de la main'] });
  B('phalanx_media_manus', 'ms', 'phalange moyenne de la main', 'phalanx media manus', { paired: 1, best: ['A', 'P'],
    alt: ['phalange moyenne', 'phalange intermediaire', 'phalanx media'], old: ['phalangine', 'deuxieme phalange de la main'] });
  B('phalanx_distalis_manus', 'ms', 'phalange distale de la main', 'phalanx distalis manus', { paired: 1, best: ['A', 'P'],
    alt: ['phalange distale', 'phalanx distalis'], old: ['phalangette', 'troisieme phalange de la main'] });

  /* ---------------- Membre inferieur ---------------- */
  B('femur', 'mi', 'femur', 'femur', { paired: 1, best: ['A', 'P', 'L'], sub: [
    S('tete du femur', 'caput femoris'), S('col du femur', 'collum femoris'),
    S('grand trochanter', 'trochanter major'), S('petit trochanter', 'trochanter minor'),
    S('ligne apre', 'linea aspera'), S('condyle medial', 'condylus medialis'),
    S('condyle lateral', 'condylus lateralis'), S('fosse intercondylaire', 'fossa intercondylaris'),
    S('epicondyle medial', 'epicondylus medialis'), S('epicondyle lateral', 'epicondylus lateralis')] });
  B('patella', 'mi', 'patella', 'patella', { paired: 1, best: ['A', 'L'], old: ['rotule'], sub: [
    S('base de la patella', 'basis patellae'), S('apex de la patella', 'apex patellae'),
    S('face articulaire', 'facies articularis')] });
  B('tibia', 'mi', 'tibia', 'tibia', { paired: 1, best: ['A', 'L', 'P'], sub: [
    S('condyle medial', 'condylus medialis'), S('condyle lateral', 'condylus lateralis'),
    S('eminence intercondylaire', 'eminentia intercondylaris'), S('tuberosite tibiale', 'tuberositas tibiae'),
    S('malleole medial', 'malleolus medialis'), S('bord anterieur', 'margo anterior')] });
  B('fibula', 'mi', 'fibula', 'fibula', { paired: 1, best: ['A', 'L', 'P'], old: ['perone'], sub: [
    S('tete de la fibula', 'caput fibulae'), S('col de la fibula', 'collum fibulae'),
    S('malleole laterale', 'malleolus lateralis')] });
  B('talus', 'mi', 'talus', 'talus', { paired: 1, best: ['A', 'L', 'P'], old: ['astragale'], sub: [
    S('tete du talus', 'caput tali'), S('col du talus', 'collum tali'),
    S('corps du talus', 'corpus tali'), S('trochlee du talus', 'trochlea tali')] });
  B('calcaneus', 'mi', 'calcaneus', 'calcaneus', { paired: 1, best: ['L', 'P', 'A'], old: ['calcaneum'], sub: [
    S('tuberosite du calcaneus', 'tuber calcanei'), S('sustentaculum du talus', 'sustentaculum tali')] });
  B('os_naviculare', 'mi', 'os naviculaire', 'os naviculare', { paired: 1, best: ['A', 'L'],
    old: ['scaphoide tarsien', 'os scaphoide tarsien'], sub: [S('tuberosite de l os naviculaire', 'tuberositas ossis navicularis')] });
  B('os_cuboideum', 'mi', 'os cuboide', 'os cuboideum', { paired: 1, best: ['A', 'L'] });
  B('os_cuneiforme_mediale', 'mi', 'os cuneiforme medial', 'os cuneiforme mediale', { paired: 1, best: ['A', 'L'],
    old: ['premier cuneiforme', 'grand cuneiforme'] });
  B('os_cuneiforme_intermedium', 'mi', 'os cuneiforme intermediaire', 'os cuneiforme intermedium', { paired: 1, best: ['A', 'L'],
    old: ['deuxieme cuneiforme', 'petit cuneiforme'] });
  B('os_cuneiforme_laterale', 'mi', 'os cuneiforme lateral', 'os cuneiforme laterale', { paired: 1, best: ['A', 'L'],
    old: ['troisieme cuneiforme', 'moyen cuneiforme'] });
  B('ossa_metatarsi', 'mi', 'os metatarsien', 'os metatarsi', { paired: 1, best: ['A', 'L'],
    alt: ['metatarsiens', 'os metatarsiens', 'ossa metatarsi', 'metatarse'], sub: [
    S('base', 'basis ossis metatarsi'), S('corps', 'corpus ossis metatarsi'), S('tete', 'caput ossis metatarsi'),
    S('tuberosite du 5e metatarsien', 'tuberositas ossis metatarsi quinti')] });
  B('phalanx_proximalis_pedis', 'mi', 'phalange proximale du pied', 'phalanx proximalis pedis', { paired: 1, best: ['A', 'L'],
    alt: ['phalange proximale', 'phalanx proximalis'], old: ['premiere phalange du pied'] });
  B('phalanx_media_pedis', 'mi', 'phalange moyenne du pied', 'phalanx media pedis', { paired: 1, best: ['A', 'L'],
    alt: ['phalange moyenne', 'phalange intermediaire', 'phalanx media'], old: ['phalangine du pied'] });
  B('phalanx_distalis_pedis', 'mi', 'phalange distale du pied', 'phalanx distalis pedis', { paired: 1, best: ['A', 'L'],
    alt: ['phalange distale', 'phalanx distalis'], old: ['phalangette du pied'] });

  /* ---------------- Vertebres ---------------- */
  B('atlas', 'vert', 'atlas', 'atlas', { best: ['P', 'L'], alt: ['c1', 'vertebre c1'], sub: [
    S('arc anterieur', 'arcus anterior atlantis'), S('arc posterieur', 'arcus posterior atlantis'),
    S('masse laterale', 'massa lateralis atlantis'), S('tubercule anterieur', 'tuberculum anterius'),
    S('fovea de la dent', 'fovea dentis')] });
  B('axis', 'vert', 'axis', 'axis', { best: ['P', 'L'], alt: ['c2', 'vertebre c2'], sub: [
    S('dent de l axis', 'dens axis'), S('corps de l axis', 'corpus axis'), S('processus epineux', 'processus spinosus')] });
  B('vertebra_cervicalis', 'vert', 'vertebre cervicale', 'vertebra cervicalis', { best: ['A', 'L', 'P'], labelAnswer: true,
    alt: ['vertebres cervicales', 'vertebrae cervicales'], sub: [
    S('corps vertebral', 'corpus vertebrae'), S('foramen transversaire', 'foramen transversarium'),
    S('processus epineux bifide', 'processus spinosus'), S('processus transverse', 'processus transversus'),
    S('uncus du corps', 'uncus corporis')] });
  B('vertebra_thoracica', 'vert', 'vertebre thoracique', 'vertebra thoracica', { best: ['P', 'L', 'A'], labelAnswer: true,
    alt: ['vertebres thoraciques', 'vertebrae thoracicae'], old: ['vertebre dorsale', 'vertebres dorsales'], sub: [
    S('fossette costale superieure', 'fovea costalis superior'), S('fossette costale inferieure', 'fovea costalis inferior'),
    S('fossette costale transversaire', 'fovea costalis processus transversi'), S('processus epineux', 'processus spinosus')] });
  B('vertebra_lumbalis', 'vert', 'vertebre lombaire', 'vertebra lumbalis', { best: ['A', 'P', 'L'], labelAnswer: true,
    alt: ['vertebres lombaires', 'vertebrae lumbales'], sub: [
    S('processus costiforme', 'processus costiformis'), S('processus mamillaire', 'processus mammillaris'),
    S('processus accessoire', 'processus accessorius')] });

  /* ---------------- Crane ---------------- */
  B('os_frontale', 'crane', 'os frontal', 'os frontale', { best: ['A', 'L'], sub: [
    S('ecaille frontale', 'squama frontalis'), S('glabelle', 'glabella'), S('arcade sourciliere', 'arcus superciliaris'),
    S('incisure supra-orbitaire', 'incisura supraorbitalis'), S('partie orbitaire', 'pars orbitalis')] });
  B('os_parietale', 'crane', 'os parietal', 'os parietale', { paired: 1, best: ['P', 'L'], sub: [
    S('tuber parietal', 'tuber parietale'), S('ligne temporale superieure', 'linea temporalis superior')] });
  B('os_temporale', 'crane', 'os temporal', 'os temporale', { paired: 1, best: ['L', 'P', 'A'], sub: [
    S('partie squameuse', 'pars squamosa'), S('partie petreuse', 'pars petrosa'),
    S('processus mastoide', 'processus mastoideus'), S('processus styloide', 'processus styloideus'),
    S('meat acoustique externe', 'meatus acusticus externus'), S('processus zygomatique', 'processus zygomaticus')] });
  B('os_occipitale', 'crane', 'os occipital', 'os occipitale', { best: ['P', 'L'], sub: [
    S('foramen magnum', 'foramen magnum'), S('condyle occipital', 'condylus occipitalis'),
    S('protuberance occipitale externe', 'protuberantia occipitalis externa'), S('ecaille occipitale', 'squama occipitalis')] });
  B('os_sphenoidale', 'crane', 'os sphenoide', 'os sphenoidale', { best: ['L', 'A'], sub: [
    S('corps du sphenoide', 'corpus ossis sphenoidalis'), S('grande aile', 'ala major'), S('petite aile', 'ala minor'),
    S('processus pterygoide', 'processus pterygoideus'), S('selle turcique', 'sella turcica')] });
  B('os_ethmoidale', 'crane', 'os ethmoide', 'os ethmoidale', { best: ['A', 'L'], sub: [
    S('lame criblee', 'lamina cribrosa'), S('lame perpendiculaire', 'lamina perpendicularis'),
    S('crista galli', 'crista galli'), S('labyrinthe ethmoidal', 'labyrinthus ethmoidalis'), S('lame orbitaire', 'lamina orbitalis')] });
  B('os_nasale', 'crane', 'os nasal', 'os nasale', { paired: 1, best: ['A', 'L'], old: ['os propre du nez', 'os propres du nez'] });
  B('os_lacrimale', 'crane', 'os lacrymal', 'os lacrimale', { paired: 1, best: ['A', 'L'], alt: ['os lacrimal'], old: ['unguis'], sub: [
    S('crete lacrymale posterieure', 'crista lacrimalis posterior'), S('hamulus lacrymal', 'hamulus lacrimalis')] });
  B('os_zygomaticum', 'crane', 'os zygomatique', 'os zygomaticum', { paired: 1, best: ['A', 'L'], old: ['os malaire', 'malaire'], sub: [
    S('processus frontal', 'processus frontalis'), S('processus temporal', 'processus temporalis')] });
  B('maxilla', 'crane', 'maxillaire', 'maxilla', { paired: 1, best: ['A', 'L'], alt: ['os maxillaire'], old: ['maxillaire superieur'], sub: [
    S('corps du maxillaire', 'corpus maxillae'), S('processus frontal', 'processus frontalis'),
    S('processus zygomatique', 'processus zygomaticus'), S('processus palatin', 'processus palatinus'),
    S('processus alveolaire', 'processus alveolaris'), S('sinus maxillaire', 'sinus maxillaris'),
    S('foramen infra-orbitaire', 'foramen infraorbitale')] });
  B('mandibula', 'crane', 'mandibule', 'mandibula', { best: ['A', 'L'], old: ['maxillaire inferieur'], sub: [
    S('corps de la mandibule', 'corpus mandibulae'), S('branche de la mandibule', 'ramus mandibulae'),
    S('angle de la mandibule', 'angulus mandibulae'), S('processus condylaire', 'processus condylaris'),
    S('processus coronoide', 'processus coronoideus'), S('foramen mentonnier', 'foramen mentale'),
    S('protuberance mentonniere', 'protuberantia mentalis')] });
  B('os_palatinum', 'crane', 'os palatin', 'os palatinum', { paired: 1, best: ['L', 'A'], sub: [
    S('lame horizontale', 'lamina horizontalis'), S('lame perpendiculaire', 'lamina perpendicularis'),
    S('processus pyramidal', 'processus pyramidalis'), S('processus orbitaire', 'processus orbitalis'),
    S('processus sphenoidal', 'processus sphenoidalis')] });
  B('vomer', 'crane', 'vomer', 'vomer', { best: ['A', 'L'] });
  B('concha_nasalis_inferior', 'crane', 'cornet nasal inferieur', 'concha nasalis inferior', { paired: 1, best: ['A'],
    alt: ['cornet inferieur', 'concha nasale inferieure', 'os de la conque nasale inferieure'] });

  /* ---------------- Pelvis ---------------- */
  B('os_coxae', 'pelvis', 'os coxal', 'os coxae', { paired: 1, best: ['A', 'P', 'L'], old: ['os iliaque', 'iliaque', 'os innomine'], sub: [
    S('ilium', 'os ilium'), S('ischium', 'os ischii'), S('pubis', 'os pubis'), S('acetabulum', 'acetabulum'),
    S('foramen obture', 'foramen obturatum'), S('crete iliaque', 'crista iliaca'),
    S('epine iliaque antero-superieure', 'spina iliaca anterior superior'), S('tuberosite ischiatique', 'tuber ischiadicum'),
    S('grande incisure ischiatique', 'incisura ischiadica major'), S('face symphysaire', 'facies symphysialis')] });
  B('sacrum', 'pelvis', 'sacrum', 'os sacrum', { best: ['P', 'A', 'L'], sub: [
    S('promontoire', 'promontorium'), S('aile du sacrum', 'ala ossis sacri'),
    S('foramens sacraux anterieurs', 'foramina sacralia anteriora'), S('foramens sacraux posterieurs', 'foramina sacralia posteriora'),
    S('crete sacrale mediane', 'crista sacralis mediana'), S('hiatus sacral', 'hiatus sacralis')] });
  B('coccyx', 'pelvis', 'coccyx', 'os coccygis', { best: ['P', 'L'] });

  /* ---------------- Autre / squelette axial ---------------- */
  B('sternum', 'axial', 'sternum', 'sternum', { best: ['A', 'L'], sub: [
    S('manubrium sternal', 'manubrium sterni'), S('corps du sternum', 'corpus sterni'),
    S('processus xiphoide', 'processus xiphoideus'), S('incisure jugulaire', 'incisura jugularis'),
    S('angle sternal', 'angulus sterni')] });
  B('costa', 'axial', 'cote', 'costa', { paired: 1, best: ['A', 'P', 'L'], alt: ['cotes', 'costae'], sub: [
    S('tete de la cote', 'caput costae'), S('col de la cote', 'collum costae'), S('tubercule de la cote', 'tuberculum costae'),
    S('corps de la cote', 'corpus costae'), S('angle de la cote', 'angulus costae'), S('sillon de la cote', 'sulcus costae')] });
  B('os_hyoideum', 'axial', 'os hyoide', 'os hyoideum', { best: ['A', 'L'], sub: [
    S('corps de l os hyoide', 'corpus ossis hyoidei'), S('grande corne', 'cornu majus'), S('petite corne', 'cornu minus')] });

  const BONE = {};
  BONES.forEach(b => { BONE[b.id] = b; });

  Object.assign(NS, { BONES, BONE });
})(AQ.data);
