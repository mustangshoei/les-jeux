/* ==========================================================================
   Anotehomy Quizz - engine/vessels.js
   VAISSEAUX SANGUINS (jeu "Les vaisseaux sanguins") : modele Z-Anatomy charge
   a la demande (js/data/vessel-model.js), un objet cliquable par vaisseau et
   par cote du corps (fabrique commune : js/engine/systems.js). Arteres en
   rouge, veines en bleu (circulation pulmonaire inversee, comme dans les
   atlas). Le coeur et le squelette sont en decor, en transparence : on voit
   les vaisseaux a travers les os (crane, bassin...).
   ========================================================================== */
(function (NS) {
  'use strict';

  let mats = null;
  function materials() {
    if (!mats) {
      const std = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.45, metalness: 0 }, extra || {}));
      mats = {
        artery: std(0xc8322c, { emissive: 0x3a0806, emissiveIntensity: 0.6 }),
        vein: std(0x2f5bd0, { emissive: 0x081a40, emissiveIntensity: 0.6 }),
        heart: std(0xb4574c, { roughness: 0.6, transparent: true, opacity: 0.32, depthWrite: false })
      };
    }
    return mats;
  }

  const sys = NS.makeSystem({
    model: () => AQ.data.VESSEL_MODEL, file: 'js/data/vessel-model.js',
    catalog: () => AQ.data.VESSEL,
    /* couleur du sang : rouge (oxygene) ou bleu ; inversee pour la circulation pulmonaire */
    material: def => (def && (def.type === 'a') !== def.pulmonary) ? materials().artery : materials().vein,
    decor: kind => kind === 'c' ? materials().heart : null,
    palette: 'vessel', words: 'vaisseau',
    margin: 8                            /* vaisseaux fins : clic a quelques pixels pres */
  });

  Object.assign(NS, {
    VESSEL_INST: sys.INST,
    loadVesselModel: sys.load,
    activateVessels: sys.activate,
    deactivateVessels: sys.deactivate,
    /* 'av' (tous), 'a' (arteres seules) ou 'v' (veines seules) : les autres sont caches */
    setVesselTypes: types => sys.setFilter(def => String(types || 'av').includes(def.type)),
    peelVessels: sys.peel,
    vesselsActive: sys.isActive,
    vesselsLoaded: sys.isLoaded,
    vesselInstances: sys.instances
  });
})(AQ.engine);
