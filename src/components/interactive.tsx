"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** The time where Ankhbayar is, ticking. Rendered after mount so server and client agree. */
export function LocalTime({ zone, label }: { zone: string; label: string }) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [zone]);
  return (
    <span className="tabular">
      {label} {now ?? "--:--:--"}
    </span>
  );
}

/** The Kumo corner counter, here counting how far down the page you are. */
export function ScrollMeter() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setPct(max > 0 ? Math.round((window.scrollY / max) * 100) : 0);
      });
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, []);
  return (
    <div className="meter" aria-hidden>
      {String(pct).padStart(3, "0")}%
    </div>
  );
}

/** Copies a value and says so on the button itself. */
export function CopyButton({ value, className, children, copiedText }: { value: string; className?: string; children: ReactNode; copiedText: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);
  return (
    <button
      type="button"
      className={className}
      data-copied={copied || undefined}
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => setCopied(true), () => {});
      }}
    >
      <span className="copy__label" aria-live="polite">
        {copied ? copiedText : children}
      </span>
    </button>
  );
}

/** Fades its children up the first time they scroll into view. */
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "li" | "section" | "article" }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as never}
      className={`reveal${className ? ` ${className}` : ""}`}
      data-shown={shown || undefined}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/**
 * A card that tilts toward the pointer in 3D, with a glare that follows it.
 * Its layers can lift off the surface with `--depth` (translateZ).
 */
export function Tilt({ children, className, max = 10 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce), (hover: none)").matches) return;
    let raf = 0;
    const set = (x: number, y: number, on: boolean) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--rx", `${(-y * max).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${(x * max).toFixed(2)}deg`);
        el.style.setProperty("--gx", `${((x + 1) * 50).toFixed(1)}%`);
        el.style.setProperty("--gy", `${((y + 1) * 50).toFixed(1)}%`);
        el.dataset.tilt = on ? "on" : "";
      });
    };
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      set(((e.clientX - b.left) / b.width) * 2 - 1, ((e.clientY - b.top) / b.height) * 2 - 1, true);
    };
    const leave = () => set(0, 0, false);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [max]);
  return (
    <div ref={ref} className={`tilt${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}

/**
 * Depth for a stageshow demo without rotating it: the stage measures its
 * targets with getBoundingClientRect, so a 3D rotation on any ancestor would
 * throw its cursor off. Instead the layers behind it slide against the
 * pointer and the demo floats the other way, which reads as depth and keeps
 * every measurement true.
 */
export function DepthFrame({ children, className, back }: { children: ReactNode; className?: string; back?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce), (hover: none)").matches) return;
    let raf = 0;
    const set = (x: number, y: number) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", x.toFixed(3));
        el.style.setProperty("--py", y.toFixed(3));
      });
    };
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      set(((e.clientX - b.left) / b.width) * 2 - 1, ((e.clientY - b.top) / b.height) * 2 - 1);
    };
    const leave = () => set(0, 0);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <div ref={ref} className={`depth${className ? ` ${className}` : ""}`}>
      <div className="depth__back" aria-hidden>
        {back}
      </div>
      <div className="depth__plate" aria-hidden />
      <div className="depth__front">{children}</div>
    </div>
  );
}
