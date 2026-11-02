"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { homePosition, placePet, type Placement, type Rect } from "@/lib/companion/positioning";
import { Pet, REACTIONS, type Reaction } from "./Pet";
import { useMicLevel } from "@/lib/companion/mic-level";
import { useCompanion } from "./CompanionProvider";
import { themeFor } from "./Panel";
import { AstroCat } from "./AstroCat";
import { PET_REACT_EVENT, respondTo, type PageEvent } from "@/lib/companion/page-reactions";

const PET = { width: 88, height: 88 };
/** Nap after this long with no mouse, keys or guide activity. */
const SLEEP_AFTER_MS = 20_000;
const WAKE_LINES = ["Huh? I'm up, I'm up!", "Oh! You're back 😺", "Was I asleep? Never.", "Yawn… what did I miss?"];
/** Walking pace across the screen: brisk for a small pet, slow enough to see the steps. */
const WALK_PX_PER_SEC = 340;
/** Seconds of crouch before a walk starts; matches Pet's ANTICIPATE. */
const ANTICIPATE_S = 0.14;

/**
 * Renders the pet, spotlight and speech bubble in a fixed overlay above the app.
 * The overlay is pointer-events:none except on the pet itself, so it never blocks the page;
 * the user can always click the highlighted control.
 */
