// Display-only geometry; all positions and RMS measurements originate in sim.js.
(function(root){
"use strict";
const T=root.THREE, SCALE=16000, HALF=2/.88;
function makeWorld(){
 const scene=new T.Scene();scene.background=new T.Color("#070C16");
 const camera=new T.OrthographicCamera(-HALF*16/9,HALF*16/9,HALF,-HALF,.1,30);camera.position.z=10;
 const count=1000, colors=new Float32Array(count*3), c=new T.Color();
 const stops=["#22D9F2","#FFBD38","#EF4CAB"].map(s=>new T.Color(s));
 for(let i=0;i<count;i++){const u=i/(count-1)*2,k=Math.min(1,Math.floor(u));c.copy(stops[k]).lerp(stops[k+1],u-k);colors.set([c.r,c.g,c.b],i*3);}
 const colorAttr=new T.InstancedBufferAttribute(colors,3);
 const vertex=String.raw`
 attribute vec4 ends;attribute vec3 identity;
 uniform vec2 viewport;uniform float pixels;uniform float rod;
 varying vec3 shade;
 void main(){
 vec2 a=rod<.5?vec2(0.):ends.xy/16000.;
 vec2 b=rod<.5?ends.xy/16000.:ends.zw/16000.;
 vec4 ca=projectionMatrix*modelViewMatrix*vec4(a,0.,1.);
 vec4 cb=projectionMatrix*modelViewMatrix*vec4(b,0.,1.);
 vec2 delta=(cb.xy-ca.xy)*viewport;
 vec2 norm=length(delta)>.000001?normalize(vec2(-delta.y,delta.x)):vec2(0.,1.);
 gl_Position=mix(ca,cb,position.x);
 gl_Position.xy+=norm*position.y*pixels/viewport;
 shade=identity;
 }`;
 const fragment="varying vec3 shade;uniform float alpha;void main(){gl_FragColor=vec4(shade,alpha);}";
 const rods=[];
 for(let r=0;r<2;r++){
  const g=new T.InstancedBufferGeometry();
  g.setAttribute("position",new T.Float32BufferAttribute([0,-1,0,1,-1,0,1,1,0,0,-1,0,1,1,0,0,1,0],3));
  g.setAttribute("identity",colorAttr);g.setAttribute("ends",new T.InstancedBufferAttribute(new Int16Array(count*4),4));g.instanceCount=count;
  const m=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{viewport:{value:new T.Vector2(1920,1080)},pixels:{value:2.6},rod:{value:r},alpha:{value:.12}},transparent:true,depthTest:false,depthWrite:false,blending:T.AdditiveBlending});
  const mesh=new T.Mesh(g,m);mesh.frustumCulled=false;scene.add(mesh);rods.push(mesh);
 }
 const pointGeo=new T.BufferGeometry(), pointPos=new Float32Array(count*6),pointColors=new Float32Array(count*6);
 for(let i=0;i<count;i++){pointColors.set(colors.subarray(i*3,i*3+3),i*6);pointColors.set(colors.subarray(i*3,i*3+3),i*6+3);}
 pointGeo.setAttribute("position",new T.BufferAttribute(pointPos,3));pointGeo.setAttribute("color",new T.BufferAttribute(pointColors,3));
 const points=new T.Points(pointGeo,new T.PointsMaterial({size:5,sizeAttenuation:false,vertexColors:true,opacity:.22,transparent:true,depthTest:false,depthWrite:false,blending:T.AdditiveBlending}));points.material.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace("#include <color_fragment>","#include <color_fragment>\nif(length(gl_PointCoord-vec2(.5))>.5) discard;");};points.frustumCulled=false;scene.add(points);
 const trailGeo=new T.BufferGeometry(),trailPos=new Float32Array(count*7*6),trailColors=new Float32Array(count*7*6);
 for(let j=0;j<7;j++)for(let i=0;i<count;i++)for(let k=0;k<2;k++)for(let q=0;q<3;q++)trailColors[(j*count+i)*6+k*3+q]=colors[i*3+q]*(1-j/8);
 trailGeo.setAttribute("position",new T.BufferAttribute(trailPos,3));trailGeo.setAttribute("color",new T.BufferAttribute(trailColors,3));
 const trail=new T.LineSegments(trailGeo,new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.025,blending:T.AdditiveBlending,depthTest:false,depthWrite:false}));trail.frustumCulled=false;scene.add(trail);trail.renderOrder=-1;
 // faint centre line through the pivot: a note sounds when a bob crosses it
 const guide=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0,-HALF*1.3,-.02),new T.Vector3(0,HALF*1.3,-.02)]),new T.LineBasicMaterial({color:"#33465F",transparent:true,opacity:.7,depthTest:false,depthWrite:false}));guide.renderOrder=-2;scene.add(guide);
 // flashes: the bob of a representative pendulum glows briefly when its note sounds (display only)
 const FL=64,flashGeo=new T.BufferGeometry(),flashPos=new Float32Array(FL*3),flashCol=new Float32Array(FL*3);
 flashGeo.setAttribute("position",new T.BufferAttribute(flashPos,3));flashGeo.setAttribute("color",new T.BufferAttribute(flashCol,3));flashGeo.setDrawRange(0,0);
 const flashes=new T.Points(flashGeo,new T.PointsMaterial({size:44,sizeAttenuation:false,vertexColors:true,transparent:true,depthTest:false,depthWrite:false,blending:T.AdditiveBlending}));
 flashes.material.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace("#include <color_fragment>","#include <color_fragment>\nfloat fd=length(gl_PointCoord-vec2(.5));if(fd>.5)discard;diffuseColor.rgb*=pow(1.-fd*2.,1.6);");};
 flashes.frustumCulled=false;flashes.renderOrder=5;scene.add(flashes);
 function flash(list){const n=Math.min(FL,list.length);for(let i=0;i<n;i++){const f=list[i],ci=f.index*3,a=f.a;flashPos.set([f.x,f.y,.02],i*3);flashCol.set([(colors[ci]*.6+.4)*a,(colors[ci+1]*.6+.4)*a,(colors[ci+2]*.6+.4)*a],i*3);}
  flashGeo.setDrawRange(0,n);flashGeo.attributes.position.needsUpdate=true;flashGeo.attributes.color.needsUpdate=true;}
 const pivot=new T.Mesh(new T.CircleGeometry(.022,32),new T.MeshBasicMaterial({color:"#F6F4EE",depthTest:false}));pivot.position.z=.1;scene.add(pivot);
 function aspect(a,w,h){camera.left=-HALF*a;camera.right=HALF*a;camera.updateProjectionMatrix();for(const rod of rods){rod.material.uniforms.viewport.value.set(w,h);rod.material.uniforms.pixels.value=2.6*h/1080;}points.material.size=5*h/1080;flashes.material.size=44*h/1080;}
 function record(frame,history){
  for(const rod of rods){const attr=rod.geometry.attributes.ends;attr.array.set(frame);attr.needsUpdate=true;}
  for(let i=0;i<count;i++){const p=i*4;pointPos.set([frame[p]/SCALE,frame[p+1]/SCALE,.01,frame[p+2]/SCALE,frame[p+3]/SCALE,.01],i*6);}
  pointGeo.attributes.position.needsUpdate=true;
  for(let j=0;j<7;j++){const a=history[j]||frame,b=history[j+1]||a;for(let i=0;i<count;i++){const p=i*4;trailPos.set([a[p+2]/SCALE,a[p+3]/SCALE,-.01,b[p+2]/SCALE,b[p+3]/SCALE,-.01],(j*count+i)*6);}}
  trailGeo.attributes.position.needsUpdate=true;
 }
 function dispose(){scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});}
 function alpha(v){for(const rod of rods)rod.material.uniforms.alpha.value=v;}
 return{scene,camera,aspect,record,flash,alpha,dispose};
}
root.PendulumWorld={makeWorld,HALF};
})(window);
