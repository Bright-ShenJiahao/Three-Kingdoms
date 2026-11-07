// ===== 战场配乐（全程序合成，原创旋律；风格取意：战鼓+胡笳/二胡+古筝+杀声）=====
// makeBGM(ctx, dest, noiseBuf) → {start,stop,setLevel,boss,gong,duck,tickOffline}
function makeBGM(A,dest,NBUF){
  const BPM=100,S16=60/BPM/4;           // 16分音符时长
  const master=A.createGain();master.gain.value=.9;master.connect(dest);
  const comp=A.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;comp.connect(master);
  const bus=A.createGain();bus.gain.value=1;bus.connect(comp);
  // 简单混响（噪声衰减卷积），营造旷野回响
  const rv=A.createConvolver();{const n=A.sampleRate*1.6,b=A.createBuffer(2,n,A.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6);}rv.buffer=b;}
  const rvg=A.createGain();rvg.gain.value=.22;rv.connect(rvg);rvg.connect(comp);
  const send=A.createGain();send.gain.value=1;send.connect(rv);
  const hz=n=>440*Math.pow(2,(n-69)/12);
  // 调式：A 羽调五声 A C D E G（宫商角徵羽 → 羽调式，苍劲）
  const PEN=[0,3,5,7,10];
  const deg=(d,oct)=>57+oct*12+PEN[((d%5)+5)%5]+12*Math.floor(d/5);   // d=0 → A3(57)
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
  // 杀喊声：多把锯齿人声，经“啊/哦”共振峰，音高滑落，群体错位
  function shout(t,vol,n,pitch){for(let i=0;i<(n||5);i++){const tt=t+Math.random()*.18,f0=(pitch||190)*(.9+Math.random()*.35),dur=.55+Math.random()*.35;
      const o=A.createOscillator(),g=A.createGain();o.type='sawtooth';o.frequency.setValueAtTime(f0*1.25,tt);o.frequency.exponentialRampToValueAtTime(f0*.8,tt+dur);
      const f1=A.createBiquadFilter(),f2=A.createBiquadFilter();f1.type='bandpass';f2.type='bandpass';f1.Q.value=5;f2.Q.value=6;f1.frequency.setValueAtTime(520,tt);f1.frequency.linearRampToValueAtTime(760,tt+dur*.4);f2.frequency.setValueAtTime(1000,tt);f2.frequency.linearRampToValueAtTime(1150,tt+dur*.4);
      g.gain.setValueAtTime(.0001,tt);g.gain.exponentialRampToValueAtTime(vol/(n||5),tt+.05);g.gain.exponentialRampToValueAtTime(.0001,tt+dur);
      o.connect(f1);o.connect(f2);f1.connect(g);f2.connect(g);g.connect(bus);g.connect(send);o.start(tt);o.stop(tt+dur+.05);}
    noise(t,.5,'bandpass',1500,.7,vol*.25,.5);}
  // —— 旋律：8 小节，原创动机（羽调五声，4/4，两个乐句 + 呼应）——
  // 每项 [起拍(16分), 音级(相对A3起的五声级), 时值(16分)]
  const MEL=[
    [0,10,6],[6,9,2],[8,7,4],[12,9,4],          // 小节1：A5 级起，上行呼唤
    [16,10,4],[20,12,4],[24,10,6],[30,9,2],     // 小节2
    [32,7,6],[38,5,2],[40,7,4],[44,9,4],        // 小节3
    [48,10,8],[56,9,4],[60,7,4],                // 小节4：收在 D
    [64,12,6],[70,10,2],[72,12,4],[76,14,4],    // 小节5：高潮
    [80,13,4],[84,12,4],[88,10,6],[94,9,2],     // 小节6
    [96,10,4],[100,9,4],[104,7,6],[110,5,2],    // 小节7
    [112,7,12],[124,5,4]                        // 小节8：回落
  ];
  const BASS=[0,0,-5,-5, 0,0,-3,-5];          // 每小节低音级（相对 A，半音偏移）
  let lvl=1,on=false,bossOn=false,step=0,nextT=0,timer=null,duckV=1;
  function sched(t,k){
    const bar=Math.floor(k/16)%8,s=k%16,pos=k%128;
    const L=lvl+(bossOn?1:0);
    // 鼓：基础两拍 + 逐级加密
    if(s===0)taiko(t,.55,70);
    if(s===8&&L>=1)taiko(t,.42,78);
    if(L>=2&&(s===4||s===12))taiko(t,.26,92);
    if(L>=3&&(s%2===0)&&s!==0&&s!==8)taiko(t,.16,96);
    if(L>=3&&(s===6||s===14))bangzi(t,.12);
    if(L>=4&&(s%2===1))bangzi(t,.07);
    if(bar%4===3&&s>=12&&L>=2)taiko(t,.3,88+ (s-12)*4);          // 四小节尾部滚鼓
    // 低音
    if(s===0||s===8){const b=BASS[bar];bass(t,33+b+12*(s===8?0:0),S16*7,.22);if(L>=3)bass(t,45+b,S16*3,.08);}
    // 旋律（二胡）：L1 起即有，鼓点弱时先露出
    for(const m of MEL){if(m[0]%128===pos&&on){erhu(t,deg(m[1],0)+(L>=4?0:0),m[2]*S16*.95,.11+L*.015);}}
    // 古筝琶音 L>=2
    if(L>=2&&s%4===2){const arp=[0,2,3,4,3,2,5,4];zheng(t,deg(arp[(bar*4+(s>>2))%8]+5,0),.09+L*.01);}
    // 杀喊声：L>=2 每两小节首拍，L>=4 每小节
    if(s===0&&L>=2&&(bar%2===0||L>=4))shout(t+.02,.22+L*.03,3+L,170+L*8);
    // 号角式长音垫（低八度二胡）L>=4
    if(s===0&&bar%2===0&&L>=4)erhu(t,deg(0,-1)+12,S16*30,.08);
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
