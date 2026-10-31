# Crédits et licences

## Modèle anatomique 3D : BodyParts3D

Le squelette et les os détaillés affichés dans les jeux proviennent de **BodyParts3D** :

> BodyParts3D, (c) The Database Center for Life Science licensed under CC Attribution 4.0 International

- Source : https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html (version 4.0, fichiers OBJ, arbre IS-A)
- Licence : [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- Modifications apportées pour ce projet (`tools/build-model.ps1`) :
  - sélection des os du squelette (et des cartilages costaux et des dents, purement décoratifs) ;
  - séparation du coccyx, fusionné au maillage du sacrum dans BodyParts3D
    (coupe au niveau de l'articulation sacro-coccygienne) ;
  - simplification des maillages (environ 568 000 -> 300 000 triangles) ;
  - changement de repère, quantification 16 bits, compression gzip.
- Jeu « Ostéologie descriptive » (`js/data/osteo-model.js`) : 53 os représentatifs, moins
  simplifiés (environ 196 000 triangles au total), découpés en parties anatomiques dans le
  navigateur (`js/engine/segment.js`, `js/data/osteology.js`). Ce découpage est une
  approximation pédagogique réalisée pour ce projet ; il ne fait pas partie de BodyParts3D.

## Modèle anatomique 3D des muscles : Z-Anatomy

Les muscles du jeu « Les muscles du corps humain » (et le squelette affiché avec eux) proviennent
de **Z-Anatomy**, atlas anatomique 3D libre, lui-même dérivé de BodyParts3D :

- Source : https://github.com/LluisV/Z-Anatomy (branche `PC-Version`,
  `Resources/Models/FBX/MuscularSystem100.fbx` et `SkeletalSystem100.fbx`)
- Licence : [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/)
- Modifications apportées pour ce projet (`tools/build-muscles.ps1`) :
  - regroupement des maillages par muscle (chefs et parties réunis, un objet par côté du corps),
    selon le catalogue `js/data/muscles.js` (194 muscles, noms TA2 en français) ;
  - squelette en décor, sans les zones d'origine et d'insertion superposées aux os ;
  - simplification des maillages (environ 360 000 triangles au total), quantification 16 bits,
    compression gzip ;
  - calcul des vues où chaque muscle est visible (`tools/Visibility.cs`).
- En conséquence, **`js/data/muscle-model.js` est distribué sous la même licence CC BY-SA 4.0**
  (partage dans les mêmes conditions, avec cette attribution).

## Modèle anatomique 3D des vaisseaux sanguins : Z-Anatomy

Les vaisseaux du jeu « Les vaisseaux sanguins » (avec le cœur et le squelette affichés en transparence)
proviennent aussi de **Z-Anatomy** :

- Source : https://github.com/LluisV/Z-Anatomy (branche `PC-Version`,
  `Resources/Models/FBX/CardioVascular41.fbx` et `SkeletalSystem100.fbx`)
- Licence : [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/)
- Modifications apportées pour ce projet (`tools/build-vessels.ps1`) :
  - regroupement des maillages par vaisseau (segments et petites branches réunis, un objet par côté du
    corps), selon le catalogue `js/data/vessels.js` (279 vaisseaux, noms TA2 en français) ;
  - cavités du cœur et squelette en décor ; valves et piliers du cœur non repris ;
  - simplification des maillages (environ 300 000 triangles au total), quantification 16 bits,
    compression gzip ;
  - calcul des vues où chaque vaisseau est visible (`tools/Visibility.cs`).
- En conséquence, **`js/data/vessel-model.js` est distribué sous la même licence CC BY-SA 4.0**
  (partage dans les mêmes conditions, avec cette attribution).

## Modèle anatomique 3D des organes : Z-Anatomy

Les organes du jeu « Les organes » (avec le squelette affiché en transparence) proviennent aussi de
**Z-Anatomy** :

- Source : https://github.com/LluisV/Z-Anatomy (branche `PC-Version`, `Resources/Models/FBX/` :
  `VisceralSystem100.fbx`, `LymphoidOrgans100.fbx`, `NervousSystem100.fbx`, `CardioVascular41.fbx`
  (cavités et valves du cœur) et `SkeletalSystem100.fbx` (cartilages du larynx et du nez, osselets,
  squelette))
- Licence : [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/)
- Modifications apportées pour ce projet (`tools/build-organs.ps1`) :
  - regroupement des maillages par organe (parties réunies, un objet par côté du corps), selon le
    catalogue `js/data/organs.js` (noms TA2 en français) ; la moelle spinale est représentée par sa
    seule substance blanche ;
  - squelette en décor ;
  - simplification des maillages (environ 340 000 triangles au total), quantification 16 bits,
    compression gzip ;
  - calcul des vues où chaque organe est visible (`tools/Visibility.cs`).
