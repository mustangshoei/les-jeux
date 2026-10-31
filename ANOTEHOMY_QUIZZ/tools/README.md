# Outils de construction des modeles 3D

Ces fichiers regenerent `js/data/skeleton-model.js` (le squelette 3D compresse charge par le jeu),
`js/data/osteo-model.js` (les os detailles du jeu "Osteologie descriptive", charges a la demande)
`js/data/muscle-model.js` (les muscles du jeu "Les muscles du corps humain", charges a la demande)
`js/data/vessel-model.js` (les vaisseaux du jeu "Les vaisseaux sanguins", charges a la demande)
`js/data/organ-model.js` (les organes du jeu "Les organes", charges a la demande)
et `js/data/splanchno/*.js` (un fichier par organe du jeu "Splanchnologie descriptive").
**Ils ne sont pas necessaires pour jouer** : ils servent uniquement a changer le niveau de detail
ou la liste des os, des muscles, des vaisseaux et des organes.

| Fichier | Role |
|---|---|
| `build-model.ps1` | Squelette et os detailles : telecharge BodyParts3D (une seule fois), simplifie, emballe |
| `build-muscles.ps1` | Muscles : telecharge Z-Anatomy (une seule fois), regroupe par muscle, simplifie, emballe |
| `build-vessels.ps1` | Vaisseaux : telecharge Z-Anatomy (une seule fois), regroupe par vaisseau, simplifie, emballe |
| `build-organs.ps1` | Organes : telecharge Z-Anatomy et HuBMAP (une seule fois), recale les organes feminins, regroupe par organe, simplifie, emballe |
| `build-splanchno.ps1` | Organes detailles : un fichier par organe, parties regroupees, mises a l'echelle, simplifiees |
| `GlbRead.cs` | Lecture des fichiers glTF binaires (HuBMAP), recalage, formes generees (tubes, ellipsoides) |
| `MeshBuild.cs` | Traitement en C# (compile automatiquement par PowerShell, rien a installer) |
| `FbxRead.cs` | Lecture des fichiers FBX binaires de Z-Anatomy (maillages, transformations) |
| `Visibility.cs` | Vues ou chaque muscle est visible, et muscles profonds (rendu logiciel par identifiant) |
| `bp3d-map.csv` | Table de correspondance os du jeu <-> concept BodyParts3D (une ligne par instance) |
| `osteo-map.csv` | Os detailles de l'osteologie descriptive (meme format, un os par ligne) |

## Regenerer le modele

Depuis le dossier du projet, dans PowerShell :

```powershell
powershell -ExecutionPolicy Bypass -File tools\build-model.ps1
```

Options utiles :

```powershell
# modele plus fin (environ 800 000 triangles, fichier plus lourd)
powershell -ExecutionPolicy Bypass -File tools\build-model.ps1 -Budget 800000
# modele plus leger (vieux PC, telephone)
powershell -ExecutionPolicy Bypass -File tools\build-model.ps1 -Budget 120000
```

Le premier lancement telecharge environ 140 Mo dans `%TEMP%\anotehomy-bp3d` (hors OneDrive) ;
les suivants reutilisent ce cache et prennent quelques secondes.

## Format de `bp3d-map.csv`

`bone;side;label;bp3d`

- `bone` : identifiant du catalogue `js/data/bones.js` (prefixe `#` = element decoratif non cliquable) ;
- `side` : `R` (droit), `L` (gauche) ou vide pour un os impair ;
- `label` : precision affichee au joueur (`T7`, `cote 3`, `doigt II`...) ;
- `bp3d` : nom anglais du concept dans BodyParts3D (tables `isa_element_parts.txt` ou `partof_element_parts.txt`).

Le coccyx n'a pas de ligne : il est fusionne au sacrum dans BodyParts3D et le script
le separe automatiquement (coupe a l'endroit le plus etroit de l'articulation sacro-coccygienne).

