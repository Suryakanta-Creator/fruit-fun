"use client";

import { useEffect, useRef, useState } from "react";

const fruits = [
  { id: "mango", name: "Mango", subtitle: "King of fruits", origin: "South Asia", season: "Summer", taste: "Sweet · Juicy · Aromatic", story: "Golden beneath the canopy. A sun-loving stone fruit with buttery flesh and a delicate floral aroma." },
  { id: "orange", name: "Orange", subtitle: "A little sunlight", origin: "East & Southeast Asia", season: "Winter", taste: "Bright · Sweet · Tangy", story: "Among the glossy leaves, a burst of citrus. Fragrant peel protects delicate pockets of sweet-tart juice." },
  { id: "apple", name: "Apple", subtitle: "Wild at heart", origin: "Central Asia", season: "Autumn", taste: "Crisp · Sweet · Tart", story: "From mountain forests to orchards around the world. A familiar fruit with thousands of different expressions." },
  { id: "watermelon", name: "Watermelon", subtitle: "Rooted in summer", origin: "Africa", season: "Summer", taste: "Clean · Sweet · Refreshing", story: "Follow the vines to the forest floor. Beneath a striped rind, crisp flesh holds the refreshment of summer." },
  { id: "dragon-fruit", name: "Dragon fruit", subtitle: "After the night blooms", origin: "Central America", season: "Summer–Autumn", taste: "Mild · Fresh · Delicate", story: "Born from a night-blooming cactus. Vivid pink scales give way to delicate, seed-speckled flesh." },
  { id: "durian", name: "Durian", subtitle: "The forest's secret", origin: "Southeast Asia", season: "Varies by region", taste: "Creamy · Rich · Intense", story: "Armored outside, custard-soft within. A tropical forest fruit with an unmistakable aroma." },
];
const scenes = [{ id: "forest", name: "Forest entrance" }, ...fruits];
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const ease = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };

