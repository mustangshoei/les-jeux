/* ==========================================================================
   Anotehomy Quizz - engine/organs.js
   ORGANES (jeu "Les organes") : modele Z-Anatomy charge a la demande
   (js/data/organ-model.js), un objet cliquable par organe et par cote du corps
   (fabrique commune : js/engine/systems.js). Chaque organe a sa couleur
   (js/data/organs.js), sinon celle de son appareil. Le squelette est en
   decor, en transparence. Corps masculin ou feminin : les organes d'un seul
   sexe sont caches dans l'autre corps.
   ========================================================================== */
(function (NS) {
  'use strict';

  /* un materiau par couleur */
  const mats = {};
  function material(def) {
    const D = AQ.data;
    const c = (def && (def.color || (D.ORGAN_SYSTEM[def.system] || {}).c)) || 0xd8a8a0;
    if (!mats[c]) mats[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0 });
    return mats[c];
  }

  const sys = NS.makeSystem({
    model: () => AQ.data.ORGAN_MODEL, file: 'js/data/organ-model.js',
    catalog: () => AQ.data.ORGAN,
    material,
    palette: 'organ', words: 'organe',
    margin: 5                            /* conduits, nœuds lymphatiques : clic a quelques pixels pres */
  });

  Object.assign(NS, {
    ORGAN_INST: sys.INST,
    loadOrganModel: sys.load,
    activateOrgans: sys.activate,
    deactivateOrgans: sys.deactivate,
    /* appareils affiches (ensemble d'identifiants) et sexe du corps ('m' | 'f') : les organes des autres
       appareils et ceux de l'autre sexe sont caches */
    setOrganView(set, sex) {
      sys.useVariant(sex === 'f' ? 1 : 0);
      sys.setFilter(def => set.has(def.system) && (!def.sex || def.sex === sex));
    },
    peelOrgans: sys.peel,
    organsActive: sys.isActive,
    organsLoaded: sys.isLoaded,
    organInstances: sys.instances
  });
})(AQ.engine);
