/**
 * The pet's art, as data: rows of palette keys on a 20x20 grid of 6px cells.
 * Perfectly reconstructed from the user's pixel husky dog.
 */

/** One grid cell. All geometry is in multiples of it, so edges stay pixel-aligned. */
export const U = 6;

/**
 * Palette keys → CSS tokens.
 * o/n/d outline & navy shadow, b/m steel blue fur, w pure white, p pink blush/ears, e blue iris, k socks.
 */
export const PALETTE: Record<string, string> = {
  o: "var(--pet-outline, #0f2236)",
  n: "var(--pet-outline, #0f2236)",
  d: "var(--pet-dark, #163250)",
  m: "var(--pet-mid, #1f4f86)",
  b: "var(--pet-mid, #1f4f86)",
  w: "var(--pet-light, #f3f7fb)",
  k: "var(--pet-sock, #0f2236)",
  p: "var(--pet-pink, #f5a6b7)",
  e: "var(--pet-iris, #3c8bea)",
};

/**
 * Pixel husky puppy. Head (rows 0-11) and body (rows 12-16);
 * eyes, mouth, legs and tail are drawn on top.
 * Every row is exactly 20 cells.
 */
export const SPRITE = [
  "..dd..........dd....",
  ".dbpd........dpbd...",
  ".dbppddddddddppbd...",
  ".dbbbbbbbbbbbbbbdd..",
  "dbbbbbbbwwbbbbbbbd..",
  "dbbbbbbwwwwbbbbbbd..",
  "dbbbwwwwwwwwwwwwbbd.",
  "dwwwwwwwwwwwwwwwwbd.",
  "dwwwwwwwddwwwwwwwd..",
  "dwwwwwwwwwwwwwwwwdd.",
  ".dwwwwwwwwwwwwwwdwwd",
  "..ddwwwwwwwwwwdddbbd",
  "...dbowwwwwwobd..dbd",
  "..dbbowwwwwwobbd.dbd",
  "..dbbowwwwwwobbddbbd",
  "..dbbbbwwwwbbbbdbbd.",
  "..dddddddddddddddd..",
];

/** Legs: [column, sprite]. Cute white paws with dark soles sitting in front. */
export const LEGS: Array<[number, string[]]> = [
  [4, ["dd", "ww", "kk"]],
  [10, ["dd", "ww", "kk"]],
];
export const LEG_TOP = 17;

/**
 * Front paws (arms): [column, sprite], hanging from the shoulder at row 12 in front of the body.
 * Paws stay forward/natural during gestures, never flipping upside down.
 */
export const ARMS: Array<[number, string[]]> = [
  [3, ["dbd", "dwd", "dkd"]],
  [12, ["dbd", "dwd", "dkd"]],
];
export const ARM_TOP = 13;

/** Bushy tail with white tip on the right (cols 16-19, rows 10-15); wags around its base. */
export const TAIL = [
  ".ww.",
  "dbbd",
  "dbbd",
  "ddbd",
  ".dbd",
  "..dd",
];
export const TAIL_COL = 16;
export const TAIL_ROW = 10;

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

