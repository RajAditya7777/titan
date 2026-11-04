/**
 * Records the Jupiter + Astro demo as raw screencast frames plus a timeline (camera moves, chapter
 * titles, Astro's spoken answers). render-jupiter.mjs turns that into the final MP4 with zoom and
 * voice-over, so zoom/captions can be re-tuned without recording again.
 *
 *   node scripts/demo/record-jupiter.mjs [baseUrl] [outDir]
 *
 * Needs the Jupiter dev server running (default http://localhost:3300) and Google Chrome.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("@playwright/test");

const BASE = process.argv[2] ?? "http://localhost:3300";
const OUT = path.resolve(process.argv[3] ?? path.join(os.homedir(), "Downloads/jupiter-astro-demo"));
const W = 1600;
const H = 900;
const FRAMES = path.join(OUT, "frames");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => Date.now();
const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const page = await context.newPage();
// The pet naps only when a scene asks for it; the default wait is effectively "never".
await page.addInitScript(() => {
  window.__PET_SLEEP_MS = 1e9;
  window.__PET_NO_ROAM = true;
  // The app's own voice is muted while recording: its speech timing would drift from the voice-over,
  // which is added afterwards from the recorded answers.
  try { localStorage.setItem("reflect.voice.muted", "1"); } catch {}
  const css = `
    #demo-cursor{position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;transform:translate(-4px,-3px);filter:drop-shadow(0 2px 3px rgba(0,0,0,.55));transition:transform .08s}
    #demo-cursor.down{transform:translate(-4px,-3px) scale(.82)}
    .demo-ripple{position:fixed;z-index:2147483646;pointer-events:none;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;border:3px solid #c7f284;animation:ripple .55s ease-out forwards}
    @keyframes ripple{to{transform:scale(4.2);opacity:0}}`;
  window.addEventListener("DOMContentLoaded", () => {
    const st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
    const c = document.createElement("div");
    c.id = "demo-cursor";
    c.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M3 2l15 9-6.6 1.7L8.7 19z" fill="#fff" stroke="#0b1014" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    document.addEventListener("mousemove", (e) => (c.style.left = e.clientX + "px", c.style.top = e.clientY + "px"), true);
    document.addEventListener("mousedown", (e) => {
      c.classList.add("down");
      const r = document.createElement("div");
      r.className = "demo-ripple";
      r.style.left = e.clientX + "px";
      r.style.top = e.clientY + "px";
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 600);
    }, true);
    document.addEventListener("mouseup", () => c.classList.remove("down"), true);
  });
});

// ───────── screencast ─────────
const frames = [];
const cdp = await context.newCDPSession(page);
let n = 0;
cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
  const file = `f${String(n++).padStart(6, "0")}.jpg`;
  frames.push({ t: Math.round(metadata.timestamp * 1000), file });
  fs.writeFileSync(path.join(FRAMES, file), Buffer.from(data, "base64"));
  cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});

// ───────── timeline ─────────
const events = { camera: [], chapters: [], voice: [], ramps: [], settles: [] };
let camState = { cx: W / 2, cy: H / 2, z: 1 };
const moves = [];
function stateAt(t) {
  let s = { cx: W / 2, cy: H / 2, z: 1 };
  for (const m of moves) {
    if (m.t0 > t) break;
    const p = Math.min(1, (t - m.t0) / m.dur);
    const e = ease(p);
    s = { cx: m.from.cx + (m.to.cx - m.from.cx) * e, cy: m.from.cy + (m.to.cy - m.from.cy) * e, z: m.from.z + (m.to.z - m.from.z) * e };
  }
  return s;
}
function move(to, dur = 800) {
  const t0 = now();
  const from = stateAt(t0);
  moves.push({ t0, dur, from, to });
  events.camera.push({ t0, dur, from, to });
}
const rect = async (sel) => {
  try {
    const r = await page.locator(sel).first().boundingBox({ timeout: 1500 });
    return r && r.width && r.height ? { x: r.x, y: r.y, w: r.width, h: r.height } : null;
  } catch {
    return null;
  }
};

/** Frames the union of these elements with padding; zoom is derived from how big that union is. */
async function frame(sels, { pad = 110, maxZ = 2.3, dur = 800 } = {}) {
  const rs = (await Promise.all(sels.map(rect))).filter(Boolean);
  if (!rs.length) return;
  const x0 = Math.min(...rs.map((r) => r.x)) - pad;
  const y0 = Math.min(...rs.map((r) => r.y)) - pad;
  const x1 = Math.max(...rs.map((r) => r.x + r.w)) + pad;
  const y1 = Math.max(...rs.map((r) => r.y + r.h)) + pad;
  const z = Math.max(1, Math.min(maxZ, W / (x1 - x0), H / (y1 - y0)));
  move({ cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, z }, dur);
}
const wide = (dur = 900) => move({ cx: W / 2, cy: H / 2, z: 1 }, dur);
/** Keeps framing these elements (the pet walks around) for `ms`. */
async function follow(sels, ms, opts = {}) {
  const end = now() + ms;
  while (now() < end) {
    await frame(sels, { dur: 450, ...opts });
    await sleep(320);
  }
}
/** Skips the wait for the AI's reply at `speed`x in the final video (the screen is static anyway). */
async function rampUntilAnswer(speed = 4, max = 40_000) {
  const t0 = now();
  const before = events.voice.length;
  while (events.voice.length === before && now() - t0 < max) await sleep(100);
  events.ramps.push({ t0, t1: now(), speed });
}
/** Holds the scene for as long as the voice-over takes to read Astro's latest answer. */
const VOICE_WPM = 245;
async function speakWait(extra = 0.5) {
  const text = events.voice.at(-1)?.text ?? "";
  const words = text.split(/\s+/).filter(Boolean).length;
  await sleep(((words * 60) / VOICE_WPM + extra) * 1000);
}
const chapter = (text) => events.chapters.push({ t: now(), text });
const voice = (text) => events.voice.push({ t: now(), text });

