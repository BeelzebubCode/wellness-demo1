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

export async function chat(messages: ChatMessage[], opts: ChatOptions = {}) {
    const model = opts.model || env.AI_MODEL || "qwen3:8b";
    const baseUrl = env.AI_BASE_URL || "http://localhost:11434";
    const enableThinking = opts.think ?? false; // Default: OFF for speed

    const payload: Record<string, any> = {
        model,
        messages,
        stream: false,
        think: enableThinking, // Ollama API parameter to control Qwen3 thinking mode
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
