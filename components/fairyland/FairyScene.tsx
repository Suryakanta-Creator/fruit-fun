"use client";

import { RefObject, useEffect, useRef } from "react";
import * as THREE from "three";

type Props = { root: RefObject<HTMLDivElement | null>; paused: boolean; onReady: () => void; onFallback: () => void };
const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment = `
 uniform sampler2D image; uniform float time; uniform float motion; uniform float progress; varying vec2 vUv;
 void main(){
  vec2 uv=vUv; vec3 original=texture2D(image,uv).rgb;
  float green=smoothstep(.01,.13,original.g-original.r);
  float sides=smoothstep(.18,.49,abs(uv.x-.5));
  float canopy=smoothstep(.53,.9,uv.y);
  uv.x+=motion*(sides*canopy*.0018+green*.0012)*sin(time*.7+uv.y*15.);
  uv.y+=motion*canopy*sides*.0012*cos(time*.9+uv.x*12.);
  float water=(1.-smoothstep(.15,.35,abs(uv.x-.48)))*(1.-smoothstep(.3,.5,uv.y));
  uv.x+=motion*water*sin(uv.y*150.-time*1.6)*.0015;
  uv.y+=motion*water*sin(uv.x*70.+time*.8)*.0008;
  vec3 color=texture2D(image,uv).rgb;
  color=mix(color,color*vec3(.72,.81,1.08),progress*.30);
  float shimmer=pow(max(0.,sin(uv.y*180.-time*1.2)*sin(uv.x*120.+time*.5)),12.);
  color+=water*shimmer*.05*motion;
  gl_FragColor=vec4(color,1.);
  #include <colorspace_fragment>
 }`;

