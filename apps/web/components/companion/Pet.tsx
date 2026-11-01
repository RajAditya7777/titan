"use client";

import { useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion, type TargetAndTransition } from "motion/react";
import type { PetState } from "./CompanionProvider";
import { cells, LEG_TOP, LEGS, SPRITE, TAIL, TAIL_COL, TAIL_ROW, U } from "./pet-sprite";

/**
 * Milo, the Titan guide: a small pixel fox in Titan's gold and charcoal, drawn on a 20x20 grid of 6px
 * cells. Pure SVG + motion, no image assets, so it scales crisply, themes with CSS (--pet-*) and
 * costs nothing to ship. Every visual is a function of (state, lookAngle, voiceLevel).
 *
 * The art is data (pet-sprite.ts), rendered by `cells()`. The moving parts (eyes, mouth,
 * legs, tail, pointer) are separate layers so each can animate on its own.
 */

interface Props {
  state: PetState | "hover";
  /** Degrees; where the eyes look and the pointer aims (0 = right, 90 = down). null = look at the user. */
  lookAngle: number | null;
  /** Where the user's cursor is (idle eye-tracking). Ignored while pointing at a target. */
  gazeAngle?: number | null;
  /** A one-off hover reaction; a different one is picked each hover so it feels alive. */
  reaction?: Reaction | null;
  sleeping?: boolean;
  /** 0..1 live microphone level: the pet visibly "hears" you. */
  voiceLevel?: number;
  size?: number;
}

export const REACTIONS = ["wave", "spin", "wiggle", "giggle", "hop", "hearts", "hi", "roll"] as const;
export type Reaction = (typeof REACTIONS)[number];

/** Eyes: 2x2 cells each at these columns, row 6. */
const EYES = [6, 12].map((c) => c * U);
const EYE_Y = 6 * U;
const EYE = 2 * U;
const MOUTH_Y = 9 * U;
const CENTER = { x: 60, y: 60 };
const FEET_Y = 120;

function Cells({ rows, col0, row0 }: { rows: string[]; col0?: number; row0?: number }) {
  // +0.5 overlap hides hairline seams between runs when the SVG is scaled to non-integer sizes.
  return (
    <>
      {cells(rows, col0, row0).map((c) => (
        <rect key={`${c.x},${c.y}`} x={c.x} y={c.y} width={c.w + 0.5} height={U + 0.5} fill={c.fill} />
      ))}
    </>
  );
}

/** Squash-and-stretch keyframes: the classic animation principle that makes a body feel soft. */
const REACTION_ANIM: Record<Reaction, TargetAndTransition> = {
  wave: { rotate: [0, -4, 4, -4, 0], y: -3, transition: { duration: 1.1 } },
  spin: { scaleX: [1, -1, 1], y: [0, -14, 0], transition: { duration: 0.8, ease: "easeInOut" } },
  wiggle: { rotate: [0, -10, 9, -7, 5, 0], transition: { duration: 0.9 } },
  giggle: { y: [0, -3, 0, -3, 0, -3, 0], transition: { duration: 0.9 } },
  hop: { y: [0, 4, -24, 0, -6, 0], scaleY: [1, 0.85, 1.1, 0.9, 1.03, 1], transition: { duration: 1 } },
  hearts: { scale: [1, 1.08, 1], y: -4, transition: { duration: 0.6 } },
  hi: {
    rotate: [0, -14, 10, -12, 8, -6, 0],
    y: [0, -8, -4, -6, -2, 0],
    transition: { duration: 1.2, ease: "easeInOut" },
  },
  roll: {
    // A full barrel roll around the body's centre (see ROLL_ORIGIN), with a hop so it clears the floor.
    rotate: [0, 0, 180, 360, 360],
    y: [0, 3, -16, 0, 0],
    scaleY: [1, 0.86, 1, 1.06, 1],
    transition: { duration: 1.4, times: [0, 0.15, 0.5, 0.85, 1], ease: "easeInOut" },
  },
};

/**
 * Every body target is laid over this resting pose. Motion only animates the values a target names,
 * so without it a value set by one state (e.g. the walking lean) would stay stuck after the next.
 */
const REST = { x: 0, y: 0, rotate: 0, scale: 1, scaleX: 1, scaleY: 1 };
const ROLL_ORIGIN = "60px 72px";

