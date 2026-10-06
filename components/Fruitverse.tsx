"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

export const fruits = [
  { id: "mango", name: "Mango", subtitle: "King of fruits", origin: "South Asia", season: "Summer", taste: "Sweet · Juicy · Aromatic", story: "Golden beneath the canopy. A sun-loving stone fruit with buttery flesh and a delicate floral aroma." },
  { id: "orange", name: "Orange", subtitle: "A little sunlight", origin: "East & Southeast Asia", season: "Winter", taste: "Bright · Sweet · Tangy", story: "Among the glossy leaves, a burst of citrus. Fragrant peel protects delicate pockets of sweet-tart juice." },
  { id: "apple", name: "Apple", subtitle: "Wild at heart", origin: "Central Asia", season: "Autumn", taste: "Crisp · Sweet · Tart", story: "From mountain forests to orchards around the world. A familiar fruit with thousands of different expressions." },
  { id: "watermelon", name: "Watermelon", subtitle: "Rooted in summer", origin: "Africa", season: "Summer", taste: "Clean · Sweet · Refreshing", story: "Follow the vines to the forest floor. Beneath a striped rind, crisp flesh holds the refreshment of summer." },
  { id: "dragon-fruit", name: "Dragon fruit", subtitle: "After the night blooms", origin: "Central America", season: "Summer–Autumn", taste: "Mild · Fresh · Delicate", story: "Born from a night-blooming cactus. Vivid pink scales give way to delicate, seed-speckled flesh." },
  { id: "durian", name: "Durian", subtitle: "The forest's secret", origin: "Southeast Asia", season: "Varies by region", taste: "Creamy · Rich · Intense", story: "Armored outside, custard-soft within. A tropical forest fruit with an unmistakable aroma." },
];
const Jungle = dynamic(() => import("./Jungle"), { ssr: false });

export default function Fruitverse() {
  const journey = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const [detail, setDetail] = useState<number | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const selected = detail === null ? null : fruits[detail];
  const select = useCallback((index: number) => setDetail(index), []);
  const changeActive = useCallback((index: number | null) => {setActive(index);setDetail(null);}, []);
  const loaded = useCallback(() => setReady(true), []);
  const unavailable = useCallback(() => {setFallback(true);setReady(true);}, []);

  useEffect(() => {
    if (detail === null) return;
    close.current?.focus();
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setDetail(null); if (event.key === "Tab") {event.preventDefault();close.current?.focus();} };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [detail]);

  return <main>
    <h1 className="sr-only">Fruitverse — explore the living jungle</h1>
    <div className="journey" ref={journey}>
      <div className={`stage ${ready ? "is-ready" : ""}`}>
        <div className="forest-backdrop" aria-hidden="true" />
        <Jungle journey={journey} onSelect={select} onActive={changeActive} onReady={loaded} onUnavailable={unavailable} />
        {fallback && <div className="fallback-fruits">{fruits.map((fruit,index) => <button key={fruit.id} aria-label={`Explore ${fruit.name}`} onClick={() => select(index)}><img src={`/images/${fruit.id}-mobile.webp`} alt="" /></button>)}</div>}
        {!fallback && active !== null && <button className="keyboard-fruit" aria-label={`Explore ${fruits[active].name}`} onClick={() => select(active)}><span className="sr-only">Explore {fruits[active].name}</span></button>}
        {selected && <div className="detail-backdrop" onClick={() => setDetail(null)}><section className="fruit-dialog" role="dialog" aria-modal="true" aria-labelledby="fruit-title" onClick={event => event.stopPropagation()}>
          <button ref={close} className="close-detail" onClick={() => setDetail(null)} aria-label="Close fruit information">×</button>
          <span className="eyebrow">{selected.subtitle}</span><h2 id="fruit-title">{selected.name}</h2><p>{selected.story}</p>
          <dl>{[["Origin",selected.origin],["Season",selected.season],["Taste",selected.taste]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </section></div>}
      </div>
      <div className="scroll-track" aria-hidden="true">{Array.from({length:7},(_,index) => <section key={index} />)}</div>
    </div>
  </main>;
}