export default function FairyScene({ root, paused, onReady, onFallback }: Props) {
 const canvas = useRef<HTMLCanvasElement>(null);
 const pauseRef = useRef(paused);
 useEffect(() => { pauseRef.current = paused; }, [paused]);
 useEffect(() => {
  const el=canvas.current, journey=root.current;
  if(!el || !journey) return;
  let renderer: THREE.WebGLRenderer;
  try {renderer=new THREE.WebGLRenderer({canvas:el,alpha:true,antialias:true,powerPreference:"high-performance"});} catch {onFallback();return;}
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(42,1,.1,100); camera.position.z=10;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const textures:THREE.Texture[]=[];
  let disposed=false;
  const texture=new THREE.TextureLoader().load("/images/sakura-sanctuary.webp",()=>{if(!disposed)onReady();},undefined,()=>{if(!disposed)onFallback();});
  texture.colorSpace=THREE.SRGBColorSpace; textures.push(texture);
  const backgroundGeometry=new THREE.PlaneGeometry(36,24);
  const backgroundMaterial=new THREE.ShaderMaterial({uniforms:{image:{value:texture},time:{value:0},motion:{value:1},progress:{value:0}},vertexShader:vertex,fragmentShader:fragment});
  const backdrop=new THREE.Mesh(backgroundGeometry,backgroundMaterial); backdrop.position.z=-12; scene.add(backdrop);
  // Separate world-space petals create parallax as the camera travels through them.
  const petalShape=new THREE.Shape();petalShape.moveTo(0,-.07);petalShape.bezierCurveTo(-.12,-.02,-.10,.12,0,.09);petalShape.bezierCurveTo(.10,.12,.12,-.02,0,-.07);
  const petalGeometry=new THREE.ShapeGeometry(petalShape);
  const petalMaterials=[0xffd4df,0xf9aabd,0xffe9df].map(color=>new THREE.MeshStandardMaterial({color,side:THREE.DoubleSide,roughness:.85}));
  const petals=Array.from({length:75},(_,i)=>{
   const mesh=new THREE.Mesh(petalGeometry,petalMaterials[i%3]);
   const seed=(n:number)=>{const x=Math.sin(i*127.1+n*311.7)*43758.5453;return x-Math.floor(x);};
   const data={x:(seed(1)-.5)*22,y:(seed(2)-.5)*15,z:seed(3)*12-5,speed:.18+seed(4)*.28,phase:seed(5)*Math.PI*2};
   mesh.position.set(data.x,data.y,data.z);mesh.scale.setScalar(.4+seed(6)*.7);scene.add(mesh);return {mesh,...data};
  });
  scene.add(new THREE.HemisphereLight(0xffe4df,0x537c72,2.8));
  const sun=new THREE.DirectionalLight(0xffe5b8,3); sun.position.set(4,8,8);scene.add(sun);
  // Paper lanterns are lit geometric objects, with ribs, caps and trailing tassels.
  const lanterns: {group:THREE.Group; x:number;y:number;z:number;phase:number}[]=[];
  const paper=new THREE.MeshStandardMaterial({color:0xffe0ad,emissive:0xff9f35,emissiveIntensity:.75,roughness:1});
  const dark=new THREE.MeshStandardMaterial({color:0x553829,roughness:1});
  const bodyGeometry=new THREE.SphereGeometry(.24,24,16);const capGeometry=new THREE.CylinderGeometry(.13,.13,.045,16);const ribGeometry=new THREE.TorusGeometry(.24,.004,4,32);const threadGeometry=new THREE.CylinderGeometry(.004,.004,1,4);
  for(let i=0;i<7;i++){
   const group=new THREE.Group();const body=new THREE.Mesh(bodyGeometry,paper);body.scale.y=1.3;group.add(body);
   for(const y of [-.28,.28]){const cap=new THREE.Mesh(capGeometry,dark);cap.position.y=y;group.add(cap);}
   for(const y of [-.16,0,.16]){const rib=new THREE.Mesh(ribGeometry,dark);rib.rotation.x=Math.PI/2;rib.position.y=y;rib.scale.setScalar(Math.sqrt(1-(y/.34)**2));group.add(rib);}
   const thread=new THREE.Mesh(threadGeometry,dark);thread.position.y=.79;group.add(thread);
   const tassel=new THREE.Mesh(threadGeometry,paper);tassel.scale.y=.22;tassel.position.y=-.42;group.add(tassel);
   const x=(i%2===0?-1:1)*(4.7+(i%3)*1.3),y=1.5+(i%3)*1.1,z=-3+(i%4)*1.5;
   group.position.set(x,y,z);group.scale.setScalar(.7+(i%3)*.25);scene.add(group);lanterns.push({group,x,y,z,phase:i*1.7});
  }
  const fireflyGeometry=new THREE.BufferGeometry();const positions=new Float32Array(90);
  for(let i=0;i<90;i++) positions[i]=Math.sin(i*47.5)*((i%3===2)?4:8);
  fireflyGeometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
  const fireflyMaterial=new THREE.PointsMaterial({color:0xffe5ab,size:.035,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false});
  const fireflies=new THREE.Points(fireflyGeometry,fireflyMaterial);scene.add(fireflies);
  let frame=0,time=0,last=0,target=0,current=0,visible=!document.hidden,inView=true;
  const pointer=new THREE.Vector2(),smoothPointer=new THREE.Vector2();
  function resize(){if(!el)return;const w=el.clientWidth,h=el.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,w<700?1.3:1.7,Math.sqrt(5000000/(w*h))));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const visibleH=2*Math.tan(THREE.MathUtils.degToRad(21))*22;const imageAspect=1672/941;const visibleW=visibleH*camera.aspect;const height=Math.max(visibleH,visibleW/imageAspect)*1.12;backdrop.scale.set(height*imageAspect/36,height/24,1);}
  function scroll(){target=THREE.MathUtils.clamp((window.scrollY-journey!.offsetTop)/(journey!.offsetHeight-innerHeight),0,1);}
  function move(e:PointerEvent){pointer.set(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5);}
  function render(now:number){frame=0;if(disposed||!visible||!inView)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;
   const moving=!pauseRef.current&&!reduced.matches; if(moving)time+=dt;
   current=THREE.MathUtils.damp(current,target,reduced.matches?100:3,dt||.016);smoothPointer.lerp(pointer,.025);
   const drift=moving?1:0;
   camera.position.set(Math.sin(current*Math.PI*1.5)*.9+smoothPointer.x*.12*drift,.12+Math.sin(current*Math.PI)*.3+smoothPointer.y*.06*drift,10-current*1.8);
   camera.lookAt(Math.sin(current*Math.PI)*.25,0,-10);camera.rotation.z=Math.sin(time*.14)*.002*drift;
   backgroundMaterial.uniforms.time.value=time;backgroundMaterial.uniforms.motion.value=moving?1:0;backgroundMaterial.uniforms.progress.value=current;
   petals.forEach(p=>{p.mesh.position.set(p.x+Math.sin(time*.32+p.phase)*.9,((p.y-time*p.speed+30)%15+15)%15-7.5,p.z);p.mesh.rotation.set(time*.4+p.phase,time*.3+p.phase,Math.sin(time*.7+p.phase));});
   lanterns.forEach(l=>{l.group.position.set(l.x+Math.sin(time*.45+l.phase)*.12,l.y+Math.sin(time*.35+l.phase)*.08,l.z);l.group.rotation.z=Math.sin(time*.5+l.phase)*.055;});
   fireflies.rotation.y=time*.025;fireflies.position.y=Math.sin(time*.3)*.18;fireflyMaterial.opacity=.5+Math.sin(time*.8)*.2;
   journey!.style.setProperty("--journey",String(current));
   renderer.render(scene,camera);frame=requestAnimationFrame(render);
  }
  function resume(){if(!frame&&visible&&inView&&!disposed){last=0;frame=requestAnimationFrame(render);}}
  function visibility(){visible=!document.hidden;resume();}
  function lost(e:Event){e.preventDefault();cancelAnimationFrame(frame);frame=0;onFallback();}
  const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;resume();});observer.observe(el);
  const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(el);
  window.addEventListener("scroll",scroll,{passive:true});window.addEventListener("pointermove",move,{passive:true});document.addEventListener("visibilitychange",visibility);el.addEventListener("webglcontextlost",lost);
  resize();scroll();resume();
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();sizeObserver.disconnect();window.removeEventListener("scroll",scroll);window.removeEventListener("pointermove",move);document.removeEventListener("visibilitychange",visibility);el.removeEventListener("webglcontextlost",lost);backgroundGeometry.dispose();backgroundMaterial.dispose();petalGeometry.dispose();petalMaterials.forEach(m=>m.dispose());bodyGeometry.dispose();capGeometry.dispose();ribGeometry.dispose();threadGeometry.dispose();paper.dispose();dark.dispose();fireflyGeometry.dispose();fireflyMaterial.dispose();textures.forEach(t=>t.dispose());renderer.dispose();};
 },[root,onReady,onFallback]);
 return <canvas ref={canvas} className="fairy-canvas" aria-label="Animated Japanese garden with drifting cherry blossoms, swaying paper lanterns and a slowly moving camera"/>;
}
