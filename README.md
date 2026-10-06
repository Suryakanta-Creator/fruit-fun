# Fruitverse — living 3D jungle

Next.js with a dynamically loaded Three.js jungle. Native scrolling moves a perspective camera through a real-time 3D forest. Trees sway, instanced leaves bend in the wind, fruit floats and turns, and particles drift. Fruit models include a mango, orange, apple, watermelon, dragon fruit with scales, and durian with instanced spikes.

No visible names, descriptions, navigation or facts appear on the forest surface. Hover highlights and lifts a fruit. Click/tap raycasts the mesh and opens a pop-up with its information; keyboard users can activate the current fruit. Escape and the close control dismiss the pop-up. A photographic forest backdrop adds distance behind the geometry.

```sh
npm ci
npm run dev
npm run build
```

Rendering follows display size and pixel ratio, capped at 3840 × 2160 worth of pixels. A 4K display can render native 4K geometry; phones use a smaller pixel budget, and consistently slow desktop rendering lowers resolution. The photographic backdrop remains 1672 × 941, not native 4K photography. Reduced-motion preferences disable swaying and floating. Rendering pauses when hidden or offscreen, and geometry, materials and textures are disposed on unmount. WebGL-unavailable devices receive an interactive image fallback.

The existing forest assets were generated using the built-in image-generation tool and the original “Mango in the Enchanted Forest” reference. Mesh shapes, plant animation, bark and floor textures are generated in the renderer. Production builds check TypeScript; browser verification covers desktop/mobile clicks, hidden information and hover behavior.
