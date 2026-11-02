"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, type TargetAndTransition } from "motion/react";
import type { PetState } from "./CompanionProvider";
import { ARM_TOP, ARMS, cells, LEG_TOP, LEGS, SPRITE, TAIL, TAIL_COL, TAIL_ROW, U } from "./pet-sprite";

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
  /** Walking direction: it leans into the walk (no mirroring, which would show the art is flat). */
  heading?: 1 | -1;
}

/** No reaction turns the body around or over: the pet is flat art, and showing its edge breaks the illusion. */
export const REACTIONS = ["wave", "clap", "wiggle", "giggle", "hop", "hearts", "hi", "cheer", "roll"] as const;
export type Reaction = (typeof REACTIONS)[number];

/** Eyes: 2x2 cells each at these columns, row 6. */
const EYES = [4, 11].map((c) => c * U);
const EYE_Y = 6 * U;
const EYE = 2 * U;
const MOUTH_Y = 8 * U;
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
  wave: { y: [0, -3, -2, -3, 0], transition: { duration: 1.1 } },
  clap: { y: [0, -3, 0, -3, 0], transition: { duration: 0.8 } },
  // Hips sway side to side (weight shifts between paws), the picture never tilts.
  wiggle: { x: [0, -4, 4, -3, 3, 0], scaleX: [1, 1.04, 1.04, 1.02, 1.02, 1], transition: { duration: 0.9 } },
  giggle: { y: [0, -3, 0, -3, 0, -3, 0], transition: { duration: 0.9 } },
  hop: { y: [0, 4, -14, 0, -4, 0], scaleY: [1, 0.92, 1.05, 0.95, 1], transition: { duration: 0.8 } },
  hearts: { scale: [1, 1.08, 1], y: -4, transition: { duration: 0.6 } },
  hi: { y: [0, 3, -6, 0], scaleY: [1, 0.94, 1.04, 1], transition: { duration: 0.7, ease: "easeInOut" } },
  cheer: { y: [0, 3, -12, 0, -4, 0], scaleY: [1, 0.92, 1.05, 0.95, 1], transition: { duration: 0.8 } },
  // Spins on the spot: the classic sprite turn (squeeze to edge-on, flip, back), with a little hop.
  roll: { scaleX: [1, 0.12, -1, 0.12, 1], y: [0, -6, -8, -6, 0], transition: { duration: 0.9, ease: "easeInOut" } },
};

/**
 * Every body target is laid over this resting pose. Motion only animates the values a target names,
 * so without it a value set by one state (e.g. the walking lean) would stay stuck after the next.
 */
const REST = { x: 0, y: 0, rotate: 0, scale: 1, scaleX: 1, scaleY: 1 };

/**
 * Paw gestures: natural dog movements. Paws stay grounded or gently lift (max 35°),
 * NEVER flipping upside down into the sky.
 */
type Gesture = { left: TargetAndTransition; right: TargetAndTransition };
const still = { rotate: 0, transition: { type: "spring", stiffness: 260, damping: 16 } } as const;
const loop = (duration: number, repeat = Infinity) => ({ type: "tween" as const, duration, repeat, ease: "easeInOut" as const });
const GESTURES: Partial<Record<Reaction | "celebrating" | "moving" | "speaking", Gesture>> = {
  wave: { left: still, right: { rotate: [-18, -35, -18], transition: loop(0.35, 3) } },
  hi: { left: still, right: { rotate: [-15, -30, -15], transition: loop(0.35, 3) } },
  clap: { left: { rotate: [0, -18, 5, -18, 5, -18, 0], transition: loop(0.9, 0) }, right: { rotate: [0, 18, -5, 18, -5, 18, 0], transition: loop(0.9, 0) } },
  hearts: { left: { rotate: -15 }, right: { rotate: 15 } },
  cheer: { left: { rotate: [-15, 0, -15], transition: loop(0.3, 3) }, right: { rotate: [15, 0, 15], transition: loop(0.3, 3) } },
  hop: { left: { rotate: -10 }, right: { rotate: 10 } },
  wiggle: { left: { rotate: [-10, 10, -10], transition: loop(0.25, 4) }, right: { rotate: [10, -10, 10], transition: loop(0.25, 4) } },
  giggle: { left: { rotate: [-8, 0, -8], transition: loop(0.3, 3) }, right: { rotate: [8, 0, 8], transition: loop(0.3, 3) } },
  roll: { left: { rotate: [-20, 20, -20], transition: loop(0.4, 2) }, right: { rotate: [20, -20, 20], transition: loop(0.4, 2) } },
  celebrating: { left: { rotate: [-16, 0, -16], transition: loop(0.35) }, right: { rotate: [16, 0, 16], transition: loop(0.35) } },
  moving: { left: { rotate: [12, -12, 12], transition: loop(0.64) }, right: { rotate: [-12, 12, -12], transition: loop(0.64) } },
  speaking: { left: still, right: { rotate: [-10, -22, -10], transition: loop(1.1) } },
};

