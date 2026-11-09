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

const MAGNETIC = ".btn, .toggle, .replay, .nav__links a, .contact__action, .hero__shape, .gh-bar-col";
const LINKISH = "a, button, [role='tab'], .gh-cell, .portrait";

/**
 * A ring that trails the pointer, swells over anything clickable, says
 * "Drag" over the hero, and pulls buttons a little toward itself. Only for
 * a mouse or trackpad, never for touch or reduced motion. The real cursor
 * stays visible: the ring is company, not a replacement.
 */
export function Cursor({ dragLabel }: { dragLabel: string }) {
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ring.current;
    if (!el || reducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let x = -100, y = -100, rx = -100, ry = -100;
    let raf = 0;
    let magnet: HTMLElement | null = null;

    const loop = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      el.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const release = () => {
      if (magnet) magnet.style.transform = "";
      magnet = null;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      el.dataset.on = "";
      const t = e.target instanceof Element ? e.target : null;
      const control = t?.closest(LINKISH);
      const inHero = !control && t?.closest(".hero");
      el.dataset.state = control ? "link" : inHero ? "drag" : "";

      const m = t?.closest<HTMLElement>(MAGNETIC) ?? null;
      if (m !== magnet) release();
      if (m) {
        magnet = m;
        const b = m.getBoundingClientRect();
        const dx = (x - (b.left + b.width / 2)) * 0.25;
        const dy = (y - (b.top + b.height / 2)) * 0.35;
        m.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      }
    };
    const leave = () => {
      delete el.dataset.on;
      release();
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      release();
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <div ref={ring} className="cursor" aria-hidden>
      <span className="cursor__ring" />
      <span className="cursor__label">{dragLabel}</span>
    </div>
  );
}
