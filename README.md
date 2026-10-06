# Fruitverse — cinematic living forest

A Next.js forest experience that uses photoreal landscape assets rather than simple modeled trees and fruit. Full-screen WebGL image surfaces receive localized foliage sway, gentle fruit movement, water ripples and changing light. A separate dew pass draws small gravity-driven drops with refraction of the live forest, highlights and a soft rim. Native scrolling drives camera-style push-in, lateral motion, crossfades and an independently moving photographic foreground.

The forest surface shows no fruit names or facts. Hover gently highlights the fruit region. Click or tap opens its information; keyboard users can activate the current fruit. Escape and the close control dismiss the pop-up.

```sh
npm ci
npm run dev
npm run build
```

The renderer supports a 3840 × 2160 pixel budget on 4K displays. Phones use smaller images and a lower pixel ratio; sustained slow desktop rendering reduces resolution. Source landscape images are 1672 × 941 and are generated photoreal imagery, not native 4K photographs or filmed video. This is photo-based depth and localized image animation, not a geometric 3D forest. Reduced-motion preferences disable deformation and drift. Rendering pauses offscreen or in a hidden tab; textures and materials are disposed on unmount. WebGL-unavailable devices receive interactive image fallback.

The forest assets were generated using the built-in image-generation tool and the original “Mango in the Enchanted Forest” reference. The wind, water, droplets and lighting effects are rendered in shaders. The dew pass samples the live forest render target, which is resized with the canvas and disposed on unmount. Production builds check TypeScript; browser verification covers desktop and mobile interaction, hidden information, hover and the 4K drawing buffer.
