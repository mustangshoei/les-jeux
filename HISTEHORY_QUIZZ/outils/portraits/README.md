# Fabrique des portraits (Python)

Scripts qui produisent `img/personnes/<id>.webp`, `js/donnees/portraits.js` et `img/CREDITS.md`.
À lancer **depuis ce dossier**, avec Python 3 et `pip install pillow numpy "opencv-python-headless<5"`
(OpenCV 5 n'a plus le détecteur de visages utilisé ici). Les images sources (`src/`, `grand/`, `alt/`,
`cand/`) ne sont pas versionnées (voir `.gitignore` à la racine) : elles se retéléchargent.

| Étape | Script | Rôle |
|---|---|---|
| 0 | (node, voir ci-dessous) | `personnes.json` : liste des personnes tirée de `js/donnees/personnes.js` |
| 1 | `f1_wiki.py .` | Wikipédia FR → élément Wikidata (année de naissance vérifiée) → image principale (P18) |
| 2 | `f2_fix.py .` | titres corrigés à la main pour les homonymies |
| 3 | `f3_dl.py .` | vignettes de 500 px + licence et auteur (Commons) → `src/` |
| 4 | `f4_conv.py ../../img/personnes` | conversion en médaillons, avec les réglages de `reglages.json` |
| 5 | `f5_portraits.py ../..` | écrit `js/donnees/portraits.js` et `img/CREDITS.md` |

```sh
node -e "global.window={};require('../../js/donnees/personnes.js');require('fs').writeFileSync('personnes.json',JSON.stringify(window.HISTEHORY.PERSONNES))"
```

**`portrait.py`** : recadrage sur le visage (OpenCV), puis « taille-douce » : lignes obliques dont
l'épaisseur suit la lumière, contours creusés, double cercle comme les médaillons de l'accueil.

**`reglages.json`**, par id : `coupe: [cx, cy, côté]` (recadrage à la main : centre en fractions de la
largeur et de la hauteur, côté en fraction de la largeur), `exclu: true` (image générique à la place),
`aucune: true` (pas d'image du tout). `wiki.json` garde, pour chaque personne, l'image Commons retenue,
sa page, sa licence et son auteur.

**Revoir et corriger** : `revue2.py ../../img/personnes planche` (planches de 60 médaillons),
`grille.py g.png id1 id2…` (sources quadrillées), `essai2.py e.png id1 id2…` (source avec le cadre
de recadrage, à côté du résultat). Autre source pour une personne : `cand.py nom "recherche Commons"`
(planche de candidats), puis `alt.py id nom numéro`.

**Images génériques** (`img/generiques/`) : gravures de Commons (`gen/meta.json`), recadrées à la main
avec `portrait.traite(…, 'lumiere', [cx, cy, côté])`. Attribution par `generique()` dans `f5_portraits.py` :
femme → dame ; politique → souverain ; militaire → guerrier ; religion, philosophie, lettres → religieux ;
sciences, médecine, société, économie, exploration → savant.
