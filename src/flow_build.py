import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def P(*a): return os.path.join(ROOT,*a)
import json,re
M=P('src','menu')+'/'
menu=open(M+'menu2.html').read()
cfg=open(M+'cfg.html').read()
settle=open(M+'settle.html').read()
game=open(P('build','greybox3.html')).read()

import base64,json as _j
def b64(p): return 'data:image/png;base64,'+base64.b64encode(open(p,'rb').read()).decode()
HA=_j.load(open(P('art','hero_art','hero_atlas.json')));EAJ=_j.load(open(P('art','enemy_art','enemy_atlas.json')))
def newart(h):
    i=h.find('const A=');j=h.find(';const IMG={}',i)
    A=_j.loads(h[i+8:j])
    A['img']={k:v for k,v in A['img'].items() if not (k.startswith('hw_') or k.startswith('spara_'))}
    A['img']['hero_atlas']=b64(P('art','hero_art','hero_atlas_q.png'));A['img']['enemy_atlas']=b64(P('art','enemy_art','enemy_atlas_q.png'))
    for _k,_p in [('wp0',('assets','wp','wp0.png')),('wp1',('assets','wp','wp1.png')),('wp2',('assets','wp','wp2.png')),('wp3',('assets','wp','wp3.png'))]+[('sk_'+_s,('assets','ic','sk_'+_s+'.png')) for _s in ('hengsao','jianyu','qiang','huogong')]: A['img'][_k]=b64(P(*_p))
    A['meta']['atlas']=HA;A['meta']['eatlas']=EAJ
    h=h[:i]+'const A='+_j.dumps(A,ensure_ascii=False)+h[j:]
    NEW="""const _HA=META.atlas,_EA=META.eatlas;
function _at(im,J,k,name,x,y,sc,fl){const n=J.names.indexOf(name),cw=J.cell,c=J.cols;ctx.save();ctx.translate(x,y);if(fl)ctx.scale(-1,1);ctx.drawImage(im,(n%c)*cw,Math.floor(n/c)*cw,cw,cw,-cw/2*k*sc,-J.base*k*sc,cw*k*sc,cw*k*sc);ctx.restore()}
function fh(nm_,dir,fi,x,y,sc,fl){const di=['E','SE','S','NE','N'].indexOf('E');if(nm_==='hw')_at(IMG.hero_atlas,_HA,0.168,'walk_0_'+(fi%6),x,y,sc*1.5,fl);else _at(IMG.enemy_atlas,_EA,30/216,'walk_0_'+(fi%6),x,y,sc*1.4,fl)}
"""
    a=h.find('function fh(');b=h.find('\n',a)
    h=h[:a]+NEW+h[b+1:]
    return h

def rep(s,a,b):
    assert a in s,a[:60]
    return s.replace(a,b,1)
