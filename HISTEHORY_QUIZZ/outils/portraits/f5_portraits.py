"""Écrit js/donnees/portraits.js et img/CREDITS.md à partir des images présentes."""
import json,os,sys
S=os.path.dirname(os.path.abspath(__file__)); J=sys.argv[1]
W={o['id']:o for o in json.load(open(S+'/wiki.json',encoding='utf-8'))}
P=json.load(open(S+'/personnes.json',encoding='utf-8'))
G=json.load(open(S+'/gen/meta.json',encoding='utf-8'))
def generique(p):
    d=p['domaine']
    if p['sexe']=='F': return 'dame'
    if d=='politique': return 'souverain'
    if d=='militaire': return 'guerrier'
    if d in ('religion','philosophie','litterature'): return 'religieux'
    if d in ('sciences','medecine','societe','economie','exploration'): return 'savant'
    return 'religieux'
lignes=[]; n=0; gen={}
REG=json.load(open(S+'/reglages.json'))
for p in P:
    if REG.get(p['id'],{}).get('aucune'):
        lignes.append(f'    {json.dumps(p["id"])}: null,   // volontairement sans image'); continue
    if os.path.exists(f"{J}/img/personnes/{p['id']}.webp"): f=f"personnes/{p['id']}.webp"; n+=1
    else: g=generique(p); f=f"generiques/{g}.webp"; gen.setdefault(g,[]).append(p['nom'])
    lignes.append(f'    {json.dumps(p["id"])}: {json.dumps(f)},')
js=f'''/* ==========================================================================
   Histehory Quizz - js/donnees/portraits.js
   PORTRAITS DES PERSONNES (fichier GÉNÉRÉ : voir « Portraits » dans le README du jeu).
   --------------------------------------------------------------------------
   id de la personne (js/donnees/personnes.js) -> image, relative au dossier img/ :
     personnes/<id>.webp   portrait propre, en médaillon de traits blancs ({n} personnes) ;
     generiques/<type>.webp  image générique (souverain, dame, guerrier, religieux, savant),
                             quand aucun portrait libre n'a été trouvé ou retenu ;
     null                    aucune image (Mahomet : pas de représentation figurée).
   Sources, auteurs et licences : img/CREDITS.md.
   ========================================================================== */
(function () {{
  'use strict';
  const PORTRAITS = {{
{chr(10).join(lignes)}
  }};
  const H = window.HISTEHORY = window.HISTEHORY || {{}};
  H.PORTRAITS = PORTRAITS;
}})();
'''
open(J+'/js/donnees/portraits.js','w',encoding='utf-8',newline='\n').write(js)
esc=lambda s:(s or 'voir la page source').replace('|','/').replace('\n',' ')
md=['# Portraits — sources et crédits','',
'Les médaillons de `img/personnes/` et `img/generiques/` sont tirés d\'images de **Wikimedia Commons**',
'(l\'image principale de chaque personne sur Wikidata), recadrées puis converties en traits blancs sur',
'fond transparent, dans le style des images de la page d\'accueil. Chaque image garde la licence de sa',
'source : domaine public ou CC0 pour la plupart ; pour les licences CC BY et CC BY-SA, l\'auteur est',
'cité ci-dessous, et l\'image transformée est diffusée sous la même licence.','',
'## Images génériques','','| Image | Source | Auteur | Licence |','|---|---|---|---|']
for k,m in G.items(): md.append(f"| `generiques/{k}.webp` | [{esc(m['titre'][5:])}]({m['page']}) | {esc(m['auteur'])} | {esc(m['licence'])} |")
md+=['','Personnes qui reçoivent une image générique : '+'; '.join(f"**{k}** : "+', '.join(v) for k,v in gen.items())+'.','',
'## Portraits','','| Image | Personne | Source | Auteur | Licence |','|---|---|---|---|---|']
for p in P:
    if not os.path.exists(f"{J}/img/personnes/{p['id']}.webp"): continue
    o=W[p['id']]
    md.append(f"| `{p['id']}.webp` | {p['nom']} | [{esc(o['image'])}]({o.get('page')}) | {esc(o.get('auteur'))[:120]} | {esc(o.get('licence'))} |")
open(J+'/img/CREDITS.md','w',encoding='utf-8',newline='\n').write('\n'.join(md)+'\n')
print('portraits',n,'generiques',sum(len(v) for v in gen.values()))
