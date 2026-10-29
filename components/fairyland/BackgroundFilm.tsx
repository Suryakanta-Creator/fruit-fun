"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  paused: boolean;
  onReady: () => void;
  onFallback: () => void;
  onPlaybackBlocked: () => void;
};

/** A silent, locally hosted film; the poster remains visible if video is unavailable. */
export default function BackgroundFilm({ paused, onReady, onFallback, onPlaybackBlocked }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(preference.matches);
      if (preference.matches) onReady();
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, [onReady]);

  useEffect(() => {
    const element = video.current;
    if (!element || reduced !== false) return;
    let inView = true;
    let disposed = false;
    const sync = () => {
      if (paused || document.hidden || !inView) {
        element.pause();
      } else {
        // Browsers can refuse autoplay, even for silent films. Keep a usable poster
        // and let the existing resume button retry following a user interaction.
        void element.play().catch((error: DOMException) => {
          if (!disposed && error.name !== "AbortError") onPlaybackBlocked();
        });
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    element.addEventListener("canplay", sync);
    sync();
    return () => {
      disposed = true;
      element.pause();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      element.removeEventListener("canplay", sync);
    };
  }, [paused, reduced, onPlaybackBlocked]);

  if (reduced !== false) return null;
  return (
    <video
      ref={video}
      className="garden-film"
      muted
      loop
      playsInline
      preload="metadata"
      poster="/images/sakura-sanctuary.webp"
      aria-hidden="true"
      disablePictureInPicture
      onLoadedData={onReady}
      onError={onFallback}
    >
      <source src="/videos/sakura-sanctuary-mobile.mp4" type="video/mp4" media="(max-width: 700px)" onError={onFallback} />
      <source src="/videos/sakura-sanctuary.mp4" type="video/mp4" onError={onFallback} />
    </video>
  );
}
