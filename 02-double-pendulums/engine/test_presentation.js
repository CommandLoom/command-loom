"use strict";
const fs=require("fs"),vm=require("vm"),assert=require("assert"),M=require("./sim.js"),S=require("./spread.js");
const run=JSON.parse(fs.readFileSync(__dirname+"/revision_run.json","utf8"));
const window={REVISION_RUN:run,SpreadMeasure:S,PendulumWorld:{makeWorld:()=>({record(){},flash(){},alpha(){},dispose(){},aspect(){}})}};
const fileFetch=async url=>{const b=fs.readFileSync(__dirname+"/"+url.replace(/^engine\//,""));return{ok:true,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};};
const ctx=vm.createContext({window,fetch:fileFetch,Float32Array,Int16Array,Map,Math,Number,Promise});
for(const f of ["sound_events.js","sound.js","director.js"])vm.runInContext(fs.readFileSync(__dirname+"/"+f,"utf8"),ctx);
const D=window.PendulumDirector;let passes=0;
async function test(name,f){await f();passes++;console.log("PASS "+name);}
(async()=>{
await D.ready();
await test("measured timing, honest hook, one model label and 120–150 second duration",()=>{
 assert(D.total>=120&&D.total<=150);assert(D.SCENES[0].note==="Later in this run");assert(D.SCENES.filter(s=>s.model).length===1);
 const by=id=>D.SCENES.find(s=>s.id===id);
 assert(by("stack").intro&&D.SCENES[1].id==="stack");
 assert(by("together").simStart===0&&by("together").dur===run.smallAt);
 assert(by("opening").simStart===run.smallAt);assert(by("replay").speed===.25);
 for(const s of D.SCENES){assert(Math.abs(s.dur*30-Math.round(s.dur*30))<1e-6);assert(s.simStart+s.dur*s.speed<=60+1e-8);}
});
await test("RMS equals an independent two-pass computation in metres; initial diameter is <1 micrometre",()=>{
 for(const n of [2,1000]){const sim=M.makeSim({n,initial:run.initial});let mx=0,my=0,pts=[];
  for(let i=0;i<n;i++){const x=Math.sin(sim.theta1[i])+Math.sin(sim.theta2[i]),y=-Math.cos(sim.theta1[i])-Math.cos(sim.theta2[i]);pts.push([x,y]);mx+=x/n;my+=y/n;}
  const independent=Math.sqrt(pts.reduce((a,p)=>a+(p[0]-mx)**2+(p[1]-my)**2,0)/n);
  assert(Math.abs(S.meters(sim)-independent)<1e-14);
 }
 assert(run.cases[4].initialDiameter<1e-6);assert(Math.abs(run.cases[4].initialDiameter-9.99e-7)<1e-15);
 assert(S.format(2e-9).includes("nm"));assert(S.format(2e-6).includes("µm"));assert(S.format(.002).includes("mm"));assert(S.format(.02).includes("cm"));assert(S.format(2).endsWith("m"));
});
await test("small-swing claim is gated on whole-panel verification at every integration step",()=>{
 const c=run.cases[0];assert(c.togetherVerified&&c.checkedEveryStep&&c.maxRms<run.togetherLimit);
 assert(c.curve.length===1801);assert(c.maxRms>=Math.max(...c.curve.map(p=>p[1])));
 const seen=[];const context={save(){},restore(){},scale(){},fillRect(){},fillText(s){seen.push(s);}};
 const r=D.Runtime().seek(D.SCENES.findIndex(s=>s.id==="comparison"));D.drawOverlay(r,context,1920,1080);assert(seen.includes("Together through 60 s."));
 const old=c.maxRms;c.maxRms=run.togetherLimit*2;seen.length=0;D.drawOverlay(r,context,1920,1080);assert(!seen.some(s=>/stay together|together through/i.test(s)));c.maxRms=old;
 const verified=c.togetherVerified;c.togetherVerified=false;seen.length=0;D.drawOverlay(r,context,1920,1080);assert(!seen.some(s=>/stay together|together through/i.test(s)));c.togetherVerified=verified;
 assert(run.cases[1].firstVisible===null&&run.cases[2].firstVisible===null);
 assert(run.cases[3].thresholdRelativeError<.05);
});
await test("comparison has identical physical horizon, count, offsets and pixel scale",()=>{
 for(const s of D.SCENES.filter(s=>s.id==="comparison"||s.id.startsWith("angle"))){assert(s.simStart===0&&s.dur*s.speed===60);for(const c of s.cases)assert(run.cases[c].geometry.count===1000);}
 for(const c of run.cases){const sim=M.makeSim({n:1000,initial:c.initial});assert(Math.abs(sim.theta1[999]-sim.theta1[0]-999*M.EPS)<1e-15);}
 const html=fs.readFileSync(__dirname+"/../DoublePendulums.html","utf8");assert(html.includes("Sound")||html.includes("sonifikasyon")||html.includes("sonifikasyon".toLowerCase()));
 const world=fs.readFileSync(__dirname+"/world.js","utf8");assert(world.includes("HALF=2/.88"));assert(world.includes("pixels:{value:2.6}"));
});
await test("baked display positions match actual checkpoint states to subpixel precision; RMS remains Float64",()=>{
 for(const c of run.cases){const g=c.geometry;
  // Buffer pools can have offsets: construct exact view for byte-for-byte reads.
  const b=fs.readFileSync(__dirname+"/"+g.file),v=new Int16Array(b.buffer,b.byteOffset,b.byteLength/2);
  for(const cp of [c.checkpoints[0],c.checkpoints.at(-1)]){const f=Math.round(cp.steps*run.dt*g.fps);
   for(const i of [0,499,999]){const x1=Math.sin(cp.theta1[i]),y1=-Math.cos(cp.theta1[i]),xy=[x1,y1,x1+Math.sin(cp.theta2[i]),y1-Math.cos(cp.theta2[i])];
    for(let k=0;k<4;k++)assert(Math.abs(v[f*4000+i*4+k]/16000-xy[k])<=1/32000+1e-12);}
  }
 }
 const r=D.Runtime().at(D.SCENES.find(s=>s.id==="opening").start+1);assert(r.worlds[0].spread===D.rms(4,run.smallAt+1));
});
await test("replay uses the identical source time and trajectories; seeks are reproducible",()=>{
 const scene=D.SCENES.find(s=>s.id==="replay"),t=12.4,u=(t-scene.simStart)/scene.speed;assert(Math.abs(D.source(scene,u)-t)<1e-10);
 const a=D.sample(4,t,true),b=D.sample(4,t,false);assert.deepStrictEqual(Array.from(a),Array.from(b));
 const r=D.Runtime().at(scene.start+u),again=D.Runtime().at(scene.start+u);assert(r.worlds[0].t===again.worlds[0].t&&r.worlds[0].spread===again.worlds[0].spread);
 assert(r.worlds[0].spread===run.mainFine.curve[Math.round(t*120)][1]);
});
await test("independent complete small-swing replay stays together at every RK4 step",()=>{
 const sim=M.makeSim({n:1000,initial:run.cases[0].initial});let max=0;
 for(let i=0;i<36000;i++){sim.step();max=Math.max(max,S.meters(sim));assert(max<run.togetherLimit);}
 assert(Math.abs(max-run.cases[0].maxRms)<1e-15);
});
await test("sound events are measured centre-line crossings of the representative bobs",()=>{
 const SE=window.SOUND_EVENTS,c=run.cases[4],sim=M.makeSim({n:1000,initial:c.initial}),ev=SE.cases[4].events.filter(e=>e[0]<8);
 const bx=i=>Math.sin(sim.theta1[i])+Math.sin(sim.theta2[i]),xs=[SE.reps.map(bx)];
 for(let s=0;s<Math.ceil(8/M.DT)+1;s++){sim.step();xs.push(SE.reps.map(bx));}
 assert(ev.length>50);
 for(const [t,k] of ev){const s=Math.floor(t/M.DT);assert((xs[s][k]<0)!==(xs[s+1][k]<0),"no sign change at "+t);}
 let count=0;for(let s=0;s<xs.length-1;s++)for(let k=0;k<SE.reps.length;k++)if((xs[s][k]<0)!==(xs[s+1][k]<0)&&(s+1)*M.DT<8)count++;
 assert(Math.abs(count-ev.length)<=SE.reps.length,"every crossing has an event");
});
await test("sound is deterministic, soft, below the -1 dB ceiling and silent-free outside the display-only intro",()=>{
 const ranges=D.SCENES.map(s=>[s.start,s.start+1]),a=D.synthesize(ranges,12000),b=D.synthesize(ranges,12000);
 assert.deepStrictEqual(a.L,b.L);assert(a.blocks.length===D.SCENES.length);
 for(const block of a.blocks){assert(block.peakDb<=-1+1e-5);if(block.scene!=="stack"&&block.scene!=="hook")assert(block.rmsDb>=-45&&block.rmsDb<=-20,block.scene+" "+block.rmsDb);}
 for(let i=0;i<a.len;i++){assert(Number.isFinite(a.L[i])&&Number.isFinite(a.R[i]));}
 const full=D.synthesize([[0,D.total]],12000);for(const block of full.blocks)assert(block.peakDb<=-1+1e-5);
});
console.log(JSON.stringify({passes,totalSeconds:D.total,frames:Math.round(D.total*30),scenes:D.SCENES.map(s=>({id:s.id,start:s.start,duration:s.dur,physicalStart:s.simStart,speed:s.speed}))}));
})().catch(e=>{console.error(e);process.exitCode=1;});
