"use strict";
const fs=require("fs"),path=require("path"),M=require("./sim.js");
const seed=3,positions=M.layout(1000,17),graph=M.radiusGraph(positions,.35),horizon=90;
function record(o,end){
 const sim=M.makeSim(o),initial=Array.from(sim.phi),events=[],checkpoints=[sim.snapshot()];
 sim.onEvent=e=>events.push({t:e.t,ids:e.ids,natural:e.natural,rounds:e.rounds});
 for(let t=1;t<=end;t++){sim.advanceTo(t);checkpoints.push(sim.snapshot());}
 const i=events.findIndex(e=>e.ids.length===sim.n),stableFrom=i<0?null:events[i].t;
 const verified=i>=0&&end-stableFrom>=20&&events.slice(i).every(e=>e.ids.length===sim.n)&&events.slice(i).length>=21;
 return{n:sim.n,b:sim.b,kappa:sim.kappa,seed:o.seed,graph:o.graph??null,initial,events,checkpoints,horizon:end,stableFrom,verified,maxCluster:Math.max(...events.map(e=>e.ids.length))};
}
const main=record({seed},horizon);
if(!main.verified)throw Error("No verified synchrony");
const initial=main.initial,offEvents=[];
for(let i=0;i<1000;i++)for(let k=0;k<90;k++)offEvents.push({t:1-initial[i]+k,ids:[i]});
offEvents.sort((a,b)=>a.t-b.t);
const off={n:1000,b:3,kappa:0,initial,events:offEvents,horizon:90,stableFrom:null,verified:false};
const local=record({seed,phases:initial,graph},150);
const demo=record({n:10,seed:11},40);
const pulse=M.makeSim({n:10,seed:11,captureTransitions:true});let example;
for(let i=0;i<10;i++){const e=pulse.stepEvent();if(e.ids.length===1){example=e;break;}}
if(!example)throw Error("No explanatory single-pulse event");
const reps=Array.from({length:16},(_,k)=>Math.round(k*999/15));
const data={version:"ff1",model:"Mirollo–Strogatz ideal pulse coupling",cycleVideoSeconds:2,q:.5,seed,positions,reps,main,off,local,demo,example,
 source:"Mirollo & Strogatz, SIAM J. Appl. Math. 50(6),1645–1662 (1990), doi:10.1137/0150098",
 metadata:{flashWidthVideo:.18,localRadius:.35,localDegrees:graph.map(a=>a.length),verificationCycles:20}};
fs.writeFileSync(path.join(__dirname,"seeds.json"),JSON.stringify(data));
fs.writeFileSync(path.join(__dirname,"seeds.js"),"window.FIREFLY_RUN="+JSON.stringify(data)+";\n");
console.log(JSON.stringify({seed,sync:main.stableFrom,mainEvents:main.events.length,localSync:local.stableFrom,localMax:local.maxCluster,demoPulse:example.t,bytes:fs.statSync(path.join(__dirname,"seeds.json")).size}));
