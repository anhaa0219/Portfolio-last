import { cacheLife } from "next/cache";

export type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

export type Contributions = {
  total: number;
  days: Day[];
  /** Days grouped into calendar columns, Sunday first, as GitHub draws them. */
  weeks: (Day | null)[][];
  longestStreak: number;
  currentStreak: number;
  best: Day | null;
  activeDays: number;
  /** Totals per calendar month, oldest first; `month` is 0 to 11. */
  months: { year: number; month: number; count: number }[];
};

// GitHub has no public endpoint for the contribution calendar, so this reads
// it through the open github-contributions-api, which scrapes the profile page.
const ENDPOINT = "https://github-contributions-api.jogruber.de/v4";

export async function getContributions(user: string): Promise<Contributions | null> {
  "use cache";
  cacheLife("hours");

  try {
    const res = await fetch(`${ENDPOINT}/${user}?y=last`);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      total: { lastYear: number };
      contributions: Day[];
    };
    return summarize(json.contributions, json.total.lastYear);
  } catch {
    return null;
  }
}

function summarize(days: Day[], total: number): Contributions {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  // Pad the first week so each column starts on Sunday
  const weeks: (Day | null)[][] = [];
  const firstDow = sorted.length ? new Date(`${sorted[0].date}T00:00:00Z`).getUTCDay() : 0;
  let week: (Day | null)[] = Array.from({ length: firstDow }, () => null);
  for (const d of sorted) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push([...week, ...Array.from({ length: 7 - week.length }, () => null)]);

  let longest = 0;
  let run = 0;
  let best: Day | null = null;
  let active = 0;
  for (const d of sorted) {
    if (d.count > 0) {
      run += 1;
      active += 1;
      longest = Math.max(longest, run);
      if (!best || d.count > best.count) best = d;
    } else {
      run = 0;
    }
  }

  // The current streak may end yesterday: today is not over yet
  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].count > 0) current += 1;
    else if (i === sorted.length - 1) continue;
    else break;
  }

  const months: Contributions["months"] = [];
  for (const d of sorted) {
    const [y, m] = d.date.split("-").map(Number);
    const last = months[months.length - 1];
    if (last && last.year === y && last.month === m - 1) last.count += d.count;
    else months.push({ year: y, month: m - 1, count: d.count });
  }

  return { total, days: sorted, weeks, longestStreak: longest, currentStreak: current, best, activeDays: active, months: months.slice(-12) };
}
