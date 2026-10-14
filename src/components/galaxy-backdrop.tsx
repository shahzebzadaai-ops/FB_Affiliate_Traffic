"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  twinkle: number;
  drift: number;
  phase: number;
};

const FRAME_MS = 1000 / 30;

export function GalaxyBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 767px)");
    let stars: Star[] = [];
    let frame = 0;
    let last = 0;
    let alive = true;

    function starCount() {
      return mobile.matches ? 36 : 84;
    }

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(width * ratio);
      canvas!.height = Math.floor(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      stars = Array.from({ length: starCount() }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() < 0.88 ? 0.4 + Math.random() * 0.9 : 1.1 + Math.random() * 0.7,
        alpha: 0.28 + Math.random() * 0.62,
        twinkle: 0.35 + Math.random() * 1.3,
        drift: 2 + Math.random() * 5,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function draw(time: number) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      context!.clearRect(0, 0, width, height);
      const still = motion.matches;
      for (const star of stars) {
        const alpha = still ? star.alpha : star.alpha * (0.55 + 0.45 * Math.sin(time / 1000 * star.twinkle + star.phase));
        context!.fillStyle = `rgba(236, 244, 255, ${alpha.toFixed(3)})`;
        context!.beginPath();
        context!.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        context!.fill();
        if (still) continue;
        star.x += star.drift * 0.012;
        star.y -= star.drift * 0.006;
        if (star.x > width + 4) star.x = -4;
        if (star.y < -4) star.y = height + 4;
      }
    }

    function loop(time: number) {
      if (!alive || document.hidden || motion.matches) return;
      frame = window.requestAnimationFrame(loop);
      if (time - last < FRAME_MS) return;
      last = time;
      draw(time);
    }

    function start() {
      window.cancelAnimationFrame(frame);
      if (!motion.matches && !document.hidden) frame = window.requestAnimationFrame(loop);
    }

    function onResize() {
      resize();
      draw(0);
    }
    function onMotion() {
      draw(0);
      start();
    }

    resize();
    draw(0);
    start();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", start);
    motion.addEventListener("change", onMotion);
    mobile.addEventListener("change", onResize);

    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", start);
      motion.removeEventListener("change", onMotion);
      mobile.removeEventListener("change", onResize);
    };
  }, []);

  return (
    <div className="galaxy" aria-hidden="true">
      <div className="galaxy-band" />
      <canvas ref={canvasRef} className="galaxy-stars" />
    </div>
  );
}
