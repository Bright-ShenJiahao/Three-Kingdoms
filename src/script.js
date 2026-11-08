const ASSETS = __ASSETS__;
(async function(){
let VH=640;                 // 视野高度（世界单位）；步兵 32 高 → 约占屏高 1/20
const WAVES=20;function WT(){return WAVE_T[Math.min(wave,WAVES)-1]||60;}
/*__DATA__*/
/*__BGM__*/
let wave=1;
function waveRow(){return WAVE_TABLE[Math.min(wave,WAVE_TABLE.length)-1]||WAVE_TABLE[0];}
function pickType(){const row=waveRow();
  if(row.b2){let n=0;for(const e of enemies)if(e.type=='brute2')n++;if(n<row.b2&&Math.random()<0.03)return 'brute2';}
  let sum=0;for(const k in row.mix)sum+=row.mix[k];let r=Math.random()*sum;for(const k in row.mix){r-=row.mix[k];if(r<=0)return k;}return 'spara';}
// 声明式效果 → 数值
function applyFx(fx){if(!fx)return;
  if(fx.maxhp){hero.maxhp=Math.round(hero.maxhp*fx.maxhp);hero.hp=hero.maxhp;}
  if(fx.maxhpAdd){const a=fx.maxhpAdd;hero.maxhp=a<0?Math.max(30,hero.maxhp+a):hero.maxhp+a;hero.hp=a<0?Math.min(hero.hp,hero.maxhp):hero.hp+a;}
  if(fx.spd)spdMul*=fx.spd;if(fx.take)takeMul*=fx.take;if(fx.all)allMul*=fx.all;if(fx.dcd)DCD*=fx.dcd;
  if(fx.ranged)rangedMul*=fx.ranged;if(fx.melee)meleeMul*=fx.melee;if(fx.cb)cbOn=true;if(fx.rg)rgOn=true;
  if(fx.heal&&fx.cb)healMul=fx.heal;
  else if(fx.heal)hero.hp=Math.min(hero.maxhp,hero.hp+Math.round(hero.maxhp*fx.heal));
  if(fx.hurt)hero.hp=Math.max(1,hero.hp-Math.round(hero.maxhp*fx.hurt));
  if(fx.attr)addAttr(fx.attr);if(fx.gamble)applyFx(fx.gamble[Math.random()<.5?0:1]);}
const arrows=[];
function loadImg(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src;});}
const IMG={};for(const k in ASSETS.img)IMG[k]=await loadImg(ASSETS.img[k]);
const META=ASSETS.meta;
document.getElementById('loading').remove();
function hsh(x,y,k){let n=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(k|0,1274126177);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}

// ===== 无尽地面：分块渲染，每块缓存成画布（做法同骑兵幸存者）=====
const GS=1.5,TILE=250,CHUNK=512,PK=0.6;
const chunks=new Map();
function gpat(c,k,ox,oy){const im=IMG['g_'+k];const p=c.createPattern(im,'repeat');const s=TILE*GS/im.width;p.setTransform(new DOMMatrix([s,0,0,s,-ox*GS,-oy*GS]));return p;}
const tmp=document.createElement('canvas');tmp.width=tmp.height=1024;const tc=tmp.getContext('2d');
function blob(c,x0,y0,k,x,y,r,a,core){
  const S2=Math.ceil(r*2*GS);tc.setTransform(1,0,0,1,0,0);tc.globalCompositeOperation='source-over';tc.clearRect(0,0,1024,1024);
  tc.fillStyle=gpat(tc,k,x-r,y-r);tc.fillRect(0,0,S2,S2);
  tc.globalCompositeOperation='destination-in';
  const g=tc.createRadialGradient(S2/2,S2/2,S2/2*(core||.5),S2/2,S2/2,S2/2);g.addColorStop(0,'rgba(0,0,0,'+a+')');g.addColorStop(1,'rgba(0,0,0,0)');tc.fillStyle=g;tc.fillRect(0,0,S2,S2);
  c.drawImage(tmp,0,0,S2,S2,(x-r-x0)*GS,(y-r-y0)*GS,S2,S2);
}
function put(c,x0,y0,k,x,y,s){const M=META.props[k],im=IMG['p_'+k];s=(s||1)*PK;c.drawImage(im,(x-M.ax*s-x0)*GS,(y-M.ay*s-y0)*GS,M.w*s*GS,M.h*s*GS);}
function buildChunk(ci,cj){
  const cv2=document.createElement('canvas');cv2.width=cv2.height=CHUNK*GS;const c=cv2.getContext('2d'),x0=ci*CHUNK,y0=cj*CHUNK;
  c.fillStyle=gpat(c,'grass',x0,y0);c.fillRect(0,0,cv2.width,cv2.height);
  const BC=700;
  for(let i=Math.floor((x0-450)/BC);i<=Math.floor((x0+CHUNK+450)/BC);i++)for(let j=Math.floor((y0-450)/BC);j<=Math.floor((y0+CHUNK+450)/BC);j++){
    const n=Math.floor(hsh(i,j,101)*3);
    for(let q=0;q<n;q++){const x=i*BC+hsh(i,j,110+q)*BC,y=j*BC+hsh(i,j,120+q)*BC,r=140+hsh(i,j,130+q)*280;
      if(x+r<x0||x-r>x0+CHUNK||y+r<y0||y-r>y0+CHUNK)continue;blob(c,x0,y0,hsh(i,j,140+q)<.45?'dirt':'trod',x,y,r,.9,.35);}
  }
  const MC=1100;
  for(let i=Math.floor((x0-300)/MC);i<=Math.floor((x0+CHUNK+300)/MC);i++)for(let j=Math.floor((y0-300)/MC);j<=Math.floor((y0+CHUNK+300)/MC);j++){
    if(hsh(i,j,201)>.35)continue;const x=i*MC+hsh(i,j,210)*MC,y=j*MC+hsh(i,j,220)*MC,r=90+hsh(i,j,230)*60;
    if(x+r<x0||x-r>x0+CHUNK||y+r<y0||y-r>y0+CHUNK)continue;blob(c,x0,y0,'mud',x,y,r,1,.55);
    if(hsh(i,j,240)<.5)put(c,x0,y0,hsh(i,j,241)<.5?'pond1':'pond2',x,y+10,1);
  }
  const CL=110;
  for(let i=Math.floor((x0-70)/CL);i<=Math.floor((x0+CHUNK+70)/CL);i++)for(let j=Math.floor((y0-70)/CL);j<=Math.floor((y0+CHUNK+70)/CL);j++){
    const x=i*CL+hsh(i,j,301)*CL,y=j*CL+hsh(i,j,302)*CL,r=hsh(i,j,303);
    if(r<.42){}
    else if(r<.46)put(c,x0,y0,['rubble','flat'][Math.floor(hsh(i,j,306)*2)],x,y,1);
    else if(r<.49)put(c,x0,y0,'dec'+(1+Math.floor(hsh(i,j,307)*3)),x,y,.9);
  }
  return cv2;
}
// ===== 参与深度排序的大件：按格子确定性生成 =====
const PCS=340,pcache=new Map();
const PW=[['bushS',3],['bushM',3],['rockM',3],['tam1',2],['tam2',2],['flag',3],['wreck',1],['fire',1],['tentR',1],['tentW',1],['fence',3]];
const PWT=PW.reduce((a,p)=>a+p[1],0);
function cellProps(i,j){
  const key=i+','+j;let L=pcache.get(key);if(L)return L;L=[];
  const rn=hsh(i,j,401),n=rn<.5?1:(rn<.78?2:0);
  for(let q=0;q<n;q++){
    let r=hsh(i,j,410+q)*PWT,k='bushS';for(const p of PW){r-=p[1];if(r<=0){k=p[0];break;}}
    const x=i*PCS+hsh(i,j,420+q)*PCS,y=j*PCS+hsh(i,j,430+q)*PCS,fl=hsh(i,j,440+q)<.5?-1:1;
    if(Math.hypot(x,y)<150)continue;
    if(k==='fence'){const m=2+Math.floor(hsh(i,j,450+q)*3);for(let t=0;t<m;t++)L.push({k,x:x+t*76*fl,y,s:.8,fl:1});}
    else if(k==='tentR'||k==='tentW'){L.push({k,x,y,s:.8,fl});L.push({k:'fire',x:x+44,y:y+26,s:.8,fl:1});}
    else L.push({k,x,y,s:.85,fl});
  }
  pcache.set(key,L);if(pcache.size>400)pcache.delete(pcache.keys().next().value);return L;
}

const tcache=new Map();
function tuftCell(i,j){const key=i+','+j;let L=tcache.get(key);if(L)return L;L=[];const CL=110;
  const x=i*CL+hsh(i,j,301)*CL,y=j*CL+hsh(i,j,302)*CL,r=hsh(i,j,303);
  if(r<.42)L.push({k:'tuft'+(1+Math.floor(hsh(i,j,304)*4)),x,y,s:.8+hsh(i,j,305)*.5,fl:1});
  tcache.set(key,L);if(tcache.size>1500)tcache.delete(tcache.keys().next().value);return L;}
const $=id=>document.getElementById(id);
const stage=$('stage'),cv=$('cv'),ctx=cv.getContext('2d');
let SQ=0.7,S=1,N=250,phoneSim=false,DPR=1,paused=true,over=false;
const hero={x:0,y:0,fa:0,wk:0,moving:false,hp:120,maxhp:120};let hurtT=0,ampT=0,atkMul=1;const texts=[];let DCD=0.9;let titleId='',statusT=0,statusKey='';let cbT=0,rgT=0,cbOn=false,rgOn=false,healMul=1,fac='';let spdMul=1,takeMul=1,crowdMul=false,bigMul=1,smallMul=1,rangedMul=1,meleeMul=1,allMul=1;let stopT=0,shk=0;const dnums=[];let pdCnt=0,hitsTaken=0,hitsW4=0,bruteK=0,archK=0;
const enemies=[],effects=[],slashes=[],ghosts=[],corpses=[];let dashCd=0;
const RT=2.4;let silver=0,waveK0=0,waveH0=0,dmgSt={},comboMax=0,retreatT=0,bossPhase=false,won=false,started=false,kills=0,combo=0,comboT=0,slashT=0,skillIdx=0,tm=0,tclock=0,waveT=0,bossDone=false;
const keys={};
addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();tryDash();return;}keys[e.key.toLowerCase()]=true;});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
let stick=null;
function ptrDown(e){if(stick)return;if(e.target.closest('#panel')||e.target.closest('#dashBtn')||e.target.closest('#ov')||e.target.id==='gear'||e.target.closest('button'))return;
  stick={id:e.pointerId,ox:e.clientX,oy:e.clientY,dx:0,dy:0};try{stage.setPointerCapture(e.pointerId);}catch(_){}
  const s=$('stick');s.style.display='block';s.style.left=e.clientX+'px';s.style.top=e.clientY+'px';s.firstElementChild.style.transform='';}
function ptrMove(e){if(!stick||e.pointerId!==stick.id)return;let dx=e.clientX-stick.ox,dy=e.clientY-stick.oy;const l=Math.hypot(dx,dy),m=56;if(l>m){dx*=m/l;dy*=m/l;}stick.dx=dx/m;stick.dy=dy/m;$('stick').firstElementChild.style.transform='translate('+dx+'px,'+dy+'px)';}
function ptrUp(e){if(stick&&e.pointerId===stick.id){stick=null;$('stick').style.display='none';}}
stage.addEventListener('pointerdown',ptrDown);stage.addEventListener('pointermove',ptrMove);stage.addEventListener('pointerup',ptrUp);stage.addEventListener('pointercancel',ptrUp);
function resize(){
  const vw=innerWidth,vh=innerHeight;let w=vw,h=vh;
  if(phoneSim){h=vh-16;w=Math.min(vw-16,Math.round(h*9/19.5));}
  stage.style.width=w+'px';stage.style.height=h+'px';
  DPR=Math.min(devicePixelRatio||1,3);cv.width=Math.round(w*DPR);cv.height=Math.round(h*DPR);
  const small=matchMedia('(pointer:coarse)').matches||vh<520||phoneSim;VH=small?400:640;stage.style.setProperty('--u',(small?Math.max(h/1000,.62):h/1000)+'px');stage.classList.toggle('narrow',w/h<0.8);
}
addEventListener('resize',resize);resize();
const skills=$('skills');

const dashBtn=$('dashBtn');
dashBtn.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();tryDash();});

// 波间停顿 / 结束界面
const ov=document.createElement('div');ov.id='ov';
ov.style.cssText='position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;gap:calc(var(--u)*26);background:rgba(10,8,4,.62);z-index:8;color:#f3e7c4;text-align:center';
stage.appendChild(ov);
function showOv(html){ov.innerHTML=html;ov.style.display='flex';}
// ===== 立绘占位 / 局内提示 / 随机事件 / 开场剧情（框架；真立绘放进 PORTRAIT_IMG 即可替换）=====
const PORTRAIT_IMG={};
const PCOL={刘备:['#2e6b4a','#d9b25a'],张飞:['#2b2b2b','#c9a24a'],关羽:['#2e5a3a','#b8362a'],张角:['#7a6a1e','#e8d27a'],乡民:['#5a4a32','#cdbb8c'],铁匠:['#4a3a32','#e07a3a'],郎中:['#3b5a5a','#c8e0d0'],老兵:['#4a4036','#b9a47a'],我:['#3a4a60','#e0d0a8']};
function portraitSVG(who,big){const c=PCOL[who]||['#444','#ccc'],img=PORTRAIT_IMG[who];
  if(img)return '<img src="'+img+'" style="width:100%;height:100%;object-fit:cover;object-position:top">';
  const ch=who.slice(-1),H=big?150:100,id='pg'+(big?'b':'s')+who;
  const body=big?'<ellipse cx="50" cy="150" rx="52" ry="48" fill="'+c[1]+'" opacity=".55"/><circle cx="50" cy="62" r="24" fill="'+c[1]+'" opacity=".8"/><text x="50" y="72" text-anchor="middle" font-size="30" font-weight="700" fill="#14100a" opacity=".7" font-family="serif">'+ch+'</text>'
   :'<ellipse cx="50" cy="104" rx="42" ry="36" fill="'+c[1]+'" opacity=".55"/><circle cx="50" cy="44" r="22" fill="'+c[1]+'" opacity=".8"/><text x="50" y="55" text-anchor="middle" font-size="28" font-weight="700" fill="#14100a" opacity=".7" font-family="serif">'+ch+'</text>';
  return '<svg viewBox="0 0 100 '+H+'" preserveAspectRatio="xMidYMax slice" style="width:100%;height:100%;display:block"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+c[0]+'"/><stop offset="1" stop-color="#14100a"/></linearGradient></defs><rect width="100" height="'+H+'" fill="url(#'+id+')"/>'+body+'</svg>';}
const GOLD='#8a6a2c';
// --- 局内提示（图3样式：右下小对话框，头像在右）---
const tipEl=document.createElement('div');tipEl.style.cssText='position:absolute;right:calc(var(--u)*16);bottom:calc(var(--u)*150);z-index:12;display:none;width:calc(var(--u)*470);pointer-events:none;filter:drop-shadow(0 4px 10px rgba(0,0,0,.6))';stage.appendChild(tipEl);
let tipT=0,crowdT=0,calmT=0,_lh=0;const tipSeen={};
function showTip(key,text,who,sec){if(key&&tipSeen[key])return;if(key)tipSeen[key]=1;who=who||'刘备';
  tipEl.innerHTML='<div style="flex:1;background:#1c1a17;border:calc(var(--u)*3) solid '+GOLD+';border-right:0;padding:calc(var(--u)*14) calc(var(--u)*16);font-size:calc(var(--u)*20);line-height:1.5;color:#f3e7c4;display:flex;align-items:center"><div>'+text+'</div></div><div style="width:calc(var(--u)*96);height:calc(var(--u)*96);border:calc(var(--u)*3) solid '+GOLD+';overflow:hidden;position:relative;background:#000;flex:none"><div style="position:absolute;inset:0">'+portraitSVG(who,false)+'</div><div style="position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);text-align:center;font-size:calc(var(--u)*14);color:#e8d9a8">'+who+'</div></div>';
  tipEl.style.display='flex';tipT=sec||6;}
// --- 对话 / 事件通用外壳 ---
const dlg=document.createElement('div');dlg.style.cssText='position:absolute;inset:0;display:none;z-index:25;background:rgba(6,5,3,.6);color:#f3e7c4;overflow:hidden';stage.appendChild(dlg);
function bigPortrait(who){return '<div id="dgP" style="position:absolute;left:0;bottom:0;width:calc(var(--u)*430);height:92%;overflow:hidden;-webkit-mask-image:linear-gradient(to right,#000 72%,transparent);mask-image:linear-gradient(to right,#000 72%,transparent)">'+portraitSVG(who,true)+'</div>';}
// --- 开场剧情（图1样式：左大立绘 + 底部长对话框 + 快进）---
function playStory(lines,done){let i=0,typing=false,tm2=null,full='';
  const name=nm=>nm==='我'?((window.__CFG&&window.__CFG.name)||'无名'):nm;
  const fin=()=>{clearInterval(tm2);dlg.style.display='none';dlg.onclick=null;removeEventListener('keydown',key);window.__story=null;done&&done();};
  function show(){const L=lines[i];full=L.t.replace('{名}',name('我'));
    dlg.innerHTML=bigPortrait(L.w)+'<div style="position:absolute;left:calc(var(--u)*14);right:calc(var(--u)*14);bottom:calc(var(--u)*14);height:calc(var(--u)*190);background:#1c1a17;border:calc(var(--u)*3) solid '+GOLD+'"><div style="position:absolute;left:calc(var(--u)*20);top:calc(var(--u)*-22);background:#2a2114;border:calc(var(--u)*3) solid '+GOLD+';padding:calc(var(--u)*4) calc(var(--u)*26);font-size:calc(var(--u)*24);font-weight:700">'+name(L.w==='我'?'我':L.w)+'</div><div id="dgT" style="padding:calc(var(--u)*34) calc(var(--u)*40);font-size:calc(var(--u)*26);line-height:1.6"></div><div style="position:absolute;right:calc(var(--u)*20);bottom:calc(var(--u)*10);font-size:calc(var(--u)*16);color:#8a7a5a">点击屏幕或按空格键继续</div><button id="dgSkip" style="position:absolute;right:calc(var(--u)*16);top:calc(var(--u)*-28);width:calc(var(--u)*64);height:calc(var(--u)*44);background:#2a2114;border:calc(var(--u)*3) solid '+GOLD+';color:#e8d9a8;font-size:calc(var(--u)*22)">⏩</button></div>';
    $('dgSkip').onclick=e=>{e.stopPropagation();fin();};
    let k=0;typing=true;const T=$('dgT');clearInterval(tm2);tm2=setInterval(()=>{k++;T.textContent=full.slice(0,k);if(k>=full.length){typing=false;clearInterval(tm2);}},34);}
  function adv(){if(typing){clearInterval(tm2);typing=false;$('dgT').textContent=full;return;}i++;if(i>=lines.length)fin();else show();}
  const key=e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();adv();}};
  dlg.style.display='block';dlg.onclick=adv;addEventListener('keydown',key);window.__story={skip:fin};show();}
// --- 随机事件（图2样式：左大立绘 + 右侧面板 + 三个选项，带得失提示）---
let evUsed={};
function tryEvent(done){if(!waveRow().ev||evUsed[wave])return false;evUsed[wave]=1;
  const pool=EVENTS.filter(e=>!evUsed[e.id]);if(!pool.length)return false;const ev=pool[Math.floor(Math.random()*pool.length)];evUsed[ev.id]=1;
  let chosen=false;
  dlg.innerHTML=bigPortrait(ev.w)+'<div style="position:absolute;right:calc(var(--u)*30);top:calc(var(--u)*60);width:calc(var(--u)*560);background:#14120f;border:calc(var(--u)*3) solid '+GOLD+';padding:calc(var(--u)*34) calc(var(--u)*30) calc(var(--u)*26)"><div style="position:absolute;left:50%;top:calc(var(--u)*-26);transform:translateX(-50%);background:#2a2114;border:calc(var(--u)*3) solid '+GOLD+';padding:calc(var(--u)*4) calc(var(--u)*34);font-size:calc(var(--u)*26);font-weight:700;white-space:nowrap">'+ev.t+'</div><div style="font-size:calc(var(--u)*22);line-height:1.6;margin-bottom:calc(var(--u)*22)">'+ev.d+'</div><div id="evO"></div><div id="evR" style="margin-top:calc(var(--u)*10);min-height:calc(var(--u)*26);font-size:calc(var(--u)*20);color:#9fe08a;text-align:center"></div></div>';
  dlg.style.display='block';dlg.onclick=null;
  const box=$('evO');ev.o.forEach((o,k)=>{const b=document.createElement('button');b.style.cssText='display:block;width:100%;margin-bottom:calc(var(--u)*12);padding:calc(var(--u)*10) calc(var(--u)*12);background:#241d12;border:calc(var(--u)*2) solid #6b5426;color:#f3e7c4;text-align:center';
    b.innerHTML='<div style="font-size:calc(var(--u)*24)">'+(k+1)+'　'+o.t+'</div><div style="font-size:calc(var(--u)*16);color:#bfae82;margin-top:calc(var(--u)*4)">'+o.h+'</div>';
    b.onmouseenter=()=>{b.style.background='#5a4214';b.style.borderColor='#d9b25a'};b.onmouseleave=()=>{b.style.background='#241d12';b.style.borderColor='#6b5426'};
    b.onclick=()=>pick(k);box.appendChild(b);});
  function pick(k){if(chosen)return;chosen=true;applyFx(ev.o[k].fx);removeEventListener('keydown',kk);$('evR').textContent=ev.o[k].h==='无事发生'?'你没有多做停留。':ev.o[k].h;setTimeout(()=>{dlg.style.display='none';done();},1100);}
  const kk=e=>{const n={Digit1:0,Digit2:1,Digit3:2}[e.code];if(n!=null&&n<ev.o.length)pick(n);};addEventListener('keydown',kk);
  window.__event={pick};return true;}