const SLEEP_ANIM: TargetAndTransition = { scaleY: [1, 0.95, 1], transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" } };

const BODY_BOB: Partial<Record<Props["state"], TargetAndTransition>> = {
  // Breathing: a slight stretch up from the feet (squash and stretch), not just a bob.
  idle: { y: [0, -1, 0], scaleY: [1, 1.03, 1], scaleX: [1, 0.99, 1], transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } },
  hover: { y: -6, transition: { type: "spring", stiffness: 300, damping: 14 } },
  listening: { y: [0, -2, 0], transition: { duration: 1.4, repeat: Infinity } },
  thinking: { y: [0, -1, 0], transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } },
  speaking: { y: [0, -2, 0], transition: { duration: 0.5, repeat: Infinity } },
  // A lean plus a bounce in step with the legs (LEG_STEP), so the walk reads as a trot.
  moving: { rotate: 4, y: [0, -3, 0], transition: { duration: 0.32, repeat: Infinity } },
  pointing: { y: [0, -2, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  waiting: { y: [0, -2, 0], transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } },
  celebrating: { y: [0, -18, 0, -10, 0], scaleY: [1, 1.08, 0.88, 1.04, 1], transition: { duration: 0.9, repeat: 1 } },
  error: { rotate: -6, x: [0, -3, 3, -2, 0], transition: { duration: 0.5 } },
};

/** The head tilts on its own: curious while thinking, attentive while listening. */
const HEAD_TILT: Partial<Record<Props["state"], TargetAndTransition>> = {
  thinking: { rotate: [-7, 5, -7], transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } },
  listening: { rotate: 6, transition: { type: "spring", stiffness: 200, damping: 14 } },
  error: { rotate: -10 },
};

/** Tail wag speed carries mood: slow at rest, fast when happy, still when asleep. */
function tailWag(state: Props["state"], asleep: boolean, happy: boolean): TargetAndTransition {
  if (asleep) return { rotate: -8 };
  const fast = happy || state === "celebrating" || state === "hover";
  const swing = fast ? 22 : state === "error" ? 0 : 12;
  return { rotate: [-swing, swing, -swing], transition: { duration: fast ? 0.35 : 1.6, repeat: Infinity, ease: "easeInOut" } };
}

/** Legs step in turn while walking across the page; otherwise they stand still. */
const LEG_STEP: TargetAndTransition = { y: [0, -U / 2, 0], transition: { duration: 0.32, repeat: Infinity } };

