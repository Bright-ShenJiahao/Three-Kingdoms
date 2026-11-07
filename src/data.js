// ===== 数据表：改数值只改这里，不用碰 script.js =====
// 敌人类型
const TYPES={
 spara:{w:70,sp:72,r:10,hp:1,nm:'spara',hj:3,sc:1,reach:26,ar:30,aw:0.5,dmg:4,ac:1.12,ring:0,mk:null},
 archer:{w:20,sp:60,r:10,hp:1,nm:'spara',sc:1,reach:0,ar:0,aw:0.52,dmg:5,ac:1.96,ring:0,ranged:1,keep:230,range:330,mk:'#ffd84a'},
 pers:{w:15,sp:75,r:10,hp:2,nm:'spara',hj:2,sc:1,reach:34,ar:38,aw:0.5,dmg:5,ac:1.12,ring:0,mk:null},
 pcav:{w:8,sp:124,r:15,hp:4,nm:'pcav8',art:'pcav8',nf:8,sc:0.85,reach:38,ar:42,aw:0.29,dmg:8,ac:1.4,ring:0,kbm:.5,mk:null},
 comp:{w:6,sp:107,r:15,hp:6,nm:'comp8',art:'comp8',nf:8,sc:0.85,reach:38,ar:42,aw:0.33,dmg:10,ac:1.54,ring:0,kbm:.4,mk:null},
 immortal:{w:22,sp:56,r:12,hp:6,nm:'immortal',art:'immortal',nf:6,sc:1.1,reach:30,ar:34,aw:0.39,dmg:6,ac:1.4,ring:0,kbm:.3,mk:'#6ab4ff'},
 brute2:{w:5,sp:40,r:18,hp:20,nm:'immortal',sc:1.5,reach:64,ar:70,aw:0.65,dmg:14,ac:1.82,ring:1,kbm:.4,mk:'#ff5a4a'},
 brute:{boss:1,sp:42,r:20,hp:30,nm:'immortal',sc:1.7,reach:52,ar:74,aw:0.59,dmg:16,ac:1.68,ring:1},
 // ---- 黄巾八方 24 兵（美术暂用现有图集占位；hp 为基础值，随波次放大）----
 liumin:{sp:72,r:10,hp:1,nm:'spara',hj:3,sc:1,reach:26,ar:30,aw:0.5,dmg:4,ac:1.12,ring:0,mk:null},
 chutou:{sp:68,r:10,hp:2,nm:'spara',hj:3,sc:1,reach:32,ar:36,aw:0.5,dmg:5,ac:1.15,ring:0,mk:null},
 xtou:{sp:62,r:12,hp:8,nm:'spara',hj:2,sc:1.15,reach:36,ar:40,aw:0.5,dmg:7,ac:1.2,ring:0,kbm:.5,mk:'#ff5a4a'},
 daoshou:{sp:70,r:10,hp:1,nm:'spara',hj:4,sc:1,reach:28,ar:32,aw:0.45,dmg:5,ac:1.1,ring:0,mk:null},
 daodun:{sp:52,r:11,hp:5,nm:'spara',hj:7,sc:1.05,reach:30,ar:34,aw:0.5,dmg:6,ac:1.3,ring:0,kbm:.3,mk:'#6ab4ff'},
 daoshuai:{sp:48,r:13,hp:14,nm:'spara',hj:8,sc:1.2,reach:36,ar:40,aw:0.5,dmg:9,ac:1.3,ring:0,kbm:.4,mk:'#ff5a4a'},
 zhumao:{sp:74,r:10,hp:1,nm:'spara',hj:3,sc:1,reach:38,ar:42,aw:0.5,dmg:4,ac:1.2,ring:0,mk:null},
 changmao:{sp:58,r:11,hp:4,nm:'spara',hj:2,sc:1.05,reach:50,ar:54,aw:0.55,dmg:7,ac:1.35,ring:0,kbm:.4,mk:null},
 qiangshuai:{sp:50,r:13,hp:14,nm:'spara',hj:2,sc:1.2,reach:58,ar:62,aw:0.55,dmg:10,ac:1.4,ring:0,kbm:.4,mk:'#ff5a4a'},
 gongshou:{sp:60,r:10,hp:1,nm:'spara',hj:5,sc:1,reach:0,ar:0,aw:0.52,dmg:5,ac:1.96,ring:0,ranged:1,keep:230,range:330,mk:'#ffd84a'},
 nushou:{sp:54,r:10,hp:3,nm:'spara',hj:6,sc:1,reach:0,ar:0,aw:0.7,dmg:9,ac:2.5,ring:0,ranged:1,keep:270,range:380,mk:'#ffd84a'},
 nushuai:{sp:48,r:13,hp:10,nm:'spara',hj:2,sc:1.2,reach:0,ar:0,aw:0.6,dmg:12,ac:1.7,ring:0,ranged:1,keep:260,range:380,kbm:.5,mk:'#ff5a4a'},
 jishou:{sp:66,r:10,hp:2,nm:'spara',hj:2,sc:1,reach:40,ar:44,aw:0.5,dmg:6,ac:1.2,ring:0,mk:null},
 zhongji:{sp:46,r:12,hp:7,nm:'spara',hj:2,sc:1.15,reach:52,ar:56,aw:0.6,dmg:10,ac:1.5,ring:0,kbm:.3,mk:null},
 jishuai:{sp:44,r:14,hp:16,nm:'spara',hj:2,sc:1.25,reach:62,ar:66,aw:0.6,dmg:13,ac:1.5,ring:0,kbm:.4,mk:'#ff5a4a'},
 tiejia:{sp:58,r:11,hp:4,nm:'spara',hj:2,sc:1.05,reach:30,ar:34,aw:0.45,dmg:7,ac:1.3,ring:0,kbm:.3,mk:null},
 zhongdun:{sp:44,r:12,hp:9,nm:'immortal',art:'immortal',nf:6,sc:1.1,reach:30,ar:34,aw:0.39,dmg:8,ac:1.4,ring:0,kbm:.3,mk:'#6ab4ff'},
 tiejiashuai:{sp:46,r:14,hp:18,nm:'spara',hj:2,sc:1.25,reach:38,ar:42,aw:0.5,dmg:12,ac:1.4,ring:0,kbm:.4,mk:'#ff5a4a'},
 qingqi:{sp:124,r:15,hp:3,nm:'pcav8',art:'pcav8',nf:8,sc:0.85,reach:38,ar:42,aw:0.29,dmg:8,ac:1.4,ring:0,kbm:.5,mk:null},
 gongqi:{sp:100,r:15,hp:5,nm:'comp8',art:'comp8',nf:8,sc:0.85,reach:0,ar:0,aw:0.4,dmg:8,ac:2.0,ring:0,ranged:1,keep:200,range:300,kbm:.4,mk:'#ffd84a'},
 tieqishuai:{sp:104,r:16,hp:14,nm:'comp8',art:'comp8',nf:8,sc:0.95,reach:40,ar:44,aw:0.33,dmg:12,ac:1.5,ring:0,kbm:.3,mk:'#ff5a4a'},
 daotu:{sp:90,r:10,hp:2,nm:'spara',hj:3,sc:1,reach:26,ar:30,aw:0.4,dmg:3,ac:1.0,ring:0,mk:'#9ad4ff'},
 fangshi:{sp:56,r:10,hp:3,nm:'spara',hj:2,sc:1,reach:0,ar:0,aw:0.6,dmg:6,ac:1.8,ring:0,ranged:1,keep:250,range:360,mk:'#b58cff'},
 jijiu:{sp:50,r:13,hp:12,nm:'spara',hj:2,sc:1.2,reach:0,ar:0,aw:0.6,dmg:9,ac:1.6,ring:0,ranged:1,keep:260,range:370,kbm:.4,mk:'#ff5a4a'}
};

