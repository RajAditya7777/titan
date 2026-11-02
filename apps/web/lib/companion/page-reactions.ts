import type { Reaction } from "@/components/companion/Pet";

/**
 * How the pet reacts to what the user does on the page (typing an amount, flipping tokens, opening
 * review...). Pure data → data, so it is unit-tested without a browser. The pet only ever echoes
 * what the user typed or did; it never states a price, quote or balance of its own.
 */
export interface PageEvent {
  /** The control's data-companion id. */
  id: string;
  kind: "input" | "click" | "change";
  value?: string;
}
export interface PetResponse {
  reaction: Reaction;
  /** A few words shown above the pet. */
  quip?: string;
  /** Walk over to the control (false for header/nav controls far from the work area). */
  visit: boolean;
}

const AMOUNT_IDS = new Set(["titan-sell-amount-input", "titan-limit-quantity-input", "titan-limit-price-input"]);

export function parseAmount(value: string): number | null {
  const n = Number(value.replace(/,/g, "").trim());
  return value.trim() && Number.isFinite(n) ? n : null;
}

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 6 });

export function respondTo(e: PageEvent): PetResponse | null {
  // Typed fields react to what was typed, not to being clicked into.
  const typed = e.kind !== "click";
  if (AMOUNT_IDS.has(e.id)) {
    if (!typed || !e.value?.trim()) return null;
    const n = parseAmount(e.value);
    if (n == null || n < 0) return { reaction: "wiggle", quip: "Hmm, that's not a number", visit: true };
    if (n === 0) return { reaction: "wiggle", quip: "Zero? Try a bit more", visit: true };
    if (n >= 10_000) return { reaction: "hop", quip: `Whoa, ${fmt(n)}!`, visit: true };
    if (n >= 100) return { reaction: "hi", quip: `${fmt(n)}, nice`, visit: true };
    return { reaction: "giggle", quip: fmt(n), visit: true };
  }
  if (e.id.startsWith("titan-slippage")) {
    if (!typed) return null;
    const n = parseAmount(e.value ?? "");
    if (n == null) return null;
    return n >= 3
      ? { reaction: "wiggle", quip: `${fmt(n)}% is high slippage`, visit: true }
      : { reaction: "giggle", quip: `${fmt(n)}% slippage`, visit: true };
  }
  if (e.kind !== "click") return null;
  switch (e.id) {
    case "titan-switch-tokens":
      return { reaction: "clap", quip: "Flip!", visit: true };
    case "titan-refresh-quote":
      return { reaction: "hop", quip: "Fresh quote", visit: true };
    case "titan-swap-review":
    case "titan-limit-submit":
      return { reaction: "hearts", quip: "Let's check it together", visit: true };
    case "titan-swap-sign":
      return { reaction: "wave", quip: "You sign in your wallet, not me", visit: true };
    case "titan-sell-token-select":
    case "titan-buy-token-select":
      return { reaction: "giggle", quip: "Pick a token", visit: true };
    case "titan-limit-side-buy":
    case "titan-limit-side-sell":
    case "titan-prime-toggle":
    case "titan-priority-fee-toggle":
    case "titan-dart-selector":
      return { reaction: "hi", visit: true };
    case "titan-connect-wallet":
      return { reaction: "wave", visit: false };
  }
  if (e.id.startsWith("titan-nav-") || e.id.startsWith("titan-tab-")) return { reaction: "hop", visit: false };
  return null;
}
