/**
 * Turns record-jupiter.mjs's frames + timeline into the final MP4: smooth zoom (camera moves),
 * chapter captions, intro/outro cards, and Astro's answers as a voice-over (macOS `say`).
 *
 *   node scripts/demo/render-jupiter.mjs [recordingDir] [out.mp4]
 *
 * ffmpeg comes from FFMPEG or ~/Downloads/demo-tools/node_modules/ffmpeg-static/ffmpeg.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharpPath = fs
  .readdirSync(path.resolve(import.meta.dirname, "../../../../node_modules/.pnpm"))
  .filter((d) => d.startsWith("sharp@"))
  .map((d) => path.resolve(import.meta.dirname, "../../../../node_modules/.pnpm", d, "node_modules/sharp"))
  .find((p) => fs.existsSync(p));
const sharp = require(sharpPath);

const DIR = path.resolve(process.argv[2] ?? path.join(os.homedir(), "Downloads/jupiter-astro-demo"));
const OUT = path.resolve(process.argv[3] ?? path.join(DIR, "jupiter-astro-demo.mp4"));
const FFMPEG = process.env.FFMPEG ?? path.join(os.homedir(), "Downloads/demo-tools/node_modules/ffmpeg-static/ffmpeg");
const meta = JSON.parse(fs.readFileSync(path.join(DIR, "meta.json"), "utf8"));
const { W, H, t0, tEnd, frames, camera, chapters, voice } = meta;
const ramps = meta.ramps ?? [];
const OW = 1280;
const OH = 720;
const FPS = 30;
// The voice-over is generated first so we know when each line really ends.
const RATE = 22050;
const VOICE_WPM = 245;
function readWav(file) {
  const b = fs.readFileSync(file);
  let o = 12;
  while (o + 8 <= b.length) {
    const id = b.toString("ascii", o, o + 4);
    const size = b.readUInt32LE(o + 4);
    if (id === "data") return new Int16Array(b.buffer.slice(b.byteOffset + o + 8, b.byteOffset + o + 8 + (size & ~1)));
    o += 8 + size + (size & 1);
  }
  throw new Error("no data chunk in " + file);
}
const voiceDir = fs.mkdtempSync(path.join(os.tmpdir(), "astro-voice-"));
const clips = voice.map((v, i) => {
  const file = path.join(voiceDir, `v${i}.wav`);
  execFileSync("/usr/bin/say", ["-v", "Samantha", "-r", String(VOICE_WPM), "-o", file, "--data-format=LEI16@22050", "--", v.text]);
  const pcm = readWav(file);
  return { ...v, pcm, srcEnd: v.t + (pcm.length / RATE) * 1000 };
});
// Dead air: after a voice line ends, the app is still finishing its own (slower) speech. Skip that.
const dead = [];
const allRamps = [...ramps, ...dead].sort((a, b) => a.t0 - b.t0);
// Source time → output time: waits for the AI's reply, and dead air, are played back faster.
const speedAt = (abs) => allRamps.find((r) => abs >= r.t0 && abs < r.t1)?.speed ?? 1;
const srcTimes = [];
for (let s = t0; s < tEnd; s += (1000 / 30) * speedAt(s)) srcTimes.push(s);
const DUR = srcTimes.length / 30;
const outSec = (abs) => {
  let lo = 0, hi = srcTimes.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (srcTimes[mid] < abs) lo = mid + 1; else hi = mid; }
  return lo / 30;
};
const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

// ───────── camera ─────────
const NO_ZOOM = process.env.NO_ZOOM === "1"; // plain full-screen recording, no camera moves
function stateAt(t) {
  let s = { cx: W / 2, cy: H / 2, z: 1 };
  if (NO_ZOOM) return s;
  for (const m of camera) {
    if (m.t0 > t) break;
    const p = Math.min(1, (t - m.t0) / m.dur);
    const e = ease(p);
    s = { cx: m.from.cx + (m.to.cx - m.from.cx) * e, cy: m.from.cy + (m.to.cy - m.from.cy) * e, z: m.from.z + (m.to.z - m.from.z) * e };
  }
  return s;
}

// ───────── voice-over ─────────
function buildVoice() {
  const track = new Int16Array(Math.ceil((DUR + 1) * RATE));
  const items = clips.map((c) => ({ ...c, start: outSec(c.t) + 0.15 })).sort((a, b) => a.start - b.start);
  items.forEach((v, i) => {
    const pcm = v.pcm;
    const next = items[i + 1];
    const room = next ? Math.max(0, Math.floor((next.start - v.start) * RATE)) : pcm.length;
    const at = Math.floor(v.start * RATE);
    const n = Math.min(pcm.length, room);
    for (let k = 0; k < n && at + k < track.length; k++) {
      const fade = Math.min(1, (n - k) / 800);
      track[at + k] = Math.max(-32768, Math.min(32767, track[at + k] + pcm[k] * 0.95 * fade));
    }
    v.end = (at + n) / RATE;
  });
  const wav = Buffer.alloc(44 + track.length * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + track.length * 2, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(RATE, 24);
  wav.writeUInt32LE(RATE * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(track.length * 2, 40);
  Buffer.from(track.buffer).copy(wav, 44);
  const file = path.join(DIR, "voice.wav");
  fs.writeFileSync(file, wav);
  fs.rmSync(voiceDir, { recursive: true, force: true });
  return { file, items };
}

// ───────── overlays ─────────
const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const svg = (body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OW}" height="${OH}" viewBox="0 0 ${OW} ${OH}">${body}</svg>`);
const cache = new Map();
const overlay = (key, make) => (cache.has(key) ? cache.get(key) : (cache.set(key, make()), cache.get(key)));

function chip(text, a) {
  const w = Math.round(text.length * 13.2 + 58);
  const x = Math.round((OW - w) / 2);
  const y = OH - 92;
  return overlay(`chip:${text}:${a}`, () =>
    svg(`<g opacity="${a}"><rect x="${x}" y="${y}" width="${w}" height="46" rx="23" fill="#0b1014" fill-opacity=".86" stroke="#c7f284" stroke-opacity=".6"/><circle cx="${x + 26}" cy="${y + 23}" r="6" fill="#c7f284"/><text x="${x + 44}" y="${y + 30}" font-family="${FONT}" font-size="21" font-weight="600" fill="#f2f7f4">${esc(text)}</text></g>`),
  );
}
function card(title, sub, small, a) {
  return overlay(`card:${title}:${a}`, () =>
    svg(
      `<rect width="${OW}" height="${OH}" fill="#06090c" fill-opacity="${(0.86 * a).toFixed(2)}"/><g opacity="${a}"><text x="${OW / 2}" y="${OH / 2 - 14}" text-anchor="middle" font-family="${FONT}" font-size="76" font-weight="800" fill="#c7f284">${esc(title)}</text><text x="${OW / 2}" y="${OH / 2 + 34}" text-anchor="middle" font-family="${FONT}" font-size="30" fill="#f2f7f4">${esc(sub)}</text><text x="${OW / 2}" y="${OH / 2 + 86}" text-anchor="middle" font-family="${FONT}" font-size="19" fill="#8a99a6">${esc(small)}</text></g>`,
    ),
  );
}
const q = (a) => Math.round(Math.max(0, Math.min(1, a)) * 10) / 10;

// ───────── render ─────────
const { file: voiceFile, items: voiceItems } = buildVoice();
console.log(`voice-over: ${voiceItems.length} lines, ends ${Math.max(...voiceItems.map((v) => v.end)).toFixed(1)}s`);

const ff = spawn(FFMPEG, [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "pipe:0",
  "-i", voiceFile,
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(FPS),
  "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2",
  "-movflags", "+faststart", "-shortest", OUT,
], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg exited " + c)))));

const total = srcTimes.length;
const caps = chapters.filter((c) => c.text !== "__end__");
let idx = 0;
for (let n = 0; n < total; n++) {
  const T = n / FPS; // seconds into the video
  const abs = srcTimes[n];
  while (idx + 1 < frames.length && frames[idx + 1].t <= abs) idx++;
  const s = stateAt(abs);
  const cw = Math.min(W, Math.round(W / Math.max(1, s.z)));
  const ch = Math.min(H, Math.round(cw * (H / W)));
  const left = Math.round(Math.max(0, Math.min(W - cw, s.cx - cw / 2)));
  const top = Math.round(Math.max(0, Math.min(H - ch, s.cy - ch / 2)));

  const layers = [];
  const cap = [...caps].reverse().find((c) => abs >= c.t);
  if (cap) {
    const age = T - outSec(cap.t);
    const a = q(Math.min(age / 0.3, (3.6 - age) / 0.4, 1));
    if (a > 0 && !(T < 3)) layers.push({ input: chip(cap.text, a) });
  }
  if (T < 3.4) layers.push({ input: card("Astro", "An AI companion that lives on Jupiter", "Independent demo · simulated wallet", q(Math.min(1, (3.4 - T) / 0.6))) });
  if (DUR - T < 3.4) layers.push({ input: card("Astro × Jupiter", "It sees your screen. It reacts. It explains.", "Independent demo · simulated wallet & demo prices · not affiliated with Jupiter", q(Math.min(1, (3.4 - (DUR - T)) / 0.6))) });

  // The first screencast frames can be a few px short (viewport still settling); they sit under the intro card.
  let src = sharp(path.join(DIR, "frames", frames[idx].file));
  if (n < 120) src = sharp(await src.resize(W, H, { fit: "fill" }).toBuffer());
  let img = src.extract({ left, top, width: cw, height: ch }).resize(OW, OH, { kernel: "lanczos3" });
  if (layers.length) img = sharp(await img.png().toBuffer()).composite(layers);
  const buf = await img.jpeg({ quality: 95, chromaSubsampling: "4:4:4" }).toBuffer();
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (n % 150 === 0) process.stdout.write(`\r${((n / total) * 100).toFixed(0)}%`);
}
ff.stdin.end();
await done;
console.log(`\nwrote ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB, ${DUR.toFixed(1)}s)`);
