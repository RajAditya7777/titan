"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { homePosition, placePet, type Placement, type Rect } from "@/lib/companion/positioning";
import { Pet, REACTIONS, type Reaction } from "./Pet";
import { useMicLevel } from "@/lib/companion/mic-level";
import { useCompanion } from "./CompanionProvider";

const PET = { width: 88, height: 88 };

/**
 * Renders the pet, spotlight and speech bubble in a fixed overlay above the app.
 * The overlay is pointer-events:none except on the pet itself, so it never blocks the page;
 * the user can always click the highlighted control.
 */
export function PetLayer() {
  const { petState, target, bubble, panelOpen, setPanelOpen, run, voice } = useCompanion();
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [hover, setHover] = useState(false);
  const raf = useRef<number | null>(null);
  const micLevel = useMicLevel();
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const lastReaction = useRef<Reaction | null>(null);
  const [gaze, setGaze] = useState<number | null>(null);
  const [sleeping, setSleeping] = useState(false);
  const lastActivity = useRef(Date.now());

  // Track the target's rect through scroll, resize, layout shifts and re-mounts.
  useEffect(() => {
    const measure = () => {
      raf.current = null;
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      if (!target) return setTargetRect(null);
      const node = document.querySelector<HTMLElement>(`[data-companion="${target}"]`);
      if (!node) return setTargetRect(null); // element vanished (e.g. modal closed) → pet goes home
      const r = node.getBoundingClientRect();
      setTargetRect((prev) =>
        prev && Math.abs(prev.x - r.x) < 0.5 && Math.abs(prev.y - r.y) < 0.5 && prev.width === r.width && prev.height === r.height
          ? prev
          : { x: r.x, y: r.y, width: r.width, height: r.height },
      );
    };
    const schedule = () => {
      if (raf.current == null) raf.current = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    const poll = setInterval(schedule, 400); // catches DOM swaps the observers miss
    return () => {
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      clearInterval(poll);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [target]);

  // ── Personality ──────────────────────────────────────────────
  // Any activity (mouse, keys, companion working) resets the sleep timer and wakes the pet.
  useEffect(() => {
    const wake = () => {
      lastActivity.current = Date.now();
      setSleeping(false);
    };
    window.addEventListener("keydown", wake);
    const t = setInterval(() => {
      if (Date.now() - lastActivity.current > 25_000) setSleeping(true);
    }, 2_000);
    return () => {
      window.removeEventListener("keydown", wake);
      clearInterval(t);
    };
  }, []);
  useEffect(() => {
    if (petState !== "idle" || target) {
      lastActivity.current = Date.now();
      setSleeping(false);
    }
  }, [petState, target]);

  // Eyes follow the cursor while idle (rAF-throttled; one state update per frame at most).
  const petCenter = useRef({ x: 0, y: 0 });
  useEffect(() => {
    let frame: number | null = null;
    let last: MouseEvent | null = null;
    const onMove = (e: MouseEvent) => {
      last = e;
      lastActivity.current = Date.now();
      if (frame != null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        if (!last) return;
        const dx = last.clientX - petCenter.current.x;
        const dy = last.clientY - petCenter.current.y;
        // Only track when the cursor is reasonably near, so it doesn't look possessed.
        setGaze(Math.hypot(dx, dy) < 520 ? (Math.atan2(dy, dx) * 180) / Math.PI : null);
        setSleeping(false);
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, []);

  /** A different reaction every hover, never the same twice in a row. */
  const react = () => {
    if (petState !== "idle") return;
    const choices = REACTIONS.filter((r) => r !== lastReaction.current);
    const next = choices[Math.floor(Math.random() * choices.length)]!;
    lastReaction.current = next;
    setReaction(next);
    setSleeping(false);
    setTimeout(() => setReaction((r) => (r === next ? null : r)), 1_500);
  };

  const avoid: Rect[] = [];
  if (panelOpen && !run) avoid.push({ x: viewport.width - 424, y: viewport.height - 640, width: 424, height: 640 });
  if (run) avoid.push({ x: viewport.width / 2 - 260, y: viewport.height - 132, width: 520, height: 132 });

  const placement: Placement | null = targetRect ? placePet({ target: targetRect, viewport, pet: PET, avoid }) : null;
  const pos = placement ?? homePosition(viewport, PET);
  const shownState = hover && petState === "idle" && !placement && !reaction ? "hover" : petState;
  petCenter.current = { x: pos.x + PET.width / 2, y: pos.y + PET.height / 2 };

  // Bubble placement: when the pet is above/below its target, stacking the bubble vertically would
  // cover the content it is explaining, so it goes beside the pet instead. Otherwise above the pet
  // (below if there's no room). Always nudged inside the viewport.
  const bubbleWidth = Math.min(300, viewport.width - 32);
  const beside = placement && (placement.side === "above" || placement.side === "below");
  const roomRight = viewport.width - (pos.x + PET.width);
  const besideX = roomRight >= bubbleWidth + 24 ? pos.x + PET.width + 12 : pos.x - bubbleWidth - 12;
  const bubbleAbove = !beside && pos.y > 170;
  const bubbleX = beside
    ? Math.max(16, Math.min(besideX, viewport.width - bubbleWidth - 16))
    : Math.max(16, Math.min(pos.x + PET.width / 2 - bubbleWidth / 2, viewport.width - bubbleWidth - 16));
  const bubbleTop = beside ? pos.y + PET.height / 2 : bubbleAbove ? pos.y - 12 : pos.y + PET.height + 12;
  const bubbleShift = beside ? "-50%" : bubbleAbove ? "-100%" : "0%";

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-live="polite">
      {/* Spotlight */}
      <AnimatePresence>
        {targetRect && (
          <motion.div
            key="spot"
            className="absolute rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              left: targetRect.x - 8,
              top: targetRect.y - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            // A light dim: on the light UI a heavy overlay reads as "muddy", not "focused".
            style={{ boxShadow: "0 0 0 9999px rgba(17, 21, 25, 0.32)" }}
          >
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-[var(--accent-2)]"
              animate={{ opacity: [0.9, 0.35, 0.9], scale: [1, 1.025, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{ boxShadow: "0 0 0 4px rgba(59, 139, 234, 0.18), 0 0 28px 4px rgba(59, 139, 234, 0.35)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech bubble (also the live caption for TTS) */}
      <AnimatePresence>
        {/* At home with the panel open, the panel already shows the words; a bubble would cover them. */}
        {bubble && (placement || (petState !== "idle" && !panelOpen)) && (
          <motion.div
            key="bubble"
            role="status"
            className="absolute rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[13.5px] leading-relaxed text-[var(--text)] shadow-[0_18px_44px_-14px_rgba(17,21,25,0.3)]"
            style={{ width: bubbleWidth }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{
              opacity: 1,
              scale: 1,
              left: bubbleX,
              top: bubbleTop,
              y: bubbleShift,
            }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <BubbleText text={bubble} />
            <BubbleTail
              side={beside ? (bubbleX > pos.x ? "left" : "right") : bubbleAbove ? "bottom" : "top"}
              offset={beside ? undefined : Math.max(18, Math.min(bubbleWidth - 18, pos.x + PET.width / 2 - bubbleX))}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover tooltip at home */}
      <AnimatePresence>
        {hover && !placement && !panelOpen && petState === "idle" && !sleeping && (
          <motion.div
            className="absolute rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#111519] shadow-lg"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ left: pos.x - 150, top: pos.y + 30 }}
          >
            Need help with Reflect?
          </motion.div>
        )}
      </AnimatePresence>

      {/* The pet */}
      <motion.button
        type="button"
        data-testid="companion-pet"
        aria-label={panelOpen ? "Close Reflect guide" : "Open Reflect guide"}
        className="pointer-events-auto absolute cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
        style={{ width: PET.width, height: PET.height }}
        initial={false}
        animate={{ left: pos.x, top: pos.y }}
        transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.9 }}
        onMouseEnter={() => {
          setHover(true);
          react();
        }}
        onMouseLeave={() => setHover(false)}
        onClick={() => setPanelOpen(!panelOpen)}
      >
        <Pet
          state={shownState}
          lookAngle={placement?.angle ?? null}
          gazeAngle={petState === "idle" ? gaze : null}
          reaction={reaction}
          sleeping={sleeping}
          voiceLevel={voice.listening ? micLevel : 0}
          size={PET.width}
        />
        {/* attention dot when idle & closed: there is help available */}
        {!panelOpen && petState === "idle" && !voice.listening && (
          <span className="absolute right-2 top-3 h-3 w-3 animate-ping rounded-full bg-[var(--accent-2)] opacity-60" />
        )}
        {voice.listening && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[var(--ink)] px-2 py-0.5 text-[10px] font-bold text-white">
            LISTENING
          </span>
        )}
      </motion.button>
    </div>
  );
}

/**
 * Words fade in at roughly speaking pace, so the caption moves with the voice. The full text is in
 * the DOM from the first frame (screen readers and tests see the whole sentence); only opacity
 * animates. Long lines are compressed so the reveal never lags far behind the audio.
 */
function BubbleText({ text }: { text: string }) {
  const words = text.split(/(\s+)/);
  const wordCount = words.filter((w) => w.trim()).length;
  const step = Math.min(0.2, 3 / Math.max(1, wordCount));
  let i = 0;
  return (
    <span key={text}>
      {words.map((w, k) =>
        w.trim() ? (
          <motion.span key={k} initial={{ opacity: 0.12 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: i++ * step }}>
            {w}
          </motion.span>
        ) : (
          w
        ),
      )}
    </span>
  );
}

/** Small tail pointing from the bubble toward the pet. */
function BubbleTail({ side, offset }: { side: "top" | "bottom" | "left" | "right"; offset?: number }) {
  const base = "absolute h-3 w-3 rotate-45 bg-[var(--surface)]";
  // Colour lives inside each shorthand: mixing `borderRight` with a separate `borderColor` makes React
  // warn (and mis-style) when the tail switches sides between renders.
  const EDGE = "1px solid var(--line)";
  const pos =
    side === "bottom"
      ? { bottom: -6, left: (offset ?? 24) - 6, borderRight: EDGE, borderBottom: EDGE }
      : side === "top"
        ? { top: -6, left: (offset ?? 24) - 6, borderLeft: EDGE, borderTop: EDGE }
        : side === "left"
          ? { left: -6, top: "calc(50% - 6px)", borderLeft: EDGE, borderBottom: EDGE }
          : { right: -6, top: "calc(50% - 6px)", borderRight: EDGE, borderTop: EDGE };
  return <span aria-hidden className={base} style={pos} />;
}
