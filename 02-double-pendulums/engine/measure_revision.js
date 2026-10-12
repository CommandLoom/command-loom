"use strict";
const fs=require("fs"),path=require("path"),M=require("./sim.js"),S=require("./spread.js");
const main=JSON.parse(fs.readFileSync(path.join(__dirname,"seeds.json"),"utf8"));
const FPS=30,COMPARE=60,VISIBLE=.02,LOW_LIMIT=.001;
const mainDegrees=main.initial.theta1*180/Math.PI,angles=[5,30,60,100,mainDegrees];
const cases=[];
const QUANT=16000; let mainFine=null;
function pack(sim,buffer,frame){for(let i=0;i<sim.n;i++){const x1=sim.p.l1*Math.sin(sim.theta1[i]),y1=-sim.p.l1*Math.cos(sim.theta1[i]),x2=x1+sim.p.l2*Math.sin(sim.theta2[i]),y2=y1-sim.p.l2*Math.cos(sim.theta2[i]);buffer.set([Math.round(x1*QUANT),Math.round(y1*QUANT),Math.round(x2*QUANT),Math.round(y2*QUANT)],(frame*sim.n+i)*4);}}
for(let index=0;index<angles.length;index++){
 const angle=angles[index],initial=index===4?{...main.initial}:{...main.initial,theta1:angle*Math.PI/180,theta2:main.initial.theta2*(angle/mainDegrees)};
 const sim=M.makeSim({n:1000,seed:main.seed,initial,monitorEnergy:true}),curve=[[0,S.meters(sim)]],checkpoints=[];
 const startRms=S.meters(sim),diameter=S.initialDiameter(sim);let maxRms=startRms,firstVisible=null;
 const geometry=new Int16Array((COMPARE*FPS+1)*1000*4);pack(sim,geometry,0);
 const fineGeometry=index===4?new Int16Array((20*120+1)*1000*4):null,fineCurve=index===4?[[0,startRms]]:null;
 if(fineGeometry)pack(sim,fineGeometry,0);
 const ticks=[];let cachedRms=startRms;sim.onCrossing=e=>{if(e.index===499&&e.rod===2&&cachedRms<LOW_LIMIT)ticks.push({t:e.t});};
 for(let frame=1;frame<=COMPARE*FPS;frame++){
  const targetSteps=Math.floor(frame/FPS/M.DT+1e-7);
  while(sim.steps<targetSteps){sim.step();if(index===0)maxRms=Math.max(maxRms,S.meters(sim));
    if(fineGeometry&&sim.steps%5===0&&sim.t<=20+1e-8){const fi=sim.steps/5;pack(sim,fineGeometry,fi);fineCurve.push([fi/120,S.meters(sim)]);}}
  const rms=S.meters(sim);cachedRms=rms;pack(sim,geometry,frame);maxRms=Math.max(maxRms,rms);
  if(firstVisible===null&&rms>=VISIBLE)firstVisible=sim.t;
  curve.push([frame/FPS,rms]);
  if(frame%300===0){checkpoints.push(sim.snapshot());console.log("measured",angle.toFixed(2),"degrees",frame/FPS,"s; spread",rms);}
 }
 if(sim.maxEnergyDrift>=1e-4)throw new Error("Energy budget failed at angle "+angle);
 if(index===0&&maxRms>=LOW_LIMIT)throw new Error("Small-swing together claim failed");
 let refinedFirstVisible=null;
 if(firstVisible!==null&&index!==4){
  const fine=M.makeSim({n:1000,initial,dt:M.DT/2});
  for(let f=1;f<=Math.ceil(Math.min(COMPARE,firstVisible*1.2+1)*FPS);f++){fine.advanceTo(f/FPS);if(S.meters(fine)>=VISIBLE){refinedFirstVisible=f/FPS;break;}}
 }
 const error=firstVisible&&refinedFirstVisible?Math.abs(firstVisible-refinedFirstVisible)/refinedFirstVisible:0;
 fs.writeFileSync(path.join(__dirname,"geometry_angle"+index+".bin"),Buffer.from(geometry.buffer));
 if(fineGeometry){fs.writeFileSync(path.join(__dirname,"geometry_main_120.bin"),Buffer.from(fineGeometry.buffer));mainFine={file:"geometry_main_120.bin",fps:120,frames:2401,scale:QUANT,count:1000,curve:fineCurve};}
 cases.push({geometry:{file:"geometry_angle"+index+".bin",fps:FPS,frames:COMPARE*FPS+1,scale:QUANT,count:1000},ticks,id:"angle"+index,angleDegrees:angle,lowerDegrees:initial.theta2*180/Math.PI,initial,startRms,initialDiameter:diameter,
  firstVisible,refinedFirstVisible,thresholdRelativeError:error,maxRms,maxEnergyDrift:sim.maxEnergyDrift,
  togetherVerified:index===0,checkedEveryStep:index===0,curve,checkpoints});
 console.log("CASE",JSON.stringify({angle,firstVisible,refinedFirstVisible,maxRms,energy:sim.maxEnergyDrift}));
}
const P=main.referencePeriod,a=main.smallAt,b=main.largeAt;
const data={version:1,seed:main.seed,count:1000,epsilon:M.EPS,dt:M.DT,initial:main.initial,
 metric:"RMS distance of lower endpoints from their centroid",metricUnits:"m",visibleLimit:VISIBLE,togetherLimit:LOW_LIMIT,
 comparisonPhysicalSeconds:COMPARE,comparisonSpeed:4,referencePeriod:P,smallAt:a,largeAt:b,
 revealEnd:Math.ceil((b+2*P)*30)/30,replayStart:Math.floor((a-2*P)*120)/120,replayEnd:Math.ceil((b+P)*120)/120,
 cases,mainFine,mainCheckpoints:main.checkpoints};
if(!(cases[4].initialDiameter<1e-6))throw new Error("Less-than-one-micrometer statement failed");
fs.writeFileSync(path.join(__dirname,"revision_run.json"),JSON.stringify(data,null,2)+"\n");
fs.writeFileSync(path.join(__dirname,"revision_run.js"),"// Measured by measure_revision.js.\nwindow.REVISION_RUN="+JSON.stringify(data)+";\n");
console.log("DONE",JSON.stringify({initialRms:cases[4].startRms,diameter:cases[4].initialDiameter,smallAt:a,largeAt:b,
 lowMax:cases[0].maxRms,replayDuration:(data.replayEnd-data.replayStart)/.25,caseCount:cases.length}));
