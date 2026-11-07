"""alt.py id cand idx [id cand idx ...] : remplace la source d'une personne par un candidat (cand/<cand>.json)."""
import json,urllib.request,urllib.parse,time,re,html,os,sys
UA={'User-Agent':'HistehoryQuizz/0.1 (jeu educatif personnel; contact via github.com/mustangshoei)'}
os.makedirs('alt',exist_ok=True)
W=json.load(open('wiki.json',encoding='utf-8')); D={o['id']:o for o in W}
a=sys.argv[1:]
for k,c,i in zip(a[0::3],a[1::3],a[2::3]):
    t=json.load(open(f'cand/{c}.json',encoding='utf-8'))[int(i)][0]
    d=json.load(urllib.request.urlopen(urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','format':'json','titles':t,'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':1000}),headers=UA)))
    ii=list(d['query']['pages'].values())[0]['imageinfo'][0]; m=ii['extmetadata']
    s=lambda x: html.unescape(re.sub('<[^>]+>','',m.get(x,{}).get('value',''))).strip()[:200]
    f=os.path.abspath(f'alt/{k}.jpg'); open(f,'wb').write(urllib.request.urlopen(urllib.request.Request(ii.get('thumburl') or ii['url'],headers=UA)).read())
    D[k].update(image=t[5:],page=ii['descriptionurl'],licence=s('LicenseShortName'),auteur=s('Artist'),fichier=f)
    print(k,D[k]['licence'],D[k]['auteur'][:60]); time.sleep(1)
json.dump(W,open('wiki.json','w',encoding='utf-8'),ensure_ascii=False,indent=0)
