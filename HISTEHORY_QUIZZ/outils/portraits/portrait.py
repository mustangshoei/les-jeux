"""Photo, tableau, buste ou gravure -> médaillon en traits blancs sur fond transparent (style de l'accueil)."""
import cv2, numpy as np, sys, os, json
from PIL import Image
OUT=256; R=110
casc=[cv2.CascadeClassifier(cv2.data.haarcascades+n) for n in ('haarcascade_frontalface_default.xml','haarcascade_profileface.xml')]
sm=lambda a,b,x: (lambda t: t*t*(3-2*t))(np.clip((x-a)/(b-a),0,1))
def charge(f):
    im=Image.open(f)
    if im.mode in ('RGBA','LA','P'):
        im=im.convert('RGBA'); bg=Image.new('RGBA',im.size,(255,255,255,255)); bg.alpha_composite(im); im=bg
    return np.array(im.convert('RGB'))
def visage(g):
    h,w=g.shape; best=None
    g2=cv2.equalizeHist(g)
    for c in casc:
        for im,mn in ((g,5),(g2,5),(g,3)):
            fs=c.detectMultiScale(im,1.08,mn,minSize=(int(min(h,w)*.07),)*2)
            for f in fs:
                if best is None or f[2]>best[2]: best=f
            if best is not None: break
        if best is not None: break
    return best
def coupe(rgb,f=None):
    h,w=rgb.shape[:2]; g=cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY)
    v=visage(g)
    if v is not None:
        x,y,fw,fh=v; cx=x+fw/2; cy=y+fh*.62; s=fw*2.3
    else:
        s=min(w,h)*(.85 if h<=w*1.15 else .9); cx=w/2; cy=min(h*.42,s/2+h*.04) if h>w*1.15 else h/2
    s=min(s,w,h); x0=int(np.clip(cx-s/2,0,w-s)); y0=int(np.clip(cy-s/2,0,h-s)); s=int(s)
    return rgb[y0:y0+s,x0:x0+s], v is not None
def gravure_source(rgb):
    hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV); sat=hsv[...,1].mean()/255
    L=cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY)/255.
    mid=((L>.28)&(L<.72)).mean()   # une gravure est faite de traits et de papier : peu de gris moyens
    return sat<.12 and np.percentile(L,55)>.62 and (L<.35).mean()>.04 and mid<.32
def traite(rgb, mode=None, manuel=None):
    if manuel:  # [cx, cy, cote] en fractions de la largeur (cx, cote) et de la hauteur (cy)
        h,w=rgb.shape[:2]; s=int(min(manuel[2]*w,w,h)); x0=int(np.clip(manuel[0]*w-s/2,0,w-s)); y0=int(np.clip(manuel[1]*h-s/2,0,h-s))
        c,vis=rgb[y0:y0+s,x0:x0+s],True
    else: c,vis=coupe(rgb)
    D=2*R
    c=cv2.resize(c,(D,D),interpolation=cv2.INTER_AREA)
    if mode is None: mode='lumiere'   # « encre » prenait des photos noir et blanc pour des gravures (négatifs)
    yy,xx=np.mgrid[0:D,0:D]+.5; dist=np.hypot(xx-R,yy-R); dans=dist<=R
    if mode=='encre':
        L=c.max(axis=2).astype(float)
        P=np.percentile(L[dans],90); K=np.percentile(L[dans],.5)
        a=sm(.2,.72,(P-L)/max(1,P-K))
    else:
        g=cv2.cvtColor(c,cv2.COLOR_RGB2GRAY)
        g=cv2.createCLAHE(2.0,(4,4)).apply(g).astype(float)
        lo,hi=np.percentile(g[dans],(4,99)); L=np.clip((g-lo)/max(1,hi-lo),0,1)
        # taille-douce : lignes obliques dont l'épaisseur suit la lumière, contours creusés
        Ls=cv2.GaussianBlur(L,(0,0),1.0)
        per=3.4; u=((xx*.87+yy*.5)/per)%1; larg=np.clip(Ls**1.1*1.05,0,1)
        hach=sm(-.18,.18,larg/2-np.abs(u-.5)+ .0)  # trait centré
        hach=np.maximum(hach, sm(.82,.97,Ls))     # hautes lumières pleines
        e1=cv2.GaussianBlur(g,(0,0),1.0); e2=cv2.GaussianBlur(g,(0,0),1.6)
        dog=(e2-e1)/255.; bord=sm(.012,.05,dog)
        a=hach*(1-.85*bord)*sm(.03,.12,Ls)
    a=a*sm(0,2.5,R-dist)
    out=np.zeros((OUT,OUT,4),np.uint8); out[...,:3]=255
    o=(OUT-D)//2; al=np.zeros((OUT,OUT)); al[o:o+D,o:o+D]=a
    # double cercle
    Y,X=np.mgrid[0:OUT,0:OUT]+.5; d=np.hypot(X-OUT/2,Y-OUT/2)
    ring=lambda r,lw: np.clip(lw/2+.5-np.abs(d-r),0,1)
    al=np.maximum(al,.9*np.maximum(ring(R+3,2.5),ring(R+7.5,1)))
    out[...,3]=np.round(al*255).astype(np.uint8)
    return out,mode,vis
if __name__=='__main__':
    src,dst=sys.argv[1],sys.argv[2]
    o,m,v=traite(charge(src)); Image.fromarray(o).save(dst,'WEBP',quality=78,method=6); print(m,v)
