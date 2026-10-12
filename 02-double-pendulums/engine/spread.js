// Presentation measurement only. sim.js is deliberately unchanged.
(function(root){
"use strict";
function meters(sim){return sim.spread()*(sim.p.l1+sim.p.l2);}
function initialDiameter(sim){
  if(!sim.theta2.every(v=>v===sim.theta2[0]))throw new Error("Initial-diameter formula needs equal lower angles");
  let lo=Infinity,hi=-Infinity;for(const a of sim.theta1){lo=Math.min(lo,a);hi=Math.max(hi,a);}
  if(hi-lo>Math.PI)throw new Error("Initial arc too large for endpoint diameter");
  return 2*sim.p.l1*Math.sin((hi-lo)/2);
}
function format(m){
 const units=m<1e-8?[1e9,"nm"]:m<1e-3?[1e6,"µm"]:m<1e-2?[1e3,"mm"]:m<1?[1e2,"cm"]:[1,"m"];
 const value=m*units[0],digits=value>=100?0:value>=10?1:2;
 return value.toFixed(digits)+" "+units[1];
}
const api={meters,initialDiameter,format};root.SpreadMeasure=api;if(typeof module!=="undefined")module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
