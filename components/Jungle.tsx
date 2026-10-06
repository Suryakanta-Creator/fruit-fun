"use client";

import { RefObject, useEffect, useRef } from "react";
import * as THREE from "three";

type Props = { journey: RefObject<HTMLDivElement | null>; onSelect: (index: number) => void; onActive: (index: number | null) => void; onReady: () => void; onUnavailable: () => void };
const names = ["forest", "mango", "orange", "apple", "watermelon", "dragon-fruit", "durian"];
const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));

const fragment = `
  uniform sampler2D image;
  uniform float time;
  uniform float progress;
  uniform float opacity;
  uniform float motion;
  uniform float hover;
  uniform float isFruit;
  uniform vec2 pointer;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    float zoom = 1.025 + progress * .13 + hover * .009;
    uv = (uv - .5) / zoom + .5;
    uv += vec2(sin(progress * 2.4) * .012 + pointer.x * .003, progress * .008 + pointer.y * .002);
    vec4 base = texture2D(image, uv);
    float greenery = smoothstep(.02, .14, base.g - base.r) * smoothstep(.01, .1, base.g - base.b);
    float edge = smoothstep(.23, .48, abs(uv.x - .5));
    float canopy = smoothstep(.55, .9, uv.y);
    float breeze = (sin(time * .68 + uv.y * 9.0) + sin(time * 1.12 + uv.x * 13.0) * .35);
    uv.x += motion * greenery * (edge + canopy * .5) * breeze * .0038;
    uv.y += motion * greenery * edge * sin(time * .82 + uv.x * 8.0) * .0021;
    float fruit = (1.0 - smoothstep(.8, 1.3, length((uv - vec2(.5,.59)) / vec2(.135,.245)))) * isFruit;
    uv.x += fruit * motion * sin(time * .8) * .0016;
    uv.y += fruit * motion * sin(time * 1.15) * .0013;
    float water = (1.0 - smoothstep(.12,.27,abs(uv.x-.5))) * (1.0-smoothstep(.28,.44,uv.y)) * smoothstep(.03,.12,uv.y);
    uv.x += water * motion * sin(uv.y * 115.0 + time * 1.35) * .0011;
    vec3 color = texture2D(image, uv).rgb;
    float light = sin(time * .3 + uv.x * 3.0) * .007 * motion;
    color *= 1.0 + light;
    color += vec3(.018,.012,.002) * fruit * hover;
    gl_FragColor = vec4(color, opacity);
    #include <colorspace_fragment>
  }
`;

const dewFragment = `
  uniform sampler2D forest;
  uniform float time;
  uniform float aspect;
  uniform float motion;
  varying vec2 vUv;
  float hash(float n) { return fract(sin(n * 127.1 + 31.7) * 43758.5453); }
  void main() {
    vec3 color = texture2D(forest, vUv).rgb;
    for (int i = 0; i < 12; i++) {
      float id = float(i);
      float phase = fract(time / (5.5 + hash(id) * 6.0) + hash(id + 6.0));
      float age = max(0.0, phase - .18) * 3.4;
      float visibility = smoothstep(.18,.23,phase) * (1.0 - smoothstep(.70,.79,phase)) * motion;
      float originX = .12 + hash(id + 2.0) * .76;
      float originY = .67 + hash(id + 3.0) * .29;
      vec2 center = vec2(originX + sin(age * 1.3 + id) * .002, originY - .075 * age - .21 * age * age);
      float radius = .0027 + hash(id + 4.0) * .0037;
      vec2 delta = (vUv - center) * vec2(aspect,1.0) / radius;
      delta.y /= 1.12 + age * .23;
      float d = dot(delta,delta);
      if (d < 1.0 && visibility > .001) {
        vec3 normal = normalize(vec3(delta,sqrt(max(.001,1.0-d))));
        vec2 refractedUv = vUv - normal.xy * radius * .7 / vec2(aspect,1.0);
        vec3 inside = texture2D(forest, clamp(refractedUv,.001,.999)).rgb;
        float rim = pow(1.0-normal.z,3.0);
        float glint = pow(max(0.0,dot(normal,normalize(vec3(-.42,.55,.72)))),30.0);
        inside = inside * (.94 - rim * .16) + vec3(1.0,.94,.79) * (glint * .8 + rim * .08);
        float edge = 1.0 - smoothstep(.76,1.0,d);
        color = mix(color,inside,edge * visibility * .84);
      }
    }
    float vignette = 1.0 - smoothstep(.2,.95,length((vUv-.5)*vec2(.85,1.0)));
    color *= .96 + vignette * .04;
    gl_FragColor = vec4(color,1.0);
    #include <colorspace_fragment>
  }
`;

