"use client";

import { motion, AnimatePresence, useReducedMotion, type TargetAndTransition } from "motion/react";
import type { PetState } from "./CompanionProvider";

/**
 * "Refi": the Reflect Companion. Pure SVG + motion, no image assets, so it scales crisply,
 * themes with CSS and costs nothing to ship. Every visual is a function of (state, lookAngle).
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

/** Squash-and-stretch keyframes: the classic animation principle that makes a body feel soft. */
const REACTION_ANIM: Record<Reaction, TargetAndTransition> = {
  wave: { rotate: [0, -6, 6, -6, 0], y: -4, transition: { duration: 1.1 } },
  spin: { rotate: [0, 360], scaleY: [1, 0.85, 1.1, 1], y: [0, -14, 0], transition: { duration: 0.8, ease: "easeInOut" } },
  wiggle: { rotate: [0, -14, 12, -10, 8, 0], scaleX: [1, 1.08, 0.94, 1.05, 1], transition: { duration: 0.9 } },
  giggle: { y: [0, -3, 0, -3, 0, -3, 0], scaleX: [1, 1.05, 1, 1.05, 1], transition: { duration: 0.9 } },
  hop: { y: [0, 4, -26, 0, -8, 0], scaleY: [1, 0.8, 1.15, 0.88, 1.04, 1], scaleX: [1, 1.15, 0.9, 1.1, 0.98, 1], transition: { duration: 1 } },
  hearts: { scale: [1, 1.12, 1], y: -6, transition: { duration: 0.6 } },
};

const SLEEP_ANIM: TargetAndTransition = { scaleY: [1, 0.95, 1], y: [2, 4, 2], transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" } };

const BODY_BOB: Partial<Record<Props["state"], TargetAndTransition>> = {
  idle: { y: [0, -5, 0], transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } },
  hover: { y: -6, scale: 1.06, transition: { type: "spring", stiffness: 300, damping: 14 } },
  listening: { y: [0, -3, 0], scale: [1, 1.03, 1], transition: { duration: 1.4, repeat: Infinity } },
  thinking: { rotate: [-4, 4, -4], transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } },
  speaking: { y: [0, -2, 0], transition: { duration: 0.5, repeat: Infinity } },
  moving: { rotate: 8, scale: 0.96 },
  pointing: { y: [0, -3, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  waiting: { y: [0, -4, 0], transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } },
  celebrating: { y: [0, -18, 0, -10, 0], rotate: [0, -8, 8, 0], transition: { duration: 0.9, repeat: 1 } },
  error: { rotate: -12, x: [0, -3, 3, -2, 0], transition: { duration: 0.5 } },
};

