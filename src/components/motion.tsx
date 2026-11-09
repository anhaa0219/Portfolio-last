"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// Small pieces of motion shared across the page. Each one renders its final
// state on the server and only animates once it is on screen, and none of
// them move for a visitor who asked for reduced motion.

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True once the element has scrolled into view (and stays true). */
export function useInView<T extends Element>(margin = "0px 0px -12% 0px"): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return [ref, seen];
}

const GLYPHS = ".:-=+*#%@/\\<>[]{}01";

/**
 * Text that decodes out of ASCII noise, left to right, the first time it is
 * seen: the template's printed-by-machine feel, applied to labels.
 */
export function Scramble({ text, className }: { text: string; className?: string }) {
  const [ref, seen] = useInView<HTMLSpanElement>();
  const [shown, setShown] = useState(text);
  useEffect(() => {
    if (!seen || reducedMotion()) return;
    const chars = Array.from(text);
    const start = performance.now();
    const dur = 500 + chars.length * 28;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const settled = Math.floor(p * chars.length);
      setShown(
        p >= 1
          ? text
          : chars.map((c, i) => (i < settled || c === " " ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(""),
      );
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, text]);
  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden>{shown}</span>
    </span>
  );
}

/** A number that counts up from zero when it comes into view. */
export function CountUp({ value, duration = 1600, className }: { value: number; duration?: number; className?: string }) {
  const [ref, seen] = useInView<HTMLSpanElement>();
  const [n, setN] = useState(value);
  useEffect(() => {
    if (!seen || reducedMotion()) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // Fast, then settling into the figure
      setN(Math.round(value * (1 - Math.pow(2, -10 * p))));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setN(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, value, duration]);
  return (
    <span ref={ref} className={className}>
      {n.toLocaleString("en-US")}
    </span>
  );
}

