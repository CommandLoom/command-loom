"use strict";
const assert = require("assert"), fs = require("fs"), path = require("path"), M = require("./sim.js");
let passed = 0;
function test(name, f) { f(); passed++; console.log("PASS " + name); }
function close(a, b, tol, msg) { assert(Math.abs(a - b) <= tol, msg || `${a} != ${b}`); }
const p = M.parameters({});
test("stationary equilibrium and valid inputs", () => {
  const s = M.makeSim({ n: 3, epsilon: 0, initial: { theta1: 0, theta2: 0, omega1: 0, omega2: 0 } }).advance(10);
  for (const k of ["theta1", "theta2", "omega1", "omega2"]) assert([...s[k]].every(x => x === 0));
  assert.throws(() => M.makeSim({ l1: 0 })); assert.throws(() => M.makeSim({ n: 0 }));
});
test("published Lagrangian matches an independent numerical Euler–Lagrange calculation", () => {
  const q = [.7, -.3], v = [1.2, -2.1], d = 1e-4;
  // Momentum and dL/dq are independently calculated from T-V by centered differences.
  const lag = (q, v) => M.energy(q[0], q[1], v[0], v[1], p) +
    2 * ((p.m1+p.m2)*p.g*p.l1*Math.cos(q[0]) + p.m2*p.g*p.l2*Math.cos(q[1]));
  function gradV(q, v, k) { const plus=v.slice(), minus=v.slice(); plus[k]+=d; minus[k]-=d;
    return (lag(q,plus)-lag(q,minus))/(2*d); }
  const A = [], rhs = [];
  for (let i=0;i<2;i++) {
    A[i]=[];
    for(let j=0;j<2;j++) { const vp=v.slice(),vm=v.slice();vp[j]+=d;vm[j]-=d;
      A[i][j]=(gradV(q,vp,i)-gradV(q,vm,i))/(2*d); }
    const qp=q.slice(),qm=q.slice();qp[i]+=d;qm[i]-=d;
    const Lq=(lag(qp,v)-lag(qm,v))/(2*d);
    let convective=0;
    for(let j=0;j<2;j++) {const qp=q.slice(),qm=q.slice();qp[j]+=d;qm[j]-=d;
      convective+=(gradV(qp,v,i)-gradV(qm,v,i))/(2*d)*v[j];}
    rhs[i]=Lq-convective;
  }
  const det=A[0][0]*A[1][1]-A[0][1]*A[1][0], ref=[(rhs[0]*A[1][1]-rhs[1]*A[0][1])/det,(rhs[1]*A[0][0]-rhs[0]*A[1][0])/det];
  const actual=M.acceleration(...q,...v,p);
  close(actual[0],ref[0],2e-5); close(actual[1],ref[1],2e-5);
});
test("initial perturbation, equal parameters and physical units", () => {
  const s=M.makeSim({seed:7});
  close(s.theta1[999]-s.theta1[0],999e-9,1e-15);
  for(let i=1;i<s.n;i++){close(s.theta1[i]-s.theta1[i-1],1e-9,1e-15);assert(s.theta2[i]===s.theta2[0]);}
  assert(s.p.l1===1&&s.p.l2===1&&s.p.m1===1&&s.p.m2===1); close(s.p.g,9.80665,0);
});
test("same seed and differently chunked time have identical trajectories", () => {
  const a=M.makeSim({n:12,seed:4}).advance(4),b=M.makeSim({n:12,seed:4});
  for(let i=0;i<120;i++)b.advance(1/30);
  for(const k of ["theta1","theta2","omega1","omega2"])assert.deepStrictEqual(a[k],b[k]);
  assert(M.makeSim({seed:5}).theta1[0]!==a.base.theta1);
});
test("1,000 identical starts remain identical at every integration step", () => {
  const s=M.makeSim({n:1000,seed:7,epsilon:0});
  for(let j=0;j<3600;j++){s.step();for(const k of ["theta1","theta2","omega1","omega2"])
    for(let i=1;i<s.n;i++)assert(s[k][i]===s[k][0]);}
  assert(s.spread()<1e-13);
});
test("conservative energy derivative, mirror symmetry and mass-scale invariance", () => {
  const x=[1.1,-.4,.7,-1.3],acc=M.acceleration(...x,p), deriv=[x[2],x[3],...acc],dh=1e-6;
  const plus=x.map((v,i)=>v+dh*deriv[i]),minus=x.map((v,i)=>v-dh*deriv[i]);
  close((M.energy(...plus,p)-M.energy(...minus,p))/(2*dh),0,1e-7);
  const mirror=M.acceleration(...x.map(v=>-v),p);close(acc[0],-mirror[0],1e-13);close(acc[1],-mirror[1],1e-13);
  const heavy=M.acceleration(...x,{...p,m1:2,m2:2});close(heavy[0],acc[0],1e-13);close(heavy[1],acc[1],1e-13);
});
test("RK4 fourth-order convergence on a short reference interval", () => {
  const ds=[1/60,1/120,1/240,1/1920],ss=ds.map(dt=>M.makeSim({n:1,seed:2,dt}).advance(2));
  const error=s=>Math.hypot(...["theta1","theta2","omega1","omega2"].map(k=>s[k][0]-ss[3][k][0]));
  const es=ss.slice(0,3).map(error); assert(es[0]/es[1]>10&&es[1]/es[2]>10,JSON.stringify(es));
});
test("downward-vertical crossings exclude upward vertical and preserve event time", () => {
  const small={theta1:.15,theta2:.05,omega1:0,omega2:0};
  const a=M.makeSim({n:1,initial:small,dt:1/600}),b=M.makeSim({n:1,initial:small,dt:1/1200}),ea=[],eb=[];
  a.onCrossing=e=>ea.push(e);b.onCrossing=e=>eb.push(e);a.advance(5);b.advance(5);
  assert(ea.length>4&&ea.length===eb.length);
  ea.sort((a,b)=>a.t-b.t||a.rod-b.rod);eb.sort((a,b)=>a.t-b.t||a.rod-b.rod);
  ea.forEach((e,i)=>{assert(e.rod===eb[i].rod&&e.t>0&&e.t<=5);close(e.t,eb[i].t,2e-6);});
  // Large unwrapped angle near pi is upward vertical: it must not create a sound event.
  const up=M.makeSim({n:1,epsilon:0,initial:{theta1:Math.PI-.001,theta2:Math.PI,omega1:1,omega2:0}}),events=[];
  up.onCrossing=e=>events.push(e);up.advance(.01);assert(!events.some(e=>e.rod===1));
});
const file=path.join(__dirname,"seeds.json");
if(fs.existsSync(file)){
  const run=JSON.parse(fs.readFileSync(file,"utf8").replace(/^\uFEFF/,""));
  test("selected full-population thresholds converge; measured horizon covers every scene",()=>{
    assert(run.count===1000&&run.epsilon===1e-9&&run.dt===M.DT);
    assert(run.smallAt>0&&run.largeAt>run.smallAt);
    assert(run.refinement.maxRelativeThresholdError<.05);
    assert(run.maxEnergyDrift<1e-4&&run.endTime>=run.largeAt+100*run.referencePeriod-1e-6);
  });
  test("late-time ensemble statistics agree after timestep refinement",()=>{
    function stats(dt){
      const s=M.makeSim({n:96,seed:run.seed,span:(run.count-1)*run.epsilon,dt});
      const hx=Array(10).fill(0),hy=Array(10).fill(0);let x=0,y=0,r2=0,n=0;
      for(let f=1;f<=Math.floor(run.endTime*10);f++){
        s.advanceTo(f/10);if(s.t<run.endTime-30)continue;
        for(let i=0;i<s.n;i++){
          const a=M.endpoint(s.theta1[i],s.theta2[i],s.p),xx=a[0]/2,yy=a[1]/2;
          x+=xx;y+=yy;r2+=xx*xx+yy*yy;n++;
          hx[Math.max(0,Math.min(9,Math.floor((xx+1)*5)))]++;
          hy[Math.max(0,Math.min(9,Math.floor((yy+1)*5)))]++;
        }
      }
      return {x:x/n,y:y/n,r2:r2/n,hx:hx.map(v=>v/n),hy:hy.map(v=>v/n),samples:n};
    }
    const coarse=stats(M.DT),fine=stats(M.DT/2),tv=k=>.5*coarse[k].reduce((z,v,i)=>z+Math.abs(v-fine[k][i]),0);
    const result={coarse:{x:coarse.x,y:coarse.y,r2:coarse.r2},fine:{x:fine.x,y:fine.y,r2:fine.r2},
      xTotalVariation:tv("hx"),yTotalVariation:tv("hy"),samplesPerRun:coarse.samples};
    console.log("LATE STATISTICS "+JSON.stringify(result));
    assert(Math.abs(coarse.x-fine.x)<.05&&Math.abs(coarse.y-fine.y)<.05&&Math.abs(coarse.r2-fine.r2)<.05);
    assert(tv("hx")<.15&&tv("hy")<.15);
  });
  test("manifest thresholds reproduce with all 1,000 systems",()=>{
    const s=M.makeSim({seed:run.seed});let a=null,b=null;
    for(let f=1;f<=Math.ceil((run.largeAt+.1)*30);f++){s.advanceTo(f/30);const d=s.spread();
      if(a===null&&d>=.01)a=s.t;if(b===null&&d>=.25)b=s.t;}
    close(a,run.smallAt,1e-9);close(b,run.largeAt,1e-9);
  });
}
console.log(`\n${passed} tests passed.`);
