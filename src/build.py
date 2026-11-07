import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def P(*a): return os.path.join(ROOT,*a)
import base64, json, io, re
from PIL import Image
R=P('assets')
def b64(p,mime='image/png'): return 'data:%s;base64,%s'%(mime,base64.b64encode(open(p,'rb').read()).decode())
def meta(p):
    s=open(p).read(); return json.loads(s[s.index('={"')+1:].rstrip().rstrip(';'))
img={}; M={}
for k in ['grass','dirt','trod','mud']:
    im=Image.open('%s/ground/%s.jpg'%(R,k)).convert('RGB'); buf=io.BytesIO(); im.save(buf,'JPEG',quality=82)
    img['g_'+k]='data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode()
props=meta(R+'/props/meta.js'); M['props']=props
for k in props: img['p_'+k]=b64('%s/props/%s.png'%(R,k))
for _k,_n in (('spara',6),('immortal',6),('pcav8',8),('comp8',8)):
    M[_k]=meta(R+'/'+_k+'/meta.js')
    for d in M[_k]['dirs']:
        for i in range(_n): img['%s_%s%d'%(_k,d,i)]=b64('%s/%s/%s%d.png'%(R,_k,d,i))
img['hj_atlas']=b64(P('art','hj_art','hj_atlas_q.png'))
M['hj']=json.load(open(P('art','hj_art','hj_atlas.json')))
img['hj2_atlas']=b64(P('art','hj2_art','hj2_atlas_q.png'))
M['hj2']=json.load(open(P('art','hj2_art','hj2_atlas.json')))
img['hj3_atlas']=b64(P('art','hj3_art','hj3_atlas_q.png'))
M['hj3']=json.load(open(P('art','hj3_art','hj3_atlas.json')))
img['hero_atlas']=b64(P('art','hero_art','hero_atlas_q.png'))
M['atlas']=json.load(open(P('art','hero_art','hero_atlas.json')))
img['enemy_atlas']=b64(P('art','enemy_art','enemy_atlas_q.png'))
M['eatlas']=json.load(open(P('art','enemy_art','enemy_atlas.json')))
old=open(P('src','greybox.template.html'),encoding='utf-8').read()
head=old[:old.index('<script>')]
head=head.replace('<h4>同屏敌人数量</h4>','<h4>地面压扁（1 = 不压扁，越小越斜）</h4>\n  <label><input id="sQ" type="range" min="0.5" max="1" step="0.05" value="0.7"> <span id="vQ"></span></label>\n  <h4>同屏敌人数量</h4>')
head=(head.replace('灰盒测试：黄巾荒场','灰盒测试 3：无尽战场').replace('value="0.85"','value="1"').replace('<h4>入场提示</h4>\n  <button id="bGua">立刻触发一次</button>\n  <label><input id="cAuto" type="checkbox" checked> 每 10 秒自动触发</label>','<h4>波次</h4>\n  <button id="bGua">立刻结束本波</button>\n  <label style="display:none"><input id="cAuto" type="checkbox"></label>').replace('<label><input id="cSnap" type="checkbox"> 像素整数缩放（开启后主角只有 1 倍/2 倍两档大小）</label>','<label style="display:none"><input id="cSnap" type="checkbox"></label>').replace('max="150" step="5" value="60"','max="320" step="10" value="250"')
 .replace('<button data-boss="zhang_jiao">张角</button><button data-boss="zhang_liang">张梁</button><button data-boss="zhang_bao">张宝</button>','<button data-boss="brute">大力士</button>')
 .replace('<h4>Boss（各一个）</h4>','<h4>大个子（各一个）</h4>')
 .replace('「刀·剑气」，闪身时不能攻击；击倒的敌人会从场边入场点补进来。','「刀·剑气」，闪身时不能攻击。无尽地图，每 40 秒一波，波间停顿；10 分钟一局，9 分钟刷大个子（张角占位）。美术来自骑兵幸存者仓库（主角骑马、敌人是波斯步兵，均为占位）。')
 .replace('value="5" max="150"','value="5" max="150"'))
assert 'brute' in head and '立刻结束本波' in head
js=open(P('src','script.js'),encoding='utf-8').read().replace('/*__BGM__*/',open(P('src','bgm.js'),encoding='utf-8').read().replace('__DRUM__',__import__('base64').b64encode(open(P('art','audio','southern_drum.wav'),'rb').read()).decode())).replace('/*__DATA__*/',open(P('src','data.js'),encoding='utf-8').read()).replace('__ASSETS__',json.dumps({'img':img,'meta':M}))
open(P('build','greybox3.html'),'w',encoding='utf-8').write(head+'<script>\n'+js+'\n</script>\n</body>\n</html>\n')
print('built',len(head+js)//1024,'KB')
