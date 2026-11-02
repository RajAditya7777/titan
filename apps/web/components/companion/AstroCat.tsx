"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from "motion/react";
import type { PetState } from "./CompanionProvider";
import type { Reaction } from "./Pet";

/**
 * Astro, Jupiter's guide: a pixel astronaut cat (blue tabby, green space suit), drawn on
 * the same 20x20 grid of 6px cells as Milo. Every part is its own layer so it moves like a body:
 * ears twitch, eyes blink and follow the target, the striped tail swishes, an arm points or waves
 * a Solana coin, and boot thrusters fire while it flies across the page.
 */

const U = 6;
const PALETTE: Record<string, string> = {
  o: "#0b1a2e", // outline
  b: "#3a8fe0", // blue fur
  n: "#1d4f96", // tail stripe / dark fur
  l: "#8fdcff", // light fur
  w: "#eaf8ff", // cream muzzle
  p: "#f58fb0", // pink
  s: "#b8f08a", // suit highlight
  g: "#4cc27a", // suit
  G: "#1f7a4f", // suit shade
  c: "#5fd8ff", // chest light
};

function cells(rows: string[], col0 = 0, row0 = 0) {
  const out: { x: number; y: number; w: number; fill: string }[] = [];
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

function Cells({ rows, col0, row0 }: { rows: string[]; col0?: number; row0?: number }) {
  return (
    <>
      {cells(rows, col0, row0).map((c) => (
        <rect key={`${c.x},${c.y}`} x={c.x} y={c.y} width={c.w + 0.5} height={U + 0.5} fill={c.fill} />
      ))}
    </>
  );
}

// ───────── sprite (20 columns) ─────────
const EAR_L = ["o...", "obo.", "opbo"];
const EAR_R = ["...o", ".obo", "obpo"];
const HEAD = [
  "....obbbbbbbbbbo....",
  "...obbbbbbbbbbbbo...",
  "...obnbbbbbbbbnbo...",
  "...obbbbbbbbbbbbo...",
  "...obbbbbbbbbbbbo...",
  "...obwwbbbbbbwwbo...",
  "...obwwwwwwwwwwbo...",
  "....obwwwwwwwwbo....",
  ".....oooooooooo.....",
];
const HEAD_ROW = 3;
const BODY = [
  ".....osssssssso.....",
  ".....oggggggggo.....",
  ".....oggGccGggo.....",
  ".....oggGccGggo.....",
  ".....oGGGGGGGGo.....",
];
const BODY_ROW = 12;
const LEG = ["oggo", "oGGo", "oooo"];
const LEGS: [number, number][] = [
  [5, 17],
  [11, 17],
];
const ARM_L = ["og", "og", "og", "ow"];
const ARM_R = ["go", "go", "go", "wo"];
const ARM_ROW = 12;
const TAIL = ["...oo.", "..obno", "..onbo", "..obno", "..onbo", "..obo.", ".obno.", "obno..", "onbo.."];
const TAIL_COL = 14;
const TAIL_ROW = 6;

const EYES = [5, 12].map((c) => c * U);
const EYE_Y = 5 * U;
const FEET_Y = 120;

type Gesture = { left: TargetAndTransition; right: TargetAndTransition };
const still = { rotate: 0, transition: { type: "spring", stiffness: 240, damping: 15 } } as const;
const loop = (duration: number, repeat = Infinity) => ({ type: "tween" as const, duration, repeat, ease: "easeInOut" as const });
const GESTURES: Partial<Record<Reaction | "celebrating" | "moving" | "speaking" | "thinking", Gesture>> = {
  wave: { left: still, right: { rotate: [-120, -150, -120], transition: loop(0.35, 3) } },
  hi: { left: still, right: { rotate: [-120, -150, -120], transition: loop(0.35, 3) } },
  clap: { left: { rotate: [0, -40, 0, -40, 0], transition: loop(0.8, 0) }, right: { rotate: [0, 40, 0, 40, 0], transition: loop(0.8, 0) } },
  cheer: { left: { rotate: [120, 150, 120], transition: loop(0.3, 3) }, right: { rotate: [-120, -150, -120], transition: loop(0.3, 3) } },
  hearts: { left: { rotate: 30 }, right: { rotate: -30 } },
  hop: { left: { rotate: 40 }, right: { rotate: -40 } },
  wiggle: { left: { rotate: [-15, 15, -15], transition: loop(0.25, 4) }, right: { rotate: [15, -15, 15], transition: loop(0.25, 4) } },
  giggle: { left: { rotate: [10, 25, 10], transition: loop(0.3, 3) }, right: { rotate: [-10, -25, -10], transition: loop(0.3, 3) } },
  roll: { left: { rotate: [-30, 30, -30], transition: loop(0.4, 2) }, right: { rotate: [30, -30, 30], transition: loop(0.4, 2) } },
  // Zero-g "swim" while flying, both arms out like Superman.
  moving: { left: { rotate: [55, 70, 55], transition: loop(0.5) }, right: { rotate: [-55, -70, -55], transition: loop(0.5) } },
  celebrating: { left: { rotate: [120, 160, 120], transition: loop(0.35) }, right: { rotate: [-120, -160, -120], transition: loop(0.35) } },
  speaking: { left: still, right: { rotate: [-20, -45, -20], transition: loop(1.1) } },
  // Paw to chin while it thinks.
  thinking: { left: still, right: { rotate: -150, transition: { type: "spring", stiffness: 120, damping: 14 } } },
};

const REST = { x: 0, y: 0, rotate: 0, scale: 1, scaleX: 1, scaleY: 1 };
/** It floats: weightless drift instead of standing still. */
const BODY_FLOAT: Partial<Record<PetState | "hover", TargetAndTransition>> = {
  idle: { y: [0, -4, 0], rotate: [-2, 2, -2], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } },
  hover: { y: -6, transition: { type: "spring", stiffness: 300, damping: 14 } },
  listening: { y: [0, -2, 0], transition: { duration: 1.4, repeat: Infinity } },
  thinking: { y: [0, -3, 0], rotate: [-3, 3, -3], transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } },
  speaking: { y: [0, -2, 0], transition: { duration: 0.5, repeat: Infinity } },
  moving: { y: [0, -3, 0], transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" } },
  pointing: { y: [0, -3, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  waiting: { y: [0, -3, 0], rotate: [-1.5, 1.5, -1.5], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  celebrating: { y: [0, -20, 0, -10, 0], rotate: [0, -10, 10, 0], transition: { duration: 0.9, repeat: 1 } },
  error: { rotate: -6, x: [0, -3, 3, -2, 0], transition: { duration: 0.5 } },
};
const REACTION_ANIM: Partial<Record<Reaction, TargetAndTransition>> = {
  hop: { y: [0, 4, -16, 0], scaleY: [1, 0.9, 1.06, 1], transition: { duration: 0.8 } },
  wiggle: { rotate: [0, -8, 7, -6, 4, 0], transition: { duration: 0.9 } },
  giggle: { y: [0, -3, 0, -3, 0], transition: { duration: 0.8 } },
  hearts: { scale: [1, 1.08, 1], y: -4, transition: { duration: 0.6 } },
  roll: { rotate: [0, -360], transition: { duration: 1.1, ease: "easeInOut" } },
  cheer: { y: [0, 3, -14, 0], transition: { duration: 0.8 } },
};

function tailSwish(state: string, happy: boolean): TargetAndTransition {
  const fast = happy || state === "celebrating" || state === "hover";
  const swing = fast ? 18 : 9;
  return { rotate: [-swing, swing, -swing], transition: { type: "tween", duration: fast ? 0.4 : 2.2, repeat: Infinity, ease: "easeInOut" } };
}

export function AstroCat({
  state,
  lookAngle,
  gazeAngle = null,
  reaction = null,
  sleeping = false,
  voiceLevel = 0,
  size = 96,
  heading = 1,
}: {
  state: PetState | "hover";
  lookAngle: number | null;
  gazeAngle?: number | null;
  reaction?: Reaction | null;
  sleeping?: boolean;
  voiceLevel?: number;
  size?: number;
  heading?: 1 | -1;
}) {
  const reduce = useReducedMotion();
  const look = lookAngle ?? (sleeping ? null : gazeAngle);
  const rad = look == null ? null : (look * Math.PI) / 180;
  const dx = rad == null ? 0 : Math.round(Math.cos(rad) * 4);
  const dy = rad == null ? 0 : Math.round(Math.sin(rad) * 3);
  const asleep = sleeping && state === "idle" && !reaction;
  const happy = reaction === "giggle" || reaction === "hearts" || reaction === "wave" || reaction === "hi" || reaction === "cheer";
  const pointing = (state === "pointing" || state === "waiting" || state === "speaking") && lookAngle != null;
  const flying = state === "moving";

  const body = useMemo<TargetAndTransition>(
    () => (reduce ? REST : { ...REST, ...((reaction && REACTION_ANIM[reaction]) || BODY_FLOAT[state] || {}), ...(flying && !reaction ? { rotate: 14 * heading } : {}) }),
    [reduce, reaction, state, flying, heading],
  );

  // Arms hang at 0°; a point rotates the arm on the target's side toward it.
  const aim = lookAngle == null ? 0 : (((lookAngle - 90 + 540) % 360) - 180);
  const aimAt = { rotate: aim, transition: { type: "spring", stiffness: 170, damping: 14 } } as const;
  const pointArm: Gesture | null = pointing && rad != null ? (Math.cos(rad) >= 0 ? { left: still, right: aimAt } : { left: aimAt, right: still }) : null;
  const arms: Gesture =
    (reaction && GESTURES[reaction]) || pointArm || (asleep ? null : GESTURES[state as "moving"]) || { left: still, right: still };
  const holdsCoin = state === "celebrating" || reaction === "wave" || reaction === "hi" || reaction === "cheer";

  const headTilt: TargetAndTransition =
    pointing && rad != null
      ? { rotate: Math.round(Math.cos(rad) * 7), transition: { type: "spring", stiffness: 160, damping: 14 } }
      : state === "thinking"
        ? { rotate: [-6, 6, -6], transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }
        : state === "listening"
          ? { rotate: 7 }
          : { rotate: 0 };

  return (
    <motion.svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`Astro, Jupiter guide, ${state}`} shapeRendering="crispEdges" style={{ overflow: "visible" }}>
      {/* voice ring */}
      <motion.circle
        cx={60}
        cy={60}
        r={64}
        fill="none"
        stroke="#c7f284"
        strokeWidth="2.5"
        initial={{ opacity: 0 }}
        animate={{ scale: 1 + voiceLevel * 0.25, opacity: voiceLevel > 0.05 ? 0.3 + voiceLevel * 0.7 : 0 }}
        style={{ transformOrigin: "60px 60px" }}
      />

      {/* pointer arrow orbiting to the target */}
      <AnimatePresence>
        {pointing && (
          <motion.g
            key="pointer"
            initial={{ opacity: 0, rotate: lookAngle ?? 0, scale: 0.6 }}
            animate={{ opacity: 1, rotate: lookAngle ?? 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            style={{ transformOrigin: "60px 60px" }}
          >
            <motion.path d="M124 50h4v4h4v4h4v4h-4v4h-4v4h-4z" fill="#c7f284" stroke="#0b1a2e" strokeWidth={1.5} animate={reduce ? {} : { x: [0, 4, 0] }} transition={{ duration: 0.9, repeat: Infinity }} />
          </motion.g>
        )}
      </AnimatePresence>

      <motion.g animate={body} style={{ transformOrigin: `60px ${FEET_Y - 20}px` }}>
        {/* tail swishes behind everything */}
        <motion.g animate={reduce || asleep ? { rotate: -6 } : tailSwish(state, happy)} style={{ transformOrigin: `${(TAIL_COL + 1) * U}px ${(TAIL_ROW + 8) * U}px` }}>
          <Cells rows={TAIL} col0={TAIL_COL} row0={TAIL_ROW} />
        </motion.g>

        {/* boot thrusters while flying */}
        <AnimatePresence>
          {flying &&
            LEGS.map(([col], i) => (
              <motion.g key={col} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.rect x={(col + 1) * U} y={FEET_Y} width={2 * U} height={8} fill="#ffb347" animate={{ height: [6, 14, 8, 12] }} transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.08 }} />
                <motion.rect x={(col + 1) * U + 3} y={FEET_Y} width={U} height={5} fill="#fff3b0" animate={{ height: [4, 8, 5] }} transition={{ duration: 0.25, repeat: Infinity }} />
              </motion.g>
            ))}
        </AnimatePresence>

        {/* legs: tuck up while flying, drift apart while idle */}
        {LEGS.map(([col, row], i) => (
          <motion.g
            key={col}
            animate={reduce ? {} : flying ? { y: -3, rotate: i ? -10 : 10 } : { y: [0, i ? -2 : 0, 0], rotate: 0 }}
            transition={flying ? { type: "spring", stiffness: 200, damping: 14 } : { duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
            style={{ transformOrigin: `${(col + 2) * U}px ${row * U}px` }}
          >
            <Cells rows={LEG} col0={col} row0={row} />
          </motion.g>
        ))}

        {/* suit */}
        <Cells rows={BODY} row0={BODY_ROW} />
        {/* chest light pulses */}
        <motion.rect
          x={9 * U}
          y={14 * U}
          width={2 * U}
          height={2 * U}
          fill="#d6f8ff"
          animate={reduce ? {} : { opacity: state === "thinking" ? [0.2, 1, 0.2] : [0.15, 0.6, 0.15] }}
          transition={{ duration: state === "thinking" ? 0.7 : 2.4, repeat: Infinity }}
        />

        {/* head */}
        <motion.g animate={reduce ? {} : headTilt} style={{ transformOrigin: `60px ${11 * U}px` }}>
          {/* ears twitch on their own */}
          <motion.g animate={reduce ? {} : { rotate: [0, 0, -14, 0, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.7, 0.75, 0.8, 1] }} style={{ transformOrigin: `${5 * U}px ${3 * U}px` }}>
            <Cells rows={EAR_L} col0={4} row0={0} />
          </motion.g>
          <motion.g
            animate={reduce ? {} : { rotate: state === "listening" ? 14 : [0, 0, 14, 0, 0] }}
            transition={state === "listening" ? { type: "spring" } : { duration: 6, repeat: Infinity, times: [0, 0.4, 0.45, 0.5, 1] }}
            style={{ transformOrigin: `${15 * U}px ${3 * U}px` }}
          >
            <Cells rows={EAR_R} col0={12} row0={0} />
          </motion.g>
          <Cells rows={HEAD} row0={HEAD_ROW} />
          {/* whiskers */}
          <g fill="#0b1a2e" opacity={0.55}>
            <rect x={2 * U} y={9 * U} width={2 * U} height={2} />
            <rect x={2 * U} y={10 * U - 2} width={2 * U} height={2} />
            <rect x={16 * U} y={9 * U} width={2 * U} height={2} />
            <rect x={16 * U} y={10 * U - 2} width={2 * U} height={2} />
          </g>
          {/* blush */}
          {[4 * U, 14 * U].map((x) => (
            <rect key={x} x={x} y={8 * U + 2} width={2 * U} height={3} fill="#f58fb0" opacity={happy || state === "celebrating" ? 0.95 : 0.5} />
          ))}
          <CatEyes mood={asleep ? "sleep" : happy || state === "celebrating" || state === "hover" ? "happy" : state} dx={dx} dy={dy} />
          <CatMouth state={asleep ? "sleep" : state} happy={happy} />
        </motion.g>

        {/* arms rotate at the shoulder: point, wave, swim, think */}
        {[
          { rows: ARM_L, col: 3, g: arms.left, pivot: 4.5 },
          { rows: ARM_R, col: 15, g: arms.right, pivot: 15.5 },
        ].map(({ rows, col, g, pivot }, i) => (
          <motion.g key={col} animate={reduce ? { rotate: 0 } : g} style={{ transformOrigin: `${pivot * U}px ${ARM_ROW * U + 3}px` }}>
            <Cells rows={rows} col0={col} row0={ARM_ROW} />
            {/* the Solana coin from the art, held up when it's happy */}
            {i === 1 && holdsCoin && (
              <g transform={`translate(${col * U - 3} ${(ARM_ROW + 4) * U})`}>
                <rect x={0} y={0} width={18} height={18} fill="#eaf8ff" stroke="#0b1a2e" strokeWidth={1.5} />
                <rect x={4} y={4} width={10} height={2} fill="#9945ff" />
                <rect x={4} y={8} width={10} height={2} fill="#4ab0e8" />
                <rect x={4} y={12} width={10} height={2} fill="#14f195" />
              </g>
            )}
          </motion.g>
        ))}

        {/* thinking: little planets orbit */}
        <AnimatePresence>
          {state === "thinking" && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1, rotate: 360 }} exit={{ opacity: 0 }} transition={{ rotate: { duration: 2.4, repeat: Infinity, ease: "linear" } }} style={{ transformOrigin: "60px 42px" }}>
              <rect x={104} y={38} width={6} height={6} fill="#c7f284" />
              <rect x={10} y={40} width={5} height={5} fill="#5fd8ff" />
              <rect x={58} y={-6} width={4} height={4} fill="#f58fb0" />
            </motion.g>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {state === "error" && (
            <motion.text x="104" y="16" fontSize="22" fontWeight="700" fill="#f25c5c" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 16 }} exit={{ opacity: 0 }}>
              ?
            </motion.text>
          )}
        </AnimatePresence>
      </motion.g>

      {/* stars when it celebrates */}
      <AnimatePresence>
        {(state === "celebrating" || reaction === "cheer") &&
          ([[8, 20], [112, 16], [2, 80], [118, 76], [60, -8]] as const).map(([x, y], i) => (
            <motion.path
              key={i}
              d={`M${x - 2} ${y - 6}h4v4h4v4h-4v4h-4v-4h-4v-4h4z`}
              fill={i % 2 ? "#c7f284" : "#5fd8ff"}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, delay: i * 0.08, repeat: 1 }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
          ))}
      </AnimatePresence>
      <AnimatePresence>
        {reaction === "hearts" &&
          [0, 1, 2].map((i) => (
            <motion.path
              key={i}
              d="M2 0h3v2h2V0h3v2h2v4h-2v2H8v2H4V8H2V6H0V2h2z"
              fill="#c7f284"
              initial={{ x: 30 + i * 22, y: 6, opacity: 0 }}
              animate={{ y: -20 - i * 8, opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, delay: i * 0.18 }}
            />
          ))}
      </AnimatePresence>
      <AnimatePresence>
        {asleep &&
          [0, 1, 2].map((i) => (
            <motion.text key={i} x={100 + i * 7} y={22 - i * 9} fontSize={9 + i * 3} fontWeight="700" fill="#8a99a6" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], y: [22 - i * 9, 14 - i * 9] }} exit={{ opacity: 0 }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6 }}>
              z
            </motion.text>
          ))}
      </AnimatePresence>
    </motion.svg>
  );
}

