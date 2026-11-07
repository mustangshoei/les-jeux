"""Convertit toutes les sources en médaillons : HISTEHORY_QUIZZ/img/personnes/<id>.webp"""
import sys,os,json,glob
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from portrait import traite,charge
from PIL import Image
S=os.path.dirname(os.path.abspath(__file__)); DEST=sys.argv[1]; os.makedirs(DEST,exist_ok=True)
W=json.load(open(S+'/wiki.json',encoding='utf-8'))
reg=json.load(open(S+'/reglages.json',encoding='utf-8')) if os.path.exists(S+'/reglages.json') else {}
log={}
for o in W:
    f=o.get('fichier')
    if not f or not os.path.exists(f): continue
    r=reg.get(o['id'],{})
    if r.get('exclu') or r.get('aucune'):
        if os.path.exists(DEST+'/'+o['id']+'.webp'): os.remove(DEST+'/'+o['id']+'.webp')
        continue
    try:
        out,m,v=traite(charge(f),r.get('mode'),r.get('coupe'))
        Image.fromarray(out).save(DEST+'/'+o['id']+'.webp','WEBP',quality=74,method=4); log[o['id']]=m+('V' if v else '')
    except Exception as e: print('ERR',o['id'],e)
print(len(log))
