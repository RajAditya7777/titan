/**
 * Float32 PCM (-1..1) → 16-bit mono WAV. Plain JS so the TTS worker can import it without a build
 * step. 16-bit halves the payload of the 32-bit float WAV most libraries emit, with no audible loss
 * for speech.
 * @param {Float32Array} samples
 * @param {number} sampleRate
 * @returns {Uint8Array}
 */
export function encodeWav16(samples, sampleRate) {
  const bytes = 44 + samples.length * 2;
  const view = new DataView(new ArrayBuffer(bytes));
  const ascii = (offset, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  ascii(0, "RIFF");
  view.setUint32(4, bytes - 8, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  ascii(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(view.buffer);
}
