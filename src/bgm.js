// ===== 战场配乐（全程序合成，原创旋律；风格取意：战鼓+胡笳/二胡+古筝+杀声）=====
// makeBGM(ctx, dest, noiseBuf) → {start,stop,setLevel,boss,gong,duck,tickOffline}
function makeBGM(A,dest,NBUF){
  const BPM=112,S16=60/BPM/4;           // 16分音符时长
  const master=A.createGain();master.gain.value=.9;master.connect(dest);
  const comp=A.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;comp.connect(master);
  const bus=A.createGain();bus.gain.value=1;bus.connect(comp);
  // 简单混响（噪声衰减卷积），营造旷野回响
  const rv=A.createConvolver();{const n=A.sampleRate*1.0,b=A.createBuffer(2,n,A.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6);}rv.buffer=b;}
  const rvg=A.createGain();rvg.gain.value=.07;rv.connect(rvg);rvg.connect(comp);
  const send=A.createGain();send.gain.value=1;send.connect(rv);
  const hz=n=>440*Math.pow(2,(n-69)/12);
  // 调式：D 宫调五声 D E F# A B（大调，昂扬）
  const PEN=[0,2,4,7,9];
  const deg=(d,oct)=>50+oct*12+PEN[((d%5)+5)%5]+12*Math.floor(d/5);   // d=0 → A3(57)
  function env(g,t,a,d,pk,end){g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(pk,t+a);g.gain.exponentialRampToValueAtTime(Math.max(0.0001,end||0.0001),t+a+d);}
  function noise(t,dur,type,f,q,vol,wet){const s=A.createBufferSource();s.buffer=NBUF;s.loop=true;const fl=A.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=A.createGain();env(g,t,.004,dur,vol);s.connect(fl);fl.connect(g);g.connect(bus);if(wet){const w=A.createGain();w.gain.value=wet;g.connect(w);w.connect(send);}s.start(t,Math.random()*.3);s.stop(t+dur+.05);}
  // 战鼓：低频正弦下扫 + 皮面噪声
  function taiko(t,vol,pitch){const o=A.createOscillator(),g=A.createGain();o.type='sine';const f=pitch||78;o.frequency.setValueAtTime(f*1.9,t);o.frequency.exponentialRampToValueAtTime(f*.55,t+.22);env(g,t,.003,.5,vol,.0005);o.connect(g);g.connect(bus);const w=A.createGain();w.gain.value=.5;g.connect(w);w.connect(send);o.start(t);o.stop(t+.6);noise(t,.07,'bandpass',900,.8,vol*.35,0);}
  function bangzi(t,vol){noise(t,.05,'bandpass',2600,3,vol,0);const o=A.createOscillator(),g=A.createGain();o.type='square';o.frequency.value=1250;env(g,t,.001,.03,vol*.18);o.connect(g);g.connect(bus);o.start(t);o.stop(t+.06);}
  // 铜锣（鸣金）
  function gong(t,vol){[1,1.47,2.09,2.56,3.4].forEach((m,i)=>{const o=A.createOscillator(),g=A.createGain();o.type='sine';o.frequency.value=150*m*(1+Math.random()*.004);env(g,t,.01,2.6-i*.3,(vol||.22)/(1+i*.7),.0005);o.connect(g);g.connect(bus);g.connect(send);o.start(t);o.stop(t+2.8);});noise(t,.5,'bandpass',1800,1.2,(vol||.22)*.5,.4);}
  // 二胡/胡笳：锯齿+颤音+低通，带滑音入音
  function erhu(t,note,dur,vol){const o=A.createOscillator(),o2=A.createOscillator(),g=A.createGain(),lp=A.createBiquadFilter(),lfo=A.createOscillator(),lg=A.createGain();
    o.type='sawtooth';o2.type='sawtooth';const f=hz(note);o.frequency.setValueAtTime(f*.94,t);o.frequency.exponentialRampToValueAtTime(f,t+.07);o2.frequency.setValueAtTime(f*.94*1.004,t);o2.frequency.exponentialRampToValueAtTime(f*1.004,t+.07);
    lfo.frequency.value=5.4;lg.gain.value=f*.011;lfo.connect(lg);lg.connect(o.frequency);lg.connect(o2.frequency);
    lp.type='lowpass';lp.frequency.value=2300;lp.Q.value=2.2;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.06);g.gain.setValueAtTime(vol*.9,t+dur*.7);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(lp);o2.connect(lp);lp.connect(g);g.connect(bus);g.connect(send);lfo.start(t);o.start(t);o2.start(t);lfo.stop(t+dur+.05);o.stop(t+dur+.05);o2.stop(t+dur+.05);}
  // 古筝：拨弦（三角波+快衰减+二次泛音）
  function zheng(t,note,vol){const f=hz(note);[[1,1],[2,.35],[3,.12]].forEach(([m,a])=>{const o=A.createOscillator(),g=A.createGain();o.type='triangle';o.frequency.value=f*m;env(g,t,.003,1.1/m,vol*a,.0005);o.connect(g);g.connect(bus);g.connect(send);o.start(t);o.stop(t+1.3);});}
  // 低音：空弦五度 + 低通脉冲
  function bass(t,note,dur,vol){const o=A.createOscillator(),g=A.createGain(),lp=A.createBiquadFilter();o.type='sawtooth';o.frequency.value=hz(note);lp.type='lowpass';lp.frequency.value=380;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(lp);lp.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+.05);}
  function brass(t,note,dur,vol){[0,.006].forEach(dt=>{const o=A.createOscillator(),g=A.createGain(),lp=A.createBiquadFilter();o.type='sawtooth';o.frequency.value=hz(note)*(1+dt);lp.type='lowpass';lp.Q.value=1.5;lp.frequency.setValueAtTime(500,t);lp.frequency.exponentialRampToValueAtTime(2600,t+.12);lp.frequency.exponentialRampToValueAtTime(900,t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.07);g.gain.setValueAtTime(vol*.85,t+dur*.8);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(lp);lp.connect(g);g.connect(bus);g.connect(send);o.start(t);o.stop(t+dur+.05);});}
  // 杀喊声：短促齐喊“杀！”，多人、音高不下滑
  function shout(t,vol,n,pitch){n=n||10;for(let i=0;i<n;i++){const tt=t+Math.random()*.05,f0=(pitch||180)*(.85+Math.random()*.4),dur=.2+Math.random()*.07;
      const o=A.createOscillator(),g=A.createGain();o.type='sawtooth';o.frequency.setValueAtTime(f0,tt);o.frequency.linearRampToValueAtTime(f0*1.06,tt+dur);
      const f1=A.createBiquadFilter(),f2=A.createBiquadFilter();f1.type='bandpass';f2.type='bandpass';f1.Q.value=4;f2.Q.value=5;f1.frequency.value=800;f2.frequency.value=1250;
      g.gain.setValueAtTime(.0001,tt);g.gain.exponentialRampToValueAtTime(vol/n*1.6,tt+.015);g.gain.exponentialRampToValueAtTime(.0001,tt+dur);
      o.connect(f1);o.connect(f2);f1.connect(g);f2.connect(g);g.connect(bus);g.connect(send);o.start(tt);o.stop(tt+dur+.05);}
    noise(t,.22,'bandpass',2200,.8,vol*.3,.2);}
  // —— 旋律：8 小节，原创动机（羽调五声，4/4，两个乐句 + 呼应）——
  // 每项 [起拍(16分), 音级(相对A3起的五声级), 时值(16分)]
  const MEL=[
    [0,8,4],[4,10,4],[8,11,4],[12,10,2],[14,8,2],
    [16,9,4],[20,8,4],[24,10,8],
    [32,10,4],[36,11,4],[40,12,4],[44,11,2],[46,10,2],
    [48,11,8],[56,10,4],[60,8,4],
    [64,12,4],[68,13,4],[72,12,4],[76,11,4],
    [80,12,4],[84,11,4],[88,10,8],
    [96,8,4],[100,10,4],[104,11,4],[108,12,4],
    [112,10,12],[124,8,4]
  ];
  const BASS=[0,0,5,7, 0,0,5,7];          // 每小节低音级（相对 A，半音偏移）
  let lvl=1,on=false,bossOn=false,step=0,nextT=0,timer=null,duckV=1;
  function sched(t,k){
    const bar=Math.floor(k/16)%8,s=k%16,pos=k%128;
    const L=lvl+(bossOn?1:0);
    // 鼓：基础两拍 + 逐级加密
    if(s===0)taiko(t,.55,70);
    if(s===8&&L>=1)taiko(t,.42,78);
    if(s===6||s===10)taiko(t,.3,84);
    if(L>=2&&(s===4||s===12))taiko(t,.26,92);
    if(L>=3&&(s===2||s===14))taiko(t,.16,96);
    if(L>=3&&(s===6||s===14))bangzi(t,.12);
    if(L>=4&&(s%2===1))bangzi(t,.07);
    if(bar%4===3&&s>=12&&L>=2)taiko(t,.3,88+ (s-12)*4);          // 四小节尾部滚鼓
    // 低音
    if(s===0||s===8){const b=BASS[bar];bass(t,38+b,S16*7,.24);if(L>=3)bass(t,50+b,S16*3,.08);}
    // 旋律（二胡）：L1 起即有，鼓点弱时先露出
    for(const m of MEL){if(m[0]%128===pos&&on){erhu(t,deg(m[1],0)+(L>=4?0:0),m[2]*S16*.95,.11+L*.015);}}
    // 古筝琶音 L>=2
    if(L>=2&&s%4===2){const arp=[0,2,3,4,3,2,5,4];zheng(t,deg(arp[(bar*4+(s>>2))%8]+5,0),.09+L*.01);}
    // 铜管：L>=2 每小节长和弦，L>=3 加半小节重音
    const rb=BASS[bar];
    if(L>=2&&s===0){brass(t,50+rb+12,S16*14,.05+L*.008);brass(t,57+rb,S16*14,.04+L*.006);}
    if(L>=3&&s===8){brass(t,62+rb,S16*5,.05);}
    // 杀喊声：L>=2 每两小节首拍，L>=3 每小节首拍，L>=4 半小节也喊
    if(L>=2&&s===0&&(bar%2===0||L>=3))shout(t+.01,.3+L*.04,8+L*2,170+L*6);
    if(L>=4&&s===8)shout(t+.01,.3,12,200);
  }
  function loop(){if(!on)return;const lead=.35;while(nextT<A.currentTime+lead){sched(nextT,step);nextT+=S16;step++;}}
  return{
    start(){if(on)return;on=true;step=0;nextT=A.currentTime+.08;bus.gain.setTargetAtTime(duckV,A.currentTime,.1);loop();timer=setInterval(loop,90);},
    stop(){on=false;clearInterval(timer);bus.gain.setTargetAtTime(0,A.currentTime,.4);},
    resume(){if(on)return;on=true;nextT=A.currentTime+.08;bus.gain.setTargetAtTime(duckV,A.currentTime,.3);loop();timer=setInterval(loop,90);},
    setLevel(l){lvl=Math.max(1,Math.min(4,l));},
    boss(b){bossOn=!!b;},
    gong(){gong(A.currentTime+.02,.26);},
    duck(v){duckV=v;bus.gain.setTargetAtTime(v,A.currentTime,.2);},
    offline(secs){on=true;step=0;nextT=0;const lead=secs;while(nextT<lead){sched(nextT,step);nextT+=S16;step++;}on=false;},
    gongAt(t){gong(t,.26);}
  };
}
