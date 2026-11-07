import json
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
def load(f):
    a=np.array(Image.open(f).convert('RGB')).astype(int)
    bg=(a[...,0]>170)&(a[...,2]>170)&(a[...,1]<110)
    fg=~bg
    edge=fg&ndi.binary_dilation(bg,iterations=2)
    mt=np.minimum(a[...,0],a[...,2])-a[...,1]
    fg=fg&~(edge&(mt>40))
    lab,n=ndi.label(ndi.binary_dilation(fg,iterations=2))
    comps=[(i+1,sl) for i,sl in enumerate(ndi.find_objects(lab)) if (sl[0].stop-sl[0].start)*(sl[1].stop-sl[1].start)>300]
    return a,fg,lab,comps
def crop(a,fg,lab,g):
    y0=min(c[1][0].start for c in g);y1=max(c[1][0].stop for c in g);x0=min(c[1][1].start for c in g);x1=max(c[1][1].stop for c in g)
    m=np.zeros((y1-y0,x1-x0),bool)
    for c in g: m|=(lab[y0:y1,x0:x1]==c[0])
    m&=fg[y0:y1,x0:x1]
    sub=a[y0:y1,x0:x1].copy()
    # despill magenta
    sub[...,0]=np.minimum(sub[...,0],sub[...,1]+60);sub[...,2]=np.minimum(sub[...,2],sub[...,1]+60)
    rgba=np.zeros(m.shape+(4,),np.uint8);rgba[...,:3]=np.clip(sub,0,255);rgba[...,3]=m*255
    ys,xs=np.where(m)
    return Image.fromarray(rgba),ys.max(),xs
def rowsplit(comps,n,per):
    # cluster by y centre into n rows
    cs=sorted(comps,key=lambda c:(c[1][0].start+c[1][0].stop)/2)
    big=sorted(cs,key=lambda c:-(c[1][0].stop-c[1][0].start)*(c[1][1].stop-c[1][1].start))
    return big
# walk sheet: 5 rows x 6
a,fg,lab,comps=load('walk_src.png')
area=lambda c:(c[1][0].stop-c[1][0].start)*(c[1][1].stop-c[1][1].start)
yc=lambda c:(c[1][0].start+c[1][0].stop)/2
xc=lambda c:(c[1][1].start+c[1][1].stop)/2
def grid(comps,R,C,ncell):
    anc=sorted(comps,key=area,reverse=True)[:ncell]
    ys=sorted(yc(c) for c in anc)
    anc=sorted(anc,key=yc)
    rows=[sorted(anc[i*C:(i+1)*C],key=xc) for i in range(R)]
    return rows
W=grid(comps,5,6,30)
walk=[[crop(a,fg,lab,[c]) for c in r] for r in W]
a2,fg2,lab2,comps2=load('act_src.png')
anc=sorted(comps2,key=area,reverse=True)[:17]
anc=sorted(anc,key=yc)
# rows by y: 5,5,5,2
rows=[sorted(anc[0:5],key=xc),sorted(anc[5:10],key=xc),sorted(anc[10:15],key=xc),sorted(anc[15:17],key=xc)]
# attach smalls (swords etc) to nearest anchor
groups={id(c):[c] for c in anc}
for c in comps2:
    if c in anc: continue
    j=min(anc,key=lambda b:(xc(b)-xc(c))**2+(yc(b)-yc(c))**2);groups[id(j)].append(c)
act=[[crop(a2,fg2,lab2,groups[id(c)]) for c in r] for r in rows]
# scale: front standing height match
wh=np.mean([walk[2][k][0].height for k in range(6)])
hh=act[2][2][0].height  # hit front, upright
ratio=wh/hh
print('ratio',ratio,wh,hh)
CELL=300;BASE=262;COLS=11
atlas=Image.new('RGBA',(COLS*CELL,5*CELL),(0,0,0,0))
def put(img,fy,xs,col,row,s):
    t=img;nw,nh=round(t.width*s),round(t.height*s)
    t=t.resize((nw,nh),Image.LANCZOS);fy=fy*s
    cx=(xs.min()+xs.max())/2*s
    ox=round(CELL/2-cx);oy=round(BASE-fy)
    ox=max(0,min(CELL-nw,ox));oy=max(0,min(CELL-nh,oy))
    atlas.alpha_composite(t,(col*CELL+ox,row*CELL+oy))
for r in range(5):
    for k in range(6):
        t,fy,xs=walk[r][k];put(t,fy,xs,k,r,1)
    for j,col in enumerate((6,7,8)):
        t,fy,xs=act[j][r];put(t,fy,xs,col,r,ratio)
for j,col in enumerate((9,10)):
    t,fy,xs=act[3][j];put(t,fy,xs,col,0,ratio)
K=0.185
sm=atlas.resize((round(atlas.width*K),round(atlas.height*K)),Image.LANCZOS)
arr=np.array(sm);al=arr[...,3]>128
arr[...,3]=al*255;arr[~al,:3]=0
ring=ndi.binary_dilation(al,structure=np.ones((3,3),bool))&~al
arr[ring]=[22,14,8,255]
sm=Image.fromarray(arr)
sm.quantize(colors=96,method=Image.FASTOCTREE,dither=Image.NONE).save('hj3_atlas_q.png',optimize=True)
json.dump({'cell':round(CELL*K),'base':round(BASE*K),'cols':COLS,'rows':5,'nrun':6,'wind':6,'strike':7,'hit':8,'fly':9,'dead':10},open('hj3_atlas.json','w'))
bg2=Image.new('RGBA',sm.size,(70,100,70,255));bg2.alpha_composite(sm);bg2.convert('RGB').save('/tmp/hj3prev.png');print(sm.size)
