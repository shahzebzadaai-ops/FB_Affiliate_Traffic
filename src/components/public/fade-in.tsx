"use client";

import { useEffect, useRef, type ReactNode } from "react";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section";
};

/** Visible unless `html.cine-motion` is set, so a failed script does not hide the page. */
export function FadeIn({ children, className, delay = 0, as = "div" }: FadeInProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!motion.matches) document.documentElement.classList.add("cine-motion");
    if (motion.matches) {
      node.classList.add("is-in");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        node.classList.add("is-in");
        observer.disconnect();
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as;
  return (
    <Tag ref={ref as never} className={className ? `cine-reveal ${className}` : "cine-reveal"} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
