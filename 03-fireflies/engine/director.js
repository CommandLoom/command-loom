// Measured model events drive chronology, claims and sound. Times are not biological seconds.
(function(root){
"use strict";
const M=root.FireflySim,RUN=root.FIREFLY_RUN,W=root.FireflyWorld,FPS=30,q=RUN.q,round=x=>Math.round(x*FPS)/FPS;
const demoPositions=Array.from({length:10},(_,i)=>[(i%5-2)*1.4,(i<5?1:-1)*.85,0,i/10]);
// Cuts are whole frames; each continuation begins at the exact preceding source time.
const floor30=x=>Math.floor(x*FPS)/FPS;
const compareFrom=2.5,compareRate=q*4,compareDur=floor30((RUN.main.stableFrom-compareFrom)/compareRate);
const growFrom=8.5,growRate=q*3.3,growDur=floor30((RUN.main.stableFrom-growFrom)/growRate);
const growEnd=growFrom+growDur*growRate;
const SCENES=[
{id:"hook",name:"1 · Hook: a later shared flash",dur:3,from:RUN.main.stableFrom+1-q*.3,rate:q,keys:["main"]},
{id:"intro",name:"2 · One light / 1,000 fireflies",dur:5,from:0,rate:q,keys:["main"]},
{id:"compare_fast",name:"3 · Same start, 4×",dur:compareDur,from:compareFrom,rate:compareRate,keys:["off","main"]},
{id:"compare_sync",name:"4 · In sync / scattered",dur:5,from:compareFrom+compareDur*compareRate,rate:q,keys:["off","main"]},
{id:"pulse",name:"5 · What one flash does",dur:11,from:.075,rate:q*.1,keys:["demo"],rings:true},   // first measured pulse at u=1.5 s, its cascade at u≈6 s
{id:"growing",name:"6 · Groups, 3.3×",dur:growDur,from:growFrom,rate:growRate,keys:["main"]},
{id:"sync",name:"7 · One shared pulse",dur:6,from:growEnd,rate:q,keys:["main"]},
{id:"local",name:"8 · Nearby links only",dur:20,from:0,rate:2.5,keys:["local"]},
{id:"close",name:"9 · Closing",dur:9,from:growEnd+3,rate:q,keys:["main"]}
];
let total=0;SCENES.forEach(s=>{s.start=total;total+=s.dur;s.end=total;});
const focus=RUN.reps.reduce((a,b)=>RUN.main.initial[a]>RUN.main.initial[b]?a:b);
function specimen(key){const r=RUN[key];if(key==="off")return{t:0,phi:Float64Array.from(r.initial),advanceTo(t){this.t=t;for(let i=0;i<this.phi.length;i++)this.phi[i]=(r.initial[i]+t)%1;return this;}};
 return M.makeSim({n:r.n,b:r.b,kappa:r.kappa,phases:r.initial,graph:r.graph});}
function eventBefore(events,t){let a=0,b=events.length;while(a<b){const m=(a+b)>>1;if(events[m].t<=t+1e-12)a=m+1;else b=m;}return a;}
function stateAt(key,t){const r=RUN[key],s=specimen(key);if(key!=="off"){let cp=r.checkpoints[0];for(const c of r.checkpoints){if(c.t<=t+1e-12)cp=c;else break;}s.restore(cp);}s.advanceTo(t);return s;}
function verified(key,t){const r=RUN[key];return r.verified&&r.stableFrom!==null&&t>=r.stableFrom-1e-10;}
function source(sc,u){return sc.from+u*sc.rate;}
// Display-only afterglow; no response before a measured flash.
const GLOW={decay:1.25,taperStart:1.0,duration:1.35};
function afterglow(age){if(age<0||age>=GLOW.duration)return 0;const tail=age<=GLOW.taperStart?1:Math.cos(Math.PI/2*(age-GLOW.taperStart)/(GLOW.duration-GLOW.taperStart))**2;return Math.exp(-age/GLOW.decay)*tail;}
function Runtime(scenes=SCENES){
 const R={sc:null,index:-1,u:0,worlds:[],t:0};
 R.at=t=>{
  t=Math.max(0,Math.min(scenes.at(-1).end-1/FPS,t));const i=scenes.findIndex(s=>t<s.end-1e-8),sc=scenes[i],u=t-sc.start,st=source(sc,u);
  if(i!==R.index){R.worlds.forEach(w=>w.stage.dispose());R.worlds=sc.keys.map(key=>({key,sim:stateAt(key,st),stage:W.makeWorld(key==="demo"?demoPositions:(sc.keys.length>1?RUN.positions.map(p=>[p[0]*.5,p[1],p[2],p[3]]):RUN.positions),{rings:sc.rings}),last:new Float64Array(RUN[key].n).fill(-1e9),cursor:0}));R.index=i;}
  R.sc=sc;R.u=u;R.t=t;
  for(const w of R.worlds){
   if(st<w.sim.t-1e-10)w.sim=stateAt(w.key,st);else w.sim.advanceTo(st);
   const events=RUN[w.key].events,wlast=w.last;wlast.fill(-1e9);
   const last=eventBefore(events,st),old=Math.max(0,eventBefore(events,st-Math.max(.5*sc.rate,GLOW.duration*Math.min(q,sc.rate)))-1);
   for(let e=old;e<last;e++)for(const k of events[e].ids)wlast[k]=events[e].t;
   const flash=Array.from(wlast,(v,k)=>{const age=Math.max(0,(st-v)/sc.rate);return v>-1e8?Math.exp(-age/.095)*((w.key==="demo"||RUN.reps.includes(k))?1.3:1):0;});
   const glowFlash=Array.from(wlast,(v,k)=>v>-1e8?afterglow(Math.max(0,(st-v)/Math.min(q,sc.rate)))*((w.key==="demo"||RUN.reps.includes(k))?1.3:1):0);
   w.st=st;w.stage.update(w.sim.phi,flash,t,sc.id==="intro"?{focus,others:Math.max(0,Math.min(1,(u-1.3)/.8)),closeWeight:(()=>{const p=Math.max(0,Math.min(1,(u-1.3)/3.7));return 1-p*p*(3-2*p);})()}:null,glowFlash);
  }return R;
 };return R;
}
function renderFrame(R,renderer,width,height){
 renderer.setScissorTest(true);const n=R.worlds.length;
 R.worlds.forEach((w,i)=>{
  const vw=width/n;let zoom=1,cx=.04*Math.sin(R.t*.2),cy=.035*Math.cos(R.t*.17);
  if(R.sc.id==="intro"){const p=Math.max(0,Math.min(1,(R.u-1.3)/3.7)),s=p*p*(3-2*p);zoom=Math.exp(Math.log(22)*(1-s));const hx=2.125/zoom*vw/height,hy=2.125/zoom,bx=Math.max(0,3.55-hx),by=Math.max(0,1.8-hy);cx=Math.max(-bx,Math.min(bx,RUN.positions[focus][0]));cy=Math.max(-by,Math.min(by,RUN.positions[focus][1]));}
  if(R.sc.id==="pulse"){const smooth=p=>{p=Math.max(0,Math.min(1,p));return p*p*(3-2*p);};
   const z=R.u<7.5?smooth((R.u-1.5)/2):1-smooth((R.u-7.5)/3);zoom=1+.6*z;cx=1.8*z;cy=0;
  }
  if(R.sc.id==="growing"){const p=R.u/R.sc.dur;zoom=1+.45*Math.sin(Math.PI*p);cx=.5*Math.sin(2*Math.PI*p);cy=.12*Math.sin(Math.PI*p);}
  w.stage.view(vw,height,zoom,cx,cy);renderer.setViewport(i*vw,0,vw,height);renderer.setScissor(i*vw,0,vw,height);renderer.render(w.stage.scene,w.stage.camera);
 });renderer.setScissorTest(false);
}
const FONT='"Bahnschrift","Segoe UI",sans-serif';
function labels(R){
 const sc=R.sc,u=R.u,key=sc.keys.at(-1),st=source(sc,u),r=RUN[key];
 if(sc.id==="hook")return verified("main",st)?["1,000 fireflies. One pulse."]:[];
 if(sc.id==="intro")return[u<1.65?"One firefly.":"1,000 of them. No leader."];
 if(sc.id.startsWith("compare"))return[verified("main",st)?"Same start. Different result.":"Same start. One difference."];
 if(sc.id==="pulse")return[u<1.5?"Ten lights. Same rule.":"A pulse advances the others."];
 if(sc.id==="sync"||sc.id==="close")return verified("main",st)?[sc.id==="close"?"A thousand lights. One pulse.":"One shared pulse."]:[];
 if(sc.id==="local")return[u<7?"Only nearby flashes interact.":u<13?"This run takes longer.":verified("local",st)?"They find the pulse, too.":"The groups are still forming."];
 const events=r.events,index=eventBefore(events,st),largest=Math.max(1,...events.slice(0,index).map(e=>e.ids.length));
 if(verified(key,st))return["One shared pulse."];
 return[largest<300?"Small groups form.":largest<800?"The groups grow.":"Almost one pulse."];

}
function drawOverlay(R,x,width,height){
 const k=height/1080;x.save();x.scale(k,k);const w=width/k;
 x.textAlign="center";x.textBaseline="middle";x.shadowColor="#020610";x.shadowBlur=18;x.shadowOffsetY=2;
 x.font="700 78px "+FONT;x.fillStyle="#F6F4D8";
 labels(R).forEach((s,i)=>x.fillText(s,w/2,84+i*83));
 if(R.sc.id==="intro"&&R.u>3.8){x.font="400 38px "+FONT;x.fillStyle="#B9C9B8";x.fillText("Pulse-coupled oscillator model",w/2,138);}
 if(R.sc.id==="hook"){x.font="600 34px "+FONT;x.fillStyle="#FFD25A";x.fillText("Later in this model",w/2,138);}
 if(R.sc.rate!==q){x.font="600 34px "+FONT;x.fillStyle="#FFD25A";x.textAlign="right";x.fillText((R.sc.rate/q).toFixed(1)+"× SPEED",w-40,34);}
 if(R.worlds.length===2){x.textAlign="center";x.font="600 38px "+FONT;x.fillStyle="#C8D9C5";x.fillText("No interaction",w/4,138);if(verified("main",source(R.sc,R.u))){x.font="700 44px "+FONT;x.fillStyle="#E8FF8A";x.fillText("In sync.",w*3/4,138);}else{x.fillText("Flashes interact",w*3/4,138);}x.shadowBlur=0;x.fillStyle="#26382E";x.fillRect(w/2-1,0,2,1080);}
 x.restore();
}
function timeline(scenes,ranges){
 const out=[];let offset=0;
 for(const [a,b] of ranges){
  for(const sc of scenes){const lo=Math.max(a,sc.start),hi=Math.min(b,sc.end);if(hi<=lo)continue;
   for(let side=0;side<sc.keys.length;side++){const key=sc.keys[side],r=RUN[key],reps=key==="demo"?Array.from({length:10},(_,i)=>i):RUN.reps;
    for(const ev of r.events){const v=sc.start+(ev.t-sc.from)/sc.rate;if(v<lo||v>=hi)continue;
     for(let k=0;k<reps.length;k++)if(ev.ids.includes(reps[k]))out.push({t:offset+v-a,k:Math.round(k*15/Math.max(1,reps.length-1)),side:sc.keys.length>1?(side?1:-1):0,id:reps[k],cluster:ev.ids.length,key});}
   }
  }offset+=b-a;
 }return{events:out.sort((a,b)=>a.t-b.t),duration:offset};
}
function audition(){const sc={id:"audition",name:"Sound reference",dur:30,from:RUN.main.stableFrom-10,rate:q,keys:["main"],start:0,end:30};return[sc];}
root.FireflyDirector={RUN,FPS,SCENES,total,q,focus,GLOW,afterglow,Runtime,renderFrame,drawOverlay,labels,source,stateAt,timeline,verified,audition};
})(window);
