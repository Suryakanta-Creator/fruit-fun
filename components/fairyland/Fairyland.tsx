"use client";

import BackgroundFilm from "./BackgroundFilm";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Compass, Flower2, Maximize2, Minimize2, Pause, Play, X } from "lucide-react";
import { fruits } from "../Fruitverse";

const chapters=[{name:"The awakening",jp:"目覚め",line:"Where the ordinary\nturns extraordinary."},{name:"Petals on the wind",jp:"花の風",line:"Let the wind\nshow you the way."},{name:"The golden crossing",jp:"光の橋",line:"Some places are felt,\nnot found."},{name:"A little wonder",jp:"小さな奇跡",line:"Stay a little longer.\nThe world can wait."}];

export default function Fairyland(){
 const root=useRef<HTMLDivElement>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const explore=useRef<HTMLButtonElement>(null);
 const [ready,setReady]=useState(false),[fallback,setFallback]=useState(false),[paused,setPaused]=useState(false),[tour,setTour]=useState(false),[chapter,setChapter]=useState(0),[selected,setSelected]=useState(0),[fullscreen,setFullscreen]=useState(false);
 const loaded=useCallback(()=>setReady(true),[]);
 const unavailable=useCallback(()=>{setFallback(true);setReady(true);},[]);
 const playbackBlocked=useCallback(()=>{setPaused(true);setReady(true);},[]);
 useEffect(()=>{
  const scroll=()=>{const el=root.current;if(!el)return;const p=Math.max(0,Math.min(1,(scrollY-el.offsetTop)/(el.offsetHeight-innerHeight)));el.style.setProperty("--scroll",String(p));setChapter(Math.min(3,Math.floor(p*4)));};
  scroll();window.addEventListener("scroll",scroll,{passive:true});return()=>window.removeEventListener("scroll",scroll);
 },[]);
 useEffect(()=>{
  if(!tour||paused)return;
  let frame=0,last=0;
  const tick=(now:number)=>{const el=root.current;if(!el)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(!document.hidden&&!dialog.current?.open){const end=el.offsetTop+el.offsetHeight-innerHeight;if(scrollY>=end-2){setTour(false);return;}window.scrollTo(0,Math.min(end,scrollY+dt*32));}frame=requestAnimationFrame(tick);};
  const stop=()=>setTour(false);
  frame=requestAnimationFrame(tick);window.addEventListener("wheel",stop,{passive:true});window.addEventListener("touchstart",stop,{passive:true});window.addEventListener("keydown",stop);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener("wheel",stop);window.removeEventListener("touchstart",stop);window.removeEventListener("keydown",stop);};
 },[tour,paused]);
 useEffect(()=>{const change=()=>setFullscreen(Boolean(document.fullscreenElement));document.addEventListener("fullscreenchange",change);return()=>document.removeEventListener("fullscreenchange",change);},[]);
 const go=(index:number)=>{const el=root.current;if(!el)return;setTour(false);window.scrollTo({top:el.offsetTop+(el.offsetHeight-innerHeight)*(index/4+.035),behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});};
 const open=()=>{setTour(false);dialog.current?.showModal();};
 const close=()=>{dialog.current?.close();explore.current?.focus();};
 const startTour=()=>{if(matchMedia("(prefers-reduced-motion: reduce)").matches){go(Math.min(3,chapter+1));return;}if(chapter===3)go(0);setPaused(false);setTour(!tour);};
 const toggleFullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{/* The journey remains usable when fullscreen is unavailable. */}};
 const fruit=fruits[selected];
 return <main className="fairyland" ref={root}>
  <div className={`fairy-stage ${ready?"scene-ready":""} ${fallback?"scene-fallback":""} ${paused?"motion-paused":""}`}>
   <div className="scene-photo" aria-hidden="true"/>
   <BackgroundFilm paused={paused} onReady={loaded} onFallback={unavailable} onPlaybackBlocked={playbackBlocked}/>
   <div className="scene-mist mist-one" aria-hidden="true"/><div className="scene-mist mist-two" aria-hidden="true"/>
   <div className="scene-shade" aria-hidden="true"/>
   <header className="garden-header">
    <a className="wordmark" href="#" aria-label="Fruitverse home" onClick={e=>{e.preventDefault();go(0);}}><Flower2 size={25} strokeWidth={1.3}/><span>fruitverse<span className="wordmark-dot">.</span><small>A WORLD BEYOND THE ORDINARY</small></span></a>
    <div className="header-center"><span className="live-dot"/> JAPAN, IN A DREAM <span className="header-coordinate">35° 01′ N · 135° 46′ E</span></div>
    <button className="outline-button explore-button" onClick={open} ref={explore}>Discover the fruits <ArrowUpRight/></button>
   </header>
   <div className="vertical-caption" aria-hidden="true">ゆっくり、世界を感じて。</div>
   <div className="chapter-label"><span className="chapter-number">0{chapter+1}</span><span className="chapter-label-line"/><span>{chapters[chapter].name}</span></div>
   <section className="garden-title" aria-labelledby="garden-heading">
    <div className="title-eyebrow"><span/> A SMALL ESCAPE. AN ENDLESS FEELING.</div>
    <h1 id="garden-heading">Somewhere<br/>between <em>dreams.</em></h1>
    <p>A hidden world. A slower rhythm.<br/>Follow the blossoms into a little Japanese wonder.</p>
    <button className="journey-button" onClick={startTour}><span className="journey-play">{tour?<Pause size={15}/>:<Play size={15} fill="currentColor"/>}</span>{tour?"Pause the journey":"Begin the journey"}<ArrowRight size={17}/></button>
   </section>
   <aside className="garden-poem" key={chapter}><span>{chapters[chapter].jp}</span><p>{chapters[chapter].line.split("\n").map((line,i)=><span key={i}>{line}<br/></span>)}</p><small>THE SAKURA SANCTUARY</small></aside>
   <footer className="garden-footer">
    <button className="scroll-cue" onClick={()=>go(Math.min(3,chapter+1))}><span className="scroll-circle"><ArrowDown size={15}/></span><span>SCROLL TO WANDER<small>Let curiosity be your compass</small></span></button>
    <nav className="chapter-nav" aria-label="Journey chapters">{chapters.map((c,i)=><button key={c.name} aria-label={`Chapter ${i+1}: ${c.name}`} aria-current={chapter===i?"step":undefined} onClick={()=>go(i)}><span className="nav-track"><span/></span><small>0{i+1}</small></button>)}</nav>
    <div className="scene-controls"><span className="scene-indicator">{fallback?"STILL GARDEN":"LIVING WORLD"}</span><button onClick={()=>{setPaused(!paused);if(!paused)setTour(false);}} aria-label={paused?"Resume animation":"Pause animation"} aria-pressed={paused}>{paused?<Play size={17}/>:<Pause size={17}/>}</button><button onClick={toggleFullscreen} aria-label={fullscreen?"Exit fullscreen":"Enter fullscreen"}>{fullscreen?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button></div>
   </footer>
   {!ready&&<div className="scene-loading" role="status"><Flower2 size={30}/><span>Finding a little wonder…</span></div>}
   <dialog ref={dialog} className="fruit-discovery" onClick={e=>{if(e.target===e.currentTarget)close();}} onCancel={()=>explore.current?.focus()}>
    <button className="discovery-close" aria-label="Close fruit discovery" onClick={close}><X size={22}/></button>
    <div className="discovery-image"><img src={`/images/${fruit.id}-mobile.webp`} alt={`${fruit.name} in a lush forest`}/><span>THE FRUIT COLLECTION <span>0{selected+1} / 06</span></span></div>
    <div className="discovery-copy"><span className="discovery-eyebrow"><Compass size={14}/> NATURE HAS ITS OWN LITTLE WONDERS</span><h2>{fruit.name}<em>{fruit.subtitle}</em></h2><p>{fruit.story}</p><dl>{[["Origin",fruit.origin],["Season",fruit.season],["Notes",fruit.taste]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><div className="discovery-bottom"><span>Explore something unexpected.</span><button aria-label="Previous fruit" onClick={()=>setSelected((selected+5)%6)}><ArrowLeft size={18}/></button><button aria-label="Next fruit" onClick={()=>setSelected((selected+1)%6)}><ArrowRight size={18}/></button></div></div>
   </dialog>
  </div>
  <div className="journey-space" aria-hidden="true"/>
 </main>;
}
function ArrowUpRight(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18 18 6M6 6h12v12"/></svg>;}
