"use client";

import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, Droplets, Leaf, Search, Sparkles, Trees, Wind } from "lucide-react";
import { useMemo, useRef, useState } from "react";

const fruits = [
  { id: "mango", name: "Mango", icon: "🥭", subtitle: "King of Fruits", origin: "South Asia", season: "Summer", taste: "Sweet · Juicy · Aromatic", water: "83%", calories: "60 kcal", color: "#f1bd4a", facts: [["Vitamin C",74],["Vitamin A",58],["Fiber",42]], story: "A sun-loving stone fruit with buttery flesh, floral aroma and a history rooted across South Asia." },
  { id: "orange", name: "Orange", icon: "🍊", subtitle: "Burst of Freshness", origin: "East & Southeast Asia", season: "Winter", taste: "Bright · Sweet · Tangy", water: "87%", calories: "47 kcal", color: "#ff8c2a", facts: [["Vitamin C",89],["Fiber",55],["Folate",38]], story: "A fragrant citrus classic built from juicy vesicles, aromatic peel oils and a vivid sweet-tart balance." },
  { id: "apple", name: "Apple", icon: "🍎", subtitle: "Crisp & Timeless", origin: "Central Asia", season: "Autumn", taste: "Crisp · Sweet · Tart", water: "86%", calories: "52 kcal", color: "#ef625f", facts: [["Fiber",66],["Vitamin C",38],["Polyphenols",70]], story: "From mountain ancestors to thousands of cultivars, apples are a masterclass in crunch, acidity and aroma." },
  { id: "watermelon", name: "Watermelon", icon: "🍉", subtitle: "Nature's Hydration", origin: "Africa", season: "Summer", taste: "Clean · Sweet · Refreshing", water: "92%", calories: "30 kcal", color: "#ff5f70", facts: [["Hydration",92],["Vitamin C",45],["Lycopene",78]], story: "A warm-weather giant carrying crisp scarlet flesh and remarkable hydration inside a striped rind." },
  { id: "dragon-fruit", name: "Dragon Fruit", icon: "🐉", subtitle: "Exotic Glow", origin: "Central America", season: "Summer–Autumn", taste: "Mild · Fresh · Delicate", water: "84%", calories: "57 kcal", color: "#ff6bc8", facts: [["Fiber",72],["Magnesium",54],["Antioxidants",68]], story: "A night-blooming cactus fruit with neon scales, speckled flesh and a surprisingly delicate flavor." },
  { id: "durian", name: "Durian", icon: "🌰", subtitle: "Bold & Complex", origin: "Southeast Asia", season: "Regional", taste: "Creamy · Rich · Intense", water: "65%", calories: "147 kcal", color: "#c7ce59", facts: [["Potassium",72],["Vitamin C",62],["Energy",84]], story: "Armored outside and custard-soft within, durian is famous for its powerful aroma and complex richness." },
];

function Rail() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 28 });
  return <aside className="rail"><span>FOREST EDGE</span><div className="rail-track"><motion.i style={{ scaleY: progress }} /></div>{fruits.map(f => <a key={f.id} href={`#${f.id}`} aria-label={f.name} />)}<span>DEEP WILD</span></aside>;
}

function Atmosphere() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0,1], [0,-320]);
  const y2 = useTransform(scrollYProgress, [0,1], [0,-560]);
  const scale = useTransform(scrollYProgress, [0,.4,1], [.96,1.08,1.26]);
  return <div className="atmosphere" aria-hidden="true"><motion.div className="mist m1" style={{ y:y1 }} /><motion.div className="mist m2" style={{ y:y2 }} /><motion.div className="canopy" style={{ scale }} /><motion.div className="leaf-blur l1" style={{ y:y2 }} /><motion.div className="leaf-blur l2" style={{ y:y1 }} /></div>;
}