export function Pet({ state, lookAngle, gazeAngle = null, reaction = null, sleeping = false, voiceLevel = 0, size = 88 }: Props) {
  const reduce = useReducedMotion();
  const look = lookAngle ?? (sleeping ? null : gazeAngle);
  const rad = look == null ? null : (look * Math.PI) / 180;
  // Pupils shift by at most 3px, so they stay inside the eye at every angle.
  const eyeDx = rad == null ? 0 : Math.round(Math.cos(rad) * 3);
  const eyeDy = rad == null ? 0 : Math.round(Math.sin(rad) * 2);
  const pointing = (state === "pointing" || state === "waiting" || state === "speaking") && lookAngle != null;
  const asleep = sleeping && state === "idle" && !reaction;
  const happy = reaction === "giggle" || reaction === "hearts" || reaction === "wave";
  const eyeMood = asleep ? "sleep" : happy ? "hover" : state;
  const rolling = reaction === "roll" && !reduce;
  const body = useMemo<TargetAndTransition>(
    () => (reduce ? REST : { ...REST, ...(reaction ? REACTION_ANIM[reaction] : asleep ? SLEEP_ANIM : (BODY_BOB[state] ?? {})) }),
    [reduce, reaction, asleep, state],
  );
  // While pointing, the head tilts a little toward the target, so the look and the arrow agree.
  const headTilt: TargetAndTransition =
    pointing && rad != null
      ? { rotate: Math.round(Math.cos(rad) * 8), transition: { type: "spring", stiffness: 160, damping: 14 } }
      : (HEAD_TILT[state] ?? { rotate: 0 });

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Milo, Titan guide, ${state}`}
      shapeRendering="crispEdges"
      style={{ overflow: "visible" }}
    >
      {/* floor shadow */}
      <motion.rect
        x={3 * U}
        y={FEET_Y - 3}
        width={14 * U}
        height={5}
        rx={2}
        fill="var(--ink)"
        opacity={0.12}
        animate={state === "idle" && !reduce ? { opacity: [0.12, 0.07, 0.12] } : {}}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* live voice ring: follows the mic level with a spring, so speaking visibly reaches the pet */}
      <motion.circle
        cx={CENTER.x}
        cy={CENTER.y}
        r={62}
        fill="none"
        stroke="var(--pet-accent)"
        strokeWidth="2.5"
        initial={{ opacity: 0 }}
        animate={{ scale: 1 + voiceLevel * 0.25, opacity: voiceLevel > 0.05 ? 0.25 + voiceLevel * 0.75 : 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
      />

      {/* listening rings */}
      <AnimatePresence>
        {state === "listening" &&
          [0, 1].map((i) => (
            <motion.circle
              key={i}
              cx={CENTER.x}
              cy={CENTER.y}
              r={56}
              fill="none"
              stroke="var(--pet-accent)"
              strokeWidth="2"
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1.35, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
              style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
            />
          ))}
      </AnimatePresence>

      {/* pointer: a pixel arrow that orbits to aim at the target */}
      <AnimatePresence>
        {pointing && (
          <motion.g
            key="pointer"
            initial={{ opacity: 0, rotate: lookAngle ?? 0, scale: 0.6 }}
            animate={{ opacity: 1, rotate: lookAngle ?? 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
          >
            <motion.path
              d="M122 50h4v4h4v4h4v4h-4v4h-4v4h-4z"
              fill="var(--pet-accent)"
              stroke="var(--pet-outline)"
              strokeWidth={1.5}
              animate={reduce ? {} : { x: [0, 4, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.g>
        )}
      </AnimatePresence>

      {/* No per-state key: remounting reset the pose instantly (a visible snap); REST lets values glide.
          The roll alone remounts, so its 360° end becomes 0° without spinning back. */}
      <motion.g
        key={rolling ? "roll" : "body"}
        animate={body}
        style={{ transformOrigin: rolling ? ROLL_ORIGIN : `60px ${FEET_Y}px` }}
      >
        {/* tail, behind the body */}
        <motion.g
          animate={reduce ? {} : tailWag(state, asleep, happy)}
          style={{ transformOrigin: `${(TAIL_COL + 1) * U}px ${(TAIL_ROW + 7) * U}px` }}
        >
          <Cells rows={TAIL} col0={TAIL_COL} row0={TAIL_ROW} />
        </motion.g>

        {/* legs; the front-right paw lifts while pointing or waving hi */}
        {LEGS.map(([col, rows], i) => (
          <motion.g
            key={col}
            animate={
              state === "moving" && !reduce
                ? LEG_STEP
                : (reaction === "hi" || reaction === "wave") && i === 2
                  ? { y: [-U * 2, -U * 3, -U * 2], rotate: [-10, 25, -10] }
                  : reaction === "roll"
                    ? { y: [-U * 1.5, -U * 2.2, -U * 1.5] }
                    : pointing && i === 2
                      ? { y: -U - 2 }
                      : { y: 0 }
            }
            transition={
              state === "moving"
                ? { delay: i % 2 ? 0.16 : 0 }
                : (reaction === "hi" || reaction === "wave")
                  ? { repeat: 2, duration: 0.35, ease: "easeInOut" }
                  : { type: "spring", stiffness: 260, damping: 16 }
            }
          >
            <Cells rows={rows} col0={col} row0={LEG_TOP} />
          </motion.g>
        ))}

        {/* body + head */}
        <Cells rows={SPRITE.slice(12)} row0={12} />
        <motion.g
          animate={reduce ? {} : headTilt}
          style={{ transformOrigin: `60px ${11 * U}px` }}
        >
          <Cells rows={SPRITE.slice(0, 12)} />
          {/* blush: always faint, stronger when happy */}
          {[3 * U, 15 * U].map((x) => (
            <rect key={x} x={x} y={8 * U + 2} width={U + 3} height={4} fill="var(--pet-pink)" opacity={happy || state === "celebrating" || state === "hover" ? 0.95 : 0.45} />
          ))}
          <Eyes mood={eyeMood} dx={eyeDx} dy={eyeDy} />
          <Mouth state={asleep ? "sleep" : state} />
        </motion.g>

        {/* thinking dots: square, like the rest of it */}
        <AnimatePresence>
          {state === "thinking" && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {[0, 1, 2].map((i) => (
                <motion.rect
                  key={i}
                  x={98 + i * 8}
                  y={14 - i * 7}
                  width={4 + i}
                  height={4 + i}
                  fill="var(--muted)"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.g>
          )}
        </AnimatePresence>

        {/* confused mark */}
        <AnimatePresence>
          {state === "error" && (
            <motion.text
              x="104"
              y="18"
              fontSize="22"
              fontWeight="700"
              fill="var(--bad)"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 18 }}
              exit={{ opacity: 0 }}
            >
              ?
            </motion.text>
          )}
        </AnimatePresence>
      </motion.g>

      {/* floating hearts (pixel hearts) */}
      <AnimatePresence>
        {reaction === "hearts" &&
          [0, 1, 2].map((i) => (
            <motion.path
              key={i}
              d="M2 0h3v2h2V0h3v2h2v4h-2v2H8v2H4V8H2V6H0V2h2z"
              fill="var(--pet-pink)"
              initial={{ x: 30 + i * 22, y: 10, opacity: 0 }}
              animate={{ y: -18 - i * 8, opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, delay: i * 0.18 }}
            />
          ))}
      </AnimatePresence>

      {/* sleeping Zzz */}
      <AnimatePresence>
        {asleep &&
          [0, 1, 2].map((i) => (
            <motion.text
              key={i}
              x={100 + i * 7}
              y={22 - i * 9}
              fontSize={9 + i * 3}
              fontWeight="700"
              fill="var(--muted)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0], y: [22 - i * 9, 14 - i * 9] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6 }}
            >
              z
            </motion.text>
          ))}
      </AnimatePresence>

      {/* celebration sparkles: plus-shaped pixels */}
      <AnimatePresence>
        {state === "celebrating" &&
          (
            [
              [8, 20],
              [112, 16],
              [2, 80],
              [118, 76],
              [60, -6],
            ] as const
          ).map(([x, y], i) => (
            <motion.path
              key={i}
              d={`M${x - 2} ${y - 6}h4v4h4v4h-4v4h-4v-4h-4v-4h4z`}
              fill={i % 2 ? "var(--pet-accent)" : "var(--pet-iris)"}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, delay: i * 0.08, repeat: 1 }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
          ))}
      </AnimatePresence>
    </motion.svg>
  );
}

/** Two bright pixel eyes with a moving pupil and a catch-light. Mood changes shape; they blink on their own. */
function Eyes({ mood, dx, dy }: { mood: Props["state"] | "sleep"; dx: number; dy: number }) {
  if (mood === "sleep") {
    return (
      <g fill="var(--pet-outline)">
        {EYES.map((x) => (
          <rect key={x} x={x} y={EYE_Y + 7} width={EYE} height={3} />
        ))}
      </g>
    );
  }
  if (mood === "celebrating" || mood === "hover") {
    // happy "^" eyes
    return (
      <g fill="var(--pet-outline)">
        {EYES.map((x) => (
          <g key={x}>
            <rect x={x} y={EYE_Y + 8} width={3} height={3} />
            <rect x={x + 3} y={EYE_Y + 5} width={6} height={3} />
            <rect x={x + 9} y={EYE_Y + 8} width={3} height={3} />
          </g>
        ))}
      </g>
    );
  }
  const h = mood === "thinking" ? U + 1 : mood === "error" ? U + 3 : EYE;
  const top = EYE_Y + (EYE - h);
  return (
    <g>
      {EYES.map((x) => (
        <motion.g
          key={x}
          animate={{ scaleY: [1, 1, 0.15, 1] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.92, 0.95, 1] }}
          style={{ transformOrigin: `${x + U}px ${EYE_Y + U}px` }}
        >
          <rect x={x} y={top} width={EYE} height={h} fill="var(--pet-iris)" />
          <motion.rect
            x={x + 3}
            y={top + Math.max(0, h - 9)}
            width={6}
            height={Math.min(7, h)}
            fill="var(--pet-outline)"
            animate={{ x: dx, y: dy }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
          />
          <rect x={x + 1} y={top + 1} width={3} height={3} fill="#ffffff" />
        </motion.g>
      ))}
    </g>
  );
}

/** A small pixel smile at rest; an animated mouth while talking; a happy open mouth when celebrating. */
function Mouth({ state }: { state: Props["state"] | "sleep" }) {
  if (state === "speaking") {
    return (
      <motion.rect
        x={55}
        y={MOUTH_Y + 2}
        width={10}
        fill="var(--pet-outline)"
        animate={{ height: [2, 6, 3, 7, 2] }}
        transition={{ duration: 0.55, repeat: Infinity }}
      />
    );
  }
  if (state === "celebrating") {
    return (
      <g>
        <rect x={53} y={MOUTH_Y + 1} width={14} height={7} fill="var(--pet-outline)" />
        <rect x={56} y={MOUTH_Y + 5} width={8} height={3} fill="var(--pet-pink)" />
      </g>
    );
  }
  if (state === "sleep") return <rect x={57} y={MOUTH_Y + 3} width={6} height={2} fill="var(--pet-outline)" />;
  return (
    <g fill="var(--pet-outline)">
      <rect x={51} y={MOUTH_Y + 1} width={3} height={3} />
      <rect x={54} y={MOUTH_Y + 4} width={12} height={3} />
      <rect x={66} y={MOUTH_Y + 1} width={3} height={3} />
    </g>
  );
}
