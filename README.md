# Fruitverse — The Sakura Sanctuary

A cinematic Japanese fairyland with a locally hosted, silent background film: moving cherry blossoms, swaying lanterns, water shimmer, and a slow camera journey through a generated garden. The film is rendered from the garden's Three.js animation. Scroll changes the framing and atmosphere through four chapters; a guided tour moves through them automatically.

```sh
npm ci
npm run dev
```

For production, run `npm run build` then `npm start`. No environment variables, database, external media services, or secrets are required. Node 24.19.0 and npm 11.9.0 were used for validation.

## Background film

[View the garden film](public/videos/sakura-sanctuary.mp4).

- `public/videos/sakura-sanctuary.mp4`: 1280 × 720 H.264, silent, loopable garden film.
- `public/videos/sakura-sanctuary-mobile.mp4`: smaller phone version of the same film.
- `public/images/sakura-sanctuary.webp`: immediate poster and still-image fallback.

Playback uses muted inline video, an overlap at the loop boundary, and fast-start MP4 encoding. Pause stops both the film and mist. Playback suspends while the page is hidden or the scene is offscreen. Reduced-motion preferences show the still garden without downloading a video. Autoplay refusal leaves the poster visible and offers the existing resume control; video failures preserve the usable page and fruit collection.

Select **Begin the journey** for a slow guided tour. Manual scrolling stops the tour. **Discover the fruits** opens the six-fruit collection, with native modal focus containment, Escape dismissal, and previous/next controls. Fullscreen is optional.

The generated garden and earlier fruit photography are bundled locally. The Three.js scene source remains in `components/fairyland/FairyScene.tsx`; the page plays the encoded film so it does not need WebGL. No external font or image request is needed at runtime.
