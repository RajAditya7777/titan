"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auditWorkflow, renderTemplate, type CompanionReply, type Step, type Workflow } from "@/lib/companion/actions";
import { parseControlCommand, type ControlCommand } from "@/lib/companion/commands";
import { ELEMENTS, PAGES, getElement, pageForPath, validate, type ElementId, type PageId } from "@/lib/companion/registry";
import { BrowserSpeechToText, BrowserTextToSpeech, isLikelyEcho, type SpeechToText, type TextToSpeech } from "@/lib/companion/voice";
import { createVoiceEngines } from "@/lib/companion/voice-server";
import { setMicLevel } from "@/lib/companion/mic-level";

// ───────────────────────────── Types ─────────────────────────────

export type PetState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "moving"
  | "pointing"
  | "waiting"
  | "celebrating"
  | "error";

export interface ChatEntry {
  id: number;
  role: "user" | "assistant" | "system";
  text: string;
  meta?: { engine?: string; tools?: CompanionReply["toolCalls"] };
}

type RunStatus = "running" | "waiting_input" | "waiting_action" | "error" | "done";

export interface RunState {
  workflow: Workflow;
  index: number;
  status: RunStatus;
  /** For request_input: a value the companion offers to fill, pending the user's yes. */
  offer?: string;
  error?: string;
}

interface FieldHandle {
  get(): string;
  set(value: string): void;
}

interface CompanionApi {
  page: PageId;
  petState: PetState;
  target: ElementId | null;
  bubble: string | null;
  messages: ChatEntry[];
  run: RunState | null;
  panelOpen: boolean;
  setPanelOpen(open: boolean): void;
  engine: "llm" | "rules" | "unknown";
  voice: {
    sttSupported: boolean;
    listening: boolean;
    interim: string;
    handsFree: boolean;
    muted: boolean;
    micError: string | null;
    /** Which engines are active: server (Whisper / neural TTS) or the browser's Web Speech. */
    engines: { stt: "server" | "browser"; tts: "server" | "browser" };
  };
  toggleMic(): void;
  setMuted(m: boolean): void;
  send(text: string): Promise<void>;
  /** Typed or spoken input: control commands are handled locally first, then the LLM. */
  input(text: string): void;
  /** Imperative guide API (also used by voice & panel buttons). */
  guide: {
    navigate(page: PageId): Promise<void>;
    highlight(target: ElementId, say?: string): Promise<void>;
    explain(target?: ElementId): Promise<void>;
    fill(target: ElementId, value: string): void;
    confirmOffer(): void;
    completeStep(): void;
    back(): void;
    repeat(): void;
    restart(): void;
    cancel(): void;
    retry(): void;
  };
  registerField(id: ElementId, handle: FieldHandle): () => void;
  notifyFieldChange(id: ElementId): void;
}

const Ctx = createContext<CompanionApi | null>(null);
export const useCompanion = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCompanion outside CompanionProvider");
  return v;
};

// ───────────────────────────── Helpers ─────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const el = (id: string) => document.querySelector<HTMLElement>(`[data-companion="${id}"]`);

