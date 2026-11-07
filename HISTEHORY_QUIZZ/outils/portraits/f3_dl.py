import json,urllib.request,urllib.parse,time,sys,os,re,html
S=sys.argv[1]; os.makedirs(S+'/src',exist_ok=True)
UA={'User-Agent':'HistehoryQuizz/0.1 (jeu educatif personnel; contact via github.com/mustangshoei)'}
def req(u):
    for i in range(8):
        try:
            with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60) as r: return r.read()
        except Exception as e:
            print('retry',e); time.sleep(5*(i+1))
W=json.load(open(S+'/wiki.json',encoding='utf-8'))
todo=[o for o in W if o['ok'] and o['image']]
strip=lambda s: html.unescape(re.sub('<[^>]+>','',s or '')).strip()
for i in range(0,len(todo),50):
    ch=todo[i:i+50]
    d=json.loads(req('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','format':'json','titles':'|'.join('File:'+o['image'] for o in ch),'prop':'imageinfo','iiprop':'url|extmetadata|size|mime','iiurlwidth':500})))
    q=d['query']; norm={x['to']:x['from'] for x in q.get('normalized',[])}
    info={}
    for p in q['pages'].values():
        if 'imageinfo' in p: info[norm.get(p['title'],p['title'])]=p['imageinfo'][0]
    for o in ch:
        ii=info.get('File:'+o['image'])
        if not ii: print('pas info',o['id']); continue
        m=ii.get('extmetadata',{})
        o['licence']=strip(m.get('LicenseShortName',{}).get('value'))
        o['auteur']=strip(m.get('Artist',{}).get('value'))[:200]
        o['page']=ii.get('descriptionurl'); o['thumb']=ii.get('thumburl')
for o in todo:
    if not o.get('thumb'): continue
    ext=os.path.splitext(o['thumb'])[1].lower() or '.jpg'
    f=S+'/src/'+o['id']+ext; o['fichier']=f
    if os.path.exists(f): continue
    b=req(o['thumb'])
    if b: open(f,'wb').write(b)
    time.sleep(0.3)
json.dump(W,open(S+'/wiki.json','w',encoding='utf-8'),ensure_ascii=False,indent=0)
from collections import Counter
print(len(os.listdir(S+'/src')),Counter(o.get('licence') for o in todo).most_common(30))
