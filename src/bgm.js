// ===== 战场配乐：移植自《无名之辈》第二章《旌旗北望》（羽调五声 A C D E G，112 BPM，32 小节循环）=====
// 鼓为真实大鼓采样（__DRUM__ 由 build.py 内嵌 base64），其余乐器 Web Audio 合成。无喊杀声。
// makeBGM(ctx,dest,noiseBuf) → {start,stop,resume,setLevel,boss,gong,duck,ready,offline,gongAt}
function makeBGM(ac,dest,NBUF){
  const XFADE=1.2,LOOK=.35,A2=45,PENT=[0,3,5,7,10];
  const m2f=m=>440*Math.pow(2,(m-69)/12);
  const dn=d=>A2+12*Math.floor(d/5)+PENT[d%5];
  const DRUM={1:['kick',.3],2:['kick',.5],3:['kick',.78],4:['snare',.34],5:['tom',.5]};
  const WAR_PH={
    a:[[0,5,.32],[4,7,.28],[8,8,.34],[12,7,.26]],b:[[0,5,.32],[6,4,.27],[10,3,.3],[14,5,.28]],
    c:[[0,8,.34],[4,10,.3],[8,9,.34],[12,7,.28]],d:[[0,6,.3],[6,7,.27],[10,5,.34]],
    e:[[0,10,.34],[3,9,.28],[6,8,.3],[10,7,.3],[14,8,.28]],f:[[0,7,.3],[4,6,.28],[8,4,.3],[12,5,.34]],
    g:[[0,8,.34],[2,9,.27],[4,10,.32],[8,12,.3],[12,10,.32]],h:[[0,7,.32],[4,5,.32],[10,4,.25],[14,5,.28]]};
  const warMelody='abcdabefabcdagfh'+'abcdcgefagcdagfh';
  const warDrums={a:'3...............',b:'3.......2.......',c:'3.......2...5...',d:'3.....5.2.......',
    e:'3...5...3..52...',f:'3..52...3...5.5.',g:'3...3...2..52.5.',h:'3...5...3..55532'};
  const TR={
    field:{bpm:112,bars:32,sync:1,war:1,lv:{drum:.72,pluck:.19,tone:.18},drone:{midi:33,level:.035},drums:warDrums,
      drumArr:'ababacbdababacbd'+'acbcacbdabacacbd',ph:WAR_PH,melArr:warMelody,tones:{0:[3,3],8:[5,3],16:[3,3],24:[7,3]}},
    battle:{bpm:112,bars:32,sync:1,war:2,lv:{drum:.9,pluck:.23,tone:.18},drone:{midi:33,level:.045},drums:warDrums,
      drumArr:'efefegfhefefgffh'+'egfgegfhefefggfh',ph:WAR_PH,melArr:warMelody,tones:{0:[3,3],8:[5,3],16:[3,3],24:[7,3]}},
    boss:{bpm:124,bars:32,war:3,lv:{drum:.94,pluck:.23,tone:.2},drone:{midi:33,level:.055},drums:warDrums,
      drumArr:'egfhegfheffhggfh'+'egfhegfhegfheghh',ph:WAR_PH,melArr:warMelody,tones:{0:[3,3],8:[2,3],16:[3,3],24:[5,3]}}};
  for(const k in TR){const T=TR[k];T.melMap=new Map();for(let bar=0;bar<T.bars;bar++)for(const [st,d,vel,dur] of T.ph[T.melArr[bar]]||[])T.melMap.set(bar*16+st,[d,vel,dur]);}
  const out=ac.createGain();out.gain.value=.8;out.connect(dest);
  let duckV=1;const master=ac.createGain();master.gain.value=1;master.connect(out);
  const osc=(type,f,t)=>{const o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);return o;};
  const noiseSrc=()=>{const s=ac.createBufferSource();s.buffer=NBUF;s.loop=true;return s;};
  let drumBuf=null;
  const ready=(()=>{try{const u='__DRUM__';const bytes=Uint8Array.from(atob(u),c=>c.charCodeAt(0)).buffer;return ac.decodeAudioData(bytes).then(b=>{drumBuf=b;}).catch(()=>{});}catch(e){return Promise.resolve();}})();
  function warDrum(t,kind,vel,dest){if(!drumBuf)return;const edge=kind==='tom'||kind==='snare';
    const s=ac.createBufferSource();s.buffer=drumBuf;s.playbackRate.value=(edge?1.16:1)*(1+(Math.random()-.5)*.025);
    const f=ac.createBiquadFilter();f.type=edge?'highpass':'lowpass';f.frequency.value=edge?140:2200;
    const g=ac.createGain();g.gain.value=vel*(edge?.58:1.15);s.connect(f).connect(g).connect(dest);s.start(t);s.stop(t+drumBuf.duration+.05);}
  function pluck(t,midi,vel,dest,dur){dur=dur||.7;if(!(vel>0))return;const f=m2f(midi);
    const g=ac.createGain();g.connect(dest);const lp=ac.createBiquadFilter();lp.type='lowpass';lp.Q.value=.7;
    lp.frequency.setValueAtTime(Math.min(9000,f*9),t);lp.frequency.exponentialRampToValueAtTime(Math.max(260,f*1.6),t+.3);lp.connect(g);
    for(const [mul,amp,type] of [[1,1,'triangle'],[2,.4,'sine'],[3,.18,'sine'],[4.02,.1,'sine']]){const o=osc(type,f*mul,t);o.detune.value=(Math.random()-.5)*7;const og=ac.createGain();og.gain.value=amp;o.connect(og).connect(lp);o.start(t);o.stop(t+dur+.1);}
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vel,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    const s=noiseSrc(),hp=ac.createBiquadFilter(),ng=ac.createGain();hp.type='highpass';hp.frequency.value=2400;s.connect(hp).connect(ng).connect(dest);
    ng.gain.setValueAtTime(vel*.18,t);ng.gain.exponentialRampToValueAtTime(.0001,t+.045);s.start(t,Math.random());s.stop(t+.07);}
  function longTone(t,midi,dur,vel,dest){if(!(vel>0))return;const f=m2f(midi);
    const g=ac.createGain();g.connect(dest);const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.min(3000,f*5);lp.Q.value=.6;lp.connect(g);
    const vib=ac.createOscillator();vib.frequency.value=4.8;const vg=ac.createGain();vg.gain.value=f*.008;vib.connect(vg);
    for(const [mul,amp,type] of [[1,.8,'triangle'],[2,.22,'sine'],[3,.1,'sine']]){const o=osc(type,f*mul,t);vg.connect(o.frequency);const og=ac.createGain();og.gain.value=amp;o.connect(og).connect(lp);o.start(t);o.stop(t+dur+.9);}
    vib.start(t);vib.stop(t+dur+.9);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vel,t+Math.min(.45,dur*.4));g.gain.setValueAtTime(vel,t+dur);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.8);
    const s=noiseSrc(),bp=ac.createBiquadFilter(),ng=ac.createGain();bp.type='bandpass';bp.frequency.value=f*3;bp.Q.value=1.4;s.connect(bp).connect(ng).connect(dest);
    ng.gain.setValueAtTime(.0001,t);ng.gain.linearRampToValueAtTime(vel*.12,t+.4);ng.gain.setValueAtTime(vel*.12,t+dur);ng.gain.exponentialRampToValueAtTime(.0001,t+dur+.6);s.start(t,Math.random());s.stop(t+dur+.7);}
  function warVoice(t,midi,dur,vel,dest,horn){const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=horn?1550:720;f.Q.value=.5;
    const g=ac.createGain();f.connect(g).connect(dest);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vel,t+(horn?.065:.025));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    for(const d of [-5,5]){const o=osc('triangle',m2f(midi),t);o.detune.value=d;o.connect(f);o.start(t);o.stop(t+dur+.05);}}
  // 铜锣（鸣金）
  function gong(t,vol){[1,1.47,2.09,2.56,3.4].forEach((m,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=150*m;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime((vol||.22)/(1+i*.7),t+.01);g.gain.exponentialRampToValueAtTime(.0005,t+2.6-i*.3);o.connect(g);g.connect(master);o.start(t);o.stop(t+2.8);});}
  function playStep(L,bar,st,t){const T=L.track,dp=T.drums[T.drumArr[bar]];
    if(dp){const c=dp[st];if(c&&c!=='.'){const d=DRUM[c];if(d)warDrum(t,d[0],d[1]*T.lv.drum,L.gain);}}
    const ev=T.melMap.get(bar*16+st);
    if(ev&&(bar%2===0||(T.war>1&&st===0)))pluck(t,dn(ev[0]),(ev[1]||.34)*T.lv.pluck,L.gain,ev[2]||1);
    if(st===0&&T.tones&&T.tones[bar]){const [d,b]=T.tones[bar];longTone(t,dn(d),b*60/T.bpm,T.lv.tone,L.gain);}
    const root=[0,0,3,2][Math.floor(bar/4)%4];
    if(st===0||(T.war>1&&st===8))warVoice(t,dn(root),.33,T.war>1?.075:.035,L.gain);
    if(T.war>1&&bar%8===0&&(st===0||st===10))warVoice(t,dn(st===0?5:7),.42,.045,L.gain,true);}
  let layers=[],cur='',on=false,timer=null,bossOn=false,paused=false;
  function newLayer(name,prev){const T=TR[name],g=ac.createGain();g.gain.value=.0001;g.connect(master);
    const L={name,track:T,gain:g,step:0,time:ac.currentTime+.12,spb:60/T.bpm/4,nodes:[]};
    if(prev&&T.sync&&prev.track.sync){L.step=prev.step;L.time=prev.time;}
    if(T.drone){const o=ac.createOscillator();o.type='triangle';o.frequency.value=m2f(T.drone.midi);const dg=ac.createGain();dg.gain.value=T.drone.level;o.connect(dg).connect(g);o.start();L.nodes.push(o);}
    layers.push(L);return L;}
  function fadeTo(L,v,dur){const t=ac.currentTime;L.gain.gain.cancelScheduledValues(t);L.gain.gain.setValueAtTime(Math.max(.0001,L.gain.gain.value),t);L.gain.gain.linearRampToValueAtTime(v,t+dur);}
  function stopLayer(L){if(L.stopping)return;L.stopping=true;fadeTo(L,.0001,XFADE);setTimeout(()=>{for(const n of L.nodes){try{n.stop();}catch(e){}}try{L.gain.disconnect();}catch(e){}layers=layers.filter(x=>x!==L);},(XFADE+.3)*1000);}
  function want(){return bossOn?'boss':paused?'field':'battle';}
  function apply(){if(!on)return;const w=want();if(w===cur)return;const prev=layers.find(l=>!l.stopping);cur=w;const L=newLayer(w,prev);fadeTo(L,1,XFADE);for(const l of layers)if(l!==L)stopLayer(l);}
  function pump(){if(!on||ac.state!=='running')return;apply();const ahead=ac.currentTime+LOOK;
    for(const L of layers.slice()){if(L.time<ac.currentTime-.2)L.time=ac.currentTime+.05;const total=L.track.bars*16;
      while(L.time<ahead){const s=L.step%total;playStep(L,Math.floor(s/16),s%16,L.time);L.step++;L.time+=L.spb;}}}
  return{ready,
    start(){if(on)return;on=true;timer=setInterval(pump,90);pump();},
    resume(){this.start();},
    stop(){if(!on)return;on=false;clearInterval(timer);for(const l of layers)stopLayer(l);cur='';},
    setLevel(){},boss(b){bossOn=!!b;},
    gong(){gong(ac.currentTime+.02,.26);},
    duck(v){paused=v<.9;master.gain.setTargetAtTime(v,ac.currentTime,.25);},
    // 离线渲染：直接排程 secs 秒
    offline(secs,name){const L=newLayer(name||'battle');L.gain.gain.value=1;L.time=0;L.step=0;const total=L.track.bars*16;while(L.time<secs){const s=L.step%total;playStep(L,Math.floor(s/16),s%16,L.time);L.step++;L.time+=L.spb;}},
    gongAt(t){gong(t,.26);}};
}
