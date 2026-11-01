/**
 * Pure placement maths for the pet. Kept free of DOM access so it is unit-testable and the
 * React layer only feeds it rectangles.
 *
 * Rule: the pet sits OUTSIDE the target's box (never covering what it points at), on the side
 * with the most room, clamped inside the viewport, and avoiding the companion panel if open.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Side = "right" | "left" | "below" | "above";

export interface Placement {
  /** Top-left of the pet box, in viewport px. */
  x: number;
  y: number;
  side: Side;
  /** Direction the pet should look/point, in degrees (0 = right, 90 = down). */
  angle: number;
}

export interface PlacementInput {
  target: Rect;
  viewport: { width: number; height: number };
  pet: { width: number; height: number };
  gap?: number;
  /** Areas the pet must not overlap (e.g. the open companion panel). */
  avoid?: Rect[];
}

const intersects = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function placePet({ target, viewport, pet, gap = 16, avoid = [] }: PlacementInput): Placement {
  const margin = 8;
  const cx = target.x + target.width / 2;
  const cy = target.y + target.height / 2;

  const candidates: Record<Side, { x: number; y: number; room: number }> = {
    right: { x: target.x + target.width + gap, y: cy - pet.height / 2, room: viewport.width - (target.x + target.width) },
    left: { x: target.x - gap - pet.width, y: cy - pet.height / 2, room: target.x },
    below: { x: cx - pet.width / 2, y: target.y + target.height + gap, room: viewport.height - (target.y + target.height) },
    above: { x: cx - pet.width / 2, y: target.y - gap - pet.height, room: target.y },
  };

  const order = (Object.keys(candidates) as Side[]).sort((a, b) => candidates[b].room - candidates[a].room);

  let chosen: Side = order[0]!;
  for (const side of order) {
    const c = candidates[side];
    const fitsAlongAxis = side === "right" || side === "left" ? c.room >= pet.width + gap + margin : c.room >= pet.height + gap + margin;
    if (!fitsAlongAxis) continue;
    const box = { x: clamp(c.x, margin, viewport.width - pet.width - margin), y: clamp(c.y, margin, viewport.height - pet.height - margin), ...pet };
    if (intersects(box, target)) continue;
    if (avoid.some((r) => intersects(box, r))) continue;
    chosen = side;
    break;
  }

  const c = candidates[chosen];
  const x = clamp(c.x, margin, viewport.width - pet.width - margin);
  const y = clamp(c.y, margin, viewport.height - pet.height - margin);
  const angle = (Math.atan2(cy - (y + pet.height / 2), cx - (x + pet.width / 2)) * 180) / Math.PI;
  return { x, y, side: chosen, angle };
}

/** Home position: bottom-right, above the safe area. */
export function homePosition(viewport: { width: number; height: number }, pet: { width: number; height: number }) {
  return { x: viewport.width - pet.width - 24, y: viewport.height - pet.height - 24 };
}

/** Is the element meaningfully visible, or should we scroll first? */
export function needsScroll(target: Rect, viewport: { height: number }, padding = 80) {
  return target.y < padding || target.y + Math.min(target.height, 200) > viewport.height - padding;
}
