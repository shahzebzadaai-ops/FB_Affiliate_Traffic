"use client";

import { useEffect, useRef } from "react";

type BackgroundVideoProps = {
  src: string;
  poster: string;
  className?: string;
  /** Hero starts immediately. Other clips wait until they are near the viewport. */
  priority?: boolean;
};

export function BackgroundVideo({ src, poster, className, priority = false }: BackgroundVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const play = () => {
      if (motion.matches) {
        video.pause();
        return;
      }
      video.play().catch(() => {});
    };

    if (motion.matches) {
      video.pause();
      video.removeAttribute("autoplay");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) play();
        else video.pause();
      },
      { rootMargin: "180px 0px" },
    );
    observer.observe(video);
    if (priority) play();

    const onMotion = () => {
      if (motion.matches) video.pause();
    };
    motion.addEventListener("change", onMotion);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", onMotion);
    };
  }, [priority]);

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      autoPlay={priority}
      muted
      loop
      playsInline
      preload={priority ? "auto" : "metadata"}
      aria-hidden="true"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