// 每一波一行：n=目标同屏数  mix=刷怪权重  b2=重甲兵上限(0=不出)  gen=该波后段出敌将  ev=波后触发随机事件
const WAVE_TABLE=[
 {n:50, mix:{spara:100,pers:6}, b2:0},
 {n:60, mix:{spara:90,archer:10,pers:8}, b2:0, ev:1},
 {n:74, mix:{spara:70,archer:15,pers:12,immortal:10,pcav:4}, b2:0},
 {n:86, mix:{spara:60,archer:20,immortal:15,pers:12,pcav:5,comp:3}, b2:0, ev:1},
 {n:98, mix:{spara:55,archer:20,immortal:18,pers:12,pcav:5,comp:3}, b2:0, gen:1},
 {n:108, mix:{spara:50,archer:20,immortal:20,pers:12,pcav:6,comp:4}, b2:1},
 {n:116, mix:{spara:50,archer:20,immortal:20,pers:12,pcav:6,comp:4}, b2:1, ev:1},
 {n:124, mix:{spara:45,archer:22,immortal:22,pers:14,pcav:7,comp:4}, b2:1},
 {n:132, mix:{spara:45,archer:22,immortal:22,pers:14,pcav:7,comp:4}, b2:2, ev:1},
 {n:80, mix:{spara:40,archer:15,immortal:15,pers:10,pcav:6,comp:4}, b2:1, boss:1},
 {n:140, mix:{spara:40,archer:25,immortal:25,pers:15,pcav:8,comp:5}, b2:2},
 {n:148, mix:{spara:40,archer:25,immortal:25,pers:15,pcav:8,comp:5}, b2:2, ev:1,gen:1},
 {n:156, mix:{spara:40,archer:25,immortal:25,pers:15,pcav:10,comp:6}, b2:3},
 {n:90, mix:{spara:40,archer:20,immortal:20,pers:12,pcav:8,comp:5}, b2:2, boss:1},
 {n:164, mix:{spara:40,archer:25,immortal:25,pers:15,pcav:10,comp:6}, b2:3, ev:1},
 {n:172, mix:{spara:40,archer:25,immortal:25,pers:15,pcav:10,comp:6}, b2:3, gen:1},
 {n:90, mix:{spara:40,archer:20,immortal:20,pers:12,pcav:8,comp:5}, b2:2, boss:1},
 {n:180, mix:{spara:40,archer:25,immortal:25,pers:15,pcav:10,comp:6}, b2:3, ev:1},
 {n:190, mix:{spara:40,archer:25,immortal:25,pers:15,pcav:10,comp:6}, b2:3, gen:1},
];
// 每波时长（秒），对照《群侠幸存者新手指引书》；第20波为终局首领
const WAVE_T=[22,26,34,38,42,45,48,52,55,70,60,65,70,60,60,60,90,60,75,180];

