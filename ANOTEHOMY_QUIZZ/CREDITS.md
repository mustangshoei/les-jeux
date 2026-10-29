# Credits et licences

## Modele anatomique 3D : BodyParts3D

Le squelette et les os detailles affiches dans les jeux proviennent de **BodyParts3D** :

> BodyParts3D, (c) The Database Center for Life Science licensed under CC Attribution 4.0 International

- Source : https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html (version 4.0, fichiers OBJ, arbre IS-A)
- Licence : [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- Modifications apportees pour ce projet (`tools/build-model.ps1`) :
  - selection des os du squelette (et des cartilages costaux et des dents, purement decoratifs) ;
  - separation du coccyx, fusionne au maillage du sacrum dans BodyParts3D
    (coupe au niveau de l'articulation sacro-coccygienne) ;
  - simplification des maillages (environ 568 000 -> 300 000 triangles) ;
  - changement de repere, quantification 16 bits, compression gzip.
- Jeu "Osteologie descriptive" (`js/data/osteo-model.js`) : 53 os representatifs, moins
  simplifies (environ 196 000 triangles au total), decoupes en parties anatomiques dans le
  navigateur (`js/engine/segment.js`, `js/data/osteology.js`). Ce decoupage est une
  approximation pedagogique realisee pour ce projet ; il ne fait pas partie de BodyParts3D.

## Modele anatomique 3D des muscles : Z-Anatomy

Les muscles du jeu "Les muscles du corps humain" (et le squelette affiche avec eux) proviennent
de **Z-Anatomy**, atlas anatomique 3D libre, lui-meme derive de BodyParts3D :

- Source : https://github.com/LluisV/Z-Anatomy (branche `PC-Version`,
  `Resources/Models/FBX/MuscularSystem100.fbx` et `SkeletalSystem100.fbx`)
- Licence : [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/)
- Modifications apportees pour ce projet (`tools/build-muscles.ps1`) :
  - regroupement des maillages par muscle (chefs et parties reunis, un objet par cote du corps),
    selon le catalogue `js/data/muscles.js` (194 muscles, noms TA2 en francais) ;
  - squelette en decor, sans les zones d'origine et d'insertion superposees aux os ;
  - simplification des maillages (environ 360 000 triangles au total), quantification 16 bits,
    compression gzip ;
  - calcul des vues ou chaque muscle est visible (`tools/Visibility.cs`).
- En consequence, **`js/data/muscle-model.js` est distribue sous la meme licence CC BY-SA 4.0**
  (partage dans les memes conditions, avec cette attribution).

## Bibliotheque de rendu 3D : Three.js

- `js/vendor/three.min.js`, version r158 : https://threejs.org
- Licence : MIT, Copyright (c) 2010-2023 Three.js Authors

## Algorithmes

- Simplification des maillages : `tools/MeshBuild.cs` adapte l'algorithme *Fast Quadric Mesh
  Simplification* de Sven Forstmann (licence MIT), lui-meme fonde sur la metrique d'erreur
  quadrique de Garland et Heckbert (1997).
- Lissage des os detailles : subdivision de Loop (Charles Loop, 1987), implementee dans
  `js/engine/segment.js`.
