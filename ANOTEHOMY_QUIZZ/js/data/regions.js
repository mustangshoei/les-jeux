/* ==========================================================================
   Anotehomy Quizz - data/regions.js
   Zones du corps proposees dans la prephase.
   ========================================================================== */
(function (NS) {
  'use strict';

  const REGIONS = [
    { id: 'mi', name: 'Membre inférieur' },
    { id: 'ms', name: 'Membre supérieur' },
    { id: 'vert', name: 'Vertèbres' },
    { id: 'crane', name: 'Crâne' },
    { id: 'pelvis', name: 'Pelvis' },
    { id: 'axial', name: 'Autre / Squelette axial' }
  ];
  const REGION = {};
  REGIONS.forEach(r => { REGION[r.id] = r; });

  Object.assign(NS, { REGIONS, REGION });
})(AQ.data);