/** Wait for a registered element to mount (pages stream in). Resolves null after the timeout. */
function waitForElement(id: string, timeoutMs = 4_000): Promise<HTMLElement | null> {
  const found = el(id);
  if (found) return Promise.resolve(found);
  return new Promise((resolve) => {
    const obs = new MutationObserver(() => {
      const hit = el(id);
      if (hit) {
        obs.disconnect();
        clearTimeout(timer);
        resolve(hit);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-companion"] });
    const timer = setTimeout(() => {
      obs.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

// ───────────────────────────── Provider ─────────────────────────────

export function CompanionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const page = pageForPath(pathname);

  const [petState, setPetState] = useState<PetState>("idle");
  const [target, setTarget] = useState<ElementId | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [run, setRun] = useState<RunState | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [engine, setEngine] = useState<"llm" | "rules" | "unknown">("unknown");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [handsFree, setHandsFree] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [sttSupported, setSttSupported] = useState(false);
  const [engines, setEngines] = useState<{ stt: "server" | "browser"; tts: "server" | "browser" }>({ stt: "browser", tts: "browser" });

  // Refs mirror state for use inside async step code without stale closures.
  const runRef = useRef<RunState | null>(null);
  const pageRef = useRef(page);
  const tokenRef = useRef(0); // bumps on cancel/back/restart → in-flight steps abort
  const lastSpokenRef = useRef<string | null>(null);
  const speakingTextRef = useRef<string | null>(null);
  const fields = useRef(new Map<ElementId, FieldHandle>());
  const fieldTimers = useRef(new Map<ElementId, ReturnType<typeof setTimeout>>());
  const lastToolResult = useRef<unknown>(null);
  const tts = useRef<(TextToSpeech & { muted: boolean }) | null>(null);
  const stt = useRef<(SpeechToText & { onLevel?: (level: number) => void }) | null>(null);
  const msgId = useRef(0);
  const handleUtteranceRef = useRef<(t: string) => void>(() => {});

  pageRef.current = page;
  const commitRun = (r: RunState | null) => {
    runRef.current = r;
    setRun(r);
  };

  const addMessage = useCallback((role: ChatEntry["role"], text: string, meta?: ChatEntry["meta"]) => {
    setMessages((m) => [...m.slice(-40), { id: ++msgId.current, role, text, meta }]);
  }, []);

  // ── Speech out ──
  const speak = useCallback(async (text: string, opts: { log?: boolean; state?: PetState } = {}) => {
    lastSpokenRef.current = text;
    speakingTextRef.current = text;
    setBubble(text);
    if (opts.log !== false) addMessage("assistant", text);
    setPetState("speaking");
    await tts.current?.speak(text);
    speakingTextRef.current = null;
    setPetState((s) => (s === "speaking" ? (opts.state ?? "idle") : s));
  }, [addMessage]);

  const stopSpeaking = useCallback(() => {
    tts.current?.cancel();
    speakingTextRef.current = null;
  }, []);

  // ── Guide primitives ──
  const navigate = useCallback(
    async (to: PageId) => {
      if (pageRef.current !== to) {
        setPetState("moving");
        router.push(PAGES[to].path);
        const start = Date.now();
        while (pageRef.current !== to && Date.now() - start < 5_000) await sleep(50);
        await sleep(250); // let the page paint before measuring elements
      }
    },
    [router],
  );

  /** Move the pet to an element. Navigates to the element's page if needed; recovers if it's missing. */
  const focus = useCallback(
    async (id: ElementId): Promise<boolean> => {
      const spec = ELEMENTS[id];
      if (spec.page !== "global" && spec.page !== pageRef.current) await navigate(spec.page as PageId);
      const node = await waitForElement(id);
      if (!node) return false;
      // Keep the target inside the area nothing covers: below the sticky header, and above the
      // guidance bar while a walkthrough runs (it's ~160px tall). scrollIntoView("center") ignores
      // overlays, so centre it in the free band ourselves.
      const r = node.getBoundingClientRect();
      const topReserve = 120;
      const bottomReserve = runRef.current ? 200 : 80;
      if (r.top < topReserve || r.bottom > window.innerHeight - bottomReserve) {
        const bandCentre = topReserve + (window.innerHeight - topReserve - bottomReserve) / 2;
        window.scrollBy({ top: r.top + Math.min(r.height, 240) / 2 - bandCentre, behavior: "smooth" });
        await sleep(450);
      }
      setPetState("moving");
      setTarget(id);
      await sleep(550); // matches the spring settle time in PetLayer
      setPetState("pointing");
      return true;
    },
    [navigate],
  );

  const goHome = useCallback(() => {
    setTarget(null);
    setBubble(null);
    setPetState("idle");
  }, []);

  // ── Workflow runner ──
  const fieldValues = () => Object.fromEntries([...fields.current].map(([k, h]) => [k, h.get()]));

  const finish = useCallback(
    async (celebrateText?: string) => {
      const r = runRef.current;
      if (!r) return;
      commitRun({ ...r, status: "done" });
      if (celebrateText) {
        setTarget(null);
        setPetState("celebrating");
        await speak(celebrateText, { state: "celebrating" });
        await sleep(900);
        commitRun(null);
        goHome();
      }
    },
    [goHome, speak],
  );

  const runFrom = useCallback(
    async (index: number) => {
      const token = ++tokenRef.current;
      const alive = () => token === tokenRef.current;
      const current = runRef.current;
      if (!current) return;

      for (let i = index; i < current.workflow.steps.length; i++) {
        if (!alive()) return;
        const step = current.workflow.steps[i]!;
        commitRun({ ...current, index: i, status: "running", offer: undefined, error: undefined });
        const outcome = await executeStep(step, i, alive);
        if (!alive()) return;
        if (outcome === "pause") return; // resumes via completeStep()
        if (outcome === "error") return;
        if (outcome === "end") return;
      }
      if (alive() && runRef.current?.status === "running") {
        await finish("All done! Ask me anything else whenever you like.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finish],
  );

  /** Executes one step. Returns how the runner should proceed. */
  const executeStep = async (step: Step, i: number, alive: () => boolean): Promise<"next" | "pause" | "error" | "end"> => {
    const fail = async (message: string) => {
      setPetState("error");
      const r = runRef.current;
      if (r) commitRun({ ...r, index: i, status: "error", error: message });
      await speak(message, { state: "error" });
      return "error" as const;
    };

    switch (step.type) {
      case "navigate_to_page": {
        setTarget(null);
        await navigate(step.page as PageId);
        if (step.say && alive()) await speak(step.say);
        return "next";
      }
      case "point": {
        if (!(await focus(step.target))) return fail(`I can't find "${ELEMENTS[step.target].label}" on this page. Say "next" to skip it, or "stop".`);
        if (!alive()) return "next";
        await speak(step.say, { state: "pointing" });
        await sleep(450);
        return "next";
      }
      case "request_input": {
        if (!(await focus(step.target))) return fail(`I can't find the ${ELEMENTS[step.target].label} field. Say "next" to skip it.`);
        const r = runRef.current!;
        commitRun({ ...r, index: i, status: "waiting_input", offer: step.suggestedValue });
        await speak(step.say, { state: "waiting" });
        if (!alive()) return "pause";
        // If the field is already valid (e.g. the user typed ahead), move on.
        const spec = getElement(step.target)!;
        const value = fields.current.get(step.target)?.get() ?? "";
        if (spec.validation && !validate(spec.validation, value)) return "next";
        // Typed ahead but invalid: say so now instead of waiting for another keystroke.
        const problem = value && spec.validation ? validate(spec.validation, value) : null;
        if (problem) {
          setBubble(problem);
          setPetState("error");
          return "pause";
        }
        setPetState("waiting");
        return "pause";
      }
      case "call_tool": {
        if (step.target && !(await focus(step.target))) {
          /* the target is decorative for this step; continue without it */
        }
        setPetState("thinking");
        const args = Object.fromEntries(Object.entries(step.args).map(([k, v]) => [k, renderTemplate(v, { fields: fieldValues() })]));
        let data: any;
        try {
          const res = await fetch("/api/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tool: step.tool, args }) });
          data = await res.json();
          if (!res.ok || data?.ok === false) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
        } catch (e) {
          return fail(`Reflect didn't answer just now (${(e as Error).message}). Say "repeat" to try again or "next" to skip.`);
        }
        if (!alive()) return "next";
        lastToolResult.current = data;
        addMessage("system", `${step.tool} · ${data.provenance ?? "?"} · ${data.ms ?? "?"}ms`);
        if (step.target) setPetState("pointing");
        await speak(renderTemplate(step.say, { result: data, fields: fieldValues() }), { state: "pointing" });
        await sleep(400);
        return "next";
      }
      case "wait_for_user_action": {
        if (!(await focus(step.target))) return fail(`I can't find the ${ELEMENTS[step.target].label} button.`);
        const r = runRef.current!;
        commitRun({ ...r, index: i, status: "waiting_action" });
        await speak(step.say, { state: "waiting" });
        setPetState("waiting");
        return "pause"; // the click listener below calls completeStep()
      }
      case "stop_before_signing": {
        if (!(await focus(step.target))) return fail(`The approval step isn't open. Open the review first.`);
        await speak(step.say, { state: "pointing" });
        await finish();
        return "end";
      }
      case "celebrate": {
        await finish(step.say);
        return "end";
      }
    }
  };

  const startWorkflow = useCallback(
    (wf: Workflow) => {
      const problems = auditWorkflow(wf);
      if (problems.length) {
        console.warn("[companion] refused workflow", problems);
        addMessage("system", "I refused an unsafe or invalid plan.");
        return;
      }
      stopSpeaking();
      commitRun({ workflow: wf, index: 0, status: "running" });
      void runFrom(0);
    },
    [addMessage, runFrom, stopSpeaking],
  );

  // ── Guide API ──
  const completeStep = useCallback(() => {
    const r = runRef.current;
    if (!r || r.status === "done") return;
    stopSpeaking();
    void runFrom(r.index + 1);
  }, [runFrom, stopSpeaking]);

  const cancel = useCallback(() => {
    tokenRef.current++;
    stopSpeaking();
    commitRun(null);
    goHome();
  }, [goHome, stopSpeaking]);

  const back = useCallback(() => {
    const r = runRef.current;
    if (!r) return;
    stopSpeaking();
    // Skip back over navigation-only steps so "back" lands on something visible.
    let i = Math.max(0, r.index - 1);
    while (i > 0 && r.workflow.steps[i]!.type === "navigate_to_page") i--;
    void runFrom(i);
  }, [runFrom, stopSpeaking]);

  const repeat = useCallback(() => {
    const r = runRef.current;
    stopSpeaking();
    if (r && r.status === "error") return void runFrom(r.index);
    if (lastSpokenRef.current) void speak(lastSpokenRef.current, { log: false, state: r ? "pointing" : "idle" });
  }, [runFrom, speak, stopSpeaking]);

  const restart = useCallback(() => {
    if (runRef.current) {
      stopSpeaking();
      void runFrom(0);
    }
  }, [runFrom, stopSpeaking]);

  const fill = useCallback((id: ElementId, value: string) => {
    const spec = getElement(id);
    // Hard safety rule, enforced here regardless of who asked: only fillable, non-sensitive inputs.
    if (!spec?.fillable || spec.sensitive) return;
    fields.current.get(id)?.set(value);
  }, []);

  const confirmOffer = useCallback(() => {
    const r = runRef.current;
    if (!r || r.status !== "waiting_input" || !r.offer) return;
    const step = r.workflow.steps[r.index];
    if (step?.type !== "request_input") return;
    fill(step.target, r.offer);
    // The field-change notifier advances the run once the value validates.
  }, [fill]);

  const explain = useCallback(
    async (id?: ElementId) => {
      const r = runRef.current;
      const step = r?.workflow.steps[r.index];
      const t = id ?? (step && "target" in step ? step.target : undefined) ?? target ?? undefined;
      if (!t) return speak(`This is ${PAGES[pageRef.current].title}. ${PAGES[pageRef.current].summary}`);
      if (!r && !(await focus(t))) return;
      await speak(ELEMENTS[t].description, { state: r ? "pointing" : "idle" });
    },
    [focus, speak, target],
  );

  const highlight = useCallback(
    async (id: ElementId, say?: string) => {
      if (!(await focus(id))) {
        setPetState("error");
        return void speak(`I couldn't find ${ELEMENTS[id].label} here.`, { state: "error" });
      }
      await speak(say ?? ELEMENTS[id].description, { state: "pointing" });
    },
    [focus, speak],
  );

  const retry = useCallback(() => {
    const r = runRef.current;
    if (r) void runFrom(r.index);
  }, [runFrom]);

  // ── Fields ──
  const registerField = useCallback((id: ElementId, handle: FieldHandle) => {
    fields.current.set(id, handle);
    return () => {
      if (fields.current.get(id) === handle) fields.current.delete(id);
    };
  }, []);

  /** Typing pauses ~0.9s → if the waiting field is now valid, advance. */
  const notifyFieldChange = useCallback(
    (id: ElementId) => {
      const r = runRef.current;
      if (!r || r.status !== "waiting_input") return;
      const step = r.workflow.steps[r.index];
      if (step?.type !== "request_input" || step.target !== id) return;
      clearTimeout(fieldTimers.current.get(id));
      fieldTimers.current.set(
        id,
        setTimeout(() => {
          const rule = getElement(id)?.validation;
          const value = fields.current.get(id)?.get() ?? "";
          const problem = rule ? validate(rule, value) : null;
          if (!problem) {
            setBubble("Looks good!");
            setPetState("celebrating");
            setTimeout(() => runRef.current === r && completeStep(), 350);
          } else if (value) {
            setBubble(problem);
            setPetState("error");
          }
        }, 900),
      );
    },
    [completeStep],
  );

  // Wait-for-user-action: observe clicks on the target. The companion never dispatches clicks itself.
  useEffect(() => {
    if (run?.status !== "waiting_action") return;
    const step = run.workflow.steps[run.index];
    if (step?.type !== "wait_for_user_action") return;
    const onClick = (e: MouseEvent) => {
      const hit = (e.target as HTMLElement | null)?.closest(`[data-companion="${step.target}"]`);
      if (hit && e.isTrusted) setTimeout(completeStep, 200);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [run, completeStep]);

  // ── Conversation ──
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  const send = useCallback(
    async (text: string) => {
      const utterance = text.trim();
      if (!utterance) return;
      addMessage("user", utterance);
      stopSpeaking();
      setPetState("thinking");
      setBubble(null);
      try {
        const res = await fetch("/api/companion", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ utterance, page: pageRef.current, history: historyRef.current.slice(-8), fields: fieldValues() }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reply = (await res.json()) as CompanionReply;
        setEngine(reply.engine);
        historyRef.current.push({ role: "user", content: utterance }, { role: "assistant", content: reply.speech });
        addMessage("assistant", reply.speech, { engine: reply.engine, tools: reply.toolCalls });
        if (reply.workflow) {
          if (runRef.current) cancel();
          await speak(reply.speech, { log: false });
          startWorkflow(reply.workflow);
        } else if (reply.point) {
          await highlight(reply.point.target as ElementId, reply.point.say ?? reply.speech);
        } else {
          await speak(reply.speech, { log: false, state: reply.needsClarification ? "waiting" : "idle" });
        }
      } catch (e) {
        setPetState("error");
        await speak("Sorry, I lost my connection for a moment. Could you try again?", { state: "error" });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addMessage, cancel, highlight, speak, startWorkflow, stopSpeaking],
  );

  /** Local control commands first (instant, offline), then the LLM. */
  const handleControl = useCallback(
    (cmd: ControlCommand): boolean => {
      const r = runRef.current;
      switch (cmd.kind) {
        case "stop":
          if (r) cancel();
          else {
            stopSpeaking();
            goHome();
          }
          return true;
        case "repeat":
          repeat();
          return true;
        case "next":
          if (!r) return false;
          completeStep();
          return true;
        case "back":
          if (!r) return false;
          back();
          return true;
        case "restart":
          if (!r) return false;
          restart();
          return true;
        case "explain":
          void explain();
          return true;
        case "confirm":
          if (r?.status === "waiting_input" && r.offer) {
            confirmOffer();
            return true;
          }
          if (r?.status === "error") {
            retry();
            return true;
          }
          return false;
        case "decline":
          if (r?.status === "waiting_input") {
            commitRun({ ...r, offer: undefined });
            void speak("No problem. Type it in yourself and I'll continue when it looks right.", { state: "waiting" });
            return true;
          }
          return false;
        case "provide_value": {
          if (r?.status !== "waiting_input") return false;
          commitRun({ ...r, offer: cmd.value });
          void speak(`Shall I fill in ${cmd.value}? Say yes to confirm.`, { state: "waiting" });
          return true;
        }
      }
    },
    [back, cancel, completeStep, confirmOffer, explain, goHome, repeat, restart, retry, speak, stopSpeaking],
  );

  const handleUtterance = useCallback(
    (raw: string, source: "voice" | "typed" = "voice") => {
      const text = raw.trim();
      if (!text) return;
      const speaking = speakingTextRef.current;
      const cmd = parseControlCommand(text, { awaitingValue: runRef.current?.status === "waiting_input" });

      if (speaking) {
        // Barge-in: while talking, only accept clear commands that aren't our own echo.
        // "stop"/"cancel" always win.
        if (cmd?.kind === "stop") return void handleControl(cmd);
        // The echo filter exists for the microphone only: typed text can't be our own voice.
        if (source === "voice" && isLikelyEcho(text, speaking)) return;
        stopSpeaking();
      }
      if (cmd) {
        addMessage("user", text);
        if (handleControl(cmd)) return;
      }
      void send(text);
    },
    [addMessage, handleControl, send, stopSpeaking],
  );
  handleUtteranceRef.current = handleUtterance;

  // ── Voice wiring ──
  useEffect(() => {
    let disposed = false;
    // Start on the browser engines so voice works instantly; upgrade to server engines below.
    tts.current = new BrowserTextToSpeech();
    const wire = (rec: SpeechToText & { onLevel?: (level: number) => void }) => {
    rec.onLevel = setMicLevel;
    rec.onStateChange = (on) => {
      if (!on) setMicLevel(0);
      setListening(on);
      if (on) setMicError(null);
    };
    rec.onInterim = (t) => {
      setInterim(t);
      if (!speakingTextRef.current) setPetState((s) => (s === "idle" || s === "waiting" ? "listening" : s));
    };
    rec.onFinal = (t) => {
      setInterim("");
      handleUtteranceRef.current(t);
    };
    rec.onError = (kind) => {
      const msg =
        kind === "not-allowed"
          ? "Microphone access was blocked. Allow it in the browser's address bar, or type instead."
          : kind === "network"
            ? "Speech recognition needs a network connection. You can type instead."
            : kind === "unsupported"
              ? "Voice isn't supported in this browser. Try Chrome or Edge, or type instead."
              : "I didn't catch that. Try again?";
      setMicError(msg);
      if (kind === "not-allowed" || kind === "unsupported") setHandsFree(false);
    };
    stt.current = rec;
    setSttSupported(rec.supported);
    };
    wire(new BrowserSpeechToText({ continuous: true }));

    void createVoiceEngines().then((v) => {
      if (disposed) return;
      // Swap only engines that differ, and never mid-utterance.
      if (v.kind.tts === "server" && !speakingTextRef.current) {
        v.tts.muted = tts.current?.muted ?? false;
        tts.current = v.tts;
      }
      // The mic is always off at load (it needs a user click), so swapping STT here is safe.
      if (v.kind.stt === "server") {
        stt.current?.stop();
        wire(v.stt);
      }
      setEngines(v.kind);
    });
    fetch("/api/companion").then((r) => r.json()).then((d) => setEngine(d.engine)).catch(() => {});
    return () => {
      disposed = true;
      stt.current?.stop();
      tts.current?.cancel();
    };
  }, []);

  const toggleMic = useCallback(() => {
    if (!stt.current?.supported) {
      setMicError("Voice isn't supported in this browser. Try Chrome or Edge, or type instead.");
      setPanelOpen(true);
      return;
    }
    if (listening || handsFree) {
      setHandsFree(false);
      stt.current.stop();
      setInterim("");
      setPetState((s) => (s === "listening" ? "idle" : s));
    } else {
      stopSpeaking(); // pressing the mic interrupts the companion
      setHandsFree(true);
      stt.current.start();
      setPetState("listening");
    }
  }, [handsFree, listening, stopSpeaking]);

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    if (tts.current) {
      tts.current.muted = m;
      if (m) tts.current.cancel();
    }
  }, []);

  // Escape always stops guidance (keyboard parity with "stop").
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (runRef.current || speakingTextRef.current)) handleControl({ kind: "stop" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleControl]);

  // Manual navigation while idle: drop a stale pointer.
  useEffect(() => {
    if (!runRef.current && target && ELEMENTS[target].page !== "global" && ELEMENTS[target].page !== page) goHome();
  }, [page, target, goHome]);

  const api = useMemo<CompanionApi>(
    () => ({
      page,
      petState,
      target,
      bubble,
      messages,
      run,
      panelOpen,
      setPanelOpen,
      engine,
      voice: { sttSupported, listening, interim, handsFree, muted, micError, engines },
      toggleMic,
      setMuted,
      send,
      input: (text: string) => handleUtterance(text, "typed"),
      guide: { navigate, highlight, explain, fill, confirmOffer, completeStep, back, repeat, restart, cancel, retry },
      registerField,
      notifyFieldChange,
    }),
    [page, petState, target, bubble, messages, run, panelOpen, engine, sttSupported, listening, interim, handsFree, muted, micError, engines, toggleMic, setMuted, send, handleUtterance, navigate, highlight, explain, fill, confirmOffer, completeStep, back, repeat, restart, cancel, retry, registerField, notifyFieldChange],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/**
 * Forms call this to let the guide read, validate and (with confirmation) fill a field.
 * Returns an onChange wrapper that also notifies the guide.
 */
export function useGuidedField(id: ElementId, value: string, setValue: (v: string) => void) {
  const { registerField, notifyFieldChange } = useCompanion();
  const valueRef = useRef(value);
  valueRef.current = value;
  const setRef = useRef(setValue);
  setRef.current = setValue;

  useEffect(
    () =>
      registerField(id, {
        get: () => valueRef.current,
        set: (v) => {
          setRef.current(v);
          valueRef.current = v;
          notifyFieldChange(id);
        },
      }),
    [id, registerField, notifyFieldChange],
  );

  return useCallback(
    (v: string) => {
      setRef.current(v);
      valueRef.current = v;
      notifyFieldChange(id);
    },
    [id, notifyFieldChange],
  );
}
