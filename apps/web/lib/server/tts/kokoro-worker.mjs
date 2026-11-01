/**
 * Kokoro-82M (Apache-2.0, open weights) text-to-speech, run in a worker thread.
 *
 * Why a worker: inference is CPU-bound (~0.5-2 s per reply) and would stall every request on the
 * server's event loop; and kokoro-js's phonemizer installs process-wide handlers that rethrow any
 * unhandled rejection, which would crash the web server if loaded there. Inside a worker both
 * problems stay contained: a crash here only fails speech, and the parent falls back.
 *
 * Protocol: { id, type: "synth", text, voice, speed } → { id, ok: true, wav } | { id, ok: false, error }
 *           { id, type: "warm" } → loads the model and renders one short phrase.
 */
import { parentPort, workerData } from "node:worker_threads";
import { encodeWav16 } from "./wav.mjs";

const MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";

let ttsPromise = null;
// A failed load (e.g. a half-downloaded model file) may leave runtime state we can't trust, so the
// worker exits after reporting it ("let it crash"); the parent respawns a fresh one after a backoff.
let loadFailed = false;
async function load() {
  ttsPromise ??= (async () => {
    const { env } = await import("@huggingface/transformers");
    env.cacheDir = workerData.cacheDir;
    const { KokoroTTS } = await import("kokoro-js");
    const tts = await KokoroTTS.from_pretrained(MODEL, { dtype: workerData.dtype ?? "q8", device: "cpu" });
    // kokoro-js only lists its English voices, but the model also ships Hindi speakers
    // (hf_alpha, hf_beta, hm_omega, hm_psi). Phonemising English text ('b' = en-GB, closest to
    // Indian English) and voicing it with a Hindi speaker gives Indian-accented English.
    // Relies on a private method: kokoro-js is pinned to 1.2.1 and test/voice-tts.test.ts checks it.
    const known = tts._validate_voice.bind(tts);
    tts._validate_voice = (voice) => (/^[hb]/.test(voice) ? "b" : known(voice));
    return tts;
  })().catch((err) => {
    loadFailed = true;
    throw err;
  });
  return ttsPromise;
}

async function synth(text, voice, speed) {
  const tts = await load();
  const audio = await tts.generate(text, { voice, speed });
  return encodeWav16(audio.audio, audio.sampling_rate);
}

// One inference at a time: ONNX already uses every core, so parallel runs only add latency.
let chain = Promise.resolve();
parentPort.on("message", (msg) => {
  chain = chain.then(async () => {
    try {
      if (msg.type === "warm") {
        await synth("Hi there.", workerData.voice, 1);
        parentPort.postMessage({ id: msg.id, ok: true });
        return;
      }
      const wav = await synth(msg.text, msg.voice, msg.speed);
      parentPort.postMessage({ id: msg.id, ok: true, wav }, [wav.buffer]);
    } catch (err) {
      parentPort.postMessage({ id: msg.id, ok: false, error: String(err?.message ?? err).slice(0, 300) });
      if (loadFailed) process.exit(1);
    }
  });
});
