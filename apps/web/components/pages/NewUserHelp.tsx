"use client";

import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { useCompanion } from "@/components/companion/CompanionProvider";
import { Pet } from "@/components/companion/Pet";

/** What the guide hears when the button is pressed. "new" routes to the onboarding tour in both engines. */
export const NEW_USER_PROMPT = "I'm new here and haven't deposited yet. Show me how to get started.";
const DISMISS_KEY = "reflect.newUserHelp.dismissed";

/**
 * The one entry point for someone who has never deposited: a single, obvious "guide me" button.
 * The caller decides who is new (`hasDeposited`), so the rule lives with the data, not in here.
 */
export function NewUserHelp({ hasDeposited }: { hasDeposited: boolean }) {
  const c = useCompanion();
  // Hidden until mounted, so the server render and a remembered "Not now" never disagree.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false); // storage blocked: just show it
    }
  }, []);

  if (hasDeposited || dismissed || c.run) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* per-visitor convenience only */
    }
  };

  return (
    <section
      data-testid="new-user-help"
      data-companion="dashboard-new-user"
      aria-label="Help for new users"
      className="mb-6 flex flex-col gap-5 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 sm:flex-row sm:items-center md:p-6"
    >
      <div className="hidden shrink-0 sm:block" aria-hidden>
        <Pet state="idle" lookAngle={null} size={72} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[var(--accent)]">New to Reflect?</p>
        <h2 className="mt-1 text-[20px] font-medium leading-snug tracking-[-0.02em]">You haven&apos;t deposited yet. Let&apos;s do your first one together.</h2>
        <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-[var(--muted)]">
          I&apos;ll point at each step on the page and explain it in plain words. Nothing moves until you approve it in your own wallet.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          data-testid="new-user-guide"
          onClick={() => c.input(NEW_USER_PROMPT)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-[14.5px] font-medium text-white transition hover:brightness-110 active:scale-[0.98]"
        >
          Guide me through it <ArrowRight size={15} />
        </button>
        <button type="button" onClick={dismiss} aria-label="Not now" className="rounded-full p-2 text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]">
          <X size={16} />
        </button>
      </div>
    </section>
  );
}
