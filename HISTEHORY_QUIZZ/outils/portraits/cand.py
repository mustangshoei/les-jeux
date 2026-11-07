import json,urllib.request,urllib.parse,sys,time,os,io
from PIL import Image,ImageDraw
UA={'User-Agent':'HistehoryQuizz/0.1 (jeu educatif personnel; contact via github.com/mustangshoei)'}
def get(u):
    for i in range(6):
        try: return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60).read()
        except Exception as e: time.sleep(4*(i+1))
os.makedirs('cand',exist_ok=True)
nom=sys.argv[1]; res=[]
for q in sys.argv[2:]:
    d=json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','format':'json','generator':'search','gsrnamespace':6,'gsrlimit':10,'gsrsearch':q+' filetype:bitmap','prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':300})))
    for p in (d or {}).get('query',{}).get('pages',{}).values():
        ii=p['imageinfo'][0]; res.append((p['title'],ii['thumburl'],ii['extmetadata'].get('LicenseShortName',{}).get('value','?')))
    time.sleep(1)
T=200; cols=6; rows=(len(res)+cols-1)//cols
sh=Image.new('RGB',(cols*T,rows*(T+14)),(30,30,30)); dr=ImageDraw.Draw(sh)
json.dump(res,open(f'cand/{nom}.json','w',encoding='utf-8'),ensure_ascii=False,indent=0)
for i,(t,u,l) in enumerate(res):
    b=get(u); time.sleep(.4)
    if not b: continue
    im=Image.open(io.BytesIO(b)).convert('RGB'); im.thumbnail((T,T)); x,y=(i%cols)*T,(i//cols)*(T+14)
    sh.paste(im,(x,y)); dr.text((x+2,y+T),f'{i} {l[:10]}',fill=(255,220,150))
sh.save(f'cand/{nom}.png'); print(nom,len(res))