// ───────── cursor, typing, waiting ─────────
let mouse = { x: W - 200, y: H - 200 };
async function glide(x, y, ms = 520) {
  const steps = Math.max(8, Math.round(ms / 16));
  const from = { ...mouse };
  for (let i = 1; i <= steps; i++) {
    const e = ease(i / steps);
    await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
    await sleep(ms / steps);
  }
  mouse = { x, y };
}
async function click(sel, { dx = 0, dy = 0, hold = 160 } = {}) {
  const r = await rect(sel);
  if (!r) throw new Error(`not found: ${sel}`);
  await glide(r.x + r.w / 2 + dx, r.y + r.h / 2 + dy);
  await sleep(hold);
  await page.mouse.down();
  await sleep(70);
  await page.mouse.up();
}
const type = async (text, delay = 140) => page.keyboard.type(text, { delay });
const petLabel = () => page.evaluate(() => document.querySelector('svg[aria-label^="Astro"]')?.getAttribute("aria-label") ?? "");
/** Waits until Astro stops thinking/speaking/walking (answers can take a while to say). */
async function settle(min = 600, max = 60_000) {
  const start = now();
  const done = () => events.settles.push({ t0: start, t1: now() });
  await sleep(min);
  while (now() - start < max) {
    const l = await petLabel();
    if (/, idle$|, waiting$|, pointing$/.test(l)) {
      await sleep(350);
      if (/, idle$|, waiting$|, pointing$/.test(await petLabel())) return done();
    }
    await sleep(250);
  }
  done();
}

const POPUP = '[data-testid="companion-panel"]';
const popupOpen = async () => !!(await rect(POPUP));
/** Opens/closes Astro's popup only if it isn't already in that state (clicks toggle). */
async function openPopup() {
  for (let i = 0; i < 3 && !(await popupOpen()); i++) {
    await click('[data-testid="companion-pet"]');
    await sleep(900);
  }
  if (!(await popupOpen())) throw new Error("popup did not open");
}
async function closePopup() {
  for (let i = 0; i < 3 && (await popupOpen()); i++) {
    await click(`${POPUP} button[aria-label="Close"]`);
    await sleep(700);
  }
  // Astro's last answer leaves a speech bubble (with Back/Next) behind; tidy it before the next scene.
  await page.locator('button[aria-label="Close guide"]').first().click({ timeout: 800 }).catch(() => {});
  await sleep(300);
}

// Astro's answers become the voice-over, timed to when the text appears on screen.
page.on("response", async (res) => {
  if (!res.url().endsWith("/api/companion") || res.request().method() !== "POST") return;
  try {
    const j = await res.json();
    if (j?.speech) voice(j.speech);
  } catch {
    /* not an answer */
  }
});

// ───────── the demo ─────────
const t0 = now();
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
await page.goto(`${BASE}/jup`, { waitUntil: "networkidle" });
await sleep(900);

// 1. Astro says hi
chapter("Meet Astro: an AI companion for Jupiter");
await page.waitForSelector('[data-testid="help-nudge"]', { timeout: 12_000 });
voice("Hi! Do you need any help?");
await frame(['[data-testid="help-nudge"]', '[data-testid="companion-pet"]'], { pad: 60 });
await sleep(1500);
await click('[data-testid="help-nudge"] button:has-text("Yes, please")');
await sleep(700);
await frame(['[data-testid="companion-panel"]', '[data-testid="companion-pet"]'], { pad: 50 });
await sleep(1700);
await click('[data-testid="companion-panel"] button[aria-label="Close"]');
wide();
await sleep(900);

// 2. Reacts to every action
chapter("It reacts to everything you do");
await click('[data-companion="jup-connect"]');
await sleep(300);
await follow(['[data-testid="companion-pet"]', '[data-companion="jup-wallet-connect"]'], 1600, { maxZ: 1.6 });
await click('[data-companion="jup-wallet-connect"]');
wide(700);
await sleep(1000);

