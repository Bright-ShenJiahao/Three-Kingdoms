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
    r=min(5,rowof(c)//125 if rowof(c)<620 else 5); rows[r].append(c)
CELL=192;BASE=168;COLS=14
atlas=Image.new('RGBA',(COLS*CELL,5*CELL),(0,0,0,0))
names=[]
for r in range(5):
    row=sorted(rows[r],key=lambda c:c[1][1].start)
    assert len(row)==15,(r,len(row))
    # merge sword fragment (index 12) into frame 11
    groups=[[c] for c in row[:11]]+[[row[11],row[12]]]+[[row[13]],[row[14]]]
    assert len(groups)==14
    RG=max(c[1][0].stop for g in groups[:11] for c in g)
    for k,g in enumerate(groups):
        y0=min(c[1][0].start for c in g);y1=max(c[1][0].stop for c in g);x0=min(c[1][1].start for c in g);x1=max(c[1][1].stop for c in g)
        pad=3;y0=max(0,y0-pad);x0=max(0,x0-pad);y1=min(a.shape[0],y1+pad);x1=min(a.shape[1],x1+pad)
        m=np.zeros((y1-y0,x1-x0),bool)
        for c in g: m|=(lab[y0:y1,x0:x1]==c[0])
        m&=fg[y0:y1,x0:x1]
        ys,xs=np.where(m)
        # feet = bottom of mask ; x anchor = centroid of lowest rows (standing) else bbox center
        fy=ys.max()
        if k<=10:
            low=ys>fy-12; cx=xs[low].mean() if k!=6 and k!=7 else xs[low].mean()
        else: cx=(xs.min()+xs.max())/2
        sub=a[y0:y1,x0:x1].copy()
        # despill
        mx=np.maximum(sub[...,0],sub[...,2])+8
        sub[...,1]=np.minimum(sub[...,1],mx)
        rgba=np.zeros(m.shape+(4,),np.uint8);rgba[...,:3]=np.clip(sub,0,255);rgba[...,3]=m*255
        t=Image.fromarray(rgba)
        if k<=10: fy=RG-y0
        ox=round(CELL/2-cx);oy=round(BASE-fy)
        assert ox>=0 and oy>=0 and ox+t.width<=CELL and oy+t.height<=CELL,(r,k,ox,oy,t.size)
        atlas.alpha_composite(t,(k*CELL+ox,r*CELL+oy))
        names.append((r,k))
# portrait
p=rows[5][0];sl=p[1];pm=(lab[sl]==p[0])&fg[sl]
sub=a[sl].copy();sub[...,1]=np.minimum(sub[...,1],np.maximum(sub[...,0],sub[...,2])+8)
rg=np.zeros(pm.shape+(4,),np.uint8);rg[...,:3]=np.clip(sub,0,255);rg[...,3]=pm*255
Image.fromarray(rg).save('portrait.png')
atlas.save('hj_atlas.png')
q=atlas.quantize(colors=128,method=Image.FASTOCTREE,dither=Image.NONE)
q.save('hj_atlas_q.png',optimize=True)
json.dump({'cell':CELL,'base':BASE,'cols':COLS,'rows':5,'dirs':['E','SE','S','NE','N'],'acts':{'run':[0,6],'wind':[6,8],'strike':[8,10],'hit':[10,11],'die':[11,14]}},open('hj_atlas.json','w'))
bg2=Image.new('RGBA',atlas.size,(70,100,70,255));bg2.alpha_composite(atlas);bg2.convert('RGB').save('/tmp/hj/prev.png')
print('ok',atlas.size)
