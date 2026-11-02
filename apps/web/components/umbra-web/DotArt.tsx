"use client";

import { useEffect, useRef } from "react";

/**
 * Umbra's dot-matrix illustration style: a shape is drawn in greyscale on a hidden canvas,
 * then re-drawn as a grid of small blue squares whose opacity follows the ink, with a slow
 * twinkle. Original drawings, in the spirit of umbraprivacy.com's artwork.
 */

export type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export function DotArt({
  paint,
  className,
  cell = 7,
  color = "1, 0, 255",
  twinkle = true,
  density = 1,
}: {
  paint: Painter;
  className?: string;
  cell?: number;
  color?: string;
  twinkle?: boolean;
  density?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let raf = 0;
    let dots: { x: number; y: number; a: number; p: number; s: number }[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const build = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const off = document.createElement("canvas");
      off.width = Math.round(width);
      off.height = Math.round(height);
      const o = off.getContext("2d", { willReadFrequently: true })!;
      o.fillStyle = "#fff";
      o.fillRect(0, 0, off.width, off.height);
      o.fillStyle = "#000";
      o.strokeStyle = "#000";
      paint(o, off.width, off.height);
      const data = o.getImageData(0, 0, off.width, off.height).data;
      dots = [];
      for (let y = cell / 2; y < off.height; y += cell) {
        for (let x = cell / 2; x < off.width; x += cell) {
          const i = (Math.floor(y) * off.width + Math.floor(x)) * 4;
          const ink = 1 - (data[i]! + data[i + 1]! + data[i + 2]!) / 765;
          if (ink < 0.06) continue;
          // Dither: lighter ink keeps fewer dots, so edges fade like the originals.
          if (Math.random() > Math.min(1, ink * 1.4 * density)) continue;
          dots.push({ x, y, a: 0.25 + ink * 0.75, p: Math.random() * Math.PI * 2, s: 0.55 + ink * 0.45 });
        }
      }
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const d of dots) {
        const flicker = twinkle ? 0.78 + 0.22 * Math.sin(frame / 38 + d.p) : 1;
        ctx.fillStyle = `rgba(${color}, ${(d.a * flicker).toFixed(3)})`;
        const size = cell * d.s * 0.82;
        ctx.fillRect(d.x - size / 2, d.y - size / 2, size, size);
      }
      frame++;
      if (twinkle) raf = requestAnimationFrame(draw);
    };

    build();
    draw();
    const ro = new ResizeObserver(() => {
      build();
      if (!twinkle) draw();
    });
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [paint, cell, color, twinkle, density]);

  return <canvas ref={ref} aria-hidden className={className} />;
}

// ───────── shapes ─────────

/** Umbra's shield mark as a thick outline. */
export const paintShield: Painter = (c, w, h) => {
  const s = Math.min(w, h);
  const cx = w / 2;
  const top = (h - s) / 2 + s * 0.06;
  const half = s * 0.4;
  c.lineWidth = s * 0.12;
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(cx - half, top);
  c.lineTo(cx - half, top + s * 0.5);
  c.bezierCurveTo(cx - half, top + s * 0.78, cx - half * 0.35, top + s * 0.86, cx, top + s * 0.86);
  c.bezierCurveTo(cx + half * 0.35, top + s * 0.86, cx + half, top + s * 0.78, cx + half, top + s * 0.5);
  c.lineTo(cx + half, top);
  c.stroke();
  const g = c.createRadialGradient(cx, top + s * 0.4, 0, cx, top + s * 0.4, s * 0.6);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g;
  c.globalCompositeOperation = "lighter";
  c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = "source-over";
};

export const paintLock: Painter = (c, w, h) => {
  const s = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2 + s * 0.1;
  c.lineWidth = s * 0.09;
  c.beginPath();
  c.arc(cx, cy - s * 0.12, s * 0.2, Math.PI, 0);
  c.lineTo(cx + s * 0.2, cy);
  c.moveTo(cx - s * 0.2, cy - s * 0.12);
  c.lineTo(cx - s * 0.2, cy);
  c.stroke();
  const body = c.createLinearGradient(cx - s * 0.3, 0, cx + s * 0.3, 0);
  body.addColorStop(0, "#111");
  body.addColorStop(1, "#777");
  c.fillStyle = body;
  c.beginPath();
  c.roundRect(cx - s * 0.3, cy - s * 0.02, s * 0.6, s * 0.42, s * 0.06);
  c.fill();
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(cx, cy + s * 0.16, s * 0.05, 0, Math.PI * 2);
  c.fill();
};

