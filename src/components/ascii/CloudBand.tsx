"use client";

import { useEffect, useRef } from "react";
import { charAt, cloudField, drawRows, fitGrid, palette, PALETTE_EVENT, type Grid } from "./engine";

type Props = {
  className?: string;
  /** Character size in px. */
  size?: number;
  cover?: number;
  /** Where the bank is dense: "both" thins toward the middle, "bottom" and "top" pile on one side. */
  bank?: "both" | "bottom" | "top" | "even";
  /** Lets the pointer part the clouds. */
  interactive?: boolean;
  offset?: number;
  speed?: number;
};

const SHAPES = {
  both: (y: number) => Math.pow(Math.abs(y - 0.5) * 2, 2) * 0.55 - 0.18,
  bottom: (y: number) => y * y * 0.7 - 0.3,
  top: (y: number) => (1 - y) * (1 - y) * 0.7 - 0.3,
  even: () => 0,
};

/** A strip of drifting ASCII clouds that pauses offscreen. */
export function CloudBand({ className, size = 12, cover = 0.55, bank = "both", interactive = true, offset = 0, speed = 1 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let grid: Grid | null = null;
    let field = new Float32Array(0);
    let chars: string[] = [];
    let raf = 0;
    let visible = false;
    let pointer: { x: number; y: number; r: number } | null = null;
    let target: { x: number; y: number } | null = null;
    const start = performance.now();

    const resize = () => {
      grid = fitGrid(canvas, size);
      if (!grid) return;
      field = new Float32Array(grid.cols * grid.rows);
      chars = new Array(grid.cols * grid.rows).fill(" ");
      draw(performance.now());
    };

    const draw = (now: number) => {
      if (!grid) return;
      const t = reduced ? 0 : ((now - start) / 1000) * speed;
      // The parting eases after the pointer, and closes again when it leaves
      if (target) {
        pointer = pointer
          ? { x: pointer.x + (target.x - pointer.x) * 0.18, y: pointer.y + (target.y - pointer.y) * 0.18, r: pointer.r + (110 - pointer.r) * 0.12 }
          : { ...target, r: 0 };
      } else if (pointer) {
        pointer = { ...pointer, r: pointer.r * 0.9 };
        if (pointer.r < 2) pointer = null;
      }
      cloudField(grid, field, { t, cover, shape: SHAPES[bank], part: pointer, offset });
      const soft: string[] = new Array(field.length);
      for (let i = 0; i < field.length; i++) {
        const d = field[i];
        chars[i] = d > 0.55 ? charAt(d) : " ";
        soft[i] = d > 0 && d <= 0.55 ? charAt(d) : " ";
      }
      grid.ctx.clearRect(0, 0, grid.width, grid.height);
      drawRows(grid, soft, palette().soft);
      drawRows(grid, chars, palette().ink);
    };

    const loop = (now: number) => {
      draw(now);
      raf = visible && (!reduced || pointer || target) ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(canvas);
    // A theme flip repaints at once, even while paused
    const repaint = () => draw(performance.now());
    window.addEventListener(PALETTE_EVENT, repaint);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    // Fonts change the cell width: re-measure once they arrive
    document.fonts?.ready.then(resize).catch(() => {});

    const move = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      target = { x: e.clientX - b.left, y: e.clientY - b.top };
      kick();
    };
    const leave = () => {
      target = null;
      kick();
    };
    if (interactive) {
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerleave", leave);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(PALETTE_EVENT, repaint);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
    };
  }, [size, cover, bank, interactive, offset, speed]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
