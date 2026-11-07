import sys,json
from PIL import Image,ImageDraw
from portrait import traite,charge
W={o['id']:o for o in json.load(open('wiki.json',encoding='utf-8'))}; R=json.load(open('reglages.json'))
ids=sys.argv[2:]; T=200; cols=4; rows=(len(ids)+cols-1)//cols
sh=Image.new('RGB',(cols*2*T,rows*(T+14)),(51,35,13)); dr=ImageDraw.Draw(sh)
for i,k in enumerate(ids):
    r=R.get(k,{}); x,y=(i%cols)*2*T,(i//cols)*(T+14); rgb=charge(W[k]['fichier']); h,w=rgb.shape[:2]
    src=Image.fromarray(rgb); sc=min(T/w,T/h); src=src.resize((int(w*sc),int(h*sc))); d=ImageDraw.Draw(src)
    c=r.get('coupe')
    if c:
        s=min(c[2]*w,w,h); x0=min(max(c[0]*w-s/2,0),w-s); y0=min(max(c[1]*h-s/2,0),h-s)
        d.rectangle([x0*sc,y0*sc,(x0+s)*sc,(y0+s)*sc],outline=(255,0,0),width=2)
    for j in range(1,10): d.line([(0,src.height*j/10),(6,src.height*j/10)],fill=(255,0,0)); d.line([(src.width*j/10,0),(src.width*j/10,6)],fill=(255,0,0))
    sh.paste(src,(x,y)); dr.text((x+3,y+T),k[:26],fill=(255,220,150))
    if r.get('exclu') or r.get('aucune'): continue
    o,m,v=traite(rgb,r.get('mode'),c); im=Image.fromarray(o).resize((T,T)); sh.paste(im,(x+T,y),im)
sh.save(sys.argv[1])
