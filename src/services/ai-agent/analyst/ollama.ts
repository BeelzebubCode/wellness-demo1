import { env } from "process";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
    role: ChatRole;
    content: string;
}

export interface ChatOptions {
    model?: string;
    format?: "json" | string;
    keep_alive?: string | number; // "0" = unload immediately after response
    think?: boolean; // false (default) = disable Qwen3 thinking mode for speed
    options?: {
        temperature?: number;
        num_ctx?: number;
        [key: string]: any;
    };
}

/**
 * Strip Qwen3 thinking tags from response.
 * Qwen3 wraps chain-of-thought in <think>...</think> — remove them.
 */
function stripThinkTags(text: string): string {
    return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

// ── Detect mode: LiteLLM (OpenAI-compatible) or Ollama native ──
function isLiteLLMMode(): boolean {
    return !!env.LITELLM_URL;
}

/**
 * Chat with LLM via LiteLLM proxy (OpenAI-compatible API).
 * Provides: full request/response logging, token tracking, spend tracking.
 */
async function chatViaLiteLLM(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
    const model = opts.model || env.AI_MODEL_ANALYST || "qwen3:8b";
    const litellmUrl = env.LITELLM_URL!; // e.g. http://localhost:4000
    const apiKey = env.LITELLM_API_KEY || "sk-litellm-wellness-2026";
    const enableThinking = opts.think ?? false;

    const payload: Record<string, any> = {
        model,
        messages,
        stream: false,
        temperature: opts.options?.temperature ?? 0.7,
    };

    // Map Ollama-specific options to OpenAI-compatible
    if (opts.options?.num_predict) {
        payload.max_tokens = opts.options.num_predict;
    }
    if (opts.format === "json") {
        payload.response_format = { type: "json_object" };
    }

    // Pass Ollama-specific params through LiteLLM's extra_body
    // think: false disables Qwen3 thinking mode → response goes to content (not reasoning_content)
    // keep_alive keeps model loaded in GPU between calls (reduces cold-start)
    payload.extra_body = {
        think: enableThinking,
        ...(opts.keep_alive !== undefined && { keep_alive: opts.keep_alive }),
        ...(opts.options?.num_ctx && { num_ctx: opts.options.num_ctx }),
    };

    // LiteLLM metadata for logging
    payload.metadata = {
        trace_name: `analyst-${model}`,
        trace_metadata: {
            think: enableThinking,
            format: opts.format || "text",
        },
    };

    const startTime = Date.now();

    const response = await fetch(`${litellmUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LiteLLM API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const usage = data.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;

    console.log(`[LiteLLM] ${model} → ${completionTokens} tokens in ${elapsed}s (prompt=${promptTokens}, think=${enableThinking})`);

    const raw = data.choices?.[0]?.message?.content || "";
    return stripThinkTags(raw);
}

/**
 * Chat with LLM via Ollama native API (direct, no proxy).
 */
async function chatViaOllama(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
    const model = opts.model || env.AI_MODEL_ANALYST || "qwen3:8b";
    const baseUrl = env.AI_BASE_URL || "http://localhost:11434";
    const enableThinking = opts.think ?? false;

    const payload: Record<string, any> = {
        model,
        messages,
        stream: false,
        think: enableThinking,
        options: opts.options || {},
    };
    if (opts.format) payload.format = opts.format;
    if (opts.keep_alive !== undefined) payload.keep_alive = opts.keep_alive;

    const startTime = Date.now();

    const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const evalCount = data.eval_count || 0;
    console.log(`[Ollama] ${model} → ${evalCount} tokens in ${elapsed}s (think=${enableThinking})`);

    const raw = data.message?.content || "";
    return stripThinkTags(raw);
}

/**
 * Main chat function — routes to LiteLLM or Ollama based on env config.
 *
 * Usage:
 *   - Set LITELLM_URL=http://localhost:4000 → routes through LiteLLM proxy (full logging)
 *   - No LITELLM_URL → direct Ollama (default, no proxy overhead)
 */
export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
    if (isLiteLLMMode()) {
        return chatViaLiteLLM(messages, opts);
    }
    return chatViaOllama(messages, opts);
}

/**
 * Unload a model from GPU memory so the next model can use the full VRAM.
 * Uses Ollama's keep_alive=0 trick with a minimal request.
 */
export async function unloadModel(model: string) {
    const baseUrl = env.AI_BASE_URL || "http://localhost:11434";
    try {
        await fetch(`${baseUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages: [],
                keep_alive: 0,
            }),
        });
        console.log(`[Ollama] Unloaded ${model} from GPU`);
    } catch (err) {
        console.warn(`[Ollama] Failed to unload ${model}:`, err);
    }
}
