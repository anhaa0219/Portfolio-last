import type { LookTokens } from "@/stageshow/kit";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "../theme";

export type DemoProps = { lang: Lang; theme: Theme };

const SHARED: LookTokens = {
  "--ss-font": "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
  "--ss-term-path": "#8fa3e8",
  "--ss-term-sigil": "#9ee6b8",
  "--ss-term-ok": "#9ee6b8",
};

/**
 * One figure language for every demo on the page: the site's ink blue,
 * Geist, and a well toned to the page, by day on paper, by night on ink.
 */
export function demoTokens(theme: Theme): LookTokens {
  return theme === "dark"
    ? { ...SHARED, "--ss-accent": "#5b73d6", "--ss-accent-soft": "rgba(120, 140, 230, 0.2)", "--ss-well": "#1c2030" }
    : { ...SHARED, "--ss-accent": "#2f47a8", "--ss-accent-soft": "rgba(47, 71, 168, 0.12)", "--ss-well": "#e2dac6" };
}
