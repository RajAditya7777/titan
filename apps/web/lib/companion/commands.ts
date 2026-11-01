/**
 * Workflow control commands are recognised locally, before anything reaches the LLM.
 * Why: they must be instant (no network round trip), deterministic, and work even if the
 * LLM is down. "Stop" must always mean stop.
 */

export type ControlCommand =
  | { kind: "stop" }
  | { kind: "repeat" }
  | { kind: "next" }
  | { kind: "back" }
  | { kind: "restart" }
  | { kind: "explain" }
  | { kind: "confirm" }
  | { kind: "decline" }
  | { kind: "provide_value"; value: string };

const PATTERNS: [ControlCommand["kind"], RegExp][] = [
  ["stop", /^(stop|cancel|quit|exit|never ?mind|that'?s enough|end( the)? tour)\b/],
  ["repeat", /^(repeat( that)?|say (that|it) again|what did you say|come again|pardon)\b/],
  ["next", /^(next|skip( this)?( step)?|continue|go on|move on|carry on|done|ok(ay)? next)\b/],
  ["back", /^(go back|back|previous( step)?)\b/],
  ["restart", /^(start (again|over)|restart|from the (top|beginning))\b/],
  ["explain", /^(explain( this| that)?|what('?s| is| does) (this|that)( mean)?|what does (this|that) mean|i don'?t understand)\b/],
  ["confirm", /^(yes|yeah|yep|sure|please do|do it|go ahead|fill it( in)?|ok(ay)?|confirm|correct|sounds good)\b/],
  ["decline", /^(no|nope|don'?t|not now|i'?ll do it)\b/],
];

export function normalise(transcript: string) {
  return transcript.toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Only short utterances are treated as commands; "stop telling me about fees and explain APY"
 * is a real question for the LLM, not a stop.
 */
export function parseControlCommand(transcript: string, opts: { awaitingValue?: boolean } = {}): ControlCommand | null {
  const text = normalise(transcript);
  if (!text) return null;

  if (opts.awaitingValue) {
    const value = extractNumber(text);
    if (value && text.split(" ").length <= 5) return { kind: "provide_value", value };
  }
  if (text.split(" ").length > 6) return null;
  for (const [kind, re] of PATTERNS) if (re.test(text)) return { kind } as ControlCommand;
  return null;
}

const SMALL: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
};

/** "100", "1,000", "25.5", "one hundred", "two thousand", "fifty" → numeric string. */
export function extractNumber(text: string): string | null {
  const digits = /(\d[\d,]*(?:\.\d+)?)/.exec(text);
  if (digits) return digits[1]!.replace(/,/g, "");

  let total = 0;
  let current = 0;
  let seen = false;
  for (const word of text.split(/[\s-]+/)) {
    if (word in SMALL) {
      current += SMALL[word]!;
      seen = true;
    } else if (word === "hundred") {
      current = (current || 1) * 100;
      seen = true;
    } else if (word === "thousand") {
      total += (current || 1) * 1_000;
      current = 0;
      seen = true;
    } else if (word === "million") {
      total += (current || 1) * 1_000_000;
      current = 0;
      seen = true;
    }
  }
  return seen ? String(total + current) : null;
}
