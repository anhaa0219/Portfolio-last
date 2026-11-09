"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getDict, type Lang } from "@/lib/i18n";
import { site } from "@/lib/site";
import { CloudBand } from "./ascii/CloudBand";

// The opening frame, after the Kumo template: clouds over paper and a
// counter in the corner. It counts with the page's real load, never holds
// longer than it has to, and plays once per visit. A CSS fallback in
// globals.css hides it even if this script never runs.

const KEY = "am-loader-seen";

/** Lets the hero start its entrance: the loader has lifted (or was skipped). */
const intro = () => document.documentElement.setAttribute("data-intro", "");

export function Loader({ lang }: { lang: Lang }) {
  const t = getDict(lang).loader;
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
      sessionStorage.setItem(KEY, "1");
    } catch {}
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) {
      intro();
      raf.current = requestAnimationFrame(() => setGone(true));
      return () => cancelAnimationFrame(raf.current);
    }

    let loaded = document.readyState === "complete";
    const onLoad = () => (loaded = true);
    window.addEventListener("load", onLoad);
    const start = performance.now();
    let value = 0;
    const tick = (now: number) => {
      // Ease toward 90% on time alone; the last stretch waits for the load event
      const ceiling = loaded ? 100 : 90;
      const goal = Math.min(ceiling, ((now - start) / 1400) * 100);
      value += (goal - value) * 0.12 + (loaded ? 0.6 : 0);
      value = Math.min(ceiling, value);
      setPct(Math.floor(value));
      if (value >= 100) {
        setLeaving(true);
        intro();
        window.setTimeout(() => setGone(true), 700);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  if (gone) return null;

  return (
    <div className="loader" data-leaving={leaving || undefined} role="status" aria-label={t.loading(pct)}>
      <CloudBand className="loader__clouds" bank="even" cover={0.5} size={13} interactive={false} speed={2} />
      <div className="loader__corner loader__corner--tl">
        <span className="mark mark--photo" aria-hidden>
          <Image src={site.photo} alt="" width={64} height={64} priority />
        </span>
      </div>
      <div className="loader__corner loader__corner--tr label">{t.tagline}</div>
      <div className="loader__corner loader__corner--bl label">{t.drawing}</div>
      <div className="loader__corner loader__corner--br loader__pct">{String(pct).padStart(3, "0")}%</div>
    </div>
  );
}