menu=newart(menu);cfg=newart(cfg)
# menu: 踏上征途 -> shell
menu=rep(menu,"L('mt').textContent='「'+nm.value.trim()+'」'+(pw.value?'（已设口令）':'')+' 出发！（接入战斗场景）';modal.style.display='flex'};","parent.postMessage({t:'menu-go',name:nm.value.trim()},'*')};")
# cfg
cfg=rep(cfg,"L('go').onclick=()=>toast('「'+L('kn').textContent+'」以'+OR[cur].n+'出身出发！（接入战斗）');","L('go').onclick=()=>parent.postMessage({t:'cfg-go',o:cur,name:L('kn').textContent,ori:OR[cur].n,wp:OR[cur].w[0],title:window.__tt||'',faction:window.__fc||''},'*');")
cfg=rep(cfg,"L('bk').onclick=()=>toast('返回主菜单（样稿）');","L('bk').onclick=()=>parent.postMessage({t:'to-menu'},'*');")
cfg=rep(cfg,'<div class="sec">出　身</div>','<div class="sec">称\u3000号</div><div id="ttp" style="width:56px;height:56px;margin:0 auto 6px;border:2px solid #8a6a3a;background:#120b07;display:flex;align-items:center;justify-content:center;font:700 28px serif;color:#c98f3c;box-shadow:inset 0 0 12px #000">无</div><select id="tts" style="width:100%;background:#1a110c;color:#f0d89a;border:2px solid #6a5028;padding:7px 10px;font:inherit;font-size:14px;text-align:center"></select><div class="eff" id="ttd" style="margin:6px 0 10px">未佩戴称号</div><div class="sec">出\u3000身</div>')
cfg=rep(cfg,'<div class="sec">出\u3000身</div>','<div class="sec">势\u3000力</div><select id="fcs" style="width:100%;background:#1a110c;color:#f0d89a;border:2px solid #6a5028;padding:7px 10px;font:inherit;font-size:14px;text-align:center"></select><div class="eff" id="fcd" style="margin:6px 0 10px"></div><div class="sec">出\u3000身</div>')
cfg=rep(cfg,'</head>','<style>#L{overflow-y:auto;scrollbar-width:thin}#L::-webkit-scrollbar{width:6px}#L::-webkit-scrollbar-thumb{background:#6a5028}#cards{display:flex;gap:6px}#cards .card{flex:0 0 50px;min-width:0;justify-content:center;padding:6px;overflow:hidden}#cards .card>div:not(.ic){display:none}#cards .card.on{flex:1 1 auto;justify-content:flex-start;padding:8px 10px}#cards .card.on>div:not(.ic){display:block;min-width:0}#cards .card.on .tag{display:inline-block}#cards .card.on:after{display:none}#cards{align-items:flex-start}#cards .card{height:62px}#cards .card.on{height:auto;min-height:62px}#cards{flex-wrap:wrap}#cards .card.on{flex:1 1 100%;order:-1}#cards .card.on b .tag{margin-left:4px}</style></head>')
cfg=rep(cfg,'</body>','<script>(function(){const T=(window.__CFG&&window.__CFG.titles)||{have:[],wear:\'\',defs:{}};window.__tt=T.have.indexOf(T.wear)>=0?T.wear:\'\';\nconst S=document.getElementById(\'tts\'),P=document.getElementById(\'ttp\'),D=document.getElementById(\'ttd\');\nfunction info(d){return \'<b style="color:#f0d89a">\'+d.n+\'</b>\u3000增：\'+d.up+\'；减：\'+d.dn}\nfunction draw(){const k=window.__tt,d=T.defs[k];P.innerHTML=(d&&window.UI&&UI[\'t_\'+k])?\'<img src="\'+UI[\'t_\'+k]+\'" style="position:absolute;left:50%;top:50%;width:42px;transform:translate(-50%,-50%)">\':(d?d.n[0]:\'无\')\n D.innerHTML=d?info(d):\'未佩戴称号（通关或达成条件后获得）\'}\nS.innerHTML=\'<option value="">■ 无</option>\'+Object.keys(T.defs).map(x=>{const h=T.have.indexOf(x)>=0;return \'<option value="\'+x+\'"\'+(h?\'\':\' disabled\')+(x===window.__tt?\' selected\':\'\')+\'>\'+(h?\'■ \':\'🔒 \')+T.defs[x].n+(h?\'\':\'（\'+T.defs[x].cond+\'）\')+\'</option>\'}).join(\'\');\nS.onchange=()=>{window.__tt=S.value;draw()};draw()})()</script></body>')

cfg=rep(cfg,"{n:'马夫',g:'骑',","{n:'小卒',g:'卒',t:'披过甲，端过枪，站得住。',e:'列阵：受到伤害 -10%',w:['长枪','枪','近战·长柄'],fit:'长柄',a:[4,2,5,1,1,2,1,3],main:'武艺',s:['刺','枪刺','向前直刺，穿透一线敌人'],q:'闪身',qd:'向前一闪，短暂无敌',tg:'长兵器'},\n {n:'马夫',g:'骑',tg:'骑乘',")
cfg=rep(cfg,"{n:'农夫',g:'耕',","{n:'农夫',g:'耕',tg:'短兵器',")
cfg=rep(cfg,"{n:'猎户',g:'弓',","{n:'猎户',g:'弓',tg:'远程',")
cfg=rep(cfg,"{n:'书生',g:'策',","{n:'书生',g:'策',tg:'法术',")
cfg=rep(cfg,'<span class="tag">${o.w[0]}</span>','<span class="tag">${o.tg}</span>')
cfg=rep(cfg,'#L::-webkit-scrollbar-thumb','#L::-webkit-scrollbar-thumb') if False else cfg