function pickPool(){const have=loadout.filter(x=>x);const c=SKID.filter(id=>have.indexOf(id)<0&&(!TIER[id]||wave>=TMIN[TIER[id]])).map(id=>({id,w:FACOF[id]===fac&&fac&&fac!=='xiangyong'?4:1.5}));const r=[];while(r.length<3&&c.length){let t=c.reduce((a,b)=>a+b.w,0),x=Math.random()*t,k=0;for(;k<c.length-1;k++){x-=c[k].w;if(x<=0)break;}r.push(c[k].id);c.splice(k,1);}return r;}
function pickPassives(){const c=PASSIVES.slice(),r=[];while(r.length<3&&c.length)r.push(c.splice(Math.floor(Math.random()*c.length),1)[0].id);return r;}
function endWave(){
  if(paused||over)return;paused=true;settleDrops();const pend=loot.splice(0);{const tx=Math.floor(zq*hyRate());hero.hp=Math.min(hero.maxhp,hero.hp+tx);settle.tx=tx;settle.zq=Math.floor(zq);}
  const doNext=()=>{zq=zqMax;hero.hp=Math.min(hero.maxhp,hero.hp+Math.round(30*healMul));wave++;waveT=0;waveK0=kills;waveH0=hitsTaken;paused=false;ov.style.display='none';};
  const next=()=>{if(pend.length){let g=0;pend.forEach(it=>g+=sellP(it));silver+=g;floatTxt('自动卖出 '+pend.length+' 件，+'+g+' 银','#ffe28a');pend.length=0;}ov.style.display='none';if(!tryEvent(doNext))doNext();};
  let bagSel=null,tab=pend.length?'pk':'sum',opts=pickPassives(),picked=null,rc=0,replacing=null,selSlot='v0';
  const SHOP_POOL=[
    {n:'干粮',g:'🍙',d:'回复35%气血',p:30,fx:{heal:.35}},{n:'烈酒',g:'🍶',d:'最大生命+10',p:40,fx:{maxhpAdd:10}},
    {n:'磨刀石',g:'🪨',d:'全部伤害+4%',p:50,fx:{all:1.04}},{n:'草鞋',g:'👞',d:'移速+4%',p:45,fx:{spd:1.04}},
    {n:'护心镜',g:'🛡',d:'受到伤害-4%',p:50,fx:{take:.96}},{n:'火折子',g:'🔥',d:'闪身冷却-6%',p:40,fx:{dcd:.94}},{n:'参汤',g:'🍲',d:'气海+1（永久）',p:50,fx:{attr:{12:1}}}];
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const mkShop=()=>{const g=shuffle(SHOP_POOL).slice(0,2).map(x=>({...x,sold:false}));
    const el=shuffle(eligibleScrolls()).slice(0,2).map(id=>({n:SK[id].n,g:SK[id].g,d:(TIER[id]||'黄')+'阶'+(isSpell(id)?'术法':'武艺'),p:SKPRICE[TIER[id]||'黄'],skill:id,sold:false}));
    const fg=shuffle(eligibleGf()).slice(0,1).map(id=>({n:GF[id].n,g:GF[id].g,d:GF[id].t+'阶功法·'+(GF[id].c||'通用'),p:Math.round(SKPRICE[GF[id].t]*1.5),gf:id,sold:false}));
    const wp=shuffle(eligibleWp()).slice(0,1).map(id=>({n:WP[id].n,g:WP[id].g,ic:WP[id].ic,d:QN[WP[id].q]+'品兵器',p:WPRICE[WP[id].q],wp:id,sold:false}));
    const cs=[...new Set(loadout.filter(x=>x).map(x=>CAT[x]).concat(gongfa.filter(x=>x&&GF[x].c).map(x=>GF[x].c)))],xd=shuffle(cs.length?cs:XDC).slice(0,1).map(c=>({n:'心得·'+c,g:'📜',d:'给对应招式或功法 +60 熟练',p:40,xd:c,sold:false}));
    return g.concat(el,fg,wp,xd);};
  let shop=mkShop();let srf=0;
  const u=n=>'calc(var(--u)*'+n+')';
  const PAN='background:#14120f;border:'+u(3)+' solid '+GOLD+';padding:'+u(16)+';text-align:left;box-sizing:border-box';
  const BT='background:#241d12;border:'+u(2)+' solid #6b5426;color:#f3e7c4;padding:'+u(8)+' '+u(18)+';font-size:'+u(22);
  const pct=m=>{const v=Math.round((m-1)*100);return (v>0?'+':'')+v+'%';};
  const bar=(v,m,c)=>'<div style="height:'+u(16)+';background:#000;border:1px solid #6b5426;margin:'+u(4)+' 0"><div style="height:100%;width:'+Math.max(0,Math.min(100,v/m*100))+'%;background:'+c+'"></div></div>';
  const pCard=id=>{const p=PASSIVES.find(x=>x.id===id);return '<button data-p="'+id+'" '+(picked?'disabled':'')+' style="flex:1 1 '+u(170)+';min-width:'+u(140)+';padding:'+u(14)+';background:#2a2114;border:2px solid #d9b25a;border-radius:10px;color:#f3e7c4;text-align:center;'+(picked&&picked!==id?'opacity:.4':'')+'"><div style="font-size:'+u(42)+'">'+p.g+'</div><div style="font-size:'+u(26)+';font-weight:700">'+p.n+'</div><div style="font-size:'+u(17)+';color:#bfae82;margin-top:'+u(6)+'">'+p.d+'</div></button>';};
  const skCard=(id,extra)=>'<button data-s="'+id+'" '+(picked?'disabled':'')+' style="flex:1 1 '+u(180)+';min-width:'+u(150)+';padding:'+u(14)+';background:#2a2114;border:2px solid #7a5f2c;border-radius:10px;color:#f3e7c4;text-align:center;'+(picked?'opacity:.45':'')+'"><div style="font-size:'+u(44)+'">'+SK[id].g+'</div><div style="font-size:'+u(26)+';font-weight:700">'+SK[id].n+'</div><div style="font-size:'+u(16)+';color:#bfae82;margin-top:4px">'+(TIER[id]?TIER[id]+'阶 · ':'')+(CAT[id]||'')+(FACOF[id]?' · '+FAC[FACOF[id]].n:' · 通用')+'</div><div style="font-size:'+u(15)+';color:#9fb;margin-top:4px">冷却 '+SK[id].cd+' 秒</div></button>';
  function body(){
    if(tab==='sum'){const tot=Object.values(dmgSt).reduce((a,b)=>a+b,0)||1;const dm=Object.keys(dmgSt).map(id=>({id,v:dmgSt[id]})).sort((x,y)=>y.v-x.v).slice(0,5);
      return '<div style="display:flex;gap:'+u(18)+';flex-wrap:wrap;justify-content:center;width:100%"><div style="'+PAN+';flex:1 1 '+u(330)+';max-width:'+u(520)+'"><div style="color:#bfae82;font-size:'+u(20)+'">总结</div><div style="font-size:'+u(26)+';margin:'+u(8)+' 0;line-height:1.7">本波击杀　<b style="color:#ffd76a">'+(kills-waveK0)+'</b>　累计 <b>'+kills+'</b><br>银钱　<b style="color:#ffd76a">'+silver+'</b>　受击 <b>'+(hitsTaken-waveH0)+'</b> 次'+(settle&&settle.zq!=null?'<br>调息：真气 <b style="color:#8fd0ff">'+settle.zq+'</b> → 气血 +<b style="color:#9fe6a0">'+settle.tx+'</b>':'')+(settle&&(settle.gi||settle.li)?'<br>战后自动收回物品 '+settle.gi+' 件'+(settle.li?'，遗失 '+settle.li+' 件':''):'')+'</div><div style="color:#bfae82;font-size:'+u(20)+';margin-top:'+u(8)+'">输出统计</div>'+(dm.map(x=>'<div style="font-size:'+u(20)+'">'+(SK[x.id]?SK[x.id].g+' '+SK[x.id].n:x.id)+' <span style="float:right;color:#ffd76a">'+Math.round(x.v/tot*100)+'%</span></div>'+bar(x.v,tot,'#c99a3a')).join('')||'<div style="color:#8d7a4a;font-size:'+u(18)+'">暂无</div>')+'</div>'+
      '<div style="'+PAN+';flex:1 1 '+u(260)+';max-width:'+u(420)+'"><div style="color:#bfae82;font-size:'+u(20)+'">状态</div><div style="font-size:'+u(24)+';margin-top:'+u(8)+'">气血 '+Math.ceil(hero.hp)+' / '+hero.maxhp+'</div>'+bar(hero.hp,hero.maxhp,'#b3262c')+'<div style="font-size:'+u(22)+';margin-top:'+u(10)+';line-height:1.7">第 '+wave+' / '+WAVES+' 波结束<br>势力　'+(FAC[fac]?FAC[fac].n:'普通乡勇')+'<br>最高连击　'+comboMax+'<br><span style="color:#bfae82;font-size:'+u(18)+'">下一波开始前回复 '+Math.round(30*healMul)+' 点</span></div></div></div>';}
    if(tab==='xl'){
      if(replacing){return '<div style="'+PAN+';width:100%;max-width:'+u(700)+'"><div style="font-size:'+u(28)+';margin-bottom:'+u(10)+'">'+SK[replacing].g+' '+SK[replacing].n+'　替换哪一格？</div><div style="display:flex;gap:'+u(10)+';flex-wrap:wrap">'+loadout.map((x,i)=>'<button data-r="'+i+'" style="flex:1 1 '+u(110)+';padding:'+u(10)+';background:#2a2114;border:2px solid #7a5f2c;border-radius:10px;color:#f3e7c4"><div style="font-size:'+u(32)+'">'+(SK[x]?SK[x].g:'')+'</div><div style="font-size:'+u(18)+'">'+(SK[x]?SK[x].n:'空')+'</div></button>').join('')+'</div><button id="bk" style="'+BT+';margin-top:'+u(12)+'">返回</button></div>';}
      return '<div style="width:100%;max-width:'+u(760)+'"><div style="font-size:'+u(22)+';color:#bfae82;margin-bottom:'+u(10)+'">'+(picked?'已修炼：'+SK[picked].n:'择一项修为（永久加成）')+'</div><div style="display:flex;gap:'+u(14)+';flex-wrap:wrap;justify-content:center">'+opts.map(id=>pCard(id)).join('')+'</div></div>';}
    if(tab==='sh'){return '<div style="width:100%;max-width:'+u(760)+'"><div style="font-size:'+u(22)+';color:#bfae82;margin-bottom:'+u(10)+'">行脚商人　银钱 '+silver+'</div><div style="display:flex;gap:'+u(14)+';flex-wrap:wrap;justify-content:center">'+shop.map((x,i)=>'<button data-b="'+i+'" '+(x.sold||silver<x.p?'disabled':'')+' style="flex:1 1 '+u(170)+';min-width:'+u(140)+';padding:'+u(14)+';background:#2a2114;border:2px solid '+(x.sold||silver<x.p?'#4a3f26':'#d9b25a')+';border-radius:10px;color:#f3e7c4;text-align:center;'+(x.sold?'opacity:.4':silver<x.p?'opacity:.6':'')+'"><div style="font-size:'+u(42)+'">'+gIc(x,u(52))+'</div><div style="font-size:'+u(26)+';font-weight:700">'+x.n+'</div><div style="font-size:'+u(17)+';color:#bfae82;margin:'+u(6)+' 0">'+x.d+'</div><div style="font-size:'+u(22)+';color:#ffd76a">'+(x.sold?'已购':'购买 '+x.p+' 银')+'</div></button>').join('')+'</div></div>';}
    // 武学
    const ib=(at,idx,g,on,lv,ly)=>'<button '+at+'="'+idx+'" style="position:relative;width:'+u(60)+';height:'+u(60)+';background:#241d12;border:2px solid '+(on?'#ffd76a':'#6b5426')+';color:#f3e7c4;font-size:'+u(30)+';padding:0">'+(g||'<span style="opacity:.35">+</span>')+(lv?'<small style="position:absolute;right:'+u(3)+';bottom:'+u(1)+';font-size:'+u(13)+';color:#ffd76a">L'+lv+'</small>':'')+(ly!=null?'<span data-y="'+ly+'" style="position:absolute;left:'+u(3)+';top:'+u(3)+';width:'+u(13)+';height:'+u(13)+';border-radius:50%;border:1px solid #6fc3ff;background:'+(yun[ly]?'#6fc3ff':'#12202e')+(yun[ly]?';box-shadow:0 0 6px #6fc3ff':'')+'"></span>':'')+'</button>';
    const rowS=(lb,cells)=>'<div style="display:flex;align-items:center;gap:'+u(7)+';margin:'+u(7)+' 0"><div style="flex:none;width:'+u(52)+';color:#bfae82;font-size:'+u(19)+'">'+lb+'</div><div style="display:flex;gap:'+u(7)+';flex-wrap:wrap">'+cells+'</div></div>';
    const sk5=a=>{let h='';for(let i=a;i<a+5;i++)h+=ib('data-v',i,SK[loadout[i]]?SK[loadout[i]].g:'',selSlot==='v'+i,SK[loadout[i]]?skLv(loadout[i]):0,SK[loadout[i]]?i:null);return h;};
    let gfh='';for(let i=0;i<3;i++)gfh+=ib('data-g',i,GF[gongfa[i]]?GF[gongfa[i]].g:'',selSlot==='g'+i,GF[gongfa[i]]?gfLv(GF[gongfa[i]]):0);
    const dtl=(kind,id)=>{if(kind==='sk'){const k=SK[id];return '<b style="font-size:'+u(26)+'">'+k.g+' '+k.n+'</b><br>'+(TIER[id]?TIER[id]+'阶 · ':'')+CAT[id]+'<br>冷却 '+k.cd+' 秒'+(k.need?'　触发距离约 '+k.need:'')+'<br>熟练 LV'+skLv(id)+(skLv(id)<10?'（'+Math.floor(skExp[id]||0)+'/'+TH[skLv(id)]+'）':'（已满）')+'　伤害 +'+6*(skLv(id)-1)+'%'+(skLv(id)>=5?'<br>LV5：对精英和首领伤害 +15%':'')+(skLv(id)>=10?'<br>LV10：出手后追加一次余波（60%）':'');}
      if(kind==='xd')return '<b style="font-size:'+u(26)+'">📜 心得·'+id+'</b><br>选中后，点对应类别的招式或功法，给它加 60 点熟练';
      if(kind==='gf'){const g=GF[id];return '<b style="font-size:'+u(26)+'">'+g.g+' '+g.n+'</b><br>'+g.t+'阶 · '+(g.c?g.c+'配套':'通用')+' · '+'LV'+gfLv(g)+'（熟练 '+Math.floor(gfExp[g.id]||0)+(gfLv(g)<10?'/'+TH[gfLv(g)]:' 已满')+'）<br>'+gfDesc(g);}
      const w=WP[id];return '<b style="font-size:'+u(26)+';color:'+QC[w.q]+'">'+gIc(w,u(34))+' '+w.n+'</b><br>'+QN[w.q]+'品兵器（只改面板，不影响武艺熟练）<br>'+wpDesc(w);};
    if(tab==='pk'){const info=it=>it.k==='xd'?'<b style="font-size:'+u(26)+'">📜 心得·'+it.id+'</b><br>给对应招式或功法 +60 熟练（拾取后在背包里使用）':dtl(it.k,it.id);
      return '<div style="width:100%;max-width:'+u(760)+'"><div style="font-size:'+u(19)+';color:#bfae82;margin-bottom:'+u(10)+';line-height:1.5">本波掉落：拾取后不能再卖；没处理的，点“继续”时自动按卖价卖掉</div>'+(pend.length?pend.map((it,i)=>'<div style="'+PAN+';margin-bottom:'+u(10)+';display:flex;gap:'+u(14)+';align-items:center;justify-content:space-between;flex-wrap:wrap"><div style="flex:1 1 '+u(300)+';font-size:'+u(19)+';line-height:1.6;color:#d9cba0">'+info(it)+'</div><div style="display:flex;gap:'+u(10)+'"><button data-pk="'+i+'" style="'+BT+';border-color:#d9b25a;background:#6b4a14">拾取</button><button data-ps="'+i+'" style="'+BT+'">卖 '+sellP(it)+' 银</button></div></div>').join(''):'<div style="color:#8d7a4a;font-size:'+u(22)+';text-align:center;padding:'+u(40)+'">本波没有掉落</div>')+'</div>';}
    let dh='<span style="color:#8d7a4a">点选一个格子或背包物品查看</span>';
    if(bagSel!=null&&bag[bagSel]){const it=bag[bagSel];dh=dtl(it.k,it.id)+'<div style="color:#9fb;font-size:'+u(17)+';margin-top:'+u(6)+'">再点对应的格子即可装备（已拾取的不能再卖）</div>';}
    else if(selSlot[0]==='v'&&SK[loadout[+selSlot.slice(1)]])dh=dtl('sk',loadout[+selSlot.slice(1)])+'<br><button data-un="v'+selSlot.slice(1)+'" style="'+BT+';margin-top:'+u(8)+'">卸下</button>';
    else if(selSlot[0]==='g'&&GF[gongfa[+selSlot.slice(1)]])dh=dtl('gf',gongfa[+selSlot.slice(1)])+'<br><button data-un="g'+selSlot.slice(1)+'" style="'+BT+';margin-top:'+u(8)+'">卸下</button>';
    else if(selSlot[0]==='w'&&WP[weapon])dh=dtl('wp',weapon)+'<br><button data-un="w'+0+'" style="'+BT+';margin-top:'+u(8)+'">卸下</button>';
    let est=0;loadout.forEach((id,i)=>{if(id&&yun[i]){const k=SK[id];est+=Math.round((WAVE_T[wave]||60)/((k.cd*wpCd)+(WU[id]||0.3)*1.2+0.15))*(YC[TIER[id]]||4);}});
    const regen=(1+0.6*aEff(13))*(WAVE_T[wave]||60),estH='<div style="margin-top:'+u(8)+';font-size:'+u(16)+';color:#8fd0ff;line-height:1.5">真气 '+zqMax+'（每波开打前回满，另有回复）<br>点亮的运劲灯，下一波约耗 '+est+(est>zqMax+regen?'　<b style="color:#ff9a8a">可能不够</b>':est?'　够用':'')+'<br><span style="color:#8d7a4a">点格子左上角的小灯开关运劲，耗真气换 +35% 伤害和 +20% 范围</span></div>';
    const attrH='<div style="margin-top:'+u(10)+';font-size:'+u(15)+';color:#8fa6bf;line-height:1.6">筋骨 '+aEff(8).toFixed(1)+'（减伤 '+Math.round((1-AP.take)*100)+'%）　避锋 '+aEff(9).toFixed(1)+'（免伤 '+Math.round(dodgeP()*100)+'%）<br>威势 '+aEff(10).toFixed(1)+'（范围 +'+Math.round((RNGB-1)*100)+'%）　杀伐 '+aEff(11).toFixed(1)+'（暴伤 +'+Math.round(critDmg()*100)+'%）<br>气海 '+aEff(12).toFixed(1)+'　回元 '+aEff(13).toFixed(1)+'（调息 '+Math.round(hyRate()*100)+'%）</div>';
    const cnt={};loadout.forEach(x=>{const q=FACOF[x];if(q)cnt[q]=(cnt[q]||0)+1;});
    const bagH=bag.map((it,i)=>{const nm=it.k==='xd'?{g:'📜',n:'心得·'+it.id}:it.k==='sk'?SK[it.id]:it.k==='gf'?GF[it.id]:WP[it.id];return '<button data-bg="'+i+'" style="padding:'+u(8)+' '+u(14)+';background:'+(bagSel===i?'#6b4a14':'#241d12')+';border:2px solid '+(it.k==='wp'?QC[WP[it.id].q]:'#d9b25a')+';border-radius:8px;color:#f3e7c4;font-size:'+u(21)+'">'+gIc(nm,u(26))+' '+nm.n+'<span style="font-size:'+u(14)+';color:#bfae82"> '+(it.k==='xd'?'熟练':it.k==='sk'?(isSpell(it.id)?'术法':'武艺'):it.k==='gf'?'功法':'兵器')+'</span></button>';}).join('')||'<span style="color:#7a6c4a">无</span>';
    return '<div style="width:100%;max-width:'+u(900)+'"><div style="display:flex;gap:'+u(18)+';flex-wrap:wrap;justify-content:center;width:100%"><div style="'+PAN+';flex:1 1 '+u(330)+';max-width:'+u(520)+'">'+rowS('武器',ib('data-w',0,gIc(WP[weapon],u(48)),selSlot==='w0'))+rowS('招式',sk5(0))+rowS('功法',gfh)+estH+'</div>'+
    '<div style="'+PAN+';flex:1 1 '+u(260)+';max-width:'+u(420)+';font-size:'+u(20)+';line-height:1.6;color:#d9cba0"><div style="color:#bfae82;font-size:'+u(18)+'">详情</div>'+dh+attrH+(Object.keys(cnt).length?'<div style="margin-top:'+u(10)+';font-size:'+u(16)+';color:#bfae82">势力共鸣：'+Object.keys(cnt).map(q=>FAC[q].n+'×'+cnt[q]).join('、')+'</div>':'')+'</div></div>'+
    '<div style="margin-top:'+u(14)+';font-size:'+u(20)+';color:#bfae82">背包'+(bagSel!=null?'（再点对应格子装备）':'（先点一件）')+'</div><div style="display:flex;gap:'+u(10)+';flex-wrap:wrap;margin-top:'+u(8)+'">'+bagH+'</div></div>';}
  function stats(){const c=(l,v)=>'<div style="flex:1 1 '+u(56)+';text-align:center;white-space:nowrap"><div style="font-size:'+u(15)+';color:#bfae82">'+l+'</div><div style="font-size:'+u(19)+';font-weight:700">'+v+'</div></div>';
    return c('气血',Math.ceil(hero.hp)+'/'+hero.maxhp)+c('伤害',pct(allMul))+c('受伤',pct(takeMul))+c('移速',pct(spdMul))+c('闪身',DCD.toFixed(2)+'s')+c('击杀',kills)+c('银钱',silver);}
  function draw(){
    const tabs=[['sum','结算'],['pk','拾取'+(pend.length?'·'+pend.length:'')],['xl','修炼'],['sh','行商'],['wx','武学']];
    const rf=tab==='xl'?(!picked&&!replacing?'<button id="rf" '+(silver<15+10*rc?'disabled style="opacity:.5;'+BT+'"':'style="'+BT+'"')+'>刷新　'+(15+10*rc)+' 银</button>':''):tab==='sh'?'<button id="rf" '+(silver<20+10*srf?'disabled style="opacity:.5;'+BT+'"':'style="'+BT+'"')+'>刷新　'+(20+10*srf)+' 银</button>':'';
    ov.innerHTML='<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:'+u(20)+';box-sizing:border-box;background:rgba(8,6,3,.93);gap:'+u(14)+'">'+
      '<div style="width:100%;display:flex;justify-content:space-between;align-items:center"><div style="margin-left:'+u(64)+';border:2px solid '+GOLD+';padding:'+u(6)+' '+u(16)+';font-size:'+u(26)+';background:#14120f">🪙 '+silver+'</div><div style="font-size:'+u(20)+';color:#bfae82">第 '+wave+' 波结束</div></div>'+
      '<div style="display:flex;gap:'+u(6)+';width:100%;max-width:'+u(760)+'">'+tabs.map(t=>'<button data-t="'+t[0]+'" style="flex:1;padding:'+u(12)+' 0;font-size:'+u(25)+';background:'+(tab===t[0]?'#6b4a14':'#1b1710')+';border:2px solid '+(tab===t[0]?'#ffd76a':'#6b5426')+';color:#f3e7c4">'+t[1]+'</button>').join('')+'</div>'+
      '<div style="flex:1;width:100%;overflow:auto;display:flex;justify-content:center;align-items:flex-start;padding-top:'+u(6)+'">'+body()+'</div>'+
      '<div style="width:100%;max-width:'+u(900)+';display:flex;flex-wrap:wrap;gap:'+u(6)+';background:#14120f;border:'+u(3)+' solid '+GOLD+';padding:'+u(8)+';box-sizing:border-box">'+stats()+'</div>'+
      '<div style="width:100%;max-width:'+u(900)+';display:flex;justify-content:space-between;align-items:center;gap:'+u(12)+'"><div style="min-width:'+u(120)+'">'+rf+'</div><button id="nextW" style="'+BTN+'">继续</button></div></div>';
    ov.style.display='flex';
    ov.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;replacing=null;draw();});
    $('nextW').onclick=next;
    const rfb=$('rf');if(rfb)rfb.onclick=()=>{if(tab==='xl'){const c=15+10*rc;if(silver<c)return;silver-=c;rc++;opts=pickPassives();}else{const c=20+10*srf;if(silver<c)return;silver-=c;srf++;shop=mkShop();}draw();};
    ov.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{if(picked)return;const p=PASSIVES.find(x=>x.id===b.dataset.p);applyFx(p.fx);if(p.pick)pickR*=p.pick;if(p.gold)goldMul*=p.gold;picked=p.id;draw();});
    ov.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{const id=b.dataset.s,e=loadout.indexOf('');if(e>=0){loadout[e]=id;cds[e]=0.2;buildHud();syncSel();picked=id;}else replacing=id;draw();});
    ov.querySelectorAll('[data-r]').forEach(r=>r.onclick=()=>{const k=+r.dataset.r;loadout[k]=replacing;cds[k]=0.2;buildHud();syncSel();picked=replacing;replacing=null;draw();});
    const bk=$('bk');if(bk)bk.onclick=()=>{replacing=null;draw();};
    ov.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{const x=shop[+b.dataset.b];if(x.sold||silver<x.p)return;silver-=x.p;x.sold=true;if(x.skill)gainSkill(x.skill);else if(x.gf)gainGf(x.gf);else if(x.wp)gainWp(x.wp);else if(x.xd)bag.push({k:'xd',id:x.xd});else applyFx(x.fx);draw();});
    const aft=()=>{bagSel=null;draw();};
    ov.querySelectorAll('[data-y]').forEach(sp=>sp.onclick=ev=>{ev.stopPropagation();const i=+sp.dataset.y;yun[i]=!yun[i];draw();});
    ov.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{const i=+b.dataset.v;if(bagSel!=null&&bag[bagSel]&&bag[bagSel].k==='xd'){if(useXd(bagSel,'v',i))aft();else draw();return;}if(bagSel!=null&&equipFromBag(bagSel,i)){aft();return;}selSlot='v'+i;if(bagSel!=null)bagSel=null;draw();});
    ov.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{const i=+b.dataset.g;if(bagSel!=null&&bag[bagSel]&&bag[bagSel].k==='xd'){if(useXd(bagSel,'g',i))aft();else draw();return;}if(bagSel!=null&&equipFromBag(bagSel,i)){aft();return;}selSlot='g'+i;bagSel=null;draw();});
    ov.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{if(bagSel!=null&&equipFromBag(bagSel,0)){aft();return;}selSlot='w0';bagSel=null;draw();});
    ov.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{const i=+b.dataset.pk,it=pend[i];if(!it)return;pend.splice(i,1);if(it.k==='sk')gainSkill(it.id);else if(it.k==='gf')gainGf(it.id);else if(it.k==='wp')gainWp(it.id);else gainXd(it.id);draw();});
    ov.querySelectorAll('[data-ps]').forEach(b=>b.onclick=()=>{const i=+b.dataset.ps,it=pend[i];if(!it)return;silver+=sellP(it);pend.splice(i,1);draw();});
    ov.querySelectorAll('[data-un]').forEach(b=>b.onclick=()=>{const t=b.dataset.un,i=+t.slice(1);if(t[0]==='w'){if(weapon){bag.push({k:'wp',id:weapon});weapon='';recalcGear();}}else if(t[0]==='v'){const id=loadout[i];if(id){bag.push({k:'sk',id});loadout[i]='';buildHud();syncSel();}}else if(t[0]==='g'){const id=gongfa[i];if(id){bag.push({k:'gf',id});gongfa[i]='';recalcGear();}}selSlot='';draw();});
    ov.querySelectorAll('[data-bg]').forEach(b=>b.onclick=()=>{bagSel=+b.dataset.bg;draw();});
  }
  draw();
}
const BTN='font-size:calc(var(--u)*32);padding:calc(var(--u)*12) calc(var(--u)*40);border-radius:10px;border:2px solid #d9b25a;background:#6b4a14;color:#fff';
function startBoss(){bossPhase=true;enemies.length=0;spawn('zhangjiao',200,-1.57);floatTxt('张角出场','#ff9a6a');}
function endReport(win){const dm=Object.keys(dmgSt).map(id=>({id,g:SK[id]?SK[id].g:'?',n:SK[id]?SK[id].n:id,v:dmgSt[id]})).sort((x,y)=>y.v-x.v);
  let bg='';try{bg=cv.toDataURL('image/jpeg',0.55);}catch(e){}
  return {t:'end',bg,win,kills,time:Math.floor(tclock),wave:Math.min(wave,WAVES),waves:WAVES,combo:comboMax,hp:Math.ceil(hero.hp),dmg:dm,loadout:loadout.filter(id=>SK[id]).map(id=>SK[id].g),cat:mainCat,fac,facs:[...new Set(loadout.map(x=>FACOF[x]).filter(Boolean))],stats:{kills,pd:pdCnt,hits:hitsTaken,hitsW4,bruteK,archK,win},...calcGrade(win)};}
