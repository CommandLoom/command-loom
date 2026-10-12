// Flat firefly silhouette and event-driven light. Artwork never changes oscillator phases.
(function(root){
"use strict";
const T=root.THREE;
function backdrop(){
 const c=document.createElement("canvas");c.width=1920;c.height=1080;const x=c.getContext("2d"),g=x.createLinearGradient(0,0,0,1080);
 g.addColorStop(0,"#101C2C");g.addColorStop(.55,"#091522");g.addColorStop(1,"#0D1B20");x.fillStyle=g;x.fillRect(0,0,1920,1080);
 const rand=root.FireflySim.rng(92);x.filter="blur(8px)";
 for(let i=0;i<18;i++){const a=rand()*1920,w=6+rand()*18;x.strokeStyle=i%2?"#07141F":"#0A1921";x.lineWidth=w;x.beginPath();x.moveTo(a,1080);x.bezierCurveTo(a+35,760,a-30,250,a-15,0);x.stroke();
  for(let j=0;j<4;j++){const h=200+rand()*700,side=rand()<.5?-1:1;x.lineWidth=w*.4;x.beginPath();x.moveTo(a,h);x.quadraticCurveTo(a+side*50,h-40,a+side*150,h-90);x.stroke();}
 }
 x.filter="none";return new T.CanvasTexture(c);
}
function silhouette(){
 const c=document.createElement("canvas");c.width=c.height=512;const x=c.getContext("2d");
 // Two flat wings, a slim thorax and fine antennae; no shiny spherical parts.
 x.strokeStyle="#527147";x.lineWidth=3;x.lineCap="round";
 for(const sign of [-1,1]){x.beginPath();x.moveTo(256+sign*12,153);x.quadraticCurveTo(256+sign*32,100,256+sign*60,88);x.stroke();
  x.fillStyle="#253725";x.beginPath();x.moveTo(256+sign*12,213);x.bezierCurveTo(256+sign*95,156,256+sign*164,184,256+sign*136,286);x.bezierCurveTo(256+sign*103,351,256+sign*45,306,256+sign*13,247);x.closePath();x.fill();x.stroke();
  x.strokeStyle="#395534";x.lineWidth=2;x.beginPath();x.moveTo(256+sign*20,222);x.quadraticCurveTo(256+sign*70,245,256+sign*120,296);x.stroke();x.strokeStyle="#527147";x.lineWidth=3;
 }
 x.fillStyle="#192817";x.beginPath();x.ellipse(256,249,23,63,0,0,Math.PI*2);x.fill();
 x.fillStyle="#31452A";x.beginPath();x.ellipse(256,171,21,23,0,0,Math.PI*2);x.fill();
 x.fillStyle="#7B853B";x.beginPath();x.ellipse(256,347,26,42,0,0,Math.PI*2);x.fill();
 return new T.CanvasTexture(c);
}
function bodyAlpha(flash,close=0,rings=false){return Math.min(.95,(rings ? .38 : .002)+Math.max(0,Math.min(1,close))*.848+Math.max(0,flash)*.6);}
function makeWorld(positions,options={}){
 const n=positions.length,scene=new T.Scene(),camera=new T.OrthographicCamera(-3.78,3.78,2.125,-2.125,.1,40);camera.position.z=12;
 const bg=new T.Mesh(new T.PlaneGeometry(18,10),new T.MeshBasicMaterial({map:backdrop()}));bg.position.z=-2;scene.add(bg);
 const bodyGeo=new T.PlaneGeometry(.10,.13),alphas=new Float32Array(n);
 bodyGeo.setAttribute("bodyOpacity",new T.InstancedBufferAttribute(alphas,1));
 const bodyMat=new T.MeshBasicMaterial({map:silhouette(),transparent:true,depthWrite:false,side:T.DoubleSide});
 bodyMat.onBeforeCompile=sh=>{
  sh.vertexShader="attribute float bodyOpacity;varying float vBodyOpacity;\n"+sh.vertexShader;
  sh.vertexShader=sh.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nvBodyOpacity=bodyOpacity;");
  sh.fragmentShader="varying float vBodyOpacity;\n"+sh.fragmentShader;
  sh.fragmentShader=sh.fragmentShader.replace("#include <color_fragment>","#include <color_fragment>\ndiffuseColor.a*=vBodyOpacity;");
 };
 const body=new T.InstancedMesh(bodyGeo,bodyMat,n),dummy=new T.Object3D();body.frustumCulled=false;body.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(body);
 const glowGeo=new T.BufferGeometry(),pos=new Float32Array(n*3),cols=new Float32Array(n*3),intens=new Float32Array(n);
 glowGeo.setAttribute("position",new T.BufferAttribute(pos,3));glowGeo.setAttribute("color",new T.BufferAttribute(cols,3));glowGeo.setAttribute("intensity",new T.BufferAttribute(intens,1));
 const warm=new T.Color("#E8FF8A"),gold=new T.Color("#FFD25A"),tmp=new T.Color();
 for(let i=0;i<n;i++){pos.set([positions[i][0],positions[i][1]-.023,.1],i*3);tmp.copy(warm).lerp(gold,i/Math.max(1,n-1));cols.set([tmp.r,tmp.g,tmp.b],i*3);}
 const material=new T.ShaderMaterial({uniforms:{pixelSize:{value:44}},
 vertexShader:"attribute float intensity;attribute vec3 color;varying vec3 c;varying float a;uniform float pixelSize;void main(){c=color;a=intensity;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=pixelSize;}",
 fragmentShader:"varying vec3 c;varying float a;void main(){float r=length(gl_PointCoord-vec2(.5));if(r>.5)discard;float halo=exp(-r*r*15.);float core=1.-smoothstep(.05,.105,r);gl_FragColor=vec4(c,a*(halo*.5+core*.85));}",
 transparent:true,blending:T.AdditiveBlending,depthTest:false,depthWrite:false});
 const glow=new T.Points(glowGeo,material);glow.frustumCulled=false;scene.add(glow);
 const linkGeo=new T.BufferGeometry(),linkPos=new Float32Array(Math.max(1,n-1)*6);linkGeo.setAttribute("position",new T.BufferAttribute(linkPos,3));
 const link=new T.LineSegments(linkGeo,new T.LineBasicMaterial({color:"#D5F6A2",transparent:true,opacity:.3,blending:T.AdditiveBlending,depthTest:false}));
 if(options.rings)scene.add(link);
 const rings=[];
 if(options.rings)for(let i=0;i<n;i++){const l=new T.Mesh(new T.RingGeometry(.355,.367,64),new T.MeshBasicMaterial({color:"#E3F7A0",transparent:true,opacity:.85,side:T.DoubleSide}));l.position.set(positions[i][0],positions[i][1],.12);scene.add(l);rings.push(l);
  const ghost=new T.Mesh(new T.RingGeometry(.355,.367,64),new T.MeshBasicMaterial({color:"#557367",transparent:true,opacity:.3,side:T.DoubleSide}));ghost.position.copy(l.position);scene.add(ghost);}
 function update(phi,flashes,t,isolation=null,glowFlashes=flashes){
  for(let i=0;i<n;i++){const[x,y,,angle]=positions[i],mask=isolation&&i!==isolation.focus?isolation.others:1,scale=(options.rings?4.5:1)*mask,flash=flashes[i]??0;
   dummy.position.set(x,y,.02);dummy.scale.set(scale,scale,1);dummy.rotation.set(0,0,(angle-.5)*.3);dummy.updateMatrix();body.setMatrixAt(i,dummy.matrix);
   alphas[i]=bodyAlpha(flash,isolation&&i===isolation.focus?isolation.closeWeight:0,options.rings)*mask;
   intens[i]=(glowFlashes[i]??0)*mask;pos[i*3+1]=y-.023*scale;
   if(rings.length)rings[i].geometry.setDrawRange(0,Math.max(0,Math.floor(phi[i]*64))*6);
  }
  if(options.rings){const f=flashes.indexOf(Math.max(...flashes));let j=0;for(let i=0;i<n;i++)if(i!==f){linkPos.set([positions[f][0],positions[f][1],.13,positions[i][0],positions[i][1],.13],j*6);j++;}linkGeo.attributes.position.needsUpdate=true;link.material.opacity=.32*Math.max(...flashes);}
  body.instanceMatrix.needsUpdate=true;bodyGeo.attributes.bodyOpacity.needsUpdate=true;glowGeo.attributes.intensity.needsUpdate=true;glowGeo.attributes.position.needsUpdate=true;
 }
 function view(width,height,zoom=1,cx=0,cy=0){const half=2.125/zoom;camera.left=cx-half*width/height;camera.right=cx+half*width/height;camera.top=cy+half;camera.bottom=cy-half;camera.updateProjectionMatrix();material.uniforms.pixelSize.value=Math.min(250,44*Math.sqrt(zoom))*height/1080;}
 function dispose(){scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});if(!options.rings){linkGeo.dispose();link.material.dispose();}}
 return{scene,camera,update,view,dispose,n};
}
root.FireflyWorld={makeWorld,bodyAlpha};
})(window);
