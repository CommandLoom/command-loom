// Scene timing and claims derive from measured, unchanged physics.
(function(root){
"use strict";
const run=root.REVISION_RUN,S=root.SpreadMeasure,W=root.PendulumWorld,FPS=30,OUT_W=1920,OUT_H=1080;
const SCENES=[
{id:"hook",name:"0 · Hook",simStart:run.largeAt,dur:3,speed:1,cases:[4],title:"1,000 double pendulums.",note:"Later in this run"},
{id:"stack",name:"0b · 1,000 pendulums",simStart:0,dur:5,speed:1,cases:[4],intro:true,title:"1,000 separate pendulums."},
{id:"together",name:"1 · Together",simStart:0,dur:run.smallAt,speed:1,cases:[4],title:"Started less than a micrometer apart.",model:true},
{id:"opening",name:"2 · Opening",simStart:run.smallAt,dur:run.revealEnd-run.smallAt,speed:1,cases:[4],title:"Then this happens."},
{id:"replay",name:"3 · Slow replay",simStart:run.replayStart,dur:(run.replayEnd-run.replayStart)/.25,speed:.25,cases:[4],title:"Replay · same run",fine:true},
{id:"comparison",name:"4a · Small / big swing",simStart:0,dur:15,speed:4,cases:[0,4],title:"Small swing: they stay together."},
{id:"angle30",name:"4b · 30°",simStart:0,dur:15,speed:4,cases:[1],title:"A little more energy."},
{id:"angle60",name:"4c · 60°",simStart:0,dur:15,speed:4,cases:[2],title:"Still close."},
{id:"angle100",name:"4d · 100°",simStart:0,dur:15,speed:4,cases:[3],title:"A bigger swing. A different outcome."},
{id:"close",name:"5 · Closing",simStart:45,dur:15,speed:1,cases:[4],title:"Small differences. Large consequences."}
];
let total=0;for(const sc of SCENES){sc.start=total;total+=sc.dur;sc.end=total;}
const geometry=new Map();
async function ready(){
 const all=[...run.cases.map(c=>c.geometry),run.mainFine];
 await Promise.all(all.map(async g=>{const r=await fetch("engine/"+g.file);if(!r.ok)throw Error("Missing measured geometry: "+g.file);const b=await r.arrayBuffer();if(b.byteLength!==g.frames*g.count*4*2)throw Error("Geometry length mismatch");geometry.set(g.file,new Int16Array(b));}));
}
function source(sc,u){return Math.min(60,sc.simStart+u*sc.speed);}
function sample(caseIndex,t,fine=false){const g=fine?run.mainFine:run.cases[caseIndex].geometry;const f=Math.max(0,Math.min(g.frames-1,Math.round(t*g.fps)));const data=geometry.get(g.file);if(!data)throw Error("Geometry not loaded");return data.subarray(f*4000,(f+1)*4000);}
function rms(caseIndex,t,fine=false){const curve=fine?run.mainFine.curve:run.cases[caseIndex].curve,fps=fine?120:30;const f=Math.max(0,Math.min(curve.length-1,Math.round(t*fps)));return curve[f][1];}
// Intro (display only): the measured starting state with the upper-rod angles fanned out, then stacked
// back to the real 10^-9 rad spacing. Labelled on screen; physics starts from the stacked state.
const FAN=70*Math.PI/180,smooth=v=>v*v*(3-2*v);
function introFrame(u){
 const c=run.cases[4].initial,n=run.count,k=u<2?1:u<4?1-smooth((u-2)/2):0,out=new Int16Array(n*4);
 for(let i=0;i<n;i++){const a=c.theta1+((i-(n-1)/2)/(n-1)*FAN*k||0)+(i-(n-1)/2)*run.epsilon,b=c.theta2;
  const x1=Math.sin(a),y1=-Math.cos(a),x2=x1+Math.sin(b),y2=y1-Math.cos(b);out[i*4]=Math.round(x1*16000);out[i*4+1]=Math.round(y1*16000);out[i*4+2]=Math.round(x2*16000);out[i*4+3]=Math.round(y2*16000);}
 return out;
}
const FLASH=.3;
function flashesAt(sc,caseIndex,u,frame){
 const SE=root.SOUND_EVENTS;if(!SE||sc.intro)return[];
 const ev=SE.cases[caseIndex].events,t1=sc.simStart+u*sc.speed,t0=sc.simStart+(u-FLASH)*sc.speed,list=[];
 let lo=0,hi=ev.length;while(lo<hi){const m=(lo+hi)>>1;if(ev[m][0]<t0)lo=m+1;else hi=m;}
 for(let i=lo;i<ev.length&&ev[i][0]<=t1;i++){if(ev[i][0]<sc.simStart||ev[i][0]>60||(sc.speed>1&&ev[i][1]%2))continue;const age=(t1-ev[i][0])/sc.speed/FLASH,idx=SE.reps[ev[i][1]];
  list.push({index:idx,x:frame[idx*4+2]/16000,y:frame[idx*4+3]/16000,a:Math.pow(1-age,2)});}
 return list;
}
function Runtime(){
 const R={sc:null,scIndex:-1,u:0,worlds:[],frame:0};
 R.at=function(t){t=Math.max(0,Math.min(total-1/FPS,t));const i=SCENES.findIndex(s=>t<s.end-1e-8);
  if(i!==R.scIndex){R.worlds.forEach(w=>w.stage.dispose());R.scIndex=i;R.sc=SCENES[i];R.worlds=R.sc.cases.map(c=>({caseIndex:c,stage:W.makeWorld()}));}
  R.u=t-R.sc.start;R.frame=Math.round(t*FPS);const st=source(R.sc,R.u);
  for(const w of R.worlds){
   if(R.sc.intro){const f=introFrame(R.u),k=R.u<2?1:R.u<4?1-smooth((R.u-2)/2):0;w.stage.alpha(.022+(.12-.022)*(1-k));w.t=0;w.spread=null;w.stage.record(f,Array(8).fill(f));w.stage.flash([]);continue;}
   w.t=st;w.spread=rms(w.caseIndex,st,!!R.sc.fine);const g=R.sc.fine?run.mainFine:run.cases[w.caseIndex].geometry;
   const history=Array.from({length:8},(_,k)=>sample(w.caseIndex,Math.max(0,st-k/g.fps*(g.fps===120?3:1)),!!R.sc.fine));
   const frame=sample(w.caseIndex,st,!!R.sc.fine);w.stage.record(frame,history);w.stage.flash(flashesAt(R.sc,w.caseIndex,R.u,frame));}
  return R;
 };
 R.seek=i=>R.at(SCENES[i].start);R.advance=dt=>R.at(R.frame/FPS+dt);return R;
}
function renderFrame(R,renderer,width,height){
 renderer.setScissorTest(true);const n=R.worlds.length;
 R.worlds.forEach((w,i)=>{const vw=width/n,vx=vw*i;w.stage.aspect(vw/height,vw,height);renderer.setViewport(vx,0,vw,height);renderer.setScissor(vx,0,vw,height);renderer.render(w.stage.scene,w.stage.camera);});
 renderer.setScissorTest(false);
}
const FONT='"Bahnschrift","Segoe UI",sans-serif';
function drawOverlay(R,x,width,height){
 const k=height/1080,sc=R.sc,u=R.u,n=R.worlds.length;
 const low=run.cases[0],togetherOK=low.togetherVerified&&low.checkedEveryStep&&low.maxRms<run.togetherLimit;
 const headline=sc.id==="comparison"&&!togetherOK?"Small swing. Big swing.":sc.title;
 x.save();x.scale(k,k);const w=width/k,h=1080;
 x.fillStyle="#F5F3EF";x.shadowColor="#04070D";x.shadowBlur=14;x.shadowOffsetY=2;x.textAlign="center";x.textBaseline="middle";
 function text(s,px,y,color="#F5F3EF",cx=w/2){x.fillStyle=color;x.font="600 "+px+"px "+FONT;x.fillText(s,cx,y);}
 if(sc.intro){const t1=u<2.6?"1,000 separate pendulums.":"Stacked, they look like one.",a=u<2.6?Math.min(1,u/.3+.1,Math.max(0,(2.6-u)/.3)):Math.min(1,(u-2.6)/.3);
  x.globalAlpha=a;text(t1,78,91);x.globalAlpha=1;if(u<3.6){x.globalAlpha=Math.min(1,Math.max(0,(3.6-u)/.4));text("Starting angles spread out for display",38,1004,"#FFBD38");x.globalAlpha=1;}}
 else if(sc.id==="hook")text(headline,78,91);
 else if(sc.id==="replay")text(headline,78,91);
 else if(u<(sc.id==="together"?6:4.5)){const hold=sc.id==="together"?6:4.5;x.globalAlpha=Math.min(1,u/.3+0.1,Math.max(0,(hold-u)/.6));text(headline,78,91);x.globalAlpha=1;}
 if(sc.note)text(sc.note,38,1004,"#FFBD38");
 if(sc.speed!==1){x.textAlign="right";text(sc.speed.toFixed(sc.speed<1?2:0)+"× SPEED",38,43,"#FFBD38",w-45);x.textAlign="center";}
 if(sc.model&&u<4.5){
  text("Ideal double-pendulum simulation",38,956,"#B8C4D6");
  text("Assumed: 1 m rods, 1 kg bobs",38,1004,"#B8C4D6");
 }
 if(n===2){x.shadowBlur=0;x.fillStyle="#314154";x.fillRect(w/2-1,0,2,h);x.shadowBlur=14;}
 R.worlds.forEach((z,j)=>{
  const cx=(j+.5)*w/n,meta=run.cases[z.caseIndex];
  const comparison=sc.id==="comparison"||sc.id.startsWith("angle");
  if(comparison){
   text("Start: "+meta.angleDegrees.toFixed(meta.angleDegrees>149?1:0)+"°",n===2?48:58,207,"#F5F3EF",cx);
   text("1,000 pendulums · "+Math.min(60,z.t).toFixed(1)+" s",38,261,"#A9BCD2",cx);
   let claim="";
   if(z.caseIndex===0&&meta.togetherVerified&&meta.checkedEveryStep&&meta.maxRms<run.togetherLimit)claim="Together through 60 s.";
   else if(meta.firstVisible===null)claim="No visible separation in 60 s.";
   else if(z.t>=meta.firstVisible)claim=z.caseIndex===4?"Big swing: chaos.":"Separation at "+meta.firstVisible.toFixed(2)+" s.";
   if(claim)text(claim,n===2?40:48,997,z.caseIndex===0?"#55DCDA":"#FFBD38",cx);
  }
  if(sc.id!=="hook"&&!sc.intro){
   const y=comparison?932:(sc.model&&u<4.5?172:1005);
   text("RMS spread  "+S.format(z.spread),38,y,"#E4EDF6",cx);
  }
 });
 if(sc.id==="close"){text("Small differences. Large consequences.",78,91);text("Physics: Lagrange's equations · source in description",38,952,"#B8C4D6");}
 x.restore();
}
function envelope(spread){return Math.max(0,Math.min(1,(Math.log10(Math.max(1e-9,spread))+6)/6));}
function stats(L,R,a=0,b=L.length){let sum=0,peak=0;for(let i=a;i<b;i++){sum+=(L[i]*L[i]+R[i]*R[i])/2;peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));}const rms=Math.sqrt(sum/(b-a));return {rmsDb:20*Math.log10(rms),peakDb:20*Math.log10(peak),peak};}
// Sound: one soft marimba note per measured centre-line crossing of a representative bob (sound.js).
function synthesize(ranges,sr=48000){
 const P=root.PendulumSound,tl=P.timeline(SCENES,root.SOUND_EVENTS,ranges),m=P.render(tl.events,tl.duration,"marimba",sr),blocks=[];let off=0;
 for(const [a,b] of ranges)for(const sc of SCENES){const s0=Math.max(a,sc.start),s1=Math.min(b,sc.end);if(s1<=s0)continue;const i0=Math.round((off+s0-a)*sr),i1=Math.round((off+s1-a)*sr);blocks.push({scene:sc.id,outputStart:i0/sr,outputEnd:i1/sr,...stats(m.L,m.R,i0,Math.max(i0+1,i1))});}
 return{L:m.L,R:m.R,len:m.len,sr,duration:tl.duration,blocks,events:tl.events.length};
}
root.PendulumDirector={run,FPS,OUT_W,OUT_H,SCENES,total,ready,source,sample,rms,Runtime,renderFrame,drawOverlay,envelope,synthesize,stats};
})(window);