function heroWin(){won=true;over=true;if(parent!==window){parent.postMessage(endReport(true),'*');return;}showOv('<div style="font-size:calc(var(--u)*52);font-weight:700;color:#f0c24a">大破黄巾</div><div style="font-size:calc(var(--u)*26)">击倒 '+kills+'　剩余血量 '+Math.ceil(hero.hp)+'</div><button id="again" style="'+BTN+'">再来一局</button>');$('again').onclick=()=>location.reload();}

function ringR(){const kk=cv.height/VH;const vw=cv.width/kk;return Math.hypot(vw/2,VH/2)+50;}
let edgeO=0,edgeAng=0,batchT=0,offT=0,moraleMul=1,gs=1,genDone={},offMsg=false;
function bndR(){const kk=cv.height/VH,vw=cv.width/kk;return Math.max(520,vw*1.2)*(1-0.019*Math.max(0,Math.min(wave,WAVES)-1))*gs;}
function spawn(type,rad,ang){
  if(ang==null&&Math.random()<0.6){const base=edgeO>0.05?edgeAng:(hero.moving?hero.fa:Math.random()*6.283);ang=base+(Math.random()-0.5)*2.4;}
  const a=ang==null?Math.random()*6.283:ang,r=rad==null?ringR()+Math.random()*60:rad;
  enemies.push({type,x:hero.x+Math.cos(a)*r,y:hero.y+Math.sin(a)*r/SQ,hp:TYPES[type].boss?TYPES[type].hp:TYPES[type].hp*(TYPES[type].hp>=6?2:3)*(1+HP_SCALE*Math.max(0,wave-1)),wk:Math.random()*6,fa:0});
}
function targetN(){const cap=innerWidth<innerHeight||innerWidth<700?100:150;const row=waveRow();return Math.min(N,cap,row.n+Math.max(0,wave-WAVE_TABLE.length)*14);}
for(let i=0;i<70;i++)spawn(pickType(),90+Math.random()*(ringR()*1.1));
function setN(v){N=v;$('vN').textContent=v;}setN(250);
$('gear').onclick=()=>$('panel').classList.toggle('open');
$('sS').oninput=e=>{S=+e.target.value;};
$('sN').oninput=e=>{setN(+e.target.value);};
$('sQ').oninput=e=>{SQ=+e.target.value;};
$('cHud').onchange=e=>{$('hud').classList.toggle('off',!e.target.checked);};
$('bGua').onclick=endWave;
$('vAuto').onclick=()=>{phoneSim=false;$('vAuto').classList.add('act');$('vPhone').classList.remove('act');resize();};
$('vPhone').onclick=()=>{phoneSim=true;$('vPhone').classList.add('act');$('vAuto').classList.remove('act');resize();};
document.querySelectorAll('[data-boss]').forEach(b=>b.onclick=()=>spawn(b.dataset.boss));
$('bClear').onclick=()=>{for(let i=enemies.length-1;i>=0;i--)if(TYPES[enemies[i].type].boss)enemies.splice(i,1);};

function clamp(v,a,b){return v<a?a:v>b?b:v;}
const H8=[['E',1],['SE',1],['S',1],['SE',-1],['E',-1],['NE',-1],['N',1],['NE',1]];
function sect(a){return((Math.round(a/(Math.PI/4))%8)+8)%8;}
function fireSlash(){
  let best=null,bd=1e9;for(const e of enemies){const d=Math.hypot(e.x-hero.x,(e.y-hero.y)*SQ);if(d<bd){bd=d;best=e;}}
  let dx=Math.cos(hero.fa),dy=Math.sin(hero.fa);if(best&&bd<520){const ex=best.x-hero.x,ey=(best.y-hero.y)*SQ;const l=Math.hypot(ex,ey)||1;dx=ex/l;dy=ey/l;}
  slashes.push({x:hero.x+dx*18*S,y:hero.y,dx,dy,t:0,hit:new Set(),sc:S,mul:profMul()});
  effects.push({t:0,x:hero.x+dx*6*S,y:hero.y,dx,dy});
}
function tryDash(){
  if(paused||over||hero.dash||stiff>0||dashCd>0)return;
  let ix=0,iy=0;
  if(keys['a']||keys['arrowleft'])ix-=1;if(keys['d']||keys['arrowright'])ix+=1;
  if(keys['w']||keys['arrowup'])iy-=1;if(keys['s']||keys['arrowdown'])iy+=1;
  if(stick){ix+=stick.dx;iy+=stick.dy;}
  let l=Math.hypot(ix,iy);if(l<0.1){ix=Math.cos(hero.fa);iy=Math.sin(hero.fa);l=1;}
  hero.dash={t:0,g:0,dx:ix/l,dy:iy/l};sfx('dash');hero.fa=Math.atan2(iy,ix);dashCd=DCD;if(wind){skipFl[wind.i]=0.35;wind=null;qi=(qi+1)%5;qt=0;}
}
const drops=[],bag=[],loot=[];const HEALI=ITEMS[0];let settle=null,pickR=1,goldMul=1;
function dropAt(x,y,o){if(drops.length>=80)drops.shift();drops.push(Object.assign({x:x+(Math.random()-.5)*28,y:y+(Math.random()-.5)*12,t:0,ph:Math.random()*6},o));}
function eligibleScrolls(){const have=loadout.concat(bag.concat(loot).filter(x=>x.k==='sk').map(x=>x.id));return SKID.filter(id=>have.indexOf(id)<0&&(!TIER[id]||wave>=TMIN[TIER[id]]));}
function gainSkill(id){const a=0;let e=-1;for(let i=a;i<a+5;i++)if(!loadout[i]){e=i;break;}if(e>=0){loadout[e]=id;cds[e]=0.2;buildHud();syncSel();floatTxt('习得 '+SK[id].n,'#8fe0ff');}else{bag.push({k:'sk',id});floatTxt('拾得残卷：'+SK[id].n+'（战后可换装）','#8fe0ff');}}
function lootRoll(tries){const ks=['sk','gf','wp','xd'],w=[35,25,25,15];let order=[];const pool=ks.slice(),ww=w.slice();while(pool.length){let r=Math.random()*ww.reduce((a,b)=>a+b,0),q=0;while(q<ww.length-1&&r>=ww[q]){r-=ww[q];q++;}order.push(pool[q]);pool.splice(q,1);ww.splice(q,1);}
  for(const k of order){let id=null;if(k==='xd')id=XDC[Math.floor(Math.random()*5)];else{const el=k==='sk'?eligibleScrolls():k==='gf'?eligibleGf():eligibleWp();if(!el.length)continue;let best=-1;for(let t=0;t<tries;t++){const c=el[Math.floor(Math.random()*el.length)],r=k==='sk'?(TMIN[TIER[c]]||0):k==='gf'?GTIER[GF[c].t]:WP[c].q;if(r>best){best=r;id=c;}}}
    if(id){loot.push({k,id});floatTxt('掉落：'+(k==='xd'?'心得·'+id:k==='sk'?SK[id].n:k==='gf'?GF[id].n:WP[id].n),'#8fe0ff');return;}}}
function spawnDrops(e,et){const sv=DROP.silver[et];
  if(sv){const g=Math.round(sv*goldMul);silver+=g;if(et>=2)floatTxt('+'+g+' 银','#ffe28a');}
  if(Math.random()<DROP.heal[et])dropAt(e.x,e.y,{k:'item',it:HEALI});
  let ni=Math.random()<DROP.item[et]?1:0;if(et===3)ni=1;
  for(let i=0;i<ni;i++){const it=ITEMS[Math.floor(Math.random()*ITEMS.length)];dropAt(e.x,e.y,{k:'item',it});}
  const gn=et===3?2:(Math.random()<DROP.gear[et]?1:0);for(let i=0;i<gn;i++)lootRoll(et===3?3:1);}
function collect(d){if(d.k==='silver'){silver+=Math.round(d.v*goldMul);floatTxt('+'+Math.round(d.v*goldMul)+' 银','#ffe28a');}else if(d.k==='item'){applyFx(d.it.fx);floatTxt(d.it.n+'：'+d.it.d,'#9fe6a0');}else if(d.k==='scroll')gainSkill(d.id);else if(d.k==='gf')gainGf(d.id);else if(d.k==='wp')gainWp(d.id);else if(d.k==='xd')gainXd(d.id);}
function settleDrops(){let gs=0,ls=0,gi=0,li=0;for(const d of drops){if(d.k==='silver'){const g=Math.floor(d.v*goldMul*0.7);silver+=g;gs+=g;ls+=Math.round(d.v*goldMul)-g;}else{if(Math.random()<0.7){collect(d);gi++;}else li++;}}drops.length=0;settle={gs,ls,gi,li};}
function kill(j,p){cbT=2;const e=enemies[j],T=TYPES[e.type];if(e.type==='brute'||e.type==='brute2'||T.boss){bruteK++;stopT=Math.max(stopT,0.08);shk=Math.max(shk,7);}if(e.type==='archer')archK++;enemies.splice(j,1);kills++;{gainProf(e);zq=Math.min(zqMax,zq+1);if(xj.killHeal)hero.hp=Math.min(hero.maxhp,hero.hp+hero.maxhp*xj.killHeal);if(xj.silverP&&Math.random()<xj.silverP)silver+=3;}{const et=ETIER[e.type]!=null?ETIER[e.type]:0;if(et===0){if(Math.random()<DROP.coin)silver+=1;}spawnDrops(e,et);}combo++;if(combo>comboMax)comboMax=combo;comboT=2;
  corpses.push({x:e.x,y:e.y,t:0,vx:p.dx*150,vy:p.dy*70/SQ,rot:(Math.random()*2-1)*6,flip:p.dx<0?1:-1,T});}

// ===== 武艺系统 =====
const fxs=[];
let curK=null,mainCat='短兵';
const CAT={jian:'短兵',hengsao:'短兵',lianzhan:'短兵',xuanfeng:'短兵',daolun:'短兵',qiang:'长兵',feidao:'射艺',jianyu:'射艺',huogong:'道术',pili:'道术',zhendi:'短兵',chong:'体术',dilie:'短兵',shuanghuan:'短兵',sixiang:'短兵',tianbeng:'短兵',huima:'短兵',feilun:'短兵',xuehe:'短兵',wanren:'短兵'};
const TIER={hengsao:'黄',lianzhan:'黄',xuanfeng:'玄',zhendi:'玄',dilie:'地',shuanghuan:'地',sixiang:'天',tianbeng:'天',huima:'黄',feilun:'玄',xuehe:'地',wanren:'天'},TMIN={'黄':0,'玄':2,'地':4,'天':6};
function profMul(){return curK?profOf(CAT[curK.id]):1;}
function addFx(life,upd,drw){const k=curK,yy=yunOn,w=upd&&(k?((dt,t)=>{const o=curK,oy=yunOn;curK=k;yunOn=yy;try{upd(dt,t);}finally{curK=o;yunOn=oy;}}):upd);fxs.push({t:0,life,upd:w,drw});}
function spark(x,y,dx,dy){const a0=Math.atan2(dy,dx),n=5,ang=[];for(let i=0;i<n;i++)ang.push(a0+(Math.random()*2-1)*1.1);
  addFx(0.18,null,t=>{const k=t/0.18;ctx.save();ctx.globalAlpha=1-k;ctx.strokeStyle='#ffb347';ctx.lineWidth=2*S;ctx.lineCap='round';const cy=y*SQ-14*S;
    for(const a of ang){ctx.beginPath();ctx.moveTo(x+Math.cos(a)*(6+14*k)*S,cy+Math.sin(a)*(6+14*k)*S*0.8);ctx.lineTo(x+Math.cos(a)*(12+22*k)*S,cy+Math.sin(a)*(12+22*k)*S*0.8);ctx.stroke();}ctx.restore();});}
function hasEnemy(r){for(const e of enemies){const dx=e.x-hero.x,dy=(e.y-hero.y)*SQ;if(dx*dx+dy*dy<r*r)return true;}return false;}
function nearest(k,maxd){return enemies.map(e=>({e,d:Math.hypot(e.x-hero.x,(e.y-hero.y)*SQ)})).filter(o=>o.d<maxd).sort((a,b)=>a.d-b.d).slice(0,k).map(o=>o.e);}

// ===== 合成音效（WebAudio，无外部文件）=====
let AC=null,NB=null,sfxT={};
function acx(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();const n=AC.sampleRate*0.5,b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;NB=b;}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC;}
addEventListener('pointerdown',acx);addEventListener('keydown',acx);
// --- 战场配乐接线 ---
let BGMo=null,bgmWave=-1,bgmBoss=false;
setInterval(()=>{const a=AC;if(!a||typeof started==='undefined'||!started)return;
  if(!BGMo){BGMo=makeBGM(a,a.destination,NB);}
  if(over){BGMo.stop();return;}
  BGMo.resume&&BGMo.resume();
  if(wave!==bgmWave){if(bgmWave>0&&wave>bgmWave)BGMo.gong();bgmWave=wave;BGMo.setLevel(1+Math.floor((wave-1)/2));}
  if(bossPhase!==bgmBoss){bgmBoss=bossPhase;BGMo.boss(bossPhase);}
  BGMo.duck(paused?.35:1);
  if(!window.__bgmV){window.__bgmV=1;const b=document.createElement('div');b.style.cssText='position:fixed;right:8px;top:8px;z-index:6;padding:4px 10px;background:#000a;color:#e8d9a8;border:1px solid #8a7440;font:14px sans-serif;cursor:pointer;user-select:none';
    const set=v=>{BGMo.ver(v);b.textContent='配乐 '+(v===2?'B 大气版':'A 旌旗北望')+'（点我/M键切换）';};set(2);
    b.onclick=()=>set(BGMo.getVer()===2?1:2);addEventListener('keydown',e=>{if(e.code==='KeyM')b.onclick();});document.body.appendChild(b);}},300);
function sfx(k){const a=acx();if(!a)return;const now=a.currentTime,lim={hit:0.045,kill:0.06,hurt:0.12,dash:0.1,swing:0.12,shield:0.06,arrow:0.1};if(now-(sfxT[k]||-9)<(lim[k]||0.05))return;sfxT[k]=now;
 const g=a.createGain();g.connect(a.destination);
 const noise=(dur,f0,f1,q,vol,type)=>{const s=a.createBufferSource();s.buffer=NB;s.playbackRate.value=0.8+Math.random()*0.4;const f=a.createBiquadFilter();f.type=type||'bandpass';f.Q.value=q;f.frequency.setValueAtTime(f0,now);f.frequency.exponentialRampToValueAtTime(f1,now+dur);const v=a.createGain();v.gain.setValueAtTime(vol,now);v.gain.exponentialRampToValueAtTime(0.001,now+dur);s.connect(f);f.connect(v);v.connect(g);s.start(now);s.stop(now+dur+0.02);};
 const tone=(dur,f0,f1,vol,type)=>{const o=a.createOscillator();o.type=type||'sine';o.frequency.setValueAtTime(f0,now);o.frequency.exponentialRampToValueAtTime(f1,now+dur);const v=a.createGain();v.gain.setValueAtTime(vol,now);v.gain.exponentialRampToValueAtTime(0.001,now+dur);o.connect(v);v.connect(g);o.start(now);o.stop(now+dur+0.02);};
 const r=0.9+Math.random()*0.25;g.gain.value=0.55;
 if(k==='hit'){noise(0.09,2600*r,900,1.2,0.9);tone(0.08,190*r,70,0.7);}
 else if(k==='kill'){noise(0.16,1800*r,300,0.9,1);tone(0.18,150*r,45,0.95);noise(0.05,5000,3000,2,0.4,'highpass');}
 else if(k==='shield'){tone(0.14,1250*r,980,0.35,'square');noise(0.1,4000,2000,3,0.5);tone(0.1,160,80,0.5);}
 else if(k==='hurt'){tone(0.22,120,40,1,'sine');noise(0.15,900,200,0.8,0.9);}
 else if(k==='dash'){noise(0.2,400,3200*r,1.5,0.45);}
 else if(k==='swing'){noise(0.22,500,2400*r,1.8,0.5);}
 else if(k==='arrow'){noise(0.12,3000,1200,2,0.3);}
}

const TITLES={wanren:{n:'万人敌',up:'周围每有1名敌人，伤害+4%（上限+40%）',dn:'闪身冷却翻倍',cond:'单局击杀 300'},
 tiebi:{n:'铁壁',up:'受到伤害-30%',dn:'移速-15%',cond:'前4波不被击中'},
 jifeng:{n:'疾风',up:'移速+15%，闪身冷却-30%',dn:'最大生命-25%',cond:'单局完美闪避 8 次'},
 zhanjiang:{n:'斩将',up:'对力士、首领伤害+40%',dn:'对小兵伤害-15%',cond:'单局击杀力士/首领 3 名'},
 pojun:{n:'破军',up:'全部伤害+15%',dn:'受到伤害+25%',cond:'通关（击败张角）'},
 shenshe:{n:'神射',up:'射艺类伤害+30%',dn:'近战类伤害-20%',cond:'单局击杀弓手 15 名'}};
function applyTitle(id){const m={wanren(){crowdMul=true;DCD=1.8},tiebi(){takeMul=.7;spdMul=.85},jifeng(){spdMul=1.15;DCD=0.63;hero.maxhp=90;hero.hp=90},zhanjiang(){bigMul=1.4;smallMul=.85},pojun(){allMul=1.15;takeMul=1.25},shenshe(){rangedMul=1.3;meleeMul=.8}};if(m[id])m[id]();}
function titleMul(e){let m=allMul*moraleMul;if(cbOn&&cbT>0)m*=1.2;if(rgOn&&rgT>0)m*=1.25;if(crowdMul){m*=1+Math.min(.4,nearest(40,150).length*.04)}const big=(e.type==='brute'||e.type==='brute2'||TYPES[e.type].boss);m*=big?bigMul:smallMul;m*=gearAll;if(echoOn)m*=0.6;if(yunOn)m*=1.35;if(curK){const c=CAT[curK.id];m*=gearCat[c]||1;{const sl=skLv(curK.id);m*=1+0.06*(sl-1);if(sl>=5&&ETIER[e.type]>=1)m*=1.15;}if(c==='射艺')m*=rangedMul;else if(c==='短兵'||c==='长兵')m*=meleeMul;}return m;}
const FACOF={};for(const k in FAC)(FAC[k].tags||[]).forEach(t=>FACOF[t]=k);
function applyFac(id){fac=id;if(FAC[id])applyFx(FAC[id].fx);}
function calcGrade(win){const sc=Math.round((Math.min(wave,WAVES)/WAVES)*40+(win?20:0)+(win?hero.hp/hero.maxhp*10:0)+(hitsTaken<=5?15:hitsTaken<=12?8:hitsTaken<=25?3:0)+Math.min(10,kills/40)+Math.min(5,comboMax/30));
 const g=sc>=85?'名将':sc>=70?'校尉':sc>=55?'都伯':sc>=35?'伍长':'小卒';return {score:sc,grade:g};}
function hurt(e,d,dx,dy,kb){if(e.inv||e.hide)return;if(ampT>0)d*=1.4;d*=profMul()*titleMul(e);const cc0=curK?CAT[curK.id]:'';if(hasGf('xingyun')&&shi)d*=1+.06*shi;if(hasGf('beishui')&&hero.hp<hero.maxhp*.3)d*=1.25;const lf=hasGf('lhj')&&noHitT>=3;if(lf){noHitT=0;floatTxt('连环劲','#ffd76a');}const crit=lf||Math.random()<critP+(xj.critC[cc0]||0);if(crit)d*=1.5+critDmg()+(xj.critD[cc0]||0);if(dnums.length<50)dnums.push({x:e.x+(Math.random()*14-7),y:e.y,t:0,v:Math.max(1,Math.round(d*10)),crit});if(crit||e.type==='brute'||e.type==='brute2'){stopT=Math.max(stopT,crit?0.05:0.035);shk=Math.max(shk,crit?5:3);}e.hitT=0.2;e.flashT=0.09;sfx((e.hp-d<=0)?'kill':(e.type==='immortal'?'shield':'hit'));if(fxs.length<140)spark(e.x,e.y,dx,dy);if(curK)dmgSt[curK.id]=(dmgSt[curK.id]||0)+Math.round(Math.min(d,Math.max(e.hp,0)+0.0001)*10);if(!isFinite(dx)||!isFinite(dy)){dx=0;dy=0;}e.hp-=d;if(e.hp<=0){const j=enemies.indexOf(e);if(j>=0)kill(j,{dx,dy});}else{kb*=(TYPES[e.type].kbm||1);e.x+=dx*kb;e.y+=dy*kb/SQ;}}
function aimDir(){const n=nearest(1,600)[0];if(n){const ex=n.x-hero.x,ey=(n.y-hero.y)*SQ,l=Math.hypot(ex,ey)||1;return [ex/l,ey/l];}return [Math.cos(hero.fa),Math.sin(hero.fa)];}
function rndPts(k,maxd){maxd*=0.6;const ts=nearest(30,maxd).sort(()=>Math.random()-0.5).slice(0,k).map(e=>[e.x,e.y]);while(ts.length<k){const a=Math.random()*6.283,r=80+Math.random()*150;ts.push([hero.x+Math.cos(a)*r,hero.y+Math.sin(a)*r/SQ]);}return ts;}
function inC(x,y,r,f){for(const e of enemies.slice()){const dx=e.x-x,dy=(e.y-y)*SQ;if(dx*dx+dy*dy<(r+TYPES[e.type].r*S*0.6)**2)f(e,dx,dy);}}
function nrm(dx,dy){const l=Math.hypot(dx,dy)||1;return [dx/l,dy/l];}
function sweep(a0,half,R,dmg,kb,dir,col){const hit=[];
  for(const e of enemies.slice()){const ex=e.x-hero.x,ey=(e.y-hero.y)*SQ/0.8,d=Math.hypot(ex,ey);if(d>R+TYPES[e.type].r*S*0.6)continue;let da=Math.atan2(ey,ex)-a0;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)<=half||d<28*S)hit.push([e,ex,ey]);}
  for(const [e,ex,ey] of hit){const [nx,ny]=nrm(ex,ey*0.8);hurt(e,dmg,nx,ny,kb);}
  const L=0.4;addFx(L,null,t=>{const p=Math.min(1,t/(L*0.55)),st=a0-dir*half,cur=st+dir*2*half*p,al=1-t/L;ctx.save();ctx.translate(hero.x,hero.y*SQ-18*S);ctx.scale(1,0.8);ctx.globalAlpha=al;ctx.lineCap='round';
    for(const [w,c] of [[R*0.5,col[0]],[R*0.2,col[1]],[R*0.06,'#fff']]){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.arc(0,0,R-w/2,Math.min(st,cur),Math.max(st,cur));ctx.stroke();}ctx.restore();});}