await click('[data-companion="jup-sell-amount"]');
await frame(['[data-companion="jup-swap-card"]', '[data-testid="companion-pet"]'], { pad: 80 });
await type("2", 200);
await follow(['[data-companion="jup-swap-card"]', '[data-testid="companion-pet"]'], 1400, { pad: 80 });
await type("0", 200); // 20 SOL: more than the wallet holds
await follow(['[data-companion="jup-swap-card"]', '[data-testid="companion-pet"]'], 1900, { pad: 80 });
await page.keyboard.press("Backspace");
await follow(['[data-companion="jup-swap-card"]', '[data-testid="companion-pet"]'], 1100, { pad: 80 });
await click('[data-companion="jup-flip"]');
await follow(['[data-companion="jup-swap-card"]', '[data-testid="companion-pet"]'], 1400, { pad: 80 });
await click('[data-companion="jup-flip"]');
await follow(['[data-companion="jup-swap-card"]', '[data-testid="companion-pet"]'], 1000, { pad: 80 });

await click('[data-companion="jup-swap-submit"]');
await follow(['[data-companion="jup-swap-submit"]', '[data-testid="companion-pet"]'], 1200, { pad: 90 });
await click('[data-companion="jup-approve"]');
await follow(['[data-testid="companion-pet"]'], 2200, { pad: 190, maxZ: 1.7 });
await follow(['[data-testid="companion-pet"]'], 2200, { pad: 190, maxZ: 1.7 });
await page.getByRole("button", { name: "Close", exact: true }).first().click().catch(() => {});
wide();
await sleep(900);

// 3. Idle: nap, then wake up
chapter("Nothing happening? Astro naps");
// Wait for Astro to be home and idle, then keep still until it is actually asleep (the "z z z" is drawn).
const atHome = async () => {
  const r = await rect('[data-testid="companion-pet"]');
  return !!r && r.x > W - 260 && r.y > H - 260 && /, idle$/.test(await petLabel());
};
for (let i = 0; i < 40 && !(await atHome()); i++) await sleep(250);
await glide(W / 2, 150, 600);
await page.evaluate(() => (window.__PET_SLEEP_MS = 2500));
await frame(['[data-testid="companion-pet"]'], { pad: 150, maxZ: 2.4, dur: 1200 });
const asleep = () => page.evaluate(() => [...document.querySelectorAll('svg[aria-label^="Astro"] text')].some((t) => t.textContent === "z"));
for (let i = 0; i < 60 && !(await asleep()); i++) await sleep(250);
await sleep(2200); // hold on the sleeping cat
await page.evaluate(() => (window.__PET_SLEEP_MS = 1e9));
await glide(W / 2 + 40, 190, 300); // any movement wakes it
await sleep(1900);
wide();
await sleep(500);

// 4. A real problem
chapter("Ask a real problem");
await openPopup();
await frame(['[data-testid="companion-panel"]', '[data-testid="companion-pet"]'], { pad: 40 });
await sleep(1400);
await click('[data-testid="companion-panel"] button:has-text("My swap failed. What went wrong?")');
await rampUntilAnswer();
await frame(['[data-testid="companion-panel"]', '[data-testid="companion-pet"]'], { pad: 40 });
await speakWait();
await closePopup();
wide();
await sleep(600);

// 5. Gacha, explained
chapter("New to Gacha? Just ask");
await click('a[title="Gacha"]');
await page.waitForSelector('[data-companion="jup-gacha-packs"]');
await sleep(1500);
await openPopup();
await frame(['[data-testid="companion-panel"]', '[data-testid="companion-pet"]'], { pad: 40 });
await click('[data-testid="companion-input"]');
await type("Explain Gacha, I am new", 40);
await sleep(500);
await page.keyboard.press("Enter");
await rampUntilAnswer();
await frame(['[data-testid="companion-panel"]', '[data-testid="companion-pet"]'], { pad: 40 });
await speakWait();
await closePopup();
wide();
await sleep(700);

// 6. Opening packs
chapter("Open a pack, see the pull");
await frame(['[data-companion="jup-gacha-packs"]'], { pad: 90, maxZ: 1.7 });
await click('[data-companion="jup-gacha-packs"] button:has-text("Lucky")');
await sleep(1100);
await click('button[aria-label="More packs"]');
await click('button[aria-label="More packs"]');
await frame(['[data-companion="jup-gacha-open"]', '[data-companion="jup-gacha-ev"]'], { pad: 90 });
await sleep(700);
await click('[data-companion="jup-gacha-open"]');
await sleep(900);
await click('[data-companion="jup-approve"]');
wide(900);
await sleep(1800);
await frame(['[data-testid="companion-pet"]', 'button:has-text("Keep and close")'], { pad: 120, maxZ: 1.5, dur: 1000 });
await sleep(2000);
await follow(['[data-testid="companion-pet"]'], 2000, { pad: 190, maxZ: 1.7 });
await sleep(500);

chapter("__end__");
await sleep(1200);
await cdp.send("Page.stopScreencast");
const tEnd = now();
await browser.close();

fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({ W, H, t0, tEnd, frames, ...events }, null, 1));
console.log(`recorded ${frames.length} frames over ${((tEnd - t0) / 1000).toFixed(1)}s → ${OUT}`);
