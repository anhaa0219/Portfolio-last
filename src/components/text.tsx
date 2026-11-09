import type { CSSProperties } from "react";

// Text that moves in. These render on the server: each word (or letter) is
// a span carrying its index and, for words, a scatter: where it flies in
// from. CSS plays the entrance once the nearest `.reveal` ancestor is marked
// shown. The words themselves stay in the HTML, so search engines, screen
// readers and no-JS visitors get plain text.

const idx = (i: number) => ({ "--i": i }) as CSSProperties;

/** A fixed pseudo-random number in -1..1 for a word, the same on every render. */
function scatter(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/** Where a word flies in from: off to a side, below or above, turned. */
const flight = (i: number) =>
  ({
    "--i": i,
    "--fx": `${Math.round(scatter(i, 1) * 180)}px`,
    "--fy": `${Math.round(70 + scatter(i, 2) * 130)}px`,
    "--fr": `${Math.round(scatter(i, 3) * 45)}deg`,
  }) as CSSProperties;

/** Words that fly in from scattered places and settle into the line. `start` continues a count across pieces. */
export function Words({ text, start = 0 }: { text: string; start?: number }) {
  let n = start;
  return (
    <>
      {text.split(/(\s+)/).map((part, i) =>
        /^\s+$/.test(part) || part === "" ? (
          part
        ) : (
          <span key={i} className="w" style={flight(n++)}>
            <span className="w__in">{part}</span>
          </span>
        ),
      )}
    </>
  );
}

export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** A heading with one italic phrase, every word flying in. */
export function Headline({ parts }: { parts: readonly [string, string, string] }) {
  const a = wordCount(parts[0]);
  const b = wordCount(parts[1]);
  return (
    <>
      <Words text={parts[0]} />
      <em>
        <Words text={parts[1]} start={a} />
      </em>
      <Words text={parts[2]} start={a + b} />
    </>
  );
}

/** Letters that drop in one by one and jump when hovered. */
export function Chars({ text, start = 0, className }: { text: string; start?: number; className?: string }) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="ch" style={idx(start + i)} aria-hidden>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}