let RM=0.4;const RP=0.5;
const SK={
 jian:{n:'剑气',g:'⚔',cd:0.8,need:520,cast(){fireSlash();}},
 feidao:{n:'飞刀',g:'🗡',cd:1.3,need:480,cast(){const [dx0,dy0]=aimDir(),a0=Math.atan2(dy0,dx0);
   for(const da of [-0.22,0,0.22]){const dx=Math.cos(a0+da),dy=Math.sin(a0+da);let px=hero.x,py=hero.y;const hit=new Set();
   addFx(0.9*RP,dt=>{px+=dx*430*dt;py+=dy*430*dt/SQ;for(const e of enemies.slice()){if(hit.has(e))continue;const ex=e.x-px,ey=(e.y-py)*SQ;if(ex*ex+ey*ey<(16*S+TYPES[e.type].r*0.5)**2){hit.add(e);hurt(e,2,dx,dy,7);}}},
   t=>{ctx.save();ctx.translate(px,py*SQ-20*S);ctx.rotate(t*26);ctx.fillStyle='#e8f3ff';ctx.strokeStyle='#445';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-9*S,-2*S);ctx.lineTo(10*S,0);ctx.lineTo(-9*S,2*S);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();});}}},
 qiang:{n:'枪刺',g:'🔱',cd:1.6,need:230,cast(){const [dx,dy]=aimDir(),L=190*S*RM,W=20*S,hx=hero.x,hy=hero.y;
   inC(hx,hy,0,()=>{});for(const e of enemies.slice()){const ex=e.x-hx,ey=(e.y-hy)*SQ,al=ex*dx+ey*dy,pe=Math.abs(-ex*dy+ey*dx);if(al>-10&&al<L&&pe<W+TYPES[e.type].r*0.5)hurt(e,4,dx,dy,26);}
   addFx(0.28,null,t=>{const k=Math.min(1,t/0.1),a=1-t/0.28,sx=hx,sy=hy*SQ-22*S;ctx.save();ctx.globalAlpha=a;ctx.lineCap='round';
    ctx.strokeStyle='#ffe9a8';ctx.lineWidth=5*S;ctx.beginPath();ctx.moveTo(sx+dx*20*S,sy+dy*20*S);ctx.lineTo(sx+dx*L*k,sy+dy*L*k);ctx.stroke();
    ctx.strokeStyle='#fff';ctx.lineWidth=2*S;ctx.stroke();ctx.fillStyle='#fff';ctx.translate(sx+dx*L*k,sy+dy*L*k);ctx.rotate(Math.atan2(dy,dx));ctx.beginPath();ctx.moveTo(12*S,0);ctx.lineTo(-4*S,-6*S);ctx.lineTo(-4*S,6*S);ctx.fill();ctx.restore();});}},
 hengsao:{n:'横扫',g:'🌙',cd:3.0,need:150,cast(){const [dx,dy]=aimDir(),a0=Math.atan2(dy/0.8,dx);sweep(a0,2.356,115*S*RM,4,22,1,['rgba(255,170,90,.35)','rgba(255,225,160,.8)']);}},
 lianzhan:{n:'连斩',g:'⚡',cd:2.2,need:150,cast(){const [dx,dy]=aimDir(),a0=Math.atan2(dy/0.8,dx);sweep(a0,1.57,100*S*RM,3,16,1,['rgba(120,200,255,.35)','rgba(200,240,255,.85)']);
   let w=0.25;addFx(0.35,dt=>{if(w<0)return;w-=dt;if(w<0){popPose='back';popT=0.35;const [bx,by]=aimDir(),b0=Math.atan2(by/0.8,bx);sweep(b0,1.57,100*S*RM,4,22,-1,['rgba(255,120,120,.35)','rgba(255,215,215,.85)']);}});}},
 xuanfeng:{n:'回旋斩',g:'🌀',cd:3.5,need:110,cast(){sweep(0,3.1416,125*S*RM,4,26,1,['rgba(160,210,255,.35)','rgba(225,245,255,.85)']);shk=Math.max(shk,2);}},
 jianyu:{n:'箭雨',g:'🏹',cd:3.2,need:0,cast(){for(const [tx,ty] of rndPts(6,430)){let done=false;const sy=ty*SQ,R=44*S*RM;
   addFx(1.0,(dt,t)=>{if(!done&&t>=0.55){done=true;inC(tx,ty,R,(e,dx,dy)=>{const [nx,ny]=nrm(dx,dy);hurt(e,3,nx,ny,10);});}},
   t=>{ctx.save();if(t<0.55){const k=t/0.55;ctx.strokeStyle='rgba(255,90,60,'+(0.25+0.3*k)+')';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(tx,sy,R,R*0.7,0,0,7);ctx.stroke();
     ctx.strokeStyle='#e9dcb0';ctx.lineWidth=2;for(let i=0;i<5;i++){const ox=(i-2)*R*0.38,yy=sy-(1-k)*260+(i%2)*8;ctx.beginPath();ctx.moveTo(tx+ox,yy-22);ctx.lineTo(tx+ox,yy);ctx.stroke();}}
    else{const a=1-(t-0.55)/0.45;ctx.strokeStyle='rgba(255,230,160,'+a+')';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(tx,sy,R*(1+(1-a)*0.3),R*0.7*(1+(1-a)*0.3),0,0,7);ctx.stroke();
     ctx.strokeStyle='rgba(230,215,170,'+a+')';ctx.lineWidth=2;for(let i=0;i<7;i++){const ax=tx+Math.cos(i*0.9)*R*0.7,ay=sy+Math.sin(i*1.7)*R*0.4;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax+2,ay-16);ctx.stroke();}}ctx.restore();});}}},
 huogong:{n:'火攻',g:'🔥',cd:4.5,need:0,cast(){for(const [tx,ty] of rndPts(3,460)){let tk=0;const sy=ty*SQ,R=50*S*RM;
   addFx(3.2,dt=>{tk-=dt;if(tk<=0){tk=0.35;inC(tx,ty,R,(e)=>hurt(e,1,0,0,0));}},
   t=>{const al=Math.min(1,(3.2-t)/0.5,t/0.15+0.2);ctx.save();ctx.globalAlpha=al;const g=ctx.createRadialGradient(tx,sy,2,tx,sy,R);g.addColorStop(0,'rgba(255,200,60,.55)');g.addColorStop(1,'rgba(220,60,20,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(tx,sy,R*1.15,R*0.8,0,0,7);ctx.fill();
    for(let i=0;i<9;i++){const a=i*0.7+Math.sin(t*3+i),rr=R*0.65*((i*37%10)/10+0.2),fx=tx+Math.cos(a)*rr,fy=sy+Math.sin(a)*rr*0.6,h=(14+10*Math.abs(Math.sin(t*9+i*2)))*S;
     ctx.fillStyle=i%2?'#ff7a1c':'#ffcf3a';ctx.beginPath();ctx.moveTo(fx-5*S,fy);ctx.quadraticCurveTo(fx-2*S,fy-h*0.6,fx,fy-h);ctx.quadraticCurveTo(fx+2*S,fy-h*0.6,fx+5*S,fy);ctx.fill();}ctx.restore();});}}},
 pili:{n:'霹雳',g:'⚡',cd:3.6,need:0,cast(){for(const [tx,ty] of rndPts(4,520)){let done=false;const sy=ty*SQ,R=36*S*RM,seed=Math.random()*9;
   addFx(0.5,(dt,t)=>{if(!done&&t>=0.15){done=true;inC(tx,ty,R,(e,dx,dy)=>{const [nx,ny]=nrm(dx,dy);hurt(e,4,nx,ny,8);});}},
   t=>{if(t<0.1){ctx.save();ctx.strokeStyle='rgba(200,180,255,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(tx,sy,R,R*0.7,0,0,7);ctx.stroke();ctx.restore();return;}
    const a=Math.max(0,1-(t-0.15)/0.35);ctx.save();ctx.globalAlpha=a;ctx.strokeStyle='#f3ecff';ctx.shadowColor='#9a7bff';ctx.shadowBlur=12;ctx.lineWidth=4*S;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(tx,sy);
    for(let i=1;i<=8;i++){ctx.lineTo(tx+Math.sin(seed*i*3.1)*14*S,sy-i*42);}ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='rgba(200,180,255,'+(a*0.5)+')';ctx.beginPath();ctx.ellipse(tx,sy,R*1.2,R*0.8,0,0,7);ctx.fill();ctx.restore();});}}},
 zhendi:{n:'裂地环',g:'🔨',cd:5,need:0,cast(){const [dx,dy]=aimDir(),cx=hero.x+dx*110*S*RM*1.4,cy=hero.y+dy*110*S*RM*1.4/SQ,MR=165*S*RM,hit=new Set();
   addFx(0.6,(dt,t)=>{const r=MR*Math.min(1,t/0.4);for(const e of enemies.slice()){if(hit.has(e))continue;const ex=e.x-cx,ey=(e.y-cy)*SQ,d=Math.hypot(ex,ey);if(d<r+TYPES[e.type].r*0.5){hit.add(e);hurt(e,4,ex/(d||1),ey/(d||1),30);}}},
   t=>{const r=MR*Math.min(1,t/0.4),a=1-t/0.6,sy=cy*SQ;ctx.save();ctx.globalAlpha=a;ctx.strokeStyle='#d8bd86';ctx.lineWidth=8*S;ctx.beginPath();ctx.ellipse(cx,sy,r,r*0.7,0,0,7);ctx.stroke();ctx.strokeStyle='#6b4a22';ctx.lineWidth=3*S;ctx.stroke();
    ctx.strokeStyle='rgba(60,40,20,.8)';ctx.lineWidth=2*S;for(let i=0;i<7;i++){const an=i*0.9;ctx.beginPath();ctx.moveTo(cx,sy);ctx.lineTo(cx+Math.cos(an)*r*0.9,sy+Math.sin(an)*r*0.62);ctx.stroke();}ctx.restore();});shk=Math.max(shk,3);}},
 chong:{n:'冲锋',g:'🐎',cd:7,need:0,cast(){const [dx,dy]=aimDir();let px=hero.x,py=hero.y;const hit=new Set(),ox=hero.x,oy=hero.y;
   addFx(0.75*RP,dt=>{px+=dx*560*dt;py+=dy*560*dt/SQ;for(const e of enemies.slice()){if(hit.has(e))continue;const ex=e.x-px,ey=(e.y-py)*SQ;if(ex*ex+ey*ey<(40*S+TYPES[e.type].r*0.6)**2){hit.add(e);hurt(e,6,dx,dy,34);}}},
   t=>{const a=Math.min(1,(0.75-t)/0.25),sx=px,sy=py*SQ-18*S,ang=Math.atan2(dy,dx);ctx.save();ctx.globalAlpha=a;ctx.translate(sx,sy);ctx.rotate(ang);
    const g=ctx.createLinearGradient(-120*S,0,20*S,0);g.addColorStop(0,'rgba(255,170,60,0)');g.addColorStop(1,'rgba(255,225,150,.9)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(24*S,0);ctx.lineTo(-120*S,-34*S);ctx.lineTo(-120*S,34*S);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';ctx.font=(26*S)+'px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.rotate(-ang);ctx.fillText('🐎',0,0);ctx.restore();});}},
 daolun:{n:'刀轮',g:'☯',cd:6.5,need:0,cast(){const cdm=new Map();addFx(5,(dt,t)=>{const R=64*S*RM;for(let i=0;i<3;i++){const a=t*5+i*2.094,bx=hero.x+Math.cos(a)*R,by=hero.y*SQ+Math.sin(a)*R*0.6;
     for(const e of enemies.slice()){const ex=e.x-bx,ey=e.y*SQ-by;if(ex*ex+ey*ey<(20*S+TYPES[e.type].r*0.6)**2&&(cdm.get(e)||0)<=t){cdm.set(e,t+0.45);hurt(e,2,nrm(ex,ey)[0],nrm(ex,ey)[1],8);}}}},
   t=>{const R=64*S*RM,al=Math.min(1,(5-t)/0.4,t/0.2);ctx.save();ctx.globalAlpha=al;for(let i=0;i<3;i++){const a=t*5+i*2.094,bx=hero.x+Math.cos(a)*R,by=hero.y*SQ+Math.sin(a)*R*0.6-14*S;
     ctx.save();ctx.translate(bx,by);ctx.rotate(a+1.57);ctx.strokeStyle='#e8f6ff';ctx.shadowColor='#8cf';ctx.shadowBlur=8;ctx.lineWidth=5*S;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,15*S,-1.3,1.3);ctx.stroke();ctx.restore();}ctx.restore();});}},
 dilie:{n:'地裂波',g:'🌊',cd:4,need:380,cast(){const [dx,dy]=aimDir(),hit=new Set();let px=hero.x,py=hero.y;const ang=Math.atan2(dy,dx);
   addFx(0.8,dt=>{px+=dx*400*dt;py+=dy*400*dt/SQ;for(const e of enemies.slice()){if(hit.has(e))continue;const ex=e.x-px,ey=(e.y-py)*SQ,al=ex*dx+ey*dy,pe=Math.abs(-ex*dy+ey*dx);if(Math.abs(al)<26*S&&pe<46*S+TYPES[e.type].r*0.5){hit.add(e);hurt(e,4,dx,dy,28);}}},
   t=>{const a=Math.min(1,(0.8-t)/0.3);ctx.save();ctx.globalAlpha=a;ctx.translate(px,py*SQ);ctx.rotate(ang);ctx.scale(1,0.7);
    ctx.fillStyle='rgba(200,165,100,.55)';ctx.beginPath();ctx.ellipse(0,0,24*S,50*S,0,0,7);ctx.fill();ctx.strokeStyle='#fff3cf';ctx.lineWidth=5*S;ctx.beginPath();ctx.arc(-18*S,0,56*S,-0.8,0.8);ctx.stroke();
    ctx.restore();});shk=Math.max(shk,2);}},
 shuanghuan:{n:'双环击飞',g:'⭕',cd:5.5,need:150,cast(){const cx=hero.x,cy=hero.y,R=105*S*RM*1.3;
   sweep(0,3.1416,R,3,18,1,['rgba(255,215,120,.35)','rgba(255,240,190,.85)']);
   let w=0.55;addFx(1.0,(dt)=>{if(w<0)return;w-=dt;if(w<0){inC(cx,cy,R,(e,dx,dy)=>{const [nx,ny]=nrm(dx,dy);hurt(e,5,nx,ny,70);});shk=Math.max(shk,4);}},
   t=>{if(t<0.4)return;const k=Math.min(1,(t-0.55)/0.25);const a=t<0.55?0.5:Math.max(0,1-(t-0.55)/0.45);ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=t<0.55?'rgba(255,200,90,.9)':'#fff';ctx.lineWidth=(t<0.55?3:9)*S;ctx.beginPath();ctx.ellipse(cx,cy*SQ-4*S,t<0.55?R:R*(0.6+0.5*Math.max(0,k)),(t<0.55?R:R*(0.6+0.5*Math.max(0,k)))*0.7,0,0,7);ctx.stroke();ctx.restore();});}},
 sixiang:{n:'四象剑气',g:'✴',cd:5,need:0,cast(){for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let px=hero.x,py=hero.y;const hit=new Set(),ang=Math.atan2(dy,dx);
   addFx(0.9,dt=>{px+=dx*360*dt;py+=dy*360*dt/SQ;for(const e of enemies.slice()){if(hit.has(e))continue;const ex=e.x-px,ey=(e.y-py)*SQ;if(ex*ex+ey*ey<(30*S+TYPES[e.type].r*0.6)**2){hit.add(e);hurt(e,4,dx,dy,14);}}},
   t=>{const a=Math.min(1,(0.9-t)/0.3);ctx.save();ctx.globalAlpha=a;ctx.translate(px,py*SQ-18*S);ctx.rotate(ang);ctx.shadowColor='rgba(150,220,255,.95)';ctx.shadowBlur=10;ctx.strokeStyle='#e8f8ff';ctx.lineCap='round';ctx.lineWidth=7*S;ctx.beginPath();ctx.arc(-14*S,0,38*S,-1.0,1.0);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=2.5*S;ctx.stroke();ctx.restore();});}}},
 tianbeng:{n:'天崩地裂',g:'☄',cd:8,need:420,cast(){const [dx,dy]=aimDir(),hit=new Set(),ang=Math.atan2(dy,dx);let px=hero.x,py=hero.y;
   addFx(1.1,dt=>{px+=dx*340*dt;py+=dy*340*dt/SQ;for(const e of enemies.slice()){if(hit.has(e))continue;const ex=e.x-px,ey=(e.y-py)*SQ,al=ex*dx+ey*dy,pe=Math.abs(-ex*dy+ey*dx);if(Math.abs(al)<34*S&&pe<95*S+TYPES[e.type].r*0.5){hit.add(e);hurt(e,9,dx,dy,44);}}shk=Math.max(shk,2);},
   t=>{const a=Math.min(1,(1.1-t)/0.35);ctx.save();ctx.globalAlpha=a;ctx.translate(px,py*SQ-6*S);ctx.rotate(ang);ctx.scale(1,0.75);
    const g=ctx.createLinearGradient(-90*S,0,30*S,0);g.addColorStop(0,'rgba(255,120,60,0)');g.addColorStop(1,'rgba(255,235,170,.9)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(30*S,0);ctx.lineTo(-90*S,-95*S);ctx.lineTo(-90*S,95*S);ctx.closePath();ctx.fill();
    ctx.shadowColor='#ffd070';ctx.shadowBlur=14;ctx.strokeStyle='#fff';ctx.lineWidth=9*S;ctx.lineCap='round';ctx.beginPath();ctx.arc(-40*S,0,110*S,-1.1,1.1);ctx.stroke();ctx.restore();});}},
 huima:{n:'回马刀',g:'🔄',cd:2.6,need:150,cast(){const [dx,dy]=aimDir(),a0=Math.atan2(dy/0.8,dx);sweep(a0,1.05,115*S*RM,4,20,1,['rgba(255,200,110,.35)','rgba(255,235,180,.85)']);
   let w=0.3;addFx(0.4,dt=>{if(w<0)return;w-=dt;if(w<0){popPose='back';popT=0.35;sweep(a0+Math.PI,1.57,115*S*RM,4,22,-1,['rgba(255,140,110,.35)','rgba(255,215,205,.85)']);}});}},
 feilun:{n:'飞轮刃',g:'💫',cd:4.5,need:350,cast(){const [dx,dy]=aimDir();let px=hero.x,py=hero.y,vx=dx*340,vy=dy*340/SQ;const h1=new Set(),h2=new Set(),T=0.8;
   addFx(2*T,(dt,t)=>{if(t<T){px+=vx*dt;py+=vy*dt;}else{const ex=hero.x-px,ey=(hero.y-py)*SQ,l=Math.hypot(ex,ey)||1;px+=ex/l*400*dt;py+=ey/l*400*dt/SQ;}
     const hs=t<T?h1:h2;for(const e of enemies.slice()){if(hs.has(e))continue;const ex=e.x-px,ey=(e.y-py)*SQ;if(ex*ex+ey*ey<(34*S+TYPES[e.type].r*0.6)**2){hs.add(e);const [nx,ny]=nrm(ex,ey);hurt(e,3,nx,ny,12);}}},
   t=>{const a=Math.min(1,(2*T-t)/0.3);ctx.save();ctx.globalAlpha=a;ctx.translate(px,py*SQ-18*S);ctx.rotate(t*22);ctx.shadowColor='#9cf';ctx.shadowBlur=10;ctx.strokeStyle='#eaf6ff';ctx.lineWidth=8*S;ctx.lineCap='round';
    for(let i=0;i<3;i++){ctx.rotate(2.094);ctx.beginPath();ctx.arc(0,0,26*S,-0.9,0.9);ctx.stroke();}ctx.restore();});}},
 xuehe:{n:'血河斩',g:'🩸',cd:6,need:380,cast(){const [dx,dy]=aimDir(),L=210*S,ang=Math.atan2(dy,dx),x0=hero.x,y0=hero.y;let tk=0;const hit=new Set();
   addFx(3.2,(dt,t)=>{const k=Math.min(1,t/0.3);if(t<0.3){for(const e of enemies.slice()){if(hit.has(e))continue;const ex=e.x-x0,ey=(e.y-y0)*SQ,al=ex*dx+ey*dy,pe=Math.abs(-ex*dy+ey*dx);if(al>-10&&al<L*k&&pe<30*S+TYPES[e.type].r*0.5){hit.add(e);hurt(e,4,dx,dy,22);}}}
     tk-=dt;if(tk<=0&&t>0.2){tk=0.4;for(const e of enemies.slice()){const ex=e.x-x0,ey=(e.y-y0)*SQ,al=ex*dx+ey*dy,pe=Math.abs(-ex*dy+ey*dx);if(al>-10&&al<L&&pe<34*S+TYPES[e.type].r*0.5)hurt(e,2,0,0,0);}}},
   t=>{const k=Math.min(1,t/0.3),a=Math.min(1,(3.2-t)/0.6);ctx.save();ctx.globalAlpha=a*0.85;ctx.translate(x0,y0*SQ);ctx.rotate(ang);ctx.scale(1,0.6);
    const g=ctx.createLinearGradient(0,0,L,0);g.addColorStop(0,'rgba(190,20,30,.75)');g.addColorStop(1,'rgba(120,10,20,.25)');ctx.fillStyle=g;ctx.fillRect(0,-34*S,L*k,68*S);
    ctx.strokeStyle='rgba(255,130,120,.8)';ctx.lineWidth=2*S;for(let i=0;i<5;i++){const yy=(i-2)*12*S+Math.sin(t*4+i)*4*S;ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(L*k,yy);ctx.stroke();}ctx.restore();});shk=Math.max(shk,2);}},
 wanren:{n:'万刃归宗',g:'🌟',cd:7,need:0,cast(){const N=12,T=0.55,hs=[];for(let i=0;i<N;i++)hs.push([new Set(),new Set()]);const px=[],py=[];for(let i=0;i<N;i++){px.push(hero.x);py.push(hero.y);}
   addFx(2*T,(dt,t)=>{for(let i=0;i<N;i++){const an=i*6.2832/N;if(t<T){px[i]+=Math.cos(an)*330*dt;py[i]+=Math.sin(an)*330*dt/SQ;}else{const ex=hero.x-px[i],ey=(hero.y-py[i])*SQ,l=Math.hypot(ex,ey)||1;px[i]+=ex/l*420*dt;py[i]+=ey/l*420*dt/SQ;}
      const h=hs[i][t<T?0:1];for(const e of enemies.slice()){if(h.has(e))continue;const ex=e.x-px[i],ey=(e.y-py[i])*SQ;if(ex*ex+ey*ey<(24*S+TYPES[e.type].r*0.6)**2){h.add(e);const [nx,ny]=nrm(ex,ey);hurt(e,3,nx,ny,12);}}}},
   t=>{const a=Math.min(1,(2*T-t)/0.25);ctx.save();ctx.globalAlpha=a;ctx.shadowColor='rgba(150,220,255,.95)';ctx.shadowBlur=8;ctx.strokeStyle='#eef9ff';ctx.lineWidth=5*S;ctx.lineCap='round';
    for(let i=0;i<N;i++){const an=t<T?i*6.2832/N:Math.atan2((py[i]-hero.y)*-SQ,(px[i]-hero.x)*-1);ctx.save();ctx.translate(px[i],py[i]*SQ-18*S);ctx.rotate(an);ctx.beginPath();ctx.arc(-10*S,0,26*S,-0.9,0.9);ctx.stroke();ctx.restore();}ctx.restore();});}}
};
const SKID=Object.keys(SK);for(const id of SKID)SK[id].id=id;
let hold=0,qi=0,qt=0,stiff=0,wind=null,recov=null;const RC={huima:.3,feilun:.2,xuehe:.3,wanren:.3,dilie:.3,shuanghuan:.3,sixiang:.2,tianbeng:.4,hengsao:.3,lianzhan:.4,jian:.15,feidao:.15,qiang:.25,xuanfeng:.2,daolun:.2,jianyu:.2,huogong:.25,pili:.25,zhendi:.35,chong:.4};const WU={huima:.5,feilun:.6,xuehe:.7,wanren:.8,dilie:.7,shuanghuan:.7,sixiang:.6,tianbeng:1.0,hengsao:.6,lianzhan:.5,jian:.4,feidao:.4,qiang:.6,xuanfeng:.6,daolun:.6,jianyu:.7,huogong:.8,pili:.8,zhendi:.9,chong:1.0};let popT=0;const skipFl=new Array(10).fill(0);let loadout=['hengsao','','','',''],cds=[0,0.4,0.8,1.2,1.6];
// ===== 术法 · 功法 · 武器（兵籍牒改版）=====
const LN=5,isSpell=id=>CAT[id]==='术法';
Object.assign(CAT,{huogong:'术法',pili:'术法',luolei:'术法',lieyan:'术法',fengren:'术法',fushui:'术法',tianlei:'术法',zhenhuo:'术法'});
Object.assign(TIER,{huogong:'黄',pili:'黄',luolei:'玄',lieyan:'玄',fengren:'地',fushui:'地',tianlei:'天',zhenhuo:'天'});
SK.huogong.n='火符';SK.pili.n='雷符';SK.dilie.n='裂地刃';
function strikeFx(tx,ty,R,dl,dmg,col){R*=rn();let w=dl,done=false;const sy=ty*SQ;
  addFx(dl+0.5,dt=>{if(done)return;w-=dt;if(w<=0){done=true;inC(tx,ty,R,(e,dx,dy)=>{const [nx,ny]=nrm(dx,dy);hurt(e,dmg,nx,ny,14);});shk=Math.max(shk,2);}},
  t=>{ctx.save();if(t<dl){ctx.globalAlpha=.25+.5*t/dl;ctx.strokeStyle=col;ctx.lineWidth=2*S;ctx.beginPath();ctx.ellipse(tx,sy,R,R*.7,0,0,7);ctx.stroke();}
    else{const a=Math.max(0,1-(t-dl)/.4);ctx.globalAlpha=a;ctx.shadowColor=col;ctx.shadowBlur=18;ctx.strokeStyle='#f4fbff';ctx.lineWidth=7*S;ctx.beginPath();ctx.moveTo(tx,sy-300*S);for(let i=1;i<=6;i++)ctx.lineTo(tx+(i<6?(((i*53+Math.round(tx))%24)-12)*S:0),sy-300*S+i*50*S);ctx.stroke();ctx.fillStyle=col;ctx.globalAlpha=a*.35;ctx.beginPath();ctx.ellipse(tx,sy,R,R*.7,0,0,7);ctx.fill();}ctx.restore();});}
function fireZone(tx,ty,R,life,dmg,col1,col2){R*=rn();let tk=0;const sy=ty*SQ;
  addFx(life,dt=>{tk-=dt;if(tk<=0){tk=0.3;inC(tx,ty,R,e=>hurt(e,dmg,0,0,0));}},
  t=>{const al=Math.min(1,(life-t)/0.5,t/0.15+0.2);ctx.save();ctx.globalAlpha=al;const g=ctx.createRadialGradient(tx,sy,2,tx,sy,R);g.addColorStop(0,col1);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(tx,sy,R*1.15,R*0.8,0,0,7);ctx.fill();
    for(let i=0;i<11;i++){const a=i*0.7+Math.sin(t*3+i),rr=R*0.7*((i*37%10)/10+0.2),fx=tx+Math.cos(a)*rr,fy=sy+Math.sin(a)*rr*0.6,h=(16+12*Math.abs(Math.sin(t*9+i*2)))*S;ctx.fillStyle=i%2?col2:'#fff3c0';ctx.beginPath();ctx.moveTo(fx-5*S,fy);ctx.quadraticCurveTo(fx-2*S,fy-h*0.6,fx,fy-h);ctx.quadraticCurveTo(fx+2*S,fy-h*0.6,fx+5*S,fy);ctx.fill();}ctx.restore();});}
Object.assign(SK,{
 luolei:{n:'落雷阵',g:'🌩',cd:5,need:0,cast(){for(const [tx,ty] of rndPts(5,520))strikeFx(tx,ty,64*S,0.25+Math.random()*0.5,3.5,'#9bd2ff');}},
 lieyan:{n:'烈焰环',g:'⭕',cd:6,need:0,cast(){const cx=hero.x,cy=hero.y,Rm=190*S*rn(),hit=new Set();
   addFx(1.1,(dt,t)=>{const r=Rm*Math.min(1,t/0.7);for(const e of enemies.slice()){if(hit.has(e))continue;const ex=e.x-cx,ey=(e.y-cy)*SQ,d=Math.hypot(ex,ey);if(d<r+TYPES[e.type].r*0.4&&d>r-38*S){hit.add(e);const [nx,ny]=nrm(ex,ey);hurt(e,3.2,nx,ny,26);}}},
   t=>{const r=Rm*Math.min(1,t/0.7),a=Math.max(0,Math.min(1,(1.1-t)/0.4));ctx.save();ctx.globalAlpha=a;ctx.shadowColor='#ff7a1c';ctx.shadowBlur=16;ctx.strokeStyle='#ffb347';ctx.lineWidth=12*S;ctx.beginPath();ctx.arc(cx,cy*SQ-6*S,r,0,6.283);ctx.stroke();ctx.strokeStyle='#fff1b8';ctx.lineWidth=4*S;ctx.stroke();ctx.restore();});shk=Math.max(shk,2);}},
 fengren:{n:'风刃旋',g:'🌪',cd:4.5,need:0,cast(){const N=6,a0=Math.random()*6.283;for(let i=0;i<N;i++){let an=a0+i*6.283/N,px=hero.x,py=hero.y,sp=140;const hit=new Set();
   addFx(1.0,(dt,t)=>{an+=2.2*dt;sp+=420*dt;px+=Math.cos(an)*sp*dt;py+=Math.sin(an)*sp*dt/SQ;for(const e of enemies.slice()){if(hit.has(e))continue;const ex=e.x-px,ey=(e.y-py)*SQ;if(ex*ex+ey*ey<(30*S+TYPES[e.type].r*0.6)**2){hit.add(e);const [nx,ny]=nrm(ex,ey);hurt(e,2.4,nx,ny,16);}}},
   t=>{ctx.save();ctx.globalAlpha=Math.min(1,(1-t)/0.3);ctx.translate(px,py*SQ-16*S);ctx.rotate(t*18);ctx.shadowColor='#9fffd0';ctx.shadowBlur=10;ctx.strokeStyle='#e6fff3';ctx.lineWidth=6*S;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,22*S,-1,1);ctx.stroke();ctx.restore();});}}},
 fushui:{n:'符水甘霖',g:'💧',cd:12,need:0,cast(){const cx=hero.x,cy=hero.y;hero.hp=Math.min(hero.maxhp,hero.hp+Math.round(hero.maxhp*0.08*healMul));floatTxt('符水甘霖','#8fe6ff');
   addFx(1.2,null,t=>{const a=Math.max(0,1-t/1.2);ctx.save();ctx.globalAlpha=a;ctx.strokeStyle='#7fd8ff';ctx.lineWidth=4*S;ctx.beginPath();ctx.ellipse(hero.x,hero.y*SQ-6*S,(30+t*70)*S,(30+t*70)*S*.6,0,0,7);ctx.stroke();for(let i=0;i<10;i++){const x=hero.x+Math.sin(i*2.3)*60*S,y=hero.y*SQ-90*S+((t*160+i*37)%110)*S;ctx.fillStyle='rgba(150,225,255,.8)';ctx.fillRect(x,y,2*S,8*S);}ctx.restore();});}},
 tianlei:{n:'天雷九霄',g:'⚡',cd:9,need:0,cast(){for(const [tx,ty] of rndPts(9,560))strikeFx(tx,ty,76*S,0.2+Math.random()*0.7,6,'#c9b6ff');shk=Math.max(shk,3);}},
 zhenhuo:{n:'太平真火',g:'🔥',cd:10,need:0,cast(){for(const [tx,ty] of rndPts(1,420))fireZone(tx,ty,100*S,5,1.8,'rgba(120,200,255,.6)','#6fb8ff');}}
});
for(const id of ['luolei','lieyan','fengren','fushui','tianlei','zhenhuo']){SK[id].id=id;SKID.push(id);}
Object.assign(RC,{luolei:.25,lieyan:.3,fengren:.2,fushui:.3,tianlei:.4,zhenhuo:.3});Object.assign(WU,{luolei:.8,lieyan:.7,fengren:.6,fushui:.6,tianlei:.9,zhenhuo:.8});
// ---- 功法 ----
const GTIER={'黄':0,'玄':1,'地':2,'天':3},GGEN=[.02,.03,.045,.065],GSPEC=[.08,.13,.19,.28],LVM=[1,1.3,1.7],LVSTEP=120,QN=['凡','良','精','绝'],QC=['#cfcfcf','#6fb8ff','#c58cff','#ffb347'];
const GF={
 tuna:{n:'吐纳心法',t:'黄',c:'',g:'☯',d:'回元 +2',x:{hy:2}},
 yangqi:{n:'养气诀',t:'黄',c:'',g:'🌿',d:'最大生命 +12%，气海 +2',x:{hp:1.12,qh:2}},
 tieyi:{n:'铁衣功',t:'玄',c:'',g:'🛡',d:'受到伤害 -8%',x:{take:.92}},
 tayun:{n:'踏云步法',t:'玄',c:'',g:'👣',d:'移速 +7%',x:{spd:1.07}},
 jubao:{n:'聚宝心经',t:'地',c:'',g:'💰',d:'银两 +20%，拾取范围 +25%',x:{gold:1.2,pick:1.25}},
 guanxing:{n:'观星诀',t:'地',c:'',g:'⭐',d:'暴击率 +5%',x:{crit:.05}},
 taiping:{n:'太平清领心经',t:'天',c:'',g:'☯',d:'全部伤害 +12%，受到伤害 -6%',x:{all:1.12,take:.94}},
 hunyuan:{n:'混元一气功',t:'天',c:'',g:'🌀',d:'全部伤害 +8%，生命 +10%，暴击 +3%',x:{all:1.08,hp:1.1,crit:.03}}};
[['短兵','刀',['快刀心法','断水心经','破军心经','霸王心经']],['长兵','枪',['抖枪诀','贯虹心法','龙胆心经','无双心经']],['射艺','弓',['听风诀','穿云心经','追月心经','落日心经']],['体术','拳',['熊经诀','金钟罩','铁骨功','不动明王功']],['术法','符',['引气诀','通玄心法','紫气心经','太平玄元经']]].forEach(([c,g,ns],ci)=>ns.forEach((n,t)=>{GF['gf'+ci+t]={n,t:'黄玄地天'[t],c,g,d:'',x:{}};}));
Object.assign(GF,{
 qingshen:{n:'轻身术',t:'黄',c:'',g:'🍃',d:'闪身冷却 -8%',x:{dcd:.92}},
 juqi:{n:'聚气诀',t:'玄',c:'',g:'🌀',d:'气海 +1，回元 +1',x:{qh:1,hy:1}},
 shixue:{n:'嗜血功',t:'玄',c:'',g:'🩸',d:'每次击杀回复 0.6% 生命',x:{}},
 beishui:{n:'背水一战',t:'地',c:'',g:'🔥',d:'生命低于 30% 时，全部伤害 +25%，受到伤害 -10%',x:{}},
 lhj:{n:'连环劲',t:'地',c:'',g:'⛓',d:'连续 3 秒不受伤，下一次攻击必定暴击',x:{}},
 caoshang:{n:'草上飞',t:'黄',c:'',g:'🌾',d:'轻功：跑动时脚下留风痕，敌人踩上减速 30%',x:{}},
 xingyun:{n:'行云诀',t:'玄',c:'',g:'☁',d:'轻功：每跑一段路积 1 层势（最多 5），每层伤害 +6%；停下后每 1.5 秒散 1 层',x:{}},
 taxue:{n:'踏雪无痕',t:'地',c:'',g:'❄',d:'轻功：跑动时受到伤害 -15%',x:{}},
 tiesha:{n:'铁砂掌劲',t:'地',c:'',g:'✋',d:'轻功：闪身把周围敌人击退更远，并僵直 0.5 秒',x:{}},
 yufeng:{n:'御风而行',t:'天',c:'',g:'🌪',d:'轻功：跑动时身周不断扫出风刃，移速越快范围越大',x:{}}
});
const GFID=Object.keys(GF);
const hasGf=id=>gongfa.indexOf(id)>=0;let noHitT=0,shi=0,shiD=0,shiT=0,trailT=0,ywT=0;const trail=[];
// ---- 武器：只有造型与面板，不绑定武艺 ----
const WPRICE=[40,90,170,300],WQ={atk:[1.04,1.09,1.15,1.24],cd:[1,.98,.95,.9],crit:[0,.01,.03,.06]};
const WP={};
const gIc=(o,px)=>o?(o.ic?'<img src="'+ASSETS.img[o.ic]+'" style="width:'+px+';height:'+px+';vertical-align:middle;object-fit:contain">':o.g):'';
[['环首刀','🗡',0,{}],['铁剑','⚔',0,{spd:1.02}],['木杆枪','🔱',0,{hp:1.05}],['猎弓','🏹',0,{pick:1.1}],
 ['百炼刀','🗡',1,{take:.97}],['青铜剑','⚔',1,{spd:1.03}],['铁杆枪','🔱',1,{hp:1.07}],['角弓','🏹',1,{gold:1.06}],
 ['青虹剑','⚔',2,{dcd:.92}],['雁翎枪','🔱',2,{take:.95}],['斩马刀','🗡',2,{crit:.03}],['紫檀弓','🏹',2,{gold:1.1}],
 ['屠龙刀','🗡',3,{all:1.05}],['落日弓','🏹',3,{gold:1.15,pick:1.1}],['倚天剑','⚔',3,{crit:.05,spd:1.05}],['龙胆枪','🔱',3,{all:1.06,hp:1.06}]].forEach(([n,g,q,x],i)=>{WP['wp'+i]={ic:'wp'+i,n,g,q,atk:WQ.atk[q],cd:WQ.cd[q],crit:WQ.crit[q],x};});
const WPID=Object.keys(WP),QMIN=[0,2,5,8];
let gongfa=['','',''],weapon='',gfExp={},gearAll=1,gearCat={},critP=0.1,wpCd=1;const GA={all:1,take:1,spd:1,dcd:1,hp:1,gold:1,pick:1,crit:0};let gfLvPrev={};
const TH=[0,20,55,110,190,300,450,650,920,1280],lvOf=n=>{let l=1;for(let i=1;i<10;i++)if(n>=TH[i])l=i+1;return l;};
function gfLv(g){return lvOf(gfExp[g.id]||0);}
function gfDesc(g){const lm=1+0.08*(gfLv(g)-1),ti=GTIER[g.t];if(g.c)return '通用：全部伤害 +'+(GGEN[ti]*lm*100).toFixed(1)+'%<br>专精：'+g.c+'伤害 +'+Math.round(GSPEC[ti]*lm*100)+'%（需装备对应招式才生效）'+(GXD[g.id]?'<br>'+GXD[g.id]:'');return g.d+(lm>1?'（强化 ×'+lm.toFixed(2)+'）':'')+(GXD[g.id]?'<br>'+GXD[g.id]:'');}
function wpDesc(w){const ex=Object.keys(w.x).map(k=>({spd:'移速',hp:'生命',take:'受伤',pick:'拾取范围',gold:'银两',dcd:'闪身冷却',crit:'暴击',all:'全伤害'}[k]+' '+(k==='crit'?'+'+Math.round(w.x[k]*100)+'%':(w.x[k]>1?'+':'')+Math.round((w.x[k]-1)*100)+'%'))).join('，');return '攻击 +'+Math.round((w.atk-1)*100)+'%，出招冷却 -'+Math.round((1-w.cd)*100)+'%，暴击 +'+Math.round(w.crit*100)+'%'+(ex?'<br>'+ex:'');}
function recalcGear(){const N={all:1,take:1,spd:1,dcd:1,hp:1,gold:1,pick:1,crit:0},add=(k,v,lm)=>{if(k==='crit')N.crit+=v*lm;else if(k==='hy'||k==='qh')N[k]=(N[k]||0)+v*lm;else N[k]*=1+(v-1)*lm;};let ga=1;gearCat={};
  const W=WP[weapon];if(W){ga*=W.atk;N.crit+=W.crit;for(const k in W.x)add(k,W.x[k],1);}
  gongfa.forEach(id=>{const g=GF[id];if(!g)return;const lv=gfLv(g),lm=1+0.08*(lv-1),ti=GTIER[g.t];
    if(gfLvPrev[id]&&lv>gfLvPrev[id])floatTxt(g.n+' 熟练升至 LV'+lv,'#ffd76a');gfLvPrev[id]=lv;
    if(g.c){ga*=1+GGEN[ti]*lm;gearCat[g.c]=(gearCat[g.c]||1)*(1+GSPEC[ti]*lm);}else for(const k in g.x)add(k,g.x[k],lm);});
  gearAll=ga;wpCd=W?W.cd:1;
  allMul*=N.all/GA.all;takeMul*=N.take/GA.take;spdMul*=N.spd/GA.spd;DCD*=N.dcd/GA.dcd;goldMul*=N.gold/GA.gold;pickR*=N.pick/GA.pick;critP+=N.crit-GA.crit;
  if(N.hp!==GA.hp){const r=N.hp/GA.hp;hero.maxhp=Math.round(hero.maxhp*r);hero.hp=Math.min(hero.maxhp,Math.round(hero.hp*r));}
  Object.assign(GA,N);gearAttr={12:N.qh||0,13:N.hy||0};recalcAttr();calcXj();}
function normLoadout(){const all=loadout.filter(x=>x);for(let i=0;i<LN;i++)loadout[i]='';for(const id of all){for(let i=0;i<LN;i++)if(!loadout[i]){loadout[i]=id;break;}}}
function eligibleGf(){const have=gongfa.concat(bag.concat(loot).filter(x=>x.k==='gf').map(x=>x.id));return GFID.filter(id=>have.indexOf(id)<0&&wave>=TMIN[GF[id].t]);}
function eligibleWp(){const have=[weapon].concat(bag.concat(loot).filter(x=>x.k==='wp').map(x=>x.id));return WPID.filter(id=>have.indexOf(id)<0&&wave>=QMIN[WP[id].q]);}
function gainGf(id){const e=gongfa.indexOf('');if(e>=0){gongfa[e]=id;recalcGear();floatTxt('领悟 '+GF[id].n,'#ffd76a');}else{bag.push({k:'gf',id});floatTxt('拾得功法：'+GF[id].n+'（战后可换装）','#ffd76a');}}
function gainWp(id){if(!weapon){weapon=id;recalcGear();floatTxt('装备 '+WP[id].n,'#ffd76a');}else{bag.push({k:'wp',id});floatTxt('拾得兵器：'+WP[id].n+'（战后可换装）','#ffd76a');}}
function equipFromBag(bi,slot){const it=bag[bi];if(!it)return false;
  if(it.k==='sk'){if(slot==null||slot>=LN)return false;const old=loadout[slot];loadout[slot]=it.id;cds[slot]=0.2;bag.splice(bi,1);if(old)bag.push({k:'sk',id:old});buildHud();syncSel();return true;}
  if(it.k==='gf'){if(slot==null)return false;const old=gongfa[slot];gongfa[slot]=it.id;bag.splice(bi,1);if(old)bag.push({k:'gf',id:old});recalcGear();return true;}
  if(it.k==='wp'){const old=weapon;weapon=it.id;bag.splice(bi,1);if(old)bag.push({k:'wp',id:old});recalcGear();return true;}return false;}
const sellP=it=>Math.round((it.k==='xd'?100:it.k==='sk'?SKPRICE[TIER[it.id]||'黄']:it.k==='gf'?SKPRICE[GF[it.id].t]*1.5:WPRICE[WP[it.id].q])*0.4);
// ===== 长兵/射艺/体术 新招式 =====
function thrust(ang,L,W,dmg,kb,dl){L*=rn();W*=rn();const dx=Math.cos(ang),dy=Math.sin(ang);let ox=0,oy=0,fired=false,w=dl;
  addFx(dl+0.32,dt=>{if(fired)return;w-=dt;if(w>0)return;fired=true;ox=hero.x;oy=hero.y;for(const e of enemies.slice()){const ex=e.x-ox,ey=(e.y-oy)*SQ,al=ex*dx+ey*dy,pe=Math.abs(-ex*dy+ey*dx);if(al>-10&&al<L&&pe<W+TYPES[e.type].r*0.5)hurt(e,dmg,dx,dy,kb);}},
  t=>{if(!fired)return;const k=Math.min(1,(t-dl)/0.1),a=Math.max(0,1-(t-dl)/0.3),sy=oy*SQ-22*S;ctx.save();ctx.globalAlpha=a;ctx.lineCap='round';ctx.strokeStyle='#ffe9a8';ctx.shadowColor='#ffd070';ctx.shadowBlur=10;ctx.lineWidth=Math.max(5,W*0.4);ctx.beginPath();ctx.moveTo(ox+dx*20*S,sy+dy*20*S);ctx.lineTo(ox+dx*L*k,sy+dy*L*k);ctx.stroke();ctx.restore();});}
function shootArrow(ang,sp,life,dmg,kb,homing,pierce){let px=hero.x,py=hero.y,a=ang,dead=false,n=0;const hit=new Set();
  addFx(life,dt=>{if(dead)return;if(homing){let best=null,bd=(380*S)**2;for(const e of enemies){const ex=e.x-px,ey=(e.y-py)*SQ,d=ex*ex+ey*ey;if(d<bd){bd=d;best=e;}}if(best){const ta=Math.atan2((best.y-py)*SQ,best.x-px);let da=ta-a;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;a+=Math.max(-5*dt,Math.min(5*dt,da));}}
    px+=Math.cos(a)*sp*dt;py+=Math.sin(a)*sp*dt/SQ;for(const e of enemies.slice()){if(hit.has(e))continue;const ex=e.x-px,ey=(e.y-py)*SQ;if(ex*ex+ey*ey<(18*S+TYPES[e.type].r*0.5)**2){hit.add(e);hurt(e,dmg,Math.cos(a),Math.sin(a),kb);if(++n>=pierce){dead=true;break;}}}},
  t=>{if(dead)return;ctx.save();ctx.globalAlpha=Math.min(1,(life-t)/0.2);ctx.translate(px,py*SQ-18*S);ctx.rotate(a);ctx.strokeStyle='#f1e3b8';ctx.lineWidth=3*S;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-16*S,0);ctx.lineTo(8*S,0);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(12*S,0);ctx.lineTo(5*S,-4*S);ctx.lineTo(5*S,4*S);ctx.fill();ctx.restore();});}
function burst(cx,cy,R,dmg,kb,col,dl){R*=rn();dl=dl||0;let w=dl,fired=false;
  addFx(dl+0.5,dt=>{if(fired)return;w-=dt;if(w>0)return;fired=true;inC(cx,cy,R,(e,dx,dy)=>{const [nx,ny]=nrm(dx,dy);hurt(e,dmg,nx,ny,kb);});shk=Math.max(shk,3);},
  t=>{if(!fired)return;const k=Math.min(1,(t-dl)/0.25),a=Math.max(0,1-(t-dl)/0.5);ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.shadowColor=col;ctx.shadowBlur=14;ctx.lineWidth=10*S;ctx.beginPath();ctx.ellipse(cx,cy*SQ-4*S,R*k,R*k*0.7,0,0,7);ctx.stroke();ctx.restore();});}
Object.assign(SK,{
 saodang:{n:'扫荡',g:'🌙',cd:2.4,need:170,cast(){const [dx,dy]=aimDir(),a0=Math.atan2(dy/0.8,dx);sweep(a0,1.0,130*S,3,20,1,['rgba(255,215,140,.35)','rgba(255,240,200,.85)']);}},
 lianhuan:{n:'连环枪',g:'🔱',cd:3.2,need:260,cast(){const [dx,dy]=aimDir(),a=Math.atan2(dy,dx);for(let k=0;k<3;k++)thrust(a,230*S,24*S,2.4,14,k*0.17);}},
 longyin:{n:'龙吟枪',g:'🐉',cd:4.5,need:380,cast(){const [dx,dy]=aimDir();thrust(Math.atan2(dy,dx),360*S,46*S,6,40,0.12);}},
 qijin:{n:'七进七出',g:'🌟',cd:8,need:280,cast(){const [dx,dy]=aimDir(),a=Math.atan2(dy,dx);for(let k=0;k<7;k++)thrust(a+(k-3)*0.28,300*S,34*S,4,22,k*0.09);}},
 susi:{n:'速射',g:'🏹',cd:1.4,need:480,cast(){const [dx,dy]=aimDir(),a=Math.atan2(dy,dx);for(const da of [-0.14,0,0.14])shootArrow(a+da,560,0.9,1.8,8,false,1);}},
 chuanyang:{n:'穿杨',g:'🎯',cd:2.6,need:520,cast(){const [dx,dy]=aimDir();shootArrow(Math.atan2(dy,dx),760,0.9,4,14,false,99);}},
 zhuihun:{n:'追魂箭',g:'🌀',cd:4,need:0,cast(){const a=Math.atan2(aimDir()[1],aimDir()[0]);for(let k=0;k<6;k++)shootArrow(a+(k-2.5)*0.28,380,1.6,2.6,8,true,1);}},
 wanjian:{n:'万箭齐发',g:'☄',cd:7,need:0,cast(){for(let k=0;k<18;k++)shootArrow(k*6.283/18,420,1.0,2.6,10,false,2);}},
 zhenquan:{n:'震拳',g:'👊',cd:2.2,need:120,cast(){burst(hero.x,hero.y,95*S,2.5,40,'#ffd89a');}},
 jinzhong:{n:'金钟反震',g:'🔔',cd:5,need:140,cast(){burst(hero.x,hero.y,140*S,4.5,70,'#ffe08a');}},
 bushan:{n:'不动如山',g:'⛰',cd:9,need:160,cast(){burst(hero.x,hero.y,200*S,8,100,'#ffcf6a',0.2);burst(hero.x,hero.y,130*S,5,60,'#fff1b8',0.45);}}
});
const NEW2=['saodang','lianhuan','longyin','qijin','susi','chuanyang','zhuihun','wanjian','zhenquan','jinzhong','bushan'];
for(const id of NEW2){SK[id].id=id;SKID.push(id);}
Object.assign(CAT,{saodang:'长兵',lianhuan:'长兵',longyin:'长兵',qijin:'长兵',susi:'射艺',chuanyang:'射艺',zhuihun:'射艺',wanjian:'射艺',zhenquan:'体术',jinzhong:'体术',bushan:'体术',zhendi:'体术'});
Object.assign(TIER,{jian:'黄',qiang:'黄',feidao:'黄',jianyu:'玄',chong:'地',daolun:'玄',saodang:'黄',lianhuan:'玄',longyin:'地',qijin:'天',susi:'黄',chuanyang:'玄',zhuihun:'地',wanjian:'天',zhenquan:'黄',jinzhong:'地',bushan:'天'});
Object.assign(RC,{saodang:.3,lianhuan:.35,longyin:.35,qijin:.5,susi:.15,chuanyang:.25,zhuihun:.25,wanjian:.35,zhenquan:.25,jinzhong:.3,bushan:.4});Object.assign(WU,{saodang:.5,lianhuan:.5,longyin:.7,qijin:.8,susi:.35,chuanyang:.5,zhuihun:.6,wanjian:.8,zhenquan:.45,jinzhong:.6,bushan:.9});
// ===== 地天阶功法·心诀 =====
for(const id in GF)GF[id].id=id;
const GX={gf02:{critC:{'短兵':.10}},gf03:{critC:{'短兵':.10},critD:{'短兵':.5}},gf12:{critC:{'长兵':.10}},gf13:{critC:{'长兵':.10},critD:{'长兵':.5}},gf22:{critC:{'射艺':.10}},gf23:{critC:{'射艺':.10},critD:{'射艺':.5}},gf42:{critC:{'术法':.10}},gf43:{critC:{'术法':.10},critD:{'术法':.5}},
 gf32:{block:.10},gf33:{block:.10,still:.4},jubao:{silverP:.05},shixue:{killHeal:.006},taiping:{killHeal:.004},hunyuan:{killHeal:.002}};
const GXD={gf02:'心诀：该类招式暴击率 +10%',gf03:'心诀：该类招式暴击率 +10%，暴击伤害 +50%',gf12:'心诀：该类招式暴击率 +10%',gf13:'心诀：该类招式暴击率 +10%，暴击伤害 +50%',gf22:'心诀：该类招式暴击率 +10%',gf23:'心诀：该类招式暴击率 +10%，暴击伤害 +50%',gf42:'心诀：该类招式暴击率 +10%',gf43:'心诀：该类招式暴击率 +10%，暴击伤害 +50%',
 gf32:'心诀：10% 概率格挡一次伤害',gf33:'心诀：10% 概率格挡；站定不动 1 秒后受到伤害 -40%',jubao:'心诀：击杀时 5% 概率多得 3 银',taiping:'心诀：每次击杀回复 0.4% 生命',hunyuan:'心诀：每次击杀回复 0.2% 生命'};
let xj={critC:{},critD:{},block:0,still:0,silverP:0,killHeal:0},stillT=0;
function calcXj(){const r={critC:{},critD:{},block:0,still:0,silverP:0,killHeal:0};gongfa.forEach(id=>{const g=GF[id],x=GX[id];if(!g||!x)return;const lm=1+0.08*(gfLv(g)-1);
  for(const c in (x.critC||{}))r.critC[c]=(r.critC[c]||0)+x.critC[c]*lm;for(const c in (x.critD||{}))r.critD[c]=(r.critD[c]||0)+x.critD[c]*lm;
  r.block+=(x.block||0)*lm;r.still+=(x.still||0)*lm;r.silverP+=(x.silverP||0)*lm;r.killHeal+=(x.killHeal||0)*lm;});r.still=Math.min(.7,r.still);xj=r;}
// ===== 出身属性对各类武艺的影响 =====
const OA=[[5,4,2,1,1,2,1,3],[3,2,1,5,1,4,1,3],[4,2,5,1,1,2,1,3],[4,2,4,1,5,2,1,3],[2,1,1,1,1,2,6,4]];let oAttr=OA[0];
const CATATT={'短兵':1,'长兵':2,'射艺':3,'体术':0,'术法':6};
function profOf(c){const a=oAttr[CATATT[c]!=null?CATATT[c]:1];return Math.max(0.72,Math.min(1.35,0.58+0.15*a));}

// ===== 属性总纲：14 项 + 真气 + 运劲 + 调息 =====
const ANAME=['体魄','短兵','长兵','射艺','骑术','身法','智谋','运气','筋骨','避锋','威势','杀伐','气海','回元'];
['农夫','猎户','小卒','马夫','书生'].forEach((n,i)=>{OA[i]=OA[i].concat({'农夫':[4,1,2,2,2,2],'猎户':[1,4,3,3,2,3],'小卒':[5,2,3,2,2,2],'马夫':[3,2,4,3,2,2],'书生':[1,3,2,2,5,5]}[n]);});
oAttr=OA[0];
const bonusAttr=new Array(14).fill(0);let gearAttr={12:0,13:0};const SOFT={8:10,9:10,10:8,11:8,12:10,13:10};
const aEff=i=>{const v=(oAttr[i]||0)+bonusAttr[i]+(gearAttr[i]||0),c=SOFT[i]||99;return v<=c?v:c+(v-c)*0.5;};
let zq=100,zqMax=100,RNGB=1,yunOn=false;const yun=new Array(10).fill(false),YC={'黄':4,'玄':6,'地':9,'天':14},AP={take:1};
const rn=()=>RNGB*(yunOn?1.2:1);
function setRM(){RM=0.4*rn();}
function recalcAttr(){const nt=1-Math.min(.45,0.03*aEff(8));takeMul*=nt/AP.take;AP.take=nt;RNGB=1+0.04*aEff(10);setRM();zqMax=Math.round((80+6*aEff(12))*(1+0.04*Math.max(0,(oAttr[6]||1)-1)));if(zq>zqMax)zq=zqMax;}
function addAttr(o){for(const k in o)bonusAttr[+k]+=o[k];recalcAttr();}
const dodgeP=()=>Math.min(.4,0.02*aEff(9)),critDmg=()=>0.06*aEff(11),hyRate=()=>Math.min(.6,0.30+0.01*aEff(13));
(function(){const b=document.getElementById('bars');if(!b)return;const d=document.createElement('div');d.className='bar panel';d.id='zqbar';d.innerHTML='<i></i><b></b>';b.appendChild(d);})();
recalcAttr();zq=zqMax;

let skExp={},echoQ=[],echoOn=false;const XDC=['短兵','长兵','射艺','体术','术法'];
const skLv=id=>lvOf(skExp[id]||0);
function gainProf(e){const et=ETIER[e.type]!=null?ETIER[e.type]:0,w=[1,3,8,20][et]||1,gain=w*(1+0.08*((oAttr[6]||1)-1));
  if(curK){const b=skLv(curK.id);skExp[curK.id]=(skExp[curK.id]||0)+gain;const a=skLv(curK.id);if(a>b)floatTxt(SK[curK.id].n+' 熟练升至 LV'+a,'#ffd76a');}
  let ch=false;gongfa.forEach(id=>{const g=GF[id];if(!g)return;if(g.c&&!(curK&&CAT[curK.id]===g.c))return;const b=gfLv(g);gfExp[id]=(gfExp[id]||0)+gain;if(gfLv(g)>b)ch=true;});if(ch)recalcGear();}
function gainXd(c){bag.push({k:'xd',id:c});floatTxt('拾得心得·'+c,'#ffd76a');}
function useXd(bi,kind,i){const it=bag[bi];if(!it||it.k!=='xd')return false;if(kind==='v'){const id=loadout[i];if(!id||CAT[id]!==it.id)return false;const b=skLv(id);skExp[id]=(skExp[id]||0)+60;if(skLv(id)>b)floatTxt(SK[id].n+' 熟练升至 LV'+skLv(id),'#ffd76a');}else{const g=GF[gongfa[i]];if(!g||g.c!==it.id)return false;gfExp[g.id]=(gfExp[g.id]||0)+60;recalcGear();}bag.splice(bi,1);return true;}
function buildHud(){skills.innerHTML='';loadout.forEach((id,i)=>{const k=SK[id],d=document.createElement('div');d.dataset.i=i;d.className='slot panel'+(k?'':' empty');d.innerHTML=(k?k.g:'+')+'<s>'+(k?k.n:'')+'</s>';skills.appendChild(d);});}
buildHud();
function startPick(){const card=(t,d,id)=>'<button data-w="'+id+'" style="width:calc(var(--u)*230);padding:calc(var(--u)*18);background:#2a2114;border:2px solid #7a5f2c;border-radius:10px;color:#fff;text-align:left"><div style="font-size:calc(var(--u)*30);font-weight:700">'+t+'</div><div style="font-size:calc(var(--u)*20);color:#bfae82;margin-top:6px">'+d+'</div></button>';
  showOv('<div style="font-size:calc(var(--u)*46);font-weight:700">选择开局兵器</div><div style="font-size:calc(var(--u)*22);color:#bfae82">同类武艺威力 ×1.3，其他类 ×0.7</div><div style="display:flex;gap:calc(var(--u)*16);flex-wrap:wrap;justify-content:center">'+card('大刀 / 剑','短兵：开局自动习得横扫','d')+card('长枪','长兵：枪刺','q')+card('弓','射艺：箭雨、飞刀','g')+'</div>');
  ov.querySelectorAll('button[data-w]').forEach(b=>b.onclick=()=>{const w=b.dataset.w;mainCat=w=='d'?'短兵':w=='q'?'长兵':'射艺';oAttr=w=='d'?OA[0]:w=='q'?OA[2]:OA[1];recalcAttr();zq=zqMax;
    const L=w=='d'?['hengsao','','','','']:w=='q'?['qiang','','','','']:['jianyu','feidao','','',''];
    weapon='wp0';recalcGear();for(let i=0;i<5;i++){loadout[i]=L[i];cds[i]=0.2*i;}normLoadout();buildHud();syncSel();started=true;paused=false;ov.style.display='none';});}
function syncSel(){document.querySelectorAll('#panel select').forEach((sel,i)=>{if(i<5)sel.value=loadout[i]||'';});}
(function(){const p=$('panel'),h=document.createElement('div');h.innerHTML='<h4>武艺（5 格自动释放）</h4>';
 for(let i=0;i<5;i++){const l=document.createElement('label'),sel=document.createElement('select');sel.style.cssText='width:100%;background:#241d36;color:#eee;border:1px solid #6b5a8a;border-radius:6px;padding:3px';
  sel.innerHTML='<option value="">（空）</option>'+SKID.map(id=>'<option value="'+id+'">'+SK[id].g+' '+SK[id].n+' ['+(CAT[id]||'其他')+']</option>').join('');sel.value=loadout[i]||'';
  sel.onchange=()=>{loadout[i]=sel.value;cds[i]=0.2;buildHud();};l.appendChild(sel);h.appendChild(l);}
 const h2=document.createElement('div');h2.innerHTML='<h4>敌人攻击强度</h4>';const sl=document.createElement('select');sl.style.cssText='width:100%;background:#241d36;color:#eee;border:1px solid #6b5a8a;border-radius:6px;padding:3px';
 sl.innerHTML='<option value="0">关（敌人不攻击）</option><option value="0.5">轻</option><option value="1" selected>标准</option><option value="1.6">重</option>';sl.onchange=()=>{atkMul=+sl.value;};h2.appendChild(sl);h.appendChild(h2);
 p.insertBefore(h,p.firstChild);})();
(function(){const C=window.__CFG;const O=[['短兵',['hengsao','lianzhan','','','']],['射艺',['jianyu','feidao','','','']],['长兵',['qiang','','','','']],['长兵',['qiang','','','','']],['术法',['huogong','','','','']]];
  if(C&&C.title){titleId=C.title;applyTitle(C.title);}applyFac((C&&C.faction)||'xiangyong');
  if(C&&C.o!=null){const o=O[C.o]||O[0];mainCat=o[0];oAttr=OA[C.o]||OA[0];recalcAttr();zq=zqMax;weapon=['wp0','wp3','wp2','wp2','wp1'][C.o]||'wp0';recalcGear();for(let i=0;i<5;i++){loadout[i]=o[1][i];cds[i]=0.2*i;}normLoadout();buildHud();syncSel();started=true;paused=true;playStory([{w:'刘备',t:'中平元年，黄巾起于钜鹿，烽火已烧到涿郡城下。'},{w:'刘备',t:'{名}，你虽是乡野农夫，却肯在此时拿起刀，备心中有数。'},{w:'张飞',t:'大哥说得对！这些戴黄头巾的杂碎，先让俺老张看看你的刀快不快！'},{w:'刘备',t:'活下来，撑到鸣金收兵。八波之后，那张角自会现身。'}],()=>{paused=false;});}else startPick();})();
(function(){const b=document.createElement('button');b.textContent='退';b.title='弃战退出';b.style.cssText='position:absolute;left:calc(var(--u)*8);top:calc(var(--u)*64);z-index:7;width:calc(var(--u)*44);height:calc(var(--u)*44);border-radius:50%;border:1px solid #6b5a8a;background:rgba(20,14,30,.6);color:#bfae82;font-size:calc(var(--u)*20);opacity:.7';
 b.onclick=()=>{if(over)return;if(!b._c){b._c=1;b.textContent='确';b.style.width='auto';b.style.padding='0 10px';b.title=kills===0?'再点一次：弃甲而逃，投奔黄巾':'再点一次：弃战，计为败';setTimeout(()=>{b._c=0;b.textContent='退';b.style.padding='';b.style.width='calc(var(--u)*44)'},2500);return;}over=true;const r=endReport(false);r.deserter=kills===0;if(parent!==window){parent.postMessage(r,'*');}else location.reload();};
 stage.appendChild(b);})();
window.__dbg={endWave:()=>endWave(),info:()=>fac+' '+loadout.join()+' hp'+hero.maxhp};
const edgeEl=document.createElement('div');edgeEl.style.cssText='position:absolute;pointer-events:none;display:none;top:calc(var(--u)*72);left:50%;transform:translateX(-50%);z-index:6;color:#ffb089;background:rgba(40,10,6,.6);padding:4px 12px;border-radius:6px;font-size:calc(var(--u)*22);white-space:nowrap';stage.appendChild(edgeEl);
const stEl=document.createElement('div');stEl.style.cssText='position:absolute;pointer-events:none;left:50%;bottom:calc(var(--u)*44);transform:translateX(-50%);z-index:6;display:flex;gap:calc(var(--u)*6);flex-wrap:wrap;justify-content:center;width:50%';stage.appendChild(stEl);
function renderStatus(){const L=[];
  if(fac&&fac!=='xiangyong'&&FAC[fac])L.push(['🚩',FAC[fac].n,'#e8d9a8']);
  if(titleId&&TITLES[titleId])L.push(['🏅',TITLES[titleId].n,'#e8d9a8']);
  if(moraleMul<1)L.push(['😰','士气 -'+Math.round((1-moraleMul)*100)+'%','#ff9a6a']);
  if(cbOn&&cbT>0)L.push(['⚔','追击 +20% '+cbT.toFixed(1)+'s','#9fe08a']);
  if(rgOn&&rgT>0)L.push(['🔥','愤怒 +25% '+rgT.toFixed(1)+'s','#9fe08a']);
  if(crowdMul){const n=nearest(40,150).length;if(n>0)L.push(['👥','人多 +'+Math.min(40,n*4)+'%','#9fe08a']);}
  const key=JSON.stringify(L);if(key===statusKey)return;statusKey=key;
  stEl.innerHTML=L.map(x=>'<span style="background:rgba(20,14,8,.72);border:1px solid rgba(200,170,100,.45);border-radius:6px;padding:calc(var(--u)*2) calc(var(--u)*8);font-size:calc(var(--u)*16);color:'+x[2]+';white-space:nowrap">'+x[0]+' '+x[1]+'</span>').join('');}
function floatTxt(t,c){texts.push({x:hero.x,y:hero.y,t:0,s:t,c:c||'#ffe28a'});}
function hitHero(dmg){if(hero.dash){if(!hero.dash.pf){hero.dash.pf=true;pdCnt++;ampT=3;floatTxt('完美闪避');}return;}sfx('hurt');
  if(hurtT>0||atkMul<=0)return;if(dodgeP()>0&&Math.random()<dodgeP()){hurtT=0.3;floatTxt('避锋','#bfe6ff');return;}if(xj.block&&Math.random()<xj.block){hurtT=0.3;floatTxt('格挡','#9fe6ff');return;}const d=Math.max(1,Math.round(dmg*atkMul*takeMul*(xj.still&&stillT>1?1-xj.still:1)*(hasGf('taxue')&&hero.moving?.85:1)*(hasGf('beishui')&&hero.hp<hero.maxhp*.3?.9:1)));hero.hp-=d;noHitT=0;hurtT=0.5;rgT=4;hitsTaken++;if(wave<=4)hitsW4++;stopT=Math.max(stopT,0.05);shk=Math.max(shk,6);floatTxt('-'+d,'#ff6a5a');if(hero.hp<=0){hero.hp=0;heroDie();}}
function resolveAtk(e,T){const a=e.atk;
  if(T.ranged){arrows.push({x:e.x,y:e.y,dx:a.dx,dy:a.dy,t:0,dmg:T.dmg});return;}
  let hit;if(T.ring){const dx=hero.x-a.x,dy=(hero.y-a.y)*SQ/0.75;hit=dx*dx+dy*dy<a.r*a.r;}else{const dx=hero.x-e.x,dy=(hero.y-e.y)*SQ;hit=dx*dx+dy*dy<(a.r*1.15)**2;}
  if(hit)hitHero(T.dmg);}
function heroDie(){over=true;if(parent!==window){parent.postMessage(endReport(false),'*');return;}showOv('<div style="font-size:calc(var(--u)*52);font-weight:700;color:#e0503a">兵败涿郡</div><div style="font-size:calc(var(--u)*26)">击倒 '+kills+'　第 '+wave+' 波</div><button id="again" style="font-size:calc(var(--u)*32);padding:calc(var(--u)*12) calc(var(--u)*40);border-radius:10px;border:2px solid #d9b25a;background:#6b4a14;color:#fff">再来一局</button>');$('again').onclick=()=>location.reload();}
const ESPD=1.2;
const ESK={daoshou:['charge'],chutou:['charge'],pers:['charge'],zhumao:['charge'],changmao:['charge'],jishou:['charge'],daodun:['charge'],zhongdun:['charge'],tiejia:['charge'],qiangshuai:['charge'],tieqishuai:['charge'],
  daoshuai:['whirl','charge'],jishuai:['whirl'],zhongji:['whirl'],xtou:['leap'],tiejiashuai:['leap'],brute2:['whirl','leap'],
  archer:['lob'],gongshou:['lob'],nushou:['lob'],nushuai:['lob'],gongqi:['lob'],fangshi:['ward'],jijiu:['ward']};
const SKCD={charge:()=>7+Math.random()*4,whirl:()=>6+Math.random()*3,leap:()=>8+Math.random()*3,lob:()=>4.5+Math.random()*3,ward:()=>7+Math.random()*3};
const ezones=[];
const BW={10:'zhangbao',14:'zhangliang',17:'bocai'};
let sandT=0;
const ZC={r:'225,45,35',p:'160,100,255',w:'210,225,255',o:'255,140,50'};
function spawnAt(type,x,y){enemies.push({type,x,y,hp:TYPES[type].hp*(TYPES[type].hp>=6?2:3)*(1+HP_SCALE*Math.max(0,wave-1)),wk:Math.random()*6,fa:0});}
const uv=e=>{const dx=hero.x-e.x,dy=(hero.y-e.y)*SQ,d=Math.hypot(dx,dy)||1;return [dx/d,dy/d,d];};
const zAt=(x,y,r,warn,dmg,col)=>addZone({x,y,r:r*S,warn,dmg,col:col||'r'});
const ahd=(e,ux,uy,L)=>[e.x+ux*L*S,e.y+uy*L*S/SQ];
const BSUM={zhangbao:['fangshi','fangshi','fangshi','fangshi'],zhangliang:['daoshou','daoshou','zhongji','zhongji','jishou']};
const BK={
 cleave:(e,T)=>{const [ux,uy]=uv(e);const [x1,y1]=ahd(e,ux,uy,56);zAt(x1,y1,58,.55,T.dmg*1.2);return {dur:1.3,steps:[[.55,()=>{const [x2,y2]=ahd(e,ux,uy,82);zAt(x2,y2,74,.45,T.dmg*1.9);}]]};},
 spin:(e,T)=>{zAt(e.x,e.y,125,.9,T.dmg*1.5);return {dur:2.1,steps:[[.9,()=>{e.dz=1.0;}]]};},
 stomp:(e,T)=>{zAt(e.x,e.y,105,1.3,T.dmg*1.8);return {dur:2.0,steps:[[1.3,()=>{e.dz=.8;}]]};},
 crack:(e,T)=>{const [ux,uy]=uv(e);for(let i=0;i<7;i++){const [x,y]=ahd(e,ux,uy,40+i*48);zAt(x,y,38,.6+i*.08,T.dmg*1.3,'o');}return {dur:1.5,steps:[]};},
 rocks:(e,T)=>{for(let i=0;i<6;i++){const x=i?hero.x+(Math.random()-.5)*300*S:hero.x,y=i?hero.y+(Math.random()-.5)*180*S/SQ:hero.y;zAt(x,y,44,1+i*.14,T.dmg*1.4,'o');}return {dur:1.9,steps:[]};},
 burrow:(e,T)=>({dur:2.3,steps:[[.35,()=>{e.hide=true;e.inv=true;}],[1.1,()=>{const sd=Math.random()<.5?-1:1;e.x=hero.x+sd*150*S;e.y=hero.y+(Math.random()-.5)*60*S/SQ;e.hide=false;e.inv=false;zAt(e.x,e.y,62,.5,T.dmg*1.4,'o');}],[1.5,()=>{BK.crack(e,T);}]]}),
 roar:(e,T)=>({dur:1.4,steps:[[0,()=>{zAt(e.x,e.y,110,.5,T.dmg);}],[.5,()=>{const ux=hero.x-e.x,uy=(hero.y-e.y)*SQ,d=Math.hypot(ux,uy)||1;if(d<130*S){hero.x+=ux/d*90*S;hero.y+=uy/d*90*S/SQ;}shk=Math.max(shk,8);e.rage=true;if(e.type==='zhangbao'){sandT=9;floatTxt('黄沙迷阵','#e0b050');}else floatTxt('都给我上！','#ff9a6a');(BSUM[e.type]||[]).forEach(t=>spawnAt(t,e.x+(Math.random()-.5)*180*S,e.y+(Math.random()-.5)*120*S/SQ));}]]}),
 drum:(e,T)=>({dur:1.4,steps:[[.3,()=>{floatTxt('擂鼓！','#ffd76a');for(let i=0;i<8;i++){const a=Math.random()*6.283,r=ringR()*.9+Math.random()*60;spawnAt(['qingqi','daoshou','jishou','zhumao'][i%4],hero.x+Math.cos(a)*r,hero.y+Math.sin(a)*r/SQ);}}]]}),
 thunder:(e,T,n)=>{n=n||4;for(let i=0;i<n;i++){const x=i?hero.x+(Math.random()-.5)*260*S:hero.x,y=i?hero.y+(Math.random()-.5)*160*S/SQ:hero.y;zAt(x,y,30,1.05+i*.12,T.dmg*1.5,'w');}return {dur:1.7,steps:[]};},
 fire:(e,T)=>{for(let k=-4;k<=4;k++)zAt(hero.x+k*70*S,hero.y,34,.8+Math.abs(k)*.1,T.dmg*1.2,'o');return {dur:1.6,steps:[]};},
 tele:(e,T)=>({dur:1.9,steps:[[0,()=>{e.hide=true;e.inv=true;}],[.45,()=>{const sd=Math.random()<.5?-1:1;e.x=hero.x+sd*70*S;e.y=hero.y;e.hide=false;e.inv=false;BK.cleave(e,T);}]]})};
const pk=a=>{let r=Math.random()*a.reduce((m,x)=>m+x[1],0);for(const x of a){r-=x[1];if(r<=0)return x[0];}return a[0][0];};
function bossAI(e,T,dt,dx,dy,d,spE){
  if(retreatT>0)return;
  const B=e.bs||(e.bs={cd:1.5,drum:8,ph:1,half:false});
  const face=()=>{e.fa=Math.atan2(dy,dx);};
  const go=(keep)=>{if(d>keep*S){e.x+=dx/d*spE*dt;e.y+=dy/d*spE*dt/SQ;e.wk+=dt*spE/5.5;}face();};
  const run=(n,a)=>{e.bk=BK[n](e,T,a);e.bk.t=0;e.bk.steps.forEach(x=>x[2]=0);face();};
  if(e.sk){skStep(e,T,dt);if(!e.sk)B.cd=1.4;return;}
  if(e.dz>0){e.dz-=dt;face();return;}
  if(e.bk){const K=e.bk;K.t+=dt;for(const x of K.steps)if(!x[2]&&K.t>=x[0]){x[2]=1;x[1]();}if(K.t>=K.dur){e.bk=null;B.cd=B.base||1.8;}return;}
  if(e.type==='zhangbao'){B.base=e.rage?1.6:2.2;if(!B.half&&e.hp<T.hp*.5){B.half=true;run('roar');return;}go(190);B.cd-=dt;if(B.cd<=0)run(pk([['crack',3],['rocks',3],['burrow',1],...(d<100?[['cleave',2]]:[])]));return;}
  if(e.type==='zhangliang'){B.base=e.rage?1.1:1.7;if(!B.half&&e.hp<T.hp*.5){B.half=true;run('roar');return;}go(70);B.cd-=dt;if(B.cd<=0){const k=d>130?pk([['charge',3],['cleave',1]]):pk([['cleave',3],['spin',2]]);if(k==='charge'){skStart(e,T,d,dx,dy,'charge');}else run(k);}return;}
  if(e.type==='bocai'||e.type==='bocai2'){B.base=1.5;
    if(e.type==='bocai'){if(e.hp<T.hp*.5){e.type='bocai2';floatTxt('波才下马','#ff9a6a');shk=Math.max(shk,8);return;}B.drum-=dt;if(B.drum<=0){B.drum=10;run('drum');return;}go(80);B.cd-=dt;if(B.cd<=0){const k=pk([['charge',3],['cleave',1]]);if(k==='charge')skStart(e,T,d,dx,dy,'charge');else run(k);}return;}
    go(70);B.cd-=dt;if(B.cd<=0){const k=pk([['spin',2],['leap',2],['stomp',2],['cleave',2]]);if(k==='leap')skStart(e,T,d,dx,dy,'leap');else run(k);}return;}
  if(e.type==='zhangjiao'){
    if(!B.init){B.init=1;e.inv=true;e.lamps=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;spawnAt('lamp',hero.x+Math.cos(a)*240*S,hero.y+Math.sin(a)*150*S/SQ);}floatTxt('法台护体：打灭八盏法灯！','#ffd76a');B.fire=5;}
    const la=enemies.filter(x=>x.type==='lamp').length;
    if(B.ph===1){if(la===0){B.ph=2;e.adds=[];floatTxt('法阵已破！','#ff9a6a');for(let i=0;i<8;i++){const a=Math.random()*6.283,r=(i<2?'brute2':'daoshuai');spawnAt(r,e.x+Math.cos(a)*120*S,e.y+Math.sin(a)*80*S/SQ);e.adds.push(enemies[enemies.length-1]);}B.cd=2;return;}
      B.base=1.5;B.fire-=dt;B.cd-=dt;face();if(B.fire<=0){B.fire=7;run('fire');return;}if(B.cd<=0)run('thunder',1+Math.ceil(la/3));return;}
    if(B.ph===2){e.adds=e.adds.filter(a=>enemies.includes(a));if(!e.adds.length){B.ph=3;e.inv=false;floatTxt('张角下台！','#ff5a4a');shk=Math.max(shk,10);B.cd=1.2;return;}B.base=2.5;B.cd-=dt;face();if(B.cd<=0)run('thunder',2);return;}
    B.base=e.hp<T.hp*.4?1.4:2;go(80);B.cd-=dt;if(B.cd<=0)run(pk([['tele',2],['thunder',3],['fire',2],...(d<110?[['stomp',2]]:[['cleave',1]])]),6);return;}
}
const BOSSAI={zhangbao:1,zhangliang:1,bocai:1,bocai2:1,zhangjiao:1};
const bbar=document.createElement('div');bbar.style.cssText='position:fixed;top:46px;left:50%;transform:translateX(-50%);width:min(480px,70vw);z-index:6;display:none;pointer-events:none;color:#f3e7c4;font:bold 14px sans-serif;text-align:center;text-shadow:0 0 3px #000';bbar.innerHTML='<div></div><div style="height:12px;background:#000;border:2px solid #8a6a3a"><div style="height:100%;background:#b3262c;width:100%"></div></div>';document.body.appendChild(bbar);
const sandEl=document.createElement('div');sandEl.style.cssText='position:fixed;inset:0;z-index:4;pointer-events:none;background:#c89a40;mix-blend-mode:multiply;opacity:0;transition:opacity .4s';document.body.appendChild(sandEl);

function addZone(z){if(ezones.length>=40)ezones.shift();z.t=0;z.fired=false;z.tk=0;ezones.push(z);}
function skStart(e,T,d,dx,dy,fk){const L=ESK[e.type];if(!fk&&(!L||atkMul<=0))return false;const k=fk||L[(Math.random()*L.length)|0];
  if(k==='charge'){if(!fk&&(d<90*S||d>300*S))return false;e.sk={k,ph:0,t:0,dx:dx/d,dy:dy/d,hit:false,big:!!T.boss};e.fa=Math.atan2(dy,dx);return true;}
  if(k==='whirl'){if(d>115*S)return false;e.sk={k,ph:0,t:0,dur:0.85};addZone({x:e.x,y:e.y,r:(T.r>=13?96:84)*S,warn:0.85,dmg:T.dmg*1.4,col:'r'});return true;}
  if(k==='leap'){if(!fk&&(d<110*S||d>300*S))return false;e.sk={k,ph:0,t:0,dur:1.3,sx:e.x,sy:e.y,tx:hero.x,ty:hero.y};addZone({x:hero.x,y:hero.y,r:72*S,warn:1.0,dmg:T.dmg*1.6,col:'r'});e.fa=Math.atan2(dy,dx);return true;}
  if(k==='lob'){if(d>T.range*S||d<80*S)return false;const n=T.hp>=10?3:1;e.sk={k,ph:0,t:0,dur:0.95};for(let i=0;i<n;i++)addZone({x:hero.x+(n>1?(Math.random()-.5)*150*S:0),y:hero.y+(n>1?(Math.random()-.5)*90*S/SQ:0),r:46*S,warn:0.95,dmg:T.dmg*1.3,col:'r'});e.fa=Math.atan2(dy,dx);return true;}
  if(k==='ward'){if(d>T.range*S)return false;e.sk={k,ph:0,t:0,dur:0.7};addZone({x:hero.x+(Math.random()-.5)*160*S,y:hero.y+(Math.random()-.5)*100*S/SQ,r:78*S,warn:1.0,life:4.2,dmg:T.dmg*0.7,tick:0.6,col:'p',field:1});e.fa=Math.atan2(dy,dx);return true;}
  return false;}
function skStep(e,T,dt){const s=e.sk;s.t+=dt;
  if(s.k==='charge'){if(s.ph===0){if(s.t>=0.55){s.ph=1;s.t=0;}}
    else if(s.ph===1){const v=(s.big?560:480)*S;e.x+=s.dx*v*dt;e.y+=s.dy*v*dt/SQ;e.wk+=dt*14;if(!s.hit){const ex=hero.x-e.x,ey=(hero.y-e.y)*SQ;if(ex*ex+ey*ey<(T.r*S+16*S)**2){s.hit=true;hitHero(T.dmg*(s.big?1.7:1.4));}}if(s.t>=(s.big?0.55:0.42)){s.ph=2;s.t=0;}}
    else if(s.t>=(s.big?1.2:0.9)){e.sk=null;e.skcd=SKCD.charge();}return;}
  if(s.k==='leap'){if(s.t>=0.5&&s.t<1.0){const k=(s.t-0.5)/0.5;e.x=s.sx+(s.tx-s.sx)*k;e.y=s.sy+(s.ty-s.sy)*k;e.wk+=dt*10;}else if(s.t>=1.0){e.x=s.tx;e.y=s.ty;}if(s.t>=s.dur){e.sk=null;e.skcd=SKCD.leap();}return;}
  if(s.t>=s.dur){e.sk=null;e.skcd=SKCD[s.k]();}}
function zoneUpd(dt){sandT=Math.max(0,sandT-dt);for(let i=ezones.length-1;i>=0;i--){const z=ezones[i];z.t+=dt;if(retreatT>0){ezones.splice(i,1);continue;}
  const inside=()=>{const dx=hero.x-z.x,dy=(hero.y-z.y)*SQ/0.75;return dx*dx+dy*dy<z.r*z.r;};
  if(!z.field){if(!z.fired&&z.t>=z.warn){z.fired=true;shk=Math.max(shk,3);if(atkMul>0&&inside())hitHero(z.dmg);}if(z.t>=z.warn+0.2)ezones.splice(i,1);}
  else{if(z.t>=z.warn){z.tk-=dt;if(z.tk<=0){z.tk=z.tick;if(atkMul>0&&inside())hitHero(z.dmg);}for(const e of enemies){const dx=e.x-z.x,dy=(e.y-z.y)*SQ/0.75;if(dx*dx+dy*dy<z.r*z.r)e.haste=0.5;}}if(z.t>=z.warn+z.life)ezones.splice(i,1);}}}
function zoneDraw(){for(const z of ezones){const k=Math.min(1,z.t/z.warn),sy=z.y*SQ,c=ZC[z.col]||ZC.r;ctx.save();
  if(z.t<z.warn){ctx.fillStyle='rgba('+c+','+(0.10+0.12*k)+')';ctx.strokeStyle='rgba('+c+',.9)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(z.x,sy,z.r,z.r*0.75,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='rgba('+c+','+(0.25+0.2*k)+')';ctx.beginPath();ctx.ellipse(z.x,sy,z.r*k,z.r*k*0.75,0,0,7);ctx.fill();}
  else if(z.field){const pu=0.22+0.08*Math.sin(tm*8);ctx.fillStyle='rgba('+c+','+pu+')';ctx.strokeStyle='rgba('+c+',.95)';ctx.lineWidth=2.5*S;ctx.setLineDash([14*S,10*S]);ctx.lineDashOffset=-tm*30;ctx.beginPath();ctx.ellipse(z.x,sy,z.r,z.r*0.75,0,0,7);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='rgba('+c+',.55)';ctx.beginPath();ctx.ellipse(z.x,sy,z.r*0.6,z.r*0.45,0,0,7);ctx.stroke();}
  else{const f=Math.max(0,1-(z.t-z.warn)/0.2);ctx.fillStyle='rgba(255,'+(180+60*(1-f))+',150,'+(0.55*f)+')';ctx.beginPath();ctx.ellipse(z.x,sy,z.r,z.r*0.75,0,0,7);ctx.fill();}
  ctx.restore();}}
const GRID=26;
function update(dt){
  if(paused||over)return;
  shk=Math.max(0,shk-dt*30);cv.style.transform=shk>0.3?'translate('+((Math.random()*2-1)*shk).toFixed(1)+'px,'+((Math.random()*2-1)*shk).toFixed(1)+'px)':'';
  for(let i=dnums.length-1;i>=0;i--){dnums[i].t+=dt;if(dnums[i].t>0.7)dnums.splice(i,1);}
  if(stopT>0){stopT-=dt;return;}
  tm+=dt;tclock+=dt;waveT+=dt;
  let ix=0,iy=0;
  if(keys['a']||keys['arrowleft'])ix-=1;if(keys['d']||keys['arrowright'])ix+=1;
  if(keys['w']||keys['arrowup'])iy-=1;if(keys['s']||keys['arrowdown'])iy+=1;
  if(stick){ix+=stick.dx;iy+=stick.dy;}
  stiff=Math.max(0,stiff-dt);hurtT=Math.max(0,hurtT-dt);ampT=Math.max(0,ampT-dt);cbT=Math.max(0,cbT-dt);rgT=Math.max(0,rgT-dt);for(let i=texts.length-1;i>=0;i--){texts[i].t+=dt;if(texts[i].t>1)texts.splice(i,1);}popT=Math.max(0,popT-dt);for(let i=0;i<LN;i++)skipFl[i]=Math.max(0,skipFl[i]-dt);
  const il=Math.hypot(ix,iy);hero.moving=il>0.08&&stiff<=0;stillT=hero.moving?0:stillT+dt;
  dashCd=Math.max(0,dashCd-dt);noHitT+=dt;
  if(hero.moving||hero.dash){shiT=0;if(hasGf('xingyun')){shiD+=76*spdMul*dt;if(shiD>=150){shiD=0;shi=Math.min(5,shi+1);}}
    if(hasGf('caoshang')){trailT-=dt;if(trailT<=0){trailT=.18;trail.push({x:hero.x,y:hero.y,t:2});if(trail.length>24)trail.shift();}}
    if(hasGf('yufeng')){ywT-=dt;if(ywT<=0){ywT=.4;const R=46*S*spdMul;effects.push({t:0,x:hero.x,y:hero.y,dx:0,dy:0});for(let j=enemies.length-1;j>=0;j--){const e=enemies[j];if(Math.hypot(e.x-hero.x,(e.y-hero.y)*SQ)<R+TYPES[e.type].r*S){hurt(e,1.2*(WP[weapon]?WP[weapon].atk:1),e.x-hero.x,(e.y-hero.y)*SQ,0);if(e.hp<=0)kill(j);}}}}}
  else{shiD=0;if(shi>0){shiT+=dt;if(shiT>=1.5){shiT=0;shi--;}}}
  for(let j=trail.length-1;j>=0;j--){trail[j].t-=dt;if(trail[j].t<=0)trail.splice(j,1);}
  const SP=76*spdMul;
  if(hero.dash){const D=hero.dash;D.t+=dt;D.g+=dt;const dsp=105/0.24;hero.x+=D.dx*dsp*dt;hero.y+=D.dy*dsp*dt/SQ;if(D.g>0.03){D.g=0;ghosts.push({x:hero.x,y:hero.y,fa:hero.fa,a:0.5,f:Math.floor(hero.wk)%8});}for(const e of enemies){const ex=e.x-hero.x,ey=(e.y-hero.y)*SQ,dd=Math.hypot(ex,ey);if(dd<(hasGf('tiesha')?60:34)*S&&dd>0.1){const pw=hasGf('tiesha')?12:5;e.x+=ex/dd*pw;e.y+=ey/dd*pw/SQ;if(pw>5&&!TYPES[e.type].boss)e.stn=.5;}}if(D.t>=0.24){hero.dash=null;stiff=0.12;}hero.moving=true;hero.wk+=dt*14;}
  else if(stiff>0){hero.wk=0;}
  else if(hero.moving){const m=Math.min(1,il)/il;hero.x+=ix*m*SP*dt;hero.y+=iy*m*SP*dt/SQ;hero.fa=Math.atan2(iy,ix);hero.wk+=dt*7.5;}
  else hero.wk=0;
  const RS=ringR();
  for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(!isFinite(e.x)||!isFinite(e.y)||!isFinite(e.wk)){enemies.splice(i,1);}}
  for(const e of enemies){
    const T=TYPES[e.type];let dx=hero.x-e.x,dy=(hero.y-e.y)*SQ;const d=Math.hypot(dx,dy)||1;
    if(retreatT>0){e.atk=null;e.sk=null;continue;}
    if(e.hitT>0)e.hitT-=dt;if(e.flashT>0)e.flashT-=dt;if(e.strikeT>0)e.strikeT-=dt;
    e.acd=(e.acd==null?Math.random()*1.2:e.acd)-dt;
    if(e.stn>0){e.stn-=dt;continue;}let spE=T.sp*(T.boss?1:ESPD)*(e.haste>0?1.3:1);if(e.haste>0)e.haste-=dt;if(trail.length&&!T.boss){for(const q of trail)if(Math.hypot(q.x-e.x,(q.y-e.y)*SQ)<30*S){spE*=.7;break;}}
    if(BOSSAI[e.type]){bossAI(e,T,dt,dx,dy,d,spE*(e.rage?1.25:1));continue;}
    if(e.atk){e.atk.t+=dt;if(e.atk.t>=e.atk.dur){resolveAtk(e,T);e.atk=null;e.strikeT=0.22;e.acd=T.ac;}continue;}
    if(e.skcd==null)e.skcd=2+Math.random()*5;e.skcd-=dt;
    if(e.sk){skStep(e,T,dt);continue;}
    if(e.skcd<=0&&ESK[e.type]&&skStart(e,T,d,dx,dy))continue;
    if(T.ranged){if(atkMul>0&&e.acd<=0&&d<T.range*S&&d>60*S){e.atk={t:0,dur:T.aw,x:hero.x,y:hero.y,r:0,dx:dx/d,dy:dy/d};e.fa=Math.atan2(dy,dx);continue;}
      if(d<T.keep*0.6*S){e.x-=dx/d*spE*0.7*dt;e.y-=dy/d*spE*0.7*dt/SQ;e.fa=Math.atan2(dy,dx);e.wk+=dt*spE/5.5;}
      else if(d>T.keep*S){e.x+=dx/d*spE*dt;e.y+=dy/d*spE*dt/SQ;e.fa=Math.atan2(dy,dx);e.wk+=dt*spE/5.5;}
      else e.fa=Math.atan2(dy,dx);
      continue;}
    if(atkMul>0&&e.acd<=0&&d<T.reach*S){e.atk={t:0,dur:T.aw,x:hero.x,y:hero.y,r:T.ar*S};continue;}
    e.x+=dx/d*spE*dt;e.y+=dy/d*spE*dt/SQ;e.fa=Math.atan2(dy,dx);e.wk+=dt*spE/5.5;
    if(d>RS*1.8&&!T.boss){const a=Math.random()*6.283;e.x=hero.x+Math.cos(a)*(RS+Math.random()*40);e.y=hero.y+Math.sin(a)*(RS+Math.random()*40)/SQ;}
  }
  zoneUpd(dt);
  for(let i=arrows.length-1;i>=0;i--){const p=arrows[i];p.t+=dt;p.x+=p.dx*270*dt;p.y+=p.dy*270*dt/SQ;
    const ex=hero.x-p.x,ey=(hero.y-p.y)*SQ;if(ex*ex+ey*ey<(13*S)**2){hitHero(p.dmg);arrows.splice(i,1);continue;}
    if(p.t>1.8||retreatT>0)arrows.splice(i,1);}
  // 敌人互相推开（空间网格）
  const grid=new Map();
  for(let i=0;i<enemies.length;i++){const e=enemies[i];const k=(Math.floor(e.x/GRID)+4000)*8192+Math.floor(e.y*SQ/GRID)+4000;let a=grid.get(k);if(!a){a=[];grid.set(k,a);}a.push(i);}
  for(let i=0;i<enemies.length;i++){const a=enemies[i],ra=TYPES[a.type].r*S,gx=Math.floor(a.x/GRID),gy=Math.floor(a.y*SQ/GRID);
    for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){const L=grid.get((gx+ox+4000)*8192+gy+oy+4000);if(!L)continue;
      for(const j of L){if(j<=i)continue;const b=enemies[j],rb=TYPES[b.type].r*S;
        const dx=b.x-a.x,dy=(b.y-a.y)*SQ,d=Math.hypot(dx,dy),m=(ra+rb)*0.9;
        if(d<m&&d>0.01){const p=(m-d)/2*0.6,nx=dx/d,ny=dy/d;a.x-=nx*p;a.y-=ny*p/SQ;b.x+=nx*p;b.y+=ny*p/SQ;}}}}
  for(let i=0;i<LN;i++)cds[i]-=dt;zq=Math.min(zqMax,zq+(1+0.6*aEff(13))*dt);
  for(let i=echoQ.length-1;i>=0;i--){const q=echoQ[i];q.t-=dt;if(q.t<=0){echoQ.splice(i,1);curK=q.k;echoOn=true;try{q.k.cast();}catch(_){}echoOn=false;curK=null;}}
  if(!hero.dash&&stiff<=0){
    if(wind){wind.t+=dt;if(!hero.moving){const [ax,ay]=aimDir();hero.fa=Math.atan2(ay,ax);}if(wind.t>=wind.dur){const k=wind.k;cds[wind.i]=k.cd*wpCd;popPose='fore';yunOn=false;if(yun[wind.i]){const yc=YC[TIER[k.id]]||4;if(zq>=yc){zq-=yc;yunOn=true;}else floatTxt('真气不足','#8fd0ff');}setRM();curK=k;k.cast();curK=null;yunOn=false;setRM();if(skLv(k.id)>=10)echoQ.push({t:0.35,k});popT=0.35;recov={t:0,dur:RC[loadout[wind.i]]||0.2};wind=null;qt=0;qi=(qi+1)%LN;}}
    else if(recov){recov.t+=dt;if(recov.t>=recov.dur){recov=null;qt=-0.5;}}
    else if(!hasEnemy(560)){qt=0;}
    else{for(let n=0;n<LN&&!SK[loadout[qi]];n++)qi=(qi+1)%LN;qt+=dt;if(qt>=0.05){const k=SK[loadout[qi]];
      if(k&&cds[qi]<=0&&(!k.need||nearest(1,k.need).length)){wind={i:qi,k,t:0,dur:(WU[loadout[qi]]||0.3)*1.2};hold=0;}
      else if(k&&((cds[qi]>0&&cds[qi]<=0.8)||(cds[qi]<=0&&hold<1.2))){hold+=0.05;qt=0;}
      else{skipFl[qi]=0.2;qt=-0.05;qi=(qi+1)%LN;hold=0;}}}}
  for(let i=fxs.length-1;i>=0;i--){const f=fxs[i];f.t+=dt;if(f.upd)f.upd(dt,f.t);if(f.t>f.life)fxs.splice(i,1);}
  for(let i=slashes.length-1;i>=0;i--){const p=slashes[i];p.t+=dt;p.x+=p.dx*300*dt;p.y+=p.dy*300*dt/SQ;
    const rad=46*p.sc;
    for(let j=enemies.length-1;j>=0;j--){const e=enemies[j];if(p.hit.has(e))continue;const ddx=e.x-p.x,ddy=(e.y-p.y)*SQ;if(ddx*ddx+ddy*ddy<rad*rad){p.hit.add(e);{const dd=2*(ampT>0?1.4:1)*(p.mul||1);dmgSt.jian=(dmgSt.jian||0)+Math.round(Math.min(dd,Math.max(e.hp,0)+0.0001)*10);e.hp-=dd;}if(e.hp<=0)kill(j,p);else{e.x+=p.dx*9;e.y+=p.dy*9/SQ;}}}
    if(p.t>0.9*RP)slashes.splice(i,1);}
  for(let i=effects.length-1;i>=0;i--){effects[i].t+=dt;if(effects[i].t>0.18)effects.splice(i,1);}
  for(let i=ghosts.length-1;i>=0;i--){ghosts[i].a-=dt*3.2;if(ghosts[i].a<=0)ghosts.splice(i,1);}
  for(let i=corpses.length-1;i>=0;i--){const c=corpses[i];c.t+=dt;c.x+=c.vx*dt;c.y+=c.vy*dt;const kk=Math.exp(-14*dt);c.vx*=kk;c.vy*=kk;if(c.t>0.7)corpses.splice(i,1);}
  for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.t+=dt;const dx=hero.x-d.x,dy=(hero.y-d.y)*SQ,dd=Math.hypot(dx,dy)||1,pr=46*S*pickR;if(d.t>0.3&&dd<pr){const sp=260+(pr-dd)*6;d.x+=dx/dd*sp*dt;d.y+=dy/dd*sp*dt/SQ;}if(dd<14*S&&d.t>0.3){collect(d);drops.splice(i,1);}}
  comboT-=dt;if(comboT<=0)combo=0;
  // 补兵：低于目标数就在视野外补
  let cnt=0;for(const e of enemies)if(!TYPES[e.type].boss)cnt++;
  const tn=targetN();if(!bossPhase&&retreatT<=0){if(cnt<tn*0.5){for(let k=0;k<3&&cnt<tn;k++,cnt++)spawn(pickType());}else{batchT-=dt;if(batchT<=0&&cnt<tn){const k=Math.min(tn-cnt,8+Math.floor(Math.random()*8));for(let q=0;q<k;q++)spawn(pickType());batchT=1.6+Math.random()*1.4;}}}
  {const dd=Math.hypot(hero.x,hero.y),R0=bndR();const out=dd>R0;edgeO=out?1:0;edgeAng=Math.atan2(hero.y*SQ,hero.x);offT=out?offT+dt:Math.max(0,offT-dt*2.5);moraleMul=1-0.3*Math.min(1,Math.max(0,(offT-3)/5));
    if(moraleMul<1){edgeEl.style.display='block';edgeEl.textContent='阵脚已乱　士气低落　伤害 -'+Math.round((1-moraleMul)*100)+'%';if(!offMsg){offMsg=true;floatTxt('阵脚已乱','#ff9a6a');}}else{edgeEl.style.display='none';if(offT<=0)offMsg=false;}
    statusT-=dt;if(statusT<=0){statusT=0.15;renderStatus();}if(tipT>0){tipT-=dt;if(tipT<=0)tipEl.style.display='none';}if(hitsTaken!==_lh){_lh=hitsTaken;calmT=0;}else calmT+=dt;if(!tipSeen.crowd){if(nearest(8,45).length>=6)crowdT+=dt;else crowdT=0;if(crowdT>2.5&&calmT>3)showTip('crowd','被围住也不用慌：不会被所有人同时打，<b style="color:#ffd86a">只有抬手出招的敌人才伤你</b>。','刘备',7);}const gt=(genDone[wave]&&!bossPhase)?0.9:1;gs+=(gt-gs)*Math.min(1,dt*1.5);}
  if(!bossPhase&&started&&wave>=WAVES&&retreatT<=0)startBoss();
  if(!bossPhase&&retreatT<=0&&waveRow().boss&&waveT>=1&&!genDone[wave]){genDone[wave]=1;spawn(BW[wave]||'brute');floatTxt('首领出阵：'+(BW[wave]?TYPES[BW[wave]].bn:''),'#ff5a4a');}
  if(!bossPhase&&retreatT<=0&&waveRow().gen&&waveT>=WT()*0.65&&!genDone[wave]){genDone[wave]=1;spawn('brute');floatTxt('敌将出阵','#ff7a5a');}
  if(bossPhase){if(!won&&!enemies.some(e=>TYPES[e.type].boss))heroWin();}
  else if(retreatT>0){retreatT-=dt;if(retreatT<=0){enemies.length=0;if(wave>=WAVES)startBoss();else endWave();}}
  else if(waveT>=WT()){retreatT=RT;}
}

