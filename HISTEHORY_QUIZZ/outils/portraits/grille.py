"""Planche des sources avec une grille (dixièmes) pour choisir les recadrages à la main."""
import sys,json
from PIL import Image,ImageDraw
from portrait import charge
W={o['id']:o for o in json.load(open('wiki.json',encoding='utf-8'))}
ids=sys.argv[2:]; T=300; cols=5; rows=(len(ids)+cols-1)//cols
sh=Image.new('RGB',(cols*T,rows*(T+16)),(20,20,20)); dr=ImageDraw.Draw(sh)
for i,k in enumerate(ids):
    im=Image.fromarray(charge(W[k]['fichier'])); im.thumbnail((T,T)); w,h=im.size
    x,y=(i%cols)*T,(i//cols)*(T+16); sh.paste(im,(x,y)); 
    for j in range(1,10):
        c=(255,60,60) if j==5 else (0,200,255)
        dr.line([(x+w*j/10,y),(x+w*j/10,y+h)],fill=c,width=1); dr.line([(x,y+h*j/10),(x+w,y+h*j/10)],fill=c,width=1)
    dr.text((x+3,y+T+2),f'{k} {w}x{h}',fill=(255,220,150))
sh.save(sys.argv[1])
