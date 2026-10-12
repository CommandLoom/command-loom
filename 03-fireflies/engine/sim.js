// Ideal Mirollo–Strogatz pulse-coupled oscillators, in natural-cycle units.
// Event cascades are atomic: each oscillator fires once and stays reset in its event.
(function(root){
"use strict";
const TOL=1e-12;
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function response(phi,b=3){return Math.log1p(Math.expm1(b)*phi)/b;}
function inverse(x,b=3){return Math.expm1(b*x)/Math.expm1(b);}
function kick(phi,amount,b=3){return Math.min(1,inverse(Math.min(1,response(phi,b)+amount),b));}
function makeSim(o={}){
 const n=o.n??1000,b=o.b??3,kappa=o.kappa??.05,rand=rng(o.seed??3);
 if(!Number.isInteger(n)||n<1||!(b>0)||!(kappa>=0))throw Error("Invalid model parameters");
 const phi=Float64Array.from(o.phases??Array.from({length:n},()=>rand()));
 if(phi.length!==n||Array.from(phi).some(p=>!(p>=0&&p<1)))throw Error("Invalid initial phases");
 const graph=o.graph??null;if(graph&&(graph.length!==n||graph.some((row,i)=>new Set(row).size!==row.length||row.some(j=>j<0||j>=n||j===i))))throw Error("Invalid adjacency");
 const epsilon=n>1?kappa/(n-1):0;
 const S={n,b,kappa,epsilon,phi,t:0,events:[],graph};
 S.nextTime=()=>S.t+1-Math.max(...phi);
 S.stepEvent=function(){
  let dt=1-Math.max(...phi);if(dt<0&&dt>-TOL)dt=0;if(dt<0)throw Error("Phase passed threshold");
  for(let i=0;i<n;i++)phi[i]+=dt;S.t+=dt;
  const fired=new Uint8Array(n);let batch=[];for(let i=0;i<n;i++)if(phi[i]>=1-TOL){fired[i]=1;batch.push(i);}
  const natural=batch.slice(),beforePulse=o.captureTransitions?Array.from(phi):null,rounds=[];
  if(!batch.length)throw Error("No natural trigger");
  while(batch.length){
   rounds.push(batch.slice());const amounts=new Float64Array(n);
   if(graph){for(const i of batch)for(const j of graph[i])if(!fired[j])amounts[j]+=kappa/Math.max(1,graph[j].length);}
   else for(let j=0;j<n;j++)if(!fired[j])amounts[j]=batch.length*epsilon;
   const next=[];
   for(let j=0;j<n;j++)if(!fired[j]&&amounts[j]>0){phi[j]=kick(phi[j],amounts[j],b);if(phi[j]>=1-TOL){fired[j]=1;next.push(j);}}
   batch=next;
  }
  const ids=[];for(let i=0;i<n;i++)if(fired[i]){phi[i]=0;ids.push(i);}
  const event={t:S.t,ids,natural,rounds,beforePulse,after:o.captureTransitions?Array.from(phi):null};
  if(S.onEvent)S.onEvent(event);return event;
 };
 S.advanceTo=function(t){
  if(t<S.t-TOL||!Number.isFinite(t))throw Error("Cannot advance backwards");
  while(S.nextTime()<=t+TOL)S.stepEvent();
  const dt=Math.max(0,t-S.t);for(let i=0;i<n;i++)phi[i]+=dt;S.t=t;return S;
 };
 S.circularArc=function(){const a=Array.from(phi).sort((x,y)=>x-y);let gap=a[0]+1-a[n-1];for(let i=1;i<n;i++)gap=Math.max(gap,a[i]-a[i-1]);return 1-gap;};
 S.snapshot=()=>({t:S.t,phi:Array.from(phi)});
 S.restore=c=>{if(c.phi.length!==n||c.t<0)throw Error("Invalid checkpoint");phi.set(c.phi);S.t=c.t;return S;};
 return S;
}
function layout(n,seed=17){
 const rand=rng(seed),p=[];let tries=0;
 while(p.length<n){const x=rand()*7.1-3.55,y=rand()*3.6-1.8;tries++;if(tries>1000000)throw Error("Point-cloud placement failed");
  if(p.every(q=>(x-q[0])**2+(y-q[1])**2>.077**2))p.push([x,y,rand(),rand()]);
 }return p;
}
function radiusGraph(positions,radius=.35){return positions.map((p,i)=>positions.reduce((a,q,j)=>{if(i!==j&&(p[0]-q[0])**2+(p[1]-q[1])**2<=radius**2)a.push(j);return a;},[]));}
function measure(o,horizon){
 const s=makeSim(o),initial=Array.from(s.phi),states=[s.snapshot()],events=[];
 while(s.nextTime()<=horizon){const e=s.stepEvent();events.push({t:e.t,ids:e.ids,natural:e.natural,rounds:e.rounds});states.push(s.snapshot());}
 const full=events.findIndex(e=>e.ids.length===s.n),stableFrom=full<0?null:events[full].t;
 const verified=stableFrom!==null&&horizon-stableFrom>=20&&events.slice(full).every(e=>e.ids.length===s.n)&&events.slice(full).length>=21;
 return{...o,n:s.n,b:s.b,kappa:s.kappa,initial,horizon,states,events,stableFrom,verified,lastArc:s.circularArc()};
}
const api={rng,response,inverse,kick,makeSim,layout,radiusGraph,measure,TOL};
root.FireflySim=api;if(typeof module!=="undefined")module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