// 黄巾八方：每方三档 [杂兵,精英,小头目]；from/to=出场波次（含）；权重 100/40/8，精英晚1波、头目晚2波
const SECTS=[
 {n:'流民方',from:1,to:3,u:['liumin','chutou','xtou']},
 {n:'刀盾方',from:3,to:6,u:['daoshou','daodun','daoshuai']},
 {n:'枪矛方',from:5,to:8,u:['zhumao','changmao','qiangshuai']},
 {n:'弓弩方',from:6,to:10,u:['gongshou','nushou','nushuai']},
 {n:'戟兵方',from:8,to:12,u:['jishou','zhongji','jishuai']},
 {n:'铁甲方',from:10,to:14,u:['tiejia','zhongdun','tiejiashuai']},
 {n:'骑兵方',from:12,to:19,u:['qingqi','gongqi','tieqishuai']},
 {n:'太平道方',from:14,to:20,u:['daotu','fangshi','jijiu']}];
const HP_SCALE=0.07; // 每过一波，非首领血量 +7%
WAVE_TABLE.forEach((row,i)=>{const w=i+1,mix={};for(const S of SECTS){if(w<S.from||w>S.to)continue;const k=w-S.from;mix[S.u[0]]=100;if(k>=1)mix[S.u[1]]=40;if(k>=2)mix[S.u[2]]=8;}row.mix=mix;row.b2=0;});
// 势力：fx 为声明式效果（maxhp/spd/take/all/dcd/ranged/melee/heal=乘数；cb/rg=开关）
const FAC={xiangyong:{n:'普通乡勇',up:'无',dn:'无'},
 guanjun:{n:'官军',up:'最大生命+15%',dn:'移速-8%',cond:'携官军技能（枪刺/震地）通关',tags:['qiang','zhendi'],fx:{maxhp:1.15,spd:.92}},
 liubei:{n:'刘备义军',up:'受到伤害-12%',dn:'自己伤害-6%',tags:['lianzhan','jian'],fx:{take:.88,all:.94}},
 caocao:{n:'曹操',up:'击杀后2秒内伤害+20%',dn:'波间回血减半',cond:'携曹操技能（横扫千军/刀轮）通关',tags:['hengsao','daolun'],fx:{cb:1,heal:.5}},
 sunjian:{n:'孙坚',up:'移速+8%，闪身冷却-15%',dn:'最大生命-12%',cond:'携孙坚技能（旋风斩/冲锋）通关',tags:['xuanfeng','chong'],fx:{spd:1.08,dcd:.85,maxhp:.88}},
 dongzhuo:{n:'董卓·西凉军',up:'射艺类伤害+15%',dn:'近战类伤害-10%',cond:'携西凉技能（箭雨/飞刀）通关',tags:['jianyu','feidao'],fx:{ranged:1.15,melee:.9}},
 huangjin:{n:'黄巾余部',up:'受击后4秒内伤害+25%',dn:'最大生命-15%',cond:'未杀一人，弃甲而逃',tags:['pili','huogong'],fx:{rg:1,maxhp:.85}}};
