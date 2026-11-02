"use client";

/**
 * What the companion "sees": the text inside the viewport and a downscaled screenshot of it.
 * Both leave out the companion's own UI (marked `data-capture-skip`), so the model looks at the
 * page, not at its chat. Form values are included as typed; nothing here reads storage or keys.
 */

const SKIP = "[data-capture-skip]";

/** Visible text, top to bottom, de-duplicated and capped (it is re-sent every turn). */
export function readVisibleText(max = 4_000): string {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const seen = new Set<string>();
  const lines: string[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (el.matches(`${SKIP}, script, style, noscript, svg`)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_SKIP;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let length = 0;
  for (let node = walker.nextNode(); node && length < max; node = walker.nextNode()) {
    const text = node.textContent?.replace(/\s+/g, " ").trim();
    const parent = node.parentElement;
    if (!text || !parent || seen.has(text)) continue;
    const r = parent.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw || r.width === 0) continue;
    const style = getComputedStyle(parent);
    if (style.visibility === "hidden" || Number(style.opacity) < 0.15) continue;
    seen.add(text);
    lines.push(text);
    length += text.length + 1;
  }
  // Inputs carry their value outside text nodes.
  document.querySelectorAll<HTMLInputElement>("input[data-companion], input:not([type=hidden])").forEach((input) => {
    if (input.closest(SKIP) || !input.value) return;
    const r = input.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    lines.push(`[field ${input.dataset.companion ?? input.name ?? input.placeholder}: ${input.value}]`);
  });
  return lines.join("\n").slice(0, max);
}

/** A JPEG data URL of the viewport, ~1000px wide. Null if capture fails or takes too long. */
export async function captureViewport(timeoutMs = 3_000): Promise<string | null> {
  try {
    const { domToJpeg } = await import("@/lib/vendor/modern-screenshot/index.mjs");
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const shot = domToJpeg(document.body, {
      width: vw,
      height: vh,
      scale: Math.min(1, 1000 / vw),
      quality: 0.72,
      backgroundColor: getComputedStyle(document.body).backgroundColor || "#ffffff",
      // Shift the page so the capture window is what is on screen right now.
      style: { transform: `translate(${-window.scrollX}px, ${-window.scrollY}px)`, transformOrigin: "top left" },
      filter: (node) => !(node instanceof Element && node.matches(SKIP)),
      timeout: timeoutMs,
    });
    const timer = new Promise<null>((r) => setTimeout(() => r(null), timeoutMs));
    return await Promise.race([shot, timer]);
  } catch (e) {
    console.warn("[companion] screenshot failed", e);
    return null;
  }
}

/** Questions that are about the screen itself. Other pages only send a screenshot for these. */
export const ASKS_TO_LOOK = /\b(screen|see|look|this page|on (the )?page|what('?s| is) (this|that)|explain (this|it)|here|showing|error|why)\b/i;