Pour ajouter une structure (par exemple une sous-structure pour un futur jeu), ajoutez une ligne
pointant vers le bon concept BodyParts3D, puis relancez le script.

## Os detailles (`osteo-map.csv`)

Meme format que `bp3d-map.csv`. Chaque ligne donne un os du jeu "Osteologie descriptive"
(l'os droit pour les os pairs, un niveau representatif pour les vertebres et les cotes).
Ces os sont moins simplifies que ceux du squelette ; leurs elements BodyParts3D d'origine
sont conserves (par triangle) pour aider le decoupage (par exemple manubrium, corps et
processus xiphoide du sternum).

Le decoupage en parties n'est pas fait ici mais dans le navigateur, au lancement d'une
partie : regles de `js/data/osteology.js` appliquees par `js/engine/segment.js`. Pour ajouter
un os, il faut donc une ligne dans `osteo-map.csv` (puis relancer le script) **et** une
definition dans `js/data/osteology.js` (meme os, meme cote, meme etiquette).

## Muscles (`build-muscles.ps1`)

```powershell
powershell -ExecutionPolicy Bypass -File tools\build-muscles.ps1
# plus de detail (fichier plus lourd)
powershell -ExecutionPolicy Bypass -File tools\build-muscles.ps1 -Budget 500000
```

Le premier lancement telecharge environ 80 Mo (systemes musculaire et squelettique de
Z-Anatomy, format FBX) dans `%TEMP%\anotehomy-zanatomy` ; les suivants prennent moins d'une minute.

La liste des muscles n'est pas dans ce dossier : c'est le catalogue `js/data/muscles.js`. Chaque
entree donne les noms des objets Z-Anatomy du muscle (sans le suffixe `.r` / `.l`) ; les chefs
et parties d'un muscle sont regroupes en un seul objet cliquable par cote du corps. Pour ajouter
un muscle : ajouter sa ligne dans `js/data/muscles.js`, puis relancer le script. Les objets
Z-Anatomy non utilises (fascias, bourses, gaines...) sont listes dans
`%TEMP%\anotehomy-zanatomy\objets-non-utilises.txt`.

- Cote du corps : suffixe Z-Anatomy (`.r` = droite du sujet) ; option `u: 1` du catalogue pour un
  muscle impair que Z-Anatomy coupe en deux moities (orbiculaire de la bouche...).
- Le squelette Z-Anatomy est ajoute en decor (non cliquable), sans les zones d'insertion
  superposees aux os.
- `Visibility.cs` rend tout le modele depuis les vues anterieure, posterieure et laterales ;
  pour chaque muscle sont notees les vues ou il se voit le mieux et la part visible. Un muscle
  presque invisible (profond) est cadre depuis la face ou il est le moins profond ; en mode
  Nommage, les muscles qui le recouvrent sont masques automatiquement.

## Vaisseaux (`build-vessels.ps1`)

```powershell
powershell -ExecutionPolicy Bypass -File tools\build-vessels.ps1
# plus de detail (fichier plus lourd)
powershell -ExecutionPolicy Bypass -File tools\build-vessels.ps1 -Budget 400000
```

Le premier lancement telecharge environ 105 Mo (systeme cardiovasculaire et squelette de
Z-Anatomy, format FBX) dans `%TEMP%\anotehomy-zanatomy` ; les suivants prennent moins d'une minute.

La liste des vaisseaux est le catalogue `js/data/vessels.js` : chaque entree donne les noms des
objets Z-Anatomy du vaisseau (sans le suffixe `.r` / `.l`) ; segments et petites branches sont
regroupes en un seul objet cliquable par cote du corps. Les objets Z-Anatomy non utilises sont
listes dans `%TEMP%\anotehomy-zanatomy\vaisseaux-non-utilises.txt`.

- Cote du corps : suffixe Z-Anatomy (`.r` = droite du sujet), sinon "Right" / "Left" dans le nom,
  sinon position du maillage ; option `u: 1` du catalogue pour un vaisseau impair (aorte, veine porte,
  arteres coronaires...).
- Les cavites du coeur et le squelette Z-Anatomy sont ajoutes en decor (non cliquables, affiches en
  transparence) ; les valves et les piliers du coeur ne sont pas repris.
- `Visibility.cs` est applique aux vaisseaux seuls (le squelette, transparent, ne cache rien) :
  un vaisseau cache par d'autres est degage automatiquement en mode Nommage.

## Organes (`build-organs.ps1`)

```powershell
powershell -ExecutionPolicy Bypass -File tools\build-organs.ps1
# plus de detail (fichier plus lourd)
powershell -ExecutionPolicy Bypass -File tools\build-organs.ps1 -Budget 450000
```

Le premier lancement telecharge environ 180 Mo (systemes visceral, lymphoide, nerveux,
cardiovasculaire et squelette de Z-Anatomy, format FBX) dans `%TEMP%\anotehomy-zanatomy` ; les
suivants prennent moins d'une minute.

La liste des organes est le catalogue `js/data/organs.js` : chaque entree donne les noms des objets
Z-Anatomy de l'organe (sans le suffixe `.r` / `.l`), pris dans n'importe lequel de ces fichiers ; les
parties d'un organe sont regroupees en un seul objet cliquable par cote du corps. Memes regles de cote
que pour les vaisseaux (option `u: 1` pour un organe impair).

- Les objets du squelette repris comme organes (cartilages du larynx et du nez, osselets) ne sont pas
  ajoutes au decor.
- Eviter les faisceaux superposes (moelle spinale) : leur fusion resiste a la simplification.
- **Organes feminins** : objets `VH_F_...` des organes de reference de la femme du Human Reference Atlas
  (HuBMAP), telecharges une seule fois (environ 210 Mo) dans `%TEMP%\anotehomy-hra`. Le bloc pelvien est
  recale par une similitude dans le plan sagittal (moindres carres sur le haut et le bas de la symphyse
  pubienne, le promontoire et la pointe du coccyx des deux modeles), puis recule de `-FemaleDz` mm ; les
  glandes mammaires (option `th: 1`) sont recalees sur la boite des poumons, puis posees a `-BreastGap`
  mm devant les cotes. Objets `#...` : organes generes (uretre feminin, clitoris, bulbes du vestibule,
  glandes vestibulaires majeures, ureteres prolonges jusqu'a la vessie feminine).
- Option `s: 'm'` ou `s: 'f'` : organe d'un seul sexe. Les vues ou chaque organe est visible sont
  calculees une fois par sexe du corps.

## Organes detailles (`build-splanchno.ps1`)

```powershell
powershell -ExecutionPolicy Bypass -File tools\build-splanchno.ps1
# seulement quelques organes
powershell -ExecutionPolicy Bypass -File tools\build-splanchno.ps1 -Only rein,coeur
# plus de detail (fichiers plus lourds)
powershell -ExecutionPolicy Bypass -File tools\build-splanchno.ps1 -Budget 60000
```

Le catalogue est `js/data/splanchnology.js` : un organe (`O`, source `'h'` HuBMAP ou `'z'` Z-Anatomy)
puis ses parties (`P`), chacune avec les noms exacts de ses objets (Z-Anatomy : suffixe `.r` / `.l`
compris ; `*` remplace n'importe quels caracteres). Option `k: 30` d'une partie (vaisseau, conduit) :
seuls ses triangles a moins de 30 mm des autres parties sont gardes. Chaque organe est centre et mis a
l'echelle (plus grande dimension : `-Size`, 220 mm), simplifie (`-Budget` triangles par organe), puis
ecrit dans `js/data/splanchno/<cle>.js` avec la licence de sa source en en-tete. Les vues ou chaque
partie est visible sont calculees entre les parties de l'organe (`Visibility.cs`).
