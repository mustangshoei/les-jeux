import json,urllib.request,urllib.parse,time,re,sys
S=sys.argv[1]
UA={'User-Agent':'HistehoryQuizz/0.1 (jeu educatif personnel; contact via github.com/mustangshoei)'}
def get(url,params):
    u=url+'?'+urllib.parse.urlencode(params)
    for i in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30) as r: return json.load(r)
        except Exception as e: print('retry',e); time.sleep(3*(i+1))
P=json.load(open(S+'/personnes.json',encoding='utf-8'))
def clean(n): return re.sub(r'\s*\(.*?\)','',n).strip()
res={}
def lookup(titles):
    d=get('https://fr.wikipedia.org/w/api.php',{'action':'query','format':'json','titles':'|'.join(titles),'redirects':1,'prop':'pageprops','ppprop':'wikibase_item'})
    q=d['query']; m={t:t for t in titles}
    for k in ('normalized','redirects'):
        for x in q.get(k,[]):
            for t,v in m.items():
                if v==x['from']: m[t]=x['to']
    pages={p['title']:p for p in q['pages'].values()}
    return {t:pages.get(v,{}).get('pageprops',{}).get('wikibase_item') for t,v in m.items()}
names={p['id']:clean(p['nom']) for p in P}
ids=list(names)
for i in range(0,len(ids),50):
    ch=ids[i:i+50]; r=lookup([names[x] for x in ch])
    for x in ch: res[x]=r.get(names[x])
# wikidata: check birth year, get P18
qs=[q for q in res.values() if q]
wd={}
for i in range(0,len(qs),50):
    d=get('https://www.wikidata.org/w/api.php',{'action':'wbgetentities','format':'json','ids':'|'.join(qs[i:i+50]),'props':'claims|labels','languages':'fr'})
    for q,e in d['entities'].items():
        c=e.get('claims',{})
        def val(p):
            try: return c[p][0]['mainsnak']['datavalue']['value']
            except: return None
        b=val('P569'); y=None
        if b: y=int(re.match(r'([+-]\d+)',b['time']).group(1))
        wd[q]={'naissance':y,'image':val('P18'),'humain':any(x['mainsnak'].get('datavalue',{}).get('value',{}).get('id')=='Q5' for x in c.get('P31',[]))}
out=[]
for p in P:
    q=res[p['id']]; w=wd.get(q,{})
    ok=bool(q) and w.get('humain') and (w.get('naissance') is None or abs(w['naissance']-p['naissance'])<=15)
    out.append({'id':p['id'],'nom':p['nom'],'q':q,'wd_naissance':w.get('naissance'),'image':w.get('image'),'ok':ok})
json.dump(out,open(S+'/wiki.json','w',encoding='utf-8'),ensure_ascii=False,indent=0)
bad=[o for o in out if not o['ok']]
print('total',len(out),'ok',len(out)-len(bad),'avec image',sum(1 for o in out if o['ok'] and o['image']))
for o in bad: print('KO',o['id'],o['nom'],o['q'],o['wd_naissance'])