export default function Fruitverse() {
  const journey = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const foreground = useRef<HTMLDivElement>(null);
  const atmosphere = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const captions = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const root = journey.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    let raf = 0, current = 0, target = 0, px = 0, py = 0, mx = 0, my = 0;
    let lastActive = -1, lastReveal = false, visible = true;
    let unit = 1, top = 0, previousTime = 0;
    const measure = () => {
      top = root.getBoundingClientRect().top + window.scrollY;
      unit = (root.offsetHeight - window.innerHeight) / scenes.length;
      update();
    };
    const draw = (time: number) => {
      raf = 0;
      if (!visible) return;
      const still = reduced.matches;
      const elapsed = previousTime ? Math.min(50, time - previousTime) : 16.67;
      previousTime = time;
      const cameraEase = 1 - Math.pow(.895, elapsed / 16.67);
      const pointerEase = 1 - Math.pow(.945, elapsed / 16.67);
      current = still ? target : current + (target - current) * cameraEase;
      mx += (px - mx) * pointerEase; my += (py - my) * pointerEase;
      const sceneIndex = Math.min(scenes.length - 1, Math.floor(current));
      const local = current - sceneIndex;
      const show = sceneIndex > 0 && local > .36 && local < .94;
      if (sceneIndex !== lastActive) { lastActive = sceneIndex; setActive(sceneIndex); setDetail(null); }
      if (show !== lastReveal) { lastReveal = show; setRevealed(show); }
      layers.current.forEach((layer, i) => {
        if (!layer) return;
        const p = current - i;
        const opacity = i === 0 ? 1 - ease((p - .78) / .22) : ease((p + .22) / .22) * (i === scenes.length - 1 ? 1 : 1 - ease((p - .78) / .22));
        layer.style.opacity = String(opacity);
        layer.style.visibility = opacity > .001 ? "visible" : "hidden";
        if (opacity > .001) {
          const z = still ? 1 : 1.07 + clamp(p, -.22, 1) * .27;
          const drift = still ? 0 : (clamp(p, -.22, 1) - .4) * (i % 2 ? -3 : 3);
          layer.style.transform = `translate3d(${drift + (still ? 0 : mx * .55)}%,${still ? 0 : -clamp(p) * 2 + my * .35}%,0) scale(${z})`;
        }
      });
      if (foreground.current) {
        const sweep = Math.sin(current * 1.35);
        foreground.current.style.transform = still ? "none" : `translate3d(${sweep * 3.5 - mx * 2.5}%,${Math.cos(current * .9) * 3 - my * 2}%,0) scale(${1.12 + Math.sin(current * .8) * .035}) rotate(${sweep * .6}deg)`;
      }
      if (atmosphere.current) {
        atmosphere.current.style.transform = still ? "none" : `translate3d(${Math.sin(current * .7) * -5}%,${Math.cos(current) * 3}%,0) rotate(${Math.sin(current) * 2}deg)`;
      }
      captions.current.forEach((caption, i) => {
        if (!caption) return;
        const p = current - i;
        const alpha = i === 0 ? ease((p - .25) / .18) * (1 - ease((p - .65) / .15)) : ease((p - .25) / .16) * (1 - ease((p - .80) / .14));
        caption.style.opacity = String(alpha);
        caption.style.visibility = alpha > .01 ? "visible" : "hidden";
        caption.style.transform = `translate3d(0,${still ? 0 : (1 - alpha) * 24}px,0)`;
      });
      stage.current?.style.setProperty("--travel", String(clamp(current / scenes.length)));
      if (Math.abs(target - current) > .0001 || Math.abs(px - mx) > .001 || Math.abs(py - my) > .001) raf = requestAnimationFrame(draw);
    };
    const request = () => { if (!raf && visible) { previousTime = 0; raf = requestAnimationFrame(draw); } };
    function update() { target = clamp((window.scrollY - top) / unit, 0, scenes.length - .001); request(); }
    const pointer = (event: PointerEvent) => { if (!fine.matches || reduced.matches) return; px = event.clientX / window.innerWidth - .5; py = event.clientY / window.innerHeight - .5; request(); };
    const visibility = () => { visible = !document.hidden; if (visible) update(); else cancelAnimationFrame(raf); raf = 0; if (visible) request(); };
    const resize = new ResizeObserver(measure); resize.observe(root);
    measure(); current = target; request();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("pointermove", pointer, { passive: true });
    reduced.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    return () => { cancelAnimationFrame(raf); resize.disconnect(); window.removeEventListener("scroll", update); window.removeEventListener("resize", measure); window.removeEventListener("pointermove", pointer); reduced.removeEventListener("change", update); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  function goTo(index: number) {
    const root = journey.current;
    if (!root) return;
    const unit = (root.offsetHeight - window.innerHeight) / scenes.length;
    window.scrollTo({ top: root.offsetTop + (index + .43) * unit, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  return <main>
    <h1 className="sr-only">Fruitverse — a journey through the fruit forest</h1>
    <div className="journey" ref={journey} id="top">
      <div className="stage" ref={stage}>
        {scenes.map((scene, i) => <div className={`landscape landscape-${scene.id}`} key={scene.id} ref={node => { layers.current[i] = node; }} style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}>
          <picture><source media="(max-width: 700px)" srcSet={`/images/${scene.id}-mobile.webp`} /><img src={`/images/${scene.id}-scene.webp`} alt={i === 0 ? "Sunlight filters through a lush rainforest above a winding stream" : `${scene.name} growing naturally amid lush foliage`} fetchPriority={i === 0 ? "high" : "auto"} loading="eager" decoding="async" /></picture>
        </div>)}
        <div className="forest-atmosphere" ref={atmosphere} aria-hidden="true"><div className="light-haze" /><div className="light-shafts" /><div className="forest-motes">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ left: `${8 + (i * 29) % 84}%`, top: `${12 + (i * 17) % 76}%`, animationDelay: `${-i * 1.7}s`, animationDuration: `${14 + i % 5 * 3}s` }} />)}</div></div>
        <div className="foreground" ref={foreground} aria-hidden="true"><img src="/images/forest-foreground.webp" alt="" decoding="async" /></div>
        <div className="film-shade" aria-hidden="true" />
        {scenes.map((scene, i) => <div key={scene.id} className={`scene-caption ${i === 0 ? "entrance-caption" : ""}`} ref={node => { captions.current[i] = node; }}>
          <span className="eyebrow">{i === 0 ? "Fruitverse" : `0${i} / 06 · ${fruits[i - 1].subtitle}`}</span>
          <h2>{i === 0 ? <>Into the<br /><em>wild.</em></> : scene.name}</h2>
          {i > 0 && <p>{fruits[i - 1].story}</p>}
        </div>)}
        <div className={`quiet-controls ${revealed ? "is-visible" : ""}`} inert={!revealed} aria-hidden={!revealed}>
          <button onClick={() => setDetail(detail ? null : scenes[active].id)} aria-expanded={detail !== null} aria-controls="fruit-details">{detail ? "Close details" : "Discover this fruit"}</button>
          <button onClick={() => goTo(active < scenes.length - 1 ? active + 1 : 0)}>{active < scenes.length - 1 ? "Continue deeper" : "Back to the forest"}</button>
          <a href="#explorer">Fruit index</a>
        </div>
        {detail && revealed && active > 0 && <div id="fruit-details" className="details"><dl>{[["Origin",fruits[active - 1].origin],["Season",fruits[active - 1].season],["Taste",fruits[active - 1].taste]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>}
        <div className="progress" aria-hidden="true" />
      </div>
      <div className="scroll-track" aria-hidden="true">{scenes.map(scene => <section key={scene.id} id={scene.id === "forest" ? "entrance" : scene.id} />)}</div>
    </div>
    <section className="explorer" id="explorer">
      <div className="index-inner"><span className="eyebrow">The collection</span><h2>Stay curious.</h2>
        <label className="search"><span>Find a fruit</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search the forest" /></label>
        <div className="fruit-list">{fruits.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).map(fruit => <button key={fruit.id} onClick={() => goTo(fruits.indexOf(fruit) + 1)}><span>{fruit.name}</span><small>{fruit.origin}</small></button>)}</div>
        {!fruits.some(f => f.name.toLowerCase().includes(query.toLowerCase())) && <p role="status">No fruit found. Try mango, orange, apple, watermelon, dragon fruit or durian.</p>}
        <button className="return" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}>Return to the forest entrance</button>
      </div>
    </section>
  </main>;
}