export default function Jungle({ journey, onSelect, onActive, onReady, onUnavailable }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current, root = journey.current;
    if (!element || !root) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({canvas:element,antialias:true,alpha:true,powerPreference:"high-performance"}); } catch {onUnavailable();return;}
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
    const phone=window.matchMedia("(max-width: 700px)");
    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,10);camera.position.z=2;
    const geometry=new THREE.PlaneGeometry(2,2);
    const targetTexture=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false,stencilBuffer:false});
    const dewScene=new THREE.Scene();
    const dewMaterial=new THREE.ShaderMaterial({uniforms:{forest:{value:targetTexture.texture},time:{value:0},aspect:{value:1},motion:{value:1}},vertexShader:"varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",fragmentShader:dewFragment,depthTest:false,depthWrite:false});
    dewScene.add(new THREE.Mesh(geometry,dewMaterial));
    const loader=new THREE.TextureLoader();
    const textures:THREE.Texture[]=[];
    const surfaces:THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>[]=[];
    let disposed=false,loaded=0;
    names.forEach((name,index)=>{
      const texture=loader.load(`/images/${name}-${phone.matches?"mobile":"scene"}.webp`,()=>{loaded++;if(!disposed && loaded===names.length+1)onReady();},undefined,()=>{if(!disposed)onUnavailable();});
      texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
      const material=new THREE.ShaderMaterial({uniforms:{image:{value:texture},time:{value:0},progress:{value:0},opacity:{value:index===0?1:0},motion:{value:1},hover:{value:0},isFruit:{value:index?1:0},pointer:{value:new THREE.Vector2()}},vertexShader:"varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",fragmentShader:fragment,transparent:true,depthWrite:false,depthTest:false});
      const surface=new THREE.Mesh(geometry,material);surface.renderOrder=index;scene.add(surface);surfaces.push(surface);
    });
    const foliageTexture=loader.load("/images/forest-foreground.webp",()=>{loaded++;if(!disposed && loaded===names.length+1)onReady();},undefined,()=>{if(!disposed)onUnavailable();});foliageTexture.colorSpace=THREE.SRGBColorSpace;textures.push(foliageTexture);
    const foliageMaterial=new THREE.MeshBasicMaterial({map:foliageTexture,transparent:true,depthWrite:false,depthTest:false});
    const foliage=new THREE.Mesh(geometry,foliageMaterial);foliage.renderOrder=20;scene.add(foliage);
    let frame=0,last=0,current=0,target=0,time=0,hover=false,lastActive:number|null=null,visible=true,inView=true,quality=1,slowFrames=0;
    const pointer=new THREE.Vector2(),smoothPointer=new THREE.Vector2();
    const resolution=new THREE.Vector2();
    const photoAspect=phone.matches?800/1200:1672/941;
    function resize(){const width=element!.clientWidth,height=element!.clientHeight;const aspect=width/height;const dpr=phone.matches?Math.min(devicePixelRatio,1.5):Math.min(devicePixelRatio,2);renderer.setPixelRatio(Math.min(dpr,Math.sqrt(8294400/(width*height)))*quality);renderer.setSize(width,height,false);surfaces.forEach(surface=>{surface.scale.set(aspect<photoAspect?photoAspect/aspect:1,aspect>photoAspect?aspect/photoAspect:1,1);});const foliageAspect=1672/941;foliage.scale.set(Math.max(1,foliageAspect/aspect)*1.055,Math.max(1,aspect/foliageAspect)*1.055,1);renderer.getDrawingBufferSize(resolution);targetTexture.setSize(resolution.x,resolution.y);dewMaterial.uniforms.aspect.value=aspect;element!.dataset.renderResolution=`${resolution.x}x${resolution.y}`;}
    function scroll(){target=clamp((window.scrollY-root!.offsetTop)/(root!.offsetHeight-element!.clientHeight)*7,0,6.82);}
    function activeIndex(){return current<.88?null:Math.min(5,Math.max(0,Math.floor(current)-1));}
    function overFruit(){if(activeIndex()===null)return false;return Math.pow(pointer.x/.42,2)+Math.pow((pointer.y-.15)/.6,2)<1;}
    function move(event:PointerEvent){const rect=element!.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);hover=overFruit();element!.style.cursor=hover?"pointer":"auto";}
    let downX=0,downY=0;
    function down(event:PointerEvent){downX=event.clientX;downY=event.clientY;move(event);}
    function up(event:PointerEvent){if(Math.hypot(event.clientX-downX,event.clientY-downY)>12)return;move(event);const active=activeIndex();if(overFruit() && active!==null)onSelect(active);}
    function leave(){hover=false;pointer.set(0,0);element!.style.cursor="auto";}
    function render(now:number){frame=0;if(disposed||!visible||!inView)return;const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;time+=dt;
      current+=(target-current)*(reduced.matches?1:1-Math.pow(.90,dt*60));smoothPointer.lerp(pointer,1-Math.pow(.94,dt*60));
      const active=activeIndex();if(active!==lastActive){lastActive=active;onActive(active);}
      surfaces.forEach((surface,index)=>{const p=current-index;const fadeIn=index===0?1:THREE.MathUtils.smoothstep(p,-.28,0);const fadeOut=index===6?1:1-THREE.MathUtils.smoothstep(p,.72,1);const alpha=fadeIn*fadeOut;surface.visible=alpha>.001;const u=surface.material.uniforms;u.opacity.value=alpha;u.time.value=time;u.motion.value=reduced.matches?0:1;u.progress.value=reduced.matches?0:clamp(p,-.28,1);u.pointer.value.copy(reduced.matches?new THREE.Vector2():smoothPointer);u.hover.value+=((hover&&active===index-1?1:0)-u.hover.value)*(1-Math.pow(.87,dt*60));});
      foliage.position.set(reduced.matches?0:Math.sin(current*.9)*.018-smoothPointer.x*.008+Math.sin(time*.45)*.003,reduced.matches?0:Math.sin(current*.55)*.018+Math.cos(time*.38)*.003,0);
      foliage.rotation.z=reduced.matches?0:Math.sin(time*.32)*.0035;
      dewMaterial.uniforms.time.value=time;dewMaterial.uniforms.motion.value=reduced.matches?0:1;
      renderer.setRenderTarget(targetTexture);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(dewScene,camera);
      slowFrames=dt>.036?slowFrames+1:Math.max(0,slowFrames-1);if(!phone.matches&&quality===1&&slowFrames>45){quality=.8;resize();}
      frame=requestAnimationFrame(render);
    }
    function resume(){if(!frame&&visible&&inView&&!disposed){last=0;frame=requestAnimationFrame(render);}}
    function visibility(){visible=!document.hidden;resume();}
    function lost(event:Event){event.preventDefault();cancelAnimationFrame(frame);frame=0;onUnavailable();}
    const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;resume();});observer.observe(element);
    const sizes=new ResizeObserver(()=>{resize();scroll();resume();});sizes.observe(element);
    element.addEventListener("pointermove",move,{passive:true});element.addEventListener("pointerdown",down,{passive:true});element.addEventListener("pointerup",up,{passive:true});element.addEventListener("pointerleave",leave);element.addEventListener("webglcontextlost",lost);window.addEventListener("scroll",scroll,{passive:true});window.addEventListener("resize",resize);document.addEventListener("visibilitychange",visibility);
    resize();scroll();current=target;resume();
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();sizes.disconnect();element.removeEventListener("pointermove",move);element.removeEventListener("pointerdown",down);element.removeEventListener("pointerup",up);element.removeEventListener("pointerleave",leave);element.removeEventListener("webglcontextlost",lost);window.removeEventListener("scroll",scroll);window.removeEventListener("resize",resize);document.removeEventListener("visibilitychange",visibility);geometry.dispose();surfaces.forEach(surface=>surface.material.dispose());foliageMaterial.dispose();dewMaterial.dispose();targetTexture.dispose();textures.forEach(texture=>texture.dispose());renderer.dispose();};
  },[journey,onSelect,onActive,onReady,onUnavailable]);
  return <canvas className="jungle-canvas" ref={canvas} aria-label="Living forest scenes. Scroll to explore; click or tap a fruit to reveal its information." />;
}