- En conséquence, **`js/data/organ-model.js` est distribué sous la même licence CC BY-SA 4.0**
  (partage dans les mêmes conditions, avec cette attribution).

## Organes de référence de la femme : Human Reference Atlas (HuBMAP)

Les organes féminins du jeu « Les organes » et la plupart des organes de la « Splanchnologie
descriptive » (duodénum et pancréas, gros intestin, poumons, rein, vessie, utérus et annexes, glande
mammaire, rate, nœud lymphatique, cœur, bulbe de l'œil) proviennent du **Human Reference Atlas** du
programme HuBMAP :

- Kristen Browne et Heidi Schlehlein, Human Reference Atlas / HuBMAP, *3D Reference Organ Set for
  Female v1.5* (2023), construit à partir du Visible Human Female (National Library of Medicine) ;
  nœud lymphatique : modèle de Yao inclus dans cet ensemble.
- Source : https://lod.humanatlas.io/ref-organ/united-female/v1.5 (fichier `3d-vh-f-united.glb`),
  DOI https://doi.org/10.48539/HBM352.BTSQ.586
- Licence : [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- Modifications apportées pour ce projet :
  - « Les organes » (`tools/build-organs.ps1`) : organes génitaux féminins, vessie et glandes mammaires
    recalés sur le modèle Z-Anatomy (similitude dans le plan sagittal ajustée sur la symphyse pubienne,
    le promontoire et le coccyx des deux modèles ; glandes mammaires : boîte des poumons, puis posées
    devant les côtes), regroupés par organe, simplifiés ; ils sont rangés dans `js/data/organ-model.js` ;
  - « Splanchnologie descriptive » (`tools/build-splanchno.ps1`) : regroupement des maillages par partie
    (catalogue `js/data/splanchnology.js`), vaisseaux coupés près de l'organe, centrage et mise à
    l'échelle, simplification, quantification 16 bits, compression gzip (`js/data/splanchno/*.js`,
    même licence CC BY 4.0, avec cette attribution).

Organes générés pour ce projet (absents des deux modèles) : clitoris, bulbes du vestibule, glandes
vestibulaires majeures, urètre féminin et raccord des uretères à la vessie féminine (formes simples :
tubes et ellipsoïdes, `tools/GlbRead.cs` et `tools/build-organs.ps1`).

## Splanchnologie descriptive : Z-Anatomy

Le foie (segments), le larynx, la trachée et les bronches, l'encéphale (hémisphère, tronc cérébral et
cervelet, noyaux gris et ventricules), l'oreille et les organes génitaux masculins de la « Splanchnologie
descriptive » viennent de **Z-Anatomy** (mêmes fichiers et même licence CC BY-SA 4.0 que ci-dessus) ;
leurs fichiers `js/data/splanchno/*.js` sont donc distribués sous licence **CC BY-SA 4.0**. Chaque
fichier indique sa source et sa licence en en-tête.

## Planches du menu

Images figées des chapitres du menu, rendues une fois pour toutes dans le navigateur à partir des
modèles ci-dessus (fond transparent, recadrage) :

- `img/chapitre-corps.webp` (squelette de face) et `img/chapitre-langue.webp` (crâne de trois quarts) :
  rendus de **BodyParts3D**, CC BY 4.0 (attribution ci-dessus) ;
- `img/chapitre-vie.webp` (écorché de face) : rendu de **Z-Anatomy**, donc distribué sous la même
  licence **CC BY-SA 4.0** (attribution ci-dessus).

La trame du fond (`img/trame.svg` : tracés cardiaques et globules) a été dessinée pour ce projet.

## Polices

Dans `css/polices/` (fichiers WOFF2, sous-ensembles latin et latin étendu) :

- **Bricolage Grotesque**, Copyright 2022 The Bricolage Grotesque Project Authors
  (https://github.com/ateliertriay/bricolage) ;
- **IBM Plex Mono**, Copyright © 2017 IBM Corp. with Reserved Font Name "Plex" (https://github.com/IBM/plex).

Licence : [SIL Open Font License 1.1](https://openfontlicense.org) ; texte complet dans
`css/polices/OFL-BricolageGrotesque.txt` et `css/polices/OFL-IBMPlexMono.txt`.

## Bibliothèque de rendu 3D : Three.js

- `js/vendor/three.min.js`, version r158 : https://threejs.org
- Licence : MIT, Copyright (c) 2010-2023 Three.js Authors

## Algorithmes

- Simplification des maillages : `tools/MeshBuild.cs` adapte l'algorithme *Fast Quadric Mesh
  Simplification* de Sven Forstmann (licence MIT), lui-même fondé sur la métrique d'erreur
  quadrique de Garland et Heckbert (1997).
- Lissage des os détaillés : subdivision de Loop (Charles Loop, 1987), implémentée dans
  `js/engine/segment.js`.