let kk=1;
function shadow(x,y,w,h){ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y-0.5,w,h,0,0,7);ctx.fill();}
function drawFoot(nm,x,y,fa,wk,sc,alpha){
  if(!isFinite(fa))fa=0;if(!isFinite(wk))wk=0;wk=Math.abs(wk);
  const C=META[nm],[dn,fl]=H8[sect(fa)],di=C.dirs.indexOf(dn),fi=Math.floor(wk)%6,F=C.frames[di][fi],im=IMG[nm+'_'+dn+fi];
  ctx.save();if(alpha!=null)ctx.globalAlpha=alpha;ctx.translate(x,y-F.up*sc);if(fl<0)ctx.scale(-1,1);
  ctx.drawImage(im,-F.ax*sc,-F.h*sc,F.w*sc,F.h*sc);ctx.restore();
}
const DIRS5=['E','SE','S','NE','N'];
const EA=META.eatlas,EAN={};EA.names.forEach((n,i)=>EAN[n]=i);const EK=30/216;
const flc=document.createElement('canvas');flc.width=flc.height=EA.cell;const fcx=flc.getContext('2d');
function drawEA(name,x,y,sc,flip,alpha,flash){const n=EAN[name],cw=EA.cell,sx=(n%EA.cols)*cw,sy=Math.floor(n/EA.cols)*cw;
  ctx.save();if(alpha!=null)ctx.globalAlpha=alpha;ctx.translate(x,y);if(flip<0)ctx.scale(-1,1);
  let src=IMG.enemy_atlas,a=sx,b=sy;
  if(flash){fcx.clearRect(0,0,cw,cw);fcx.globalCompositeOperation='source-over';fcx.drawImage(IMG.enemy_atlas,sx,sy,cw,cw,0,0,cw,cw);fcx.globalCompositeOperation='source-atop';fcx.fillStyle='rgba(255,255,255,.85)';fcx.fillRect(0,0,cw,cw);src=flc;a=0;b=0;}
  ctx.drawImage(src,a,b,cw,cw,-cw/2*EK*sc,-EA.base*EK*sc,cw*EK*sc,cw*EK*sc);ctx.restore();}