/** Before it sets off: a crouch, weight back. On arrival: squash on contact, overshoot, settle. */
const ANTICIPATE: TargetAndTransition = { y: 3, scaleY: 0.88, scaleX: 1.07, x: 0, transition: { duration: 0.14, ease: "easeOut" } };
const LAND: TargetAndTransition = { y: [2, -2, 0], scaleY: [0.88, 1.06, 1], scaleX: [1.08, 0.97, 1], x: 0, transition: { duration: 0.38, ease: "easeOut" } };

const SLEEP_ANIM: TargetAndTransition = { scaleY: [1, 0.95, 1], transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" } };

const BODY_BOB: Partial<Record<Props["state"], TargetAndTransition>> = {
  // Breathing: a slight stretch up from the feet (squash and stretch), not just a bob.
  idle: { y: [0, -1, 0], scaleY: [1, 1.03, 1], scaleX: [1, 0.99, 1], transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } },
  hover: { y: -6, transition: { type: "spring", stiffness: 300, damping: 14 } },
  listening: { y: [0, -2, 0], transition: { duration: 1.4, repeat: Infinity } },
  thinking: { y: [0, -1, 0], transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } },
  speaking: { y: [0, -2, 0], transition: { duration: 0.5, repeat: Infinity } },
  // Front-view gait: hips shift onto the stepping paw and the body dips on each footfall (two per
  // stride, in step with LEG_STEP). No lean: tilting the whole sprite is what read as a flat image.
  moving: {
    x: [-1.5, 0, 1.5, 0, -1.5],
    y: [0, -4, 0, -4, 0],
    scaleY: [0.97, 1.03, 0.97, 1.03, 0.97],
    transition: { duration: 0.64, repeat: Infinity, ease: "easeInOut" },
  },
  pointing: { y: [0, -2, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  waiting: { y: [0, -2, 0], transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } },
  celebrating: { y: [0, -18, 0, -10, 0], scaleY: [1, 1.08, 0.88, 1.04, 1], transition: { duration: 0.9, repeat: 1 } },
  error: { x: [0, -3, 3, -2, 0], scaleY: [1, 0.96, 1], transition: { duration: 0.5 } },
};

/** The head tilts on its own: curious while thinking, attentive while listening. */
const HEAD_TILT: Partial<Record<Props["state"], TargetAndTransition>> = {
  thinking: { rotate: [-7, 5, -7], transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } },
  listening: { rotate: 6, transition: { type: "spring", stiffness: 200, damping: 14 } },
  error: { rotate: -10 },
};

/** Tail wag speed carries mood: slow at rest, fast when happy, still when asleep. */
function tailWag(state: Props["state"], asleep: boolean, happy: boolean): TargetAndTransition {
  if (asleep) return { rotate: -8, transition: { type: "tween", duration: 0.2 } };
  const fast = happy || state === "celebrating" || state === "hover";
  const swing = fast ? 22 : state === "error" ? 0 : 12;
  return { rotate: [-swing, swing, -swing], transition: { type: "tween", duration: fast ? 0.35 : 1.6, repeat: Infinity, ease: "easeInOut" } };
}

/** Legs step in turn while walking across the page; otherwise they stand still. */
const LEG_STEP: TargetAndTransition = { y: [0, -U / 2, 0], transition: { type: "tween", duration: 0.32, repeat: Infinity, ease: "easeInOut" } };

