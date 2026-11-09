"use client";

import { ShoppingBag, X } from "lucide-react";
import { Button, Collapse, Count, Icon, Stage, Text, Window, type Act } from "@/stageshow/kit";
import { getDict } from "@/lib/i18n";
import { demoTokens, type DemoProps } from "./tokens";
import "./storefront.css";

// Frontend, a finished storefront: Nomad Food, a food-ordering site. Beats:
// the cursor adds khuushuur; the button confirms on itself; the cart's count
// and total roll; the cursor opens the cart; the drawer slides in with the
// order, the new line arriving last, and the cursor settles on Checkout.
// Realistic fidelity: every word on screen is real, as on a shipped site.

type S = { added: boolean; count: number; total: number; open: boolean; line: boolean };

const initial: S = { added: false, count: 2, total: 18500, open: false, line: false };
const poster: S = { added: true, count: 3, total: 30500, open: true, line: true };

const tugrik = (n: number) => `₮${Math.round(n).toLocaleString("en-US")}`;

async function script(a: Act<S>) {
  await a.wait(700);
  a.mark("add");
  await a.move("add");
  await a.wait(200);
  await a.click("add");
  a.put({ added: true });
  await a.wait(350);
  a.put({ count: 3, total: 30500 });
  await a.wait(700);
  a.mark("cart");
  await a.move("cart");
  await a.wait(150);
  await a.click("cart");
  a.put({ open: true });
  await a.wait(450);
  a.put({ line: true });
  await a.wait(900);
  await a.move("checkout");
  await a.wait(2600);
}

const REST = { wide: { x: 470, y: 340 }, compact: { x: 250, y: 380 } };

export function StorefrontDemo({ lang, theme }: DemoProps) {
  const t = getDict(lang).demos.storefront;
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
      cursor={{ at: REST }}
      className="sf"
    >
      {(s, _rect, layout) => {
        const wide = layout === "wide";
        return (
          <>
            <Window url="nomadfood.mn" urlShape="pill" className="sf-win">
              <div className="sf-page">
                <header className="sf-head">
                  <span className="sf-brand">
                    <span className="sf-logo" aria-hidden>
                      N
                    </span>
                    {t.brand}
                  </span>
                  {wide && (
                    <nav className="sf-nav">
                      {t.nav.map((n) => (
                        <span key={n}>{n}</span>
                      ))}
                    </nav>
                  )}
                  <span className="sf-cart" data-target="cart" data-cursor="pointer" data-open={s.open || undefined} data-bump={s.count > 2 || undefined}>
                    <span className="sf-bag">
                      <ShoppingBag size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                      <span className="sf-badge">
                        <Count value={s.count} duration={500} />
                      </span>
                    </span>
                    <Count className="sf-total" value={s.total} format={tugrik} duration={700} />
                  </span>
                </header>

                <div className="sf-row">
                  <div className="sf-title">{t.popular}</div>
                  {wide && (
                    <div className="sf-chips">
                      {t.cats.map((c, i) => (
                        <span key={c} className="sf-chip" data-on={i === 0 || undefined}>
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {!wide && (
                  <div className="sf-chips">
                    {t.cats.slice(0, 4).map((c, i) => (
                      <span key={c} className="sf-chip" data-on={i === 0 || undefined}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="sf-grid">
                  {t.dishes.slice(0, wide ? 3 : 2).map((d, i) => (
                    <article key={d.name} className="sf-card" data-focus={i === 0 || undefined}>
                      <div className={`sf-tile sf-tile--${i}`} aria-hidden>
                        {d.emoji}
                      </div>
                      <div className="sf-meta">
                        <Text className="sf-name">{d.name}</Text>
                        <Text className="sf-price">{d.price}</Text>
                      </div>
                      <Text className="sf-rate">{d.meta}</Text>
                      {i === 0 ? (
                        <Button
                          data-target="add"
                          data-cursor="pointer"
                          size="small"
                          variant={s.added ? "primary" : "secondary"}
                          icon={s.added ? <Icon name="check" size={14} /> : undefined}
                          className="sf-add"
                        >
                          {s.added ? t.added : t.add}
                        </Button>
                      ) : (
                        <Button size="small" className="sf-add">
                          {t.add}
                        </Button>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            </Window>

            {/* The cart drawer: anchored under the cart, where the site opens it */}
            <aside className="sf-drawer" data-open={s.open || undefined}>
              <div className="sf-drawer__head">
                <span>{t.cart}</span>
                <X size={15} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
              </div>
              {t.items.map(([n, q, p]) => (
                <div key={n} className="sf-line">
                  <span className="sf-line__n">{n}</span>
                  <span className="sf-line__q">{q}</span>
                  <span className="sf-line__p">{p}</span>
                </div>
              ))}
              <Collapse open={s.line} reveal="drop">
                <div className="sf-line" data-new>
                  <span className="sf-line__n">{t.dishes[0].name}</span>
                  <span className="sf-line__q">× 1</span>
                  <span className="sf-line__p">{t.dishes[0].price}</span>
                </div>
              </Collapse>
              <div className="sf-sum">
                <span>{t.total}</span>
                <Count value={s.total} format={tugrik} duration={700} />
              </div>
              <div className="sf-eta">{t.eta}</div>
              <Button variant="primary" size="large" className="sf-checkout" data-target="checkout" data-cursor="pointer">
                {t.checkout}
              </Button>
            </aside>
            <span data-target="rest" style={{ position: "absolute", left: REST[layout].x, top: REST[layout].y }} />
          </>
        );
      }}
    </Stage>
  );
}