function drawArt(T,x,y,fa,wk,sc,alpha,flash,rot){if(!isFinite(fa))fa=0;if(!isFinite(wk))wk=0;wk=Math.abs(wk);
  const nm=T.art,C=META[nm],[dn,fl]=H8[sect(fa)],di=C.dirs.indexOf(dn),fi=Math.floor(wk)%T.nf,F=C.frames[di][fi],im=IMG[nm+'_'+dn+fi];
  ctx.save();if(alpha!=null)ctx.globalAlpha=alpha;if(flash&&'filter' in ctx)ctx.filter='brightness(2.6)';ctx.translate(x,y-F.up*sc);if(fl<0)ctx.scale(-1,1);if(rot)ctx.rotate(rot);
  ctx.drawImage(im,-F.ax*sc,-F.h*sc,F.w*sc,F.h*sc);ctx.restore();}
const HK=1,hjc=document.createElement('canvas');hjc.width=hjc.height=256;const hjx=hjc.getContext('2d');
const HJS={2:{M:META.hj2,k:'hj2_atlas',run:6,wind:[6,6],strike:[7,7],hit:8,die:[9,9,10]},3:{M:META.hj3,k:'hj3_atlas',run:6,wind:[6,6],strike:[7,7],hit:8,die:[9,9,10]},4:{M:META.hj4,k:'hj4_atlas',run:6,wind:[6,6],strike:[7,7],hit:8,die:[9,9,10]},5:{M:META.hj5,k:'hj5_atlas',run:6,wind:[6,6],strike:[7,7],hit:8,die:[9,9,10]},6:{M:META.hj6,k:'hj6_atlas',run:6,wind:[6,6],strike:[7,7],hit:8,die:[9,9,10]},7:{M:META.hj7,k:'hj7_atlas',run:6,wind:[6,6],strike:[7,7],hit:8,die:[9,9,10]},8:{M:META.hj8,k:'hj8_atlas',run:6,wind:[6,6],strike:[7,7],hit:8,die:[9,9,10]},9:{M:META.hj9,k:'hj9_atlas',run:6,wind:[6,6],strike:[7,7],hit:8,die:[9,9,10]}};
function drawHJ(H,col,row,x,y,sc,mir,alpha,flash,red){const cw=H.M.cell,im=IMG[H.k];ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';if(alpha!=null)ctx.globalAlpha=alpha;ctx.translate(x,y);if(mir)ctx.scale(-1,1);
  let src=im,a=col*cw,b=row*cw;
  if(flash||red){hjx.clearRect(0,0,cw,cw);hjx.globalCompositeOperation='source-over';hjx.drawImage(im,a,b,cw,cw,0,0,cw,cw);hjx.globalCompositeOperation='source-atop';hjx.fillStyle=flash?'rgba(255,255,255,.85)':'rgba(255,40,30,'+red+')';hjx.fillRect(0,0,cw,cw);src=hjc;a=0;b=0;}
  const hk=H.M.k||HK;ctx.drawImage(src,a,b,cw,cw,-cw/2*hk*sc,-H.M.base*hk*sc,cw*hk*sc,cw*hk*sc);ctx.restore();}