export function PetLayer() {
  const pathname = usePathname();
  if (pathname === "/titan/demo") return null;
  const { page, petState, target, bubble, panelOpen, setPanelOpen, run, voice, guide: guideApi } = useCompanion();
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
  const reduceMotion = useReducedMotion();
  /** A control the pet walks over to for a moment after the user touches it (no spotlight). */
  const [visit, setVisit] = useState<Rect | null>(null);
  const [quip, setQuip] = useState<string | null>(null);
  /** When roaming, the x it wandered to along the bottom; null = home. */
  const [roamX, setRoamX] = useState<number | null>(null);
  const [travelling, setTravelling] = useState(false);
  const [heading, setHeading] = useState<1 | -1>(1);
  // Latest values for listeners and timers registered once.
  const live = useRef({
    busy: false,
    panelOpen,
    hover: false,
    sleeping: false,
  });
  live.current = {
    busy: petState !== "idle" || !!target || !!run,
    panelOpen,
    hover,
    sleeping,
  };

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
  /** Waking from a nap is a moment: a startled hop and a line, not a silent switch. */
  const wakeUp = () => {
    if (!live.current.sleeping) return;
    setSleeping(false);
    setReaction("hop");
    setQuip(WAKE_LINES[Math.floor(Math.random() * WAKE_LINES.length)]!);
    setTimeout(() => {
      setReaction((r) => (r === "hop" ? null : r));
      setQuip(null);
    }, 2_200);
  };

  // Any activity (mouse, keys, companion working) resets the sleep timer and wakes the pet.
  useEffect(() => {
    const wake = () => {
      lastActivity.current = Date.now();
      wakeUp();
    };
    window.addEventListener("keydown", wake);
    const t = setInterval(() => {
      if (Date.now() - lastActivity.current > SLEEP_AFTER_MS) setSleeping(true);
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
        wakeUp();
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, []);

  // ── Reacting to the page ─────────────────────────────────────
  // One capture listener per event type sees every tagged control, so product UIs need no wiring;
  // a guide run or a reply in progress always wins over these small reactions.
  useEffect(() => {
    let settle: ReturnType<typeof setTimeout> | undefined;
    let typing: ReturnType<typeof setTimeout> | undefined;
    const apply = (el: HTMLElement, e: PageEvent) => {
      if (live.current.busy) return;
      const r = respondTo(e);
      if (!r) return;
      lastActivity.current = Date.now();
      setSleeping(false);
      setRoamX(null);
      setReaction(r.reaction);
      setQuip(r.quip ?? null);
      if (r.visit) {
        const b = el.getBoundingClientRect();
        setVisit({ x: b.x, y: b.y, width: b.width, height: b.height });
      }
      clearTimeout(settle);
      settle = setTimeout(() => {
        setReaction(null);
        setQuip(null);
        setVisit(null);
      }, 3_200);
    };
    const on = (kind: PageEvent["kind"]) => (ev: Event) => {
      const el = (ev.target as Element | null)?.closest?.<HTMLElement>("[data-companion]");
      const id = el?.dataset.companion;
      if (!el || !(id?.startsWith("titan-") || id?.startsWith("umb-") || id?.startsWith("jup-"))) return;
      const input = el instanceof HTMLInputElement || el instanceof HTMLSelectElement ? el : el.querySelector("input");
      const e: PageEvent = { id, kind, value: input?.value };
      // Typing is debounced so the pet reacts to the number, not to every keystroke.
      if (kind === "input") {
        clearTimeout(typing);
        typing = setTimeout(() => apply(el, e), 450);
      } else apply(el, e);
    };
    const handlers = {
      input: on("input"),
      click: on("click"),
      change: on("change"),
    };
    // Outcomes from the page (success, short balance): a bigger moment, held a little longer.
    const onOutcome = (ev: Event) => {
      const { reaction, quip } = (ev as CustomEvent<{ reaction: Reaction; quip?: string }>).detail;
      if (live.current.busy) return;
      lastActivity.current = Date.now();
      setSleeping(false);
      setRoamX(null);
      setReaction(reaction);
      setQuip(quip ?? null);
      clearTimeout(settle);
      settle = setTimeout(() => {
        setReaction(null);
        setQuip(null);
      }, 4_200);
    };
    window.addEventListener(PET_REACT_EVENT, onOutcome);
    for (const [type, fn] of Object.entries(handlers)) document.addEventListener(type, fn, true);
    return () => {
      window.removeEventListener(PET_REACT_EVENT, onOutcome);
      for (const [type, fn] of Object.entries(handlers)) document.removeEventListener(type, fn, true);
      clearTimeout(settle);
      clearTimeout(typing);
    };
  }, []);

  // A guide run takes over: drop any page reaction in progress.
  useEffect(() => {
    if (target || run || petState !== "idle") {
      setVisit(null);
      setQuip(null);
      setRoamX(null);
    }
  }, [target, run, petState]);

  // Roaming: when nobody needs it, it sometimes trots along the bottom and back home.
  useEffect(() => {
    if (reduceMotion) return;
    const t = setInterval(() => {
      const l = live.current;
      if (l.busy || l.panelOpen || l.hover || l.sleeping) return setRoamX(null);
      const w = window.innerWidth;
      setRoamX((x) => (x == null && Math.random() < 0.7 ? 16 + Math.random() * Math.max(0, w - PET.width - 32) : null));
    }, 9_000);
    return () => clearInterval(t);
  }, [reduceMotion]);
  useEffect(() => {
    if (panelOpen) setRoamX(null);
  }, [panelOpen]);

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
  if (panelOpen && !run)
    avoid.push({
      x: viewport.width - 424,
      y: viewport.height - 640,
      width: 424,
      height: 640,
    });
  if (run)
    avoid.push({
      x: viewport.width / 2 - 260,
      y: viewport.height - 132,
      width: 520,
      height: 132,
    });

  const guide: Placement | null = targetRect ? placePet({ target: targetRect, viewport, pet: PET, avoid }) : null;
  // A visit stands beside the control's column, never above/below it, so it can't cover the numbers.
  const visitAvoid: Rect[] = visit ? [...avoid, { x: visit.x - 8, y: 0, width: visit.width + 16, height: viewport.height }] : avoid;
  const placement = guide ?? (visit ? placePet({ target: visit, viewport, pet: PET, avoid: visitAvoid }) : null);
  const home = homePosition(viewport, PET);
  const pos = placement ?? (roamX != null ? { x: roamX, y: home.y } : home);

  // Walking like a character, not a sliding picture: it covers ground at a steady pace (so the trip
  // takes as long as the distance needs) and its legs, arms and stride bounce run for exactly that
  // long. A spring glide (fast start, long slide) with legs on a fixed timer read as an image moving.
  const prevPos = useRef(pos);
  const travelTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prevY = useRef(0);
  const [hop, setHop] = useState<{ id: number; h: number; secs: number } | null>(null);
  const dist = Math.hypot(pos.x - prevPos.current.x, pos.y - prevPos.current.y);
  const walkSecs = Math.min(2.4, Math.max(0.5, dist / WALK_PX_PER_SEC));
  const walkTransition = useRef<object>({ type: "tween", duration: 0.3, ease: "easeOut" });
  // The delay is the anticipation crouch (Pet's ANTICIPATE): it gathers itself, then sets off.
  if (dist >= 24) walkTransition.current = { type: "tween", duration: walkSecs, ease: [0.45, 0, 0.55, 1], delay: ANTICIPATE_S };
  else if (dist > 0) walkTransition.current = { type: "tween", duration: 0.25, ease: "easeOut" }; // small nudges (scroll tracking)
  useEffect(() => {
    const dx = pos.x - prevPos.current.x;
    const d = Math.hypot(dx, pos.y - prevPos.current.y);
    prevY.current = pos.y - prevPos.current.y;
    prevPos.current = { x: pos.x, y: pos.y };
    if (d < 24) return;
    if (Math.abs(dx) > 4) setHeading(dx < 0 ? -1 : 1);
    const secs = Math.min(2.4, Math.max(0.5, d / WALK_PX_PER_SEC));
    // A long climb or drop is a jump with an arc, not a glide straight up the screen.
    const dy = prevY.current;
    setHop(Math.abs(dy) > 140 ? { id: Date.now(), h: Math.min(72, 26 + Math.abs(dy) * 0.12), secs } : null);
    setTravelling(true);
    clearTimeout(travelTimer.current);
    travelTimer.current = setTimeout(() => setTravelling(false), (secs + ANTICIPATE_S) * 1000);
  }, [pos.x, pos.y]);

  const shownState =
    // Walking always wins while it travels (legs, sway, head bob); a click's reaction plays on arrival.
    travelling && petState === "idle"
      ? "moving"
      : hover && petState === "idle" && !placement && !reaction
        ? "hover"
        : petState;
  petCenter.current = { x: pos.x + PET.width / 2, y: pos.y + PET.height / 2 };

  // Bubble placement: when the pet is above/below its target, stacking the bubble vertically would
  // cover the content it is explaining, so it goes beside the pet instead. Otherwise above the pet
  // (below if there's no room). Always nudged inside the viewport.
  const bubbleWidth = Math.min(300, viewport.width - 32);
  const beside = guide && (guide.side === "above" || guide.side === "below");
  const roomRight = viewport.width - (pos.x + PET.width);
  const besideX = roomRight >= bubbleWidth + 24 ? pos.x + PET.width + 12 : pos.x - bubbleWidth - 12;
  const bubbleAbove = !beside && pos.y > 170;
  const bubbleX = beside
    ? Math.max(16, Math.min(besideX, viewport.width - bubbleWidth - 16))
    : Math.max(16, Math.min(pos.x + PET.width / 2 - bubbleWidth / 2, viewport.width - bubbleWidth - 16));
  const bubbleTop = beside ? pos.y + PET.height / 2 : bubbleAbove ? pos.y - 12 : pos.y + PET.height + 12;
  const bubbleShift = beside ? "-50%" : bubbleAbove ? "-100%" : "0%";

  return (
    <div className={`${themeFor(page)} pointer-events-none fixed inset-0 z-[60]`} aria-live="polite" data-capture-skip>
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
              style={{
                boxShadow: "0 0 0 4px rgba(242, 211, 99, 0.18), 0 0 28px 4px rgba(242, 211, 99, 0.35)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech bubble (also the live caption for TTS) */}
      <AnimatePresence>
        {/* At home with the panel open, the panel already shows the words; a bubble would cover them. */}
        {bubble && (guide || (petState !== "idle" && !panelOpen)) && (
          <motion.div
            key="bubble"
            role="status"
            className="absolute rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[13.5px] leading-relaxed text-[var(--text)] shadow-[0_18px_44px_-14px_rgba(0,0,0,0.6)]"
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
            <BubbleControls
              canBack={!!run && run.index > 0 && run.status !== "done"}
              onBack={guideApi.back}
              // In a walkthrough Next moves on; on a one-off explanation it means "got it".
              onNext={run && run.status !== "done" ? guideApi.completeStep : guideApi.cancel}
              onClose={guideApi.cancel}
            />
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
            className="absolute rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text)] shadow-lg"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ left: pos.x - 150, top: pos.y + 30 }}
          >
            Need help with {productName(page)}?
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quip: a few words about what the user just did */}
      <AnimatePresence>
        {quip && !bubble && (
          <motion.div
            key={quip}
            className="absolute whitespace-nowrap rounded-full border-2 border-[var(--pet-outline)] bg-[var(--pet-mid)] px-3 py-1 text-xs font-bold text-[var(--pet-outline)] shadow-lg"
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              left: Math.max(8, Math.min(pos.x + PET.width / 2, viewport.width - 8)),
              top: pos.y - 6,
            }}
            exit={{ opacity: 0, y: -6, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            style={{ x: "-50%", translateY: "-100%" }}
          >
            {quip}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The pet */}
      <motion.button
        type="button"
        data-testid="companion-pet"
        aria-label={panelOpen ? "Close Milo" : "Talk to Milo"}
        className="pointer-events-auto absolute cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-2)] transition-transform hover:scale-105 active:scale-95"
        style={{ width: PET.width, height: PET.height }}
        initial={false}
        animate={{ left: pos.x, top: pos.y }}
        transition={walkTransition.current}
        onMouseEnter={() => {
          setHover(true);
          react();
        }}
        onMouseLeave={() => setHover(false)}
        onClick={() => setPanelOpen(!panelOpen)}
      >
        <motion.div
          key={hop?.id ?? "ground"}
          animate={hop && !reduceMotion ? { y: [0, -hop.h, 0] } : { y: 0 }}
          transition={hop ? { duration: hop.secs, delay: ANTICIPATE_S, times: [0, 0.5, 1], ease: ["easeOut", "easeIn"] } : { duration: 0 }}
        >
          {page.startsWith("jup_") ? (
            <AstroCat
              state={shownState}
              lookAngle={placement?.angle ?? null}
              gazeAngle={travelling ? (heading > 0 ? 0 : 180) : petState === "idle" ? gaze : null}
              heading={heading}
              reaction={reaction}
              sleeping={sleeping}
              voiceLevel={voice.listening ? micLevel : 0}
              size={PET.width}
            />
          ) : (
          <Pet
            state={shownState}
            lookAngle={placement?.angle ?? null}
            gazeAngle={travelling ? (heading > 0 ? 0 : 180) : petState === "idle" ? gaze : null}
            heading={heading}
            reaction={reaction}
            sleeping={sleeping}
            voiceLevel={voice.listening ? micLevel : 0}
            size={PET.width}
          />
          )}
        </motion.div>
        {/* attention dot when idle & closed: there is help available */}
        {!panelOpen && petState === "idle" && !voice.listening && (
          <span className="absolute right-2 top-3 h-3 w-3 animate-ping rounded-full bg-[var(--accent-2)] opacity-60" />
        )}
        {voice.listening && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--on-accent)]">
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
      ? {
          bottom: -6,
          left: (offset ?? 24) - 6,
          borderRight: EDGE,
          borderBottom: EDGE,
        }
      : side === "top"
        ? {
            top: -6,
            left: (offset ?? 24) - 6,
            borderLeft: EDGE,
            borderTop: EDGE,
          }
        : side === "left"
          ? {
              left: -6,
              top: "calc(50% - 6px)",
              borderLeft: EDGE,
              borderBottom: EDGE,
            }
          : {
              right: -6,
              top: "calc(50% - 6px)",
              borderRight: EDGE,
              borderTop: EDGE,
            };
  return <span aria-hidden className={base} style={pos} />;
}

/** Back, Next and close on every bubble, so the user can always steer or dismiss the guide. */
function BubbleControls({ canBack, onBack, onNext, onClose }: { canBack: boolean; onBack(): void; onNext(): void; onClose(): void }) {
  const btn = "pointer-events-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium transition";
  return (
    <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--line)] pt-2.5">
      <button type="button" onClick={onBack} disabled={!canBack} className={`${btn} border border-[var(--line-strong)] text-[var(--text)] hover:bg-[var(--surface-2)] disabled:opacity-35`}>
        <ChevronLeft size={13} /> Back
      </button>
      <button type="button" onClick={onNext} className={`${btn} bg-[var(--accent)] text-[var(--on-accent)] hover:brightness-110`}>
        Next <ChevronRight size={13} />
      </button>
      <button type="button" onClick={onClose} aria-label="Close guide" className={`${btn} ml-auto px-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]`}>
        <X size={15} />
      </button>
    </div>
  );
}

/** The product the pet is helping with, for its hover line. */
function productName(page: string): string {
  if (page.startsWith("jup_")) return "Jupiter";
  if (page.startsWith("umbra")) return "Umbra";
  if (page.startsWith("titan_")) return "Titan";
  return "this page";
}
