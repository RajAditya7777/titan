"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Mic, MicOff, RotateCcw, Send, Square, Volume2, VolumeX, X, Wand2, Cpu, AlertTriangle } from "lucide-react";
import { PAGES } from "@/lib/companion/registry";
import { useCompanion } from "./CompanionProvider";

const SUGGESTIONS = [
  "I'm new here. Show me how Reflect works.",
  "Help me mint 100 USDC+",
  "What is APY?",
  "I want to create my own yieldcoin",
  "Compare the supported stablecoins",
  "Show me where I can redeem",
  "Why is my transaction failing?",
  "Explain this page",
];

export function CompanionPanel() {
  const c = useCompanion();
  return (
    <>
      <AnimatePresence>{c.panelOpen && !c.run && <FullPanel key="full" />}</AnimatePresence>
      <AnimatePresence>{c.run && <GuidanceBar key="bar" />}</AnimatePresence>
    </>
  );
}

function MicButton({ big = false }: { big?: boolean }) {
  const { voice, toggleMic } = useCompanion();
  const on = voice.listening || voice.handsFree;
  return (
    <button
      type="button"
      onClick={toggleMic}
      data-testid="mic-button"
      aria-pressed={on}
      aria-label={on ? "Turn microphone off" : "Talk to the companion"}
      className={`relative grid shrink-0 place-items-center rounded-full transition ${big ? "h-14 w-14" : "h-10 w-10"} ${
        on ? "bg-sky-400 text-[#0e1115]" : "bg-[var(--accent)] text-white hover:brightness-110"
      }`}
    >
      {on && <span className="absolute inset-0 animate-ping rounded-full bg-sky-400/40" />}
      {on ? <Mic size={big ? 24 : 18} /> : <MicOff size={big ? 22 : 16} className="opacity-90" />}
    </button>
  );
}