import json as _jj
_UI=_jj.load(open(P('art','ui','ui.json')))
_keep=['c_tl','c_tr','c_bl','c_br','b_go','b_n','o_nong','o_gong','o_zu','o_ma','o_shu','t_wanren','t_pojun','t_tiebi','t_jifeng','t_zhanjiang','t_shenshe','pframe']
_U={k:_UI[k] for k in _keep}
_css="""<style>
.pn:before,.pn:after{display:none}*{scrollbar-width:thin;scrollbar-color:#6a5028 transparent}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#6a5028;border-radius:3px}::-webkit-scrollbar-corner{background:transparent}.pn{overflow-x:hidden!important;overflow-y:auto!important}
.cn{position:absolute;width:46px;height:46px;pointer-events:none;z-index:3;background-size:contain;background-repeat:no-repeat}
#ttp{position:relative;width:70px!important;height:66px!important;margin-bottom:4px!important;border:none!important;background:url(@@pframe@@) center/100% 100% no-repeat!important;box-shadow:none!important;font-size:26px}
#cards .card.on span:not(.tag){display:none}#cards .card .tag{white-space:nowrap;margin-left:0!important;display:inline-block}#cards .ic{background:none;border:none;font-size:0;width:44px;height:44px;box-shadow:none}
#cards .ic img{width:44px;height:44px;object-fit:contain;display:block}
.bt{border:none!important;border-radius:0;background:url(@@b_n@@) center/100% 100% no-repeat!important;color:#f0d89a}
.bt:hover{filter:brightness(1.25);color:#fff}
.go{border-style:solid!important;border-width:16px 44px!important;border-image:url(@@b_go@@) 56 110 fill/16px 44px stretch!important;background:none!important;box-shadow:none!important;color:#f6e0a4!important;padding:0!important;height:60px;line-height:28px;text-shadow:0 1px 2px #000}
.go:hover{filter:brightness(1.15)}
</style>"""
for _k in ("pframe","b_n","b_go"): _css=_css.replace("@@"+_k+"@@",_U[_k])
_css=_css.replace('100%','100%')
_js="<script>window.UI="+_jj.dumps(_U)+"</script>"
_js2="""<script>(function(){const N=['nong','gong','zu','ma','shu'];document.querySelectorAll('#cards .ic').forEach((e,i)=>{if(N[i])e.innerHTML='<img src="'+UI['o_'+N[i]]+'">'});
document.querySelectorAll('.pn').forEach(p=>{[['tl','left:0;top:0'],['tr','right:0;top:0'],['bl','left:0;bottom:0'],['br','right:0;bottom:0']].forEach(([k,pos])=>{const d=document.createElement('div');d.className='cn';d.style.cssText=pos+';background-image:url('+UI['c_'+k]+')';p.appendChild(d)})})})()</script>"""
cfg=cfg.replace('</head>',_js+_css+'</head>',1)
FJS=r'''<script>(function(){const F=(window.__CFG&&window.__CFG.facs)||{have:[],wear:'',defs:{}};window.__fc=F.have.indexOf(F.wear)>=0?F.wear:'xiangyong';const S=document.getElementById('fcs'),D=document.getElementById('fcd');
function draw(){const d=F.defs[window.__fc];D.innerHTML=d?'<b style="color:#f0d89a">'+d.n+'</b>　增：'+d.up+'；减：'+d.dn:''}
S.innerHTML=Object.keys(F.defs).map(x=>{const h=F.have.indexOf(x)>=0,d=F.defs[x];return '<option value="'+x+'"'+(h?'':' disabled')+(x===window.__fc?' selected':'')+'>'+(h?'■ ':'🔒 ')+d.n+(h?'':'（'+d.cond+'）')+'</option>'}).join('');
S.onchange=()=>{window.__fc=S.value;draw()};draw()})()</script>'''
cfg=cfg.replace('</body>',FJS+_js2+'</body>',1)
# settle wiring
settle=rep(settle,'<div class="seal" id="S" title="点击切换 胜/败 示例">败</div>','<div class="seal" id="S">败</div>')
settle=rep(settle,"onclick=\"t('返回主菜单：样板')\"","onclick=\"parent.postMessage({t:'to-menu'},'*')\"")
settle=rep(settle,"onclick=\"t('再来一局：样板')\"","onclick=\"parent.postMessage({t:'again'},'*')\"")
settle=rep(settle,"const data=[['⚔','剑气',49678],['🏹','箭雨',29691],['🔱','枪刺',23896],['🔥','火攻',23812],['🗡','飞刀',22916],['🌀','旋风斩',19474],['⚡','霹雳',14200],['🔨','震地',9100],['☯','刀轮',6400],['🐎','冲锋',3200]];\nconst tot=data.reduce((a,b)=>a+b[2],0),mx=data[0][2];",
"""const R=window.__RES||{win:false,kills:0,time:0,wave:1,waves:8,combo:0,dmg:[],loadout:[],ori:'农夫',wp:'军刀',attrs:[0,0,0,0,0,0,0,0]};
const data=R.dmg.length?R.dmg.map(d=>[d.g,d.n,d.v]):[['—','尚无伤害',1]];
const tot=data.reduce((a,b)=>a+b[2],0)||1,mx=data[0][2]||1;""")
settle=rep(settle,"let win=false;document.getElementById('S').onclick=()=>{win=!win;F.classList.toggle('win',win);T.textContent=win?'大破黄巾':'兵败涿郡';S.textContent=win?'胜':'败';};",
"""(function(){const win=!!R.win;F.classList.toggle('win',win);T.textContent=win?'大破黄巾':'兵败涿郡';S.textContent=win?'胜':'败';
 const mm=Math.floor(R.time/60),ss=R.time%60,cs=document.querySelectorAll('.cards .c');
 cs[0].querySelector('strong').textContent=mm+':'+String(ss).padStart(2,'0');cs[1].querySelector('strong').textContent=R.kills.toLocaleString();
 cs[2].querySelector('b').textContent='剩余血量';cs[2].querySelector('strong').textContent=R.hp;cs[2].querySelector('em').textContent='❤';
 cs[3].querySelector('strong').textContent=R.combo;cs[4].querySelector('b').textContent='波次';cs[4].querySelector('strong').textContent=R.wave;cs[4].querySelector('em').textContent='🥁';
 const pct=win?100:Math.min(100,(R.wave-1+Math.min(1,R.time%60/60))/R.waves*100);cs[5].querySelector('i').style.width=pct+'%';cs[5].querySelector('span').textContent=(win?R.waves:R.wave)+'/'+R.waves;
 const ch=document.querySelectorAll('.chips span');ch[0].innerHTML='<i>☠</i>标准';ch[1].innerHTML='<i>🌾</i>'+R.ori;ch[2].innerHTML='<i>⚔</i>'+R.wp;
 const ic=document.querySelectorAll('.pn:first-child .row')[0].querySelectorAll('.ic');ic.forEach((e,i)=>e.textContent=R.loadout[i]||'');
 const av=document.querySelectorAll('.attrs div');av.forEach((e,i)=>{e.lastChild.textContent=R.attrs[i]||0;});
 document.querySelector('.gain span:last-child').textContent=win?'张角授首，黄巾溃散（本作无局外成长，只留一场战报）':'阵亡于第 '+R.wave+' 波（本作无局外成长，只留一场战报）';
 document.querySelector('.gain .lb').textContent=win?'战果':'败因';
 document.getElementById('M').firstChild.textContent=R.grade||(win?'校尉':'小卒');if(R.newT&&R.newT.length){const g=document.querySelector('.gain span:last-child');g.textContent+=' ｜ 获得称号：'+R.newT.join('、');}})();""")