export function Pet({ state, lookAngle, gazeAngle = null, reaction = null, sleeping = false, voiceLevel = 0, size = 88, heading = 1 }: Props) {
  const reduce = useReducedMotion();
  // Movement phases around a walk: anticipate (just started), land (just stopped).
  const [phase, setPhase] = useState<"none" | "anticipate" | "land">("none");
  const prevState = useRef(state);
  useEffect(() => {
    const was = prevState.current;
    prevState.current = state;
    if (state === "moving" && was !== "moving") {
      setPhase("anticipate");
      const t = setTimeout(() => setPhase("none"), 140);
      return () => clearTimeout(t);
    }
    if (was === "moving" && state !== "moving") {
      setPhase("land");
      const t = setTimeout(() => setPhase("none"), 380);
      return () => clearTimeout(t);
    }
  }, [state]);
  const walking = state === "moving" && phase !== "anticipate";
  const faceTurnFor = (deg: number | null) => (deg == null ? 0 : Math.round(Math.cos((deg * Math.PI) / 180) * 2));
  const look = lookAngle ?? (sleeping ? null : gazeAngle);
  const rad = look == null ? null : (look * Math.PI) / 180;
  // Pupils shift by at most 3px, so they stay inside the eye at every angle.
  const eyeDx = rad == null ? 0 : Math.round(Math.cos(rad) * 3);
  const eyeDy = rad == null ? 0 : Math.round(Math.sin(rad) * 2);
  const pointing = (state === "pointing" || state === "waiting" || state === "speaking") && lookAngle != null;
  const asleep = sleeping && state === "idle" && !reaction;
  const happy = reaction === "giggle" || reaction === "hearts" || reaction === "wave" || reaction === "roll";
  const eyeMood = asleep ? "sleep" : happy ? "hover" : state;
  const faceTurn = faceTurnFor(look);
  const body = useMemo<TargetAndTransition>(
    () =>
      reduce
        ? REST
        : {
            ...REST,
            ...(reaction && state !== "moving" ? REACTION_ANIM[reaction] : asleep ? SLEEP_ANIM : (BODY_BOB[state] ?? {})),
            ...(phase === "anticipate" ? ANTICIPATE : phase === "land" ? LAND : {}),
          },
    [reduce, reaction, asleep, state, phase],
  );
  // While pointing, the paw on the target's side points at it (0° hangs down, so aim = angle − 90°).
  const aim = lookAngle == null ? 0 : (((lookAngle - 90 + 540) % 360) - 180);
  const aimAt = { rotate: aim, transition: { type: "spring", stiffness: 180, damping: 14 } } as const;
  const pointArm: Gesture | null =
    pointing && rad != null ? (Math.cos(rad) >= 0 ? { left: still, right: aimAt } : { left: aimAt, right: still }) : null;
  const arms: Gesture =
    (reaction && GESTURES[reaction]) || pointArm || (asleep ? null : GESTURES[state as "celebrating" | "moving" | "speaking"]) || { left: still, right: still };
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

      {/* No per-state key: remounting reset the pose instantly (a visible snap); REST lets values glide. */}
      <motion.g
        animate={body}
        style={{ transformOrigin: `60px ${FEET_Y}px` }}
      >
        {/* tail, behind the body */}
        <motion.g
          animate={reduce ? {} : walking ? { rotate: [-heading * 22, -heading * 10, -heading * 22], transition: { duration: 0.32, repeat: Infinity, ease: "easeInOut" } } : tailWag(state, asleep, happy)}
          style={{ transformOrigin: `${(TAIL_COL + 1) * U}px ${(TAIL_ROW + 7) * U}px` }}
        >
          <Cells rows={TAIL} col0={TAIL_COL} row0={TAIL_ROW} />
        </motion.g>

        {/* legs step in turn while walking */}
        {LEGS.map(([col, rows], i) => (
          <motion.g
            key={col}
            animate={walking && !reduce ? LEG_STEP : { y: 0 }}
            transition={walking ? { type: "tween", delay: i % 2 ? 0.32 : 0, duration: 0.32, ease: "easeInOut" } : { type: "spring", stiffness: 260, damping: 16 }}
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
         {/* The head follows the body a beat late, so it reads as weight, not one rigid picture. */}
         <motion.g
          animate={reduce ? {} : walking ? { y: [1, -1, 1, -1, 1] } : phase === "land" ? { y: [0, 2, 0] } : { y: 0 }}
          transition={walking ? { duration: 0.64, repeat: Infinity, ease: "easeInOut", delay: 0.08 } : { duration: 0.35 }}
         >
          {/* Ears flop after the head (follow-through), twitch at rest and perk up to listen. */}
          <motion.g
            animate={
              reduce
                ? {}
                : walking
                  ? { y: [0, -2, 0, -2, 0] }
                  : state === "listening"
                    ? { y: -3 }
                    : phase === "land"
                      ? { y: [0, 3, -1, 0] }
                      : { y: [0, 0, -2, 0, 0, 0] }
            }
            transition={
              walking
                ? { duration: 0.64, repeat: Infinity, ease: "easeInOut", delay: 0.16 }
                : state === "listening"
                  ? { type: "spring", stiffness: 300, damping: 12 }
                  : phase === "land"
                    ? { duration: 0.45 }
                    : { duration: 5.5, repeat: Infinity, times: [0, 0.6, 0.63, 0.66, 0.9, 1] }
            }
          >
            <Cells rows={SPRITE.slice(0, 3)} />
          </motion.g>
          <Cells rows={SPRITE.slice(3, 12)} row0={3} />
          {/* Face turn: features slide toward where it's heading, so the head reads as turning. */}
          <motion.g animate={{ x: walking ? heading * 4 : faceTurn }} transition={{ type: "spring", stiffness: 180, damping: 16 }}>
          {/* blush: always faint, stronger when happy */}
          {[2 * U, 14 * U].map((x) => (
            <rect key={x} x={x} y={7 * U + 3} width={2 * U} height={4} fill="var(--pet-pink)" opacity={happy || state === "celebrating" || state === "hover" ? 0.95 : 0.45} />
          ))}
          <Eyes mood={eyeMood} dx={eyeDx} dy={eyeDy} idleGlance={!reduce && state === "idle" && look == null && !asleep} />
          <Mouth state={asleep ? "sleep" : state} />
          </motion.g>
         </motion.g>
        </motion.g>

        {/* front paws: every gesture is a rotation about the shoulder */}
        {ARMS.map(([col, rows], i) => (
          <motion.g
            key={col}
            animate={reduce ? { rotate: 0 } : i === 0 ? arms.left : arms.right}
            style={{ transformOrigin: `${(col + 1.5) * U}px ${ARM_TOP * U + 3}px` }}
          >
            <Cells rows={rows} col0={col} row0={ARM_TOP} />
          </motion.g>
        ))}

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
function Eyes({ mood, dx, dy, idleGlance = false }: { mood: Props["state"] | "sleep"; dx: number; dy: number; idleGlance?: boolean }) {
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
            // At rest with nothing to watch, it glances around now and then instead of staring.
            animate={idleGlance ? { x: [0, 0, -3, -3, 0, 0, 3, 3, 0], y: [0, 0, 0, -1, 0, 0, 0, 1, 0] } : { x: dx, y: dy }}
            transition={idleGlance ? { duration: 9, repeat: Infinity, ease: "easeInOut" } : { type: "spring", stiffness: 200, damping: 18 }}
          />
          <rect x={x + 1} y={top + 1} width={3} height={3} fill="#ffffff" />
        </motion.g>
      ))}
    </g>
  );
}