/** Big anime-style eyes (3x3 cells) with a pupil that tracks, two catch-lights, and blinking. */
function CatEyes({ mood, dx, dy }: { mood: string; dx: number; dy: number }) {
  if (mood === "sleep") {
    return (
      <g fill="#0b1a2e">
        {EYES.map((x) => (
          <rect key={x} x={x} y={EYE_Y + 10} width={3 * U} height={3} />
        ))}
      </g>
    );
  }
  if (mood === "happy") {
    return (
      <g fill="#0b1a2e">
        {EYES.map((x) => (
          <g key={x}>
            <rect x={x} y={EYE_Y + 10} width={4} height={4} />
            <rect x={x + 4} y={EYE_Y + 6} width={10} height={4} />
            <rect x={x + 14} y={EYE_Y + 10} width={4} height={4} />
          </g>
        ))}
      </g>
    );
  }
  const squint = mood === "thinking" ? 6 : 0;
  return (
    <g>
      {EYES.map((x) => (
        <motion.g
          key={x}
          animate={{ scaleY: [1, 1, 0.12, 1] }}
          transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.93, 0.96, 1] }}
          style={{ transformOrigin: `${x + 9}px ${EYE_Y + 9}px` }}
        >
          <rect x={x} y={EYE_Y + squint} width={3 * U} height={3 * U - squint} fill="#0b1a2e" />
          <rect x={x + 2} y={EYE_Y + 2 + squint} width={3 * U - 4} height={3 * U - 4 - squint} fill="#3fd49b" />
          <motion.rect x={x + 5} y={EYE_Y + 5 + squint / 2} width={8} height={9 - squint / 2} fill="#0b1a2e" animate={{ x: dx, y: dy }} transition={{ type: "spring", stiffness: 200, damping: 18 }} />
          <rect x={x + 3} y={EYE_Y + 3 + squint} width={4} height={4} fill="#ffffff" />
          <rect x={x + 12} y={EYE_Y + 12} width={2} height={2} fill="#ffffff" />
        </motion.g>
      ))}
    </g>
  );
}

