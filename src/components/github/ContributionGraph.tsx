"use client";

import { useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { Contributions, Day } from "@/lib/github";
import { getDict, type Lang } from "@/lib/i18n";
import { CountUp, Scramble, useInView } from "../motion";

// The last year on GitHub, told as it scrolls in: the labels decode, the
// figures count up, the calendar inks in as a diagonal wave from the oldest
// week to today, and a light sweeps across it.

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Dates are written by hand, not with Intl, so the server and the browser
// can never disagree about a Mongolian month and break hydration
function dateText(iso: string, lang: Lang, year: boolean) {
  const [y, m, d] = iso.split("-").map(Number);
  if (lang === "mn") return `${year ? `${y} оны ` : ""}${m}-р сарын ${d}`;
  return `${EN_MONTHS[m - 1]} ${d}${year ? `, ${y}` : ""}`;
}

type Tip = { day: Day; x: number; y: number } | null;
const v = (o: Record<string, string | number>) => o as CSSProperties;

export function ContributionGraph({ data, profile, lang }: { data: Contributions; profile: string; lang: Lang }) {
  const t = getDict(lang).github;
  const [tip, setTip] = useState<Tip>(null);
  const [calRef, calIn] = useInView<HTMLDivElement>();

  // A month label sits over the first column that starts in that month
  const monthLabels = (() => {
    const out: { col: number; name: string }[] = [];
    let last = -1;
    data.weeks.forEach((week, col) => {
      const first = week.find(Boolean);
      if (!first) return;
      const m = Number(first.date.slice(5, 7)) - 1;
      if (m !== last) {
        if (col < data.weeks.length - 2) out.push({ col, name: t.months[m] });
        last = m;
      }
    });
    return out.filter((m, i) => i === out.length - 1 || out[i + 1].col - m.col >= 3);
  })();

  const onCell = (e: ReactPointerEvent<HTMLDivElement>) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-date]");
    if (!cell) return setTip(null);
    const box = e.currentTarget.getBoundingClientRect();
    const c = cell.getBoundingClientRect();
    const day = data.days.find((d) => d.date === cell.dataset.date);
    if (day) setTip({ day, x: c.left - box.left + c.width / 2, y: c.top - box.top });
  };

  const stats = [
    { k: t.total, n: data.total, unit: "" },
    { k: t.longest, n: data.longestStreak, unit: t.days(data.longestStreak) },
    { k: t.current, n: data.currentStreak, unit: t.days(data.currentStreak) },
    { k: t.active, n: data.activeDays, unit: `/ ${data.days.length}` },
  ];

  return (
    <div className="gh">
      <dl className="gh-stats">
        {stats.map((s, i) => (
          <div key={s.k} className="gh-stat" style={v({ "--i": i })}>
            <dt className="label">
              <Scramble text={s.k} />
            </dt>
            <dd className="gh-stat__v">
              <CountUp value={s.n} duration={1400 + i * 200} />
              {s.unit && <span className="gh-stat__unit"> {s.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <div className="gh-card" ref={calRef} data-in={calIn || undefined}>
        <div className="gh-bar">
          <span className="label">
            <Scramble text={t.summary(data.total)} />
          </span>
          <span className="gh-legend" aria-hidden>
            {t.less}
            {[0, 1, 2, 3, 4].map((l) => (
              <i key={l} className="gh-cell" data-level={l} />
            ))}
            {t.more}
          </span>
        </div>

        <div className="gh-stage" onPointerLeave={() => setTip(null)}>
          <div className="gh-scroll">
            <div className="gh-cal" style={v({ "--weeks": data.weeks.length })}>
              <div className="gh-months" aria-hidden>
                {monthLabels.map((m) => (
                  <span key={`${m.name}-${m.col}`} style={{ gridColumn: m.col + 1 }}>
                    {m.name}
                  </span>
                ))}
              </div>
              <div className="gh-days" aria-hidden>
                <span style={{ gridRow: 2 }}>{t.weekdays[0]}</span>
                <span style={{ gridRow: 4 }}>{t.weekdays[1]}</span>
                <span style={{ gridRow: 6 }}>{t.weekdays[2]}</span>
              </div>
              <div className="gh-grid" onPointerMove={onCell} role="img" aria-label={t.summary(data.total)}>
                {data.weeks.map((week, w) =>
                  week.map((day, d) =>
                    day ? (
                      <div
                        key={day.date}
                        className="gh-cell"
                        data-date={day.date}
                        data-level={day.level}
                        style={v({ gridColumn: w + 1, gridRow: d + 1, "--d": w + d * 2 })}
                      />
                    ) : null,
                  ),
                )}
                <span className="gh-sweep" aria-hidden />
              </div>
            </div>
          </div>

          {tip && (
            <div className="gh-tip" style={{ left: tip.x, top: tip.y }} role="tooltip">
              {t.tip(tip.day.count, dateText(tip.day.date, lang, true))}
            </div>
          )}
        </div>

        <div className="gh-bar gh-bar--foot">
          <a className="link gh-profile" href={`https://github.com/${profile}`} target="_blank" rel="noreferrer">
            github.com/{profile} ↗
          </a>
        </div>
      </div>
    </div>
  );
}
