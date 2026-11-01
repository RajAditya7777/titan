"use client";

import { useSyncExternalStore } from "react";

/**
 * Microphone level (0..1) as a tiny external store. It changes ~30×/s; putting it in React state
 * at the provider would re-render the whole companion tree each frame. Only the pet subscribes.
 */
let level = 0;
const listeners = new Set<() => void>();

export function setMicLevel(next: number) {
  // Quantise so silence-to-silence frames don't notify anyone.
  const q = Math.round(next * 20) / 20;
  if (q === level) return;
  level = q;
  listeners.forEach((l) => l());
}

export function useMicLevel(): number {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => level,
    () => 0,
  );
}
