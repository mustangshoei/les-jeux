import json,urllib.request,urllib.parse,time,sys,re
S=sys.argv[1]
UA={'User-Agent':'HistehoryQuizz/0.1 (jeu educatif personnel; contact via github.com/mustangshoei)'}
def get(url,params):
    u=url+'?'+urllib.parse.urlencode(params)
    for i in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30) as r: return json.load(r)
        except Exception as e: time.sleep(5*(i+1))
T={'cyrus-2':'Cyrus II','hipparque':'Hipparque (astronome)','brutus':'Marcus Junius Brutus','agrippa':'Marcus Vipsanius Agrippa',
'claude':'Claude (empereur romain)','trung-trac':'Trưng Trắc','himiko':'Himiko','mani':'Mani (prophète)','zenobie':'Zénobie',
'constantin-1':'Constantin Ier (empereur romain)','aryabhata':'Aryabhata','theodora':'Théodora (impératrice, morte en 548)',
'khadija':'Khadija bint Khuwaylid','shotoku':'Shōtoku Taishi','pakal':'Pakal le Grand','fatima-al-fihri':'Fatima al-Fihri',
'al-biruni':'Al-Biruni','le-cid':'Le Cid','heloise':"Héloïse (abbesse)",'fibonacci':'Leonardo Fibonacci','raphael':'Raphaël (peintre)',
'marguerite-navarre':"Marguerite d'Angoulême",'francois-1':'François Ier (roi de France)','elisabeth-1':"Élisabeth Ire (reine d'Angleterre)",
'henri-4':'Henri IV (roi de France)','francis-bacon':'Francis Bacon (philosophe)','galilee':'Galilée (savant)','kosem':'Kösem',
'pierre-le-grand':'Pierre Ier le Grand','marie-therese':"Marie-Thérèse d'Autriche (1717-1780)",'marie-antoinette':"Marie-Antoinette d'Autriche",
'chaka':'Chaka (roi zoulou)','victoria':'Victoria (reine du Royaume-Uni)','lakshmibai':'Lakshmibai','meiji':'Meiji (empereur)','che-guevara':'Che Guevara'}
d={}
ks=list(T)
for i in range(0,len(ks),50):
    r=get('https://fr.wikipedia.org/w/api.php',{'action':'query','format':'json','titles':'|'.join(T[k] for k in ks[i:i+50]),'redirects':1,'prop':'pageprops','ppprop':'wikibase_item'})
    q=r['query']; m={k:T[k] for k in ks}
    for kk in ('normalized','redirects'):
        for x in q.get(kk,[]):
            for k,v in m.items():
                if v==x['from']: m[k]=x['to']
    pages={p['title']:p for p in q['pages'].values()}
    for k in ks: d[k]=pages.get(m[k],{}).get('pageprops',{}).get('wikibase_item')
qs=[q for q in d.values() if q]
r=get('https://www.wikidata.org/w/api.php',{'action':'wbgetentities','format':'json','ids':'|'.join(qs),'props':'claims|labels|descriptions','languages':'fr'})['entities']
W=json.load(open(S+'/wiki.json',encoding='utf-8'))
for o in W:
    if o['ok']: continue
    k=o['id']; q=d.get(k) or o['q']
    if k not in T: q=o['q']
    e=r.get(q) if q else None
    if e is None and q:
        e=get('https://www.wikidata.org/w/api.php',{'action':'wbgetentities','format':'json','ids':q,'props':'claims|labels|descriptions','languages':'fr'})['entities'][q]
    if not e: print('??',k); continue
    c=e.get('claims',{})
    try: img=c['P18'][0]['mainsnak']['datavalue']['value']
    except: img=None
    hum=any(x['mainsnak'].get('datavalue',{}).get('value',{}).get('id')=='Q5' for x in c.get('P31',[]))
    print(k,'|',q,'|',e.get('labels',{}).get('fr',{}).get('value'),'|',e.get('descriptions',{}).get('fr',{}).get('value'),'| hum',hum,'|',img)
    o.update(q=q,image=img,ok=hum,desc=e.get('descriptions',{}).get('fr',{}).get('value'))
json.dump(W,open(S+'/wiki.json','w',encoding='utf-8'),ensure_ascii=False,indent=0)
