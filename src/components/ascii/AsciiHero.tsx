"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { charAt, cloudField, drawRows, fitGrid, palette, PALETTE_EVENT, RAMP, type Grid } from "./engine";

// The hero: a three.js object rendered at character resolution and printed
// as ASCII over a bank of drifting clouds, the way the Kumo template draws
// its sky. Drag to spin it (it keeps its momentum), click to morph it, and
// the pointer parts the clouds and lights the glyphs it passes over.

/** Each cell averages SS × SS rendered pixels, so thin edges shade instead of flickering. */
const SS = 2;

type Labels = { aria: string; hint: string; shape: string; shapes: string[] };

export function AsciiHero({ children, className, labels }: { children?: ReactNode; className?: string; labels: Labels }) {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const morphRef = useRef<() => void>(() => {});
  const [shape, setShape] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const section = root.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- three.js ----
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(1);
      renderer.setClearColor(0x000000, 0);
    } catch {
      renderer = null; // No WebGL: the clouds still draw
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 10);
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(-4, 5, 6);
    const rim = new THREE.DirectionalLight(0xffffff, 0.9);
    rim.position.set(5, -3, -4);
    scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.12));

    const smooth = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const faceted = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    const forms: [THREE.BufferGeometry, THREE.Material][] = [
      [new THREE.TorusKnotGeometry(1.15, 0.4, 180, 28), smooth],
      [new THREE.IcosahedronGeometry(1.75, 0), faceted],
      [new THREE.TorusGeometry(1.35, 0.55, 36, 90), smooth],
      [new THREE.OctahedronGeometry(1.85, 0), faceted],
    ];
    const mesh = new THREE.Mesh(forms[0][0], forms[0][1]);
    const group = new THREE.Group();
    group.add(mesh);
    scene.add(group);

    let target: THREE.WebGLRenderTarget | null = null;
    let pixels = new Uint8Array(0);

    // ---- grid ----
    let grid: Grid | null = null;
    let clouds = new Float32Array(0);
    let cov = new Float32Array(0);
    let lum = new Float32Array(0);
    let solid: string[] = [];
    let soft: string[] = [];

    const resize = () => {
      const narrow = section.clientWidth < 760;
      grid = fitGrid(canvas, narrow ? 10 : 12);
      if (!grid) return;
      const n = grid.cols * grid.rows;
      clouds = new Float32Array(n);
      cov = new Float32Array(n);
      lum = new Float32Array(n);
      solid = new Array(n).fill(" ");
      soft = new Array(n).fill(" ");
      if (renderer) {
        target?.dispose();
        target = new THREE.WebGLRenderTarget(grid.cols * SS, grid.rows * SS);
        pixels = new Uint8Array(grid.cols * SS * grid.rows * SS * 4);
        renderer.setSize(grid.cols * SS, grid.rows * SS, false);
      }
      camera.aspect = (grid.cols * grid.cw) / (grid.rows * grid.ch);
      camera.updateProjectionMatrix();
      draw(performance.now());
    };

    // ---- interaction state ----
    const rot = { x: 0.4, y: 0.6 };
    const vel = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    let pointer: { x: number; y: number; r: number } | null = null;
    let aim: { x: number; y: number } | null = null;
    let drag: { x: number; y: number; sx: number; sy: number; t: number } | null = null;
    let morph = 0; // 1 → 0 while a morph runs
    let pending = 0;
    let current = 0;
    let scroll = 0;
    let last = performance.now();
    const start = last;

    const doMorph = () => {
      if (morph > 0) return;
      pending = (current + 1) % forms.length;
      morph = 1;
      kick();
    };
    morphRef.current = doMorph;

    const draw = (now: number) => {
      if (!grid) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = reduced ? 0 : (now - start) / 1000;
      const { cols, rows, cw, ch } = grid;

      // Spin: a slow idle turn, plus whatever momentum a drag left behind
      if (!drag) {
        rot.y += vel.y * dt + (reduced ? 0 : 0.22 * dt);
        rot.x += vel.x * dt + (reduced ? 0 : 0.07 * dt);
        vel.x *= Math.pow(0.04, dt);
        vel.y *= Math.pow(0.04, dt);
      }
      tilt.x += (tilt.tx - tilt.x) * Math.min(1, dt * 4);
      tilt.y += (tilt.ty - tilt.y) * Math.min(1, dt * 4);

      // Morph: shrink to nothing, swap the form, grow back, glyphs scrambling
      let scale = 1;
      let scramble = 0;
      if (morph > 0) {
        morph = Math.max(0, morph - dt * (reduced ? 4 : 1.6));
        const p = 1 - morph;
        if (p >= 0.5 && current !== pending) {
          current = pending;
          mesh.geometry = forms[current][0];
          mesh.material = forms[current][1];
          setShape(current);
        }
        const k = p < 0.5 ? 1 - p * 2 : (p - 0.5) * 2;
        scale = 0.05 + 0.95 * (1 - Math.pow(1 - k, 3));
        scramble = Math.sin(Math.PI * p);
      }

      // Frame the object: right of the copy on wide screens, above it on phones
      const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      const visW = visH * camera.aspect;
      const wide = grid.width >= 760;
      const baseScale = wide ? Math.min(1.05, visH / 6.4) : Math.min(visW / 5.8, visH / 10.5);
      group.position.set(wide ? visW * 0.22 : 0, (wide ? 0.05 : visH * 0.24) + scroll * visH * 0.45, 0);
      group.scale.setScalar(baseScale * scale * (1 - scroll * 0.25));
      group.rotation.set(rot.x + tilt.x, rot.y + tilt.y, scroll * 0.8);

      // Pointer parting the clouds, eased so it trails the hand
      if (aim) {
        pointer = pointer
          ? { x: pointer.x + (aim.x - pointer.x) * 0.2, y: pointer.y + (aim.y - pointer.y) * 0.2, r: pointer.r + (130 - pointer.r) * 0.1 }
          : { ...aim, r: 0 };
      } else if (pointer) {
        pointer = { ...pointer, r: pointer.r * 0.9 };
        if (pointer.r < 2) pointer = null;
      }

      cloudField(grid, clouds, {
        t,
        cover: 0.52,
        scaleX: 38,
        scaleY: 12,
        // A bank along the foot and a thinner one under the nav; the copy sits in the clear middle
        shape: (y) => (y > 0.62 ? (y - 0.62) * 1.9 : 0) + (y < 0.16 ? (0.16 - y) * 2.2 : 0) - 0.42,
        part: pointer,
      });

      // Render the object and read back coverage and light per cell
      cov.fill(0);
      lum.fill(0);
      if (renderer && target) {
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);
        renderer.readRenderTargetPixels(target, 0, 0, cols * SS, rows * SS, pixels);
        renderer.setRenderTarget(null);
        const pw = cols * SS;
        const ph = rows * SS;
        const inv = 1 / (SS * SS * 255);
        for (let y = 0; y < ph; y++) {
          const r = rows - 1 - Math.floor(y / SS); // GL rows run bottom-up
          const rowBase = r * cols;
          let p = y * pw * 4;
          for (let x = 0; x < pw; x++, p += 4) {
            const i = rowBase + Math.floor(x / SS);
            cov[i] += pixels[p + 3] * inv;
            lum[i] += pixels[p] * inv;
          }
        }
      }

      const lens = pointer && pointer.r > 4 ? pointer : null;
      for (let i = 0; i < cols * rows; i++) {
        const c = cov[i];
        if (c > 0.3) {
          let v = 0.18 + (lum[i] / c) * 0.82;
          if (lens) {
            const dx = ((i % cols) * cw - lens.x) / 90;
            const dy = (Math.floor(i / cols) * ch - lens.y) / 90;
            v += Math.exp(-(dx * dx + dy * dy)) * 0.35;
          }
          solid[i] = scramble > 0 && Math.random() < scramble * 0.7 ? RAMP[1 + Math.floor(Math.random() * (RAMP.length - 1))] : charAt(v);
          soft[i] = " ";
        } else {
          const d = clouds[i];
          solid[i] = d > 0.55 ? charAt(d) : " ";
          soft[i] = d > 0 && d <= 0.55 ? charAt(d) : " ";
        }
      }

      grid.ctx.clearRect(0, 0, grid.width, grid.height);
      drawRows(grid, soft, palette().soft);
      drawRows(grid, solid, palette().ink);
    };

    let raf = 0;
    let visible = true;
    const loop = (now: number) => {
      draw(now);
      const moving = !reduced || drag || morph > 0 || aim || pointer || Math.abs(vel.y) + Math.abs(vel.x) > 0.01;
      raf = visible && moving ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    // ---- events ----
    const local = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      return { x: e.clientX - b.left, y: e.clientY - b.top, w: b.width, h: b.height };
    };
    const isControl = (el: EventTarget | null) => el instanceof Element && !!el.closest("a, button, input, textarea, [data-no-drag]");

    const onMove = (e: PointerEvent) => {
      const p = local(e);
      aim = { x: p.x, y: p.y };
      tilt.ty = ((p.x / p.w) * 2 - 1) * 0.45;
      tilt.tx = ((p.y / p.h) * 2 - 1) * 0.3;
      if (drag) {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        rot.y += dx * 0.008;
        rot.x += dy * 0.008;
        const dt = Math.max(1, e.timeStamp - drag.t) / 1000;
        vel.y = (dx * 0.008) / dt;
        vel.x = (dy * 0.008) / dt;
        drag = { ...drag, x: e.clientX, y: e.clientY, t: e.timeStamp };
      }
      kick();
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || isControl(e.target)) return;
      drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: e.timeStamp };
      vel.x = vel.y = 0;
      setDragging(true);
      section.setPointerCapture(e.pointerId);
      kick();
    };
    const onUp = (e: PointerEvent) => {
      if (!drag) return;
      const moved = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);
      // A drag that stopped before release shouldn't fling
      if (e.timeStamp - drag.t > 80) vel.x = vel.y = 0;
      vel.x = Math.max(-6, Math.min(6, vel.x));
      vel.y = Math.max(-6, Math.min(6, vel.y));
      drag = null;
      setDragging(false);
      if (moved < 6) doMorph();
      kick();
    };
    const onLeave = () => {
      aim = null;
      tilt.tx = tilt.ty = 0;
      kick();
    };
    const onScroll = () => {
      scroll = Math.min(1, Math.max(0, window.scrollY / Math.max(1, section.offsetHeight)));
      kick();
    };

    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerdown", onDown);
    section.addEventListener("pointerup", onUp);
    section.addEventListener("pointercancel", onUp);
    section.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(section);
    // A theme flip repaints at once, even while paused
    const repaint = () => draw(performance.now());
    window.addEventListener(PALETTE_EVENT, repaint);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    document.fonts?.ready.then(resize).catch(() => {});
    onScroll();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(PALETTE_EVENT, repaint);
      io.disconnect();
      ro.disconnect();
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerdown", onDown);
      section.removeEventListener("pointerup", onUp);
      section.removeEventListener("pointercancel", onUp);
      section.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      target?.dispose();
      forms.forEach(([g]) => g.dispose());
      smooth.dispose();
      faceted.dispose();
      renderer?.dispose();
    };
  }, []);

  return (
    <section ref={root} className={className} data-dragging={dragging || undefined} aria-label={labels.aria}>
      <canvas ref={canvasRef} className="hero__canvas" aria-hidden />
      {children}
      <div className="hero__hint" data-no-drag>
        <span>{labels.hint}</span>
        <button type="button" className="hero__shape" onClick={() => morphRef.current()}>
          {labels.shape} {String(shape + 1).padStart(2, "0")} / {String(labels.shapes.length).padStart(2, "0")} · {labels.shapes[shape]}
        </button>
      </div>
    </section>
  );
}