export const paintText =
  (text: string, weight = 700, scale = 0.62): Painter =>
  (c, w, h) => {
    c.font = `${weight} ${Math.round(h * scale)}px Arial, sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#000");
    g.addColorStop(1, "#555");
    c.fillStyle = g;
    c.fillText(text, w / 2, h / 2, w * 0.96);
  };

export const paintCoins: Painter = (c, w, h) => {
  const r = Math.min(w, h) * 0.18;
  [
    [0.3, 0.62, 1],
    [0.55, 0.5, 1.15],
    [0.78, 0.66, 0.9],
  ].forEach(([x, y, k]) => {
    const g = c.createRadialGradient(w * x! - r * 0.3, h * y! - r * 0.3, 0, w * x!, h * y!, r * k!);
    g.addColorStop(0, "#666");
    g.addColorStop(1, "#000");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(w * x!, h * y!, r * k!, r * k! * 0.9, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#fff";
    c.font = `700 ${Math.round(r * k! * 0.9)}px Arial`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("$", w * x!, h * y!);
  });
};

/** Two hands passing a coin: simplified to arcs and a stream of coins. */
export const paintSend: Painter = (c, w, h) => {
  c.lineWidth = Math.min(w, h) * 0.05;
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const x = w * (0.2 + t * 0.55);
    const y = h * (0.7 - Math.sin(t * Math.PI) * 0.35);
    c.beginPath();
    c.ellipse(x, y, w * 0.035 * (0.6 + t * 0.6), h * 0.05 * (0.6 + t * 0.6), -0.4, 0, Math.PI * 2);
    c.stroke();
  }
  const g = c.createLinearGradient(w * 0.6, 0, w, h);
  g.addColorStop(0, "#000");
  g.addColorStop(1, "#888");
  c.fillStyle = g;
  c.beginPath();
  c.roundRect(w * 0.7, h * 0.08, w * 0.2, h * 0.42, 14);
  c.fill();
};

export const paintVault: Painter = (c, w, h) => {
  const s = Math.min(w, h);
  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#222");
  g.addColorStop(1, "#888");
  c.fillStyle = g;
  c.beginPath();
  c.roundRect(w / 2 - s * 0.38, h / 2 - s * 0.36, s * 0.76, s * 0.72, s * 0.06);
  c.fill();
  c.strokeStyle = "#fff";
  c.lineWidth = s * 0.05;
  c.beginPath();
  c.arc(w / 2, h / 2, s * 0.18, 0, Math.PI * 2);
  c.stroke();
  for (let a = 0; a < 6; a++) {
    c.beginPath();
    c.moveTo(w / 2, h / 2);
    c.lineTo(w / 2 + Math.cos((a * Math.PI) / 3) * s * 0.15, h / 2 + Math.sin((a * Math.PI) / 3) * s * 0.15);
    c.stroke();
  }
};

export const paintSwap: Painter = (c, w, h) => {
  const s = Math.min(w, h);
  const g = c.createRadialGradient(w / 2, h * 0.75, 0, w / 2, h * 0.75, s * 0.5);
  g.addColorStop(0, "#000");
  g.addColorStop(1, "#bbb");
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(w / 2, h * 0.78, s * 0.4, s * 0.36, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#fff";
  c.font = `700 ${Math.round(s * 0.4)}px Arial`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("⇅", w / 2, h * 0.76);
};

/** Soft mountain range for the app background. */
export const paintMountains: Painter = (c, w, h) => {
  const ridge = (base: number, amp: number, shade: string, seed: number) => {
    c.fillStyle = shade;
    c.beginPath();
    c.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) {
      const y = h * base - Math.abs(Math.sin(x / (w * 0.11) + seed)) * h * amp - Math.sin(x / (w * 0.031) + seed * 3) * h * amp * 0.18;
      c.lineTo(x, y);
    }
    c.lineTo(w, h);
    c.fill();
  };
  ridge(0.62, 0.3, "#9a9a9a", 1.3);
  ridge(0.8, 0.22, "#6a6a6a", 2.7);
  ridge(0.97, 0.14, "#3a3a3a", 0.4);
};

export const paintGlobe: Painter = (c, w, h) => {
  const r = Math.min(w, h) * 0.42;
  const g = c.createRadialGradient(w * 0.42, h * 0.4, 0, w / 2, h / 2, r);
  g.addColorStop(0, "#999");
  g.addColorStop(1, "#000");
  c.fillStyle = g;
  c.beginPath();
  c.arc(w / 2, h / 2, r, 0, Math.PI * 2);
  c.fill();
};