settle=rep(settle,"document.getElementById('B').onclick=()=>t('评定：按波次、斩首、用时综合 → 校尉（样板）');","document.getElementById('B').onclick=()=>t('评定规则待定');")
pages={'menu':menu,'cfg':cfg,'game':game,'settle':settle}
esc=lambda s:s.replace('</script','<@/script')
for k,v in pages.items(): assert '<@/script' not in v
shell='''<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>无名三国录：幸存者</title>
<style>html,body{margin:0;height:100%;background:#120d09;overflow:hidden}iframe{position:fixed;inset:0;width:100%;height:100%;border:0;background:#120d09}#rot{position:fixed;inset:0;z-index:99;display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#120d09;color:#d6b97e;font:22px/1.5 serif;letter-spacing:.1em;text-align:center}#rot i{font-size:64px;font-style:normal;display:block;animation:rt 2s ease-in-out infinite}@keyframes rt{0%,30%{transform:rotate(0)}70%,100%{transform:rotate(-90deg)}}@media (orientation:portrait) and (pointer:coarse){#rot{display:flex}}</style></head><body><div id="rot"><i>📱</i>请将手机横屏游玩<br><small style="font-size:15px;opacity:.7">（关闭系统的“竖排方向锁定”后旋转手机）</small></div>
<iframe id="fr" allow="autoplay"></iframe><script>addEventListener("pointerdown",function(){try{screen.orientation.lock("landscape").catch(function(){})}catch(e){}},{once:true})</script><div id="ld" style="position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:#120d09;color:#d6b97e;font:20px/1 serif;letter-spacing:6px;z-index:9">载入中…</div>
'''+''.join('<script type="text/plain" id="p_%s">%s</script>\n'%(k,esc(v)) for k,v in pages.items())+'''
<script>
const AT=[[5,4,2,1,1,2,1,3],[3,2,1,5,1,4,1,3],[4,2,5,1,1,2,1,3],[4,2,4,1,5,2,1,3],[2,1,1,1,1,2,6,4]];
const TD=__TD__;const FD=__FD__;
const fr=document.getElementById('fr');let st={name:'',o:0,ori:'农夫',wp:'军刀',title:''};
let mem={};function sget(k,d){try{const v=localStorage.getItem('wm_'+k);if(v!=null)return JSON.parse(v)}catch(e){}return k in mem?mem[k]:d}
function sset(k,v){mem[k]=v;try{localStorage.setItem('wm_'+k,JSON.stringify(v))}catch(e){}}
st.title=sget('wear','');st.faction=sget('fwear','xiangyong');
function fhave(){return sget('fhave',['xiangyong','liubei'])}
function unl(d){const s=d.stats||{},r=[];const c={wanren:s.kills>=300,tiebi:(d.wave>=5||s.win)&&s.hitsW4===0,jifeng:s.pd>=8,zhanjiang:s.bruteK>=3,pojun:!!s.win,shenshe:s.archK>=15};
 const have=sget('have',[]);for(const k in c)if(c[k]&&have.indexOf(k)<0){have.push(k);r.push(TD[k].n)}sset('have',have);return r}
function unf(d){const r=[],h=fhave();const add=k=>{if(h.indexOf(k)<0){h.push(k);r.push('势力·'+FD[k].n)}};if(d.deserter)add('huangjin');if(d.stats&&d.stats.win)(d.facs||[]).forEach(add);sset('fhave',h);return r}
function show(k,extra){let h=document.getElementById('p_'+k).textContent.split('<@/script').join('</script');
 const inj='<script>window.__CFG='+JSON.stringify(Object.assign({},st,{titles:{have:sget('have',[]),wear:st.title,defs:TD},facs:{have:fhave(),wear:st.faction,defs:FD}},extra&&extra.cfg))+';window.__RES='+JSON.stringify(extra&&extra.res||null)+';<\\/script>';
 h=h.replace('<head>','<head>'+inj);document.getElementById('ld').style.display='flex';fr.onload=()=>{document.getElementById('ld').style.display='none'};fr.srcdoc=h;setTimeout(()=>{try{fr.contentWindow.focus()}catch(e){}},300);}
addEventListener('message',e=>{if(e.source!==fr.contentWindow)return;const d=e.data||{};
 if(d.t==='menu-go'){st.name=d.name;show('cfg');}
 else if(d.t==='to-menu'){show('menu');}
 else if(d.t==='cfg-go'){st.o=d.o;st.ori=d.ori;st.wp=d.wp;st.name=d.name;st.title=d.title||'';sset('wear',st.title);st.faction=d.faction||'xiangyong';sset('fwear',st.faction);show('game');}
 else if(d.t==='end'){d.newT=unl(d).concat(unf(d));d.ori=st.ori;d.wp=st.wp;d.attrs=AT[st.o]||AT[0];show('settle',{res:d});}
 else if(d.t==='again'){show('cfg');}});
show('menu');
</script></body></html>'''
import re as _re
TDJ=open(P('src','script.js')).read()
m=_re.search(r"const TITLES=(\{.*?\});\nfunction applyTitle",TDJ,_re.S)
import subprocess,json as _j2
js=m.group(1)
out=subprocess.run(['node','-e','console.log(JSON.stringify('+js+'))'],capture_output=True,text=True).stdout.strip()
shell=shell.replace('__TD__',out)
DJ=open(P('src','data.js'),encoding='utf-8').read()
m2=_re.search(r"const FAC=(\{.*?\});\n//END_FAC",DJ,_re.S)
out2=subprocess.run(['node','-e','const f='+m2.group(1)+';for(const k in f){delete f[k].fx;delete f[k].tags}console.log(JSON.stringify(f))'],capture_output=True,text=True).stdout.strip()
shell=shell.replace('__FD__',out2)
open(P('index.html'),'w').write(shell)
print(len(shell)/1e6,'MB')
