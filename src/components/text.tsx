import type { CSSProperties } from "react";

// Text that moves in. These render on the server: each word (or letter) is
// a masked span carrying its index, and CSS plays the entrance once the
// nearest `.reveal` ancestor is marked shown. The words themselves stay in
// the HTML, so search engines, screen readers and no-JS visitors get plain
// text.

const idx = (i: number) => ({ "--i": i }) as CSSProperties;

/** Words that rise out of a mask one after another. `start` continues a count across pieces. */
export function Words({ text, start = 0 }: { text: string; start?: number }) {
  let n = start;
  return (
    <>
      {text.split(/(\s+)/).map((part, i) =>
        /^\s+$/.test(part) || part === "" ? (
          part
        ) : (
          <span key={i} className="w" style={idx(n++)}>
            <span className="w__in">{part}</span>
          </span>
        ),
      )}
    </>
  );
}

export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** A heading with one italic phrase, all of it rising word by word. */
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