function drawEnemyHJ(e,T,ey,fd){const H=HJS[T.hj],[dn,fl]=H8[sect(e.fa)],di=DIRS5.indexOf(dn);let col,red=0;
  if(e.atk){const k=e.atk.t/e.atk.dur;col=H.wind[k<0.5?0:1];if(k>0.55)red=Math.min(.45,(k-.55)*1.2);}
  else if(e.strikeT>0)col=H.strike[e.strikeT>0.11?0:1];
  else if(e.hitT>0)col=H.hit;
  else col=Math.floor(Math.abs(e.wk))%H.run;
  drawHJ(H,col,di,e.x,ey,T.sc*S,fl<0,fd<1?fd:null,e.flashT>0,red);}
function drawEnemy(e,T,ey){if(!isFinite(e.fa))e.fa=0;if(!isFinite(e.wk))e.wk=0;const fd=retreatT>0?Math.max(.02,retreatT/RT):1;
  if(T.hj){drawEnemyHJ(e,T,ey,fd);return;}
  if(T.art){const blink=e.atk&&e.atk.t/e.atk.dur>0.7&&Math.floor(tm*20)%2;drawArt(T,e.x,ey,e.fa,e.atk?0:e.wk,T.sc*S,(blink||fd<1)?(blink?.55:1)*fd:null,e.flashT>0,0);return;}
  const [dn,fl]=H8[sect(e.fa)],di=DIRS5.indexOf(dn);let nm;
  if(e.atk)nm='raise_'+di;else if(e.strikeT>0)nm='strike_'+di;else if(e.hitT>0)nm='hit_'+di;else nm='walk_'+di+'_'+(Math.floor(Math.abs(e.wk))%6);
  const blink=e.atk&&e.atk.t/e.atk.dur>0.7&&Math.floor(tm*20)%2;
  drawEA(nm,e.x,ey,T.sc*S,fl,(blink||fd<1)?(blink?.55:1)*fd:null,e.flashT>0);}