export function Pet({ state, lookAngle, gazeAngle = null, reaction = null, sleeping = false, voiceLevel = 0, size = 88 }: Props) {
  const reduce = useReducedMotion();
  const look = lookAngle ?? (sleeping ? null : gazeAngle);
  const rad = look == null ? null : (look * Math.PI) / 180;
  const eyeDx = rad == null ? 0 : Math.cos(rad) * 2.6;
  const eyeDy = rad == null ? (state === "listening" ? 0.6 : 0) : Math.sin(rad) * 2.2;
  const pointing = (state === "pointing" || state === "waiting" || state === "speaking") && lookAngle != null;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Reflect Companion, ${state}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="pet-body" cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="var(--pet-1)" />
          <stop offset="38%" stopColor="var(--pet-2)" />
          <stop offset="78%" stopColor="var(--pet-3)" />
          <stop offset="100%" stopColor="var(--pet-4)" />
        </radialGradient>
        <linearGradient id="pet-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#120F2E" />
          <stop offset="100%" stopColor="#1C1747" />
        </linearGradient>
        <radialGradient id="pet-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7DD3FC" stopOpacity="1" />
          <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0" />
        </radialGradient>
        <filter id="pet-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="var(--pet-3)" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* floor shadow */}
      <motion.ellipse
        cx="60"
        cy="112"
        rx="26"
        ry="4.5"
        fill="#0B0A1F"
        opacity={0.35}
        animate={state === "idle" && !reduce ? { rx: [26, 22, 26], opacity: [0.35, 0.22, 0.35] } : {}}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* live voice ring: follows the mic level with a spring, so speaking visibly reaches the pet */}
      <motion.circle
        cx="60"
        cy="58"
        r="42"
        fill="rgba(59,139,234,0.10)"
        stroke="#3B8BEA"
        strokeWidth="2.5"
        animate={{ scale: 1 + voiceLevel * 0.45, opacity: voiceLevel > 0.05 ? 0.25 + voiceLevel * 0.75 : 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        style={{ transformOrigin: "60px 58px" }}
      />

      {/* listening rings */}
      <AnimatePresence>
        {state === "listening" &&
          [0, 1].map((i) => (
            <motion.circle
              key={i}
              cx="60"
              cy="58"
              r="40"
              fill="none"
              stroke="#3B8BEA"
              strokeWidth="2"
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
              style={{ transformOrigin: "60px 58px" }}
            />
          ))}
      </AnimatePresence>

      <motion.g
        key={reaction ?? (sleeping ? "sleep" : state)}
        animate={reduce ? {} : reaction ? REACTION_ANIM[reaction] : sleeping && state === "idle" ? SLEEP_ANIM : (BODY_BOB[state] ?? {})}
        style={{ transformOrigin: "60px 100px" }}
      >
        {/* pointing arm, behind the body */}
        <AnimatePresence>
          {pointing && (
            <motion.g
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1, rotate: lookAngle ?? 0 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
              style={{ transformOrigin: "60px 62px" }}
            >
              <rect x="74" y="56" width="34" height="12" rx="6" fill="var(--pet-arm)" />
              <circle cx="108" cy="62" r="7.5" fill="var(--pet-hand)" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* waving arm (hover reaction) */}
        <AnimatePresence>
          {reaction === "wave" && (
            <motion.g
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: [-30, -70, -30, -70, -30] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1 }}
              style={{ transformOrigin: "88px 66px" }}
            >
              <rect x="86" y="60" width="26" height="11" rx="5.5" fill="var(--pet-arm)" />
              <circle cx="112" cy="65.5" r="7" fill="var(--pet-hand)" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* antenna */}
        <path d="M60 22 Q 62 12 70 9" stroke="var(--pet-2)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <motion.circle
          cx="71"
          cy="8"
          r="5"
          fill={state === "error" ? "#FB7185" : state === "listening" ? "#7DD3FC" : state === "thinking" ? "#FCD34D" : "#A5F3FC"}
          animate={{ scale: state === "thinking" || state === "listening" ? [1, 1.35, 1] : 1 }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
        <circle cx="71" cy="8" r="11" fill="url(#pet-glow)" opacity={0.5} />

        {/* body: soft squircle */}
        <path
          d="M60 20 C 92 20 104 36 104 64 C 104 92 88 106 60 106 C 32 106 16 92 16 64 C 16 36 28 20 60 20 Z"
          fill="url(#pet-body)"
          filter="url(#pet-soft)"
        />
        {/* gloss */}
        <ellipse cx="42" cy="36" rx="16" ry="8" fill="white" opacity={0.28} transform="rotate(-20 42 36)" />

        {/* face plate */}
        <rect x="28" y="44" width="64" height="40" rx="20" fill="url(#pet-face)" />

        {/* eyes */}
        <Eyes state={reaction === "giggle" || reaction === "hearts" ? "hover" : state} dx={eyeDx} dy={eyeDy} sleeping={sleeping && state === "idle" && !reaction} />

        {/* cheeks */}
        <AnimatePresence>
          {(state === "celebrating" || state === "hover" || reaction === "giggle" || reaction === "hearts") && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} exit={{ opacity: 0 }}>
              <ellipse cx="36" cy="76" rx="5" ry="3" fill="#F9A8D4" />
              <ellipse cx="84" cy="76" rx="5" ry="3" fill="#F9A8D4" />
            </motion.g>
          )}
        </AnimatePresence>

        <Mouth state={sleeping && state === "idle" && !reaction ? "sleep" : reaction === "giggle" || reaction === "hearts" || reaction === "wave" ? "hover" : state} />

        {/* thinking dots */}
        <AnimatePresence>
          {state === "thinking" && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={i}
                  cx={86 + i * 9}
                  cy={20 - i * 5}
                  r={2.5 + i}
                  fill="#C4B5FD"
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
              x="94"
              y="30"
              fontSize="22"
              fontWeight="700"
              fill="#FB7185"
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 30 }}
              exit={{ opacity: 0 }}
            >
              ?
            </motion.text>
          )}
        </AnimatePresence>
      </motion.g>

      {/* floating hearts */}
      <AnimatePresence>
        {reaction === "hearts" &&
          [0, 1, 2].map((i) => (
            <motion.path
              key={i}
              d="M0 3 C0 -1 5 -1 5 3 C5 -1 10 -1 10 3 C10 7 5 10 5 12 C5 10 0 7 0 3 Z"
              fill="#FF7AA8"
              initial={{ x: 40 + i * 16, y: 30, opacity: 0, scale: 0.6 }}
              animate={{ y: -10 - i * 8, opacity: [0, 1, 0], scale: 1.2, x: 36 + i * 18 + (i - 1) * 6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, delay: i * 0.18 }}
            />
          ))}
      </AnimatePresence>

      {/* sleeping Zzz */}
      <AnimatePresence>
        {sleeping && state === "idle" && !reaction &&
          [0, 1, 2].map((i) => (
            <motion.text
              key={i}
              x={88 + i * 7}
              y={30 - i * 9}
              fontSize={9 + i * 3}
              fontWeight="700"
              fill="var(--pet-hand)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0], y: [30 - i * 9, 22 - i * 9] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6 }}
            >
              z
            </motion.text>
          ))}
      </AnimatePresence>

      {/* celebration sparkles */}
      <AnimatePresence>
        {state === "celebrating" &&
          [
            [12, 20, "#FCD34D"],
            [104, 14, "#7DD3FC"],
            [8, 74, "#F9A8D4"],
            [112, 70, "#C4B5FD"],
            [60, 0, "#86EFAC"],
          ].map(([x, y, c], i) => (
            <motion.path
              key={i}
              d={`M${x} ${Number(y) - 6} L${Number(x) + 2} ${Number(y) - 2} L${Number(x) + 6} ${y} L${Number(x) + 2} ${Number(y) + 2} L${x} ${Number(y) + 6} L${Number(x) - 2} ${Number(y) + 2} L${Number(x) - 6} ${y} L${Number(x) - 2} ${Number(y) - 2} Z`}
              fill={String(c)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0], rotate: 90 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, delay: i * 0.08, repeat: 1 }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
          ))}
      </AnimatePresence>
    </motion.svg>
  );
}

