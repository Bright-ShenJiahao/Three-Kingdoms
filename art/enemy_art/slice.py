import json,sys
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
UP='/mnt/user-data/uploads/'
ACT=UP+'68107551-image.png'; WALK=UP+'122899ec-image.png'
S_ACT=float(sys.argv[1]) if len(sys.argv)>1 else 0.93
CELL=300; BASE=272
def prep(f):
    im=Image.open(f).convert('RGB');a=np.array(im).astype(int)
    mg=(a[...,0]>190)&(a[...,1]<110)&(a[...,2]>190)
    near=ndi.binary_dilation(mg,iterations=2)
    pink=(a[...,0]>170)&(a[...,2]>150)&(a[...,1]<130)&(a[...,0]-a[...,1]>70)&(a[...,2]-a[...,1]>50)
    purple=(a[...,1]<np.minimum(a[...,0],a[...,2])-28)&(a[...,0]>110)&(a[...,2]>110)
    mg=mg|(near&pink)|(ndi.binary_dilation(mg,iterations=6)&purple)
    return a,~mg
def comps(fg,minarea=2500):
    lab,n=ndi.label(ndi.binary_dilation(fg,iterations=3))
    return lab,[(i+1,sl) for i,sl in enumerate(ndi.find_objects(lab)) if (sl[0].stop-sl[0].start)*(sl[1].stop-sl[1].start)>minarea]
def cut(a,fg,lab,idxs,sl):
    m=np.zeros(fg[sl].shape,bool)
    for i in idxs: m|=(lab[sl]==i)
    m&=fg[sl]
    rgba=np.zeros(m.shape+(4,),np.uint8);rgba[...,:3]=np.clip(a[sl],0,255);rgba[...,3]=m*255
    sub=a[sl];br=sub.mean(-1);sat=sub.max(-1)-sub.min(-1)
    body=m&~((br>165)&(sat<45))
    ys,xs=np.where(body)
    return Image.fromarray(rgba),ys.max(),(xs.min()+xs.max())/2
def place(img,feet,cx,scale):
    if scale!=1:
        img=img.resize((max(1,round(img.width*scale)),max(1,round(img.height*scale))),Image.LANCZOS);feet*=scale;cx*=scale
    cv=Image.new('RGBA',(CELL,CELL),(0,0,0,0))
    ox=round(CELL/2-cx);oy=round(BASE-feet)
    assert ox>=0 and oy>=0 and ox+img.width<=CELL and oy+img.height<=CELL,(ox,oy,img.size)
    cv.alpha_composite(img,(ox,oy));return cv
frames={}
a,fg=prep(WALK);lab,cs=comps(fg);assert len(cs)==30,len(cs)
cs=sorted(cs,key=lambda c:(round((c[1][0].start)/228),c[1][1].start))
for r in range(5):
    for k in range(6):
        i,sl=cs[r*6+k];img,feet,cx=cut(a,fg,lab,[i],sl);frames[f'walk_{r}_{k}']=place(img,feet,cx,1.0)
a,fg=prep(ACT);lab,cs=comps(fg,2000)
big=[c for c in cs if (c[1][0].stop-c[1][0].start)>140 or (c[1][1].stop-c[1][1].start)>200]
cs=sorted(cs,key=lambda c:(c[1][0].start+c[1][0].stop)/2)
rows=[[c for c in cs if (c[1][0].start+c[1][0].stop)/2<300],
      [c for c in cs if 300<=(c[1][0].start+c[1][0].stop)/2<520],
      [c for c in cs if 520<=(c[1][0].start+c[1][0].stop)/2<780]]
print([len(r) for r in rows])
poses=['raise','strike','hit']
for p in range(3):
    row=sorted(rows[p],key=lambda c:c[1][1].start);assert len(row)==5
    for d,(i,sl) in enumerate(row):
        img,feet,cx=cut(a,fg,lab,[i],sl);frames[f'{poses[p]}_{d}']=place(img,feet,cx,S_ACT)
last=[c for c in cs if (c[1][0].start+c[1][0].stop)/2>=780]
# fly = leftmost incl. sword fragment; dead = rightmost big
last=sorted(last,key=lambda c:c[1][1].start)
fly=[c for c in last if c[1][1].start<300]
dead=[c for c in last if c[1][1].start>=300]
def union(cl):
    y0=min(c[1][0].start for c in cl);y1=max(c[1][0].stop for c in cl);x0=min(c[1][1].start for c in cl);x1=max(c[1][1].stop for c in cl)
    return (slice(y0,y1),slice(x0,x1)),[c[0] for c in cl]
sl,ids=union(fly);img,feet,cx=cut(a,fg,lab,ids,sl);frames['fly']=place(img,img.height,cx,S_ACT)
sl,ids=union(dead);img,feet,cx=cut(a,fg,lab,ids,sl);frames['dead']=place(img,img.height,cx,S_ACT)
names=[f'walk_{r}_{k}' for r in range(5) for k in range(6)]+[f'{p}_{d}' for p in poses for d in range(5)]+['fly','dead']
cols=6;rowsN=(len(names)+cols-1)//cols
atlas=Image.new('RGBA',(cols*CELL,rowsN*CELL),(0,0,0,0))
for n,name in enumerate(names): atlas.paste(frames[name],((n%cols)*CELL,(n//cols)*CELL))
atlas.save('enemy_atlas.png')
json.dump({'cell':CELL,'base':BASE,'cols':cols,'names':names,'actScale':S_ACT},open('enemy_atlas.json','w'))
bg=Image.new('RGBA',atlas.size,(60,90,60,255));bg.alpha_composite(atlas);bg.convert('RGB').save('preview.png')
print('ok',len(names),atlas.size)