const AT=META.atlas,AK=0.168,ATN={};AT.names.forEach((n,i)=>ATN[n]=i);
function drawHero(x,y,fa,wk,sc,alpha,pose){
  if(!isFinite(fa))fa=0;if(!isFinite(wk))wk=0;
  const [dn,fl]=H8[sect(fa)],di=DIRS5.indexOf(dn);
  const n=ATN[pose?pose+'_'+di:'walk_'+di+'_'+(Math.floor(Math.abs(wk))%6)],cw=AT.cell,cols=AT.cols;
  ctx.save();if(alpha!=null)ctx.globalAlpha=alpha;ctx.translate(x,y);if(fl<0)ctx.scale(-1,1);
  ctx.drawImage(IMG.hero_atlas,(n%cols)*cw,Math.floor(n/cols)*cw,cw,cw,-cw/2*AK*sc,-AT.base*AK*sc,cw*AK*sc,cw*AK*sc);ctx.restore();
}
let popPose='fore';

function drawProp(p){
  const M=META.props[p.k],im=IMG['p_'+p.k],s=p.s*PK;
  ctx.save();ctx.translate(p.x,p.y);if(p.fl<0)ctx.scale(-1,1);ctx.drawImage(im,-M.ax*s,-M.ay*s,M.w*s,M.h*s);ctx.restore();
}
function drawCrescent(p){
  const R=46*p.sc,sx=p.x,sy=p.y*SQ-22*p.sc,ang=Math.atan2(p.dy,p.dx);
  const al=Math.max(0,Math.min(1,(0.9-p.t)/0.25));
  ctx.save();ctx.translate(sx,sy);ctx.rotate(ang);
  for(let i=3;i>=0;i--){ctx.save();ctx.translate(-i*10*p.sc,0);ctx.globalAlpha=al*(i===0?1:0.22/i);
    ctx.shadowColor='rgba(150,220,255,.95)';ctx.shadowBlur=i===0?10:0;
    ctx.save();ctx.beginPath();ctx.arc(0,0,R,0,7);ctx.clip();
    const g=ctx.createLinearGradient(-R*0.5,0,R,0);g.addColorStop(0,'rgba(120,200,255,0)');g.addColorStop(0.6,'rgba(200,238,255,.85)');g.addColorStop(1,'rgba(255,255,255,1)');
    ctx.beginPath();ctx.rect(-2*R,-2*R,4*R,4*R);ctx.arc(-R*0.42,0,R*0.94,0,7);ctx.fillStyle=g;ctx.fill('evenodd');ctx.restore();ctx.restore();}
  ctx.restore();
}
function draw(){
  const W=cv.width,H=cv.height;kk=H/VH;const vw=W/kk,vwy=VH/SQ;
  const cx=hero.x,cy=hero.y,x0=cx-vw/2,y0=cy-vwy/2;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#8a7444';ctx.fillRect(0,0,W,H);
  // 地面：纵向压扁（同骑兵幸存者的 2.5D）
  ctx.setTransform(kk,0,0,kk*SQ,-x0*kk,-y0*kk*SQ);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  let budget=8;
  for(let ci=Math.floor(x0/CHUNK);ci<=Math.floor((x0+vw)/CHUNK);ci++)for(let cj=Math.floor(y0/CHUNK);cj<=Math.floor((y0+vwy)/CHUNK);cj++){
    const k=ci+','+cj;let ch=chunks.get(k);
    if(!ch&&budget>0){budget--;try{ch=buildChunk(ci,cj);}catch(e){ch=document.createElement('canvas');ch.width=ch.height=8;const q=ch.getContext('2d');q.fillStyle='#8a7444';q.fillRect(0,0,8,8);errBox.style.display='block';errBox.textContent='地块出错：'+e;}chunks.set(k,ch);if(chunks.size>90)chunks.delete(chunks.keys().next().value);}
    if(ch)ctx.drawImage(ch,ci*CHUNK,cj*CHUNK,CHUNK+0.5,CHUNK+0.5);
  }
  // 精灵：不压扁，位置按 y*SQ 投影
  ctx.setTransform(kk,0,0,kk,-x0*kk,-y0*SQ*kk);
  for(const g of ghosts)drawHero(g.x,g.y*SQ,g.fa,g.f,S,g.a);
  zoneDraw();
  if(trail.length||shi){ctx.save();for(const q of trail){ctx.globalAlpha=Math.min(.5,q.t/2*.5);ctx.fillStyle='#bfe9c0';ctx.beginPath();ctx.ellipse(q.x,q.y*SQ,24*S,9*S,0,0,7);ctx.fill();}ctx.globalAlpha=.9;ctx.fillStyle='#e8f6ff';for(let j=0;j<shi;j++){ctx.beginPath();ctx.arc(hero.x+(j-(shi-1)/2)*9*S,hero.y*SQ+6*S,3*S,0,7);ctx.fill();}ctx.restore();}
  for(const e of enemies){const sk=e.sk;if(sk&&sk.k==='charge'&&sk.ph===0){ctx.save();ctx.strokeStyle='rgba(240,70,50,'+(0.25+0.5*sk.t/0.55)+')';ctx.lineWidth=(3+4*sk.t/0.55)*S;ctx.setLineDash([8*S,6*S]);ctx.beginPath();ctx.moveTo(e.x,e.y*SQ);ctx.lineTo(e.x+sk.dx*(sk.big?320:200)*S,e.y*SQ+sk.dy*(sk.big?320:200)*S);ctx.stroke();ctx.restore();}const a=e.atk;if(!a)continue;const Tt=TYPES[e.type];const k=a.t/a.dur,sy=a.y*SQ;
    if(Tt.ranged){ctx.save();ctx.strokeStyle='rgba(240,70,50,'+(0.25+0.5*k)+')';ctx.lineWidth=(2+3*k)*S;ctx.setLineDash([8*S,6*S]);ctx.beginPath();ctx.moveTo(e.x,e.y*SQ);ctx.lineTo(e.x+a.dx*340*S,e.y*SQ+a.dy*340*S);ctx.stroke();ctx.restore();continue;}
    if(!Tt.ring)continue;ctx.save();ctx.fillStyle='rgba(225,45,35,'+(0.10+0.12*k)+')';ctx.strokeStyle='rgba(240,70,50,.9)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(a.x,sy,a.r,a.r*0.75,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(235,60,45,'+(0.25+0.2*k)+')';ctx.beginPath();ctx.ellipse(a.x,sy,a.r*k,a.r*k*0.75,0,0,7);ctx.fill();ctx.restore();}
  {const R0=bndR(),dd=Math.hypot(hero.x,hero.y),near=Math.max(0,Math.min(1,1-(R0-dd)/400));ctx.save();ctx.strokeStyle='rgba(255,'+Math.round(210-130*Math.min(1,offT/3))+',90,'+(0.35+0.5*Math.max(near,edgeO)).toFixed(2)+')';ctx.lineWidth=3.5*S;ctx.setLineDash([22*S,16*S]);ctx.lineDashOffset=-tm*14;ctx.beginPath();ctx.ellipse(0,0,R0,R0*SQ,0,0,6.2832);ctx.stroke();ctx.restore();}
  const list=[];
  for(let i=Math.floor((x0-120)/PCS);i<=Math.floor((x0+vw+120)/PCS);i++)for(let j=Math.floor((y0-120)/PCS);j<=Math.floor((y0+vwy+160)/PCS);j++)for(const p of cellProps(i,j))list.push({y:p.y,p});
  for(let i=Math.floor((x0-60)/110);i<=Math.floor((x0+vw+60)/110);i++)for(let j=Math.floor((y0-60)/110);j<=Math.floor((y0+vwy+80)/110);j++)for(const p of tuftCell(i,j))list.push({y:p.y,p});
  const _a=aimDir();let aimed=true,aimedX=_a[0],aimedY=_a[1];
  list.push({y:hero.y,hero:true});for(const e of enemies)list.push({y:e.y,e});
  list.sort((a,b)=>a.y-b.y);
  for(const it of list){
    if(it.p){const p=it.p;drawProp({k:p.k,x:p.x,y:p.y*SQ,s:p.s,fl:p.fl});}
    else if(it.hero){const hy=hero.y*SQ;shadow(hero.x,hy,16*S,5*S);ctx.save();let pose=null,pfa=hero.fa;
      if(!hero.dash&&(wind||popT>0)){pose=wind?'raise':popPose;if(wind||aimed)pfa=Math.atan2(aimedY,aimedX);}
      drawHero(hero.x,hy,pfa,hero.wk,S,hero.dash?0.6:(hurtT>0&&Math.floor(tm*24)%2?0.35:null),pose);ctx.restore();
}
    else{const e=it.e,T=TYPES[e.type];if(e.x<x0-60||e.x>x0+vw+60||e.y<y0-60||e.y>y0+vwy+80)continue;if(e.hide)continue;const ey=e.y*SQ;shadow(e.x,ey,T.r*0.9*S,T.r*0.4*S);if(T.lamp){ctx.save();ctx.font=Math.round(34*S)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.shadowColor='#ffb030';ctx.shadowBlur=14*S;ctx.fillText('🏮',e.x,ey);ctx.restore();}else drawEnemy(e,T,ey);if(e.inv&&T.boss){ctx.save();ctx.strokeStyle='rgba(255,215,100,.8)';ctx.lineWidth=3*S;ctx.setLineDash([10*S,6*S]);ctx.beginPath();ctx.ellipse(e.x,ey-22*S,(T.r+16)*S,(T.r+12)*S,0,0,7);ctx.stroke();ctx.restore();}
      if(T.mk){ctx.fillStyle=T.mk;ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.beginPath();ctx.arc(e.x,ey-38*T.sc*S,3.2*S,0,7);ctx.fill();ctx.stroke();}}
  }
  for(const c of corpses){const T=c.T,sc=T.sc*S,fly=c.t<0.22,al=c.t<0.45?1:Math.max(0,1-(c.t-0.45)/0.25);
    if(T.hj){const H=HJS[T.hj];drawHJ(H,H.die[c.t<0.1?0:c.t<0.26?1:2],0,c.x,c.y*SQ,sc,c.flip<0,al);continue;}
    if(T.art){drawArt(T,c.x,c.y*SQ,c.flip>0?0:Math.PI,0,sc,al,false,Math.min(1,c.t/0.3)*1.4*(c.flip>0?1:-1));continue;}
    ctx.save();ctx.translate(0,0);if(fly){drawEA('fly',c.x,c.y*SQ-Math.sin(c.t/0.3*Math.PI)*18-(1-c.t/0.3)*2,sc,c.flip,al);}else drawEA('dead',c.x,c.y*SQ,sc,c.flip,al);ctx.restore();}
  for(const d of drops){const bob=Math.sin(tm*5+d.ph)*2*S,gx=d.x,gy=d.y*SQ;ctx.save();const col=(d.k==='scroll'||d.k==='gf'||d.k==='wp'||d.k==='xd')?'rgba(120,220,255,.55)':d.k==='item'?'rgba(150,240,160,.5)':'rgba(255,220,100,.5)';ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(gx,gy+3*S,9*S,4*S,0,0,7);ctx.fill();ctx.font=Math.round((d.k==='silver'&&d.v<10?15:19)*S)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';if(d.k==='wp'){const im=IMG[WP[d.id].ic],z=30*S;ctx.drawImage(im,gx-z/2,gy-6*S-bob-z/2,z,z);}else ctx.fillText(d.k==='scroll'?'📜':d.k==='gf'?'📖':d.k==='wp'?WP[d.id].g:d.k==='xd'?'📜':d.k==='item'?d.it.g:(d.v>=10?'💰':'🪙'),gx,gy-6*S-bob);ctx.restore();}
  for(const p of slashes)drawCrescent(p);
  for(const f of fxs)f.drw&&f.drw(f.t);
  for(const p of arrows){ctx.save();ctx.strokeStyle='#f6e6b0';ctx.lineWidth=2*S;ctx.beginPath();ctx.moveTo(p.x,p.y*SQ-18*S);ctx.lineTo(p.x+p.dx*14*S,p.y*SQ-18*S+p.dy*14*S);ctx.stroke();ctx.restore();}
  if(retreatT>0){ctx.save();ctx.setTransform(1,0,0,1,0,0);const cw=cv.width,ch=cv.height,al=Math.min(1,retreatT/0.4,(RT-retreatT)/0.2);ctx.globalAlpha=al;ctx.font='bold '+(ch*0.12)+'px sans-serif';ctx.textAlign='center';ctx.lineWidth=ch*0.012;ctx.strokeStyle='#000';ctx.fillStyle='#ffd86a';ctx.strokeText('鸣金收兵',cw/2,ch*0.38);ctx.fillText('鸣金收兵',cw/2,ch*0.38);ctx.restore();}
  for(const n of dnums){const k=n.t/0.7;ctx.save();ctx.globalAlpha=Math.min(1,(1-k)*1.6);ctx.font='bold '+((n.crit?19:13)*S)+'px sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.fillStyle=n.crit?'#ffb030':'#fff';const ty=n.y*SQ-34*S-k*26*S-(n.crit?Math.sin(Math.min(1,k*3)*Math.PI)*8:0);ctx.strokeText(n.v,n.x,ty);ctx.fillText(n.v,n.x,ty);ctx.restore();}
  for(const t of texts){ctx.save();ctx.globalAlpha=Math.max(0,1-t.t);ctx.font='bold '+(16*S)+'px sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.fillStyle=t.c;const ty=t.y*SQ-60*S-t.t*28;ctx.strokeText(t.s,t.x,ty);ctx.fillText(t.s,t.x,ty);ctx.restore();}
  {const bi=$('bars').querySelector('i'),bb=$('bars').querySelector('b');bi.style.width=(hero.hp/hero.maxhp*100)+'%';bb.textContent=Math.ceil(hero.hp)+' / '+hero.maxhp;}
  {const bo=enemies.find(x=>TYPES[x.type].boss);if(bo){const Tb=TYPES[bo.type];bbar.style.display='block';bbar.firstChild.textContent=(Tb.bn||'敌将')+(bo.inv&&!bo.hide?'（法台护体）':'');bbar.lastChild.firstChild.style.width=Math.max(0,bo.hp/Tb.hp*100)+'%';}else bbar.style.display='none';sandEl.style.opacity=sandT>0?0.55:0;}
  {const zb=$('zqbar');if(zb){zb.firstChild.style.width=(zq/zqMax*100)+'%';zb.lastChild.textContent='真气 '+Math.floor(zq)+' / '+zqMax;zb.classList.toggle('low',zq<zqMax*0.2&&yun.some(x=>x));}}
  if(wind&&!hero.dash){const k=wind.t/wind.dur,hx=hero.x,hy=hero.y*SQ-52*S;ctx.save();ctx.lineWidth=3*S;ctx.strokeStyle='rgba(255,230,140,.95)';ctx.shadowColor='#fc6';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(hx,hy,13*S,-1.57,-1.57+6.283*k);ctx.stroke();ctx.shadowBlur=0;ctx.font=(15*S)+'px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.globalAlpha=0.6+0.4*k;ctx.fillText(wind.k.g,hx,hy);ctx.restore();}
  for(const f of effects){const a=1-f.t/0.18;const ang=Math.atan2(f.dy,f.dx);ctx.strokeStyle='rgba(235,248,255,'+a+')';ctx.lineWidth=3.2*S;ctx.lineCap='round';ctx.beginPath();ctx.arc(f.x,f.y*SQ-22*S,24*S,ang-1.0,ang+1.0);ctx.stroke();}
  $('info').textContent='窗口 '+stage.clientWidth+'×'+stage.clientHeight+'\n视野 '+Math.round(vw)+'×'+Math.round(vwy)+'（世界单位）\n步兵占屏高 1/'+(VH/(32*S)).toFixed(1)+'；步行主角 1/'+(VH/(48*S)).toFixed(1)+'\n压扁 '+SQ.toFixed(2)+'  敌人 '+enemies.length+'  地块 '+chunks.size;
  $('vS').textContent=S.toFixed(2);$('vQ').textContent=SQ.toFixed(2);dashBtn.style.setProperty('--p',((1-dashCd/DCD)*360)+'deg');dashBtn.classList.toggle('rdy',dashCd<=0);
  $('koN').textContent=kills;$('cbN').textContent=combo;
  const wl=Math.max(0,WT()-waveT);
  $('timer').textContent=bossPhase?'首领：张角':'第'+wave+'/'+WAVES+'波 '+String(Math.ceil(wl)).padStart(2,'0')+'s';
  [...skills.children].forEach(d=>{const i=+d.dataset.i,k=SK[loadout[i]];d.classList.toggle('on',i===qi);d.style.opacity=skipFl[i]>0?0.3:(k&&cds[i]>0?0.6:'');});
}
let last=performance.now();
const errBox=document.createElement('div');errBox.style.cssText='position:fixed;left:8px;bottom:8px;right:8px;z-index:60;background:rgba(120,0,0,.9);color:#fff;font:12px monospace;padding:6px;display:none;white-space:pre-wrap';document.body.appendChild(errBox);
function loop(now){requestAnimationFrame(loop);const dt=Math.max(0,Math.min(0.05,(now-last)/1000));last=now;try{update(dt);draw();}catch(e){errBox.style.display='block';errBox.textContent='出错：'+(e&&e.stack||e);}}
requestAnimationFrame(loop);
window.addEventListener('error',e=>{errBox.style.display='block';errBox.textContent='页面错误：'+e.message;});
window.__gb={zq:()=>[zq,zqMax],yun,aEff,addAttr,recalcAttr,skExp:()=>skExp,gfExp:()=>gfExp,useXd,OA,profOf,xj:()=>xj,hurtHero:null,gainSkill,gainGf,gainWp,gear:()=>({gongfa,weapon,gearAll,gearCat,critP,wpCd,allMul}),GF,WP,drops,bag,loot,ezones,ESK,SK,loadout,hero,enemies,setPhone:()=>$('vPhone').click(),setS:v=>{S=v;$('sS').value=v;},setN:v=>{setN(v);$('sN').value=v;},endWave,showTip,die:()=>heroDie(),skip:t=>{tclock=t;},setW:t=>{waveT=t;},setWave:n=>{wave=n;}};
})();
