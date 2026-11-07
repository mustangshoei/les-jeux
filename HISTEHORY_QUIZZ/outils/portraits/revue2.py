import sys,os,json
from PIL import Image,ImageDraw
D=sys.argv[1]; out=sys.argv[2]
P=[p['id'] for p in json.load(open(os.path.dirname(os.path.abspath(__file__))+'/personnes.json',encoding='utf-8'))]
fs=[D+'/'+i+'.webp' for i in P if os.path.exists(D+'/'+i+'.webp')]
T=150; cols=10; per=60
for k in range(0,len(fs),per):
    ch=fs[k:k+per]; rows=(len(ch)+cols-1)//cols
    sh=Image.new('RGB',(cols*T,rows*(T+14)),(51,35,13)); dr=ImageDraw.Draw(sh)
    for i,f in enumerate(ch):
        im=Image.open(f).resize((T,T)); x,y=(i%cols)*T,(i//cols)*(T+14)
        sh.paste(im,(x,y),im); dr.text((x+3,y+T),os.path.basename(f)[:-5][:24],fill=(255,220,150))
    sh.save(f'{out}{k//per}.png')
print(len(fs))
