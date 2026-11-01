/**
 * The pet's art, as data: rows of palette keys on a 20x20 grid of 6px cells. Kept apart from the
 * React component so it can be unit-tested and edited without touching animation code.
 */

/** One grid cell. All geometry is in multiples of it, so edges stay pixel-aligned. */
export const U = 6;

/**
 * Palette keys → CSS tokens. o outline, d deep gold, m Titan gold coat, w cream, k charcoal sock,
 * n nose. '.' is transparent. Every row is exactly 20 cells (a unit test checks this).
 */
export const PALETTE: Record<string, string> = {
  o: "var(--pet-outline)",
  d: "var(--pet-dark)",
  m: "var(--pet-mid)",
  w: "var(--pet-light)",
  k: "var(--pet-sock)",
  n: "var(--pet-outline)",
};

/** A pixel fox. Head (rows 0-11) and body (rows 12-16); eyes, mouth, legs and tail are drawn on top. */
export const SPRITE = [
  ".oo..............oo.",
  ".odo............odo.",
  ".odwo..........owdo.",
  ".odwdoooooooooodwdo.",
  ".ommmmmmmmmmmmmmmmo.",
  "ommmmmmmmmmmmmmmmmmo",
  "ommmmmmmmmmmmmmmmmmo",
  "ommmmmmmmmmmmmmmmmmo",
  "owwwmmmmmnnmmmmmwwwo",
  "owwwwwwwwwwwwwwwwwwo",
  ".owwwwwwwwwwwwwwwwo.",
  "..oowwwwwwwwwwwwoo..",
  "...ommwwwwwwwwmmo...",
  "..ommmwwwwwwwwmmmo..",
  "..ommmmwwwwwwmmmmo..",
  "..odmmmmmmmmmmmmdo..",
  "..oooooooooooooooo..",
];
/** Legs: [column, sprite]. Charcoal socks; back legs are shorter (they sit further away). */
export const LEGS: Array<[number, string[]]> = [
  [3, ["odo", "oko", "ooo"]],
  [6, ["ommo", "okko", "okko", "oooo"]],
  [10, ["ommo", "okko", "okko", "oooo"]],
  [14, ["odo", "oko", "ooo"]],
];
export const LEG_TOP = 16;
/** Bushy tail with a cream tip at columns 16-20, rows 9-16; wags around its base. */
export const TAIL = ["..oo.", ".owwo", ".ommo", "ommmo", "ommmo", "ommo.", "omdo.", "ooo.."];
export const TAIL_COL = 16;
export const TAIL_ROW = 9;

/** Turns rows of palette keys into rects, merging horizontal runs so the DOM stays small. */
export function cells(rows: string[], col0 = 0, row0 = 0) {
  const out: Array<{ x: number; y: number; w: number; fill: string }> = [];
  rows.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      const key = row[c]!;
      let end = c + 1;
      while (end < row.length && row[end] === key) end++;
      if (key !== ".") out.push({ x: (col0 + c) * U, y: (row0 + r) * U, w: (end - c) * U, fill: PALETTE[key] ?? "transparent" });
      c = end;
    }
  });
  return out;
}