//END_FAC
// 随机事件：fx 另有 heal/hurt=占最大生命比例，maxhpAdd=最大生命加减，gamble=[好,坏]各一半
const EVENTS=[
 {id:'nongfu',w:'乡民',t:'路遇老农',d:'一位老农拦在路边，说家里的粮被黄巾抢光了，求你分一点口粮。',o:[
   {t:'分他半袋干粮',h:'失 最大生命-6　得 伤害+4%',fx:{maxhpAdd:-6,all:1.04}},
   {t:'给他指条路，自己赶路',h:'得 回复15%生命',fx:{heal:.15}},
   {t:'视而不见',h:'无事发生',fx:{}}]},
 {id:'qi',w:'老兵',t:'残破的战旗',d:'官军老兵倒在一面残旗旁，把旗杆塞进你手里：“替我，把它立起来。”',o:[
   {t:'扛起战旗',h:'得 受到伤害-8%　失 移速-4%',fx:{take:.92,spd:.96}},
   {t:'扯下旗布裹伤',h:'得 回复25%生命',fx:{heal:.25}},
   {t:'默默离开',h:'无事发生',fx:{}}]},
 {id:'tiejiang',w:'铁匠',t:'着火的铁匠铺',d:'铁匠铺燃起大火，铁匠在抢救一炉刚打好的刀，喊你搭把手。',o:[
   {t:'冲进去帮忙救火',h:'失 当前生命-15%　得 伤害+8%',fx:{hurt:.15,all:1.08}},
   {t:'讨一块磨刀石',h:'得 闪身冷却-8%',fx:{dcd:.92}},
   {t:'不管，快走',h:'无事发生',fx:{}}]},
 {id:'langzhong',w:'郎中',t:'游方郎中',d:'一个背着药箱的郎中拉住你，说他的药酒能强筋健骨，只是……药性烈。',o:[
   {t:'买一副汤药',h:'得 回复40%生命　失 伤害-4%',fx:{heal:.4,all:.96}},
   {t:'赌一碗药酒',h:'一半一半：最大生命+15，或当前生命-20%',fx:{gamble:[{maxhpAdd:15},{hurt:.2}]}},
   {t:'婉拒',h:'无事发生',fx:{}}]}];
