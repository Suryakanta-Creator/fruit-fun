# Fruitverse

A Next.js forest journey with seven full-viewport photographic scenes. The opening view has no visible navigation, text or buttons. Native scrolling drives camera push-in, lateral drift, independent foreground foliage, light shafts, floating motes, scene crossfades, then captions and staggered understated controls. Fruit details and a searchable index remain available.

## Run

```sh
npm ci
npm run dev
npm run build
```

## Imagery and motion

Assets in `public/images/*-scene.webp` and `*-mobile.webp` were generated with the built-in image-generation tool using the original “Mango in the Enchanted Forest” reference. Brief: dense emerald rainforest, warm sunbeams, wet natural textures, centered fruit growing on its plant, no interface or typography. Subjects: forest entrance, mango, orange, apple, watermelon on a vine, dragon fruit on a cactus, durian.

Source resolution is 1672 × 941, not native 4K. Portrait WebP crops serve smaller screens. A transparent generated foliage frame moves independently from each landscape to create depth. These are still-image camera animations, not actual 3D geometry or video. Animation runs on demand and respects reduced-motion preferences; touch scrolling stays native. A static production build checks TypeScript.
