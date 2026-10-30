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