function Eyes({ state, dx, dy, sleeping }: { state: Props["state"]; dx: number; dy: number; sleeping?: boolean }) {
  if (sleeping) {
    return (
      <g stroke="#E0F2FE" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M40 64 Q 46 69 52 64" />
        <path d="M68 64 Q 74 69 80 64" />
      </g>
    );
  }
  if (state === "celebrating" || state === "hover") {
    // happy closed arcs
    return (
      <g stroke="#E0F2FE" strokeWidth="3.5" fill="none" strokeLinecap="round">
        <path d="M40 64 Q 46 57 52 64" />
        <path d="M68 64 Q 74 57 80 64" />
      </g>
    );
  }
  const squint = state === "thinking" ? 0.55 : state === "error" ? 0.8 : 1;
  return (
    <motion.g
      animate={{ x: dx, y: dy }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
    >
      {[46, 74].map((cx) => (
        <motion.ellipse
          key={cx}
          cx={cx}
          cy={63}
          rx={6}
          ry={8 * squint}
          fill="#E0F2FE"
          animate={{ ry: [8 * squint, 8 * squint, 0.8, 8 * squint] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.92, 0.95, 1] }}
        />
      ))}
      <circle cx={47.5} cy={60} r={1.8} fill="white" />
      <circle cx={75.5} cy={60} r={1.8} fill="white" />
      {state === "error" && (
        <g stroke="#E0F2FE" strokeWidth="2.5" strokeLinecap="round">
          <path d="M39 51 L52 54" />
          <path d="M81 51 L68 54" />
        </g>
      )}
    </motion.g>
  );
}

function Mouth({ state }: { state: Props["state"] | "sleep" }) {
  if (state === "sleep") return <ellipse cx="60" cy="77" rx="2.5" ry="2" fill="#F0ABFC" opacity={0.8} />;
  if (state === "speaking") {
    return (
      <motion.ellipse
        cx="60"
        cy="76"
        rx="6"
        fill="#F0ABFC"
        animate={{ ry: [1.5, 4.5, 2, 5, 1.5], rx: [6, 5, 6.5, 5, 6] }}
        transition={{ duration: 0.55, repeat: Infinity }}
      />
    );
  }
  if (state === "thinking") return <circle cx="64" cy="77" r="2.6" fill="#F0ABFC" />;
  if (state === "error") return <path d="M52 79 Q 56 75 60 79 T 68 79" stroke="#F0ABFC" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
  if (state === "celebrating" || state === "hover") return <path d="M50 74 Q 60 86 70 74 Z" fill="#F0ABFC" />;
  if (state === "listening") return <ellipse cx="60" cy="76" rx="3.5" ry="3" fill="#F0ABFC" />;
  return <path d="M52 75 Q 60 81 68 75" stroke="#F0ABFC" strokeWidth="2.8" fill="none" strokeLinecap="round" />;
}
