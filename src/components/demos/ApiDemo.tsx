"use client";

import { LayoutDashboard, Settings, ShoppingBag, UtensilsCrossed, Users } from "lucide-react";
import { Badge, Collapse, Count, Roll, Stage, Window, type Act } from "@/stageshow/kit";
import { getDict } from "@/lib/i18n";
import { demoTokens, type DemoProps } from "./tokens";
import "./api.css";

// Backend, a finished admin panel: the orders dashboard behind Nomad Food,
// fed by its own API. No cursor; the system is the actor. Beats: a request
// lands in the API log; the new order drops into the top of the table,
// marked; the day's count and revenue roll; a beat later the order moves on
// to "on the way" and the mark fades. Plays once; the poster is the payoff.

type S = { logged: boolean; row: boolean; stats: boolean; moved: boolean };

const initial: S = { logged: false, row: false, stats: false, moved: false };
const poster: S = { logged: true, row: true, stats: true, moved: true };

const tugrik = (n: number) => `₮${Math.round(n).toLocaleString("en-US")}`;
const ICONS = [LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, Settings];

async function script(a: Act<S>) {
  await a.wait(900);
  a.mark("log");
  a.put({ logged: true });
  await a.wait(500);
  a.mark("row");
  a.put({ row: true });
  await a.wait(350);
  a.put({ stats: true });
  await a.wait(1600);
  a.put({ moved: true });
  await a.wait(2400);
}

export function ApiDemo({ lang, theme }: DemoProps) {
  const t = getDict(lang).demos.api;
  const rows = [
    { id: "#1041", who: t.customers[1], total: "₮24,500", status: "onway" as const },
    { id: "#1040", who: t.customers[2], total: "₮51,000", status: "delivered" as const },
    { id: "#1039", who: t.customers[3], total: "₮12,000", status: "delivered" as const },
  ];
  const statusText = { preparing: t.preparing, onway: t.onway, delivered: t.delivered };
  const tone = { preparing: "warning", onway: "accent", delivered: "success" } as const;

  return (
    <Stage
      width={620}
      height={400}
      compact={{ below: 560, width: 358, height: 420 }}
      initial={initial}
      poster={poster}
      script={script}
      play="once"
      fidelity="realistic"
      theme={theme}
      tokens={demoTokens(theme)}
      className="api"
    >
      {(s, _rect, layout) => {
        const wide = layout === "wide";
        const fresh = s.moved ? "onway" : "preparing";
        return (
          <>
            <Window
              className="api-win"
              title={t.title}
              sidebarWidth={148}
              sidebar={
                wide ? (
                  <nav className="api-side">
                    <div className="api-brand">
                      <span className="api-logo" aria-hidden>
                        N
                      </span>
                      {t.brand}
                    </div>
                    {t.nav.map((label, i) => {
                      const Ico = ICONS[i];
                      return (
                        <div key={label} className="api-nav" data-selected={i === 1 || undefined}>
                          <Ico size={15} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                          <span>{label}</span>
                        </div>
                      );
                    })}
                  </nav>
                ) : undefined
              }
            >
              <div className="api-body">
                <div className="api-top">
                  <span className="api-today">{t.today}</span>
                  <Badge tone="success" dot className="api-live">
                    {t.live}
                  </Badge>
                </div>

                <div className="api-stats">
                  <div className="api-stat">
                    <span className="api-stat__k">{t.stats[0]}</span>
                    <Count className="api-stat__v" value={s.stats ? 129 : 128} duration={600} />
                  </div>
                  <div className="api-stat">
                    <span className="api-stat__k">{t.stats[1]}</span>
                    <Count className="api-stat__v" value={s.stats ? 3878000 : 3842000} format={tugrik} duration={800} />
                  </div>
                  {wide && (
                    <div className="api-stat">
                      <span className="api-stat__k">{t.stats[2]}</span>
                      <span className="api-stat__v">{t.avg}</span>
                    </div>
                  )}
                </div>

                <div className="api-table">
                  <div className="api-tr api-th">
                    <span>{t.cols[0]}</span>
                    {wide && <span>{t.cols[1]}</span>}
                    <span className="num">{t.cols[2]}</span>
                    <span>{t.cols[3]}</span>
                  </div>
                  <Collapse open={s.row} reveal="drop">
                    <div className="api-tr" data-new={!s.moved || undefined}>
                      <span className="api-id">#1042</span>
                      {wide && <span>{t.customers[0]}</span>}
                      <span className="num">₮36,000</span>
                      <span>
                        <Badge tone={tone[fresh]} dot>
                          <Roll variant="fade">{statusText[fresh]}</Roll>
                        </Badge>
                      </span>
                    </div>
                  </Collapse>
                  {rows.map((r) => (
                    <div key={r.id} className="api-tr">
                      <span className="api-id">{r.id}</span>
                      {wide && <span>{r.who}</span>}
                      <span className="num">{r.total}</span>
                      <span>
                        <Badge tone={tone[r.status]} dot>
                          {statusText[r.status]}
                        </Badge>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Window>

            <Window chrome="terminal" title="food-api — logs" className="api-term">
              <div>
                <span className="api-m">GET</span> /api/orders <span className="ok">200</span> <span className="dim">11ms</span>
              </div>
              <Collapse open={s.logged}>
                <div className="api-log">
                  <span className="api-m api-m--post">POST</span> /api/orders <span className="ok">201</span> <span className="dim">63ms</span>
                </div>
              </Collapse>
            </Window>
          </>
        );
      }}
    </Stage>
  );
}
