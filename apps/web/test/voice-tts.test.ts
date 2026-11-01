import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { encodeWav16 } from "@/lib/server/tts/wav.mjs";
import { kokoroConfigFromEnv, speechText } from "@/lib/server/tts/kokoro";
import { applyDomainCorrections, normaliseTranscript, ttsEngineFromEnv, voiceConfigFromEnv } from "@/lib/server/voice";
import { splitForSpeech } from "@/lib/companion/voice-server";
import { parseControlCommand } from "@/lib/companion/commands";
import { LEGS, SPRITE, TAIL } from "@/components/companion/pet-sprite";

/** Env objects for config functions (they take NodeJS.ProcessEnv). */
const env = (e: Record<string, string> = {}) => e as NodeJS.ProcessEnv;

describe("TTS engine selection", () => {
  it("defaults to the local open-source engine, needs no key", () => {
    expect(ttsEngineFromEnv(env())).toBe("kokoro");
  });
  it("uses a provider only when it is fully configured", () => {
    expect(ttsEngineFromEnv(env({ TTS_MODEL: "m", LLM_API_KEY: "k" }))).toBe("provider");
    expect(ttsEngineFromEnv(env({ TTS_ENGINE: "provider" }))).toBe(null); // no model/key: off, not broken
  });
  it("can be switched off", () => {
    expect(ttsEngineFromEnv(env({ TTS_ENGINE: "off" }))).toBe(null);
  });
  it("reads voice and clamps speed", () => {
    expect(kokoroConfigFromEnv(env())).toEqual({ voice: "hf_alpha", speed: 1 });
    expect(kokoroConfigFromEnv(env({ KOKORO_VOICE: "hm_omega", KOKORO_SPEED: "1.2" }))).toEqual({ voice: "hm_omega", speed: 1.2 });
    expect(kokoroConfigFromEnv(env({ KOKORO_SPEED: "9" })).speed).toBe(1);
  });
});

describe("speechText", () => {
  it("spells tickers and turns symbols into words, so they are pronounced", () => {
    expect(speechText("Mint 100 USDC into USDC+ at 4.2% APY.")).toBe("Mint 100 U S D C into U S D C plus at 4.2 percent A P Y.");
    expect(speechText("A 50 bps fee")).toBe("A 50 basis points fee");
  });
});

describe("encodeWav16", () => {
  it("writes a valid 16-bit mono PCM header and clamps samples", () => {
    const wav = encodeWav16(new Float32Array([0, 1, -1, 2]), 24_000);
    const view = new DataView(wav.buffer);
    expect(String.fromCharCode(...wav.slice(0, 4))).toBe("RIFF");
    expect(String.fromCharCode(...wav.slice(8, 12))).toBe("WAVE");
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(24_000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(8);
    expect([view.getInt16(44, true), view.getInt16(46, true), view.getInt16(48, true), view.getInt16(50, true)]).toEqual([0, 32767, -32768, 32767]);
  });
});

describe("splitForSpeech", () => {
  it("splits on sentence ends but keeps decimals, and merges tiny fragments", () => {
    expect(splitForSpeech("Done. USDC+ is earning 4.2% right now. Would you like to mint some today?")).toEqual([
      "Done. USDC+ is earning 4.2% right now.",
      "Would you like to mint some today?",
    ]);
    // a short last sentence rides along with the previous piece instead of costing its own request
    expect(splitForSpeech("USDC+ is earning 4.2% right now. Want some?")).toEqual(["USDC+ is earning 4.2% right now. Want some?"]);
    expect(splitForSpeech("Hi.")).toEqual(["Hi."]);
  });
});

describe("speech-to-text for Indian English", () => {
  it("pins English by default and allows auto-detect", () => {
    expect(voiceConfigFromEnv(env({ LLM_API_KEY: "k" }))?.sttLanguage).toBe("en");
    expect(voiceConfigFromEnv(env({ LLM_API_KEY: "k", STT_LANGUAGE: "auto" }))?.sttLanguage).toBe(null);
  });
  it("fixes accent mishearings only where an amount follows", () => {
    expect(applyDomainCorrections("Ming 2500 USDC")).toBe("mint 2500 USDC");
    expect(applyDomainCorrections("men 100 usdc plus")).toBe("mint 100 USDC+");
    expect(applyDomainCorrections("ten men walked in")).toBe("ten men walked in");
  });
  it("converts lakhs into plain amounts", () => {
    expect(applyDomainCorrections("mint 1 lakh USDC")).toBe("mint 100000 USDC");
    expect(applyDomainCorrections("redeem 2.5 lakh")).toBe("redeem 250000");
    expect(applyDomainCorrections("mint one lakh")).toBe("mint 100000");
  });
  it("drops silence hallucinations", () => {
    expect(normaliseTranscript("Thank you for watching.")).toBe("");
  });
});

describe("voice on/off commands", () => {
  it("recognises mute before stop, and unmute", () => {
    expect(parseControlCommand("stop talking")).toEqual({ kind: "mute" });
    expect(parseControlCommand("Voice off.")).toEqual({ kind: "mute" });
    expect(parseControlCommand("turn off your voice")).toEqual({ kind: "mute" });
    expect(parseControlCommand("voice on")).toEqual({ kind: "unmute" });
    expect(parseControlCommand("stop")).toEqual({ kind: "stop" });
  });
});

describe("pet sprite", () => {
  it("every row is on the 20-cell grid", () => {
    expect(SPRITE.every((r) => r.length === 20)).toBe(true);
    for (const [col, rows] of LEGS) expect(rows.every((r) => col + r.length <= 20)).toBe(true);
    expect(new Set(TAIL.map((r) => r.length)).size).toBe(1);
  });
});

describe("kokoro-js contract", () => {
  // The worker relies on a private method and on bundled Hindi voices; fail loudly if an upgrade changes either.
  const pkgDir = path.resolve(process.cwd(), "node_modules/kokoro-js");
  it("is the pinned version and ships the Indian voices", () => {
    expect(JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8")).version).toBe("1.2.1");
    for (const v of ["hf_alpha", "hf_beta", "hm_omega", "hm_psi"]) expect(fs.existsSync(path.join(pkgDir, "voices", `${v}.bin`))).toBe(true);
  });
  it("still has the voice validator the worker overrides", () => {
    const src = fs.readFileSync(path.join(pkgDir, "dist", "kokoro.js"), "utf8");
    expect(src).toContain("_validate_voice(");
  });
});
