import json,sys
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
UP='/mnt/user-data/uploads/'
WALK=UP+'0eae18c5-image.png'; MEL=UP+'f2e41fd9-image.png'
S_MEL=float(sys.argv[1]) if len(sys.argv)>1 else 0.8
CELL=256; BASE=232
def prep(f):
    im=Image.open(f).convert('RGB');a=np.array(im).astype(int)
    mg=(a[...,0]>190)&(a[...,1]<110)&(a[...,2]>190)
    # soft fringe: pinkish pixels adjacent to magenta
    near=ndi.binary_dilation(mg,iterations=2)
    pink=(a[...,0]>170)&(a[...,2]>150)&(a[...,1]<130)&(a[...,0]-a[...,1]>70)&(a[...,2]-a[...,1]>50)
    purple=(a[...,1]<np.minimum(a[...,0],a[...,2])-28)&(a[...,0]>110)&(a[...,2]>110)
    mg=mg|(near&pink)|(ndi.binary_dilation(mg,iterations=6)&purple)
    return a,~mg
def comps(fg,minarea=1500):
    lab,n=ndi.label(ndi.binary_dilation(fg,iterations=3))
    out=[]
    for i,sl in enumerate(ndi.find_objects(lab)):
        if (sl[0].stop-sl[0].start)*(sl[1].stop-sl[1].start)>minarea: out.append((i+1,sl))
    return lab,out
def cut(a,fg,lab,i,sl):
    m=(lab[sl]==i)&fg[sl]
    rgba=np.zeros(m.shape+(4,),np.uint8);rgba[...,:3]=np.clip(a[sl],0,255);rgba[...,3]=m*255
    sub=a[sl];br=sub.mean(-1);sat=sub.max(-1)-sub.min(-1)
    body=m&~((br>165)&(sat<45))
    ys,xs=np.where(body)
    feet=ys.max();cx=(xs.min()+xs.max())/2
    return Image.fromarray(rgba),feet,cx
def place(img,feet,cx,scale):
    if scale!=1: 
        img2=img.resize((max(1,round(img.width*scale)),max(1,round(img.height*scale))),Image.NEAREST);feet*=scale;cx*=scale
    else: img2=img
    cv=Image.new('RGBA',(CELL,CELL),(0,0,0,0))
    ox=round(CELL/2-cx);oy=round(BASE-feet)
    cv.alpha_composite(img2,(max(0,ox),max(0,oy))) if ox>=0 and oy>=0 else cv.paste(img2,(ox,oy),img2)
    return cv
meta={}
# walk
a,fg=prep(WALK);lab,cs=comps(fg)
cs=sorted(cs,key=lambda c:(c[1][0].start,c[1][1].start))
grid=[c for c in cs if c[1][0].start<1070]
assert len(grid)==30,len(grid)
rows=[sorted(grid[r*6:(r+1)*6],key=lambda c:c[1][1].start) for r in range(5)]
frames={}
for r,row in enumerate(rows):
    for k,(i,sl) in enumerate(row):
        img,feet,cx=cut(a,fg,lab,i,sl);frames[f'walk_{r}_{k}']=place(img,feet,cx,1.0)
# 倒地(身体+刀合并) 头像
extra=[c for c in cs if c[1][0].start>=1070]
big=[c for c in extra if (c[1][0].stop-c[1][0].start)*(c[1][1].stop-c[1][1].start)>20000]
# head portrait = component starting around x>=200 ; 倒地 = x<200 with sword fragment below
port=[c for c in extra if c[1][1].start>=200][0]
img=Image.fromarray(np.dstack([np.clip(a[port[1]],0,255).astype(np.uint8),((lab[port[1]]==port[0])&fg[port[1]])*255]).astype(np.uint8));img.save('portrait.png')
fall=[c for c in extra if c[1][1].start<200]
y0=min(c[1][0].start for c in fall);y1=max(c[1][0].stop for c in fall);x0=min(c[1][1].start for c in fall);x1=max(c[1][1].stop for c in fall)
fm=fg[y0:y1,x0:x1].copy()
# only pixels belonging to fall comps
mm=np.zeros(fm.shape,bool)
for i,sl in fall: mm|=(lab[y0:y1,x0:x1]==i)&fm
rg=np.dstack([np.clip(a[y0:y1,x0:x1],0,255).astype(np.uint8),(mm*255).astype(np.uint8)]);Image.fromarray(rg).save('fall.png')
# melee
a,fg=prep(MEL);lab,cs=comps(fg)
cs=sorted(cs,key=lambda c:(c[1][0].start//150,c[1][1].start))
cs=sorted(cs,key=lambda c:(round((c[1][0].start+c[1][0].stop)/2/290),c[1][1].start))
mel=[c for c in cs if (c[1][0].stop+c[1][0].start)/2<860]
fx=[c for c in cs if (c[1][0].stop+c[1][0].start)/2>=860]
assert len(mel)==15 and len(fx)==3,(len(mel),len(fx))
poses=['raise','fore','back']
byrow=[]
ys=sorted(mel,key=lambda c:(c[1][0].start+c[1][0].stop)/2)
for p in range(3):
    row=sorted(ys[p*5:(p+1)*5],key=lambda c:c[1][1].start)
    for d,(i,sl) in enumerate(row):
        img,feet,cx=cut(a,fg,lab,i,sl);frames[f'{poses[p]}_{d}']=place(img,feet,cx,S_MEL)
fxs=sorted(fx,key=lambda c:c[1][1].start)
for n,(i,sl) in zip(['fx270','fx180f','fx180b'],fxs):
    m=(lab[sl]==i)&fg[sl];rg=np.dstack([np.clip(a[sl],0,255).astype(np.uint8),(m*255).astype(np.uint8)]);Image.fromarray(rg).save(n+'.png')
# atlas
names=[f'walk_{r}_{k}' for r in range(5) for k in range(6)]+[f'{p}_{d}' for p in poses for d in range(5)]
cols=6;rowsN=(len(names)+cols-1)//cols
atlas=Image.new('RGBA',(cols*CELL,rowsN*CELL),(0,0,0,0))
for n,name in enumerate(names): atlas.paste(frames[name],((n%cols)*CELL,(n//cols)*CELL))
atlas.save('hero_atlas.png')
json.dump({'cell':CELL,'base':BASE,'cols':cols,'names':names,'melScale':S_MEL},open('hero_atlas.json','w'))
# preview on checker
bg=Image.new('RGBA',atlas.size,(60,90,60,255));bg.alpha_composite(atlas);bg.convert('RGB').save('preview.png')
print('ok',len(names))
