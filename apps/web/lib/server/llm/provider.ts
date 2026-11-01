import "server-only";

/**
 * Minimal provider abstraction: one method, OpenAI-style messages and function tools.
 * Any OpenAI-compatible endpoint works (OpenAI, Azure OpenAI, OpenRouter, Groq, Together,
 * Ollama, LM Studio, vLLM…). Model and credentials come only from the environment.
 */

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface FunctionTool {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export interface ChatResult {
  content: string | null;
  toolCalls: ToolCall[];
}

export interface LlmProvider {
  readonly name: string;
  chat(messages: ChatMessage[], tools: FunctionTool[], opts?: { signal?: AbortSignal }): Promise<ChatResult>;
}

export class OpenAICompatibleProvider implements LlmProvider {
  readonly name: string;

  constructor(
    private readonly cfg: { baseUrl: string; apiKey: string; model: string; timeoutMs?: number; temperature?: number },
  ) {
    this.name = `openai-compatible:${cfg.model}`;
  }

  async chat(messages: ChatMessage[], tools: FunctionTool[], opts: { signal?: AbortSignal } = {}): Promise<ChatResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.cfg.timeoutMs ?? 30_000);
    opts.signal?.addEventListener("abort", () => controller.abort());

    try {
      const res = await fetch(`${this.cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.cfg.apiKey}` },
        body: JSON.stringify({
          model: this.cfg.model,
          messages,
          tools: tools.length ? tools : undefined,
          tool_choice: tools.length ? "auto" : undefined,
          temperature: this.cfg.temperature ?? 0.3,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        // Body may echo our request; log status only.
        throw new Error(`LLM provider returned HTTP ${res.status}`);
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] } }[];
      };
      const msg = json.choices?.[0]?.message;
      return { content: msg?.content ?? null, toolCalls: msg?.tool_calls ?? [] };
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Returns null when no LLM is configured; the orchestrator then uses the offline rules planner. */
export function providerFromEnv(env = process.env): LlmProvider | null {
  const apiKey = env.LLM_API_KEY;
  const model = env.LLM_MODEL;
  if (!apiKey || !model) return null;
  return new OpenAICompatibleProvider({
    baseUrl: env.LLM_BASE_URL || "https://api.openai.com/v1",
    apiKey,
    model,
    timeoutMs: Number(env.LLM_TIMEOUT_MS) || 30_000,
  });
}
