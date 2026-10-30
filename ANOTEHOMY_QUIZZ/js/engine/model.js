/* ==========================================================================
   Anotehomy Quizz - engine/model.js
   Decode les modeles generes par tools/build-model.ps1 :
     - js/data/skeleton-model.js : squelette complet (charge au demarrage) ;
     - js/data/osteo-model.js    : os detailles de l'osteologie (charge a la
       demande, par une balise <script> : compatible avec file://) ;
     - js/data/muscle-model.js   : muscles et squelette Z-Anatomy (a la demande,
       voir js/engine/muscles.js).
   Format : base64(gzip(positions Int16 x 3 | indices Uint16 locaux a chaque
   partie | [element d'origine Uint8 par triangle])).
   ========================================================================== */
(function (NS) {
  'use strict';

  function base64ToBytes(b64) {
    const bin = atob(b64), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  /* decompression gzip native du navigateur (fonctionne aussi en file://) */
  function gunzip(bytes) {
    if (typeof DecompressionStream === 'undefined') {
      return Promise.reject(new Error('Navigateur trop ancien : DecompressionStream indisponible.'));
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).arrayBuffer();
  }

  function makeGeometry(positions, indices) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setIndex(new THREE.BufferAttribute(indices, 1));
    g.computeVertexNormals();
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }

  /* Promesse -> [{ kind, bone, side, label, positions, indices, tags }]
     kind : "b" = os cliquable, "d" = decor (cartilages costaux, dents) */
  function decode(M) {
    return gunzip(base64ToBytes(M.data)).then(buf => {
      const q = new Int16Array(buf, 0, M.vertices * 3);
      const idx = new Uint16Array(buf, M.vertices * 6, M.indices);
      const tags = M.tags ? new Uint8Array(buf, M.vertices * 6 + M.indices * 2, M.indices / 3) : null;
      const parts = [];
      let vo = 0, io = 0;
      M.parts.forEach(([kind, bone, side, label, vc, ic]) => {
        /* dequantification : entier 16 bits -> millimetres */
        const p = new Float32Array(vc * 3);
        for (let i = 0; i < vc * 3; i += 3) {
          const s = vo * 3 + i;
          p[i] = (q[s] + 32768) * M.scale + M.min[0];
          p[i + 1] = (q[s + 1] + 32768) * M.scale + M.min[1];
          p[i + 2] = (q[s + 2] + 32768) * M.scale + M.min[2];
        }
        parts.push({ kind, bone, side: side || null, label: label || null, positions: p,
          indices: idx.slice(io, io + ic), tags: tags ? tags.slice(io / 3, (io + ic) / 3) : null });
        vo += vc;
        io += ic;
      });
      return parts;
    });
  }

  /* squelette complet : parties + geometries Three.js */
  function loadModel() {
    const M = AQ.data.MODEL;
    if (!M) return Promise.reject(new Error('Modèle 3D absent (js/data/skeleton-model.js).'));
    return decode(M).then(parts => parts.map(p => Object.assign(p, { geometry: makeGeometry(p.positions, p.indices) })));
  }

  /* chargement d'un script a la demande */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Fichier introuvable : ' + src));
      document.head.appendChild(s);
    });
  }

  /* os detailles de l'osteologie, indexes par "os|cote|etiquette" (une seule fois) */
  let osteoPromise = null;
  const OSTEO = {};
  const osteoKey = (bone, side, label) => bone + '|' + (side || '') + '|' + (label || '');
  function loadOsteoModel() {
    if (!osteoPromise) {
      osteoPromise = (AQ.data.OSTEO_MODEL ? Promise.resolve() : loadScript('js/data/osteo-model.js'))
        .then(() => decode(AQ.data.OSTEO_MODEL))
        .then(parts => { parts.forEach(p => { OSTEO[osteoKey(p.bone, p.side, p.label)] = p; }); return OSTEO; })
        .catch(err => { osteoPromise = null; throw err; });
    }
    return osteoPromise;
  }

  Object.assign(NS, {
    loadModel, loadOsteoModel, makeGeometry, decodeModel: decode, loadScript,
    osteoPart: (bone, side, label) => OSTEO[osteoKey(bone, side, label)] || null,
    osteoLoaded: () => Object.keys(OSTEO).length > 0
  });
})(AQ.engine);