function Chapter({ fruit, index }: { fruit: typeof fruits[number]; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end","end start"] });
  const y = useTransform(scrollYProgress, [0,1], [120,-120]);
  const scale = useTransform(scrollYProgress, [0,.5,1], [.72,1.08,1.28]);
  const rotate = useTransform(scrollYProgress, [0,.5,1], [-10,0,10]);
  return <section ref={ref} id={fruit.id} className={`chapter ${index%2 ? "flip" : ""}`} style={{ "--accent": fruit.color } as React.CSSProperties}>
    <div className="chapter-number">0{index+1}</div>
    <motion.div className="copy" initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{amount:.3,once:true}} transition={{duration:.8}}>
      <span className="kicker">{fruit.subtitle}</span><h2>{fruit.name}</h2><p>{fruit.story}</p>
      <div className="facts"><div><span>Origin</span><b>{fruit.origin}</b></div><div><span>Season</span><b>{fruit.season}</b></div><div><span>Taste</span><b>{fruit.taste}</b></div></div>
    </motion.div>
    <motion.div className="fruit-stage" style={{ y, scale, rotate }}><div className="fruit-orbit"/><div className="fruit-glyph">{fruit.icon}</div></motion.div>
    <motion.div className="nutrition" initial={{opacity:0,x:index%2?-30:30}} whileInView={{opacity:1,x:0}} viewport={{amount:.35,once:true}} transition={{duration:.8}}>
      <div className="metric"><Droplets size={17}/><span>Water</span><b>{fruit.water}</b></div><div className="metric"><Sparkles size={17}/><span>Energy</span><b>{fruit.calories}</b></div>
      {fruit.facts.map(([label,value]) => <div className="nutrient" key={String(label)}><div><span>{label}</span><span>{value}%</span></div><div className="bar"><motion.i initial={{width:0}} whileInView={{width:`${value}%`}} viewport={{once:true}} transition={{duration:1.1}}/></div></div>)}
    </motion.div>
  </section>;
}

export default function Fruitverse() {
  const [query,setQuery] = useState("");
  const list = useMemo(() => fruits.filter(f => f.name.toLowerCase().includes(query.toLowerCase())), [query]);
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0,.18], [1.02,1.18]);
  const heroOpacity = useTransform(scrollYProgress, [0,.16], [1,0]);
  return <main>
    <Atmosphere/><Rail/>
    <nav><a className="brand" href="#top"><Leaf size={17}/>FRUITVERSE</a><div className="navlinks"><a href="#mango">Journey</a><a href="#explorer">Explorer</a><a href="#about">About</a></div><a className="pill" href="#explorer">Explore <ArrowRight size={15}/></a></nav>
    <section className="hero" id="top"><motion.div className="hero-media" style={{scale:heroScale,opacity:heroOpacity}}><Image src="/images/forest-hero.webp" alt="Cinematic fruit forest" fill priority sizes="100vw"/><div className="shade"/></motion.div><div className="hero-copy"><span className="kicker"><Sparkles size={14}/> A living fruit encyclopedia</span><h1>ENTER<br/>THE <em>WILD</em></h1><p>Move through a living rainforest where every scroll reveals a new fruit, its story, origin, season and nutrition.</p><a className="hero-cta" href="#mango">Begin the journey <ArrowDown size={16}/></a></div><div className="hero-meta"><span><Trees size={16}/> 06 chapters</span><span><Wind size={16}/> cinematic scroll</span></div></section>
    <section className="threshold"><p>The forest changes as you descend. <span>Follow the light.</span></p></section>
    {fruits.map((fruit,index)=><Chapter key={fruit.id} fruit={fruit} index={index}/>)}
    <section className="explorer" id="explorer"><div className="explorer-head"><div><span className="kicker">FRUIT INDEX</span><h2>Explore the canopy.</h2></div><label className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search fruits..."/></label></div><div className="grid">{list.map((fruit,index)=><motion.a href={`#${fruit.id}`} className="card" key={fruit.id} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:index*.05}} style={{"--accent":fruit.color} as React.CSSProperties}><span className="card-icon">{fruit.icon}</span><div><small>{fruit.origin}</small><h3>{fruit.name}</h3><p>{fruit.taste}</p></div><ArrowRight size={18}/></motion.a>)}</div></section>
    <footer id="about"><div className="footer-brand"><Leaf size={20}/> FRUITVERSE</div><h2>A healthier tomorrow<br/><em>grows here.</em></h2><p>A crafted digital experience where information behaves like part of the landscape — quiet, immersive and alive.</p><a href="#top">Return to forest edge <ArrowRight size={16}/></a></footer>
  </main>;
}