/** A solid pixel puppy nose and smile; animated mouth while talking; happy open mouth with tongue when celebrating. */
function Mouth({ state }: { state: Props["state"] | "sleep" }) {
  if (state === "speaking") {
    return (
      <g>
        <rect x={48} y={48} width={12} height={7} fill="var(--pet-outline)" />
        <motion.rect
          x={49}
          y={56}
          width={10}
          fill="var(--pet-outline)"
          animate={{ height: [2, 6, 3, 7, 2] }}
          transition={{ duration: 0.55, repeat: Infinity }}
        />
      </g>
    );
  }
  if (state === "celebrating") {
    return (
      <g>
        <rect x={48} y={48} width={12} height={7} fill="var(--pet-outline)" />
        <rect x={46} y={56} width={16} height={6} fill="var(--pet-outline)" />
        <rect x={50} y={58} width={8} height={4} fill="var(--pet-pink)" />
      </g>
    );
  }
  if (state === "sleep") {
    return (
      <g>
        <rect x={48} y={48} width={12} height={7} fill="var(--pet-outline)" />
        <rect x={51} y={57} width={6} height={2} fill="var(--pet-outline)" />
      </g>
    );
  }
  return (
    <g fill="var(--pet-outline)">
      {/* 2x2 solid nose */}
      <rect x={48} y={48} width={12} height={7} />
      {/* cute puppy smile */}
      <rect x={45} y={56} width={3} height={3} />
      <rect x={48} y={58} width={12} height={3} />
      <rect x={60} y={56} width={3} height={3} />
    </g>
  );
}
