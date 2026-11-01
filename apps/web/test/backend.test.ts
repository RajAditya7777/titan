import { describe, expect, it } from "vitest";
import { TokenBucketLimiter } from "@/lib/server/rate-limit";
import { applyDomainCorrections, normaliseTranscript, voiceConfigFromEnv } from "@/lib/server/voice";
import { VoiceActivityDetector } from "@/lib/companion/voice-server";
import { voiceLength } from "@/lib/server/llm/orchestrator";

describe("TokenBucketLimiter", () => {
  it("allows a burst, then refills at the sustained rate", () => {
    let now = 0;
    const l = new TokenBucketLimiter({ burst: 3, perMinute: 60, now: () => now });
    expect([l.take("a").ok, l.take("a").ok, l.take("a").ok]).toEqual([true, true, true]);
    const denied = l.take("a");
    expect(denied.ok).toBe(false);
    expect(denied.retryAfterMs).toBeGreaterThan(0);
    expect(denied.retryAfterMs).toBeLessThanOrEqual(1_000);
    now += 1_000; // 60/min = 1 token per second
    expect(l.take("a").ok).toBe(true);
    expect(l.take("a").ok).toBe(false);
  });

  it("keeps clients independent", () => {
    const l = new TokenBucketLimiter({ burst: 1, perMinute: 1, now: () => 0 });
    expect(l.take("a").ok).toBe(true);
    expect(l.take("b").ok).toBe(true);
    expect(l.take("a").ok).toBe(false);
  });

  it("bounds memory by evicting the least recently seen clients", () => {
    const l = new TokenBucketLimiter({ burst: 1, perMinute: 1, now: () => 0, maxKeys: 2 });
    l.take("a");
    l.take("b");
    l.take("c"); // evicts "a"
    expect(l.take("a").ok).toBe(true); // fresh bucket again
  });
});

describe("VoiceActivityDetector", () => {
  const frames = (vad: VoiceActivityDetector, level: number, ms: number) => {
    const events: string[] = [];
    for (let t = 0; t < ms; t += 20) events.push(vad.push(level, 20));
    return events;
  };

  it("ignores short clicks", () => {
    const vad = new VoiceActivityDetector();
    expect(frames(vad, 0.2, 100)).not.toContain("start");
    expect(frames(vad, 0, 500)).not.toContain("end");
  });

  it("starts after sustained speech and ends after trailing silence", () => {
    const vad = new VoiceActivityDetector();
    expect(frames(vad, 0.2, 400)).toContain("start");
    expect(frames(vad, 0, 500)).not.toContain("end"); // a pause between words
    expect(frames(vad, 0, 500)).toContain("end");
  });

  it("caps very long utterances", () => {
    const vad = new VoiceActivityDetector({ threshold: 0.03, minSpeechMs: 100, endSilenceMs: 900, maxUtteranceMs: 2_000 });
    expect(frames(vad, 0.2, 2_500)).toContain("end");
  });
});

describe("voice helpers", () => {
  it("drops Whisper's silence hallucinations but keeps real commands", () => {
    expect(normaliseTranscript(" Thank you.")).toBe("");
    expect(normaliseTranscript("you")).toBe("");
    expect(normaliseTranscript(" Help me mint 100 USDC+.")).toBe("Help me mint 100 USDC+.");
    expect(normaliseTranscript(" Help me mend 100 USDC+.")).toBe("Help me mint 100 USDC+.");
    expect(normaliseTranscript("Stop.")).toBe("Stop.");
  });

  it("corrects product words only in product context", () => {
    expect(applyDomainCorrections("help me mind 50 U S D C plus")).toBe("help me mint 50 USDC+");
    expect(applyDomainCorrections("I changed my mind")).toBe("I changed my mind");
    expect(applyDomainCorrections("never mind")).toBe("never mind");
    expect(applyDomainCorrections("create a yield coin")).toBe("create a yieldcoin");
  });

  it("enables each server engine only when its model is configured", () => {
    expect(voiceConfigFromEnv({} as NodeJS.ProcessEnv)).toBeNull();
    const cfg = voiceConfigFromEnv({ LLM_API_KEY: "k", LLM_BASE_URL: "https://x/v1/", STT_MODEL: "whisper" } as unknown as NodeJS.ProcessEnv)!;
    expect(cfg).toMatchObject({ baseUrl: "https://x/v1", sttModel: "whisper", ttsModel: null });
  });
});

describe("voiceLength", () => {
  it("keeps at most three sentences, cut at a boundary", () => {
    expect(voiceLength("One. Two! Three? Four. Five.")).toBe("One. Two! Three?");
  });
  it("respects the character budget without cutting a sentence in half", () => {
    const long = `${"a".repeat(200)}. ${"b".repeat(200)}.`;
    expect(voiceLength(long)).toBe(`${"a".repeat(200)}.`);
  });
  it("keeps decimals intact", () => {
    expect(voiceLength("USDC+ pays 1.7% right now. It is variable.")).toBe("USDC+ pays 1.7% right now. It is variable.");
  });
});
