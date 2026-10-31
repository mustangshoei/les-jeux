/* ==========================================================================
   Anotehomy Quizz - engine/systems.js
   SYSTEMES ANATOMIQUES CHARGES A LA DEMANDE (vaisseaux, organes) : fabrique
   commune. Chaque systeme a son modele Z-Anatomy (js/data/*-model.js), un
   objet cliquable par element et par cote du corps, et un decor non cliquable
   (squelette en transparence, coeur...). Un seul systeme (ou les muscles,
   js/engine/muscles.js) est affiche a la fois ; le squelette du jeu 1 est
   alors masque.
   ========================================================================== */
(function (NS) {
  'use strict';

  const SYSTEMS = [];

  /* vues ou l'element est visible (tools/build-*.ps1, Visibility.cs) : "P LG;64" -> ['P', 'LG'], 64 % ;
     plusieurs variantes separees par "|" (organes : corps masculin, puis feminin) */
  function visibility(label) {
    return String(label || '').split('|').map(l => {
      const [views, pct] = l.split(';');
      return { best: views ? views.split(' ') : ['A'], vis: pct ? +pct : 100 };
    });
  }

  /* squelette en decor : tres transparent, on voit a travers */
  function ghostBone() {
    if (!NS.MAT.ghostBone) {
      NS.MAT.ghostBone = new THREE.MeshStandardMaterial({ color: 0xeadfc8, roughness: 0.9, metalness: 0, transparent: true, opacity: 0.14, depthWrite: false });
    }
    return NS.MAT.ghostBone;
  }

  /* o : {
       model    : () => donnees encodees (AQ.data.XXX_MODEL), file : fichier a charger sinon,
       catalog  : () => table des elements par identifiant (AQ.data.VESSEL...),
       material : def -> materiau de l'element au repos,
       decor    : kind -> materiau d'un decor ("d" squelette par defaut),
       palette, words : couleurs des marques et mots de l'interface (js/engine/highlight.js, input.js),
       margin   : marge de clic en pixels (elements fins) } */
  function makeSystem(o) {
    const INST = [], BY = {};
    let group = null, promise = null, active = false, box = null, filter = null;

    function build(parts) {
      group = new THREE.Group();
      group.visible = false;
      const catalog = o.catalog();
      parts.forEach(p => {
        const g = NS.makeGeometry(p.positions, p.indices);
        if (p.kind !== 'b') {
          const m = new THREE.Mesh(g, (o.decor && o.decor(p.kind)) || ghostBone());
          m.raycast = () => {};          /* decor : jamais touche par le lancer de rayon */
          m.renderOrder = p.kind === 'd' ? 1 : 2;
          group.add(m);
          return;
        }
        const def = catalog[p.bone];
        const rest = o.material(def);
        const mesh = new THREE.Mesh(g, rest);
        mesh.userData.rest = rest;
        const s = g.boundingSphere, views = visibility(p.label), v = views[0];
        const inst = { bone: p.bone, side: p.side, label: null, mesh, views,
          center: s.center.clone(), radius: s.radius, box: g.boundingBox.clone(), best: v.best, vis: v.vis };
        mesh.userData.inst = inst;
        INST.push(inst);
        (BY[p.bone] = BY[p.bone] || []).push(inst);
        group.add(mesh);
      });
      box = new THREE.Box3().setFromObject(group);
      NS.addObject(group);
    }

    /* chargement unique */
    function load() {
      if (!promise) {
        promise = (o.model() ? Promise.resolve() : NS.loadScript(o.file))
          .then(() => NS.decodeModel(o.model()))
          .then(parts => { build(parts); return INST; })
          .catch(err => { promise = null; throw err; });
      }
      return promise;
    }

    /* elements affiches : ceux que garde le filtre (def -> booleen) ; les autres sont caches et ne sont
       pas cliquables (« Tout afficher » ne les fait pas reapparaitre) */
    function setFilter(f) {
      filter = f || null;
      const shown = [];
      const catalog = o.catalog();
      INST.forEach(i => {
        const ok = !filter || filter(catalog[i.bone]);
        i.mesh.visible = ok;
        if (ok) shown.push(i.mesh);
      });
      if (active) NS.setPick(shown);
      NS.requestRender();
    }

    function activate() {
      if (!group || active) return;
      NS.deactivateMuscles();
      deactivateSystems(sys);
      active = true;
      NS.closeBone();
      NS.clearMarks(); NS.setHover(null);
      NS.showAll();
      NS.isolate({ center: new THREE.Vector3(), radius: 0 }, false);
      group.visible = true;
      NS.setPick(INST.filter(i => i.mesh.visible).map(i => i.mesh));
      NS.setPickMargin(o.margin || 0);
      NS.setViewBox(box);
      NS.setHidingAllowed(true);
      NS.setMarkPalette(o.palette);
      NS.setObjectWords(o.words);
      NS.requestRender();
    }
    function deactivate() {
      if (!active) return;
      setFilter(null);
      active = false;
      NS.clearMarks(); NS.setHover(null);
      NS.showAll();                       /* elements masques (Maj + clic) : liste videe */
      group.visible = false;
      NS.restoreSkeleton();
      NS.setPick(null);
      NS.setPickMargin(0);
      NS.setViewBox(null);
      NS.setMarkPalette('default');
      NS.setObjectWords('os');
      NS.requestRender();
    }

    const sys = {
      INST, load, activate, deactivate, setFilter,
      /* element recouvert par d'autres : ceux-ci sont masques (js/engine/muscles.js, peelAmong) */
      peel: (inst, key) => NS.peelAmong(inst, key, INST),
      /* variante de visibilite (0 : la premiere ; organes : 1 = corps feminin) */
      useVariant: k => INST.forEach(i => { const v = i.views[k] || i.views[0]; i.best = v.best; i.vis = v.vis; }),
      isActive: () => active,
      isLoaded: () => INST.length > 0,
      instances: id => BY[id] || []
    };
    SYSTEMS.push(sys);
    return sys;
  }

  /* desactive tous les systemes (sauf "except") */
  function deactivateSystems(except) { SYSTEMS.forEach(s => { if (s !== except) s.deactivate(); }); }
  /* autre affichage exclusif (organe isole : js/engine/splanchno.js), ferme avec les systemes */
  function registerSystem(s) { SYSTEMS.push(s); }

  Object.assign(NS, { makeSystem, deactivateSystems, registerSystem });
})(AQ.engine);
