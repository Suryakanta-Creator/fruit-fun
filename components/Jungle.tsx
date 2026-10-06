"use client";

import { RefObject, useEffect, useRef } from "react";
import * as THREE from "three";

type Props = { journey: RefObject<HTMLDivElement | null>; onSelect: (index: number) => void; onActive: (index: number | null) => void; onReady: () => void; onUnavailable: () => void };
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export default function Jungle({ journey, onSelect, onActive, onReady, onUnavailable }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current || !journey.current) return;
    const element = canvas.current;
    const root = journey.current;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: element, antialias: true, alpha: true, powerPreference: "high-performance" }); } catch { onUnavailable(); return; }
    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x102c1d, .019);
    const textures: THREE.Texture[] = [];
    const background = new THREE.TextureLoader().load("/images/forest-scene.webp");
    background.colorSpace = THREE.SRGBColorSpace;
    textures.push(background);scene.background = background;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    const camera = new THREE.PerspectiveCamera(mobile ? 61 : 53, 1, .1, 150);
    scene.add(new THREE.HemisphereLight(0xd9f5c5, 0x698056, 2.2));
    const sun = new THREE.DirectionalLight(0xffe3a7, 3.1);sun.position.set(5,12,5);scene.add(sun);
    const fill = new THREE.DirectionalLight(0xb7e8cf, 1.1);fill.position.set(-7,4,-12);scene.add(fill);
    let seed = 9182;
    const random = () => {seed = (seed * 1664525 + 1013904223) >>> 0;return seed / 4294967296;};
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    function mesh(geometry: THREE.BufferGeometry, material: THREE.Material) {geometries.add(geometry);materials.add(material);return new THREE.Mesh(geometry,material);}
    function surfaceTexture(kind: "bark" | "ground") {
      const surface=document.createElement("canvas");surface.width=surface.height=512;
      const context=surface.getContext("2d")!;const data=context.createImageData(512,512);
      for(let y=0;y<512;y++)for(let x=0;x<512;x++){
        const grain=random()*24;
        const variation=kind==="bark" ? Math.sin(x*.23+Math.sin(y*.025)*2)*22 + Math.sin(x*1.4)*7 : Math.sin(x*.11)*Math.cos(y*.08)*12;
        const n=(y*512+x)*4;
        data.data[n]=(kind==="bark"?93:44)+grain+variation;
        data.data[n+1]=(kind==="bark"?65:62)+grain+variation;
        data.data[n+2]=(kind==="bark"?38:29)+grain+variation;
        data.data[n+3]=255;
      }
      context.putImageData(data,0,0);const texture=new THREE.CanvasTexture(surface);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(kind==="bark"?2:8,kind==="bark"?3:30);textures.push(texture);return texture;
    }
    const bark = new THREE.MeshStandardMaterial({color:0xc9bc91,map:surfaceTexture("bark"),roughness:.93});
    const vineMaterial = new THREE.MeshStandardMaterial({color:0x536f34,roughness:.8});
    const leafMaterial = new THREE.MeshStandardMaterial({color:0x75ae42,roughness:.47,metalness:.03,side:THREE.DoubleSide,vertexColors:true});
    const wind = {value:0};
    leafMaterial.onBeforeCompile = shader => {
      shader.uniforms.windTime = wind;
      shader.vertexShader = "uniform float windTime;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
        float phase = windTime + instanceMatrix[3].x * .7 + instanceMatrix[3].z * .22;
        transformed.z += sin(phase + position.y * 2.0) * .10 * position.y;
        transformed.x += cos(phase * .72) * .07 * position.y;`);
    };
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0,0);leafShape.bezierCurveTo(-.48,.45,-.35,1.2,0,1.65);leafShape.bezierCurveTo(.35,1.2,.48,.45,0,0);
    const leafGeometry = new THREE.ShapeGeometry(leafShape,7);
    const leafPositions=leafGeometry.attributes.position;
    for(let i=0;i<leafPositions.count;i++)leafPositions.setZ(i,Math.sin(leafPositions.getY(i)*2)*.14+Math.abs(leafPositions.getX(i))*.3);
    const leafColors=[];
    for(let i=0;i<leafPositions.count;i++)leafColors.push(1,1,1);
    leafGeometry.setAttribute("color",new THREE.Float32BufferAttribute(leafColors,3));
    leafGeometry.computeVertexNormals();geometries.add(leafGeometry);materials.add(leafMaterial);
    const count = mobile ? 900 : 1700;
    const leaves = new THREE.InstancedMesh(leafGeometry,leafMaterial,count);
    const dummy = new THREE.Object3D();const color = new THREE.Color();
    for(let i=0;i<count;i++) {
      const z = 10 - random()*112;
      const side = random()<.5 ? -1 : 1;
      const canopy = i%3!==0;
      dummy.position.set(side*(canopy ? 1.6+random()*8 : 3+random()*7),canopy ? 4.4+random()*6 : -2+random()*4.5,z);
      dummy.rotation.set(random()*Math.PI,random()*Math.PI*2,random()*Math.PI*2);
      const size = .45+random()*1.25;dummy.scale.set(size,size,size);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
      color.setHSL(.23+random()*.1,.45+random()*.25,.19+random()*.23);leaves.setColorAt(i,color);
    }
    leaves.instanceMatrix.needsUpdate=true;scene.add(leaves);
    function branch(points: THREE.Vector3[], radius: number, parent: THREE.Object3D, material = bark) {
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve,12,radius,7,false);
      const pos=geometry.attributes.position;const colors=[];
      for(let i=0;i<pos.count;i++){const c=.7+.25*Math.sin(pos.getY(i)*18+pos.getZ(i)*9)+random()*.15;colors.push(c,c*.91,c*.77);}
      geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
      material.vertexColors=true;
      const object=mesh(geometry,material);parent.add(object);return object;
    }
    const trees: {object:THREE.Group;phase:number}[]=[];
    for(let i=0;i<34;i++) {
      const side=i%2?-1:1,z=11-Math.floor(i/2)*6.8,x=side*(4.1+random()*2.5),height=9+random()*5;
      const tree=new THREE.Group();tree.position.set(x,-3,z);
      branch([new THREE.Vector3(),new THREE.Vector3(side*.2,height*.45,0),new THREE.Vector3(-side*.3,height,0)],.32+random()*.28,tree);
      branch([new THREE.Vector3(0,height*.65,0),new THREE.Vector3(-side*1.7,height*.7,.1),new THREE.Vector3(-side*3.4,height*.62,.7)],.11,tree);
      branch([new THREE.Vector3(0,height*.8,0),new THREE.Vector3(side*1.2,height*.85,-1),new THREE.Vector3(side*2.1,height*.78,-2)],.085,tree);
      if(i%3===0){const points=[];for(let t=0;t<=15;t++){const y=t/15*height;points.push(new THREE.Vector3(Math.sin(y*1.2)*.6,y,Math.cos(y*1.2)*.6));}branch(points,.035,tree,vineMaterial);}
      scene.add(tree);trees.push({object:tree,phase:random()*6});
    }
    const groundGeometry=new THREE.PlaneGeometry(40,140,30,80);
    const groundVertices=groundGeometry.attributes.position;
    for(let i=0;i<groundVertices.count;i++)groundVertices.setZ(i,random()*.18);
    groundGeometry.computeVertexNormals();
    const ground=mesh(groundGeometry,new THREE.MeshStandardMaterial({color:0x879d69,map:surfaceTexture("ground"),roughness:1}));
    ground.rotation.x=-Math.PI/2;ground.position.set(0,-3,-45);scene.add(ground);
    const stones = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:0x465941,roughness:1}),70);
    geometries.add(stones.geometry);materials.add(stones.material);
    for(let i=0;i<70;i++){dummy.position.set((random()-.5)*15,-2.85,9-random()*104);dummy.rotation.set(random()*3,random()*3,random()*3);dummy.scale.set(.3+random()*.7,.15+random()*.35,.3+random()*.6);dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix);}scene.add(stones);
    const fruitGroups:THREE.Group[]=[];
    const pickable:THREE.Object3D[]=[];
    const fruitMaterials:THREE.MeshPhysicalMaterial[]=[];
    function fruitBody(index:number) {
      const geometry=new THREE.SphereGeometry(1,64,48);
      const positions=geometry.attributes.position;const colors=[];
      for(let i=0;i<positions.count;i++){
        let x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
        const angle=Math.atan2(z,x),noise=Math.sin(x*97+y*103+z*89)*.003;
        if(index===0){x*=.82*(1+.17*y);y*=1.3;z*=.72;x+=.17*(1-y*y);}
        if(index===2){const lobes=1+.045*Math.cos(angle*5)*Math.pow(Math.abs(y),3);x*=lobes;y*=.87;z*=lobes;y-=.13*Math.pow(Math.abs(y),14)*Math.sign(y);}
        if(index===3){x*=1.14;y*=.8;z*=1.07;}
        if(index===4){x*=.77;y*=1.17;z*=.77;}
        if(index===5){x*=.86;y*=1.1;z*=.86;}
        positions.setXYZ(i,x*(1+noise),y*(1+noise),z*(1+noise));
        if(index===0)color.copy(new THREE.Color(0xe3ac19)).lerp(new THREE.Color(y>0?0xc93524:0x64852a),clamp(Math.abs(y)*.62));
        else if(index===1)color.setHSL(.07,.95,.5+Math.sin(x*80+y*60)*.012);
        else if(index===2)color.setHSL(.003,.8,.33+Math.sin(angle*13+y*8)*.035);
        else if(index===3)color.setHSL(.29,.65,.23+.11*Math.pow(Math.sin(angle*6+y*.7),4));
        else if(index===4)color.setHSL(.94,.78,.46);
        else color.setHSL(.2,.55,.38+random()*.04);
        colors.push(color.r,color.g,color.b);
      }
      geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
      const material=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:index===5?.64:.28,clearcoat:index===5?0:.65,clearcoatRoughness:.25,metalness:0});
      fruitMaterials.push(material);return mesh(geometry,material);
    }
    for(let i=0;i<6;i++) {
      const group=new THREE.Group();group.position.set(0,1.4,-(i+1)*14);group.userData.index=i;
      const fruit=fruitBody(i);fruit.userData.index=i;group.add(fruit);pickable.push(fruit);
      if(i===5){const spikes=new THREE.InstancedMesh(new THREE.ConeGeometry(.09,.25,5),new THREE.MeshStandardMaterial({color:0x9baf52,roughness:.7}),360);geometries.add(spikes.geometry);materials.add(spikes.material);const normal=new THREE.Vector3();for(let j=0;j<360;j++){const a=j*2.39996,yy=1-2*(j+.5)/360,r=Math.sqrt(1-yy*yy);normal.set(Math.cos(a)*r,yy,Math.sin(a)*r);dummy.position.set(normal.x*.88,normal.y*1.12,normal.z*.88);dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);dummy.scale.setScalar(1);dummy.updateMatrix();spikes.setMatrixAt(j,dummy.matrix);}group.add(spikes);}
      if(i===4){const scaleGeometry=new THREE.ConeGeometry(.11,.6,5);const scales=new THREE.InstancedMesh(scaleGeometry,new THREE.MeshStandardMaterial({color:0x95bd42,roughness:.5}),26);geometries.add(scaleGeometry);materials.add(scales.material);for(let j=0;j<26;j++){const a=j*2.4,y=-.85+(j%7)*.27,r=Math.sqrt(Math.max(.1,1-y*y));dummy.position.set(Math.cos(a)*r*.75,y,Math.sin(a)*r*.75);dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(Math.cos(a)*.6,1,Math.sin(a)*.6).normalize());dummy.scale.setScalar(1);dummy.updateMatrix();scales.setMatrixAt(j,dummy.matrix);}group.add(scales);}
      branch([new THREE.Vector3(0,.9,0),new THREE.Vector3(.1,1.9,.1),new THREE.Vector3(1.4,2.5,.15),new THREE.Vector3(4.4,3.4,.2)],.055,group);
      const attachedLeaves=new THREE.Group();for(let j=0;j<7;j++){const leaf=mesh(leafGeometry,new THREE.MeshStandardMaterial({color:j%2?0x41842e:0x639f38,roughness:.45,side:THREE.DoubleSide}));leaf.position.set(.15+j*.35,1.65+Math.sin(j)*.35,.1);leaf.rotation.set(.6,j*.7,j%2?-1.2:1.2);leaf.scale.setScalar(.55);attachedLeaves.add(leaf);}group.add(attachedLeaves);group.userData.leaves=attachedLeaves;
      scene.add(group);fruitGroups.push(group);
    }
    const particlesGeometry=new THREE.BufferGeometry();const particlePositions=[];
    for(let i=0;i<(mobile?75:180);i++)particlePositions.push((random()-.5)*14,random()*8-1,12-random()*115);
    particlesGeometry.setAttribute("position",new THREE.Float32BufferAttribute(particlePositions,3));
    const particleMaterial=new THREE.PointsMaterial({color:0xffdc89,size:.038,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false});
    geometries.add(particlesGeometry);materials.add(particleMaterial);const particles=new THREE.Points(particlesGeometry,particleMaterial);scene.add(particles);
    const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2(10,10);
    let hover:number|null=null,current=0,target=0,frame=0,lastTime=0,total=0,lastActive:number|null=null,visible=true,intersecting=true,disposed=false;
    const dimension=new THREE.Vector2();let quality=1, slowFrames=0;
    const resize=()=>{const width=element.clientWidth,height=element.clientHeight;const ratio=mobile?Math.min(window.devicePixelRatio,1.5):Math.min(window.devicePixelRatio,2);renderer.setPixelRatio(Math.min(ratio,Math.sqrt(8294400/(width*height)))*quality);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();const imageAspect=1672/941; background.repeat.set(Math.min(1,camera.aspect/imageAspect),Math.min(1,imageAspect/camera.aspect));background.offset.set((1-background.repeat.x)/2,(1-background.repeat.y)/2);background.updateMatrix();renderer.getDrawingBufferSize(dimension);element.dataset.renderResolution=`${dimension.x}x${dimension.y}`;};
    const scroll=()=>{target=clamp((window.scrollY-root.offsetTop)/(root.offsetHeight-element.clientHeight)*7,0,6.72);};
    const move=(event:PointerEvent)=>{const rect=element.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);};
    let downX=0,downY=0;
    const down=(event:PointerEvent)=>{downX=event.clientX;downY=event.clientY;move(event);};
    const up=(event:PointerEvent)=>{if(Math.hypot(event.clientX-downX,event.clientY-downY)>12)return;move(event);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(pickable,false);if(hits.length)onSelect(hits[0].object.userData.index);};
    const leave=()=>{pointer.set(10,10);hover=null;element.style.cursor="auto";};
    const render=(time:number)=>{
      if(disposed)return;frame=0;
      if(!visible||!intersecting)return;
      const dt=lastTime?Math.min(.05,(time-lastTime)/1000):1/60;lastTime=time;total+=dt;
      current+= (target-current)*(reduced.matches?1:1-Math.pow(.91,dt*60));
      wind.value=reduced.matches?0:total*.8;
      const sway=reduced.matches?0:Math.sin(total*.35)*.04;
      const endLook = Math.max(0,current-6.35)*10;
      camera.position.set(reduced.matches?0:Math.sin(current*1.6)*.25+pointer.x*.04,1.15+sway,9-current*14);
      camera.lookAt(0,1.4,camera.position.z-8+endLook);
      const active=current<.65?null:Math.min(5,Math.max(0,Math.floor(current+.18)-1));
      if(active!==lastActive){lastActive=active;onActive(active);}
      trees.forEach(({object,phase})=>{object.rotation.z=reduced.matches?0:Math.sin(total*.45+phase)*.009;});
      fruitGroups.forEach((group,i)=>{
        const proximity=clamp(1-Math.abs(current-(i+1.34))*1.5);
        const scale=(.78+proximity*.18)*(hover===i?1.1:1);
        group.scale.lerp(new THREE.Vector3(scale,scale,scale),1-Math.pow(.88,dt*60));
        group.position.y=1.4+(reduced.matches?0:Math.sin(total*1.1+i)*.075);
        group.rotation.y=reduced.matches?0:Math.sin(total*.4+i)*.22+clamp(current-(i+1),-.3,1)*.95;
        group.rotation.z=reduced.matches?0:Math.sin(total*.7+i)*.045;
        (group.userData.leaves as THREE.Group).rotation.z=reduced.matches?0:Math.sin(total*1.2+i)*.08;
        fruitMaterials[i].emissive.set(hover===i?0x604520:0x000000);fruitMaterials[i].emissiveIntensity=hover===i?.22:0;
      });
      if(!mobile){raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(pickable,false);hover=hits.length?hits[0].object.userData.index:null;element.style.cursor=hover===null?"auto":"pointer";}
      particles.position.y=reduced.matches?0:Math.sin(total*.3)*.12;
      renderer.render(scene,camera);
      slowFrames=dt>.036?slowFrames+1:Math.max(0,slowFrames-1);if(!mobile && total>3 && quality===1 && slowFrames>45){quality=.8;resize();}
      frame=requestAnimationFrame(render);
    };
    const resume=()=>{if(!frame&&visible&&intersecting&&!disposed){lastTime=0;frame=requestAnimationFrame(render);}};
    const visibility=()=>{visible=!document.hidden;if(visible)resume();};
    const contextLost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(frame);frame=0;onUnavailable();};
    const observer=new IntersectionObserver(entries=>{intersecting=entries[0].isIntersecting;resume();});observer.observe(element);
    const resizeObserver=new ResizeObserver(()=>{resize();scroll();resume();});resizeObserver.observe(element);
    element.addEventListener("pointermove",move,{passive:true});element.addEventListener("pointerdown",down,{passive:true});element.addEventListener("pointerup",up,{passive:true});element.addEventListener("pointerleave",leave);element.addEventListener("webglcontextlost",contextLost);
    window.addEventListener("scroll",scroll,{passive:true});window.addEventListener("resize",resize);document.addEventListener("visibilitychange",visibility);
    resize();scroll();current=target;renderer.getDrawingBufferSize(dimension);element.dataset.renderResolution=`${dimension.x}x${dimension.y}`;resume();onReady();
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();resizeObserver.disconnect();element.removeEventListener("pointermove",move);element.removeEventListener("pointerdown",down);element.removeEventListener("pointerup",up);element.removeEventListener("pointerleave",leave);element.removeEventListener("webglcontextlost",contextLost);window.removeEventListener("scroll",scroll);window.removeEventListener("resize",resize);document.removeEventListener("visibilitychange",visibility);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();};
  },[journey,onSelect,onActive,onReady,onUnavailable]);
  return <canvas className="jungle-canvas" ref={canvas} aria-label="Interactive three-dimensional jungle. Scroll through the forest; click or tap a fruit to learn about it." />;
}
