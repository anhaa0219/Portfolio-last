"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import type { Lang } from "@/lib/i18n";

import { THEME_KEY as KEY, type Theme } from "@/lib/theme-script";

export type { Theme };

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

/** The live theme, read off <html data-theme>; "light" on the server. */
export function useTheme(): Theme {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light"),
    () => "light",
  );
}

/** Day and night. Both icons render on the server; CSS shows the right one, so nothing flashes. */
export function ThemeToggle({ label }: { label: string }) {
  const flip = () => {
    const next: Theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
  };
  return (
    <button type="button" className="toggle toggle--theme" onClick={flip} aria-label={label} title={label}>
      <Sun className="toggle__sun" size={16} strokeWidth={1.75} aria-hidden />
      <Moon className="toggle__moon" size={16} strokeWidth={1.75} aria-hidden />
    </button>
  );
}

/**
 * Jumps to the same place on the page in the other language. A plain link,
 * so it is a full page load: the root layout changes with the language, and
 * the head script that restores day or night only runs on a real load.
 */
export function LangSwitch({ to, text, label }: { to: Lang; text: string; label: string }) {
  return (
    <a
      className="toggle toggle--lang"
      href={`/${to}`}
      hrefLang={to}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.currentTarget.href = `/${to}${location.hash}`;
      }}
    >
      {text}
    </a>
  );
}
