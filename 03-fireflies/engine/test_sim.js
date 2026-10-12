"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm"),M=require("./sim.js"),P=require("./sound.js");
const run=JSON.parse(fs.readFileSync(__dirname+"/seeds.json","utf8"));let passes=0;
function test(name,fn){fn();passes++;console.log("PASS "+name);}
test("published monotone concave response, endpoints, inverse and additive pulse law",()=>{
 assert(M.response(0)===0&&M.response(1)===1&&M.inverse(0)===0&&M.inverse(1)===1);
 for(let p=.01;p<1;p+=.01){assert(Math.abs(M.inverse(M.response(p))-p)<1e-12);const h=1e-5;assert(M.response(p+h)>M.response(p));assert(M.response(p+h)-2*M.response(p)+M.response(p-h)<0);}
 assert(Math.abs(M.kick(.3,.04)-M.kick(M.kick(.3,.02),.02))<1e-14);
});
test("single oscillator, invalid input and exact uncoupled phases",()=>{
 assert.throws(()=>M.makeSim({n:0}));const one=M.makeSim({n:1,phases:[.25]}),e=one.stepEvent();assert(e.t===.75&&e.ids.length===1&&one.phi[0]===0);
 const s=M.makeSim({n:5,kappa:0,seed:7}),initial=Array.from(s.phi);s.advanceTo(8.25);for(let i=0;i<5;i++)assert(Math.abs(s.phi[i]-(initial[i]+8.25)%1)<1e-11);
});
test("pulse cascade fires once, resets together, absorbs and is invariant under permutation",()=>{
 const a=M.makeSim({n:3,kappa:.2,phases:[.99,.98,.97]}),e=a.stepEvent();assert(new Set(e.ids).size===3&&e.ids.length===3);assert(a.phi.every(p=>p===0));
 for(let i=0;i<21;i++){const f=a.stepEvent();assert(f.ids.length===3);assert(a.circularArc()===0);}
 const phase=[.9,.63,.4,.2],perm=[2,0,3,1],b=M.makeSim({n:4,phases:phase}),c=M.makeSim({n:4,phases:perm.map(i=>phase[i])});
 b.advanceTo(10);c.advanceTo(10);perm.forEach((i,j)=>assert(Math.abs(b.phi[i]-c.phi[j])<1e-10));
});
test("deterministic seed, chunked clock and checkpoint replay agree",()=>{
 const a=M.makeSim({n:32,seed:3}),b=M.makeSim({n:32,seed:3});a.advanceTo(4);for(let t=.05;t<4;t+=.05)b.advanceTo(t);b.advanceTo(4);
 a.phi.forEach((p,i)=>assert(Math.abs(p-b.phi[i])<1e-10));
 const snap=a.snapshot(),c=M.makeSim({n:32,seed:3}).restore(snap);a.advanceTo(5);c.advanceTo(5);assert.deepStrictEqual(Array.from(a.phi),Array.from(c.phi));
});
test("all 1000 flash identities prove lasting synchrony through the displayed close and 20 verification cycles",()=>{
 for(const key of ["main","local"]){const r=run[key],i=r.events.findIndex(e=>e.ids.length===1000);assert(r.verified&&i>=0&&r.horizon-r.stableFrom>=20);assert(r.events.slice(i).every(e=>e.ids.length===1000&&new Set(e.ids).size===1000));}
 assert(run.local.stableFrom>run.main.stableFrom);assert(run.off.kappa===0&&!run.off.verified);
 const sim=M.makeSim({seed:run.seed});let t;for(let i=0;i<run.main.events.length+100;i++){const e=sim.stepEvent();if(e.ids.length===1000){t=e.t;break;}}assert(Math.abs(t-run.main.stableFrom)<1e-9);
});
test("single explanatory pulse advances receivers according to the same equation",()=>{
 const e=run.example;assert(e.ids.length===1);
 for(let i=0;i<10;i++)if(i!==e.ids[0]){assert(e.after[i]>=e.beforePulse[i]);assert(Math.abs(e.after[i]-M.kick(e.beforePulse[i],.05/9))<1e-12);}
});
function arcDegrees(phi){const a=Array.from(phi).sort((x,y)=>x-y);let gap=a[0]+1-a.at(-1);for(let i=1;i<a.length;i++)gap=Math.max(gap,a[i]-a[i-1]);return (1-gap)*360;}
const window={FireflySim:M,FIREFLY_RUN:run,FireflyWorld:{makeWorld:()=>({dispose(){},update(){},view(){}})}};
vm.runInNewContext(fs.readFileSync(__dirname+"/director.js","utf8"),{window,Float64Array,Math,Array});const D=window.FireflyDirector;
test("timing, screen claims at every displayed frame, and model-label scope",()=>{
 assert(D.total>=95&&D.total<=135);assert(D.SCENES.find(s=>s.id==="pulse").dur<=20&&D.SCENES.find(s=>s.id==="local").dur<=20);
 const growing=D.SCENES.find(s=>s.id==="growing"),sync=D.SCENES.find(s=>s.id==="sync"),close=D.SCENES.find(s=>s.id==="close");
 assert(Math.abs(D.source(growing,growing.dur)-sync.from)<1e-12);assert(Math.abs(D.source(sync,sync.dur)-close.from)<1e-12);
 const fast=D.SCENES.find(s=>s.id==="compare_fast"),hold=D.SCENES.find(s=>s.id==="compare_sync");
 assert(Math.abs(D.source(fast,fast.dur)-hold.from)<1e-12);assert(growing.dur>=15&&growing.dur<=20);assert(D.SCENES[0].id==="hook"&&D.SCENES[0].dur===3);
 const texts=[];const x={save(){},restore(){},scale(){},fillRect(){},fillText(s){texts.push(s);}};
 const r=D.Runtime();let modelFrames=0,hookFrames=0,comparisonSyncFrames=0,claimFrames=0;
 for(let f=0;f<Math.round(D.total*30);f++){r.at(f/30);texts.length=0;D.drawOverlay(r,x,1920,1080);
  for(const text of texts){if(["1,000 fireflies. One pulse.","A thousand lights. One pulse.","One shared pulse.","In sync."].includes(text)){claimFrames++;assert(D.verified("main",D.source(r.sc,r.u)));}
   if(text==="They find the pulse, too.")assert(D.verified("local",D.source(r.sc,r.u)));
   if(text==="Pulse-coupled oscillator model")modelFrames++;
   if(text==="Later in this model"){assert(r.sc.id==="hook");hookFrames++;}
   if(text==="In sync."){assert(r.sc.keys.join()==="off,main");assert(r.worlds[1].sim.circularArc()<1e-9);assert(arcDegrees(r.worlds[0].sim.phi)>5);comparisonSyncFrames++;}
  }
 }
 assert(modelFrames>0&&modelFrames<40);assert(hookFrames===90&&comparisonSyncFrames>100&&claimFrames>450);
 const keep=run.main.verified;run.main.verified=false;r.at(D.SCENES.find(s=>s.id==="sync").start);assert(D.labels(r).length===0);run.main.verified=keep;
});
test("sonification events match flashing representatives; voices are soft, dynamic, deterministic and faded",()=>{
 const scenes=D.audition(),tl=D.timeline(scenes,[[0,30]]);assert(tl.events.length>16);
 for(const e of tl.events){const t=scenes[0].from+e.t*scenes[0].rate;assert(run.main.events.some(v=>Math.abs(v.t-t)<1e-9&&v.ids.includes(e.id)));}
 for(const style of Object.keys(P.STYLES)){const a=P.render(tl.events,30,style,12000),b=P.render(tl.events,30,style,12000);assert.deepStrictEqual(a.L,b.L);assert(a.L.at(-1)===0&&a.R.at(-1)===0);assert(a.peakDb<-12&&a.rmsDb>-42&&a.rmsDb<-22);assert(P.STYLES[style].attack===.004);console.log(style,a.rmsDb,a.peakDb);}
 const silence=P.render([],1);assert(silence.L.every(x=>x===0));assert(P.frequency(0)>290&&P.frequency(15)/P.frequency(0)<=4.000001);
});
test("approved glass tail, global end fade and source event identities",()=>{
 assert.deepStrictEqual(Object.keys(P.STYLES),["glass"]);const full=D.timeline(D.SCENES,[[0,D.total]]);
 for(const e of full.events){const sc=D.SCENES.find(s=>e.t>=s.start-1e-8&&e.t<s.end-1e-8),st=D.source(sc,e.t-sc.start),r=run[e.key];
  assert(r.events.some(v=>Math.abs(v.t-st)<1e-9&&v.ids.includes(e.id)));
 }
 for(let k=0;k<16;k++){
  const m=P.render([{t:.1,k,side:0}],1.2,"glass"),peak=(a,b)=>{let p=0;for(let i=Math.round(a*48000);i<Math.round(b*48000);i++)p=Math.max(p,Math.abs(m.L[i]),Math.abs(m.R[i]));return p;},strike=peak(.1,.18);
  assert(20*Math.log10(peak(.39,.41)/strike)<=-18);assert(20*Math.log10(peak(.59,.61)/strike)<=-27);
  assert(m.L.at(-1)===0&&m.R.at(-1)===0);
 }
});
test("two measured hook flashes and display-only afterglow without a new model event",()=>{
 const hook=D.SCENES[0],events=D.timeline([hook],[[0,3]]).events,ts=[...new Set(events.map(e=>e.t))];
 assert(ts.length===2&&Math.abs(ts[0]-.3)<1e-9&&Math.abs(ts[1]-2.3)<1e-9);
 assert(events.length===32&&events.every(e=>e.cluster===1000&&e.key==="main"));
 const originalMake=window.FireflyWorld.makeWorld;
 window.FireflyWorld.makeWorld=()=>({dispose(){},view(){},update(phi,flash,t,isolation,glow){this.glow=glow;}});
 const r=D.Runtime();r.at(0);assert(r.worlds[0].stage.glow.every(v=>v===0));
 r.at(.3);assert(r.worlds[0].stage.glow.every(v=>v>=.99));
 r.at(1.1);assert(r.worlds[0].stage.glow.every(v=>v>.2));
 r.at(1.7);assert(r.worlds[0].stage.glow.every(v=>v===0));
 r.at(2.3);assert(r.worlds[0].stage.glow.every(v=>v>=.99));
 assert(D.afterglow(-.01)===0&&D.afterglow(D.GLOW.duration)===0);
 window.FireflyWorld.makeWorld=originalMake;
});
console.log(JSON.stringify({passes,syncCycles:run.main.stableFrom,localSyncCycles:run.local.stableFrom,totalSeconds:D.total,frames:Math.round(D.total*30)}));
