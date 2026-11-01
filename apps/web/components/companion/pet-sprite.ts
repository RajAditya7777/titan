/**
 * The pet's art, as data: rows of palette keys on a 20x20 grid of 6px cells. Kept apart from the
 * React component so it can be unit-tested and edited without touching animation code.
 */

/** One grid cell. All geometry is in multiples of it, so edges stay pixel-aligned. */
export const U = 6;

/**
 * Palette keys → CSS tokens. o outline, d dark coat, m mid shading, w light coat, p pink, n nose.
 * '.' is transparent. Every row is exactly 20 cells (a unit test checks this).
 */
export const PALETTE: Record<string, string> = {
  o: "var(--pet-outline)",
  d: "var(--pet-dark)",
  m: "var(--pet-mid)",
  w: "var(--pet-light)",
  p: "var(--pet-pink)",
  n: "var(--pet-outline)",
};

/** Head (rows 0-11) and body (rows 12-16). Eyes, mouth, legs and tail are drawn on top. */
export const SPRITE = [
  "...oo..........oo...",
  "..odpo........opdo..",
  "..odppooooooooppdo..",
  "..oddddddddddddddo..",
  ".odddddddwwdddddddo.",
  ".oddddddwwwwddddddo.",
  ".odddwwwwwwwwwwdddo.",
  ".odmwwwwwwwwwwwwmdo.",
  ".owwwwwwwnnwwwwwwwo.",
  ".owwwwwwwwwwwwwwwwo.",
  "..owwwwwwwwwwwwwwo..",
  "...oowwwwwwwwwwoo...",
  "....odmwwwwwwmdo....",
  "...oddmwwwwwwmddo...",
  "...oddmwwwwwwmddo...",
  "...oddddwwwwddddo...",
  "...oooooooooooooo...",
];
/** Legs: [column, sprite]. Back legs are dark and shorter (they sit further away). */
export const LEGS: Array<[number, string[]]> = [
  [3, ["odo", "odo", "ooo"]],
  [6, ["owwo", "owwo", "owwo", "oooo"]],
  [10, ["owwo", "owwo", "owwo", "oooo"]],
  [14, ["odo", "odo", "ooo"]],
];
export const LEG_TOP = 16;
/** Curled tail with a white tip at columns 16-20, rows 9-16; wags around its base. */
export const TAIL = ["..oo.", ".owwo", ".odmo", "..odo", "..odo", ".oddo", "oddo.", "ooo.."];
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

