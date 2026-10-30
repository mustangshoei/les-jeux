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
    S('extrémité sternale', 'extremitas sternalis'), S('extrémité acromiale', 'extremitas acromialis'),
    S('tubercule conoïde', 'tuberculum conoideum'), S('ligne trapézoïde', 'linea trapezoidea')] });
  B('scapula', 'ms', 'scapula', 'scapula', { paired: 1, best: ['P', 'L', 'A'], old: ['omoplate'], sub: [
    S('incisure scapulaire', 'incisura scapulae'), S('processus coracoïde', 'processus coracoideus'),
    S('acromion', 'acromion'), S('épine de la scapula', 'spina scapulae'),
    S('cavité glénoïdale', 'cavitas glenoidalis'), S('fosse supra-épineuse', 'fossa supraspinata'),
    S('fosse infra-épineuse', 'fossa infraspinata'), S('fosse subscapulaire', 'fossa subscapularis'),
    S('angle inférieur', 'angulus inferior'), S('angle supérieur', 'angulus superior')] });
  B('humerus', 'ms', 'humérus', 'humerus', { paired: 1, best: ['A', 'P', 'L'], sub: [
    S('tête de l\'humérus', 'caput humeri'), S('col anatomique', 'collum anatomicum'),
    S('col chirurgical', 'collum chirurgicum'), S('tubercule majeur', 'tuberculum majus'),
    S('tubercule mineur', 'tuberculum minus'), S('sillon intertuberculaire', 'sulcus intertubercularis'),
    S('tubérosité deltoïdienne', 'tuberositas deltoidea'), S('capitulum', 'capitulum humeri'),
    S('trochlée humérale', 'trochlea humeri'), S('épicondyle latéral', 'epicondylus lateralis'),
    S('épicondyle médial', 'epicondylus medialis'), S('fosse olécrânienne', 'fossa olecrani')] });
  B('radius', 'ms', 'radius', 'radius', { paired: 1, best: ['A', 'P', 'L'], sub: [
    S('tête du radius', 'caput radii'), S('col du radius', 'collum radii'),
    S('tubérosité radiale', 'tuberositas radii'), S('processus styloïde du radius', 'processus styloideus radii'),
    S('incisure ulnaire', 'incisura ulnaris')] });
  B('ulna', 'ms', 'ulna', 'ulna', { paired: 1, best: ['P', 'A', 'L'], old: ['cubitus'], sub: [
    S('olécrâne', 'olecranon'), S('processus coronoïde', 'processus coronoideus'),
    S('incisure trochléaire', 'incisura trochlearis'), S('incisure radiale', 'incisura radialis'),
    S('tête de l\'ulna', 'caput ulnae'), S('processus styloïde de l\'ulna', 'processus styloideus ulnae')] });
  B('os_scaphoideum', 'ms', 'os scaphoïde', 'os scaphoideum', { paired: 1, best: ['A', 'P', 'L'], sub: [
    S('tubercule du scaphoïde', 'tuberculum ossis scaphoidei')] });
  B('os_lunatum', 'ms', 'os lunatum', 'os lunatum', { paired: 1, best: ['A', 'P'], old: ['semi-lunaire', 'os semi-lunaire'] });
  B('os_triquetrum', 'ms', 'os triquetrum', 'os triquetrum', { paired: 1, best: ['A', 'P'], old: ['pyramidal', 'os pyramidal'] });
  B('os_pisiforme', 'ms', 'os pisiforme', 'os pisiforme', { paired: 1, best: ['A'] });
  B('os_trapezium', 'ms', 'os trapèze', 'os trapezium', { paired: 1, best: ['A', 'P', 'L'], sub: [
    S('tubercule du trapèze', 'tuberculum ossis trapezii')] });
  B('os_trapezoideum', 'ms', 'os trapézoïde', 'os trapezoideum', { paired: 1, best: ['A', 'P'] });
  B('os_capitatum', 'ms', 'os capitatum', 'os capitatum', { paired: 1, best: ['A', 'P'], old: ['grand os'] });
  B('os_hamatum', 'ms', 'os hamatum', 'os hamatum', { paired: 1, best: ['A', 'P'], old: ['os crochu', 'crochu', 'unciforme'], sub: [
    S('hamulus de l\'os hamatum', 'hamulus ossis hamati')] });
  B('ossa_metacarpi', 'ms', 'os métacarpien', 'os metacarpi', { paired: 1, best: ['A', 'P'],
    alt: ['métacarpiens', 'os métacarpiens', 'ossa metacarpi', 'métacarpe'], sub: [
    S('base', 'basis ossis metacarpi'), S('corps', 'corpus ossis metacarpi'), S('tête', 'caput ossis metacarpi')] });
  B('phalanx_proximalis_manus', 'ms', 'phalange proximale de la main', 'phalanx proximalis manus', { paired: 1, best: ['A', 'P'],
    alt: ['phalange proximale', 'phalanx proximalis'], old: ['première phalange de la main'] });
  B('phalanx_media_manus', 'ms', 'phalange moyenne de la main', 'phalanx media manus', { paired: 1, best: ['A', 'P'],
    alt: ['phalange moyenne', 'phalange intermédiaire', 'phalanx media'], old: ['phalangine', 'deuxième phalange de la main'] });
  B('phalanx_distalis_manus', 'ms', 'phalange distale de la main', 'phalanx distalis manus', { paired: 1, best: ['A', 'P'],
    alt: ['phalange distale', 'phalanx distalis'], old: ['phalangette', 'troisième phalange de la main'] });

  /* ---------------- Membre inferieur ---------------- */
  B('femur', 'mi', 'fémur', 'femur', { paired: 1, best: ['A', 'P', 'L'], sub: [
    S('tête du fémur', 'caput femoris'), S('col du fémur', 'collum femoris'),
    S('grand trochanter', 'trochanter major'), S('petit trochanter', 'trochanter minor'),
    S('ligne âpre', 'linea aspera'), S('condyle médial', 'condylus medialis'),
    S('condyle latéral', 'condylus lateralis'), S('fosse intercondylaire', 'fossa intercondylaris'),
    S('épicondyle médial', 'epicondylus medialis'), S('épicondyle latéral', 'epicondylus lateralis')] });
  B('patella', 'mi', 'patella', 'patella', { paired: 1, best: ['A', 'L'], old: ['rotule'], sub: [
    S('base de la patella', 'basis patellae'), S('apex de la patella', 'apex patellae'),
    S('face articulaire', 'facies articularis')] });
  B('tibia', 'mi', 'tibia', 'tibia', { paired: 1, best: ['A', 'L', 'P'], sub: [
    S('condyle médial', 'condylus medialis'), S('condyle latéral', 'condylus lateralis'),
    S('éminence intercondylaire', 'eminentia intercondylaris'), S('tubérosité tibiale', 'tuberositas tibiae'),
    S('malléole médial', 'malleolus medialis'), S('bord antérieur', 'margo anterior')] });
  B('fibula', 'mi', 'fibula', 'fibula', { paired: 1, best: ['A', 'L', 'P'], old: ['péroné'], sub: [
    S('tête de la fibula', 'caput fibulae'), S('col de la fibula', 'collum fibulae'),
    S('malléole latérale', 'malleolus lateralis')] });
  B('talus', 'mi', 'talus', 'talus', { paired: 1, best: ['A', 'L', 'P'], old: ['astragale'], sub: [
    S('tête du talus', 'caput tali'), S('col du talus', 'collum tali'),
    S('corps du talus', 'corpus tali'), S('trochlée du talus', 'trochlea tali')] });
  B('calcaneus', 'mi', 'calcanéus', 'calcaneus', { paired: 1, best: ['L', 'P', 'A'], old: ['calcanéum'], sub: [
    S('tubérosité du calcanéus', 'tuber calcanei'), S('sustentaculum du talus', 'sustentaculum tali')] });
  B('os_naviculare', 'mi', 'os naviculaire', 'os naviculare', { paired: 1, best: ['A', 'L'],
    old: ['scaphoïde tarsien', 'os scaphoïde tarsien'], sub: [S('tubérosité de l\'os naviculaire', 'tuberositas ossis navicularis')] });
  B('os_cuboideum', 'mi', 'os cuboïde', 'os cuboideum', { paired: 1, best: ['A', 'L'] });
  B('os_cuneiforme_mediale', 'mi', 'os cunéiforme médial', 'os cuneiforme mediale', { paired: 1, best: ['A', 'L'],
    old: ['premier cunéiforme', 'grand cunéiforme'] });
  B('os_cuneiforme_intermedium', 'mi', 'os cunéiforme intermédiaire', 'os cuneiforme intermedium', { paired: 1, best: ['A', 'L'],
    old: ['deuxième cunéiforme', 'petit cunéiforme'] });
  B('os_cuneiforme_laterale', 'mi', 'os cunéiforme latéral', 'os cuneiforme laterale', { paired: 1, best: ['A', 'L'],
    old: ['troisième cunéiforme', 'moyen cunéiforme'] });
  B('ossa_metatarsi', 'mi', 'os métatarsien', 'os metatarsi', { paired: 1, best: ['A', 'L'],
    alt: ['métatarsiens', 'os métatarsiens', 'ossa metatarsi', 'métatarse'], sub: [
    S('base', 'basis ossis metatarsi'), S('corps', 'corpus ossis metatarsi'), S('tête', 'caput ossis metatarsi'),
    S('tubérosité du 5e métatarsien', 'tuberositas ossis metatarsi quinti')] });
  B('phalanx_proximalis_pedis', 'mi', 'phalange proximale du pied', 'phalanx proximalis pedis', { paired: 1, best: ['A', 'L'],
    alt: ['phalange proximale', 'phalanx proximalis'], old: ['première phalange du pied'] });
  B('phalanx_media_pedis', 'mi', 'phalange moyenne du pied', 'phalanx media pedis', { paired: 1, best: ['A', 'L'],
    alt: ['phalange moyenne', 'phalange intermédiaire', 'phalanx media'], old: ['phalangine du pied'] });
  B('phalanx_distalis_pedis', 'mi', 'phalange distale du pied', 'phalanx distalis pedis', { paired: 1, best: ['A', 'L'],
    alt: ['phalange distale', 'phalanx distalis'], old: ['phalangette du pied'] });

  /* ---------------- Vertebres ---------------- */
  B('atlas', 'vert', 'atlas', 'atlas', { best: ['P', 'L'], alt: ['c1', 'vertèbre c1'], sub: [
    S('arc antérieur', 'arcus anterior atlantis'), S('arc postérieur', 'arcus posterior atlantis'),
    S('masse latérale', 'massa lateralis atlantis'), S('tubercule antérieur', 'tuberculum anterius'),
    S('fovea de la dent', 'fovea dentis')] });
  B('axis', 'vert', 'axis', 'axis', { best: ['P', 'L'], alt: ['c2', 'vertèbre c2'], sub: [
    S('dent de l\'axis', 'dens axis'), S('corps de l\'axis', 'corpus axis'), S('processus épineux', 'processus spinosus')] });
  B('vertebra_cervicalis', 'vert', 'vertèbre cervicale', 'vertebra cervicalis', { best: ['A', 'L', 'P'], labelAnswer: true,
    alt: ['vertèbres cervicales', 'vertebrae cervicales'], sub: [
    S('corps vertébral', 'corpus vertebrae'), S('foramen transversaire', 'foramen transversarium'),
    S('processus épineux bifide', 'processus spinosus'), S('processus transverse', 'processus transversus'),
    S('uncus du corps', 'uncus corporis')] });
  B('vertebra_thoracica', 'vert', 'vertèbre thoracique', 'vertebra thoracica', { best: ['P', 'L', 'A'], labelAnswer: true,
    alt: ['vertèbres thoraciques', 'vertebrae thoracicae'], old: ['vertèbre dorsale', 'vertèbres dorsales'], sub: [
    S('fossette costale supérieure', 'fovea costalis superior'), S('fossette costale inférieure', 'fovea costalis inferior'),
    S('fossette costale transversaire', 'fovea costalis processus transversi'), S('processus épineux', 'processus spinosus')] });
  B('vertebra_lumbalis', 'vert', 'vertèbre lombaire', 'vertebra lumbalis', { best: ['A', 'P', 'L'], labelAnswer: true,
    alt: ['vertèbres lombaires', 'vertebrae lumbales'], sub: [
    S('processus costiforme', 'processus costiformis'), S('processus mamillaire', 'processus mammillaris'),
    S('processus accessoire', 'processus accessorius')] });

  /* ---------------- Crane ---------------- */
  B('os_frontale', 'crane', 'os frontal', 'os frontale', { best: ['A', 'L'], sub: [
    S('écaille frontale', 'squama frontalis'), S('glabelle', 'glabella'), S('arcade sourcilière', 'arcus superciliaris'),
    S('incisure supra-orbitaire', 'incisura supraorbitalis'), S('partie orbitaire', 'pars orbitalis')] });
  B('os_parietale', 'crane', 'os pariétal', 'os parietale', { paired: 1, best: ['P', 'L'], sub: [
    S('tuber pariétal', 'tuber parietale'), S('ligne temporale supérieure', 'linea temporalis superior')] });
  B('os_temporale', 'crane', 'os temporal', 'os temporale', { paired: 1, best: ['L', 'P', 'A'], sub: [
    S('partie squameuse', 'pars squamosa'), S('partie pétreuse', 'pars petrosa'),
    S('processus mastoïde', 'processus mastoideus'), S('processus styloïde', 'processus styloideus'),
    S('méat acoustique externe', 'meatus acusticus externus'), S('processus zygomatique', 'processus zygomaticus')] });
  B('os_occipitale', 'crane', 'os occipital', 'os occipitale', { best: ['P', 'L'], sub: [
    S('foramen magnum', 'foramen magnum'), S('condyle occipital', 'condylus occipitalis'),
    S('protubérance occipitale externe', 'protuberantia occipitalis externa'), S('écaille occipitale', 'squama occipitalis')] });
  B('os_sphenoidale', 'crane', 'os sphénoïde', 'os sphenoidale', { best: ['L', 'A'], sub: [
    S('corps du sphénoïde', 'corpus ossis sphenoidalis'), S('grande aile', 'ala major'), S('petite aile', 'ala minor'),
    S('processus ptérygoïde', 'processus pterygoideus'), S('selle turcique', 'sella turcica')] });
  B('os_ethmoidale', 'crane', 'os ethmoïde', 'os ethmoidale', { best: ['A', 'L'], sub: [
    S('lame criblée', 'lamina cribrosa'), S('lame perpendiculaire', 'lamina perpendicularis'),
    S('crista galli', 'crista galli'), S('labyrinthe ethmoïdal', 'labyrinthus ethmoidalis'), S('lame orbitaire', 'lamina orbitalis')] });
  B('os_nasale', 'crane', 'os nasal', 'os nasale', { paired: 1, best: ['A', 'L'], old: ['os propre du nez', 'os propres du nez'] });
  B('os_lacrimale', 'crane', 'os lacrymal', 'os lacrimale', { paired: 1, best: ['A', 'L'], alt: ['os lacrimal'], old: ['unguis'], sub: [
    S('crête lacrymale postérieure', 'crista lacrimalis posterior'), S('hamulus lacrymal', 'hamulus lacrimalis')] });
  B('os_zygomaticum', 'crane', 'os zygomatique', 'os zygomaticum', { paired: 1, best: ['A', 'L'], old: ['os malaire', 'malaire'], sub: [
    S('processus frontal', 'processus frontalis'), S('processus temporal', 'processus temporalis')] });
  B('maxilla', 'crane', 'maxillaire', 'maxilla', { paired: 1, best: ['A', 'L'], alt: ['os maxillaire'], old: ['maxillaire supérieur'], sub: [
    S('corps du maxillaire', 'corpus maxillae'), S('processus frontal', 'processus frontalis'),
    S('processus zygomatique', 'processus zygomaticus'), S('processus palatin', 'processus palatinus'),
    S('processus alvéolaire', 'processus alveolaris'), S('sinus maxillaire', 'sinus maxillaris'),
    S('foramen infra-orbitaire', 'foramen infraorbitale')] });
  B('mandibula', 'crane', 'mandibule', 'mandibula', { best: ['A', 'L'], old: ['maxillaire inférieur'], sub: [
    S('corps de la mandibule', 'corpus mandibulae'), S('branche de la mandibule', 'ramus mandibulae'),
    S('angle de la mandibule', 'angulus mandibulae'), S('processus condylaire', 'processus condylaris'),
    S('processus coronoïde', 'processus coronoideus'), S('foramen mentonnier', 'foramen mentale'),
    S('protubérance mentonnière', 'protuberantia mentalis')] });
  B('os_palatinum', 'crane', 'os palatin', 'os palatinum', { paired: 1, best: ['L', 'A'], sub: [
    S('lame horizontale', 'lamina horizontalis'), S('lame perpendiculaire', 'lamina perpendicularis'),
    S('processus pyramidal', 'processus pyramidalis'), S('processus orbitaire', 'processus orbitalis'),
    S('processus sphénoïdal', 'processus sphenoidalis')] });
  B('vomer', 'crane', 'vomer', 'vomer', { best: ['A', 'L'] });
  B('concha_nasalis_inferior', 'crane', 'cornet nasal inférieur', 'concha nasalis inferior', { paired: 1, best: ['A'],
    alt: ['cornet inférieur', 'concha nasale inférieure', 'os de la conque nasale inférieure'] });

  /* ---------------- Pelvis ---------------- */
  B('os_coxae', 'pelvis', 'os coxal', 'os coxae', { paired: 1, best: ['A', 'P', 'L'], old: ['os iliaque', 'iliaque', 'os innominé'], sub: [
    S('ilium', 'os ilium'), S('ischium', 'os ischii'), S('pubis', 'os pubis'), S('acétabulum', 'acetabulum'),
    S('foramen obturé', 'foramen obturatum'), S('crête iliaque', 'crista iliaca'),
    S('épine iliaque antéro-supérieure', 'spina iliaca anterior superior'), S('tubérosité ischiatique', 'tuber ischiadicum'),
    S('grande incisure ischiatique', 'incisura ischiadica major'), S('face symphysaire', 'facies symphysialis')] });
  B('sacrum', 'pelvis', 'sacrum', 'os sacrum', { best: ['P', 'A', 'L'], sub: [
    S('promontoire', 'promontorium'), S('aile du sacrum', 'ala ossis sacri'),
    S('foramens sacraux antérieurs', 'foramina sacralia anteriora'), S('foramens sacraux postérieurs', 'foramina sacralia posteriora'),
    S('crête sacrale médiane', 'crista sacralis mediana'), S('hiatus sacral', 'hiatus sacralis')] });
  B('coccyx', 'pelvis', 'coccyx', 'os coccygis', { best: ['P', 'L'] });

  /* ---------------- Autre / squelette axial ---------------- */
  B('sternum', 'axial', 'sternum', 'sternum', { best: ['A', 'L'], sub: [
    S('manubrium sternal', 'manubrium sterni'), S('corps du sternum', 'corpus sterni'),
    S('processus xiphoïde', 'processus xiphoideus'), S('incisure jugulaire', 'incisura jugularis'),
    S('angle sternal', 'angulus sterni')] });
  B('costa', 'axial', 'côte', 'costa', { paired: 1, best: ['A', 'P', 'L'], alt: ['côtes', 'costae'], sub: [
    S('tête de la côte', 'caput costae'), S('col de la côte', 'collum costae'), S('tubercule de la côte', 'tuberculum costae'),
    S('corps de la côte', 'corpus costae'), S('angle de la côte', 'angulus costae'), S('sillon de la côte', 'sulcus costae')] });
  B('os_hyoideum', 'axial', 'os hyoïde', 'os hyoideum', { best: ['A', 'L'], sub: [
    S('corps de l\'os hyoïde', 'corpus ossis hyoidei'), S('grande corne', 'cornu majus'), S('petite corne', 'cornu minus')] });

  const BONE = {};
  BONES.forEach(b => { BONE[b.id] = b; });

  Object.assign(NS, { BONES, BONE });
})(AQ.data);
