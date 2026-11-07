import json
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
import os
SRC=os.path.join(os.path.dirname(os.path.abspath(__file__)),'sheet_src.png')
im=Image.open(SRC).convert('RGB');a=np.array(im).astype(int)
mg=(a[...,0]>170)&(a[...,2]>170)&(a[...,1]<120)
near=ndi.binary_dilation(mg,iterations=2)
pink=(a[...,0]>150)&(a[...,2]>130)&(a[...,1]<140)&(a[...,0]-a[...,1]>60)&(a[...,2]-a[...,1]>40)
purple=(a[...,1]<np.minimum(a[...,0],a[...,2])-30)&(a[...,0]>120)&(a[...,2]>120)
mg=mg|(near&pink)|(ndi.binary_dilation(mg,iterations=3)&purple)
fg=~mg
lab,n=ndi.label(ndi.binary_dilation(fg,iterations=4))
objs=[]
for i,sl in enumerate(ndi.find_objects(lab)):
    if ((lab[sl]==i+1)&fg[sl]).sum()>40: objs.append((i+1,sl))
def cy(o):return (o[1][0].start+o[1][0].stop)/2
def cx(o):return (o[1][1].start+o[1][1].stop)/2
objs.sort(key=cy)
bands=[[objs[0]]]
for o in objs[1:]:
    if cy(o)-np.mean([cy(x) for x in bands[-1]])>60: bands.append([o])
    else: bands[-1].append(o)
assert [len(b) for b in bands]==[6]*5+[5]*3+[1],[len(b) for b in bands]
CELL=256;BASE=232
names=[f'walk_{r}_{k}' for r in range(5) for k in range(6)]+[f'{p}_{d}' for p in ('raise','fore','back') for d in range(5)]
frames={};hs=[]
def cut(o):
    i,sl=o;m=(lab[sl]==i)&fg[sl]
    sub=np.clip(a[sl],0,255).astype(np.uint8)
    rgba=np.dstack([sub,(m*255).astype(np.uint8)])
    br=sub.astype(int).mean(-1);sat=sub.astype(int).max(-1)-sub.astype(int).min(-1)
    body=m&~((br>150)&(sat<55))
    ys,xs=np.where(body)
    feet=ys.max();top=ys.min()
    sel=ys<top+(feet-top)*0.45
    c=xs[sel].mean()
    return Image.fromarray(rgba),feet,c,feet-top
for bi,b in enumerate(bands[:8]):
    b=sorted(b,key=cx)
    for k,o in enumerate(b):
        img,feet,c,h=cut(o);hs.append(h)
        name=names[bi*6+k] if bi<5 else names[30+(bi-5)*5+k]
        cv=Image.new('RGBA',(CELL,CELL),(0,0,0,0))
        ox=round(CELL/2-c);oy=round(BASE-feet)
        assert ox>=0 and oy>=0 and ox+img.width<=CELL and oy+img.height<=CELL,(name,ox,oy,img.size)
        cv.alpha_composite(img,(ox,oy));frames[name]=cv
# portrait
i,sl=bands[8][0];m=(lab[sl]==i)&fg[sl];sub=np.clip(a[sl],0,255).astype(np.uint8)
Image.fromarray(np.dstack([sub,(m*255).astype(np.uint8)])).save('portrait.png')
cols=6;rows=(len(names)+cols-1)//cols
atlas=Image.new('RGBA',(cols*CELL,rows*CELL),(0,0,0,0))
for n,nm in enumerate(names): atlas.paste(frames[nm],((n%cols)*CELL,(n//cols)*CELL))
atlas.save('hero_atlas.png')
q=atlas.quantize(colors=200,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE)
# keep alpha binary
al=np.array(atlas)[...,3];qa=q.convert('RGBA');arr=np.array(qa);arr[...,3]=np.where(al>127,255,0);Image.fromarray(arr).save('hero_atlas_q.png')
json.dump({'cell':CELL,'base':BASE,'cols':cols,'names':names},open('hero_atlas.json','w'))
bg=Image.new('RGBA',atlas.size,(70,100,60,255));bg.alpha_composite(atlas);bg.convert('RGB').save('preview.png')
print('ok',len(names),'body h median',int(np.median(hs)),min(hs),max(hs))
