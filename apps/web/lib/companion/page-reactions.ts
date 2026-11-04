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

const AMOUNT_IDS = new Set(["titan-sell-amount-input", "titan-limit-quantity-input", "titan-limit-price-input", "umb-amount", "jup-sell-amount", "jup-perps-amount", "jup-limit-price"]);

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
  if (e.id === "jup-perps-leverage") {
    if (!typed) return null;
    const n = parseAmount(e.value ?? "");
    if (n == null) return null;
    if (n <= 5) return { reaction: "giggle", quip: `${fmt(n)}x, nice and steady`, visit: true };
    if (n <= 25) return { reaction: "hop", quip: `${fmt(n)}x, getting spicy 🌶️`, visit: true };
    if (n <= 100) return { reaction: "wiggle", quip: `${fmt(n)}x?! Careful now`, visit: true };
    return { reaction: "wiggle", quip: `${fmt(n)}x 😱 liquidation is close!`, visit: true };
  }
  if (e.kind !== "click") return null;
  switch (e.id) {
    case "jup-connect":
      return { reaction: "wave", quip: "Let's get you connected!", visit: false };
    case "jup-wallet-connect":
      return { reaction: "hearts", quip: "Wallet connected 🚀", visit: true };
    case "jup-flip":
      return { reaction: "roll", quip: "Wheee, flip!", visit: true };
    case "jup-sell-token":
    case "jup-buy-token":
      return { reaction: "giggle", quip: "Ooh, which one?", visit: true };
    case "jup-ultra":
      return { reaction: "clap", quip: "Ultra handles the hard stuff", visit: true };
    case "jup-quote":
      return { reaction: "hi", quip: "Best route, found it!", visit: true };
    case "jup-swap-submit":
      return { reaction: "cheer", quip: "Swap time! 🎉", visit: true };
    case "jup-limit-submit":
      return { reaction: "hi", quip: "Set it and forget it", visit: true };
    case "jup-perps-submit":
      return { reaction: "hearts", quip: "Strap in, astronaut!", visit: true };
    case "jup-approve":
      return { reaction: "launch", quip: "3, 2, 1… liftoff! 🚀", visit: true };
    case "jup-perps-long":
      return { reaction: "cheer", quip: "Up only? 📈", visit: true };
    case "jup-perps-short":
      return { reaction: "wiggle", quip: "Betting it drops 📉", visit: true };
    case "jup-perps-markets":
      return { reaction: "giggle", quip: "New market, new vibes", visit: true };
    case "jup-limit-expiry":
      return { reaction: "hi", quip: "Good choice", visit: true };
    case "jup-portfolio-demo":
      return { reaction: "hearts", quip: "Let's peek inside!", visit: true };
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
    case "umb-create-account":
      return { reaction: "hearts", quip: "Welcome to Umbra!", visit: true };
    case "umb-register":
      return { reaction: "clap", quip: "Keys stay on your device", visit: true };
    case "umb-submit":
      return { reaction: "hearts", quip: "Let's check it together", visit: true };
    case "umb-approve":
      return { reaction: "wave", quip: "You approve, not me", visit: true };
    case "umb-token":
    case "umb-swap-to":
      return { reaction: "giggle", quip: "Pick a token", visit: true };
  }
  if (e.id.startsWith("umb-tab-")) return { reaction: "hop", visit: false };
  if (e.id.startsWith("jup-tab-")) return { reaction: "hop", quip: e.id === "jup-tab-limit" ? "Patience pays" : e.id === "jup-tab-dca" ? "Slow and steady" : undefined, visit: false };
  if (e.id.startsWith("titan-nav-") || e.id.startsWith("titan-tab-")) return { reaction: "hop", visit: false };
  return null;
}

/**
 * Outcomes the page knows and the DOM doesn't (a swap went through, a balance is short): the page
 * fires this and the pet reacts like it does to a click.
 */
export const PET_REACT_EVENT = "companion:react";
export function petReact(reaction: Reaction, quip?: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(PET_REACT_EVENT, { detail: { reaction, quip } }));
}
