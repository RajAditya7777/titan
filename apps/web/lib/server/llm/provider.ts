import "server-only";

/**
 * Minimal provider abstraction: one method, OpenAI-style messages and function tools.
 * Any OpenAI-compatible endpoint works (OpenAI, Azure OpenAI, OpenRouter, Groq, Together,
 * Ollama, LM Studio, vLLM…). Model and credentials come only from the environment.
 */

/** Multimodal user content (OpenAI format); used to show vision models a screenshot of the page. */
export type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

export type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string | ContentPart[] }
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

export interface ChatOptions {
  signal?: AbortSignal;
  /** Force a specific function (used to make the model end its turn with `companion_respond`). */
  forceTool?: string;
}

/** Thrown for provider HTTP errors; carries what the caller needs to decide on a retry. */
export class LlmHttpError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfterMs: number | null,
    detail: string,
  ) {
    super(`LLM provider returned HTTP ${status}${detail ? `: ${detail}` : ""}`);
  }
}

export interface LlmProvider {
  readonly name: string;
  chat(messages: ChatMessage[], tools: FunctionTool[], opts?: ChatOptions): Promise<ChatResult>;
}

export class OpenAICompatibleProvider implements LlmProvider {
  readonly name: string;

  constructor(
    private readonly cfg: { baseUrl: string; apiKey: string; model: string; timeoutMs?: number; temperature?: number; reasoningEffort?: string; disableThinking?: boolean },
  ) {
    this.name = `openai-compatible:${cfg.model}`;
  }

  async chat(messages: ChatMessage[], tools: FunctionTool[], opts: ChatOptions = {}): Promise<ChatResult> {
    try {
      return await this.once(messages, tools, opts);
    } catch (err) {
      // One retry on a short rate-limit window; longer waits would stall a voice conversation.
      if (err instanceof LlmHttpError && err.status === 429 && err.retryAfterMs != null && err.retryAfterMs <= 4_000) {
        await new Promise((r) => setTimeout(r, err.retryAfterMs! + 150));
        return this.once(messages, tools, opts);
      }
      // Providers that validate tool calls server-side (e.g. Groq) reject the model's occasional
      // malformed arguments with a 400. That is a sampling slip, not a bad request: retry once.
      if (err instanceof LlmHttpError && err.status === 400 && /tool call|tool_use_failed|parse tool/i.test(err.message)) {
        return this.once(messages, tools, opts);
      }
      throw err;
    }
  }

  private async once(messages: ChatMessage[], tools: FunctionTool[], opts: ChatOptions): Promise<ChatResult> {
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
          tool_choice: !tools.length ? undefined : opts.forceTool ? { type: "function", function: { name: opts.forceTool } } : "auto",
          temperature: this.cfg.temperature ?? 0.3,
          max_tokens: 1024,
          // Reasoning models (e.g. gpt-oss) accept this; it trades depth for latency, which voice needs.
          ...(this.cfg.reasoningEffort ? { reasoning_effort: this.cfg.reasoningEffort } : {}),
          // Hybrid thinking models on vLLM (Qwen3): skip the reasoning pass; it costs seconds per turn.
          ...(this.cfg.disableThinking ? { chat_template_kwargs: { enable_thinking: false } } : {}),
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        // Keep only the provider's short error message: it explains 400s and never includes our key.
        const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        const retryAfter = Number(res.headers.get("retry-after"));
        throw new LlmHttpError(res.status, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : null, (body?.error?.message ?? "").slice(0, 200));
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
    reasoningEffort: env.LLM_REASONING_EFFORT || undefined,
    disableThinking: env.LLM_DISABLE_THINKING === "true",
  });
}