function CatMouth({ state, happy }: { state: string; happy: boolean }) {
  const nose = <rect x={9 * U} y={8 * U + 1} width={2 * U} height={4} fill="#f58fb0" />;
  if (state === "speaking") {
    return (
      <g>
        {nose}
        <motion.rect x={9 * U + 1} y={9 * U} width={2 * U - 2} fill="#0b1a2e" animate={{ height: [2, 7, 3, 8, 2] }} transition={{ duration: 0.5, repeat: Infinity }} />
      </g>
    );
  }
  if (state === "celebrating" || happy) {
    return (
      <g>
        {nose}
        <rect x={8 * U} y={9 * U} width={4 * U} height={7} fill="#0b1a2e" />
        <rect x={9 * U} y={9 * U + 3} width={2 * U} height={4} fill="#f58fb0" />
      </g>
    );
  }
  // the little cat "w" mouth
  return (
    <g fill="#0b1a2e">
      {nose}
      <rect x={8 * U} y={9 * U} width={3} height={3} />
      <rect x={8 * U + 3} y={9 * U + 3} width={U - 1} height={3} />
      <rect x={10 * U - 1} y={9 * U} width={2} height={3} />
      <rect x={10 * U + 1} y={9 * U + 3} width={U - 1} height={3} />
      <rect x={12 * U - 3} y={9 * U} width={3} height={3} />
    </g>
  );
}