function FullPanel() {
  const c = useCompanion();
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [c.messages.length, c.voice.interim]);

  const submit = (text: string) => {
    if (!text.trim()) return;
    setDraft("");
    c.input(text);
  };

  return (
    <motion.section
      aria-label="Reflect Companion"
      data-testid="companion-panel"
      className="fixed bottom-[124px] right-6 z-[55] flex max-h-[min(640px,calc(100vh-150px))] w-[min(400px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[var(--c-surface)]/95 shadow-[0_30px_80px_-20px_rgba(0,88,178,0.55)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
    >
      <header className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Reflect Companion</p>
          <p className="text-xs text-[var(--c-muted)]">
            You&apos;re on <span className="text-white/80">{PAGES[c.page].title}</span>
          </p>
        </div>
        <span
          title={c.engine === "llm" ? "Answers come from the configured LLM" : "No LLM configured: deterministic intent rules"}
          className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--c-muted)]"
        >
          <Cpu size={11} /> {c.engine === "llm" ? "LLM" : c.engine === "rules" ? "Offline rules" : "…"}
        </span>
        <button type="button" onClick={() => c.setMuted(!c.voice.muted)} className="rounded-full p-1.5 text-[var(--c-muted)] hover:bg-white/5 hover:text-white" aria-label={c.voice.muted ? "Unmute voice" : "Mute voice"}>
          {c.voice.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <button type="button" onClick={() => c.setPanelOpen(false)} className="rounded-full p-1.5 text-[var(--c-muted)] hover:bg-white/5 hover:text-white" aria-label="Close">
          <X size={16} />
        </button>
      </header>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-5 py-4" data-testid="companion-messages">
        {c.messages.length === 0 && (
          <div className="space-y-4">
            <p className="text-[15px] leading-relaxed text-white/90">
              Hi! I&apos;m your guide to Reflect. Tap the mic and just tell me what you want to do. I&apos;ll show you exactly where to go.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-left text-xs text-white/80 transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {c.messages.map((m) =>
          m.role === "system" ? (
            <p key={m.id} className="text-center font-mono text-[10.5px] text-[var(--c-muted)]">
              ⚙ {m.text}
            </p>
          ) : (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                  m.role === "user" ? "rounded-br-md bg-[var(--accent)] text-white" : "rounded-bl-md bg-white/[0.06] text-white/90"
                }`}
              >
                {m.text}
                {m.meta?.tools && m.meta.tools.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.meta.tools.map((t, i) => (
                      <span key={i} className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${t.ok ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>
                        {t.tool.replace("reflect_", "")} · {t.provenance ?? (t.ok ? "ok" : "failed")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {c.petState === "thinking" && (
          <div className="flex gap-1 px-1" aria-label="Thinking">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-[var(--accent-2)]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
            ))}
          </div>
        )}
        {c.voice.interim && <p className="text-right text-[13px] italic text-sky-300/80">{c.voice.interim}…</p>}
      </div>

      {c.voice.micError && (
        <p className="mx-5 mb-2 flex items-start gap-2 rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {c.voice.micError}
        </p>
      )}

      <form
        className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
      >
        <MicButton />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={c.voice.sttSupported ? "Or type a message…" : "Type a message…"}
          aria-label="Message the companion"
          data-testid="companion-input"
          className="h-10 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-[var(--c-muted)] focus:border-[var(--accent)] focus:outline-none"
        />
        <button type="submit" disabled={!draft.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition enabled:hover:bg-white/20 disabled:opacity-40" aria-label="Send">
          <Send size={16} />
        </button>
      </form>
    </motion.section>
  );
}

/** Compact, bottom-centre bar while guiding, so the page stays visible. */
function GuidanceBar() {
  const c = useCompanion();
  const run = c.run!;
  const total = run.workflow.steps.length;
  const step = run.workflow.steps[run.index];
  const pct = run.status === "done" ? 100 : Math.round((run.index / total) * 100);

  return (
    <motion.div
      data-testid="guidance-bar"
      className="fixed bottom-5 left-1/2 z-[58] w-[min(520px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-white/10 bg-[var(--c-surface)]/95 p-3 shadow-[0_20px_60px_-15px_rgba(0,88,178,0.6)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
    >
      <div className="flex items-center gap-3">
        <MicButton />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-[11px] text-[var(--c-muted)]">
            <span className="flex items-center gap-1 truncate font-medium text-white/90">
              <Wand2 size={12} className="text-[var(--accent-2)]" /> {run.workflow.title}
            </span>
            <span data-testid="guidance-progress">
              {run.status === "done" ? "Complete" : `Step ${Math.min(run.index + 1, total)} of ${total}`}
            </span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]" animate={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 truncate text-[12px] text-white/70" data-testid="guidance-status">
            {run.status === "waiting_input" && "Waiting for you to fill in the field…"}
            {run.status === "waiting_action" && "Waiting for you to click the highlighted button…"}
            {run.status === "error" && <span className="text-rose-300">{run.error}</span>}
            {run.status === "running" && (c.voice.interim ? `“${c.voice.interim}”` : stepLabel(step?.type))}
            {run.status === "done" && "Over to you: your wallet has the final say."}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {run.status === "waiting_input" && run.offer && (
          <Ctl primary onClick={c.guide.confirmOffer} testId="confirm-fill">
            <Check size={13} /> Fill “{run.offer}” for me
          </Ctl>
        )}
        {run.status === "error" && (
          <Ctl primary onClick={c.guide.retry}>
            <RotateCcw size={13} /> Retry
          </Ctl>
        )}
        <Ctl onClick={c.guide.back} disabled={run.index === 0}>
          <ChevronLeft size={13} /> Back
        </Ctl>
        <Ctl onClick={c.guide.repeat}>
          <RotateCcw size={13} /> Repeat
        </Ctl>
        {run.status !== "done" && (
          <Ctl onClick={c.guide.completeStep} testId="guide-next">
            {run.status === "waiting_input" || run.status === "waiting_action" ? "Skip" : "Next"} <ChevronRight size={13} />
          </Ctl>
        )}
        <span className="flex-1" />
        <Ctl onClick={c.guide.cancel} danger testId="guide-stop">
          {run.status === "done" ? (
            <>
              <X size={13} /> Close
            </>
          ) : (
            <>
              <Square size={11} /> Stop
            </>
          )}
        </Ctl>
      </div>
      <form
        className="mt-2 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("cmd") as HTMLInputElement;
          if (input.value.trim()) c.input(input.value);
          input.value = "";
        }}
      >
        <input
          name="cmd"
          data-testid="guidance-input"
          aria-label="Type to the companion"
          placeholder="Say or type “next”, “repeat”, “go back”, “explain this”, “stop”…"
          className="h-8 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs text-white placeholder:text-[var(--c-muted)] focus:border-[var(--accent)] focus:outline-none"
        />
      </form>
    </motion.div>
  );
}

function stepLabel(type?: string) {
  switch (type) {
    case "navigate_to_page":
      return "Heading there…";
    case "call_tool":
      return "Asking Reflect for live data…";
    default:
      return "Guiding…";
  }
}

function Ctl(props: { children: React.ReactNode; onClick: () => void; primary?: boolean; danger?: boolean; disabled?: boolean; testId?: string }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      data-testid={props.testId}
      className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-35 ${
        props.primary
          ? "bg-[var(--accent)] text-white hover:brightness-110"
          : props.danger
            ? "text-rose-300 hover:bg-rose-400/10"
            : "bg-white/[0.06] text-white/85 hover:bg-white/[0.12]"
      }`}
    >
      {props.children}
    </button>
  );
}
