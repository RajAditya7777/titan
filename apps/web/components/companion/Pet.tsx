"use client";

import { motion, AnimatePresence, useReducedMotion, type TargetAndTransition } from "motion/react";
import type { PetState } from "./CompanionProvider";

/**
 * The Reflect guide: a small blocky critter drawn on a 6px pixel grid. Pure SVG + motion, no image
 * assets, so it scales crisply, themes with CSS (--pet-body, --pet-eye) and costs nothing to ship.
 * Every visual is a function of (state, lookAngle, voiceLevel). It has no face screen or antenna on
 * purpose: mood is carried by the eyes and the body, the way pixel-art characters do it.
 */

interface Props {
  state: PetState | "hover";
  /** Degrees; where the eyes look and the arm points. null = look at the user. */
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

export const REACTIONS = ["wave", "spin", "wiggle", "giggle", "hop", "hearts"] as const;
export type Reaction = (typeof REACTIONS)[number];

/** One grid cell. All geometry below is in multiples of it, so edges stay pixel-aligned. */
const U = 6;
/** Body 12x7 cells, arms 2x2 cells each side, four legs 1x3 cells. Feet rest at y=108. */
const BODY = { x: 4 * U, y: 8 * U, w: 12 * U, h: 7 * U };
const LEGS = [5, 7, 12, 14].map((c) => c * U);
const EYES = [6, 13].map((c) => c * U);
const EYE_Y = 9 * U;
const ARM_Y = 11 * U;
const BODY_FILL = "var(--pet-body)";
const EYE_FILL = "var(--pet-eye)";

/** Squash-and-stretch keyframes: the classic animation principle that makes a body feel soft. */
const REACTION_ANIM: Record<Reaction, TargetAndTransition> = {
  wave: { rotate: [0, -4, 4, -4, 0], y: -3, transition: { duration: 1.1 } },
  spin: { scaleX: [1, -1, 1], y: [0, -14, 0], transition: { duration: 0.8, ease: "easeInOut" } },
  wiggle: { rotate: [0, -10, 9, -7, 5, 0], transition: { duration: 0.9 } },
  giggle: { y: [0, -3, 0, -3, 0, -3, 0], transition: { duration: 0.9 } },
  hop: { y: [0, 4, -24, 0, -6, 0], scaleY: [1, 0.85, 1.1, 0.9, 1.03, 1], transition: { duration: 1 } },
  hearts: { scale: [1, 1.08, 1], y: -4, transition: { duration: 0.6 } },
};

const SLEEP_ANIM: TargetAndTransition = { scaleY: [1, 0.94, 1], transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" } };

const BODY_BOB: Partial<Record<Props["state"], TargetAndTransition>> = {
  idle: { y: [0, -3, 0], transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } },
  hover: { y: -6, transition: { type: "spring", stiffness: 300, damping: 14 } },
  listening: { y: [0, -2, 0], transition: { duration: 1.4, repeat: Infinity } },
  thinking: { rotate: [-3, 3, -3], transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } },
  speaking: { y: [0, -2, 0], transition: { duration: 0.5, repeat: Infinity } },
  moving: { rotate: 6 },
  pointing: { y: [0, -2, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  waiting: { y: [0, -3, 0], transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } },
  celebrating: { y: [0, -18, 0, -10, 0], transition: { duration: 0.9, repeat: 1 } },
  error: { rotate: -8, x: [0, -3, 3, -2, 0], transition: { duration: 0.5 } },
};

/** Legs step in turn while walking across the page; otherwise they stand still. */
const LEG_STEP: TargetAndTransition = { y: [0, -U / 2, 0], transition: { duration: 0.32, repeat: Infinity } };

export function Pet({ state, lookAngle, gazeAngle = null, reaction = null, sleeping = false, voiceLevel = 0, size = 88 }: Props) {
  const reduce = useReducedMotion();
  const look = lookAngle ?? (sleeping ? null : gazeAngle);
  const rad = look == null ? null : (look * Math.PI) / 180;
  // Eyes shift by at most half a cell, so they stay inside the body at every angle.
  const eyeDx = rad == null ? 0 : Math.round(Math.cos(rad) * 3);
  const eyeDy = rad == null ? 0 : Math.round(Math.sin(rad) * 2);
  const pointing = (state === "pointing" || state === "waiting" || state === "speaking") && lookAngle != null;
  const asleep = sleeping && state === "idle" && !reaction;
  const eyeMood = asleep ? "sleep" : reaction === "giggle" || reaction === "hearts" || reaction === "wave" ? "hover" : state;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Reflect guide, ${state}`}
      shapeRendering="crispEdges"
      style={{ overflow: "visible" }}
    >
      {/* floor shadow */}
      <motion.rect
        x={BODY.x + U}
        y={110}
        width={BODY.w - 2 * U}
        height={4}
        fill="var(--ink)"
        opacity={0.14}
        animate={state === "idle" && !reduce ? { opacity: [0.14, 0.08, 0.14] } : {}}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* live voice ring: follows the mic level with a spring, so speaking visibly reaches the pet */}
      <motion.rect
        x={BODY.x - 2 * U}
        y={BODY.y - 2 * U}
        width={BODY.w + 4 * U}
        height={BODY.h + 4 * U}
        rx={U * 2}
        fill="none"
        stroke="var(--pet-body)"
        strokeWidth="2.5"
        animate={{ scale: 1 + voiceLevel * 0.35, opacity: voiceLevel > 0.05 ? 0.25 + voiceLevel * 0.75 : 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        style={{ transformOrigin: "60px 69px" }}
      />

      {/* listening rings */}
      <AnimatePresence>
        {state === "listening" &&
          [0, 1].map((i) => (
            <motion.rect
              key={i}
              x={BODY.x - U}
              y={BODY.y - U}
              width={BODY.w + 2 * U}
              height={BODY.h + 2 * U}
              rx={U * 2}
              fill="none"
              stroke="var(--pet-body)"
              strokeWidth="2"
              initial={{ scale: 0.95, opacity: 0.7 }}
              animate={{ scale: 1.45, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
              style={{ transformOrigin: "60px 69px" }}
            />
          ))}
      </AnimatePresence>

      <motion.g
        key={reaction ?? (asleep ? "sleep" : state)}
        animate={reduce ? {} : reaction ? REACTION_ANIM[reaction] : asleep ? SLEEP_ANIM : (BODY_BOB[state] ?? {})}
        style={{ transformOrigin: "60px 108px" }}
      >
        {/* legs */}
        {LEGS.map((x, i) => (
          <motion.rect
            key={x}
            x={x}
            y={BODY.y + BODY.h - 1}
            width={U}
            height={3 * U + 1}
            fill={BODY_FILL}
            animate={state === "moving" && !reduce ? LEG_STEP : { y: 0 }}
            transition={{ delay: i % 2 ? 0.16 : 0 }}
          />
        ))}

        {/* left arm */}
        <rect x={BODY.x - 2 * U} y={ARM_Y} width={2 * U + 1} height={2 * U} fill={BODY_FILL} />

        {/* right arm: rests, points at the target, or waves */}
        <AnimatePresence initial={false} mode="popLayout">
          {pointing ? (
            <motion.rect
              key="point"
              x={60}
              y={ARM_Y}
              width={BODY.w / 2 + 4 * U}
              height={2 * U}
              fill={BODY_FILL}
              initial={{ opacity: 0, scaleX: 0.4 }}
              animate={{ opacity: 1, scaleX: 1, rotate: lookAngle ?? 0 }}
              exit={{ opacity: 0, scaleX: 0.4 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
              style={{ transformOrigin: `60px ${ARM_Y + U}px` }}
            />
          ) : (
            <motion.rect
              key="rest"
              x={BODY.x + BODY.w - 1}
              y={ARM_Y}
              width={2 * U + 1}
              height={2 * U}
              fill={BODY_FILL}
              animate={reaction === "wave" ? { rotate: [0, -50, -10, -50, 0] } : { rotate: 0 }}
              transition={{ duration: 1.1 }}
              style={{ transformOrigin: `${BODY.x + BODY.w}px ${ARM_Y + U}px` }}
            />
          )}
        </AnimatePresence>

        {/* body */}
        <rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} fill={BODY_FILL} />

        <Eyes mood={eyeMood} dx={eyeDx} dy={eyeDy} />
        <Mouth state={asleep ? "sleep" : state} />

        {/* thinking dots: square, like the rest of it */}
        <AnimatePresence>
          {state === "thinking" && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {[0, 1, 2].map((i) => (
                <motion.rect
                  key={i}
                  x={84 + i * 9}
                  y={36 - i * 7}
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
              x="98"
              y="40"
              fontSize="22"
              fontWeight="700"
              fill="var(--bad)"
              initial={{ opacity: 0, y: 46 }}
              animate={{ opacity: 1, y: 40 }}
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
              fill="var(--pet-body)"
              initial={{ x: 34 + i * 18, y: 40, opacity: 0 }}
              animate={{ y: 8 - i * 8, opacity: [0, 1, 0] }}
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
              x={90 + i * 7}
              y={42 - i * 9}
              fontSize={9 + i * 3}
              fontWeight="700"
              fill="var(--muted)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0], y: [42 - i * 9, 34 - i * 9] }}
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
              [12, 30],
              [104, 24],
              [6, 84],
              [112, 80],
              [60, 14],
            ] as const
          ).map(([x, y], i) => (
            <motion.path
              key={i}
              d={`M${x - 2} ${y - 6}h4v4h4v4h-4v4h-4v-4h-4v-4h4z`}
              fill={i % 2 ? "var(--accent-2)" : "var(--pet-body)"}
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

/** Two tall pixel eyes. Mood changes their shape; gaze moves them; they blink on their own. */
function Eyes({ mood, dx, dy }: { mood: Props["state"] | "sleep"; dx: number; dy: number }) {
  if (mood === "sleep") {
    return (
      <g fill={EYE_FILL}>
        {EYES.map((x) => (
          <rect key={x} x={x - 1} y={EYE_Y + U} width={U + 2} height={3} />
        ))}
      </g>
    );
  }
  if (mood === "celebrating" || mood === "hover") {
    // happy "^" eyes, three pixels each
    return (
      <g fill={EYE_FILL}>
        {EYES.map((x) => (
          <path key={x} d={`M${x - 3} ${EYE_Y + 9}h3v-3h3v-3h3v3h-3v3h-3v3h-3zM${x + 6} ${EYE_Y + 6}h3v3h3v3h-3v-3h-3z`} />
        ))}
      </g>
    );
  }
  const h = mood === "thinking" ? U : mood === "error" ? U + 3 : 2 * U;
  const top = EYE_Y + (2 * U - h);
  return (
    <motion.g animate={{ x: dx, y: dy }} transition={{ type: "spring", stiffness: 200, damping: 18 }}>
      {EYES.map((x) => (
        <motion.rect
          key={x}
          x={x}
          y={top}
          width={U}
          height={h}
          fill={EYE_FILL}
          animate={{ scaleY: [1, 1, 0.15, 1] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.92, 0.95, 1] }}
          style={{ transformOrigin: `${x + U / 2}px ${EYE_Y + U}px` }}
        />
      ))}
    </motion.g>
  );
}

/** No mouth at rest (pixel critters read better without one); it only appears while talking. */
function Mouth({ state }: { state: Props["state"] | "sleep" }) {
  if (state === "speaking") {
    return (
      <motion.rect
        x={57}
        y={EYE_Y + 2 * U + 3}
        width={U}
        fill={EYE_FILL}
        animate={{ height: [1, 5, 2, 6, 1] }}
        transition={{ duration: 0.55, repeat: Infinity }}
      />
    );
  }
  if (state === "celebrating") return <rect x={54} y={EYE_Y + 2 * U + 3} width={2 * U} height={4} fill={EYE_FILL} />;
  return null;
}
