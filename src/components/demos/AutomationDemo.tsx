"use client";

import { Archive, CornerUpLeft, Star, Tag } from "lucide-react";
import { Avatar, Badge, Check, Collapse, Icon, Roll, Stage, Text, Window, type Act } from "@/stageshow/kit";
import { getDict } from "@/lib/i18n";
import { demoTokens, type DemoProps } from "./tokens";
import "./automation.css";

// AI automation, a finished workflow: an order arrives by email and nobody
// has to touch it. No cursor; the system is the actor. Beats: the workflow
// wakes; it reads the email; as Claude extracts the order, each phrase is
// marked in the email and lands as a field in the run; order #1042 (the one
// the backend dashboard shows) is created; the customer gets a reply and the
// email is labelled. Plays once; the poster is the payoff.

type S = { awake: boolean; done: number; marks: number };

const initial: S = { awake: false, done: 0, marks: 0 };
const poster: S = { awake: true, done: 4, marks: 4 };
const MARKS = 4; // phrases Claude marks, one per extracted field

async function script(a: Act<S>) {
  await a.wait(500);
  a.mark("wake");
  a.put({ awake: true });
  await a.wait(800);
  a.put({ done: 1 });
  await a.wait(400);
  a.mark("extract");
  for (let i = 1; i <= MARKS; i++) {
    a.put({ marks: i });
    await a.wait(380);
  }
  await a.wait(250);
  a.put({ done: 2 });
  await a.wait(700);
  a.put({ done: 3 });
  await a.wait(700);
  a.mark("reply");
  a.put({ done: 4 });
  await a.wait(2600);
}

function Runs({ runs, marks }: { runs: { t: string; m?: number }[]; marks: number }) {
  return (
    <>
      {runs.map((run, i) =>
        run.m ? (
          <mark key={i} data-on={marks >= run.m || undefined}>
            {run.t}
          </mark>
        ) : (
          <span key={i}>{run.t}</span>
        ),
      )}
    </>
  );
}

export function AutomationDemo({ lang, theme }: DemoProps) {
  const t = getDict(lang).demos.automation;
  return (
    <Stage
      width={620}
      height={400}
      compact={{ below: 560, width: 358, height: 560 }}
      initial={initial}
      poster={poster}
      script={script}
      play="once"
      fidelity="realistic"
      theme={theme}
      tokens={demoTokens(theme)}
      className="au"
    >
      {(s) => {
        const status = s.done >= 4 ? t.done : s.awake ? t.running : t.waiting;
        return (
          <>
            <Window
              title={t.inbox}
              className="au-mail"
              toolbar={
                <span className="au-tools" aria-hidden>
                  <Archive size={14} strokeWidth={1.5} absoluteStrokeWidth />
                  <CornerUpLeft size={14} strokeWidth={1.5} absoluteStrokeWidth />
                  <Star size={14} strokeWidth={1.5} absoluteStrokeWidth />
                </span>
              }
            >
              <div className="au-letter">
                <div className="au-subject">{t.subject}</div>
                <div className="au-tags">
                  {t.tags.map((tag, i) => (
                    <span key={tag} className="au-tag" data-on={s.done >= (i === 0 ? 3 : 4) || undefined}>
                      <Tag size={10} strokeWidth={2} aria-hidden />
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="au-from">
                  <Avatar name={t.initials} size={30} />
                  <div className="au-from-text">
                    <Text className="au-sender">{t.sender}</Text>
                    <Text className="au-addr">{`${t.address} · ${t.to}`}</Text>
                  </div>
                  <Text className="au-time">09:41</Text>
                </div>
                <p className="au-text">
                  <Runs runs={t.letter} marks={s.marks} />
                </p>
                <p className="au-text au-where">
                  <Runs runs={t.where} marks={s.marks} />
                </p>
                <p className="au-text au-sign">{t.sign}</p>
                <div className="au-reply" data-on={s.done >= 4 || undefined}>
                  <Icon name="send" size={13} filled />
                  <span>{t.reply}</span>
                </div>
              </div>
            </Window>

            <section className="au-run" aria-label={t.run}>
              <header className="au-run-head">
                <span className="au-trigger">
                  <Icon name="bolt" size={13} filled />
                </span>
                <span className="au-run-text">
                  <span className="au-run-title">{t.run}</span>
                  <span className="au-run-sub">{t.trigger}</span>
                </span>
                <Badge tone={s.done >= 4 ? "success" : s.awake ? "accent" : "neutral"} dot className="au-badge">
                  <Roll variant="fade">{status}</Roll>
                </Badge>
              </header>
              <ol className="au-steps">
                {t.steps.map((label, i) => {
                  const on = s.done > i;
                  const pending = s.awake && s.done === i;
                  return (
                    <li key={label} className="au-step" data-state={on ? "done" : pending ? "active" : "idle"}>
                      <div className="au-step-line">
                        <Check on={on} pending={pending} size={16} />
                        <span>{label}</span>
                      </div>
                      {i === 1 && (
                        <div className="au-fields">
                          {t.fields.map(([k, v], j) => (
                            <Collapse key={k} open={s.marks > j}>
                              <div className="au-field">
                                <span className="au-key">{k}</span>
                                <span className="au-val">{v}</span>
                              </div>
                            </Collapse>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          </>
        );
      }}
    </Stage>
  );
}
