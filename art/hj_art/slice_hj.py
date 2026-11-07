import json
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
im=Image.open('sheet_src.png').convert('RGB');a=np.array(im).astype(int)
bg=(a[...,1]>170)&(a[...,0]<120)&(a[...,2]<120)&(a[...,1]-a[...,0]>90)
fg=~bg
# edge fringe: fg pixels next to bg that are green-tinted
edge=fg&ndi.binary_dilation(bg,iterations=2)
gt=a[...,1]-np.maximum(a[...,0],a[...,2])
fg=fg&~(edge&(gt>22))
lab,n=ndi.label(ndi.binary_dilation(fg,iterations=2))
comps=[]
for i,sl in enumerate(ndi.find_objects(lab)):
    if (sl[0].stop-sl[0].start)*(sl[1].stop-sl[1].start)>150: comps.append((i+1,sl))
rowof=lambda c:(c[1][0].start+c[1][0].stop)//2
rows=[[],[],[],[],[],[]]
for c in comps:
    r=5 if rowof(c)>=620 else min(4,rowof(c)//125); rows[r].append(c)
CELL=224;BASE=196;COLS=16
atlas=Image.new('RGBA',(COLS*CELL,5*CELL),(0,0,0,0))
area=lambda c:(c[1][0].stop-c[1][0].start)*(c[1][1].stop-c[1][1].start)
xc=lambda c:(c[1][1].start+c[1][1].stop)/2
for r in range(5):
    anc=sorted(sorted(rows[r],key=area,reverse=True)[:COLS],key=xc)
    assert len(anc)==COLS,(r,len(anc))
    groups=[[c] for c in anc]
    for c in rows[r]:
        if c in anc: continue
        j=min(range(COLS),key=lambda j:abs(xc(anc[j])-xc(c)));groups[j].append(c)
    for k,g in enumerate(groups):
        y0=min(c[1][0].start for c in g);y1=max(c[1][0].stop for c in g);x0=min(c[1][1].start for c in g);x1=max(c[1][1].stop for c in g)
        pad=3;y0=max(0,y0-pad);x0=max(0,x0-pad);y1=min(a.shape[0],y1+pad);x1=min(a.shape[1],x1+pad)
        m=np.zeros((y1-y0,x1-x0),bool)
        for c in g: m|=(lab[y0:y1,x0:x1]==c[0])
        m&=fg[y0:y1,x0:x1]
        am=np.zeros_like(m);ay0,ay1,ax0,ax1=g[0][1][0].start-y0,g[0][1][0].stop-y0,g[0][1][1].start-x0,g[0][1][1].stop-x0
        am[max(0,ay0):ay1,max(0,ax0):ax1]=m[max(0,ay0):ay1,max(0,ax0):ax1]
        ys,xs=np.where(am);fy=ys.max()
        if k<=12:
            low=ys>fy-12;cx=xs[low].mean()
        else:
            ys2,xs2=np.where(m);cx=(xs2.min()+xs2.max())/2
        sub=a[y0:y1,x0:x1].copy()
        sub[...,1]=np.minimum(sub[...,1],np.maximum(sub[...,0],sub[...,2])+8)
        rgba=np.zeros(m.shape+(4,),np.uint8);rgba[...,:3]=np.clip(sub,0,255);rgba[...,3]=m*255
        t=Image.fromarray(rgba)
        ox=round(CELL/2-cx);oy=round(BASE-fy)
        assert ox>=0 and oy>=0 and ox+t.width<=CELL and oy+t.height<=CELL,(r,k,ox,oy,t.size)
        atlas.alpha_composite(t,(k*CELL+ox,r*CELL+oy))
# portrait
p=rows[5][0];sl=p[1];pm=(lab[sl]==p[0])&fg[sl]
sub=a[sl].copy();sub[...,1]=np.minimum(sub[...,1],np.maximum(sub[...,0],sub[...,2])+8)
rg=np.zeros(pm.shape+(4,),np.uint8);rg[...,:3]=np.clip(sub,0,255);rg[...,3]=pm*255
Image.fromarray(rg).save('portrait.png')
K=0.31
sm=atlas.resize((round(atlas.width*K),round(atlas.height*K)),Image.LANCZOS)
arr=np.array(sm);al=arr[...,3]>128
arr[...,3]=al*255;arr[~al,:3]=0
# 1px dark outline
ring=ndi.binary_dilation(al,structure=np.ones((3,3),bool))&~al
arr[ring]=[22,14,8,255]
sm=Image.fromarray(arr)
atlas=sm
q=atlas.quantize(colors=96,method=Image.FASTOCTREE,dither=Image.NONE)
q.save('hj_atlas_q.png',optimize=True)
atlas.save('hj_atlas.png')
CELL=round(CELL*K);BASE=round(BASE*K)
json.dump({'cell':CELL,'base':BASE,'cols':COLS,'rows':5,'dirs':['E','SE','S','NE','N'],'acts':{'run':[0,8],'wind':[8,10],'strike':[10,12],'hit':[12,13],'die':[13,16]}},open('hj_atlas.json','w'))
bg2=Image.new('RGBA',atlas.size,(70,100,70,255));bg2.alpha_composite(atlas);bg2.convert('RGB').save('/tmp/hj/prev.png')
print('ok',atlas.size)
